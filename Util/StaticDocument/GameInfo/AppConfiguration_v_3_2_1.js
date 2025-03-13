const FirestoreManager = require('../../../Firestore/FirestoreManager')
const firestoreManager = FirestoreManager.getInstance();

// Global cache for AppConfiguration
let appConfigCache_v_3_2_1 = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if appConfig is in cache and not older than 10 seconds
    if (appConfigCache_v_3_2_1.data && (now - appConfigCache_v_3_2_1.timestamp) < 10000) {
        return appConfigCache_v_3_2_1.data;
    } else {
        // Fetch new data from Firestore and update cache
        const appConfig = await firestoreManager.readDocument("GameInfo", "AppConfiguration_v_3_2_1", "/");
        appConfigCache_v_3_2_1 = {
            data: appConfig,
            timestamp: now
        };
        return appConfig;
    }
};

module.exports = {
    get
}