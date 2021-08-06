const { HttpError } = require('../error');

module.exports = function(req, res, next) {
    if (req.user) return next(new HttpError(403, 'You are already logged in.'));
    next();
}