import { medicationFields, renderScreen, screens } from './screens.js';
import { splash } from './ui.js';

const app = document.querySelector('#app');
const storageKey = 'visitbridge-demo-v1';
const requiredMedicationFields = ['name', 'dose', 'route', 'time'];
const homeRoutes = { completed: 'visits-completed', followup: 'visits-followup', rescheduled: 'visits-rescheduled' };

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
  };
}

function loadState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && typeof saved === 'object') return { ...initialState(), ...saved };
  } catch {
    // Storage can be unavailable in a restricted browser.
  }
  return initialState();
}

function saveState() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The current session still works with its in-memory state.
  }
}

function getRoute() {
  const route = window.location.hash.slice(1);
  return Object.hasOwn(screens, route) ? route : 'splash';
}

let state = loadState();
let current = getRoute();
let splashTimer;

function render({ preserveScroll = false, focus = false } = {}) {
  clearTimeout(splashTimer);
  const scroll = preserveScroll ? app.querySelector('.screen-scroll')?.scrollTop : 0;
  app.dataset.route = current;
  app.innerHTML = current === 'splash' ? splash() : renderScreen(current, state);
  if (scroll) app.querySelector('.screen-scroll').scrollTop = scroll;
  if (focus) app.querySelector(current === 'editor' ? '#entry-draft' : 'h1')?.focus({ preventScroll: true });
  if (current === 'splash') splashTimer = setTimeout(launch, 2800);
}

function navigate(route, { replace = false } = {}) {
  if (route !== 'splash' && !Object.hasOwn(screens, route)) return;
  current = route;
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
  state.draft = state.medication[key];
  navigate('editor');
}

function setDraft(value) {
  state.draft = value;
  const error = document.querySelector('#draft-error');
  if (error) error.hidden = true;
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
    document.querySelector('#draft-error').hidden = false;
    input.focus();
    return;
  }
  const { editing, medication } = state;
  if (editing === 'name' && draft !== medication.name) {
    medication.dose = '';
    medication.route = '';
  }
  medication[editing] = draft;
  navigate('medication');
}

function reviewMedication() {
  const missing = requiredMedicationFields.find(key => !state.medication[key].trim());
  if (missing) {
    const error = document.querySelector('#medication-error');
    error.hidden = false;
    error.scrollIntoView({ block: 'nearest' });
    app.querySelector(`[data-action="edit:${missing}"]`).focus({ preventScroll: true });
    return;
  }
  navigate('medication-review');
}

function saveAssessment() {
  if (!document.querySelector('#field-assessment-pain').reportValidity()) return;
  if (/^Right leg pain · \d+\/10 at rest$/.test(state.medication.reason)) {
    state.medication.reason = `Right leg pain · ${state.assessment.pain}/10 at rest`;
  }
  navigate('assessment-saved');
}

function signVisit(noDose) {
  state.visitStatus = 'completed';
  navigate(noDose ? 'complete-no-med' : 'complete');
}

const commands = {
  launch,
  'save-assessment': saveAssessment,
  'use-order': () => {
    Object.assign(state.medication, { name: 'Acetaminophen', dose: '500 mg', route: 'By mouth (oral)' });
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
    navigate('follow-up');
  },
  'confirm-reschedule': () => {
    state.visitStatus = 'rescheduled';
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
  saveState();
});

app.addEventListener('keydown', event => {
  if (current === 'editor' && event.key === 'Enter' && event.target.id === 'entry-draft') {
    event.preventDefault();
    applyDraft();
  }
});

document.querySelector('#restart-demo').addEventListener('click', () => {
  state = initialState();
  navigate('splash', { replace: true });
});

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
