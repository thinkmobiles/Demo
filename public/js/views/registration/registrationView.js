define([
    'text!templates/registration/registrationTemplate.html',
    '../../checkPass'
], function (RegistrationTemplate, checkPass) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
            "input #pass": "progressBar",
            "click .cancel":"cancel",
            "click .registerBtn":"register"
        },
        initialize: function () {
            $("#progressBar").progressbar({value: 5 });
            this.render();
        },

		register: function(e){
			var self = this;

			var isError = false;
			
			self.$el.find(".registration .error").removeClass("error");

			if (!self.$el.find(".registration .email").val()){
				isError = true;
				self.$el.find(".registration .email").addClass("error");
			}
			if (!self.$el.find(".registration .firstName").val()){
				isError = true;
				self.$el.find(".registration .firstName").addClass("error");
			}
			if (!self.$el.find(".registration .lastName").val()){
				isError = true;
				self.$el.find(".registration .lastName").addClass("error");
			}
			if (!self.$el.find(".registration .userName").val()){
				isError = true;
				self.$el.find(".registration .userName").addClass("error");
			}

			if (!self.$el.find(".registration .organization").val()){
				isError = true;
				self.$el.find(".registration .organization").addClass("error");
			}

			if (!self.$el.find(".registration .pass").val()){
				isError = true;
				self.$el.find(".registration .pass").addClass("error");
			}

			if (!self.$el.find(".registration .conf").val() || self.$el.find(".registration .conf").val()!==self.$el.find(".registration .pass").val()){
				isError = true;
				self.$el.find(".registration .conf").addClass("error");
			}

			if (isError)return;
			$.ajax({
                url: "/signUp",
                type: "POST",
                data: {
                    email: self.$el.find(".registration .email").val(),
                    firstName: self.$el.find(".registration .firstName").val(),
                    lastName: self.$el.find(".registration .lastName").val(),
                    userName: self.$el.find(".registration .userName").val(),
                    organization: self.$el.find(".registration .organization").val(),
                    pass: self.$el.find(".registration .pass").val()
                },
                success: function (model) {
					console.log(model);
					Backbone.history.navigate("home",{ trigger:true })
                },
                error: function (err) {
					console.log(err);

                }
            });
		},

        progressBar: function () {
            var pass = $("#pass").val();
            var rate = checkPass.scorePassword(pass);
            var add = checkPass.checkPassStrength(pass);
            var remove = add=="weak"?"good strong":add=="good"?"weak strong":"good weak";
            //console.log( $("#progressBar"));
            $("#progressBar").progressbar({value: rate});
            $(".ui-progressbar-value").addClass(add).removeClass(remove);
        },
		cancel:function(e){
			Backbone.history.navigate("home",{ trigger:true })
		},
		
        render: function () {
            this.$el.html(_.template(RegistrationTemplate));
            return this;
        }

    });

    return View;

});
