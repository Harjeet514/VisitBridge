export const visitUpdates = [
  {
    id: 'robert', label: 'Visit time changed', name: 'Robert Hayes',
    date: 'Thursday, 12 November', day: '12', weekday: 'Thu',
    previous: '10:00–11:15 AM', time: '1:30–2:45 PM',
    purpose: 'Fracture reassessment', duration: '75 min',
    address: '18 Maple Lane, Waterloo · Side door',
    reason: 'Robert has a hospital follow-up in the morning. His daughter confirmed the afternoon visit.',
    received: '9:54 AM',
  },
  {
    id: 'helen', label: 'New visit assigned', name: 'Helen Walsh',
    date: 'Friday, 13 November', day: '13', weekday: 'Fri',
    time: '9:30–10:15 AM', purpose: 'Dressing review', duration: '45 min',
    address: '24 Willow Street, Waterloo · Main entrance',
    reason: 'A nursing visit has been added to your schedule. Review the visit details before attending.',
    received: '9:56 AM',
  },
  {
    id: 'preview', label: 'Visit time changed', name: 'Robert Hayes',
    date: 'Thursday, 12 November', day: '12', weekday: 'Thu',
    previous: '1:30–2:45 PM', time: '2:00–3:15 PM',
    purpose: 'Fracture reassessment', duration: '75 min',
    address: '18 Maple Lane, Waterloo · Side door',
    reason: 'Robert’s hospital appointment is running later. His daughter confirmed the revised time.',
    received: 'Just now',
  },
];

export function availableUpdates(state) {
  return visitUpdates.filter(update => update.id !== 'preview' || state.previewUpdate);
}

export function unreadUpdates(state) {
  return availableUpdates(state).filter(update => !state.reviewedUpdates[update.id]);
}

export function upcomingVisits(state) {
  const robert = visitUpdates[state.previewUpdate ? 2 : 0];
  return [robert, visitUpdates[1]];
}
