const helper = require("./helper");
const GachaProbTable = {
    _obj: {},

    init: function() {
        const rows = helper.getTable("GachaProb");
        for (let row of rows) {
            if (!GachaProbTable._obj[row.prob_id]) GachaProbTable._obj[row.prob_id] = [];
            GachaProbTable._obj[row.prob_id].push(row);
        }
    },

    get: function(probId) {
        return GachaProbTable._obj[probId];
    }
};


module.exports = GachaProbTable;
