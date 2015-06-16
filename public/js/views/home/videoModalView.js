define([
    'text!templates/home/videoModalTemplate.html',
    "models/userModel"
], function ( modalTemplate, UserModel) {

    var View;

    View = Backbone.View.extend({
        el:"#wrapper",
        events: {
            "click .ui-dialog-titlebar-close":"closeDialog",
            "click .continue":"register",
			"ended .mainVideo":"endedMainVideo"
        },


        initialize: function (options) {
			this.company = options.company;
            this.render();
        },

		endedMainVideo:function(e){
			$(".videoSection").hide();
			$(".questionSection").show();
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
				company:{
					mainVideoUri:this.company.toJSON().mainVideoUri.replace('public\\',''),
					logoUri:this.company.toJSON().logoUri.replace('public\\',''),
					survey:this.company.toJSON().survey
				}
            });
            this.dialog = $(formString).dialog({
                modal:true,
                closeOnEscape: false,
                appendTo:"#wrapper",
                dialogClass: "register-dialog",
                width: 1180
            });
			this.$el.find(".mainVideo").on('ended',this.endedMainVideo);
            return this;
        }


    });
    return View;
});
