/**
 * Handy Man Buea — Core Application Logic
 * Version: 1.4.0 - SEO + Cameroon Towns + Rating Fix + Alphabetical + Uniform Buttons + Visitor Fix
 * Date: 9 September 2026
 */

const CONFIG = (typeof window!== 'undefined' && window.HANDYMAN_CONFIG)? window.HANDYMAN_CONFIG : {};
const SUPABASE_URL = CONFIG.SUPABASE_URL || 'https://zuhkhpdrxwfjcqnolmpu.supabase.co';
const SUPABASE_KEY = CONFIG.SUPABASE_ANON_KEY || 'sb_publishable_foPRwQRlPGlWBKYqeBHg4A_WcajeKKI';

if (!SUPABASE_URL ||!SUPABASE_KEY) {
    console.error('[HandyMan] CRITICAL: Missing Supabase configuration.');
}

var supabaseClient = null;
if (typeof window!== 'undefined' && window.supabaseClient) {
    supabaseClient = window.supabaseClient;
} else if (typeof window!== 'undefined' && typeof window.supabase!== 'undefined' && typeof window.supabase.createClient === 'function') {
    try { supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); window.supabaseClient = supabaseClient; } catch(e){}
}

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
// TRANSLATIONS - EN + FR COMPLETE
// ============================================================================
const I18N = {
    en: {
        nav_home: "Home", nav_workers: "Find Workers", nav_jobs: "Find Jobs", nav_join: "Join as Worker", nav_post: "Post a Job", nav_login: "Login", nav_logout: "Logout", nav_profile: "My Profile", search: "Search", loading: "Loading...", view_profile: "View Profile", reviews: "reviews", no_workers: "No workers found. Try a different search.", workers_title: "Find Workers in Cameroon", search_placeholder: "Search by name, skill or town...", all_categories: "All Categories", all_towns: "All Towns", contact_us: "Contact Us", hero_title: "Find Trusted Plumbers, Electricians & Cleaners in Buea, Douala, Yaounde", hero_sub: "Verified artisans in all Cameroon towns. Call or WhatsApp directly."
    },
    fr: {
        nav_home: "Accueil", nav_workers: "Trouver des ouvriers", nav_jobs: "Trouver des emplois", nav_join: "Devenir ouvrier", nav_post: "Publier un emploi", nav_login: "Connexion", nav_logout: "Déconnexion", nav_profile: "Mon Profil", search: "Rechercher", loading: "Chargement...", view_profile: "Voir le profil", reviews: "avis", no_workers: "Aucun ouvrier trouvé. Essayez une autre recherche.", workers_title: "Trouver des ouvriers au Cameroun", search_placeholder: "Rechercher par nom, compétence ou ville...", all_categories: "Toutes les catégories", all_towns: "Toutes les villes", contact_us: "Contactez-Nous", hero_title: "Trouvez Plombiers, Électriciens & Ménagères Vérifiés au Cameroun", hero_sub: "Artisans vérifiés partout au Cameroun. Appelez ou WhatsApp direct."
    }
};

