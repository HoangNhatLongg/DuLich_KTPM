const state = {
  tours: [],
  currentTour: null,
  bookingTour: null,
  adultsCount: 2,
  childrenCount: 0,
  currentSlide: 0,
  slideInterval: null,
  activeFilter: 'all',
  activeSearch: '',
  favoriteTourIds: new Set()
};

document.addEventListener('DOMContentLoaded', async () => {
  setDefaultDates();
  initHeader();
  initScrollEffects();
  startSlider();
  syncAuthUi();
  
  // Event delegation for favorite buttons
  document.addEventListener('click', (e) => {
    const favoriteBtn = e.target.closest('.tour-favorite-btn');
    if (favoriteBtn) {
      e.stopPropagation();
      e.preventDefault();
      const tourId = favoriteBtn.dataset.tourId;
      if (tourId) {
        toggleFavoriteFromCard(e, tourId);
      }
    }
  });
  
  // Load favorites first, then tours
  await loadUserFavorites();
  await loadTours();
});

window.addEventListener('luxtravel:auth-changed', () => {
  syncAuthUi();
  loadUserFavorites();
});

async function loadUserFavorites() {
  const session = getSession();
  if (!session || !isSessionValid(session)) {
    state.favoriteTourIds = new Set();
    return;
  }
  try {
    const favorites = await favoritesApi('', { token: session.accessToken });
    state.favoriteTourIds = new Set((favorites || []).map(f => f.tourId));
  } catch (err) {
    state.favoriteTourIds = new Set();
  }
}

function setDefaultDates() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const value = nextWeek.toISOString().split('T')[0];

  ['heroDepartureDate', 'bookingDate'].forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  });
}

function initHeader() {
  window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    header.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function startSlider() {
  state.slideInterval = setInterval(() => {
    goSlide((state.currentSlide + 1) % 3);
  }, 5000);
}

function goSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  if (!slides.length || !dots.length) {
    return;
  }

  slides[state.currentSlide]?.classList.remove('active');
  dots[state.currentSlide]?.classList.remove('active');
  state.currentSlide = index;
  slides[state.currentSlide]?.classList.add('active');
  dots[state.currentSlide]?.classList.add('active');
}

function syncAuthUi() {
  const navActions = document.getElementById('navActions');
  const session = requireSession();

  if (!navActions) {
    return;
  }

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

  // Close dropdown when clicking outside
  document.addEventListener('click', closeUserDropdownOnClickOutside);
  prefillCustomerFields(session);
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

async function loadTours() {
  try {
    const tours = await tourApi('/api/tours');
    state.tours = tours.map(normalizeTour);
    renderFeaturedTours();
    renderAllTours();
  } catch (error) {
    state.tours = [];
    renderFeaturedTours();
    renderAllTours();
    showToast(error.message || 'Khong tai duoc danh sach tour.');
  }
}

function showPage(pageName) {
  document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));
  const page = document.getElementById(`page-${pageName}`);
  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));
  const navMap = { home: 0, destinations: 1 };
  if (navMap[pageName] !== undefined) {
    document.querySelectorAll('.nav-link')[navMap[pageName]]?.classList.add('active');
  }

  document.getElementById('navLinks').classList.remove('open');
}

function renderFeaturedTours() {
  const container = document.getElementById('featuredTours');
  if (!container) {
    return;
  }

  const featured = state.tours.slice(0, 3);
  container.innerHTML = featured.length
    ? featured.map((tour) => tourCardHtml(tour)).join('')
    : '<p style="text-align:center;color:var(--text-muted)">Chưa có dữ liệu tour.</p>';
}

