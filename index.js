const fs = require("fs");
const fse = require("fs-extra");
const extract = require("extract-zip");
const path = require("path");
const colors = require("colors");

const rootFolder = "./reports";
const emptyReportsFolder = "./empty";
const withVulnReportsFolder = "./has_vulns";

const filesToSkip = [".DS_Store"];

const moveFolder = (from, to) => {
  fse.moveSync(from, to, { overwrite: true }, function (err) {
    if (err) {
      console.error(err);
    }
  });
};

const emptyReports = [];

try {
  const archivedReportsFolders = fs
    .readdirSync(rootFolder)
    .filter((entityName) => !filesToSkip.includes(entityName));

  if (archivedReportsFolders.length === 0) {
    console.log(colors.red("--- No reports provided. ----"));
    return;
  }

  // --- unarchive reports
  archivedReportsFolders.forEach(async (archivedReport) => {
    if (archivedReport.includes(".zip")) {
      try {
        const [folderName] = archivedReport.split(".zip");
        const archivedFolderPath = `${rootFolder}/${archivedReport}`;
        const destFolderPath = path.resolve(`${rootFolder}/${folderName}`);

        await extract(archivedFolderPath, { dir: destFolderPath });
        fse.removeSync(archivedFolderPath);
      } catch (err) {
        console.log(err);
      }
    }
  });

  const runReportsCheck = () => {
    const hasZipFolders = fs
      .readdirSync(rootFolder)
      .some((entity) => entity.includes("zip"));

    if (hasZipFolders) {
      setTimeout(() => { runReportsCheck() }, 100);
    } else {
      const reportsFolders = fs
        .readdirSync(rootFolder)
        .filter(
          (entityName) => !filesToSkip.includes(entityName) && !entityName.includes("zip")
        );

      reportsFolders.forEach((reportFolderName) => {
        const reportFolderPath = `${rootFolder}/${reportFolderName}`;

        if (fs.existsSync(reportFolderPath)) {
          const fileName = fs
            .readdirSync(reportFolderPath)
            .filter((entityName) => entityName.includes(".txt"));
          const reportFilePath = path.resolve(`${reportFolderPath}/${fileName}`);
          const reportContent = fs.readFileSync(reportFilePath, "utf-8");
          const regExpPattern = new RegExp(/(Info|Medium|High|Critical): \d*/g);
          const otherVulnsPatterns = new RegExp(/(auth|login|Siemens|simatic|WinCC|PLC|SIWACON|SIwatool|ПЛК|S7-1200|S7-1500|S7-300|S7-400|Profiner|profibus)/gi);
          const otherVulnsMatch = reportContent.match(otherVulnsPatterns) || [];
          const vulnerabilities = {
            Medium: 0,
            Critical: 0,
            High: 0,
            Info: 0,
            Other: 0,
          };

          reportContent.match(regExpPattern).forEach((vuln) => {
            const [type, amount] = vuln.split(": ");
            vulnerabilities[type] += +amount || 0;
          });

          vulnerabilities["Other"] = otherVulnsMatch.length;

          const hasVulns = Object.values(vulnerabilities).reduce((acc, curr) => acc + curr, 0) !== 0;
          const from = `${rootFolder}/${reportFolderName}`;
          const to = `${hasVulns ? withVulnReportsFolder : emptyReportsFolder}/${reportFolderName}`;

          if (!hasVulns) {
            emptyReports.push(reportFolderName);
          }

          moveFolder(from, to);
        }
      });
    }
  };

  setTimeout(() => { runReportsCheck(); }, 100);
} catch (error) {
  console.log(error);
}

console.log(colors.red("--- Empty reports list ---"));
emptyReports.forEach((report) => {
  console.log(report);
});
