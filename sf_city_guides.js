var jsdom = require("jsdom");
var moment = require("moment");
moment().format();

var TABLE = "table.tablec";
var URL = "http://www.sfcityguides.org/current_schedule.html";

//Return events (only one for now)
exports.getThisWeeksEvents = function(callback) {
  var events = [];
  jsdom.env(
    URL,
    ["http://code.jquery.com/jquery.js"],
    function (errors, window) {
      var $ = window.$;
      $(TABLE).each(function() {

        var date = $('th',this).text();

        $("tr",this).each(function(index) {
          //Each of these is a row!!
          //First index is date, ignore it
          if (index>0) {
            var event = new Object;
            event.date = date;
            $("td",this).each(function(index) {
              switch (index) {
                case 0:
                  //Time
                  var time = $(this).text()
                  // console.log("Time: "+time);
                  event.time = time;
                  break;
                case 1:
                  var name = $(this).text()
                  // console.log("Name: "+name);
                  event.name = name;
                  break;
                case 2:
                  var description = $(this).text();
                  // console.log("Description: "+description);
                  event.description = description;
                  break;
                case 3:
                  var location = $(this).text();
                  // console.log("Location: "+Location;
                  event.location = location;
                  break;
              }
            });
            //We have a completed event object now!
            // console.log("Event: "+event.name+" "+event.date+" "+event.time);
            dateTime = createEventDateTime(event);
            event.startDateTime = dateTime.startDateTime;
            event.endDateTime = dateTime.endDateTime;
            events.push(event);
          }
        });
      });
      console.log("There are "+events.length+" new events");
      callback(events);
    }
  );
};

function createEventDateTime(event) {

  var dateTime = new Object;
  var dateTimeFormat = "YYYY-MM-DDTHH:mm:ssZ";

  var startDateTime;
  var endDateTime;

  var monthAndDate = event.date.split("\n")[1];
  var monthWord = monthAndDate.split(" ")[0];
  var day = monthAndDate.split(" ")[1];
  startDateTime = moment(event.time,"hh:mm A");
  startDateTime.month(monthWord);
  startDateTime.date(day);

  //Let's assume all tours end after 1 hour (event if this might be completelly false haha)

  dateTime.startDateTime = startDateTime.format(dateTimeFormat);
  endDateTime = startDateTime;
  endDateTime.add(1,"hours");
  dateTime.endDateTime = endDateTime.format(dateTimeFormat);
  return dateTime;
}
