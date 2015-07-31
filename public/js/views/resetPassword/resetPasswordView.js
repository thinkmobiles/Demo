define([
    'text!templates/resetPassword/resetPasswordTemplate.html',
	"validation",
	"checkPass"
], function (Template, validation, checkPass) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
			"input .pass": "progressBar",
			"click .buttons .cancel" :"back" ,
			"click .buttons .registerBtn" :"send",
			"keyup .required input":"changeText"
        },
        initialize: function (options) {
			this.token = options.token;
            this.render();
        },

		changeText: function(e){
			if($(e.target).val()){
				$(e.target).parents(".required").addClass("full");
			}else{
				$(e.target).parents(".required").removeClass("full");
			}
		},

		back: function(){
			Backbone.history.navigate("#/home", {trigger: true});
		},

		progressBar: function () {
			var pass = $(".pass").val();
			var rate = checkPass.scorePassword(pass);
			var add = checkPass.checkPassStrength(pass);
			var remove = add==="weak"?"good strong":(add==="good"?"weak strong":"good weak");
			//console.log( $("#progressBar"));
			$(".progressBar").progressbar({value: rate});
			$(".ui-progressbar-value").addClass(add).removeClass(remove);
		},

		send: function(){
			var self = this;
			var isError = false;
			
			self.$el.find(".registration .error").removeClass("error");
			
			var pass = self.$el.find(".registration .pass").val();
            var rate = checkPass.scorePassword(pass);
			
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
					Backbone.history.navigate("#/home",{ trigger:true });
					App.notification("Password was changed");
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
