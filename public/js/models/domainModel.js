/**
 * Created by slavik on 16.06.2015.
 */
define(['validation'], function (validation) {
    var Model = Backbone.Model.extend({
        idAttribute: "_id",
        url: function () {
            var self =this;
            return "/analytic/allDomain?id=" + self.campaignId ;
        },
        initialize: function (options) {
            this.campaignId = options.campaignId;
            //this.fetch({
            //    data: options,
            //    reset: true,
            //    success: function () {
            //
            //    },
            //    error: function (models, xhr) {
            //        if (xhr.status === 401) Backbone.history.navigate('#login', { trigger: true });
            //    }
            //});
            this.on('invalid', function (model, errors) {
                if (errors.length > 0) {
                    var msg = errors.join('\n');
                    alert(msg);
                }
            });
        },
        //update: function (options) {
        //    this.fetch({
        //        data: options,
        //        reset: true,
        //        success: function () {
        //            console.log('prospectActivityModel updated')
        //        },
        //        error: function (models, xhr) {
        //            if (xhr.status === 401) Backbone.history.navigate('#login', { trigger: true });
        //        }
        //    });
        //},
    });
    return Model;
});
