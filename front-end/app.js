const state = {
  tours: [],
  currentTour: null,
  bookingTour: null,
  adultsCount: 2,
  childrenCount: 0,
  currentSlide: 0,
  slideInterval: null,
  activeFilter: 'all',
  activeSearch: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  setDefaultDates();
  initHeader();
  initScrollEffects();
  startSlider();
  syncAuthUi();
  await loadTours();
});

window.addEventListener('luxtravel:auth-changed', () => {
  syncAuthUi();
});

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
      <button class="btn-outline" onclick="openModal('loginModal')">Dang nhap</button>
      <button class="btn-primary" onclick="openModal('registerModal')">Dang ky</button>
    `;
    return;
  }

  const adminLink = isAdminSession(session)
    ? '<a class="btn-outline" href="admin.html">Quan tri</a>'
    : '';

  navActions.innerHTML = `
    <span style="color:var(--text);font-size:0.92rem">Xin chao, ${escapeHtml(session.profile?.name || session.user.email)}</span>
    ${adminLink}
    <button class="btn-primary" onclick="logout()">Dang xuat</button>
  `;

  prefillCustomerFields(session);
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
    : '<p style="text-align:center;color:var(--text-muted)">Chua co du lieu tour.</p>';
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
    : '<p style="text-align:center;color:var(--text-muted)">Khong tim thay tour phu hop.</p>';

  initScrollEffects();
}

function tourCardHtml(tour) {
  return `
    <div class="tour-card animate-on-scroll" onclick="viewTour('${tour.id}')">
      <div class="tour-card-img">
        <img src="${escapeHtml(tour.img)}" alt="${escapeHtml(tour.name)}" loading="lazy">
        <span class="tour-badge">${escapeHtml(tour.badge)}</span>
      </div>
      <div class="tour-card-body">
        <p class="tour-destination">Dia diem: ${escapeHtml(tour.destination)}</p>
        <h3 class="tour-name">${escapeHtml(tour.name)}</h3>
        <div class="tour-meta">
          <span class="tour-meta-item">Thoi gian: ${escapeHtml(tour.duration)}</span>
          <span class="tour-meta-item">Danh gia: ${tour.rating} (${tour.reviews})</span>
        </div>
        <div class="tour-card-footer">
          <div>
            <span class="tour-price-label">Gia tu</span>
            <div class="tour-price">${formatPrice(tour.price)} <span class="tour-price-unit">/ nguoi</span></div>
          </div>
          <div class="tour-stars">${'★'.repeat(Math.floor(tour.rating))}</div>
        </div>
        <button class="btn-tour" type="button">Xem chi tiet -></button>
      </div>
    </div>
  `;
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
    showToast(error.message || 'Khong tai duoc chi tiet tour.');
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
      <p>${escapeHtml(item.desc)}</p>
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
          <span class="tour-meta-item">Con ${tour.availableSlots} cho</span>
          <span class="tour-badge">${escapeHtml(tour.badge)}</span>
        </div>
      </div>
    </div>
    <div class="tour-detail-body">
      <div class="tour-detail-left">
        <div class="tour-desc-block">
          <h3>Gioi thieu tour</h3>
          <p>${escapeHtml(tour.description)}</p>
        </div>
        <div class="tour-desc-block">
          <h3>Diem noi bat</h3>
          <ul>${highlightsHtml}</ul>
        </div>
        <div class="tour-desc-block">
          <h3>Lich trinh chi tiet</h3>
          ${itineraryHtml || '<p>Chua co lich trinh chi tiet.</p>'}
        </div>
      </div>
      <div class="booking-sidebar">
        <div class="booking-sidebar-price">${formatPrice(tour.price)}</div>
        <div class="booking-sidebar-unit">/ nguoi lon</div>
        <div class="booking-form-group">
          <label>Ngay khoi hanh</label>
          <input type="date" id="sidebarDate">
        </div>
        <div class="booking-form-group">
          <label>So nguoi lon</label>
          <select id="sidebarAdults" onchange="updateSidebarPrice()">
            <option value="1">1 nguoi</option>
            <option value="2" selected>2 nguoi</option>
            <option value="3">3 nguoi</option>
            <option value="4">4 nguoi</option>
            <option value="5">5 nguoi</option>
          </select>
        </div>
        <div class="booking-form-group">
          <label>So tre em</label>
          <select id="sidebarChildren" onchange="updateSidebarPrice()">
            <option value="0" selected>0 tre em</option>
            <option value="1">1 tre em</option>
            <option value="2">2 tre em</option>
            <option value="3">3 tre em</option>
          </select>
        </div>
        <div class="booking-price-est">
          <div class="booking-price-row"><span>Nguoi lon x <span id="adultQty">2</span></span><span id="adultTotal">${formatPrice(tour.price * 2)}</span></div>
          <div class="booking-price-row"><span>Tre em x <span id="childQty">0</span></span><span id="childTotal">${formatPrice(0)}</span></div>
          <div class="booking-price-row total"><span>Tong uoc tinh</span><span id="grandTotal">${formatPrice(tour.price * 2)}</span></div>
        </div>
        <button class="btn-primary full-width" style="border-radius:var(--radius-sm)" onclick="openBooking('${tour.id}')">Dat tour ngay -></button>
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
    showToast('Vui long dang nhap de dat tour.');
    openModal('loginModal');
    return;
  }

  const sourceTour = state.currentTour?.id === tourId
    ? state.currentTour
    : state.tours.find((tour) => tour.id === tourId);

  if (!sourceTour) {
    showToast('Khong tim thay thong tin tour.');
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
    showToast('Phien dang nhap khong hop le.');
    return;
  }

  const button = document.querySelector('#bookingStep2 .btn-primary');
  if (button) {
    button.disabled = true;
    button.textContent = 'Dang xu ly...';
  }

  try {
    const booking = await bookingApi('/api/bookings', {
      method: 'POST',
      body: {
        userId: session.user.id,
        tourId: state.bookingTour.id
      }
    });

    await sleep(500);
    document.getElementById('bookingStep2').classList.add('hidden');
    document.getElementById('bookingStep3').classList.remove('hidden');
    document.getElementById('bookingCode').textContent = booking.id.slice(0, 8).toUpperCase();
  } catch (error) {
    showToast(error.message || 'Dat tour that bai.');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Xac nhan thanh toan';
    }
  }
}

function resetBooking() {
  state.bookingTour = null;
  state.adultsCount = 2;
  state.childrenCount = 0;
  document.getElementById('bookingStep1').classList.remove('hidden');
  document.getElementById('bookingStep2').classList.add('hidden');
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
    showToast('Vui long nhap email va mat khau.');
    return;
  }

  try {
    const response = await userApi('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    saveSession(response);
    closeModal('loginModal');
    showToast(`Dang nhap thanh cong voi vai tro ${response.user.role}.`);
  } catch (error) {
    showToast(error.message || 'Dang nhap that bai.');
  }
}

async function register() {
  const name = document.getElementById('registerName')?.value.trim();
  const phone = document.getElementById('registerPhone')?.value.trim();
  const email = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value;

  if (!email || !password) {
    showToast('Vui long nhap day du thong tin bat buoc.');
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
    showToast('Dang ky thanh cong.');
  } catch (error) {
    showToast(error.message || 'Dang ky that bai.');
  }
}

function logout() {
  clearSession();
  showToast('Da dang xuat.');
}

function newsletterSignup() {
  const email = document.getElementById('newsletterEmail')?.value.trim();
  if (!email) {
    showToast('Vui long nhap email.');
    return;
  }

  showToast('Da dang ky nhan ban tin.');
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
