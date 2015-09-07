var sfcgCalendar = require("./calendar.js");
var sfcgWebsite = require("./sf_city_guides.js");
var async = require('async');

var CONCURRENCY_LIMIT = 1;
var deleteOnly = false;

//Handle arguments
process.argv.forEach(function (val, index, array) {
	if (index>=2) {
		if (val="delete") {
			console.log("Delete existing events only");
			deleteOnly = true;
		}
	}
});

//It starts here!
sfcgCalendar.getCalendarAuthentication(function(auth) {
  //Get authentication
  console.log("Calendar Authentication acquired");

  console.log("Deleting existing gCal events");
  deleteAllEvents(auth, function() {
    if (deleteOnly) {
	console.log("Only deleting existing events");
	return;
    }
    console.log("Getting this week's upcoming events");
    sfcgWebsite.getThisWeeksEvents(function(events) {
      createEvents(auth, events, function() {
        console.log("Entire process done! Tada!");
      });
    });
  });

});

function deleteAllEvents(auth, allEventsDeletedCallback) {
  //Get all existing events and delete them
  var q = async.queue(function(task, callback) {
      sfcgCalendar.deleteCalendarEvent(task.auth,task.event,callback);
  },CONCURRENCY_LIMIT);

  q.drain = function() {
    console.log("All events have been deleted");
    allEventsDeletedCallback();
  }

  sfcgCalendar.getAllCalendarEvents(auth,null,[],function(events) {
    if (events.length==0) {
      allEventsDeletedCallback();
      return;
    }
    for (var i=0; i < events.length; i++) {
      var event = events[i];
      q.push({auth:auth, event: event}, function(err) {
        console.log("Finished deleting event");
      })
    }
  });
}

function createEvents(auth, events,allEventsCreatedCallback) {
  var q = async.queue(function(task, callback) {
		setTimeout(sfcgCalendar.createCalendarEvent(task.auth,task.event,callback),1000); //1s delay
    // sfcgCalendar.createCalendarEvent(task.auth,task.event,callback);
  },CONCURRENCY_LIMIT);

  q.drain = function() {
    console.log("All events have been created");
    allEventsCreatedCallback();
  }

  for (var i=0; i < events.length; i++) {
    var event = events[i];
    q.push({auth: auth, event: event}, function(err) {
      console.log("Finished creating event");
    });
  }
}
