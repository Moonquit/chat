const path = require('path');
const http = require('http');
const logger = require('morgan');
const session = require('express-session');
const express = require('express');
const cookieParser = require('cookie-parser');

const log = require('./libs/logger')(module);
const config = require('./config');
const { HttpError } = require('./error');
const sessionStore = require('./libs/sessionStore');

const app = express();

// configuration
app.set('env', config.env);
app.set('port', process.env.PORT || config.port);
app.set('host', config.host);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('ejs-locals'));
app.set('view engine', 'ejs');

if (app.get('env') !== 'production') app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: config.session.secret,
  key: config.session.key,
  cookie: config.session.cookie,
  resave: true,
  saveUninitialized: true,
  store: sessionStore
}));
app.use(express.static(path.join(__dirname, 'public')));

// middlewares 
app.use(require('./middlewares/loadUser'));

// routes
require('./routes')(app)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(new HttpError(404));
});

// error handler
app.use(function(err, req, res, next) {
	if (typeof err === 'number') {
    	err = new HttpError(err);
  	} else {
		if (app.get('env') !== 'production') log.error(err);
		
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};

		// render the error page
		res.status(err.status || 500);
		res.render('error');
    }
});

const server = http.createServer(app);

const io = require('./socket')(server);
app.set('io', io);

 
server.listen(app.get('port'), app.get('host'), function() {
    log.info('Express server listening on port ' + app.get('port'));
});
