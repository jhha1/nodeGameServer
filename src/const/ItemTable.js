const helper = require("./helper");
const ItemTable = {
    _origin: {},

    init: function() {
        const rows = helper.getTable("Item");
        ItemTable._origin = rows;
    },

    get: function(id) {
        return ItemTable._origin[id];
    }
};


module.exports = ItemTable;