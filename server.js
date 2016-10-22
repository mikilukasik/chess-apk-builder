var fs = require('fs');
var exec = require('child_process').exec;
var request = require('request');

var serviceName = 'chess-apk-builder'
var PORT = 5500;

var token = process.env.GIT_TOKEN
var clientRepo = process.env.REPO_client

const repoParts = clientRepo.split('://')
const clientRepoWithToken = [repoParts[0], '://', token, repoParts[1]].join('')

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

var building = false
var built = false
var started = 0

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
      'git clone ' + clientRepoWithToken,
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
.then(function(connectionResult){
log('MSG connected', connectionResult)
setMyRules()
msg.expose('status /builder/status')
}, handle)

