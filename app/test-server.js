'use strict';

// Used when building/running tests

const https = require('https');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});
var app = express();

var options = {
    key: fs.readFileSync( './test-localhost.key' ),
    cert: fs.readFileSync( './test-localhost.cert' ),
    requestCert: false,
    rejectUnauthorized: false
};

var port = process.env.PORT || 8483;

//setup the logger
//do not log the pings from the proxy (healthcheck)
app.use(morgan('combined', {stream: accessLogStream, skip: function(req, res) {
  return req.method === "HEAD" && req.path === "/"
}}));

if (/^dev|test$/.test(app.get('env'))) {
  app.use('/', express.static(__dirname + '/.tmp'));
  app.use('/', express.static(__dirname + '/public'));
} else {
  app.use('/', express.static(__dirname + '/dist'));
}

app.get('/auth/PublicCertificate', function(req, res) {
  res.send(new Buffer(options.cert));
});

app.get('/auth/DummyAuth', function (req, res) {
  var token = jwt.sign({
    name: 'Social UserName',
    id: 'dummy:pretend',
    email: 'dummy@usersareawesome.com'
  }, options.key, {
    expiresIn: '1h',
    algorithm: 'RS256'
  });

  res.redirect(302, '/#/login/callback/' + token);
});

app.get('/players/v1/accounts/undefined', function(req, res) {
  res.sendStatus(404);
});

app.post('/players/v1/accounts/', function(req, res) {
  res.status(201).send({
    "_id": "oauthProvider:userid",
    "name": "Harriet",
    "favoriteColor": "Tangerine",
    "location": {
      "location": "room_id_1"
    },
    "credentials": {
      "sharedSecret": "fjhre8h49hf438u9h45",
      "email": "myroomisbroken@gmail.com"
    }
  });
})

var server = https.createServer( options, app );

server.listen(port, function () {
  var host = server.address().address;

  console.log('Node app is up and running to serve static HTML content: ' + host + ':' + port);
});
