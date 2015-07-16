define([
    'models/videoAnalyticModel'
], function (deviceModel) {
    var Collection = Backbone.Collection.extend({
        model: deviceModel,
		initialize: function (options) {
            var that = this;
            this.fetch({
                data: options,
                reset: true,
                success: function () {

                },
                error: function (models, xhr) {
                    if (xhr.status === 401) Backbone.history.navigate('#login', { trigger: true });
                }
            });
        },
		update:function (options) {
            var that = this;
            this.fetch({
                data: options,
                reset: true,
                success: function () {

                },
                error: function (models, xhr) {
                    if (xhr.status === 401) Backbone.history.navigate('#login', { trigger: true });
                }
            });
        },
        url: function () {
            return "/analytic/contact"
        },
        parse: function (response) {
            return response;
        }
    });

    return Collection;
});
