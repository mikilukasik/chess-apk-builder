var express = require('express');
var fs = require('fs');
var exec = require('child_process').exec;
var network = require('network');
var request = require('request');
var app = express();
var WebSocketClient = require('websocket').client;

var serviceName = 'apkBuilder'
var PORT = 5000;

var log = require('./chess-common/logger')()
var logError = function (e) {log('ERROR', e.message, e.stack)}

var httpRedirectRules = [{
  inPath: '/builder/app.apk',
  outPath: '/app.apk',
  method: 'GET',
  alias: 'getApp'
},{
  inPath: '/builder/log',
  outPath: '/log',
  method: 'GET',
  alias: 'getLog'
},{
  inPath: '/builder/build',
  outPath: '/buildApp',
  method: 'GET',
  alias: 'buildApp'
}]

var ip = {public: '', private: '', gateway: ''}


var building = false
var built = false

// var socketAddr =       
var ws = new WebSocketClient();
ws.on('connectFailed', function(error) {
  log('Connect Error: ' + error.toString());
});
ws.on('connect', function(connection) {
    connection.on('error', function(error) {
        log("WS connection ERROR: " + error.toString());
    });
    connection.on('close', function() {
        log('WS connection closed, retry in 2s...');
        setTimeout(function() {
          ws.connect('http://' + ip.public + '/sockets');
        }, 2000);
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            log("WS message received: ", message.utf8Data);
        }
    });
    log('WebSocket Client Connected');

    var data = {
      rules: httpRedirectRules.map(function(rule) {
        rule.outHost = ip.private
        rule.outPort = PORT
        return rule
      })
    }
    log('Sending redirect rules to MSG: ',data)
    connection.send(JSON.stringify({
      command: 'setRedirectRules',
      data: data
    }))

});
      
function start() {
  log(ip)
  log('Starting ' + serviceName + ' on ' + ip.public + ':' + PORT);
  app.listen(PORT);
  app.get('/', function (req, res){ res.send('Hello from ' + serviceName + '!') });
  
  log('Connecting websocket to MSG')
  ws.connect('http://' + ip.public + '/sockets');
  // ws.connect('http://' + ip.public + '/sockets');

  log('Setting up API...')
  app.get('/app.apk', function(req,res){
    fs.readFile('/src/chessIonic/platforms/android/build/outputs/apk/android-debug.apk', function(err, result) {
      if (err) res.status(500).json(err)
      res.send(result)
    })
  })
      
  app.get('/runCommand/:command', function(req,res){
    res.writeHead(200, {"Content-Type":"text"});
      exec(req.params.command, function (error, stdout, stderr) {
      res.write(stdout)
      if (stderr) res.write('\nstderr: ' + stderr);
      if (error) res.write('\nERROR: ' + error.message + '\n' + error.stack);
      res.write('\nEOD')
      res.end()
      });
    })

  app.get('/log', function(req,res){
    res.writeHead(200, {"Content-Type":"text/enriched"});
    res.write(logData)
    res.end()
  })

  app.get('/buildApp', function(req,res){
    building = true
    res.send('\nStarting to build app...\n')
    
    function put (error, stdout, stderr) {
      log('\n' + stdout)
      if (stderr) log('\nstderr: ' + stderr);
      if (error) log('\nERROR: ' + error.message + '\n\n' + error.stack);
    }
  
    var commands = [
      'rm -rf chessIonic',
      'git clone https://github.com/mikilukasik/chessIonic.git',
      'cd chessIonic && npm i',
      'cd chessIonic && cordova platform add android',
      'cd chessIonic && cordova build'
    ]
    
    function runCommand () {
      var thisCommand = commands.splice(0,1)
      log('\nExecuting command: ' + thisCommand)
      exec(thisCommand, function(a,b,c) {
        put(a,b,c)
        log('\nDONE: ' + thisCommand + '\n\n')
        if (commands.length) {
          runCommand()
        } else {
          log('\nEOD')
          building = false
          built = true
        }
      })
    }

    runCommand()

  })

  log('API set up.')

}

var started = false
function tryStart() {if (ip.private && ip.public && !started) {started = 1; start()}}
  
// network.get_public_ip(function(err, ip2) {ip.public = err || ip2 || 'none'; tryStart()})
// network.get_private_ip(function(err, ip2) {ip.private = err || ip2 || 'none'; tryStart()})
// network.get_gateway_ip(function(err, ip2) {ip.gateway = err || ip2 || 'none'; tryStart()})
retryCount = {}

doIt = function(what, ipName) {
  what(function(e, i){
    if (e) {
        log('Getting ' + ipName + 'IP failed: ' + e.message)
        return setTimeout(function() {
        if (retryCount[ipName]) {
          retryCount[ipName] += 1
          if(retryCount[ipName] < 5){
            log('Retry getting ' + ipName + ' ip in 2sec')
            getIp(ipName)
          } else {
            log('prermanently failed getting' + ipName + ' ip')
            ip[ipName] = e
            tryStart()
          }
        } else {
          retryCount[ipName] = 1
          log('Retry getting ' + ipName + ' ip in 2sec')
          getIp(ipName)
        }
      }, 2000);
    }
    log('found ' + ipName + ' ip: ' + i)
    ip[ipName] = i
    tryStart()
  })
}


getIp = function(ipName2){
  eval('(doIt( network.get_' + ipName2 + '_ip, "' + ipName2 +'" ))')
  
}

getIp('private')
getIp('public')
getIp('gateway')

    // request.post('http://' + ip.public + '/setrules/redirect/http', {form: data}, function(e, r, body){
    //   if (!e) {
    //     log('POST Redirect rules returned with status ' + r.statusCode);
    //     log(body)
    //   } else {
    //     log(e.message + '\n' + e.stack);
    //   }
    // });