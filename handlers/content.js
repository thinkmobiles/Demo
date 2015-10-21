'use strict';


var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
var LocalFs = require('./fileStorage/localFs')();
var localFs = new LocalFs();
var path = require('path');
var REG_EXP = require('../constants/regExp');
var pdfutils = '';// require('pdfutils').pdfutils;
var badRequests = require('../helpers/badRequests');
var fs = require('fs');
var routeHandler = function (db) {

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);

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


    this.content = function (req, res, next) {
        ContentModel.findOne({ownerId: req.session.uId}, function (err, found) {
            if (err) {
                return next(err);
            }
            console.log(found);
            if (!found) {
                return res.status(404).send({err: 'Content Not Found'});
            }
            var url = process.env.WEB_HOST+'/campaign/' + found._id + '/{{ctid}}';
            res.status(201).send({url: url, content:found});
        });
    };

    this.upload = function (req, res, next) {
        var data = req.body;
        var files = req.files;
        var userId = req.session.uId;
        var sep = path.sep;
        var content;
        var insObj;
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
                        insObj = {
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
                    content = new ContentModel(insObj);
                    content.save(function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        var url = process.env.WEB_HOST+'/campaign/' + result._id + '/{{ctid}}';
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

                            //ToDo: optimization!!!
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
                                    return seriesCb(err)
                                }
                                seriesCb(null);
                            });

                        }], function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        var url = process.env.WEB_HOST+'/campaign/' + id + '/{{ctid}}';
                        waterfallCb(null, url)
                    });
                    localFs.defaultPublicDir = 'public';
                }],

            function (err, url) {
                if (err) {
                    return console.error(err);
                }
                console.log('success upload. url ' + url);
            });
    };

    this.remove = function (req, res, next) {
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


    this.update = function (req, res, next) {
        var userId = req.session.uId;
        var content;
        var data = req.body;
        var files = req.files;
        var sep = path.sep;
        var delSurvey = data.removedQuestions?data.removedQuestions.split(' '):[];
        var id;
        var url;

        async.waterfall([
            function (waterfallCb) {
                //validation
                waterfallCb(null);
            },

            function (waterfallCb) {
                var obj = {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    mainVideoDescription: data.desc
                };
                ContentModel.findOneAndUpdate({ownerId: userId}, obj, function (err, doc) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    content = doc;
                    id = doc._id;
                    waterfallCb(null)
                });
            },

            //update main video
            function (waterfallCb) {
                var updateMainVideoUri;

                if (!data.video && !files.video.name) {
                    return waterfallCb(null);
                } else if (data.video) {
                    updateMainVideoUri = data.video;
                    ContentModel.findByIdAndUpdate(id, {mainVideoUri: updateMainVideoUri}, function (err, doc) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        return waterfallCb(null)
                    });
                } else if (files.video.name) {
                    try {
                        fs.unlinkSync(localFs.defaultPublicDir+sep+content.mainVideoUri);
                    }catch(e){
                        console.log(e);
                    }
                    url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString();
                    upFile(url, files['video'], function (err, mainVideoUri) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        updateMainVideoUri = mainVideoUri.replace('public' + sep, '');
                        ContentModel.findByIdAndUpdate(id, {mainVideoUri: updateMainVideoUri}, function (err, doc) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            return waterfallCb(null)
                        });
                    });
                }
            },

            //update logo video
            function (waterfallCb) {
                var updateLogoUri;

                if (!files.logo.name) {
                    return waterfallCb(null);
                }
                try {
                    fs.unlinkSync(localFs.defaultPublicDir + sep + content.logoUri);
                }catch(e){
                    console.log(e);
                }
                url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString();
                upFile(url, files['logo'], function (err, logoUri) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    updateLogoUri = logoUri.replace('public' + sep, '');
                    ContentModel.findByIdAndUpdate(id, {logoUri: updateLogoUri}, function (err, doc) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        return waterfallCb(null)
                    });
                });
            },

            //delete survey video
            function (waterfallCb) {
                if(!delSurvey.length){
                    return waterfallCb(null);
                }
                async.each(delSurvey, function(num, eachCb){
                    num= parseInt(num);
                    var arr = content.survey[num].videoUri.split(sep);
                    var dir = localFs.defaultPublicDir + sep + 'video' + sep + id.toString() + sep + arr[arr.length - 2];
                    rmDir(dir);
                    ContentModel.findByIdAndUpdate(id, {$pull: {survey:{question: content.survey[num].question}}}, function (err, doc) {
                        if(err){
                            return eachCb(err);
                        }
                        eachCb(null);
                    });
                },function(err){
                    if(err){return waterfallCb(err);
                    }
                    waterfallCb(null);
                });
            },

            function (waterfallCb) {
                if(data.countQuestion==data.countQuestion)
                    var index = [];
                for (var i = data.countQuestion; i > content.survey.length; i--) {
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
                        return waterfallCb(err);
                    }
                    waterfallCb(null);
                });
            }], function (err) {
            if (err) {
                return next(err)
            }
            var url = process.env.HOME_PAGE + id.toString() + '/{{ctid}}';
            res.status(200).send({url: url});
        });
    };
};

module.exports = routeHandler;