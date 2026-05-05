// ── tour-detail.js – logic for tour-detail.html ──────────────────────────────

const state = {
  currentTour: null,
  bookingTour: null,
  adultsCount: 2,
  childrenCount: 0
};

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  syncAuthUi();
  setDefaultDate();

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (id) {
    await loadTourDetail(id);
  } else {
    document.getElementById('tourDetailContent').innerHTML =
      '<p style="text-align:center;padding:4rem;color:var(--text-muted)">Không tìm thấy tour.</p>';
  }
});

window.addEventListener('luxtravel:auth-changed', () => syncAuthUi());

// ── Header ────────────────────────────────────────────────────────────────────

function initHeader() {
  window.addEventListener('scroll', () => {
    document.getElementById('header')
      .classList.toggle('scrolled', window.scrollY > 50);
  });
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ── Auth UI ───────────────────────────────────────────────────────────────────

function syncAuthUi() {
  const navActions = document.getElementById('navActions');
  const session = requireSession();
  if (!navActions) return;

  if (!session) {
    navActions.innerHTML = `
      <button class="btn-outline" onclick="openModal('loginModal')">Đăng nhập</button>
      <button class="btn-primary" onclick="openModal('registerModal')">Đăng ký</button>
    `;
    return;
  }

  const adminLink = isAdminSession(session)
    ? '<a class="btn-outline" href="admin.html">Quản trị</a>'
    : '';

  navActions.innerHTML = `
    <span style="color:var(--text);font-size:0.92rem">Xin chào, ${escapeHtml(session.profile?.name || session.user.email)}</span>
    ${adminLink}
    <button class="btn-primary" onclick="logout()">Đăng xuất</button>
  `;
}

// ── Load tour detail ──────────────────────────────────────────────────────────

async function loadTourDetail(id) {
  try {
    const rawTour = await tourApi(`/api/tours/${id}`);
    state.currentTour = normalizeTour(rawTour);
    renderTourDetail();
    updateSidebarPrice();
  } catch (err) {
    showToast(err.message || 'Không tải được chi tiết tour.');
    document.getElementById('tourDetailContent').innerHTML =
      '<p style="text-align:center;padding:4rem;color:var(--text-muted)">Lỗi tải dữ liệu tour.</p>';
  }
}

function renderTourDetail() {
  if (!state.currentTour) return;
  const tour = state.currentTour;

  document.title = `${tour.name} – LuxTravel`;

  const itineraryHtml = tour.itinerary.map(item => `
    <div class="itinerary-item">
      <p class="itinerary-day">${escapeHtml(item.day)}</p>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.desc)}</p>
    </div>
  `).join('');

  const highlightsHtml = tour.highlights.map(item => `<li>${escapeHtml(item)}</li>`).join('');

  document.getElementById('tourDetailContent').innerHTML = `
    <div class="tour-detail-hero" style="background-image:url('${escapeHtml(tour.img)}')">
      <div class="overlay"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;padding:3rem 2rem;max-width:1400px;margin:0 auto;">
        <p class="section-eyebrow">${escapeHtml(tour.destination)}</p>
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(2.5rem,5vw,4rem);font-weight:300;color:white;margin-bottom:0.75rem;">${escapeHtml(tour.name)}</h1>
        <div class="tour-meta">
          <span class="tour-meta-item">${escapeHtml(tour.duration)}</span>
          <span class="tour-meta-item">Còn ${tour.availableSlots} chỗ</span>
          <span class="tour-badge">${escapeHtml(tour.badge)}</span>
        </div>
      </div>
    </div>
    <div class="tour-detail-body">
      <div class="tour-detail-left">
        <div class="tour-desc-block">
          <h3>Giới thiệu tour</h3>
          <p>${escapeHtml(tour.description)}</p>
        </div>
        <div class="tour-desc-block">
          <h3>Điểm nổi bật</h3>
          <ul>${highlightsHtml}</ul>
        </div>
        <div class="tour-desc-block">
          <h3>Lịch trình chi tiết</h3>
          ${itineraryHtml || '<p>Chưa có lịch trình chi tiết.</p>'}
        </div>
      </div>
      <div class="booking-sidebar">
        <div class="booking-sidebar-price">${formatPrice(tour.price)}</div>
        <div class="booking-sidebar-unit">/ người lớn</div>
        <div class="booking-form-group">
          <label>Ngày khởi hành</label>
          <input type="date" id="sidebarDate">
        </div>
        <div class="booking-form-group">
          <label>Số người lớn</label>
          <select id="sidebarAdults" onchange="updateSidebarPrice()">
            <option value="1">1 người</option>
            <option value="2" selected>2 người</option>
            <option value="3">3 người</option>
            <option value="4">4 người</option>
            <option value="5">5 người</option>
          </select>
        </div>
        <div class="booking-form-group">
          <label>Số trẻ em</label>
          <select id="sidebarChildren" onchange="updateSidebarPrice()">
            <option value="0" selected>0 trẻ em</option>
            <option value="1">1 trẻ em</option>
            <option value="2">2 trẻ em</option>
            <option value="3">3 trẻ em</option>
          </select>
        </div>
        <div class="booking-price-est">
          <div class="booking-price-row"><span>Người lớn x <span id="adultQty">2</span></span><span id="adultTotal">${formatPrice(tour.price * 2)}</span></div>
          <div class="booking-price-row"><span>Trẻ em x <span id="childQty">0</span></span><span id="childTotal">${formatPrice(0)}</span></div>
          <div class="booking-price-row total"><span>Tổng ước tính</span><span id="grandTotal">${formatPrice(tour.price * 2)}</span></div>
        </div>
        <button class="btn-primary full-width" style="border-radius:var(--radius-sm)" onclick="openBooking('${tour.id}')">Đặt tour ngay →</button>
      </div>
    </div>
  `;

  // Sync sidebar date with sessionStorage if available
  const sidebarDate = document.getElementById('sidebarDate');
  if (sidebarDate) {
    const savedDate = sessionStorage.getItem('luxtravel_departure_date') || '';
    sidebarDate.value = savedDate || getNextWeekDate();
  }
}

function updateSidebarPrice() {
  if (!state.currentTour) return;
  const adults   = Number(document.getElementById('sidebarAdults')?.value || 2);
  const children = Number(document.getElementById('sidebarChildren')?.value || 0);
  const adultTotal = state.currentTour.price * adults;
  const childTotal = state.currentTour.childPrice * children;
  const grandTotal = adultTotal + childTotal;

  setText('adultQty',   adults);
  setText('childQty',   children);
  setText('adultTotal', formatPrice(adultTotal));
  setText('childTotal', formatPrice(childTotal));
  setText('grandTotal', formatPrice(grandTotal));
}

// ── Booking modal ─────────────────────────────────────────────────────────────

function openBooking(tourId) {
  const session = requireSession();
  if (!session) {
    showToast('Vui lòng đăng nhập để đặt tour.');
    openModal('loginModal');
    return;
  }

  state.bookingTour = state.currentTour;
  state.adultsCount   = Number(document.getElementById('sidebarAdults')?.value || 2);
  state.childrenCount = Number(document.getElementById('sidebarChildren')?.value || 0);

  document.getElementById('bookingTourName').textContent = state.bookingTour.name;
  setText('adultsCount',   state.adultsCount);
  setText('childrenCount', state.childrenCount);
  prefillCustomerFields(session);
  updateBookingPrice();

  document.getElementById('bookingStep1').classList.remove('hidden');
  document.getElementById('bookingStep2').classList.add('hidden');
  document.getElementById('bookingStep3').classList.add('hidden');
  openModal('bookingModal');
}

function changeCount(type, delta) {
  if (type === 'adults') {
    state.adultsCount = Math.max(1, state.adultsCount + delta);
    setText('adultsCount', state.adultsCount);
  } else {
    state.childrenCount = Math.max(0, state.childrenCount + delta);
    setText('childrenCount', state.childrenCount);
  }
  updateBookingPrice();
}

function updateBookingPrice() {
  if (!state.bookingTour) return;
  const adultPrice  = state.bookingTour.price * state.adultsCount;
  const childPrice  = state.bookingTour.childPrice * state.childrenCount;
  const total       = adultPrice + childPrice;

  setText('adultsDisplay',  state.adultsCount);
  setText('childrenDisplay', state.childrenCount);
  setText('adultsPrice',    formatPrice(adultPrice));
  setText('childrenPrice',  formatPrice(childPrice));
  setText('totalPrice',     formatPrice(total));
  setText('totalPrice2',    formatPrice(total));
}

function nextBookingStep() {
  document.getElementById('bookingStep1').classList.add('hidden');
  document.getElementById('bookingStep2').classList.remove('hidden');
}

function prevBookingStep() {
  document.getElementById('bookingStep2').classList.add('hidden');
  document.getElementById('bookingStep1').classList.remove('hidden');
}

async function confirmPayment() {
  const session = requireSession();
  if (!session || !state.bookingTour) {
    showToast('Phiên đăng nhập không hợp lệ.');
    return;
  }

  const button = document.querySelector('#bookingStep2 .btn-primary');
  if (button) { button.disabled = true; button.textContent = 'Đang xử lý...'; }

  try {
    const booking = await bookingApi('/api/bookings', {
      method: 'POST',
      body: { userId: session.user.id, tourId: state.bookingTour.id }
    });

    await sleep(500);
    document.getElementById('bookingStep2').classList.add('hidden');
    document.getElementById('bookingStep3').classList.remove('hidden');
    document.getElementById('bookingCode').textContent = booking.id.slice(0, 8).toUpperCase();
  } catch (err) {
    showToast(err.message || 'Đặt tour thất bại.');
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Xác nhận thanh toán'; }
  }
}

function resetBooking() {
  state.bookingTour   = null;
  state.adultsCount   = 2;
  state.childrenCount = 0;
  document.getElementById('bookingStep1').classList.remove('hidden');
  document.getElementById('bookingStep2').classList.add('hidden');
  document.getElementById('bookingStep3').classList.add('hidden');
}

function selectPM(radio) {
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  radio.closest('.payment-option')?.classList.add('selected');
  document.getElementById('cardFields').style.display = radio.value === 'card' ? 'block' : 'none';
}

function formatCard(input) {
  input.value = input.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setDefaultDate() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const value = nextWeek.toISOString().split('T')[0];
  const el = document.getElementById('bookingDate');
  if (el) el.value = value;
}

function getNextWeekDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function prefillCustomerFields(session) {
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('custName',  session?.profile?.name  || '');
  setVal('custEmail', session?.user?.email    || '');
  setVal('custPhone', session?.profile?.phone || '');
}

// ── Auth modals ───────────────────────────────────────────────────────────────

async function login() {
  const email    = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  if (!email || !password) { showToast('Vui lòng nhập email và mật khẩu.'); return; }
  try {
    const response = await userApi('/api/auth/login', { method: 'POST', body: { email, password } });
    saveSession(response);
    closeModal('loginModal');
    showToast('Đăng nhập thành công.');
    syncAuthUi();
  } catch (err) {
    showToast(err.message || 'Đăng nhập thất bại.');
  }
}

async function register() {
  const name     = document.getElementById('registerName')?.value.trim();
  const phone    = document.getElementById('registerPhone')?.value.trim();
  const email    = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value;
  if (!email || !password) { showToast('Vui lòng nhập đầy đủ thông tin.'); return; }
  try {
    const response = await userApi('/api/auth/register', {
      method: 'POST', body: { email, password, role: 'Customer' }
    });
    saveSession(response, { name, phone });
    closeModal('registerModal');
    showToast('Đăng ký thành công.');
    syncAuthUi();
  } catch (err) {
    showToast(err.message || 'Đăng ký thất bại.');
  }
}

function logout() {
  clearSession();
  showToast('Đã đăng xuất.');
  syncAuthUi();
}
