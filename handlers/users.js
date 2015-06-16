'use strict';

var CONSTANTS = require('../constants/index');

var async = require('async');
var crypto = require("crypto");
var mongoose = require('mongoose');
var http = require('http');
var querystring = require('querystring');
var request = require('request');
var REG_EXP = require('../constants/regExp');

var badRequests = require('../helpers/badRequests');
var tokenGenerator = require('../helpers/randomPass');
var logWriter = require('../helpers/logWriter')();

var mailer = require('../helpers/mailer');

var SessionHandler = require('./sessions');

var LocalFs = require( './fileStorage/localFs' )();
var localFs = new LocalFs();
var path = require('path');
var fs = require('fs');

var UserHandler = function (db) {
    var session = new SessionHandler(db);


    var prospectSchema = mongoose.Schemas['Prospect'];
    var ProspectModel = db.model('Prospect', prospectSchema);
    var deviceSchema = mongoose.Schemas['Device'];
    var DeviceModel = db.model('Device', deviceSchema);
    var tariffPlanSchema = mongoose.Schemas['TariffPlan'];
    var TariffPlan = db.model('TariffPlan', tariffPlanSchema);
    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var companySchema = mongoose.Schemas['Company'];
    var CompanyModel = db.model('Company', companySchema);
    var self = this;

    function normalizeEmail(email) {
        return email.trim().toLowerCase();
    };

    function validateSignUp(userData, callback) { //used for signUpMobile, signUpWeb;
        var errMessage;

        if (!userData || !userData.email || !userData.firstName || !userData.lastName) {
            return callback(badRequests.NotEnParams({reqParams: ['email', 'pass', 'firstName', 'lastName']}));
        }

        if (userData.firstName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
            errMessage = 'First name cannot contain more than ' + CONSTANTS.USERNAME_MAX_LENGTH + ' symbols';
            return callback(badRequests.InvalidValue({message: errMessage}));
        }

        if (userData.lastName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
            errMessage = 'Last name cannot contain more than ' + CONSTANTS.PASS_MIN_LENGTH + ' symbols';
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

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    };

    function checkCaptcha(params, callback) {
        if (!params.captchaChallenge || !params.captchaResponse || !params.ip) {
            return callback(badRequests.CaptchaError());
        }

        var captchaVerifyData = querystring.stringify({
            privatekey: process.env.RECAPTCHA_PRIVATE_KEY,
            remoteip: params.ip,
            challenge: params.captchaChallenge,
            response: params.captchaResponse
        });

        var options = {
            hostname: 'www.google.com',
            path: '/recaptcha/api/verify',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            port: 80
        };

        var httpRequest = http.request(options, function (response) {
            response.setEncoding('utf8');

            if (response.statusCode !== 200) {
                return callback(badRequests.CaptchaError());
            }

            response.on('data', function (chunk) {
                if (chunk.indexOf('true') === -1) {
                    return callback(badRequests.CaptchaError());
                }
                callback(null, true);
            });
        });

        httpRequest.on('error', function (err) {
            callback(err);
        });
        httpRequest.write(captchaVerifyData);
        httpRequest.end();

    };

    function createUser(userData, callback) {

        //create user:
        var newUser = new ProspectModel(userData);
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

    function updateUserProfile(userId, options, callback) {
        var update = options;
        var criteria = {
            _id: userId
        };

        ProspectModel.findOneAndUpdate(criteria, update, function (err, user) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
            } else if (!user) {
                if (callback && (typeof callback === 'function')) {
                    callback(badRequests.NotFound());
                }
            } else {
                if (callback && (typeof callback === 'function')) {
                    callback(null, user);
                }
            }
        });
    };

    function signInWeb(req, res, next) {
        var options = req.body;
        var email = options.email;
        var encryptedPass;
        var query;
        var fields;

        if (!email || !options.pass) {
            return next(badRequests.NotEnParams({reqParams: ['email', 'pass']}));
        }

        email = normalizeEmail(email);
        encryptedPass = getEncryptedPass(options.pass);
        query = {
            email: email,
            pass: encryptedPass
        };
        fields = {
            pass: false
        };

        ProspectModel.findOne(query, fields, function (err, user) {
            var sessionParams;

            if (err) {
                return next(err);
            }

            if (!user) {
                return next(badRequests.SignInError());
            }

            if (user && user.confirmToken) {
                return next(badRequests.UnconfirmedEmail());
            }

            sessionParams = {
                rememberMe: options.rememberMe
            };

            session.register(req, res, user, sessionParams);

        });

    };

    function signInMobile(req, res, next) {
        var options = req.body;

        if (!options.minderId || !options.deviceId) {
            return next(badRequests.NotEnParams({reqParams: ['minderId', 'deviceId']}));
        }

        ProspectModel.findOne({
            minderId: options.minderId
        }, function (err, user) {

            if (err) {
                return next(err);
            }

            if (!user) {
                return next(badRequests.SignInError({message: 'Incorrect Minder ID'}));
            }

            if (user && user.confirmToken) {
                return next(badRequests.UnconfirmedEmail());
            }

            DeviceModel
                .findOne({
                    deviceId: options.deviceId
                }, function (err, device) {
                    var deviceData;

                    if (err) {
                        return next(err);
                    } else if (device) {

                        if (device.user.toString() === user._id.toString()) {
                            session.register(req, res, user, {rememberMe: true});
                        } else {
                            next(badRequests.AccessError());
                        }

                    } else {
                        //create device;
                        deviceData = deviceHandler.prepareDeviceData(options);
                        deviceData.deviceType = deviceHandler.getDeviceOS(req);

                        deviceHandler.createDevice(deviceData, user, function (err) {

                            if (err) {
                                return next(err);
                            }

                            session.register(req, res, user, {rememberMe: true});
                        });
                    }
                });

        });
    };


    this.signUp = function (req, res, next) {
        var options = req.body;

        async.series([

            //validation:
            function (cb) {
                validateSignUp(options, function (err) {
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

                    cb(null, user);
                });
            }

        ], function (err) {
            if (err) {
                return next(err);
            }

            res.status(201).send({
                success: 'success signUp',
                message: 'Thank you for register. Please check your email and verify account'
            });
        });
    };

    this.signIn = function (req, res, next) {
        var options = req.body;

        if (options.email && options.pass) {
            signInWeb(req, res, next);
        } else if (options.minderId && options.deviceId) {
            signInMobile(req, res, next);
        } else {
            return next(badRequests.NotEnParams({}));
        }
    };
    this.getCompany = function (req, res, next) {
    var id = req.params.id;
        CompanyModel.findById(id, function (err, found) {
            if (err) {
                next(err);
            }
            res.status(200).send(found);
        });

    };
    this.trackQuestion = function (req, res, next) {
        var data = req.body;
        var userId = req.query.userId;
        var companyId = req.query.companyId;
        TrackModel.findOneAndUpdate({
            "userId": userId,
            "companyId": companyId
        }, {$set: {questions: data.questions}}, function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).send("Successful update");

        });
    };
    this.trackDocument = function (req, res, next) {
        var data = req.body;
        var userId = req.query.userId;
        var companyId = req.query.companyId;
        TrackModel.findOneAndUpdate({
            "userId": userId,
            "companyId": companyId
        }, {$addToSet: {documents: data}}, function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).send("Successful update");

        });
    };



    this.track = function (req, res, next) {
            var data = req.body;
            var newTrack = new TrackModel(data);
        newTrack.save(function (err, result) {
            if (err) {
                console.log(err);
                res.status(423).send('somth wrong');
            }
            //res.redirect('/#home');
            res.status(201).send(result);
        });

    };

    function upFile(target, file, callback) {
        fs.readFile(file.path, function (err, data) {
            localFs.setFile(target, file.originalFilename, data, function (err) {
                if (err){
                    return callback(err);
                }
                var uri = path.join(target, file.originalFilename);
                return callback(null, uri);
            });
        });
    };
        function validation (data, callback){
            var files = data.files;
            var body = data.body;
            var formatsVideo = '.mp4 .WebM .Ogg';
            var formatsImage = '.jpg .bmp .png .ico';
            var mainVideoExt = (files['video'].originalFilename.split('.')).pop().toLowerCase();
            console.log(mainVideoExt);

            if(!body.contact || !body.desc|| !body.name) return callback(new Error('Not  completed fields'));
            if(!files['video'] && body['video']) return callback(new Error('Main video is not found'));
            if(!body.countQuestion) return callback(new Error('Question  is not found'));
            if (!!files['video'] && formatsVideo.indexOf(mainVideoExt) == -1) return callback( new Error('Main video format is not support'));

            for(var i=body.countQuestion; i>0; i--){
                var videoName = 'video' + i;
                var pdfName = 'file' + i;
                var questionName = 'question' + i;
                var videoExt = (files[videoName].originalFilename.split('.')).pop().toLowerCase();

                async.each(files[pdfName], function (file, cb) {
                    var pdfExt = (file.originalFilename.split('.')).pop().toLowerCase();
                    if(pdfExt !='pdf'){
                        return cb(new Error('Survey pdf files format is not support'));
                    }
                    else cb();
                });
                if(!files[videoName] && !body[videoName]) return callback(new Error('Survey video is not found'));
                if(!body[questionName]) return callback(new Error('Survey question is not found'));
                //typeValidation
                if (!!files[videoName] && formatsVideo.indexOf(videoExt) == -1) return callback( new Error('Survey video format is not support'));
            }

            if(!files['logo'])return callback(new Error('Logo is not found'));
            var logoExt = (files['logo'].originalFilename.split('.')).pop().toLowerCase();
            if(formatsImage.indexOf(logoExt) == -1)return callback(new Error('Logo is not found'));
            return callback( null);
        };




    function saveMainVideo(id, files, callback) {
            var sep = path.sep;
            var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString();

            upFile(url, files['video'], function (err, mainVideoUri) {
                if (err) {
                    return callback(err);
                }

                var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString();
                upFile(url, files['logo'], function (err, logoUri) {
                    if (err) {
                        return callback(err);
                    }

                    CompanyModel.findByIdAndUpdate(id, {$set: {mainVideoUri: mainVideoUri, logoUri: logoUri}},
                        function (err, company) {
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

        if (!!files[name]){
            var sep = path.sep;
            var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString() + sep + 'survey' + num;

        upFile(url, files[name], function (err, videoUri) {
            if (err) {
                callback(err);
            }
            var insSurvey = {
                question: data[question],
                videoUri: videoUri
            };
            CompanyModel.findByIdAndUpdate(id, {$addToSet: {survey: insSurvey}}, function (err) {
                if (err) {
                    callback(err);
                }
                callback(null)
            });
        });
    } else {
            var insSurvey = {
                question: data[question],
                videoUri: data[name]
            };
            CompanyModel.findByIdAndUpdate(id, {$addToSet: {survey: insSurvey}}, function (err) {
                if (err) {
                    callback(err);
                }
                callback(null)
            });
        }


    };

    function saveSurveyFiles(num, id, files, data, cb) {
        var question = 'question'+num;
        var name = 'file'+num;
        var sep = path.sep;
        var arr = [];
        if (!files[name]){
            return cb(err);
        }
        if (!files[name].length) {
            arr.push(files[name]);
        }
        else {
            arr = files[name];
        }
        var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString() + sep + 'survey'+num + sep + 'pdf';
        async.each(arr, function (file, callback) {
            upFile(url, file, function (err, pdfUri) {
                if (err) {
                  return  callback(err);
                }
                CompanyModel.findOneAndUpdate({
                    "_id": id,
                    "survey.question": data[question]
                }, {$addToSet: {"survey.$.pdfUri": pdfUri}}, function (err, company) {
                    if (err) {
                        return callback(err);
                    }
                    callback();
                });
            });
        }, function (err) {
            if (err) {
                return cb (err); //TODO: callback
            }
            cb();
        });
    };


    //========================================================
    this.upload = function (req, res, next) {
        validation (req, function(err){
            if(err) return next (err);

            var data = req.body;
            var files = req.files;

            var insObj = {
                name: data.name,
                contactMeInfo: data.contact,
                mainVideoDescription: data.desc
            };

            var newCompany = new CompanyModel(insObj);
            newCompany.save(function (err, result) {
                if (err){
                  return  next(err);
                }
                var id = result._id;

               async.series([
                   function (cb) {
                       if (!!files['video']){
                         saveMainVideo(id, files, cb);
                       }
                       else {
                           var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString();
                           upFile(url, files['logo'], function (err, logoUri) {
                               if (err) {
                                   return callback(err);
                               }
                                   CompanyModel.findByIdAndUpdate(id, {$set: {mainVideoUri: data.video, logoUri: logoUri}},
                                       function (err) {
                                           if (err) {
                                               return callback(err);
                                           }
                                           callback(null);
                                       });
                             });
                       }
                   },
                   function (cb) {
                       for(var i=data.countQuestion; i>0; i--){
                           async.applyEachSeries([saveSurveyVideo, saveSurveyFiles ],i, id, files, data, function () {
                               if(err) return cb(err);
                           });
                       }
                       cb();

                   }], function (err) {
                   if (err) {
                       return next(err);
                   }
                   res.status(201).send({_id: id});
               });
            });
            localFs.defaultPublicDir = 'public';
        });
    };


    this.confirmEmail = function (req, res, next) {
        var confirmToken = req.params.confirmToken;
        var condition = {
            confirmToken: confirmToken
        };
        var update = {
            confirmToken: null
        };

        ProspectModel.findOneAndUpdate(condition, update, function (err, userModel) {
            if (err) {
                //return self.renderError(err, req, res);
                return next(err);
            }

            if (!userModel) {
                //return self.renderError(badRequests.NotFound(), req, res);
                return next(badRequests.NotFound());
            }

            //res.render('successConfirm');
            res.status(200).send({success: 'success confirmed'});

        });

    };

    this.getUserById = function (userId, options, callback) {
        var query = {
            _id: userId
        };
        var fields = {
            pass: false
        };

        ProspectModel.findOne(query, fields, function (err, user) {

            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
                return;
            }

            if (!user) {
                if (callback && (typeof callback === 'function')) {
                    callback(badRequests.NotFound());
                }
                return;
            }

            if (callback && (typeof callback === 'function')) {
                callback(null, user);
            }

        });

    };

    this.getCurrentUser = function (req, res, next) {
        var userId = req.session.userId;

        self.getUserById(userId, null, function (err, user) {
            if (err) {
                next(err);
            } else {
                res.status(200).send(user);
        }
        });
    };

    this.redirect = function (req, res, next) {
        var code = req.query.code;
        console.log(req.query);

        request.post({
            url:'https://account.mooloop.com/oauth/access_token',
            headers: {
                'content-type': 'application/json'
            },
            form: {
                code: code,
                client_id: "FcDOCBsnZ2TtKbHTGULY",
                client_secret: "KMdpjWHOQ1EKcuUGNQcpraGpN8e2qc34VhFWAGtB",
                redirect_uri:"http://demo.com:8877/redirect",
                grant_type: "authorization_code"

            }
        }, function(error, response, body1) {
            console.log(body1.access_token);
            try {
                body1 = JSON.parse(body1);
            }catch (e){}
            request.get({
                url: 'https://app.jumplead.com/api/v1/contacts',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + body1.access_token
                }
               /* ,json: {
                    "grant_type": "client_credentials",
                    "data": {
                        "first_name": "Irvin",
                        "last_name": "Colenski",
                        "email": "faspert@meta.com"
                    }*/

            }, function (error, response, body2) {
                console.log('response from create contacts: '+body2);
                console.log('response : '+JSON.stringify(response));
                console.log('error : '+error);
            });
        });
        res.redirect('/#home');
    };

    this.updateCurrentUserProfile = function (req, res, next) {
        var userId = req.session.userId;
        var options = req.body;
        var password = options.password;
        var newPassword = options.newPassword;
        var updateData = {};
        var errMessage = '';

        if (options.firstName) {
            if (options.firstName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
                errMessage = 'First name cannot contain more than ' + CONSTANTS.USERNAME_MAX_LENGTH + ' symbols';
                return next(badRequests.InvalidValue({message: errMessage}));
            }
            updateData.firstName = options.firstName;
        }

        if (options.lastName) {
            if (options.lastName.length > CONSTANTS.USERNAME_MAX_LENGTH) {
                errMessage = 'Last name cannot contain more than ' + CONSTANTS.PASS_MIN_LENGTH + ' symbols';
                return next(badRequests.InvalidValue({message: errMessage}));
            }
            updateData.lastName = options.lastName;
        }

        if (options.email) {
            if (!REG_EXP.EMAIL_REGEXP.test(options.email)) {
                return next(badRequests.InvalidEmail());
            }
            updateData.email = options.email;
        }

        if (newPassword || password) {
            if (!newPassword || !password) { //most exists booth (password && newPassword) params
                return next(badRequests.NotEnParams({reqParams: ['password', 'newPassword']}));
            }

            if (newPassword.length < CONSTANTS.PASS_MIN_LENGTH) {
                errMessage = 'Password cannot contain less than ' + CONSTANTS.PASS_MIN_LENGTH + ' symbols';
                return next(badRequests.InvalidValue({message: errMessage}));
            }

            if (newPassword.length > CONSTANTS.PASS_MAX_LENGTH) {
                errMessage = 'Password cannot contain more than ' + CONSTANTS.PASS_MAX_LENGTH + ' symbols';
                return next(badRequests.InvalidValue({message: errMessage}));
            }
        }

        async.series([

            //check newPassword and modify the updateData:
            function (cb) {

                if (newPassword) {

                    ProspectModel.findOne({ // find a user to compare user's password ws options.password
                        _id: userId
                    }, function (err, user) {
                        if (err) {
                            return cb(err);
                        } else if (!user) {
                            return cb(badRequests.NotFound());
                        }

                        if (user.pass !== getEncryptedPass(password)) { //compare user's password ws options.password
                            return cb(badRequests.InvalidValue({message: 'Incorrect password'}));
                        }

                        updateData.pass = getEncryptedPass(newPassword); // encrypt new password and add to updateData:

                        cb();
                    });

                } else {
                    cb();
                }
            },

            //update profile data (firstName, lastName, email). Pass was checked in previous function;
            function (cb) {
                updateUserProfile(userId, updateData, function (err, user) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, user);
                });
            }

        ], function (err, result) {
            if (err) {
                return next(err);
            }
            res.status(200).send({success: 'updated', model: result[1]});
        });

    };

    this.forgotPassword = function (req, res, next) {
        var email = req.body.email;
        var criteria = {
            email: email
        };

        if (!email) {
            return next(badRequests.NotEnParams({reqParams: ['email']}));
        }

        ProspectModel.findOne(criteria, function (err, user) {
            if (err) {
                return next(err);
            } else if (!user) {
                return res.status(200).send({success: 'updated'});
            } else {
                user.forgotToken = tokenGenerator.generate();
                user.save(function (err, userModel) { // save changes and send email
                    if (err) {
                        return next(err);
                    }

                    mailer.forgotPassword(userModel);

                    res.status(200).send({success: 'updated'});
                });
            }
        });

    };

    this.resetPassword = function (req, res, next) {
        var token = req.body.token;
        var password = req.body.password;

        if (!token || !password) {
            return next(badRequests.NotEnParams({reqParams: ['token', 'password']}));
        }

        ProspectModel.findOne({
            forgotToken: token
        }, function (err, user) {
            if (err) {
                return next(err);
            } else if (!user) {
                return next(badRequests.NotFound());
            } else {
                user.pass = getEncryptedPass(password);
                user.forgotToken = null;
                user.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send({success: 'updated'});
                });
            }
        });
    };

};

module.exports = UserHandler;