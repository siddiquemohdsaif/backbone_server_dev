const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for GlobalChatSetting
let globalChatSettingCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if GlobalChatSetting is in cache and not older than 10 seconds
    if (globalChatSettingCache.data && (now - globalChatSettingCache.timestamp) < 10000) {
        return globalChatSettingCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const globalChatSetting = await firestoreManager.readDocument("Data", "GlobalChatSetting", "/");
        globalChatSettingCache = {
            data: globalChatSetting,
            timestamp: now
        };
        return globalChatSetting;
    }
};

module.exports = {
    get
};
