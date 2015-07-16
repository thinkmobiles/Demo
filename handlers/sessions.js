var Session = function (db) {

    this.login = function (req, options) {
        if(!options) return false;
        req.session.loggedIn = true;
        req.session.uId = options._id;
        return true;
    };

    this.kill = function (req, res, next) {

        if (req.session && req.session.uId) {
            req.session.destroy();
        }
        res.redirect('/#/home');
    };

    this.isAuthenticated = function (req, res, next) {
        if (req.session && req.session.uId && req.session.loggedIn) {
            next();
        } else {
            var err = new Error('Forbidden');
            err.status = 403;
            next(err);
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
