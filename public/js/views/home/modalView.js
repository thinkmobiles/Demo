define([
    'text!templates/home/modalTemplate.html',
	'views/home/registerModalView'
], function ( modalTemplate, ModalView) {

    var View;
	
    View = Backbone.View.extend({
		el:"#wrapper",
        events: {
            "click .newViewer":"newViewer"
        },


        initialize: function () {
			this.modal = null;
            this.render();
        },

        newViewer:function(){
			this.dialog.hide();
			if(this.modal){
				this.modal.undelegateEvents();
			}
			this.modal =new ModalView();
        },

        // render template (once! because google maps)
        render: function () {
			 var formString = _.template(modalTemplate)({
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
