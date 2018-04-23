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

  for(let uuid of uuidsList) {
    uuid = uuid.toLocaleLowerCase();
    let state = await addProductUuid(uuid, productType, token);
    console.log(`${uuid} - ${state}`);
    return;
  }
};

async function getClientCredentials(filePath) {
  if(!await fs.existsSync(filePath)) throw new Exception('Client credentials not found');

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
  if(!await fs.existsSync(clientConfigurationPath)) throw new Exception(`File ${filePath} not found`);

  const uuidsListBuffer = await fs.readFile(filePath);
  const uuidsListText = uuidsListBuffer.toString('utf8');
  const uuidsList = uuidsListText.split(/\r?\n/);

  return uuidsList;
}

async function addProductUuid(uuid, type, accessToken) {
  const category = type.split('.')[1];

  if(['module', 'gateway'].indexOf(category) == -1) throw new Exception(`Unknown product category: ${category}`);

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
  
    console.log(response);
  
    return 'success';
  } catch(e) {
    if(e.statusCode == 400) {
      return e.error.message;
    }
    return e.message;
  }
  
}