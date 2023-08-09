const helper = require("./helper");
const keyValuesTable = {
    _map: {},

    init: function() {
        const rows = helper.getTable("KeyValues");
        for (let row of rows) {
            keyValuesTable._map[row.key] = row.value;
        }
    },

    get: function(key) {
        return keyValuesTable._map[key];
    }
};


module.exports = keyValuesTable;