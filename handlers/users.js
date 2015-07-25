'use strict';

var CONSTANTS = require('../constants/index');

var async = require('async');
var crypto = require("crypto");
var mongoose = require('mongoose');
var http = require('http');
var request = require('request');
var REG_EXP = require('../constants/regExp');

var badRequests = require('../helpers/badRequests');
var Analytic = require('../helpers/analytic');
var _ = require('../public/js/libs/underscore/underscore-min');
var LocalFs = require('./fileStorage/localFs')();
var localFs = new LocalFs();
var path = require('path');
var fs = require('fs');
var Jumplead = require('../helpers/jumplead');
var Sessions = require('../handlers/sessions');
var mailer = require('../helpers/mailer');
var pdfutils = require('pdfutils').pdfutils;
var moment = require('moment');
var randToken = require('rand-token');

var routeHandler = function (db) {


    var prospectSchema = mongoose.Schemas['Prospect'];
    var ProspectModel = db.model('Prospect', prospectSchema);

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);

    var jumplead = new Jumplead(db);
    var session = new Sessions(db);
    var analytic = new Analytic(db);
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

        if (!userData || !userData.email || !userData.firstName || !userData.lastName || !userData.userName || !userData.phone) {
            return callback(badRequests.NotEnParams({reqParams: ['email', 'pass', 'firstName', 'lastName', 'phone']}));
        }

        if (userData.phone.length > CONSTANTS.PHONE_MAX_LENGTH) {
            errMessage = 'First name cannot contain more than ' + CONSTANTS.PHONE_MAX_LENGTH + ' symbols';
            return callback(badRequests.InvalidValue({message: errMessage}));
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

    function createUser(userData, callback) {
        userData.isConfirmed = false;
        userData.confirmToken = randToken.generate(24);
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

    this.share = function (req, res, next) {
        fs.readFile('public/templates/share.html', 'utf8', function (err, template) {
            var contentId = req.query.contentId;
            var prospectId = req.query.prospectId;
            var page = req.query.page;
            var content;

            if (!contentId || !prospectId || !page) {
                return res.redirect(process.env.HOME_PAGE);
            }
            ContentModel.findById(contentId, function (err, foundContent) {
                if (err) {
                    return next(err);
                }
                if (!foundContent) {
                    return res.redirect(process.env.HOME_PAGE);
                }
                content = foundContent;

                var redirectUrl = process.env.WEB_HOST + '/#/' + page + '/' + contentId + '/' + prospectId;
                var currentUtl = process.env.WEB_HOST + '/share?contentId=' + contentId + '&prospectId=' + prospectId + '&page=' + page;
                var logoUtl = process.env.WEB_HOST + '/' + content.logoUri;
                var description = content.mainVideoDescription;

                var templateOptions = {
                    currentUrl: currentUtl,
                    redirectUrl: redirectUrl,
                    logoUrl: logoUtl,
                    description: description
                };
                var html = _.template(template)(templateOptions);
                res.end(html);
            });
        });
    };


    this.redirect = function (req, res, next) {
        if (req.query.error) {
            return res.status(401).send({
                err: req.query.error,
                message: req.query.error_description
            });
        }
        var code = req.query.code;
        var userId;

        async.waterfall([
            function (waterfallCb) {
                userId = req.session.uId;
                jumplead.getToken(code, userId, function (err) {
                    if (err) {
                        return waterfallCb(err)
                    }
                    waterfallCb(null);
                });
            },

            function (waterfallCb) {
                jumplead.checkUser(userId, function (err, email) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    UserModel.findByIdAndUpdate(userId, {jumpleadEmail: email}, function (err, user) {
                        if (err) {
                            return next(err);
                        }
                        UserModel.update({jumpleadEmail: email}, {
                            $set: {
                                accessToken: user.accessToken,
                                refreshToken: user.refreshToken
                            }
                        }, {multi: true}, function (err, count) {
                            if (err) {
                                return next(err);
                            }
                            if (count == 1) {
                                saveAllContacts(userId);
                            }
                            console.log('AccessToken successfully updated');
                            return waterfallCb(null);
                        });
                    });
                });
            }], function (err) {
            if (err) {
                return next(err);
            }
            if (req.session && req.session.uId) {
                req.session.destroy();
            }
            return res.redirect('/#/home');
        });
    };

    function saveAllContacts(userId) {
        var arrToSave = [];
        var obj;

        jumplead.getAllContacts(userId, function (err, contacts) {
            if (err) {
                return console.error(err);
            }
            async.each(contacts, function (contact, callback) {
                obj = {
                    jumpleadId: contact.id,
                    firstName: contact.first_name,
                    lastName: contact.last_name,
                    email: contact.email,
                    isNewViewer: false
                };
                arrToSave.push(obj);
                callback(null);
            }, function (err) {
                if (err) {
                    return console.error(err);
                }
                ProspectModel.create(arrToSave, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
            });
        });
    };

    this.sendContactMe = function (req, res, next) {
        var contentId = req.body.contentId;
        var body = req.body;
        var error = new Error();

        if (!contentId || !body.name || !body.email || !body.message) {
            error.message = 'Some field is empty';
            error.status = 403;
            return next(error)
        }
        ContentModel.findById(contentId, function (err, content) {
            if (err) {
                return next(err);
            }
            if (!content) {
                error.message = 'Content Not Found';
                error.status = 404;
                return next(error);
            }
            var saveObj = new ContactMeModel({
                contentId: contentId,
                name: body.name || 'NoName',
                email: body.email || '-',
                message: body.message || 'NoMessage',
                sentAt: Date.now()
            });
            saveObj.save(function (err, doc) {
                if (err) {
                    return console.error(err);
                }
                console.log(doc);
            });

            var firstName = body.name.split(' ').shift();
            var lastName = body.name.split(' ').pop();

            TrackModel.findOne({
                contentId: contentId,
                isSent: false,
                firstName: firstName,
                lastName: lastName,
                email: body.email
            }, function (err, doc) {
                if (err) {
                    return next(err);
                }
                var analytics = {
                    videos: doc ? doc.videos : [],
                    questions: doc ? doc.questions : [],
                    documents: doc ? doc.documents : []
                };
                var data = {
                    companyName: content.name,
                    companyEmail: content.email,
                    name: body.name || 'NoName',
                    email: body.email || '-',
                    message: body.message || 'NoDescription',
                    analytics: analytics
                };
                mailer.contactMe(data);
            });

            res.status(200).send('Successful Send');
        });
    };


    this.currentUser = function (req, res, next) {
        UserModel.findById(req.session.uId, function (err, doc) {
            if (err) {
                return next(err);
            } else if (!doc) {
                var e = new Error();
                e.message = 'User not found';
                e.status = 404;
                return next(e);
            }
            res.status(200).send(doc);
        });
    };

    this.login = function (req, res, next) {
        var options = req.body;
        var error = new Error();
        if (!options.userName || !options.pass) {
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
                error.message = "Can\'t find User";
                error.status = 404;
                return next(error);
            }

            if (user.pass === pass) {
                if (!user.isConfirmed) {
                    error.message = "Your account not verified yet";
                    error.status = 401;
                    return next(error);

                }

                session.login(req, user);
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
                error.message = "Wrong password";
                error.status = 401;
                return next(error);
            }
        });
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
                    mailer.newUserConfirm(user);
                    cb(null, user);
                });
            }], function (err) {
            if (err) {
                return next(err);
            }
            res.status(201).send({message: 'Well done! We\'ll send you an email as soon as this is complete, this shouldn\'t take more than 2 working days.'});

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
                jumplead.setContact(options.ownerId, options, function (err, contact) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, contact);

                });
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }
            var contact = result[1];
            res.status(201).send({
                id: contact.id
            });
        });
    };

    this.content = function (req, res, next) {
        ContentModel.findOne({ownerId: req.session.uId}, function (err, found) {
            if (err) {
                return next(err);
            }
            console.log(found);
            if (!found) {
                return res.status(404).send({err: 'Content Not Found'});
            }
            var url = process.env.HOME_PAGE + found._id + '/{{ctid}}';
            res.status(201).send({url: url, content:found});
        });
    };

    function rmDir(dirPath) {
        try {
            var files = fs.readdirSync(dirPath);
            //console.log(files);
        }
        catch (e) {
            return;
        }
        if (files.length > 0)
            for (var i = 0; i < files.length; i++) {
                var filePath = dirPath + '/' + files[i];
                if (fs.statSync(filePath).isFile())
                    fs.unlinkSync(filePath);
                else
                    rmDir(filePath);
            }
        fs.rmdirSync(dirPath);
    };

    this.removeContent = function (req, res, next) {
        var contentId;
        var userId = req.session.uId;
        var sep = path.sep;

        ContentModel.findOneAndRemove({ownerId: req.session.uId}, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                return res.status(404).send({err: 'Content Not Found'});
            }
            contentId = doc._id;
            UserModel.findByIdAndUpdate(userId, {contentId: null}, function (err, found) {
                if (err) {
                    return next(err);
                }
                if (!found) {
                    return res.status(404).send({err: 'Content Not Found'});
                }
            });
            ContactMeModel.remove({contentId: contentId}, function (err) {
                if (err) {
                    console.error(err);
                }
                console.log('ContactMeModel updated')
            });
            TrackModel.remove({contentId: contentId}, function (err) {
                if (err) {
                    console.error(err);
                }
                console.log('TrackModel updated')
            });
            var dirPath = localFs.defaultPublicDir + sep + 'video' + sep + doc._id.toString();
            rmDir(dirPath);

            var message = 'Content removed';
            res.status(200).send({message: message});
        });
    };


    // url = '/:contentId/:ctid'
    this.getMain = function (req, res, next) {
        var contentId = req.params.contentId;
        var prospectId = req.params.ctid;
        var userId;
        var content;
        var data;
        async.waterfall([

            function (waterfallCb) {
                ContentModel.findById(contentId, function (err, foundContent) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    if (!foundContent) {
                        var error = new Error();
                        error.message = 'Content Not Found';
                        error.status = 404;
                        return waterfallCb(error);
                    }
                    content = foundContent;
                    waterfallCb(null, foundContent);
                });
            },

            function (content, waterfallCb) {
                UserModel.findById(content.ownerId, function (err, user) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    if (!user) {
                        var error = new Error();
                        error.message = 'User Not Found';
                        error.status = 404;
                        return waterfallCb(error);
                    }
                    userId = user._id;
                    waterfallCb(null, user);
                });
            },

            function (user, waterfallCb) {
                ProspectModel.findOne({jumpleadId: prospectId}, function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    if (!doc) {
                        jumplead.getContact(user._id, prospectId, function (err, prospect) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            var obj = {
                                jumpleadId: prospect.id,
                                firstName: prospect.first_name,
                                lastName: prospect.last_name,
                                email: prospect.email
                            };
                            return waterfallCb(null, obj);
                        });
                    } else {

                        updateProspect(userId, doc.jumpleadId);
                        return waterfallCb(null, doc);
                    }
                });
            }], function (err, prospect) {
            if (err) {
                return next(err);
            }
            data = {
                content: content,
                contact: prospect
            };
            createTrackDoc(contentId, prospect);
            res.status(200).send(data);
        });
    };


    function updateProspect(userId, contactId) {
        jumplead.getContact(userId, contactId, function (err, data) {
            if (err) {
                return console.error(err);
            }
            ProspectModel.findOneAndUpdate({jumpleadId: contactId}, {
                email: data.email,
                firstName: data.first_name,
                lastName: data.last_name
            }, function (err) {
                if (err) {
                    return console.error(err);
                }
            });
        });
    }

    function createTrackDoc(contentId, prospect) {
        TrackModel.findOneAndUpdate({
            "contentId": contentId,
            "jumpleadId": prospect.jumpleadId,
            "isSent": false
        }, {
            $set: {
                "contentId": contentId,
                "jumpleadId": prospect.jumpleadId,
                "firstName": prospect.firstName,
                "lastName": prospect.lastName,
                "email": prospect.email,
                "domain": prospect.email.split('@').pop(),
                "isNewViewer": prospect.isNewViewer,
                "isSent": false,
                "updatedAt": Date.now()
            }
        }, {upsert: true}, function (err, doc) {
            if (err) {
                return console.error(err);
            }
            return true;
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

    function mkdirSync(path) {
        try {
            fs.mkdirSync(path);
        } catch (e) {
            if (e.code != 'EEXIST') {
                console.log('Directory already exist');
            }
        }
    }

    function validation(data, callback) {
        var files = data.files;
        var body = data.body;
        var formatsVideo = '.mp4 .WebM .Ogg';
        var formatsImage = '.jpg .bmp .png .ico';
        var mainVideoExt = (files['video'].originalFilename.split('.')).pop().toLowerCase();
        var err = new Error();
        err.status = 400;
        var videoName;
        var pdfName;
        var questionName;
        var videoExt;


        if (!body.desc || !body.name || !body.email || !body.phone) {
            err.message = 'Not  completed fields';
            return callback(err);
        }
        if (!files['video'].name && !body['video']) {
            err.message = 'Main video is not found';
            return callback(err);
        }
        if (!body.countQuestion) {
            err.message = 'Question  is not found';
            return callback(err);
        }
        if (!body['video'] && files['video'].name && formatsVideo.indexOf(mainVideoExt) == -1) {
            err.message = 'Main video format is not support';
            return callback(err);
        }
        if (!REG_EXP.EMAIL_REGEXP.test(body.email)) {
            err.message = 'Email validation failed';
            return callback(err);
        }

        for (var i = body.countQuestion; i > 0; i--) {
            videoName = 'video' + i;
            pdfName = 'file' + i;
            questionName = 'question' + i;
            videoExt = (files[videoName].originalFilename.split('.')).pop().toLowerCase();

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

            if (!body[videoName] && files[videoName] && formatsVideo.indexOf(videoExt) == -1) {
                err.message = 'Survey video format is not support';
                return callback(err);
            }
        }

        if (!files['logo'].name) {
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
        var saveMainVideoUri;
        var saveLogoUri;

        upFile(url, files['video'], function (err, mainVideoUri) {
            if (err) {
                return callback(err);
            }
            upFile(url, files['logo'], function (err, logoUri) {
                if (err) {
                    return callback(err);
                }
                saveMainVideoUri = mainVideoUri.replace('public' + sep, '');
                saveLogoUri = logoUri.replace('public' + sep, '');
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
        var saveVideoUri;
        var insSurvey;
        var sep = path.sep;
        var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString() + sep + 'survey' + num;

        if (files[name].name) {
            upFile(url, files[name], function (err, videoUri) {
                if (err) {
                    return callback(err);
                }
                saveVideoUri = videoUri.replace('public' + sep, '');
                insSurvey = {
                    question: data[question],
                    videoUri: saveVideoUri
                };
                ContentModel.findByIdAndUpdate(id, {$addToSet: {survey: insSurvey}}, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null)
                });
            });
        } else {
            insSurvey = {
                question: data[question],
                videoUri: data[name]
            };
            mkdirSync(url);
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
        var url;


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
        url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString() + sep + 'survey' + num + sep + 'pdf';

        async.each(arr, function (file, eachCb) {
            upFile(url, file, function (err, pdfUri) {
                if (err) {
                    return eachCb(err);
                }
                var name = file.originalFilename.split(sep).pop().slice(0, -4) + '.png';

                pdfutils(file.path, function (err, doc) {
                    doc[0].asPNG({maxWidth: 500, maxHeight: 1000}).toFile(url + sep + name);
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
                mainCallback();
            }
        });
    };


    this.upload = function (req, res, next) {
        var data = req.body;
        var files = req.files;
        var userId = req.session.uId;
        var sep = path.sep;
        var id;
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

                function (waterfallCb) {
                    ContentModel.findOne({ownerId: userId}, function (err, doc) {
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
                            ownerId: userId,
                            name: data.name,
                            email: data.email,
                            phone: data.phone,
                            mainVideoDescription: data.desc
                        };
                        waterfallCb(null, insObj);
                    });
                },

                // create content model
                function (insObj, waterfallCb) {
                    var content = new ContentModel(insObj);
                    content.save(function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        var url = process.env.HOME_PAGE + result._id + '/{{ctid}}';
                        res.status(201).send({url: url});
                        waterfallCb(null, result);
                    });
                },

                // update user => set contentId
                function (result, waterfallCb) {
                    id = result._id;
                    UserModel.findByIdAndUpdate(userId, {$set: {contentId: result._id}}, function (err, user) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null);
                    });
                },

                // save data staff
                function (waterfallCb) {
                    async.series([
                        function (seriesCb) {
                            if (files['video'].name) {
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
                    //return next(err);
                    return console.error(err);
                }
                //res.status(201).send({url: url});
                console.log('success upload. url ' + url);
            });
    };

    this.sendWeekly = function (req, res, next) {
        var contentId = req.query.contentId;

        console.log('weekly report start');
        var now = new Date(Date.now());
        var to = new Date(now.setHours(24));
        var from = new Date(moment(to).subtract(7, 'days').format());
        console.log(to);
        console.log(from);

        ContentModel.find({_id: contentId}, function (err, docs) {
            if (err) {
                return console.error(err);
            }
            async.each(docs, function (doc, eachCb) {
                async.parallel({
                    visits: function (parallelCb) {
                        analytic.totalVisits(doc.ownerId.toString(), from, to, parallelCb);
                    },
                    videos: function (parallelCb) {
                        analytic.video(doc.ownerId.toString(), from, to, parallelCb);
                    },
                    questions: function (parallelCb) {
                        analytic.question(doc.ownerId.toString(), from, to, parallelCb);
                    },
                    documents: function (parallelCb) {
                        analytic.document(doc.ownerId.toString(), from, to, parallelCb);
                    }
                }, function (err, options) {
                    if (err) {
                        return console.error(err);
                    }
                    options.companyName = doc.name;
                    options.companyEmail = doc.email;
                    options.companyLogo = doc.logoUri;
                    mailer.sendWeeklyAnalytic(options, eachCb)
                });
            }, function (err) {
                if (err) {
                    return console.error(err);
                }
                res.status(200).send('Notifications successfully sent');

            });
        });
    };

        this.sendDaily = function (req, res, next) {

                        var data = {
                            companyName: "myName",
                            companyEmail: "slavik990@gmail.com",
                            name: "myName",
                            email:  "slavik990@gmail.com",
                            documents: [{document:"myDoc1"},{document:"myDoc2"}],
                            videos: [
                                {
                                    video:"myVirde1",
                                    end:true,
                                    stopTime:123
                                },
                                {
                                    video:"myVirde1",
                                    end:true,
                                    stopTime:123
                                }

                            ],
                            questions: [
                                {
                                    question:"myVirde1",
                                    item:123
                                },
                                {
                                    question:"myVirde1",

                                    item:123
                                }

                            ]
                        };
                        mailer.sendTrackInfo(data);

               res.status(200).send('Notifications successfully sent');

    }
};

module.exports = routeHandler;