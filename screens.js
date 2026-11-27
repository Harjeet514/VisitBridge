import {
  action, avatar, badge, button, card, choice, detail, editField, escapeHtml, field,
  go, h, inlineError, intro, metricPair, note, p, patient, screen, svg, temporalField,
} from './ui.js';
import { availableUpdates, unreadUpdates, upcomingVisits } from './visit-updates.js';
import { displayClock, formatClock, formatDate, painLabel, visitTiming } from './care-record.js';

const patientId = '79 years · Visit VB-2076';
const patientAddress = '18 Maple Lane, Waterloo';
const nurse = 'Aisha Patel, RN';
const divider = '<hr class="divider">';
const join = (...blocks) => blocks.join('');
const nav = (route) => `go:${route}`;
const wrap = (html) => `<div class="inset">${html}</div>`;

export const medicationFields = {
  name: { label: 'Medication name', placeholder: 'Enter medication name', hint: 'Tap to type or change the name.', guidance: 'Enter the name as written on the medication order.', error: 'Enter the medication name.' },
  dose: { label: 'Dose given', placeholder: 'Enter dose', hint: 'Amount and unit', guidance: 'Enter the amount actually given and its unit, such as mg or mL.', error: 'Enter the dose given.' },
  route: { label: 'Route', placeholder: 'Enter route', hint: 'How it was given', guidance: 'Enter how the medication was given.', error: 'Enter how the medication was given.' },
  date: { label: 'Date given', placeholder: 'Select date', hint: 'Day, month, year', command: 'open-time', error: 'Select a valid administration date.' },
  clock: { label: 'Time given', placeholder: 'Select time', hint: '12-hour time', command: 'open-time', error: 'Select a valid administration time.' },
  reason: { label: 'Reason', optional: true, placeholder: 'Enter reason', hint: 'Document the reason for giving it.', guidance: 'Enter why the medication was given.' },
};

const visitStates = {
  scheduled: {
    label: 'Scheduled', description: 'Right leg fracture follow-up', meta: `${patientAddress} · VB-2076`,
    title: 'Visit focus', details: 'Assess pain and dressing. Review the fracture record and medication log.',
    time: '9:58', route: 'visit',
  },
  completed: {
    label: 'Completed', tone: 'success', time: '11:08',
    description: 'Right leg fracture follow-up · Signed at 11:08 AM',
    title: 'Signed care record', details: 'Assessment, visit outcome and follow-up plan filed under VB-2076.',
  },
  followup: {
    label: 'Follow-up pending', tone: 'attention', time: '10:08', route: 'follow-up',
    description: 'Unable to contact · Care not delivered', meta: 'Maya Chen · Review by 10:30 AM',
    title: 'Contact log', details: 'Side door at 10:02 AM · Phone at 10:05 AM',
  },
  rescheduled: {
    label: 'Rescheduled', tone: 'success', time: '10:09', route: 'visit', window: '2:30–3:45 PM',
    description: 'Robert confirmed the revised time by phone', meta: 'Morning visit closed · Patient away',
    title: 'Arrival instructions', details: `Use the side door at ${patientAddress}.`,
  },
};

function upcoming(state) {
  const appointments = upcomingVisits(state).map(visit => card(
    `<div class="date-box">${p(visit.day, 'h2')}${p('NOV', 'caption')}</div>
    <div class="appointment-copy">
      ${!state.reviewedUpdates[visit.id] ? badge(visit.previous ? 'Time changed' : 'New visit', 'attention') : ''}
      ${p(`${visit.weekday} · ${visit.time}`, 'update-date')}${p(visit.name, 'label')}${p(visit.purpose)}${p(`Home visit · ${visit.duration}`, 'caption')}
      <button type="button" class="link-button" data-action="open-update:${visit.id}">View visit update</button>
    </div>`,
    'surface', 'schedule-item',
  ));
  return `<section class="schedule"><h2 class="h2">Upcoming visits</h2>${appointments.join('')}</section>`;
}

function visits(mode, state) {
  const timing = visitTiming(state);
  const current = { ...visitStates[mode] };
  if (mode === 'completed') {
    current.description = `Right leg fracture follow-up · Signed at ${timing.complete}`;
    current.time = displayClock(timing.complete);
    current.window = timing.window;
  }
  const openCommand = mode === 'rescheduled' ? 'open-rescheduled' : nav(current.route);
  const patientSummary = `<div class="patient-row">${avatar()}<div class="patient-name">
    ${h('Robert Hayes')}${p(current.description)}
  </div>${current.route ? svg('chevron', 'chevron') : ''}</div>`;
  const cardContents = join(
    badge(current.label, current.tone),
    h(current.window || '10:00–11:15 AM', 'h2'),
    divider,
    patientSummary,
    current.meta ? p(current.meta, 'caption') : '',
    `<div class="detail">${p(current.title, 'label')}${p(current.details)}</div>`,
  );
  const today = current.route
    ? `<a class="card card--surface today-card" href="#${current.route}" data-action="${openCommand}">${cardContents}</a>`
    : card(cardContents, 'surface', 'today-card');
  return {
    title: mode === 'scheduled' ? 'VisitBridge' : 'Visits', time: current.time, brand: true,
    body: join(
      intro('Today', `Wed, 11 Nov · ${nurse}`),
      unreadUpdates(state).length ? `<section class="visit-update-banner"><div>${p(`${unreadUpdates(state).length} visit update${unreadUpdates(state).length === 1 ? "" : "s"}`, 'label')}${p('Review new and changed visits.')}</div><button type="button" class="link-button" data-action="go:updates">Review</button></section>` : '',
      state.hasDraft ? card(join(p('Saved visit · Robert Hayes', 'label'), p('Your unfinished entry is ready to resume.'), button(action('Resume draft', 'resume-draft', 'secondary'), 'button--compact')), 'surface', 'resume-card') : '',
      today, upcoming(state),
    ),
    actions: mode === 'scheduled' ? [go('Open Robert’s visit', 'visit')] : mode === 'rescheduled' ? [action('Open rescheduled visit', 'open-rescheduled')] : [],
  };
}

