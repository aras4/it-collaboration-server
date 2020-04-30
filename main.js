require('dotenv').config();
const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');
const { formatMessage } = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    getUser
} = require('./utils/users');
const botName = 'ITRooms Bot';

const PORT = process.env.PORT || 3000;

app.use(cors({ credentials: true, origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (request, response) => {
    response.send('Wellcome to ITRooms server app')
});

io.on('connection', (socket) => {

    socket.on('joinRoom', ({ username, room }) => {
        console.log(`user join room  ${username}`);

        const user = getUser(username) || userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to It Collaboration Group!'));

        // Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit(
                'message',
                formatMessage(botName, `${user.username} has joined the chat`)
            );

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        console.log(user);
        if (user)
            io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Listen for typing a message
    socket.on('typing', data => {
        const { room, username, isTyping } = data;
        const response = isTyping ? { msg: `${username} is typing...`, username: username } : { msg: '', username: username };
        io.to(room).emit('typing', response);
    });


    // Runs when client disconnects
    socket.on('disconnect', () => {
        console.log('disconect');
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`)
            );

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});


http.listen(PORT, _ => console.log(`Server listening on port... ${PORT}`));