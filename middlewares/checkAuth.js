const { HttpError } = require('../error');

module.exports = function(req, res, next) {
    if (!req.user) return next(new HttpError(401));
    next();
}