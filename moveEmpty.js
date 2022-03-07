// API docs https://developer.atlassian.com/cloud/trello/rest/api-group-lists/

const Trello = require("node-trello");
const https = require('https');
const path = require('path');
const fs = require('fs-extra');

const API_Key = "----";
const API_Token = "----"

const t = new Trello(API_Key, API_Token);

const boardId = "djwu7zzB";

const toCheckEasyId = "621dff85204ca28580257bf4";
const emptyId = "621e428b28f14b610386b61f";

const getCards = (id) => {
    return new Promise((res, rej) => {
        t.get(`/1/lists/${id}/cards`, async (err, data) => {
            if (err) rej(err);
            res(data);
        });
    });
}

const getEmpty = async () => {
    const directoryPath = path.join(__dirname, 'empty');
    //passsing directoryPath and callback function
    const files = await fs.readdir(directoryPath)
    return files;
}

const moveCard = async (id, listId) => {
    return new Promise((res, rej) => {
        t.put(`/1/cards/${id}?idList=${listId}`, (err, data) => {
            if (err) rej(err);
            res(data);
        });
    });
}

(async () => {
    let cards = await getCards(toCheckEasyId);
    cards = cards.filter(({ idMembers }) => idMembers.length == 0);
    console.log('Cards: ', cards.length);

    let empty = await getEmpty();
    console.log('Empty: ', empty.length);

    for(const nameToMove of empty){
        const idToMove = cards.find(c => c.name == nameToMove + ".zip")?.id;
        if(!idToMove){
            console.log("Not moved ", nameToMove);
        }
        else {
            await moveCard(idToMove, emptyId);
            console.log("Moved -> ", nameToMove);
        }
        // return;
    }
    console.log("done");
    process.exit(0);
})();