function updatesInbox(state) {
  const unread = unreadUpdates(state).length;
  const cards = [...availableUpdates(state)].reverse().map(update => {
    const reviewed = state.reviewedUpdates[update.id];
    return card(join(
      `<div class="update-heading">${badge(reviewed ? 'Reviewed' : 'Needs review', reviewed ? 'success' : 'attention')}${p(update.received, 'caption')}</div>`,
      h(update.label), p(update.name, 'label'), p(`${update.date} · ${update.time}`),
      update.previous ? p(`Previously ${update.previous}`, 'caption') : p(update.purpose, 'caption'),
      button(action('View update', `open-update:${update.id}`, 'secondary'), 'button--compact'),
    ), 'surface', `update-card${reviewed ? '' : ' update-card--unread'}`);
  });
  return {
    title: 'Visit updates', time: '9:58', back: 'home', updates: false,
    body: join(intro(unread ? `${unread} update${unread === 1 ? "" : "s"} to review` : 'All updates reviewed', 'New assignments and schedule changes from your care coordinator.'), ...cards),
    actions: [go('Back to today’s visits', 'home')],
  };
}

function updateDetails(state) {
  const update = availableUpdates(state).find(item => item.id === state.selectedUpdate) ?? availableUpdates(state)[0];
  const reviewed = state.reviewedUpdates[update.id];
  return {
    title: 'Visit update', time: '9:58', back: 'updates', updates: false,
    body: join(
      intro(update.label, `${update.name} · ${update.date}`),
      card(join(
        badge(reviewed ? 'Reviewed' : 'Needs review', reviewed ? 'success' : 'attention'),
        `<div class="time-change">${update.previous ? `<div>${p('Previous time', 'caption')}${p(update.previous, 'body previous-time')}</div>` : ''}<div>${p(update.previous ? 'Updated time' : 'Visit time', 'caption')}${p(update.time, 'new-time')}</div></div>`,
        divider, detail('Visit purpose', update.purpose), detail('Address', update.address), detail('Duration', update.duration),
      )),
      note(update.previous ? 'Reason for the change' : 'Assignment details', update.reason),
      card(join(detail('From', 'Maya Chen · Care coordinator'), detail('Received', update.received), p('Your upcoming visits already show this time. Review the update to confirm you have seen it.'))),
    ),
    actions: reviewed ? [go('Back to visit updates', 'updates')] : [action('Acknowledge update', 'acknowledge-update')],
  };
}

function recoveredDraft(state) {
  const draftLabel = state.draftRoute === 'medication-time' ? 'Administration date and time' : state.draftRoute === 'pain-score' ? 'Pain at rest after care' : state.draftRoute === 'editor' ? medicationFields[state.editing].label : 'Visit documentation';
  const value = state.draftRoute === 'medication-time' ? [formatDate(state.timeDraft.date), formatClock(state.timeDraft.clock)].filter(Boolean).join(' · ') || 'Date and time entry started' : state.draftRoute === 'pain-score' ? painLabel(state.painDraft) : state.draftRoute === 'editor' ? state.entryDrafts[state.editing] ?? state.draft : state.medication.name || 'Assessment and visit notes';
  return {
    title: 'Resume saved visit', time: '10:24', updates: false,
    body: join(
      intro('Your draft is ready', 'Continue your unfinished visit from where you left off.'),
      patient(patientId),
      card(join(badge('Unfinished visit', 'attention'), h(draftLabel), p(value || 'Entry started', 'body'), divider, detail('Visit', '11 Nov 2026 · Robert Hayes'), detail('Recorded by', nurse))),
      note('Saved on this device', 'Your entered text and visit details were kept when this page closed. Review the entry before saving the care record.'),
      p('Keeping it for later returns you to today’s visits. You can resume the draft from there.'),
    ),
    actions: [action('Resume draft', 'resume-draft'), action('Keep for later', 'keep-draft', 'secondary')],
  };
}

