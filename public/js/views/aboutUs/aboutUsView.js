define([
    'text!templates/aboutUs/aboutUsTemplate.html'
], function (Template) {
    var View = Backbone.View.extend({

		el:"#wrapper",

        events:{
        },

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(_.template(Template));
            return this;
        }

    });

    return View;

});
