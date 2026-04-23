const API_BASE = 'http://localhost:3000/api/auth';

const resources = [
    { id: 1, title: "JavaScript та TypeScript: Повний посібник", type: "course", status: "learning" },
    { id: 2, title: "Spring Framework: Створення REST API", type: "video", status: "none" },
    { id: 3, title: "Python для аналізу даних", type: "course", status: "planned" },
    { id: 4, title: "Патерни проєктування в IT", type: "article", status: "learned" },
    { id: 5, title: "Основи роботи з Git та GitHub", type: "video", status: "none" },
    { id: 6, title: "Алгоритми та структури даних", type: "course", status: "learned" },
    { id: 7, title: "Основи Docker для розробників", type: "video", status: "planned" },
    { id: 8, title: "Clean Code: Принципи написання", type: "article", status: "none" }
];

let state = {
    currentUserRole: 'guest',
    currentFilter: 'all',
    searchQuery: '',
    recentVisits: [],
    isDarkTheme: false,
    itemsPerPage: 3,
    visibleCount: 3,
    currentView: 'catalog'
};

const icons = {
    video: `<svg viewBox="0 0 24 24" class="card-icon" style="stroke: var(--color-video)"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
    article: `<svg viewBox="0 0 24 24" class="card-icon" style="stroke: var(--color-article)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    course: `<svg viewBox="0 0 24 24" class="card-icon" style="stroke: var(--color-course)"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`
};

function getStatusLabel(status) {
    const labels = {
        none: '+ Додати',
        planned: 'Планую',
        learning: 'Вчу',
        learned: 'Вивчено'
    };
    return labels[status] || '+ Додати';
}

function showMessage(message, targetId = 'auth-message', isError = false) {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.style.color = isError ? 'crimson' : 'green';
    el.innerText = message;
}

function showAuthTab(tab) {
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('forgot-form').style.display = tab === 'forgot' ? 'block' : 'none';
    showMessage('', 'auth-message');
}

async function registerUser() {
    try {
        const body = {
            username: document.getElementById('register-username').value.trim(),
            email: document.getElementById('register-email').value.trim(),
            password: document.getElementById('register-password').value,
            confirmPassword: document.getElementById('register-confirm-password').value,
            role_id: Number(document.getElementById('register-role').value)
        };

        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.message || 'Помилка реєстрації', 'auth-message', true);
        }

        showMessage(`Реєстрація успішна. Verification token: ${data.verificationToken}`);
        showAuthTab('login');
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'auth-message', true);
    }
}

async function loginUser() {
    try {
        const body = {
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value
        };

        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.message || 'Помилка логіну', 'auth-message', true);
        }

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        await enterApp();
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'auth-message', true);
    }
}

async function enterApp() {
    const profile = await fetchProfile();
    if (!profile) return;

    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';

    const roleMap = {
        1: 'admin',
        2: 'user'
    };

    state.currentUserRole = roleMap[profile.role_id] || 'guest';

    document.body.className = `role-${state.currentUserRole} ${state.isDarkTheme ? 'dark-theme' : ''}`;
    document.getElementById('display-role').innerText =
        state.currentUserRole === 'admin' ? 'Адмін' :
        state.currentUserRole === 'user' ? 'Користувач' : 'Гість';

    renderCards();
}

async function fetchProfile() {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        const res = await fetch(`${API_BASE}/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            return null;
        }

        return data.user;
    } catch (error) {
        return null;
    }
}

async function loadProfile() {
    const profile = await fetchProfile();
    if (!profile) {
        showMessage('Не вдалося завантажити профіль', 'auth-message', true);
        return;
    }

    document.getElementById('profile-info').innerHTML = `
        <p><strong>ID:</strong> ${profile.user_id}</p>
        <p><strong>Ім'я:</strong> ${profile.username}</p>
        <p><strong>Email:</strong> ${profile.email}</p>
        <p><strong>Роль:</strong> ${profile.role_id === 1 ? 'Адміністратор' : 'Користувач'}</p>
        <p>
            <strong>Email:</strong> 
            ${profile.is_email_confirmed 
                ? '<span style="color:green; font-weight:bold;">✔ Підтверджено</span>' 
                : '<span style="color:orange;">Не підтверджено</span>'}
        </p>
    `;
    document.getElementById('profile-username').value = profile.username || '';
    document.getElementById('profile-email').value = profile.email || '';
    document.getElementById('profile-modal').style.display = 'flex';
    showMessage('', 'profile-message');
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

async function updateProfile() {
    try {
        const token = localStorage.getItem('accessToken');

        const body = {
            username: document.getElementById('profile-username').value.trim(),
            email: document.getElementById('profile-email').value.trim()
        };

        const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log(data);
        if (!res.ok) {
            return showMessage(data.message || 'Помилка оновлення профілю', 'profile-message', true);
        }

        await loadProfile();

        let message = data.message;


        showMessage(message, 'profile-message');
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'profile-message', true);
    }
}

async function changePassword() {
    try {
        const token = localStorage.getItem('accessToken');

        const body = {
            oldPassword: document.getElementById('old-password').value,
            newPassword: document.getElementById('new-password').value,
            confirmNewPassword: document.getElementById('confirm-new-password').value
        };

        const res = await fetch(`${API_BASE}/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.message || 'Помилка зміни пароля', 'profile-message', true);
        }

        showMessage(data.message, 'profile-message');
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'profile-message', true);
    }
}

