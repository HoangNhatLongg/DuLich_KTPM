const API_CONFIG = Object.freeze({
  userServiceUrl: 'http://localhost:5000',
  tourServiceUrl: 'http://localhost:5000',
  bookingServiceUrl: 'http://localhost:5000',
  paymentServiceUrl: 'http://localhost:5000',
  staffServiceUrl: 'http://localhost:5000',
  reportServiceUrl: 'http://localhost:5000'
});

const STORAGE_KEYS = Object.freeze({
  session: 'luxtravel.session'
});

const TOUR_VISUALS = [
  {
    keywords: ['bali', 'indonesia'],
    destination: 'Bali, Indonesia',
    category: 'dao',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800'
  },
  {
    keywords: ['paris', 'phap', 'france'],
    destination: 'Paris, Phap',
    category: 'chau-au',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'
  },
  {
    keywords: ['tokyo', 'nhat ban', 'japan'],
    destination: 'Tokyo, Nhat Ban',
    category: 'chau-a',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800'
  },
  {
    keywords: ['santorini', 'hy lap', 'greece'],
    destination: 'Santorini, Hy Lap',
    category: 'chau-au',
    image: 'https://images.unsplash.com/photo-1571406252241-db0280bd36cd?w=800'
  },
  {
    keywords: ['maldives'],
    destination: 'Maldives',
    category: 'dao',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
  },
  {
    keywords: ['hoi an', 'da nang', 'viet nam', 'ha long'],
    destination: 'Viet Nam',
    category: 'chau-a',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800'
  }
];

function getSessionKey() {
  return window.location.pathname.includes('admin.html') 
    ? 'luxtravel.admin.session' 
    : 'luxtravel.session';
}

