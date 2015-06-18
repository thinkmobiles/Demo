define([
    'text!templates/home/HomeTemplate.html',
	'views/home/modalView'
], function (HomeTemplate, ModalView) {

    var View;

    View = Backbone.View.extend({
        className: "mainPage",
		el:"#wrapper",
        events: {
            "click .showModal":"showModal",
            "click .checkbox":"checkboxClick"
        },


        initialize: function (options) {
			this.options = options;
			this.modal = null;
            this.render();
        },

		checkboxClick:function(e){
			$(e.target).closest(".checkbox").toggleClass("checked");
		},

        showModal:function(){
			if(this.modal){
				this.modal.undelegateEvents();
			}
			this.modal =new ModalView(this.options);
		},


        render: function () {
            this.$el.html(_.template(HomeTemplate));
            return this;
        }


    });
    return View;
});
