define([
    'text!templates/upload/modalProgressBarTemplate.html'
], function ( modalTemplate ) {
    var View;

    View = Backbone.View.extend({
        el:"#wrapper",
        events:{
            "click .progress-dialog .ui-dialog-titlebar-close": "decline"
        },

        decline: function(e){
            e.preventDefault();
            e.stopPropagation();
            if (this.xhr && this.xhr.readystate != 4) {
                this.xhr.abort();
                this.hide();
            }

        },

        initialize: function (xhr) {
            this.xhr = xhr;
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
