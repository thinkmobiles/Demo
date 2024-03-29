var USER_ROLES = require('../constants/userRoles');
var badRequests = require('../helpers/badRequests');

var Session = function (db) {

    this.login = function (req, options) {
        if(!options) return false;
        req.session.loggedIn = true;
        req.session.uId = options._id;
        req.session.isConfirmed = options.isConfirmed;
        req.session.isDisabled = options.isDisabled;
        req.session.role = options.role;
        req.session.creator = (options.role===USER_ROLES.USER_ADMINISTRATOR||options.role===USER_ROLES.USER_VIEWER)?options.creator:null;
        return true;
    };

    this.kill = function (req, res, next) {
        if (req.session && req.session.uId) {
            req.session.destroy();
        }
        res.redirect('/#/home');
    };

    this.isAuthenticated = function (req, res, next) {
        if (req.session && req.session.uId && req.session.loggedIn && req.session.isConfirmed) {
            next();
        } else {
            next(badRequests.UnauthorizedError());
        }
    };

    this.isAuthenticatedSuperAdmin = function (req, res, next) {
        if (req.session && req.session.uId && req.session.loggedIn && req.session.isConfirmed && req.session.role == USER_ROLES.ADMIN) {
            next();
        } else {
            if (req.session && req.session.uId) {
                next(badRequests.AccessError());
            }
            next(badRequests.UnauthorizedError());
        }
    };

    this.isAuthenticatedAdmin = function (req, res, next) {
        if (req.session && req.session.uId && req.session.loggedIn && req.session.isConfirmed && (req.session.role == USER_ROLES.ADMIN || req.session.role == USER_ROLES.USER)) {
            next();
        } else {
            if (req.session && req.session.uId) {
                next(badRequests.AccessError());
            }
            next(badRequests.UnauthorizedError());
        }
    };

    this.isAuthenticatedAdminRights = function (req, res, next) {
        if (req.session && req.session.uId && req.session.loggedIn && req.session.isConfirmed && (req.session.role == USER_ROLES.USER_ADMINISTRATOR || req.session.role == USER_ROLES.ADMIN)|| req.session.role == USER_ROLES.USER) {
            next();
        } else {
            if (req.session && req.session.uId) {
                next(badRequests.AccessError());
            }
            next(badRequests.UnauthorizedError());
        }
    };

   /* this.register = function (req, res, userModel, options) {
        var status = (options && options.status) ? options.status : 200;
        var role;

        if (userModel.role === USER_ROLES.ADMIN) {
            role = SESSION_ADMIN;
        } else {
            role = SESSION_USER;
        }

        req.session.loggedIn = true;
        req.session.userId = userModel._id;
        req.session.userRole = role;

        if (options && options.rememberMe) {
            req.session.rememberMe = true;
            req.session.cookie.maxAge = 1000 * 3600 * 24 * 365 * 5;
        } else {
            req.session.rememberMe = false;
        }

        if (options && options.device) {
            req.session.deviceId = options.device._id;
        }

        if (process.env.NODE_ENV === 'test') {
            res.status(status).send({
                success: "Login successful",
                user: userModel
            });
        } else {
            res.status(status).send({success: "Login successful", user: userModel});
        }

    };*/



};

module.exports = Session;
