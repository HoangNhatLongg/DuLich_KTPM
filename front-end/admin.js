const adminState = {
  tours: [],
  bookings: [],
  users: [],
  currentBookingFilter: 'all',
  currentTourFilter: 'all',
  currentTourSearch: '',
  editingTourId: null
};

document.addEventListener('DOMContentLoaded', async () => {
  updateDate();
  
  const session = getSession();
  if (!session) {
    document.getElementById('adminLoginOverlay').style.display = 'flex';
  } else {
    document.getElementById('adminLoginOverlay').style.display = 'none';
    await loadAdminData();
    updateAdminIdentity();
  }
});

window.addEventListener('luxtravel:auth-changed', async () => {
  const session = getSession();
  if (!session) {
    document.getElementById('adminLoginOverlay').style.display = 'flex';
  } else {
    document.getElementById('adminLoginOverlay').style.display = 'none';
    await loadAdminData();
    updateAdminIdentity();
  }
});

async function adminLogin() {
  const emailInput = document.getElementById('adminLoginEmail');
  const passwordInput = document.getElementById('adminLoginPassword');
  const btn = document.querySelector('#adminLoginOverlay .btn-primary-admin');
  
  if (!emailInput.value || !passwordInput.value) {
    showToast('Vui lòng nhập đầy đủ email và mật khẩu');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Đang xác thực...';
  
  try {
    const authResp = await userApi('/api/auth/login', {
      method: 'POST',
      body: {
        email: emailInput.value,
        password: passwordInput.value
      }
    });

    if (authResp && authResp.user) {
      if (authResp.user.role === 'Admin' || authResp.user.role === 'Staff') {
        saveSession(authResp);
        showToast('Đăng nhập quản trị thành công!');
      } else {
        showToast('Tài khoản của bạn không có quyền truy cập trang Quản trị.');
      }
    } else {
      showToast('Phản hồi từ server không hợp lệ.');
    }
  } catch (error) {
    showToast(error.message || 'Đăng nhập thất bại.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Đăng nhập';
  }
}

async function loadAdminData() {
  const session = requireSession();
  const token = session?.accessToken;

  try {
    const [rawTours, rawBookings] = await Promise.all([
      tourApi('/api/tours'),
      bookingApi('/api/bookings', { token })
    ]);

    adminState.tours = rawTours.map(normalizeTour);
    adminState.bookings = rawBookings;
  } catch (error) {
    showToast(error.message || 'Không tải được dữ liệu hệ thống.');
  }

  if (session && isAdminSession(session)) {
    try {
      adminState.users = await userApi('/api/users', { token });
    } catch (error) {
      adminState.users = [];
      showToast(`Không tải được danh sách người dùng: ${error.message}`);
    }
  } else {
    adminState.users = [];
  }

  renderDashboard();
  renderAdminTours();
  renderAllBookings();
  renderCustomers();
  renderReports();
}

function updateAdminIdentity() {
  const session = requireSession();
  const profileName = document.querySelector('.profile-info strong');
  const profileRole = document.querySelector('.profile-info span');
  const topbarName = document.querySelector('.topbar-name');
  const avatarElements = document.querySelectorAll('.avatar, .topbar-avatar');

  if (!session) {
    if (profileName) profileName.textContent = 'Khách';
    if (profileRole) profileRole.textContent = 'Chưa đăng nhập';
    if (topbarName) topbarName.textContent = 'Khách';
    avatarElements.forEach((element) => { element.textContent = 'KG'; });
    return;
  }

  const displayName = session.profile?.name || session.user.email;
  if (profileName) profileName.textContent = displayName;
  if (profileRole) profileRole.textContent = session.user.role;
  if (topbarName) topbarName.textContent = displayName;
  avatarElements.forEach((element) => { element.textContent = getInitials(displayName); });
}

function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('vi-VN', options);
}

function navigate(section, linkElement) {
  document.querySelectorAll('.admin-section').forEach((sectionElement) => sectionElement.classList.remove('active'));
  document.getElementById(`section-${section}`)?.classList.add('active');
  document.querySelectorAll('.sidebar-link').forEach((link) => link.classList.remove('active'));
  linkElement?.classList.add('active');
  document.getElementById('notifPanel').classList.remove('open');

  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('mobile-open');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('adminMain');

  if (window.innerWidth <= 900) {
    sidebar.classList.toggle('mobile-open');
    return;
  }

  sidebar.classList.toggle('collapsed');
  if (sidebar.classList.contains('collapsed')) {
    sidebar.style.transform = 'translateX(-100%)';
    main.style.marginLeft = '0';
  } else {
    sidebar.style.transform = '';
    main.style.marginLeft = 'var(--sidebar-w)';
  }
}

function toggleNotif() {
  document.getElementById('notifPanel').classList.toggle('open');
}

function toggleUserMenu() {
  const session = requireSession();
  if (!session) {
    showToast('Đăng nhập tại trang chủ để quản lý tài khoản.');
    return;
  }

  showToast(`Đang đăng nhập với ${session.user.email}`);
}

function renderDashboard() {
  renderStatCards();
  renderRevenueChart('month');
  renderRecentBookings();
  renderTopTours();
}

function renderStatCards() {
  const todayKey = new Date().toDateString();
  const todaysBookings = adminState.bookings.filter((booking) => new Date(booking.createdAtUtc).toDateString() === todayKey);
  const paidRevenue = sumBookingRevenue(adminState.bookings.filter((booking) => booking.status.toLowerCase() === 'paid'));

  setStatCardValue(0, adminState.tours.length);
  setStatCardValue(1, todaysBookings.length);
  setRevenueValue(paidRevenue);
  setStatCardValue(3, adminState.users.length || uniqueUserIds(adminState.bookings).size);

  const sidebarTourCount = document.getElementById('sidebarTourCount');
  if (sidebarTourCount) sidebarTourCount.textContent = adminState.tours.length;
  
  const sidebarBookingCount = document.getElementById('sidebarBookingCount');
  if (sidebarBookingCount) sidebarBookingCount.textContent = adminState.bookings.length;
}

function setStatCardValue(index, value) {
  const element = document.querySelectorAll('.stat-card-value[data-target]')[index];
  if (element) {
    element.textContent = Number(value || 0).toLocaleString('vi-VN');
  }
}

function setRevenueValue(value) {
  const element = document.querySelector('.stat-card-value.revenue');
  if (element) {
    element.textContent = formatRevenueCompact(value);
  }
}

function renderRevenueChart(period) {
  const chartElement = document.getElementById('revenueChart');
  const labelsElement = document.getElementById('chartLabels');
  if (!chartElement || !labelsElement) {
    return;
  }

  const summary = buildBookingChartData(period);
  const maxRevenue = Math.max(...summary.revenue, 1);
  const maxBookings = Math.max(...summary.bookings, 1);

  chartElement.innerHTML = summary.labels.map((label, index) => `
    <div class="bar-group">
      <div class="bar-wrap">
        <div class="bar bar-revenue" style="height:${Math.max(8, Math.round(summary.revenue[index] / maxRevenue * 130))}px" title="Doanh thu ${formatPrice(summary.revenue[index])}"></div>
        <div class="bar bar-bookings" style="height:${Math.max(8, Math.round(summary.bookings[index] / maxBookings * 130))}px" title="${summary.bookings[index]} booking"></div>
      </div>
    </div>
  `).join('');

  labelsElement.innerHTML = summary.labels.map((label) => `<div class="chart-label">${escapeHtml(label)}</div>`).join('');
}

function updateChartPeriod(period) {
  renderRevenueChart(period);
}

function renderRecentBookings() {
  const tbody = document.getElementById('recentBookingsTbody');
  if (!tbody) {
    return;
  }

  const rows = adminState.bookings
    .slice()
    .sort((left, right) => new Date(right.createdAtUtc) - new Date(left.createdAtUtc))
    .slice(0, 6);

  tbody.innerHTML = rows.map((booking) => bookingRowHtml(booking, true)).join('') || emptyRow(7, 'Chưa có booking nào.');
}

function renderTopTours() {
  const container = document.getElementById('topToursList');
  if (!container) {
    return;
  }

  const tourRevenue = adminState.tours.map((tour) => {
    const bookings = adminState.bookings.filter((booking) => booking.tourId === tour.id);
    return {
      tour,
      bookingCount: bookings.length,
      revenue: sumBookingRevenue(bookings)
    };
  }).sort((left, right) => right.revenue - left.revenue).slice(0, 5);

  const maxRevenue = Math.max(...tourRevenue.map((item) => item.revenue), 1);

  container.innerHTML = tourRevenue.map((item, index) => `
    <div class="top-tour-item">
      <div class="top-tour-rank">${index + 1}</div>
      <div class="top-tour-img" style="background-image:url('${escapeHtml(item.tour.img)}')"></div>
      <div class="top-tour-info">
        <strong>${escapeHtml(item.tour.name)}</strong>
        <span>${escapeHtml(item.tour.destination)} • ${escapeHtml(item.tour.duration)}</span>
      </div>
      <div class="top-tour-bar-wrap">
        <div class="top-tour-bar">
          <div class="top-tour-bar-fill" style="width:${Math.round(item.revenue / maxRevenue * 100)}%"></div>
        </div>
      </div>
      <div class="top-tour-revenue">${formatRevenueCompact(item.revenue)}</div>
    </div>
  `).join('') || '<p>Chưa có dữ liệu tour.</p>';
}

function renderAdminTours() {
  const tbody = document.getElementById('adminToursTbody');
  if (!tbody) {
    return;
  }

  const filteredTours = adminState.tours.filter((tour) => {
    const matchesFilter = adminState.currentTourFilter === 'all' || tour.category === adminState.currentTourFilter;
    const haystack = `${tour.name} ${tour.description} ${tour.destination}`.toLowerCase();
    const matchesSearch = !adminState.currentTourSearch || haystack.includes(adminState.currentTourSearch);
    return matchesFilter && matchesSearch;
  });

  tbody.innerHTML = filteredTours.map((tour) => `
    <tr>
      <td>
        <div class="td-name">
          <img src="${escapeHtml(tour.img)}" class="tour-thumb" alt="${escapeHtml(tour.name)}">
          <div class="td-name-info">
            <strong>${escapeHtml(tour.name)}</strong>
            <span>${escapeHtml(tour.badge)}</span>
          </div>
        </div>
      </td>
      <td style="color:var(--text-muted);max-width:220px">${escapeHtml(shorten(tour.description, 90))}</td>
      <td>${escapeHtml(tour.duration)}</td>
      <td style="color:var(--gold);font-weight:500">${formatPrice(tour.price)}</td>
      <td>${tour.availableSlots}</td>
      <td style="color:var(--text-muted)">${tour.updatedAt ? formatDateTime(tour.updatedAt) : '--'}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn action-view" onclick="previewTour('${tour.id}')">Xem</button>
          <button class="action-btn action-edit" onclick="openTourModal('${tour.id}')">Sửa</button>
          <button class="action-btn action-delete" onclick="confirmDelete('${tour.id}')">Xóa</button>
        </div>
      </td>
    </tr>
  `).join('') || emptyRow(7, 'Chưa có tour nào.');
}

function filterAdminTours(filter, button) {
  adminState.currentTourFilter = filter;
  document.querySelectorAll('.tab-btn').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  renderAdminTours();
}

function searchTours(query) {
  adminState.currentTourSearch = query.trim().toLowerCase();
  renderAdminTours();
}

function renderAllBookings(filter = adminState.currentBookingFilter) {
  const tbody = document.getElementById('allBookingsTbody');
  if (!tbody) {
    return;
  }

  const filteredBookings = adminState.bookings.filter((booking) => filter === 'all' || booking.status.toLowerCase() === filter);
  tbody.innerHTML = filteredBookings
    .slice()
    .sort((left, right) => new Date(right.createdAtUtc) - new Date(left.createdAtUtc))
    .map((booking) => bookingRowHtml(booking, false))
    .join('') || emptyRow(9, 'Không có booking phù hợp.');
}

function filterBookingStatus(value) {
  adminState.currentBookingFilter = value;
  renderAllBookings();
}

function bookingRowHtml(booking, compact) {
  const tour = getTourById(booking.tourId);
  const user = getUserById(booking.userId);
  const revenue = tour ? tour.price : 0;
  const name = user?.email || `User ${booking.userId.slice(0, 8)}`;
  const email = user?.email || 'Không có email';
  const actions = compact
    ? `
      <div class="table-actions">
        <button class="action-btn action-view" onclick="viewBookingDetail('${booking.id}')">Xem</button>
      </div>
    `
    : `
      <div class="table-actions">
        <button class="action-btn action-view" onclick="viewBookingDetail('${booking.id}')">Xem</button>
        ${booking.status.toLowerCase() !== 'paid' ? `<button class="action-btn action-edit" onclick="updateBookingStatus('${booking.id}','Paid')">Paid</button>` : ''}
        ${booking.status.toLowerCase() !== 'cancelled' ? `<button class="action-btn action-delete" onclick="updateBookingStatus('${booking.id}','Cancelled')">Hủy</button>` : ''}
      </div>
    `;

  if (compact) {
    return `
      <tr>
        <td><span class="booking-code-cell">#${booking.id.slice(0, 8).toUpperCase()}</span></td>
        <td>
          <div class="td-name">
            <div class="td-avatar">${getInitials(name)}</div>
            <div class="td-name-info">
              <strong>${escapeHtml(name)}</strong>
              <span>${escapeHtml(email)}</span>
            </div>
          </div>
        </td>
        <td>${escapeHtml(tour?.name || booking.tourId)}</td>
        <td style="color:var(--text-muted)">${formatDate(booking.createdAtUtc)}</td>
        <td style="color:var(--gold);font-weight:500">${formatPrice(revenue)}</td>
        <td>${statusBadge(booking.status)}</td>
        <td>${actions}</td>
      </tr>
    `;
  }

  return `
    <tr>
      <td><span class="booking-code-cell">#${booking.id.slice(0, 8).toUpperCase()}</span></td>
      <td>
        <div class="td-name">
          <div class="td-avatar">${getInitials(name)}</div>
          <div class="td-name-info">
            <strong>${escapeHtml(name)}</strong>
            <span>${escapeHtml(email)}</span>
          </div>
        </div>
      </td>
      <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:0.82rem">${escapeHtml(tour?.name || booking.tourId)}</td>
      <td style="color:var(--text-muted);font-size:0.82rem">${formatDate(booking.createdAtUtc)}</td>
      <td style="color:var(--text-muted);font-size:0.82rem">--</td>
      <td style="font-size:0.82rem">1</td>
      <td style="color:var(--gold);font-weight:500">${formatPrice(revenue)}</td>
      <td>${statusBadge(booking.status)}</td>
      <td>${actions}</td>
    </tr>
  `;
}

function viewBookingDetail(id) {
  const booking = adminState.bookings.find((item) => item.id === id);
  if (!booking) {
    return;
  }

  const tour = getTourById(booking.tourId);
  const user = getUserById(booking.userId);
  const title = document.getElementById('detailModalTitle');
  const body = document.getElementById('detailModalBody');
  if (title && body) {
    title.textContent = `Chi tiết Booking #${booking.id.slice(0, 8).toUpperCase()}`;
    body.innerHTML = `
      <p style="margin-bottom:0.5rem"><strong>Khách hàng:</strong> ${user?.email || booking.userId}</p>
      <p style="margin-bottom:0.5rem"><strong>Tour:</strong> ${tour?.name || booking.tourId}</p>
      <p style="margin-bottom:0.5rem"><strong>Trạng thái:</strong> ${booking.status}</p>
      <p style="margin-bottom:0.5rem"><strong>Ngày đặt:</strong> ${formatDateTime(booking.createdAtUtc)}</p>
    `;
    document.getElementById('detailModal').classList.add('open');
  }
}

function renderCustomers() {
  const tbody = document.getElementById('customersTbody');
  if (!tbody) {
    return;
  }

  const customers = Array.from(uniqueUserIds(adminState.bookings)).map((userId) => {
    const bookings = adminState.bookings.filter((booking) => booking.userId === userId);
    const user = getUserById(userId);
    return {
      id: userId,
      name: user?.email || `User ${userId.slice(0, 8)}`,
      email: user?.email || 'Khong co email',
      phone: '--',
      bookings: bookings.length,
      total: sumBookingRevenue(bookings),
      vip: deriveVip(bookings.length)
    };
  });

  tbody.innerHTML = customers.map((customer) => `
    <tr>
      <td>
        <div class="td-name">
          <div class="td-avatar">${getInitials(customer.name)}</div>
          <div class="td-name-info">
            <strong>${escapeHtml(customer.name)}</strong>
            <span>${escapeHtml(customer.email)}</span>
          </div>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem">${escapeHtml(customer.email)}</td>
      <td style="color:var(--text-muted);font-size:0.82rem">${escapeHtml(customer.phone)}</td>
      <td style="text-align:center">${customer.bookings}</td>
      <td style="color:var(--gold);font-weight:500">${formatPrice(customer.total)}</td>
      <td>${vipBadge(customer.vip)}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn action-view" onclick="showCustomerProfile('${customer.id}')">Hồ sơ</button>
        </div>
      </td>
    </tr>
  `).join('') || emptyRow(7, 'Chưa có dữ liệu khách hàng.');
}

function renderReports() {
  renderDestinationRevenue();
  renderPieLegend();
  renderAreaChart();
}

function renderDestinationRevenue() {
  const container = document.getElementById('destRevBars');
  if (!container) {
    return;
  }

  const records = adminState.tours.map((tour) => {
    const bookings = adminState.bookings.filter((booking) => booking.tourId === tour.id);
    return {
      name: tour.destination,
      revenue: sumBookingRevenue(bookings)
    };
  }).sort((left, right) => right.revenue - left.revenue).slice(0, 5);

  const maxRevenue = Math.max(...records.map((item) => item.revenue), 1);
  container.innerHTML = records.map((item) => `
    <div class="h-bar-item">
      <div class="h-bar-label"><span>${escapeHtml(item.name)}</span><strong>${formatRevenueCompact(item.revenue)}</strong></div>
      <div class="h-bar-track"><div class="h-bar-fill" style="width:${Math.round(item.revenue / maxRevenue * 100)}%"></div></div>
    </div>
  `).join('') || '<p>Chưa có dữ liệu báo cáo.</p>';
}

function renderPieLegend() {
  const element = document.getElementById('pieLegend');
  if (!element) {
    return;
  }

  const totalUsers = Math.max(uniqueUserIds(adminState.bookings).size, 1);
  const paidCount = adminState.bookings.filter((booking) => booking.status.toLowerCase() === 'paid').length;
  const pendingCount = adminState.bookings.filter((booking) => booking.status.toLowerCase() === 'pending').length;
  const cancelledCount = adminState.bookings.filter((booking) => booking.status.toLowerCase() === 'cancelled').length;
  const series = [
    { label: 'Đã thanh toán', pct: Math.round(paidCount / Math.max(adminState.bookings.length, 1) * 100), color: '#c9a96e' },
    { label: 'Chờ thanh toán', pct: Math.round(pendingCount / Math.max(adminState.bookings.length, 1) * 100), color: '#7cb9e8' },
    { label: 'Đã hủy', pct: Math.round(cancelledCount / Math.max(adminState.bookings.length, 1) * 100), color: '#e8a0d0' },
    { label: 'Người dùng', pct: Math.round((adminState.users.length || totalUsers) / totalUsers * 100), color: '#90c97e' }
  ];

  element.innerHTML = series.map((item) => `
    <div class="pie-item">
      <div class="pie-color" style="background:${item.color}"></div>
      <span class="pie-label">${escapeHtml(item.label)}</span>
      <div class="pie-bar-track"><div class="pie-bar-fill" style="width:${item.pct}%;background:${item.color}"></div></div>
      <span class="pie-pct">${item.pct}%</span>
    </div>
  `).join('');
}

function renderAreaChart() {
  const chart = document.getElementById('areaChart');
  const labels = document.getElementById('areaLabels');
  if (!chart || !labels) {
    return;
  }

  const monthly = buildBookingChartData('month');
  const lastSix = monthly.labels.slice(-6).map((label, index) => ({
    label,
    value: monthly.revenue.slice(-6)[index]
  }));
  const maxValue = Math.max(...lastSix.map((item) => item.value), 1);

  chart.innerHTML = lastSix.map((item) => `
    <div class="area-col">
      <div class="area-bar" style="height:${Math.max(8, Math.round(item.value / maxValue * 110))}px"></div>
    </div>
  `).join('');

  labels.innerHTML = lastSix.map((item) => `<div class="area-label">${escapeHtml(item.label)}</div>`).join('');
}

async function openTourModal(id = null) {
  adminState.editingTourId = id;
  const title = document.getElementById('tourModalTitle');
  let tour = null;

  if (id) {
    try {
      const token = requireSession()?.accessToken;
      const rawTour = await tourApi(`/api/tours/${id}`, { token });
      tour = normalizeTour(rawTour);
    } catch (err) {
      showToast('Không tải được chi tiết tour.');
      return;
    }
  }

  if (tour) {
    title.textContent = 'Chỉnh sửa tour';
    setInput('tourFormName', tour.name);
    setInput('tourFormSlots', tour.availableSlots);
    setInput('tourFormPrice', tour.price);
    setInput('tourFormDuration', tour.duration);
    setInput('tourFormDayCount', tour.totalDays);
    setInput('tourFormDesc', tour.description);
    renderItineraryInputs(tour.totalDays, tour.itinerary);
  } else {
    title.textContent = 'Thêm tour mới';
    clearTourForm();
  }

  document.getElementById('tourModal').classList.add('open');
}

function closeTourModal() {
  document.getElementById('tourModal').classList.remove('open');
  adminState.editingTourId = null;
  clearTourForm();
}

function clearTourForm() {
  ['tourFormName', 'tourFormSlots', 'tourFormPrice', 'tourFormDuration', 'tourFormDayCount', 'tourFormDesc']
    .forEach((id) => setInput(id, ''));
  renderItineraryInputs(1, []);
}

function renderItineraryInputs(dayCount, existingItineraries = []) {
  const container = document.getElementById('tourItineraryContainer');
  if (!container) return;

  const count = parseInt(dayCount, 10) || 1;
  let html = '';

  for (let i = 1; i <= count; i++) {
    const existing = existingItineraries.find(it => parseInt(it.day.replace('Ngày ', '')) === i) || {};
    html += `
      <div class="itinerary-day-block" style="border:1px solid var(--border-color); padding:1rem; border-radius:var(--radius-sm); margin-bottom:1rem; background:var(--bg-alt)">
        <h4 style="margin-bottom:0.75rem; color:var(--primary-color)">Ngày ${i}</h4>
        <div class="form-group" style="margin-bottom:0.75rem">
          <label style="font-size:0.8rem">Sáng</label>
          <textarea id="itin_morning_${i}" rows="3" placeholder="Hoạt động buổi sáng...">${escapeHtml(existing.morning || '')}</textarea>
        </div>
        <div class="form-group" style="margin-bottom:0.75rem">
          <label style="font-size:0.8rem">Trưa</label>
          <textarea id="itin_noon_${i}" rows="3" placeholder="Hoạt động buổi trưa...">${escapeHtml(existing.noon || '')}</textarea>
        </div>
        <div class="form-group" style="margin-bottom:0.75rem">
          <label style="font-size:0.8rem">Chiều</label>
          <textarea id="itin_afternoon_${i}" rows="3" placeholder="Hoạt động buổi chiều...">${escapeHtml(existing.afternoon || '')}</textarea>
        </div>
        <div class="form-group" style="margin-bottom:0.75rem">
          <label style="font-size:0.8rem">Tối</label>
          <textarea id="itin_evening_${i}" rows="3" placeholder="Hoạt động buổi tối...">${escapeHtml(existing.evening || '')}</textarea>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

document.getElementById('tourFormDayCount')?.addEventListener('input', (e) => {
  const currentDays = parseInt(e.target.value, 10);
  if (currentDays > 0) {
    const currentData = collectItineraryInputs();
    renderItineraryInputs(currentDays, currentData);
  }
});

function collectItineraryInputs() {
  const container = document.getElementById('tourItineraryContainer');
  if (!container) return [];
  const blocks = container.querySelectorAll('.itinerary-day-block');
  const itineraries = [];
  let isValid = true;
  
  blocks.forEach((block, index) => {
    const day = index + 1;
    const morning = document.getElementById(`itin_morning_${day}`)?.value.trim();
    const noon = document.getElementById(`itin_noon_${day}`)?.value.trim();
    const afternoon = document.getElementById(`itin_afternoon_${day}`)?.value.trim();
    const evening = document.getElementById(`itin_evening_${day}`)?.value.trim();
    
    if (!morning || !noon || !afternoon || !evening) {
      isValid = false;
    }

    if (morning || noon || afternoon || evening) {
      itineraries.push({
        dayNumber: day,
        day: `Ngày ${day}`,
        morning: morning,
        noon: noon,
        afternoon: afternoon,
        evening: evening
      });
    }
  });
  
  itineraries.isValid = isValid;
  return itineraries;
}

async function saveTour() {
  const token = requireSession()?.accessToken;
  const name = getInput('tourFormName');
  const slots = Number(getInput('tourFormSlots'));
  const price = Number(getInput('tourFormPrice'));
  const description = getInput('tourFormDesc');
  const itineraryPayload = collectItineraryInputs();
  const dayCountInput = Number(getInput('tourFormDayCount'));
  const dayCount = itineraryPayload.length || dayCountInput || 1;

  if (!name || !description || !price || Number.isNaN(slots)) {
    showToast('Vui lòng nhập đầy đủ tên, giá, số chỗ và mô tả.');
    return;
  }

  if (itineraryPayload.length !== dayCount || !itineraryPayload.isValid) {
    showToast('Vui lòng nhập đầy đủ lịch trình cho tất cả các ngày (không được bỏ trống buổi nào).');
    return;
  }

  const body = {
    name,
    description,
    price,
    availableSlots: slots,
    itineraries: itineraryPayload
  };

  try {
    if (adminState.editingTourId) {
      await tourApi(`/api/tours/${adminState.editingTourId}`, {
        method: 'PUT',
        body: {
          name: body.name,
          description: body.description,
          price: body.price,
          availableSlots: body.availableSlots
        },
        token
      });

      const existingTour = await tourApi(`/api/tours/${adminState.editingTourId}`);
      const existingItineraries = existingTour.itineraries || [];
      for (const item of existingItineraries) {
        await tourApi(`/api/tours/${adminState.editingTourId}/itineraries/${item.id}`, {
          method: 'PUT',
          body: {
            dayNumber: item.dayNumber,
            morning: body.itineraries.find(i => i.dayNumber === item.dayNumber)?.morning,
            noon: body.itineraries.find(i => i.dayNumber === item.dayNumber)?.noon,
            afternoon: body.itineraries.find(i => i.dayNumber === item.dayNumber)?.afternoon,
            evening: body.itineraries.find(i => i.dayNumber === item.dayNumber)?.evening
          },
          token
        });
      }

      for (let index = existingItineraries.length; index < body.itineraries.length; index += 1) {
        await tourApi(`/api/tours/${adminState.editingTourId}/itineraries`, {
          method: 'POST',
          body: body.itineraries[index],
          token
        });
      }

      for (let index = body.itineraries.length; index < existingItineraries.length; index += 1) {
        await tourApi(`/api/tours/${adminState.editingTourId}/itineraries/${existingItineraries[index].id}`, {
          method: 'DELETE',
          token
        });
      }
    } else {
      await tourApi('/api/tours', {
        method: 'POST',
        body,
        token
      });
    }

    closeTourModal();
    await loadAdminData();
    showToast('Đã lưu tour thành công.');
  } catch (error) {
    showToast(error.message || 'Không thể lưu tour.');
  }
}

function confirmDelete(id) {
  const tour = adminState.tours.find((item) => item.id === id);
  if (!tour) {
    return;
  }

  document.getElementById('confirmMsg').textContent = `Bạn có chắc muốn xóa tour "${tour.name}"?`;
  document.getElementById('confirmActionBtn').onclick = async () => {
    try {
      const token = requireSession()?.accessToken;
      await tourApi(`/api/tours/${id}`, { method: 'DELETE', token });
      closeModal('confirmModal');
      await loadAdminData();
      showToast('Đã xóa tour.');
    } catch (error) {
      showToast(error.message || 'Xóa tour thất bại.');
    }
  };
  document.getElementById('confirmModal').classList.add('open');
}

async function updateBookingStatus(id, status) {
  try {
    const token = requireSession()?.accessToken;
    await bookingApi(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status },
      token
    });
    await loadAdminData();
    showToast(`Đã cập nhật booking sang ${status}.`);
  } catch (error) {
    showToast(error.message || 'Không thể cập nhật booking.');
  }
}

function previewTour(id) {
  const tour = adminState.tours.find((item) => item.id === id);
  if (!tour) {
    return;
  }

  const title = document.getElementById('detailModalTitle');
  const body = document.getElementById('detailModalBody');
  if (title && body) {
    title.textContent = `Chi tiết Tour`;
    body.innerHTML = `
      <p style="margin-bottom:0.5rem"><strong>Tên tour:</strong> ${escapeHtml(tour.name)}</p>
      <p style="margin-bottom:0.5rem"><strong>Thời gian:</strong> ${escapeHtml(tour.duration)}</p>
      <p style="margin-bottom:0.5rem"><strong>Giá:</strong> <span style="color:var(--gold);font-weight:600">${formatPrice(tour.price)}</span></p>
      <p style="margin-bottom:0.5rem"><strong>Số chỗ còn lại:</strong> ${tour.availableSlots}</p>
      <p style="margin-bottom:0.5rem"><strong>Điểm đến:</strong> ${escapeHtml(tour.destination)}</p>
    `;
    document.getElementById('detailModal').classList.add('open');
  }
}

function showCustomerProfile(id) {
  const user = getUserById(id);
  const bookings = adminState.bookings.filter(b => b.userId === id);
  const total = sumBookingRevenue(bookings);
  const title = document.getElementById('detailModalTitle');
  const body = document.getElementById('detailModalBody');
  if (title && body) {
    title.textContent = `Hồ sơ Khách hàng`;
    body.innerHTML = `
      <p style="margin-bottom:0.5rem"><strong>Email:</strong> ${user ? escapeHtml(user.email) : `User ${id.slice(0,8)}`}</p>
      <p style="margin-bottom:0.5rem"><strong>Số booking:</strong> ${bookings.length}</p>
      <p style="margin-bottom:0.5rem"><strong>Tổng chi tiêu:</strong> <span style="color:var(--gold);font-weight:600">${formatPrice(total)}</span></p>
      <p style="margin-bottom:0.5rem"><strong>Hạng VIP:</strong> ${vipBadge(deriveVip(bookings.length))}</p>
    `;
    document.getElementById('detailModal').classList.add('open');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('open');
    if (event.target.id === 'tourModal') {
      adminState.editingTourId = null;
      clearTourForm();
    }
  }
});

function statusBadge(status) {
  const normalized = (status || '').toLowerCase();
  const labels = {
    paid: '<span class="badge badge-paid">Đã thanh toán</span>',
    pending: '<span class="badge badge-pending">Chờ thanh toán</span>',
    cancelled: '<span class="badge badge-cancelled">Đã hủy</span>'
  };
  return labels[normalized] || normalized;
}

function vipBadge(vip) {
  const colors = {
    Platinum: '#e8e8ff',
    Gold: '#c9a96e',
    Silver: '#aab0c0',
    Member: '#6b7898'
  };
  const backgrounds = {
    Platinum: 'rgba(180,180,255,0.1)',
    Gold: 'rgba(201,169,110,0.12)',
    Silver: 'rgba(170,176,192,0.1)',
    Member: 'rgba(107,120,152,0.1)'
  };
  return `<span class="badge" style="background:${backgrounds[vip]};color:${colors[vip]};border-color:${colors[vip]}33">★ ${vip}</span>`;
}

function deriveVip(count) {
  if (count >= 8) return 'Platinum';
  if (count >= 5) return 'Gold';
  if (count >= 2) return 'Silver';
  return 'Member';
}

function showToast(message) {
  const toast = document.getElementById('adminToast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function getTourById(id) {
  return adminState.tours.find((tour) => tour.id === id) || null;
}

function getUserById(id) {
  return adminState.users.find((user) => user.id === id) || null;
}

function sumBookingRevenue(bookings) {
  return bookings.reduce((total, booking) => {
    const tour = getTourById(booking.tourId);
    return total + (tour?.price || 0);
  }, 0);
}

function buildBookingChartData(period) {
  if (period === 'week') {
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const bookings = Array.from({ length: 7 }, () => 0);
    const revenue = Array.from({ length: 7 }, () => 0);

    adminState.bookings.forEach((booking) => {
      const date = new Date(booking.createdAtUtc);
      const dayIndex = (date.getDay() + 6) % 7;
      bookings[dayIndex] += 1;
      revenue[dayIndex] += getTourById(booking.tourId)?.price || 0;
    });

    return { labels, bookings, revenue };
  }

  if (period === 'quarter') {
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    const bookings = Array.from({ length: 4 }, () => 0);
    const revenue = Array.from({ length: 4 }, () => 0);

    adminState.bookings.forEach((booking) => {
      const quarter = Math.floor(new Date(booking.createdAtUtc).getMonth() / 3);
      bookings[quarter] += 1;
      revenue[quarter] += getTourById(booking.tourId)?.price || 0;
    });

    return { labels, bookings, revenue };
  }

  const labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const bookings = Array.from({ length: 12 }, () => 0);
  const revenue = Array.from({ length: 12 }, () => 0);

  adminState.bookings.forEach((booking) => {
    const month = new Date(booking.createdAtUtc).getMonth();
    bookings[month] += 1;
    revenue[month] += getTourById(booking.tourId)?.price || 0;
  });

  return { labels, bookings, revenue };
}

function formatRevenueCompact(value) {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)} tỷ`;
  }
  if (value >= 1000000) {
    return `${Math.round(value / 1000000)} tr`;
  }
  return value.toLocaleString('vi-VN');
}

function uniqueUserIds(bookings) {
  return new Set(bookings.map((booking) => booking.userId));
}

function shorten(value, maxLength) {
  if ((value || '').length <= maxLength) {
    return value || '';
  }
  return `${value.slice(0, maxLength - 3)}...`;
}

function emptyRow(colspan, message) {
  return `<tr><td colspan="${colspan}" style="text-align:center;padding:2rem;color:var(--text-muted)">${escapeHtml(message)}</td></tr>`;
}

function getInput(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function setInput(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value;
  }
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebar').style.transform = '';
    document.getElementById('adminMain').style.marginLeft = 'var(--sidebar-w)';
  }
});

document.addEventListener('click', (event) => {
  const panel = document.getElementById('notifPanel');
  const button = document.querySelector('.notif-btn');
  if (panel && button && !panel.contains(event.target) && !button.contains(event.target)) {
    panel.classList.remove('open');
  }
});