const xray = {
  followup: {
    view: 'xray', report: 'followup-report', date: '7 Nov 2026', views: '2 views', id: 'XR-263184',
    title: 'Follow-up X-ray', asset: 'followup-xray.jpg', figure: 3,
    context: 'Robert Hayes · 7 Nov 2026 · Right knee follow-up',
    impression: 'Alignment remains stable after surgical fixation of the right tibial plateau fracture.',
    history: 'Follow-up after plate and screw fixation of a displaced right tibial plateau fracture.',
    comparison: '31 Oct 2026 postoperative right knee X-ray.',
    findings: 'Plate and screws are in place. Fracture alignment is unchanged from the comparison study. No hardware complication is identified.',
    signer: 'Reported by Naomi Shah, MD · 7 Nov, 2:40 PM',
  },
  injury: {
    view: 'injury-xray', report: 'injury-report', date: '29 Oct 2026', views: '3 views', id: 'XR-262912',
    title: 'Injury X-ray', asset: 'injury-xray.jpg', figure: 1,
    context: 'Robert Hayes · 29 Oct 2026 · Initial right knee injury',
    impression: 'Displaced fracture of the lateral tibial plateau with depression of the joint surface.',
    history: 'Fall with right knee pain and swelling.',
    comparison: 'No prior study available.',
    findings: 'Fracture extends into the knee joint. Depression of the lateral joint surface and a knee joint effusion are present.',
    signer: 'Reported by Naomi Shah, MD · 29 Oct, 4:32 PM',
  },
};

const radiograph = (study) => `<img class="xray-large" src="./assets/${study.asset}" alt="${escapeHtml(study.title)}. Published reference image with front and side views of the right knee.">`;

function report(type) {
  const study = xray[type];
  const initial = type === 'injury';
  const reportHeader = `<div class="report-header">${badge('Final report', 'success')}${h('Right knee X-ray', 'h1')}
    ${p(`${study.date} · ${study.views} · ${study.id}`)}${p('Robert Hayes · DOB 17 Mar 1947', 'caption')}</div>`;
  const picture = `<section class="image-panel">
    ${p('X-ray images', 'label')}
    <button class="report-photo" type="button" aria-label="View full X-ray image" data-action="${nav(study.view)}">${radiograph(study)}</button>
    <button class="link-button" type="button" data-action="${nav(study.view)}">View full image</button>
    ${p('Reference views · AP and lateral', 'caption')}
  </section>`;
  return {
    title: 'X-ray report', time: '10:06', back: initial ? 'followup-report' : 'chart',
    body: card(join(reportHeader, divider, picture,
      note('Impression', study.impression, initial ? 'warning' : 'soft'),
      detail('Clinical history', study.history),
      detail('Comparison', study.comparison),
      detail('Findings', study.findings),
      divider,
      `<div class="report-signoff">${p(study.signer, 'caption')}${p('Cedarview Hospital · Diagnostic Imaging', 'caption')}</div>`,
    )),
    actions: initial ? [go('View latest follow-up report', 'followup-report')]
      : [go('View initial injury report', 'injury-report'), go('Back to fracture care', 'chart', 'secondary')],
  };
}

function imageViewer(type) {
  const study = xray[type];
  const reference = `https://pmc.ncbi.nlm.nih.gov/articles/PMC11847165/figure/FIG${study.figure}/`;
  const source = `<div class="image-source">
    ${p('Published reference radiograph', 'label')}
    <a class="caption" href="${reference}" target="_blank" rel="noopener noreferrer">Latip et al. · Cureus (2025) · Figure ${study.figure}</a>
    <a class="caption" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
  </div>`;
  return {
    title: 'X-ray images', time: '10:06', back: study.report, fullWidth: true,
    body: join(
      `<div class="xray-intro">${intro(study.title, 'Right knee · AP and lateral views')}</div>`,
      radiograph(study), wrap(note(`Linked report · ${study.id}`, study.context)), source,
    ),
    actions: [go('Back to report', study.report)],
  };
}

function visitDetails(state) {
  const timing = visitTiming(state);
  const revised = state.visitContext === 'rescheduled';
  return {
    title: 'Visit details', time: timing.detailsClock, back: 'home',
    body: join(
      patient(`79 years · ${revised ? 'Rescheduled' : 'Scheduled'} home visit`, `Visit VB-2076 · ${timing.window}`),
      card(join(h('Home address'), p(`${patientAddress}, ON`, 'body'), p('Entrance at the side door'))),
      card(join(
        h('Fracture follow-up'),
        detail('Referral', 'Post-discharge nursing visit', 'Cedarview Hospital · 2 Nov 2026'),
        divider,
        `<div class="visit-task-list">
          ${p('Visit tasks', 'label')}
          ${p('Review the latest X-rays, recovery notes and current medicines.')}
          ${p('Check pain, knee swelling, dressing and mobility.')}
          ${p('Document medication and the patient’s response if given.')}
        </div>`,
      )),
      note('Before care begins', 'Ask Robert to confirm his name and date of birth and agree to the home visit.'),
    ),
    actions: [go('Record arrival', 'arrival')],
  };
}

function arrival(state) {
  const timing = visitTiming(state);
  return {
    title: 'Arrival', time: displayClock(timing.arrival), back: 'visit',
    body: join(
      intro('Is Robert home?', `Wed, 11 Nov · ${nurse}`),
      patient(patientId),
      card(join(h('Arrival details'),
        detail('Home entrance', `Side door · ${patientAddress}`),
        detail('Visit window', `${timing.window} · Arrived at ${timing.arrival}`),
      ), 'soft'),
      choice('Patient is home', 'Robert is available in person. Confirm his identity and consent to begin care.', nav('identity'), { tone: 'soft', icon: 'home' }),
      choice('Patient unavailable', 'Log the contact attempt or reschedule if Robert confirms he is away.', nav('unavailable'), { tone: 'warning', icon: 'phone' }),
    ),
  };
}

