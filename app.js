// Sumber API terpercaya & stabil
const API_BASE = "https://api.consumet.org/aniwatch";

// Elemen DOM
const playerSection = document.getElementById('player-section');
const playerFrame = document.getElementById('player');
const animeTitle = document.getElementById('anime-title');
const animeSynopsis = document.getElementById('anime-synopsis');
const serversList = document.getElementById('servers-list');
const episodesList = document.getElementById('episodes-list');
const animeGrid = document.getElementById('anime-grid');

// Ambil daftar anime
async function loadAnimeList() {
  try {
    const res = await fetch(`${API_BASE}/popular`);
    const { results } = await res.json();
    animeGrid.innerHTML = '';
    results.forEach(anime => {
      const card = document.createElement('div');
      card.className = 'anime-card';
      card.innerHTML = `
        <img src="${anime.image}" alt="${anime.title}">
        <h3>${anime.title}</h3>
      `;
      card.addEventListener('click', () => loadAnimeDetail(anime.id, anime.title));
      animeGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Gagal ambil daftar:', err);
    animeGrid.innerHTML = `<p style="color:#aaa;">Gagal memuat daftar, coba lagi nanti.</p>`;
  }
}

// Muat detail & episode
async function loadAnimeDetail(animeId, title) {
  try {
    playerSection.style.display = 'block';
    animeTitle.textContent = title;
    animeSynopsis.textContent = 'Memuat data...';
    episodesList.innerHTML = '';
    serversList.innerHTML = '';

    const res = await fetch(`${API_BASE}/info?id=${animeId}`);
    const data = await res.json();
    animeSynopsis.textContent = data.description?.slice(0, 220) + '...' || 'Tidak ada deskripsi.';

    data.episodes.forEach(ep => {
      const btn = document.createElement('span');
      btn.className = 'ep-btn';
      btn.textContent = `Ep ${ep.number}`;
      btn.addEventListener('click', () => playEpisode(ep.id, btn));
      episodesList.appendChild(btn);
    });

    // Putar otomatis ep pertama
    if (data.episodes?.[0]) {
      setTimeout(() => playEpisode(data.episodes[0].id, episodesList.firstElementChild), 200);
    }

    window.scrollTo({ top: 280, behavior: 'smooth' });
  } catch (err) {
    console.error('Detail error:', err);
  }
}

// Putar episode
async function playEpisode(episodeId, btnEl) {
  try {
    document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
    btnEl?.classList.add('active');
    serversList.innerHTML = '<p>Memuat server...</p>';

    const res = await fetch(`${API_BASE}/watch?episodeId=${episodeId}`);
    const { servers } = await res.json();

    serversList.innerHTML = '<p>Pilih Server:</p>';
    servers.forEach((srv, i) => {
      const srvBtn = document.createElement('button');
      srvBtn.className = `server-btn ${i===0 ? 'active' : ''}`;
      srvBtn.textContent = srv.name;
      srvBtn.onclick = () => {
        document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
        srvBtn.classList.add('active');
        playerFrame.src = srv.url;
      };
      serversList.appendChild(srvBtn);
    });

    if (servers?.[0]?.url) playerFrame.src = servers[0].url;
  } catch (err) {
    console.error('Putar error:', err);
    serversList.innerHTML = `<p style="color:red;">Gagal memuat video, silakan coba server lain.</p>`;
  }
}

// Jalankan awal
loadAnimeList();
