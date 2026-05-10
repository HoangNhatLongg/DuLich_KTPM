// ── tour-detail.js – logic for tour-detail.html ──────────────────────────────

const state = {
  currentTour: null,
  bookingTour: null,
  adultsCount: 2,
  childrenCount: 0,
  isFavorite: false
};

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  syncAuthUi();
  setDefaultDate();

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (id) {
    await loadTourDetail(id);
    
    // Check favorite status if logged in
    const session = requireSession();
    if (session) {
      await checkFavoriteStatus(id);
    }
    
    // Auto-open booking if ?book=1
    if (params.get('book') === '1' && session) {
      setTimeout(() => openBooking(id), 500);
    }
  } else {
    document.getElementById('tourDetailContent').innerHTML =
      '<p style="text-align:center;padding:4rem;color:var(--text-muted)">Không tìm thấy tour.</p>';
  }
});

window.addEventListener('luxtravel:auth-changed', () => {
  syncAuthUi();
  if (state.currentTour) {
    checkFavoriteStatus(state.currentTour.id);
  }
});

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

// ── Favorite Functions ─────────────────────────────────────────────────────────

async function checkFavoriteStatus(tourId) {
  try {
    const session = getSession();
    if (!session) {
      state.isFavorite = false;
      updateFavoriteButton();
      return;
    }
    
    const response = await favoritesApi(`/${tourId}/status`, { token: session.accessToken });
    state.isFavorite = response?.isFavorite || false;
    updateFavoriteButton();
  } catch (err) {
    state.isFavorite = false;
    updateFavoriteButton();
  }
}

async function toggleFavorite(tourId) {
  const session = getSession();
  if (!session || !isSessionValid(session)) {
    showToast('Vui lòng đăng nhập để lưu tour yêu thích.');
    openModal('loginModal');
    return;
  }
  
  try {
    const wasFavorite = state.isFavorite;
    
    // Optimistic UI update
    state.isFavorite = !wasFavorite;
    updateFavoriteButton();
    
    await favoritesApi(`/${tourId}/toggle`, {
      method: 'POST',
      token: session.accessToken
    });
    
    showToast(wasFavorite ? 'Đã xóa khỏi yêu thích.' : 'Đã thêm vào yêu thích!');
  } catch (err) {
    // Revert on error
    state.isFavorite = !state.isFavorite;
    updateFavoriteButton();
    showToast(err.message || 'Không thể cập nhật yêu thích.');
  }
}

function updateFavoriteButton() {
  // Update sidebar button
  const sidebarBtn = document.getElementById('favoriteBtn');
  if (sidebarBtn) {
    sidebarBtn.innerHTML = state.isFavorite ? '♥ Đã lưu' : '♡ Lưu tour';
    sidebarBtn.classList.toggle('favorited', state.isFavorite);
  }
  
  // Update hero button
  const heroBtn = document.querySelector('.hero-favorite-btn');
  if (heroBtn) {
    heroBtn.innerHTML = state.isFavorite ? '♥' : '♡';
    heroBtn.classList.toggle('favorited', state.isFavorite);
    heroBtn.title = state.isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích';
  }
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

  const userName = session.profile?.name || session.user.email?.split('@')[0] || 'Khách hàng';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const isAdmin = isAdminSession(session);

  navActions.innerHTML = `
    <div class="user-dropdown" id="userDropdown">
      <button class="user-dropdown-trigger" onclick="toggleUserDropdown()">
        <div class="user-avatar">${initials}</div>
        <span class="user-name">${escapeHtml(userName)}</span>
        <span class="dropdown-arrow">▼</span>
      </button>
      <div class="user-dropdown-menu" id="userDropdownMenu">
        <a href="my-bookings.html" class="dropdown-item">
          <span class="dropdown-icon">🎫</span>
          Tour của tôi
        </a>
        ${isAdmin ? `
          <a href="admin.html" class="dropdown-item">
            <span class="dropdown-icon">⚙️</span>
            Quản trị
          </a>
        ` : ''}
        <div class="dropdown-divider"></div>
        <button class="dropdown-item dropdown-item-danger" onclick="logout()">
          <span class="dropdown-icon">🚪</span>
          Đăng xuất
        </button>
      </div>
    </div>
  `;

  document.addEventListener('click', closeUserDropdownOnClickOutside);
}