function identity(state) {
  const timing = visitTiming(state);
  return {
    title: 'Confirm patient', time: displayClock(timing.identity), back: 'arrival',
    body: join(
      intro('Verify the patient', 'Ask Robert to state his name and date of birth. Confirm he agrees to today’s visit.'),
      patient(patientId),
      card(join(detail('Full name', 'Robert Hayes'), divider, detail('Date of birth', '17 March 1947'))),
      note('Visit consent', 'Confirm that Robert agrees to the home nursing visit and understands the planned care.'),
      note('Care to review with Robert', 'Review the fracture record and explain the pain and dressing checks before asking for consent.'),
      p(`Recording as ${nurse} · Visit VB-2076`, 'caption'),
    ),
    actions: [go('Confirm identity and consent', 'chart')],
  };
}

function fractureChart(state) {
  const timing = visitTiming(state);
  return {
    title: 'Fracture care', time: displayClock(timing.identity), back: 'identity',
    body: join(
      patient(patientId, `Identity and consent confirmed · ${timing.identity}`),
      card(join(
        h('Right tibial plateau fracture', 'h2'),
        p('Break at the top of the shinbone, near the knee. Surgically repaired on 30 Oct.'),
        divider, p('No weight on the right leg', 'label'), p('Orthopedic discharge order · 2 Nov', 'caption'),
      ), 'strong'),
      choice('X-ray reports', '7 Nov follow-up and 29 Oct injury report', nav('followup-report'), { icon: 'file' }),
      choice('Recovery history', '10 Nov visit · Pain 4/10 at rest', nav('history'), { icon: 'users' }),
      choice('Current medicines', 'Active orders and last recorded doses', nav('medicines'), { icon: 'shield' }),
    ),
    actions: [go('Record visit assessment', 'assessment')],
  };
}

function recoveryHistory() {
  return {
    title: 'Recovery history', time: '10:08', back: 'chart',
    body: join(
      intro('Fracture recovery', 'Robert Hayes · Right tibial plateau'),
      choice('10 Nov · Previous home visit', 'Pain 4/10 at rest · Dressing dry and intact', nav('prior-visit')),
      choice('7 Nov · Follow-up X-ray', 'Alignment maintained after surgical repair', nav('followup-report')),
      card(detail('2 Nov · Hospital discharge', 'Returned home with nursing follow-up', 'Right leg remains non-weight-bearing under the orthopedic order.')),
      card(detail('30 Oct · Surgical repair', 'Plate and screw fixation', 'Open reduction and internal fixation of the right tibial plateau.')),
      choice('29 Oct · Injury X-ray', 'Displaced fracture at the knee joint', nav('injury-report')),
    ),
    actions: [go('Open previous visit note', 'prior-visit')],
  };
}

function priorVisit() {
  return {
    title: 'Previous visit', time: '10:08', back: 'history',
    body: join(
      intro('10 November 2026', '10:05 AM · Leah Wilson, RN'),
      card(join(
        badge('Signed visit note', 'success'),
        detail('Pain at rest', '4/10', 'Reported by Robert'),
        detail('Right knee swelling', 'Mild swelling', 'Observed during the visit'),
        detail('Dressing', 'Dry and intact'),
        detail('Mobility', 'Transfer completed with one-person assistance and a walker.'),
      )),
      note('Next visit', 'Reassess pain, check the dressing and review the medication log.'),
    ),
    actions: [go('Record today’s assessment', 'assessment'), go('Back to recovery history', 'history', 'secondary')],
  };
}

function currentMedicines() {
  return {
    title: 'Current medicines', time: '10:09', back: 'chart',
    body: join(
      intro('Active medication orders', 'Robert Hayes · Cedarview Hospital discharge orders'),
      card(join(
        badge('As needed', 'attention'), h('Acetaminophen', 'h2'), p('500 mg · By mouth · For pain'),
        divider, detail('Last recorded dose', '11 Nov, 4:00 AM', '500 mg · Patient’s home medication log'),
        button(go('View pain medication order', 'order', 'secondary'), 'button--compact'),
      )),
      card(join(
        badge('Scheduled'), h('Enoxaparin', 'h2'), p('30 mg · Subcutaneous · Every 12 hours'),
        divider, detail('Last signed dose', '11 Nov, 8:00 AM', 'Leah Wilson, RN'),
        detail('Next scheduled dose', '11 Nov, 8:00 PM', 'Order ends 12 Nov after the 8:00 PM dose.'),
      )),
    ),
    actions: [go('Back to fracture care', 'chart')],
  };
}

function medicationOrder() {
  return {
    title: 'Medication order', time: '10:10', back: 'medicines',
    body: join(
      intro('Acetaminophen', 'Active order RX-2141 · Robert Hayes'),
      card(join(
        badge('Active order', 'success'),
        detail('Dose and route', '500 mg · By mouth'),
        detail('When prescribed', 'Every 6 hours as needed for pain'),
        detail('Maximum in 24 hours', '2,000 mg per the signed order'),
        detail('Prescriber', 'Nathan Cole, MD', 'Discharge order signed 2 Nov 2026'),
      )),
      card(join(h('Recent recorded doses'),
        detail('11 Nov, 4:00 AM', '500 mg · Home medication log'),
        detail('10 Nov, 9:30 PM', '500 mg · Home medication log'),
      )),
    ),
    actions: [go('Back to current medicines', 'medicines')],
  };
}

