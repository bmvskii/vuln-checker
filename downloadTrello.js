// API docs https://developer.atlassian.com/cloud/trello/rest/api-group-lists/

const Trello = require("node-trello");
const https = require('https');
const fs = require('fs');

const API_Key = "----";
const API_Token = "----"

const t = new Trello(API_Key, API_Token);

const boardId = "djwu7zzB";

const toCheckEasyId = "621dff85204ca28580257bf4";
const emptyId = "621e428b28f14b610386b61f";

const getAttachments = (id) => {
    return new Promise((res, rej) => {
        t.get(`/1/cards/${id}/attachments`, function (err, data) {
            if (err) rej(err);
            res(data);
        });
    });
}

const downloadAttachments = (url, dest) => {
    return new Promise((res, _) => {
        const file = fs.createWriteStream(dest);
        https.get(url, function (response) {
            response.pipe(file);
            file.on('finish', function () {
                file.close(() => res());
            });
        });
    });
}

const getCards = (id) => {
    return new Promise((res, rej)=>{
        t.get(`/1/lists/${id}/cards`, async (err, data) => {
            if (err) rej(err);
            res(data);
        });
    });
}

(async ()=>{
    let cards = await getCards(toCheckEasyId);
    cards = cards.filter(({ idMembers }) => idMembers.length == 0);
    
    console.log('Cards: ', cards.length);
    
    for (const i of cards) {
        const id = i.id;
        const attachments = await getAttachments(id);
        if (attachments.length != 0) {
            const { url, name } = attachments[0];
            await downloadAttachments(url, `${__dirname}/reports/${name}`);
            console.log("-->");
        }
        else {
            console.log("no attachments for", i.url);
        }
    }

    console.log("done");
    process.exit(0);
})();