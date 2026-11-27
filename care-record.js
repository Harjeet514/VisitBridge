const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export const validClock = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
export const validPain = value => typeof value === 'string' && /^(?:[0-9]|10)$/.test(value);
export const painLabel = value => validPain(value) ? `${value}/10` : 'Not recorded';

export function formatDate(value) {
  if (!validDate(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

export function formatClock(value) {
  if (!validClock(value)) return '';
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function medicationTimestamp(date, clock) {
  return validDate(date) && validClock(clock) ? `${formatDate(date)} · ${formatClock(clock)}` : '';
}

export function parseLegacyTime(value) {
  const match = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})\s*·\s*(\d{1,2}):(\d{2}) (AM|PM)$/i.exec(value ?? '');
  if (!match) return { date: '', clock: '' };
  const month = months.findIndex(name => name.toLowerCase() === match[2].toLowerCase()) + 1;
  const hour = Number(match[4]);
  if (!month || hour < 1 || hour > 12) return { date: '', clock: '' };
  const date = `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  const clock = `${String(hour % 12 + (match[6].toUpperCase() === 'PM' ? 12 : 0)).padStart(2, '0')}:${match[5]}`;
  return validDate(date) && validClock(clock) ? { date, clock } : { date: '', clock: '' };
}

export function normalizeMedication(medication) {
  const parts = Object.hasOwn(medication, 'date') || Object.hasOwn(medication, 'clock')
    ? { date: typeof medication.date === 'string' ? medication.date : '', clock: typeof medication.clock === 'string' ? medication.clock : '' }
    : parseLegacyTime(medication.time);
  return { ...medication, ...parts, time: medicationTimestamp(parts.date, parts.clock) || medication.time || '' };
}

export function medicationErrors(medication) {
  return [
    ...['name', 'dose', 'route'].filter(key => typeof medication[key] !== 'string' || !medication[key].trim()),
    ...(!validDate(medication.date) ? ['date'] : []),
    ...(!validClock(medication.clock) ? ['clock'] : []),
  ];
}

export function migrateResponse(response) {
  if (Object.hasOwn(response, 'pain')) return response;
  const match = /\bpain (\d{1,2})\/10\b/i.exec(response.patient ?? '');
  const pain = match && validPain(match[1]) ? match[1] : '';
  return {
    ...response, pain,
    patient: (response.patient ?? '').replace(/^Robert reports pain \d{1,2}\/10 at rest\.?\s*/i, ''),
  };
}

export function visitTiming(state) {
  const afternoon = state.visitContext === 'rescheduled';
  return afternoon ? {
    window: '2:30–3:45 PM', detailsClock: '2:28', arrival: '2:32 PM', identity: '2:34 PM',
    assessment: '2:42 PM', assessmentSaved: '2:46 PM', medication: '2:52 PM', medicationClock: '14:52',
    editorClock: '2:54', medicationReviewClock: '2:55', medicationSavedClock: '2:56',
    response: '3:15 PM', review: '3:30 PM', complete: '3:38 PM',
    contact: '2:35 PM', noAnswer: '2:37 PM', followUp: '2:38 PM', reviewBy: '3:00 PM',
  } : {
    window: '10:00–11:15 AM', detailsClock: '9:58', arrival: '10:02 AM', identity: '10:04 AM',
    assessment: '10:12 AM', assessmentSaved: '10:16 AM', medication: '10:22 AM', medicationClock: '10:22',
    editorClock: '10:24', medicationReviewClock: '10:25', medicationSavedClock: '10:26',
    response: '11:00 AM', review: '11:05 AM', complete: '11:08 AM',
    contact: '10:05 AM', noAnswer: '10:07 AM', followUp: '10:08 AM', reviewBy: '10:30 AM',
  };
}

export const displayClock = time => time.replace(/ (AM|PM)$/, '');
