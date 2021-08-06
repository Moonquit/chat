const { URL } = require('url');
const { HttpError } = require('../error');
const { User, ChangePasswordError } = require('../models/user');


exports.get = function(req, res, next) {
    return res.render('settings');
}

exports.post = async function(req, res, next) {
    const pasrsedUrl = new URL(req.url, req.headers.origin);
    let action = pasrsedUrl.searchParams.get('act');

    if (action === 'change-password') {
        const 
            userId = req.user.id,
            curPasswd = req.body.curPasswd,
            newPasswd = req.body.newPasswd,
            repNewPasswd = req.body.repNewPasswd;

        try {
            await User.changePassword(userId, curPasswd, newPasswd, repNewPasswd);
            res.send({});
        } catch(err) {
            if (err instanceof ChangePasswordError) {
                res.status(403).send(err.message);
            } else {
                next(err);
            }
        }
        
    } else if (action === 'delete-account') {
        try {
            await User.deleteAccount(req.user.id);

            let sid = req.session.id;
            req.session.destroy(function(err) {
                req.app.get('io').myTools.destroySession(sid);
                res.redirect('/');
                if (err) next(err);
            });
        } catch (err) {
            if (err instanceof DeleteAccountError) {
                res.status(403).send(err.message);
            } else {
                next(err);
            }    
        }
    } else {
        next(new HttpError(400));
    }
}
