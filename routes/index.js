const checkAuth = require('../middlewares/checkAuth');
const checkNoAuth = require('../middlewares/checkNoAuth');

module.exports = function(app) {

    app.get('/', require('./root'));

    app.get('/login', checkNoAuth, require('./login').get);
    app.post('/login', checkNoAuth, require('./login').post);

    app.get('/signup', checkNoAuth, require('./signup').get);
    app.post('/signup', checkNoAuth, require('./signup').post);

    app.get('/chat', checkAuth, require('./chat'));

    app.post('/logout', checkAuth, require('./logout'));

    app.get('/settings', checkAuth, require('./settings').get);
    app.post('/settings', checkAuth, require('./settings').post);
}