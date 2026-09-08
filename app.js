/**
 * Handy Man Buea — Core Application Logic
 * Version: 1.2
 * Date: 4 September 2026
 *
 * SECURITY NOTES:
 * - Supabase credentials are loaded from config.js (not hardcoded here).
 * - The SUPABASE_ANON_KEY is a publishable key safe for client-side use.
 * - NEVER expose SUPABASE_SERVICE_ROLE_KEY in any client-side file.
 * - Admin privileges are verified server-side via RLS policies.
 *   The client-side isAdmin() check is ONLY for UI display purposes.
 * - All write operations are protected by Row Level Security (RLS).
 */

// ============================================================================
// CONFIGURATION (loaded from config.js — see config.template.js)
// ============================================================================
const CONFIG = (typeof window !== 'undefined' && window.HANDYMAN_CONFIG) ? window.HANDYMAN_CONFIG : {};
const SUPABASE_URL = CONFIG.SUPABASE_URL || '';
const SUPABASE_KEY = CONFIG.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
        '[HandyMan] CRITICAL: Missing Supabase configuration. ' +
        'Please create config.js from config.template.js and include it BEFORE app.js.'
    );
}

var supabaseClient = null;
var currentUser = null;
var currentProfile = null;
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

// ============================================================================
// SUPABASE INITIALIZATION
// ============================================================================
window.supabaseReady = new Promise(function(resolve) {
    window._resolveSupabaseReady = resolve;
});

if (typeof window !== 'undefined' && typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    try {
        if (SUPABASE_URL && SUPABASE_KEY) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            window.supabase = supabaseClient;
            console.log('[HandyMan] Supabase client initialized.');
        } else {
            console.warn('[HandyMan] Supabase not initialized — missing URL or Key.');
        }
    } catch (e) {
        console.error('[HandyMan] Supabase init failed:', e);
    }
} else {
    console.warn('[HandyMan] Supabase JS library not loaded.');
}

if (window._resolveSupabaseReady) {
    window._resolveSupabaseReady(supabaseClient);
}

// ============================================================================
// APP INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        injectNavExtras();
        injectShareButton();
        trackVisitor();
        await checkAuth();

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
            menuToggle.addEventListener('click', function() {
                document.getElementById('nav').classList.toggle('active');
            });
        }
    } catch (err) {
        console.error('[HandyMan] App init error:', err);
        if (document.getElementById('categoryGrid')) {
            renderCategories(FALLBACK_CATEGORIES);
        }
    }
});

// ============================================================================
// FILE UPLOAD HELPERS
// ============================================================================
async function uploadFile(file, folder, userId) {
    if (!supabaseClient || !file) return null;
    try {
        const uid = userId || (currentUser && currentUser.id) || 'anonymous';
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const safeExt = fileExt || 'jpg';
        const fileName = Date.now() + '_' + Math.random().toString(36).substring(2, 11) + '.' + safeExt;
        const filePath = folder + '/' + uid + '/' + fileName;

        const { error: uploadError } = await supabaseClient.storage
            .from('handyman-files')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
            console.error('[HandyMan] Upload error:', uploadError);
            return null;
        }

        const { data } = supabaseClient.storage.from('handyman-files').getPublicUrl(filePath);
        return data && data.publicUrl ? data.publicUrl : null;
    } catch (err) {
        console.error('[HandyMan] Upload exception:', err);
        return null;
    }
}

async function uploadMultipleFiles(fileList, folder, userId, maxCount) {
    const urls = [];
    const files = Array.from(fileList || []).slice(0, maxCount || 2);
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (!f.type || !f.type.startsWith('image/')) continue;
        var url = await uploadFile(f, folder, userId);
        if (url) urls.push(url);
    }
    return urls;
}

