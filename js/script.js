/**
 * LinkEdu Hub - Логіка застосунку
 * Виконав: Гаран Іван, гр. ІК-33
 */

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

// Авторизація та вихід
function login(role) {
    state.currentUserRole = role;
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    document.body.className = `role-${role} ${state.isDarkTheme ? 'dark-theme' : ''}`;
    
    document.getElementById('display-role').innerText = 
        { 'admin': 'Адмін', 'user': 'Користувач', 'guest': 'Гість' }[role];

    renderCards();
}

function logout() {
    state.currentUserRole = 'guest';
    state.recentVisits = [];
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    updateRecentListUI();
}

// Перемикання режимів (Каталог / Кабінет)
function switchView(viewName) {
    state.currentView = viewName;
    state.visibleCount = state.itemsPerPage;
    document.getElementById('tab-catalog').classList.toggle('active', viewName === 'catalog');
    document.getElementById('tab-cabinet').classList.toggle('active', viewName === 'cabinet');
    renderCards();
}

// Рендеринг контенту
function renderCards() {
    const grid = document.getElementById('content-grid');
    grid.innerHTML = '';

    const filteredData = resources.filter(item => {
        const matchesView = state.currentView === 'catalog' || (state.currentView === 'cabinet' && item.status !== 'none');
        const matchesType = state.currentFilter === 'all' || item.type === state.currentFilter;
        const matchesSearch = item.title.toLowerCase().includes(state.searchQuery);
        return matchesView && matchesType && matchesSearch;
    });

    if (filteredData.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Нічого не знайдено 😕</div>`;
        renderPagination(0, 0);
        return;
    }

    filteredData.slice(0, state.visibleCount).forEach(item => {
        grid.appendChild(createCardElement(item));
    });

    renderPagination(state.visibleCount, filteredData.length);
}

function createCardElement(item) {
    const div = document.createElement('div');
    div.className = `card status-${item.status}`;
    const typeNames = { 'video': 'Відео', 'article': 'Стаття', 'course': 'Курс' };
    const statusNames = { 'none': 'Новий', 'planned': 'Планую', 'learning': 'Вчу', 'learned': 'Вивчено' };

    let actions = '';
    if (state.currentUserRole === 'admin') {
        actions = `<button class="btn-status" onclick="alert('Редагування')">✏️ Редагувати</button>`;
    } else if (state.currentUserRole === 'user') {
        const btnText = item.status === 'none' ? '+ Додати' : 'Змінити статус';
        actions = `<button class="btn-status" onclick="cycleStatus(${item.id})">${btnText}</button>`;
    }

    div.innerHTML = `
        <div class="card-header">
            <span class="type-${item.type}">${typeNames[item.type].toUpperCase()}</span>
            <span class="status-badge">${statusNames[item.status]}</span>
        </div>
        <h3 onclick="trackVisit(${item.id})">${item.title}</h3>
        <div class="card-actions">${actions}</div>
    `;
    return div;
}

// Пагінація
function renderPagination(visible, total) {
    const container = document.getElementById('pagination-controls');
    container.innerHTML = visible < total ? `<button class="btn-load-more" onclick="loadMore()">Показати ще ⬇️</button>` : '';
}

function loadMore() {
    state.visibleCount += state.itemsPerPage;
    renderCards();
}

// Фільтри та пошук
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

// Бізнес-логіка
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
    list.innerHTML = state.recentVisits.length ? state.recentVisits.map(v => 
        `<li><a href="#" class="history-link" onclick="trackVisit(${v.id}); return false;">🔗 ${v.title}</a></li>`
    ).join('') : '<li class="empty-text">Історія порожня</li>';
}

function toggleTheme() {
    state.isDarkTheme = !state.isDarkTheme;
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', state.isDarkTheme ? 'dark' : 'light');
}

if (localStorage.getItem('theme') === 'dark') toggleTheme();