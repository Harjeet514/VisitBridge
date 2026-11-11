export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export const action = (label, command, tone = 'primary') => ({ label, command, tone });
export const go = (label, route, tone) => action(label, `go:${route}`, tone);
export const p = (value, style = 'body-small') => `<p class="${style}">${escapeHtml(value)}</p>`;
export const h = (value, style = 'h3') => `<h3 class="${style}">${escapeHtml(value)}</h3>`;
export const svg = (name, className = '') => `<img class="${className}" src="./assets/${name}.svg" alt="" aria-hidden="true">`;

export function button({ label, command, tone }, extraClass = '') {
  return `<button type="button" class="button button--${tone} ${extraClass}" data-action="${escapeHtml(command)}">${escapeHtml(label)}</button>`;
}

export function intro(title, description) {
  return `<div class="intro"><h2 class="h1">${escapeHtml(title)}</h2>${p(description)}</div>`;
}

export function card(content, tone = 'surface', className = '') {
  return `<section class="card card--${tone} ${className}">${content}</section>`;
}

export function note(title, value, tone = 'soft') {
  return card(`${p(title, 'label')}${p(value)}`, tone, 'context-note');
}

export function detail(label, value, hint = '') {
  return `<div class="detail">${p(label, 'caption')}${p(value, 'label')}${hint ? p(hint) : ''}</div>`;
}

export function badge(label, tone = 'neutral') {
  return `<span class="badge badge--${tone}">${escapeHtml(label)}</span>`;
}

export function avatar() {
  return '<span class="avatar" aria-hidden="true">RH</span>';
}

export function patient(description, detailText = '') {
  const identity = `<div class="patient-row">${avatar()}<div class="patient-name">${h('Robert Hayes')}${p(description)}</div></div>`;
  return card(identity + (detailText ? p(detailText, 'caption') : ''), 'surface', 'patient');
}

export function choice(title, description, command, { tone = 'surface', icon = '' } = {}) {
  const mark = icon ? `<span class="choice-icon">${svg(icon)}</span>` : '';
  return `<button type="button" class="card card--${tone} choice" data-action="${escapeHtml(command)}">
    ${mark}<span class="choice-copy"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></span>
    ${svg('chevron', 'chevron')}
  </button>`;
}

export function metricPair(first, second) {
  return `<div class="metrics" aria-label="Pain scores at rest">${[first, second].map(([value, label]) =>
    `<div class="metric">${p(value, 'metric-value')}${p(label, 'caption')}</div>`,
  ).join('')}</div>`;
}

export function field(label, key, value, hint = '', { multiline = false, number = false } = {}) {
  const id = `field-${key.replaceAll('.', '-')}`;
  const common = `id="${id}" name="${id}" data-field="${key}" aria-describedby="${id}-hint"`;
  let input;
  if (multiline) {
    input = `<textarea ${common} rows="2" maxlength="400">${escapeHtml(value)}</textarea>`;
  } else if (number) {
    input = `<div class="score-input"><input ${common} type="number" inputmode="numeric" min="0" max="10" required value="${escapeHtml(value)}"><span aria-hidden="true">/ 10</span></div>`;
  } else {
    input = `<input ${common} type="text" maxlength="180" value="${escapeHtml(value)}">`;
  }
  return `<div class="field"><label class="label" for="${id}">${escapeHtml(label)}</label>${input}<span id="${id}-hint" class="caption">${escapeHtml(hint)}</span></div>`;
}

export function editField(key, { label, placeholder, hint }, value) {
  return `<div class="field">
    <span class="label" id="label-${key}">${escapeHtml(label)}</span>
    <button type="button" class="field-control" data-action="edit:${key}" aria-labelledby="label-${key} value-${key}" aria-describedby="hint-${key}"><span id="value-${key}">${escapeHtml(value || placeholder)}</span></button>
    <span id="hint-${key}" class="caption">${escapeHtml(hint)}</span>
  </div>`;
}

export function statusBar(time, dark = false) {
  return `<div class="status-bar" aria-hidden="true"><span>${escapeHtml(time)}</span>${svg(dark ? 'status-dark' : 'status', 'status-symbols')}</div>`;
}

export function screen({ title, time, back, brand = false, body, actions = [], fullWidth = false }) {
  const leading = brand
    ? `<span class="brandmark brandmark--small">${svg('brand')}</span>`
    : back ? `<button class="back" type="button" aria-label="Back" data-action="go:${escapeHtml(back)}">${svg('back')}</button>` : '';
  return `<div class="screen">
    ${statusBar(time)}
    <header class="app-header">${leading}<h1 class="h2" tabindex="-1">${escapeHtml(title)}</h1></header>
    <div class="screen-scroll"><div class="screen-content${fullWidth ? ' screen-content--full' : ''}">${body}</div></div>
    <footer class="actions${actions.length ? '' : ' actions--empty'}">
      ${actions.map(item => button(item)).join('')}
      <span class="home-indicator" aria-hidden="true"></span>
    </footer>
  </div>`;
}

export function splash() {
  return `<div class="screen splash">
    <img class="splash-glow" src="./assets/splash-glow.svg" alt="" aria-hidden="true">
    ${statusBar('9:58', true)}
    <div class="splash-hero">
      <div class="splash-logo"><span class="brandmark brandmark--large">${svg('brand-splash')}</span></div>
      <div class="splash-name"><h1 class="display" tabindex="-1">VisitBridge</h1>${p('Home visits and care records', 'body')}</div>
    </div>
    <footer class="actions splash-actions">
      ${button(action('Open visits', 'launch', 'citrus'))}
      <span class="home-indicator" aria-hidden="true"></span>
    </footer>
  </div>`;
}