function toggleUserDropdown() {
  const menu = document.getElementById('userDropdownMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

function closeUserDropdownOnClickOutside(event) {
  const dropdown = document.getElementById('userDropdown');
  const menu = document.getElementById('userDropdownMenu');
  if (dropdown && !dropdown.contains(event.target)) {
    menu?.classList.remove('show');
  }
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
    <div class="itinerary-item" style="padding:1rem; background:var(--bg-alt); border-radius:var(--radius-md); margin-bottom:1rem;">
      <h4 style="margin-bottom:0.75rem; color:var(--primary); font-size:1.1rem;">${escapeHtml(item.day)}:</h4>
      ${item.morning ? `<div style="margin-bottom:0.75rem"><strong style="display:block;margin-bottom:0.25rem;">Lịch trình buổi sáng:</strong><div style="white-space: pre-wrap; font-size:0.95rem; line-height: 1.5;">${escapeHtml(item.morning)}</div></div>` : ''}
      ${item.noon ? `<div style="margin-bottom:0.75rem"><strong style="display:block;margin-bottom:0.25rem;">Lịch trình buổi trưa:</strong><div style="white-space: pre-wrap; font-size:0.95rem; line-height: 1.5;">${escapeHtml(item.noon)}</div></div>` : ''}
      ${item.afternoon ? `<div style="margin-bottom:0.75rem"><strong style="display:block;margin-bottom:0.25rem;">Lịch trình buổi chiều:</strong><div style="white-space: pre-wrap; font-size:0.95rem; line-height: 1.5;">${escapeHtml(item.afternoon)}</div></div>` : ''}
      ${item.evening ? `<div style="margin-bottom:0.75rem"><strong style="display:block;margin-bottom:0.25rem;">Lịch trình buổi tối:</strong><div style="white-space: pre-wrap; font-size:0.95rem; line-height: 1.5;">${escapeHtml(item.evening)}</div></div>` : ''}
    </div>
  `).join('');

  const highlightsHtml = tour.highlights.map(item => `<li>${escapeHtml(item)}</li>`).join('');

  document.getElementById('tourDetailContent').innerHTML = `
    <div class="tour-detail-hero" style="background-image:url('${escapeHtml(tour.img)}')">
      <div class="overlay"></div>
      <button class="hero-favorite-btn ${state.isFavorite ? 'favorited' : ''}" 
              onclick="toggleFavorite('${tour.id}')" 
              title="${state.isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}">
        ${state.isFavorite ? '♥' : '♡'}
      </button>
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
        <button id="favoriteBtn" class="btn-favorite" onclick="toggleFavorite('${tour.id}')">
          ${state.isFavorite ? '♥ Đã lưu' : '♡ Lưu tour'}
        </button>
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
  
  // Update favorite button state after render
  updateFavoriteButton();
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
    const totalAmount = state.bookingTour.price * state.adultsCount + state.bookingTour.childPrice * state.childrenCount;
    const departureDate = document.getElementById('sidebarDate')?.value || null;

    const booking = await bookingApi('/api/bookings', {
      method: 'POST',
      token: session.accessToken,
      body: { 
        userId: session.user.id, 
        tourId: state.bookingTour.id,
        customerEmail: session.user.email,
        tourName: state.bookingTour.name,
        totalPrice: totalAmount,
        departureDate: departureDate || null
      }
    });

    // Map payment method from radio
    const pmRadio = document.querySelector('input[name="payment"]:checked');
    let methodEnum = 1; // BankTransfer default
    if (pmRadio) {
      if (pmRadio.value === 'card') methodEnum = 2; // VNPay
      if (pmRadio.value === 'wallet') methodEnum = 3; // Momo
    }

    // Process payment
    const paymentResp = await paymentApi('/api/payments/process', {
      method: 'POST',
      token: session.accessToken,
      body: {
        bookingId: booking.id,
        amount: totalAmount,
        method: methodEnum
      }
    });

    if (paymentResp && paymentResp.paymentId) {
      state.currentPaymentId = paymentResp.paymentId;
      state.currentBookingCode = booking.id.slice(0, 8).toUpperCase();
      
      // Hiển thị thông tin thanh toán
      document.getElementById('bookingStep2').classList.add('hidden');
      document.getElementById('bookingStep2_5').classList.remove('hidden');
      
      const container = document.getElementById('paymentDetailsContainer');
      const details = paymentResp.paymentUrlOrQrCode || '';
      
      if (details.startsWith('http')) {
        // Link thanh toán (Momo / VNPay)
        container.innerHTML = `
          <p style="margin-bottom: 1rem;">Vui lòng click vào link bên dưới để thanh toán qua cổng điện tử:</p>
          <a href="${details}" target="_blank" style="display: inline-block; padding: 1rem 2rem; background: var(--primary); color: white; text-decoration: none; border-radius: var(--radius-sm); font-weight: 500;">Thanh toán ngay</a>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">Sau khi hoàn tất, hãy quay lại đây và nhấn "Tôi đã hoàn tất thanh toán".</p>
        `;
      } else {
        // Chuyển khoản ngân hàng
        container.innerHTML = `
          <p style="margin-bottom: 1rem;">Vui lòng chuyển khoản theo thông tin dưới đây:</p>
          <div style="background: white; padding: 1.5rem; border-radius: var(--radius-sm); border: 1px dashed var(--border); text-align: left; font-family: monospace; font-size: 1.1rem; line-height: 1.6;">
            ${details.replace(/ - /g, '<br>')}
          </div>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">Hệ thống sẽ kiểm tra tự động sau khi bạn xác nhận.</p>
        `;
      }
    } else {
      throw new Error('Không nhận được thông tin thanh toán từ hệ thống.');
    }

  } catch (err) {
    showToast(err.message || 'Đặt tour thất bại.');
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Xác nhận thanh toán'; }
  }
}

async function finalizePayment() {
  const session = requireSession();
  if (!session || !state.currentPaymentId) return;

  const btn = document.getElementById('btnFinalizePayment');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Đang xác nhận...';
  }

  try {
    // Simulate webhook
    await paymentApi(`/api/payments/confirm/${state.currentPaymentId}`, {
      method: 'POST',
      token: session.accessToken
    });

    await sleep(500);
    document.getElementById('bookingStep2_5').classList.add('hidden');
    document.getElementById('bookingStep3').classList.remove('hidden');
    document.getElementById('bookingCode').textContent = state.currentBookingCode;
  } catch (err) {
    showToast('Chưa nhận được thanh toán, vui lòng thử lại sau giây lát.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Tôi đã hoàn tất thanh toán';
    }
  }
}

function resetBooking() {
  state.bookingTour   = null;
  state.adultsCount   = 2;
  state.childrenCount = 0;
  state.currentPaymentId = null;
  state.currentBookingCode = null;
  document.getElementById('bookingStep1').classList.remove('hidden');
  document.getElementById('bookingStep2').classList.add('hidden');
  const step25 = document.getElementById('bookingStep2_5');
  if(step25) step25.classList.add('hidden');
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
