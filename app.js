const SUPABASE_URL = 'https://zuhkhpdrxwfjcqnolmpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_foPRwQRlPGlWBKYqeBHg4A_WcajeKKI';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    
    if (document.getElementById('categoryGrid')) {
        await loadCategories();
    }
    if (document.getElementById('workerGrid')) {
        await loadFeaturedWorkers();
    }
    
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.getElementById('nav').classList.toggle('active');
        });
    }
});

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    updateAuthUI();
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    if (!authBtn) return;
    
    if (currentUser) {
        authBtn.textContent = 'Logout';
        authBtn.href = '#';
        authBtn.onclick = async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.reload();
        };
    } else {
        authBtn.textContent = 'Login';
        authBtn.href = 'login.html';
        authBtn.onclick = null;
    }
}

async function loadCategories() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    
    const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .limit(10);
    
    if (error || !categories) {
        const fallback = [
            {name: 'Plumbing', icon: '🔧', description: 'Leak repairs, installations'},
            {name: 'Electrical', icon: '⚡', description: 'Wiring, lighting, repairs'},
            {name: 'Cleaning', icon: '🧹', description: 'Home and office cleaning'},
            {name: 'Carpentry', icon: '🪚', description: 'Woodwork and furniture'},
            {name: 'Painting', icon: '🎨', description: 'Interior and exterior'},
            {name: 'Auto Mechanics', icon: '🚗', description: 'Car repairs'},
        ];
        renderCategories(fallback);
        return;
    }
    
    renderCategories(categories);
}

function renderCategories(categories) {
    const grid = document.getElementById('categoryGrid');
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
    
    const { data: workers, error } = await supabase
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
}

function renderWorkers(workers, container) {
    container.innerHTML = workers.map(w => `
        <div class="worker-card" onclick="viewWorker('${w.id}')">
            <div class="worker-avatar">
                <img src="${w.profiles?.avatar_url || 'https://via.placeholder.com/80'}" alt="${w.profiles?.full_name}">
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
