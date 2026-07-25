// ============================================
// RAYLIZIIE NIME - Main JavaScript (Jikan API)
// API: https://api.jikan.moe/v4
// ============================================

const API_BASE = 'https://api.jikan.moe/v4';

// State
let currentPage = 'home';
let currentPageNum = 1;
let currentQuery = '';

// DOM
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const modal = document.getElementById('detailModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const navLinks = document.querySelectorAll('nav a');

// ============================================
// API CALLS
// ============================================

async function fetchJikan(endpoint) {
    try {
        const url = `${API_BASE}${endpoint}`;
        console.log('🔍 Fetching:', url);
        
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        console.log('✅ Data received:', data);
        return data;
    } catch (err) {
        console.error('❌ API Error:', err.message);
        showError(`Gagal memuat data: ${err.message}`);
        return null;
    }
}

function showError(msg) {
    mainContent.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--text-gray);">
            <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
            <p style="font-size:18px;font-weight:600;color:var(--text-white);">${msg}</p>
            <p style="margin-top:8px;font-size:14px;">Coba refresh halaman atau periksa koneksi internet.</p>
            <button onclick="location.reload()" style="margin-top:20px;background:var(--primary);border:none;color:white;padding:10px 28px;border-radius:40px;font-weight:700;cursor:pointer;">🔄 Refresh</button>
        </div>
    `;
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderAnimeGrid(data, title = 'Anime') {
    if (!data || !data.data) {
        showError('Data tidak valid dari server.');
        return;
    }

    const animeList = data.data;
    if (!Array.isArray(animeList) || animeList.length === 0) {
        mainContent.innerHTML = `
            <div class="section-title">${title}</div>
            <p style="color: var(--text-gray); text-align: center; padding: 40px 0;">
                Tidak ada anime ditemukan.
            </p>
        `;
        return;
    }

    let html = `<div class="section-title">${title} <span>${animeList.length}</span></div>`;
    html += `<div class="anime-grid">`;

    animeList.forEach(anime => {
        const id = anime.mal_id || '';
        const titleText = anime.title || 'Tanpa Judul';
        const image = anime.images?.jpg?.image_url || anime.images?.webp?.image_url || 'https://via.placeholder.com/300x450/1A1735/6C2BD9?text=No+Image';
        const episode = anime.episodes || '-';
        const type = anime.type || 'TV';
        const rating = anime.rating || 'N/A';
        const synopsis = anime.synopsis || 'Sinopsis tidak tersedia.';
        const genres = anime.genres?.map(g => g.name).join(', ') || '-';
        const status = anime.status || '-';

        html += `
            <div class="anime-card" data-id="${id}" onclick="openDetail(${id})">
                <img src="${image}" alt="${titleText}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/1A1735/6C2BD9?text=Error'"/>
                <div class="info">
                    <h3>${titleText}</h3>
                    <div class="meta">
                        <span>${type}</span>
                        <span class="episode">Ep ${episode}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    mainContent.innerHTML = html;
}

// ============================================
// LOAD FUNCTIONS
// ============================================

async function loadPage(page = 'home', pageNum = 1) {
    currentPage = page;
    currentPageNum = pageNum;

    mainContent.innerHTML = `<div class="loading">Memuat data...</div>`;

    let endpoint = '';
    let title = '';

    switch (page) {
        case 'home':
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🏠 Anime Musim Ini';
            break;
        case 'ongoing':
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🔥 Ongoing Anime';
            break;
        case 'complete':
            // Untuk completed, kita ambil dari top anime dengan filter completed
            endpoint = `/top/anime?page=${pageNum}&limit=20&filter=airing`;
            title = '✅ Completed Anime';
            break;
        case 'schedule':
            // Jikan tidak punya endpoint schedule langsung, kita pakai top upcoming
            endpoint = `/seasons/upcoming?page=${pageNum}&limit=20`;
            title = '📅 Jadwal Rilis Anime';
            break;
        default:
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🏠 Anime Musim Ini';
    }

    const data = await fetchJikan(endpoint);
    if (!data) return;

    // Jika page = schedule, kita tampilkan sebagai jadwal
    if (page === 'schedule') {
        renderSchedule(data);
        return;
    }

    renderAnimeGrid(data, title);
}

