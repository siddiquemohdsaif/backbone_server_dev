const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for AppConfiguration
let appConfigCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if appConfig is in cache and not older than 10 seconds
    if (appConfigCache.data && (now - appConfigCache.timestamp) < 10000) {
        return appConfigCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const appConfig = await firestoreManager.readDocument("GameInfo", "AppConfiguration", "/");
        appConfigCache = {
            data: appConfig,
            timestamp: now
        };
        return appConfig;
    }
};

module.exports = {
    get
}