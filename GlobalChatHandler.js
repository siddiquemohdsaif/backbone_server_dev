const WebSocket = require('ws');
const GlobalChatSetting = require('./Util/GlobalSetting');

let groupSizeLimit = 30;
let groupDeleteThreshold = 3;
let chatHistoryLimit = 30;
let maxReport = 3;

let groups = [{ historyChat: [], members: [] }];


function handleNewClient(ws, uid) {
    const currentGroupSizeLimit = groupSizeLimit;
    let group = groups.find(group => group.members.length < currentGroupSizeLimit);

    if (!group) {
        group = { historyChat: [], members: [] };
        groups.push(group);
    }

    group.members.push({ ws, uid, reports: [] });
    ws.group = group;


    return { type: "globalMessageCreate", status: "success", historyChat: ws.group.historyChat };
}


function handleDisconnectingClient(ws) {
    const currentGroupSizeLimit = groupSizeLimit;
    const currentGroupDeleteThreshold = groupDeleteThreshold;
    const group = ws.group;
    const memberIndex = group.members.findIndex(member => member.ws === ws);
    group.members.splice(memberIndex, 1);

    // Check if the group has no members
    if (group.members.length === 0) {
        if (groups.length !== 1){
            groups.splice(groups.indexOf(group), 1);
        }
        return;
    }

    if (group.members.length <= currentGroupDeleteThreshold) {
        const otherGroup = groups.find(g => g !== group && g.members.length < currentGroupSizeLimit - group.members.length);

        if (otherGroup) {
            otherGroup.members.push(...group.members);
            group.members.forEach(member => { member.ws.group = otherGroup; });
            groups.splice(groups.indexOf(group), 1);
        }
    }
}


function broadcast(group, message) {
    group.members.forEach(member => {
        if (member.ws && member.ws.readyState === WebSocket.OPEN) {
            member.ws.send(JSON.stringify({ type: "globalMessageBroadCast", message: message }));
        }
    });
}


function broadcastRefresh(group) {
    group.members.forEach(member => {
        if (member.ws && member.ws.readyState === WebSocket.OPEN) {
            member.ws.send(JSON.stringify({ type: "globalMessageBroadCastRefresh", historyChat: group.historyChat }));
        }
    });
}

const startGlobalChat = (ws, uid) => {
    if (ws.group) {
        return { type: "globalMessageCreate", status: "error : already global chat active", historyChat: ws.group.historyChat };
    }
    updateSetting();
    return handleNewClient(ws, uid);
};

const updateSetting = async () => {
    try{
        const globalChatSetting = await GlobalChatSetting.get();
        groupSizeLimit = globalChatSetting.groupSizeLimit;
        groupDeleteThreshold = globalChatSetting.groupDeleteThreshold;
        chatHistoryLimit = globalChatSetting.chatHistoryLimit;
        maxReport = globalChatSetting.maxReport;
    }catch(e) {
        console.error(e);
    }
}

const sendGlobalChatMessage = (ws, message) => {
    //console.log("sendGlobalChatMessage:"+ message);

    if(!ws.group){
        return;
    }
    
    //console.log("sendGlobalChatMessage pass:"+ message);

    ws.group.historyChat.push(message);

    // If historyChat exceeds its limit, remove the oldest message
    if (ws.group.historyChat.length > chatHistoryLimit) {
        ws.group.historyChat.shift();
    }

    broadcast(ws.group, message);
};




const stopGlobalChat = (ws) => {
    if (ws.group) {
        handleDisconnectingClient(ws);
        delete ws.group;
    }
};

function reportUser(ws, uid) {
    //console.log("report:" + uid);
    if (ws.group) {
        const group = ws.group;
        const reportingMember = group.members.find(member => member.ws === ws);
        if (!reportingMember) return;


        const reportedMember = group.members.find(member => member.uid === uid);
        if (reportedMember) {
            // Prevent self-reporting
            if (reportingMember.uid === reportedMember.uid) {
                //console.log("Cannot report yourself");
                return;
            } 
            
            // Check if the reporting user has already reported this user
            if (reportedMember.reports.includes(reportingMember.uid)) {
                //console.log("User already reported");
                return; // Don't allow reporting more than once
            }
        

            reportedMember.reports.push(reportingMember.uid);
            const totalReports = reportedMember.reports.length;
            //console.log("report:" + uid + " max:" + maxReport + " current:" + totalReports);
            //console.log(reportedMember);

            if (totalReports >= maxReport) {
                //console.log("report:" + uid + " success");

                // Remove kicked user messages from history
                group.historyChat = group.historyChat.filter(message => message.senderId !== uid);
                broadcastRefresh(group);
                if (reportedMember.ws && reportedMember.ws.readyState === WebSocket.OPEN) {
                    reportedMember.ws.send(JSON.stringify({ type: "globalMessageKick", uid: uid, message: "You have been kicked due to reports." }));
                }

                stopGlobalChat(reportedMember.ws);
            }
        }
    }
}

module.exports = {
    startGlobalChat,
    sendGlobalChatMessage,
    stopGlobalChat,
    reportUser
}
