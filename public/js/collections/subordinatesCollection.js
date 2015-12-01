define([
    'models/subordinatesModel'
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
        update: function () {
            this.fetch({
                reset: true,
                success: function () {
                },
                error: function (models, xhr) {
                    App.error(xhr);
                }
            });
        },
        url: function () {
            return "/subordinates"
        },
        parse: function (response) {
            return response;
        }
    });

    return Collection;
});
