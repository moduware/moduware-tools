const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const assert = chai.assert;

const testedScript = require('../index');
const getDriver = testedScript.getDriver;
const makeBaseInfo = testedScript.makeBaseInfo;
const makeCommandsInfo = testedScript.makeCommandsInfo;

describe('main()', () => {
  xit('Calls getDriver() method');
  xit('Calls makeBaseInfo() method');
  xit('Calls makeCommandsInfo() method');
  xit('Calls makeDataInfo() method');
  xit('Saves result to output file');
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
    it('Command without arguments will return empty string');
    it('Outputs correct example arguments string');
  });
  
  describe('makeCommandsArgumentsInfo()', () => {
    it('Command without arguments will return empty string');
    it('Outputs name and description for every command');
    it('Calls formatArgumentValidation() for every argument that has validation');
    it('Outputs none if there are no validation and - if there are no description');
  });
  
  describe('formatArgumentValidation()', () => {
    it('Convert argument validation to human readable format');
  });
});

describe('Driver Data', () => {
  describe('makeDataInfo()', () => {
    it('Driver without data return empty string');
    it('Output title and name for every data field');
    it('Contains if statement in JS example');
    it('Contains table with info field info');
    it('Contains info field description');
    it('Calls makeDataVariablesInfo() for every data field');
  });

  describe('makeDataVariablesInfo()', () => {
    it('Data field without variables will return empty string');
    it('Calls makeDataVariablesExample()');
    it('Outputs name, title and description for every command');
    it('Outputs - instead of title and description if they are not specified');
    it('Outputs * if variable has no states');
    it('Outputs all possible states if they are specified for a variable')
  });

  describe('makeDataVariablesExample()', () => {
    it('Data field without variables will return empty string');
    it('Output console.log for all variables without states');
    it('Output switch for all variables with states');
    it('Outputs state cases for every variable with states');
  });

});
