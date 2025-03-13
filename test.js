const { getGameServerIP } = require('./Util/GameInitiator');
const FirestoreManager = require('./Firestore/FirestoreManager');

const test = async () => {
 
    //IPS_Call ini
    const IPS_Call = {
         "167.172.85.50:14999" : 0,
         "167.172.85.51:14999" : 0, 
         "167.172.85.52:14999" : 0,
         "167.172.85.53:14999" : 0,
         "167.172.85.54:14999" : 0,
        }

    //get 1000 times IP by getGameServerIP and store in IPS_Call object  
    for(let i=0 ; i < 10000; i++){
        const Ip = await getGameServerIP();
        IPS_Call[Ip] ++; 
    }


    //log
    console.log(IPS_Call);

}

const test2 = async () => {
 
    // const usercollectionArray = await FirestoreManager.getInstance().bulkReadDocuments("Users", "/", ["kpiHE9CiMuU0h2LC", "QECsIVotjrE4wWxD"], { "gameData.collection": 1 });


    // //log
    console.log(parseInt("illjtg;ldjkr/;g"));

}

test2();