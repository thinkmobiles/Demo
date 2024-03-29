'use strict';

var BadRequestModule = function () {
    var DEFAULT_ERROR_NAME = 'Error';
    var DEFAULT_ERROR_MESSAGE = 'error';
    var DEFAULT_ERROR_STATUS = 400;

    var NOT_ENAUGH_PARAMS = "Not enough incoming parameters.";
    var INVALID_EMAIL = "Invalid email address.";
    var EMAIL_IN_USE = 'Email in use. Please input another email address.';
    var USERNAME_IN_USE = 'Username in use. Please input another username.';

    function Errors(options) {
        //http://j-query.blogspot.com/2014/03/custom-error-objects-in-javascript.html
        Error.captureStackTrace(this);

        if (options && options.name) {
            this.name = options.name;
        } else {
            this.name = DEFAULT_ERROR_NAME;
        }

        if (options && options.message) {
            this.message = options.message;
        } else {
            this.message = DEFAULT_ERROR_MESSAGE;
        }

        if (options && options.status) {
            this.status = options.status;
        } else {
            this.status = DEFAULT_ERROR_STATUS;
        }
    }

    Errors.prototype = Object.create(Error.prototype);

    function NotEnParams(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'NotEnoughIncomingParameters';
        }

        if (!errOptions.message) {
            errOptions.message = NOT_ENAUGH_PARAMS;
        }
        if (options && options.reqParams) {
            errOptions.message += 'This parameters are required: ' + options.reqParams;
        }

        return new Errors(errOptions);
    }

    function InvalidEmail(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'InvalidEmal';
        }
        if (!errOptions.message) {
            errOptions.message = INVALID_EMAIL;
        }

        return new Errors(errOptions);
    }

    function EmailInUse(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'DoubledEmail';
        }
        if (!errOptions.message) {
            errOptions.message = EMAIL_IN_USE;
        }

        return new Errors(errOptions);
    }
    function UsernameInUse(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'DoubledUsername';
        }
        if (!errOptions.message) {
            errOptions.message = USERNAME_IN_USE;
        }

        return new Errors(errOptions);
    }


    function InvalidValue(options) {
        var errOptions;
        var errMessage;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'InvalidValue';
        }

        if (!errOptions.message) {
            errMessage = 'Invalid value';
            if (errOptions.value) {
                errMessage += ' ' + options.value;
            }
            if (errOptions.param) {
                errMessage += ' for "' + options.param + '"';
            }
            errOptions.message = errMessage;
        }

        return new Errors(errOptions);
    }



    function NotFound(options) {
        var errOptions;
        var errMessage;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'NotFound';
        }
        if (!errOptions.message) {
            errMessage = 'Not Found';
            if (errOptions.target) {
                errMessage += ' ' + errOptions.target;
            }
            if (errOptions.searchParams) {
                errMessage += ' (' + errOptions.searchParams + ')';
            }
            errOptions.message = errMessage;
        }

        return new Errors(errOptions);
    }

    function UnconfirmedEmail(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'UnconfirmedEmail';
        }
        if (!errOptions.message) {
            errOptions.message = 'Please confirm your account';
        }
        if (!errOptions.status) {
            errOptions.status = 400;
        }

        return new Errors(errOptions);
    }

    function SignInError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'SignInError';
        }
        if (!errOptions.message) {
            errOptions.message = 'Incorrect email or password';
        }
        if (!errOptions.status) {
            errOptions.status = 400;
        }

        return new Errors(errOptions);
    }

    function BlockedAccount(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'BlockedAccount';
        }
        if (!errOptions.message) {
            errOptions.message = 'Your account was blocked!';
        }

        return new Errors(errOptions);
    }

    function AccessError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.status) {
            errOptions.status = 403;
        }

        if (!errOptions.name) {
            errOptions.name = 'Forbidden';
        }
        if (!errOptions.message) {
            errOptions.message = 'You don\'t have permission to perform this action';
        }

        return new Errors(errOptions);
    }

    function UnauthorizedError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.status) {
            errOptions.status = 401;
        }

        if (!errOptions.name) {
            errOptions.name = 'Unauthorized';
        }
        if (!errOptions.message) {
            errOptions.message = 'Your session has expired. Please log in again';
        }

        return new Errors(errOptions);
    }

    function CaptchaError(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'CaptchaError';
        }
        if (!errOptions.status) {
            errOptions.status = 400;
        }
        if (!errOptions.message) {
            errOptions.message = 'The reCAPTCHA wasn\'t entered correctly. Go back and try it again.';
        }

        return new Errors(errOptions);
    }

    function BadRequest(options) {
        var errOptions;

        if (options) {
            errOptions = options;
        } else {
            errOptions = {};
        }

        if (!errOptions.name) {
            errOptions.name = 'BadRequest';
        }
        if (!errOptions.status) {
            errOptions.status = 400;
        }
        if (!errOptions.message) {
            errOptions.message = 'Bad Request';
        }

        return new Errors(errOptions);
    }




    return {
        NotEnParams: NotEnParams,
        InvalidEmail: InvalidEmail,
        EmailInUse: EmailInUse,
        UsernameInUse: UsernameInUse,
        InvalidValue: InvalidValue,
        NotFound: NotFound,
        UnconfirmedEmail: UnconfirmedEmail,
        SignInError: SignInError,
        AccessError: AccessError,
        UnauthorizedError: UnauthorizedError,
        CaptchaError:CaptchaError,
        BlockedAccount: BlockedAccount,
        BadRequest: BadRequest
    }
};

module.exports = new BadRequestModule();