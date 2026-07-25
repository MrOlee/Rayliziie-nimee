// ============================================================
// RAYLIZIIE NIME - Main JavaScript
// API: Jikan + Consumet (untuk link streaming)
// ============================================================

const JIKAN_API = 'https://api.jikan.moe/v4';
const CONSUMET_API = 'https://api.consumet.org/anime/gogoanime';

// State
let currentPage = 'home';
let currentPageNum = 1;
let currentAnimeId = null;
let currentAnimeTitle = '';
let currentEpisode = 1;
let currentEpisodeId = '';
let currentSource = 'gogoanime';

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
        const res = await fetch(`${JIKAN_API}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Jikan Error:', err);
        showError(`Gagal memuat data: ${err.message}`);
        return null;
    }
}

async function fetchConsumet(endpoint) {
    try {
        const res = await fetch(`${CONSUMET_API}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('Consumet Error:', err);
        return null;
    }
}

function showError(msg) {
    mainContent.innerHTML = `
        <div style="text-align:center;padding:50px 20px;color:var(--text-gray);">
            <p style="font-size:17px;font-weight:600;color:var(--text-white);">⚠️ ${msg}</p>
            <button onclick="location.reload()" style="margin-top:14px;background:var(--primary);border:none;color:white;padding:8px 24px;border-radius:30px;font-weight:700;cursor:pointer;">🔄 Refresh</button>
        </div>
    `;
}

// ============================================================
// RENDER GRID
// ============================================================

