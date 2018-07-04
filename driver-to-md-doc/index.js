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

  let documentation = makeBaseInfo(driver);
  documentation += makeCommandsInfo(driver);
  
  console.log(documentation);
}

function makeBaseInfo(driver) {
  return `---
title: ${driver.type} Driver

language_tabs:
  - javascript

search: true
---

# General info: ${driver.type}

Type: ${driver.type}

Version: ${driver.version}
`;
}

function makeCommandsInfo(driver) {
  let commandsDoc = "# Commands \n";
  for(let command of driver.commands) {
    commandsDoc += `
## ${command.title || command.name}

\`\`\`javascript
Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, '${command.name}', [...]);
\`\`\`

Command Name | Message Type
-------------- | --------------
${command.name} | ${command.command}

${command.description}
`;
  }
  return commandsDoc;
}

async function getDriver(driverFilePath) {
  if(!fs.existsSync(driverFilePath)) throw `File ${driverFilePath} not found`;

  const driverJson = await fs.readFile(driverFilePath);
  const driver = JSON.parse(driverJson);

  return driver;
}