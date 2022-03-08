// API docs https://developer.atlassian.com/cloud/trello/rest/api-group-lists/

const Trello = require("node-trello");
const path = require('path');
const fs = require('fs-extra');
const config = require('./utils/config');

const API_Key = config.TRELLO_API_Key;
const API_Token = config.TRELLO_API_Token;

const t = new Trello(API_Key, API_Token);

const getCards = (id) => {
    return new Promise((res, rej) => {
        t.get(`/1/lists/${id}/cards`, async (err, data) => {
            if (err) rej(err);
            res(data);
        });
    });
}

const getByFolder = async (folder) => {
    const directoryPath = path.join(__dirname, '../vulns', folder);
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

const moveVulnsToList = async (folder, listId) => {
    let cards = await getCards(toCheckEasyId);
    cards = cards.filter(({ idMembers }) => idMembers.length == 0);

    let reports = await getByFolder(folder);
    console.log(folder + ': ', reports.length);

    for (const nameToMove of reports) {
        const idToMove = cards.find(c => c.name == nameToMove + ".zip")?.id;
        if (!idToMove) {
            console.log("Not moved ", nameToMove);
        }
        else {
            await moveCard(idToMove, listId);
            console.log("Moved -> ", nameToMove);
        }
        // return;
    }
}

const toCheckEasyId = "621dff85204ca28580257bf4";
const normal = "621cb9907f4c4d63cff7bbe2";
const mid = "621ebc625df3721dbaa626e5";
const hard = "621e874d0ac57c70d425fd59";

(async () => {
    await moveVulnsToList('critical', hard);
    await moveVulnsToList('medium', mid);
    await moveVulnsToList('high', mid);
    await moveVulnsToList('info', normal);
    await moveVulnsToList('other', normal);

    console.log("done");
    process.exit(0);
})();