// API docs https://developer.atlassian.com/cloud/trello/rest/api-group-lists/

const Trello = require("node-trello");
const path = require('path');
const fs = require('fs-extra');
const config = require('./utils/config');

const API_Key = config.TRELLO_API_Key;
const API_Token = config.TRELLO_API_Token;

const t = new Trello(API_Key, API_Token);

const boardId = "djwu7zzB";

const getListOnBoard = (id) => {
    return new Promise((res, rej) => {
        t.get(`/1/boards/${id}/lists`, async (err, data) => {
            if (err) rej(err);
            res(data);
        });
    });
}

(async () => {
    console.log(await getListOnBoard(boardId));
})();