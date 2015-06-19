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
