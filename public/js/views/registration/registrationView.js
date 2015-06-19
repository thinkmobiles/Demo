define([
    'text!templates/registration/registrationTemplate.html',
    '../../checkPass'
], function (RegistrationTemplate, checkPass) {
    var View = Backbone.View.extend({

		el:"#wrapper",
        events:{
            "input #pass": "progressBar",
            "click .cancel":"cancel"
        },
        initialize: function () {
            $("#progressBar").progressbar({value: 5 });
            this.render();
        },


        progressBar: function () {
            var pass = $("#pass").val();
            var rate = checkPass.scorePassword(pass);
            var add = checkPass.checkPassStrength(pass);
            var remove = add=="weak"?"good strong":add=="good"?"weak strong":"good weak";
            //console.log( $("#progressBar"));
            $("#progressBar").progressbar({value: rate});
            $(".ui-progressbar-value").addClass(add).removeClass(remove);
        },
		cancel:function(e){
			Backbone.history.navigate("home",{ trigger:true })
		},
		
        render: function () {
            this.$el.html(_.template(RegistrationTemplate));
            return this;
        }

    });

    return View;

});
