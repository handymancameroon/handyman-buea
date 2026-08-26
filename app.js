// ============================================
// Handy Man - App Script (With Notifications)
// ============================================

const SUPABASE_URL = 'https://zuhkhpdrxwfjcqnolmpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_foPRwQRlPGlWBKYqeBHg4A_WcajeKKI';

var supabaseClient = null;
var currentUser = null;
var notificationPollingInterval = null;

const FALLBACK_CATEGORIES = [
    {name: 'Plumbing', icon: '🔧', description: 'Leak repairs, installations, toilets, water heaters'},
    {name: 'Electrical', icon: '⚡', description: 'Wiring, sockets, lighting, electrical repairs'},
    {name: 'Carpentry', icon: '🪚', description: 'Woodwork, furniture, fittings'},
    {name: 'Cleaning', icon: '🧹', description: 'Domestic, office, deep cleaning'},
    {name: 'Painting', icon: '🎨', description: 'Interior and exterior painting'},
    {name: 'Masonry', icon: '🧱', description: 'Bricklaying, concrete work, construction'},
    {name: 'Auto Mechanics', icon: '🚗', description: 'Car and motorcycle repairs'},
    {name: 'Phone/Laptop Repair', icon: '💻', description: 'Device repairs and troubleshooting'},
    {name: 'Hairdressing', icon: '💇', description: 'Hair styling, barbing, braiding'},
    {name: 'Catering', icon: '🍲', description: 'Event cooking and food services'}
];

if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        window.supabase = supabaseClient;
    } catch (e) {
        console.error('Supabase init failed:', e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        injectNavExtras();
        checkAuth().catch(() => {});
        
        if (document.getElementById('categoryGrid')) {
            await loadCategories();
        }
        if (document.getElementById('workerGrid')) {
            await loadFeaturedWorkers();
        }
        if (document.getElementById('carouselDots')) {
            initCarousel();
        }
        
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.getElementById('nav').classList.toggle('active');
            });
        }
    } catch (err) {
        console.error('App init error:', err);
        if (document.getElementById('categoryGrid')) {
            renderCategories(FALLBACK_CATEGORIES);
        }
    }
});

// ============================================
// NAV EXTRAS: Dashboard link + Notification Bell
// ============================================
function injectNavExtras() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    if (nav.querySelector('.nav-bell')) return; // Already injected
    
    // Dashboard link
    const dashLink = document.createElement('a');
    dashLink.href = 'dashboard.html';
    dashLink.className = 'btn-secondary';
    dashLink.id = 'navDashboard';
    dashLink.textContent = 'My Jobs';
    dashLink.style.display = 'none';
    nav.insertBefore(dashLink, nav.querySelector('#authBtn'));
    
    // Notification bell
    const bellContainer = document.createElement('div');
    bellContainer.className = 'nav-bell';
    bellContainer.id = 'navBell';
    bellContainer.innerHTML = '🔔<span class="bell-count" id="bellCount" style="display:none;">0</span>';
    bellContainer.style.display = 'none';
    bellContainer.onclick = (e) => {
        e.stopPropagation();
        toggleNotifications();
    };
    nav.insertBefore(bellContainer, nav.querySelector('#authBtn'));
    
    // Notification dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    dropdown.id = 'notificationDropdown';
    dropdown.innerHTML = `
        <div class="notification-header">🔔 Notifications</div>
        <div class="notification-list" id="notificationList">
            <p class="notification-empty">Loading...</p>
        </div>
    `;
    document.body.appendChild(dropdown);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        const bell = document.getElementById('navBell');
        if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// ============================================
// AUTH
// ============================================
async function checkAuth() {
    try {
        if (!supabaseClient) return;
        const { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;
        updateAuthUI();
        if (user) {
            loadNotifications();
            startNotificationPolling();
        }
    } catch (e) {
        console.log('Auth check failed:', e.message);
    }
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const dashLink = document.getElementById('navDashboard');
    const bell = document.getElementById('navBell');
    
    if (!authBtn) return;
    
    if (currentUser && supabaseClient) {
        authBtn.textContent = 'Logout';
        authBtn.href = '#';
        authBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                await supabaseClient.auth.signOut();
                stopNotificationPolling();
            } catch (e) {}
            window.location.reload();
        };
        if (dashLink) dashLink.style.display = 'inline-block';
        if (bell) bell.style.display = 'inline-flex';
    } else {
        authBtn.textContent = 'Login';
        authBtn.href = 'login.html';
        authBtn.onclick = null;
        if (dashLink) dashLink.style.display = 'none';
        if (bell) bell.style.display = 'none';
    }
}

// ============================================
// NOTIFICATIONS
// ============================================
async function loadNotifications() {
    if (!supabaseClient || !currentUser) return;
    
    try {
        const { data: notifications, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Notification load error:', error);
            return;
        }
        
        renderNotificationBell(notifications ? notifications.length : 0);
        renderNotificationList(notifications || []);
        
    } catch (err) {
        console.error('Notification error:', err);
    }
}

