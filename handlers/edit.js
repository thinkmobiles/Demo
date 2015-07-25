'use strict';


var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
var LocalFs = require('./fileStorage/localFs')();
var localFs = new LocalFs();
var path = require('path');

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


    this.updateContent = function (req, res, next) {
        var userId = req.session.uId;
        var content;
        var data = req.body;
        var files = req.files;
        var sep = path.sep;
        var delSurvey = data.removedQuestions.split(' ');
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
                        var dir = localFs.defaultPublicDir + sep + 'video' + sep + id.toString()+ sep + 'survey'+num;
                        //rmDir(dir);
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
                res.status(200).send({message: 'Success modified'})
            });
    };
};

module.exports = routeHandler;