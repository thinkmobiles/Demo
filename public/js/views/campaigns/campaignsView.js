define([
    'text!templates/campaigns/campaignsTemplate.html',
    'text!templates/campaigns/dialogTemplate.html',
    'text!templates/campaigns/campaignsListTemplate.html',
    "models/campaignModel",
    "collections/campaignsCollection",
    "moment",
    "validation",
    'clipboard'
], function (CampaignsTemplate, DialogTemplate, CampaignsListTemplate, CampaignsModel, CampaignsCollection, moment, validation, Clipboard) {
    var View = Backbone.View.extend({

        el: "#wrapper",
        events: {
            'click .customTable tr:not(.current)': 'chooseRow',
            'click .delete': 'delete',
            'click .clipCopy': 'copyURL',
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

        copyURL: function (e) {
            var text;
            var el;
            var tt;

            if (this.clipboard) {
                this.clipboard.destroy();
            }
            el = $(e.target).closest('td').find('span').get(0);
            tt = $(e.target).closest('td').find('.copyTooltip');
            text = $(e.target).closest('td').find('span').eq(0).text();
            this.clipboard = new Clipboard('.clipCopy', {
                text: function () {
                    return text;
                }
            });

            $(e.target).closest('td').find('.copyTooltip').fadeIn();

            setTimeout(function () {
                $(e.target).closest('td').find('.copyTooltip').fadeOut();
            }, 2000);

            this.clipboard.on('error', function (e) {
                var doc = document,
                    range, selection;
                if (doc.body.createTextRange) {
                    range = document.body.createTextRange();
                    range.moveToElementText(el);
                    range.select();
                } else if (window.getSelection) {
                    selection = window.getSelection();
                    range = document.createRange();
                    range.selectNodeContents(el);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                tt.text("Press Ctrl+C to copy")
            });
        },

        chooseRow: function (e) {
            var self = this;
            if ($(e.target).closest(".clipCopy").length) {
                return;
            }
            var index = $(e.target).closest(".customTable").find("tr").index($(e.target).closest("tr"));

            if (index) {
                this.campaignChoosed = index - 1;

                $(e.target).closest(".customTable").find("tr.current").removeClass("current");
                $(e.target).closest("tr").addClass("current");
                self.renderCampaignsList();
            }

        },

        edit: function (e) {
            var campaignId;

            campaignId = $(e.target).closest(".campaigns").find("tr.current").attr("data-id");
            Backbone.history.navigate("#/edit/" + campaignId, {trigger: true});
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
                ]
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
                    error: function (model, response) {
                        App.notification(response.responseJSON.message);
                    }
                });

            });
        },

        renderCampaignsList: function () {
            var self = this;
            var campaigns = this.campaignsCollection.toJSON();
            if (!campaigns.length) {
                return this;
            }
            this.$el.find("#campaigns").html(_.template(CampaignsListTemplate)({
                campaigns: campaigns,
                moment: moment,
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
