const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const ejs = require('ejs');
const socketio = require('socket.io');
const io = socketio(server);
const Filter = require('bad-words');
const qs = require('qs');
const { v4: uuidv4 } = require('uuid');
const {addUserInChat,addUser, removeUser, getUser, getUsersInRoom}= require('./utils/users');

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded({extended: true}));
app.get('/', (req, res)=>{
    res.render('index');
});
app.get('/chat', (req, res)=>{
    const {username, room} = qs.parse(req._parsedOriginalUrl.query);
    const id = uuidv4();
    const {user, error} = addUser({id, username, room});
    if(error){
        res.render('index', {error: error});
    }else{
        res.render('chat');
    }
});
io.on('connection', (socket)=>{
    socket.on('join', ({username, room})=>{
        const id = socket.id;
        const {user} = addUserInChat({id, username, room});
        const roomUsers = getUsersInRoom(user.room);
        socket.join(user.room);
        const message = {
            text: `<span class="text-danger" style="text-transform: capitalize;">${user.username}</span>, Welcome to the Chat Room <span class="text-primary" style="text-transform: capitalize;">${user.room}</span>`,
            from: 'admin'
        };
        socket.emit('message', message);
        const sentMsg = {
            text: `<span class="text-danger" style="text-transform: capitalize;">${user.username}</span> has Joined this Chat Room`,
            from: 'admin'
        };
        socket.broadcast.to(user.room).emit('message', sentMsg);
        io.to(user.room).emit('roomUsers',roomUsers);
    });
    socket.on('incomingMessage', (message, cb)=>{
        const filter = new Filter();
        if(filter.isProfane(message)){
            const sentMsg = {
                text: `'${message}' This Line contain a Profane Word`,
                from: 'admin'
            };
            socket.emit('serverMessage', sentMsg);
            return cb(`Message Couldn't be sent`);
        }
        const user = getUser(socket.id);
        const sentMsg = {
            text: message,
            from: user.username
        };
        socket.broadcast.to(user.room).emit('message', sentMsg);
        cb();
    });
    socket.on('locationMsg', (message, cb)=>{
        const user = getUser(socket.id);
        const sentMsg = {
            text: message,
            from: user.username
        };
        socket.broadcast.to(user.room).emit('locationMsg', sentMsg);
        cb();
    });
    socket.on('errorMessage', (message, cb)=>{
        const sentMsg = {
            text: `'${message}'  You must allow Geolocation for this`,
            from: 'admin'
        };
        socket.emit('serverMessage', sentMsg);
        cb('You Must Allow Your Geolocation');
    });
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            const sentMsg = {
                text: `<span class="text-danger" style="text-transform: capitalize;">${user.username}</span> has left this chat room`,
                from: 'admin'
            };
            io.to(user.room).emit('message', sentMsg);
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, process.env.IP, (req, res)=>{
    console.log(`Server Started on PORT ${5000}`);
});