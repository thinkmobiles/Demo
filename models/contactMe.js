'use strict';

module.exports = (function () {
      var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var contactMeSchema = mongoose.Schema({
        companyId: {type:ObjectId},
        email: {type: String},
        phone: {type: String},
        name: {type: String},
        message: {type: String},
        sandedAt: {type: Date, default: Date.now}
    }, {collection: 'ContactMe'});

    mongoose.model('ContactMe', contactMeSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['ContactMe'] = contactMeSchema;

    if (process.env.NODE_ENV !== 'production') {
        contactMeSchema.set('autoIndex', false);
    }

})();