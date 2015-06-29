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
			this.listenTo(App.sessionData, 'change:authorized', this.render);
            this.render();
        },

		toPage:function(){
			$("body").removeClass("withLogin");
		},

		login: function(e){
			e.stopPropagation();
			$("body").addClass("withLogin");
			console.log($(".signIn .username .userName")[0]);
			setTimeout(function(){
				$(".signIn .username .userName")[0].focus();
			},550);
			
		},

        
        showModal:function(){
			var modalView  = new ModalView();
		},

        changeTab: function(event) {
            var holder = $(event.target);
            var closestEl = holder.closest('.loggedMenu');

        },


        render: function () {

            console.log(App.sessionData.get("authorized"));

            this.$el.html(_.template(topMenuTemplate)({
				authorized:App.sessionData.get("authorized"),
				user:App.sessionData.get("user")
			}));
            return this;
        }
    });
    return View;
});
