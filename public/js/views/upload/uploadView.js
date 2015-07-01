define([
    'text!templates/login/loginTemplate.html',
    'text!templates/login/collapseQuestion.html',
    'text!templates/login/videoElement.html',
	'./progressBarView',
    'custom',
    'validation'

], function (RegistrationTemplate, CollapseQuestion, VideoElement, progressBarView, Custom, validation) {
    var View = Backbone.View.extend({

		el:"#wrapper",

        initialize: function () {
			this.countQuestion = 0;
            this.render();
        },

        events: {
            "click .decline": "decline",
            "click .save": "save",
            "click .question": "question",
            "click .collapseQuestions .collapseQuestion .close": "removeQuestion",
            "click .login-button": "login",
            "click .uploadContainer.file": "browse",
            "change .uploadContainer.file input[type='file']": "changeFile",
            "click .uploadContainer.file input[type='file']": "clickOnFile",
			"click .ui-dialog-titlebar-close": "decline"
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

		removeQuestion: function(e){
			var current = $(e.target).closest(".collapseQuestion");
			var n = this.$el.find(".collapseQuestions .collapseQuestion").index(current);
			this.$el.find(".videoContainer .videoElement").each(function(index){
				if (index>n){
					$(this).find(".questionText").attr("name","question"+index);
					$(this).find(".right .uploadContainer.file input[type='file']").attr("name","video"+index);
					$(this).find(".right .uploadContainer.link input").attr("name","video"+index);
					$(this).find(".left .uploadContainer.file input[type='file']").attr("name","file"+index);
				}
			});
			this.$el.find(".videoContainer .videoElement").eq(n).remove();
			current.remove();
		},

		clickOnFile:function(e){
            e.stopPropagation();
        },


		question:function(e){
			var self = this;
			var hasError = false;
			e.preventDefault();
			this.countQuestion++;
			$(".error").removeClass("error");

			var videoName = $(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files.length?self.getFiles($(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files):$(e.target).closest(".videoElement").find(".right .uploadContainer.link input[type='text']").val();
		
			if (!$(e.target).closest(".videoElement").find(".questionText").val().trim()){
				$(e.target).closest(".videoElement").find(".questionText").addClass("error")
				hasError = !0;
			}
			if (!videoName){
				$(e.target).closest(".videoElement").find(".right .uploadContainer").addClass("error");
				hasError = !0;
			}
			if (!videoName){
				$(e.target).closest(".videoElement").find(".right .uploadContainer").addClass("error");
				hasError = !0;
			}
			if (!hasError){
				$(this.$el).find(".collapseQuestions").append(_.template(CollapseQuestion)({
					question:$(e.target).closest(".videoElement").find(".questionText").val(),
					video:videoName,
					pdf:self.getFiles($(e.target).closest(".videoElement").find(".left input[type='file']").get(0).files)
				}));
				$(this.$el).find(".countQuestion").val(this.countQuestion);
				$(e.target).closest(".videoElement").hide();
				$(this.$el).find(".videoContainer").append(_.template(VideoElement)({index:this.countQuestion+1}));
			}
		},

		decline: function(e){
			e.preventDefault()
;            Backbone.history.navigate("#/home", {trigger: true});
		},

		save: function(e){
			var self = this;
			e.preventDefault();
			this.$el.find(".error").removeClass("error");
			var hasError = false;
			if (!this.$el.find("textarea[name='desc']").val()){
				this.$el.find("textarea[name='desc']").addClass("error");
				hasError = true;
			}
			if (!this.$el.find("textarea[name='contact']").val()){
				this.$el.find("textarea[name='contact']").addClass("error");
				hasError = true;
			}
			
			if (!this.$el.find(".uploadContainer.file input[name='video']").val()&&!this.$el.find(".uploadContainer.link input[name='video']").val()){
				this.$el.find(".uploadContainer.file input[name='video']").closest(".uploadContainer").addClass("error");
				this.$el.find(".uploadContainer.link input[name='video']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}

			if (!this.$el.find(".uploadContainer.file input[name='logo']").val()){
				this.$el.find(".uploadContainer.file input[name='logo']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}

			if (!this.$el.find(".uploadContainer input[name='name']").val()){
				this.$el.find(".uploadContainer input[name='name']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}
			
			if (hasError){
				return;
			}
			
			



			
			var pb = new progressBarView();
			var form = document.forms.namedItem("videoForm");

			var oData = new FormData(form);
			var oReq = new XMLHttpRequest();

			oReq.upload.addEventListener("progress", function(evt) {
				if (evt.lengthComputable) {
					self.percentComplete = evt.loaded / evt.total;
					self.percentComplete = parseInt(self.percentComplete * 100);

					if (self.percentComplete === 100) {
						//remove dialog
						pb.hide();
					}
				}
			}, false);
			//============================================================
			oReq.upload.addEventListener('progress',visualEffectHandler, false);

			function visualEffectHandler(){
				var value = self.percentComplete
				$('#progress_bar').val(value);

				$('.progress-value').html(value + '%');
					var deg = 360 * value / 100;
				if (value > 50) {
					$('.progress-pie-chart').addClass('gt-50');
				}

				$('.ppc-progress-fill').css('transform', 'rotate(' + deg + 'deg)');
				$('.ppc-percents span').html(value + '%');
				};

				//============================================================


			oReq.open("POST", "/upload", true);
			oReq.onload = function(oEvent) {
				if (oReq.status == 201) {
					try{
						var res = JSON.parse(oReq.response);
						$("<div><input type='text' value='"+res.url+"' readonly/></div>").dialog({
							modal:true,
							closeOnEscape: false,
							appendTo:"#wrapper",
							dialogClass: "link-dialog",
							width: 725
						});
						//window.location="/#home";
						self.$el.find()
					}
					catch(e){
						App.notification(e);
					}
				} else {
					try{
						App.notification(JSON.parse(oReq.responseText).error);
					}catch(e){
						App.notification();
					}
				}
			};

			oReq.send(oData);

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
		
        render: function () {
            this.$el.html(_.template(RegistrationTemplate));
            return this;
        }

    });

    return View;

});
