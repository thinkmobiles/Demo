'use strict';

module.exports = (function () {
      var mongoose = require('mongoose');

    var contactMeSchema = mongoose.Schema({
        email: {type: String},
        phone: {type: String},
        name: {type: String},
        description: {type: String},

        createdAt: {type: Date, default: Date.now}
    }, {collection: 'Prospects'});

    mongoose.model('ContactMe', contactMeSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['ContactMe'] = contactMeSchema;

    if (process.env.NODE_ENV !== 'production') {
        contactMeSchema.set('autoIndex', false);
    }

})();