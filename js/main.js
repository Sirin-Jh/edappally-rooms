const rooms = [
  { id: 'single-ac', type: 'single', ac: 'ac', name: 'Single Room — AC', guests: 1 },
  { id: 'single-non-ac', type: 'single', ac: 'non-ac', name: 'Single Room — Non-AC', guests: 1 },
  { id: 'double-ac', type: 'double', ac: 'ac', name: 'Double Room — AC', guests: 2 },
  { id: 'double-non-ac', type: 'double', ac: 'non-ac', name: 'Double Room — Non-AC', guests: 2 }
];
const state = { type: 'all', ac: 'any', guests: 'any', sort: 'recommended', favorites: new Set() };
try { state.favorites = new Set(JSON.parse(localStorage.getItem('edappally-favorites') || '[]')); } catch {}
const $ = (selector) => document.querySelector(selector);
const checkIn = $('#check-in');
const checkOut = $('#check-out');
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDateTime = (value) => {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec((value || '').trim());
  return match ? new Date(`${match[1]}T${match[2]}`) : null;
};
const formatDateTime = (date) => `${localDate(date)} at ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const modalCheckIn = $('#modal-check-in');
const modalCheckInTime = $('#modal-check-in-time');
const modalCheckOut = $('#modal-check-out');
const modalCheckOutTime = $('#modal-check-out-time');
const basePickerConfig = {
  allowInput: true,
  disableMobile: true,
  static: true,
  dateFormat: 'Y-m-d',
  minDate: 'today'
};
const timePickerConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  time_24hr: true,
  minuteIncrement: 15,
  allowInput: true,
  disableMobile: true,
  static: true
};
let checkInPicker = null;
let checkOutPicker = null;
let checkInTimePicker = null;
let checkOutTimePicker = null;
if (window.flatpickr) {
  checkInPicker = window.flatpickr(modalCheckIn, {
    ...basePickerConfig,
    onChange: (dates) => {
      const date = dates[0] || null;
      checkOutPicker.set('minDate', date ? localDate(date) : 'today');
      const checkOutDate = checkOutPicker.selectedDates[0];
      if (date && checkOutDate && checkOutDate < date) checkOutPicker.clear();
    }
  });
  checkInTimePicker = window.flatpickr(modalCheckInTime, { ...timePickerConfig, defaultHour: 12, defaultMinute: 0 });
  checkOutPicker = window.flatpickr(modalCheckOut, { ...basePickerConfig });
  checkOutTimePicker = window.flatpickr(modalCheckOutTime, { ...timePickerConfig, defaultHour: 11, defaultMinute: 0 });
}
checkIn.min = localDate(new Date());
checkOut.min = checkIn.min;
checkIn.addEventListener('change', () => {
  const next = checkIn.value ? new Date(`${checkIn.value}T12:00:00`) : new Date();
  next.setDate(next.getDate() + 1);
  checkOut.min = localDate(next);
  if (checkOut.value && checkOut.value < checkOut.min) checkOut.value = '';
  checkOut.required = Boolean(checkIn.value);
});
checkOut.addEventListener('change', () => { checkIn.required = Boolean(checkOut.value); });
function render() {
  let visible = rooms.filter(room => (state.type === 'all' || room.type === state.type) && (state.ac === 'any' || room.ac === state.ac) && (state.guests === 'any' || room.guests >= Number(state.guests)));
  if (state.sort === 'name') visible.sort((a, b) => a.name.localeCompare(b.name));
  if (state.sort === 'guests') visible.sort((a, b) => a.guests - b.guests);
  $('#room-grid').innerHTML = visible.map(room => `<article class="room-card"><div class="room-photo"><img src="images/sample-room-image.png" alt="Illustrative room interior at Edappally Homestay" width="644" height="242" loading="lazy"><button class="favorite" data-favorite="${room.id}" aria-label="Save ${room.name}" aria-pressed="${state.favorites.has(room.id)}">${state.favorites.has(room.id) ? '♥' : '♡'}</button></div><div class="room-content"><p class="eyebrow">${room.name.toUpperCase()}</p><h3>${room.name}</h3><p class="room-meta">⌖ ${room.guests} ${room.guests === 1 ? 'guest' : 'guests'} · ${room.ac === 'ac' ? 'Air-conditioned' : 'Non-air-conditioned'}</p><p class="room-description">${room.ac === 'ac' ? 'Air-conditioned room' : 'Non-air-conditioned room'}</p><p class="rate">Rate to be confirmed <small>per night</small></p><button class="button book-now" data-details="${room.id}">Book Now</button></div></article>`).join('');
  $('#no-results').hidden = visible.length > 0;
  document.querySelectorAll('[data-ac]').forEach(button => { const active = button.dataset.ac === state.ac; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); });
  document.querySelectorAll('[data-filter]').forEach(button => { const active = button.dataset.filter === 'ac' ? state.ac === 'ac' && state.type === 'all' : button.dataset.filter === state.type && !(state.ac === 'ac' && state.type === 'all'); button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); });
  $('#room-type').value = state.type;
  $('#search-ac').value = state.ac;
  $('#guests').value = state.guests;
  $('#results-note').textContent = `${visible.length === 4 ? '' : `${visible.length} room options shown. `}Nightly rates and availability will be confirmed before booking.`;
}
function resetFilters() { Object.assign(state, { type: 'all', ac: 'any', guests: 'any', sort: 'recommended' }); $('#sort').value = 'recommended'; render(); }
$('#reset').addEventListener('click', resetFilters);
$('#view-all').addEventListener('click', resetFilters);
$('#ac-filters').addEventListener('click', event => { const button = event.target.closest('[data-ac]'); if (button) { state.ac = button.dataset.ac; render(); } });
$('#room-filters').addEventListener('click', event => { const button = event.target.closest('[data-filter]'); if (!button) return; state.type = button.dataset.filter === 'ac' ? 'all' : button.dataset.filter; if (button.dataset.filter === 'ac') state.ac = 'ac'; if (button.dataset.filter === 'all') { state.ac = 'any'; state.guests = 'any'; } render(); });
$('#sort').addEventListener('change', event => { state.sort = event.target.value; render(); });
$('#room-search').addEventListener('submit', event => { event.preventDefault(); state.type = $('#room-type').value; state.ac = $('#search-ac').value; state.guests = $('#guests').value; render(); $('#rooms').scrollIntoView({ behavior: 'smooth' }); });
document.querySelectorAll('[data-room-link],[data-ac-link]').forEach(link => link.addEventListener('click', () => { resetFilters(); if (link.dataset.roomLink) state.type = link.dataset.roomLink; if (link.dataset.acLink) state.ac = link.dataset.acLink; render(); }));
$('#room-grid').addEventListener('click', event => {
  const favorite = event.target.closest('[data-favorite]');
  if (favorite) { const id = favorite.dataset.favorite; state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id); try { localStorage.setItem('edappally-favorites', JSON.stringify([...state.favorites])); } catch {} favorite.setAttribute('aria-pressed', state.favorites.has(id)); favorite.textContent = state.favorites.has(id) ? '♥' : '♡'; return; }
  const details = event.target.closest('[data-details]');
  if (!details) return;
  const room = rooms.find(room => room.id === details.dataset.details);
  $('#dialog-title').textContent = room.name;
  $('#dialog-description').textContent = `${room.guests} ${room.guests === 1 ? 'guest' : 'guests'} · ${room.ac === 'ac' ? 'Air-conditioned' : 'Non-air-conditioned'} room. Photo is illustrative; confirm the assigned room when enquiring.`;
  $('#room-dialog').dataset.room = room.id;
  const checkInDateValue = checkIn.value || '';
  const checkInTimeValue = '12:00';
  const checkOutDateValue = checkOut.value || '';
  const checkOutTimeValue = '11:00';
  if (checkInPicker) {
    checkInPicker.setDate(checkInDateValue, false);
    checkInTimePicker.setDate(checkInTimeValue, false);
    checkOutPicker.set('minDate', checkInDateValue || 'today');
    checkOutPicker.setDate(checkOutDateValue, false);
    checkOutTimePicker.setDate(checkOutTimeValue, false);
  } else {
    modalCheckIn.value = checkInDateValue;
    modalCheckInTime.value = checkInTimeValue;
    modalCheckOut.value = checkOutDateValue;
    modalCheckOutTime.value = checkOutTimeValue;
  }
  [modalCheckIn, modalCheckInTime, modalCheckOut, modalCheckOutTime].forEach(input => input.setCustomValidity(''));
  $('#room-dialog').showModal();
});
[modalCheckIn, modalCheckInTime, modalCheckOut, modalCheckOutTime].forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
$('#reserve-form').addEventListener('submit', event => {
  event.preventDefault();
  const room = rooms.find(room => room.id === $('#room-dialog').dataset.room);
  if (!room) return;
  const start = parseDateTime(`${modalCheckIn.value} ${modalCheckInTime.value}`);
  const end = parseDateTime(`${modalCheckOut.value} ${modalCheckOutTime.value}`);
  if (!start) {
    modalCheckInTime.setCustomValidity('Please pick a valid check-in date and time.');
    modalCheckInTime.reportValidity();
    return;
  }
  if (!end) {
    modalCheckOutTime.setCustomValidity('Please pick a valid check-out date and time.');
    modalCheckOutTime.reportValidity();
    return;
  }
  if (end <= start) {
    modalCheckOutTime.setCustomValidity('Check-out must be after check-in.');
    modalCheckOutTime.reportValidity();
    return;
  }
  modalCheckInTime.setCustomValidity('');
  modalCheckOutTime.setCustomValidity('');
  const guests = $('#guests').value;
  const message = [
    `Hello, I would like to reserve ${room.name} at Edappally Homestay.`,
    `Check-in: ${formatDateTime(start)}`,
    `Check-out: ${formatDateTime(end)}`,
    guests !== 'any' ? `Guests: ${guests}` : '',
    'Please confirm availability and the nightly rate. Thank you.'
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/918667373306?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
});
$('.dialog-close').addEventListener('click', () => $('#room-dialog').close());
$('#room-dialog').addEventListener('click', event => { if (event.target === $('#room-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); } });
render();
