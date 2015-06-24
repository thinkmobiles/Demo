define([
    'text!templates/registration/RegistrationTemplate.html',
    '../../checkPass'
], function (RegistrationTemplate, checkPass) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
            "input #pass": "progressBar",
            "click .cancel":"cancel",
            "click .registerBtn":"register",
            "click .preview":"showFiles",
            "change #ava":"showPreview"
        },
        initialize: function () {
            $("#progressBar").progressbar({value: 5 });
            this.render();
        },

		showFiles: function(e){
			this.$el.find("#ava").click();
		},

		showPreview: function(e){
			var input = e.target;
			if ( input.files && input.files[0] ) {
				var FR= new FileReader();
				FR.onload = function(e) {
					$('.preview').attr( "src", e.target.result );
				};       
				FR.readAsDataURL( input.files[0] );
			}
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
				xhrFields: {
					withCredentials:true
				},
                data: {
                    email: self.$el.find(".registration .email").val(),
                    firstName: self.$el.find(".registration .firstName").val(),
                    lastName: self.$el.find(".registration .lastName").val(),
                    userName: self.$el.find(".registration .userName").val(),
                    organization: self.$el.find(".registration .organization").val(),
                    pass: self.$el.find(".registration .pass").val(),
                    avatar: self.$el.find(".registration .preview").attr("src")
                },
                success: function (model) {
					console.log(model);
					window.location = 'https://account.mooloop.com/oauth/authorize?response_type=code&client_id=FcDOCBsnZ2TtKbHTGULY&redirect_uri=http://demo.com:8838/redirect&scope=jumplead.contacts';
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
            Backbone.history.navigate("#/home", {trigger: true});
		},
		
        render: function () {
            this.$el.html(_.template(RegistrationTemplate));
            return this;
        }

    });

    return View;

});
