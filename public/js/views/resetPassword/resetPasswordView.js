define([
    'text!templates/resetPassword/resetPasswordTemplate.html',
	"validation",
	"checkPass"
], function (Template, validation, checkPass) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
			"click .buttons .cancel" :"back" ,
			"click .buttons .registerBtn" :"send"
        },
        initialize: function (options) {
			this.token = options.token;
            this.render();
        },
		
		back: function(){
			Backbone.history.navigate("#/home", {trigger: true});
		},

		
		send: function(){
			var self = this;
			var isError = false;
			
			self.$el.find(".registration .error").removeClass("error");
			
			var pass = self.$el.find(".registration .pass").val();
            var rate = checkPass.scorePassword(pass)
			
			if (!pass || rate<30){
				isError = true;
				self.$el.find(".registration .pass").addClass("error");
			}

			if (!self.$el.find(".registration .conf").val() || self.$el.find(".registration .conf").val()!==self.$el.find(".registration .pass").val()){
				isError = true;
				self.$el.find(".registration .conf").addClass("error");
			}
			if (isError)return;
			
			$.ajax({
                url: "/changePassword",
                type: "POST",
                dataType: 'json',
                data: {
					token:self.token,
                    password: self.$el.find(".registration .pass").val()
                },
                success: function (response) {
					Backbone.history.navigate("#/home",{ trigger:true })
					App.notification("Password was chnaged");
                },
                error: function (err) {
					App.notification((err.responseJSON?err.responseJSON.message:"Some Error"));
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
