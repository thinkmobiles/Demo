define([
    'text!templates/home/registerModalTemplate.html'
], function ( modalTemplate) {

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
        },


        // render template (once! because google maps)
        render: function () {
			 var formString = _.template(modalTemplate)({
             });
            this.dialog = $(formString).dialog({
                closeOnEscape: false,
				appendTo:"#wrapper",
                dialogClass: "edit-dialog",
                width: 700
            });
            return this;
        }


    });
    return View;
});
