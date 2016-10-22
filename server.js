// var express = require('express');
var fs = require('fs');
var exec = require('child_process').exec;
// var network = require('network');
var request = require('request');
// var app = express();
// var WebSocketClient = require('websocket').client;

console.log('TOKEN: ', process.env.GIT_TOKEN)
console.log('REPO: ', process.env['REPO_chess-client'])

var serviceName = 'chess-apk-builder'
var PORT = 5500;

var createLog = require('./chess-common/logger')
var log = createLog({alias: serviceName})
var handle = function(err){
  log('ERROR:', err)
}
var msg = require('./chess-common/msgservice')({
  serviceName: serviceName,
  PORT: PORT,
  log: createLog({alias: 'msg-on-' + serviceName})
})

var clientRepo = ''
var building = false
var built = false
var started = 0

function getSecret() {
  return new Promise((res, rej) => { 
    var options = {
      uri: ip.public + ':' + 5101 + '/allRepos',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };


    function sendReq (){

      request('http://' + ip.public + ':' + 3000 + '/allRepos?repo=chess-client', function (error, response, body) {
        if (!error && response.statusCode == 200) {

          log('got result body:', body, typeof body)

          var bod = JSON.parse(body)

          clientRepo = bod.repo

          if(!clientRepo) return setTimeout(function() {
            log('retry getting clientRepo...')
            sendReq()
          }, 2000)

          res()
        } else {
          log('ERROR', error, response, body)
          rej()
        }
      })
    }

    sendReq()
      

  })
}

function setMyRules(){


}

// getSecret()
//   .then(function(){
    msg.connect().then(function(){

      msg.on('GET /app.apk', function(req,res){
        fs.readFile('/src/chessIonic/platforms/android/build/outputs/apk/android-debug.apk', function(err, result) {
          if (err) res.status(500).json(err)
          res.send(result)
        })
      })
          
      msg.on('GET /runCommand/:command', function(req,res){
        res.writeHead(200, {"Content-Type":"text"});
          exec(req.params.command, function (error, stdout, stderr) {
          res.write(stdout)
          if (stderr) res.write('stderr: ' + stderr);
          if (error) res.write('ERROR: ' + error.message + '' + error.stack);
          res.write('EOD')
          res.end()
          });
        })

      msg.on('GET /log', function(req,res){
        log(function(){return 'getLog'}).then(function(logData){
          res.writeHead(200, {"Content-Type":"text/enriched"});
          res.write(logData)
          res.end()
        }, function(err){
          res.writeHead(500, {"Content-Type":"text/enriched"});
          res.write(err.message)
          res.end()
        })
      })

      msg.on('GET /buildApp', function(req,res){
        building = true
        started = new Date().getTime()
        res.send('Starting to build app...')
        
        function put (error, stdout, stderr) {
          log(stdout)
          if (stderr) log('stderr: ', stderr);
          if (error) log('ERROR: ' + error.message, error.stack);
        }

        var commands = [
          'rm -rf chessIonic',
          'git clone ' + clientRepo,
          'cd chessIonic && npm i',
          'cd chessIonic && cordova platform add android',
          'cd chessIonic && cordova build'
        ]
        
        function runCommand () {
          var thisCommand = commands.splice(0,1)
          log('Executing command: ' + thisCommand)
          exec(thisCommand, function(a,b,c) {
            put(a,b,c)
            log('DONE: ' + thisCommand)
            if (commands.length) {
              runCommand()
            } else {
              log('Build finished in ' + (new Date().getTime() - started) + 'ms.')
              building = false
              built = true
            }
          })
        }
        runCommand()
      })

    }, handle)
  // }, handle)
  .then(function(connectionResult){
    log('MSG connected', connectionResult)
    setMyRules()
    msg.expose('status /builder/status')
  }, handle)

