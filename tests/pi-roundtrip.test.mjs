import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const plugin = join(dirname(fileURLToPath(import.meta.url)), '..',
  'streamdeck', 'io.github.minjungw00.musicdeckbridge.sdPlugin', 'bin', 'plugin.js');

function encodeServerFrame(value) {
  const body=Buffer.from(JSON.stringify(value));
  const len=body.length;
  return Buffer.concat([len<126 ? Buffer.from([0x81,len]) : Buffer.from([0x81,126,len>>8,len&255]),body]);
}
function decodeMaskedFrames(buffer) {
  const result=[];
  let offset=0;
  while(offset+2<=buffer.length){
    const marker=buffer[offset], b=buffer[offset+1];
    let count=b&127,header=2;
    if(count===126){if(offset+4>buffer.length)break;count=buffer.readUInt16BE(offset+2);header=4;}
    if(count===127)throw Error('Frame too large in test');
    const masked=Boolean(b&0x80),size=header+(masked?4:0)+count;
    if(offset+size>buffer.length)break;
    const bytes=Buffer.from(buffer.subarray(offset+header+(masked?4:0),offset+size));
    if(masked){const key=buffer.subarray(offset+header,offset+header+4);
      for(let i=0;i<bytes.length;i++)bytes[i]^=key[i%4];}
    if((marker&15)===1)result.push(JSON.parse(bytes.toString()));
    offset+=size;
  }
  return {messages:result,remaining:buffer.subarray(offset)};
}

test('PIN can be generated from current-song property inspector using real Stream Deck websocket protocol',async () => {
  const tmp=mkdtempSync(join(tmpdir(),'music-deck-bridge-pi-'));
  let finish,fail;
  const result=new Promise((resolve,reject)=>{finish=resolve;fail=reject;});
  const server=createServer();
  const sockets=new Set();
  server.on('upgrade',(req,socket)=>{
    sockets.add(socket); socket.on('close',()=>sockets.delete(socket));
    const key=req.headers['sec-websocket-key'];
    const accept=createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
    let buffer=Buffer.alloc(0);
    socket.on('data',chunk=>{
      buffer=Buffer.concat([buffer,chunk]);
      let decoded;
      try{decoded=decodeMaskedFrames(buffer);}catch(e){fail(e);return;}
      buffer=decoded.remaining;
      for(const msg of decoded.messages){
        if(msg.event==='registerPlugin'){
          socket.write(encodeServerFrame({event:'sendToPlugin',context:'test-key-1',
            action:'io.github.minjungw00.musicdeckbridge.nowplaying',payload:{type:'generate-pin'}}));
        } else if(msg.event==='sendToPropertyInspector'){
          finish(msg);
        }
      }
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const addr=server.address();
  const proc=spawn(process.execPath,[plugin,'-port',String(addr.port),'-pluginUUID','io.github.minjungw00.musicdeckbridge',
    '-registerEvent','registerPlugin'],{
    env:{...process.env, APPDATA:tmp, MUSIC_DECK_BRIDGE_DEV_TEST:'1', MUSIC_DECK_BRIDGE_TEST_PIN:'654321'},
    stdio:'ignore',
  });
  let timeout;
  try{
    const reply=await Promise.race([result,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('PIN message timeout')),2300);})]);
    assert.equal(reply.context,'test-key-1');
    assert.equal(reply.payload.type,'connection');
    assert.equal(reply.payload.pin,'654321');
    assert.ok(reply.payload.expiresAt>Date.now());
  }finally{
    clearTimeout(timeout);
    proc.kill();
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve=>server.close(resolve));
    rmSync(tmp,{recursive:true,force:true});
  }
});
