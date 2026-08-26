// ============================================
// Handy Man - App Script (Full Upgrade)
// Portfolio | Others | Admin | Notifications | Share
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
    {name: 'Catering', icon: '🍲', description: 'Event cooking and food services'},
    {name: 'Others', icon: '✨', description: 'Other services not listed above'}
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
        injectShareButton();
        trackVisitor();
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
// FILE UPLOAD HELPER
// ============================================
async function uploadFile(file, folder) {
    if (!supabaseClient || !file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${currentUser ? currentUser.id : 'anonymous'}/${fileName}`;
    
    const { error: uploadError } = await supabaseClient.storage
        .from('handyman-files')
        .upload(filePath, file);
    
    if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
    }
    
    const { data } = supabaseClient.storage
        .from('handyman-files')
        .getPublicUrl(filePath);
    
    return data.publicUrl;
}

// ============================================
// NAV EXTRAS: Dashboard + Notification Bell + Admin
// ============================================
function injectNavExtras() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    if (nav.querySelector('.nav-bell')) return;
    
    // Dashboard link
    const dashLink = document.createElement('a');
    dashLink.href = 'dashboard.html';
    dashLink.className = 'btn-secondary';
    dashLink.id = 'navDashboard';
    dashLink.textContent = 'My Jobs';
    dashLink.style.display = 'none';
    nav.insertBefore(dashLink, nav.querySelector('#authBtn'));
    
    // Admin link (hidden by default)
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.className = 'btn-secondary';
    adminLink.id = 'navAdmin';
    adminLink.textContent = '⚙️ Admin';
    adminLink.style.display = 'none';
    nav.insertBefore(adminLink, nav.querySelector('#authBtn'));
    
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
    
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        const bell = document.getElementById('navBell');
        if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// ============================================
// SHARE BUTTON (Floating)
// ============================================
function injectShareButton() {
    if (document.getElementById('shareFab')) return;
    
    const fab = document.createElement('div');
    fab.id = 'shareFab';
    fab.className = 'share-fab';
    fab.innerHTML = '🔗';
    fab.title = 'Share Handy Man Buea';
    fab.onclick = openShareModal;
    document.body.appendChild(fab);
    
    // Share modal
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-modal-header">
                <h3>🔗 Share Handy Man Buea</h3>
                <button class="share-close" onclick="closeShareModal()">✕</button>
            </div>
            <div class="share-message-box">
                <p id="shareText">🔧 Find trusted local workers in Buea, Cameroon! Need a plumber, electrician, cleaner, or any skilled worker? Handy Man Buea connects you with verified professionals fast. Check it out: https://handyman-buea.vercel.app/</p>
                <button class="btn-small" onclick="copyShareText()" style="margin-top: 12px;">📋 Copy Message</button>
            </div>
            <div class="share-buttons">
                <a href="#" id="shareWhatsApp" target="_blank" class="btn-whatsapp share-btn">📱 WhatsApp</a>
                <a href="#" id="shareFacebook" target="_blank" class="btn-primary share-btn" style="background:#1877f2;">📘 Facebook</a>
                <a href="#" id="shareTwitter" target="_blank" class="btn-primary share-btn" style="background:#1da1f2;">🐦 Twitter</a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeShareModal();
    });
}

function openShareModal() {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    
    const text = encodeURIComponent('🔧 Find trusted local workers in Buea, Cameroon! Need a plumber, electrician, cleaner, or any skilled worker? Handy Man Buea connects you with verified professionals fast. Check it out: https://handyman-buea.vercel.app/');
    const url = encodeURIComponent('https://handyman-buea.vercel.app/');
    
    document.getElementById('shareWhatsApp').href = `https://wa.me/?text=${text}`;
    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=${text}`;
    
    modal.classList.add('active');
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('active');
}

function copyShareText() {
    const text = document.getElementById('shareText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Message copied! Paste it anywhere.');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('Message copied! Paste it anywhere.');
    });
}

// ============================================
// VISITOR TRACKING
// ============================================
async function trackVisitor() {
    if (!supabaseClient) return;
    // Only count once per session
    if (sessionStorage.getItem('visitorTracked')) return;
    
    try {
        const { data } = await supabaseClient.rpc('increment_visitors');
        sessionStorage.setItem('visitorTracked', 'true');
    } catch (e) {
        // If RPC doesn't exist, try direct update
        try {
            const { data: stats } = await supabaseClient.from('site_stats').select('total_visitors').eq('id', 1).single();
            if (stats) {
                await supabaseClient.from('site_stats').update({ 
                    total_visitors: stats.total_visitors + 1,
                    last_updated: new Date().toISOString()
                }).eq('id', 1);
            }
            sessionStorage.setItem('visitorTracked', 'true');
        } catch (err) {
            console.log('Visitor tracking skipped');
        }
    }
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
    const adminLink = document.getElementById('navAdmin');
    
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
        
        // Show admin link if admin
        if (adminLink && isAdmin()) {
            adminLink.style.display = 'inline-block';
        }
    } else {
        authBtn.textContent = 'Login';
        authBtn.href = 'login.html';
        authBtn.onclick = null;
        if (dashLink) dashLink.style.display = 'none';
        if (bell) bell.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

function isAdmin() {
    return currentUser && currentUser.email === 'Internationalpimerchant@gmail.com';
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
    if (supabaseClient && notificationId) {
        await supabaseClient.from('notifications').update({ read: true }).eq('id', notificationId);
        loadNotifications();
    }
    if (jobId) {
        window.location.href = `job.html?id=${jobId}`;
    }
}

function startNotificationPolling() {
    if (notificationPollingInterval) return;
    loadNotifications();
    notificationPollingInterval = setInterval(() => {
        if (currentUser) loadNotifications();
    }, 30000);
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
            .limit(11);
        
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
