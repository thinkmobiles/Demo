define([
    'text!templates/home/passwordTemplate.html',
    '../../checkPass'

], function ( passTemplate, checkPass) {

    var View;

    View = Backbone.View.extend({
        el:"#wrapper",
        events:{
            "input #txtPassword": "progressBar"
        },
        initialize: function (options) {
            $("#progressBar").progressbar({value: 0 });
            this.render();
        },
        progressBar: function () {
            var pass = $("#txtPassword").val();
            var rate = checkPass.scorePassword(pass);
            var add = checkPass.checkPassStrength(pass);
            var remove = add=="weak"?"good strong":add=="good"?"weak strong":"good weak";
console.log( $("#progressBar"));
            $("#progressBar").progressbar({value: rate});
            $(".ui-progressbar-value").addClass(add).removeClass(remove);
        },
        render: function () {
            var formString = _.template(passTemplate)();
            this.dialog = $(formString).dialog({
                modal:true,
                closeOnEscape: false,
                appendTo:"#wrapper",
                dialogClass: "watch-dialog",
                width: 425,
                height: 300
            });
            return this;
        }


    });
    return View;
});
