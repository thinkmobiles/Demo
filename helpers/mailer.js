'use strict';

var MailerModule = function () {
    var _ = require('./../public/js/libs/underscore/underscore.js');
    var nodemailer = require('nodemailer');
    var fs = require('fs');
    var FROM = 'DemoRocket <' + 'info@demorocket.com' + '>';

    this.trackInfo = function (options, callback) {
        fs.readFile('public/templates/mailer/trackInfo.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;
            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                    return callback(err);
                }
            } else {

                templateOptions = {
                    name: options.firstName + ' ' + options.lastName
                };

                mailOptions = {
                    from: FROM,
                    to: options.email,
                    subject: 'Info',
                    generateTextFromHTML: true,
                    html: _.template(template)(templateOptions)
                };

                deliver(mailOptions, callback);
            }
        });
    };

    this.contactMe = function (options) {
        fs.readFile('public/templates/mailer/contactMe.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {

                templateOptions = {
                    companyName: options.companyName,
                    name: options.name,
                    email: options.email,
                    message: options.message,
                    analytics: options.analytics
                };

                mailOptions = {
                    from: FROM,
                    to: options.companyEmail,
                    subject: 'Contact me message',
                    generateTextFromHTML: true,
                    html: _.template(template)(templateOptions)
                };

                deliver(mailOptions);
            }
        });
    };

    this.contactAdmin = function (options) {
        fs.readFile('public/templates/mailer/contactAdmin.html', 'utf8', function (err, template) {
            var mailOptions;
            var TO = options.toEmail;
            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {
                mailOptions = {
                    from: FROM,
                    to: TO,
                    subject: 'Contact Me Message',
                    generateTextFromHTML: true,
                    html: _.template(template)(options)
                };

                deliver(mailOptions);
            }
        });
    };

    this.newUserConfirm = function (options) {
        fs.readFile('public/templates/mailer/confirmUser.html', 'utf8', function (err, template) {
            var mailOptions;
            var TO = options.toEmail;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {

                mailOptions = {
                    from: FROM,
                    to: TO,
                    subject: 'New User',
                    generateTextFromHTML: true,
                    html: _.template(template)(options)
                };

                deliver(mailOptions);
            }
        });
    };

    this.forgotPassword = function (options) {
        fs.readFile('public/templates/mailer/forgotPassword.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {

                templateOptions = {
                    name: options.firstName + ' ' + options.lastName,
                    url: process.env.WEB_HOST + '/#/resetPassword/' + options.forgotToken
                };

                mailOptions = {
                    from: FROM,
                    to: options.email,
                    subject: 'Reset password',
                    generateTextFromHTML: true,
                    html: _.template(template)(templateOptions)
                };

                deliver(mailOptions);
            }
        });
    };

    this.sendInvite = function (options) {
        fs.readFile('public/templates/mailer/inviteUser.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {

                templateOptions = {
                    firstName: options.firstName,
                    lastName: options.lastName
                };

                mailOptions = {
                    from: FROM,
                    to: options.email,
                    subject: 'Account confirmed',
                    generateTextFromHTML: true,
                    html: _.template(template)(templateOptions)
                };

                deliver(mailOptions);
            }
        });
    };

    this.sendInviteToSubordinate = function (options) {
        fs.readFile('public/templates/mailer/inviteSubordinate.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {

                templateOptions = {
                    firstName: options.firstName,
                    lastName: options.lastName,
                    userName: options.userName,
                    url: process.env.WEB_HOST + '/#/confirm/' + options.confirmToken
                };

                mailOptions = {
                    from: FROM,
                    to: options.email,
                    subject: 'Account confirmed',
                    generateTextFromHTML: true,
                    html: _.template(template)(templateOptions)
                };

                deliver(mailOptions);
            }
        });
    };

    this.sendWeeklyAnalytic = function (options, callback) {
        fs.readFile('public/templates/mailer/weeklyAnalytic.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                    return callback(err);
                }
            } else {

                templateOptions = {
                    companyName: options.companyName,
                    companyLogo: options.companyLogo,
                    name: options.name,
                    email: options.email,
                    videos: options.videos,
                    visits: options.visits,
                    documents: options.documents,
                    questions: options.questions,
                    uninterested: options.uninterested
                };

                mailOptions = {
                    from: FROM,
                    to: options.companyEmail,
                    subject: 'Weekly Analytics',
                    generateTextFromHTML: true,
                    html: _.template(template)(templateOptions)
                };

                deliver(mailOptions, callback);
            }
        });
    };

    this.sendTrackInfo = function (options, callback) {
        fs.readFile('public/templates/mailer/trackInfo.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                    return callback(err);
                }
            } else {

                templateOptions = {
                    companyName: options.companyName,
                    name: options.name,
                    email: options.email,
                    videos: options.videos,
                    documents: options.documents,
                    questions: options.questions
                };

                mailOptions = {
                    from: FROM,
                    to: options.companyEmail,
                    subject: 'Activity information',
                    generateTextFromHTML: true,
                    html: _.template(template)(templateOptions)
                };

                deliver(mailOptions, callback);
            }
        });
    };


    this.emailConfirmation = function (options) {
        fs.readFile('public/templates/mailer/confirmEmail.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {

                templateOptions = {
                    name: options.firstName + ' ' + options.lastName,
                    email: options.email,
                    minderId: (options.minderId) ? options.minderId : null,
                    url: process.env.HOST + '/#confirmEmail/' + options.confirmToken
                };

                mailOptions = {
                    from: FROM,
                    to: options.email,
                    subject: 'Please verify your MinderWeb account',
                    generateTextFromHTML: true,
                    html: _.template(template, templateOptions)
                };

                deliver(mailOptions);
            }
        });
    };


    this.beforeExpired = function (options) {
        fs.readFile('public/templates/mailer/beforeExpired.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {

                templateOptions = {
                    name: options.firstName + ' ' + options.lastName,
                    devices: options.devices
                };

                mailOptions = {
                    from: FROM,
                    to: options.email,
                    subject: 'Info',
                    generateTextFromHTML: true,
                    html: _.template(template, templateOptions)
                };

                deliver(mailOptions);
            }
        });
    };

    this.onExpired = function (options) {
        fs.readFile('public/templates/mailer/onExpired.html', 'utf8', function (err, template) {
            var templateOptions;
            var mailOptions;

            if (err) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {

                templateOptions = {
                    name: options.firstName + ' ' + options.lastName,
                    devices: options.devices
                };

                mailOptions = {
                    from: FROM,
                    to: options.email,
                    subject: 'Info',
                    generateTextFromHTML: true,
                    html: _.template(template, templateOptions)
                };

                deliver(mailOptions);
            }
        });
    };

    function deliver(mailOptions, callback) {
        var user = process.env.mailerUserName;
        var pass = process.env.mailerPassword;
        var service = process.env.mailerService;
        var smtpTransport = nodemailer.createTransport({
            service: service,
            auth: {
                user: user,
                pass: pass
            }
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log(service, user, pass);
        }

        smtpTransport.sendMail(mailOptions, function (err, responseResult) {
            if (err) {
                if (callback && typeof callback === 'function') {
                    callback(err, null);
                }
                if (process.env.NODE_ENV !== 'production') {
                    console.error(err);
                }
            } else {
                if (callback && typeof callback === 'function') {
                    callback(null, responseResult);
                }
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Message sent: ' + responseResult.response);
                }
            }
        });
    }

};

module.exports = new MailerModule();