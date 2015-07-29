'use strict';

module.exports = (function () {
    var CONSTANTS = require('../constants/index');
    var NAME_MIN_LENGTH = CONSTANTS.USERNAME_MIN_LENGTH;
    var NAME_MAX_LENGTH = CONSTANTS.USERNAME_MAX_LENGTH;
    var ORGANIZATION_MIN_LENGTH = CONSTANTS.ORGANIZATION_MIN_LENGTH;
    var ORGANIZATION_MAX_LENGTH = CONSTANTS. ORGANIZATION_MAX_LENGTH;
    var PASS_MIN_LENGTH = CONSTANTS.PASS_MIN_LENGTH;
    var PASS_MAX_LENGTH = CONSTANTS.PASS_MAX_LENGTH;

    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var userSchema = mongoose.Schema({
        avatar: {type: String},
        email: {type: String, required: true},
        jumpleadEmail: {type: String},
        firstName: {type: String, required: true, minlength: NAME_MIN_LENGTH, maxlength: NAME_MAX_LENGTH},
        lastName: {type: String, required: true, minlength: NAME_MIN_LENGTH, maxlength: NAME_MAX_LENGTH},
        userName: {type: String, required: true,  minlength: NAME_MIN_LENGTH, maxlength: NAME_MAX_LENGTH},
        organization: {type: String, required: true, minlength: ORGANIZATION_MIN_LENGTH, maxlength: ORGANIZATION_MAX_LENGTH},
        pass: {type: String, required: true/*, minlength: PASS_MIN_LENGTH, maxlength: PASS_MAX_LENGTH*/},
        isConfirmed: {type: Boolean, default: false},
        isAdmin: {type: Boolean, default: false},
        isDisabled: {type: Boolean, default: false},
        confirmToken: {type: String},
        forgotToken: {type: String},
        phone: {type: String, default: ""},
        contentId: {type: ObjectId, ref: 'Content'},
        accessToken: {type: String},
        refreshToken: {type: String},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}

    }, {collection: 'Users'});

    mongoose.model('User', userSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['User'] = userSchema;

    if (process.env.NODE_ENV !== 'production') {
        userSchema.set('autoIndex', false);
    }

})();
