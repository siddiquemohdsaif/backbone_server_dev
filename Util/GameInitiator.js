const FirestoreManager = require("../Firestore/FirestoreManager");
const WebSocket = require('ws');

let GAME_SERVER_IPS = null;

const isGameServerIpValid = () => {
    if(GAME_SERVER_IPS === null || GAME_SERVER_IPS.expireTime < Date.now()) {
        return false;
    } else {
        return true;
    }
}

const loadGameServerIPS = async () => {
    const result = await FirestoreManager.getInstance().readDocumentWithProjection("Data", "ServerConfig", "/", {GamePlayServers : 1});
    GAME_SERVER_IPS = { GamePlayServers : result.GamePlayServers , expireTime : Date.now() + 10000}
}

const getGameServerIP = async () => {
    if(!isGameServerIpValid()){
        await loadGameServerIPS();
    }
    
    // Calculate the inverse loads
    const inverseLoads = GAME_SERVER_IPS.GamePlayServers.map(server => (1 - server.load) * 100);
    
    // Calculate the cumulative loads
    const cumulativeLoads = [];
    let cumulativeLoad = 0;
    for (const load of inverseLoads) {
        cumulativeLoad += load;
        cumulativeLoads.push(cumulativeLoad);
    }
    
    if (cumulativeLoad <= 10) {
        // If all servers are near their highest load, randomly select any server.
        const randomIndex = Math.floor(Math.random() * GAME_SERVER_IPS.GamePlayServers.length);
        return GAME_SERVER_IPS.GamePlayServers[randomIndex].IP;
    } else {
        // Randomly select a value in the range [1, cumulativeLoad]
        const randomValue = Math.floor(Math.random() * cumulativeLoad) + 1;
    
        // Find the IP corresponding to the selected value
        for (let i = 0; i < cumulativeLoads.length; i++) {
            if (randomValue <= cumulativeLoads[i]) {
                return GAME_SERVER_IPS.GamePlayServers[i].IP;
            }
        }
    }
    
    return GAME_SERVER_IPS.GamePlayServers[GAME_SERVER_IPS.GamePlayServers.length - 1].IP;
}