function t(key) {
    var lang = localStorage.getItem('handyman_lang') || localStorage.getItem('hm_lang') || 'en';
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}
function setLanguage(lang) {
    if (lang!== 'en' && lang!== 'fr') lang = 'en';
    localStorage.setItem('handyman_lang', lang);
    localStorage.setItem('hm_lang', lang);
    applyLanguage();
    location.reload();
}
function applyLanguage() {
    var lang = localStorage.getItem('handyman_lang') || 'en';
    var enBtn = document.getElementById('langEn'); var frBtn = document.getElementById('langFr');
    if (enBtn) enBtn.classList.toggle('active', lang === 'en');
    if (frBtn) frBtn.classList.toggle('active', lang === 'fr');
    var nav = document.getElementById('nav');
    if (nav) {
        var links = nav.querySelectorAll('a');
        links.forEach(function(a) {
            var href = (a.getAttribute('href') || '').toLowerCase();
            if (href.includes('index.html') || href === '/' || href === '') { if (!a.classList.contains('logo')) a.textContent = t('nav_home'); }
            else if (href.includes('workers.html')) { a.textContent = t('nav_workers'); }
            else if (href.includes('jobs.html')) { a.textContent = t('nav_jobs'); }
            else if (href.includes('post-job.html')) { a.textContent = t('nav_post'); }
        });
    }
    var dash = document.getElementById('navDashboard'); if (dash) dash.textContent = t('nav_profile');
    var authBtn = document.getElementById('authBtn'); if (authBtn) { if (currentUser) authBtn.textContent = t('nav_logout'); else authBtn.textContent = t('nav_login'); }
    var title = document.querySelector('.search-page h1'); if (title) title.textContent = t('workers_title');
    var searchInput = document.getElementById('searchQuery') || document.getElementById('searchInput') || document.getElementById('searchName');
    if (searchInput) searchInput.placeholder = t('search_placeholder');
    var catSelect = document.getElementById('categoryFilter') || document.getElementById('searchCategory');
    if (catSelect && catSelect.options.length > 0) { catSelect.options[0].text = t('all_categories'); }
    var townSelect = document.getElementById('townFilter') || document.getElementById('searchTown');
    if (townSelect && townSelect.options.length > 0) { townSelect.options[0].text = t('all_towns'); }
    var heroT = document.getElementById('hero-title'); if(heroT) heroT.textContent = t('hero_title');
    var heroS = document.getElementById('hero-subtitle'); if(heroS) heroS.textContent = t('hero_sub');
}

// ============================================================================
// SUPABASE READY PROMISE
// ============================================================================
window.supabaseReady = new Promise(function(resolve) { window._resolveSupabaseReady = resolve; });
if (window._resolveSupabaseReady) { window._resolveSupabaseReady(supabaseClient); }

// ============================================================================
// APP INIT
// ============================================================================
document.addEventListener('DOMContentLoaded', async function() {
    try {
        injectNavExtras();
        injectShareButton();
        injectLanguageSwitcher();
        await trackVisitorNew();
        await checkAuth();
        applyLanguage();
        if (document.getElementById('categoryGrid')) { await loadCategories(); }
        if (document.getElementById('workerGrid') || document.getElementById('workersList')) { await loadFeaturedWorkers(); }
        if (document.getElementById('carouselDots')) { initCarousel(); }
        makeButtonsUniform();
        var menuToggle = document.getElementById('menuToggle');
        if (menuToggle) { menuToggle.addEventListener('click', function() { var n = document.getElementById('nav'); if (n) n.classList.toggle('active'); }); }
    } catch (err) {
        console.error('[HandyMan] App init error:', err);
        if (document.getElementById('categoryGrid')) { renderCategories(FALLBACK_CATEGORIES); }
    }
});

function makeButtonsUniform(){
    document.querySelectorAll('.btn, button').forEach(function(b){
        b.classList.add('uniform-btn');
        b.style.background = ''; // remove inline blue
    });
    // Fix login blue highlight
    var style = document.createElement('style');
    style.textContent = '.uniform-btn{background:#2563eb!important; color:white!important; border:none!important;}.btn-outline.uniform-btn{background:white!important; color:#2563eb!important; border:1px solid #2563eb!important;}';
    document.head.appendChild(style);
}

