var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport("SMTP",{
  service: "Gmail",
  auth: {
    user: "sfcityguidescalendar@gmail.com",
    pass: "star2512"
  }
});


exports.sendEmail = function(message) {
  var mailOptions = {
    from: "sfcityguidescalendar@gmail.com",
    to: "jrejaud@gmail.com",
    subject:"SF City Guides Calendar",
    text:message,
  }
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent");
    }
  });
}
