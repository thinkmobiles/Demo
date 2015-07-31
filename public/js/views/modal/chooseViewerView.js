define([
    'text!templates/home/modalTemplate.html',
	//'views/home/registerModalView'
], function ( modalTemplate) {

    var View;
	
    View = Backbone.View.extend({
		el:"#wrapper",
        events: {
            "click .newViewer":"newViewer",
            "click .sign":"sign",
			"click .ui-dialog-titlebar-close":"clickOnClose"
        },


        initialize: function (options) {
			var self = this;
			this.modal = null;
			this.videoModal = null;
			this.videoId = options&&options.videoId?options.videoId:"55800aadcb7bb82c1f000002";
			this.userId = options&&options.userId?options.userId:"55800aadcb7bb82c1f000002";
			App.getContent(this.videoId, this.userId,function(content){
				self.content = content;
				self.render();
			});
        },

		sign: function(){
			Backbone.history.navigate("#/watchVideo/"+this.videoId+"/"+this.userId, {trigger: true});
			/*this.dialog.hide();
			if(this.videoModal){
				this.videoModal.undelegateEvents();
			}
			this.videoModal = new VideoModalView({
				content:this.content
			});*/
			
		},

        newViewer:function(){
			Backbone.history.navigate("//registerViewer/"+this.videoId+"/"+this.userId, {trigger: false});
			//this.dialog.hide();
			//if(this.modal){
			//	this.modal.undelegateEvents();
			//}
			//this.modal =new ModalView({
			//	content:this.content
			//});
        },

		clickOnClose: function(){
			Backbone.history.navigate("/home/"+this.videoId+"/"+this.userId, {trigger: false});
		},

		
        // render template (once! because google maps)
        render: function () {
			 var formString = _.template(modalTemplate)({
				 name:this.content.toJSON().content.name,
				 contact:this.content.toJSON().contact,
				 logoUri:this.content.toJSON().content.logoUri
             });
            this.dialog = $(formString).dialog({
				modal:true,
				resizable: false,
				draggable: false,
                closeOnEscape: false,
				appendTo:"#wrapper",
                dialogClass: "watch-dialog",
                width: 425
            });
            return this;
        }


    });
    return View;
});
