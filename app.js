/**
 * Handy Man Cameroon — Core Application Logic
 * Clean stable version - 10 September 2026
 */

const CONFIG = (typeof window !== 'undefined' && window.HANDYMAN_CONFIG) ? window.HANDYMAN_CONFIG : {};
const SUPABASE_URL = CONFIG.SUPABASE_URL || '';
const SUPABASE_KEY = CONFIG.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[HandyMan] Missing Supabase configuration.');
}

var supabaseClient = null;
var currentUser = null;
var currentProfile = null;

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

// Simple translation
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
        all_towns: "All Towns"
    },
    fr: {
        nav_home: "Accueil",
        nav_workers: "Trouver des ouvriers",
        nav_jobs: "Trouver des emplois",
        nav_join: "Devenir ouvrier",
        nav_post: "Publier un emploi",
        nav_login: "Connexion",
        nav_logout: "Déconnexion",
        nav_profile: "Mon Profil",
        search: "Rechercher",
        loading: "Chargement...",
        view_profile: "Voir le profil",
        reviews: "avis",
        no_workers: "Aucun ouvrier trouvé.",
        workers_title: "Trouver des ouvriers au Cameroun",
        search_placeholder: "Rechercher par nom, compétence ou ville...",
        all_categories: "Toutes les catégories",
        all_towns: "Toutes les villes"
    }
};

function t(key) {
    var lang = localStorage.getItem('handyman_lang') || 'en';
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'fr') lang = 'en';
    localStorage.setItem('handyman_lang', lang);
    location.reload(); // simple and reliable
}

// ========== SUPABASE ==========
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
        if (SUPABASE_URL && SUPABASE_KEY) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            window.supabase = supabaseClient;
            console.log('[HandyMan] Supabase ready');
        }
    } catch (e) {
        console.error('[HandyMan] Supabase init error', e);
    }
}

// ========== AUTH ==========
async function checkAuth() {
    try {
        if (!supabaseClient) return;
        var res = await supabaseClient.auth.getUser();
        currentUser = res.data && res.data.user ? res.data.user : null;

        if (currentUser) {
            var p = await supabaseClient
                .from('profiles')
                .select('is_admin, full_name, phone, avatar_url, is_deleted')
                .eq('id', currentUser.id)
                .maybeSingle();
            currentProfile = p.data || null;

            if (currentProfile && currentProfile.is_deleted === true) {
                await supabaseClient.auth.signOut();
                currentUser = null;
                currentProfile = null;
                alert('This account has been deactivated.');
                window.location.href = 'login.html';
                return;
            }
        }
        updateAuthUI();
    } catch (e) {
        console.log('[HandyMan] Auth check skipped');
    }
}

function isAdmin() {
    return currentProfile && currentProfile.is_admin === true;
}

function updateAuthUI() {
    var authBtn = document.getElementById('authBtn');
    var dash = document.getElementById('navDashboard');

    if (authBtn) {
        if (currentUser) {
            authBtn.textContent = t('nav_logout');
            authBtn.onclick = async function (e) {
                e.preventDefault();
                await supabaseClient.auth.signOut();
                window.location.href = 'index.html';
            };
        } else {
            authBtn.textContent = t('nav_login');
            authBtn.onclick = null;
            authBtn.href = 'login.html';
        }
    }

    if (dash) {
        dash.style.display = currentUser ? 'inline-block' : 'none';
    }
}

// ========== FILE UPLOAD ==========
async function uploadFile(file, folder, userId) {
    if (!supabaseClient || !file) return null;
    try {
        var uid = userId || (currentUser && currentUser.id) || 'anonymous';
        var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        var fileName = Date.now() + '_' + Math.random().toString(36).substring(2, 9) + '.' + ext;
        var path = folder + '/' + uid + '/' + fileName;

        var up = await supabaseClient.storage
            .from('handyman-files')
            .upload(path, file, { cacheControl: '3600', upsert: false });

        if (up.error) {
            console.error(up.error);
            return null;
        }

        var urlData = supabaseClient.storage.from('handyman-files').getPublicUrl(path);
        return urlData.data && urlData.data.publicUrl ? urlData.data.publicUrl : null;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function uploadMultipleFiles(fileList, folder, userId, maxCount) {
    var urls = [];
    var files = Array.from(fileList || []).slice(0, maxCount || 2);
    for (var i = 0; i < files.length; i++) {
        if (files[i].type && files[i].type.startsWith('image/')) {
            var url = await uploadFile(files[i], folder, userId);
            if (url) urls.push(url);
        }
    }
    return urls;
}

// ========== NAV + LANGUAGE ==========
function injectNavExtras() {
    var nav = document.getElementById('nav');
    if (!nav || document.getElementById('navDashboard')) return;

    var dash = document.createElement('a');
    dash.href = 'dashboard.html';
    dash.className = 'btn-secondary';
    dash.id = 'navDashboard';
    dash.textContent = t('nav_profile');
    dash.style.display = 'none';

    var authBtn = nav.querySelector('#authBtn');
    if (authBtn) {
        nav.insertBefore(dash, authBtn);
    }
}

function injectLanguageSwitcher() {
    if (document.getElementById('langSwitch')) return;

    var div = document.createElement('div');
    div.id = 'langSwitch';
    div.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:999;background:#fff;border:1px solid #e2e8f0;border-radius:30px;padding:6px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:0.85rem;';
    div.innerHTML = '<button type="button" id="langEn" style="background:none;border:none;cursor:pointer;font-weight:600;padding:4px 10px;border-radius:20px;">EN</button>' +
                    '<button type="button" id="langFr" style="background:none;border:none;cursor:pointer;font-weight:600;padding:4px 10px;border-radius:20px;">FR</button>';
    document.body.appendChild(div);

    document.getElementById('langEn').onclick = function () { setLanguage('en'); };
    document.getElementById('langFr').onclick = function () { setLanguage('fr'); };

    var lang = localStorage.getItem('handyman_lang') || 'en';
    if (lang === 'en') document.getElementById('langEn').style.background = '#2563eb';
    if (lang === 'en') document.getElementById('langEn').style.color = '#fff';
    if (lang === 'fr') document.getElementById('langFr').style.background = '#2563eb';
    if (lang === 'fr') document.getElementById('langFr').style.color = '#fff';
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async function () {
    try {
        injectNavExtras();
        injectLanguageSwitcher();
        await checkAuth();

        // Menu toggle
        var menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function () {
                var n = document.getElementById('nav');
                if (n) n.classList.toggle('active');
            });
        }

        // Home page only
        if (document.getElementById('categoryGrid')) {
            // simple categories
            var grid = document.getElementById('categoryGrid');
            if (grid) {
                grid.innerHTML = FALLBACK_CATEGORIES.map(function (c) {
                    return '<div class="category-card" onclick="location.href=\'workers.html?category=' + encodeURIComponent(c.name) + '\'">' +
                           '<div class="category-icon">' + c.icon + '</div>' +
                           '<h3>' + c.name + '</h3>' +
                           '<p>' + c.description + '</p></div>';
                }).join('');
            }
        }
    } catch (err) {
        console.error('[HandyMan] Init error', err);
    }
});

// Expose
window.t = t;
window.setLanguage = setLanguage;
window.checkAuth = checkAuth;
window.isAdmin = isAdmin;
window.uploadFile = uploadFile;
window.uploadMultipleFiles = uploadMultipleFiles;
window.FALLBACK_CATEGORIES = FALLBACK_CATEGORIES;
window.CAMEROON_TOWNS = CAMEROON_TOWNS;
