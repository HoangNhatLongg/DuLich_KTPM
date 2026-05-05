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
  await loadAdminData();
  updateAdminIdentity();
});

window.addEventListener('luxtravel:auth-changed', () => {
  updateAdminIdentity();
});

async function loadAdminData() {
  try {
    const [rawTours, rawBookings] = await Promise.all([
      tourApi('/api/tours'),
      bookingApi('/api/bookings')
    ]);

    adminState.tours = rawTours.map(normalizeTour);
    adminState.bookings = rawBookings;
  } catch (error) {
    showToast(error.message || 'Khong tai duoc du lieu he thong.');
  }

  const session = requireSession();
  if (session && isAdminSession(session)) {
    try {
      adminState.users = await userApi('/api/users', {
        token: session.accessToken
      });
    } catch (error) {
      adminState.users = [];
      showToast(`Khong tai duoc danh sach nguoi dung: ${error.message}`);
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
    if (profileName) profileName.textContent = 'Khach';
    if (profileRole) profileRole.textContent = 'Chua dang nhap';
    if (topbarName) topbarName.textContent = 'Khach';
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
    showToast('Dang nhap tai trang chu de quan ly tai khoan.');
    return;
  }

  showToast(`Dang dang nhap voi ${session.user.email}`);
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

  tbody.innerHTML = rows.map((booking) => bookingRowHtml(booking, true)).join('') || emptyRow(7, 'Chua co booking nao.');
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
  `).join('') || '<p>Chua co du lieu tour.</p>';
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
          <button class="action-btn action-edit" onclick="openTourModal('${tour.id}')">Sua</button>
          <button class="action-btn action-delete" onclick="confirmDelete('${tour.id}')">Xoa</button>
        </div>
      </td>
    </tr>
  `).join('') || emptyRow(7, 'Chua co tour nao.');
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
    .join('') || emptyRow(9, 'Khong co booking phu hop.');
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
  const email = user?.email || 'Khong co email';
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
        ${booking.status.toLowerCase() !== 'cancelled' ? `<button class="action-btn action-delete" onclick="updateBookingStatus('${booking.id}','Cancelled')">Huy</button>` : ''}
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
  showToast(`Booking ${booking.id.slice(0, 8).toUpperCase()} - ${tour?.name || booking.tourId} - ${booking.status}`);
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
          <button class="action-btn action-view" onclick="showCustomerProfile('${customer.id}')">Ho so</button>
        </div>
      </td>
    </tr>
  `).join('') || emptyRow(7, 'Chua co du lieu khach hang.');
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
  `).join('') || '<p>Chua co du lieu bao cao.</p>';
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
    { label: 'Da thanh toan', pct: Math.round(paidCount / Math.max(adminState.bookings.length, 1) * 100), color: '#c9a96e' },
    { label: 'Cho thanh toan', pct: Math.round(pendingCount / Math.max(adminState.bookings.length, 1) * 100), color: '#7cb9e8' },
    { label: 'Da huy', pct: Math.round(cancelledCount / Math.max(adminState.bookings.length, 1) * 100), color: '#e8a0d0' },
    { label: 'Nguoi dung', pct: Math.round((adminState.users.length || totalUsers) / totalUsers * 100), color: '#90c97e' }
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

