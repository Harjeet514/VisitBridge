import { medicationFields, renderScreen, screens } from './screens.js';
import { draftStatus, splash } from './ui.js';
import { mergeChanges, openDraftStore } from './draft-store.js';
import { availableUpdates } from './visit-updates.js';

const app = document.querySelector('#app');
const legacyStorageKey = 'visitbridge-demo-v1';
const requiredMedicationFields = Object.keys(medicationFields).filter(key => medicationFields[key].error);
const homeRoutes = { completed: 'visits-completed', followup: 'visits-followup', rescheduled: 'visits-rescheduled' };
const resumableRoutes = new Set([
  'assessment', 'assessment-saved', 'medication', 'editor', 'medication-review',
  'medication-saved', 'response', 'review', 'no-medication', 'review-no-med', 'no-answer', 'away',
]);

function initialState() {
  return {
    visitStatus: 'scheduled',
    assessment: {
      pain: '6',
      swelling: 'Similar to last visit',
      dressing: 'Dry and intact',
      note: 'More pain after this morning’s transfer. No new fall reported.',
    },
    medication: {
      name: '', dose: '', route: '', time: '11 Nov 2026 · 10:22 AM', reason: 'Right leg pain · 6/10 at rest',
    },
    medicationErrors: [],
    assessmentError: false,
    savedMedication: null,
    response: {
      patient: 'Robert reports pain 3/10 at rest.',
      symptoms: 'No new symptoms reported.',
      care: 'Dressing remains dry and intact.',
    },
    noDose: {
      outcome: 'No dose given',
      reason: 'Robert declined the offered pain medicine.',
      care: 'Dressing checked. Dry and intact.',
      response: 'Pain 4/10 at rest. No new symptoms reported.',
    },
    contact: {
      note: 'Waited at the entrance until 10:07 AM. Unable to confirm Robert’s location.',
      outcome: 'Patient reached by phone',
      availability: 'Robert is out with his daughter and expects to return by 2:00 PM.',
    },
    callLogged: false,
    editing: 'name',
    draft: '',
    entryDrafts: {},
    hasDraft: false,
    draftRoute: 'assessment',
    reviewedUpdates: { robert: false, helen: false, preview: false },
    selectedUpdate: 'robert',
    previewUpdate: false,
  };
}

function restoreState(saved) {
  const defaults = initialState();
  if (!saved || typeof saved !== 'object') return defaults;
  const result = { ...defaults };
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = saved[key];
    if (typeof value === typeof fallback && value !== null) result[key] = value;
  }
  for (const key of ['assessment', 'medication', 'response', 'noDose', 'contact', 'reviewedUpdates']) {
    result[key] = { ...defaults[key] };
    for (const [field, fallback] of Object.entries(defaults[key])) {
      if (typeof saved[key]?.[field] === typeof fallback) result[key][field] = saved[key][field];
    }
  }
  result.entryDrafts = Object.fromEntries(Object.entries(saved.entryDrafts ?? {}).filter(
    ([key, value]) => Object.hasOwn(medicationFields, key) && typeof value === 'string',
  ));
  result.medicationErrors = Array.isArray(saved.medicationErrors)
    ? saved.medicationErrors.filter(key => Object.hasOwn(medicationFields, key)) : [];
  result.savedMedication = saved.savedMedication && typeof saved.savedMedication === 'object'
    ? { ...defaults.medication, ...saved.savedMedication } : null;
  if (!Object.hasOwn(medicationFields, result.editing)) result.editing = 'name';
  if (!Object.hasOwn(screens, result.draftRoute)) result.draftRoute = 'assessment';
  if (!Object.hasOwn(homeRoutes, result.visitStatus) && result.visitStatus !== 'scheduled') result.visitStatus = 'scheduled';
  return result;
}

let store;
let savedRecord;
let storageError = false;
try {
  store = await openDraftStore();
  savedRecord = await store.read();
} catch {
  storageError = true;
}

