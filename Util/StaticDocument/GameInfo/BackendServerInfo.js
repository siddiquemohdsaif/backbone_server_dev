const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for BackendServerInfo
let backendServerInfoCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if backendServerInfo is in cache and not older than 10 seconds
    if (backendServerInfoCache.data && (now - backendServerInfoCache.timestamp) < 10000) {
        return backendServerInfoCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const backendServerInfo = await firestoreManager.readDocument("GameInfo", "BackendServerInfo", "/");
        backendServerInfoCache = {
            data: backendServerInfo,
            timestamp: now
        };
        return backendServerInfo;
    }
};

module.exports = {
    get
};
