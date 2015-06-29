define([
    'text!templates/home/modalTemplate.html',
	'views/home/registerModalView',
	'views/home/videoModalView',
	'models/contentModel'
], function ( modalTemplate, ModalView, VideoModalView, ContentModel) {

    var View;
	
    View = Backbone.View.extend({
		el:"#wrapper",
        events: {
            "click .newViewer":"newViewer",
            "click .sign":"sign"
        },


        initialize: function (options) {
			this.modal = null;
			this.videoModal = null;
			var videoId = options?options.videoId:"55800aadcb7bb82c1f000002";
			var userId = options?options.userId:"55800aadcb7bb82c1f000002";
			this.content = new ContentModel({_id:videoId, userId:userId});
			this.content.fetch();
			this.listenTo(this.content, 'change', this.render);
            //this.render();
        },

		sign: function(){
			this.dialog.hide();
			if(this.videoModal){
				this.videoModal.undelegateEvents();
			}
			this.videoModal =new VideoModalView({
				content:this.content
			});
			
		},

        newViewer:function(){
			this.dialog.hide();
			if(this.modal){
				this.modal.undelegateEvents();
			}
			this.modal =new ModalView({
				content:this.content
			});
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
