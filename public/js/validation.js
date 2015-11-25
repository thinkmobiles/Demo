define(
    function () {
        //Removed cyrillic chars
        var phoneRegExp = /^[0-9\+]?([0-9-\s()])+[0-9()]$/,
            nameRegExp = /^[a-zA-Z-_\s]{2,50}$/,
            titleRegExp = /^[a-zA-Z-_0-9\s]{2,50}$/,
            orgRegExp = /^[a-zA-Z-_0-9!?\s]{2,50}$/,
            commentRegExp = /^[^~<>\^\*₴]{1,300}$/,
            loginRegExp = /[\w\.@]{4,30}$/,
            passRegExp = /^[\w\.@!@#+-]{3,50}$/,
            invalidCharsRegExp = /[~<>\^\*₴]/,
            emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            loggedRegExp = /^([0-9]{1,9})\.?([0-9]{1,2})?$/,
            urlRegExp = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\xffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/;
        var MIN_LENGTH = 2,
            LOGIN_MIN_LENGTH = 5;

        var validateUrl = function (validatedString) {
            return urlRegExp.test(validatedString);
        };

        var validateEmail = function (validatedString) {
            return emailRegExp.test(validatedString);
        };

        var validateUserName = function (validatedString) {
            return loginRegExp.test(validatedString);
        };

        var validateComment = function (validatedString) {
            return commentRegExp.test(validatedString);
        };

        var validateTitle = function (validatedString) {
            return titleRegExp.test(validatedString);
        };

        var validateOrg = function (validatedString) {
            return orgRegExp.test(validatedString);
        };

        var validateLogin = function (validatedString) {
            return loginRegExp.test(validatedString);
        };

        var requiredFieldLength = function (validatedString) {
            return validatedString.length >= MIN_LENGTH;
        };

        var validatePhone = function (validatedString) {
            return phoneRegExp.test(validatedString);
        };

        var validateName = function (validatedString) {
            return nameRegExp.test(validatedString);
        };


        var validatePass = function (validatedString) {
            return passRegExp.test(validatedString);
        };

        var validateLoggedValue = function (validatedString) {
            return loggedRegExp.test(validatedString);
        };

        var validateLength = function (validatedString, minLength, maxLength) {
                return (validatedString && validatedString.length >= minLength && validatedString.length <= maxLength)

            };

        var errorMessages = {
            invalidNameMsg: "field value is incorrect. field can not contain '~ < > ^ * ₴' signs only a-z A-Z",
            invalidLoginMsg: "field value is incorrect. It should contain only the following symbols: A-Z, a-z, 0-9, _ @",
            loggedNotValid: "field should contain a valid decimal value with max 1 digit after dot",
            invalidEmailMsg: "field should contain a valid email address",
            requiredMsg: "field can not be empty",
            invalidCharsMsg: "field can not contain '~ < > ^ * ₴' signs",
            invalidPhoneMsg: "field should contain only numbers and '+ - ( )' signs",
            passwordsNotMatchMsg: "Password and confirm password field do not match."
        };

        var comparePasswords = function (errorArray, password, confirmPass) {
            if (password && confirmPass)
                if (password !== confirmPass)
                    errorArray.push(errorMessages.passwordsNotMatchMsg);
        };

        return {
            comparePasswords: comparePasswords,
            validEmail: validateEmail,
            withMinLength: requiredFieldLength,
            validLoggedValue: validateLoggedValue,
            validLogin: validateLogin,
            validPass: validatePass,
            validPhone: validatePhone,
            validComment: validateComment,
            validTitle: validateTitle,
            validOrg: validateOrg,
            validName: validateName,
            validLength: validateLength,
            validURL: validateUrl
        }
    }
)
;
