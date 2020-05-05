const moment = require('moment');
let storeShareMessage = {};

function formatMessage(username, text) {
    return {
        username,
        text,
        time: moment().format('h:mm A')
    };
}

function storeShareCode(room, code) {
    storeShareMessage[room] = code;
}

function getShareCodeForRoom(room) {
    return storeShareMessage[room];
}

module.exports = { formatMessage, storeShareCode, getShareCodeForRoom };