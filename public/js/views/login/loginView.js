define([
    'text!templates/login/LoginTemplate.html',
    'text!templates/login/collapseQuestion.html',
    'text!templates/login/videoElement.html',
    'custom',
    'validation'
], function (LoginTemplate, CollapseQuestion, VideoElement, Custom, validation) {

    var View;
    View = Backbone.View.extend({

        initialize: function () {
            this.setDefaultData();

            // keep data actual
            this.listenTo(this.stateModel, 'change', this.render);
			this.countQuestion = 0;
			
            this.render();
        },

        events: {
            "submit #loginForm": "login",
            "click .decline": "decline",
            "click .question": "question",
            "click .login-button": "login",
            "click .uploadContainer.file": "browse",
            "change .uploadContainer.file input[type='file']": "changeFile",
            "click .uploadContainer.file input[type='file']": "clickOnFile"
        },

        //reset the data
        setDefaultData: function () {
            var defaultData = {
                rememberMe:false,
                email: '',
                password: '',
                errors: false,
                messages: false,
                errObj: false
            };

            if (this.stateModel) {
                this.stateModel.set(defaultData);
            } else {
                this.stateModel = new Backbone.Model(defaultData);
            }
        },

		clickOnFile:function(e){
			e.stopPropagation();
	
		},


		question:function(e){
			var self = this;
			e.preventDefault();
			this.countQuestion++;
			
			$(this.$el).find(".collapseQuestions").append(_.template(CollapseQuestion)({
				question:$(e.target).closest(".videoElement").find(".questionText").val(),
				video:self.getFiles($(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files),
				pdf:self.getFiles($(e.target).closest(".videoElement").find(".left input[type='file']").get(0).files),
			}));
			$(this.$el).find(".countQuestion").val(this.countQuestion);
			$(e.target).closest(".videoElement").hide();
			$(this.$el).find(".videoContainer").append(_.template(VideoElement)({index:this.countQuestion+1}));
		},

		decline: function(e){
			e.preventDefault();
			window.location="/#home";
		},

		browse: function(e){
			$(e.target).closest(".uploadContainer").find("input[type='file']").click();
		},

		getFiles:function(files){
			var s = "";
			for (var i=0;i<files.length;i++){
				s += files[0].name+" "
			}
			return s;
		},

		changeFile:function(e){
			var self = this;
			$(e.target).closest(".uploadContainer").find("input[type='text']").val(self.getFiles($(e.target).get(0).files));
		},
		
        afterUpend: function () {
            //update page when reopened
            this.setDefaultData();
            this.render();
        },

        login: function (event) {
            event.stopImmediatePropagation();
            event.preventDefault();

            var self = this;
            var errors = [];
            var messages = [];
            var errObj = {};

            var stateModelUpdate = {
                errors: false,
                messages: false,
                email: this.$el.find("#email").val().trim(),
                password: this.$el.find("#password").val().trim(),
                rememberMe: this.$el.find('#rememberMe').prop('checked')
            };

            this.stateModel.set(stateModelUpdate);

            // validation
            validation.checkEmailField(messages, true, stateModelUpdate.email, 'Email');
            validation.checkPasswordField(errObj, true, stateModelUpdate.password, 'Password');

            for (var my in errObj) {
                if (errObj[my].length>0){
                    messages.push(errObj[my]);
                }
            }

            if (errors.length > 0 || messages.length > 0) {
                if (errors.length > 0) {
                    stateModelUpdate.errors = errors;
                }
                if (messages.length > 0) {
                    stateModelUpdate.messages = messages;
                }
                this.stateModel.set(stateModelUpdate);
                // if errors prevent request
                return this;
            }
            $.ajax({
                url: "/signIn",
                type: "POST",
                dataType: 'json',
                data: {
                    email: stateModelUpdate.email,
                    pass: stateModelUpdate.password,
                    rememberMe : stateModelUpdate.rememberMe
                },
                success: function (response) {
                    App.sessionData.set({
                        authorized: true,
                        admin: false,
                        user: response.user
                    });
                    App.router.navigate("main", {trigger: true});
                    self.stateModel.set({
                        password: '',
                        errors: false,
                        messages: false,
                        email: ''
                    });
                },
                error: function (err) {
                    App.sessionData.set({
                        authorized: false,
                        admin: false,
                        user: null
                    });

                    //App.error(err);

                    self.stateModel.set({
                        errors: [err.responseJSON.error],
                        password: null
                    });
                }
            });
            return this;
        },

        render: function () {
            this.$el.html(_.template(LoginTemplate, this.stateModel.toJSON()));
            return this;
        }

    });

    return View;

});
