// ============================================
// RAYLIZIIE NIME - Main JavaScript (consumet API + Player)
// API: https://api.consumet.org/anime/gogoanime
// ============================================

const API_BASE = 'https://api.consumet.org/anime/gogoanime';

// State
let currentPage = 'home';
let currentPageNum = 1;
let currentQuery = '';
let currentAnimeId = '';
let currentEpisodes = [];

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

async function fetchConsumet(endpoint) {
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
    if (!data || !data.results) {
        showError('Data tidak valid dari server.');
        return;
    }

    const animeList = data.results;
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
        const id = anime.id || '';
        const titleText = anime.title || 'Tanpa Judul';
        const image = anime.image || 'https://via.placeholder.com/300x450/1A1735/6C2BD9?text=No+Image';
        const episode = anime.episodeId || anime.episodes || '-';
        const type = anime.type || 'TV';

        html += `
            <div class="anime-card" onclick="openDetail('${id}')">
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
            endpoint = `/top-airing?page=${pageNum}`;
            title = '🏠 Anime Populer';
            break;
        case 'ongoing':
            endpoint = `/top-airing?page=${pageNum}`;
            title = '🔥 Ongoing Anime';
            break;
        case 'complete':
            endpoint = `/top-airing?page=${pageNum}`; // consumet tidak punya completed, kita pakai top airing
            title = '✅ Completed Anime';
            break;
        case 'schedule':
            // consumet tidak punya schedule, kita pakai top airing
            endpoint = `/top-airing?page=${pageNum}`;
            title = '📅 Jadwal Rilis Anime';
            break;
        default:
            endpoint = `/top-airing?page=${pageNum}`;
            title = '🏠 Anime Populer';
    }

    const data = await fetchConsumet(endpoint);
    if (!data) return;

    renderAnimeGrid(data, title);
}

async function loadSearch(query) {
    if (!query.trim()) return;
    currentQuery = query;
    currentPage = 'search';

    mainContent.innerHTML = `<div class="loading">Mencari "${query}"...</div>`;

    const data = await fetchConsumet(`/search?keyw=${encodeURIComponent(query)}`);
    if (!data) return;

    const results = data.results || [];
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

// ============================================
// DETAIL ANIME + EPISODE LIST + PLAYER
// ============================================

async function openDetail(id) {
    if (!id) return;

    modalBody.innerHTML = `<div class="loading">Memuat detail...</div>`;
    modal.classList.add('show');

    const data = await fetchConsumet(`/info/${id}`);
    if (!data) {
        modalBody.innerHTML = `<p style="color:var(--text-gray);">Gagal memuat detail anime.</p>`;
        return;
    }

    const anime = data;
    const image = anime.image || 'https://via.placeholder.com/720x320/1A1735/6C2BD9?text=No+Image';
    const title = anime.title || 'Tanpa Judul';
    const genres = anime.genres?.join(', ') || '-';
    const status = anime.status || '-';
    const episodes = anime.episodes || [];
    const description = anime.description || 'Sinopsis tidak tersedia.';
    const releaseDate = anime.releaseDate || 'TBA';

    // Simpan episode list untuk diputar
    currentEpisodes = episodes;
    currentAnimeId = id;

    let html = `
        <img class="detail-cover" src="${image}" alt="${title}" onerror="this.src='https://via.placeholder.com/720x320/1A1735/6C2BD9?text=Error'"/>
        <h2 class="detail-title">${title}</h2>
        <div class="detail-meta">
            <span><strong>Genre:</strong> ${genres}</span>
            <span><strong>Status:</strong> ${status}</span>
            <span><strong>Rilis:</strong> ${releaseDate}</span>
            <span><strong>Total Episode:</strong> ${episodes.length}</span>
        </div>
        <div class="detail-sinopsis">${description}</div>

        <!-- PLAYER SECTION -->
        <div id="playerContainer" style="margin-top:20px;display:none;border-radius:12px;overflow:hidden;background:#000;aspect-ratio:16/9;">
            <iframe id="playerFrame" width="100%" height="100%" src="" frameborder="0" allowfullscreen></iframe>
        </div>

        <!-- EPISODE LIST -->
        <h3 style="margin:24px 0 12px;font-size:18px;display:flex;justify-content:space-between;align-items:center;">
            <span>📺 Daftar Episode</span>
            <span style="font-size:13px;color:var(--text-gray);font-weight:400;">Klik episode untuk menonton</span>
        </h3>
        <div class="detail-episodes" style="max-height:400px;overflow-y:auto;padding-right:8px;">
    `;

    if (episodes.length === 0) {
        html += `<p style="color:var(--text-gray);">Belum ada episode tersedia.</p>`;
    } else {
        // Tampilkan episode terbalik (episode terbaru di atas)
        const sortedEpisodes = [...episodes].reverse();
        sortedEpisodes.forEach(ep => {
            const epId = ep.id || '';
            const epNumber = ep.number || ep.episode || '-';
            const epTitle = ep.title || `Episode ${epNumber}`;
            html += `
                <div onclick="playEpisode('${epId}', '${epNumber}')" 
                     style="padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background 0.3s;border:1px solid rgba(255,255,255,0.04);"
                     onmouseover="this.style.background='rgba(108,43,217,0.2)'" 
                     onmouseout="this.style.background='rgba(255,255,255,0.04)'">
                    <span><strong>Episode ${epNumber}</strong> ${epTitle !== `Episode ${epNumber}` ? `- ${epTitle}` : ''}</span>
                    <span style="color:var(--secondary);font-weight:600;">▶ Play</span>
                </div>
            `;
        });
    }

    html += `</div>`;

    // Tambahkan tombol cari di Google sebagai backup
    html += `
        <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
            <a href="https://www.google.com/search?q=${encodeURIComponent(title + ' episode 1 subtitle indonesia')}" target="_blank" 
               style="flex:1;min-width:120px;background:rgba(108,43,217,0.15);color:var(--text-white);padding:10px 16px;border-radius:40px;text-decoration:none;font-weight:600;text-align:center;border:1px solid rgba(108,43,217,0.2);">
                🔍 Cari di Google
            </a>
            <button onclick="copyTitle('${title.replace(/'/g, "\\'")}')" 
                    style="flex:1;min-width:120px;background:rgba(255,255,255,0.04);color:var(--text-gray);padding:10px 16px;border-radius:40px;border:1px solid rgba(255,255,255,0.06);cursor:pointer;font-weight:600;">
                📋 Salin Judul
            </button>
        </div>
    `;

    modalBody.innerHTML = html;
}

// ============================================
// PLAY EPISODE (Embed Player)
// ============================================

async function playEpisode(episodeId, episodeNumber) {
    if (!episodeId) {
        alert('Episode ID tidak ditemukan.');
        return;
    }

    // Tampilkan loading di player
    const playerContainer = document.getElementById('playerContainer');
    const playerFrame = document.getElementById('playerFrame');
    if (playerContainer) {
        playerContainer.style.display = 'block';
        playerFrame.src = ''; // clear
        playerFrame.src = `https://www.google.com/search?q=${encodeURIComponent(currentAnimeId + ' episode ' + episodeNumber + ' streaming')}`;
        // Scroll ke player
        playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Coba dapatkan link streaming dari consumet
    try {
        const watchData = await fetchConsumet(`/watch/${episodeId}`);
        if (watchData && watchData.sources && watchData.sources.length > 0) {
            // Ambil source dengan kualitas tertinggi
            const sources = watchData.sources;
            const bestSource = sources.reduce((a, b) => {
                const qualityA = parseInt(a.quality) || 0;
                const qualityB = parseInt(b.quality) || 0;
                return qualityA > qualityB ? a : b;
            });
            const videoUrl = bestSource.url;
            if (videoUrl) {
                // Tampilkan video di iframe
                playerFrame.src = videoUrl;
                return;
            }
        }
        // Jika gagal, sudah ada fallback ke Google Search
    } catch (err) {
        console.warn('Gagal mengambil link streaming:', err);
        // Tetap di fallback
    }
}

// ============================================
// FUNGSI COPY TITLE
// ============================================

function copyTitle(title) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(title).then(() => {
            alert(`✅ Judul "${title}" berhasil disalin!`);
        }).catch(() => {
            fallbackCopy(title);
        });
    } else {
        fallbackCopy(title);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert(`✅ Judul "${text}" berhasil disalin!`);
    } catch (err) {
        alert(`❌ Gagal menyalin. Silakan salin manual: ${text}`);
    }
    document.body.removeChild(textarea);
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
    // Hentikan player
    const playerFrame = document.getElementById('playerFrame');
    if (playerFrame) playerFrame.src = '';
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        const playerFrame = document.getElementById('playerFrame');
        if (playerFrame) playerFrame.src = '';
    }
});

// ============================================
// INIT
// ============================================

document.querySelector('nav a[data-page="home"]')?.classList.add('active');
loadPage('home');
