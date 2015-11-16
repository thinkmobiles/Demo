define([
    'text!templates/campaigns/campaignsTemplate.html',
    'text!templates/campaigns/dialogTemplate.html',
    'text!templates/campaigns/campaignsListTemplate.html',
    "models/campaignModel",
    "collections/campaignsCollection",
    "moment",
    "validation"
], function (CampaignsTemplate, DialogTemplate, CampaignsListTemplate, CampaignsModel, CampaignsCollection, moment, validation) {
    var View = Backbone.View.extend({

        el: "#wrapper",
        events: {
            'click .customTable tr:not(.current)': 'chooseRow',
            'click .delete': 'delete',
            'click .editBtn': 'edit'
        },
        initialize: function () {
            var self = this;
            this.campaignsCollection = new CampaignsCollection();
            this.campaignsCollection.bind('reset', self.renderCampaignsList, self);
            this.campaignChoosed = 0;
            this.dataFormat = "DD MMM YYYY";
            this.render();
        },

        chooseRow: function (e) {
            var self = this;
            var index = $(e.target).closest(".customTable").find("tr").index($(e.target).closest("tr"));

            if (index) {
                this.subordinateChoosed = index -1;

                $(e.target).closest(".customTable").find("tr.current").removeClass("current");
                $(e.target).closest("tr").addClass("current");
                self.renderCampaignsList();
            }

        },

        edit: function (e) {
            var campaignId = $(e.target).closest(".campaigns").find("tr.current").attr("data-id");
            Backbone.history.navigate("#/edit/"+campaignId, {trigger: true});
        },

        showDialog: function (title, name, cancel, ok, callback) {
            var self = this;
            var formString = _.template(DialogTemplate)({
                operation: ok,
                name: name
            });

            this.dialog = $(formString).dialog({
                modal: true,
                closeOnEscape: false,
                resizable: false,
                draggable: false,
                appendTo: "#wrapper",
                dialogClass: "confirm-dialog",
                width: 580,
                title: title,
                buttons: [
                    {
                        text: cancel,
                        "class": 'cancelButtonClass',
                        click: function () {
                            $(this).dialog("close");
                        }
                    },
                    {
                        text: ok,
                        "class": 'saveButtonClass',
                        click: function () {
                            $(this).dialog("close");
                            if (callback)callback();
                        }
                    }
                ],
            });
            setTimeout(function () {
                self.$el.find(".confirm-dialog").addClass("show");
            }, 25);
        },

        delete: function (e) {
            var id = $(e.target).closest(".campaigns").find(".customTable tr.current").data("id");
            var model = this.campaignsCollection.get(id);
            var self = this;
            var name = model.get("name");

            this.showDialog("Delete Campaign", name, "CANCEL", "DELETE", function () {
                model.destroy({
                    wait: true,
                    success: function (model, response) {
                        self.campaignsCollection.update();
                    },
                    error: function (err) {
                        console.log(JSON.stringify(err));
                    }
                });

            });
        },

        renderCampaignsList: function () {
            var self = this;
            var campaigns = this.campaignsCollection.toJSON();
            this.$el.find("#campaigns").html(_.template(CampaignsListTemplate)({
                campaigns: campaigns,
                current: this.campaignChoosed
            }));
            return this;
        },


        render: function () {
            this.$el.html(_.template(CampaignsTemplate));
            return this;
        }

    });

    return View;

});
