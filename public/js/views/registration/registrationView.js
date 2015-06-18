define([
    'text!templates/registration/registrationTemplate.html',
], function (RegistrationTemplate) {
    var View = Backbone.View.extend({

		el:"#wrapper",

        initialize: function () {
			this.countQuestion = 0;
            this.render();
        },

        events: {
        },

        render: function () {
            this.$el.html(_.template(RegistrationTemplate));
            return this;
        }

    });

    return View;

});
