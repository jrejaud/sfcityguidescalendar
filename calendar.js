//San Francisco Google Calendar

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var calendar = google.calendar('v3');
var sf_city_guides = require('./sf_city_guides');

var async = require('async');

//San Francisco City Guides Calendar Constants
var SFCGID = "4e67mrfursaidmh7ocklgrslh0@group.calendar.google.com";
var TIMEZONE = 'America/Los_Angeles';

//Needed to delete the old token when I changed this from ro to r/w
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
// var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
//     process.env.USERPROFILE) + '/.credentials/';
var TOKEN_DIR = './.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-api-sfcg.json';


exports.getCalendarAuthentication = function(callback) {
  // Load client secrets from a local file.
  fs.readFile('./google_calendar_vars.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), callback);
  });
}

exports.getAllCalendarEvents = function(auth,pageToken,eventsList,callback) {
  calendar.events.list({
    auth: auth,
    calendarId: SFCGID,
    pageToken: pageToken,
  }, function (err, resp) {
    if (err) {
      console.log("Error getting list of events: "+err);
      return;
    }
      var events = resp.items;
      //See if there is a next page token

      if (events.length != 0) {
        console.log("This page has: "+events.length+" events");
        events.forEach(function(event) {
          eventsList.push(event);
        });
      }

      if (resp.nextPageToken!=null) {
          console.log("This page has a page token, check the next page");
          exports.getAllCalendarEvents(auth,resp.nextPageToken,eventsList,callback);
          return;
      }

      console.log("No more tokens, got all the activities");

      console.log("There are currently "+eventsList.length+" events on the google calendar");

      callback(eventsList);

  });
}

exports.deleteCalendarEvent = function(auth,event,callback) {
  console.log("Deleting event: "+event.summary)
    calendar.events.delete({
      auth: auth,
      calendarId: SFCGID,
      eventId: event.id,
    }, function(err, resp) {
      if (err) {
          console.log("Error deleting event: "+event.summary);
          console.log(err);
          callback();
          return
      }
        callback();
    });
}

exports.createCalendarEvent = function(auth,event, callback) {
    var calendarEvent = {
      'summary': event.name,
      'location': event.location,
      'description': event.description,
      'start': {
        'dateTime': event.startDateTime,
        'timeZone': TIMEZONE,
      },
      'end': {
        'dateTime': event.endDateTime,
        'timeZone': TIMEZONE,
      },
    };

    console.log("Attempting to create event: "+event.name);
      calendar.events.insert({
        auth: auth,
        calendarId: SFCGID,
        resource: calendarEvent
      }, function(err, event) {
        if (err) {
          console.log("Error creating the event");
          console.log(err);
          next();
          return;
        }
        callback();
      });
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
authorize = function(credentials, callback) {
  var clientSecret = process.env.GCAL_CLIENT_SECRET;
  var clientId = process.env.GCAL_CLIENT_ID;
  var redirectUrl = credentials.installed.redirect_uris[0];
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
