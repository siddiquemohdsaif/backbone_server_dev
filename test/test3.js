const axios = require('axios');
const FirestoreManager = require("../Firestore/FirestoreManager");

const db=FirestoreManager.getInstance();

const test = async  (senderName,clanId) =>  {
    const colName = "Clans";
    const parentPath = "/";
    const clan = await db.readDocument(colName, clanId, parentPath);

    const body = {
        type: 10,
        text: {
            sender_id: senderName,
            clan_message:"HIi, Parvez Here",
            clan_logo:clan.clanLogo
        },
    }
    const title = "Clan Message";


    const data = { body,title,clanId };

    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/backBoneServer/pushNotification/sendMsgToClan', data);
        //console.log(response.data);
    } catch (error) {
        console.error('Error calling makeResult API:', error);
        throw new Error("error :" + error.message);
    }
}

test("Parvez","MGMYFHDHS");