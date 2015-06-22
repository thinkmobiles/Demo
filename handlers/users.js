'use strict';

var CONSTANTS = require('../constants/index');

var async = require('async');
var crypto = require("crypto");
var mongoose = require('mongoose');
var http = require('http');
var request = require('request');
var REG_EXP = require('../constants/regExp');

var badRequests = require('../helpers/badRequests');
//var pdfutils = require('pdfutils').pdfutils;

var LocalFs = require( './fileStorage/localFs' )();
var localFs = new LocalFs();
var path = require('path');
var fs = require('fs');
var Jumplead= require('../helpers/jumplead');


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
    var self = this;

    function normalizeEmail(email) {
        return email.trim().toLowerCase();
    };

    function validateSignUp(userData, callback) { //used for signUpMobile, signUpWeb;
        var errMessage;

        if (!userData || !userData.email || !userData.firstName || !userData.lastName||!userData.userName) {
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

    this.login = function (req, res, next) {
        var options = req.body;
        if(!options.userName || !options.pass)
          return  res.status(401).send({ error: "Username and password is required"});

        var userName = options.userName;
        var pass = getEncryptedPass(options.pass);
        UserModel.findOne({userName: userName}, function (err, user) {
            if(err) {
                return next(err);
            }

            if(!user){
              return  res.status(500).send({error: "Can\'t find User"});
            }

            if(user.pass === pass ){
               return res.status(200).send({
                    success: "Login successful",
                    user: user
                 });
            } else{
               return res.status(401).send({ error: "Incorrect password" });
            }
        });
    };

    this.signUp = function (req, res, next) {
        var options = req.body;
        var pass = options.pass;
        options.pass = getEncryptedPass(pass);
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
            }], function (err) {
            if (err) {
                return next(err);
            }

            res.status(201).send({
                success: 'Success signUp',
                message: 'Thank you for register.'
            });
        });
    };

    this.prospectSignUp = function (req, res, next) {
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

            //create prospect:
            function (cb) {
                createProspect(options, function (err, user) {
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


    this.company = function (req, res, next) {
    var id = req.params.id;
        ContentModel.findById(id, function (err, found) {
            if (err) {
               return  next(err);
            }
            res.status(200).send(found);
        });
    };

    function refreshToken (userId, accessToken, refreshToken, callback){
        request.get({
            url: 'https://app.jumplead.com/api/v1/contacts',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            }
        }, function (error, response, body) {
            if (!body.data || error) {
                request.post({
                    url: 'https://account.mooloop.com/oauth/access_token',
                    headers: {
                        'content-type': 'application/json'
                    },
                    form: {
                        code: code,
                        client_id: "FcDOCBsnZ2TtKbHTGULY",
                        client_secret: "sCkxGw1dWL4j1QrOnNmT6ZOv9feBqFhUbe1uTg4Y",
                        refresh_token: refreshToken,
                        redirect_uri: "http://demo.com:8838/redirect",
                        grant_type: "refresh_token"

                    }
                }, function (error, response, body1) {
                    try {
                        body1 = JSON.parse(body1);
                    } catch (e) {
                    }
                    var accessToken = body1.access_token;
                    var refreshToken = body1.refresh_token;
                    UserModel.findByIdAndUpdate(userId, {$set: {
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    }}, function (err, foundUser) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null);
                    });
                });
            }else{
              return  callback(null);
            }
        });
    };

//ToDo: use async
    // url = '/:contentId/:ctid'
    this.getMainVideo = function (req, res, next) {
        var contentId = req.params.comId;
        var prospectId = req.params.ctid;
        var content;
        var data;

            ContentModel.findById(contentId, function (err, foundContent) {
                if (err) {
                    return next(err);
                }
                content = foundContent;

                UserModel.findById(content.userId , function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    jumplead.getContact(user._id, prospectId, function (err, prospect) {
                        if(err){
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
        };

    this.trackQuestion = function (req, res, next) {
        var data = req.body;
        var userId = req.body.userId;
        var companyId = req.body.companyId;
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
        var userId = req.body.userId;
        var companyId = req.body.companyId;
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

    this.trackVideo = function (req, res, next) {
        var body = req.body;
        var userId = body.userId;
        var companyId = body.companyId;
        TrackModel.findOneAndUpdate({
            "userId": userId,
            "companyId": companyId
        }, {$add: {documents: data}}, function (err) {
            if (err) {
                return next(err);
            }
            res.status(200).send("Successful update");

        });
    };

    this.testTrackVideo = function (req, res, next) {
        var body = req.body;
        //var userId = body.userId;
        var companyId = body.companyId;
        var data = body.data;
        console.log('companyId ' +companyId);
        //console.log('userId ' +userId);
        console.log('data ' +data.videoId);
        CompanyModel.find({},function(err, found){
            console.log(found);
            res.status(200).send({
                body: data,
                //userId: userId,
                companyId:companyId
            });

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
                    var saveMainVideoUri = mainVideoUri.replace('public'+sep, '');
                    var saveLogoUri = logoUri.replace('public'+sep, '');
                    CompanyModel.findByIdAndUpdate(id, {$set: {mainVideoUri: saveMainVideoUri, logoUri: saveLogoUri}},
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
            var saveVideoUri = videoUri.replace('public'+sep, '');
            var insSurvey = {
                question: data[question],
                videoUri: saveVideoUri
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
                //-----------------------------------------------------------------
              /*  pdfutils(file.path, function(err, doc) {
                    doc[0].asPNG({maxWidth: 200, maxHeight: 300}).toFile(url+sep+file.originalFilename.split(sep).pop().slice(0, -4));
                });*/
                //-----------------------------------------------------------------
                var savePdfUri = pdfUri.replace('public'+sep, '');
                CompanyModel.findOneAndUpdate({
                    "_id": id,
                    "survey.question": data[question]
                }, {$addToSet: {"survey.$.pdfUri": savePdfUri}}, function (err, company) {
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
                               } var saveLogoUri = logoUri.replace('public'+sep, '');
                                   CompanyModel.findByIdAndUpdate(id, {$set: {mainVideoUri: data.video, logoUri: saveLogoUri}},
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
                  var url = process.env.HOST+ '/#/home/'+id+'/{{ctid}}';
                   res.status(201).send({_id: id, url: url});
                   console.log("url: "+url);
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
    //"https://account.mooloop.com/oauth/authorize?response_type=code&client_id=FcDOCBsnZ2TtKbHTGULY&redirect_uri=http://demo.com:8838/redirect&scope=jumplead.contacts"


    this.redirect = function (req, res, next) {
        var code = req.query.code;
        jumplead.getToken(code, userId, function () {
            if(err){
                next(err)
            }
            res.redirect('/#/registration');
        });
    };


};

module.exports = routeHandler;