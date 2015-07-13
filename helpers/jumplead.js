'use strict';

var mongoose = require('mongoose');
var request = require('request');
var async = require('async');

var JumpleadModule = function (db) {

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var prospectSchema = mongoose.Schemas['Prospect'];
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
        var accessToken;
        var refreshToken;
        UserModel.findById(userId, function (err, foundUser) {
            if (err) {
                return callback(err);
            }
            if (!foundUser) {
                var error = new Error();
                error.message = "User not found";
                error.status = 404;
                return callback(error);
            }
            accessToken = foundUser.accessToken;
            refreshToken = foundUser.refreshToken;

            request.post({
                url: REFRESH_TOKEN_URL,
                headers: {
                    'content-type': 'application/json'
                },
                form: {
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    refresh_token: refreshToken,
                    grant_type: "refresh_token"
                }
            }, function (error, response, body) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    console.log(e);
                }
                if (!body.access_token) {
                    var err = new Error();
                    err.message = "For some reason we cant connect to jumplead";
                    err.status = 404;
                    return callback(err);
                }
                UserModel.findById(userId, function (err, user) {
                    UserModel.update({jumpleadEmail: user.jumpleadEmail}, {
                            $set: {
                                accessToken: body.access_token
                            }
                        }, {multi: true}, function (err) {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null);
                        }
                    )
                    ;//findByIdAndUpdate
                });


            });//request

        });//findById
    };


    this.setContact = function (userId, contact, callback) {
        UserModel.findById(userId, function (err, user) {
            if (err) {
                return callback(err);
            } else if (!user) {
                var error = new Error();
                error.message = 'User not found';
                error.status = 404;
                return callback(error);
            }
            var body = {
                data: {
                    "first_name": contact.firstName,
                    "last_name": contact.lastName,
                    "email": contact.email
                }
            };

            request({
                url: CONTACTS_URL,
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user.accessToken
                },
                json: true,
                body: body

            }, function (error, response, body) {
                if (body.status == '401') {
                    return (function () {
                        self.refToken(userId, function (err) {
                            if (err) {
                                return callback(err)
                            }
                            return self.setContact(userId, contact, callback)
                        });
                    })();
                } else if (body.error) {
                    return callback(body.error);
                }
                var data = body.data;
                ProspectModel.create({
                    jumpleadId: data.id,
                    email: data.email,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    isNewViwer: true
                }, {upsert: true}, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
                return callback(null, data)
            });
        });
    };

    this.getContact = function (userId, contactId, callback) {
        UserModel.findById(userId, function (err, user) {
            if (err) {
                return callback(err);
            } else if (!user) {
                var error = new Error();
                error.message = 'User not found';
                error.status = 404;
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
                } catch (e) {
                    console.log(e);
                }
                if (body.status == '404') {
                    var error = new Error();
                    error.status = 404;
                    error.message = 'User not found';
                    return callback(error)
                }
                if (body.status == '401') {
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
                }
                ProspectModel.findOneAndUpdate({jumpleadId: contactId}, {
                    jumpleadId: body.data.id,
                    email: body.data.email,
                    firstName: body.data.first_name,
                    lastName: body.data.last_name,
                }, {upsert: true}, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
                return callback(null, body.data)
            });
        });
    };

    this.getAllContacts = function (userId, callback) {

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
                if (body.status == '404') {
                    var error = new Error();
                    error.status = 404;
                    error.message = 'Contacts not found'
                    return callback(error)
                }
                if (body.status == '401') {
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

    this.checkUser = function (userId, callback) {
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
                if (body.status == '401' || body.status == '404' || error) {
                    var err = new Error();
                    err.message = "Some trouble with jumplead";
                    err.status = 500;
                    return callback(error || err);
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
                grant_type: "authorization_code"
            }
        }, function (error, response, body) {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.log(e);
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

    this.authorize = function () {
        request.post({
            url: AUTHORIZE_URL,
            headers: {
                'content-type': 'application/json'
            },
            form: {
                code: code,
                client_id: process.env.CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                response_type: "code",
                scope: CONTACTS_SCOPE
            }
        });
    };
};
module.exports = JumpleadModule;
