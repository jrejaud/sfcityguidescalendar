var schedule = require('node-schedule');
var parser = require('cron-parser');
var childProcess = require('child_process');
var emailer = require(__dirname+"/emailer.js")

var FOUR_AM_CHRON_JOB = "0 5 * * *";

function calendarUpdate() {
  var process = childProcess.fork(__dirname+"/update_google_calendar.js");

  process.on("exit", function (code) {
    console.log("Calendar updated completed, code: "+code);
    emailer.sendEmail("Calendar update completed, code: "+code);
   });

  process.on("error", function (err) {
    console.log("Calendar update error: "+err);
    emailer.sendEmail("Calendar update error: "+err);
  });
}

function showNextCronJob() {

  var interval = parser.parseExpression(FOUR_AM_CHRON_JOB);

  console.log("Setting up chron job, next calendar update: "+interval.next());

}

console.log("San Francisco City Guides Calendar Main app");
console.log("Running update once");

calendarUpdate();
showNextCronJob();

var j = schedule.scheduleJob(FOUR_AM_CHRON_JOB, function(){
    console.log('It is 1am PST (4am EST since that is where the server runs), it\'s time to update the google calendar!');
    calendarUpdate();
});
