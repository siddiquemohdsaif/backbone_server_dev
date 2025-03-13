const axios = require('axios');


const test = async  (senderName,challengeUid) =>  {
    const body = {
        type: 0,
        text: `${senderName} have sent you Friendly Challenege.`,
        app_open: false,
    }
    const title = "Friendly Challenge";
    const receiverUID = challengeUid;

    const data = { body,title,receiverUID };

    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/backBoneServer/pushNotification/sendMsgToPlayer', data);
        //console.log(response.data);
    } catch (error) {
        console.error('Error calling makeResult API:', error);
        throw new Error("error :" + error.message);
    }
}

test("Parvez","dbSMWPyCa5ox8wj7");