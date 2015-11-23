/**
 * Created by slavik on 16.06.2015.
 */
define(['validation'], function (validation) {
    var Model = Backbone.Model.extend({
        idAttribute: "_id",
        url: function () {
            return "/content" + (this.get('_id')?'/'+this.get('_id'):'');
        },
        initialize: function () {
            this.on('invalid', function (model, errors) {
                if (errors.length > 0) {
                    var msg = errors.join('\n');
                    alert(msg);
                }
            });
        }
    });
    return Model;
});
