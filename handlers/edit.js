'use strict';


var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
var LocalFs = require('./fileStorage/localFs')();
var localFs = new LocalFs();

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
    }

    this.edit = function (req, res, next) {
        var userId = req.session.uId;
        var content;
        var data = req.body;
        var files = req.files;
        var sep = path.sep;
        var id;

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
                    content = doc;
                    id = doc._id;
                    waterfallCb(null)
                });
            },

            function (waterfallCb) {
                var updateMainVideoUri;
                if (!data.video && files.video.name) {
                    waterfallCb(null);
                } else if (data.video) {
                    updateMainVideoUri = data.video;
                } else if (files.video.name) {
                    fs.unlinkSync(content.mainVideoUri);
                    var url = localFs.defaultPublicDir + sep + 'video' + sep + id.toString();
                    upFile(url, files['video'], function (err, mainVideoUri) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        updateMainVideoUri = mainVideoUri.replace('public' + sep, '');
                    });
                }
                var obj = {
                    mainVideoUri: updateMainVideoUri
                };
                ContentModel.findOneAndUpdate({ownerId: userId}, obj, function (err, doc) {
                    content = doc;
                    waterfallCb(null)
                });
                waterfallCb(null);
                waterfallCb(null)
            },

            function (waterfallCb) {

            }], function (err) {
            if (err) {
                return next(err)
            }
            res.status(200).send({message: 'Success modified'})
        });
    };

};

module.exports = routeHandler;