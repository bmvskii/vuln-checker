// API docs https://developer.atlassian.com/cloud/trello/rest/api-group-lists/

const Trello = require("node-trello");
const https = require('https');
const fs = require('fs');
const config = require('./utils/config');
const path = require("path");

const API_Key = config.TRELLO_API_Key;
const API_Token = config.TRELLO_API_Token;

const t = new Trello(API_Key, API_Token);

const toCheckEasyId = "621dff85204ca28580257bf4";

const getAttachments = (id) => {
    return new Promise((res, rej) => {
        t.get(`/1/cards/${id}/attachments`, function (err, data) {
            if (err) rej(err);
            res(data);
        });
    });
}

const downloadAttachments = (url, dest) => {
    return new Promise((resolve, reject) => {
        const download = fs.createWriteStream(dest);

        const _url = url + '?key=' + API_Key + '&token=' + API_Token;
        https.get(_url, {
            headers: {
                Authorization:
                    'OAuth oauth_consumer_key="' +
                    API_Key +
                    '", oauth_token="' +
                    API_Token +
                    '"',
            },
        }, (res) => {
            res.pipe(download);
            download.on('finish', function () {
                download.close((err) => {
                    if (!err) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            }).on('error', (err) => {
                fs.unlink(dest);
            });
        });

    });
}

const getCards = (id) => {
    return new Promise((res, rej) => {
        t.get(`/1/lists/${id}/cards`, async (err, data) => {
            if (err) rej(err);
            res(data);
        });
    });
}

const insureStructure = () => {
    for (const i of ['reports', 'empty']) {
        if (fs.existsSync(i)) continue;
        fs.mkdirSync(i);
    }
}

(async () => {
    insureStructure();

    let cards = await getCards(toCheckEasyId);
    cards = cards.filter(({ idMembers }) => idMembers.length == 0);

    console.log('Cards: ', cards.length);

    for (const i of cards) {
        const id = i.id;
        const attachments = await getAttachments(id);
        if (attachments.length != 0) {
            const { url, name } = attachments[0];
            const dest =  path.join(__dirname, '../reports', name);
            await downloadAttachments(url, dest);
            console.log("-->");
        }
        else {
            console.log("no attachments for", i.url);
        }
    }

    console.log("done");
    process.exit(0);
})();