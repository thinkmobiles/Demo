define([
    'text!templates/pricing/pricingTemplate.html'
], function (Template) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
            "click .contactUs": "contact",
        },
        initialize: function () {
            this.render();
        },
        contact: function () {
            Backbone.history.navigate("#/contact", {trigger: true});
            $("body").removeClass("withLogin");
            $('html, body').animate({ scrollTop: 0 }, 'medium');
        },

		
        render: function () {
            this.$el.html(_.template(Template));
            return this;
        }

    });

    return View;

});
