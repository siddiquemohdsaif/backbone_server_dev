const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for MapSliderInfo
let mapSliderInfoCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if mapSliderInfo is in cache and not older than 10 seconds
    if (mapSliderInfoCache.data && (now - mapSliderInfoCache.timestamp) < 10000) {
        return mapSliderInfoCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const mapSliderInfo = await firestoreManager.readDocument("GameInfo", "MapSliderInfo", "/");
        mapSliderInfoCache = {
            data: mapSliderInfo,
            timestamp: now
        };
        return mapSliderInfo;
    }
};

module.exports = {
    get
}