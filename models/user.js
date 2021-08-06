const crypto = require('crypto');

const config = require('../config');

const 
    mongoose = require('../libs/mongoose'),
    Schema = mongoose.Schema;


// error classes
class LoginError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LoginError';
    }
}

class SignupError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SignupError';
    }
}

class ChangePasswordError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ChangePasswordError';
    }
}

class DeleteAccountError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DeleteAccountError';
    }
}

// user schema
const schema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
    },

    hashedPassword: {
        type: String,
        required: true
    },

    salt: {
        type: String,
        required: true
    },

    created: {
        type: Date,
        default: Date.now 
    }
});

// methods
schema.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha256', this.salt).update(password).digest('hex');
}

schema.virtual('password')
    .set(function(password) {
        this._plainPassword = password;
        this.salt = String(Math.random());
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() {
        return this._plainPassword;
    });

schema.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
}

// static methods
schema.statics.checkCorrectPassword = function(password) {
    let regex = /\S{5,}/;
    return regex.test(password);
}

schema.statics.checkCorrectName = function(name, ErrorConstructor, inLogin) {
    function isAllowedName() {
        return !config.reservedNames.includes(name.toLowerCase());
    }
    
    function isValidName() {
        let regex = /^([A-Za-z0-9]{2,23})$/;
        return regex.test(name);
    }

    return new Promise(function(resolve, reject) {
        if (isValidName()) {
            if (inLogin) resolve();
            if (isAllowedName()) {
                resolve();
            } else {
                reject(new ErrorConstructor(`You can't use this username.`));
            }
        } else {
            reject(new ErrorConstructor('The `Username` field contains invalid values.'));
        }
    });
}

schema.statics.signup = function(username, password) {
    function isNewUser() {
        return new Promise(function(resolve, reject) {
            User.findOne({username: username}).then(user => {
                if (user) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            }).catch(reject);
    });
        
    }
    let User = this;

    return new Promise(function(resolve, reject) {
        User.checkCorrectName(username, SignupError).then(() => {
            if (User.checkCorrectPassword(password)) {
                isNewUser().then(isNew => {
                    if (isNew) {
                        new User({username: username, password: password}).save()
                            .then(user => resolve(user))
                            .catch(reject);
                    } else {
                        reject(new SignupError('User already exists.'))
                    }
                }).catch(reject);
                
            } else {
                reject(new SignupError('The `Password` field must contain at least 5 characters without spaces.'));
            }
        }).catch(reject)
    });
}

schema.statics.login = function(username, password) {
    let User = this;

    return new Promise(function(resolve, reject) {
        User.checkCorrectName(username, LoginError, true).then(() => {
            if (User.checkCorrectPassword(password)) {
                User.findOne({username: username})
                    .then(userInstance => {
                        if (userInstance) {
                            if (userInstance.checkPassword(password)) {
                                resolve(userInstance);
                            } else {
                                reject(new LoginError('Invalid password.'));
                            }
                        } else {
                            reject(new LoginError('User not found.'));
                        }
                    }).catch(reject);
            } else {
                reject(new LoginError('The `Password` field must contain at least 5 characters without spaces.'));
            }
        }).catch(reject);
    });
    
}

schema.statics.changePassword = function(userId, curPasswd, newPasswd, repNewPasswd) {
    let User = this;

    return new Promise(function(resolve, reject) {
        User.findById(userId).then(userInstance => {
            if (User.checkCorrectPassword(curPasswd)) {
                if (userInstance.checkPassword(curPasswd)) {
                    if (User.checkCorrectPassword(newPasswd)) {
                        if (User.checkCorrectPassword(repNewPasswd)) {
                            if (newPasswd === repNewPasswd) {
                                if (curPasswd !== newPasswd) {
                                    userInstance.password = newPasswd;
                                    userInstance.save()
                                        .then(res => resolve(res))
                                        .catch(reject); 
                                } else {
                                    reject(new ChangePasswordError('The new password corresponds to the current one.'))
                                }
                            } else {
                                reject(new ChangePasswordError('New password and repeated new password did not match.'));
                            }
                        } else {
                            reject(new ChangePasswordError('The `Repeat new password` field must contain at least 5 characters without spaces.'));
                        }
                    } else {
                        reject(new ChangePasswordError('The `New password` field must contain at least 5 characters without spaces.'));
                    }
                } else {
                    reject(new ChangePasswordError('Invalid current password.'));
                }
            } else {
                reject(new ChangePasswordError('The `Current password` field must contain at least 5 characters without spaces.'));
            }
        }).catch(reject);
    })
}

schema.statics.deleteAccount = function(userId) {
    let User = this;

    return new Promise(function(resolve, reject) {
        User.deleteOne({_id: userId}).then(res => {
            if (res.ok) {
                resolve(res);
            } else {
                reject(new DeleteAccountError(`Couldn't delete account.`));
            }
        }).catch(err => reject(err));
    });
}

exports.User = mongoose.model('User', schema);
exports.LoginError = LoginError;
exports.SignupError = SignupError;
exports.ChangePasswordError = ChangePasswordError;
exports.DeleteAccountError = DeleteAccountError;