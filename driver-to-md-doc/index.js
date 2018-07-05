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
  documentation += makeDataInfo(driver);

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

function makeDataInfo(driver) {
  let dataDoc = "# Data \n";
  for(let data of driver.data) {
    dataDoc += `
## ${data.title || data.name}

Data Name | Message Type
-------------- | --------------
${data.name} | ${data.source}

${data.description}
`;
    dataDoc += makeDataVariablesInfo(data);
  }

  return dataDoc;
}

function makeDataVariablesInfo(data) {
  if(typeof(data.variables) == 'undefined') return '';
  let dataVariablesDoc = "### Variables \n";

  dataVariablesDoc += `
Name | Title | Description | States
-------------- | -------------- | -------------- | --------------
`;  
  for(let variable of data.variables) {
    dataVariablesDoc += `${variable.name} | ${variable.title || '-'} | ${variable.description || '-'}`;
    if(typeof(variable.state) == 'undefined') {
      dataVariablesDoc += ' | *';
    } else {
      dataVariablesDoc += ' | ' + Object.values(variable.state).join(' / ');
    }
    dataVariablesDoc += "\n";
  }
  return dataVariablesDoc;
}

function makeCommandsInfo(driver) {
  let commandsDoc = "# Commands \n";
  for(let command of driver.commands) {
    const hasArguments = typeof(command.arguments) != 'undefined';
    commandsDoc += `
## ${command.title || command.name}

\`\`\`javascript
Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, '${command.name}', [${hasArguments ? renderArgumentsForExample(command) : ''}]);
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

function renderArgumentsForExample(command) {
  if(typeof(command.arguments) == 'undefined') return '';
  let commandArgumentsString = '';
  for(let i = 0; i < command.arguments.length; i++) {
    commandArgumentsString += `<${command.arguments[i].name}>`;
    if(i != command.arguments.length - 1) {
      commandArgumentsString += ', ';
    }
  }
  return commandArgumentsString;
}

function makeCommandsArgumentsInfo(command) {
  if(typeof(command.arguments) == 'undefined') return '';
  let argumentsDoc = "### Arguments \n";
  for(let argument of command.arguments) {
    argumentsDoc += `
Name | Description | Validation
-------------- | -------------- | --------------
${argument.name} | ${argument.description || '-'} | ${argument.validation ? formatArgumentValidation(argument.validation) : 'none'}  
`;
  }
  return argumentsDoc;
}

function formatArgumentValidation(validationString) {
  return validationString.replace(/\{0\}/g, '**value**');
}

async function getDriver(driverFilePath) {
  if(!fs.existsSync(driverFilePath)) throw `File ${driverFilePath} not found`;

  const driverJson = await fs.readFile(driverFilePath);
  const driver = JSON.parse(driverJson);

  return driver;
}