function renderAllTours() {
  const container = document.getElementById('allTours');
  if (!container) {
    return;
  }

  const filteredTours = state.tours.filter((tour) => {
    const matchesFilter = state.activeFilter === 'all' || tour.category === state.activeFilter;
    const haystack = `${tour.name} ${tour.destination} ${tour.description}`.toLowerCase();
    const matchesSearch = !state.activeSearch || haystack.includes(state.activeSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  container.innerHTML = filteredTours.length
    ? filteredTours.map((tour) => tourCardHtml(tour)).join('')
    : '<p style="text-align:center;color:var(--text-muted)">Không tìm thấy tour phù hợp.</p>';

  initScrollEffects();
}

function tourCardHtml(tour) {
  const isFavorite = state.favoriteTourIds.has(tour.id);
  return `
    <div class="tour-card" onclick="viewTour('${tour.id}')">
      <div class="tour-card-img">
        <img src="${escapeHtml(tour.img)}" alt="${escapeHtml(tour.name)}" loading="lazy">
        <span class="tour-badge">${escapeHtml(tour.badge)}</span>
        <button class="tour-favorite-btn ${isFavorite ? 'favorited' : ''}" 
                data-tour-id="${tour.id}"
                onclick="event.stopPropagation(); toggleFavoriteFromCard(event, '${tour.id}')"
                title="${isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}">
          ${isFavorite ? '♥' : '♡'}
        </button>
      </div>
      <div class="tour-card-body">
        <p class="tour-destination">Địa điểm: ${escapeHtml(tour.destination)}</p>
        <h3 class="tour-name">${escapeHtml(tour.name)}</h3>
        <div class="tour-meta">
          <span class="tour-meta-item">Thời gian: ${escapeHtml(tour.duration)}</span>
          <span class="tour-meta-item">Đánh giá: ${tour.rating} (${tour.reviews})</span>
        </div>
        <div class="tour-card-footer">
          <div>
            <span class="tour-price-label">Giá từ</span>
            <div class="tour-price">${formatPrice(tour.price)} <span class="tour-price-unit">/ người</span></div>
          </div>
          <div class="tour-stars">${'★'.repeat(Math.floor(tour.rating))}</div>
        </div>
        <button class="btn-tour" type="button">Xem chi tiết -></button>
      </div>
    </div>
  `;
}

async function toggleFavoriteFromCard(event, tourId) {
  event.stopPropagation();
  event.preventDefault();
  console.log('Toggle favorite for tour:', tourId);
  
  const session = getSession();
  if (!session || !isSessionValid(session)) {
    console.log('Not logged in, showing login modal');
    showToast('Vui lòng đăng nhập để lưu tour yêu thích.');
    openModal('loginModal');
    return;
  }
  
  try {
    const wasFavorite = state.favoriteTourIds.has(tourId);
    console.log('Current favorite state:', wasFavorite);
    
    // Optimistic UI update
    if (wasFavorite) {
      state.favoriteTourIds.delete(tourId);
    } else {
      state.favoriteTourIds.add(tourId);
    }
    renderFeaturedTours();
    renderAllTours();
    initScrollEffects();
    
    const response = await favoritesApi(`/${tourId}/toggle`, {
      method: 'POST',
      token: session.accessToken
    });
    console.log('Toggle response:', response);
    
    showToast(wasFavorite ? 'Đã xóa khỏi yêu thích.' : 'Đã thêm vào yêu thích!');
  } catch (err) {
    console.error('Toggle favorite error:', err);
    // Revert on error
    await loadUserFavorites();
    renderFeaturedTours();
    renderAllTours();
    initScrollEffects();
    showToast(err.message || 'Không thể cập nhật yêu thích.');
  }
}

function filterTours(category, button) {
  state.activeFilter = category;
  document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  renderAllTours();
}

function searchToursFromHero() {
  state.activeFilter = 'all';
  state.activeSearch = document.getElementById('heroDestinationSelect')?.value || '';
  document.querySelectorAll('.filter-btn').forEach((item, index) => {
    item.classList.toggle('active', index === 0);
  });
  renderAllTours();
  showPage('tours');
}

async function viewTour(id) {
  try {
    const rawTour = await tourApi(`/api/tours/${id}`);
    state.currentTour = normalizeTour(rawTour);
    renderTourDetail();
    showPage('detail');
    updateSidebarPrice();
  } catch (error) {
    showToast(error.message || 'Không tải được chi tiết tour.');
  }
}

function renderTourDetail() {
  if (!state.currentTour) {
    return;
  }

  const tour = state.currentTour;
  const itineraryHtml = tour.itinerary.map((item) => `
    <div class="itinerary-item">
      <p class="itinerary-day">${escapeHtml(item.day)}</p>
      <h4>${escapeHtml(item.title)}</h4>
      <p style="white-space:pre-line">${escapeHtml(item.desc)}</p>
    </div>
  `).join('');

  const highlightsHtml = tour.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

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
        <button class="btn-primary full-width" style="border-radius:var(--radius-sm)" onclick="openBooking('${tour.id}')">Đặt tour ngay -></button>
      </div>
    </div>
  `;

  const sidebarDate = document.getElementById('sidebarDate');
  if (sidebarDate) {
    sidebarDate.value = document.getElementById('heroDepartureDate')?.value || '';
  }
}

function updateSidebarPrice() {
  if (!state.currentTour) {
    return;
  }

  const adults = Number(document.getElementById('sidebarAdults')?.value || 2);
  const children = Number(document.getElementById('sidebarChildren')?.value || 0);
  const adultTotal = state.currentTour.price * adults;
  const childTotal = state.currentTour.childPrice * children;
  const grandTotal = adultTotal + childTotal;

  setText('adultQty', adults);
  setText('childQty', children);
  setText('adultTotal', formatPrice(adultTotal));
  setText('childTotal', formatPrice(childTotal));
  setText('grandTotal', formatPrice(grandTotal));
}

function openBooking(tourId) {
  const session = requireSession();
  if (!session) {
    showToast('Vui lòng đăng nhập để đặt tour.');
    openModal('loginModal');
    return;
  }

  const sourceTour = state.currentTour?.id === tourId
    ? state.currentTour
    : state.tours.find((tour) => tour.id === tourId);

  if (!sourceTour) {
    showToast('Không tìm thấy thông tin tour.');
    return;
  }

  state.bookingTour = sourceTour;
  state.adultsCount = Number(document.getElementById('sidebarAdults')?.value || 2);
  state.childrenCount = Number(document.getElementById('sidebarChildren')?.value || 0);

  document.getElementById('bookingTourName').textContent = sourceTour.name;
  document.getElementById('adultsCount').textContent = state.adultsCount;
  document.getElementById('childrenCount').textContent = state.childrenCount;
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
  if (!state.bookingTour) {
    return;
  }

  const adultPrice = state.bookingTour.price * state.adultsCount;
  const childPrice = state.bookingTour.childPrice * state.childrenCount;
  const total = adultPrice + childPrice;

  setText('adultsDisplay', state.adultsCount);
  setText('childrenDisplay', state.childrenCount);
  setText('adultsPrice', formatPrice(adultPrice));
  setText('childrenPrice', formatPrice(childPrice));
  setText('totalPrice', formatPrice(total));
  setText('totalPrice2', formatPrice(total));
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
  if (button) {
    button.disabled = true;
    button.textContent = 'Đang xử lý...';
  }

  try {
    const totalAmount = state.bookingTour.price * state.adultsCount + state.bookingTour.childPrice * state.childrenCount;

    const booking = await bookingApi('/api/bookings', {
      method: 'POST',
      token: session.accessToken,
      body: {
        userId: session.user.id,
        tourId: state.bookingTour.id,
        customerEmail: session.user.email,
        tourName: state.bookingTour.name,
        totalPrice: totalAmount
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

  } catch (error) {
    showToast(error.message || 'Đặt tour thất bại.');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Xác nhận thanh toán';
    }
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
  state.bookingTour = null;
  state.adultsCount = 2;
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
  document.querySelectorAll('.payment-option').forEach((option) => option.classList.remove('selected'));
  radio.closest('.payment-option')?.classList.add('selected');
  document.getElementById('cardFields').style.display = radio.value === 'card' ? 'block' : 'none';
}

function formatCard(input) {
  input.value = input.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 150);
}

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

async function login() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    showToast('Vui lòng nhập email và mật khẩu.');
    return;
  }

  try {
    const response = await userApi('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    saveSession(response);
    closeModal('loginModal');
    showToast(`Đăng nhập thành công với vai trò ${response.user.role}.`);
  } catch (error) {
    showToast(error.message || 'Đăng nhập thất bại.');
  }
}

async function register() {
  const name = document.getElementById('registerName')?.value.trim();
  const phone = document.getElementById('registerPhone')?.value.trim();
  const email = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value;

  if (!email || !password) {
    showToast('Vui lòng nhập đầy đủ thông tin bắt buộc.');
    return;
  }

  try {
    const response = await userApi('/api/auth/register', {
      method: 'POST',
      body: {
        email,
        password,
        role: 'Customer'
      }
    });

    saveSession(response, { name, phone });
    closeModal('registerModal');
    showToast('Đăng ký thành công.');
  } catch (error) {
    showToast(error.message || 'Đăng ký thất bại.');
  }
}

function logout() {
  clearSession();
  showToast('Đã đăng xuất.');
}

function newsletterSignup() {
  const email = document.getElementById('newsletterEmail')?.value.trim();
  if (!email) {
    showToast('Vui lòng nhập email.');
    return;
  }

  showToast('Đã đăng ký nhận bản tin.');
  document.getElementById('newsletterEmail').value = '';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), index * 80);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach((element) => observer.observe(element));
}

function prefillCustomerFields(session) {
  setInputValue('custName', session?.profile?.name || '');
  setInputValue('custEmail', session?.user?.email || '');
  setInputValue('custPhone', session?.profile?.phone || '');
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value;
  }
}
