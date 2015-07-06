define([
    'text!templates/modal/contactMeTemplate.html',
	'views/home/registerModalView'
], function ( modalTemplate, ModalView) {

    var View;
	
    View = Backbone.View.extend({
		el:"#wrapper",
        events: {
            "click .send":"send",
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

		send: function(){
			Backbone.history.navigate("#/watchVideo/"+this.videoId+"/"+this.userId, {trigger: true});
		},


		clickOnClose: function(){
			Backbone.history.navigate("/home/"+this.videoId+"/"+this.userId, {trigger: false});
		},

		
        // render template (once! because google maps)
        render: function () {
			console.log(this.content);
			 var formString = _.template(modalTemplate)({
				 contact:this.content.toJSON().contact,
             });
            this.dialog = $(formString).dialog({
				modal:true,
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
