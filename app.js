//. app.js

var express = require( 'express' ),
    cfenv = require( 'cfenv' ),
    multer = require( 'multer' ),
    basicAuth = require( 'basic-auth-connect' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    fs = require( 'fs' ),
    request = require( 'request' ),
    xml2js = require( 'xml2js' ),
    app = express();
var settings = require( './settings' );
var appEnv = cfenv.getAppEnv();

app.use( multer( { dest: './tmp/' } ).single( 'image_file' ) );
app.use( bodyParser.urlencoded( { extended: true, limit: '10mb' } ) );
app.use( bodyParser.json( { limit: '10mb' } ) );
app.use( express.static( __dirname + '/public' ) );

if( settings.basic_username && settings.basic_password ){
  app.all( '*', basicAuth( function( user, pass ){
    return( user === settings.basic_username && pass === settings.basic_password );
  }));
}

var port = appEnv.port || 3000;

//. 運行状況
app.get( '/status', function( req, res ){
  var line_id = req.query.line_id;

  if( line_id ){
    var url = settings.api_base_url + line_id + '.json';
    var options = { url: url, method: 'GET' };
    request( options, ( err0, res0, body0 ) => {
      if( err0 ){
        res.write( 400, JSON.stringify( err0, 2, null ) );
        res.end();
      }else{
        res.write( JSON.stringify( body0, 2, null ) );
        res.end();
      }
    });
  }else{
    res.write( 400, JSON.stringify( {}, 2, null ) );
    res.end();
  }
});

//. 駅コード => 駅名変換
app.get( '/getStation', function( req, res ){
  var line = req.query.line;
  var codes = req.query.codes; //. XXXX_YYYY or XXXX_0000
  if( line && codes ){
    var message = req.query.message;
    var json = require( './' + line + '.js' );
    var code = codes.split( '_' );
    if( json.names[code[0]] ){
      var station0 = json.names[code[0]];
      var name0 = station0.name;
      var lat0 = station0.lat;
      var lng0 = station0.lng;

      var stations = [{code: code[0], name: name0, lat: lat0, lng: lng0 }];
  
      if( code.length > 1 && code[1] != '0000' && json.names[code[1]] ){
        var station1 = json.names[code[1]];
        var name1 = station1.name;
        var lat1 = station1.lat;
        var lng1 = station1.lng;

        stations.push( {code: code[1], name: name1, lat: lat1, lng: lng1 } );
      }

      res.write( JSON.stringify( { status: true, message: message, stations: stations }, 2, null ) );
      res.end();
    }else{
      res.write( JSON.stringify( { status: false, error: 'no name found.' }, 2, null ) );
      res.end();
    }
  }else{
    res.write( JSON.stringify( { status: false, error: 'no line or codes specified.' }, 2, null ) );
    res.end();
  }
});

/*
//. 駅すぱあと API
var url = 'http://api.ekispert.jp/v1/json/station?key=' + settings.ekispert_accesskey + '&name=' + encodeURIComponent( name );
var options = { url: url, method: 'GET' };
request( options, ( err0, res0, body0 ) => {
  if( err0 ){
    res.write( 400, JSON.stringify( err0, 2, null ) );
    res.end();
  }else{
    res.write( body0, 2, null ) );
    res.end();
   }
});
*/


app.listen( port );
console.log( "server starting on " + port + " ..." );


