const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const assert = chai.assert;

const testedScript = require('../index');
const getDriver = testedScript.getDriver;
const makeBaseInfo = testedScript.makeBaseInfo;
const makeCommandsInfo = testedScript.makeCommandsInfo;
const renderArgumentsForExample = testedScript.renderArgumentsForExample;
const makeCommandsArgumentsInfo = testedScript.makeCommandsArgumentsInfo;
const formatArgumentValidation = testedScript.formatArgumentValidation;
const makeDataInfo = testedScript.makeDataInfo;
const makeDataVariablesInfo = testedScript.makeDataVariablesInfo;
const makeDataVariablesExample = testedScript.makeDataVariablesExample;

describe('main()', () => {
  it('Calls getDriver() method');
  it('Calls makeBaseInfo() method');
  it('Calls makeCommandsInfo() method');
  it('Calls makeDataInfo() method');
  it('Saves result to output file');
});

describe('getDriver()', () => {
  it('Incorrect path should trigger not found exception', async () => {
    let exception;
    try {
      await getDriver('./driver.json');
    } catch(e) {
      exception = e;
    }
    expect(exception).to.be.equal('File ./driver.json not found');
  });

  it('Unreadable json should trigger bad format exception', async () => {
    let exception;
    try {
      await getDriver('./test/drivers/bad_json_driver.json');
    } catch(e) {
      exception = e;
    }
    expect(exception).to.be.equal('Bad file format: can\'t parse');
  });

  it('Missing type or version should trigger bad format exception', async () => {
    let exception;
    try {
      await getDriver('./test/drivers/empty_object_driver.json');
    } catch(e) {
      exception = e;
    }
    expect(exception).to.be.equal('Bad file format: no type or version');
  });

  it('Correct path should return driver object', async () => {
    const driver = await getDriver('./test/drivers/moduware.module.led.driver.json');
    assert.isObject(driver);
  });
});

