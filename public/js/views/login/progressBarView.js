define([
    'text!templates/login/modalProgressBarTemplate.html'
], function ( modalTemplate ) {

    var View;

    View = Backbone.View.extend({
        el:"#wrapper",


        initialize: function (options) {
            this.render();
      },

        // render template (once! because google maps)
        render: function () {
            var formString = _.template(modalTemplate)();
            this.dialog = $(formString).dialog({
                modal:true,
                closeOnEscape: false,
                appendTo:"#wrapper",
                dialogClass: "progress-dialog",
                width: 590,
                height: 390,
                resizable: false,
                scroll: false
            });
            return this;
        },
		
		hide:function(){
			this.dialog.remove();
		}


    });
    return View;
});