function assessment(state) {
  const timing = visitTiming(state);
  const entry = state.assessment;
  return {
    title: 'Visit assessment', time: displayClock(timing.assessment), back: 'chart',
    body: join(
      patient('Right tibial plateau fracture', `Assessment time · 11 Nov, ${timing.assessment}`),
      note('Previous visit · 10 Nov', 'Pain 4/10 at rest. Mild knee swelling. Dressing dry and intact.'),
      field('Pain at rest', 'assessment.pain', entry.pain, 'Reported by Robert', { number: true, error: state.assessmentError ? 'Enter a pain score from 0 to 10.' : '' }),
      field('Right knee swelling', 'assessment.swelling', entry.swelling, 'Observed today'),
      field('Dressing', 'assessment.dressing', entry.dressing, 'Observed today'),
      field('Patient report', 'assessment.note', entry.note, '', { multiline: true }),
    ),
    actions: [action('Save assessment', 'save-assessment')],
  };
}

function assessmentSaved(state) {
  const timing = visitTiming(state);
  const entry = state.assessment;
  const observation = entry.swelling === 'Similar to last visit'
    ? 'Right knee swelling looks similar to the previous visit.' : `Right knee swelling · ${entry.swelling}`;
  return {
    title: 'Assessment saved', time: displayClock(timing.assessmentSaved), back: 'assessment',
    body: join(
      intro('Pain and dressing', `11 Nov · Saved by ${nurse} at ${timing.assessmentSaved}`),
      metricPair(['4/10', '10 Nov · Previous visit'], [`${entry.pain}/10`, '11 Nov · Today at rest']),
      note(entry.dressing === 'Dry and intact' ? 'Dressing dry and intact' : `Dressing · ${entry.dressing}`, observation),
      card(join(p('Acetaminophen 500 mg by mouth', 'label'),
        p('Every 6 hours as needed for pain. Maximum 2,000 mg in 24 hours per order RX-2141.'),
        p('Last recorded dose · 500 mg at 4:00 AM today', 'caption'),
      ), 'soft'),
      p('Check the signed order and recent doses before giving medication.'),
      note('Reassessment during this visit', `${timing.response} · Record pain at rest, any new symptoms and the condition of the dressing.`),
    ),
    actions: [go('Record medication given', 'medication'), go('Continue without a dose', 'no-medication', 'secondary')],
  };
}

function recordMedication(state) {
  const timing = visitTiming(state);
  const errors = state.medicationErrors;
  const value = key => editField(key, medicationFields[key], key === 'date' ? formatDate(state.medication.date) : key === 'clock' ? formatClock(state.medication.clock) : state.medication[key], errors.includes(key) ? medicationFields[key].error : '');
  const errorSummary = errors.length ? `<section id="medication-error-summary" class="form-error-summary" role="alert" tabindex="-1" aria-labelledby="medication-error-title">
    <h2 id="medication-error-title" class="h3">Check the medication details</h2>
    <ul>${errors.map(key => `<li><a href="#field-medication-${key}" data-action="focus-field:${key}">${escapeHtml(medicationFields[key].error)}</a></li>`).join('')}</ul>
  </section>` : '';
  return {
    title: 'Record medication', time: timing.editorClock, back: 'assessment-saved',
    body: join(
      intro('Robert Hayes', `Visit VB-2076 · ${nurse}`),
      errorSummary,
      card(join(value('name'), button(action('Use Acetaminophen order', 'use-order', 'secondary'), 'button--compact'))),
      `<section class="form-fields">${h('Administration details')}
        <div class="two-columns">${value('dose')}${value('route')}</div>
        <div class="two-columns">${value('date')}${value('clock')}</div>${value('reason')}
      </section>`,
    ),
    actions: [action('Review medication entry', 'review-medication')],
  };
}

function medicationTime(state) {
  const timing = visitTiming(state);
  return {
    title: 'Administration time', time: timing.editorClock, back: 'medication',
    body: join(
      intro('When was it given?', 'Record when Robert received the medication.'),
      state.timeDraft.legacyText ? note('Previous time entry', state.timeDraft.legacyText) : '',
      temporalField('Date given', 'timeDraft.date', state.timeDraft.date, 'date', state.timeErrors.includes('date') ? 'Select a valid administration date.' : ''),
      temporalField('Time given', 'timeDraft.clock', state.timeDraft.clock, 'time', state.timeErrors.includes('clock') ? 'Select a valid administration time.' : ''),
      button(action('Clear date and time', 'clear-time', 'secondary'), 'button--compact'),
      p('Robert Hayes · Visit VB-2076', 'caption'),
    ),
    actions: [action('Use date and time', 'use-time')],
  };
}

