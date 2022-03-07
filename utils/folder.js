const fs = require('fs');
const fse = require('fs-extra');

const createFolder = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
};

const initFolders = () => {
  const folders = ["vulns", "empty"];
  folders.forEach(createFolder);
};

const moveFolder = (from, to) => {
  fse.moveSync(from, to, { overwrite: true }, function (err) {
    if (err) {
      console.error(err);
    }
  });
};

const createAndMoveFolder = (data) => {
  const { from, reportFolderName, vulnLevel } = data;
  const dst = `vulns/${vulnLevel.toLowerCase()}`;

  createFolder(dst);
  moveFolder(from, `${dst}/${reportFolderName}`);
};

module.exports = {
    createFolder,
    createAndMoveFolder,
    moveFolder,
    initFolders
};
