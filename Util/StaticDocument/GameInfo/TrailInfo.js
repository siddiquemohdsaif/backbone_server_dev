const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for TrailInfo
let trailInfoCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if trailInfo is in cache and not older than 10 seconds
    if (trailInfoCache.data && (now - trailInfoCache.timestamp) < 10000) {
        return trailInfoCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const trailInfo = await firestoreManager.readDocument("GameInfo", "TrailsInfo", "/");
        trailInfoCache = {
            data: trailInfo,
            timestamp: now
        };
        return trailInfo;
    }
};

module.exports = {
    get
};