// ============================================================================
// NAVIGATION & UI INJECTION
// ============================================================================
function injectNavExtras() {
    var nav = document.getElementById('nav');
    if (!nav || nav.querySelector('.nav-bell')) return;

    // My Jobs / Dashboard link
    var dashLink = document.createElement('a');
    dashLink.href = 'dashboard.html';
    dashLink.className = 'btn-secondary';
    dashLink.id = 'navDashboard';
    dashLink.textContent = 'My Jobs';
    dashLink.style.display = 'none';
    var authBtn = nav.querySelector('#authBtn');
    if (authBtn) nav.insertBefore(dashLink, authBtn);

    // Notification bell
    var bellContainer = document.createElement('div');
    bellContainer.className = 'nav-bell';
    bellContainer.id = 'navBell';
    bellContainer.innerHTML = '🔔<span class="bell-count" id="bellCount" style="display:none;">0</span>';
    bellContainer.style.display = 'none';
    bellContainer.onclick = function(e) {
        e.stopPropagation();
        toggleNotifications();
    };
    if (authBtn) nav.insertBefore(bellContainer, authBtn);

    var dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    dropdown.id = 'notificationDropdown';
    dropdown.innerHTML = '<div class="notification-header">🔔 Notifications</div><div class="notification-list" id="notificationList"><p class="notification-empty">Loading...</p></div>';
    document.body.appendChild(dropdown);

    document.addEventListener('click', function(e) {
        var d = document.getElementById('notificationDropdown');
        var b = document.getElementById('navBell');
        if (d && b && !d.contains(e.target) && !b.contains(e.target)) {
            d.classList.remove('active');
        }
    });
}

function injectShareButton() {
    if (document.getElementById('shareFab')) return;
    var fab = document.createElement('div');
    fab.id = 'shareFab';
    fab.className = 'share-fab';
    fab.innerHTML = '🔗';
    fab.title = 'Share Handy Man Buea';
    fab.onclick = openShareModal;
    document.body.appendChild(fab);

    var modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'share-modal';
    modal.innerHTML = '<div class="share-modal-content"><div class="share-modal-header"><h3>🔗 Share Handy Man Buea</h3><button class="share-close" onclick="closeShareModal()">✕</button></div><div class="share-message-box"><p id="shareText">🔧 Find trusted local workers in Buea, Cameroon! Need a plumber, electrician, cleaner, or any skilled worker? Handy Man Buea connects you with verified professionals fast. Check it out: https://handyman-buea.vercel.app/</p><button class="btn-small" onclick="copyShareText()" style="margin-top:12px;">📋 Copy Message</button></div><div class="share-buttons"><a href="#" id="shareWhatsApp" target="_blank" class="btn-whatsapp share-btn">📱 WhatsApp</a><a href="#" id="shareFacebook" target="_blank" class="btn-primary share-btn" style="background:#1877f2;">📘 Facebook</a><a href="#" id="shareTwitter" target="_blank" class="btn-primary share-btn" style="background:#1da1f2;">🐦 Twitter</a></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeShareModal();
    });
}

function openShareModal() {
    var modal = document.getElementById('shareModal');
    if (!modal) return;
    var text = encodeURIComponent('🔧 Find trusted local workers in Buea, Cameroon! Need a plumber, electrician, cleaner, or any skilled worker? Handy Man Buea connects you with verified professionals fast. Check it out: https://handyman-buea.vercel.app/');
    var url = encodeURIComponent('https://handyman-buea.vercel.app/');
    document.getElementById('shareWhatsApp').href = 'https://wa.me/?text=' + text;
    document.getElementById('shareFacebook').href = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
    document.getElementById('shareTwitter').href = 'https://twitter.com/intent/tweet?text=' + text;
    modal.classList.add('active');
}

function closeShareModal() {
    var modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('active');
}

