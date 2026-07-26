// ============================================================
// RAYLIZIIE NIME - Main JavaScript
// API: Jikan (metadata) + Multiple Streaming API
// Streaming API: Consumet, Kuramanime, AniPub, 2Embed
// ============================================================

const JIKAN_API = 'https://api.jikan.moe/v4';

// Daftar API streaming dengan fallback
const STREAM_APIS = [
    {
        name: 'Consumet',
        base: 'https://api.consumet.org/anime/gogoanime',
        // akan diisi dinamis
    },
    {
        name: 'Kuramanime',
        base: 'https://kuramanime-api.vercel.app/api',
    },
    {
        name: 'AniPub',
        base: 'https://api.anipub.xyz',
    }
];

const EMBED_APIS = [
    {
        name: '2Embed',
        url: (id, ep) => `https://2embed.stream/embed/anime/${id}/1/${ep}`
    }
];

// State
let currentPage = 'home';
let currentPageNum = 1;
let currentAnimeId = null;
let currentAnimeTitle = '';
let currentEpisode = 1;
let currentEpisodeId = '';
let currentSources = [];
let currentQuality = 'default';
let currentSource = 'gogoanime';

// DOM
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const navLinks = document.querySelectorAll('.nav a');

// ============================================================
// API CALLS - JIKAN (Metadata)
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

async function fetchAPI(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('Fetch API error:', err);
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
// RENDER GRID, DETAIL, DLL (SAMA SEPERTI SEBELUMNYA)
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
// PLAYER - DENGAN MULTI API FALLBACK
// ============================================================

async function loadPlayer(animeId, episode) {
    currentAnimeId = animeId;
    currentEpisode = episode;
    currentSources = [];

    // Tampilkan player page
    mainContent.innerHTML = `
        <div class="player-page">
            <button class="back-btn" onclick="loadDetail(${animeId})">← Kembali ke Detail</button>
            <div class="player-container">
                <div class="loading-overlay" id="playerLoading">
                    ⏳ Mencari link video dari ${currentSource || 'Gogoanime'}...
                </div>
                <video id="videoPlayer" controls style="width:100%;height:100%;display:none;">
                    <source id="videoSource" src="">
                    Browser tidak mendukung video tag.
                </video>
            </div>

            <div class="quality-selector" id="qualitySelector">
                <button class="quality-btn active" data-quality="default" onclick="setQuality('default')">Auto</button>
            </div>

            <div class="player-info">
                <h2>${currentAnimeTitle}</h2>
                <span class="ep-label">Episode ${episode}</span>
            </div>

            <div class="nav-buttons">
                <button onclick="changeEpisode(-1)">◀ Prev</button>
                <button onclick="changeEpisode(1)">Next ▶</button>
            </div>

            <div class="source-selector">
                <button class="source-btn active" onclick="setSource('consumet')">Consumet</button>
                <button class="source-btn" onclick="setSource('kuramanime')">Kuramanime</button>
                <button class="source-btn" onclick="setSource('anipub')">AniPub</button>
                <button class="source-btn" onclick="setSource('2embed')">2Embed</button>
            </div>
            <p class="source-hint">💡 Pilih sumber, video akan dimuat otomatis.</p>
        </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Mulai fetch
    await fetchAndPlayVideo(animeId, episode);
}

// ============================================================
// FETCH VIDEO DARI MULTI API
// ============================================================

async function fetchAndPlayVideo(animeId, episode) {
    const loading = document.getElementById('playerLoading');
    const video = document.getElementById('videoPlayer');
    const source = document.getElementById('videoSource');
    const qualityContainer = document.getElementById('qualitySelector');

    if (!loading || !video || !source) return;

    loading.classList.remove('hidden');
    loading.textContent = '⏳ Mencari link video...';
    video.style.display = 'none';
    video.pause();

    let videoSources = [];

    // Coba semua streaming API sesuai urutan
    const apiAttempts = [
        { name: 'Consumet', fn: fetchFromConsumet },
        { name: 'Kuramanime', fn: fetchFromKuramanime },
        { name: 'AniPub', fn: fetchFromAniPub }
    ];

    for (const attempt of apiAttempts) {
        loading.textContent = `⏳ Mencoba ${attempt.name}...`;
        const result = await attempt.fn(animeId, episode);
        if (result && result.sources && result.sources.length > 0) {
            videoSources = result.sources;
            currentSource = attempt.name.toLowerCase();
            break;
        }
    }

    // Jika tidak ada sources dari API, coba embed
    if (videoSources.length === 0) {
        // Coba 2Embed
        const embedUrl = `https://2embed.stream/embed/anime/${animeId}/1/${episode}`;
        loading.classList.add('hidden');
        video.style.display = 'none';
        const container = document.querySelector('.player-container');
        if (container) {
            container.innerHTML = `
                <iframe src="${embedUrl}" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>
            `;
        }
        return;
    }

    // Tampilkan video player
    loading.classList.add('hidden');
    video.style.display = 'block';

    // Siapkan quality buttons
    let qualityHTML = `<button class="quality-btn active" data-quality="default" onclick="setQuality('default')">Auto</button>`;
    const uniqueQualities = [...new Set(videoSources.map(s => s.quality))];
    uniqueQualities.forEach(q => {
        if (q && q !== 'default') {
            qualityHTML += `<button class="quality-btn" data-quality="${q}" onclick="setQuality('${q}')">${q}</button>`;
        }
    });
    qualityContainer.innerHTML = qualityHTML;

    // Pilih kualitas terbaik (angka tertinggi)
    let selected = videoSources.reduce((a, b) => {
        const qA = parseInt(a.quality) || 0;
        const qB = parseInt(b.quality) || 0;
        return qA > qB ? a : b;
    });
    if (!selected) selected = videoSources[0];

    if (selected && selected.url) {
        source.src = selected.url;
        video.load();
        video.play().catch(() => console.warn('Autoplay blocked'));
    }
}

