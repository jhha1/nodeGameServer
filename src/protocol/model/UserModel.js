class UserModel {
    constructor() {
        this.user_id = '';
        this.nickname = '';
        this.is_leave = 0;
        this.last_login_dt = 0;
        this.created_dt = 0;
    }

    setUserId(userId) {
        this.user_id = userId;
    }

    setNickname(nickname) {
        this.nickname = nickname;
    }

    setIsLeave(isLeave) {
        this.is_leave = isLeave;
    }

    setLastLoginDt(lastLoginDt) {
        this.last_login_dt = lastLoginDt;
    }

    setCreatedDt(createdDt) {
        this.created_dt = createdDt;
    }

    get() {
        return {
            user_id:this.user_id,
            nickname:this.nickname,
            is_leave:this.is_leave,
            last_login_dt:this.last_login_dt,
            created_dt:this.created_dt
        };
    }
}

module.exports = UserModel;