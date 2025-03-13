const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for PuckInfo
let puckInfoCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if puckInfo is in cache and not older than 10 seconds
    if (puckInfoCache.data && (now - puckInfoCache.timestamp) < 10000) {
        return puckInfoCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const puckInfo = await firestoreManager.readDocument("GameInfo", "PuckInfo", "/");
        puckInfoCache = {
            data: puckInfo,
            timestamp: now
        };
        return puckInfo;
    }
};

module.exports = {
    get
};
