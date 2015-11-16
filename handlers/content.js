'use strict';


var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
var AwsStorage = require('../helpers/aws')();
var pdfutils = require('pdfutils').pdfutils;
var s3 = new AwsStorage();

var REG_EXP = require('../constants/regExp');
var USER_ROLES = require('../constants/userRoles');
var AWS = require('../constants/AWS');

var routeHandler = function (db) {
    var S3_BUCKET = AWS.S3_BUCKET;
    var S3_ENDPOINT = AWS.S3_ENDPOINT;

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);


    function updateSurveyVideo(num, id, surveyId, files, data, callback) {
        var name = 'video' + num;
        var question = 'question' + num;
        var url = id.toString() + '/survey' + num + '/';
        var videoKey = url + files[name].name;
        var videoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files[name].name);

        if (files[name].name) {
            s3.postFile(S3_BUCKET, videoKey, files[name], function (err) {
                if (err) {
                    return callback(err);
                }
                ContentModel.findOneAndUpdate({_id: id, "survey._id": surveyId},
                    {
                        $set: {
                            "survey.$.videoUri": videoUrl,
                            "survey.$.question": data[question],
                            "survey.$.order": num
                        }
                    }, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null)
                    });
            });
        } else {
            ContentModel.findOneAndUpdate({_id: id, "survey._id": surveyId},
                {
                    $set: {
                        "survey.$.videoUri": data[name],
                        "survey.$.question": data[question],
                        "survey.$.order": num
                    }
                }, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null)
                });
        }
    };
    function updateSurveyFiles(num, id, surveyId, files, data, mainCallback) {
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

            s3.postFile(S3_BUCKET, pdfKey, file, function (err) {
                if (err) {
                    return eachCb(err);
                }
                savePdfPreview(url, file);

                ContentModel.findOneAndUpdate({
                    "_id": id,
                    "survey._id": surveyId
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

    function saveSurveyVideo(num, id, files, data, callback) {
        var question = 'question' + num;
        var name = 'video' + num;
        var insSurvey;
        var url = id.toString() + '/survey' + num + '/';
        var videoKey = url + files[name].name;
        var videoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files[name].name);

        if (files[name].name) {
            s3.postFile(S3_BUCKET, videoKey, files[name], function (err) {
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

            s3.postFile(S3_BUCKET, pdfKey, file, function (err) {
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
                s3.postBuffer(S3_BUCKET, key, buf, function (err) {
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
                s3.postFile(S3_BUCKET, videoKey, files['video'], function (err) {
                    if (err) {
                        return seriesCb(err);
                    }
                    seriesCb(null);
                });
            },

            //save logo
            function (seriesCb) {
                s3.postFile(S3_BUCKET, logoKey, files['logo'], function (err) {
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

    this.campaignsList = function (req, res, next) {
        var ownerId;
        var userRole = req.session.role;
        if (userRole == USER_ROLES.ADMIN || userRole == USER_ROLES.USER) {
            ownerId = req.session.uId;
        } else {
            ownerId = req.session.creator;
        }

        UserModel.findById(ownerId, function (err, user) {
            if (err) {
                return next(err);
            }
            res.status(200).send(user.campaigns);
        });
    };


    this.content = function (req, res, next) {
        var contentId = req.params.id;
        var url;
        var content;
        var error = new Error();

        ContentModel.findById(contentId, function (err, content) {
            if (err) {
                return next(err);
            } else if (!content) {
                error.status = 400;
                error.message = 'Content Not Found';
                return next(error);
            }

            content.survey = sortByKey(content.survey, 'order');
            url = process.env.WEB_HOST + '/campaign/' + content._id + '/{{ctid}}';

            res.status(200).send({url: url, content: content});
        });
        //async.waterfall([
        //    function (waterfallCb) {
        //        UserModel.findById(uId, function (err, user) {
        //            if (err) {
        //                return waterfallCb(err);
        //            }
        //            if (user.role == USER_ROLES.ADMIN || user.role == USER_ROLES.SUPER_ADMIN) {
        //                return waterfallCb(null, user.creator);
        //            }
        //            waterfallCb(null, uId);
        //        });
        //    },
        //
        //    function (userId, waterfallCb) {
        //        ContentModel.findOne({ownerId: userId}, function (err, content) {
        //            if (err) {
        //                return waterfallCb(err);
        //            } else if (!content) {
        //                error.status = 400;
        //                error.message = 'Content Not Found';
        //                return waterfallCb(error);
        //            }
        //
        //            content.survey = sortByKey(content.survey, 'order');
        //            url = process.env.WEB_HOST + '/campaign/' + content._id + '/{{ctid}}';
        //        });
        //    }], function (err) {
        //    if (err) {
        //        return next(err);
        //    }
        //    res.status(201).send({url: url, content: content});
        //});
    };

    this.testS3Delete = function (req, res, next) {
        s3.removeFile(S3_BUCKET, '562df14d680008701f000001/Overview.mp4', null, function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.testS3DeleteDir = function (req, res, next) {
        s3.removeDir(S3_BUCKET, '562df14d680008701f000001', function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.testS3Move = function (req, res, next) {
        s3.moveDir(S3_BUCKET, '564065e92226c4c43a000002/survey4', '564065e92226c4c43a000002/old/survey4', function (err, data) {
            if (err) {
                return next(err);
            }
            res.status(200).send(data);
        });
    };

    this.testS3Save = function (req, res, next) {
        var files = req.files;
        s3.postFile(S3_BUCKET, 'somefile2.pdf', files['pdf'], function (err, data) {
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
                    s3.postBuffer(S3_BUCKET, key, buf, function (err) {
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
        s3.getFileUrl({bucket: S3_BUCKET, key: 'some%20file2.pdf'}, function (err, data) {
            if (err) {
                return next(err);
            } // an error occurred
            res.status(200).send(data);           // successful response
        });
    };

    this.testS3List = function (req, res, next) {
        var data = req.query;
        s3.listFiles(S3_BUCKET, '', function (err, data) {
            if (err) {
                return next(err);
            } // an error occurred
            res.status(200).send(data);           // successful response
        });
    };

    this.upload = function (req, res, next) {
        var data = req.body;
        var files = req.files;
        var ownerId;
        var currentUserId = req.session.uId;
        var content;
        var insObj;
        var id;

        async.waterfall([

                //validation
                function (waterfallCb) {
                    UserModel.findById(currentUserId, function (err, user) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        if (user.role == USER_ROLES.ADMIN || user.role == USER_ROLES.USER) {
                            ownerId = currentUserId;
                        } else {
                            ownerId = user.creator;
                        }
                        waterfallCb(null);

                    });
                },

                function (waterfallCb) {
                    validation(req, function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null);

                    });
                },

                /*     function (waterfallCb) {
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
                 nameOfCampaign: data.nameOfCampaign,
                 ownerId: userId,
                 name: data.name,
                 email: data.email,
                 phone: data.phone,
                 mainVideoDescription: data.desc
                 };
                 waterfallCb(null, insObj);
                 });
                 },*/

                // create content model
                function (waterfallCb) {
                    insObj = {
                        nameOfCampaign: data.nameOfCampaign,
                        ownerId: ownerId,
                        creatorId: currentUserId,
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        mainVideoDescription: data.desc
                    };

                    ContentModel.create(insObj, function (err, result) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        id = result._id;
                        waterfallCb(null, result);
                    });
                },

                // update user => set contentId
                function (result, waterfallCb) {
                    UserModel.findByIdAndUpdate(ownerId, {
                        $addToSet: {
                            campaigns: {
                                id: id,
                                name: data.nameOfCampaign,
                                createdAt: new Date()
                            }
                        }
                    }, function (err) {
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

                                s3.postFile(S3_BUCKET, logoKey, files['logo'], function (err, data) {
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

            function (err) {
                if (err) {
                    return next(err);
                }
                var url = process.env.WEB_HOST + '/campaign/' + id + '/{{ctid}}';
                res.status(201).send({url: url});
            });
    };

    this.remove = function (req, res, next) {
        var contentId = req.params.id;
        var ownerId;
        var error = new Error();
        var userRole = req.session.role;

        if (userRole == USER_ROLES.ADMIN || userRole == USER_ROLES.USER) {
            ownerId = req.session.uId;
        } else {
            ownerId = req.session.creator;
        }
        async.parallel([
            function (parallelCb) {
                ContentModel.findByIdAndRemove(contentId, function (err, doc) {
                    if (err) {
                        return parallelCb(err);
                    } else if (!doc) {
                        error.status = 404;
                        error.message = 'Content Not Found';
                        return parallelCb(error)
                    }
                    parallelCb(null);
                });
            },

            function (parallelCb) {
                UserModel.findByIdAndUpdate(ownerId, {$pull: {'campaigns': {'id': contentId}}}, function (err, found) {
                    if (err) {
                        return parallelCb(err);
                    } else if (!found) {
                        error.status = 404;
                        error.message = 'User Not Found';
                        return parallelCb(error)
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
                        parallelCb(err);
                    }
                    parallelCb(null);
                });
            }], function (err) {
            if (err) {
                return next(err);
            }
            var dirPath = contentId
            s3.removeDir(S3_BUCKET, dirPath);

            var message = 'Content removed';
            res.status(200).send({message: message});
        });
    };


    this.update = function (req, res, next) {
        var userId = req.session.uId;
        var content;
        var data = req.body;
        var files = req.files;
        var delSurvey = data.removedQuestions ? data.removedQuestions.split(' ') : [];
        var surveyOrder = data.surveyOrder ? data.surveyOrder.split(' ') : [];
        var countQuestion = data.countQuestion;
        var prefix = S3_ENDPOINT + S3_BUCKET + '/';
        var id;
        var url;

        async.series([
                function (seriesCb) {
                    //validation
                    seriesCb(null);
                },

                //update text fields
                function (seriesCb) {
                    var obj = {
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        mainVideoDescription: data.desc,
                        nameOfCampaign: data.nameOfCampaign
                    };
                    ContentModel.findOneAndUpdate({ownerId: userId}, obj, function (err, doc) {
                        if (err) {
                            return seriesCb(err);
                        }
                        content = doc;
                        id = doc._id;
                        url = id.toString() + '/';
                        var sendDataUrl = process.env.HOME_PAGE + url + '{{ctid}}';
                        res.status(200).send({url: sendDataUrl});
                        seriesCb(null)
                    });
                },

                //move survey to temporary folder (S3)
                function (seriesCb) {
                    var count = content.survey.length;
                    var i = 0;

                    async.whilst(
                        function () {
                            return i < count;
                        },
                        function (callback) {
                            i++;
                            var oldPrefix = url + 'survey' + i;
                            var newPrefix = url + 'temp/survey' + i;


                            s3.moveDir(S3_BUCKET, oldPrefix, newPrefix, function (err) {
                                if (err) {
                                    return callback(err);
                                }
                                callback(null);
                            });
                        },
                        function (err) {
                            if (err) {
                                return seriesCb(err);
                            }
                            seriesCb(null);
                        });
                },

                function (seriesCb) {
                    async.parallel([

                            //update main video
                            function (mainParallelCb) {
                                var updateMainVideoUri;
                                var videoUrl;
                                var videoKey;
                                var key;

                                if (!data.video && !files.video.name && !files.video.size) {
                                    return mainParallelCb(null);

                                } else if (data.video) {
                                    updateMainVideoUri = data.video;

                                    ContentModel.findByIdAndUpdate(id, {mainVideoUri: updateMainVideoUri}, function (err) {
                                        if (err) {
                                            return mainParallelCb(err);
                                        }
                                        mainParallelCb(null)
                                    });
                                } else if (files.video.name) {
                                    key = decodeURIComponent(content.mainVideoUri.replace(prefix, ''));
                                    videoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files['video'].name);
                                    videoKey = url + files['video'].name;

                                    async.parallel([
                                        function (parallelCb) {
                                            s3.removeFile(S3_BUCKET, key, function (err) {
                                                if (err) {
                                                    return parallelCb(err);
                                                }
                                                parallelCb(null);
                                            });
                                        },

                                        function (parallelCb) {
                                            s3.postFile(S3_BUCKET, videoKey, files['video'], function (err) {
                                                if (err) {
                                                    return parallelCb(err);
                                                }
                                                parallelCb(null);
                                            });
                                        },

                                        function (parallelCb) {
                                            ContentModel.findByIdAndUpdate(id, {mainVideoUri: videoUrl}, function (err) {
                                                if (err) {
                                                    return parallelCb(err);
                                                }
                                                parallelCb(null);
                                            });
                                        }
                                    ], function (err) {
                                        if (err) {
                                            return mainParallelCb(err);
                                        }
                                        mainParallelCb(null)
                                    });
                                }
                            },

                            //update logo
                            function (mainParallelCb) {
                                if (!files.logo.name) {
                                    return mainParallelCb(null);
                                }

                                var key = decodeURIComponent(content.logoUri.replace(prefix, ''));
                                var logoUrl = S3_ENDPOINT + S3_BUCKET + '/' + url + encodeURIComponent(files['logo'].name);
                                var logoKey = url + files['logo'].name;


                                async.parallel([
                                    function (parallelCb) {
                                        s3.removeFile(S3_BUCKET, key, function (err) {
                                            if (err) {
                                                return parallelCb(err);
                                            }
                                            parallelCb(null);
                                        });
                                    },

                                    function (parallelCb) {
                                        s3.postFile(S3_BUCKET, logoKey, files['logo'], function (err) {
                                            if (err) {
                                                return parallelCb(err);
                                            }
                                            parallelCb(null);
                                        });
                                    },

                                    function (parallelCb) {
                                        ContentModel.findByIdAndUpdate(id, {logoUri: logoUrl}, function (err) {
                                            if (err) {
                                                return parallelCb(err);
                                            }
                                            parallelCb(null);
                                        });
                                    }
                                ], function (err) {
                                    if (err) {
                                        return mainParallelCb(err);
                                    }
                                    mainParallelCb(null)
                                });
                            },

                            //delete survey
                            function (mainParallelCb) {
                                if (!delSurvey.length) {
                                    return mainParallelCb(null);
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
                                        return mainParallelCb(err);
                                    }
                                    mainParallelCb(null);
                                });
                            },

                            //update survey
                            function (mainParallelCb) {
                                var i = 0;
                                async.whilst(
                                    function () {
                                        return i < countQuestion;
                                    },

                                    //===============================================whilst START====================================================
                                    function (whilstCb) {
                                        i++;
                                        var surveyId = surveyOrder[i - 1];
                                        if (surveyId == 'new') {
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
                                                return elem._id.toString() == surveyId;
                                            });
                                            var oldOrder = survey.order;


                                            async.parallel([
                                                //update video
                                                function (parallelCb) {
                                                    if ((files[videoName].name && files[videoName].size) || data[videoName]) {
                                                        var key = decodeURIComponent(survey.videoUri.replace(prefix, 'temp/'));

                                                        async.parallel([
                                                                function (callback) {
                                                                    s3.removeFile(S3_BUCKET, key, function (err) {
                                                                        if (err) {
                                                                            return callback(err);
                                                                        }
                                                                        callback(null);
                                                                    });
                                                                },

                                                                function (callback) {
                                                                    updateSurveyVideo(i, id, surveyId, files, data, function (err) {
                                                                        if (err) {
                                                                            return callback(err);
                                                                        }
                                                                        callback(null);
                                                                    });
                                                                }
                                                            ],
                                                            function (err) {
                                                                if (err) {
                                                                    return parallelCb(err);
                                                                }
                                                                parallelCb(null);
                                                            });

                                                    } else {
                                                        ContentModel.findOneAndUpdate({
                                                            "_id": id,
                                                            "survey._id": surveyId
                                                        }, {
                                                            $set: {
                                                                "survey.$.question": data[questionName],
                                                                "survey.$.order": i
                                                            }
                                                        }, function (err) {
                                                            if (err) {
                                                                return parallelCb(err);
                                                            }
                                                            parallelCb(null);
                                                        });
                                                    }
                                                },

                                                //update pdf
                                                function (parallelCb) {
                                                    if (!files[pdfName].length && (!files[pdfName].name || !files[pdfName].size)) {
                                                        return parallelCb(null);
                                                    }
                                                    var prefix = id.toString + '/temp/survey' + oldOrder + '/pdf'

                                                    async.parallel([
                                                            function (callback) {
                                                                s3.removeDir(S3_BUCKET, prefix, function (err) {
                                                                    if (err) {
                                                                        return callback(err);
                                                                    }
                                                                    callback(null);
                                                                });
                                                            },

                                                            function (callback) {
                                                                ContentModel.findOneAndUpdate({
                                                                    "_id": id,
                                                                    "survey._id": surveyId
                                                                }, {$unset: {"survey.$.pdfUri": []}}, function (err) {
                                                                    if (err) {
                                                                        return callback(err);
                                                                    }
                                                                    callback(null);
                                                                });
                                                            },

                                                            function (callback) {
                                                                updateSurveyFiles(i, id, surveyId, files, data, function (err) {
                                                                    if (err) {
                                                                        return callback(err);
                                                                    }
                                                                    callback(null);
                                                                });
                                                            }
                                                        ],
                                                        function (err) {
                                                            if (err) {
                                                                return parallelCb(err);
                                                            }
                                                            parallelCb(null);
                                                        });
                                                }
                                            ], function (err) {
                                                if (err) {
                                                    return whilstCb(err);
                                                }

                                                var newPrefix = url + 'survey' + i;
                                                var oldPrefix = url + 'temp/survey' + oldOrder;
                                                s3.moveDir(S3_BUCKET, oldPrefix, newPrefix, function (err) {
                                                    if (err) {
                                                        return whilstCb(err);
                                                    }
                                                    whilstCb(null);
                                                });
                                            });
                                        }
                                    },
                                    //===============================================whilst END====================================================
                                    function (err) {
                                        if (err) {
                                            return mainParallelCb(err);
                                        }
                                        mainParallelCb(null);
                                    });
                            }],
                        function (err) {
                            if (err) {
                                return seriesCb(err);
                            }
                            seriesCb(null);
                        }
                    )
                },

                //delete temporary folder  (S3)
                function (seriesCb) {
                    var prefix = url + 'temp';
                    s3.removeDir(S3_BUCKET, prefix, function (err) {
                        if (err) {
                            return seriesCb(err);
                        }
                        seriesCb(null);
                    });
                }
            ],
            function (err) {
                if (err) {
                    return console.error(err)
                }
                console.log('Content updated')
            });
    };
};

module.exports = routeHandler;