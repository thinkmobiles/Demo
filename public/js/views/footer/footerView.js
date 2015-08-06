define([
    'text!templates/footer/footerTemplate.html'
], function (footerTemplate) {

    var View;
    View = Backbone.View.extend({
        el: '#footer',
        events: {
            "click .contactUs": "contact",
            "click ul li a:not(.showModal)": "toTop"
        },
        contact: function () {
            Backbone.history.navigate("#/contact", {trigger: true});
            $("body").removeClass("withLogin");
            $('html, body').animate({ scrollTop: 0 }, 'medium');
        },
        toTop:function(){
            $('html, body').animate({ scrollTop: 0 }, 'medium');
        },
        initialize: function () {
            // keep menu actual
            this.render();
        },


        render: function () {
            this.$el.html(_.template(footerTemplate)());
            return this;
        }
    });
    return View;
});
