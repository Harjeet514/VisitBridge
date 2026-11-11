import {
  action, avatar, badge, button, card, choice, detail, editField, escapeHtml, field,
  go, h, inlineError, intro, metricPair, note, p, patient, screen, svg,
} from './ui.js';

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
  time: { label: 'Given at', placeholder: 'Enter date and time', hint: 'Administration date and time', guidance: 'Enter the date and time the medication was given.', error: 'Enter the date and time given.' },
  reason: { label: 'Reason', optional: true, placeholder: 'Enter reason', hint: 'Document the reason for giving it.', guidance: 'Enter why the medication was given.' },
};

const schedule = [
  { day: '12', time: 'Thu · 10:00–11:15 AM', name: 'Robert Hayes', purpose: 'Fracture reassessment', duration: '75 min' },
  { day: '13', time: 'Fri · 9:30–10:15 AM', name: 'Helen Walsh', purpose: 'Dressing review', duration: '45 min' },
];

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
    label: 'Rescheduled', tone: 'success', time: '10:09', route: 'rescheduled', window: '2:30–3:45 PM',
    description: 'Robert confirmed the revised time by phone', meta: 'Morning visit closed · Patient away',
    title: 'Arrival instructions', details: `Use the side door at ${patientAddress}.`,
  },
};

function upcoming() {
  const appointments = schedule.map(visit => card(
    `<div class="date-box">${p(visit.day, 'h2')}${p('NOV', 'caption')}</div>
    <div class="appointment-copy">
      ${p(visit.time, 'caption')}${p(visit.name, 'label')}${p(visit.purpose)}${p(`Home visit · ${visit.duration}`, 'caption')}
    </div>`,
    'surface', 'schedule-item',
  ));
  return `<section class="schedule"><h2 class="h2">Upcoming visits</h2>${appointments.join('')}</section>`;
}