// ============================================================================
// LANGUAGE SWITCHER
// ============================================================================
function injectLanguageSwitcher() {
    if (document.getElementById('langSwitch')) return;
    var switcher = document.createElement('div');
    switcher.id = 'langSwitch'; switcher.className = 'lang-switch';
    switcher.innerHTML = `<button type="button" id="langEn" onclick="setLanguage('en')">EN</button><button type="button" id="langFr" onclick="setLanguage('fr')">FR</button>`;
    document.body.appendChild(switcher);
    var style = document.createElement('style');
    style.textContent = `.lang-switch{position:fixed;bottom:20px;left:20px;z-index:999;background:#fff;border:1px solid #e2e8f0;border-radius:30px;padding:6px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:0.85rem;}.lang-switch button{background:none;border:none;cursor:pointer;font-weight:600;padding:4px 10px;border-radius:20px;color:#64748b;}.lang-switch button.active{background:#2563eb;color:#fff;}`;
    document.head.appendChild(style);
}

// ============================================================================
// FILE UPLOAD
// ============================================================================
async function uploadFile(file, folder, userId) {
    if (!supabaseClient ||!file) return null;
    try {
        const uid = userId || (currentUser && currentUser.id) || 'anonymous';
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const safeExt = fileExt || 'jpg';
        const fileName = Date.now() + '_' + Math.random().toString(36).substring(2, 11) + '.' + safeExt;
        const filePath = folder + '/' + uid + '/' + fileName;
        const { error: uploadError } = await supabaseClient.storage.from('handyman-files').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) { console.error('[HandyMan] Upload error:', uploadError); return null; }
        const { data } = supabaseClient.storage.from('handyman-files').getPublicUrl(filePath);
        return data && data.publicUrl? data.publicUrl : null;
    } catch (err) { console.error('[HandyMan] Upload exception:', err); return null; }
}
async function uploadMultipleFiles(fileList, folder, userId, maxCount) {
    const urls = []; const files = Array.from(fileList || []).slice(0, maxCount || 2);
    for (var i = 0; i < files.length; i++) { var f = files[i]; if (!f.type ||!f.type.startsWith('image/')) continue; var url = await uploadFile(f, folder, userId); if (url) urls.push(url); }
    return urls;
}

// ============================================================================
// NAV EXTRAS - REMOVES ADMIN BUTTON FROM HOME, ADDS My Profile only after login
// ============================================================================
function injectNavExtras() {
    var nav = document.getElementById('nav');
    if (!nav || nav.querySelector('#navDashboard')) return;
    // Remove any existing Admin link from public nav
    nav.querySelectorAll('a').forEach(function(a){ if(a.textContent.toLowerCase().includes('admin')){ a.style.display='none'; } });
    var dashLink = document.createElement('a');
    dashLink.href = 'dashboard.html'; dashLink.className = 'btn-secondary'; dashLink.id = 'navDashboard'; dashLink.textContent = t('nav_profile'); dashLink.style.display = 'none';
    var authBtn = nav.querySelector('#authBtn'); if (authBtn) nav.insertBefore(dashLink, authBtn);
    var bellContainer = document.createElement('div'); bellContainer.className = 'nav-bell'; bellContainer.id = 'navBell'; bellContainer.innerHTML = '🔔<span class="bell-count" id="bellCount" style="display:none;">0</span>'; bellContainer.style.display = 'none';
    bellContainer.onclick = function(e) { e.stopPropagation(); toggleNotifications(); };
    if (authBtn) nav.insertBefore(bellContainer, authBtn);
    var dropdown = document.createElement('div'); dropdown.className = 'notification-dropdown'; dropdown.id = 'notificationDropdown'; dropdown.innerHTML = '<div class="notification-header">🔔 Notifications</div><div class="notification-list" id="notificationList"><p class="notification-empty">Loading...</p></div>';
    document.body.appendChild(dropdown);
    document.addEventListener('click', function(e) { var d = document.getElementById('notificationDropdown'); var b = document.getElementById('navBell'); if (d && b &&!d.contains(e.target) &&!b.contains(e.target)) { d.classList.remove('active'); } });
}

