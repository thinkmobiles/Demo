define([
    'text!templates/home/HomeTemplate.html',
	'views/home/modalView'
], function (HomeTemplate, ModalView) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",

        events: {
            "click .showModal":"showModal"
        },


        initialize: function () {

            this.render();
        },

        showModal:function(){
			var modalView  =new ModalView();
		},


        render: function () {
            this.$el.html(_.template(HomeTemplate));
            return this;
        }


    });
    return View;
});
