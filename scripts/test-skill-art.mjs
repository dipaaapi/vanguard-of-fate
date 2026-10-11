import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readAse} from '../tools/aseprite/asefile.mjs';
const files=fs.readdirSync('aseprite/skill').filter(f=>f.endsWith('.aseprite'));
assert.equal(files.length,42);const seen=new Set();for(const f of files){const a=readAse(`aseprite/skill/${f}`);assert.equal(a.w,32);assert.equal(a.frames.length,3);assert.deepEqual(a.layers,['background','emblem','sparkles']);assert.ok(fs.existsSync(`assets/skills/${f.replace('.aseprite','.png')}`));seen.add(Buffer.from(a.frames[0].rgba).toString('base64'));}assert.equal(seen.size,42);console.log('PASS: 42 unique layered Aseprite skills, three frames each, all exported');