function painScore(state) {
  const timing = visitTiming(state);
  const options = Array.from({ length: 11 }, (_,score) => `<label class="pain-option"><input type="radio" name="pain-score" value="${score}" aria-label="${score} out of 10"${state.painDraft === String(score) ? ' checked' : ''}><span aria-hidden="true">${score}</span></label>`).join('');
  return {
    title: 'Reassess pain', time: displayClock(timing.response), back: 'response',
    body: join(
      intro('Pain at rest', 'Ask Robert to choose the score that describes his pain now.'),
      card(join(p('Pain at rest after care', 'label'), `<output id="pain-draft-value" class="metric-value" aria-live="polite">${escapeHtml(painLabel(state.painDraft))}</output>`)),
      `<fieldset class="pain-fieldset"${state.painError ? ' aria-describedby="pain-score-error"' : ''}><legend class="ontario-label">Choose a score from 0 to 10</legend><div class="pain-options">${options}</div></fieldset>`,
      state.painError ? inlineError('pain-score', 'Choose a pain score from 0 to 10.', { announce: true }) : '',
      p('0 · No pain       10 · Worst pain', 'caption'),
      button(action('Clear selection', 'clear-pain', 'secondary'), 'button--compact'),
      p('The selected score is used in the response card and visit review.'),
    ),
    actions: [action('Use pain score', 'use-pain')],
  };
}

function keyboard() {
  const keys = [
    [...'1234567890'], [...'QWERTYUIOP'], [...'ASDFGHJKL'], [...'ZXCVBNM'], ['-', '/', 'Space', ':', '.', '’'],
  ];
  const key = value => `<button type="button" class="key${value === 'Space' ? ' key--space' : ''}" data-action="key:${escapeHtml(value)}">${escapeHtml(value)}</button>`;
  return `<div class="keyboard" aria-label="On-screen keyboard">${keys.map(row => `<div class="key-row">${row.map(key).join('')}</div>`).join('')}</div>`;
}

function editor(state) {
  const timing = visitTiming(state);
  const config = medicationFields[state.editing] || medicationFields.name;
  return {
    title: 'Edit entry', time: timing.editorClock, back: 'medication',
    body: join(
      intro(config.label, config.guidance),
      card(join(
        '<label class="ontario-label" for="entry-draft">Your entry</label>',
        inlineError('entry-draft', 'Enter a value.', { hidden: true, announce: true }),
        `<input id="entry-draft" class="ontario-input draft-input" type="text" inputmode="none" maxlength="180" value="${escapeHtml(state.draft)}" placeholder="Type below" autocomplete="off">`,
        button(action('Clear entry', 'clear-entry', 'secondary'), 'button--compact'),
      )),
      keyboard(), p('Robert Hayes · Home visit VB-2076', 'caption'),
    ),
    actions: [action('Use entry', 'use-entry')],
  };
}

function medicationReview(state) {
  const timing = visitTiming(state);
  const med = state.medication;
  return {
    title: 'Review medication', time: timing.medicationReviewClock, back: 'medication',
    body: join(
      patient(patientId),
      card(join(
        h(med.name), detail('Dose given', med.dose), detail('Route', med.route), detail('Given at', med.time),
        detail('Reason', med.reason), detail('Recorded by', nurse),
      )),
      note('Check before saving', 'Compare the medication, dose and route with the signed order. Confirm the time and reason match the care given.'),
    ),
    actions: [action('Save medication record', 'save-medication'), go('Edit entry', 'medication', 'secondary')],
  };
}

function recordedMedication(state) {
  const timing = visitTiming(state);
  const med = state.savedMedication || state.medication;
  return {
    title: 'Medication saved', time: timing.medicationSavedClock,
    body: join(
      card(join(badge('Saved', 'success'), h(med.name, 'h2'), p('Robert Hayes · Home visit VB-2076')), 'soft'),
      card(join(
        h('Administration record'),
        `<div class="two-columns">${detail('Dose given', med.dose)}${detail('Route', med.route)}</div>`,
        detail('Given at', med.time), detail('Recorded by', nurse),
      )),
      card(join(h('Follow-up assessment'),
        detail('Before medication', `Pain ${state.assessment.pain}/10 at rest`, `${timing.assessment} · Patient reported`),
        detail('Next check', timing.response, 'Record how Robert feels and any observed reaction.'),
      )),
    ),
    actions: [go('Record patient response', 'response')],
  };
}

const medicationSummary = state => {
  const med = state.savedMedication || state.medication;
  return [med.name, med.dose, med.route].filter(Boolean).join(' · ');
};

function response(state) {
  const timing = visitTiming(state);
  const entry = state.response;
  return {
    title: 'Response to care', time: displayClock(timing.response), back: 'medication-saved',
    body: join(
      intro('Pain reassessment', `11 Nov 2026 · ${timing.response}`),
      note('Medication recorded', medicationSummary(state)),
      metricPair([`${state.assessment.pain}/10`, `Before dose · ${timing.assessment}`], [painLabel(entry.pain), `After dose · ${timing.response}`]),
      editField('pain', { id: 'field-response-pain', label: 'Pain at rest after care', hint: 'Select a score from 0 to 10', placeholder: 'Choose a score', command: 'open-pain' }, painLabel(entry.pain), state.responseError ? 'Choose a pain score from 0 to 10.' : ''),
      field('Patient comments (optional)', 'response.patient', entry.patient, 'Use the patient’s own words.'),
      field('Other symptoms', 'response.symptoms', entry.symptoms, timing.response),
      field('Care check', 'response.care', entry.care, `Observed by ${nurse}`),
    ),
    actions: [action('Save response and review visit', 'save-response')],
  };
}

