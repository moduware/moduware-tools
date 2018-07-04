const VERSION = '1.0.0';

const program = require('commander');
const fs = require('fs-extra');

program
.version(VERSION)
.option('-o, --output <outputfile>', 'Set output file')
.usage('[options] <driverfile>')
.action((driverFile) => {
  const outputFile = program.output || 'driver.md';
  main(driverFile, outputFile);
})
.parse(process.argv);

async function main(driverFile, outputFile) {
  const driver = await getDriver(driverFile);
  console.log({driver});
}

async function getDriver(driverFilePath) {
  if(!fs.existsSync(driverFilePath)) throw `File ${driverFilePath} not found`;

  const driverJson = await fs.readFile(driverFilePath);
  const driver = JSON.parse(driverJson);

  return driver;
}