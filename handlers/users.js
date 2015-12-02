'use strict';

var CONSTANTS = require('../constants/index');
var USER_ROLES = require('../constants/userRoles');
var REG_EXP = require('../constants/regExp');

var _ = require('../public/js/libs/underscore/underscore-min');
var async = require('async');
var crypto = require('crypto');
var mongoose = require('mongoose');
var randToken = require('rand-token');
var moment = require('moment');
var request = require('request');

var badRequests = require('../helpers/badRequests');
var Analytic = require('../helpers/analytic');
var Jumplead = require('../helpers/jumplead');
var Sessions = require('../handlers/sessions');
var mailer = require('../helpers/mailer');

var routeHandler = function (db) {

    var prospectSchema = mongoose.Schemas['Prospect'];
    var ProspectModel = db.model('Prospect', prospectSchema);

    var trackSchema = mongoose.Schemas['Track'];
    var TrackModel = db.model('Track', trackSchema);

    var contentSchema = mongoose.Schemas['Content'];
    var ContentModel = db.model('Content', contentSchema);

    var userSchema = mongoose.Schemas['User'];
    var UserModel = db.model('User', userSchema);

    var contactMeSchema = mongoose.Schemas['ContactMe'];
    var ContactMeModel = db.model('ContactMe', contactMeSchema);

    var jumplead = new Jumplead(db);
    var session = new Sessions(db);
    var analytic = new Analytic(db);

    function normalizeEmail(email) {
        return email.trim().toLowerCase();
    }

    function validateProspectSignUp(userData, callback) { //used for signUpMobile, signUpWeb;
        var errMessage;

        if (!userData || !userData.email || !userData.firstName || !userData.lastName) {
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
        if (!REG_EXP.EMAIL_REGEXP.test(userData.email)) {
            return callback(badRequests.InvalidEmail());
        }
        callback(null);
    }

    function validateUserSignUp(userData, callback) {
        var errMessage;

        if (!userData || !userData.email || !userData.firstName || !userData.lastName || !userData.userName || !userData.phone) {
            return callback(badRequests.NotEnParams({reqParams: ['email', 'pass', 'firstName', 'lastName', 'phone']}));
        }

        if (userData.phone.length > CONSTANTS.PHONE_MAX_LENGTH) {
            errMessage = 'First name cannot contain more than ' + CONSTANTS.PHONE_MAX_LENGTH + ' symbols';
            return callback(badRequests.InvalidValue({message: errMessage}));
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

        UserModel.findOne({email: userData.email}, function (err, user) {
            if (err) {
                return callback(err);
            } else if (user) {
                return callback(badRequests.EmailInUse());
            } else {
                UserModel.findOne({userName: userData.userName}, function (err, user) {
                    if (err) {
                        return callback(err);
                    } else if (user) {
                        return callback(badRequests.UsernameInUse());
                    } else {
                        callback();
                    }
                });
            }
        });
    }

    function createUser(userData, callback) {
        userData.isConfirmed = false;
        userData.role = USER_ROLES.USER;
        userData.isDisabled = false;
        userData.confirmToken = randToken.generate(50);
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
    }

    function getEncryptedPass(pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    }

    this.share = function (req, res, next) {
        fs.readFile('public/templates/share.html', 'utf8', function (err, template) {
            var contentId = req.query.contentId;
            var prospectId = req.query.prospectId;
            var page = req.query.page;
            var content;

            if (!contentId || !prospectId || !page) {
                return res.redirect(process.env.HOME_PAGE);
            }
            ContentModel.findById(contentId, function (err, foundContent) {
                if (err) {
                    return next(err);
                }
                if (!foundContent) {
                    return res.redirect(process.env.HOME_PAGE);
                }
                content = foundContent;

                var redirectUrl = process.env.WEB_HOST + '/#/' + page + '/' + contentId + '/' + prospectId;
                var currentUtl = process.env.WEB_HOST + '/share?contentId=' + contentId + '&prospectId=' + prospectId + '&page=' + page;
                var logoUtl = process.env.WEB_HOST + '/' + content.logoUri;
                var description = content.mainVideoDescription;

                var templateOptions = {
                    currentUrl: currentUtl,
                    redirectUrl: redirectUrl,
                    logoUrl: logoUtl,
                    description: description
                };
                var html = _.template(template)(templateOptions);
                res.end(html);
            });
        });
    };

    this.redirect = function (req, res, next) {
        if (req.query.error) {
            return res.status(401).send({
                err: req.query.error,
                message: req.query.error_description
            });
        }
        var code = req.query.code;
        var userId;

        async.waterfall([
            function (waterfallCb) {
                userId = req.session.uId;
                jumplead.getToken(code, userId, function (err) {
                    if (err) {
                        return waterfallCb(err)
                    }
                    waterfallCb(null);
                });
            },

            function (waterfallCb) {
                jumplead.checkUser(res, userId, function (err, email) {
                    if (err) {
                        return waterfallCb(err);
                    }
                    UserModel.findByIdAndUpdate(userId, {jumpleadEmail: email}, function (err, user) {
                        if (err) {
                            return next(err);
                        }
                        UserModel.update({jumpleadEmail: email}, {
                            $set: {
                                accessToken: user.accessToken,
                                refreshToken: user.refreshToken
                            }
                        }, {multi: true}, function (err, count) {
                            if (err) {
                                return next(err);
                            }
                            if (count == 1) {
                                saveAllContacts(userId);
                            }
                            console.log('AccessToken successfully updated');
                            return waterfallCb(null);
                        });
                    });
                });
            }], function (err) {
            if (err) {
                return next(err);
            }
            if (req.session && req.session.uId) {
                req.session.destroy();
            }
            return res.redirect('/#/home');
        });
    };

    function saveAllContacts(userId) {
        var arrToSave = [];
        var obj;

        jumplead.getAllContacts(userId, function (err, contacts) {
            if (err) {
                return console.error(err);
            }
            async.each(contacts, function (contact, callback) {
                obj = {
                    jumpleadId: contact.id,
                    firstName: contact.first_name,
                    lastName: contact.last_name,
                    email: contact.email,
                    isNewViewer: false
                };
                arrToSave.push(obj);
                callback(null);
            }, function (err) {
                if (err) {
                    return console.error(err);
                }
                ProspectModel.create(arrToSave, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                });
            });
        });
    }

    this.sendContactMe = function (req, res, next) {
        var contentId = req.body.contentId;
        var body = req.body;
        var error = new Error();

        if (!contentId || !body.name || !body.email || !body.message) {
            error.message = 'Some field is empty';
            error.status = 403;
            return next(error)
        }
        ContentModel.findById(contentId, function (err, content) {
            if (err) {
                return next(err);
            }
            if (!content) {
                error.message = 'Content Not Found';
                error.status = 404;
                return next(error);
            }

            ContactMeModel.create({
                contentId: contentId,
                name: body.name || 'NoName',
                email: body.email || '-',
                message: body.message || 'NoMessage',
                sentAt: Date.now()
            }, function (err, doc) {
                if (err) {
                    return console.error(err);
                }
                console.log(doc);
            });

            var firstName = body.name.split(' ').shift();
            var lastName = body.name.split(' ').pop();

            TrackModel.findOne({
                contentId: contentId,
                isSent: false,
                firstName: firstName,
                lastName: lastName,
                email: body.email
            }, function (err, doc) {
                if (err) {
                    return next(err);
                }
                var analytics = {
                    videos: doc ? doc.videos : [],
                    questions: doc ? doc.questions : [],
                    documents: doc ? doc.documents : []
                };
                var data = {
                    companyName: content.name,
                    companyEmail: content.email,
                    name: body.name || 'NoName',
                    email: body.email || '-',
                    message: body.message || 'NoDescription',
                    analytics: analytics
                };
                mailer.contactMe(data);
            });

            res.status(200).send('Successful Send');
        });
    };

    this.contactAdmin = function (req, res, next) {
        var body = req.body;
        var error = new Error();
        var data;

        if (!body.lastName || !body.firstName || !body.email || !body.phone || !body.title) {
            error.message = 'Some field is empty';
            error.status = 403;
            return next(error)
        }
        data = {
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            title: body.title,
            company: body.company,
            phone: body.phone,
            notes: body.notes || ''
        };
        getAdminEmail(function (err, email) {
            data.toEmail = email;
            mailer.contactAdmin(data);
        });

        res.status(200).send({message: 'Successful Send'});
    };


    this.currentUser = function (req, res, next) {
        UserModel.findById(req.session.uId, {pass: 0, __v: 0}, function (err, doc) {
            if (err) {
                return next(err);
            } else if (!doc) {
                var e = new Error();
                e.message = 'User not found';
                e.status = 404;
                return next(e);
            }
            res.status(200).send(doc);
        });
    };

    this.login = function (req, res, next) {
        var options = req.body;
        var error = new Error();
        var user;
        if (!options.userName || !options.pass) {
            error.message = 'Username and password is required';
            error.status = 401;
            return next(error);
        }
        var userName = options.userName;
        var pass = getEncryptedPass(options.pass);

        async.series([
            function (seriesCb) {
                UserModel.findOne({userName: userName}, function (err, doc) {
                    if (err) {
                        return seriesCb(err);
                    }
                    if (!doc) {
                        error.message = 'Wrong UserName';
                        error.status = 404;
                        return seriesCb(error);
                    }
                    user = doc;
                    seriesCb(null);
                });
            },

            function (seriesCb) {
                if (user.pass === pass) {
                    if (!user.isConfirmed) {
                        error.message = 'Your account not verified yet';
                        error.status = 401;
                        return seriesCb(error);
                    } else if (user.isDisabled) {
                        error.message = 'Your account disabled by administrator';
                        error.status = 401;
                        return seriesCb(error);
                    }
                    seriesCb(null);
                } else {
                    error.message = 'Wrong password';
                    error.status = 401;
                    return seriesCb(error);
                }
            },

            function (seriesCb) {
                if (user.role === USER_ROLES.USER_ADMINISTRATOR || user.role === USER_ROLES.USER_VIEWER) {
                    UserModel.findById(user.creator, function (err, doc) {
                        if (err) {
                            return seriesCb(err)
                        }
                        if (!doc || doc.isDisabled) {
                            error.message = 'Your account suspended by administrator';
                            error.status = 401;
                            return seriesCb(error);
                        }
                        seriesCb(null);
                    })
                } else {
                    seriesCb(null);
                }
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            session.login(req, user);
            if (options.keepAlive === 'true') {
                req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
            } else {
                req.session.cookie.maxAge = 5 * 60 * 1000;
            }
            res.status(200).send({success: 'Login successful', user: user});
        });
    };

    this.forgotPassword = function (req, res, next) {
        if (!req.body.email) {
            var error = new Error();
            error.message = 'Bad request';
            error.status = 400;
            return next(error);
        }
        var email = req.body.email;
        var token = randToken.generate(50);
        var options;

        UserModel.findOneAndUpdate({email: email}, {forgotToken: token}, function (err, doc) {
            if (err) {
                return next(err);
            } else if (!doc) {
                return res.status(200).send({message: 'Ok'});
            }
            options = {
                firstName: doc.firstName,
                lastName: doc.lastName,
                email: doc.email,
                forgotToken: token
            };
            mailer.forgotPassword(options);
            res.status(200).send({message: 'Ok'});
        });
    };

    this.changePassword = function (req, res, next) {
        if (!req.body.password || !req.body.token) {
            var error = new Error();
            error.message = 'Bad request';
            error.status = 400;
            return next(error);
        }
        var token = req.body.token;
        var pass = getEncryptedPass(req.body.password);

        UserModel.findOneAndUpdate({forgotToken: token}, {pass: pass}, function (err, doc) {
            if (err) {
                return next(err);
            } else if (!doc) {
                return res.status(400).send({message: 'Token is not valid'});
            }
            res.status(200).send({message: 'Ok'});
            UserModel.findByIdAndUpdate(doc._id, {forgotToken: ''}, function (err, doc) {
                if (err) {
                    console.error(err);
                }
            });
        });
    };

    this.avatar = function (req, res, next) {
        var userName = req.params.userName;
        if (!userName) {
            var error = new Error();
            error.message = 'UserName is required';
            error.status = 401;
            return next(error);
        }
        UserModel.findOne({userName: userName}, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(200).send({avatar: ''});
            }
            return res.status(200).send({avatar: user.avatar});
        });
    };

    this.avatarById = function (req, res, next) {
        var id = req.params.id;
        if (!id) {
            var error = new Error();
            error.message = 'id is required';
            error.status = 401;
            return next(error);
        }
        UserModel.findById(id, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(200).send({avatar: ''});
            }
            var base64data = user.avatar.replace('data:image/jpeg;base64,', '').replace('data:image/png;base64,', '').replace('data:image/jpg;base64,', '').replace('data:image/bmp;base64,', '');
            var img = new Buffer(base64data, 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Content-Length': img.length
            });
            res.end(img);
        });
    };
    function getAdminEmail(callback) {
        UserModel.findOne({role: USER_ROLES.ADMIN}, function (err, doc) {
            if (err) {
                return callback(err);
            } else if (!doc) {
                return callback(new Error({message: 'Admin is not found'}));
            }
            callback(null, doc.email)
        });
    }

    this.signUp = function (req, res, next) {
        var options = req.body;
        var pass = options.pass;
        options.pass = getEncryptedPass(pass);
        async.series([
            //validation:
            function (cb) {
                validateUserSignUp(options, function (err) {
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
                    session.login(req, user);

                    getAdminEmail(function (err, email) {
                        user.toEmail = email;
                        mailer.newUserConfirm(user);
                        mailer.newUserRegistration(user);
                    });
                    cb(null, user);
                });
            }], function (err) {
            if (err) {
                return next(err);
            }
            res.status(201).send({message: 'Thank you for your interest in DemoRocket!  We’ve received your information and will be contacting you shortly.'});
        });
    };

    this.prospectSignUp = function (req, res, next) {
        var options = req.body;
        var prospectId;

        async.series([
            //validation:
            function (cb) {
                validateProspectSignUp(options, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null);
                });
            },

            //create prospect:
            function (cb) {
                jumplead.setContact(options.contentId, options, function (err, prospect) {
                    if (err) {
                        return cb(err);
                    }
                    prospectId = prospect.id;
                    cb(null);

                });
            }], function (err) {
            if (err) {
                return next(err);
            }
            res.status(201).send({
                id: prospectId
            });
        });
    };

    this.redirectToMain = function (req, res, next) {
        var contentId = req.params.contentId;
        var prospectId = req.params.prospectId;
        if (!contentId || !prospectId) {
            return res.redirect(process.env.HOME_PAGE);
        }
        return res.redirect(process.env.HOME_PAGE + contentId + '/' + prospectId);
    };

    function sortByKey(array, key) {
        return array.sort(function (a, b) {
            var x = a[key];
            var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    this.getMain = function (req, res, next) {
        var contentId = req.params.contentId;
        var prospectId = req.params.prospectId;
        var error = new Error();
        var userId, content, data;

        if (!contentId && !prospectId) {
            UserModel.findOne({role: USER_ROLES.ADMIN}, function (err, user) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    error.message = 'User Not Found';
                    error.status = 404;
                    return next(error);
                }
                ContentModel.findOne({owner: user._id}, function (err, doc) {
                    if (err) {
                        return next(err);
                    }
                    if (!doc) {
                        error.message = 'Content Not Found';
                        error.status = 404;
                        return next(error);
                    }
                    doc.survey = sortByKey(doc.survey, 'order');
                    return res.status(200).send({content: doc});
                });
            });
        } else {
            async.waterfall([

                function (waterfallCb) {
                    ContentModel.findById(contentId, function (err, doc) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        if (!doc) {
                            error.message = 'Content Not Found';
                            error.status = 404;
                            return waterfallCb(error);
                        }
                        doc.survey = sortByKey(doc.survey, 'order');
                        content = doc;
                        waterfallCb(null, doc);
                    });
                },

                function (content, waterfallCb) {
                    UserModel.findById(content.owner, function (err, user) {
                        if (err) {
                            return waterfallCb(err);
                        } else if (!user) {
                            error.message = 'Cant found owner of video';
                            error.status = 404;

                            return waterfallCb(error);
                        } else if (user.isDisabled) {
                            error.message = 'Sorry, but this content disabled now';
                            error.status = 403;

                            return waterfallCb(error);
                        }
                        userId = user._id;
                        waterfallCb(null, user);
                    });
                },

                function (user, waterfallCb) {
                    if (prospectId == '{{ctid}}') {
                        return waterfallCb(null, null);
                    }
                    ProspectModel.findOne({jumpleadId: prospectId}, function (err, doc) {
                        if (err) {
                            return waterfallCb(err);
                        } else if (!doc) {
                            jumplead.getContact(user._id, prospectId, function (err, prospect) {
                                if (err) {
                                    return waterfallCb(err);
                                }
                                var obj = {
                                    jumpleadId: prospect.id,
                                    firstName: prospect.first_name,
                                    lastName: prospect.last_name,
                                    email: prospect.email
                                };
                                return waterfallCb(null, obj);
                            });
                        } else {

                            updateProspect(userId, doc.jumpleadId);
                            return waterfallCb(null, doc);
                        }
                    });
                }], function (err, prospect) {
                if (err) {
                    return next(err);
                }
                data = {
                    personalized: true,
                    content: content,
                    contact: prospect
                };
                createTrackDoc(contentId, prospect);
                res.status(200).send(data);
            });
        }
    };


    function updateProspect(userId, contactId) {
        jumplead.getContact(userId, contactId, function (err, data) {
            if (err) {
                return console.error(err);
            }
            ProspectModel.findOneAndUpdate({jumpleadId: contactId}, {
                email: data.email,
                firstName: data.first_name,
                lastName: data.last_name
            }, function (err) {
                if (err) {
                    return console.error(err);
                }
            });
        });
    }

    function createTrackDoc(contentId, prospect) {
        TrackModel.findOneAndUpdate({
            'contentId': contentId,
            'jumpleadId': prospect.jumpleadId,
            'isSent': false
        }, {
            $set: {
                'contentId': contentId,
                'jumpleadId': prospect.jumpleadId,
                'firstName': prospect.firstName,
                'lastName': prospect.lastName,
                'email': prospect.email,
                'domain': prospect.email.split('@').pop(),
                'isNewViewer': prospect.isNewViewer,
                'isSent': false,
                'updatedAt': Date.now()
            }
        }, {upsert: true}, function (err, doc) {
            if (err) {
                return console.error(err);
            }
            return true;
        });
    };


    this.sendWeekly = function (req, res, next) {
        var contentId = req.query.contentId;

        console.log('weekly report start');
        var now = new Date(Date.now());
        var to = new Date(now.setHours(24));
        var from = new Date(moment(to).subtract(140, 'days').format());
        console.log(to);
        console.log(from);

        ContentModel.find({_id: contentId}, function (err, docs) {
            if (err) {
                return console.error(err);
            }
            async.each(docs, function (doc, eachCb) {
                async.parallel({
                    visits: function (parallelCb) {
                        analytic.totalVisits(doc.owner.toString(), from, to, parallelCb);
                    },
                    videos: function (parallelCb) {
                        analytic.video(doc.owner.toString(), from, to, parallelCb);
                    },
                    questions: function (parallelCb) {
                        analytic.question(doc.owner.toString(), from, to, parallelCb);
                    },
                    documents: function (parallelCb) {
                        analytic.document(doc.owner.toString(), from, to, parallelCb);
                    },
                    uninterested: function (parallelCb) {
                        analytic.uninterested(doc.owner.toString(), from, to, parallelCb);
                    }
                }, function (err, options) {
                    if (err) {
                        return console.error(err);
                    }
                    options.companyName = doc.name;
                    options.companyEmail = 'johnnye.be@gmail.com'//doc.email;
                    options.companyLogo = doc.logoUri;
                    mailer.sendWeeklyAnalytic(options, eachCb)
                });
            }, function (err) {
                if (err) {
                    return console.error(err);
                }
                res.status(200).send('Notifications successfully sent');

            });
        });
    };

    this.sendDaily = function (req, res, next) {
        var contentId = req.query.contentId;
        async.waterfall([

                function (waterfallCb) {
                    TrackModel.find({contentId: contentId}, function (err, docs) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        if (!docs.length) {
                            var error = new Error();
                            error.message = 'No data to send';
                            return waterfallCb(error);
                        }
                        waterfallCb(null, docs)
                    });
                },

                // supplement name & email field if they missing
                function (docs, waterfallCb) {
                    async.each(docs, function (track, eachCb) {
                        if (!track.firstName || !track.lastName || !track.email) {
                            TrackModel.findOne({jumpleadId: track.jumpleadId}, function (err, doc) {
                                if (err) {
                                    return eachCb(err);
                                }
                                track.firstName = doc.firstName;
                                track.lastName = doc.lastName;
                                track.email = doc.email;
                                eachCb(null);
                            })
                        } else {
                            return eachCb(null);
                        }
                    }, function (err) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, docs)
                    });
                },

                //Populate contentId field
                function (docs, waterfallCb) {
                    ContentModel.populate(docs, {path: 'contentId'}, function (err, popDocs) {
                        if (err) {
                            return waterfallCb(err);
                        }
                        waterfallCb(null, popDocs);
                    });
                },

                //send notification to company email
                function (docs, waterfallCb) {
                    async.each(docs, function (doc, cb) {
                        var name = doc.firstName + ' ' + doc.lastName;
                        var data = {
                            companyName: doc.contentId.name,
                            companyEmail: doc.contentId.email,
                            name: name,
                            email: doc.email,
                            documents: doc.documents,
                            videos: doc.videos,
                            questions: doc.questions
                        };
                        mailer.sendTrackInfo(data, cb);
                    }, function (err) {
                        if (err) {
                            return waterfallCb(err)
                        }
                        waterfallCb(null);
                    });
                }],
            function (err) {
                if (err) {
                    return console.error(err);
                }
                res.status(200).send('Notifications successfully sent');
            });
    };
};

module.exports = routeHandler;