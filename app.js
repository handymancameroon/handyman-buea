// ============================================
// Handy Man - App Script (Timing Fixed)
// ============================================

const SUPABASE_URL = 'https://zuhkhpdrxwfjcqnolmpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_foPRwQRlPGlWBKYqeBHg4A_WcajeKKI';

// Create Supabase client IMMEDIATELY (before page finishes loading)
// This ensures it's ready before any dropdown scripts run
let supabaseClient = null;
if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.supabase = supabaseClient;
}

let currentUser = null;

// Fallback categories that show even if database fails
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

// Initialize UI when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check auth if Supabase is available
        if (supabaseClient) {
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                currentUser = user;
            } catch (e) {
                console.log('Auth check failed:', e.message);
            }
        }
        
        updateAuthUI();
        
        // Load page content
        if (document.getElementById('categoryGrid')) {
            await loadCategories();
        }
        if (document.getElementById('workerGrid')) {
            await loadFeaturedWorkers();
        }
        
        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.getElementById('nav').classList.toggle('active');
            });
        }
        
    } catch (err) {
        console.error('App initialization error:', err);
        renderCategories(FALLBACK_CATEGORIES);
    }
});

// Update login/logout button
function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    if (!authBtn) return;
    
    if (currentUser && supabaseClient) {
        authBtn.textContent = 'Logout';
        authBtn.href = '#';
        authBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                await supabaseClient.auth.signOut();
            } catch (e) {}
            window.location.reload();
        };
    } else {
        authBtn.textContent = 'Login';
        authBtn.href = 'login.html';
        authBtn.onclick = null;
    }
}

// Load categories from Supabase or use fallback
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
        
        if (error) {
            console.log('Database error:', error.message);
            renderCategories(FALLBACK_CATEGORIES);
            return;
        }
        
        if (categories && categories.length > 0) {
            renderCategories(categories);
        } else {
            renderCategories(FALLBACK_CATEGORIES);
        }
    } catch (err) {
        console.log('Failed to load categories:', err.message);
        renderCategories(FALLBACK_CATEGORIES);
    }
}

// Render category cards
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

// Load featured workers
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

// Render worker cards
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

// Search functions
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
