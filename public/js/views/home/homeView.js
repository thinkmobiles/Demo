define([
    'text!templates/home/HomeTemplate.html',
    'text!templates/home/modalTemplate.html'
], function (HomeTemplate, modalTemplate) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
        isNew: true,

        events: {
            "click .showModal":"showModal"
        },


        initialize: function () {

            this.render();
        },

        showModal:function(){
            var formString = _.template(modalTemplate)({

            });
            $(formString).dialog({
                closeOnEscape: false,
                dialogClass: "edit-dialog",
                width: 425
            });
        },


        // render template (once! because google maps)
        render: function () {
            this.$el.html(_.template(HomeTemplate));
            return this;
        }


    });
    return View;
});