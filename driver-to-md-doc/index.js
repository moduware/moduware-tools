const VERSION = '1.0.0';

const program = require('commander');
const fs = require('fs-extra');

const driversListLink = "https://moduware.github.io/developer-documentation/module-drivers/";

class DriverToMdConverter {
  /**
   * Generates documentation out of driver file
   * @param {String} driverFilePath path to driver
   * @param {String} outputFilePath path to documentation output
   */
  async convert(driverFilePath, outputFilePath) {
    // loading driver
    const driver = await this._getDriver(driverFilePath);
  
    // making documentation
    let documentation = this._makeBaseInfo(driver);
    documentation += this._makeCommandsInfo(driver);
    documentation += this._makeDataInfo(driver);
  
    // writing result to output
    await fs.writeFile(outputFilePath, documentation);
  }
  
  /**
   * Loads driver from specified file
   * @param {String} driverFilePath path to driver file
   */
  async _getDriver(driverFilePath) {
    if(!fs.existsSync(driverFilePath)) throw `File ${driverFilePath} not found`;
  
    const driverJson = await fs.readFile(driverFilePath);
    let driver = null;
    try {
      driver = JSON.parse(driverJson);
    } catch(e) {
      throw 'Bad file format: can\'t parse';
    }
    if(typeof driver.type == 'undefined' || typeof driver.version == 'undefined') throw 'Bad file format: no type or version';
  
    return driver;
  }
  
  /**
   * Configures doc and outputs basic info about driver like version
   * @param {ModuwareDriver} driver driver object
   */
  _makeBaseInfo(driver) {
    return `---
title: ${driver.type} Driver

language_tabs:
  - javascript

toc_footers:
  - <a href='${driversListLink}'>Drivers list</a>

search: true
---

# Driver: ${driver.type}

**Type**: ${driver.type}

**Version**: ${driver.version}
`;
  }
  
  //#region DriverData
  
  /**
   * Makes documentation of driver data fields
   * @param {ModuwareDriver} driver driver object
   */
  _makeDataInfo(driver) {
    if(typeof driver.data == 'undefined') return '';
  
    let dataDoc = "# Data \n";
    dataDoc += `
<aside class="warning">If you want to work with received data you need to listen for <code>DataReceived</code> event after Api is ready</aside>
> When Moduware API is ready start listening for received data

\`\`\`javascript
document.addEventListener('WebViewApiReady', function() {
  Moduware.v0.API.Module.addEventListener('DataReceived', function(event) {
    // we don't care about data not related to our module
    if(event.moduleUuid != Moduware.Arguments.uuid) return;

    // ... handle specific received data here ...

  });
});
\`\`\`
  
`;
    for(let data of driver.data) {
      dataDoc += `
## ${data.title || data.name}

\`\`\`javascript
if(event.dataSource == '${data.name}') {
  // ... work with data variables here ...
}
\`\`\`

Data Name | Message Type
-------------- | --------------
${data.name} | ${data.source}

${data.description}
`;
      dataDoc += this._makeDataVariablesInfo(data);
    }
  
    return dataDoc;
  }
  
  /**
   * Makes documentation from variable of driver data field
   * @param {DriverDataField} data driver data field object
   */
  _makeDataVariablesInfo(data) {
    if(typeof data.variables == 'undefined') return '';
  
    let dataVariablesDoc = "### Variables \n";
    dataVariablesDoc += this._makeDataVariablesExample(data);
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
  
  /**
   * Creates code examples from variables of driver data field
   * @param {DriverDataField} data driver data field object
   */
  _makeDataVariablesExample(data) {
    if(typeof data.variables == 'undefined') return '';
    let dataVariablesExampleDoc = '';
  
    for(let variable of data.variables) {
      if(typeof(variable.state) == 'undefined') {
        dataVariablesExampleDoc += `
\`\`\`javascript      
console.log(event.variables.${variable.name});
\`\`\`
`;
      } else {
        dataVariablesExampleDoc += `
\`\`\`javascript  
switch(event.variables.${variable.name}) {\n`;
for(let state of Object.values(variable.state)) {
  dataVariablesExampleDoc += `  case '${state}':
  // ... handle the state here ...
  break;\n`;
}
dataVariablesExampleDoc += `}
\`\`\`
`;
      }
    }
  
    return dataVariablesExampleDoc;
  }
  //#endregion

  //#region DriverCommands
  
  /**
   * Makes documentation for commands in driver
   * @param {ModuwareDriver} driver driver object
   */
  _makeCommandsInfo(driver) {
    if(typeof driver.commands == 'undefined') return '';
  
    let commandsDoc = "# Commands \n";
    for(let command of driver.commands) {
      if(typeof command.name == 'undefined') throw 'Bad file format: command missing name';
      if(typeof command.command == 'undefined') throw 'Bad file format: command missing message type';
      const hasArguments = typeof(command.arguments) != 'undefined';
      commandsDoc += `
## ${command.title || command.name}

\`\`\`javascript
Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, '${command.name}', [${hasArguments ? this._renderArgumentsForExample(command) : ''}]);
\`\`\`

Command Name | Message Type
-------------- | --------------
${command.name} | ${command.command}

${command.description}
`;
      commandsDoc += this._makeCommandsArgumentsInfo(command);
    }
    return commandsDoc;
  }
  
  /**
   * Creates arguments example string for code example
   * @param {ModuwareDriverCommand} command driver command object
   */
  _renderArgumentsForExample(command) {
    if(typeof command.arguments == 'undefined') return '';
  
    let commandArgumentsString = command.arguments.map(
      (arg) => {
        if(typeof arg.name == 'undefined') throw `Bad file format: argument of command '${command.name}' missing name`;
        return `<${arg.name}>`;
      }
    ).join(', ');
  
    return commandArgumentsString;
  }
  
  /**
   * Creates documentation from command arguments
   * @param {ModuwareDriverCommand} command driver command object
   */
  _makeCommandsArgumentsInfo(command) {
    if(typeof command.arguments == 'undefined') return '';
    
    let argumentsDoc = `### Arguments
Name | Description | Validation
-------------- | -------------- | --------------\n`;
    for(let argument of command.arguments) {
      argumentsDoc += `${argument.name} | ${argument.description || '-'} | ${argument.validation ? this._formatArgumentValidation(argument.validation) : 'none'}\n`;
    }
    return argumentsDoc;
  }
  
  /**
   * Makes validation string more human readable by replacing {0} to "value"
   * @param {String} validationString validation string from driver
   */
  _formatArgumentValidation(validationString) {
    return validationString.replace(/\{0\}/g, '**value**');
  }
  
  //#endregion

}

if(require.main === module) {
  program
  .version(VERSION)
  .option('-o, --output <outputfile>', 'Set output file')
  .usage('[options] <driverfile>')
  .action((driverFile) => {
    const outputFile = program.output || 'driver.md';
    const converter = new DriverToMdConverter();
    converter.convert(driverFile, outputFile);
  })
  .parse(process.argv);
} else {
  module.exports = DriverToMdConverter;
}
