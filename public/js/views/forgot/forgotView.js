define([
    'text!templates/forgot/forgotTemplate.html',
	"validation"
], function (Template, validation) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
			"click .buttons .cancel" :"back" ,
			"click .buttons .registerBtn" :"send" ,
        },
        initialize: function () {
            this.render();
        },
		
		back: function(){
			Backbone.history.navigate("#/home", {trigger: true});
		},

		
		send: function(){
			var self = this;
			var isError = false;
			
			self.$el.find(".registration .error").removeClass("error");
			
			if (!validation.validEmail(self.$el.find(".registration .email").val())){
				isError = true;
				self.$el.find(".registration .email").addClass("error");
			}
			if (isError){
                App.notification('Email is not valid');
                return;
            }
			
			$.ajax({
                url: "/forgot",
                type: "POST",
                dataType: 'json',
                data: {
                    email: self.$el.find(".registration .email").val()
                },
                success: function (response) {
					Backbone.history.navigate("#/home",{ trigger:true });
					App.notification("Recover link send to your email");
                },
                error: function (err) {
					App.notification("Some error");
				}
            });
		},
		
        render: function () {
            this.$el.html(_.template(Template));
            return this;
        }

    });

    return View;

});
