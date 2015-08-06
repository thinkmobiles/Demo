define([
    'text!templates/menu/topMenuTemplate.html'
], function (topMenuTemplate) {

    var View;
    View = Backbone.View.extend({
        el: '#topMenu',

        events: {
			//"click .showModal":"showModal",
            'click #logOut': 'logout',
            'click .login': 'login',
            'click .navBar': 'toPage',
            "click .topMenu":"toTop"
        },


        initialize: function () {
            // keep menu actual
			this.listenTo(App.sessionData, 'change:authorized', this.render);
            this.render();
        },

        toTop:function(){
            $('html, body').animate({ scrollTop: 0 }, 'medium');
        },

		toPage:function(){
			$("body").removeClass("withLogin");
		},

		login: function(e){
			e.stopPropagation();
			$("body").addClass("withLogin");
			setTimeout(function(){
				$(".signIn .username .userName")[0].focus();
			},550);

		},


        render: function () {

            console.log(App.sessionData.get("authorized"));

            this.$el.html(_.template(topMenuTemplate)({
				authorized: App.sessionData.get("authorized"),
				admin: App.sessionData.get("admin"),
				user: App.sessionData.get("user")
			}));
            return this;
        }
    });
    return View;
});
