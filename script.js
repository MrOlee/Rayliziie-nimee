// ============================================================
// RAYLIZIIE NIME - Main JavaScript
// API: https://api.jikan.moe/v4
// Tampilan seperti Otakudesu
// ============================================================

const API_BASE = 'https://api.jikan.moe/v4';

// State
let currentPage = 'home';
let currentPageNum = 1;
let currentAnimeId = null;
let currentAnimeTitle = '';
let currentEpisode = 1;
let currentSource = 'otakudesu';

// DOM
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const navLinks = document.querySelectorAll('.nav a');

// ============================================================
// API CALLS
// ============================================================

async function fetchJikan(endpoint) {
    try {
        const url = `${API_BASE}${endpoint}`;
        console.log('🔍 Fetching:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
            <p style="font-size:18px;font-weight:600;color:var(--text-white);">⚠️ ${msg}</p>
            <p style="margin-top:8px;font-size:14px;">Coba refresh halaman.</p>
            <button onclick="location.reload()" style="margin-top:16px;background:var(--primary);border:none;color:white;padding:10px 28px;border-radius:30px;font-weight:700;cursor:pointer;">🔄 Refresh</button>
        </div>
    `;
}

// ============================================================
// RENDER: HOME / GRID
// ============================================================

function renderAnimeGrid(data, title = 'Anime', subtitle = '') {
    if (!data || !data.data) {
        showError('Data tidak valid dari server.');
        return;
    }

    const animeList = data.data;
    if (!animeList || animeList.length === 0) {
        mainContent.innerHTML = `
            <div class="section-title">${title} <span>${subtitle}</span></div>
            <p style="color: var(--text-gray); text-align: center; padding: 40px 0;">Tidak ada anime ditemukan.</p>
        `;
        return;
    }

    let html = `<div class="section-title">${title} <span>${subtitle}</span></div>`;
    html += `<div class="anime-grid">`;

    animeList.forEach(anime => {
        const id = anime.mal_id || '';
        const titleText = anime.title || 'Tanpa Judul';
        const image = anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x450/1a1735/6c2bd9?text=No+Image';
        const episode = anime.episodes || '-';
        const type = anime.type || 'TV';

        html += `
            <div class="anime-card" onclick="loadDetail(${id})">
                <img src="${image}" alt="${titleText}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/1a1735/6c2bd9?text=Error'"/>
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

// ============================================================
// LOAD PAGE
// ============================================================

async function loadPage(page = 'home', pageNum = 1) {
    currentPage = page;
    currentPageNum = pageNum;

    mainContent.innerHTML = `<div class="loading">Memuat data...</div>`;

    let endpoint = '';
    let title = '';
    let subtitle = '';

    switch (page) {
        case 'home':
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🏠 HOME';
            subtitle = 'Anime Musim Ini';
            break;
        case 'ongoing':
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🔥 ON-GOING ANIME';
            subtitle = 'Anime yang sedang tayang';
            break;
        case 'complete':
            endpoint = `/top/anime?page=${pageNum}&limit=20&filter=airing`;
            title = '✅ COMPLETED ANIME';
            subtitle = 'Anime yang sudah selesai';
            break;
        case 'schedule':
            endpoint = `/seasons/upcoming?page=${pageNum}&limit=20`;
            title = '📅 JADWAL RILIS';
            subtitle = 'Anime yang akan datang';
            break;
        case 'genres':
            await loadGenres();
            return;
        default:
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🏠 HOME';
            subtitle = 'Anime Musim Ini';
    }

    const data = await fetchJikan(endpoint);
    if (!data) return;

    // Update active nav
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => {
        if (l.dataset.page === page) l.classList.add('active');
    });

    if (page === 'schedule') {
        renderSchedule(data, title, subtitle);
    } else {
        renderAnimeGrid(data, title, subtitle);
    }
}

// ============================================================
// SCHEDULE / JADWAL RILIS (Seperti di Otakudesu)
// ============================================================

function renderSchedule(data, title, subtitle) {
    if (!data || !data.data) {
        showError('Data tidak valid.');
        return;
    }

    const list = data.data;
    if (!list || list.length === 0) {
        mainContent.innerHTML = `
            <div class="section-title">${title} <span>${subtitle}</span></div>
            <p style="color: var(--text-gray); text-align: center; padding: 40px 0;">Tidak ada jadwal rilis.</p>
        `;
        return;
    }

    let html = `<div class="section-title">${title} <span>${subtitle}</span></div>`;
    html += `<div class="schedule-list">`;

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    list.slice(0, 20).forEach(anime => {
        const titleText = anime.title || 'Tanpa Judul';
        const date = anime.aired?.from ? new Date(anime.aired.from) : null;
        const dayName = date ? days[date.getDay()] : 'TBA';
        const dateStr = date ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';

        html += `
            <div class="schedule-item">
                <span class="title">${titleText}</span>
                <span>
                    <span class="day">★ ${dayName}</span>
                    <span class="date">${dateStr}</span>
                </span>
            </div>
        `;
    });

    html += `</div>`;

    // Widget "CEK ANIME ON-GOING LAINNYA" seperti di Otakudesu
    html += `
        <div style="margin-top:32px;border-top:1px solid var(--border);padding-top:24px;">
            <h3 style="font-size:16px;margin-bottom:14px;color:var(--secondary);">🔥 CEK ANIME ON-GOING LAINNYA</h3>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${list.slice(0, 6).map(anime => `
                    <button onclick="loadSearch('${anime.title}')" style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-white);padding:8px 18px;border-radius:30px;cursor:pointer;font-size:13px;transition:all 0.3s;"
                            onmouseover="this.style.background='rgba(108,43,217,0.2)'" onmouseout="this.style.background='var(--bg-card)'">
                        ${anime.title.length > 25 ? anime.title.slice(0, 25) + '...' : anime.title}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    mainContent.innerHTML = html;
}

// ============================================================
// GENRE LIST
// ============================================================

async function loadGenres() {
    mainContent.innerHTML = `<div class="loading">Memuat genre...</div>`;

    const data = await fetchJikan('/genres/anime');
    if (!data || !data.data) {
        showError('Gagal memuat genre.');
        return;
    }

    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => {
        if (l.dataset.page === 'genres') l.classList.add('active');
    });

    const genres = data.data.slice(0, 30);

    let html = `<div class="section-title">🎭 GENRE LIST <span>Pilih genre untuk mencari anime</span></div>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:10px;">`;

    genres.forEach(genre => {
        html += `
            <button onclick="loadSearchByGenre('${genre.name}', ${genre.mal_id})" 
                    style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-white);padding:10px 22px;border-radius:30px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(108,43,217,0.2)'" onmouseout="this.style.background='var(--bg-card)'">
                ${genre.name}
            </button>
        `;
    });

    html += `</div>`;
    mainContent.innerHTML = html;
}