const gameInitialPosState = {
    0: '{"playerTurn":0,"isOnlyQueenPocketedLast":false,"carroms":[{"carrom_drawable_id":2131165430,"isPotted":0,"x":0,"y":0.041113000000000004,"type":"CARROM_MEN_1","coinCode":1},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0,"y":0.08222600000000001,"type":"CARROM_MEN_1","coinCode":2},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.035604902425789633,"y":-0.0205565,"type":"CARROM_MEN_1","coinCode":3},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.07120980485157927,"y":-0.041113,"type":"CARROM_MEN_1","coinCode":4},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.035604902425789633,"y":-0.0205565,"type":"CARROM_MEN_1","coinCode":5},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.07120980485157927,"y":-0.041113,"type":"CARROM_MEN_1","coinCode":6},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.0727461339178929,"y":0.04200000000000002,"type":"CARROM_MEN_1","coinCode":7},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.0727461339178929,"y":0.04200000000000002,"type":"CARROM_MEN_1","coinCode":8},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-1.543054966925666E-17,"y":-0.08400000000000006,"type":"CARROM_MEN_1","coinCode":9},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.03637306695894645,"y":0.02100000000000001,"type":"CARROM_MEN_2","coinCode":10},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.03637306695894645,"y":0.02100000000000001,"type":"CARROM_MEN_2","coinCode":11},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-7.71527483462833E-18,"y":-0.04200000000000003,"type":"CARROM_MEN_2","coinCode":12},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.07200000000000005,"y":0,"type":"CARROM_MEN_2","coinCode":13},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.03600000000000003,"y":0.06235382907247962,"type":"CARROM_MEN_2","coinCode":14},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.03600000000000001,"y":0.06235382907247963,"type":"CARROM_MEN_2","coinCode":15},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.07200000000000005,"y":8.81745695386095E-18,"type":"CARROM_MEN_2","coinCode":16},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.03600000000000006,"y":-0.06235382907247961,"type":"CARROM_MEN_2","coinCode":17},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.03600000000000003,"y":-0.06235382907247962,"type":"CARROM_MEN_2","coinCode":18},{"carrom_drawable_id":-1,"isPotted":0,"x":0,"y":0,"type":"QUEEN","coinCode":19}]}',
    1: '{"playerTurn":0,"isOnlyQueenPocketedLast":false,"carroms":[{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.014061474241316319,"y":0.03863358125090599,"type":"CARROM_MEN_1","coinCode":1},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.028122948482632637,"y":0.07726716250181198,"type":"CARROM_MEN_1","coinCode":2},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.04048839956521988,"y":-0.007139197550714016,"type":"CARROM_MEN_1","coinCode":3},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.08097679913043976,"y":-0.014278395101428032,"type":"CARROM_MEN_1","coinCode":4},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.026426926255226135,"y":-0.0314943864941597,"type":"CARROM_MEN_1","coinCode":5},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.05285385251045227,"y":-0.0629887729883194,"type":"CARROM_MEN_1","coinCode":6},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.053994160145521164,"y":0.06434773653745651,"type":"CARROM_MEN_1","coinCode":7},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.08272384852170944,"y":0.014586446806788445,"type":"CARROM_MEN_1","coinCode":8},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.028729692101478577,"y":-0.07893417775630951,"type":"CARROM_MEN_1","coinCode":9},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.026997080072760582,"y":0.032173868268728256,"type":"CARROM_MEN_2","coinCode":10},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.04136192426085472,"y":0.007293223403394222,"type":"CARROM_MEN_2","coinCode":11},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.014364846050739288,"y":-0.039467088878154755,"type":"CARROM_MEN_2","coinCode":12},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.06765786558389664,"y":0.024625450372695923,"type":"CARROM_MEN_2","coinCode":13},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.012502668425440788,"y":0.0709061548113823,"type":"CARROM_MEN_2","coinCode":14},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.055155199021101,"y":0.04628070816397667,"type":"CARROM_MEN_2","coinCode":15},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.06765786558389664,"y":-0.024625450372695923,"type":"CARROM_MEN_2","coinCode":16},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.012502668425440788,"y":-0.0709061548113823,"type":"CARROM_MEN_2","coinCode":17},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.055155199021101,"y":-0.04628070816397667,"type":"CARROM_MEN_2","coinCode":18},{"carrom_drawable_id":-1,"isPotted":0,"x":0,"y":0,"type":"QUEEN","coinCode":19}]}',
    2: '{"playerTurn":0,"isOnlyQueenPocketedLast":false,"carroms":[{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.026426926255226135,"y":0.0314943864941597,"type":"CARROM_MEN_1","coinCode":1},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.05285385251045227,"y":0.0629887729883194,"type":"CARROM_MEN_1","coinCode":2},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.04048839956521988,"y":0.007139197550714016,"type":"CARROM_MEN_1","coinCode":3},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.08097679913043976,"y":0.014278395101428032,"type":"CARROM_MEN_1","coinCode":4},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.014061474241316319,"y":-0.03863358125090599,"type":"CARROM_MEN_1","coinCode":5},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.028122948482632637,"y":-0.07726716250181198,"type":"CARROM_MEN_1","coinCode":6},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.028729692101478577,"y":0.07893417775630951,"type":"CARROM_MEN_1","coinCode":7},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.08272384852170944,"y":-0.014586446806788445,"type":"CARROM_MEN_1","coinCode":8},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.053994160145521164,"y":-0.06434773653745651,"type":"CARROM_MEN_1","coinCode":9},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.014364846050739288,"y":0.039467088878154755,"type":"CARROM_MEN_2","coinCode":10},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.04136192426085472,"y":-0.007293223403394222,"type":"CARROM_MEN_2","coinCode":11},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.026997080072760582,"y":-0.032173868268728256,"type":"CARROM_MEN_2","coinCode":12},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.055155199021101,"y":0.04628070816397667,"type":"CARROM_MEN_2","coinCode":13},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.012502668425440788,"y":0.0709061548113823,"type":"CARROM_MEN_2","coinCode":14},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.06765786558389664,"y":0.024625450372695923,"type":"CARROM_MEN_2","coinCode":15},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.055155199021101,"y":-0.04628070816397667,"type":"CARROM_MEN_2","coinCode":16},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.012502668425440788,"y":-0.0709061548113823,"type":"CARROM_MEN_2","coinCode":17},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.06765786558389664,"y":-0.024625450372695923,"type":"CARROM_MEN_2","coinCode":18},{"carrom_drawable_id":-1,"isPotted":0,"x":0,"y":0,"type":"QUEEN","coinCode":19}]}',
    3: '{"playerTurn":0,"isOnlyQueenPocketedLast":false,"carroms":[{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.03560490161180496,"y":0.020556500181555748,"type":"CARROM_MEN_1","coinCode":1},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.07120980322360992,"y":0.041113000363111496,"type":"CARROM_MEN_1","coinCode":2},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.03560490161180496,"y":0.020556500181555748,"type":"CARROM_MEN_1","coinCode":3},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.07120980322360992,"y":0.041113000363111496,"type":"CARROM_MEN_1","coinCode":4},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-1.0408340855860843E-17,"y":-0.041113000363111496,"type":"CARROM_MEN_1","coinCode":5},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-2.0816681711721685E-17,"y":-0.08222600072622299,"type":"CARROM_MEN_1","coinCode":6},{"carrom_drawable_id":2131165430,"isPotted":0,"x":2.0816681711721685E-17,"y":0.08399999886751175,"type":"CARROM_MEN_1","coinCode":7},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.07274613529443741,"y":-0.041999999433755875,"type":"CARROM_MEN_1","coinCode":8},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.07274613529443741,"y":-0.041999999433755875,"type":"CARROM_MEN_1","coinCode":9},{"carrom_drawable_id":2131165284,"isPotted":0,"x":1.0408340855860843E-17,"y":0.041999999433755875,"type":"CARROM_MEN_2","coinCode":10},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.036373067647218704,"y":-0.020999999716877937,"type":"CARROM_MEN_2","coinCode":11},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.036373067647218704,"y":-0.020999999716877937,"type":"CARROM_MEN_2","coinCode":12},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.035999998450279236,"y":0.06235383078455925,"type":"CARROM_MEN_2","coinCode":13},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.035999998450279236,"y":0.06235383078455925,"type":"CARROM_MEN_2","coinCode":14},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.07199999690055847,"y":2.42861286636753E-17,"type":"CARROM_MEN_2","coinCode":15},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.035999998450279236,"y":-0.06235383078455925,"type":"CARROM_MEN_2","coinCode":16},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.035999998450279236,"y":-0.06235383078455925,"type":"CARROM_MEN_2","coinCode":17},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.07199999690055847,"y":0,"type":"CARROM_MEN_2","coinCode":18},{"carrom_drawable_id":-1,"isPotted":0,"x":0,"y":0,"type":"QUEEN","coinCode":19}]}',
    4: '{"playerTurn":0,"isOnlyQueenPocketedLast":false,"carroms":[{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.04048839956521988,"y":0.007139197550714016,"type":"CARROM_MEN_1","coinCode":1},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.08097679913043976,"y":0.014278395101428032,"type":"CARROM_MEN_1","coinCode":2},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.026426926255226135,"y":0.0314943864941597,"type":"CARROM_MEN_1","coinCode":3},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.05285385251045227,"y":0.0629887729883194,"type":"CARROM_MEN_1","coinCode":4},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.014061474241316319,"y":-0.03863358125090599,"type":"CARROM_MEN_1","coinCode":5},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.028122948482632637,"y":-0.07726716250181198,"type":"CARROM_MEN_1","coinCode":6},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.028729692101478577,"y":0.07893417775630951,"type":"CARROM_MEN_1","coinCode":7},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.053994160145521164,"y":-0.06434773653745651,"type":"CARROM_MEN_1","coinCode":8},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.08272384852170944,"y":-0.014586446806788445,"type":"CARROM_MEN_1","coinCode":9},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.014364846050739288,"y":0.039467088878154755,"type":"CARROM_MEN_2","coinCode":10},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.026997080072760582,"y":-0.032173868268728256,"type":"CARROM_MEN_2","coinCode":11},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.04136192426085472,"y":-0.007293223403394222,"type":"CARROM_MEN_2","coinCode":12},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.012502668425440788,"y":0.0709061548113823,"type":"CARROM_MEN_2","coinCode":13},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.055155199021101,"y":0.04628070816397667,"type":"CARROM_MEN_2","coinCode":14},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.06765786558389664,"y":-0.024625450372695923,"type":"CARROM_MEN_2","coinCode":15},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.012502668425440788,"y":-0.0709061548113823,"type":"CARROM_MEN_2","coinCode":16},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.055155199021101,"y":-0.04628070816397667,"type":"CARROM_MEN_2","coinCode":17},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.06765786558389664,"y":0.024625450372695923,"type":"CARROM_MEN_2","coinCode":18},{"carrom_drawable_id":-1,"isPotted":0,"x":0,"y":0,"type":"QUEEN","coinCode":19}]}',
    5: '{"playerTurn":0,"isOnlyQueenPocketedLast":false,"carroms":[{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.04048839956521988,"y":-0.007139197550714016,"type":"CARROM_MEN_1","coinCode":1},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.08097679913043976,"y":-0.014278395101428032,"type":"CARROM_MEN_1","coinCode":2},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.014061474241316319,"y":0.03863358125090599,"type":"CARROM_MEN_1","coinCode":3},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.028122948482632637,"y":0.07726716250181198,"type":"CARROM_MEN_1","coinCode":4},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.026426926255226135,"y":-0.0314943864941597,"type":"CARROM_MEN_1","coinCode":5},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.05285385251045227,"y":-0.0629887729883194,"type":"CARROM_MEN_1","coinCode":6},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.053994160145521164,"y":0.06434773653745651,"type":"CARROM_MEN_1","coinCode":7},{"carrom_drawable_id":2131165430,"isPotted":0,"x":-0.028729692101478577,"y":-0.07893417775630951,"type":"CARROM_MEN_1","coinCode":8},{"carrom_drawable_id":2131165430,"isPotted":0,"x":0.08272384852170944,"y":0.014586446806788445,"type":"CARROM_MEN_1","coinCode":9},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.026997080072760582,"y":0.032173868268728256,"type":"CARROM_MEN_2","coinCode":10},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.014364846050739288,"y":-0.039467088878154755,"type":"CARROM_MEN_2","coinCode":11},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.04136192426085472,"y":0.007293223403394222,"type":"CARROM_MEN_2","coinCode":12},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.012502668425440788,"y":0.0709061548113823,"type":"CARROM_MEN_2","coinCode":13},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.06765786558389664,"y":0.024625450372695923,"type":"CARROM_MEN_2","coinCode":14},{"carrom_drawable_id":2131165284,"isPotted":0,"x":-0.055155199021101,"y":-0.04628070816397667,"type":"CARROM_MEN_2","coinCode":15},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.012502668425440788,"y":-0.0709061548113823,"type":"CARROM_MEN_2","coinCode":16},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.06765786558389664,"y":-0.024625450372695923,"type":"CARROM_MEN_2","coinCode":17},{"carrom_drawable_id":2131165284,"isPotted":0,"x":0.055155199021101,"y":0.04628070816397667,"type":"CARROM_MEN_2","coinCode":18},{"carrom_drawable_id":-1,"isPotted":0,"x":0,"y":0,"type":"QUEEN","coinCode":19}]}'
};