function visits(mode) {
  const current = visitStates[mode];
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
    ? `<a class="card card--surface today-card" href="#${current.route}" data-action="${nav(current.route)}">${cardContents}</a>`
    : card(cardContents, 'surface', 'today-card');
  return {
    title: mode === 'scheduled' ? 'VisitBridge' : 'Visits', time: current.time, brand: true,
    body: join(intro('Today', `Wed, 11 Nov · ${nurse}`), today, upcoming()),
    actions: mode === 'scheduled' ? [go('Open Robert’s visit', 'visit')] : [],
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
  const revised = state.visitStatus === 'rescheduled';
  return {
    title: 'Visit details', time: '9:58', back: 'home',
    body: join(
      patient('79 years · Scheduled home visit', `Visit VB-2076 · ${revised ? '2:30–3:45 PM' : '10:00–11:15 AM'}`),
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

function arrival() {
  return {
    title: 'Arrival', time: '10:02', back: 'visit',
    body: join(
      intro('Is Robert home?', `Wed, 11 Nov · ${nurse}`),
      patient(patientId),
      card(join(h('Arrival details'),
        detail('Home entrance', `Side door · ${patientAddress}`),
        detail('Visit window', '10:00–11:15 AM · Arrived at 10:02 AM'),
      ), 'soft'),
      choice('Patient is home', 'Robert is available in person. Confirm his identity and consent to begin care.', nav('identity'), { tone: 'soft', icon: 'home' }),
      choice('Patient unavailable', 'Log the contact attempt or reschedule if Robert confirms he is away.', nav('unavailable'), { tone: 'warning', icon: 'phone' }),
    ),
  };
}

function identity() {
  return {
    title: 'Confirm patient', time: '10:04', back: 'arrival',
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

function fractureChart() {
  return {
    title: 'Fracture care', time: '10:04', back: 'identity',
    body: join(
      patient(patientId, 'Identity and consent confirmed · 10:04 AM'),
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
  const entry = state.assessment;
  return {
    title: 'Visit assessment', time: '10:12', back: 'chart',
    body: join(
      patient('Right tibial plateau fracture', 'Assessment time · 11 Nov, 10:12 AM'),
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
  const entry = state.assessment;
  const observation = entry.swelling === 'Similar to last visit'
    ? 'Right knee swelling looks similar to the previous visit.' : `Right knee swelling · ${entry.swelling}`;
  return {
    title: 'Assessment saved', time: '10:16', back: 'assessment',
    body: join(
      intro('Pain and dressing', `11 Nov · Saved by ${nurse} at 10:16 AM`),
      metricPair(['4/10', '10 Nov · Previous visit'], [`${entry.pain}/10`, '11 Nov · Today at rest']),
      note(entry.dressing === 'Dry and intact' ? 'Dressing dry and intact' : `Dressing · ${entry.dressing}`, observation),
      card(join(p('Acetaminophen 500 mg by mouth', 'label'),
        p('Every 6 hours as needed for pain. Maximum 2,000 mg in 24 hours per order RX-2141.'),
        p('Last recorded dose · 500 mg at 4:00 AM today', 'caption'),
      ), 'soft'),
      p('Check the signed order and recent doses before giving medication.'),
      note('Reassessment during this visit', '11:00 AM · Record pain at rest, any new symptoms and the condition of the dressing.'),
    ),
    actions: [go('Record medication given', 'medication'), go('Continue without a dose', 'no-medication', 'secondary')],
  };
}

function recordMedication(state) {
  const errors = state.medicationErrors;
  const value = key => editField(key, medicationFields[key], state.medication[key], errors.includes(key) ? medicationFields[key].error : '');
  const errorSummary = errors.length ? `<section id="medication-error-summary" class="form-error-summary" role="alert" tabindex="-1" aria-labelledby="medication-error-title">
    <h2 id="medication-error-title" class="h3">Check the medication details</h2>
    <ul>${errors.map(key => `<li><a href="#field-medication-${key}" data-action="focus-field:${key}">${escapeHtml(medicationFields[key].error)}</a></li>`).join('')}</ul>
  </section>` : '';
  return {
    title: 'Record medication', time: '10:24', back: 'assessment-saved',
    body: join(
      intro('Robert Hayes', `Visit VB-2076 · ${nurse}`),
      errorSummary,
      card(join(value('name'), button(action('Use Acetaminophen order', 'use-order', 'secondary'), 'button--compact'))),
      `<section class="form-fields">${h('Administration details')}
        <div class="two-columns">${value('dose')}${value('route')}</div>
        ${value('time')}${value('reason')}
      </section>`,
    ),
    actions: [action('Review medication entry', 'review-medication')],
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
  const config = medicationFields[state.editing] || medicationFields.name;
  return {
    title: 'Edit entry', time: '10:24', back: 'medication',
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
  const med = state.medication;
  return {
    title: 'Review medication', time: '10:25', back: 'medication',
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
  const med = state.savedMedication || state.medication;
  return {
    title: 'Medication saved', time: '10:26',
    body: join(
      card(join(badge('Saved', 'success'), h(med.name, 'h2'), p('Robert Hayes · Home visit VB-2076')), 'soft'),
      card(join(
        h('Administration record'),
        `<div class="two-columns">${detail('Dose given', med.dose)}${detail('Route', med.route)}</div>`,
        detail('Given at', med.time), detail('Recorded by', nurse),
      )),
      card(join(h('Follow-up assessment'),
        detail('Before medication', `Pain ${state.assessment.pain}/10 at rest`, '10:12 AM · Patient reported'),
        detail('Next check', '11:00 AM', 'Record how Robert feels and any observed reaction.'),
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
  const entry = state.response;
  return {
    title: 'Response to care', time: '11:00', back: 'medication-saved',
    body: join(
      intro('Pain reassessment', '11 Nov 2026 · 11:00 AM'),
      note('Medication recorded', medicationSummary(state)),
      metricPair([`${state.assessment.pain}/10`, 'Before dose · 10:12 AM'], ['3/10', 'After dose · 11:00 AM']),
      field('Patient response', 'response.patient', entry.patient, 'Reported by Robert'),
      field('Other symptoms', 'response.symptoms', entry.symptoms, '11:00 AM'),
      field('Care check', 'response.care', entry.care, `Observed by ${nurse}`),
    ),
    actions: [go('Save response and review visit', 'review')],
  };
}

function noMedication(state) {
  const entry = state.noDose;
  return {
    title: 'No medication given', time: '11:00', back: 'assessment-saved',
    body: join(
      intro('Record the outcome', 'Robert Hayes · Acetaminophen order RX-2141'),
      field('Medication outcome', 'noDose.outcome', entry.outcome, 'Recorded at 10:22 AM'),
      field('Reason', 'noDose.reason', entry.reason, 'Patient declined'),
      field('Care provided', 'noDose.care', entry.care, `Observed by ${nurse}`),
      field('Response at 11:00 AM', 'noDose.response', entry.response, 'Reported by Robert', { multiline: true }),
    ),
    actions: [go('Save outcome and review visit', 'review-no-med')],
  };
}

const plan = () => card(join(
  h('Follow-up plan'),
  detail('Next home visit', '12 Nov · 10:00 AM', 'Recheck pain, dressing and mobility.'),
  divider,
  detail('Orthopedic appointment', '24 Nov · 1:30 PM', 'Cedarview Hospital orthopedic clinic.'),
));

function reviewVisit(state, noDose) {
  const med = state.savedMedication || state.medication;
  const assessment = state.assessment;
  const swelling = assessment.swelling === 'Similar to last visit' ? 'Knee swelling similar to the previous visit.' : `Knee swelling · ${assessment.swelling}.`;
  return {
    title: 'Review visit', time: '11:05', back: noDose ? 'no-medication' : 'response',
    body: join(
      patient('Right leg fracture · VB-2076'),
      card(join(
        h('Visit summary'),
        detail('Arrival and consent', 'Arrived 10:02 AM. Identity and consent confirmed at 10:04 AM.'),
        detail('Fracture assessment', `Pain ${assessment.pain}/10 at rest. ${swelling} Dressing ${assessment.dressing.toLowerCase()}.`, `11 Nov, 10:12 AM · ${nurse}`),
        detail('Medication', noDose ? `${state.noDose.outcome}. ${state.noDose.reason}` : medicationSummary(state), noDose ? '' : `Given ${med.time}`),
        detail('Response at 11:00 AM', noDose ? state.noDose.response : `${state.response.patient} ${state.response.symptoms}`),
      )),
      plan(), p(`Signing as ${nurse}`, 'caption'),
    ),
    actions: [action('Sign and complete visit', noDose ? 'sign-no-med' : 'sign-with-med')],
  };
}

function completedVisit(state, noDose) {
  const med = state.savedMedication || state.medication;
  return {
    title: 'Visit complete', time: '11:08',
    body: join(
      card(join(
        badge('Signed', 'success'), h('Robert’s visit is complete', 'h1'),
        p('11 Nov 2026 · 11:08 AM'), p(`${nurse} · Visit VB-2076`),
      ), 'soft'),
      card(join(
        h('Fracture follow-up'), p('Pain and dressing assessed. Patient response recorded.'),
        detail('Medication record', noDose ? `${state.noDose.outcome} · ${state.noDose.reason}` : medicationSummary(state), noDose ? '' : `Given ${med.time}`),
      )),
      plan(),
    ),
    actions: [go('Return to today’s visits', 'visits-completed')],
  };
}

function unavailable(state) {
  return {
    title: 'Patient unavailable', time: '10:03', back: 'arrival',
    body: join(
      intro('Record the contact result', 'Arrived at 10:02 AM · Robert Hayes'),
      card(join(
        h('Attempted home visit'),
        detail('Location', `${patientAddress} · Side door`),
        detail('Appointment', '10:00–11:15 AM · VB-2076'),
      ), 'soft'),
      card(join(
        choice('Call Robert Hayes', '(519) 555-0142 · Number on file', 'call', { icon: 'phone' }),
        p('Record whether you reached Robert and confirmed his availability.'),
      )),
      choice('No answer at the door or by phone', 'Log your attempts and request follow-up.', nav('no-answer'), { icon: 'phone' }),
      choice('Robert confirms he is away', 'Record the call and arrange a new visit time.', nav('away'), { icon: 'home' }),
      note('Visit status', state.callLogged ? 'Phone attempt recorded at 10:05 AM · Select the outcome.' : 'Arrival recorded · Contact outcome pending'),
    ),
  };
}

function noAnswer(state) {
  return {
    title: 'Record no answer', time: '10:07', back: 'unavailable',
    body: join(
      intro('Unable to contact Robert', '11 Nov 2026 · Visit VB-2076'),
      card(join(
        detail('10:02 AM · At the home', 'No answer at the side door'),
        detail('10:05 AM · Phone call', 'No answer at the number on file'),
      )),
      field('Visit note', 'contact.note', state.contact.note, nurse, { multiline: true }),
      note('Visit outcome', 'Care was not delivered. Record this visit for coordinator follow-up.', 'warning'),
      note('Coordinator follow-up', 'Send the visit note and contact attempts to Maya Chen, the care coordinator.'),
    ),
    actions: [action('Send to care coordinator', 'assign-follow-up')],
  };
}

function assignedFollowUp() {
  return {
    title: 'Follow-up assigned', time: '10:08',
    body: join(
      card(join(h('Follow-up assigned', 'h1'), p('Robert Hayes · Visit VB-2076'), p('Request sent at 10:08 AM')), 'soft'),
      card(join(
        detail('Assigned to', 'Maya Chen · Care coordinator'),
        detail('Review by', '10:30 AM', 'Confirm Robert’s availability and arrange the next visit.'),
        detail('Current status', 'Awaiting coordinator response'),
      )),
      card(join(p('Saved contact attempts', 'label'), p('10:02 AM · Side door · No answer'), p('10:05 AM · Phone call · No answer'))),
      note('Visit recorded as unable to contact', 'No care or medication was given during this visit.'),
    ),
    actions: [go('Return to today’s visits', 'visits-followup')],
  };
}

function patientAway(state) {
  return {
    title: 'Patient confirmed away', time: '10:07', back: 'unavailable',
    body: join(
      intro('Robert is away', 'Phone contact confirmed · 10:05 AM'),
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
    actions: [go('Return to today’s visits', 'visits-rescheduled')],
  };
}

export const screens = {
  home: () => visits('scheduled'),
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
  'visits-completed': () => visits('completed'),
  'visits-followup': () => visits('followup'),
  'visits-rescheduled': () => visits('rescheduled'),
  xray: () => imageViewer('followup'),
  'injury-xray': () => imageViewer('injury'),
};

export function renderScreen(route, state) {
  return screen(screens[route](state));
}