function noMedication(state) {
  const timing = visitTiming(state);
  const entry = state.noDose;
  return {
    title: 'No medication given', time: displayClock(timing.response), back: 'assessment-saved',
    body: join(
      intro('Record the outcome', 'Robert Hayes · Acetaminophen order RX-2141'),
      field('Medication outcome', 'noDose.outcome', entry.outcome, `Recorded at ${timing.medication}`),
      field('Reason', 'noDose.reason', entry.reason, 'Patient declined'),
      field('Care provided', 'noDose.care', entry.care, `Observed by ${nurse}`),
      field(`Response at ${timing.response}`, 'noDose.response', entry.response, 'Reported by Robert', { multiline: true }),
    ),
    actions: [go('Save outcome and review visit', 'review-no-med')],
  };
}

const plan = state => card(join(
  h('Follow-up plan'),
  detail('Next home visit', `12 Nov · ${upcomingVisits(state)[0].time}`, 'Recheck pain, dressing and mobility.'),
  divider,
  detail('Orthopedic appointment', '24 Nov · 1:30 PM', 'Cedarview Hospital orthopedic clinic.'),
));

function reviewVisit(state, noDose) {
  const timing = visitTiming(state);
  const med = state.savedMedication || state.medication;
  const assessment = state.assessment;
  const swelling = assessment.swelling === 'Similar to last visit' ? 'Knee swelling similar to the previous visit.' : `Knee swelling · ${assessment.swelling}.`;
  return {
    title: 'Review visit', time: displayClock(timing.review), back: noDose ? 'no-medication' : 'response',
    body: join(
      patient('Right leg fracture · VB-2076'),
      card(join(
        h('Visit summary'),
        detail('Arrival and consent', `Arrived ${timing.arrival}. Identity and consent confirmed at ${timing.identity}.`),
        detail('Fracture assessment', `Pain ${assessment.pain}/10 at rest. ${swelling} Dressing ${assessment.dressing.toLowerCase()}.`, `11 Nov, ${timing.assessment} · ${nurse}`),
        detail('Medication', noDose ? `${state.noDose.outcome}. ${state.noDose.reason}` : medicationSummary(state), noDose ? '' : `Given ${med.time}`),
        detail(`Response at ${timing.response}`, noDose ? state.noDose.response : `Pain ${painLabel(state.response.pain)} at rest. ${state.response.patient} ${state.response.symptoms}`),
      )),
      plan(state), p(`Signing as ${nurse}`, 'caption'),
    ),
    actions: [action('Sign and complete visit', noDose ? 'sign-no-med' : 'sign-with-med')],
  };
}

function completedVisit(state, noDose) {
  const timing = visitTiming(state);
  const med = state.savedMedication || state.medication;
  return {
    title: 'Visit complete', time: displayClock(timing.complete),
    body: join(
      card(join(
        badge('Signed', 'success'), h('Robert’s visit is complete', 'h1'),
        p(`11 Nov 2026 · ${timing.complete}`), p(`${nurse} · Visit VB-2076`),
      ), 'soft'),
      card(join(
        h('Fracture follow-up'), p('Pain and dressing assessed. Patient response recorded.'),
        detail('Medication record', noDose ? `${state.noDose.outcome} · ${state.noDose.reason}` : medicationSummary(state), noDose ? '' : `Given ${med.time}`),
      )),
      plan(state),
    ),
    actions: [go('Return to today’s visits', 'visits-completed')],
  };
}

function unavailable(state) {
  const timing = visitTiming(state);
  return {
    title: 'Patient unavailable', time: displayClock(timing.arrival), back: 'arrival',
    body: join(
      intro('Record the contact result', `Arrived at ${timing.arrival} · Robert Hayes`),
      card(join(
        h('Attempted home visit'),
        detail('Location', `${patientAddress} · Side door`),
        detail('Appointment', `${timing.window} · VB-2076`),
      ), 'soft'),
      card(join(
        choice('Call Robert Hayes', '(519) 555-0142 · Number on file', 'call', { icon: 'phone' }),
        p('Record whether you reached Robert and confirmed his availability.'),
      )),
      choice('No answer at the door or by phone', 'Log your attempts and request follow-up.', nav('no-answer'), { icon: 'phone' }),
      choice('Robert confirms he is away', 'Record the call and arrange a new visit time.', nav('away'), { icon: 'home' }),
      note('Visit status', state.callLogged ? `Phone attempt recorded at ${timing.contact} · Select the outcome.` : 'Arrival recorded · Contact outcome pending'),
    ),
  };
}

function noAnswer(state) {
  const timing = visitTiming(state);
  return {
    title: 'Record no answer', time: displayClock(timing.noAnswer), back: 'unavailable',
    body: join(
      intro('Unable to contact Robert', '11 Nov 2026 · Visit VB-2076'),
      card(join(
        detail(`${timing.arrival} · At the home`, 'No answer at the side door'),
        detail(`${timing.contact} · Phone call`, 'No answer at the number on file'),
      )),
      field('Visit note', 'contact.note', state.contact.note, nurse, { multiline: true }),
      note('Visit outcome', 'Care was not delivered. Record this visit for coordinator follow-up.', 'warning'),
      note('Coordinator follow-up', 'Send the visit note and contact attempts to Maya Chen, the care coordinator.'),
    ),
    actions: [action('Send to care coordinator', 'assign-follow-up')],
  };
}

