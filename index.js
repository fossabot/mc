const EventEmitter = require('events');
var app = require('express')();
var express = require('express');
var server = require('http').Server(app);

var io = require('socket.io')(server);

var bodyParser = require('body-parser');

var database = require('./util/database.js');
var excport = require('./util/excelexport.js');

const moneycontrol = require('./scraper/moneycontrol.js');

var rp = require('request-promise');

var db = database.sqliteSetup('scraper.sqlite3', '_master_');


var Emitter = new EventEmitter();

var Jobs={
    active:[],
    cancelled:[],
    completed:[]
}

Jobs = { ...Jobs.active,...database.getJobList(db,true)}

Emitter.on('jobCreated',(e)=>{
    Jobs.active.push({jobId:e.jobId,progress:'0%',mro:'-'})
    Emitter.emit('jobUpdate');
})

Emitter.on('jobCompletion',(e)=>{
    Jobs.active.forEach((j,i)=>{
        if(j.jobId==e){
            Jobs.active.splice(i,1);
        }
    })    
Jobs = { ...Jobs.active,...database.getJobList(db,true)}    
    Emitter.emit('jobUpdate');
})



app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.json());

app.use(express.static('./public'));

app.post('/create', function (req, res) {
    req.body.jobId = '_' + req.body.jobId
    if (true) {
        if (req.body.target == 'moneycontrol') {
            moneycontrol({
                jobId: req.body.jobId,
                scope: req.body.scope,
                filter: req.body.filter || 'A',
                concurrentSU: req.body.concurrentSU
            }, db, Emitter);
            res.send({
                payload: {
                    type: 'create',
                    result: 'success',
                    message: 'New job created - ' + req.body.jobId
                },
                _meta: {}
            });
        } else {
            res.send({
                payload: {
                    type: 'create',
                    result: 'fail',
                    message: 'Target cannot be empty'
                },
                _meta: {}
            });
        }
    } else {
        console.log('Job id with this name already exists');
        res.send({
            payload: {
                type: 'create',
                result: 'fail',
                message: 'Job ID with this name already exists'
            },
            _meta: {}
        });
    }

})

app.get('/terminate', function (req, res) {
    Emitter.emit('terminate');
    res.send({
        'terminated': true
    })

})

app.post('/getexportfields', function (req, res) {
    console.log("sending field list");
    fl = database.getFieldList(db, req.body.jobId);
    res.send({
        'result': 'success',
        'fields':fl
    });

})

app.post('/excelexport', function (req, res) {
    //excport(req.body.form, db,req.body.jobId,Emitter);
    excport(req.body.form,req.body.jobId,Emitter);
    
    res.end()
})

app.get('/download', function (req, res) {
    
    res.download("./_moneycontrol.xlsx")
})

/*app.get('/download', function(req, res){
var file = './_mny.xlsx';
res.download(file);
})*/

io.on('connection', function (socket) {
    console.log("connected " + socket.id);
    socket.emit('jobUpdate',Jobs)
    let jobUpdateCallback = function () {
        socket.emit('jobUpdate',Jobs)
    }
    Emitter.on('jobUpdate', jobUpdateCallback)

    let jobProgressCallback = function (d) {
        socket.emit('jobProgress',d)
    }
    Emitter.on('jobProgress', jobProgressCallback)

    let exportProgressCallback = function (d) {
        socket.emit('exportProgress',d.progress)
    }
    Emitter.on('exportProgress', exportProgressCallback)

    socket.on('disconnect', (reason) => {
        console.log(reason);
        Emitter.removeListener('jobUpdate', jobUpdateCallback)
        Emitter.removeListener('jobProgress', jobProgressCallback)
        Emitter.removeListener('exportProgress', exportProgressCallback)        
    });

    socket.on('cmdReq', function (data) {
        
        if (data.cmd =='terminateOngoing'){
            Emitter.emit('terminate_' + data.jobId);
        }

    })

});

server.listen(80,()=>{console.log("server started")})