function injectShareButton() {
    if (document.getElementById('shareFab')) return;
    var fab = document.createElement('div'); fab.id = 'shareFab'; fab.className = 'share-fab'; fab.innerHTML = '🔗'; fab.title = 'Share Handy Man'; fab.onclick = openShareModal; document.body.appendChild(fab);
    var modal = document.createElement('div'); modal.id = 'shareModal'; modal.className = 'share-modal'; modal.innerHTML = '<div class="share-modal-content"><div class="share-modal-header"><h3>🔗 Share Handy Man</h3><button class="share-close" onclick="closeShareModal()">✕</button></div><div class="share-message-box"><p id="shareText">🔧 Find trusted local workers in Cameroon! https://handyman-buea.vercel.app/</p><button class="btn-small" onclick="copyShareText()" style="margin-top:12px;">📋 Copy Message</button></div><div class="share-buttons"><a href="#" id="shareWhatsApp" target="_blank" class="btn-whatsapp share-btn">📱 WhatsApp</a><a href="#" id="shareFacebook" target="_blank" class="btn-primary share-btn" style="background:#1877f2;">📘 Facebook</a><a href="#" id="shareTwitter" target="_blank" class="btn-primary share-btn" style="background:#1da1f2;">🐦 Twitter</a></div></div>'; document.body.appendChild(modal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeShareModal(); });
}
function openShareModal() {
    var modal = document.getElementById('shareModal'); if (!modal) return;
    var text = encodeURIComponent('🔧 Find trusted local workers in Cameroon! https://handyman-buea.vercel.app/'); var url = encodeURIComponent('https://handyman-buea.vercel.app/');
    document.getElementById('shareWhatsApp').href = 'https://wa.me/?text=' + text; document.getElementById('shareFacebook').href = 'https://www.facebook.com/sharer/sharer.php?u=' + url; document.getElementById('shareTwitter').href = 'https://twitter.com/intent/tweet?text=' + text; modal.classList.add('active');
}
function closeShareModal() { var modal = document.getElementById('shareModal'); if (modal) modal.classList.remove('active'); }
function copyShareText() {
    var text = document.getElementById('shareText').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function() { alert('Message copied!'); }).catch(function() { fallbackCopy(text); }); } else { fallbackCopy(text); }
}
function fallbackCopy(text) { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('Message copied!'); }

// ============================================================================
// ANALYTICS - FIXED VISITOR COUNT PER DAY/WEEK/MONTH
// ============================================================================
async function trackVisitorNew() {
    if (!supabaseClient || sessionStorage.getItem('visitorTracked')) return;
    try {
        await supabaseClient.from('visitors').insert({ page: window.location.pathname, visited_at: new Date().toISOString().slice(0,10) });
        var today = new Date().toISOString().slice(0, 10);
        var { data: stats } = await supabaseClient.from('site_stats').select('*').eq('id', 1).single();
        if (stats) {
            var visitorsToday = stats.visitors_today || 0;
            if (stats.visitors_today_date!== today) { visitorsToday = 1; } else { visitorsToday = (stats.visitors_today || 0) + 1; }
            await supabaseClient.from('site_stats').update({ total_visitors: (stats.total_visitors || 0) + 1, visitors_today: visitorsToday, visitors_today_date: today, last_updated: new Date().toISOString() }).eq('id', 1);
        }
        sessionStorage.setItem('visitorTracked', 'true');
    } catch (e) { console.log('[HandyMan] Visitor tracking skipped', e.message); }
}
async function trackVisitor(){ await trackVisitorNew(); }

