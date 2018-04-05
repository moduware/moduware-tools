var auth0 = new auth0.WebAuth({
  domain: 'moduware.au.auth0.com',
  clientID: 'nJUhKG5X8kjdDINfY91fKshcVNBGOsJo'
});
let accessToken = null;

document.addEventListener('DOMContentLoaded', async function() {
  document.getElementById('clientAuthoriseButton').addEventListener('click', clientAuthoriseButtonClickHandler);
  
  const isAuthorised = await checkAuthorisation();
  if(!isAuthorised) {
    $('#authModal').modal({backdrop: 'static'});
  }
});

function checkAuthorisation() {
  return new Promise((resolve, reject) => {
    auth0.parseHash({ hash: window.location.hash }, function(err, authResult) {
      if (err) {
        resolve(false);
        console.log(err);
      } else {
        resolve(true);
        console.log('Token: ', authResult.accessToken);
      }
    });
  });
}

function clientAuthoriseButtonClickHandler(event) {
  const redirectUri = document.location.href.replace(document.location.hash, '');
  auth0.authorize({
    audience: 'https://api.moduware.com',
    responseType: 'token',
    grant_type: 'client_credentials',
    redirectUri: redirectUri
  });
}

function postData(url, data) {
  // Default options are marked with *
  return fetch(url, {
    body: JSON.stringify(data), // must match 'Content-Type' header
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'user-agent': 'Mozilla/4.0 MDN Example',
      'content-type': 'application/json'
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
    redirect: 'follow', // *manual, follow, error
    referrer: 'no-referrer', // *client, no-referrer
  })
  .then(response => response.json()) // parses response to JSON
}