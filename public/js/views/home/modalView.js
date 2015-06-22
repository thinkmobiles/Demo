define([
    'text!templates/home/modalTemplate.html',
	'views/home/registerModalView',
	'views/home/videoModalView',
	'models/companyModel'
], function ( modalTemplate, ModalView, VideoModalView, CompanyModel) {

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
			this.company = new CompanyModel({_id:videoId});
			this.company.fetch();
			this.listenTo(this.company, 'change', this.render);
            //this.render();
        },

		sign: function(){
			this.dialog.hide();
			if(this.videoModal){
				this.videoModal.undelegateEvents();
			}
			this.videoModal =new VideoModalView({
				company:this.company
			});
			
		},

        newViewer:function(){
			this.dialog.hide();
			if(this.modal){
				this.modal.undelegateEvents();
			}
			this.modal =new ModalView({
				company:this.company
			});
        },

        // render template (once! because google maps)
        render: function () {
			 var formString = _.template(modalTemplate)({
				 name:this.company.toJSON().name
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