function renderAnimeGrid(data, title = 'Anime', subtitle = '') {
    if (!data || !data.data) {
        showError('Data tidak valid.');
        return;
    }

    const list = data.data;
    if (!list || list.length === 0) {
        mainContent.innerHTML = `
            <div class="section-title">${title} <span>${subtitle}</span></div>
            <p style="color:var(--text-gray);text-align:center;padding:40px 0;">Tidak ada anime ditemukan.</p>
        `;
        return;
    }

    let html = `<div class="section-title">${title} <span>${subtitle}</span></div>`;
    html += `<div class="anime-grid">`;

    list.forEach(anime => {
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

    let endpoint = '', title = '', subtitle = '';

    switch (page) {
        case 'home':
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🏠 HOME';
            subtitle = 'Anime Musim Ini';
            break;
        case 'ongoing':
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🔥 ON-GOING ANIME';
            subtitle = 'Anime sedang tayang';
            break;
        case 'complete':
            endpoint = `/top/anime?page=${pageNum}&limit=20&filter=airing`;
            title = '✅ COMPLETED ANIME';
            subtitle = 'Anime selesai';
            break;
        case 'schedule':
            endpoint = `/seasons/upcoming?page=${pageNum}&limit=20`;
            title = '📅 JADWAL RILIS';
            subtitle = 'Anime akan datang';
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

    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => { if (l.dataset.page === page) l.classList.add('active'); });

    if (page === 'schedule') {
        renderSchedule(data, title, subtitle);
    } else {
        renderAnimeGrid(data, title, subtitle);
    }
}

// ============================================================
// SCHEDULE
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
            <p style="color:var(--text-gray);text-align:center;padding:40px 0;">Tidak ada jadwal.</p>
        `;
        return;
    }

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    let html = `<div class="section-title">${title} <span>${subtitle}</span></div>`;
    html += `<div class="schedule-list">`;

    list.slice(0, 20).forEach(anime => {
        const date = anime.aired?.from ? new Date(anime.aired.from) : null;
        const dayName = date ? days[date.getDay()] : 'TBA';
        const dateStr = date ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';
        html += `
            <div class="schedule-item">
                <span class="title">${anime.title || 'Tanpa Judul'}</span>
                <span>
                    <span class="day">★ ${dayName}</span>
                    <span class="date">${dateStr}</span>
                </span>
            </div>
        `;
    });

    html += `</div>`;
    mainContent.innerHTML = html;
}

// ============================================================
// GENRE
// ============================================================

async function loadGenres() {
    mainContent.innerHTML = `<div class="loading">Memuat genre...</div>`;
    const data = await fetchJikan('/genres/anime');
    if (!data || !data.data) {
        showError('Gagal memuat genre.');
        return;
    }

    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => { if (l.dataset.page === 'genres') l.classList.add('active'); });

    let html = `<div class="section-title">🎭 GENRE LIST</div>`;
    html += `<div class="genre-grid">`;
    data.data.slice(0, 30).forEach(g => {
        html += `
            <button class="genre-btn" onclick="searchGenre('${g.name}', ${g.mal_id})">${g.name}</button>
        `;
    });
    html += `</div>`;
    mainContent.innerHTML = html;
}

async function searchGenre(name, id) {
    mainContent.innerHTML = `<div class="loading">Mencari genre "${name}"...</div>`;
    const data = await fetchJikan(`/anime?genres=${id}&sfw=true&limit=20`);
    if (!data) return;
    renderAnimeGrid(data, `🎭 Genre: ${name}`);
}

// ============================================================
// SEARCH
// ============================================================

async function loadSearch(query) {
    if (!query.trim()) return;
    mainContent.innerHTML = `<div class="loading">Mencari "${query}"...</div>`;
    const data = await fetchJikan(`/anime?q=${encodeURIComponent(query)}&sfw=true&limit=20`);
    if (!data) return;
    if (!data.data || data.data.length === 0) {
        mainContent.innerHTML = `
            <div class="section-title">🔍 Hasil: "${query}"</div>
            <p style="color:var(--text-gray);text-align:center;padding:40px 0;">Tidak ditemukan.</p>
        `;
        return;
    }
    renderAnimeGrid(data, `🔍 Hasil: "${query}"`);
}

// ============================================================
// DETAIL ANIME
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

    const totalEp = Math.min(parseInt(anime.episodes) || 12, 24);

    let html = `
        <div class="detail-page">
            <button class="back-btn" onclick="goBack()">← Kembali</button>
            <img class="detail-cover" src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/720x320/1a1735/6c2bd9?text=No+Image'}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/720x320/1a1735/6c2bd9?text=Error'"/>
            <h1 class="detail-title">${anime.title}</h1>
            <p style="color:var(--text-gray);font-size:13px;margin-bottom:6px;">${anime.title_japanese || '-'}</p>
            <div class="detail-meta">
                <span><strong>⭐ Skor:</strong> ${anime.score || 'N/A'}</span>
                <span><strong>🎭 Genre:</strong> ${anime.genres?.map(g => g.name).join(', ') || '-'}</span>
                <span><strong>📈 Status:</strong> ${anime.status || '-'}</span>
                <span><strong>📺 Episode:</strong> ${anime.episodes || '-'}</span>
                <span><strong>📅 Rilis:</strong> ${anime.aired?.from ? new Date(anime.aired.from).toLocaleDateString('id-ID') : 'TBA'}</span>
                <span><strong>🏢 Studio:</strong> ${anime.studios?.map(s => s.name).join(', ') || '-'}</span>
            </div>
            <div class="detail-sinopsis">${anime.synopsis || 'Sinopsis tidak tersedia.'}</div>
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
// PLAYER STREAMING - VIDEO LANGSUNG (Embed)
// ============================================================

async function loadPlayer(animeId, episode) {
    currentAnimeId = animeId;
    currentEpisode = episode;

    mainContent.innerHTML = `
        <div class="player-page">
            <button class="back-btn" onclick="loadDetail(${animeId})">← Kembali ke Detail</button>
            <div class="player-container">
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-gray);font-size:16px;">
                    ⏳ Mencari link streaming...
                </div>
            </div>
            <div class="player-info">
                <h2>${currentAnimeTitle}</h2>
                <span class="ep-label">Episode ${episode}</span>
            </div>
            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                <button onclick="changeEpisode(-1)" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text-white);padding:6px 18px;border-radius:30px;cursor:pointer;font-weight:600;">◀ Prev</button>
                <button onclick="changeEpisode(1)" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text-white);padding:6px 18px;border-radius:30px;cursor:pointer;font-weight:600;">Next ▶</button>
            </div>
            <div class="source-selector">
                <button class="source-btn active" onclick="setSource('gogoanime')">Gogoanime</button>
                <button class="source-btn" onclick="setSource('zoro')">Zoro</button>
                <button class="source-btn" onclick="setSource('otakudesu')">Otakudesu</button>
                <button class="source-btn" onclick="setSource('google')">Google</button>
            </div>
            <p class="source-hint">💡 Pilih sumber, video akan dimuat otomatis.</p>
        </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Cari link streaming
    await fetchAndPlay(animeId, episode);
}

// ============================================================
// FETCH & PLAY VIDEO
// ============================================================

async function fetchAndPlay(animeId, episode) {
    const playerContainer = document.querySelector('.player-container');
    if (!playerContainer) return;

    // Tampilkan loading
    playerContainer.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-gray);font-size:16px;">
            ⏳ Mencari link streaming...
        </div>
    `;

    let videoUrl = null;

    try {
        // 1. Coba cari di Gogoanime via consumet
        const searchResult = await fetchConsumet(`/search?keyw=${encodeURIComponent(currentAnimeTitle)}`);
        if (searchResult && searchResult.results && searchResult.results.length > 0) {
            const gogoId = searchResult.results[0].id;
            const info = await fetchConsumet(`/info/${gogoId}`);
            if (info && info.episodes) {
                // Cari episode berdasarkan nomor
                const epData = info.episodes.find(e => e.number == episode);
                if (epData && epData.id) {
                    currentEpisodeId = epData.id;
                    const watch = await fetchConsumet(`/watch/${epData.id}`);
                    if (watch && watch.sources && watch.sources.length > 0) {
                        // Ambil kualitas terbaik
                        const sorted = watch.sources.sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0));
                        videoUrl = sorted[0]?.url;
                    }
                }
            }
        }
    } catch (err) {
        console.warn('Gogoanime failed:', err);
    }

    // 2. Fallback: embed dari Zoro / Otakudesu
    if (!videoUrl) {
        const title = encodeURIComponent(currentAnimeTitle);
        const ep = episode;
        switch (currentSource) {
            case 'zoro':
                videoUrl = `https://zoro.to/embed?keyword=${title}+episode+${ep}`;
                break;
            case 'otakudesu':
                videoUrl = `https://otakudesu.cloud/?s=${title}+episode+${ep}`;
                break;
            case 'google':
                videoUrl = `https://www.google.com/search?q=${title}+episode+${ep}+subtitle+indonesia`;
                break;
            default:
                videoUrl = `https://gogoanime.llc/${currentAnimeTitle}-episode-${ep}`;
        }
    }

    // 3. Tampilkan video
    if (videoUrl) {
        // Jika URL mengandung .mp4, .m3u8, atau embed player, gunakan video/iframe
        if (videoUrl.includes('.mp4') || videoUrl.includes('.m3u8')) {
            playerContainer.innerHTML = `
                <video controls autoplay style="width:100%;height:100%;background:#000;">
                    <source src="${videoUrl}" type="video/mp4">
                    Browser tidak mendukung video tag.
                </video>
            `;
        } else {
            // Gunakan iframe untuk embed player
            playerContainer.innerHTML = `
                <iframe src="${videoUrl}" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>
            `;
        }
    } else {
        playerContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-gray);padding:20px;text-align:center;">
                <p style="font-size:16px;font-weight:600;color:var(--text-white);">⚠️ Link streaming tidak ditemukan</p>
                <p style="font-size:13px;margin-top:6px;">Coba ganti sumber streaming di bawah.</p>
                <button onclick="fetchAndPlay(${currentAnimeId}, ${currentEpisode})" style="margin-top:12px;background:var(--primary);border:none;color:white;padding:6px 20px;border-radius:30px;cursor:pointer;font-weight:600;">🔄 Coba Lagi</button>
            </div>
        `;
    }
}

// ============================================================
// FUNGSI BANTU
// ============================================================

function setSource(source) {
    currentSource = source;
    document.querySelectorAll('.source-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(source)) {
            btn.classList.add('active');
        }
    });
    // Refresh player dengan source baru
    if (currentAnimeId && currentEpisode) {
        fetchAndPlay(currentAnimeId, currentEpisode);
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
    const q = searchInput.value.trim();
    if (q) loadSearch(q);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// ============================================================
// INIT
// ============================================================

loadPage('home');
