'use strict';

var CONSTANTS = require('../constants/index');

var async = require('async');
var crypto = require("crypto");
var mongoose = require('mongoose');
var http = require('http');
var request = require('request');
var REG_EXP = require('../constants/regExp');

var badRequests = require('../helpers/badRequests');

var _ = require('../public/js/libs/underscore/underscore-min');
var LocalFs = require('./fileStorage/localFs')();
var localFs = new LocalFs();
var path = require('path');
var fs = require('fs');
var Jumplead = require('../helpers/jumplead');
var Sessions = require('../helpers/sessions');
var mailer = require('../helpers/mailer');
var pdfutils = require('pdfutils').pdfutils;

var routeHandler = function (db) {


    var prospectSchema = mongoose.Schemas['Prospect'];
    var ProspectModel = db.model('Prospect', prospectSchema);

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var jumplead = new Jumplead(db);
    var session = new Sessions(db);
    var self = this;

    function normalizeEmail(email) {
        return email.trim().toLowerCase();
    };

    function validateProspectSignUp(userData, callback) { //used for signUpMobile, signUpWeb;
        var errMessage;

        if (!userData || !userData.email || !userData.firstName || !userData.lastName) {
            return callback(badRequests.NotEnParams({reqParams: ['email', 'pass', 'firstName', 'lastName']}));
        }

        if (userData.firstName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
            errMessage = 'First name cannot contain more than ' + CONSTANTS.USERNAME_MAX_LENGTH + ' symbols';
            return callback(badRequests.InvalidValue({message: errMessage}));
        }

        if (userData.lastName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
            errMessage = 'Last name cannot contain more than ' + CONSTANTS.USERNAME_MAX_LENGTH + ' symbols';
            return callback(badRequests.InvalidValue({message: errMessage}));
        }
        if (!REG_EXP.EMAIL_REGEXP.test(userData.email)) {
            return callback(badRequests.InvalidEmail());
        }

        userData.email = normalizeEmail(userData.email);

        ProspectModel.findOne({email: userData.email}, function (err, user) {
            if (err) {
                callback(err);
            } else if (user) {
                callback(badRequests.EmailInUse());
            } else {
                callback();
            }
        });

    };

    function validateUserSignUp(userData, callback) { //used for signUpMobile, signUpWeb;
        var errMessage;

        if (!userData || !userData.email || !userData.firstName || !userData.lastName || !userData.userName) {
            return callback(badRequests.NotEnParams({reqParams: ['email', 'pass', 'firstName', 'lastName']}));
        }

        if (userData.firstName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
            errMessage = 'First name cannot contain more than ' + CONSTANTS.USERNAME_MAX_LENGTH + ' symbols';
            return callback(badRequests.InvalidValue({message: errMessage}));
        }

        if (userData.lastName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
            errMessage = 'Last name cannot contain more than ' + CONSTANTS.USERNAME_MAX_LENGTH + ' symbols';
            return callback(badRequests.InvalidValue({message: errMessage}));
        }
        if (userData.userName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
            errMessage = 'User name cannot contain more than ' + CONSTANTS.USERNAME_MAX_LENGTH + ' symbols';
            return callback(badRequests.InvalidValue({message: errMessage}));
        }

        if (!REG_EXP.EMAIL_REGEXP.test(userData.email)) {
            return callback(badRequests.InvalidEmail());
        }

        userData.email = normalizeEmail(userData.email);

        UserModel.findOne({email: userData.email}, function (err, user) {
            if (err) {
                callback(err);
            } else if (user) {
                callback(badRequests.EmailInUse());
            } else {
                callback();
            }
        });

    };

    function createProspect(userData, callback) {

        //create user:
        var newProspect = new ProspectModel(userData);
        newProspect.save(function (err, result) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, result);
                }
            }
        });
    };


    function createUser(userData, callback) {

        //create user:
        var newUser = new UserModel(userData);
        newUser.save(function (err, result) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, result);
                }
            }
        });
    };

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    };

    this.redirect = function (req, res, next) {
        if (req.query.error) {
            return res.status(401).send({
                err: req.query.error,
                message: req.query.error_description
            });
        }
        var code = req.query.code;

        async.waterfall([
            function (waterfallCb) {
                session.getUserDescription(req, function (err, obj) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, obj);
                });
            },

            function (obj, waterfallCb) {
                jumplead.getToken(code, obj.id, function (err) {
                    if (err) {
                        return waterfallCb(err)
                    }
                    waterfallCb(null, obj)
                });
            },

            function (obj, waterfallCb) {
                jumplead.checkUser(obj.id, function (err, user, email) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null, obj, user, email);
                });
            },

            function (obj, user, email, waterfallCb) {
                if (user) {
                    UserModel.findByIdAndRemove(obj.id, function (err, removeUser) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        removeUser = removeUser.toObject();
                        var upObj = {
                            firstName: removeUser.firstName,
                            lastName: removeUser.lastName,
                            email: removeUser.email,
                            pass: removeUser.pass,
                            organization: removeUser.organization,
                            accessToken: removeUser.accessToken,
                            resreshToken: removeUser.resreshToken
                        };
                        UserModel.findByIdAndUpdate(user._id, upObj, {new: true}, function (err, updateUser) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            console.log('You update some exist user');
                            session.login(req, updateUser);
                            return waterfallCb(null);

                        });
                    });
                } else {
                    UserModel.findByIdAndUpdate(obj.id, {jumpleadEmail: email}, function (err, updateUser) {
                        if (err) {
                            return next(err);
                        }
                        console.log('Email successfully updated');
                    });
                    return waterfallCb(null);
                }
            }], function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/#/home');
        });


      /*  //=================================

        session.getUserDescription(req, function (err, obj) {
            if (err) {
                return next(err);
            }
            jumplead.getToken(code, obj.id, function (err) {
                if (err) {
                    return next(err)
                }
                jumplead.checkUser(obj.id, function (err, user, email) {
                    if (err) {
                        return next(err);
                    }
                    if (user) {
                        UserModel.findByIdAndRemove(obj.id, function (err, removeUser) {
                            if (err) {
                                return next(err);
                            }
                            removeUser = removeUser.toObject();
                            var obj = {
                                firstName: removeUser.firstName,
                                lastName: removeUser.lastName,
                                email: removeUser.email,
                                pass: removeUser.pass,
                                organization: removeUser.organization,
                                accessToken: removeUser.accessToken,
                                resreshToken: removeUser.resreshToken
                            };
                            UserModel.findByIdAndUpdate(user._id, obj, {new: true}, function (err, updateUser) {
                                if (err) {
                                    return next(err);
                                }
                                console.log('You update some exist user');
                                session.login(req, updateUser);
                                return res.redirect('/#/home');
                            });
                        });
                    } else {
                        UserModel.findByIdAndUpdate(obj.id, {jumpleadEmail: email}, function (err, updateUser) {
                            if (err) {
                                return next(err);
                            }
                            console.log('Email successfully updated');
                        });
                        return res.redirect('/#/home');
                    }
                });
            });
        });*/
    };

    this.sendContactMe = function (req, res, next) {
        var contentId = req.body.contentId;
        var body = req.body;
        if (!contentId) {
            var error = new Error();
            error.message = 'Content Id is not Defined';
            error.status = 403;
            return next(error)
        }
        ContentModel.findById(contentId, function (err, content) {
            if (err) {
                return next(err);
            }
            if (!content) {
                var error = new Error();
                error.message = 'Content Not Found';
                error.status = 404;
                return next(error);
            }
            var data = {
                companyName: content.name,
                companyEmail: content.email,
                name: body.name || 'NoName',
                email: body.email || '-',
                description: body.description || 'NoDescription'
            };
            mailer.contactMe(data);
            res.status(200).send('Successful Send');
        });
    };


    this.currentUser = function (req, res, next) {
        session.getUserDescription(req, function (err, obj) {
            if (err) {
                return next(err);
            }
            if (!obj) {
                var error = new Error();
                error.message = "Unauthorized";
                error.status = 401;
                return next(error);
            }
            res.status(200).send(obj);

        });
    };

    this.login = function (req, res, next) {
        var options = req.body;
        if (!options.userName || !options.pass) {
            var error = new Error();
            error.message = "Username and password is required";
            error.status = 401;
            return next(error);
        }

        var userName = options.userName;
        var pass = getEncryptedPass(options.pass);
        UserModel.findOne({userName: userName}, function (err, user) {
            if (err) {
                return next(err);
            }

            if (!user) {
                var error = new Error();
                error.message = "Can\'t find User";
                error.status = 404;
                return next(error);
            }

            if (user.pass === pass) {
                session.login(req, user);
                console.log(typeof options.keepAlive);
                if (options.keepAlive === 'true') {
                    req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                } else {
                    req.session.cookie.maxAge = 60 * 1000;
                }
                return res.status(200).send({
                    success: "Login successful",
                    user: user
                });
            } else {
                var error = new Error();
                error.message = "Incorrect password";
                error.status = 401;
                return next(error);
            }
        });
    };

    this.logout = function (req, res, next) {
        session.kill(req, function () {
            res.redirect('/#/home');
        })
    };

    this.avatar = function (req, res, next) {
        var userName = req.params.userName;
        if (!userName) {
            var error = new Error();
            error.message = "UserName is required";
            error.status = 401;
            return next(error);
        }

        UserModel.findOne({userName: userName}, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(200).send({avatar: ""});
            }
            return res.status(200).send({avatar: user.avatar});
        });
    };

    this.signUp = function (req, res, next) {
        var options = req.body;
        var pass = options.pass;
        options.pass = getEncryptedPass(pass);
        async.series([

            //validation:
            function (cb) {
                validateUserSignUp(options, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb();
                });
            },
            //create user:
            function (cb) {
                createUser(options, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    session.login(req, user);
                    cb(null, user);
                });
            }], function (err) {
            if (err) {
                return next(err);
            }
            res.status(201).send('User created');
        });
    };

    this.prospectSignUp = function (req, res, next) {
        var options = req.body;

        async.series([

            //validation:
            function (cb) {
                validateProspectSignUp(options, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, true);
                });
            },

            //create prospect:
            function (cb) {
                createProspect(options, function (err, prospect) {
                    if (err) {
                        return cb(err);
                    }
                    jumplead.setContact(options.ownerId, prospect, function (err, contact) {
                        if (err) {
                           return cb(err);
                        }

                        cb(null, contact);
                    });

                });
            }
        ], function (err, rezult) {
            if (err) {
                return next(err);
            }
            var contact = rezult[1];
            res.status(201).send({
                id: contact.id
            });
        });
    };


    this.content = function (req, res, next) {
        session.getUserDescription(req, function (err, obj) {
            if (err) {
                return next(err);
            }
            if (!obj) {
                var error = new Error();
                error.message = "Unauthorized";
                error.status = 401;
                return next(error);
            }
            ContentModel.findOne({ownerId: obj.id}, function (err, found) {
                if (err) {
                    return next(err);
                }
                console.log(found);
                if (!found) {
                    return res.status(404).send({err: 'Content Not Found'});
                }
                var url = process.env.HOME_PAGE + found._id + '/{{ctid}}';
                res.status(201).send({url: url});
            });
        });

    };

    // url = '/:contentId/:ctid'
    this.getMain = function (req, res, next) {
        var contentId = req.params.contentId;
        var prospectId = req.params.ctid;
        var content;
        var data;

        ContentModel.findById(contentId, function (err, foundContent) {
            if (err) {
                return next(err);
            }
            if (!foundContent) {
                var error = new Error();
                error.message = 'Content Not Found';
                error.status = 404;
                return next(error);
            }
            content = foundContent;

            UserModel.findById(content.ownerId, function (err, user) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    var error = new Error();
                    error.message = 'User Not Found';
                    error.status = 404;
                    return next(error);
                }
                jumplead.getContact(user._id, prospectId, function (err, prospect) {
                    if (err) {
                        return next(err);
                    }

                    TrackModel.findOneAndUpdate({
                        "contentId": contentId,
                        "firstName": prospect.first_name,
                        "lastName": prospect.last_name
                    }, {
                        $set: {
                            "contentId": contentId,
                            "userId": prospect.id,
                            "firstName": prospect.first_name,
                            "lastName": prospect.last_name,
                            "email": prospect.email,
                            "isSent": false,
                            "updatedAt": Date.now()
                        }
                    }, {upsert: true}, function (err) {
                        if (err) {
                            return next(err);
                        }

                        data = {
                            content: content,
                            contact: {
                                firstName: prospect.first_name,
                                lastName: prospect.last_name,
                                email: prospect.email
                            }
                        };
                        res.status(200).send(data);
                    });
                });
            });
        });
    };

    this.allContacts = function (req, res, next) {
        var usrId = req.params.id;
        jumplead.getAllContacts(usrId, function (err, prospects) {
            if (err) {
                return next(err);
            }
            res.status(200).send(prospects);
        });
    };

    this.contact = function (req, res, next) {
        var uId = mongoose.Types.ObjectId(req.params.uid);
        var cId = mongoose.Types.ObjectId(req.params.cid);
        jumplead.getContact(uId, cId, function (err, prospects) {
            if (err) {
                return next(err);
            }
            res.status(200).send(prospects);
        });
    };

    this.allUsers = function (req, res, next) {
        UserModel.find({}, function (err, users) {
            if (err) next(err);
            res.status(200).send(users);
        });

    };

    this.trackQuestion = function (req, res, next) {
        var data = req.body;
        var userId = req.body.userId;
        var contentId = req.body.contentId;

        TrackModel.findOneAndUpdate({
            "userId": userId,
            "contentId": contentId,
            "isSent": false
        }, {$set: {questions: data.questions}}, {upsert: true}, function (err) {
            if (err) {
                return next(err);
            }
            TrackModel.findOneAndUpdate({
                "userId": userId,
                "contentId": contentId,
                "isSent": false
            }, {
                $set: {
                    updatedAt: Date.now()
                }
            }, function (err) {
                if (err) {
                    return next(err);
                }
                res.status(200).send("Successful update");
            });
        });
    };

    this.trackDocument = function (req, res, next) {
        var body = req.body;
        if (!body.document || !body.userId || !body.contentId) {
            return res.status(200).send("Invalid parameters");
        }
        var userId = body.userId;
        var contentId = body.contentId;
        var document = {
            document: body.document
        };
        var obj = {
            "userId": userId,
            "contentId": contentId,
            "isSent": false,
            "documents.document": document
        };

        TrackModel.findOne(obj, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                TrackModel.findOneAndUpdate({
                    "userId": userId,
                    "contentId": contentId,
                    "isSent": false
                }, {
                    $addToSet: {
                        "documents": {
                            document: body.document
                        }
                    }
                }, {upsert: true, new: true}, function (err, doc) {
                    if (err) {
                        return next(err);
                    }
                    TrackModel.findByIdAndUpdate(doc._id, {
                        $set: {
                            updatedAt: Date.now()
                        }
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.status(200).send("Successful create");
                    });
                });
            } else {
                var findDocument = _.findWhere(doc.documents, {document: document});

                if (!findDocument) {
                    TrackModel.findOneAndUpdate({
                        "userId": userId,
                        "contentId": contentId,
                        "isSent": false,
                    }, {
                        $addToSet: {
                            "documents": {
                                document: body.document
                            }
                        }
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        TrackModel.findByIdAndUpdate(doc._id, {
                            $set: {
                                updatedAt: Date.now()
                            }
                        }, function (err) {
                            if (err) {
                                return next(err);
                            }
                            return res.status(200).send("Successful create");
                        });
                    });
                } else {
                    res.status(200).send("User already download this document");
                }
            }
        });
    };

    this.trackVideo = function (req, res, next) {
        var body = req.body;
        var data = body.data;
        if (!data.video || !data.stopTime || !body.userId || !body.contentId) {
            return res.status(403).send("Invalid parameters");
        }
        var userId = body.userId;
        var contentId = body.contentId;
        var obj = {
            "userId": userId,
            "contentId": contentId,
            "isSent": false,
            "videos.video": body.data.video
        };

        TrackModel.findOne(obj, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                TrackModel.findOneAndUpdate({
                    "userId": userId,
                    "contentId": contentId,
                    "isSent": false
                }, {
                    "userId": userId,
                    "contentId": contentId,
                    "isSent": false,
                    "updatedAt": Date.now()
                }, {upsert: true, new: true}, function (err, doc) {
                    if (err) {
                        return next(err);
                    }
                    TrackModel.findByIdAndUpdate(doc._id, {
                        $addToSet: {
                            "videos": body.data
                        }
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.status(200).send("Successful create");
                    });
                });
            } else {
                var fvideo = _.findWhere(doc.videos, {video: body.data.video});
                if (!fvideo.end && fvideo.stopTime < body.data.stopTime) {
                    TrackModel.findOneAndUpdate({
                        "userId": userId,
                        "contentId": contentId,
                        "isSent": false,
                        "videos.video": body.data.video
                    }, {
                        $set: {
                            "videos.$.stopTime": body.data.stopTime,
                            "videos.$.end": body.data.end,
                            updatedAt: Date.now()
                        }
                    }, function (err) {
                        if (err) {
                            return next(err);
                        }
                        return res.status(200).send("Successful update");
                    });
                } else {
                    res.status(200).send("User already watched this video longer time");
                }
            }
        });
    };

    function upFile(target, file, callback) {
        fs.readFile(file.path, function (err, data) {
            localFs.setFile(target, file.originalFilename, data, function (err) {
                if (err) {
                    return callback(err);
                }
                var uri = path.join(target, file.originalFilename);
                return callback(null, uri);
            });
        });
    };

    function validation(data, callback) {
        var files = data.files;
        var body = data.body;
        var formatsVideo = '.mp4 .WebM .Ogg';
        var formatsImage = '.jpg .bmp .png .ico';
        var mainVideoExt = (files['video'].originalFilename.split('.')).pop().toLowerCase();
        var err = new Error();
        err.status = 400;


        if (!body.desc || !body.name || !body.email || !body.phone) {
            err.message = 'Not  completed fields';
            return callback(err);
        }
        if (!files['video'] && body['video']) {
            err.message = 'Main video is not found';
            return callback(err);
        }
        if (!body.countQuestion) {
            err.message = 'Question  is not found';
            return callback(err);
        }
        if (files['video'] && formatsVideo.indexOf(mainVideoExt) == -1) {
            err.message = 'Main video format is not support';
            return callback(err);
        }
        if (!REG_EXP.EMAIL_REGEXP.test(body.email)) {
            err.message = 'Email validation failed';
            return callback(err);
        }

        for (var i = body.countQuestion; i > 0; i--) {
            var videoName = 'video' + i;
            var pdfName = 'file' + i;
            var questionName = 'question' + i;
            var videoExt = (files[videoName].originalFilename.split('.')).pop().toLowerCase();

            async.each(files[pdfName], function (file, cb) {
                var pdfExt = (file.originalFilename.split('.')).pop().toLowerCase();
                if (pdfExt != 'pdf') {
                    err.message = 'Survey pdf files format is not support';
                    return cb(err);
                }
                else cb();
            });
            if (!files[videoName] && !body[videoName]) {
                err.message = 'Survey video is not found';
                return callback(err);
            }
            if (!body[questionName]) {
                err.message = 'Survey question is not found';
                return callback(err);
            }

            if (files[videoName] && formatsVideo.indexOf(videoExt) == -1) {
                err.message = 'Survey video format is not support';
                return callback(err);
            }
        }

        if (!files['logo']) {
            err.message = 'Logo is not found';
            return callback(err);
        }
        var logoExt = (files['logo'].originalFilename.split('.')).pop().toLowerCase();
        if (formatsImage.indexOf(logoExt) == -1) {
            err.message = 'Logo format is not support';
            return callback(err);
        }
        return callback();
    };


    function saveMainVideo(id, files, callback) {
        var sep = path.sep;
        var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString();

        upFile(url, files['video'], function (err, mainVideoUri) {
            if (err) {
                return callback(err);
            }
            upFile(url, files['logo'], function (err, logoUri) {
                if (err) {
                    return callback(err);
                }
                var saveMainVideoUri = mainVideoUri.replace('public' + sep, '');
                var saveLogoUri = logoUri.replace('public' + sep, '');
                ContentModel.findByIdAndUpdate(id, {$set: {mainVideoUri: saveMainVideoUri, logoUri: saveLogoUri}},
                    function (err, content) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null);
                    });
            });
        });
    };

    function saveSurveyVideo(num, id, files, data, callback) {
        var question = 'question' + num;
        var name = 'video' + num;
        console.log('************Uploading video ' + question + ' start');
        if (!!files[name]) {
            var sep = path.sep;
            var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString() + sep + 'survey' + num;

            upFile(url, files[name], function (err, videoUri) {
                if (err) {
                    return callback(err);
                }
                var saveVideoUri = videoUri.replace('public' + sep, '');
                var insSurvey = {
                    question: data[question],
                    videoUri: saveVideoUri
                };
                ContentModel.findByIdAndUpdate(id, {$addToSet: {survey: insSurvey}}, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    console.log('*************Uploading video ' + question + ' ended successfully');
                    return callback(null)
                });
            });
        } else {
            var insSurvey = {
                question: data[question],
                videoUri: data[name]
            };
            ContentModel.findByIdAndUpdate(id, {$addToSet: {survey: insSurvey}}, function (err) {
                if (err) {
                    return callback(err);
                }
                return callback(null)
            });
        }


    };

    function saveSurveyFiles(num, id, files, data, mainCallback) {
        var question = 'question' + num;
        var name = 'file' + num;
        var sep = path.sep;
        var arr = [];
        if (!files[name]) {
            var error = new Error();
            error.message = "Some files missing";
            error.status = 401;
            return mainCallback(error);
        }
        if (!files[name].length) {
            arr.push(files[name]);
        }
        else {
            arr = files[name];
        }
        console.log('---Uploading pdf ' + question + ' start');
        var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString() + sep + 'survey' + num + sep + 'pdf';

        async.each(arr, function (file, eachCb) {
            upFile(url, file, function (err, pdfUri) {
                if (err) {
                    return eachCb(err);
                }
                var name = file.originalFilename.split(sep).pop().slice(0, -4) + '.png';

                pdfutils(file.path, function (err, doc) {
                    doc[0].asPNG({maxWidth: 500, maxHeight: 1000}).toFile(url + sep + name);
                    console.log('+++++Uploading Image ' + question + ' of ' + name + ' ended successfully');
                });
                var savePdfUri = pdfUri.replace('public' + sep, '');
                ContentModel.findOneAndUpdate({
                    "_id": id,
                    "survey.question": data[question]
                }, {$addToSet: {"survey.$.pdfUri": savePdfUri}}, function (err, content) {
                    if (err) {
                        return eachCb(err);
                    }
                    eachCb();
                });
            });
        }, function (err) {
            if (err) {
                return mainCallback(err);
            } else {
                console.log('---Uploading pdf ' + question + ' ended successfully');
                mainCallback();
            }
        });
    };


    this.upload = function (req, res, next) {
        var data = req.body;
        var files = req.files;
        async.waterfall([

                //validation
                function (waterfallCb) {
                    validation(req, function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null);

                    });
                },

                // get current user from session
                function (waterfallCb) {
                    session.getUserDescription(req, function (err, obj) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        if (!obj) {
                            var error = new Error();
                            error.status = 401;
                            error.message = 'Unauthorized';
                            return waterfallCb(error);
                        }

                        waterfallCb(null, obj);
                    });
                },

                // get data about current user from DB
                function (obj, waterfallCb) {
                    ContentModel.findOne({ownerId: obj.id}, function (err, doc) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        if (doc) {
                            var error = new Error();
                            error.status = 401;
                            error.message = 'You already have content';
                            return waterfallCb(error);
                        }
                        var insObj = {
                            ownerId: obj.id,
                            name: data.name,
                            email: data.email,
                            phone: data.phone,
                            mainVideoDescription: data.desc
                        };
                        waterfallCb(null, obj, insObj);
                    });
                },

                // create content model
                function (obj, insObj, waterfallCb) {
                    var content = new ContentModel(insObj);
                    content.save(function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, obj, result);
                    });
                },

                // update user => set contentId
                function (obj, result, waterfallCb) {
                    var id = result._id;
                    UserModel.findByIdAndUpdate(obj.id, {$set: {contentId: result._id}}, function (err, user) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, user, id);
                    });
                },

                // save data staff
                function (user, id, waterfallCb) {
                    async.series([
                        function (seriesCb) {
                            if (!!files['video']) {
                                saveMainVideo(id, files, seriesCb);
                            }
                            else {
                                var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString();
                                upFile(url, files['logo'], function (err, logoUri) {
                                    if (err) {
                                        return seriesCb(err);
                                    }
                                    var saveLogoUri = logoUri.replace('public' + sep, '');
                                    ContentModel.findByIdAndUpdate(id, {
                                            $set: {
                                                mainVideoUri: data.video,
                                                logoUri: saveLogoUri
                                            }
                                        },
                                        function (err) {
                                            if (err) {
                                                return seriesCb(err);
                                            }
                                            seriesCb(null);
                                        });
                                });
                            }
                        },

                        function (seriesCb) {
                            var index = [];
                            for (var i = data.countQuestion; i > 0; i--) {
                                index.push(i);
                            }

                            async.each(index, function (i, eachCb) {
                                async.applyEachSeries([saveSurveyVideo, saveSurveyFiles], i, id, files, data, function (err) {
                                    if (err) {
                                        return eachCb(err);
                                    }
                                    eachCb();
                                });
                            }, function (err) {
                                if (err) {
                                    return seriesCb(err);
                                }
                                seriesCb(null);
                            });

                        }], function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        var url = process.env.HOME_PAGE + id + '/{{ctid}}';
                        waterfallCb(null, url)
                    });
                    localFs.defaultPublicDir = 'public';
                }],

            function (err, url) {
                if (err) {
                    return next(err);
                }
                res.status(201).send({url: url});
            });
    };

    this.pdf = function (req, res, next) {
        var data = req.body;
        var files = req.files;
        var sep = path.sep;
        var url = localFs.defaultPublicDir + sep + 'video';

        upFile(url, files['pdf'], function (err, pdfUri) {
            if (err) {
                return next(err);
            }
            //ToDo: pdf preview

            //-----------------------------------------------------------------
            var name = files['pdf'].originalFilename.split(sep).pop().slice(0, -4) + '.png';
            pdfutils(files['pdf'].path, function (err, doc) {
                doc[0].asPNG({maxWidth: 500, maxHeight: 1000}).toFile(url + sep + name);
            });
            //-----------------------------------------------------------------
            res.status(200).send('Success!!');
        });
    };
};

module.exports = routeHandler;