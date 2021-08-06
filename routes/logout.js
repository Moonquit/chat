module.exports = function(req, res, next) {
    let sid = req.session.id;

    req.session.destroy(function(err) {
        req.app.get('io').myTools.destroySession(sid);
        res.redirect('/');
        if (err) next(err);
    });
    
}