async function verifyEmail() {
    try {
        const token = document.getElementById('verify-email-token').value.trim();
        const email = document.getElementById('profile-email').value;
        const res = await fetch(`${API_BASE}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.message || 'Помилка підтвердження email', 'profile-message', true);
        }

        showMessage(data.message, 'profile-message');
        await loadProfile();
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'profile-message', true);
    }
}

async function forgotPassword() {
    try {
        const body = {
            email: document.getElementById('forgot-email').value.trim()
        };

        const res = await fetch(`${API_BASE}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.message || 'Помилка forgot password', 'auth-message', true);
        }

        showMessage(`Reset token: ${data.resetToken}`);
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'auth-message', true);
    }
}

async function resetPassword() {
    try {
        const body = {
            token: document.getElementById('reset-token').value.trim(),
            newPassword: document.getElementById('reset-new-password').value,
            confirmNewPassword: document.getElementById('reset-confirm-password').value
        };

        const res = await fetch(`${API_BASE}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.message || 'Помилка reset password', 'auth-message', true);
        }

        showMessage(data.message);
        showAuthTab('login');
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'auth-message', true);
    }
}

async function logoutUser() {
    try {
        const token = localStorage.getItem('accessToken');

        await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    state.currentUserRole = 'guest';
    state.recentVisits = [];

    

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeProfileModal();
        }
    });

    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    updateRecentListUI();
    closeProfileModal();
    showAuthTab('login');
}

function switchView(viewName) {
    state.currentView = viewName;
    state.visibleCount = state.itemsPerPage;
    document.getElementById('tab-catalog').classList.toggle('active', viewName === 'catalog');
    document.getElementById('tab-cabinet').classList.toggle('active', viewName === 'cabinet');
    renderCards();
}

function renderCards() {
    const grid = document.getElementById('content-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filteredData = resources.filter(item => {
        const matchesView = state.currentView === 'catalog' || (state.currentView === 'cabinet' && item.status !== 'none');
        const matchesType = state.currentFilter === 'all' || item.type === state.currentFilter;
        const matchesSearch = item.title.toLowerCase().includes(state.searchQuery);
        return matchesView && matchesType && matchesSearch;
    });

    if (filteredData.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Нічого не знайдено</div>`;
        renderPagination(0, 0);
        return;
    }

    filteredData.slice(0, state.visibleCount).forEach(item => {
        const card = document.createElement('div');
        card.className = `card status-${item.status} resource-card`;
        card.setAttribute('data-type', item.type);

        const iconSvg = icons[item.type] || icons.article;

        let actions = '';
        if (state.currentUserRole === 'admin') {
            actions = `<button class="btn-status" onclick="alert('Редагування')">✏️ Редагувати</button>`;
        } else if (state.currentUserRole === 'user') {
            actions = `<button class="btn-status" onclick="cycleStatus(${item.id})">${getStatusLabel(item.status)}</button>`;
        }

        card.innerHTML = `
            <div class="card-thumbnail-svg">${iconSvg}</div>
            <div class="card-body">
                <div class="card-meta">
                    <span class="badge type-${item.type}">${item.type.toUpperCase()}</span>
                </div>
                <h3 class="card-title" onclick="trackVisit(${item.id})">${item.title}</h3>
            </div>
            <div class="card-actions">${actions}</div>
        `;
        grid.appendChild(card);
    });

    renderPagination(state.visibleCount, filteredData.length);
}

function renderPagination(visible, total) {
    const container = document.getElementById('pagination-controls');
    container.innerHTML = visible < total ? `<button class="btn-load-more" onclick="loadMore()">Показати ще ⬇️</button>` : '';
}

function loadMore() {
    state.visibleCount += state.itemsPerPage;
    renderCards();
}

function handleSearch(e) {
    state.searchQuery = e.target.value.toLowerCase();
    state.visibleCount = state.itemsPerPage;
    renderCards();
}

function setFilter(type) {
    state.currentFilter = type;
    state.visibleCount = state.itemsPerPage;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
    renderCards();
}

function cycleStatus(id) {
    const item = resources.find(r => r.id === id);
    const sequence = ['none', 'planned', 'learning', 'learned'];
    item.status = sequence[(sequence.indexOf(item.status) + 1) % sequence.length];
    renderCards();
}

function trackVisit(id) {
    const item = resources.find(r => r.id === id);
    if (state.currentUserRole === 'guest') return alert(`Перегляд: ${item.title}`);

    state.recentVisits = state.recentVisits.filter(v => v.id !== id);
    state.recentVisits.unshift({ id: item.id, title: item.title });
    if (state.recentVisits.length > 3) state.recentVisits.pop();

    updateRecentListUI();
}

function updateRecentListUI() {
    const list = document.getElementById('recent-list');
    if (!list) return;

    list.innerHTML = state.recentVisits.length
        ? state.recentVisits.map(v =>
            `<li><a href="#" class="history-link" onclick="trackVisit(${v.id}); return false;">🔗 ${v.title}</a></li>`
        ).join('')
        : '<li class="empty-text">Історія порожня</li>';
}

function toggleTheme() {
    state.isDarkTheme = !state.isDarkTheme;
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', state.isDarkTheme ? 'dark' : 'light');
}

async function tryAutoLogin() {
    if (localStorage.getItem('theme') === 'dark') {
        toggleTheme();
    }

    const profile = await fetchProfile();
    if (profile) {
        await enterApp();
    } else {
        showAuthTab('login');
    }
}

    document.getElementById('profile-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProfileModal();
        }
    });

tryAutoLogin();