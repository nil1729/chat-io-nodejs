const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const Filter = require('bad-words');
const qs = require('qs');
const session = require('express-session');
const flash = require('connect-flash');

const { v4: uuidv4 } = require('uuid');
const {
	addUserInChat,
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
} = require('./utils/users');

//! View engine Setup
app.set('view engine', 'ejs');

//! Public Directory Setup
app.use(express.static(__dirname + '/public'));

//! Body Parser Setup
app.use(
	express.urlencoded({
		extended: true,
	})
);

//! Session Setup
app.use(
	session({
		resave: false,
		saveUninitialized: false,
		secret: 'Chat App',
	})
);

//! Flash Middleware
app.use(flash());

app.use((req, res, next) => {
	res.locals.error = req.flash('error');
	next();
});

//! Index Route
app.get('/', (req, res) => {
	res.render('index');
});

//! Chat Room
app.get('/chat', (req, res) => {
	const { username, room } = qs.parse(req._parsedOriginalUrl.query);
	const id = uuidv4();

	//! Trying to add user in Array
	const { error } = addUser({
		id,
		username,
		room,
	});
	//! Error
	if (error) {
		req.flash('error', error);
		res.redirect('/');
	} else {
		//! Go To Chat Room
		res.render('chat');
	}
});

io.on('connection', socket => {
	//! New User Join
	socket.on('join', ({ username, room }) => {
		const id = socket.id;
		const {
			user,
			//! Add user in Chat Room
		} = addUserInChat({
			id,
			username,
			room,
		});

		//! get All users in a Specific Room
		const roomUsers = getUsersInRoom(user.room);

		//! Join a specific room on Socket
		socket.join(user.room);

		//! This message will emit only to newly joined User
		const message = {
			text: `<span class="text-danger" style="text-transform: capitalize;">${user.username}</span>, Welcome to the Chat Room <span class="text-primary" style="text-transform: capitalize;">${user.room}</span>`,
			from: 'admin',
		};
		socket.emit('message', message);

		//! this message will emit to all users except newly joined User
		const sentMsg = {
			text: `<span class="text-danger" style="text-transform: capitalize;">${user.username}</span> has Joined this Chat Room`,
			from: 'admin',
		};
		socket.broadcast.to(user.room).emit('message', sentMsg);

		//! Send all users in this room to all users in this Room
		io.to(user.room).emit('roomUsers', roomUsers);
	});

	//! Incoming messages for *active* users
	socket.on('incomingMessage', (message, cb) => {
		//! Check for bad words
		const filter = new Filter();
		if (filter.isProfane(message)) {
			const sentMsg = {
				text: `'${message}' This Line contain a Profane Word`,
				from: 'admin',
			};
			socket.emit('serverMessage', sentMsg);
			return cb(`Message Couldn't be sent`);
		}

		//! Otherwise send this message to other Users in this Chat Room
		const user = getUser(socket.id);
		const sentMsg = {
			text: message,
			from: user.username,
		};
		socket.broadcast.to(user.room).emit('message', sentMsg);
		cb();
	});

	//! For sharing Location
	socket.on('locationMsg', (message, cb) => {
		const user = getUser(socket.id);
		const sentMsg = {
			text: message,
			from: user.username,
		};
		socket.broadcast.to(user.room).emit('locationMsg', sentMsg);
		cb();
	});

	//! Error Messags for Geo location to the specific user
	socket.on('errorMessage', (message, cb) => {
		const sentMsg = {
			text: `<span class="text-danger">${message}</span> ' <br> You must allow Geolocation for this`,
			from: 'admin',
		};
		socket.emit('serverMessage', sentMsg);
		cb();
	});

	//TODO ===== //
	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		if (user) {
			const sentMsg = {
				text: `<span class="text-danger" style="text-transform: capitalize;">${user.username}</span> has left this chat room`,
				from: 'admin',
			};
			//! get All users in a Specific Room
			const roomUsers = getUsersInRoom(user.room);

			//! Send all users in this room to all users in this Room
			io.to(user.room).emit('roomUsers', roomUsers);

			socket.broadcast.to(user.room).emit('message', sentMsg);
		}
	});
});

//! Server Port Setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, process.env.IP, (req, res) => {
	console.log(`Server Started on PORT ${5000}`);
});
