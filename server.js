
'use strict';

const { Client } = require('node-osc');
const { Server } = require('ws');
const express = require('express');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const httpServer = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
const wsServer = new Server({ server: httpServer });

var oscClientList = [];

wsServer.on('connection', (ws, req) => {
  console.log('connected');

  ws.on('message', message => {
    var msg = JSON.parse(message);
    //console.log(message);
    console.log(msg);

    if(msg.pfx == 'add'){

      /*
      websocket format 'add'
      {
        pfx: 'add',
        data: [
          '192.168.x.x',  //osc server host
          3333,           //osc server port
          'address'       //osc server address
        ]
      }
      */

      oscClientList.push({
        client: new Client(msg.data[0], msg.data[1]),
        host: msg.data[0],
        port: msg.data[1],
        address: msg.data[2]
      });
    }
    if(msg.pfx == 'control'){

      /*
      websocket format 'control'
      {
        pfx: 'control',
        data: [
          'load | play | pause | stop | time | frame',  //osc control prefix
          13401                                         //osc control code
        ]
      }
      */

      oscClientList.forEach(c => {
        c.client.send('/'+c.address, msg.data[0], msg.data[1]);
      });
    }
    if(msg.pfx == 'remove'){
      
      /*
      websocket format 'remove'
      {
        pfx: 'remove',
        data: [
          '192.168.x.x',  //osc server host
          3333,           //osc server port
          'address'       //osc server address
        ]
      }
      */
      
      var rtrg = oscClientList.filter(c => c.host == msg.data[0] && c.port == msg.data[1])
      rtrg.forEach(c => c.client.close());
      oscClientList = oscClientList.filter(c => !rtrg.includes(c));
    }
    if(msg.pfx =='list'){

      /*
      websocket format 'list'
      {
        pfx: 'list',
        data: []
      }
      */

      ws.send(oscClientList.map(c => c.host+':'+c.port+"/"+c.address).join('\n'))
    }

    ws.send(oscClientList.map(c => c.host+':'+c.port+"/"+c.address).join('\n'))
  });

  ws.on('close', () => {
    console.log('closed');
    ws.send(oscClientList.map(c => c.host+':'+c.port+"/"+c.address).join('\n'))
  });
});
