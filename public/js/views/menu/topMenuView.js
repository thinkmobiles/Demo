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
            'click .login': 'login',
            'click .navBar': 'toPage',
            'click .topMenu' :'changeTab'
        },


        initialize: function () {
            // keep menu actual
            this.render();
        },

		toPage:function(){
			$("body").removeClass("withLogin");
		},

		login: function(e){
			e.stopPropagation();
			$("body").addClass("withLogin");
		},

        showModal:function(){
			var modalView  = new ModalView();
		},

		
        changeTab: function(event) {
            var holder = $(event.target);
            var closestEl = holder.closest('.loggedMenu');

        },


        render: function () {

            this.$el.html(_.template(topMenuTemplate));
            return this;
        }
    });
    return View;
});
