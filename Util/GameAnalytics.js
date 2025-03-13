const FirestoreManager = require('./../Firestore/FirestoreManager');
const firestoreManager = FirestoreManager.getInstance();

const addUserAppUsage = async (userAppUsageDurationAvg) => {

    
    const date = await getDate();
    const document = {
        DailyUsage: userAppUsageDurationAvg
    }
    await firestoreManager.updateDocument("GameAnalytics", date, "/",document);
};

const overAllUserUpdate = async ()=>{
    const date = await getDate();
    let totalDuration = 0;
    // Fetch all document IDs from the `Analytics` collection
    const docIds = await firestoreManager.readCollectionDocumentIds("Analytics", "/");
    // Break the docIds into manageable chunks of 100
    const analyticsChunks = chunkArray(docIds, 100);
  
    for (let analyticsChunk of analyticsChunks) {
      // Bulk-read each chunk
      const users = await firestoreManager.bulkReadDocuments("Analytics", "/", analyticsChunk, {});
  
      for (const docId in users) {
        const userData = users[docId];
        let duration = userData.duration_min || 0; // Consider 0 if undefined
        totalDuration += duration;
      }
    }

    const document = {
        OverAllUser: {
            allUser: docIds.length,
            totalDuration_min: totalDuration,
            avgUsageTime_min: docIds.length > 0 ? (totalDuration / docIds.length) : 0
        }
    };
    await firestoreManager.updateDocument("GameAnalytics", date, "/",document);
}

function chunkArray(array, size) {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
      const chunk = array.slice(i, i + size);
      chunkedArr.push(chunk);
    }
    return chunkedArr;
  }

const addUserAdsShown = async (userAdsShownAvg) => {

    
    const date = await getDate();
    const document = {
        AdsShown: userAdsShownAvg
    }
    await firestoreManager.updateDocument("GameAnalytics", date, "/",document);
};

const addUserIAPHistory = async (userIAPHistoryAvg) => {

    
    const date = await getDate();
    const document = {
        IAPHistory: userIAPHistoryAvg
    }
    await firestoreManager.updateDocument("GameAnalytics", date, "/",document);
};

const getDate = async () => {
    const timeStamp = Date.now();
    const dateObject = new Date(timeStamp);

    // Get the day, month, and year from the date object
    const day = dateObject.getDate().toString().padStart(2, '0'); // Pad with zero if necessary
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed, add 1
    const year = dateObject.getFullYear();

    // Format the date in dd-mm-yyyy
    const formattedDate = `${day}-${month}-${year}`;
    // console.log(formattedDate); // Output the date for verification

    return formattedDate;
}


module.exports = {
    addUserAppUsage,
    addUserAdsShown,
    addUserIAPHistory,
    overAllUserUpdate
}