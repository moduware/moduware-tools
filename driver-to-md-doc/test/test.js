const chai = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const expect = chai.expect;
const assert = chai.assert;

const DriverToMdConverter = require('../index');
const converter = new DriverToMdConverter();

describe('convert()', () => {
  const outputPath = './test/drivers/output.md';

  before(async () => {
    sinon.spy(converter, '_getDriver');
    sinon.spy(converter, '_makeBaseInfo');
    sinon.spy(converter, '_makeCommandsInfo');
    sinon.spy(converter, '_makeDataInfo');
    await converter.convert('./test/drivers/nexpaq.module.hat.driver.json', outputPath);
  })

  it('Calls getDriver() method', () => {
    expect(converter._getDriver.callCount).to.be.equal(1);
  });

  it('Calls makeBaseInfo() method', () => {
    expect(converter._makeBaseInfo.callCount).to.be.equal(1);
  });

  it('Calls makeCommandsInfo() method', () => {
    expect(converter._makeCommandsInfo.callCount).to.be.equal(1);
  });

  it('Calls makeDataInfo() method', () => {
    expect(converter._makeDataInfo.callCount).to.be.equal(1);
  });

  it('Saves result to output file', async () => {
    fs.unlinkSync(outputPath);
    await converter.convert('./test/drivers/nexpaq.module.hat.driver.json', outputPath);
    let exception = null;
    try {
      fs.accessSync(outputPath);
    } catch(e) {
      exception = e;
    }
    expect(exception).to.be.equal(null);
  });

  after(() => {
    converter._getDriver.restore();
    converter._makeBaseInfo.restore();
    converter._makeCommandsInfo.restore();
    converter._makeDataInfo.restore();
  });
});

describe('getDriver()', () => {
  it('Incorrect path should trigger not found exception', async () => {
    let exception;
    try {
      await converter._getDriver('./driver.json');
    } catch(e) {
      exception = e;
    }
    expect(exception).to.be.equal('File ./driver.json not found');
  });

  it('Unreadable json should trigger bad format exception', async () => {
    let exception;
    try {
      await converter._getDriver('./test/drivers/bad_json_driver.json');
    } catch(e) {
      exception = e;
    }
    expect(exception).to.be.equal('Bad file format: can\'t parse');
  });

  it('Missing type or version should trigger bad format exception', async () => {
    let exception;
    try {
      await converter._getDriver('./test/drivers/empty_object_driver.json');
    } catch(e) {
      exception = e;
    }
    expect(exception).to.be.equal('Bad file format: no type or version');
  });

  it('Correct path should return driver object', async () => {
    const driver = await converter._getDriver('./test/drivers/moduware.module.led.driver.json');
    assert.isObject(driver);
  });
});

describe('makeBaseInfo()', () => {
  const driversListLink = "https://moduware.github.io/developer-documentation/module-drivers/";
  let driver;
  let baseInfo;
  before(async () => {
    driver = await converter._getDriver('./test/drivers/moduware.module.led.driver.json');
    baseInfo = converter._makeBaseInfo(driver);
  });

  it('Info contains type and version of driver', () => {
    expect(baseInfo).to.contain(driver.type);
    expect(baseInfo).to.contain(driver.version);
  });

  it('Contains link to drivers list', () => {
    expect(baseInfo).to.contain(driversListLink);
  });
});

