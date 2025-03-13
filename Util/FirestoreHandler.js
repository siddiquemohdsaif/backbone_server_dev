const FirestoreManager = require("../Firestore/FirestoreManager");

const db=FirestoreManager.getInstance();
const TrophyLeagueConverter = require("./TrophyLeagueConverter");
const axios = require('axios');

const saveMessageToClanHistory = async (cid , uid , message)=> {

    const colName = "ClanMsg";
    const docName = cid;
    const parentPath = "/";
    const timeStamp = message.timeStamp;
    const msgFieldName = timeStamp + "_" + uid;

    await db.updateDocument(colName,docName,parentPath,{ [msgFieldName] : JSON.stringify(message) } );

    if (message.cardType === "clanMessage"){
        sendClanMessageNotification(message.senderName_cache,message.messageData,cid)
    }

}


const sendClanMessageNotification = async (senderName,messageData,cid) =>{
    const colName = "Clans";
    const parentPath = "/";
    const clan = await db.readDocument(colName, cid, parentPath);

    const body = {
        type: 10,
        text: {
            sender_id: senderName,
            clan_message:messageData,
            clan_logo:clan.clanLogo
        },
        app_open: false,
    }
    const title = `Clan : ${clan.clanName}`;
    const clanId = cid;

    const data = { body,title,clanId };

    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/backBoneServer/pushNotification/sendMsgToClan', data);
        //console.log(response.data);
    } catch (error) {
        console.error('Error calling makeResult API:', error);
        throw new Error("error :" + error.message);
    }
}



const removeMessageFromClanHistory = async (cid  , messageId)=> {

    const colName = "ClanMsg";
    const docName = cid;
    const parentPath = "/";
    const fieldName = messageId;

    await db.deleteField(colName,parentPath,docName,fieldName);
}


const getClanChatHistory = async (cid)=> {

    const colName = "ClanMsg";
    const docName = cid;
    const parentPath = "/";

    return await db.readDocument(colName,docName,parentPath );
}

const updateClanChatHistory = async (cid, messagesHistory)=> {

    const colName = "ClanMsg";
    const docName = cid;
    const parentPath = "/";

    return await db.createDocument(colName,docName,parentPath,messagesHistory);
}

const getClanMembers = async (cid , uid) => {
    
    const colName = "Clans";
    const parentPath = "/";
    const clan = await db.readDocument(colName, cid, parentPath);
    
    if (!clan || !clan.members) {
        // Handle cases where the clan or clan.members is undefined
        return [];
    }

    const membersObjArray = clan.members;
    
    // Extract the UID values from the membersObjArray
    const members = membersObjArray.map(member => member.UID);

    // Find the TYPE of the member with the given uid
    const memberWithUid = membersObjArray.find(member => member.UID === uid);
    const position = memberWithUid ? memberWithUid.TYPE : null;

    
    return { clanMembers : members , senderPosition: position };
}

const getUserInfo =async (uid)=>{
    const colName="Users";
    const docName= uid;
    const parentPath="/";
    const projection = { "gameData": {"trophy" : 1, "carromPass" : { "isPremiumMember" : 1 }}, "profileData": 1, "uid": 1 };
    const user = await db.readDocumentWithProjection(colName,docName,parentPath,projection);
    const cid = user.profileData.clanId;
    const userPicture = user.profileData.userPicture;
    const userName = user.profileData.userName;
    const leagueIcon = TrophyLeagueConverter.trophyToLeague(user.gameData.trophy);
    const isPremiumMember = user.gameData.carromPass.isPremiumMember;
    return {cid,userName,leagueIcon,isPremiumMember,userPicture}; 
}


const registerChallenge = async (uid, challengeUid, mapId) => {
    const colName="Challange";
    const docName= uid;
    const parentPath="Data/UserData";
    return await db.updateDocument(colName,docName,parentPath, {[challengeUid]: mapId, createdAt : {"$date": new Date()}});
}

const acceptChallenge = async (uid, challengeUid) => {
    try{

        const colName="Challange";
        const docName= challengeUid;
        const parentPath="Data/UserData";
        const challengeDoc =  await db.readDocument(colName,docName,parentPath);

        if(challengeDoc[uid] != null){
            const result = await db.deleteDocument(colName, docName, parentPath);
            // console.log(result);
            if (!result.acknowledged || result.deletedCount !== 1) {
                //failed to challenge accepted, someone else already accepted it.
                return {ok : false};
            }
            return {ok : true, mapId: challengeDoc[uid]};
        }

    }catch(e){
        return {ok : false};
    }
}

const removeChallenge = async (uid) => {
    const colName="Challange";
    const docName= uid;
    const parentPath="Data/UserData";
    const challengeDoc =  await db.deleteDocument(colName,docName,parentPath);
}

module.exports = {
    saveMessageToClanHistory,
    getClanMembers,
    getUserInfo,
    getClanChatHistory,
    updateClanChatHistory,
    removeMessageFromClanHistory,
    registerChallenge,
    acceptChallenge,
    removeChallenge
}


// const test = async() => {
//     console.log(await registerChallenge("ukejhrihg", "dkujhgkhdfgd", 4));
// } 

// test();


// const test = async() => {
//     console.log(await acceptChallenge("dkujhgkhdfgd", "ukejhrihg"));
// } 

// test();