// ============================================================================
// AUTH
// ============================================================================
async function checkAuth() {
    try {
        if (!supabaseClient) return;
        var { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;
        if (user) {
            var { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
            currentProfile = profile;
            loadNotifications(); startNotificationPolling();
        }
        updateAuthUI();
    } catch (e) { console.log('[HandyMan] Auth check failed:', e.message); }
}
function isAdmin() { if (currentProfile && currentProfile.is_admin === true) return true; return false; }
function updateAuthUI() {
    var authBtn = document.getElementById('authBtn'); var dashLink = document.getElementById('navDashboard'); var bell = document.getElementById('navBell');
    if (!authBtn) return;
    if (currentUser && supabaseClient) {
        authBtn.textContent = t('nav_logout'); authBtn.href = '#';
        authBtn.onclick = async function(e) { e.preventDefault(); try { await supabaseClient.auth.signOut(); stopNotificationPolling(); } catch (e) {} window.location.reload(); };
        if (dashLink) { dashLink.style.display = 'inline-block'; dashLink.textContent = t('nav_profile'); }
        if (bell) bell.style.display = 'inline-flex';
    } else {
        authBtn.textContent = t('nav_login'); authBtn.href = 'login.html'; authBtn.onclick = null;
        if (dashLink) dashLink.style.display = 'none'; if (bell) bell.style.display = 'none';
    }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
async function loadNotifications() {
    if (!supabaseClient ||!currentUser) return;
    try {
        var { data: notifications, error } = await supabaseClient.from('notifications').select('*').eq('user_id', currentUser.id).eq('read', false).order('created_at', { ascending: false }).limit(20);
        if (error) return; renderNotificationBell(notifications? notifications.length : 0); renderNotificationList(notifications || []);
    } catch (err) {}
}
function renderNotificationBell(count) { var bellCount = document.getElementById('bellCount'); if (!bellCount) return; if (count > 0) { bellCount.textContent = count > 9? '9+' : count; bellCount.style.display = 'flex'; } else { bellCount.style.display = 'none'; } }
function toggleNotifications() { var dropdown = document.getElementById('notificationDropdown'); if (!dropdown) return; dropdown.classList.toggle('active'); if (dropdown.classList.contains('active')) loadNotifications(); }
function renderNotificationList(notifications) {
    var list = document.getElementById('notificationList'); if (!list) return;
    if (!notifications || notifications.length === 0) { list.innerHTML = '<p class="notification-empty">No new notifications</p>'; return; }
    list.innerHTML = notifications.map(function(n) {
        return '<div class="notification-item ' + (n.read? 'read' : 'unread') + '" onclick="handleNotificationClick(\'' + n.id + '\', \'' + (n.job_id || '') + '\')">' + '<p class="notification-msg">' + escapeHtml(n.message) + '</p>' + '<span class="notification-time">' + timeAgo(n.created_at) + '</span>' + '</div>';
    }).join('');
}
async function handleNotificationClick(notificationId, jobId) {
    if (supabaseClient && notificationId) { await supabaseClient.from('notifications').update({ read: true }).eq('id', notificationId); loadNotifications(); }
    if (jobId) window.location.href = 'job.html?id=' + jobId;
}
function startNotificationPolling() { if (notificationPollingInterval) return; loadNotifications(); notificationPollingInterval = setInterval(function() { if (currentUser) loadNotifications(); }, 30000); }
function stopNotificationPolling() { if (notificationPollingInterval) { clearInterval(notificationPollingInterval); notificationPollingInterval = null; } }

// ============================================================================
// CATEGORIES & WORKERS - FIXED ALPHABETICAL + RATING FIX
// ============================================================================
async function loadCategories() {
    var grid = document.getElementById('categoryGrid'); if (!grid) return;
    if (!supabaseClient) { renderCategories(FALLBACK_CATEGORIES); return; }
    try { var { data: categories, error } = await supabaseClient.from('categories').select('*').limit(20); if (error ||!categories || categories.length === 0) { renderCategories(FALLBACK_CATEGORIES); return; } renderCategories(categories); } catch (err) { renderCategories(FALLBACK_CATEGORIES); }
}
function renderCategories(categories) {
    var grid = document.getElementById('categoryGrid'); if (!grid) return;
    grid.innerHTML = categories.map(function(cat) {
        return '<div class="category-card" onclick="searchByCategory(\'' + cat.name + '\')">' + '<div class="category-icon">' + (cat.icon || '🔧') + '</div>' + '<h3>' + cat.name + '</h3>' + '<p>' + (cat.description || '') + '</p>' + '</div>';
    }).join('');
}
async function loadFeaturedWorkers() {
    var grid = document.getElementById('workerGrid') || document.getElementById('workersList');
    if (!grid) return;
    if (!supabaseClient) { grid.innerHTML = '<p class="empty">No workers yet.</p>'; return; }
    try {
        // FIXED: Order alphabetically by full_name, include average_rating and total_reviews
        var { data: workers, error } = await supabaseClient.from('profiles').select('*').eq('is_deleted', false).eq('is_worker', true).order('full_name', { ascending: true }).limit(50);
        if (error ||!workers || workers.length === 0) {
            // Fallback to worker_details if profiles empty
            var { data: wd } = await supabaseClient.from('worker_details').select('*, profiles(full_name, avatar_url, location, average_rating, total_reviews)').order('rating', { ascending: false }).limit(12);
            if (wd && wd.length>0){ renderWorkers(wd, grid); return; }
            grid.innerHTML = '<p class="empty">No workers yet.</p>'; return;
        }
        window.allWorkers = workers;
        renderWorkersFromProfiles(workers, grid);
    } catch (err) { grid.innerHTML = '<p class="empty">Error loading workers</p>'; }
}
function renderWorkersFromProfiles(workers, container){
    if (!container) return;
    container.innerHTML = workers.map(function(w){
        var avatar = w.photo_url || w.avatar_url || 'https://via.placeholder.com/80?text=No+Photo';
        var name = w.full_name || 'Unknown'; var location = w.town || w.location || 'Cameroon';
        var avg = w.average_rating? Number(w.average_rating).toFixed(1) : '0.0'; var total = w.total_reviews || 0;
        return '<div class="worker-card" onclick="viewWorker(\''+w.id+'\')"><div class="worker-avatar"><img src="'+avatar+'" alt="'+name+'" onerror="this.src=\'https://via.placeholder.com/80?text=No+Photo\'"></div><h3>'+name+'</h3><p class="worker-category">'+(w.category||'General')+'</p><p class="worker-location">📍 '+location+'</p><div class="worker-rating">'+'⭐'.repeat(Math.round(avg))+' '+avg+' /5 ('+total+' '+t('reviews')+')</div><button class="btn-small uniform-btn">'+t('view_profile')+'</button></div>';
    }).join('');
}
function renderWorkers(workers, container) {
    if (!container) return;
    container.innerHTML = workers.map(function(w) {
        var avatar = (w.profiles && w.profiles.avatar_url)? w.profiles.avatar_url : (w.photo_url || w.avatar_url || 'https://via.placeholder.com/80?text=No+Photo');
        var name = (w.profiles && w.profiles.full_name)? w.profiles.full_name : (w.full_name || 'Unknown');
        var location = (w.profiles && (w.profiles.town || w.profiles.location))? (w.profiles.town || w.profiles.location) : (w.town || 'Cameroon');
        var avg = (w.profiles && w.profiles.average_rating)? Number(w.profiles.average_rating).toFixed(1) : (w.rating? Number(w.rating).toFixed(1) : '0.0');
        var total = (w.profiles && w.profiles.total_reviews)? w.profiles.total_reviews : (w.review_count || 0);
        return '<div class="worker-card" onclick="viewWorker(\'' + w.id + '\')"><div class="worker-avatar"><img src="' + avatar + '" alt="' + name + '" onerror="this.src=\'https://via.placeholder.com/80?text=No+Photo\'"></div><h3>' + name + '</h3><p class="worker-category">' + (w.category || 'General') + '</p><p class="worker-location">📍 ' + location + '</p><div class="worker-rating">' + '⭐'.repeat(Math.round(avg)) + ' ' + avg + ' /5 (' + total + ' ' + t('reviews') + ')</div><button class="btn-small uniform-btn">' + t('view_profile') + '</button></div>';
    }).join('');
}

// ============================================================================
// WORKERS FILTER FOR INDEX PAGE - SEARCH BY NAME/TOWN/CATEGORY
// ============================================================================
function filterWorkers(){
    var name = (document.getElementById('searchName')?.value || document.getElementById('searchQuery')?.value || '').toLowerCase();
    var town = document.getElementById('searchTown')?.value || document.getElementById('townFilter')?.value || '';
    var cat = document.getElementById('searchCategory')?.value || document.getElementById('categoryFilter')?.value || '';
    var workers = window.allWorkers || [];
    var filtered = workers.filter(function(w){
        var matchName =!name || (w.full_name && w.full_name.toLowerCase().includes(name)) || (w.category && w.category.toLowerCase().includes(name));
        var matchTown =!town || w.town === town || w.location === town;
        var matchCat =!cat || w.category === cat;
        return matchName && matchTown && matchCat;
    });
    var grid = document.getElementById('workersList') || document.getElementById('workerGrid');
    if(grid) renderWorkersFromProfiles(filtered, grid);
}

// ============================================================================
// CAROUSEL & HELPERS
// ============================================================================
function initCarousel() {
    var slides = document.querySelectorAll('.carousel-slide'); var dotsContainer = document.getElementById('carouselDots'); if (!slides.length ||!dotsContainer) return;
    dotsContainer.innerHTML = ''; slides.forEach(function(_, i) { var dot = document.createElement('div'); dot.className = 'carousel-dot' + (i === 0? ' active' : ''); dot.onclick = function() { goToSlide(i); }; dotsContainer.appendChild(dot); });
    var current = 0; setInterval(function() { goToSlide((current + 1) % slides.length); }, 5000);
    function goToSlide(index) { slides.forEach(function(s, i) { s.classList.toggle('active', i === index); }); var dots = dotsContainer.querySelectorAll('.carousel-dot'); dots.forEach(function(d, i) { d.classList.toggle('active', i === index); }); current = index; }
}
function searchWorkers() { var query = document.getElementById('searchInput'); if (query && query.value) { window.location.href = 'workers.html?q=' + encodeURIComponent(query.value); } }
function searchByCategory(category) { window.location.href = 'workers.html?category=' + encodeURIComponent(category); }
function viewWorker(id) { window.location.href = 'worker.html?id=' + id; }
function viewJob(id) { window.location.href = 'job.html?id=' + id; }
function escapeHtml(text) { if (!text) return ''; var div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function timeAgo(dateString) { var date = new Date(dateString); var now = new Date(); var seconds = Math.floor((now - date) / 1000); if (seconds < 60) return 'Just now'; var minutes = Math.floor(seconds / 60); if (minutes < 60) return minutes + 'm ago'; var hours = Math.floor(minutes / 60); if (hours < 24) return hours + 'h ago'; var days = Math.floor(hours / 24); return days + 'd ago'; }
function buildContactLinks(phone) { var digits = (phone || '').replace(/\D/g, ''); var local = digits; if (local.startsWith('237')) local = local.slice(3); if (local.length < 8) return { wa: '#', call: '#' }; return { wa: 'https://wa.me/237' + local, call: 'tel:+237' + local }; }
function togglePassword(id){ var input = document.getElementById(id); if(!input) return; if(input.type==='password') input.type='text'; else input.type='password'; }

// Expose needed functions
window.setLanguage = setLanguage; window.t = t; window.checkAuth = checkAuth; window.isAdmin = isAdmin; window.updateAuthUI = updateAuthUI; window.uploadFile = uploadFile; window.renderWorkers = renderWorkers; window.viewWorker = viewWorker; window.searchByCategory = searchByCategory; window.filterWorkers = filterWorkers; window.togglePassword = togglePassword; window.trackVisitorNew = trackVisitorNew;