function assignedFollowUp(state) {
  const timing = visitTiming(state);
  return {
    title: 'Follow-up assigned', time: displayClock(timing.followUp),
    body: join(
      card(join(h('Follow-up assigned', 'h1'), p('Robert Hayes · Visit VB-2076'), p(`Request sent at ${timing.followUp}`)), 'soft'),
      card(join(
        detail('Assigned to', 'Maya Chen · Care coordinator'),
        detail('Review by', timing.reviewBy, 'Confirm Robert’s availability and arrange the next visit.'),
        detail('Current status', 'Awaiting coordinator response'),
      )),
      card(join(p('Saved contact attempts', 'label'), p(`${timing.arrival} · Side door · No answer`), p(`${timing.contact} · Phone call · No answer`))),
      note('Visit recorded as unable to contact', 'No care or medication was given during this visit.'),
    ),
    actions: [go('Return to today’s visits', 'visits-followup')],
  };
}

function patientAway(state) {
  const timing = visitTiming(state);
  return {
    title: 'Patient confirmed away', time: displayClock(timing.noAnswer), back: 'unavailable',
    body: join(
      intro('Robert is away', `Phone contact confirmed · ${timing.contact}`),
      patient(patientId),
      field('Contact outcome', 'contact.outcome', state.contact.outcome, 'Confirmed by Robert Hayes'),
      field('Availability', 'contact.availability', state.contact.availability, 'Reported by Robert', { multiline: true }),
      note('Original visit outcome', 'Patient confirmed away. No care or medication was provided.', 'warning'),
      note('Same-day follow-up', 'Choose a visit time after Robert’s expected return at 2:00 PM.'),
    ),
    actions: [go('Find another visit time', 'reschedule')],
  };
}

function reschedule() {
  return {
    title: 'Reschedule visit', time: '10:08', back: 'away',
    body: join(
      intro('Confirm a new time', 'Robert Hayes · Fracture follow-up'),
      card(join(
        p('Wednesday, 11 November', 'caption'), h('2:30–3:45 PM', 'h2'),
        p(`${nurse} · 18 Maple Lane`), divider,
        detail('Availability', 'Robert agreed to the new time by phone at 10:08 AM.'),
      ), 'soft'),
      card(join(
        h('Visit plan'),
        detail('Care needed', 'Review the fracture record, reassess pain and check the dressing.'),
        detail('Home entrance', `Side door · ${patientAddress}`),
      )),
      card(detail('10:00–11:15 AM', 'Patient away · Care not delivered')),
    ),
    actions: [action('Confirm rescheduled visit', 'confirm-reschedule')],
  };
}

function rescheduled() {
  return {
    title: 'Visit rescheduled', time: '10:09',
    body: join(
      card(join(h('Visit moved to 2:30 PM', 'h1'), p('Wednesday, 11 November · 2:30–3:45 PM')), 'soft'),
      card(join(
        detail('Patient', 'Robert Hayes'), detail('Visiting nurse', nurse),
        detail('Visit focus', 'Right leg fracture follow-up'),
        detail('Original visit', 'Patient away · Care not delivered', 'Reschedule confirmed at 10:09 AM'),
      )),
      card(join(
        h('At the next visit'),
        detail('Home entrance', `Side door · ${patientAddress}`),
        detail('Care plan', 'Reassess pain and dressing, review recent doses and document any medication given.'),
        detail('Care record', 'Revised appointment linked to visit VB-2076.'),
      ), 'soft'),
    ),
    actions: [action('Open rescheduled visit', 'open-rescheduled'), go('Return to today’s visits', 'visits-rescheduled', 'secondary')],
  };
}

export const screens = {
  home: state => visits(state.visitStatus, state),
  updates: updatesInbox,
  'update-details': updateDetails,
  'recover-draft': recoveredDraft,
  visit: visitDetails,
  arrival,
  identity,
  chart: fractureChart,
  'followup-report': () => report('followup'),
  'injury-report': () => report('injury'),
  history: recoveryHistory,
  'prior-visit': priorVisit,
  medicines: currentMedicines,
  order: medicationOrder,
  assessment,
  'assessment-saved': assessmentSaved,
  medication: recordMedication,
  'medication-time': medicationTime,
  'pain-score': painScore,
  editor,
  'medication-review': medicationReview,
  'medication-saved': recordedMedication,
  response,
  review: state => reviewVisit(state, false),
  complete: state => completedVisit(state, false),
  'no-medication': noMedication,
  'review-no-med': state => reviewVisit(state, true),
  'complete-no-med': state => completedVisit(state, true),
  unavailable,
  'no-answer': noAnswer,
  'follow-up': assignedFollowUp,
  away: patientAway,
  reschedule,
  rescheduled,
  'visits-completed': state => visits('completed', state),
  'visits-followup': state => visits('followup', state),
  'visits-rescheduled': state => visits('rescheduled', state),
  xray: () => imageViewer('followup'),
  'injury-xray': () => imageViewer('injury'),
};

const draftScreens = new Set(['assessment', 'medication', 'medication-time', 'pain-score', 'editor', 'response', 'no-medication', 'no-answer', 'away', 'recover-draft']);

export function renderScreen(route, state, feedback) {
  return screen({
    ...screens[route](state),
    saveFeedback: draftScreens.has(route) ? feedback : null,
    unread: unreadUpdates(state).length,
    toast: feedback.toast,
  });
}
