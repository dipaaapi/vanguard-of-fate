import assert from 'node:assert/strict';
import {load} from './headless.mjs';
const {captainRoutes}=await load('js/world/boat.js');
const q={side:{boat:{permit:false}},monolith:false,unlocked:()=>true};
assert.ok(captainRoutes(q,'coast').every(r=>!r.unlocked));q.side.boat.permit=true;
assert.equal(captainRoutes(q,'coast').find(r=>r.id==='swamp').unlocked,true);
assert.equal(captainRoutes(q,'coast').find(r=>r.id==='strand').unlocked,false);
q.monolith=true;for(const port of ['coast','strand','swamp']){const routes=captainRoutes(q,port);assert.equal(routes.length,2);assert.ok(routes.every(r=>r.unlocked&&r.id!==port));}
q.unlocked=id=>id!=='swamp';assert.equal(captainRoutes(q,'strand').find(r=>r.id==='swamp').unlocked,false);
assert.deepEqual(captainRoutes(q,'hub'),[]);
console.log('PASS: captain trial, Monolith and island quest gates, both-way border passages, no inland charters');