let legacy;
if (!savedRecord) {
  try {
    legacy = JSON.parse(sessionStorage.getItem(legacyStorageKey));
  } catch {
    // A blocked or damaged legacy session does not prevent a fresh visit.
  }
}

let state = restoreState(savedRecord?.state ?? legacy);
if (legacy && !savedRecord && state.visitStatus !== 'completed') {
  state.hasDraft = Boolean(state.medication.name || state.draft || state.savedMedication);
  state.draftRoute = Object.hasOwn(screens, location.hash.slice(1)) ? location.hash.slice(1) : 'medication';
  if (state.draft) state.entryDrafts[state.editing] = state.draft;
}
let baseline = structuredClone(state);
let saveQueue = Promise.resolve();
let saveVersion = 0;
let saveFeedback = { kind: storageError ? 'error' : savedRecord ? 'saved' : 'ready', savedAt: savedRecord?.updatedAt ?? '' };
const restoringDraft = state.hasDraft && state.visitStatus !== 'completed';
let current = restoringDraft ? 'recover-draft' : getRoute();
let splashTimer;
let toast = '';
let toastTimer;

function updateSaveFeedback() {
  const status = app.querySelector('#draft-status');
  if (!status) return;
  const template = document.createElement('template');
  template.innerHTML = draftStatus(saveFeedback);
  const next = template.content.firstElementChild;
  status.className = next.className;
  status.replaceChildren(...next.childNodes);
}

function saveState({ reset = false } = {}) {
  const snapshot = structuredClone(state);
  const version = ++saveVersion;
  saveFeedback = { ...saveFeedback, kind: 'saving' };
  updateSaveFeedback();
  saveQueue = saveQueue.then(async () => {
    try {
      if (!store) store = await openDraftStore();
      const record = await store.write(snapshot, baseline, reset);
      baseline = snapshot;
      savedRecord = record;
      state = restoreState(mergeChanges(snapshot, state, record.state));
      try { sessionStorage.removeItem(legacyStorageKey); } catch { /* The durable save has succeeded. */ }
      if (version === saveVersion) saveFeedback = { kind: 'saved', savedAt: record.updatedAt };
    } catch {
      store = null;
      if (version === saveVersion) saveFeedback = { ...saveFeedback, kind: 'error' };
    }
    if (version === saveVersion) updateSaveFeedback();
  });
  return saveQueue;
}

function markDraft() {
  state.hasDraft = true;
  state.draftRoute = current;
}

function showToast(message) {
  toast = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast = '';
    app.querySelector('.visit-toast')?.remove();
  }, 7000);
}

function updatePreviewControl() {
  const preview = document.querySelector('#preview-update');
  preview.disabled = state.previewUpdate;
  preview.textContent = state.previewUpdate ? 'Schedule update received' : 'Preview schedule update';
}

function previewScheduleUpdate() {
  if (state.previewUpdate) return;
  state.previewUpdate = true;
  showToast('Visit time changed · Robert Hayes · Thu, 12 Nov');
  saveState();
  render({ preserveScroll: true });
}

function resumeDraft() {
  navigate(state.draftRoute, { replace: true });
}

function acknowledgeUpdate() {
  if (availableUpdates(state).some(update => update.id === state.selectedUpdate)) {
    state.reviewedUpdates[state.selectedUpdate] = true;
  }
  navigate('updates');
}

function getRoute() {
  const route = window.location.hash.slice(1);
  if (route === 'recover-draft' && !state.hasDraft) return 'home';
  return Object.hasOwn(screens, route) ? route : 'splash';
}

