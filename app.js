/**
 * Handy Man Buea — Core Application Logic
 * Version: 1.3.0 (Stable + Working EN/FR switcher + My Profile)
 * Date: 8 September 2026
 *
 * SECURITY NOTES:
 * - Supabase credentials are loaded from config.js
 * - Never expose service role key
 * - Admin checks are client-side only for UI
 */

const CONFIG = (typeof window !== 'undefined' && window.HANDYMAN_CONFIG) ? window.HANDYMAN_CONFIG : {};
const SUPABASE_URL = CONFIG.SUPABASE_URL || '';
const SUPABASE_KEY = CONFIG.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[HandyMan] CRITICAL: Missing Supabase configuration.');
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
// TRANSLATIONS
// ============================================================================
const I18N = {
    en: {
        nav_home: "Home",
        nav_workers: "Find Workers",
        nav_jobs: "Find Jobs",
        nav_join: "Join as Worker",
        nav_post: "Post a Job",
        nav_login: "Login",
        nav_logout: "Logout",
        nav_profile: "My Profile",
        search: "Search",
        loading: "Loading...",
        view_profile: "View Profile",
        reviews: "reviews",
        no_workers: "No workers found. Try a different search.",
        workers_title: "Find Workers in Cameroon",
        search_placeholder: "Search by name, skill or town...",
        all_categories: "All Categories",
        all_towns: "All Towns",
        hero_title: "Find Trusted Local Help in Cameroon",
        hero_sub: "Connect with skilled plumbers, electricians, cleaners, and more — anywhere in Cameroon.",
        hero_find: "Find a Worker",
        hero_post: "Post a Job",
        slide2_title: "Skilled Construction Workers",
        slide2_sub: "Find masons, carpenters, and builders for your projects in Buea, Douala, Yaoundé and beyond.",
        slide2_btn: "Find Builders",
        slide3_title: "Professional Cleaning Services",
        slide3_sub: "Get your home or office sparkling clean with verified local cleaners.",
        slide3_btn: "Find Cleaners",
        slide4_title: "Expert Electrical Repairs",
        slide4_sub: "Safe and reliable electrical work for your property anywhere in Cameroon.",
        slide4_btn: "Find Electricians",
        popular_services: "Popular Services",
        featured_workers: "Featured Workers in Cameroon",
        how_title: "How It Works",
        how_search: "Search",
        how_search_p: "Find the right worker in your town",
        how_contact: "Contact",
        how_contact_p: "Call or WhatsApp them directly",
        how_done: "Get It Done",
        how_done_p: "Rate and review after service",
        jobs_title: "Find Jobs in Cameroon",
        jobs_placeholder: "Search for a job or town...",
        no_jobs: "No jobs found.",
        contact_us: "Contact Us",
        send_message: "Send Message"
    },
    fr: {
        nav_home: "Accueil",
        nav_workers: "Trouver des ouvriers",
        nav_jobs: "Trouver des emplois",
        nav_join: "Devenir ouvrier",
        nav_post: "Publier un emploi",
        nav_login: "Connexion",
        nav_logout: "Déconnexion",
        nav_profile: "Mon profil",
        search: "Rechercher",
        loading: "Chargement...",
        view_profile: "Voir le profil",
        reviews: "avis",
        no_workers: "Aucun ouvrier trouvé. Essayez une autre recherche.",
        workers_title: "Trouver des ouvriers au Cameroun",
        search_placeholder: "Rechercher par nom, métier ou ville...",
        all_categories: "Toutes les catégories",
        all_towns: "Toutes les villes",
        hero_title: "Trouvez de l'aide locale de confiance au Cameroun",
        hero_sub: "Connectez-vous avec des plombiers, électriciens, agents d'entretien et bien d'autres — partout au Cameroun.",
        hero_find: "Trouver un ouvrier",
        hero_post: "Publier un emploi",
        slide2_title: "Ouvriers du bâtiment qualifiés",
        slide2_sub: "Trouvez des maçons, menuisiers et constructeurs pour vos projets à Buea, Douala, Yaoundé et ailleurs.",
        slide2_btn: "Trouver des constructeurs",
        slide3_title: "Services de nettoyage professionnels",
        slide3_sub: "Rendez votre maison ou bureau impeccable avec des agents d'entretien vérifiés.",
        slide3_btn: "Trouver des agents d'entretien",
        slide4_title: "Réparations électriques expertes",
        slide4_sub: "Travaux électriques sûrs et fiables pour votre propriété partout au Cameroun.",
        slide4_btn: "Trouver des électriciens",
        popular_services: "Services populaires",
        featured_workers: "Ouvriers en vedette au Cameroun",
        how_title: "Comment ça marche",
        how_search: "Rechercher",
        how_search_p: "Trouvez le bon ouvrier dans votre ville",
        how_contact: "Contacter",
        how_contact_p: "Appelez ou écrivez sur WhatsApp directement",
        how_done: "Faites réaliser vos travaux",
        how_done_p: "Notez et commentez après le service",
        jobs_title: "Trouver des emplois au Cameroun",
        jobs_placeholder: "Rechercher un emploi ou une ville...",
        no_jobs: "Aucun emploi trouvé.",
        contact_us: "Contactez-nous",
        send_message: "Envoyer le message"
    }
};
function t(key) {
    var lang = localStorage.getItem('handyman_lang') || 'en';
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'fr') lang = 'en';
    localStorage.setItem('handyman_lang', lang);
    applyLanguage();
}

