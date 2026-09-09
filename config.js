// config.js - COMPLETE - Handyman Cameroon v1.1 - SEO + Towns + Supabase
const SUPABASE_URL = 'https://zuhkhpdrxwfjcqnolmpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_foPRwQRlPGlWBKYqeBHg4A_WcajeKKI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ALL MAJOR TOWNS IN CAMEROON - ENGLISH + FRENCH SEARCHABLE
const CAMEROON_TOWNS = [
  "Buea", "Limbe", "Tiko", "Muyuka", "Bamusso",
  "Douala", "Bonaberi", "Bonapriso", "Akwa",
  "Yaounde", "Bastos", "Mendong", "Obili",
  "Bamenda", "Bambili", "Bali",
  "Bafoussam", "Dschang", "Foumban", "Mbouda", "Bafang",
  "Garoua", "Maroua", "Ngaoundere", "Bertoua", "Ebolowa", "Kribi",
  "Kumba", "Edéa", "Bafia", "Sangmelima", "Mbalmayo", "Kumbo"
];

const CATEGORIES = [
  "Plumber", "Electrician", "Cleaner", "Carpenter", "Painter", "Tiler", "Welder", "Gardener", "AC Technician", "Barber", "Hairdresser", "Mechanic", "Builder", "Mason", "Driver", "Cook", "Tailor", "Photographer"
];

// TRANSLATIONS FOR SEO + BILINGUAL
const TRANSLATIONS = {
  en: {
    title: "Find Trusted Plumbers, Electricians & Cleaners in Cameroon - HandyMan",
    subtitle: "Verified artisans in Buea, Douala, Yaounde, Bamenda, Limbe and all towns. Call or WhatsApp directly.",
    findWorker: "Find Worker", postJob: "Post a Job", myProfile: "My Profile", contactUs: "Contact Us",
    searchPlaceholder: "Search by name, skill, town...",
    allTowns: "All Towns", allCategories: "All Categories",
    reviews: "reviews", rating: "Rating"
  },
  fr: {
    title: "Trouvez Plombiers, Électriciens & Ménagères Vérifiés au Cameroun - HandyMan",
    subtitle: "Artisans vérifiés à Buea, Douala, Yaoundé, Bamenda, Limbe et partout. Appelez ou WhatsApp direct.",
    findWorker: "Trouver Artisan", postJob: "Publier un Travail", myProfile: "Mon Profil", contactUs: "Contactez-Nous",
    searchPlaceholder: "Chercher par nom, métier, ville...",
    allTowns: "Toutes les Villes", allCategories: "Toutes Catégories",
    reviews: "avis", rating: "Note"
  }
};

let currentLang = localStorage.getItem('hm_lang') || 'en';
function t(key) { return TRANSLATIONS[currentLang][key] || TRANSLATIONS['en'][key] || key; }

// Track visitor for admin stats
async function trackVisitor(page = window.location.pathname) {
  try { await supabaseClient.from('visitors').insert({ page: page, ip: 'web' }); } catch(e) {}
}
trackVisitor();
