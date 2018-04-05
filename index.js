var auth0 = new auth0.WebAuth({
  domain: 'moduware.au.auth0.com',
  clientID: 'nJUhKG5X8kjdDINfY91fKshcVNBGOsJo'
});
let accessToken = null;

document.addEventListener('DOMContentLoaded', async function() {
  document.getElementById('clientAuthoriseButton').addEventListener('click', clientAuthoriseButtonClickHandler);
  document.getElementById('uuidListSubmit').addEventListener('click', uuidListSubmitClickHandler);
  
  const isAuthorised = await checkAuthorisation();
  if(!isAuthorised) {
    $('#authModal').modal({backdrop: 'static'});
  } else {
    document.getElementById('logoutButton').classList.remove('d-none');
    const user = await getUser();
    const userNameField = document.getElementById('userName');
    userNameField.textContent = user.name;
    userNameField.classList.remove('d-none');
    
    await loadProductTypes();
  }
});

function clientAuthoriseButtonClickHandler(event) {
  const redirectUri = document.location.href.replace(document.location.hash, '');
  auth0.authorize({
    audience: 'https://api.moduware.com',
    scope: 'openid profile email admin',
    responseType: 'token',
    grant_type: 'client_credentials',
    redirectUri: redirectUri
  });
}

function uuidListSubmitClickHandler(event) {
  document.getElementById('badUuidAlert').classList.add('d-none');
  document.getElementById('uuidsSubmittedAlert').classList.add('d-none');

  const category = document.getElementById('productCategorySelect').value;
  const type = document.getElementById('productTypeSelect').value;
  const uuidsText = document.getElementById('productUuidsList').value;
  if(uuidsText == '') {
    alert('UUIDs list cannot be empty');
    return;
  }
  const uuids = uuidsText.split("\n");
  const cleanUuids = [];

  let badUuidFound = false;
  for(let i = 0; i<uuids.length; i++) {
    let uuid = uuids[i];
    if(uuid == '') continue;
    if(uuid.length != 32) {
      badUuidFound = true;
      showBadUuidError(i);
      break;
    }
    cleanUuids.push(uuid);
  }

  if(badUuidFound) return;
  console.log(category, type, cleanUuids);
  document.getElementById('productAddForm').classList.add('d-none');
  document.getElementById('productAddProgress').classList.remove('d-none');
  submitUuids(category, type, cleanUuids);
}

async function submitUuids(category, type, uuids) {
  let percent = 0;
  let i = 0;
  for(let uuid of uuids) {
    let newPercent = parseInt(i / uuids.length * 100);
    if(newPercent != percent) {
      percent = newPercent;
      showProgressPercent(percent);
    }
    // let result = await postData(`http://api.moduware.com/v1/product/${uuid}`, {
    let result = await postData(`http://localhost:3000/v1/product/${uuid}`, {
      type: type,
      category: category
    });
    console.log(result);
    return;
    //await sleep(1000);
    i++;
  }

  document.getElementById('productAddForm').classList.remove('d-none');
  document.getElementById('productAddProgress').classList.add('d-none');
  document.getElementById('uuidsSubmittedAlert').classList.remove('d-none');
}

function showProgressPercent(percent) {
  const progressbar = document.getElementById('productAddProgressBar');
  progressbar.textContent = percent + '%';
  progressbar.style.width = percent + '%';
}

function sleep(milliseconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), milliseconds);
  });
}

function showBadUuidError(line) {
  document.getElementById('badUuidAlert').classList.remove('d-none');
  document.getElementById('badUuidLineNumber').textContent = line;
}

function checkAuthorisation() {
  return new Promise((resolve, reject) => {
    auth0.parseHash({}, function(err, authResult) {
      if (err) {
        resolve(false);
        console.log(err);
      } else if(authResult == null) {
        resolve(false);
      } else {
        resolve(true);
        accessToken = authResult.accessToken;
        console.log('Token: ', authResult.accessToken);
      }
    });
  });
}

function getUser() {
  return new Promise((resolve, reject) => {
    auth0.client.userInfo(accessToken, function(err, user) {
      if(err) {
        console.log(err);
        alert('Cannot retrieve use information');
        reject(err);
      } else {
        console.log('User: ', user);
        resolve(user);
      }
    });
  });
}


function getProductTypesList() {
  try {
    return fetch(`http://api.moduware.com/v1/product-type/list`).then(response => response.json());
  } catch(err) {
    console.log(err);
    alert('Cannot retrieve product types list');
  }
}

async function loadProductTypes() {
  const list = await getProductTypesList();
  let html = '';
  list.map(type => {
    html += `<option value="${type}">${type}</option>`;
  });
  document.getElementById('productTypeSelect').innerHTML = html;
}

function postData(url, data) {
  // Default options are marked with *
  return fetch(url, {
    body: JSON.stringify(data), // must match 'Content-Type' header
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'user-agent': 'Mozilla/4.0 MDN Example',
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    redirect: 'follow', // *manual, follow, error
    referrer: 'no-referrer', // *client, no-referrer
  })
  .then(response => response.json()) // parses response to JSON
}