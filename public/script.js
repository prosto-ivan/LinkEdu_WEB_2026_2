const API = {
    auth: 'http://localhost:3000/api/auth',
    resources: 'http://localhost:3000/api/resources',
    userResources: 'http://localhost:3000/api/user-resources',
    meta: 'http://localhost:3000/api/meta'
};

const $ = id => document.getElementById(id);
const token = () => localStorage.getItem('accessToken');

async function request(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Помилка сервера');
    return data;
}

function setHTML(id, html) {
    const el = $(id);
    if (el) el.innerHTML = html;
}

function setValue(id, value = '') {
    const el = $(id);
    if (el) el.value = value;
}

function getValue(id) {
    return $(id)?.value.trim() || '';
}

function authHeaders(json = false) {
    return {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        ...(token() ? { Authorization: `Bearer ${token()}` } : {})
    };
}

let resources = [];
let roles = [];
let resourceTypes = [];

let state = {
    currentUserRole: 'guest',
    currentFilter: 'all',
    searchQuery: '',
    recentVisits: [],
    isDarkTheme: false,
    itemsPerPage: 2,
    visibleCount: 2,
    currentView: 'catalog'
};

const icons = {
    video: `<svg viewBox="0 0 24 24" class="card-icon" style="stroke: var(--color-video)"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
    article: `<svg viewBox="0 0 24 24" class="card-icon" style="stroke: var(--color-article)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    course: `<svg viewBox="0 0 24 24" class="card-icon" style="stroke: var(--color-course)"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`
};

function mapResourceType(typeId) {
    const map = {
        1: 'video',
        2: 'article',
        3: 'course'
    };
    return map[typeId] || 'article';
}

async function loadList(url, key, onSuccess) {
    try {
        const data = await request(url, { headers: authHeaders() });
        onSuccess(data[key]);
    } catch (error) {
        console.error(error.message);
    }
}

const loadRoles = () => loadList(`${API.meta}/roles`, 'roles', data => {
    roles = data;
    renderRoleSelect();
});

function renderRoleSelect() {
    const select = document.getElementById('register-role');
    if (!select) return;

    select.innerHTML = roles
        .filter(role => role.role_name !== 'guest')
        .map(role => `
            <option value="${role.role_id}">
                ${role.role_name === 'admin' ? 'Адміністратор' : 'Користувач'}
            </option>
        `)
        .join('');
}

const loadResourceTypes = () => loadList(`${API.meta}/resource-types`, 'resourceTypes', data => {
    resourceTypes = data;
    renderResourceTypeSelect();
    renderResourceFilters();
});

function renderResourceTypeSelect() {
    const select = document.getElementById('resource-type');
    if (!select) return;

    select.innerHTML = resourceTypes.map(type => `
        <option value="${type.type_id}">
            ${translateResourceType(type.type_name)}
        </option>
    `).join('');
}

function renderResourceFilters() {
    const container = document.getElementById('resource-filters');
    if (!container) return;

    container.innerHTML = `
        <button class="filter-btn ${state.currentFilter === 'all' ? 'active' : ''}" data-type="all" onclick="setFilter('all')">
            УСЕ
        </button>
        ${resourceTypes.map(type => `
            <button
                class="filter-btn ${state.currentFilter === type.type_name ? 'active' : ''}"
                data-type="${type.type_name}"
                onclick="setFilter('${type.type_name}')"
            >
                ${translateResourceType(type.type_name).toUpperCase()}
            </button>
        `).join('')}
    `;
}

function translateResourceType(typeName) {
    const map = {
        video: 'Відео',
        article: 'Стаття',
        course: 'Курс'
    };
    return map[typeName] || typeName;
}

