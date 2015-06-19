define([
    'text!templates/home/registerModalTemplate.html',
	 "models/userModel"
], function ( modalTemplate, UserModel) {

    var View;
	
    View = Backbone.View.extend({
		el:"#wrapper",
        events: {
            "click .ui-dialog-titlebar-close":"closeDialog",
			"click .continue":"register"
        },


        initialize: function () {
            this.render();
        },

		register: function(){
			var userModel = new UserModel();
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
                       alert("OK!")
                   },
                   error: function (model, xhr) {
                       self.errorNotification(xhr);
                   }
               });
            $.ajax({
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
            });
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
