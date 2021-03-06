const VERSION = '1.0.0';

const fs = require('fs-extra');
const request = require('request-promise');
const program = require('commander');

const clientConfigurationPath = './repository-user.json';

program
.version(VERSION)
.usage('[options] <type> <file>')
.action((productType, uuidsListPath) => {
  main(productType, uuidsListPath);
})
.parse(process.argv);

async function main(productType, uuidsListPath) {
  const client = await getClientCredentials(clientConfigurationPath);
  const token = await getClientToken(client.id, client.secret);
  const uuidsList = await getUuidsList(uuidsListPath);

  let percent = 0;

  // making statistics out of process
  const stats = {};

  for(let index = 0; index < uuidsList.length; index++) {
    percent = 100 * index / uuidsList.length;
    let formatedPercent = ('0' + percent.toFixed(1)).slice(-4);
    
    let uuid = uuidsList[index];
    
    let result = '';
    try {
      let state = await addProductUuid(uuid, productType, token);
      console.log(`${formatedPercent}% ${uuid} - ${state}`);
      result = state;
    } catch(e) {
      console.log(`${formatedPercent}% ${uuid} - ${e.message}`);
      result = e.message;
    }

    // Adding to stats
    if(typeof(stats[result]) == 'undefined') {
      stats[result] = 1;
    } else {
      stats[result]++;
    }
  }

  // Output resulting stats
  outputStats(stats);
};

/**
 * Outputs statitiscs bases on statistics object
 * @param {Object} stats statistics object, where each key represent category and stores integer with number of entries
 */
function outputStats(stats) {
  console.log("\n\nStatistics:\n")
  const keys = Object.keys(stats);
  keys.forEach(k => console.log(`${k}: ${stats[k]} \n`));
}

async function getClientCredentials(filePath) {
  if(!await fs.existsSync(filePath)) throw 'Client credentials not found';

  const clientConfigJson = await fs.readFile(filePath);
  const client = JSON.parse(clientConfigJson);

  return client;
}

async function getClientToken(clientId, clientSecret) {
  const options = { 
    method: 'POST',
    url: 'https://moduware.au.auth0.com/oauth/token',
    headers: { 'content-type': 'application/json' },
    body: { 
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: 'https://api.moduware.com' 
    },
    json: true 
  };

  const response = await request(options);

  return response.access_token;
}

async function getUuidsList(filePath) {
  if(!await fs.existsSync(clientConfigurationPath)) `File ${filePath} not found`;

  const uuidsListBuffer = await fs.readFile(filePath);
  const uuidsListText = uuidsListBuffer.toString('utf8');
  const uuidsList = uuidsListText.split(/\r?\n/);
  // making sure that all uuids are lower case
  const lowerCaseUuidsList = uuidsList.map(u => u.toLocaleLowerCase());

  return lowerCaseUuidsList;
}

async function addProductUuid(uuid, type, accessToken) {
  const category = type.split('.')[1];

  if(['module', 'gateway'].indexOf(category) == -1) `Unknown product category: ${category}`;

  try {
    const response = await request({
      method: 'POST',
      url: `https://api.moduware.com/v1/product/${uuid}`,
      headers: { 
        'content-type': 'application/json',
        'user-agent': 'Mozilla/4.0 MDN Example',
        'Authorization': 'Bearer ' + accessToken
      },
      body: { 
        type: type,
        category: category 
      },
      json: true 
    });
  
    return 'success';
  } catch(e) {
    if(e.statusCode == 400) {
      return e.error.message;
    }
    return e.message;
  }
  
}