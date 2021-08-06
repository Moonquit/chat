const { User } = require('../models/user');

module.exports = function(req, res, next) {
    if (!req.session.user) {
        req.user = res.locals.user = null;
        return next();
    }
    
    if (!req.user) {
        User.findById(req.session.user)
            .then(user => {
                req.user = res.locals.user = user;
                next();
            }).catch(err => next(err));
    }
}