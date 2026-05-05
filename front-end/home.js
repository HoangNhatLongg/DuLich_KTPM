// ── home.js – logic for index.html ──────────────────────────────────────────

const state = {
  tours: [],
  currentSlide: 0,
  slideInterval: null,
  activeSearch: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  setDefaultDate();
  initHeader();
  initScrollEffects();
  startSlider();
  syncAuthUi();
  await loadFeaturedTours();
});

window.addEventListener('luxtravel:auth-changed', () => {
  syncAuthUi();
});

// ── Header / Nav ─────────────────────────────────────────────────────────────

function initHeader() {
  window.addEventListener('scroll', () => {
    document.getElementById('header')
      .classList.toggle('scrolled', window.scrollY > 50);
  });
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ── Hero slider ──────────────────────────────────────────────────────────────

function startSlider() {
  state.slideInterval = setInterval(() => {
    goSlide((state.currentSlide + 1) % 3);
  }, 5000);
}

function goSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.dot');
  if (!slides.length) return;

  slides[state.currentSlide]?.classList.remove('active');
  dots[state.currentSlide]?.classList.remove('active');
  state.currentSlide = index;
  slides[state.currentSlide]?.classList.add('active');
  dots[state.currentSlide]?.classList.add('active');
}

// ── Default date ─────────────────────────────────────────────────────────────

function setDefaultDate() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const value = nextWeek.toISOString().split('T')[0];
  const el = document.getElementById('heroDepartureDate');
  if (el) el.value = value;
}

// ── Auth UI ──────────────────────────────────────────────────────────────────

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

// ── Tours ────────────────────────────────────────────────────────────────────

async function loadFeaturedTours() {
  try {
    const tours = await tourApi('/api/tours');
    state.tours = tours.map(normalizeTour);
  } catch {
    state.tours = [];
  }
  renderFeaturedTours();
}

function renderFeaturedTours() {
  const container = document.getElementById('featuredTours');
  if (!container) return;

  const featured = state.tours.slice(0, 3);
  container.innerHTML = featured.length
    ? featured.map(tourCardHtml).join('')
    : '<p style="text-align:center;color:var(--text-muted)">Chưa có dữ liệu tour.</p>';

  initScrollEffects();
}

function tourCardHtml(tour) {
  return `
    <div class="tour-card animate-on-scroll" onclick="location.href='tour-detail.html?id=${tour.id}'">
      <div class="tour-card-img">
        <img src="${escapeHtml(tour.img)}" alt="${escapeHtml(tour.name)}" loading="lazy">
        <span class="tour-badge">${escapeHtml(tour.badge)}</span>
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
        <button class="btn-tour" type="button">Xem chi tiết →</button>
      </div>
    </div>
  `;
}

// ── Hero search → redirect to tours.html ─────────────────────────────────────

function searchToursFromHero() {
  const destination = document.getElementById('heroDestinationSelect')?.value || '';
  const date = document.getElementById('heroDepartureDate')?.value || '';
  const params = new URLSearchParams({ search: destination, date });
  location.href = `tours.html?${params.toString()}`;
}

// ── Newsletter ────────────────────────────────────────────────────────────────

function newsletterSignup() {
  const email = document.getElementById('newsletterEmail')?.value.trim();
  if (!email) { showToast('Vui lòng nhập email.'); return; }
  showToast('Đã đăng ký nhận bản tin.');
  document.getElementById('newsletterEmail').value = '';
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
    showToast(`Đăng nhập thành công với vai trò ${response.user.role}.`);
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
  if (!email || !password) { showToast('Vui lòng nhập đầy đủ thông tin bắt buộc.'); return; }
  try {
    const response = await userApi('/api/auth/register', {
      method: 'POST',
      body: { email, password, role: 'Customer' }
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

// ── Scroll animations ─────────────────────────────────────────────────────────

function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), i * 80);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}
