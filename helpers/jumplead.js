'use strict';

var mongoose = require('mongoose');
var request = require('request');

var JumpleadModule = function (db) {

    var userSchema = mongoose.Schemas.User;
    var UserModel = db.model('User', userSchema);

    var prospectSchema = mongoose.Schemas.Prospect;
    var ProspectModel = db.model('Prospect', prospectSchema);

    var CONSTANTS = require('../constants/jumplead');
    var ACCESS_TOKEN_URL = CONSTANTS.ACCESS_TOKEN_URL;
    var REFRESH_TOKEN_URL = CONSTANTS.REFRESH_TOKEN_URL;
    var REDIRECT_URI = process.env.REDIRECT_URI;
    var CHECK_USER_URL = CONSTANTS.CHECK_USER_URL;
    var AUTHORIZE_URL = CONSTANTS.AUTHORIZE_URL;

    var CONTACTS_URL = CONSTANTS.CONTACTS_URL;
    var CONTACTS_SCOPE = CONSTANTS.CONTACTS_SCOPE;

    var self = this;

    //status = 401 -> refresh_token
    this.refToken = function (userId, callback) {
        var refreshToken;
        var jumpleadEmail;

        UserModel.findById(userId, function (err, foundUser) {
            if (err) {
                return callback(err);
            } else if (!foundUser) {
                var error = new Error();
                error.message = 'User not found';
                error.status = 404;
                return callback(error);
            }
            refreshToken = foundUser.refreshToken;
            jumpleadEmail = foundUser.jumpleadEmail;

            request.post({
                url: REFRESH_TOKEN_URL,
                headers: {
                    'content-type': 'application/json'
                },
                form: {
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                }
            }, function (error, response, body) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    console.log(e);
                }
                if (!body.access_token) {
                    var err = new Error();
                    err.message = 'Cant connect to external resources';
                    err.status = 404;
                    return callback(err);
                }
                UserModel.update({jumpleadEmail: jumpleadEmail}, {
                    $set: {
                        accessToken: body.access_token
                    }
                }, {multi: true}, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null);
                });
            });//request
        });//findById
    };


    this.setContact = function (contentId, contact, callback) {
        var error = new Error();

        UserModel.findOne({'campaigns._id': contentId}, function (err, user) {
            if (err) {
                return callback(err);
            } else if (!user) {
                error.message = 'User not found';
                error.status = 404;
                return callback(error);
            }
            var body = {
                data: {
                    'first_name': contact.firstName,
                    'last_name': contact.lastName,
                    'email': contact.email
                }
            };

            request({
                url: CONTACTS_URL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user.accessToken
                },
                json: true,
                body: body

            }, function (error, response, body) {
                if (body.status === '401') {
                    return (function () {
                        self.refToken(user._id, function (err) {
                            if (err) {
                                return callback(err)
                            }
                            return self.setContact(contentId, contact, callback)
                        });
                    })();
                } else if (body.error) {
                    return callback(body.error);
                }
                var data = body.data;
                if(!data || !data.id || !data.email|| !data.first_name|| !data.last_name){
                    error.message = 'Bad response from jumplead not found';
                    error.status = 400;
                    return callback(error);
                }
                ProspectModel.create({
                    jumpleadId: data.id,
                    email: data.email,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    isNewViewer: true
                }, {upsert: true}, function (err) {
                    if (err) {
                       return callback(err);
                    }
                });
                return callback(null, data)
            });
        });
    };

    this.getContact = function (userId, contactId, callback) {
        var e = new Error();
        UserModel.findById(userId, function (err, user) {
            if (err) {
                return callback(err);
            } else if (!user) {
                e.message = 'User not found';
                e.status = 404;
                return callback(error);
            }

            request.get({
                url: CONTACTS_URL + '/' + contactId,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user.accessToken
                }
            }, function (error, response, body) {
                try {
                    body = JSON.parse(body);
                } catch (err) {
                    console.log(e);
                }
                if (body.status === 404) {
                    e.status = 404;
                    e.message = 'Contact not found';
                    return callback(e)
                }
                if (body === 'ID is not valid') {
                    e.status = 404;
                    e.message = 'Contact not found';
                    return callback(e)
                }
                if (body.status === 401) {
                    return (function () {
                        self.refToken(userId, function (err) {
                            if (err) {
                                return callback(err)
                            }
                            return self.getContact(userId, contactId, callback)
                        });
                    })();
                } else if (error) {
                    return callback(error);
                }else if(!body.data || !body.data.id || !body.data.email || !body.data.first_name || !body.data.last_name){
                    e.status = 400;
                    e.message = 'Can not get prospect';
                    return callback(e)
                }
                ProspectModel.findOneAndUpdate({jumpleadId: contactId}, {
                    jumpleadId: body.data.id,
                    email: body.data.email,
                    firstName: body.data.first_name,
                    lastName: body.data.last_name
                }, {upsert: true}, function (err) {
                    if (err) {
                        return callback(err);
                    }
                });
                return callback(null, body.data)
            });
        });
    };

    this.getAllContacts = function (userId, callback) {
        var e = new Error();

        UserModel.findById(userId, function (err, user) {
            if (err) {
                return callback(err);
            }
            request.get({
                url: CONTACTS_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user.accessToken
                }
            }, function (error, response, body) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    console.log(e);
                }
                if (body.status = 404) {
                    e.status = 404;
                    e.message = 'Contacts not found';
                    return callback(error)
                }
                if (body.status === '401') {
                    return (function () {
                        self.refToken(userId, function (err) {
                            if (err) {
                                return callback(err)
                            }
                            return self.getAllContacts(userId, callback)
                        });
                    })();
                } else if (err) {
                    return callback(err);
                }
                return callback(null, body.data)
            });
        });
    };

    this.checkUser = function (res, userId, callback) {
        UserModel.findById(userId, function (err, user) {
            if (err) {
                return callback(err);
            }
            request.get({
                url: CHECK_USER_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user.accessToken
                }
            }, function (error, response, body) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    console.log(e);
                }
                if (body.status === 401 || body.status === 404 || body.status === 403 || body.error || !body.data) {
                    return res.redirect(process.env.WEB_HOST + '/#/message?text=Some trouble with jumplead');
                }
                return callback(null, body.data.email);
            });
        });
    };

    this.getToken = function (code, userId, callback) {
        request.post({
            url: ACCESS_TOKEN_URL,
            headers: {
                'content-type': 'application/json'
            },
            form: {
                code: code,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            }
        }, function (error, response, body) {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.log(e);
            }
            if (!body.access_token || !body.refresh_token) {
                var err = new Error();
                err.message = 'Some trouble with jumplead';
                err.status = 500;
                return callback(err);
            }
            UserModel.findByIdAndUpdate(userId, {
                $set: {
                    accessToken: body.access_token,
                    refreshToken: body.refresh_token
                }
            }, {new: true}, function (err, user) {
                if (err) {
                    return callback(err);
                }
                return callback(null, user);
            });//findByIdAndUpdate
        });//request.post
    };
};
module.exports = JumpleadModule;
