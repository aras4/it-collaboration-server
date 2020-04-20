const server = require('express');
const app = server();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello World')
});

app.get('/message', (req, res) => {
    res.send('Hello from heroku server app')
});

app.listen(PORT, _ => console.log(`Server listening on port... ${PORT}`));