define([
    'text!templates/upload/uploadTemplate.html',
	'text!templates/upload/editTemplate.html',
    'text!templates/upload/collapseQuestion.html',
    'text!templates/upload/videoElement.html',
	'./progressBarView',
	"validation"

], function (RegistrationTemplate, EditTemplate,  CollapseQuestion, VideoElement, progressBarView, validation) {
    var View = Backbone.View.extend({

		el:"#wrapper",
		events: {
            "click .removeContent": "remove",
            "click .decline": "decline",
            "click .save:not(.edit)": "save",
			"click .save.edit": "update",
            "click .question": "question",
            "click .collapseQuestions .collapseQuestion .close": "removeQuestion",
            "click .login-button": "login",
            "click .uploadContainer.file": "browse",
            "change .uploadContainer.file input[type='file']": "changeFile",
			"change .uploadContainer input[type='text']": "changeInput",
			"keyup .uploadContainer input[type='text']": "changeInput",
            "click .uploadContainer.file input[type='file']": "clickOnFile",
			"click .link-dialog .ui-dialog-titlebar-close": "decline",
			"click .editContent": "showEdit"
        },

		initialize: function () {
			this.countQuestion = 0;
			this.removedQuestions = [];
			var self = this;
			self.isEdit = false;
			$.ajax({
				type: "GET",
				url: "/content",
				contentType: "application/json",
				success: function (data) {
					self.renderEdit(data);
					self.isEdit = true;
					/*if (!data) {
						console.log('Successfully send')
					} else {
						self.$el.find(".login").hide();
						self.$el.find(".haveContent").show();
						self.$el.find(".haveContent :input").val(data.url);
						console.log("You already have content");
						console.log(data.url);
					}*/
				},
				error: function (model, xhr) {
					self.render();
					console.log(xhr);
					console.log(model);
				}
			});
		},

		update: function(e){
			var self = this;
			e.preventDefault();
			this.$el.find(".error").removeClass("error");
			var hasError = false;
			if (!this.$el.find("textarea[name='desc']").val()){
				this.$el.find("textarea[name='desc']").addClass("error");
				hasError = true;
			}

			if (!validation.validPhone(this.$el.find("input[name='phone']").val())){
				this.$el.find("input[name='phone']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}

			if (!validation.validEmail(this.$el.find("input[name='email']").val())){
				this.$el.find(".uploadContainer input[name='email']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}


			/*if (!this.$el.find(".uploadContainer.file input[name='video']").val()&&!this.$el.find(".uploadContainer.link input[name='video']").val()){
				this.$el.find(".uploadContainer.file input[name='video']").closest(".uploadContainer").addClass("error");
				this.$el.find(".uploadContainer.link input[name='video']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}

			if (!this.$el.find(".uploadContainer.file input[name='logo']").val()){
				this.$el.find(".uploadContainer.file input[name='logo']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}
			if (!this.$el.find(".uploadContainer.file input[name='logo']").val()){
				this.$el.find(".uploadContainer.file input[name='logo']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}*/

			if (!this.$el.find(".uploadContainer input[name='name']").val()){
				this.$el.find(".uploadContainer input[name='name']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}

			if (hasError){
				return;
			}

			var form = document.forms.namedItem("videoForm");

			var oData = new FormData(form);
			var oReq = new XMLHttpRequest();
			this.xhr = oReq;
			if(this.modalProgres) {
				this.modalProgres.undelegateEvents();
			}

			this.modalProgres = new progressBarView(this.xhr);

			oReq.upload.addEventListener("progress", function(evt) {
				if (evt.lengthComputable) {
					self.percentComplete = evt.loaded / evt.total;
					self.percentComplete = parseInt(self.percentComplete * 100);

					if (self.percentComplete === 100) {
						//remove dialog
						self.modalProgres.hide();
					}
				}
			}, false);
			//============================================================
			oReq.upload.addEventListener('progress',visualEffectHandler, false);

			function visualEffectHandler(){
				var value = self.percentComplete;
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


			oReq.open("POST", "content/update", true);
			oReq.onload = function(oEvent) {
				if (oReq.status === 200) {
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
		
		showEdit: function(){
			this.$el.find("form.disableEdit").removeClass("disableEdit");
			this.$el.find("input[type='text']").removeAttr("disabled");
			this.$el.find("textarea").removeAttr("disabled");
			this.$el.find(".editContent").hide();
		},

		remove:function () {
			var self = this;
			var sure = confirm("Are you sure?");
			if (!sure) {
				return;
			}
			$.ajax({
				type: "delete",
				url: "/content",
				contentType: "application/json",
				success: function (data) {
					Backbone.history.navigate("#/upload", {trigger: true});

				},
				error: function (model, xhr) {
					console.log(xhr);
					console.log(model);
				}
			});
		},

		decline: function(e){
			e.preventDefault();
			Backbone.history.navigate("#/home", {trigger: true});
		},
		
		changeInput: function(e){
			if ($(e.target).val()){
				$(e.target).parents(".uploadContainer").find(".right").addClass("active");
			}else{
				$(e.target).parents(".uploadContainer").find(".right").removeClass("active");
			}
		},

		removeQuestion: function(e){
			if (!this.isEdit){
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
				this.countQuestion--;
				$(this.$el).find(".countQuestion").val(this.countQuestion);
				current.remove();
				
			}else{
				var current = $(e.target).closest(".collapseQuestion");
				var cur = current.data("id");
				var n = this.$el.find(".collapseQuestions .collapseQuestion").index(current);
				this.$el.find(".videoContainer .videoElement").eq(n).remove();
				this.removedQuestions.push(cur);
				$(this.$el).find(".removedQuestions").val(this.removedQuestions.join(" "));
				current.remove();
			}
		},

		clickOnFile:function(e){
            e.stopPropagation();
        },


		question:function(e){
			var self = this;
			var hasError = false;
			e.preventDefault();
			$(".error").removeClass("error");

			if(!$(e.target).closest(".videoElement").find(".left .uploadContainer input[type='file']").get(0).files.length){
				$(e.target).closest(".videoElement").find(".left .uploadContainer").addClass("error");
				hasError = !0;
			}

			var videoName = $(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files.length?self.getFiles($(e.target).closest(".videoElement").find(".right .uploadContainer input[type='file']").get(0).files):$(e.target).closest(".videoElement").find(".right .uploadContainer.link input[type='text']").val();
		
			if (!$(e.target).closest(".videoElement").find(".questionText").val().trim()){
				$(e.target).closest(".videoElement").find(".questionText").addClass("error");
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
				this.countQuestion++;

				$(this.$el).find(".collapseQuestions").append(_.template(CollapseQuestion)({
					question:$(e.target).closest(".videoElement").find(".questionText").val(),
					video:videoName,
					pdf:self.getFiles($(e.target).closest(".videoElement").find(".left input[type='file']").get(0).files),
					index:this.countQuestion
				}));
				$(this.$el).find(".countQuestion").val(this.countQuestion);
				$(e.target).closest(".videoElement").hide();
				$(this.$el).find(".videoContainer").append(_.template(VideoElement)({index:this.countQuestion+1}));
			}
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

			if (!validation.validPhone(this.$el.find("input[name='phone']").val())){
				this.$el.find("input[name='phone']").closest(".uploadContainer").addClass("error");
				hasError = true;
			}

			if (!validation.validEmail(this.$el.find("input[name='email']").val())){
				this.$el.find(".uploadContainer input[name='email']").closest(".uploadContainer").addClass("error");
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

			

			var form = document.forms.namedItem("videoForm");

			var oData = new FormData(form);
			var oReq = new XMLHttpRequest();
			this.xhr = oReq;
			if(this.modalProgres) {
				this.modalProgres.undelegateEvents();
			}

			this.modalProgres = new progressBarView(this.xhr);

			oReq.upload.addEventListener("progress", function(evt) {
				if (evt.lengthComputable) {
					self.percentComplete = evt.loaded / evt.total;
					self.percentComplete = parseInt(self.percentComplete * 100);

					if (self.percentComplete === 100) {
						//remove dialog
						self.modalProgres.hide();
					}
				}
			}, false);
			//============================================================
			oReq.upload.addEventListener('progress',visualEffectHandler, false);

			function visualEffectHandler(){
				var value = self.percentComplete;
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


			oReq.open("POST", "content/upload", true);
			oReq.onload = function(oEvent) {
				if (oReq.status === 201) {
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
			if (!$(e.target).closest(".disableEdit").length){
				$(e.target).closest(".uploadContainer").find("input[type='file']").click();
			}
		},

		getFiles:function(files){
			var s = "";
			for (var i=0;i<files.length;i++){
				s += files[i].name+" "
			}
			return s;
		},

		changeFile:function(e){
			var self = this;
			$(e.target).closest(".uploadContainer").find("input[type='text']").val(self.getFiles($(e.target).get(0).files)).change();
		},
		
        render: function () {
            this.$el.html(_.template(RegistrationTemplate));
            return this;
        },
		renderEdit: function (data) {
			var self = this;
            this.$el.html(_.template(EditTemplate)({content:data.content, url:data.url, count:data.content.survey.length+1}));

			this.countQuestion = data.content.survey.length;
			$(this.$el).find(".countQuestion").val(this.countQuestion);
			_.each(data.content.survey,function(item, index){
				var pdf = _.map(item.pdfUri,function(item){
					return item.split("/").pop();
				})
				pdf = pdf.join(" ");
				$(self.$el).find(".collapseQuestions").append(_.template(CollapseQuestion)({
					question:item.question,
					video:item.videoUri.split("/").pop(),
					pdf:pdf,
					index:index
				}));
				$(self.$el).find(".videoContainer").prepend('<div class="videoElement"> </div>');
			});
            return this;
        }
    });

    return View;
});
