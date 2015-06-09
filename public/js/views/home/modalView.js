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
            this.render();
        },

        newViewer:function(){
			this.dialog.remove();
			var modalView  =new ModalView();
        },


        // render template (once! because google maps)
        render: function () {
			 var formString = _.template(modalTemplate)({
             });
            this.dialog = $(formString).dialog({
                closeOnEscape: false,
				appendTo:"#wrapper",
                dialogClass: "edit-dialog",
                width: 425
            });
            return this;
        }


    });
    return View;
});
