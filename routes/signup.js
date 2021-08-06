const log = require('../libs/logger')(module);
const { User, SignupError } = require("../models/user");

exports.get = function(req, res, next) {
    res.render('signup');
}

exports.post = function(req, res, next) {
    let username = req.body.username;
    let password = req.body.password;

    User.signup(username, password).then(user => {
        req.session.user = user._id;
        res.send({});
    }).catch(err => {
        if (err instanceof SignupError) {
            res.status(403).send(err.message)
        } else {
            log.error(err);
            res.status(403).send('Unknown error.');
        }
    });
}