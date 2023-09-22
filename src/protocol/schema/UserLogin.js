const UserModel = require("../model/UserModel");
const ItemEquipModel = require("../model/ItemEquipModel");
const ItemStackableModel = require("../model/ItemStackableModel");
const ItemFloatingPointModel = require("../model/ItemFloatingPointModel");

class UserLogin {
    constructor() {
        this.user = null;
        this.item_equip_list = [];
        this.item_stackable_list = [];
        this.item_floating_point_list = [];
    }

    setUser(obj) {
        this.user = new UserModel();
        this.user.setUserId(obj.user_id);
        this.user.setNickname(obj.nickname);
        this.user.setIsLeave(obj.is_leave);
        this.user.setLastLoginDt(obj.last_login_dt);
        this.user.setCreatedDt(obj.created_dt);
    }

    setItemEquip(list) {
        for (let obj of list) {
            let row = new ItemEquipModel();
            row.setItemId(obj.item_id);
            row.setGrade(obj.grade);
            row.setLevel(obj.level);
            row.setPieceCount(obj.piece_count);
            this.item_equip_list.push(row);
        }
    }

    setItemStackable(list) {
        for (let obj of list) {
            let row = new ItemStackableModel();
            row.setItemId(obj.item_id);
            row.setCount(obj.count);
            this.item_stackable_list.push(row);
        }
    }

    setItemFloatingPoint(list) {
        for (let obj of list) {
            let row = new ItemFloatingPointModel();
            row.setItemId(obj.item_id);
            row.setAmount(obj.amount);
            this.item_floating_point_list.push(row);
        }
    }

    get() {
        return {
            user:this.user,
            item_equip:this.item_equip_list,
            item_stackable:this.item_stackable_list,
            item_floating_point:this.item_floating_point_list
        };
    }
}

module.exports = UserLogin;