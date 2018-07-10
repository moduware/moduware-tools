---
title: nexpaq.module.hat Driver

language_tabs:
  - javascript

toc_footers:
  - <a href='https://moduware.github.io/developer-documentation/module-drivers/'>Drivers list</a>

search: true
---

# Driver: nexpaq.module.hat

**Type**: nexpaq.module.hat

**Version**: 1.1.1
# Commands 

## Start T&H sensor

```javascript
Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, 'StartSensor', []);
```

Command Name | Message Type
-------------- | --------------
StartSensor | 2700

To work with T&H module and read data, sensor must be started first

## Stop T&H sensor

```javascript
Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, 'StopSensor', []);
```

Command Name | Message Type
-------------- | --------------
StopSensor | 2700

Stop reading data from T&H module.

## Change Emmissivity

```javascript
Moduware.v0.API.Module.SendCommand(Moduware.Arguments.uuid, 'ChangeEmissivity', [<Emissivity>]);
```

Command Name | Message Type
-------------- | --------------
ChangeEmissivity | 2702

Change emissivity of sensor
### Arguments
Name | Description | Validation
-------------- | -------------- | --------------
Emissivity | - | none
# Data 

<aside class="warning">If you want to work with received data you need to listen for <code>DataReceived</code> event after Api is ready</aside>
> When Moduware API is ready start listening for received data

```javascript
document.addEventListener('WebViewApiReady', function() {
  Moduware.v0.API.Module.addEventListener('DataReceived', function(event) {
    // we don't care about data not related to our module
    if(event.moduleUuid != Moduware.Arguments.uuid) return;

    // ... handle specific received data here ...

  });
});
```
  

## Sensor State Change Reponse

```javascript
if(event.dataSource == 'SensorStateChangeResponse') {
  // ... work with data variables here ...
}
```

Data Name | Message Type
-------------- | --------------
SensorStateChangeResponse | 2701

Response to sensor state change command
### Variables 

```javascript  
switch(event.variables.result) {
  case 'success':
  // ... handle the state here ...
  break;
  case 'failure':
  // ... handle the state here ...
  break;
}
```

Name | Title | Description | States
-------------- | -------------- | -------------- | --------------
result | Result | Result of turn sensor on or off request | success / failure

## Emissivity Change Request Response

```javascript
if(event.dataSource == 'EmissivityChangeResponse') {
  // ... work with data variables here ...
}
```

Data Name | Message Type
-------------- | --------------
EmissivityChangeResponse | 2703

Response to change emissivity setting of sensor
### Variables 

```javascript  
switch(event.variables.result) {
  case 'success':
  // ... handle the state here ...
  break;
  case 'bad_value':
  // ... handle the state here ...
  break;
  case 'eeprom_fault':
  // ... handle the state here ...
  break;
}
```

Name | Title | Description | States
-------------- | -------------- | -------------- | --------------
result | Result | Result of attempt to set new emissivity value | success / bad_value / eeprom_fault

## Sensor Value

```javascript
if(event.dataSource == 'SensorValue') {
  // ... work with data variables here ...
}
```

Data Name | Message Type
-------------- | --------------
SensorValue | 2800

Value from Temperature and Humidity sensor
### Variables 

```javascript      
console.log(event.variables.humidity);
```

```javascript      
console.log(event.variables.ambient_temperature);
```

```javascript      
console.log(event.variables.object_temperature);
```

Name | Title | Description | States
-------------- | -------------- | -------------- | --------------
humidity | Humidity | Ambient humidity detected by module | *
ambient_temperature | Ambient Temperature | Ambient temperature detected by module | *
object_temperature | Object Temperature | Object temperature detected by module | *
