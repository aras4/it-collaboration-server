require('dotenv').config();
const app = require('express')();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');
const { formatMessage, storeShareCode, getShareCodeForRoom, cleanShareCodeForRoom } = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    getUser
} = require('./utils/users');
const botName = 'ITRooms Bot';

const PORT = process.env.PORT || 3000;
let currentRoom = '';

app.use(cors({ credentials: true, origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (request, response) => {
    response.send('Wellcome to ITRooms server app')
});

app.get('/getShareCode/:room', (request, response) => {
    const { room } = request.params;
    const code = getShareCodeForRoom(room);
    response.status(200).json(code)
});

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        currentRoom = room;
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

    // Listen for sharing a code 
    socket.on('shareCode', data => {
        const { room, code } = data;
        storeShareCode(room, code);
        if (room)
            io.to(room).emit('shareCode', data);
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

        setTimeout(() => {
            console.log('Clean share code in room if all users left');
            const roomUsers = getRoomUsers(currentRoom);
            if (roomUsers === null || roomUsers.length === 0) {
                cleanShareCodeForRoom(currentRoom)
                console.log('Share Code is cleaned for room ' + currentRoom);
            }
        }, 5000);
    });
});


http.listen(PORT, _ => console.log(`Server listening on port... ${PORT}`));