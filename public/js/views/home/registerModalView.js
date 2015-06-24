define([
    'text!templates/home/registerModalTemplate.html',
	'views/home/videoModalView',
	 "models/userModel"
], function ( modalTemplate, VideoModalView, UserModel) {

    var View;
	
    View = Backbone.View.extend({
		el:"#wrapper",
        events: {
            "click .ui-dialog-titlebar-close":"closeDialog",
			"click .continue":"register"
        },


        initialize: function (options) {
			this.videoModal = null;
			this.content = options.content;
            this.render();
        },

		register: function(){
			var self = this;
			var userModel = new UserModel();
			var isError = false;
			this.$el.find(".error").removeClass("error");
			if (!this.$el.find("#email").val()){
				this.$el.find("#email").addClass("error");
				isError = true;
			}
			if (!this.$el.find("#confirmEmail").val() || this.$el.find("#email").val() !== this.$el.find("#confirmEmail").val()){
				this.$el.find("#confirmEmail").addClass("error");
				isError = true;
			}

			if (!this.$el.find("#fname").val()){
				this.$el.find("#fname").addClass("error");
				isError = true;
			}
			if (!this.$el.find("#lname").val()){
				this.$el.find("#lname").addClass("error");
				isError = true;
			}
			if (!this.$el.find("#phone").val()){
				this.$el.find("#phone").addClass("error");
				isError = true;
			}
			if (!this.$el.find("#organization").val()){
				this.$el.find("#organization").addClass("error");
				isError = true;
			}
			if (!this.$el.find("#title").val()){
				this.$el.find("#title").addClass("error");
				isError = true;
			}
			if (!this.$el.find("#comments").val()){
				this.$el.find("#comments").addClass("error");
				isError = true;
			}
			

			if (isError)return;
			userModel.save({
				email : this.$el.find("#email").val(),
				firstName : this.$el.find("#fname").val(),
				lastName : this.$el.find("#lname").val(),
				phone : this.$el.find("#phone").val(),
				organization : this.$el.find("#organization").val(),
				title : this.$el.find("#title").val(),
				comments : this.$el.find("#comments").val()
            },
               {
                   wait: true,
                   success: function (model, response) {
					   self.dialog.hide();
					   if(self.videoModal){
						   self.videoModal.undelegateEvents();
					   }
					   self.videoModal =new VideoModalView({
						   content:self.content
					   });

                   },
                   error: function (err) {
                       alert(err)
                   }
               });
            /*$.ajax({
                type: "POST",
                url: "/trackUser",
                data: JSON.stringify(videoData),
                contentType: "application/json",

                success: function (msg) {
                    if (msg) {
                        console.log('Successfully send')
                    } else {
                        console.log("Cant track the video");
                    }
                },
                error: function (model, xhr) {
                    console.log(xhr);
                    console.log(model);

                }
            });*/
		},

        closeDialog:function(e){
            e.preventDefault();
            $(".register-dialog").remove();
            $(".watch-dialog").show();
            $(".watchDemo").show();
        },


        // render template (once! because google maps)
        render: function () {
			 var formString = _.template(modalTemplate)({
             });
            this.dialog = $(formString).dialog({
				modal:true,
                closeOnEscape: false,
				appendTo:"#wrapper",
                dialogClass: "register-dialog",
                width: 700
            });
            return this;
        }


    });
    return View;
});
