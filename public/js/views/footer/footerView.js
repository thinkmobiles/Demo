define([
    'text!templates/footer/footerTemplate.html'
], function (footerTemplate) {

    var View;
    View = Backbone.View.extend({
        el: '#footer',

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
