class ItemEquipModel {
    constructor() {
        this.item_id = 0;
        this.grade = 0;
        this.level = 0;
        this.piece_count = 0;
    }

    setItemId(itemId) {
        this.item_id = itemId;
    }

    setGrade(grade) {
        this.grade = grade;
    }

    setLevel(level) {
        this.level = level;
    }

    setPieceCount(pieceCount) {
        this.piece_count = pieceCount;
    }

    get() {
        return {
            item_id:this.item_id,
            grade:this.grade,
            level:this.level,
            piece_count:this.piece_count
        };
    }
}

module.exports = ItemEquipModel;