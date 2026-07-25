// ============================================
// RAYLIZIIE NIME - Main JavaScript (FULL STREAMING)
// API: https://api.jikan.moe/v4 + consumet fallback
// ============================================

const API_BASE = 'https://api.jikan.moe/v4';
const CONSUMET_API = 'https://api.consumet.org/anime/gogoanime';

// State
let currentPage = 'home';
let currentPageNum = 1;
let currentQuery = '';
let currentAnimeTitle = '';
let currentAnimeId = '';

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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('❌ Jikan Error:', err.message);
        showError(`Gagal memuat data: ${err.message}`);
        return null;
    }
}

async function fetchConsumet(endpoint) {
    try {
        const url = `${CONSUMET_API}${endpoint}`;
        console.log('🔍 Fetching consumet:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('⚠️ Consumet API error:', err.message);
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
        const image = anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x450/1A1735/6C2BD9?text=No+Image';
        const episode = anime.episodes || '-';
        const type = anime.type || 'TV';

        html += `
            <div class="anime-card" onclick="openDetail(${id})">
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
            endpoint = `/top/anime?page=${pageNum}&limit=20&filter=airing`;
            title = '✅ Completed Anime';
            break;
        case 'schedule':
            endpoint = `/seasons/upcoming?page=${pageNum}&limit=20`;
            title = '📅 Jadwal Rilis Anime';
            break;
        default:
            endpoint = `/seasons/now?page=${pageNum}&limit=20`;
            title = '🏠 Anime Musim Ini';
    }

    const data = await fetchJikan(endpoint);
    if (!data) return;
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

// ============================================
// DETAIL ANIME + PLAYER STREAMING (FIXED)
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
    const image = anime.images?.jpg?.image_url || 'https://via.placeholder.com/720x320/1A1735/6C2BD9?text=No+Image';
    const title = anime.title || 'Tanpa Judul';
    const score = anime.score || 'N/A';
    const genres = anime.genres?.map(g => g.name).join(', ') || '-';
    const status = anime.status || '-';
    const episodes = anime.episodes || '-';
    const synopsis = anime.synopsis || 'Sinopsis tidak tersedia.';
    const aired = anime.aired?.from ? new Date(anime.aired.from).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA';

    currentAnimeTitle = title;
    currentAnimeId = id;

    let html = `
        <img class="detail-cover" src="${image}" alt="${title}" onerror="this.src='https://via.placeholder.com/720x320/1A1735/6C2BD9?text=Error'"/>
        <h2 class="detail-title">${title}</h2>
        <div class="detail-meta">
            <span><strong>⭐ Rating:</strong> ${score}</span>
            <span><strong>🎭 Genre:</strong> ${genres}</span>
            <span><strong>📌 Status:</strong> ${status}</span>
            <span><strong>📺 Episode:</strong> ${episodes}</span>
            <span><strong>📅 Rilis:</strong> ${aired}</span>
        </div>
        <div class="detail-sinopsis">${synopsis}</div>

        <!-- ============ PLAYER STREAMING ============ -->
        <div style="margin-top:24px;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
            <h3 style="font-size:16px;margin-bottom:12px;">🎬 Putar Episode</h3>
            
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
                <select id="episodeSelect" style="flex:1;min-width:120px;background:var(--bg-card);color:var(--text-white);padding:10px 16px;border-radius:40px;border:1px solid rgba(255,255,255,0.08);font-weight:600;cursor:pointer;">
                    ${Array.from({length: Math.min(12, parseInt(episodes) || 12)}, (_, i) => `
                        <option value="${i+1}">Episode ${i+1}</option>
                    `).join('')}
                </select>
                <button onclick="playStreaming()" style="background:var(--primary);color:white;padding:10px 24px;border-radius:40px;border:none;font-weight:700;cursor:pointer;">
                    ▶ Nonton
                </button>
            </div>

            <!-- Player Container -->
            <div id="playerContainer" style="border-radius:12px;overflow:hidden;background:#000;aspect-ratio:16/9;display:none;position:relative;">
                <iframe id="playerFrame" width="100%" height="100%" src="" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>
                <div id="playerLoading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:14px;display:none;">⏳ Memuat...</div>
            </div>

            <!-- Sumber Streaming -->
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                <button onclick="setStreamSource('otakudesu')" class="source-btn active" style="padding:6px 16px;border-radius:40px;background:rgba(108,43,217,0.25);border:1px solid var(--primary);color:var(--text-white);font-size:12px;cursor:pointer;font-weight:600;">Otakudesu</button>
                <button onclick="setStreamSource('anoboy')" class="source-btn" style="padding:6px 16px;border-radius:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:var(--text-gray);font-size:12px;cursor:pointer;font-weight:600;">Anoboy</button>
                <button onclick="setStreamSource('samehadaku')" class="source-btn" style="padding:6px 16px;border-radius:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:var(--text-gray);font-size:12px;cursor:pointer;font-weight:600;">Samehadaku</button>
                <button onclick="setStreamSource('kuramanime')" class="source-btn" style="padding:6px 16px;border-radius:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:var(--text-gray);font-size:12px;cursor:pointer;font-weight:600;">Kuramanime</button>
                <button onclick="setStreamSource('google')" class="source-btn" style="padding:6px 16px;border-radius:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:var(--text-gray);font-size:12px;cursor:pointer;font-weight:600;">Google</button>
            </div>
            <p style="font-size:11px;color:var(--text-gray);margin-top:8px;">💡 Pilih sumber streaming, lalu klik Nonton</p>
        </div>
    `;

    modalBody.innerHTML = html;
}

// ============================================
// STREAMING FUNCTIONS
// ============================================

let streamSource = 'otakudesu';

function setStreamSource(source) {
    streamSource = source;
    document.querySelectorAll('.source-btn').forEach(btn => {
        btn.style.background = 'rgba(255,255,255,0.04)';
        btn.style.border = '1px solid rgba(255,255,255,0.06)';
        btn.style.color = 'var(--text-gray)';
    });
    // Highlight yang dipilih
    document.querySelectorAll('.source-btn').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(source)) {
            btn.style.background = 'rgba(108,43,217,0.25)';
            btn.style.border = '1px solid var(--primary)';
            btn.style.color = 'var(--text-white)';
        }
    });
}

async function playStreaming() {
    const episodeSelect = document.getElementById('episodeSelect');
    const episode = episodeSelect ? episodeSelect.value : '1';
    const title = currentAnimeTitle || 'anime';
    
    const playerContainer = document.getElementById('playerContainer');
    const playerFrame = document.getElementById('playerFrame');
    const playerLoading = document.getElementById('playerLoading');
    
    if (!playerContainer || !playerFrame) return;

    // Tampilkan player dan loading
    playerContainer.style.display = 'block';
    if (playerLoading) playerLoading.style.display = 'block';
    playerFrame.src = '';

    // Coba dapatkan link dari consumet API terlebih dahulu
    try {
        // Cari ID episode di consumet (perlu search dulu)
        const searchResult = await fetchConsumet(`/search?keyw=${encodeURIComponent(title)}`);
        if (searchResult && searchResult.results && searchResult.results.length > 0) {
            const animeId = searchResult.results[0].id;
            // Ambil daftar episode
            const episodesData = await fetchConsumet(`/info/${animeId}`);
            if (episodesData && episodesData.episodes && episodesData.episodes.length > 0) {
                // Cari episode berdasarkan nomor
                const epData = episodesData.episodes.find(e => e.number == episode);
                if (epData && epData.id) {
                    const watchData = await fetchConsumet(`/watch/${epData.id}`);
                    if (watchData && watchData.sources && watchData.sources.length > 0) {
                        // Ambil source dengan kualitas terbaik
                        const bestSource = watchData.sources.reduce((a, b) => {
                            const qA = parseInt(a.quality) || 0;
                            const qB = parseInt(b.quality) || 0;
                            return qA > qB ? a : b;
                        });
                        if (bestSource && bestSource.url) {
                            playerFrame.src = bestSource.url;
                            if (playerLoading) playerLoading.style.display = 'none';
                            playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.warn('Consumet streaming failed:', err);
    }

    // FALLBACK: Gunakan embed iframe dari situs streaming
    const searchQuery = encodeURIComponent(`${title} episode ${episode} subtitle indonesia`);
    let streamUrl = '';

    switch(streamSource) {
        case 'otakudesu':
            streamUrl = `https://otakudesu.cloud/?s=${searchQuery}`;
            break;
        case 'anoboy':
            streamUrl = `https://anoboy.ch/?s=${searchQuery}`;
            break;
        case 'samehadaku':
            streamUrl = `https://samehadaku.vip/?s=${searchQuery}`;
            break;
        case 'kuramanime':
            streamUrl = `https://kuramanime.net/?s=${searchQuery}`;
            break;
        case 'google':
        default:
            streamUrl = `https://www.google.com/search?q=${searchQuery}`;
    }

    // Load di iframe
    playerFrame.src = streamUrl;
    if (playerLoading) playerLoading.style.display = 'none';
    playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================
// FUNGSI COPY TITLE
// ============================================

function copyTitle(title) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(title).then(() => {
            alert(`✅ Judul "${title}" berhasil disalin!`);
        }).catch(() => fallbackCopy(title));
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
    const frame = document.getElementById('playerFrame');
    if (frame) frame.src = '';
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        const frame = document.getElementById('playerFrame');
        if (frame) frame.src = '';
    }
});

// ============================================
// INIT
// ============================================

document.querySelector('nav a[data-page="home"]')?.classList.add('active');
loadPage('home');