// ============================================================
// FUNGSI FETCH PER API
// ============================================================

// 1. CONSUMET API
async function fetchFromConsumet(animeId, episode) {
    try {
        const searchUrl = `https://api.consumet.org/anime/gogoanime/search?keyw=${encodeURIComponent(currentAnimeTitle)}`;
        const searchData = await fetchAPI(searchUrl);
        if (!searchData || !searchData.results || searchData.results.length === 0) return null;

        const gogoId = searchData.results[0].id;
        const info = await fetchAPI(`https://api.consumet.org/anime/gogoanime/info/${gogoId}`);
        if (!info || !info.episodes) return null;

        const epData = info.episodes.find(e => e.number == episode);
        if (!epData || !epData.id) return null;

        const watchData = await fetchAPI(`https://api.consumet.org/anime/gogoanime/watch/${epData.id}`);
        if (!watchData || !watchData.sources || watchData.sources.length === 0) return null;

        const sources = watchData.sources.map(s => ({
            url: s.url,
            quality: s.quality || 'default',
            isM3U8: s.url && s.url.includes('.m3u8')
        }));

        return { sources };
    } catch (err) {
        console.warn('Consumet error:', err);
        return null;
    }
}

// 2. KURAMANIME API
async function fetchFromKuramanime(animeId, episode) {
    try {
        // Kuramanime membutuhkan slug, kita buat slug dari judul
        const slug = currentAnimeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const url = `https://kuramanime-api.vercel.app/api/anime/${slug}/${episode}`;
        const data = await fetchAPI(url);
        if (!data || !data.servers || data.servers.length === 0) return null;

        // Ambil server pertama yang punya link video
        for (const server of data.servers) {
            if (server.url && (server.url.includes('.mp4') || server.url.includes('.m3u8'))) {
                return {
                    sources: [{
                        url: server.url,
                        quality: server.quality || 'default',
                        isM3U8: server.url.includes('.m3u8')
                    }]
                };
            }
        }
        return null;
    } catch (err) {
        console.warn('Kuramanime error:', err);
        return null;
    }
}

// 3. ANIPUB API
async function fetchFromAniPub(animeId, episode) {
    try {
        // AniPub butuh ID string, kita coba dengan judul
        const searchUrl = `https://api.anipub.xyz/api/search?q=${encodeURIComponent(currentAnimeTitle)}`;
        const searchData = await fetchAPI(searchUrl);
        if (!searchData || !searchData.data || searchData.data.length === 0) return null;

        const aniId = searchData.data[0].id;
        const watchUrl = `https://api.anipub.xyz/api/watch/${aniId}/${episode}`;
        const watchData = await fetchAPI(watchUrl);
        if (!watchData || !watchData.streaming || !watchData.streaming.url) return null;

        return {
            sources: [{
                url: watchData.streaming.url,
                quality: watchData.streaming.quality || 'default',
                isM3U8: watchData.streaming.url.includes('.m3u8')
            }]
        };
    } catch (err) {
        console.warn('AniPub error:', err);
        return null;
    }
}

// ============================================================
// SET QUALITY
// ============================================================

function setQuality(quality) {
    document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.quality === quality) {
            btn.classList.add('active');
        }
    });

    const video = document.getElementById('videoPlayer');
    const source = document.getElementById('videoSource');
    if (!video || !source) return;

    // Ambil sources dari global
    const allSources = window._currentSources || [];
    let selected = allSources.find(s => s.quality == quality);
    if (!selected && quality === 'default') {
        selected = allSources.reduce((a, b) => {
            const qA = parseInt(a.quality) || 0;
            const qB = parseInt(b.quality) || 0;
            return qA > qB ? a : b;
        });
    }
    if (!selected) selected = allSources[0];

    if (selected && selected.url) {
        source.src = selected.url;
        video.load();
        video.play().catch(() => console.warn('Autoplay blocked'));
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
    if (currentAnimeId && currentEpisode) {
        // Reload player dengan source baru
        fetchAndPlayVideo(currentAnimeId, currentEpisode);
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
