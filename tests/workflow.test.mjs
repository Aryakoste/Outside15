import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runObservation } from '../scripts/observation-workflow.mjs';
const input={note:'The gate is open with no steps.',amenity:'entrance'};
const draft={amenity:'entrance',status:'usable',step_free:'yes',shade:'unknown',summary:'Open entrance without steps observed.',evidence:input.note,model:'test-double',latency_ms:1,source:'live',inference:{}};
test('validated draft reaches human review without becoming a confirmed report',async()=>{
 const result=await runObservation(input,async()=>draft);
 assert.equal(result.workflow.engine,'Mastra');assert.equal(result.workflow.attempts,1);
 assert.equal(result.workflow.human_review_required,true);assert.equal(result.confirmed,undefined);
 assert.deepEqual(result.workflow.events.map(e=>e.outcome),['validated','ready']);
});
test('fabricated evidence is rejected and retried once',async()=>{
 let calls=0;const result=await runObservation(input,async()=>++calls===1?{...draft,evidence:'This entire park is accessible.'}:draft);
 assert.equal(calls,2);assert.equal(result.workflow.attempts,2);
 assert.deepEqual(result.workflow.events.map(e=>e.outcome),['rejected','validated','ready']);
});
test('repeated invalid evidence fails closed after two attempts',async()=>{
 let calls=0;await assert.rejects(runObservation(input,async()=>{calls++;return {...draft,evidence:'Invented observation here.'}}),/manual entry/);assert.equal(calls,2);
});
test('oversized input never reaches the model',async()=>{
 let calls=0;await assert.rejects(runObservation({...input,note:'x'.repeat(1201)},async()=>{calls++;return draft}));assert.equal(calls,0);
});
