'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

var urlSchema = new mongoose.Schema({
  originalURL: { type: String, required: true },
  shortURL: Number
});

var URL = mongoose.model('URL', urlSchema);

var arrayOfURL = [
  { originalURL: "www.google.com", shortURL: 1 }, 
  { originalURL: "www.freecodecamp.org", shortURL: 2 }, 
  { originalURL: "forum.freecodecamp.com", shortURL: 3 }
];

var createURL = function(arrayOfURL, done) {  
  URL.create(arrayOfURL, function(err, data) {
      if(err)
        done(err);
      else
        done(data);
    });  
};

var findOneByURL = function(url, req, res) {
  URL.findOne({originalURL: url}, function(err, data) {
    if(err)
      console.log(err);
    else {
      if(data===null) {
        URL.countDocuments({}, function(err, c) {
          if(err)
            console.log(err);
          else {
            createURL([{ originalURL: url, shortURL: c+1 }], console.log);
            res.json({ original_url: req.body.url, short_url: c+1 });
          }
        });
      }
      else
        res.json({ original_url: req.body.url, short_url: data.shortURL });
    }
  });
};

var findOneByShortURL = function(shortURL, req, res) {
  URL.findOne({shortURL: shortURL}, function(err, data) {
    if(err)
      console.log(err);
    else {
      if(data===null) {
        res.json({ error: "No short_url found for given input" });
      }
      else {
        res.redirect("http://" + data.originalURL);
      }
    }
  });
};

app.post("/api/shorturl/new/", function(req, res) {
  var url = ""; 
  
  // Setup the url
  if(req.body.url.startsWith("https://"))
    url = req.body.url.substring(8);
  else if(req.body.url.startsWith("http://"))
    url = req.body.url.substring(7);
  else
    url = "invalid URL";
  
  //Lookup for valid url
  dns.lookup(url, (err) => {
    if(err)
      res.json({ error: "invalid URL" });    //if invalid
    else {
      findOneByURL(url, req, res);      
    }
  });
});

app.get("/api/shorturl/:shortURL", function(req, res) {
  findOneByShortURL(Number(req.params.shortURL), req, res);
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