function applyLanguage() {
    var lang = localStorage.getItem('handyman_lang') || 'en';

    // Update language buttons
    var enBtn = document.getElementById('langEn');
    var frBtn = document.getElementById('langFr');
    if (enBtn) enBtn.classList.toggle('active', lang === 'en');
    if (frBtn) frBtn.classList.toggle('active', lang === 'fr');

    // Update navigation links that exist on every page
    var nav = document.getElementById('nav');
    if (nav) {
        var links = nav.querySelectorAll('a');
        links.forEach(function(a) {
            var href = (a.getAttribute('href') || '').toLowerCase();
            if (href.includes('index.html') || href === '/' || href === '') {
                if (!a.classList.contains('logo')) a.textContent = t('nav_home');
            } else if (href.includes('workers.html')) {
                a.textContent = t('nav_workers');
            } else if (href.includes('jobs.html')) {
                a.textContent = t('nav_jobs');
            } else if (href.includes('login.html') && a.id !== 'authBtn' && !a.id) {
                a.textContent = t('nav_join');
            } else if (href.includes('post-job.html')) {
                a.textContent = t('nav_post');
            }
        });
    }

    // Update injected My Profile button
    var dash = document.getElementById('navDashboard');
    if (dash) dash.textContent = t('nav_profile');

    // Update auth button
    var authBtn = document.getElementById('authBtn');
    if (authBtn) {
        if (currentUser) {
            authBtn.textContent = t('nav_logout');
        } else {
            authBtn.textContent = t('nav_login');
        }
    }

    // Update common texts on workers page
    var title = document.querySelector('.search-page h1');
    if (title) title.textContent = t('workers_title');

    var searchInput = document.getElementById('searchQuery');
    if (searchInput) searchInput.placeholder = t('search_placeholder');

    var catSelect = document.getElementById('categoryFilter');
    if (catSelect && catSelect.options.length > 0) {
        catSelect.options[0].text = t('all_categories');
    }

    var townSelect = document.getElementById('townFilter');
    if (townSelect && townSelect.options.length > 0) {
        townSelect.options[0].text = t('all_towns');
    }

    var searchBtn = document.querySelector('.search-filters .btn-primary');
    if (searchBtn) searchBtn.textContent = t('search');
}

// ============================================================================
// SUPABASE INIT
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
        }
    } catch (e) {
        console.error('[HandyMan] Supabase init failed:', e);
    }
}
if (window._resolveSupabaseReady) {
    window._resolveSupabaseReady(supabaseClient);
}

