'use strict';

module.exports = (function () {
    var CONSTANTS = require('../constants/index');
    var NAME_MIN_LENGTH = CONSTANTS.USERNAME_MIN_LENGTH;
    var NAME_MAX_LENGTH = CONSTANTS.USERNAME_MAX_LENGTH;
    var PHONE_MIN_LENGTH = CONSTANTS.PHONE_MIN_LENGTH;
    var PHONE_MAX_LENGTH = CONSTANTS.PHONE_MAX_LENGTH;
    var TITLE_MIN_LENGTH = CONSTANTS.PHONE_MIN_LENGTH;
    var TITLE_MAX_LENGTH = CONSTANTS.PHONE_MAX_LENGTH;
    var ORGANIZATION_MIN_LENGTH = CONSTANTS.ORGANIZATION_MIN_LENGTH;
    var ORGANIZATION_MAX_LENGTH = CONSTANTS. ORGANIZATION_MAX_LENGTH;
    var COMMENTS_MAX_LENGTH = CONSTANTS. COMMENTS_MAX_LENGTH;


    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var userSchema = mongoose.Schema({
        email: {type: String, required: true, unique: true},
        pass: {type: String},
        confirmToken: {type: String},
        firstName: {type: String, minlength: NAME_MIN_LENGTH, maxlength: NAME_MAX_LENGTH},
        lastName: {type: String, minlength: NAME_MIN_LENGTH, maxlength: NAME_MAX_LENGTH},
        phone: {type: String, required: true,  minlength: PHONE_MIN_LENGTH, maxlength: PHONE_MAX_LENGTH},
        organization: {type: String, required: true, minlength: ORGANIZATION_MIN_LENGTH, maxlength: ORGANIZATION_MAX_LENGTH},
        title: {type: String, required: true, minlength: TITLE_MIN_LENGTH, maxlength: TITLE_MAX_LENGTH},
        comments: {type: String, default: "", maxlength:  COMMENTS_MAX_LENGTH},
        createdAt: {type: Date, default: Date.now},
        updatedAt: {type: Date, default: Date.now}

        //forgotToken: {type: String},
        //minderId: {type: String, required: true, unique: true},
        //role: {type: Number, required: true, default: USER_ROLES.USER}
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