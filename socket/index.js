const log = require('../libs/logger')(module);
const config = require('../config');
const cookie = require('cookie');
const { User } = require('../models/user');
const { HttpError } = require('../error');
const cookieParser = require('cookie-parser');
const sessionStore = require('../libs/sessionStore');


function loadUser(session, next) {
	if (!session.user) {
		log.debug('Session %s is anonymous', session);
		return;
	}

	return User.findById(session.user)
		.then(user => {
			if (!user) return null;
			return user;
		})
		.catch(err => next(err));
}

module.exports = function(server) {
	const io = require('socket.io')(server, {
		cors: {
			origin: 'localhost:*',
			methods: ['GET', 'POST']
		  }
	});

	io.myTools = {

		getSockets() {
			let arr = [];
			for (const [_, sock] of io.of("/").sockets) {
				arr.push(sock);
			}
			return arr;
		},

		getUniqueSidsArr() {
			let socketSids = this.getSockets().map(sock => sock.handshake.session.id);
			let uniqueArr = socketSids.filter((item) => socketSids.indexOf(item) === socketSids.lastIndexOf(item));
			return uniqueArr;
		},

		getUniqueUsersArr() {
			let socketUsers = this.getSockets().map(sock => sock.handshake.user.id);
			let uniqueArr = socketUsers.filter((item) => socketUsers.indexOf(item) === socketUsers.lastIndexOf(item));
			return uniqueArr;
		},

		isUnique(sid, userId) {
			return this.getUniqueSidsArr().includes(sid) && this.getUniqueUsersArr().includes(userId);
		},

		isLast(sid, userId) {
			let sockets = this.getSockets();
			let socketSids = sockets.map(sock => sock.handshake.session.id);
			let socketUsers = sockets.map(sock => sock.handshake.user.id);
			return !socketSids.includes(sid) && !socketUsers.includes(userId);
		},
	
		destroySession(sid) {
			for (const sock of this.getSockets()) {
				if (sock.handshake.session.id === sid) {
					sock.emit('logout');
					sock.disconnect();
				}
			}
		}

	}

	io.use(function(socket, next) {
		let sidCookie = cookie.parse(socket.handshake.headers.cookie || '')[config.session.key];
		let sid = cookieParser.signedCookie(sidCookie, config.session.secret);

		sessionStore.get(sid, function(err, session) {
			if (arguments.length == 0) {
				return next(new HttpError(401, 'No session'));
			} else {
				if (err) return next(err);

				loadUser(session, next).then((user) => {
					if (user) {
						socket.handshake.session = session;
						socket.handshake.session.id = sid;
						socket.handshake.user = user;
						return next();
					} else {
						return next(new HttpError(403, `On anonymous session can't connect to chat`));
					}
				});
			}
		});
	});

	io.on('connection', function(socket) {		
		let user = socket.handshake.user;

		if (io.myTools.isUnique(socket.handshake.session.id, socket.handshake.user.id)){
			socket.broadcast.emit('join', user.username);
		}

		socket.on('message', function(data, callback) {
			socket.broadcast.emit('message', {fromUser: user.username, text: data});
			callback && callback();
		});

		socket.on('disconnect', function() {
			if (io.myTools.isLast(socket.handshake.session.id, socket.handshake.user.id)) {
				socket.broadcast.emit('leave', user.username);
			}
		});
	});

	return io;
}