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

# Driver: ${driver.type}

**Type**: ${driver.type}

**Version**: ${driver.version}
`;
}

function makeCommandsInfo(driver) {
  let commandsDoc = "# Commands \n";
  for(let command of driver.commands) {
    const hasArguments = typeof(command.arguments) != 'undefined';
    commandsDoc += `
## ${command.title || command.name}

\`\`\`javascript
Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, '${command.name}', [${hasArguments ? '...': ''}]);
\`\`\`

Command Name | Message Type
-------------- | --------------
${command.name} | ${command.command}

${command.description}
`;
    commandsDoc += makeCommandsArgumentsInfo(command);
  }
  return commandsDoc;
}

function makeCommandsArgumentsInfo(command) {
  if(typeof(command.arguments) == 'undefined') return '';
  let argumentsDoc = "### Arguments \n";
  for(let argument of command.arguments) {
    argumentsDoc += `
Name | Description | Validation
-------------- | -------------- | --------------
${argument.name} | ${argument.description || '-'} | ${argument.validation || 'none'}  
`;
  }
  return argumentsDoc;
}

async function getDriver(driverFilePath) {
  if(!fs.existsSync(driverFilePath)) throw `File ${driverFilePath} not found`;

  const driverJson = await fs.readFile(driverFilePath);
  const driver = JSON.parse(driverJson);

  return driver;
}