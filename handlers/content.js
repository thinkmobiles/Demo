'use strict';


var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
var LocalFs = require('./fileStorage/localFs')();
var localFs = new LocalFs();


var AwsStorage = require('./fileStorage/aws')();
var awsStorage = new AwsStorage();


var path = require('path');
var REG_EXP = require('../constants/regExp');
var pdfutils = require('pdfutils').pdfutils;
var badRequests = require('../helpers/badRequests');
var fs = require('fs');
var routeHandler = function (db) {
    var S3_BUCKET = 'demo-rocket-v2';

    var S3_ENDPOINT = 'https://s3-us-west-2.amazonaws.com/';

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);


    function saveSurveyVideo(num, id, files, data, callback) {
        var question = 'question' + num;
        var name = 'video' + num;
        var insSurvey;
        var url = id.toString() + '/survey' + num + '/';
        var videoKey = url + files[name].name;
        var videoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files[name].name);

        if (files[name].name) {
            awsStorage.postFile(S3_BUCKET, videoKey, files[name], function (err) {
                if (err) {
                    return callback(err);
                }
                insSurvey = {
                    question: data[question],
                    videoUri: videoUrl,
                    order: num
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
                videoUri: data[name],
                order: num
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
        var arr = [];
        var url;


        if (!files[name].length && (!files[name].name || !files[name].size)) {
            return mainCallback(null);
        }
        if (!files[name].length) {
            arr.push(files[name]);
        } else {
            arr = files[name];
        }
        url = id.toString() + '/survey' + num + '/pdf/';

        async.each(arr, function (file, eachCb) {
            var pdfUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(file.name);
            var pdfKey = url + file.name;

            awsStorage.postFile(S3_BUCKET, pdfKey, file, function (err) {
                if (err) {
                    return eachCb(err);
                }
                savePdfPreview(url, file);

                ContentModel.findOneAndUpdate({
                    "_id": id,
                    "survey.question": data[question]
                }, {$addToSet: {"survey.$.pdfUri": pdfUrl}}, function (err) {
                    if (err) {
                        return eachCb(err);
                    }
                    eachCb(null);
                });
            });
        }, function (err) {
            if (err) {
                return mainCallback(err);
            }
            mainCallback(null);
        });
    };

    function savePdfPreview(url, file) {
        pdfutils(file.path, function (err, doc) {
            var stream = doc[0].asPNG({maxWidth: 500, maxHeight: 1000});
            var buf = new Buffer(0, "base64");
            stream.on('data', function (data) {
                buf = Buffer.concat([buf, data]);
            });
            stream.on('end', function () {
                var key = url + file.name.slice(0, -4) + '.png';
                awsStorage.postBuffer(S3_BUCKET, key, buf, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
            });
            stream.on('error', function (err) {
                return console.error(err);
            });
        });
    }

    function saveMainVideo(id, files, mainCb) {
        var url = id.toString() + '/';
        var videoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files['video'].name);
        var logoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files['logo'].name);
        var videoKey = url + files['video'].name;
        var logoKey = url + files['logo'].name;

        async.series([
            //save video
            function (seriesCb) {
                awsStorage.postFile(S3_BUCKET, videoKey, files['video'], function (err) {
                    if (err) {
                        return seriesCb(err);
                    }
                    seriesCb(null);
                });
            },

            //save logo
            function (seriesCb) {
                awsStorage.postFile(S3_BUCKET, logoKey, files['logo'], function (err) {
                    if (err) {
                        return seriesCb(err);
                    }
                    seriesCb(null);
                });
            },

            //update DB
            function (seriesCb) {
                ContentModel.findByIdAndUpdate(id, {
                    $set: {
                        mainVideoUri: videoUrl,
                        logoUri: logoUrl
                    }
                }, function (err) {
                    if (err) {
                        return seriesCb(err);
                    }
                    seriesCb(null);
                });
            }
        ], function (err) {
            if (err) {
                return mainCb(err);
            }
            mainCb(null);
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

    function sortByKey(array, key) {
        return array.sort(function (a, b) {
            var x = a[key];
            var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    this.content = function (req, res, next) {
        ContentModel.findOne({ownerId: req.session.uId}, function (err, found) {
            if (err) {
                return next(err);
            }
            console.log(found);
            if (!found) {
                return res.status(404).send({err: 'Content Not Found'});
            }
            found.survey = sortByKey(found.survey, 'order');
            var url = process.env.WEB_HOST + '/campaign/' + found._id + '/{{ctid}}';
            res.status(201).send({url: url, content: found});
        });
    };

    this.testS3Delete = function (req, res, next) {
        awsStorage.removeFile(S3_BUCKET, '562df14d680008701f000001/Overview.mp4', null, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.testS3DeleteDir = function (req, res, next) {
        awsStorage.removeDir(S3_BUCKET, '562df14d680008701f000001', function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.testS3Move = function (req, res, next) {
        awsStorage.moveDir(S3_BUCKET, '564065e92226c4c43a000002/survey4', '564065e92226c4c43a000002/old/survey4', function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.testS3Save = function (req, res, next) {
        var files = req.files;
        awsStorage.postFile(S3_BUCKET, 'somefile2.pdf', files['pdf'], function (err, data) {
            if (err) {
                return next(err);
            }
            pdfutils(files['pdf'].path, function (err, doc) {
                var stream = doc[0].asPNG({maxWidth: 500, maxHeight: 1000});
                var buf = new Buffer(0, "base64");
                stream.on('data', function (data) {
                    buf = Buffer.concat([buf, data]);
                });
                stream.on('end', function () {
                    var key = files['pdf'].name.slice(0, -4) + '.png';
                    awsStorage.postBuffer(S3_BUCKET, key, buf, function (err) {
                        if (err) {
                            return console.error(err);
                        }
                    });
                });
                stream.on('error', function (err) {
                    return console.error(err);
                });
            });
            res.status(200).send(data);
        });
    };

    this.testS3Get = function (req, res, next) {
        var data = req.query;
        awsStorage.getFileUrl({bucket: S3_BUCKET, key: 'some%20file2.pdf'}, function (err, data) {
            if (err) {
                return next(err);
            } // an error occurred
            res.status(200).send(data);           // successful response
        });
    };

    this.testS3List = function (req, res, next) {
        var data = req.query;
        awsStorage.listFiles(S3_BUCKET, '', function (err, data) {
            if (err) {
                return next(err);
            } // an error occurred
            res.status(200).send(data);           // successful response
        });
    };

    this.upload = function (req, res, next) {
        var data = req.body;
        var files = req.files;
        var userId = req.session.uId;
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
                    ContentModel.create(insObj, function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        id = result._id;
                        var url = process.env.WEB_HOST + '/campaign/' + id + '/{{ctid}}';
                        res.status(201).send({url: url});
                        waterfallCb(null, result);
                    });
                },

                // update user => set contentId
                function (result, waterfallCb) {
                    UserModel.findByIdAndUpdate(userId, {$set: {contentId: id}}, function (err, user) {
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
                            } else {
                                var logoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files['logo'].name);
                                var logoKey = id.toString() + '/' + files['logo'].name;

                                awsStorage.postFile(S3_BUCKET, logoKey, files['logo'], function (err, data) {
                                    if (err) {
                                        return seriesCb(err);
                                    }
                                    ContentModel.findByIdAndUpdate(id, {
                                            $set: {
                                                mainVideoUri: data.video,
                                                logoUri: logoUrl
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
                                    eachCb(null);
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
                        var url = process.env.WEB_HOST + '/campaign/' + id + '/{{ctid}}';
                        waterfallCb(null, url)
                    });
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
            var dirPath = contentId.toString();
            awsStorage.removeDir(S3_BUCKET, dirPath);

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
        var delSurvey = data.removedQuestions ? data.removedQuestions.split(' ') : [];
        var surveyOrder = data.surveyOrder ? data.surveyOrder.split(' ') : [];
        var countQuestion = data.countQuestion;
        var prefix = S3_ENDPOINT + S3_BUCKET + '/';
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

                if (!data.video && !files.video.name && !files.video.size) {
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
                    var key = decodeURIComponent(content.mainVideoUri.replace(prefix, ''));
                    awsStorage.removeFile(S3_BUCKET, key, function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        url = id.toString() + '/';
                        var videoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files['video'].name);
                        var videoKey = url + files['video'].name;

                        awsStorage.postFile(S3_BUCKET, videoKey, {data: files['video']}, function (err) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            ContentModel.findByIdAndUpdate(id, {mainVideoUri: videoUrl}, function (err) {
                                if (err) {
                                    return waterfallCb(err);
                                }
                                waterfallCb(null)
                            });
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
                var key = decodeURIComponent(content.logoUri.replace(prefix, ''));
                awsStorage.removeFile(S3_BUCKET, key, function (err) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    url = id.toString() + '/';
                    var logoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files['logo'].name);
                    var logoKey = url + files['logo'].name;

                    awsStorage.postFile(S3_BUCKET, logoKey, {data: files['logo']}, function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        ContentModel.findByIdAndUpdate(id, {logoUri: logoUrl}, function (err) {
                            if (err) {
                                return waterfallCb(err);
                            }
                            waterfallCb(null)
                        });
                    });
                });
            },

            //move survey
            function (waterfallCb) {
                var count = content.survey.length;
                var iterator = 0;

                async.whilst(
                    function () {
                        return iterator <= count;
                    },
                    function (callback) {
                        iterator++;
                        var oldPrefix = 'survey' + i;
                        var newPrefix = 'temp/survey' + i;
                        awsStorage.moveDir(S3_BUCKET, oldPrefix, newPrefix, callback);
                    },
                    function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null);
                    });
            },

            function (waterfallCb) {
                if (!delSurvey.length) {
                    return waterfallCb(null);
                }
                async.each(delSurvey, function (id, eachCb) {
                    ContentModel.findByIdAndUpdate(id, {$pull: {survey: {_id: id}}}, function (err, doc) {
                        if (err) {
                            return eachCb(err);
                        }
                        eachCb(null);
                    });
                }, function (err) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null);
                });
            },

            function (waterfallCb) {
                var i = 0;
                async.whilst(
                    function () {
                        return i <= countQuestion;
                    },
                    function (whilstCb) {

                        //===============================================whilst START====================================================
                        i++;
                        if (surveyOrder[i] == 'new') {
                            async.applyEachSeries([saveSurveyVideo, saveSurveyFiles], i, id, files, data, function (err) {
                                if (err) {
                                    return whilstCb(err);
                                }
                                whilstCb(null);
                            });
                        } else {

                            var videoName = 'video' + i;
                            var pdfName = 'file' + i;
                            var questionName = 'question' + i;
                            var survey = _.find(content.survey, function (elem) {
                                return elem._id.toString() == surveyOrder[i];
                            });
                            var oldOrder = survey.order;
                            var surveyId = surveyOrder[i];

                            async.parallel([
                                function (parallelCb) {
                                    if ((files[videoName].name && files[videoName].size) || data[videoName]) {
                                        var key = decodeURIComponent(survey.replace(prefix, 'temp/'));

                                        awsStorage.removeFile(S3_BUCKET, key, function (err) {
                                            if (err) {
                                                return parallelCb(err);
                                            }
                                            ContentModel.findOneAndUpdate({
                                                "_id": id,
                                                "survey._id": surveyId
                                            }, {$unset: {"survey.$.videoUri": ''}}, function (err) {
                                                if (err) {
                                                    return parallelCb(err);
                                                }
                                                saveSurveyVideo(i, id, files, data, function (err) {
                                                    if (err) {
                                                        return parallelCb(err);
                                                    }
                                                    parallelCb(null)
                                                });
                                            });
                                        });
                                    } else {
                                        ContentModel.findOneAndUpdate({
                                            "_id": id,
                                            "survey._id": surveyId
                                        }, {$set: {"survey.$.question": data[questionName]}}, function (err) {
                                            if (err) {
                                                return parallelCb(err);
                                            }
                                            parallelCb(null);
                                        });
                                    }
                                },

                                function (parallelCb) {
                                    if (!files[pdfName].length && (!files[pdfName].name || !files[pdfName].size)) {
                                        return parallelCb(null);
                                    }

                                    var prefix = id.toString + '/temp/survey' + i + '/pdf';
                                    awsStorage.removeDir(S3_BUCKET, prefix, function (err) {
                                        if (err) {
                                            return parallelCb(err);
                                        }
                                        ContentModel.findOneAndUpdate({
                                            "_id": id,
                                            "survey._id": surveyOrder[i]
                                        }, {$unset: {"survey.$.videoUri": ''}}, function (err) {
                                            if (err) {
                                                return parallelCb(err);
                                            }
                                            saveSurveyVideo(i, id, files, data, function (err) {
                                                if (err) {
                                                    return parallelCb(err);
                                                }
                                                parallelCb(null);
                                            });
                                        });
                                    });

                                }
                            ], function (err) {
                                if (err) {
                                    return whilstCb(err);
                                }

                                var newPrefix = 'survey' + i;
                                var oldPrefix = 'temp/survey' + oldOrder;
                                awsStorage.moveDir(S3_BUCKET, oldPrefix, newPrefix, function (err) {
                                    if (err) {
                                        return whilstCb(err);
                                    }
                                    whilstCb(null);
                                });
                            });
                        }
                        //===============================================whilst END====================================================
                    },

                    function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null);
                    });
            },

            function (waterfallCb) {
                var prefix = id.toString()+'/temp';
                awsStorage.removeDir(S3_BUCKET, prefix, function (err) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    waterfallCb(null);
                });
            }
        ], function (err) {
            if (err) {
                return next(err)
            }
            var url = process.env.HOME_PAGE + id.toString() + '/{{ctid}}';
            res.status(200).send({url: url});
        });
    };
};

module.exports = routeHandler;