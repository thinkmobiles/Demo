define([
    'models/domainModel'
], function (model) {
    var Collection = Backbone.Collection.extend({
        model: model,
		initialize: function (options) {
            var that = this;
            this.fetch({
                data: options,
                reset: true,
                success: function () {

                },
                error: function (models, xhr) {
                    App.error(xhr);
                }
            });
        },
        update: function (options) {
            this.fetch({
                reset: true,
                data: options,
                success: function () {
                },
                error: function (models, xhr) {
                    App.error(xhr);
                }
            });
        },
        url: function () {
            return "/analytic/contactMe"
        },
        parse: function (response) {
            return response;
        }
    });

    return Collection;
});
