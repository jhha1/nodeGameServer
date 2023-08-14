const helper = require("./helper");
const GachaTable = {
    _origin: {},

    init: function() {
        const rows = helper.getTable("Gacha");
        for (let row of rows) {
            GachaTable._origin[row.id] = row;
        }
    },

    get: function(gachaId) {
        return GachaTable._origin[gachaId];
    }
};


module.exports = GachaTable;