// ============================================================================
// APP INIT
// ============================================================================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        injectNavExtras();
        injectShareButton();
        injectLanguageSwitcher();
        trackVisitor();
        await checkAuth();
        applyLanguage();

        if (document.getElementById('categoryGrid')) {
            await loadCategories();
        }
        if (document.getElementById('workerGrid')) {
            await loadFeaturedWorkers();
        }
        if (document.getElementById('carouselDots')) {
            initCarousel();
        }

        var menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function() {
                var n = document.getElementById('nav');
                if (n) n.classList.toggle('active');
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
// LANGUAGE SWITCHER
// ============================================================================
function injectLanguageSwitcher() {
    if (document.getElementById('langSwitch')) return;

    var switcher = document.createElement('div');
    switcher.id = 'langSwitch';
    switcher.className = 'lang-switch';
    switcher.innerHTML = `
        <button type="button" id="langEn" onclick="setLanguage('en')">EN</button>
        <button type="button" id="langFr" onclick="setLanguage('fr')">FR</button>
    `;
    document.body.appendChild(switcher);

    var style = document.createElement('style');
    style.textContent = `
        .lang-switch {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 999;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 30px;
            padding: 6px 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            font-size: 0.85rem;
        }
        .lang-switch button {
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 20px;
            color: #64748b;
        }
        .lang-switch button.active {
            background: #2563eb;
            color: #fff;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// FILE UPLOAD
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
// NAV EXTRAS
// ============================================================================
function injectNavExtras() {
    var nav = document.getElementById('nav');
    if (!nav || nav.querySelector('#navDashboard')) return;

    var dashLink = document.createElement('a');
    dashLink.href = 'dashboard.html';
    dashLink.className = 'btn-secondary';
    dashLink.id = 'navDashboard';
    dashLink.textContent = t('nav_profile');
    dashLink.style.display = 'none';
    var authBtn = nav.querySelector('#authBtn');
    if (authBtn) nav.insertBefore(dashLink, authBtn);

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
    fab.title = 'Share Handy Man';
    fab.onclick = openShareModal;
    document.body.appendChild(fab);

    var modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'share-modal';
    modal.innerHTML = '<div class="share-modal-content"><div class="share-modal-header"><h3>🔗 Share Handy Man</h3><button class="share-close" onclick="closeShareModal()">✕</button></div><div class="share-message-box"><p id="shareText">🔧 Find trusted local workers in Cameroon! https://handyman-buea.vercel.app/</p><button class="btn-small" onclick="copyShareText()" style="margin-top:12px;">📋 Copy Message</button></div><div class="share-buttons"><a href="#" id="shareWhatsApp" target="_blank" class="btn-whatsapp share-btn">📱 WhatsApp</a><a href="#" id="shareFacebook" target="_blank" class="btn-primary share-btn" style="background:#1877f2;">📘 Facebook</a><a href="#" id="shareTwitter" target="_blank" class="btn-primary share-btn" style="background:#1da1f2;">🐦 Twitter</a></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeShareModal();
    });
}

function openShareModal() {
    var modal = document.getElementById('shareModal');
    if (!modal) return;
    var text = encodeURIComponent('🔧 Find trusted local workers in Cameroon! https://handyman-buea.vercel.app/');
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
        sessionStorage.setItem('visitorTracked', 'true');
    } catch (e) {
        console.log('[HandyMan] Visitor tracking skipped');
    }
}

// ============================================================================
// AUTH
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
        authBtn.textContent = t('nav_logout');
        authBtn.href = '#';
        authBtn.onclick = async function(e) {
            e.preventDefault();
            try {
                await supabaseClient.auth.signOut();
                stopNotificationPolling();
            } catch (e) {}
            window.location.reload();
        };
        if (dashLink) {
            dashLink.style.display = 'inline-block';
            dashLink.textContent = t('nav_profile');
        }
        if (bell) bell.style.display = 'inline-flex';
    } else {
        authBtn.textContent = t('nav_login');
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
        if (error) return;
        renderNotificationBell(notifications ? notifications.length : 0);
        renderNotificationList(notifications || []);
    } catch (err) {}
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
// CATEGORIES & WORKERS
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
    if (!container) return;
    container.innerHTML = workers.map(function(w) {
        var avatar = (w.profiles && w.profiles.avatar_url) ? w.profiles.avatar_url : 'https://via.placeholder.com/80?text=No+Photo';
        var name = (w.profiles && w.profiles.full_name) ? w.profiles.full_name : 'Unknown';
        var location = (w.profiles && w.profiles.location) ? w.profiles.location : 'Cameroon';
        return '<div class="worker-card" onclick="viewWorker(\'' + w.id + '\')">' +
            '<div class="worker-avatar">' +
            '<img src="' + avatar + '" alt="' + name + '" onerror="this.src=\'https://via.placeholder.com/80?text=No+Photo\'">' +
            '</div>' +
            '<h3>' + name + '</h3>' +
            '<p class="worker-category">' + (w.category || 'General') + '</p>' +
            '<p class="worker-location">📍 ' + location + '</p>' +
            '<div class="worker-rating">' + '⭐'.repeat(Math.round(w.rating || 0)) + ' (' + (w.review_count || 0) + ' ' + t('reviews') + ')</div>' +
            '<button class="btn-small">' + t('view_profile') + '</button>' +
            '</div>';
    }).join('');
}

// ============================================================================
// CAROUSEL & HELPERS
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

// Expose needed functions
window.setLanguage = setLanguage;
window.t = t;
window.checkAuth = checkAuth;
window.isAdmin = isAdmin;
window.updateAuthUI = updateAuthUI;
window.uploadFile = uploadFile;
window.renderWorkers = renderWorkers;
window.viewWorker = viewWorker;
window.searchByCategory = searchByCategory;
