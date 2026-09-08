/**
 * Handy Man Cameroon — Core Application Logic
 * Version: 1.4.1 (Safe bilingual EN/FR + My Profile)
 * Date: 8 September 2026
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
        no_results: "No results found.",
        error: "Something went wrong. Please try again.",
        view_profile: "View Profile",
        view_job: "View Job",
        all_categories: "All Categories",
        all_towns: "All Towns",
        reviews: "reviews",
        review: "review",

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

        workers_title: "Find Workers in Cameroon",
        search_placeholder: "Search by name, skill or town...",
        searching: "Searching...",
        no_workers: "No workers found. Try a different search.",

        jobs_title: "Find Jobs in Cameroon",
        jobs_placeholder: "Search jobs or town...",
        no_jobs: "No jobs found. Be the first to post a job!",
        budget_not_specified: "Budget not specified",
        posted_by: "Posted by",

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

        my_dashboard: "My Profile",
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

        contact_title: "📧 Contact Us",
        contact_sub: "Send us a message. We will reply as soon as possible.",
        contact_name: "Your Name",
        contact_email: "Email *",
        contact_phone: "Phone / WhatsApp *",
        contact_message: "Message *",
        contact_send: "Send Message",
        message_sent: "Message sent successfully! We will get back to you soon.",

        notifications: "Notifications",
        no_notifications: "No new notifications",
        just_now: "Just now"
    },
    fr: {
        nav_home: "Accueil",
        nav_workers: "Ouvriers",
        nav_jobs: "Emplois",
        nav_join: "Devenir ouvrier",
        nav_post: "Publier",
        nav_login: "Connexion",
        nav_logout: "Déconnexion",
        nav_profile: "Mon Profil",

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

        workers_title: "Trouver des travailleurs au Cameroun",
        search_placeholder: "Rechercher par nom, compétence ou ville...",
        searching: "Recherche en cours...",
        no_workers: "Aucun travailleur trouvé. Essayez une autre recherche.",

        jobs_title: "Trouver des emplois au Cameroun",
        jobs_placeholder: "Rechercher des emplois ou une ville...",
        no_jobs: "Aucun emploi trouvé. Soyez le premier à publier un emploi !",
        budget_not_specified: "Budget non précisé",
        posted_by: "Publié par",

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

        my_dashboard: "Mon Profil",
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

        contact_title: "📧 Contactez-nous",
        contact_sub: "Envoyez-nous un message. Nous vous répondrons dès que possible.",
        contact_name: "Votre nom",
        contact_email: "Email *",
        contact_phone: "Téléphone / WhatsApp *",
        contact_message: "Message *",
        contact_send: "Envoyer le message",
        message_sent: "Message envoyé avec succès ! Nous vous répondrons bientôt.",

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

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        if (key && I18N[lang] && I18N[lang][key]) {
            el.textContent = I18N[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (key && I18N[lang] && I18N[lang][key]) {
            el.placeholder = I18N[lang][key];
        }
    });

    var enBtn = document.getElementById('langEn');
    var frBtn = document.getElementById('langFr');
    if (enBtn && frBtn) {
        enBtn.classList.toggle('active', lang === 'en');
        frBtn.classList.toggle('active', lang === 'fr');
    }

    updateAuthUI();
}

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

// ---------- Supabase init ----------
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return null;
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return supabaseClient;
}

// ---------- Auth helpers ----------
async function checkAuth() {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) return null;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentUser = session ? session.user : null;

        if (currentUser) {
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();
            currentProfile = profile;
        } else {
            currentProfile = null;
        }
        updateAuthUI();
        return currentUser;
    } catch (e) {
        console.error('Auth check error', e);
        currentUser = null;
        currentProfile = null;
        updateAuthUI();
        return null;
    }
}

function isAdmin() {
    if (!currentUser) return false;
    const adminEmail = (CONFIG.ADMIN_EMAIL || 'internationalpimerchant@gmail.com').toLowerCase();
    return currentUser.email && currentUser.email.toLowerCase() === adminEmail;
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    if (!authBtn) return;

    if (currentUser) {
        authBtn.textContent = t('nav_logout');
        authBtn.href = '#';
        authBtn.onclick = async function(e) {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            currentUser = null;
            currentProfile = null;
            window.location.href = 'index.html';
        };

        // Add / update My Profile link
        let profileLink = document.getElementById('myProfileLink');
        if (!profileLink) {
            profileLink = document.createElement('a');
            profileLink.id = 'myProfileLink';
            profileLink.href = 'dashboard.html';
            profileLink.className = 'btn-secondary';
            authBtn.parentNode.insertBefore(profileLink, authBtn);
        }
        profileLink.textContent = t('nav_profile');
        profileLink.style.display = '';
    } else {
        authBtn.textContent = t('nav_login');
        authBtn.href = 'login.html';
        authBtn.onclick = null;

        const profileLink = document.getElementById('myProfileLink');
        if (profileLink) profileLink.style.display = 'none';
    }
}

// ---------- File upload helper ----------
async function uploadFile(file, folder, userId) {
    if (!supabaseClient || !file) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${userId || 'anon'}_${Date.now()}.${ext}`;
    const { data, error } = await supabaseClient.storage
        .from('handyman-files')
        .upload(path, file, { upsert: true });
    if (error) {
        console.error('Upload error', error);
        return null;
    }
    const { data: urlData } = supabaseClient.storage
        .from('handyman-files')
        .getPublicUrl(path);
    return urlData.publicUrl;
}

// ---------- Notifications (simple polling) ----------
async function loadNotifications() {
    if (!currentUser || !supabaseClient) return;
    // Basic implementation – can be expanded later
}

// ---------- DOM ready ----------
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
    injectLanguageSwitcher();
    applyLanguage(getCurrentLang());
    checkAuth();

    // Mobile menu
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('open');
        });
    }
});

// Expose needed functions globally
window.t = t;
window.setLanguage = setLanguage;
window.applyLanguage = applyLanguage;
window.checkAuth = checkAuth;
window.isAdmin = isAdmin;
window.updateAuthUI = updateAuthUI;
window.uploadFile = uploadFile;
window.supabaseClient = supabaseClient;
window.currentUser = currentUser;
window.CAMEROON_TOWNS = CAMEROON_TOWNS;
window.FALLBACK_CATEGORIES = FALLBACK_CATEGORIES;
