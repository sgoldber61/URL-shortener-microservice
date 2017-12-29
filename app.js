// require helper modules
var path = require('path');
var validUrl = require('valid-url');
var shortid = require('shortid');

// require express
var express = require('express');
var app = express();


// require mongodb
var mongo = require('mongodb').MongoClient;
var dbUrl = "mongodb://localhost:27017/URL_shortener_db";


// url prefix for shortened urls
var urlPrefix = "http://localhost:3000/";


// app routing
app.get('/', function(req, res) {
  // render the home page index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});


// creation usage
// valid url begins with http:// or https:// and contains at least one dot
app.get('/new/*', function(req, res, next) {
  console.log("creation usage");
  
  var url = req.params[0];
  console.log(url);
  // validate url
  if (!(validUrl.isUri(url))) {
    console.log("Invalid URL");
    next();
  }
  else {
    // connect to mongodb
    mongo.connect(dbUrl, function(err, client) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
        res.send({error: "Mongodb connection error"});
      }
      
      console.log('Connection established to', dbUrl);
      
      // insert doc with the url into database
      var collection = client.db("url_shortener_db").collection('url_data');
      var filter = {
        original_url: url
      };
      var doc = {
        original_url: url,
        short_url: urlPrefix + shortid.generate()
      };
      
      collection.replaceOne(filter, doc, {upsert: true}, function(err, result) {
          if (err) throw err;
          
          res.send(doc);
          client.close();
        });
      
    });
  }
});

// usage
app.get('/*', function(req, res, next) {
  console.log("usage");
  
  var url = urlPrefix + req.params[0];
  console.log(url);
  
  // connect to mongodb
  mongo.connect(dbUrl, function(err, client) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
      res.send({error: "Mongodb connection error"});
    }
    
    console.log('Connection established to', dbUrl);
  
    // test to see if url is in database, if no return error, if yes link to page
    // insert doc with the url into database
    var collection = client.db("URL_shortener_db").collection('url_data');
    var filter = {
      short_url: url
    };
    
    collection.findOne(filter, function(err, result) {
      if (err) throw err;
      
      // log result of shortened url lookup: will be either an object containing original_url and short_url, or null
      console.log(JSON.stringify(result));
      if (result) {
        res.redirect(result.original_url);
      }
      else {
        res.send({error: "This url is not on the database."});
      }

      client.close();
    });
  });
});

// other
app.use(function(req, res) {
  console.log("Usage error: no match");
  res.send({error: "Usage error"});
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