function copyShareText() {
    var text = document.getElementById('shareText').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            alert('Message copied!');
        }).catch(function() {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('Message copied!');
}

// ============================================================================
// ANALYTICS
// ============================================================================
async function trackVisitor() {
    if (!supabaseClient || sessionStorage.getItem('visitorTracked')) return;
    try {
        var today = new Date().toISOString().slice(0, 10);

        var { data: stats } = await supabaseClient
            .from('site_stats')
            .select('total_visitors, visitors_today, visitors_today_date')
            .eq('id', 1)
            .single();

        if (stats) {
            var visitorsToday = stats.visitors_today || 0;
            if (stats.visitors_today_date !== today) {
                visitorsToday = 1;
            } else {
                visitorsToday = (stats.visitors_today || 0) + 1;
            }
            await supabaseClient.from('site_stats').update({
                total_visitors: (stats.total_visitors || 0) + 1,
                visitors_today: visitorsToday,
                visitors_today_date: today,
                last_updated: new Date().toISOString()
            }).eq('id', 1);
        }

        try {
            await supabaseClient.from('visitor_logs').insert([{
                visited_at: new Date().toISOString(),
                visit_date: today
            }]);
        } catch (e) { /* non-critical */ }

        sessionStorage.setItem('visitorTracked', 'true');
    } catch (e) {
        console.log('[HandyMan] Visitor tracking skipped:', e.message);
    }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================
async function checkAuth() {
    try {
        if (!supabaseClient) return;
        var { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;
        if (user) {
            var { data: profile } = await supabaseClient
                .from('profiles')
                .select('is_admin, full_name, phone, avatar_url')
                .eq('id', user.id)
                .single();
            currentProfile = profile;
            loadNotifications();
            startNotificationPolling();
        }
        updateAuthUI();
    } catch (e) {
        console.log('[HandyMan] Auth check failed:', e.message);
    }
}

/**
 * Check if the current user is an admin.
 * CLIENT-SIDE convenience check only. Real security is enforced by RLS.
 */
function isAdmin() {
    if (currentProfile && currentProfile.is_admin === true) return true;
    return false;
}

function updateAuthUI() {
    var authBtn = document.getElementById('authBtn');
    var dashLink = document.getElementById('navDashboard');
    var bell = document.getElementById('navBell');
    if (!authBtn) return;

    if (currentUser && supabaseClient) {
        authBtn.textContent = 'Logout';
        authBtn.href = '#';
        authBtn.onclick = async function(e) {
            e.preventDefault();
            try {
                await supabaseClient.auth.signOut();
                stopNotificationPolling();
            } catch (e) {
                console.error('[HandyMan] Logout error:', e);
            }
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

// ============================================================================
// NOTIFICATIONS
// ============================================================================
async function loadNotifications() {
    if (!supabaseClient || !currentUser) return;
    try {
        var { data: notifications, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(20);
        if (error) {
            console.error('[HandyMan] Notification load error:', error);
            return;
        }
        renderNotificationBell(notifications ? notifications.length : 0);
        renderNotificationList(notifications || []);
    } catch (err) {
        console.error('[HandyMan] Notification error:', err);
    }
}

function renderNotificationBell(count) {
    var bellCount = document.getElementById('bellCount');
    if (!bellCount) return;
    if (count > 0) {
        bellCount.textContent = count > 9 ? '9+' : count;
        bellCount.style.display = 'flex';
    } else {
        bellCount.style.display = 'none';
    }
}

function toggleNotifications() {
    var dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('active');
    if (dropdown.classList.contains('active')) loadNotifications();
}

function renderNotificationList(notifications) {
    var list = document.getElementById('notificationList');
    if (!list) return;
    if (!notifications || notifications.length === 0) {
        list.innerHTML = '<p class="notification-empty">No new notifications</p>';
        return;
    }
    list.innerHTML = notifications.map(function(n) {
        return '<div class="notification-item ' + (n.read ? 'read' : 'unread') + '" onclick="handleNotificationClick(\'' + n.id + '\', \'' + (n.job_id || '') + '\')">' +
            '<p class="notification-msg">' + escapeHtml(n.message) + '</p>' +
            '<span class="notification-time">' + timeAgo(n.created_at) + '</span>' +
            '</div>';
    }).join('');
}

async function handleNotificationClick(notificationId, jobId) {
    if (supabaseClient && notificationId) {
        await supabaseClient.from('notifications').update({ read: true }).eq('id', notificationId);
        loadNotifications();
    }
    if (jobId) window.location.href = 'job.html?id=' + jobId;
}

function startNotificationPolling() {
    if (notificationPollingInterval) return;
    loadNotifications();
    notificationPollingInterval = setInterval(function() {
        if (currentUser) loadNotifications();
    }, 30000);
}

function stopNotificationPolling() {
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }
}

// ============================================================================
// CATEGORIES
// ============================================================================
async function loadCategories() {
    var grid = document.getElementById('categoryGrid');
    if (!grid) return;
    if (!supabaseClient) {
        renderCategories(FALLBACK_CATEGORIES);
        return;
    }
    try {
        var { data: categories, error } = await supabaseClient.from('categories').select('*').limit(11);
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
    var grid = document.getElementById('categoryGrid');
    if (!grid) return;
    grid.innerHTML = categories.map(function(cat) {
        return '<div class="category-card" onclick="searchByCategory(\'' + cat.name + '\')">' +
            '<div class="category-icon">' + (cat.icon || '🔧') + '</div>' +
            '<h3>' + cat.name + '</h3>' +
            '<p>' + (cat.description || '') + '</p>' +
            '</div>';
    }).join('');
}

// ============================================================================
// FEATURED WORKERS
// ============================================================================
async function loadFeaturedWorkers() {
    var grid = document.getElementById('workerGrid');
    if (!grid) return;
    if (!supabaseClient) {
        grid.innerHTML = '<p class="empty">No workers yet.</p>';
        return;
    }
    try {
        var { data: workers, error } = await supabaseClient
            .from('worker_details')
            .select('*, profiles(full_name, avatar_url, location)')
            .eq('availability', 'Available')
            .order('rating', { ascending: false })
            .limit(6);
        if (error || !workers || workers.length === 0) {
            grid.innerHTML = '<p class="empty">No workers yet.</p>';
            return;
        }
        renderWorkers(workers, grid);
    } catch (err) {
        grid.innerHTML = '<p class="empty">No workers yet.</p>';
    }
}

function renderWorkers(workers, container) {
    container.innerHTML = workers.map(function(w) {
        var avatar = w.profiles && w.profiles.avatar_url ? w.profiles.avatar_url : 'https://via.placeholder.com/80?text=No+Photo';
        var name = w.profiles && w.profiles.full_name ? w.profiles.full_name : 'Unknown';
        var location = w.profiles && w.profiles.location ? w.profiles.location : 'Cameroon';
        return '<div class="worker-card" onclick="viewWorker(\'' + w.id + '\')">' +
            '<div class="worker-avatar">' +
            '<img src="' + avatar + '" alt="' + name + '" onerror="this.src=\'https://via.placeholder.com/80?text=No+Photo\'">' +
            '</div>' +
            '<h3>' + name + '</h3>' +
            '<p class="worker-category">' + (w.category || 'General') + '</p>' +
            '<p class="worker-location">📍 ' + location + '</p>' +
            '<div class="worker-rating">' + '⭐'.repeat(Math.round(w.rating || 0)) + ' (' + (w.review_count || 0) + ' reviews)</div>' +
            '<button class="btn-small">View Profile</button>' +
            '</div>';
    }).join('');
}

// ============================================================================
// CAROUSEL
// ============================================================================
function initCarousel() {
    var slides = document.querySelectorAll('.carousel-slide');
    var dotsContainer = document.getElementById('carouselDots');
    if (!slides.length || !dotsContainer) return;
    dotsContainer.innerHTML = '';
    slides.forEach(function(_, i) {
        var dot = document.createElement('div');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.onclick = function() { goToSlide(i); };
        dotsContainer.appendChild(dot);
    });
    var current = 0;
    setInterval(function() {
        goToSlide((current + 1) % slides.length);
    }, 5000);
    function goToSlide(index) {
        slides.forEach(function(s, i) {
            s.classList.toggle('active', i === index);
        });
        var dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach(function(d, i) {
            d.classList.toggle('active', i === index);
        });
        current = index;
    }
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================
function searchWorkers() {
    var query = document.getElementById('searchInput');
    if (query && query.value) {
        window.location.href = 'workers.html?q=' + encodeURIComponent(query.value);
    }
}

function searchByCategory(category) {
    window.location.href = 'workers.html?category=' + encodeURIComponent(category);
}

function viewWorker(id) {
    window.location.href = 'worker.html?id=' + id;
}

function viewJob(id) {
    window.location.href = 'job.html?id=' + id;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function timeAgo(dateString) {
    var date = new Date(dateString);
    var now = new Date();
    var seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    return days + 'd ago';
}

function buildContactLinks(phone) {
    var digits = (phone || '').replace(/\D/g, '');
    var local = digits;
    if (local.startsWith('237')) local = local.slice(3);
    if (local.length < 8) return { wa: '#', call: '#' };
    return {
        wa: 'https://wa.me/237' + local,
        call: 'tel:+237' + local
    };
}