describe('Driver Commands', () => {
  describe('makeCommandsInfo()', () => {
    let driver;
    let commandsInfo;
    before(async () => {
      driver = await converter._getDriver('./test/drivers/moduware.module.led.driver.json');
      commandsInfo = converter._makeCommandsInfo(driver);
    });

    it('Driver without commands return empty string', async () => {
      const noCommandsDriver = await converter._getDriver('./test/drivers/no_commands_no_data_driver.json');
      const commandsInfo = converter._makeCommandsInfo(noCommandsDriver);
      expect(commandsInfo).to.be.equal('');
    });

    it('Outputs title or name for every command', () => {
      for(let command of driver.commands) {
        expect(commandsInfo).to.contain(command.title || command.name);
      }
    });

    it('Outputs correct example for command without arguments', () => {
      const correctCommandWithoutArgumentsExample = "Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, 'TurnOffLeds', []);";
      expect(commandsInfo).to.contain(correctCommandWithoutArgumentsExample);
    });

    it('Outputs correct example for command with arguments', () => {
      const correctCommandWithArgumentsExample = "Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, 'SetRGB', [<Red>, <Green>, <Blue>]);";
      expect(commandsInfo).to.contain(correctCommandWithArgumentsExample);
    });

    it('Outputs table with command info', () => {
      const commandInfoTable = `Name | Description | Validation
-------------- | -------------- | --------------
Red | - | (**value** >= 0) and (**value** <= 255)
Green | - | (**value** >= 0) and (**value** <= 255)
Blue | - | (**value** >= 0) and (**value** <= 255)`;
      expect(commandsInfo).to.contain(commandInfoTable);
    });

    it('Outputs command description', () => {
      for(let command of driver.commands) {
        if(typeof command.description != 'undefined') {
          expect(commandsInfo).to.contain(command.command);
        }
      }
    });

    it('Missing command name should trigger bad format exception', async () => {
      const missingCommandNameDriver = await converter._getDriver('./test/drivers/missing_command_name_driver.json')
      let exception;
      try {
        converter._makeCommandsInfo(missingCommandNameDriver);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal('Bad file format: command missing name');
    });

    it('Missing message type should trigger bad format exception', async () => {
      const missingMessageTypeDriver = await converter._getDriver('./test/drivers/missing_message_type_driver.json')
      let exception;
      try {
        converter._makeCommandsInfo(missingMessageTypeDriver);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal('Bad file format: command missing message type');
    });

    it('Calls makeCommandsArgumentsInfo() for every command', () => {
      sinon.spy(converter, '_makeCommandsArgumentsInfo');
      converter._makeCommandsInfo(driver);
      expect(converter._makeCommandsArgumentsInfo.callCount).to.be.equal(driver.commands.length);
      converter._makeCommandsArgumentsInfo.restore();
    });
  });
  
  describe('renderArgumentsForExample()', () => {
    let driver;
    before(async () => {
      driver = await converter._getDriver('./test/drivers/moduware.module.led.driver.json');
    });

    it('Command without arguments will return empty string', () => {
      const commandWithoutArguments = driver.commands[1];
      const commandArgumentsExample = converter._renderArgumentsForExample(commandWithoutArguments);
      expect(commandArgumentsExample).to.be.equal('');
    });

    it('Outputs correct example arguments string', () => {
      const commandWithArguments = driver.commands[0];
      const correctArgumentsExample = `<Red>, <Green>, <Blue>`;
      const commandArgumentsExample = converter._renderArgumentsForExample(commandWithArguments);
      expect(commandArgumentsExample).to.be.equal(correctArgumentsExample);
    });

    it('Missing argument name should trigger bad format exception', async () => {
      const driverWithMissingArgumentName = await converter._getDriver('./test/drivers/missing_argument_name_driver.json');
      const command = driverWithMissingArgumentName.commands[0];
      let exception;
      try {
        converter._renderArgumentsForExample(command);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal(`Bad file format: argument of command '${command.name}' missing name`);
    });
  });
  
  describe('makeCommandsArgumentsInfo()', () => {
    let driver;
    before(async () => {
      driver = await converter._getDriver('./test/drivers/moduware.module.led.driver.json');
    });

    it('Command without arguments will return empty string', () => {
      const commandWithoutArguments = driver.commands[1];
      const commandWithoutArgumentsInfo = converter._makeCommandsArgumentsInfo(commandWithoutArguments);
      expect(commandWithoutArgumentsInfo).to.be.equal('');
    });

    it('Outputs name and description for every argument', () => {
      const commandWithArguments = driver.commands[3];
      const argumentsInfo = converter._makeCommandsArgumentsInfo(commandWithArguments);
      for(let argument of commandWithArguments.arguments) {
        expect(argumentsInfo).to.contain(argument.name);
        if(typeof argument.description != 'undefined') {
          expect(argumentsInfo).to.contain(argument.description);
        }
      }
    });

    it('Calls formatArgumentValidation() for every argument that has validation', () => {  
      sinon.spy(converter, '_formatArgumentValidation');
      let argumentsWithValidation = 0;
      for(let command of driver.commands) {
        if(typeof command.arguments != 'undefined') {
          for(let argument of command.arguments) {
            if(typeof argument.validation != 'undefined') argumentsWithValidation++;
          }
        }
        converter._makeCommandsArgumentsInfo(command);
      }
      expect(converter._formatArgumentValidation.callCount).to.be.equal(argumentsWithValidation);
      converter._formatArgumentValidation.restore();
    });

    it('Outputs none if there are no validation and - if there are no description', async () => {
      const driverWithArgumentWithoutDescriptionAndValidation = await converter._getDriver('./test/drivers/nexpaq.module.hat.driver.json');
      const command = driverWithArgumentWithoutDescriptionAndValidation.commands[2];
      const argumentsInfo = converter._makeCommandsArgumentsInfo(command);
      expect(argumentsInfo).to.contain(' none');
      expect(argumentsInfo).to.contain(' - ');
    });
  });
  
  describe('formatArgumentValidation()', () => {
    it('Convert argument validation to human readable format', () => {
      const validationString = '({0} >= 0) and ({0} <= 5)';
      const correctFormattedValidationString = '(**value** >= 0) and (**value** <= 5)';
      const formattedValidationString = converter._formatArgumentValidation(validationString);
      expect(formattedValidationString).to.be.equal(correctFormattedValidationString);
    });
  });
});

describe('Driver Data', () => {
  describe('makeDataInfo()', () => {
    let driver;
    let dataInfo;
    before(async () => {
      driver = await converter._getDriver('./test/drivers/nexpaq.module.hat.driver.json');
      dataInfo = converter._makeDataInfo(driver);
    });

    it('Driver without data return empty string', async () => {
      const driverWithoutData = await converter._getDriver('./test/drivers/no_commands_no_data_driver.json');
      const dataInfo = converter._makeDataInfo(driverWithoutData);
      expect(dataInfo).to.be.equal('');
    });

    it('Output title and name for every data field', () => {
      for(let dataField of driver.data) {
        expect(dataInfo).to.contain(dataField.title);
        expect(dataInfo).to.contain(dataField.name);
      }
    });

    it('Missing data field name should trigger bad format exception', async () => {
      const driverWithMissingDataName = await converter._getDriver('./test/drivers/missing_datafield_name_driver.json');
      let exception;
      try {
        converter._makeDataInfo(driverWithMissingDataName);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal('Bad file format: data field missing name');
    });

    it('Missing data field source should trigger bad format exception', async () => {
      const driverWithMissingDataSource = await converter._getDriver('./test/drivers/missing_datafield_source_driver.json');
      let exception;
      try {
        converter._makeDataInfo(driverWithMissingDataSource);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal('Bad file format: data field missing source');
    });

    it('Contains if statement in JS example', () => {
      const jsIfStatementExampleCode = `console.log(event.variables.ambient_temperature);`;
      expect(dataInfo).to.contain(jsIfStatementExampleCode);
    });

    it('Contains table with info field info', () => {
      const dataInfoTable = `Data Name | Message Type
-------------- | --------------
SensorStateChangeResponse | 2701`;
      expect(dataInfo).to.contain(dataInfoTable);
    });

    it('Contains info field description', () => {
      for(let dataField of driver.data) {
        if(typeof dataField.description == 'undefined') {
          expect(dataInfo).to.contain(dataField.description);
        }
      }
    });

    it('Calls makeDataVariablesInfo() for every data field', () => {
      sinon.spy(converter, '_makeDataVariablesInfo');
      converter._makeDataInfo(driver);
      expect(converter._makeDataVariablesInfo.callCount).to.be.equal(driver.data.length);
      converter._makeDataVariablesInfo.restore();
    });
  });

  describe('makeDataVariablesInfo()', () => {
    let driver;
    before(async () => {
      driver = await converter._getDriver('./test/drivers/nexpaq.module.hat.driver.json');
    });

    it('Data field without variables will return empty string', async () => {
      const driver = await converter._getDriver('./test/drivers/datadield_without_variables_driver.json');
      const dataVariablesInfo = converter._makeDataVariablesInfo(driver.data[0]);
      expect(dataVariablesInfo).to.be.equal('');
    });

    it('Calls makeDataVariablesExample()', () => {
      sinon.spy(converter, '_makeDataVariablesExample');
      converter._makeDataVariablesInfo(driver.data[0]);
      expect(converter._makeDataVariablesExample.callCount).to.be.equal(1);
    });

    it('Outputs name, title and description for every variable', () => {
      const dataField = driver.data[2];
      const dataVariablesInfo = converter._makeDataVariablesInfo(dataField);
      for(let variable of dataField.variables) {
        expect(dataVariablesInfo).to.contain(variable.name);
        if(typeof variable.title != 'undefined') {
          expect(dataVariablesInfo).to.contain(variable.title);
        }
        if(typeof variable.description != 'undefined') {
          expect(dataVariablesInfo).to.contain(variable.description);
        }
      }
    });

    it('Missing variable name should trigger bad format exception', async () => {
      const driver = await converter._getDriver('./test/drivers/variable_without_name_driver.json');
      const dataField = driver.data[0];
      let exception;
      try {
        converter._makeDataVariablesInfo(dataField);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal(`Bad file format: variable of ${dataField.name} missing name`);
    });

    it('Outputs - instead of title and description if they are not specified', async () => {
      const driver = await converter._getDriver('./test/drivers/variable_without_title_and_description_driver.json');
      const dataField = driver.data[0];
      const dataVariablesInfo = converter._makeDataVariablesInfo(dataField);
      expect(dataVariablesInfo).to.contain(' - ');
      expect(dataVariablesInfo).to.contain(' -');
    });

    it('Outputs * if variable has no states', () => {
      const dataField = driver.data[2];
      const dataVariablesInfo = converter._makeDataVariablesInfo(dataField);
      expect(dataVariablesInfo).to.contain('| *');
    });

    it('Outputs all possible states if they are specified for a variable', () => {
      const dataField = driver.data[1];
      const dataVariablesInfo = converter._makeDataVariablesInfo(dataField);
      const states = Object.values(dataField.variables[0].state);
      for(let state of states) {
        expect(dataVariablesInfo).to.contain(state);
      }
    })
  });

  describe('makeDataVariablesExample()', () => {
    let driver;
    before(async () => {
      driver = await converter._getDriver('./test/drivers/nexpaq.module.hat.driver.json');
    });
    
    it('Data field without variables will return empty string', async () => {
      const driver = await converter._getDriver('./test/drivers/datadield_without_variables_driver.json');
      const dataField = driver.data[0];
      const dataVariablesExample = converter._makeDataVariablesExample(dataField);
      expect(dataVariablesExample).to.be.equal('');
    });

    it('Output console.log for all variables without states', () => {
      const dataField = driver.data[2];
      const dataVariablesExample = converter._makeDataVariablesExample(dataField);
      for(let variable of dataField.variables) {
        if(typeof variable.state == 'undefined') {
          expect(dataVariablesExample).to.contain(`console.log(event.variables.${variable.name});`);
        }
      }
    });

    it('Output switch for all variables with states', () => {
      const dataField = driver.data[1];
      const dataVariablesExample = converter._makeDataVariablesExample(dataField);
      expect(dataVariablesExample).to.contain(`switch(event.variables.${dataField.variables[0].name}) {`);
    });

    it('Outputs state cases for every variable with states', () => {
      const dataField = driver.data[1];
      const dataVariablesExample = converter._makeDataVariablesExample(dataField);
      const stateCases = Object.values(dataField.variables[0].state).map(state => `case '${state}':`);
      for(let stateCase of stateCases) {
        expect(dataVariablesExample).to.contain(stateCase);
      }
    });

  });

});
