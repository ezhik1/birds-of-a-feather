var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');

var app  = express();


var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//allows to put, patch, and delete http verbs
var methodOverride = require('method-override');
app.use(methodOverride('X-HTTP-Method-Override'));

//sets up a static file server that points to the client /lib directory
app.use('/lib',express.static(path.join(__dirname, '/lib')));
app.use('/js',express.static(path.join(__dirname, '/js')));
app.use('/css',express.static(path.join(__dirname, '/css')));
app.use('/node_modules',express.static(path.join(__dirname, '/node_modules')));

//set port
var port = 7000;

var server = app.listen((port), function(){
		console.log('\nTacos be happening on port ----> ['+port+']\n');
	});

var routes = require('./config/routes.js')(app,path,http,https);
