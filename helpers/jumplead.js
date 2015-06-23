'use strict';

var mongoose = require('mongoose');
var request = require('request');
var async = require('async');

var JumpleadModule = function (db) {

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var CONSTANTS = require('../constants/jumplead');
    var ACCESS_TOKEN_URL = CONSTANTS.ACCESS_TOKEN_URL;
    var REFRESH_TOKEN_URL = CONSTANTS.REFRESH_TOKEN_URL;
    var REDIRECT_URI = CONSTANTS.REDIRECT_URI;
    var AUTHORIZE_URL = CONSTANTS.AUTHORIZE_URL;

    var CONTACTS_URL = CONSTANTS.CONTACTS_URL;
    var CONTACTS_SCOPE = CONSTANTS.CONTACTS_SCOPE;

    var self = this;

    //status = 401 -> refresh_token
    this.refToken = function (userId, callback){
                var accessToken;
                var refreshToken;
        UserModel.findById(userId, function (err, foundUser) {
            if (err) {
                return callback(err);
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
                    redirect_uri: REDIRECT_URI,
                    refresh_token: refreshToken,
                    grant_type: "refresh_token"
                }
            }, function (error, response, body) {
                try {
                    var body = JSON.parse(body);
                } catch (e) {
                    console.log(e);
                }
                UserModel.findByIdAndUpdate(userId, {$set: {
                    accessToken: body.access_token,
                    refreshToken: body.refresh_token
                }}, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null);
                });//findByIdAndUpdate

            });//request

        });//findById
    };

    this.getContact = function (userId, contactId, callback) {
        UserModel.findById(userId, function (err, user) {
            if (err) {
                return callback(err);
            }

            request.get({
                url: CONTACTS_URL + '/' + contactId,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user.accessToken
                }
            }, function (error, response, body) {
                if (response.status == '401') {
                    self.refToken(userId, function (err) {
                        if (err) {
                            return callback(err)
                        }
                        return self.getContact(userId, contactId, callback)
                    });
                } else if (err) {
                    return callback(err);
                }
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
                if (response.status == '401') {
                    self.refToken(userId, function (err) {
                        if (err) {
                            return callback(err)
                        }
                        return self.getContact(userId, callback)
                    });
                } else if (err) {
                    return callback(err);
                }
                return callback(null, body.data)
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
        }, function(error, response, body) {
            try {
                body = JSON.parse(body);
            }catch (e){
                console.log(e);
            }
            UserModel.findByIdAndUpdate(userId, {$set: {
                accessToken: body.access_token,
                refreshToken: body.refresh_token
            }}, function (err) {
                if (err) {
                    return callback(err);
                }
                return callback(null);
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