function renderNotificationBell(count) {
    const bellCount = document.getElementById('bellCount');
    if (!bellCount) return;
    
    if (count > 0) {
        bellCount.textContent = count > 9 ? '9+' : count;
        bellCount.style.display = 'flex';
    } else {
        bellCount.style.display = 'none';
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('active');
    if (dropdown.classList.contains('active')) {
        loadNotifications();
    }
}

function renderNotificationList(notifications) {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<p class="notification-empty">No new notifications</p>';
        return;
    }
    
    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="handleNotificationClick('${n.id}', '${n.job_id}')">
            <p class="notification-msg">${escapeHtml(n.message)}</p>
            <span class="notification-time">${timeAgo(n.created_at)}</span>
        </div>
    `).join('');
}

async function handleNotificationClick(notificationId, jobId) {
    // Mark as read
    if (supabaseClient && notificationId) {
        await supabaseClient.from('notifications').update({ read: true }).eq('id', notificationId);
        loadNotifications();
    }
    // Navigate to job
    if (jobId) {
        window.location.href = `job.html?id=${jobId}`;
    }
}

function startNotificationPolling() {
    if (notificationPollingInterval) return;
    loadNotifications(); // Load immediately
    notificationPollingInterval = setInterval(() => {
        if (currentUser) loadNotifications();
    }, 30000); // Every 30 seconds
}

function stopNotificationPolling() {
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }
}

// ============================================
// CATEGORIES & WORKERS
// ============================================
async function loadCategories() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    
    if (!supabaseClient) {
        renderCategories(FALLBACK_CATEGORIES);
        return;
    }
    
    try {
        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .limit(10);
        
        if (error || !categories || categories.length === 0) {
            renderCategories(FALLBACK_CATEGORIES);
            return;
        }
        
        renderCategories(categories);
    } catch (err) {
        renderCategories(FALLBACK_CATEGORIES);
    }
}

function renderCategories(categories) {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    
    grid.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="searchByCategory('${cat.name}')">
            <div class="category-icon">${cat.icon || '🔧'}</div>
            <h3>${cat.name}</h3>
            <p>${cat.description || ''}</p>
        </div>
    `).join('');
}

async function loadFeaturedWorkers() {
    const grid = document.getElementById('workerGrid');
    if (!grid) return;
    
    if (!supabaseClient) {
        grid.innerHTML = '<p class="empty">No workers yet. Be the first to join!</p>';
        return;
    }
    
    try {
        const { data: workers, error } = await supabaseClient
            .from('worker_details')
            .select('*, profiles(full_name, avatar_url, location)')
            .eq('availability', 'Available')
            .order('rating', { ascending: false })
            .limit(6);
        
        if (error || !workers || workers.length === 0) {
            grid.innerHTML = '<p class="empty">No workers yet. Be the first to join!</p>';
            return;
        }
        
        renderWorkers(workers, grid);
    } catch (err) {
        grid.innerHTML = '<p class="empty">No workers yet. Be the first to join!</p>';
    }
}

function renderWorkers(workers, container) {
    container.innerHTML = workers.map(w => `
        <div class="worker-card" onclick="viewWorker('${w.id}')">
            <div class="worker-avatar">
                <img src="${w.profiles?.avatar_url || 'https://via.placeholder.com/80'}" alt="${w.profiles?.full_name || 'Worker'}">
            </div>
            <h3>${w.profiles?.full_name || 'Unknown'}</h3>
            <p class="worker-category">${w.category || 'General'}</p>
            <p class="worker-location">📍 ${w.profiles?.location || 'Buea'}</p>
            <div class="worker-rating">
                ${'⭐'.repeat(Math.round(w.rating || 0))} (${w.review_count || 0} reviews)
            </div>
            <button class="btn-small">View Profile</button>
        </div>
    `).join('');
}

// ============================================
// CAROUSEL & NAVIGATION
// ============================================
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dotsContainer = document.getElementById('carouselDots');
    if (!slides.length || !dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    });
    
    let current = 0;
    setInterval(() => {
        goToSlide((current + 1) % slides.length);
    }, 5000);
    
    function goToSlide(index) {
        slides.forEach((s, i) => s.classList.toggle('active', i === index));
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
        current = index;
    }
}

function searchWorkers() {
    const query = document.getElementById('searchInput')?.value;
    if (query) {
        window.location.href = `workers.html?q=${encodeURIComponent(query)}`;
    }
}

function searchByCategory(category) {
    window.location.href = `workers.html?category=${encodeURIComponent(category)}`;
}

function viewWorker(id) {
    window.location.href = `worker.html?id=${id}`;
}

function viewJob(id) {
    window.location.href = `job.html?id=${id}`;
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