async function loadSearch(query) {
    if (!query.trim()) return;
    currentQuery = query;
    currentPage = 'search';

    mainContent.innerHTML = `<div class="loading">Mencari "${query}"...</div>`;

    const data = await fetchJikan(`/anime?q=${encodeURIComponent(query)}&sfw=true&limit=20`);
    if (!data) return;

    const results = data.data || [];
    if (results.length === 0) {
        mainContent.innerHTML = `
            <div class="section-title">🔍 Hasil Pencarian: "${query}"</div>
            <p style="color: var(--text-gray); text-align: center; padding: 40px 0;">
                Tidak ada anime dengan judul "${query}".
            </p>
        `;
        return;
    }

    renderAnimeGrid(data, `🔍 Hasil Pencarian: "${query}"`);
}

function renderSchedule(data) {
    if (!data || !data.data || data.data.length === 0) {
        mainContent.innerHTML = `<p style="color:var(--text-gray);">Tidak ada jadwal.</p>`;
        return;
    }

    let html = `<div class="section-title">📅 Jadwal Rilis Anime</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:12px;">`;

    data.data.forEach(anime => {
        const title = anime.title || 'Anime';
        const date = anime.aired?.from ? new Date(anime.aired.from).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA';
        html += `
            <div style="background:var(--bg-card);padding:14px 20px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border:1px solid rgba(255,255,255,0.04);">
                <span style="font-weight:600;">${title}</span>
                <span style="color:var(--secondary);font-weight:600;font-size:14px;">${date}</span>
            </div>
        `;
    });

    html += `</div>`;
    mainContent.innerHTML = html;
}

// ============================================
// DETAIL ANIME
// ============================================

async function openDetail(id) {
    if (!id) return;

    modalBody.innerHTML = `<div class="loading">Memuat detail...</div>`;
    modal.classList.add('show');

    const data = await fetchJikan(`/anime/${id}`);
    if (!data || !data.data) {
        modalBody.innerHTML = `<p style="color:var(--text-gray);">Gagal memuat detail anime.</p>`;
        return;
    }

    const anime = data.data;
    const image = anime.images?.jpg?.image_url || anime.images?.webp?.image_url || 'https://via.placeholder.com/720x320/1A1735/6C2BD9?text=No+Image';
    const title = anime.title || 'Tanpa Judul';
    const rating = anime.rating || 'N/A';
    const genres = anime.genres?.map(g => g.name).join(', ') || '-';
    const status = anime.status || '-';
    const episodes = anime.episodes || '-';
    const synopsis = anime.synopsis || 'Sinopsis tidak tersedia.';
    const score = anime.score || 'N/A';
    const aired = anime.aired?.from ? new Date(anime.aired.from).toLocaleDateString('id-ID') : 'TBA';

    let html = `
        <img class="detail-cover" src="${image}" alt="${title}" onerror="this.src='https://via.placeholder.com/720x320/1A1735/6C2BD9?text=Error'"/>
        <h2 class="detail-title">${title}</h2>
        <div class="detail-meta">
            <span><strong>Rating:</strong> ${score}</span>
            <span><strong>Genre:</strong> ${genres}</span>
            <span><strong>Status:</strong> ${status}</span>
            <span><strong>Episode:</strong> ${episodes}</span>
            <span><strong>Rilis:</strong> ${aired}</span>
        </div>
        <div class="detail-sinopsis">${synopsis}</div>
    `;

    // Tampilkan trailer jika ada
    if (anime.trailer?.url) {
        html += `
            <div style="margin-top:16px;">
                <a href="${anime.trailer.url}" target="_blank" style="display:inline-block;background:var(--primary);color:white;padding:10px 24px;border-radius:40px;text-decoration:none;font-weight:700;">▶ Tonton Trailer</a>
            </div>
        `;
    }

    modalBody.innerHTML = html;
}

// ============================================
// EVENT LISTENERS
// ============================================

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) {
            loadPage(page);
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
});

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) loadSearch(query);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

modalClose.addEventListener('click', () => {
    modal.classList.remove('show');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

// ============================================
// INIT
// ============================================

document.querySelector('nav a[data-page="home"]')?.classList.add('active');
loadPage('home');
