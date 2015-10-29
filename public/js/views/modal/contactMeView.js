define([
    'text!templates/modal/contactMeTemplate.html',
	"models/contactModel",
	"validation"
], function ( modalTemplate, ContactModel, validation) {

    var View;
	
    View = Backbone.View.extend({
		el:"#topMenu",
        events: {
            "click .send":"send",
			"click .ui-dialog-titlebar-close":"clickOnClose"
        },


        initialize: function (options) {
			var self = this;
			this.modal = null;
			this.videoModal = null;
			this.videoId = options&&options.videoId?options.videoId:"";
			this.userId = options&&options.userId?options.userId:"";
			this.page = options&&options.page?options.page:"watchVideo";
			this.indexList = options&&options.indexList?options.indexList:[];
			App.getContent(this.videoId, this.userId,function(content){
				self.content = content;
				self.render();
			});
        },

		send: function(){

			var self = this;
			var contactModel = new ContactModel();
			var hasError = false;
			this.$el.find(".error").removeClass("error");
			
			if (!validation.validName(this.$el.find(".name").val())){
				this.$el.find(".name").addClass("error");
				hasError = true;
			}

			if (!validation.validEmail(this.$el.find(".email").val())){
				this.$el.find(".email").addClass("error");
				hasError = true;
			}

			if (!this.$el.find(".desc").val()){
				this.$el.find(".desc").addClass("error");
				hasError = true;
			}
			
			if (hasError)return;
			
			contactModel.save({
				contentId : this.videoId,
				name : this.$el.find(".name").val(),
				email : this.$el.find(".email").val(),
				message : this.$el.find(".desc").val()
            },{
				wait: true,
				success: function (model, response) {
					Backbone.history.navigate("#/"+self.page+"/"+self.videoId+"/"+self.userId+(self.indexList.length?("/"+self.indexList):""), {trigger: true});
					
				},
				error: function (err) {
					console.log(err);
					Backbone.history.navigate("#/"+self.page+"/"+self.videoId+"/"+self.userId+(self.indexList.length?("/"+self.indexList):""), {trigger: true});
					
				}
			});

			
		},


		clickOnClose: function(){
			Backbone.history.navigate("/home/"+this.videoId+"/"+this.userId, {trigger: false});
		},

		
        // render template (once! because google maps)
        render: function () {
			 var formString = _.template(modalTemplate)({
				 contact:this.content.toJSON().contact,
             });
            this.dialog = $(formString).dialog({
				modal:true,
				resizable: false,
				draggable: false,
                closeOnEscape: false,
				appendTo:"#topMenu",
                dialogClass: "watch-dialog",
                width: 425,
				position: {
					my: "center center+12%",
					at: "center center12%"
				},
				create: function (e) {
					$(e.target).parent().css({'position': 'fixed'});
					$(document).find('#topMenu').addClass('small');
					if (window.innerWidth <= 640) {
						$(document).find('#wrapper').css({'display': 'none'});
						$(document).find('#footer').css({'display': 'none'});
					}
				}
            });
            return this;
        }


    });
    return View;
});