// ============================================================
// SEARCH
// ============================================================

async function loadSearch(query) {
    if (!query.trim()) return;
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

async function loadSearchByGenre(genreName, genreId) {
    mainContent.innerHTML = `<div class="loading">Mencari genre "${genreName}"...</div>`;

    const data = await fetchJikan(`/anime?genres=${genreId}&sfw=true&limit=20`);
    if (!data) return;

    const results = data.data || [];
    if (results.length === 0) {
        mainContent.innerHTML = `
            <div class="section-title">🎭 Genre: ${genreName}</div>
            <p style="color: var(--text-gray); text-align: center; padding: 40px 0;">
                Tidak ada anime dengan genre "${genreName}".
            </p>
        `;
        return;
    }

    renderAnimeGrid(data, `🎭 Genre: ${genreName}`);
}

// ============================================================
// DETAIL ANIME (Seperti Otakudesu)
// ============================================================

async function loadDetail(id) {
    if (!id) return;

    currentAnimeId = id;
    mainContent.innerHTML = `<div class="loading">Memuat detail...</div>`;

    const data = await fetchJikan(`/anime/${id}`);
    if (!data || !data.data) {
        mainContent.innerHTML = `<p style="color:var(--text-gray);">Gagal memuat detail.</p>`;
        return;
    }

    const anime = data.data;
    currentAnimeTitle = anime.title || 'Tanpa Judul';

    const image = anime.images?.jpg?.image_url || 'https://via.placeholder.com/720x320/1a1735/6c2bd9?text=No+Image';
    const title = anime.title || 'Tanpa Judul';
    const titleJapanese = anime.title_japanese || '-';
    const score = anime.score || 'N/A';
    const genres = anime.genres?.map(g => g.name).join(', ') || '-';
    const status = anime.status || '-';
    const episodes = anime.episodes || 12;
    const duration = anime.duration || '-';
    const aired = anime.aired?.from ? new Date(anime.aired.from).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA';
    const studio = anime.studios?.map(s => s.name).join(', ') || '-';
    const synopsis = anime.synopsis || 'Sinopsis tidak tersedia.';

    const totalEp = Math.min(parseInt(episodes) || 12, 24);

    let html = `
        <div class="detail-page">
            <button class="back-btn" onclick="goBack()">← Kembali</button>

            <img class="detail-cover" src="${image}" alt="${title}" onerror="this.src='https://via.placeholder.com/720x320/1a1735/6c2bd9?text=Error'"/>

            <h1 class="detail-title">${title}</h1>
            <p style="color:var(--text-gray);font-size:14px;margin-bottom:8px;">${titleJapanese}</p>

            <div class="detail-meta">
                <span><strong>⭐ Skor:</strong> ${score}</span>
                <span><strong>🎭 Genre:</strong> ${genres}</span>
                <span><strong>📈 Status:</strong> ${status}</span>
                <span><strong>📺 Total Episode:</strong> ${episodes}</span>
                <span><strong>⏱ Durasi:</strong> ${duration}</span>
                <span><strong>📅 Rilis:</strong> ${aired}</span>
                <span><strong>🏢 Studio:</strong> ${studio}</span>
            </div>

            <div class="detail-sinopsis">${synopsis}</div>

            <div class="episode-section">
                <h3>📺 Daftar Episode</h3>
                <div class="episode-grid">
    `;

    for (let i = 1; i <= totalEp; i++) {
        html += `
            <button class="episode-btn" onclick="loadPlayer(${id}, ${i})">
                Episode ${i}
                <span class="eps-num">▶ Putar</span>
            </button>
        `;
    }

    html += `
                </div>
            </div>
        </div>
    `;

    mainContent.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// PLAYER STREAMING (Embed)
// ============================================================

function loadPlayer(animeId, episode) {
    currentAnimeId = animeId;
    currentEpisode = episode;

    const title = currentAnimeTitle || 'Anime';
    const searchQuery = encodeURIComponent(`${title} episode ${episode} subtitle indonesia`);

    let embedUrl = '';

    switch (currentSource) {
        case 'otakudesu':
            embedUrl = `https://otakudesu.cloud/?s=${searchQuery}`;
            break;
        case 'anoboy':
            embedUrl = `https://anoboy.ch/?s=${searchQuery}`;
            break;
        case 'samehadaku':
            embedUrl = `https://samehadaku.vip/?s=${searchQuery}`;
            break;
        case 'kuramanime':
            embedUrl = `https://kuramanime.net/?s=${searchQuery}`;
            break;
        default:
            embedUrl = `https://www.google.com/search?q=${searchQuery}`;
    }

    let html = `
        <div class="player-page">
            <button class="back-btn" onclick="loadDetail(${animeId})">← Kembali ke Detail</button>

            <div class="player-container">
                <iframe src="${embedUrl}" allowfullscreen></iframe>
            </div>

            <div class="player-info">
                <h2>${title}</h2>
                <span class="ep-label">Episode ${episode}</span>
            </div>

            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                <button onclick="changeEpisode(-1)" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text-white);padding:6px 18px;border-radius:30px;cursor:pointer;font-weight:600;">◀ Prev</button>
                <button onclick="changeEpisode(1)" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text-white);padding:6px 18px;border-radius:30px;cursor:pointer;font-weight:600;">Next ▶</button>
            </div>

            <div class="source-selector">
                <button class="source-btn ${currentSource === 'otakudesu' ? 'active' : ''}" onclick="setSource('otakudesu')">Otakudesu</button>
                <button class="source-btn ${currentSource === 'anoboy' ? 'active' : ''}" onclick="setSource('anoboy')">Anoboy</button>
                <button class="source-btn ${currentSource === 'samehadaku' ? 'active' : ''}" onclick="setSource('samehadaku')">Samehadaku</button>
                <button class="source-btn ${currentSource === 'kuramanime' ? 'active' : ''}" onclick="setSource('kuramanime')">Kuramanime</button>
                <button class="source-btn ${currentSource === 'google' ? 'active' : ''}" onclick="setSource('google')">Google</button>
            </div>
            <p class="source-hint">💡 Pilih sumber streaming, lalu refresh player jika perlu.</p>
        </div>
    `;

    mainContent.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// FUNGSI BANTU
// ============================================================

function setSource(source) {
    currentSource = source;
    if (currentAnimeId && currentEpisode) {
        loadPlayer(currentAnimeId, currentEpisode);
    } else {
        // Update tampilan source saja
        document.querySelectorAll('.source-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().includes(source)) {
                btn.classList.add('active');
            }
        });
    }
}

function changeEpisode(delta) {
    const newEp = currentEpisode + delta;
    if (newEp < 1) return;
    if (currentAnimeId) {
        loadPlayer(currentAnimeId, newEp);
    }
}

function goBack() {
    if (currentAnimeId) {
        loadDetail(currentAnimeId);
    } else {
        loadPage('home');
    }
}

function goHome() {
    loadPage('home');
}

// ============================================================
// EVENT LISTENERS
// ============================================================

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) loadSearch(query);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// ============================================================
// INIT
// ============================================================

loadPage('home');
