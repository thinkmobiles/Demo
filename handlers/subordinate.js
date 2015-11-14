'use strict';


var async = require('async');
var mongoose = require('mongoose');
var crypto = require('crypto');
var _ = require('../public/js/libs/underscore/underscore-min');
var mailer = require('../helpers/mailer');
var randToken = require('rand-token');

var USER_ROLES = require('../constants/userRoles');
var AWS = require('../constants/AWS');

var routeHandler = function (db) {
    var S3_BUCKET = AWS.S3_BUCKET;

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    };

    this.confirmUser = function (req, res, next) {
        var confirmToken = req.query.token;
        var options;
        UserModel.findOneAndUpdate({confirmToken: confirmToken}, {isConfirmed: true}, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                return res.redirect(process.env.WEB_HOST + '/#/message?text=User Not Found!');
            }
            options = {
                email: doc.email,
                firstName: doc.firstName,
                lastName: doc.lastName
            };
            //mailer.sendInviteToSubordinate(options);
            return res.redirect(process.env.WEB_HOST + '/#/message?text=Success! You confirmed ' + doc.firstName + ' ' + doc.lastName + ' as new user');
        });
    };


    this.subordinates = function (req, res, next) {
        var uId = req.session.uId;
        UserModel.find({creator: uId, role: {$in: [USER_ROLES.USER_ADMINISTRATOR, USER_ROLES.USER_VIEWER]}}, {
            firstName: 1,
            lastName: 1,
            userName: 1,
            isDisabled: 1,
            role: 1,
            email: 1
        }, function (err, docs) {
            if (err) {
                return next(err);
            } else if (!docs || !docs.length) {
                return res.status(200).send([]);
            }
            res.status(200).send(docs);
        });
    };

    this.pendingUsers = function (req, res, next) {
        UserModel.find({isConfirmed: false, role: USER_ROLES.USER}, {avatar: 0, pass: 0}, function (err, docs) {
            if (err) {
                return next(err);
            } else if (!docs) {
                return res.status(200).send([]);
            }
            res.status(200).send(docs);
        });
    };

    this.changePass = function (req, res, next) {
        if (!req.body || !req.body.pass || !req.body.id) {
            var e = new Error();
            e.message = 'Not enough params';
            e.status = 400;
            return next(e);
        }
        var pass = req.body.pass;
        var id = req.body.id;
        var hashPass = getEncryptedPass(pass);

        UserModel.findByIdAndUpdate(id, {pass: hashPass}, function (err, doc) {
            if (err) {
                return next(err);
            }
            return res.status(200).send({message: 'Success'});
        });
    };

    this.createSubordinate = function (req, res, next) {
        var uId = req.session.uId;
        var options = req.body;
        async.waterfall([
            ////validation:
            //function (seriesCb) {
            //    validateUserSignUp(options, function (err) {
            //        if (err) {
            //            return seriesCb(err);
            //        }
            //        seriesCb();
            //    });
            //},

            //create user:
            function (waterfallCb) {
                options.isConfirmed = false;
                options.isDisabled = false;
                options.creator = uId;
                options.confirmToken = randToken.generate(24);
                //mailer.sendInviteToSubordinate(options);
                UserModel.create(options, function (err, user) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, user);
                });
            },

            function (user, waterfallCb) {
                UserModel.findByIdAndUpdate(uId, {$addToSet: {subordinates: user._id}}, function (err) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null);
                });
            }], function (err) {
            if (err) {
                return next(err);
            }
            res.status(201).send({message: 'Created'});

        });
    };

    this.update = function (req, res, next) {
        if (!req.params.id) {
            var e = new Error();
            e.message = 'Not enough params';
            e.status = 400;
            return next(e);
        }
        var id = req.params.id;
        var body = req.body;

        var saveObj = {};
        if (body.isDisabled !== undefined) {
            saveObj.isDisabled = body.isDisabled;
        }
        if (body.role !== undefined) {
            saveObj.role = body.role;
        }

        UserModel.findByIdAndUpdate(id, saveObj, function (err, doc) {
            if (err) {
                return next(err);
            }
            var message = 'User modified';
            res.status(200).send({message: message});
        });
    };

    this.remove = function (req, res, next) {
        var creator = req.session.uId;
        if (!req.params.id) {
            var e = new Error();
            e.message = 'Not enough params';
            e.status = 400;
            return next(e);
        }
                var userId = req.params.id;

        UserModel.findByIdAndUpdate(creator, {$pull: {subordinates: userId}}, function (err, found) {
            if (err) {
                console.error(err);
            }
            UserModel.findByIdAndRemove(userId, function (err, found) {
                if (err) {
                    console.error(err);
                }
            });
        });

        var message = 'User removed';
        res.status(200).send({message: message});
    };
};


module.exports = routeHandler;