const getInitialGamePosition = (strikerId_1, strikerId_2,map, CarromId_1, CarromId_2,playerExtraInfo1,playerExtraInfo2) => {
    // Randomly select any state from gameInitialPosState
    const randomIndex = Math.floor(Math.random() * Object.keys(gameInitialPosState).length);
    const selectedState = gameInitialPosState[randomIndex];

    // Parse the string to a JSON object
    const gameStateObj = JSON.parse(selectedState);

    // Replace carrom_drawable_id values for CARROM_MEN_1 and CARROM_MEN_2
    gameStateObj.carroms.forEach((carrom) => {
        if (carrom.type === 'CARROM_MEN_1') {
            carrom.carrom_drawable_id = CarromId_1;
        } else if (carrom.type === 'CARROM_MEN_2') {
            carrom.carrom_drawable_id = CarromId_2;
        }
    });

    // Add strikerId_1 and strikerId_2 and map to the state
    gameStateObj.strikerId_1 = strikerId_1;
    gameStateObj.strikerId_2 = strikerId_2;
    gameStateObj.playerExtraInfo1 = playerExtraInfo1;
    gameStateObj.playerExtraInfo2 = playerExtraInfo2;
    gameStateObj.map = map;

    // Return the updated state
    return JSON.stringify(gameStateObj);
};


