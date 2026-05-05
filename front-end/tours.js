// ── tours.js – logic for tours.html ─────────────────────────────────────────

const state = {
  tours: [],
  activeFilter: 'all',
  activeSearch: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  syncAuthUi();
  await loadTours();
  readQueryParams();
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

// ── Read URL params from hero search ─────────────────────────────────────────

function readQueryParams() {
  const params = new URLSearchParams(location.search);
  const search = params.get('search') || '';
  if (search) {
    state.activeSearch = search;
    renderAllTours();
  }
}

// ── Load & render tours ───────────────────────────────────────────────────────

async function loadTours() {
  try {
    const tours = await tourApi('/api/tours');
    state.tours = tours.map(normalizeTour);
  } catch (err) {
    state.tours = [];
    showToast(err.message || 'Không tải được danh sách tour.');
  }
  renderAllTours();
}

function renderAllTours() {
  const container = document.getElementById('allTours');
  if (!container) return;

  const filtered = state.tours.filter(tour => {
    const matchFilter = state.activeFilter === 'all' || tour.category === state.activeFilter;
    const haystack = `${tour.name} ${tour.destination} ${tour.description}`.toLowerCase();
    const matchSearch = !state.activeSearch || haystack.includes(state.activeSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  container.innerHTML = filtered.length
    ? filtered.map(tourCardHtml).join('')
    : '<p style="text-align:center;color:var(--text-muted)">Không tìm thấy tour phù hợp.</p>';

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

function filterTours(category, button) {
  state.activeFilter = category;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  renderAllTours();
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

// ── Auth modals ───────────────────────────────────────────────────────────────

async function login() {
  const email    = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  if (!email || !password) { showToast('Vui lòng nhập email và mật khẩu.'); return; }
  try {
    const response = await userApi('/api/auth/login', { method: 'POST', body: { email, password } });
    saveSession(response);
    closeModal('loginModal');
    showToast(`Đăng nhập thành công.`);
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
