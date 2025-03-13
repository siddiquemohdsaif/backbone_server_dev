const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for PowerInfo
let powerInfoCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if powerInfo is in cache and not older than 10 seconds
    if (powerInfoCache.data && (now - powerInfoCache.timestamp) < 10000) {
        return powerInfoCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const powerInfo = await firestoreManager.readDocument("GameInfo", "PowerInfo", "/");
        powerInfoCache = {
            data: powerInfo,
            timestamp: now
        };
        return powerInfo;
    }
};

module.exports = {
    get
};
