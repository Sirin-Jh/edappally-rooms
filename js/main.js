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
  $('#room-grid').innerHTML = visible.map(room => `<article class="room-card"><div class="room-photo"><img src="images/sample-room-image.png" alt="Illustrative room interior at Edappally Homestay" width="644" height="242" loading="lazy"><button class="favorite" data-favorite="${room.id}" aria-label="Save ${room.name}" aria-pressed="${state.favorites.has(room.id)}">${state.favorites.has(room.id) ? '♥' : '♡'}</button></div><div class="room-content"><p class="eyebrow">${room.name.toUpperCase()}</p><h3>${room.name}</h3><p class="room-meta">⌖ ${room.guests} ${room.guests === 1 ? 'guest' : 'guests'} · ${room.ac === 'ac' ? 'Air-conditioned' : 'Non-air-conditioned'}</p><p class="room-description">${room.ac === 'ac' ? 'Air-conditioned room' : 'Non-air-conditioned room'}</p><p class="rate">Rate to be confirmed <small>per night</small></p><button class="text-link" data-details="${room.id}">View room <span aria-hidden="true">↗</span></button></div></article>`).join('');
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
  const dates = checkIn.value && checkOut.value ? `Requested stay: ${checkIn.value} to ${checkOut.value}` : '';
  $('#dialog-dates').textContent = dates;
  const enquiry = [
    `Hello, I would like to enquire about ${room.name} at Edappally Homestay.`,
    `Room capacity: ${room.guests} ${room.guests === 1 ? 'guest' : 'guests'}.`,
    $('#guests').value !== 'any' ? `Requested guests: ${$('#guests').value}.` : '',
    checkIn.value ? `Check-in: ${checkIn.value}` : '',
    checkOut.value ? `Check-out: ${checkOut.value}` : '',
    'Please confirm availability and the nightly rate. Thank you.'
  ].filter(Boolean).join('\n');
  $('#enquiry-link').href = `https://wa.me/918667373306?text=${encodeURIComponent(enquiry)}`;
  $('#room-dialog').showModal();
});
$('.dialog-close').addEventListener('click', () => $('#room-dialog').close());
$('#room-dialog').addEventListener('click', event => { if (event.target === $('#room-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); } });
render();
