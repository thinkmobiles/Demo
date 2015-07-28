define([
    'text!templates/users/usersTemplate.html',
], function (UsersTemplate) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{

        },
        initialize: function () {
            this.render();
        },
		

        render: function () {
            this.$el.html(_.template(UsersTemplate));
            return this;
        }

    });

    return View;

});
