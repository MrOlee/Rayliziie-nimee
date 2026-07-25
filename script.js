// ============================================
// RAYLIZIIE NIME - Main JavaScript
// API Base: https://unofficial-otakudesu-api-ruang-kreatif.vercel.app/api
// ============================================

const API_BASE = 'https://unofficial-otakudesu-api-ruang-kreatif.vercel.app/api';

// State
let currentPage = 'home';
let currentPageNum = 1;
let currentQuery = '';
let currentGenreId = null;

// DOM Elements
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

async function fetchAPI(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        return null;
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderAnimeGrid(data, title = 'Anime') {
    if (!data || !data.anime_list || data.anime_list.length === 0) {
        mainContent.innerHTML = `
            <div class="section-title">${title}</div>
            <p style="color: var(--text-gray); text-align: center; padding: 40px 0;">
                Tidak ada anime ditemukan.
            </p>
        `;
        return;
    }

    const animeList = data.anime_list;
    const pagination = data.pagination || {};

    let html = `<div class="section-title">${title} <span>${animeList.length}</span></div>`;
    html += `<div class="anime-grid">`;

    animeList.forEach(anime => {
        const image = anime.thumbnail || anime.image || 'https://via.placeholder.com/300x450/1A1735/6C2BD9?text=No+Image';
        const episode = anime.episode || anime.latest_episode || '-';
        const id = anime.id || anime.slug || '';

        html += `
            <div class="anime-card" data-id="${id}" onclick="openDetail('${id}')">
                <img src="${image}" alt="${anime.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/1A1735/6C2BD9?text=Error'"/>
                <div class="info">
                    <h3>${anime.title}</h3>
                    <div class="meta">
                        <span>${anime.type || 'TV'}</span>
                        <span class="episode">Ep ${episode}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // Pagination
    if (pagination && pagination.total_pages > 1) {
        html += `<div class="pagination">`;
        const current = pagination.current_page || currentPageNum;
        const total = pagination.total_pages || 1;

        if (current > 1) {
            html += `<button onclick="loadPage(${current - 1})">‹ Prev</button>`;
        }

        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
            html += `<button onclick="loadPage(${i})" class="${i === current ? 'active-page' : ''}">${i}</button>`;
        }

        if (current < total) {
            html += `<button onclick="loadPage(${current + 1})">Next ›</button>`;
        }

        html += `</div>`;
    }

    mainContent.innerHTML = html;
}

function renderOngoing(data) {
    renderAnimeGrid(data, '🔥 Ongoing Anime');
}

function renderComplete(data) {
    renderAnimeGrid(data, '✅ Completed Anime');
}

function renderSchedule(data) {
    if (!data || !data.schedule) {
        mainContent.innerHTML = `<p style="color: var(--text-gray);">Tidak ada jadwal.</p>`;
        return;
    }

    let html = `<div class="section-title">📅 Jadwal Rilis Anime</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:12px;">`;

    data.schedule.forEach(item => {
        html += `
            <div style="background:var(--bg-card);padding:14px 20px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border:1px solid rgba(255,255,255,0.04);">
                <span style="font-weight:600;">${item.title || item.anime_title || 'Anime'}</span>
                <span style="color:var(--secondary);font-weight:600;font-size:14px;">${item.time || item.day || 'TBA'}</span>
            </div>
        `;
    });

    html += `</div>`;
    mainContent.innerHTML = html;
}

function renderSearch(query, data) {
    if (!data || !data.anime_list || data.anime_list.length === 0) {
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

// ============================================
// DETAIL ANIME (MODAL)
// ============================================

async function openDetail(id) {
    if (!id) return;

    modalBody.innerHTML = `
        <div class="loading">Memuat detail...</div>
    `;
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
        <h2 class="detail-title">${anime.title}</h2>
        <div class="detail-meta">
            <span><strong>Rating:</strong> ${anime.rating || 'N/A'}</span>
            <span><strong>Genre:</strong> ${anime.genres || '-'}</span>
            <span><strong>Status:</strong> ${anime.status || '-'}</span>
            <span><strong>Episode:</strong> ${anime.episode || anime.total_episode || '-'}</span>
        </div>
        <div class="detail-sinopsis">${anime.synopsis || anime.sinopsis || 'Sinopsis tidak tersedia.'}</div>
    `;

    // Daftar Episode (jika ada)
    if (anime.episode_list && anime.episode_list.length > 0) {
        html += `<h3 style="margin:20px 0 12px;font-size:18px;">📺 Daftar Episode</h3>`;
        html += `<div class="detail-episodes">`;
        anime.episode_list.forEach(ep => {
            const epId = ep.episode_id || ep.id || '';
            const epNum = ep.episode || ep.number || '-';
            html += `
                <a href="#" onclick="event.preventDefault();alert('Streaming untuk episode ${epNum} akan segera hadir.');">
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
// NAVIGATION & LOADING
// ============================================

async function loadPage(pageNum = 1) {
    currentPageNum = pageNum;

    if (currentPage === 'search' && currentQuery) {
        await loadSearch(currentQuery, pageNum);
        return;
    }

    if (currentPage === 'genre' && currentGenreId) {
        await loadGenre(currentGenreId, pageNum);
        return;
    }

    // Default: home, ongoing, complete, schedule
    const endpoints = {
        home: '/home',
        ongoing: '/ongoing',
        complete: `/complete/page/${pageNum}`,
        schedule: '/schedule'
    };

    const endpoint = endpoints[currentPage] || '/home';
    const data = await fetchAPI(endpoint);

    if (!data) {
        mainContent.innerHTML = `<p style="color:var(--text-gray);">Gagal memuat data.</p>`;
        return;
    }

    switch (currentPage) {
        case 'home':
            renderAnimeGrid(data, '🏠 Beranda');
            break;
        case 'ongoing':
            renderOngoing(data);
            break;
        case 'complete':
            renderComplete(data);
            break;
        case 'schedule':
            renderSchedule(data);
            break;
        default:
            renderAnimeGrid(data, 'Anime');
    }

    // Update active nav
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === currentPage);
    });
}

async function loadSearch(query, pageNum = 1) {
    currentQuery = query;
    currentPage = 'search';
    currentPageNum = pageNum;

    const data = await fetchAPI(`/search/${encodeURIComponent(query)}`);
    renderSearch(query, data);
}

async function loadGenre(genreId, pageNum = 1) {
    currentGenreId = genreId;
    currentPage = 'genre';
    currentPageNum = pageNum;

    const data = await fetchAPI(`/genres/${genreId}/page/${pageNum}`);
    if (data && data.anime_list) {
        renderAnimeGrid(data, `🎭 Genre: ${genreId}`);
    } else {
        mainContent.innerHTML = `<p style="color:var(--text-gray);">Gagal memuat genre.</p>`;
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

// Nav links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        currentPage = page;
        currentPageNum = 1;
        currentGenreId = null;
        currentQuery = '';
        searchInput.value = '';
        loadPage(1);
    });
});

// Search
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

// Modal close
modalClose.addEventListener('click', () => {
    modal.classList.remove('show');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// ============================================
// INIT
// ============================================

// Load home page on start
loadPage(1);
