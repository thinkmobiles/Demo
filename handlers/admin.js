'use strict';


var async = require('async');
var mongoose = require('mongoose');
var crypto = require('crypto');
var fs = require('fs');
var _ = require('../public/js/libs/underscore/underscore-min');
var mailer = require('../helpers/mailer');
var LocalFs = require('./fileStorage/localFs')();
var localFs = new LocalFs();

var routeHandler = function (db) {

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

    this.confirmUser = function (req, res, next) {
        var confirmToken = req.query.token;
        var options;
        UserModel.findOneAndUpdate({confirmToken: confirmToken}, {isConfirmed: true}, function (err, doc) {
            if (err) {
                return console(err);
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
        UserModel.find({isConfirmed: true, isAdmin:false}, {avatar: 0, pass:0}, function (err, docs) {
            if (err) {
                return next(err);
            } else if (!docs) {
                return res.status(200).send([]);
            }
            //ContentModel.populate(docs, {path: 'contentId'}, function (err, popDocs) {
            //    if (err) {
            //        return next(err);
            //    }
            //    return res.status(200).send(popDocs);
            //});
            res.status(200).send(docs);
        });
    };

    this.pendingUsers = function (req, res, next) {
        UserModel.find({isConfirmed: false, isAdmin:false}, {avatar: 0, pass:0}, function (err, docs) {
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
            return next(err);
        }
        var pass = req.body.pass;
        var id = req.body.id;
        var hashPass =getEncryptedPass(pass);
            UserModel.findByIdAndUpdate(id, {pass: hashPass}, function (err, doc) {
                if (err) {
                    return next(err);
                }
                return res.status(200).send({message:'Success'});
            });
    };

    this.remove = function (req, res, next) {
        if (!req.body || !req.body.id) {
            var e = new Error();
            e.message = 'Not enough params';
            e.status = 400;
            return next(err);
        }
        var contentId;
        var userId = req.query.id;
        var sep = path.sep;

        ContentModel.findOneAndRemove({ownerId: id}, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                return res.status(404).send({err: 'Content Not Found'});
            }
            contentId = doc._id;
            UserModel.findByIdAndRemove(userId, function (err, found) {
                if (err) {
                    return next(err);
                }
                if (!found) {
                    return res.status(404).send({err: 'User Not Found'});
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

};

module.exports = routeHandler;