const fs = require("fs");
const fse = require("fs-extra");
const extract = require("extract-zip");
const path = require("path");
const colors = require("colors");
const { initFolders, createAndMoveFolder, moveTo} = require('./utils/folder');

const rootFolder = path.join(__dirname, "../reports");
const filesToSkip = [".DS_Store"];
const emptyReports = [];
const TIME_FOR_RESTART = 100;
const ZIP_ENDING = '.zip';
const TXT_ENDING = '.txt';

try {
  // STAGE 1 - initialization of folders
  initFolders();

  // STAGE 2 - unarchive .zip reports
  const archivedReportsFolders = fs
    .readdirSync(rootFolder)
    .filter((entityName) => !filesToSkip.includes(entityName));

  if (archivedReportsFolders.length === 0) {
    console.log(colors.red("--- No reports provided. ----"));
    process.exit(1);
  }

  archivedReportsFolders.forEach(async (archivedReport) => {
    if (archivedReport.includes(ZIP_ENDING)) {
      try {
        const [folderName] = archivedReport.split(ZIP_ENDING);
        const archivedFolderPath = `${rootFolder}/${archivedReport}`;
        const destFolderPath = path.resolve(`${rootFolder}/${folderName}`);

        await extract(archivedFolderPath, { dir: destFolderPath });
        fse.removeSync(archivedFolderPath);
      } catch (err) {
        console.log(err);
      }
    }
  });

  // STAGE 3 - start checking reports on vulnerabilities
  const runReportsCheck = () => {
    // Filter zip folders (can exist on this moment) 
    const hasZipFolders = fs
      .readdirSync(rootFolder)
      .some((entity) => entity.includes(ZIP_ENDING));

    if (hasZipFolders) {
      setTimeout(() => { runReportsCheck() }, TIME_FOR_RESTART);
    } else {
      const reportsFolders = fs
        .readdirSync(rootFolder)
        .filter((name) => !filesToSkip.includes(name) && !name.includes("zip"));

      // STAGE 5 - working with each report
      reportsFolders.forEach((reportFolderName) => {
        const reportFolderPath = `${rootFolder}/${reportFolderName}`;

        if (fs.existsSync(reportFolderPath)) {
          const fileName = fs
            .readdirSync(reportFolderPath)
            .filter((entityName) => entityName.includes(TXT_ENDING));
          const reportFilePath = path.resolve(
            `${reportFolderPath}/${fileName}`
          );
          const reportContent = fs.readFileSync(reportFilePath, "utf-8");
          const regExpPattern = new RegExp(/(Info|Medium|High|Critical): \d*/g);
          const otherVulnsPatterns = new RegExp(
            /(auth|login|Siemens|simatic|WinCC|PLC|SIWACON|SIwatool|ПЛК|S7-1200|S7-1500|S7-300|S7-400|Profiner|profibus)/gi
          );
          const otherVulnsMatch = reportContent.match(otherVulnsPatterns) || [];
          const vulnerabilities = {
            Medium: 0,
            Critical: 0,
            High: 0,
            Info: 0,
            Other: 0,
          };
        
          // STAGE 6 - run RegExps 

          vulnerabilities["Other"] = otherVulnsMatch.length;
          reportContent.match(regExpPattern).forEach((vuln) => {
            const [type, amount] = vuln.split(": ");
            vulnerabilities[type] += +amount || 0;
          });

          const hasVulns = Object
            .values(vulnerabilities)
            .reduce((acc, curr) => acc + curr, 0) !== 0;

          if (!hasVulns) {
            emptyReports.push(reportFolderName);
          } 

          // STAGE 7 - sort reports to folders

          const from = `${rootFolder}/${reportFolderName}`;
          for (const vulnLevel of ["Critical", "High", "Medium", "Info", "Other"]) {
            if (vulnerabilities[vulnLevel]) {
              createAndMoveFolder({ from, reportFolderName, vulnLevel });
              return;
            }
          }

          moveTo(from, `./empty/${reportFolderName}`);
        }
      });
    }
  };

  setTimeout(() => { runReportsCheck() }, TIME_FOR_RESTART);
} catch (error) {
  console.log(error);
}

console.log(colors.red("--- Empty reports list ---"));
emptyReports.forEach((report) => {
  console.log(report);
});
