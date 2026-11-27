import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const source = existsSync(new URL('../dist/care-record.js', import.meta.url)) ? '../dist/' : '../';
const care = await import(new URL(`${source}care-record.js`, import.meta.url));
const { screens } = await import(new URL(`${source}screens.js`, import.meta.url));
const example = () => ({
  visitStatus: 'scheduled', visitContext: 'morning', hasDraft: false,
  reviewedUpdates: { robert: false, helen: false, preview: false }, previewUpdate: false,
  medication: { name: 'Acetaminophen', dose: '500 mg', route: 'By mouth', date: '2026-11-11', clock: '10:22', time: '11 Nov 2026 · 10:22 AM', reason: 'Right leg pain' },
  savedMedication: null, medicationErrors: [], responseError: false,
  response: { pain: '5', patient: 'Discomfort during transfers.', symptoms: 'No new symptoms reported.', care: 'Dressing dry and intact.' },
  assessment: { pain: '6', swelling: 'Similar to last visit', dressing: 'Dry and intact', note: '' },
  timeDraft: { date: '2026-11-11', clock: '10:22', legacyText: '' }, timeErrors: [], painDraft: '5', painError: false,
  noDose: { outcome: 'No dose given', reason: 'Patient declined', care: '', response: 'Pain 4/10 at rest.' },
  contact: { note: '', availability: '', outcome: '' },
});

test('administration dates reject impossible dates and arbitrary text', () => {
  for (const value of ['', 'not a date', '2026-02-29', '2026-04-31', '2026-13-01', '0000-01-01']) assert.equal(care.validDate(value), false, value);
  for (const value of ['2026-11-11', '2028-02-29', '2000-02-29']) assert.equal(care.validDate(value), true, value);
});

test('administration time validates every field and handles noon and midnight', () => {
  for (const value of ['', 'not a date', '24:00', '10:60', '1:05', '10:22:30']) assert.equal(care.validClock(value), false, value);
  assert.equal(care.medicationTimestamp('2026-11-11', '14:52'), '11 Nov 2026 · 2:52 PM');
  assert.equal(care.medicationTimestamp('2026-02-29', '14:52'), '');
  assert.equal(care.formatClock('00:00'), '12:00 AM');
  assert.equal(care.formatClock('12:00'), '12:00 PM');
  assert.deepEqual(care.medicationErrors({ ...example().medication, date: '', clock: '', time: 'not a date' }), ['date', 'clock']);
});

test('existing medication and response drafts migrate without dropping comments', () => {
  assert.deepEqual(care.parseLegacyTime('11 Nov 2026 · 10:22 AM'), { date: '2026-11-11', clock: '10:22' });
  assert.deepEqual(care.parseLegacyTime('11 Nov 2026 · 2:52 PM'), { date: '2026-11-11', clock: '14:52' });
  assert.deepEqual(care.parseLegacyTime('31 Feb 2026 · 10:22 AM'), { date: '', clock: '' });
  const med = care.normalizeMedication({ name: 'Acetaminophen', time: '11 Nov 2026 · 2:52 PM' });
  assert.equal(med.name, 'Acetaminophen'); assert.equal(med.clock, '14:52');
  const response = care.migrateResponse({ patient: 'Robert reports pain 3/10 at rest. Discomfort during transfers.', care: 'Dressing dry.' });
  assert.equal(response.pain, '3'); assert.equal(response.patient, 'Discomfort during transfers.'); assert.equal(response.care, 'Dressing dry.');
});

test('pain accepts the full 0–10 scale and rejects invalid scores', () => {
  for (const value of ['0', '5', '10']) assert.equal(care.validPain(value), true);
  for (const value of ['', '-1', '11', '5.5', 'five', ' 5 ']) assert.equal(care.validPain(value), false);
  assert.equal(care.painLabel('0'), '0/10'); assert.equal(care.painLabel(''), 'Not recorded');
});

test('response and review use the same selected pain score', () => {
  const state = example();
  assert.equal((screens.response(state).body.match(/5\/10/g) || []).length, 2);
  assert.match(screens.review(state).body, /Pain 5\/10 at rest/);
  assert.doesNotMatch(screens.response(state).body, /3\/10/);
  state.response.pain = '0'; assert.match(screens.review(state).body, /Pain 0\/10 at rest/);
});

test('medication date and time open structured controls', () => {
  const state = example();
  assert.equal((screens.medication(state).body.match(/data-action="open-time"/g) || []).length, 2);
  assert.match(screens['medication-time'](state).body, /type="date"/);
  assert.match(screens['medication-time'](state).body, /type="time"/);
  assert.doesNotMatch(screens.medication(state).body, /edit:time/);
});

test('rescheduled Home and confirmation offer an entry to care', () => {
  const state = { ...example(), visitStatus: 'rescheduled' };
  assert.match(screens['visits-rescheduled'](state).body, /data-action="open-rescheduled"/);
  assert.equal(screens['visits-rescheduled'](state).actions[0].command, 'open-rescheduled');
  assert.equal(screens.rescheduled(state).actions[0].command, 'open-rescheduled');
});

test('the afternoon time context persists from arrival through completed schedule', () => {
  const state = { ...example(), visitContext: 'rescheduled', visitStatus: 'rescheduled' };
  assert.match(screens.arrival(state).body, /2:30–3:45 PM · Arrived at 2:32 PM/);
  assert.match(screens.chart(state).body, /confirmed · 2:34 PM/);
  assert.match(screens.assessment(state).body, /2:42 PM/);
  assert.match(screens.response(state).body, /3:15 PM/);
  assert.match(screens.review(state).body, /Arrived 2:32 PM/);
  assert.match(screens.complete(state).body, /3:38 PM/);
  state.visitStatus = 'completed';
  assert.match(screens['visits-completed'](state).body, /Signed at 3:38 PM/);
  assert.match(screens['visits-completed'](state).body, /2:30–3:45 PM/);
});
