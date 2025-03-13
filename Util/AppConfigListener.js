const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();


let appConfigPrevious = {
    //all app config store here
};



const checkAppConfigChange = async() => {

    try{
        const appconfig = await firestoreManager.readDocument("GameInfo","AppConfiguration", "/");
        const configs = appconfig.configs;
        let changeList = [];
        for(let i=0; i<configs.length; i++){
            const appConfigVersion = JSON.stringify(await firestoreManager.readDocument("GameInfo", configs[i], "/"));
            const previousAppConfigPrevious = appConfigPrevious[configs[i]]
            if(previousAppConfigPrevious){
                if(isChange(previousAppConfigPrevious, appConfigVersion)){
                    changeList.push(configs[i]);
                    //put updated in list
                    appConfigPrevious[configs[i]] = appConfigVersion;
                }
            }else{
                //put in list
                appConfigPrevious[configs[i]] = appConfigVersion;
            }
        }

        if(changeList.length === 0){
            return null;

        }else{
            return changeList
        }

    }catch(e) {
        return null;
    }


}



const startAppConfigChangeListener = (sockets) => {
    setInterval(async () => {
        const appConfigNames = await checkAppConfigChange();
        if(appConfigNames){
            inforAllUserAboutAppConfigChange(sockets, appConfigNames);
        }

    }, 10000); // 10 second check loop
}

const inforAllUserAboutAppConfigChange = async(sockets, appConfigNames) => {
    // Send to all players with a delay of 10 ms between each message
    const uids = Object.keys(sockets);
    for (let uid of uids) {
        await sleep(10);
        if (sockets[uid]) {
            sockets[uid].send(JSON.stringify({ type: "appConfigChange", message: appConfigNames }));
        }
    }
    console.log(appConfigNames);
}


const isChange = (previousConfigStr, currentConfigStr) => {
    return previousConfigStr !== currentConfigStr;
}


const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}


module.exports = {
    startAppConfigChangeListener
}