describe('makeBaseInfo()', () => {
  const driversListLink = "https://moduware.github.io/developer-documentation/module-drivers/";
  let driver;
  let baseInfo;
  before(async () => {
    driver = await getDriver('./test/drivers/moduware.module.led.driver.json');
    baseInfo = makeBaseInfo(driver);
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
      driver = await getDriver('./test/drivers/moduware.module.led.driver.json');
      commandsInfo = makeCommandsInfo(driver);
    });

    it('Driver without commands return empty string', async () => {
      const noCommandsDriver = await getDriver('./test/drivers/no_commands_no_data_driver.json');
      const commandsInfo = makeCommandsInfo(noCommandsDriver);
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
      const missingCommandNameDriver = await getDriver('./test/drivers/missing_command_name_driver.json')
      let exception;
      try {
        makeCommandsInfo(missingCommandNameDriver);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal('Bad file format: command missing name');
    });

    it('Missing message type should trigger bad format exception', async () => {
      const missingMessageTypeDriver = await getDriver('./test/drivers/missing_message_type_driver.json')
      let exception;
      try {
        makeCommandsInfo(missingMessageTypeDriver);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal('Bad file format: command missing message type');
    });

    it('Calls makeCommandsArgumentsInfo() for every command', () => {
      const fakeMakeCommandsArgumentsInfo = sinon.fake();
      makeCommandsInfo(driver, fakeMakeCommandsArgumentsInfo);
      expect(fakeMakeCommandsArgumentsInfo.callCount).to.be.equal(driver.commands.length);
    });
  });
  
  describe('renderArgumentsForExample()', () => {
    let driver;
    before(async () => {
      driver = await getDriver('./test/drivers/moduware.module.led.driver.json');
    });

    it('Command without arguments will return empty string', () => {
      const commandWithoutArguments = driver.commands[1];
      const commandArgumentsExample = renderArgumentsForExample(commandWithoutArguments);
      expect(commandArgumentsExample).to.be.equal('');
    });

    it('Outputs correct example arguments string', () => {
      const commandWithArguments = driver.commands[0];
      const correctArgumentsExample = `<Red>, <Green>, <Blue>`;
      const commandArgumentsExample = renderArgumentsForExample(commandWithArguments);
      expect(commandArgumentsExample).to.be.equal(correctArgumentsExample);
    });

    it('Missing argument name should trigger bad format exception', async () => {
      const driverWithMissingArgumentName = await getDriver('./test/drivers/missing_argument_name_driver.json');
      const command = driverWithMissingArgumentName.commands[0];
      let exception;
      try {
        renderArgumentsForExample(command);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal(`Bad file format: argument of command '${command.name}' missing name`);
    });
  });
  
  describe('makeCommandsArgumentsInfo()', () => {
    let driver;
    before(async () => {
      driver = await getDriver('./test/drivers/moduware.module.led.driver.json');
    });

    it('Command without arguments will return empty string', () => {
      const commandWithoutArguments = driver.commands[1];
      const commandWithoutArgumentsInfo = makeCommandsArgumentsInfo(commandWithoutArguments);
      expect(commandWithoutArgumentsInfo).to.be.equal('');
    });

    it('Outputs name and description for every argument', () => {
      const commandWithArguments = driver.commands[3];
      const argumentsInfo = makeCommandsArgumentsInfo(commandWithArguments);
      for(let argument of commandWithArguments.arguments) {
        expect(argumentsInfo).to.contain(argument.name);
        if(typeof argument.description != 'undefined') {
          expect(argumentsInfo).to.contain(argument.description);
        }
      }
    });

    it('Calls formatArgumentValidation() for every argument that has validation', () => {
      const fakeFormatArgumentValidation = sinon.fake();  
      let argumentsWithValidation = 0;
      for(let command of driver.commands) {
        if(typeof command.arguments != 'undefined') {
          for(let argument of command.arguments) {
            if(typeof argument.validation != 'undefined') argumentsWithValidation++;
          }
        }
        makeCommandsArgumentsInfo(command, fakeFormatArgumentValidation);
      }
      expect(fakeFormatArgumentValidation.callCount).to.be.equal(argumentsWithValidation);
    });

    it('Outputs none if there are no validation and - if there are no description', async () => {
      const driverWithArgumentWithoutDescriptionAndValidation = await getDriver('./test/drivers/nexpaq.module.hat.driver.json');
      const command = driverWithArgumentWithoutDescriptionAndValidation.commands[2];
      const argumentsInfo = makeCommandsArgumentsInfo(command);
      expect(argumentsInfo).to.contain(' none');
      expect(argumentsInfo).to.contain(' - ');
    });
  });
  
  describe('formatArgumentValidation()', () => {
    it('Convert argument validation to human readable format', () => {
      const validationString = '({0} >= 0) and ({0} <= 5)';
      const correctFormattedValidationString = '(**value** >= 0) and (**value** <= 5)';
      const formattedValidationString = formatArgumentValidation(validationString);
      expect(formattedValidationString).to.be.equal(correctFormattedValidationString);
    });
  });
});

describe('Driver Data', () => {
  describe('makeDataInfo()', () => {
    let driver;
    let dataInfo;
    before(async () => {
      driver = await getDriver('./test/drivers/nexpaq.module.hat.driver.json');
      dataInfo = makeDataInfo(driver);
    });

    it('Driver without data return empty string', async () => {
      const driverWithoutData = await getDriver('./test/drivers/no_commands_no_data_driver.json');
      const dataInfo = makeDataInfo(driverWithoutData);
      expect(dataInfo).to.be.equal('');
    });

    it('Output title and name for every data field', () => {
      for(let dataField of driver.data) {
        expect(dataInfo).to.contain(dataField.title);
        expect(dataInfo).to.contain(dataField.name);
      }
    });

    it('Missing data field name should trigger bad format exception', async () => {
      const driverWithMissingDataName = await getDriver('./test/drivers/missing_datafield_name_driver.json');
      let exception;
      try {
        makeDataInfo(driverWithMissingDataName);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal('Bad file format: data field missing name');
    });

    it('Missing data field source should trigger bad format exception', async () => {
      const driverWithMissingDataSource = await getDriver('./test/drivers/missing_datafield_source_driver.json');
      let exception;
      try {
        makeDataInfo(driverWithMissingDataSource);
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
      const fakeMakeDataVariablesInfo = sinon.fake();
      makeDataInfo(driver, fakeMakeDataVariablesInfo);
      expect(fakeMakeDataVariablesInfo.callCount).to.be.equal(driver.data.length);
    });
  });

  describe('makeDataVariablesInfo()', () => {
    let driver;
    before(async () => {
      driver = await getDriver('./test/drivers/nexpaq.module.hat.driver.json');
    });

    it('Data field without variables will return empty string', async () => {
      const driver = await getDriver('./test/drivers/datadield_without_variables_driver.json');
      const dataVariablesInfo = makeDataVariablesInfo(driver.data[0]);
      expect(dataVariablesInfo).to.be.equal('');
    });

    it('Calls makeDataVariablesExample()', () => {
      const fakeMakeDataVariablesExample = sinon.fake();
      makeDataVariablesInfo(driver.data[0], fakeMakeDataVariablesExample);
      expect(fakeMakeDataVariablesExample.callCount).to.be.equal(1);
    });

    it('Outputs name, title and description for every variable', () => {
      const dataField = driver.data[2];
      const dataVariablesInfo = makeDataVariablesInfo(dataField);
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
      const driver = await getDriver('./test/drivers/variable_without_name_driver.json');
      const dataField = driver.data[0];
      let exception;
      try {
        makeDataVariablesInfo(dataField);
      } catch(e) {
        exception = e;
      }
      expect(exception).to.be.equal(`Bad file format: variable of ${dataField.name} missing name`);
    });

    it('Outputs - instead of title and description if they are not specified', async () => {
      const driver = await getDriver('./test/drivers/variable_without_title_and_description_driver.json');
      const dataField = driver.data[0];
      const dataVariablesInfo = makeDataVariablesInfo(dataField);
      expect(dataVariablesInfo).to.contain(' - ');
      expect(dataVariablesInfo).to.contain(' -');
    });

    it('Outputs * if variable has no states', () => {
      const dataField = driver.data[2];
      const dataVariablesInfo = makeDataVariablesInfo(dataField);
      expect(dataVariablesInfo).to.contain('| *');
    });

    it('Outputs all possible states if they are specified for a variable', () => {
      const dataField = driver.data[1];
      const dataVariablesInfo = makeDataVariablesInfo(dataField);
      const states = Object.values(dataField.variables[0].state);
      for(let state of states) {
        expect(dataVariablesInfo).to.contain(state);
      }
    })
  });

  describe('makeDataVariablesExample()', () => {
    let driver;
    before(async () => {
      driver = await getDriver('./test/drivers/nexpaq.module.hat.driver.json');
    });
    
    it('Data field without variables will return empty string', async () => {
      const driver = await getDriver('./test/drivers/datadield_without_variables_driver.json');
      const dataField = driver.data[0];
      const dataVariablesExample = makeDataVariablesExample(dataField);
      expect(dataVariablesExample).to.be.equal('');
    });

    it('Output console.log for all variables without states', () => {
      const dataField = driver.data[2];
      const dataVariablesExample = makeDataVariablesExample(dataField);
      for(let variable of dataField.variables) {
        if(typeof variable.state == 'undefined') {
          expect(dataVariablesExample).to.contain(`console.log(event.variables.${variable.name});`);
        }
      }
    });

    it('Output switch for all variables with states', () => {
      const dataField = driver.data[1];
      const dataVariablesExample = makeDataVariablesExample(dataField);
      expect(dataVariablesExample).to.contain(`switch(event.variables.${dataField.variables[0].name}) {`);
    });

    it('Outputs state cases for every variable with states', () => {
      const dataField = driver.data[1];
      const dataVariablesExample = makeDataVariablesExample(dataField);
      const stateCases = Object.values(dataField.variables[0].state).map(state => `case '${state}':`);
      for(let stateCase of stateCases) {
        expect(dataVariablesExample).to.contain(stateCase);
      }
    });

  });

});