const initializeGameInGameServer = async (gameID, gameState, IP) => {
    const Game_SERVER_BASE_URL = `ws://${IP}?gameID=${encodeURIComponent(gameID)}&gameState=${encodeURIComponent(gameState)}&IP=${encodeURIComponent(IP)}`;

    //console.log(Game_SERVER_BASE_URL);
    return new Promise((resolve) => {
        const socket = new WebSocket(Game_SERVER_BASE_URL);

        socket.on('close', (code, reason) => {
            if (code === 1000) {
                //console.log('Game state Initialize successful.');
                resolve(true);
            } else {
                console.error('Game state Initialize failed:', reason);
                resolve(false);
            }
        });

        socket.on('error', (error) => {
            console.error('WebSocket Error:', error);
            resolve(false);
        });
    });
};


function getMapNameByMapId(map) {
    switch (map) {
        case 0:
            return "MONGOL WARRIOR";
        case 1:
            return "BRITISH EMPIRE";
        case 2:
            return "RUSSIAN BASE";
        case 3:
            return "MAURYA KINGDOM";
        case 4:
            return "SPANISH SPY";
        case 5:
            return "EGYPTIAN KNIGHTS";
        case 6:
            return "OTTOMON LEGACY";
        case 7:
            return "PERSIAN DUST";
        default:
            return null;
    }
}


module.exports = {
   getInitialGamePosition,
   initializeGameInGameServer,
   getGameServerIP,
   getMapNameByMapId
}