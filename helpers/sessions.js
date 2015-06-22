/**
 * Created by Roman on 12.02.2015.
 */
var Session = function (db) {

    this.login = function (req, res, options) {
        req.session.loggedIn = true;
        req.session.uId = options._id;
        req.session.login = options.email;
        req.session.firstName = options.firstName;
        req.session.lastName = options.lastName;
        //req.session.avatar = options.avatar;
        res.status(200).send({
            success: "Login successful",
            uId: options._id,
            fullName: options.fullName,
            avatar: options.avatar
        });
    };

    this.register = function (req, options) {
        req.session.loggedIn = true;
        req.session.uId = options._id;
      return true;
    };

    this.getUserId = function (req, callback) {
        if (req.session && req.session.uId && req.session.loggedIn) {
         var uId = req.session.uId;
            return callback(null, uId);
        } else {
            var err = new Error('UnAuthorized');
            err.status = 401;
            callback(err);
        }
    }

    this.kill = function (req, res, next) {
        if (req.session) {
            req.session.destroy();
        }
        res.status(200).send({success: "Logout successful"});
    };

    this.authenticatedUser = function (req, res, next) {
        console.log(req.body);
        if (req.session && req.session.uId && req.session.loggedIn) {
            next();
        } else {
            var err = new Error('UnAuthorized');
            err.status = 401;
            next(err);
        }
    };

    this.isAuthenticatedUser = function (req, res, next) {
        if (req.session && req.session.uId && req.session.loggedIn) {
            res.status(200).send({uId: req.session.uId, fullName: req.session.fullName, avatar: req.session.avatar});
        } else {
            var err = new Error('UnAuthorized');
            err.status = 401;
            next(err);
        }
    };

};

module.exports = Session;