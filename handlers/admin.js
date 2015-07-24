'use strict';


var async = require('async');
var mongoose = require('mongoose');
var _ = require('../public/js/libs/underscore/underscore-min');
var mailer = require('../helpers/mailer');
var fs = require('fs')
var routeHandler = function (db) {

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);


    this.confirmUser = function (req, res, next) {
        var confirmToken = req.query.token;
        var options;
        fs.readFile('public/templates/successConfirmation.html', 'utf8', function (err, template) {
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
                var html = _.template(template)();
                res.end(html);
            });
        });
    };

};

module.exports = routeHandler;