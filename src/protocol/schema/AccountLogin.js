class AccountLogin {
    constructor() {
        this.platform_type = 0;
        this.platform_id = 0;
        this.user_id = '';
        this.device_type = 0;
        this.is_leave = 0;
    }

    setPlatformType(platformType) {
        this.platform_type = platformType;
    }

    setPlatformId(PlatformId) {
        this.platform_id = PlatformId;
    }

    setUserId(userId) {
        this.user_id = userId;
    }

    setDeviceType(deviceType) {
        this.device_type = deviceType;
    }

    setIsLeave(isLeave) {
        this.is_leave = isLeave;
    }

    get() {
        return {
            platform_type:this.platform_type,
            platform_id:this.platform_id,
            user_id:this.user_id,
            device_type:this.device_type,
            is_leave:this.is_leave
        };
    }
}

module.exports = AccountLogin;