async function loadResources() {
    try {
        const res = await fetch('http://localhost:3000/api/resources');
        const data = await res.json();

        if (!res.ok) {
            console.error('Помилка завантаження ресурсів:', data.message);
            resources = [];
            renderCards();
            return;
        }

        const statusMap = await loadUserResourceStatuses();

        resources = data.resources.map(item => ({
            id: item.resource_id,
            title: item.title,
            type: item.resourceType?.type_name || 'article',
            type_id: item.type_id,
            status: statusMap[item.resource_id] || 'none',
            url: item.url,
            created_by: item.created_by,
            creator: item.creator || null
        }));

        renderCards();
    } catch (error) {
        console.error('Помилка з’єднання при завантаженні ресурсів:', error);
        resources = [];
        renderCards();
    }
}

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
        const data = await request(`${API.auth}/register`, {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({
                username: getValue('register-username'),
                email: getValue('register-email'),
                password: $('register-password').value,
                confirmPassword: $('register-confirm-password').value,
                role_id: Number($('register-role').value)
            })
        });

        showMessage(`Реєстрація успішна. Verification token: ${data.verificationToken}`);
        showAuthTab('login');
    } catch (error) {
        showMessage(error.message, 'auth-message', true);
    }
}

async function loginUser() {
    try {
        const data = await request(`${API.auth}/login`, {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({
                email: getValue('login-email'),
                password: $('login-password').value
            })
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        await enterApp();
    } catch (error) {
        showMessage(error.message, 'auth-message', true);
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

    if (state.currentUserRole === 'admin') {
        state.currentView = 'catalog';
    }

    document.body.className = `role-${state.currentUserRole} ${state.isDarkTheme ? 'dark-theme' : ''}`;
    document.getElementById('display-role').innerText =
        state.currentUserRole === 'admin' ? 'Адмін' :
        state.currentUserRole === 'user' ? 'Користувач' : 'Гість';

    await loadResources();
}

async function fetchProfile() {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;

        const res = await fetch(`${API.auth}/profile`, {
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


async function updateProfile() {
    try {
        const data = await request(`${API.auth}/profile`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify({
                username: getValue('profile-username'),
                email: getValue('profile-email')
            })
        });

        await loadProfile();
        showMessage(data.message, 'profile-message');
    } catch (error) {
        showMessage(error.message, 'profile-message', true);
    }
}

async function changePassword() {
    try {
        const data = await request(`${API.auth}/change-password`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify({
                oldPassword: $('old-password').value,
                newPassword: $('new-password').value,
                confirmNewPassword: $('confirm-new-password').value
            })
        });

        showMessage(data.message, 'profile-message');
    } catch (error) {
        showMessage(error.message, 'profile-message', true);
    }
}

async function verifyEmail() {
    try {
        const token = document.getElementById('verify-email-token').value.trim();
        const email = document.getElementById('profile-email').value;
        const res = await fetch(`${API.auth}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
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
        const data = await request(`${API.auth}/forgot-password`, {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({ email: getValue('forgot-email') })
        });

        showMessage(`Reset token: ${data.resetToken}`);
    } catch (error) {
        showMessage(error.message, 'auth-message', true);
    }
}

async function resetPassword() {
    try {
        const data = await request(`${API.auth}/reset-password`, {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({
                token: getValue('reset-token'),
                newPassword: $('reset-new-password').value,
                confirmNewPassword: $('reset-confirm-password').value
            })
        });

        showMessage(data.message);
        showAuthTab('login');
    } catch (error) {
        showMessage(error.message, 'auth-message', true);
    }
}

async function logoutUser() {
    try {
        const token = localStorage.getItem('accessToken');

        await fetch(`${API.auth}/logout`, {
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

function openResource(id, url) {
    if (state.currentUserRole !== 'guest') {
        trackVisit(id);
    }

    if (!url) return;
    window.open(url, '_blank');
}

function getCardActions(item) {
    if (state.currentUserRole === 'admin') {
        return `
            <button class="btn-main" onclick="openResource(${item.id}, '${item.url}')">Відкрити</button>
            <button class="btn-status" onclick="editResource(${item.id})">✏️ Редагувати</button>
            <button class="btn-status" onclick="deleteResource(${item.id})">🗑 Видалити</button>
        `;
    }

    if (state.currentUserRole === 'user') {
        return `
            <button class="btn-main" onclick="openResource(${item.id}, '${item.url}')">Відкрити</button>
            <button class="btn-status" onclick="cycleStatus(${item.id})">${getStatusLabel(item.status)}</button>
        `;
    }

    return `<button class="btn-main" onclick="openResource(${item.id}, '${item.url}')">Відкрити</button>`;
}

function renderCards() {
    const grid = document.getElementById('content-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filteredData = resources.filter(item => {
        const matchesView = state.currentUserRole === 'admin'
            ? true
            : state.currentView === 'catalog' || (state.currentView === 'cabinet' && item.status !== 'none');

        const matchesType = state.currentFilter === 'all' || item.type === state.currentFilter;
        const matchesSearch = item.title.toLowerCase().includes(state.searchQuery);

        return matchesView && matchesType && matchesSearch;
    });

    if (filteredData.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                Нічого не знайдено
            </div>
        `;
        renderPagination(0, 0);
        return;
    }

    filteredData.slice(0, state.visibleCount).forEach(item => {
        const card = document.createElement('div');
        card.className = `card status-${item.status} resource-card`;
        card.setAttribute('data-type', item.type);

        const iconSvg = icons[item.type] || icons.article;
        const actions = getCardActions(item);

        card.innerHTML = `
            <div class="card-thumbnail-svg">${iconSvg}</div>

            <div class="card-body">
                <div class="card-meta">
                    <span class="badge type-${item.type}">${item.type.toUpperCase()}</span>
                </div>

                <h3 class="card-title">${item.title}</h3>
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

async function cycleStatus(id) {
    const item = resources.find(r => r.id === id);
    if (!item) return;

    const sequence = ['none', 'planned', 'learning', 'learned'];
    const newStatus = sequence[(sequence.indexOf(item.status) + 1) % sequence.length];

    try {
        const token = localStorage.getItem('accessToken');

        const res = await fetch(`http://localhost:3000/api/user-resources/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();

        if (!res.ok) {
            return alert(data.message || 'Помилка оновлення статусу');
        }

        item.status = newStatus;
        renderCards();
    } catch (error) {
        alert('Помилка з’єднання із сервером');
    }
}

function trackVisit(id) {
    const item = resources.find(r => r.id === id);
    if (!item || state.currentUserRole === 'guest') return;

    state.recentVisits = state.recentVisits.filter(v => v.id !== id);
    state.recentVisits.unshift({ id: item.id, title: item.title });

    if (state.recentVisits.length > 3) {
        state.recentVisits.pop();
    }

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

function openModal(id) {
    const el = $(id);
    if (el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = $(id);
    if (el) el.style.display = 'none';
}

const openUsersModal = () => { openModal('users-modal'); loadUsers(); };
const closeUsersModal = () => closeModal('users-modal');
const closeProfileModal = () => closeModal('profile-modal');
const closeResourceModal = () => closeModal('resource-modal');

const loadUsers = () => loadList(`${API.auth}/users`, 'users', data => {
    renderUsers(data);
    showMessage('Користувачів завантажено', 'users-message');
});

function renderUsers(users) {
    const tbody = document.getElementById('users-table-body');

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">Користувачів не знайдено</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.role_id === 1 ? 'Адмін' : 'Користувач'}</td>
            <td>
                ${user.is_email_confirmed
                    ? '<span class="status-confirmed">✔ Підтверджено</span>'
                    : '<span class="status-unconfirmed">Не підтверджено</span>'}
            </td>
            <td>
                <button class="btn-logout" onclick="deleteUser(${user.user_id}, '${user.username}')">
                    Видалити
                </button>
            </td>
        </tr>
    `).join('');
}

async function deleteUser(userId, username) {
    const confirmed = confirm(`Точно видалити користувача "${username}"?`);
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('accessToken');

        const res = await fetch(`${API.auth}/user/${userId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.message || 'Помилка видалення користувача', 'users-message', true);
        }

        showMessage(data.message || 'Користувача видалено', 'users-message');
        await loadUsers();
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'users-message', true);
    }
}

function openResourceModal(resource = null) {
    document.getElementById('resource-modal').style.display = 'flex';
    document.getElementById('resource-message').innerText = '';

    if (resource) {
        document.getElementById('resource-modal-title').innerText = 'Редагувати ресурс';
        document.getElementById('resource-id').value = resource.id;
        document.getElementById('resource-title').value = resource.title || '';
        document.getElementById('resource-url').value = resource.url || '';
        document.getElementById('resource-type').value = resource.type_id || 2;
    } else {
        document.getElementById('resource-modal-title').innerText = 'Додати ресурс';
        document.getElementById('resource-id').value = '';
        document.getElementById('resource-title').value = '';
        document.getElementById('resource-url').value = '';
        document.getElementById('resource-type').value = '2';
    }
}

async function saveResource() {
    try {
        const token = localStorage.getItem('accessToken');

        const resourceId = document.getElementById('resource-id').value;
        const title = document.getElementById('resource-title').value.trim();
        const url = document.getElementById('resource-url').value.trim();
        const type_id = Number(document.getElementById('resource-type').value);

        const body = { title, url, type_id };

        const isEdit = !!resourceId;
        const endpoint = isEdit
            ? `http://localhost:3000/api/resources/${resourceId}`
            : `http://localhost:3000/api/resources`;

        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            return showMessage(data.message || 'Помилка збереження ресурсу', 'resource-message', true);
        }

        showMessage(data.message || 'Ресурс збережено', 'resource-message');

        await loadResources();

        setTimeout(() => {
            closeResourceModal();
        }, 500);
    } catch (error) {
        showMessage('Помилка з’єднання із сервером', 'resource-message', true);
    }
}

function editResource(id) {
    const resource = resources.find(item => item.id === id);
    if (!resource) return;

    openResourceModal(resource);
}

async function deleteResource(id) {
    const resource = resources.find(item => item.id === id);
    const title = resource ? resource.title : `ID ${id}`;

    const confirmed = confirm(`Точно видалити ресурс "${title}"?`);
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('accessToken');

        const res = await fetch(`http://localhost:3000/api/resources/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('DELETE RESOURCE ERROR:', data);
            return alert(data.message || 'Помилка видалення ресурсу');
        }

        await loadResources();
        alert(data.message || 'Ресурс видалено');
    } catch (error) {
        console.error('DELETE RESOURCE FETCH ERROR:', error);
        alert('Помилка з’єднання із сервером');
    }
}

async function tryAutoLogin() {
    if (localStorage.getItem('theme') === 'dark') {
        toggleTheme();
    }

    await loadRoles();
    await loadResourceTypes();
    await loadResources();

    const profile = await fetchProfile();
    if (profile) {
        await enterApp();
    } else {
        document.getElementById('auth-page').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        showAuthTab('login');
    }
}

async function loadUserResourceStatuses() {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return {};

        const res = await fetch('http://localhost:3000/api/user-resources', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('Помилка завантаження статусів:', data.message);
            return {};
        }

        const statusMap = {};
        data.items.forEach(item => {
            statusMap[item.resource_id] = item.status;
        });

        return statusMap;
    } catch (error) {
        console.error('Помилка з’єднання при завантаженні статусів:', error);
        return {};
    }
}

document.getElementById('users-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeUsersModal();
    }
});

document.getElementById('profile-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeProfileModal();
    }
});

document.getElementById('resource-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeResourceModal();
    }
});

tryAutoLogin();