function openTourModal(id = null) {
  adminState.editingTourId = id;
  const title = document.getElementById('tourModalTitle');
  const tour = adminState.tours.find((item) => item.id === id);

  if (tour) {
    title.textContent = 'Chinh sua tour';
    setInput('tourFormName', tour.name);
    setInput('tourFormSlots', tour.availableSlots);
    setInput('tourFormPrice', tour.price);
    setInput('tourFormDuration', tour.duration);
    setInput('tourFormDayCount', tour.totalDays);
    setInput('tourFormDesc', tour.description);
    setInput('tourFormItinerary', tour.itinerary.map((item) => `Ngay ${item.day.replace('Ngay ', '')}: ${item.desc}`).join('\n'));
  } else {
    title.textContent = 'Them tour moi';
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
  ['tourFormName', 'tourFormSlots', 'tourFormPrice', 'tourFormDuration', 'tourFormDayCount', 'tourFormDesc', 'tourFormItinerary']
    .forEach((id) => setInput(id, ''));
}

async function saveTour() {
  const name = getInput('tourFormName');
  const slots = Number(getInput('tourFormSlots'));
  const price = Number(getInput('tourFormPrice'));
  const description = getInput('tourFormDesc');
  const itineraryPayload = buildItineraryPayload(getInput('tourFormItinerary'));
  const dayCountInput = Number(getInput('tourFormDayCount'));
  const dayCount = itineraryPayload.length || dayCountInput || 1;

  if (!name || !description || !price || Number.isNaN(slots)) {
    showToast('Vui long nhap day du ten, gia, so cho va mo ta.');
    return;
  }

  const body = {
    name,
    description,
    price,
    availableSlots: slots,
    itineraries: itineraryPayload.length ? itineraryPayload : Array.from({ length: dayCount }, (_, index) => ({
      dayNumber: index + 1,
      description: `Lich trinh ngay ${index + 1}`
    }))
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
        }
      });

      const existingTour = await tourApi(`/api/tours/${adminState.editingTourId}`);
      const existingItineraries = existingTour.itineraries || [];
      for (const item of existingItineraries) {
        await tourApi(`/api/tours/${adminState.editingTourId}/itineraries/${item.id}`, {
          method: 'PUT',
          body: {
            dayNumber: item.dayNumber,
            description: body.itineraries[item.dayNumber - 1]?.description || item.description
          }
        });
      }

      for (let index = existingItineraries.length; index < body.itineraries.length; index += 1) {
        await tourApi(`/api/tours/${adminState.editingTourId}/itineraries`, {
          method: 'POST',
          body: body.itineraries[index]
        });
      }

      for (let index = body.itineraries.length; index < existingItineraries.length; index += 1) {
        await tourApi(`/api/tours/${adminState.editingTourId}/itineraries/${existingItineraries[index].id}`, {
          method: 'DELETE'
        });
      }
    } else {
      await tourApi('/api/tours', {
        method: 'POST',
        body
      });
    }

    closeTourModal();
    await loadAdminData();
    showToast('Da luu tour thanh cong.');
  } catch (error) {
    showToast(error.message || 'Khong the luu tour.');
  }
}

function confirmDelete(id) {
  const tour = adminState.tours.find((item) => item.id === id);
  if (!tour) {
    return;
  }

  document.getElementById('confirmMsg').textContent = `Ban co chac muon xoa tour "${tour.name}"?`;
  document.getElementById('confirmActionBtn').onclick = async () => {
    try {
      await tourApi(`/api/tours/${id}`, { method: 'DELETE' });
      closeModal('confirmModal');
      await loadAdminData();
      showToast('Da xoa tour.');
    } catch (error) {
      showToast(error.message || 'Xoa tour that bai.');
    }
  };
  document.getElementById('confirmModal').classList.add('open');
}

async function updateBookingStatus(id, status) {
  try {
    await bookingApi(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: { status }
    });
    await loadAdminData();
    showToast(`Da cap nhat booking sang ${status}.`);
  } catch (error) {
    showToast(error.message || 'Khong the cap nhat booking.');
  }
}

function previewTour(id) {
  const tour = adminState.tours.find((item) => item.id === id);
  if (!tour) {
    return;
  }

  showToast(`${tour.name} - ${tour.duration} - ${formatPrice(tour.price)}`);
}

function showCustomerProfile(id) {
  const user = getUserById(id);
  showToast(user ? user.email : `User ${id.slice(0, 8)}`);
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
    paid: '<span class="badge badge-paid">Da thanh toan</span>',
    pending: '<span class="badge badge-pending">Cho thanh toan</span>',
    cancelled: '<span class="badge badge-cancelled">Da huy</span>'
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
    return `${(value / 1000000000).toFixed(1)} ty`;
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