function render({ preserveScroll = false, focus = false } = {}) {
  clearTimeout(splashTimer);
  const scroll = preserveScroll ? app.querySelector('.screen-scroll')?.scrollTop : 0;
  app.dataset.route = current;
  const view = { ...saveFeedback, savedAt: saveFeedback.savedAt || savedRecord?.updatedAt, toast };
  app.innerHTML = current === 'splash' ? splash() : renderScreen(current, state, view);
  updatePreviewControl();
  if (scroll) app.querySelector('.screen-scroll').scrollTop = scroll;
  if (focus) app.querySelector(current === 'editor' ? '#entry-draft' : 'h1')?.focus({ preventScroll: true });
  if (current === 'splash') splashTimer = setTimeout(launch, 2800);
}

function navigate(route, { replace = false } = {}) {
  if (route !== 'splash' && !Object.hasOwn(screens, route)) return;
  current = route;
  if (state.hasDraft && resumableRoutes.has(route)) state.draftRoute = route;
  const url = new URL(window.location.href);
  url.hash = route === 'splash' ? '' : route;
  if (url.href !== window.location.href) {
    if (replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
  }
  saveState();
  render({ focus: true });
}

function launch() {
  if (current === 'splash') navigate(homeRoutes[state.visitStatus] || 'home', { replace: true });
}

function edit(key) {
  if (!Object.hasOwn(medicationFields, key)) return;
  state.editing = key;
  state.draft = state.entryDrafts[key] ?? state.medication[key];
  navigate('editor');
}

function showInlineError(input, invalid) {
  const errorId = `${input.id}-error`;
  const error = document.getElementById(errorId);
  if (error) error.hidden = !invalid;
  const descriptions = (input.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== errorId);
  if (invalid) descriptions.push(errorId);
  if (descriptions.length) input.setAttribute('aria-describedby', descriptions.join(' '));
  else input.removeAttribute('aria-describedby');
  if (invalid) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  input.classList.toggle('ontario-input__error', invalid);
}

function setDraft(value) {
  state.draft = value;
  state.entryDrafts[state.editing] = value;
  markDraft();
  showInlineError(document.querySelector('#entry-draft'), false);
  saveState();
}

function pressKey(key) {
  const input = document.querySelector('#entry-draft');
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  let value = start === 0 ? key : key.toLowerCase();
  if (key === 'Space') value = ' ';
  if (key === '’') value = "'";
  if (input.value.length - (end - start) + value.length > input.maxLength) return;
  input.setRangeText(value, start, end, 'end');
  setDraft(input.value);
  input.focus({ preventScroll: true });
}

function applyDraft() {
  const input = document.querySelector('#entry-draft');
  const draft = input.value.trim();
  if (!draft) {
    showInlineError(input, true);
    input.focus();
    return;
  }
  const { editing, medication } = state;
  if (editing === 'name' && draft !== medication.name) {
    medication.dose = '';
    medication.route = '';
  }
  medication[editing] = draft;
  delete state.entryDrafts[editing];
  state.draftRoute = 'medication';
  clearResolvedMedicationErrors();
  navigate('medication');
}

function clearResolvedMedicationErrors() {
  state.medicationErrors = state.medicationErrors.filter(key => !state.medication[key].trim());
}

function reviewMedication() {
  state.medicationErrors = requiredMedicationFields.filter(key => !state.medication[key].trim());
  if (state.medicationErrors.length) {
    saveState();
    render();
    document.querySelector('#medication-error-summary').focus();
    return;
  }
  navigate('medication-review');
}

function saveAssessment() {
  const pain = document.querySelector('#field-assessment-pain');
  if (!pain.validity.valid) {
    state.assessmentError = true;
    saveState();
    render({ preserveScroll: true });
    document.querySelector('#field-assessment-pain').focus();
    return;
  }
  state.assessmentError = false;
  markDraft();
  state.draftRoute = 'assessment-saved';
  if (/^Right leg pain · \d+\/10 at rest$/.test(state.medication.reason)) {
    state.medication.reason = `Right leg pain · ${state.assessment.pain}/10 at rest`;
  }
  navigate('assessment-saved');
}

function signVisit(noDose) {
  state.visitStatus = 'completed';
  state.hasDraft = false;
  state.entryDrafts = {};
  navigate(noDose ? 'complete-no-med' : 'complete');
}

const commands = {
  launch,
  'resume-draft': resumeDraft,
  'keep-draft': () => navigate(homeRoutes[state.visitStatus] || 'home'),
  'retry-save': () => saveState(),
  'acknowledge-update': acknowledgeUpdate,
  'save-assessment': saveAssessment,
  'use-order': () => {
    Object.assign(state.medication, { name: 'Acetaminophen', dose: '500 mg', route: 'By mouth (oral)' });
    for (const key of ['name', 'dose', 'route']) delete state.entryDrafts[key];
    markDraft();
    clearResolvedMedicationErrors();
    saveState();
    render({ preserveScroll: true });
    app.querySelector('[data-action="use-order"]').focus({ preventScroll: true });
  },
  'clear-entry': () => {
    const input = document.querySelector('#entry-draft');
    input.value = '';
    setDraft('');
    input.focus({ preventScroll: true });
  },
  'use-entry': applyDraft,
  'review-medication': reviewMedication,
  'save-medication': () => {
    state.savedMedication = { ...state.medication };
    navigate('medication-saved');
  },
  'sign-with-med': () => signVisit(false),
  'sign-no-med': () => signVisit(true),
  call: () => {
    state.callLogged = true;
    saveState();
    render({ preserveScroll: true });
    app.querySelector('[data-action="call"]').focus({ preventScroll: true });
  },
  'assign-follow-up': () => {
    state.visitStatus = 'followup';
    state.hasDraft = false;
    navigate('follow-up');
  },
  'confirm-reschedule': () => {
    state.visitStatus = 'rescheduled';
    state.hasDraft = false;
    navigate('rescheduled');
  },
};

app.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  event.preventDefault();
  const command = control.dataset.action;
  const separator = command.indexOf(':');
  const verb = separator < 0 ? command : command.slice(0, separator);
  const value = command.slice(separator + 1);
  if (verb === 'go') navigate(value);
  else if (verb === 'edit') edit(value);
  else if (verb === 'key') pressKey(value);
  else if (verb === 'open-update' && availableUpdates(state).some(update => update.id === value)) {
    state.selectedUpdate = value;
    navigate('update-details');
  }
  else if (verb === 'focus-field') document.getElementById(`field-medication-${value}`)?.focus();
  else if (Object.hasOwn(commands, verb)) commands[verb]();
});

