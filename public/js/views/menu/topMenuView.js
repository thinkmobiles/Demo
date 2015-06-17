define([
    'text!templates/menu/topMenuTemplate.html',
	'views/home/modalView'
], function (topMenuTemplate, ModalView) {

    var View;
    View = Backbone.View.extend({
        el: '#topMenu',

        events: {
			//"click .showModal":"showModal",
            'click #logOut': 'logout',
            'click .topMenu' :'changeTab'
        },


        initialize: function () {
            // keep menu actual
            this.render();
        },

        showModal:function(){
			var modalView  = new ModalView();
		},

		
        changeTab: function(event) {
            var holder = $(event.target);
            var closestEl = holder.closest('.loggedMenu');
            closestEl.find(".active").removeClass("active");
            holder.addClass("active");

        },


        render: function () {

            this.$el.html(_.template(topMenuTemplate));
            return this;
        }
    });
    return View;
});
