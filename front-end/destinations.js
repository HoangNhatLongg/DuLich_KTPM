// ── destinations.js – logic for destinations.html ───────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  syncAuthUi();
});

window.addEventListener('luxtravel:auth-changed', () => syncAuthUi());

function initHeader() {
  window.addEventListener('scroll', () => {
    document.getElementById('header')
      .classList.toggle('scrolled', window.scrollY > 50);
  });
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

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
