define([
    'text!templates/home/modalTemplate.html',
	//'views/home/registerModalView'
], function ( modalTemplate) {

    var View;
	
    View = Backbone.View.extend({
		el:"#topMenu",
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
		},

        newViewer:function(){
			Backbone.history.navigate("#/registerViewer/"+this.videoId+"/"+this.userId, {trigger: false});
        },

		clickOnClose: function(){
			Backbone.history.navigate("#/home/"+this.videoId+"/"+this.userId, {trigger: false});
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
				appendTo:"#topMenu",
                dialogClass: "watch-dialog",
				width: 425,
				position: {
					my: "center center",
					at: "center center"
				},
				create: function (e) {
					if (window.innerWidth <= 700) {
						$(document).find('#wrapper').css({'display': 'none'});
						$(document).find('#footer').css({'display': 'none'});
					}else{
						$(e.target).parent().css({'position':'fixed'});
						$(document).find('.topMenu').addClass('small');
					}
				}
            });
            return this;
        }


    });
    return View;
});
