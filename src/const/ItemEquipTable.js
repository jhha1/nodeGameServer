const helper = require("./helper");
const ItemEquipTable = {
    _listByEquipKind: {},
    _listByEquipKindAndGrade: {},

    init: function() {
        const rows = helper.getTable("ItemEquip");
        for (let row of rows) {
            if (!ItemEquipTable._listByEquipKind[row.kind])
                ItemEquipTable._listByEquipKind[row.kind] = [];
            if (!ItemEquipTable._listByEquipKindAndGrade[row.kind])
                ItemEquipTable._listByEquipKindAndGrade[row.kind] = {};
            if (!ItemEquipTable._listByEquipKindAndGrade[row.kind][row.grade])
                ItemEquipTable._listByEquipKindAndGrade[row.kind][row.grade] = [];

            ItemEquipTable._listByEquipKind[row.kind].push(row);
            ItemEquipTable._listByEquipKindAndGrade[row.kind][row.grade].push(row);
        }
    },

    getByEquipKind: function(kind) {
        return ItemEquipTable._listByEquipKind[kind];
    },

    getByEquipKindAndGrade: function(kind, grade) {
        return ItemEquipTable._listByEquipKind[kind]? ItemEquipTable._listByEquipKind[kind][grade] : [];
    }
};

module.exports = ItemEquipTable;