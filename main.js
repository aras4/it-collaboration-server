const server = require('express');
const app = server();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello World')
});

app.listen(PORT, _ => console.log(`Server listening on port... ${PORT}`));