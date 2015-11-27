'use strict';

var _ = require('../public/js/libs/underscore/underscore-min');
var async = require('async');
var mongoose = require('mongoose');
var crypto = require('crypto');
var mailer = require('../helpers/mailer');
var AwsStorage = require('../helpers/aws')();
var s3 = new AwsStorage();

var AWS = require('../constants/AWS');
var USER_ROLES = require('../constants/userRoles');

var routeHandler = function (db) {
    var S3_BUCKET = AWS.S3_BUCKET;

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    }

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
            mailer.sendInvite(options);
            return res.redirect(process.env.WEB_HOST + '/#/message?text=Success! You confirmed ' + doc.firstName + ' ' + doc.lastName + ' as new user');
        });
    };


    this.confirmedUsers = function (req, res, next) {
        UserModel.find({isConfirmed: true, role: USER_ROLES.USER}, {avatar: 0, pass: 0}, function (err, docs) {
            if (err) {
                return next(err);
            } else if (!docs) {
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
        if (body.isConfirmed !== undefined) {
            saveObj.isConfirmed = body.isConfirmed;
        }
        if (body.subscriptionStart !== undefined) {
            saveObj.subscriptionStart = body.subscriptionStart;
        }
        if (body.subscriptionEnd !== undefined) {
            saveObj.subscriptionEnd = body.subscriptionEnd;
        }

        UserModel.findByIdAndUpdate(id, saveObj, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (saveObj.isConfirmed === true) {
                var options = {
                    email: doc.email,
                    firstName: doc.firstName,
                    lastName: doc.lastName
                };
                mailer.sendInvite(options);
            }
            var message = 'User modified';
            res.status(200).send({message: message});
        });
    };

    this.remove = function (req, res, next) {
        if (!req.params.id) {
            var e = new Error();
            e.message = 'Not enough params';
            e.status = 400;
            return next(e);
        }
        var userId = req.params.id;

        UserModel.findById(userId, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(404).send({err: 'User Not Found'});
            }

            async.each(user.campaigns, function (campaign, eachCb) {
                var contentId = campaign._id;

                async.parallel([
                    function (parallelCb) {
                        ContentModel.findByIdAndRemove(contentId, function (err) {
                            if (err) {
                                return parallelCb(err);
                            }
                            parallelCb(null);
                        });
                    },

                    function (parallelCb) {
                        ContactMeModel.remove({contentId: contentId}, function (err) {
                            if (err) {
                                return parallelCb(err);
                            }
                            parallelCb(null);
                        });
                    },

                    function (parallelCb) {
                        TrackModel.remove({contentId: contentId}, function (err) {
                            if (err) {
                                return parallelCb(err);
                            }
                            parallelCb(null);
                        });
                    },

                    function (parallelCb) {
                        var dirPath = contentId.toString();
                        s3.removeDir(S3_BUCKET, dirPath, function (err) {
                            if (err) {
                                return parallelCb(err);
                            }
                            parallelCb(null);
                        });
                    }

                ], function (err) {
                    if (err) {
                        return eachCb(err);
                    }
                     eachCb(null);
                });
            }, function (err) {
                if (err) {
                    return next(err);
                }
                UserModel.findByIdAndRemove(userId, function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send({message: 'User Removed'});
                });

            });
        });
    };
};

module.exports = routeHandler;