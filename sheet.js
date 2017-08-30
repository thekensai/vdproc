var readlineSync = require('readline-sync');
var google = require('googleapis');
var fs = require('fs');
var TOKEN_PATH;

var updateSheet = function(data) {
  if (data === null || !data.length) {
	console.log('No data to update');
	return;
  }


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
//var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = (__dirname || process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';

TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-vdproc.json';


 // var fs = require('fs');
// Load client secrets from a local file.

fs.readFile(TOKEN_DIR + '/client_secret.json', function processClientSecrets(err, content) {

  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Sheets API.
  authorize(JSON.parse(content), append(data));
});

};


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var googleAuth = require('google-auth-library');
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);

  var readline = require('readline');
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function getAccounts(auth) {
	
	return new Promise((resolve, reject) => {
		
		var sheets = google.sheets('v4');
		sheets.spreadsheets.values.get({
			auth: auth,
			spreadsheetId: '1tZB3Q29OMZnq4jDGjxOuDMI8hVYf15iOEq5m_uqw8E0',
			"range": "baidu!A1:1",
			majorDimension:"ROWS"
			}, 
			
			function(err, response) {
				if (err) {
				  console.log('Failed to read accounts: ' + err);
				  reject(err);
				  return;
				}

				resolve(response.values[0].map((v, x) => {return {val: v, idx: x}}).filter(e => /.+@.+\.com/.test(e.val)));
		  });
	});
}

function columnToLetter(column)
{
  var temp, letter = '';
  while (column > 0)
  {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function letterToColumn(letter)
{
  var column = 0, length = letter.length;
  for (var i = 0; i < length; i++)
  {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}

function lastValue(column) {
  var lastRow = SpreadsheetApp.getActiveSheet().getMaxRows();
  var values = SpreadsheetApp.getActiveSheet().getRange(column + "1:" + column + lastRow).getValues();

  for (; values[lastRow - 1] == "" && lastRow > 0; lastRow--) {}
  return values[lastRow - 1];
}

function append(data) {
	return async function(auth) {
		
		var accounts = await getAccounts(auth);
			
		index = readlineSync.keyInSelect(accounts.map(e => e.val), 'Which account?');
		
		if (index < 0) {
			console.log('Saving cancelled');
			process.exit();
		}
		
		var range = "baidu!" + columnToLetter(accounts[index].idx + 1)+ "1:" + columnToLetter(accounts[index].idx + 3);
		console.log('saving under ' + accounts[index].val + ' ' + range + ' ...');
		//return;
		var sheets = google.sheets('v4');
			sheets.spreadsheets.values.append({
			auth: auth,
			spreadsheetId: '1tZB3Q29OMZnq4jDGjxOuDMI8hVYf15iOEq5m_uqw8E0',
			"range": range,
			valueInputOption: 'USER_ENTERED',
			resource:{
				majorDimension: "ROWS",
				"values": data
			}
		  }, 
		  function(err, response) {
			if (err) {
			  console.log('Failed to update: ' + err);
			  return;
			}

			var updates = response.updates;
			console.log('range ' + updates.updatedRange + ', ' 
			+  updates.updatedRows + ' rows x ' + updates.updatedColumns + ' columns' );
			console.log(data);
			process.exit();
		  }
		);
	};
}


module.exports.updateSheet = updateSheet;