app.addEventListener('input', event => {
  const { target } = event;
  if (target.id === 'entry-draft') {
    setDraft(target.value);
    return;
  }
  if (!target.dataset.field) return;
  const [section, key] = target.dataset.field.split('.');
  state[section][key] = target.value;
  markDraft();
  if (section === 'assessment' && key === 'pain' && state.assessmentError && target.validity.valid) {
    state.assessmentError = false;
    showInlineError(target, false);
  }
  saveState();
});

app.addEventListener('keydown', event => {
  if (current === 'editor' && event.key === 'Enter' && event.target.id === 'entry-draft') {
    event.preventDefault();
    applyDraft();
  }
});

document.querySelector('#restart-demo').addEventListener('click', async () => {
  state = initialState();
  toast = '';
  current = 'splash';
  history.replaceState(null, '', location.pathname + location.search);
  render({ focus: true });
  await saveState({ reset: true });
});
document.querySelector('#preview-update').addEventListener('click', previewScheduleUpdate);

function syncHistory() {
  const route = getRoute();
  if (route === current) return;
  current = route;
  render({ focus: true });
}

window.addEventListener('popstate', syncHistory);
window.addEventListener('hashchange', syncHistory);

function fitDevice() {
  const scale = Math.min(1, (window.innerHeight - 58) / 898, (window.innerWidth - 28) / 426);
  document.documentElement.style.setProperty('--frame-scale', Math.max(.35, scale));
}

window.addEventListener('resize', fitDevice);
fitDevice();
render();
if (legacy && !savedRecord) saveState();
