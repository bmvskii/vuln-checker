const dotenv = require('dotenv');
const fs = require('fs');

const filePath = __dirname.replace('src/utils', 'prod.env');
console.log(filePath);
module.exports = dotenv.parse(fs.readFileSync(filePath));