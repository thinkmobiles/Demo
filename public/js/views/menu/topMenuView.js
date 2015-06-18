define([
    'text!templates/menu/topMenuTemplate.html',
	'views/home/modalView',
	'views/home/passView'
], function (topMenuTemplate, ModalView, passView) {

    var View;
    View = Backbone.View.extend({
        el: '#topMenu',

        events: {
			//"click .showModal":"showModal",
            'click #logOut': 'logout',
            'click .topMenu' :'changeTab',
            'click .checkPass': 'checkPass'
        },


        initialize: function () {
            // keep menu actual
            this.render();
        },

        showModal:function(){
			var modalView  = new ModalView();
		},

        checkPass: function(){
            var modalView  = new passView();
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
