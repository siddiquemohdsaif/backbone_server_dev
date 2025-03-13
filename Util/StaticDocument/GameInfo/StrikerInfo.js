const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for StrikerInfo
let strikerInfoCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if strikerInfo is in cache and not older than 10 seconds
    if (strikerInfoCache.data && (now - strikerInfoCache.timestamp) < 10000) {
        return strikerInfoCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const strikerInfo = await firestoreManager.readDocument("GameInfo", "StrikerInfo", "/");
        strikerInfoCache = {
            data: strikerInfo,
            timestamp: now
        };
        return strikerInfo;
    }
};

module.exports = {
    get
};
