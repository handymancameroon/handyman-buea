/**
 * Handy Man Cameroon — Core Application Logic
 * Version: 1.4.0 (Full bilingual EN/FR support)
 * Date: 7 September 2026
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

const CAMEROON_TOWNS = [
    'Buea', 'Limbe', 'Douala', 'Yaoundé', 'Bamenda', 'Bafoussam',
    'Kribi', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa',
    'Kumba', 'Dschang', 'Nkongsamba', 'Edéa', 'Mutengene', 'Tiko', 'Other'
];

// ============================================================================
// FULL TRANSLATIONS (EN + FR)
// ============================================================================
const I18N = {
    en: {
        // Navigation
        nav_home: "Home",
        nav_workers: "Find Workers",
        nav_jobs: "Find Jobs",
        nav_join: "Join as Worker",
        nav_post: "Post a Job",
        nav_login: "Login",
        nav_logout: "Logout",
        nav_profile: "My Profile",

        // Common
        search: "Search",
        loading: "Loading...",
        no_results: "No results found.",
        error: "Something went wrong. Please try again.",
        view_profile: "View Profile",
        view_job: "View Job",
        all_categories: "All Categories",
        all_towns: "All Towns",
        reviews: "reviews",
        review: "review",

        // Home
        hero_title: "Find Trusted Local Help in Cameroon",
        hero_sub: "Connect with skilled plumbers, electricians, cleaners, and more — anywhere in Cameroon.",
        hero_find: "Find a Worker",
        hero_post: "Post a Job",
        popular_services: "Popular Services",
        featured_workers: "Featured Workers in Cameroon",
        how_title: "How It Works",
        how_search: "Search",
        how_search_p: "Find the right worker in your town",
        how_contact: "Contact",
        how_contact_p: "Call or WhatsApp them directly",
        how_done: "Get It Done",
        how_done_p: "Rate and review after service",
        footer_text: "© 2026 Handy Man. Connecting people with skilled workers across Cameroon.",
        contact_us: "📧 Contact Us",

        // Workers page
        workers_title: "Find Workers in Cameroon",
        search_placeholder: "Search by name, skill or town...",
        searching: "Searching...",
        no_workers: "No workers found. Try a different search.",

        // Jobs page
        jobs_title: "Find Jobs in Cameroon",
        jobs_placeholder: "Search jobs or town...",
        no_jobs: "No jobs found. Be the first to post a job!",
        budget_not_specified: "Budget not specified",
        posted_by: "Posted by",

        // Login / Register
        welcome_back: "Welcome Back",
        create_account: "Create Account",
        email: "Email",
        password: "Password",
        full_name: "Full Name *",
        phone: "Phone Number (WhatsApp) *",
        i_am_a: "I am a: *",
        client_option: "Looking for services (Client)",
        worker_option: "Offering services (Worker)",
        town: "Town / City *",
        select_town: "Select town",
        other_specify: "Other (specify below)",
        profile_photo: "Profile Photo (optional)",
        service_category: "Service Category *",
        create_account_btn: "Create Account",
        login_btn: "Login",

        // Dashboard
        my_dashboard: "My Dashboard",
        my_photo: "📷 My Profile Photo",
        my_jobs: "📋 My Posted Jobs",
        open_jobs_category: "🛠️ Open Jobs in My Category",
        my_worker_profile: "🔧 My Worker Profile",
        my_disputes: "🚩 My Disputes / Reports",
        no_jobs_yet: "You haven't posted any jobs yet.",
        post_first_job: "Post Your First Job",
        close_job: "Close Job",
        no_worker_profile: "You don't have a worker profile yet.",
        create_worker_profile: "Create Worker Profile",
        upload_change_photo: "Upload / Change Photo",
        photo_updated: "Photo updated successfully!",
        select_photo_first: "Please select a photo first.",
        upload_failed: "Upload failed. Try again.",

        // Contact modal
        contact_title: "📧 Contact Us",
        contact_sub: "Send us a message. We will reply as soon as possible.",
        contact_name: "Your Name",
        contact_email: "Email *",
        contact_phone: "Phone / WhatsApp *",
        contact_message: "Message *",
        contact_send: "Send Message",
        message_sent: "Message sent successfully! We will get back to you soon.",

        // Notifications
        notifications: "Notifications",
        no_notifications: "No new notifications",
        just_now: "Just now"
    },
        fr: {
        // Navigation (shortened so the menu stays on one line)
        nav_home: "Accueil",
        nav_workers: "Ouvriers",
        nav_jobs: "Emplois",
        nav_join: "Devenir ouvrier",
        nav_post: "Publier",
        nav_login: "Connexion",
        nav_logout: "Déconnexion",
        nav_profile: "Mon Profil",

        // Common
        search: "Rechercher",
        loading: "Chargement...",
        no_results: "Aucun résultat trouvé.",
        error: "Une erreur s'est produite. Veuillez réessayer.",
        view_profile: "Voir le profil",
        view_job: "Voir l'emploi",
        all_categories: "Toutes les catégories",
        all_towns: "Toutes les villes",
        reviews: "avis",
        review: "avis",

        // Home
        hero_title: "Trouvez de l'aide locale de confiance au Cameroun",
        hero_sub: "Connectez-vous avec des plombiers, électriciens, nettoyeurs qualifiés et plus — partout au Cameroun.",
        hero_find: "Trouver un travailleur",
        hero_post: "Publier un emploi",
        popular_services: "Services populaires",
        featured_workers: "Travailleurs vedettes au Cameroun",
        how_title: "Comment ça marche",
        how_search: "Rechercher",
        how_search_p: "Trouvez le bon travailleur dans votre ville",
        how_contact: "Contacter",
        how_contact_p: "Appelez ou contactez-les directement sur WhatsApp",
        how_done: "Faites-le faire",
        how_done_p: "Notez et commentez après le service",
        footer_text: "© 2026 Handy Man. Connecter les gens avec des travailleurs qualifiés à travers le Cameroun.",
        contact_us: "📧 Contactez-nous",

        // Workers page
        workers_title: "Trouver des travailleurs au Cameroun",
        search_placeholder: "Rechercher par nom, compétence ou ville...",
        searching: "Recherche en cours...",
        no_workers: "Aucun travailleur trouvé. Essayez une autre recherche.",

        // Jobs page
        jobs_title: "Trouver des emplois au Cameroun",
        jobs_placeholder: "Rechercher des emplois ou une ville...",
        no_jobs: "Aucun emploi trouvé. Soyez le premier à publier un emploi !",
        budget_not_specified: "Budget non précisé",
        posted_by: "Publié par",

        // Login / Register
        welcome_back: "Bon retour",
        create_account: "Créer un compte",
        email: "Email",
        password: "Mot de passe",
        full_name: "Nom complet *",
        phone: "Numéro de téléphone (WhatsApp) *",
        i_am_a: "Je suis : *",
        client_option: "À la recherche de services (Client)",
        worker_option: "Offrant des services (Travailleur)",
        town: "Ville *",
        select_town: "Sélectionner une ville",
        other_specify: "Autre (préciser ci-dessous)",
        profile_photo: "Photo de profil (optionnel)",
        service_category: "Catégorie de service *",
        create_account_btn: "Créer le compte",
        login_btn: "Connexion",

        // Dashboard
        my_dashboard: "Mon Tableau de bord",
        my_photo: "📷 Ma photo de profil",
        my_jobs: "📋 Mes emplois publiés",
        open_jobs_category: "🛠️ Emplois ouverts dans ma catégorie",
        my_worker_profile: "🔧 Mon profil de travailleur",
        my_disputes: "🚩 Mes litiges / signalements",
        no_jobs_yet: "Vous n'avez pas encore publié d'emploi.",
        post_first_job: "Publier votre premier emploi",
        close_job: "Fermer l'emploi",
        no_worker_profile: "Vous n'avez pas encore de profil de travailleur.",
        create_worker_profile: "Créer un profil de travailleur",
        upload_change_photo: "Télécharger / Changer la photo",
        photo_updated: "Photo mise à jour avec succès !",
        select_photo_first: "Veuillez d'abord sélectionner une photo.",
        upload_failed: "Échec du téléchargement. Réessayez.",

        // Contact modal
        contact_title: "📧 Contactez-nous",
        contact_sub: "Envoyez-nous un message. Nous vous répondrons dès que possible.",
        contact_name: "Votre nom",
        contact_email: "Email *",
        contact_phone: "Téléphone / WhatsApp *",
        contact_message: "Message *",
        contact_send: "Envoyer le message",
        message_sent: "Message envoyé avec succès ! Nous vous répondrons bientôt.",

        // Notifications
        notifications: "Notifications",
        no_notifications: "Aucune nouvelle notification",
        just_now: "À l'instant"
    }
};

function t(key) {
    var lang = getCurrentLang();
    return (I18N[lang] && I18N[lang][key]) || (I18N.en[key]) || key;
}

function getCurrentLang() {
    return localStorage.getItem('handyman_lang') || 'en';
}

function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'fr') lang = 'en';
    localStorage.setItem('handyman_lang', lang);
    applyLanguage(lang);
}

function applyLanguage(lang) {
    document.documentElement.lang = lang;

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        if (key && I18N[lang] && I18N[lang][key]) {
            el.textContent = I18N[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (key && I18N[lang] && I18N[lang][key]) {
            el.placeholder = I18N[lang][key];
        }
    });

    // Update language switcher buttons
    var enBtn = document.getElementById('langEn');
    var frBtn = document.getElementById('langFr');
    if (enBtn && frBtn) {
        enBtn.classList.toggle('active', lang === 'en');
        frBtn.classList.toggle('active', lang === 'fr');
    }

    // Update auth button text if present
    updateAuthUI();
}

// Inject language switcher on every page
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

    // Style (in case not in CSS yet)
    var style = document.createElement('style');
    style.textContent = `
        .lang-switch {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 90;
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
            padding: 4px 8px;
            border-radius: 16px;
        }
        .lang-switch button.active {
            background: #2563eb;
            color: white;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// SUPABASE + REST OF THE APP (unchanged logic)
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

document.addEventListener('DOMContentLoaded', async function() {
    try {
        injectNavExtras();
        injectShareButton();
        injectLanguageSwitcher();
        trackVisitor();
        await checkAuth();
        applyLanguage(getCurrentLang());

        if (document.getElementById('categoryGrid')) await loadCategories();
        if (document.getElementById('workerGrid')) await loadFeaturedWorkers();
        if (document.getElementById('carouselDots')) initCarousel();

        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function() {
                document.getElementById('nav').classList.toggle('active');
            });
        }
    } catch (err) {
        console.error('[HandyMan] App init error:', err);
        if (document.getElementById('categoryGrid')) renderCategories(FALLBACK_CATEGORIES);
    }
});

// --- File Upload ---
async function uploadFile(file, folder, userId) {
    if (!supabaseClient || !file) return null;
    try {
        const uid = userId || (currentUser && currentUser.id) || 'anonymous';
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const fileName = Date.now() + '_' + Math.random().toString(36).substring(2, 11) + '.' + (fileExt || 'jpg');
        const filePath = folder + '/' + uid + '/' + fileName;

        const { error: uploadError } = await supabaseClient.storage
            .from('handyman-files')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) return null;
        const { data } = supabaseClient.storage.from('handyman-files').getPublicUrl(filePath);
        return data && data.publicUrl ? data.publicUrl : null;
    } catch (err) {
        return null;
    }
}

async function uploadMultipleFiles(fileList, folder, userId, maxCount) {
    const urls = [];
    const files = Array.from(fileList || []).slice(0, maxCount || 2);
    for (var i = 0; i < files.length; i++) {
        if (!files[i].type || !files[i].type.startsWith('image/')) continue;
        var url = await uploadFile(files[i], folder, userId);
        if (url) urls.push(url);
    }
    return urls;
}

// --- Navigation ---
function injectNavExtras() {
    var nav = document.getElementById('nav');
    if (!nav || nav.querySelector('.nav-bell')) return;

    var dashLink = document.createElement('a');
    dashLink.href = 'dashboard.html';
    dashLink.className = 'btn-secondary';
    dashLink.id = 'navDashboard';
    dashLink.setAttribute('data-i18n', 'nav_profile');
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
    dropdown.innerHTML = '<div class="notification-header">🔔 ' + t('notifications') + '</div><div class="notification-list" id="notificationList"><p class="notification-empty">' + t('loading') + '</p></div>';
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
    fab.title = 'Share';
    fab.onclick = openShareModal;
    document.body.appendChild(fab);

    var modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'share-modal';
    modal.innerHTML = '<div class="share-modal-content"><div class="share-modal-header"><h3>🔗 Share Handy Man</h3><button class="share-close" onclick="closeShareModal()">✕</button></div><div class="share-message-box"><p id="shareText">🔧 Find trusted local workers in Cameroon! https://handyman-buea.vercel.app/</p><button class="btn-small" onclick="copyShareText()" style="margin-top:12px;">📋 Copy</button></div><div class="share-buttons"><a href="#" id="shareWhatsApp" target="_blank" class="btn-whatsapp share-btn">📱 WhatsApp</a><a href="#" id="shareFacebook" target="_blank" class="btn-primary share-btn" style="background:#1877f2;">📘 Facebook</a><a href="#" id="shareTwitter" target="_blank" class="btn-primary share-btn" style="background:#1da1f2;">🐦 Twitter</a></div></div>';
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
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() { alert('Copied!'); });
    } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('Copied!');
    }
}

// --- Analytics ---
async function trackVisitor() {
    if (!supabaseClient || sessionStorage.getItem('visitorTracked')) return;
    try {
        var today = new Date().toISOString().slice(0, 10);
        try {
            await supabaseClient.from('visitor_logs').insert([{ visited_at: new Date().toISOString(), visit_date: today }]);
        } catch (e) {}
        var { data: stats } = await supabaseClient.from('site_stats').select('total_visitors, visitors_today, visitors_today_date').eq('id', 1).maybeSingle();
        if (stats) {
            var visitorsToday = (stats.visitors_today_date !== today) ? 1 : (stats.visitors_today || 0) + 1;
            await supabaseClient.from('site_stats').update({
                total_visitors: (stats.total_visitors || 0) + 1,
                visitors_today: visitorsToday,
                visitors_today_date: today,
                last_updated: new Date().toISOString()
            }).eq('id', 1);
        } else {
            await supabaseClient.from('site_stats').upsert({
                id: 1, total_visitors: 1, visitors_today: 1, visitors_today_date: today, last_updated: new Date().toISOString()
            });
        }
        sessionStorage.setItem('visitorTracked', 'true');
    } catch (e) {}
}

// --- Auth ---
async function checkAuth() {
    try {
        if (!supabaseClient) return;
        var { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;
        if (user) {
            var { data: profile } = await supabaseClient.from('profiles').select('is_admin, full_name, phone, avatar_url, is_deleted').eq('id', user.id).single();
            if (profile && profile.is_deleted === true) {
                await supabaseClient.auth.signOut();
                currentUser = null;
                currentProfile = null;
                alert('This account has been deactivated by the administrator.');
                window.location.href = 'login.html';
                return;
            }
            currentProfile = profile;
            loadNotifications();
            startNotificationPolling();
        }
        updateAuthUI();
    } catch (e) {}
}

function isAdmin() {
    return currentProfile && currentProfile.is_admin === true;
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

// --- Notifications ---
async function loadNotifications() {
    if (!supabaseClient || !currentUser) return;
    try {
        var { data: notifications } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(20);
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
        list.innerHTML = '<p class="notification-empty">' + t('no_notifications') + '</p>';
        return;
    }
    list.innerHTML = notifications.map(function(n) {
        return '<div class="notification-item ' + (n.read ? 'read' : 'unread') + '" onclick="handleNotificationClick(\'' + n.id + '\', \'' + (n.job_id || '') + '\')">' +
            '<p class="notification-msg">' + escapeHtml(n.message) + '</p>' +
            '<span class="notification-time">' + timeAgo(n.created_at) + '</span></div>';
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

// --- Categories & Workers ---
async function loadCategories() {
    var grid = document.getElementById('categoryGrid');
    if (!grid) return;
    if (!supabaseClient) {
        renderCategories(FALLBACK_CATEGORIES);
        return;
    }
    try {
        var { data: categories } = await supabaseClient.from('categories').select('*').limit(11);
        renderCategories(categories && categories.length ? categories : FALLBACK_CATEGORIES);
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
            '<p>' + (cat.description || '') + '</p></div>';
    }).join('');
}

async function loadFeaturedWorkers() {
    var grid = document.getElementById('workerGrid');
    if (!grid) return;
    if (!supabaseClient) {
        grid.innerHTML = '<p class="empty">' + t('no_workers') + '</p>';
        return;
    }
    try {
        var { data: workers } = await supabaseClient
            .from('worker_details')
            .select('*, profiles(full_name, avatar_url, location)')
            .eq('availability', 'Available')
            .order('rating', { ascending: false })
            .limit(6);
        if (!workers || workers.length === 0) {
            grid.innerHTML = '<p class="empty">' + t('no_workers') + '</p>';
            return;
        }
        renderWorkers(workers, grid);
    } catch (err) {
        grid.innerHTML = '<p class="empty">' + t('no_workers') + '</p>';
    }
}

function renderWorkers(workers, container) {
    container.innerHTML = workers.map(function(w) {
        var avatar = (w.profiles && w.profiles.avatar_url) || 'https://via.placeholder.com/80?text=No+Photo';
        var name = (w.profiles && w.profiles.full_name) || 'Unknown';
        var location = (w.profiles && w.profiles.location) || 'Cameroon';
        var rating = Number(w.rating) || 0;
        var count = Number(w.review_count) || 0;
        var stars = '⭐'.repeat(Math.max(0, Math.min(5, Math.round(rating)))) || '☆☆☆☆☆';

        return '<div class="worker-card" onclick="viewWorker(\'' + w.id + '\')">' +
            '<div class="worker-avatar"><img src="' + avatar + '" alt="' + name + '" onerror="this.src=\'https://via.placeholder.com/80?text=No+Photo\'"></div>' +
            '<h3>' + name + '</h3>' +
            '<p class="worker-category">' + (w.category || 'General') + '</p>' +
            '<p class="worker-location">📍 ' + location + '</p>' +
            '<div class="worker-rating">' + stars + ' <span>(' + count + ' ' + (count === 1 ? t('review') : t('reviews')) + ')</span></div>' +
            '<button class="btn-small">' + t('view_profile') + '</button></div>';
    }).join('');
}

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
        slides.forEach(function(s, i) { s.classList.toggle('active', i === index); });
        var dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach(function(d, i) { d.classList.toggle('active', i === index); });
        current = index;
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
    if (seconds < 60) return t('just_now');
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h';
    return Math.floor(hours / 24) + 'd';
}

function buildContactLinks(phone) {
    var digits = (phone || '').replace(/\D/g, '');
    var local = digits;
    if (local.startsWith('237')) local = local.slice(3);
    if (local.length < 8) return { wa: '#', call: '#' };
    return { wa: 'https://wa.me/237' + local, call: 'tel:+237' + local };
}

// Expose globally
window.setLanguage = setLanguage;
window.getCurrentLang = getCurrentLang;
window.t = t;
window.applyLanguage = applyLanguage;
