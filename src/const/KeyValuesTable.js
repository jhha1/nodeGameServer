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
        if (!keyValuesTable._map[key]) {
            return null;
        }

        if (keyValuesTable._map[key].type === 1) { // primitive int values
            return Number(keyValuesTable._map[key]);
        }
        if (keyValuesTable._map[key].type === 2 && Array.isArray(keyValuesTable._map[key])) { // array
            return JSON.parse(keyValuesTable._map[key]);
        }
        else {
            return null;
        }
    }
};


module.exports = keyValuesTable;