function getSession() {
  try {
    const raw = localStorage.getItem(getSessionKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(authResponse, extras = {}) {
  const session = {
    accessToken: authResponse.accessToken,
    accessTokenExpiresAt: authResponse.accessTokenExpiresAt,
    refreshToken: authResponse.refreshToken,
    refreshTokenExpiresAt: authResponse.refreshTokenExpiresAt,
    user: authResponse.user,
    profile: {
      name: extras.name || authResponse.user?.email?.split('@')[0] || 'Khach hang',
      phone: extras.phone || ''
    }
  };

  localStorage.setItem(getSessionKey(), JSON.stringify(session));
  window.dispatchEvent(new CustomEvent('luxtravel:auth-changed', { detail: session }));
  return session;
}

function clearSession() {
  localStorage.removeItem(getSessionKey());
  window.dispatchEvent(new CustomEvent('luxtravel:auth-changed', { detail: null }));
}

function isSessionValid(session = getSession()) {
  if (!session?.accessToken || !session?.accessTokenExpiresAt) {
    return false;
  }

  return new Date(session.accessTokenExpiresAt).getTime() > Date.now();
}

function requireSession() {
  const session = getSession();
  if (!session) {
    return null;
  }
  
  if (!isSessionValid(session)) {
    clearSession();
    return null;
  }

  return session;
}

function isAdminSession(session = getSession()) {
  return Boolean(session?.user?.role && session.user.role.toLowerCase() === 'admin');
}

async function apiRequest(baseUrl, path, options = {}) {
  const { method = 'GET', body, headers = {}, token } = options;
  const requestHeaders = { ...headers };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = text ? { message: text } : null;
  }

  if (!response.ok || payload?.success === false) {
    let errorMessage = payload?.message;

    if (payload?.errors && typeof payload.errors === 'object') {
      const errorDetails = Object.values(payload.errors).flat().join('. ');
      if (errorDetails) {
        errorMessage = errorDetails;
      }
    } else if (payload?.detail) {
      errorMessage = payload.detail;
    } else if (!errorMessage && payload?.title) {
      errorMessage = payload.title;
    }

    if (!errorMessage) {
      errorMessage = 'Lỗi hệ thống hoặc định dạng dữ liệu không hợp lệ.';
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload?.data ?? payload;
}

function userApi(path, options) {
  return apiRequest(API_CONFIG.userServiceUrl, path, options);
}

function tourApi(path, options) {
  return apiRequest(API_CONFIG.tourServiceUrl, path, options);
}

function bookingApi(path, options) {
  return apiRequest(API_CONFIG.bookingServiceUrl, path, options);
}

function paymentApi(path, options) {
  return apiRequest(API_CONFIG.paymentServiceUrl, path, options);
}

function staffApi(path, options) {
  return apiRequest(API_CONFIG.staffServiceUrl, path, options);
}

function reportApi(path, options) {
  return apiRequest(API_CONFIG.reportServiceUrl, path, options);
}

function favoritesApi(path, options) {
  return apiRequest(API_CONFIG.bookingServiceUrl, `/api/favorites${path}`, options);
}

function normalizeTour(rawTour) {
  const text = `${rawTour.name || ''} ${rawTour.description || ''}`.toLowerCase();
  const matchedVisual = TOUR_VISUALS.find((item) => item.keywords.some((keyword) => text.includes(keyword)));
  const itineraries = Array.isArray(rawTour.itineraries) ? rawTour.itineraries : [];
  const totalDays = Number(rawTour.totalDays || itineraries.length || 1);
  const price = Number(rawTour.price || 0);
  const destination = matchedVisual?.destination || inferDestinationFromDescription(rawTour.description);
  const availableSlots = Number(rawTour.availableSlots || 0);

  return {
    id: rawTour.id,
    name: rawTour.name,
    description: rawTour.description,
    price,
    childPrice: Math.round(price * 0.7),
    rating: getSyntheticRating(price, availableSlots),
    reviews: Math.max(totalDays * 29, 18),
    badge: getSyntheticBadge(price, availableSlots),
    img: matchedVisual?.image || TOUR_VISUALS[0].image,
    destination,
    category: matchedVisual?.category || 'chau-a',
    duration: `${totalDays}N${Math.max(totalDays - 1, 0)}D`,
    totalDays,
    availableSlots,
    highlights: buildHighlights(rawTour.description, itineraries),
    itinerary: itineraries
      .slice()
      .sort((left, right) => left.dayNumber - right.dayNumber)
      .map((item) => ({
        id: item.id,
        dayNumber: item.dayNumber,
        day: `Ngày ${item.dayNumber}`,
        title: `Lịch trình ngày ${item.dayNumber}`,
        morning: item.morning || '',
        noon: item.noon || '',
        afternoon: item.afternoon || '',
        evening: item.evening || '',
        desc: [
          item.morning ? `Sáng: ${item.morning}` : '',
          item.noon ? `Trưa: ${item.noon}` : '',
          item.afternoon ? `Chiều: ${item.afternoon}` : '',
          item.evening ? `Tối: ${item.evening}` : ''
        ].filter(Boolean).join('\n')
      })),
    updatedAt: rawTour.updatedAtUtc || rawTour.createdAtUtc || null
  };
}

function buildHighlights(description, itineraries) {
  const highlights = [];

  if (description) {
    description
      .split(/[.!?]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3)
      .forEach((item) => highlights.push(item));
  }

  itineraries
    .slice()
    .sort((left, right) => left.dayNumber - right.dayNumber)
    .slice(0, 2)
    .forEach((item) => {
      const summary = [
        item.morning ? `Sáng: ${item.morning}` : '',
        item.noon ? `Trưa: ${item.noon}` : '',
        item.afternoon ? `Chiều: ${item.afternoon}` : '',
        item.evening ? `Tối: ${item.evening}` : ''
      ].filter(Boolean).join(' - ');
      if (summary) {
        highlights.push(`Ngày ${item.dayNumber}: ${summary}`);
      }
    });

  return highlights.length > 0 ? highlights : ['Đang cập nhật thông tin tour'];
}

function getSyntheticBadge(price, availableSlots) {
  if (availableSlots > 0 && availableSlots <= 5) {
    return 'Sắp hết chỗ';
  }

  if (price >= 40000000) {
    return 'Cao cấp ';
  }

  return 'Nổi bật';
}

function getSyntheticRating(price, availableSlots) {
  const base = price >= 30000000 ? 4.9 : 4.7;
  return Number((availableSlots <= 5 ? base + 0.05 : base).toFixed(1));
}

function inferDestinationFromDescription(description = '') {
  const trimmed = description.trim();
  if (!trimmed) {
    return 'Điểm đến đặc sắc';
  }

  return trimmed.split(/[.!?]/)[0].slice(0, 48);
}

function buildItineraryPayload(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const cleanedLine = line.replace(/^ngay\s*\d+\s*[:.-]?\s*/i, '').trim();
      return {
        dayNumber: index + 1,
        description: cleanedLine || line
      };
    });
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(price || 0);
}

function formatDateTime(value) {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleString('vi-VN');
}

function formatDate(value) {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleDateString('vi-VN');
}

function getInitials(value) {
  return (value || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
