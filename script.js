// ============================================
// RAYLIZIIE NIME - Main JavaScript (FIXED)
// ============================================

// Gunakan base URL yang benar dari repository
// API: https://github.com/rakarmp/unofficial-otakudesu-api
const API_BASE = 'https://unofficial-otakudesu-api.vercel.app/api';

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
// API CALLS DENGAN ERROR HANDLING
// ============================================

async function fetchAPI(endpoint) {
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
        // Tampilkan error di UI
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
// RENDER FUNCTIONS (dengan validasi data)
// ============================================

function renderAnimeGrid(data, title = 'Anime') {
    // Validasi data
    if (!data) {
        showError('Data tidak valid dari server.');
        return;
    }

    // Cek struktur data (mungkin berbeda)
    let animeList = data.anime_list || data.data || data.results || [];
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
        // Ambil properti dengan fallback
        const id = anime.id || anime.slug || anime.anime_id || '';
        const titleText = anime.title || anime.judul || 'Tanpa Judul';
        const image = anime.thumbnail || anime.image || anime.cover || 'https://via.placeholder.com/300x450/1A1735/6C2BD9?text=No+Image';
        const episode = anime.episode || anime.latest_episode || anime.total_episode || '-';
        const type = anime.type || anime.genre || 'TV';

        html += `
            <div class="anime-card" data-id="${id}" onclick="openDetail('${id}')">
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
// LOAD FUNCTIONS (dengan endpoint yang benar)
// ============================================

async function loadPage(page = 'home', pageNum = 1) {
    currentPage = page;
    currentPageNum = pageNum;

    // Tampilkan loading
    mainContent.innerHTML = `<div class="loading">Memuat data...</div>`;

    let endpoint = '';
    let title = '';

    switch (page) {
        case 'home':
            endpoint = '/home';
            title = '🏠 Beranda';
            break;
        case 'ongoing':
            endpoint = '/ongoing';
            title = '🔥 Ongoing Anime';
            break;
        case 'complete':
            endpoint = `/complete/page/${pageNum}`;
            title = '✅ Completed Anime';
            break;
        case 'schedule':
            endpoint = '/schedule';
            title = '📅 Jadwal Rilis Anime';
            break;
        case 'search':
            // Search handled separately
            return;
        default:
            endpoint = '/home';
            title = '🏠 Beranda';
    }

    const data = await fetchAPI(endpoint);
    if (!data) {
        // Error sudah ditangani di fetchAPI
        return;
    }

    // Jika endpoint adalah schedule, tampilkan berbeda
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

    const data = await fetchAPI(`/search/${encodeURIComponent(query)}`);
    if (!data) return;

    // Cek apakah data memiliki hasil
    const results = data.anime_list || data.data || data.results || [];
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
    if (!data || !data.schedule) {
        mainContent.innerHTML = `<p style="color:var(--text-gray);">Tidak ada jadwal.</p>`;
        return;
    }

    let html = `<div class="section-title">📅 Jadwal Rilis Anime</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:12px;">`;

    const scheduleList = data.schedule || [];
    scheduleList.forEach(item => {
        const title = item.title || item.anime_title || 'Anime';
        const time = item.time || item.day || 'TBA';
        html += `
            <div style="background:var(--bg-card);padding:14px 20px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border:1px solid rgba(255,255,255,0.04);">
                <span style="font-weight:600;">${title}</span>
                <span style="color:var(--secondary);font-weight:600;font-size:14px;">${time}</span>
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

    const data = await fetchAPI(`/anime/${id}`);
    if (!data) {
        modalBody.innerHTML = `<p style="color:var(--text-gray);">Gagal memuat detail anime.</p>`;
        return;
    }

    const anime = data.anime || data;
    const image = anime.thumbnail || anime.image || 'https://via.placeholder.com/720x320/1A1735/6C2BD9?text=No+Image';

    let html = `
        <img class="detail-cover" src="${image}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/720x320/1A1735/6C2BD9?text=Error'"/>
        <h2 class="detail-title">${anime.title || 'Tanpa Judul'}</h2>
        <div class="detail-meta">
            <span><strong>Rating:</strong> ${anime.rating || 'N/A'}</span>
            <span><strong>Genre:</strong> ${anime.genres || '-'}</span>
            <span><strong>Status:</strong> ${anime.status || '-'}</span>
            <span><strong>Episode:</strong> ${anime.episode || anime.total_episode || '-'}</span>
        </div>
        <div class="detail-sinopsis">${anime.synopsis || anime.sinopsis || 'Sinopsis tidak tersedia.'}</div>
    `;

    if (anime.episode_list && anime.episode_list.length > 0) {
        html += `<h3 style="margin:20px 0 12px;font-size:18px;">📺 Daftar Episode</h3>`;
        html += `<div class="detail-episodes">`;
        anime.episode_list.forEach(ep => {
            const epNum = ep.episode || ep.number || '-';
            html += `
                <a href="#" onclick="event.preventDefault();alert('Streaming episode ${epNum} akan segera hadir.');">
                    <span>Episode ${epNum}</span>
                    <span class="eps-num">▶ Play</span>
                </a>
            `;
        });
        html += `</div>`;
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
            // Update active class
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
});

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        loadSearch(query);
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

modalClose.addEventListener('click', () => {
    modal.classList.remove('show');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// ============================================
// INIT - Load Home
// ============================================

// Set active home
document.querySelector('nav a[data-page="home"]')?.classList.add('active');
loadPage('home');
