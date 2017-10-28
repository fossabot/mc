const { fork } = require('child_process');

function excelexport(fields,jobId,Emitter){
    const forked = fork('./util/worker.js');
    forked.on('message', (msg) => {
        Emitter.emit('exportProgress',msg);
  
       // console.log('Message from child = ', msg);
      })

    forked.on('exit',()=>{
       
            forked.removeAllListeners();
            console.log('completed')
            return 0;
        
    })

    console.log('request sent for export ##############');  
    forked.send({ cmd:'export',jobId:jobId,fields:fields });
}

module.exports = excelexport