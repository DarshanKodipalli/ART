// Include our packages in our main server file
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var User = require('./models/user');
var morgan = require('morgan');

const fileUpload = require('express-fileupload');
var config = require('./config/sysProp');




var app = express();
mongoose.connect(config.database, { useNewUrlParser: true });


// Middlewares
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

app.use(morgan('dev'));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));

// Make it to shared Mongodb session
app.use(session({
  cookieName: 'session',
  secret: config.secret,
  duration: 15 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

function requireLogin (req, res, next) {
  // check user verification and reject the request
  if (!req.user) {
    res.json({'message':'Please login'});
  } else {
    next();
  }
};



app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:4200");
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods',["PUT,POST,GET,DELETE"]);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(function(req, res, next){
  console.log('Entered into session middleware');
  if(req.session && req.session.user){
    User.findOne({ email: req.session.user.email }, function(err, user){
      if(user){
        req.user = user;
        delete req.user.password;
        req.session.user = user;
        res.locals.user = user;
      }
      next();
    });
  } else {
    next();
  } 
});

var apiRoutes = express.Router();

require('./routes/userRtr')(apiRoutes, requireLogin);

require('./routes/orderRtr')(apiRoutes, requireLogin);
require('./routes/invoiceRtr')(apiRoutes, requireLogin);
require('./routes/bulkUploadRtr')(apiRoutes, requireLogin);
require('./routes/paymentRtr')(apiRoutes, requireLogin);
require('./routes/transactionRtr')(apiRoutes, requireLogin);
require('./routes/reportRtr')(apiRoutes, requireLogin);

// test apiRoute

apiRoutes.get('/version', function(req, res) {
  res.json({'version':'1.0.0'});
});

app.get('/', function (req, res) {
  // NEW CODE
  res.send("<a href='http://localhost:3000/api/v1/report?template=order&id=ABC_2018-10-31T16:07:02.684Z'>Click me</a>");
})

app.use('/api/'+config.version, apiRoutes);

// Start Server
var server = app.listen(config.port);
console.log('Your server is running on port ' + config.port + '.');