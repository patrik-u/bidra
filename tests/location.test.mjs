import {readFile} from 'node:fs/promises';
import {locationAreas,contains} from '../src/lib/locationAreas.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
test('location levels resolve Gråbo, Lerum and Västra Götaland from local datasets',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
 try{const areas=await locationAreas([12.30,57.84]);assert.ok(areas.some(a=>a.name==='Västra Götalands län'));assert.ok(areas.some(a=>a.name==='Lerum kommun'));assert.ok(areas.some(a=>a.name==='Nära Gråbo'));assert.ok(areas[0].bounds);assert.equal(areas.at(-1).zoom,13)}finally{globalThis.fetch=original}
});
test('polygon holes and outside positions are excluded',()=>{
 const geometry={type:'Polygon',coordinates:[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]};assert.equal(contains([2,2],geometry),true);assert.equal(contains([5,5],geometry),false);assert.equal(contains([20,20],geometry),false)
});
