// Helper: render img tag atau placeholder
function imgOrPlaceholder(src, alt, cls) {
  if (src) {
    return `<img src="${src}" alt="${alt}" />`;
  }
  // Ambil 2 huruf pertama dari nama sebagai placeholder
  const initials = alt.substring(0, 2).toUpperCase();
  return `<div class="${cls}-placeholder">${initials}</div>`;
}

// ── DATA ──────────────────────────────────────────────
// icon & mat.icon diisi path ke assets, contoh: "assets/builds/castle.png"
// Kalau kosong/null, otomatis tampil placeholder teks
const defaultBuilds = [
  {
    id: 1,
    nama: "Medieval Castle",
    kategori: "Megabuild",
    icon: null,           // ganti dengan: "assets/builds/castle.png"
    deskripsi: "Kastil megah gaya medieval dengan menara tinggi, jembatan gantung, dan ruang bawah tanah.",
    materials: [
      { nama: "Stone Brick",  dibutuhkan: 5000, terkumpul: 3200, icon: null },
      { nama: "Oak Log",      dibutuhkan: 800,  terkumpul: 800,  icon: null },
      { nama: "Glass Pane",   dibutuhkan: 400,  terkumpul: 150,  icon: null },
      { nama: "Lantern",      dibutuhkan: 120,  terkumpul: 80,   icon: null },
      { nama: "Iron Bar",     dibutuhkan: 300,  terkumpul: 50,   icon: null },
      { nama: "Cobblestone",  dibutuhkan: 2000, terkumpul: 2000, icon: null },
    ]
  },
  {
    id: 2,
    nama: "Auto Wheat Farm",
    kategori: "Farm",
    icon: null,
    deskripsi: "Farm gandum fully automatic menggunakan observer, piston, dan water flush system.",
    materials: [
      { nama: "Dirt",         dibutuhkan: 200, terkumpul: 200, icon: null },
      { nama: "Observer",     dibutuhkan: 64,  terkumpul: 30,  icon: null },
      { nama: "Piston",       dibutuhkan: 64,  terkumpul: 64,  icon: null },
      { nama: "Wheat Seed",   dibutuhkan: 200, terkumpul: 100, icon: null },
      { nama: "Hopper",       dibutuhkan: 32,  terkumpul: 10,  icon: null },
    ]
  },
  {
    id: 3,
    nama: "Item Sorting System",
    kategori: "Storage",
    icon: null,
    deskripsi: "Sistem sorting otomatis dengan chest besar, hopper chain, dan comparator untuk 30+ kategori item.",
    materials: [
      { nama: "Chest",        dibutuhkan: 120, terkumpul: 120, icon: null },
      { nama: "Hopper",       dibutuhkan: 240, terkumpul: 180, icon: null },
      { nama: "Comparator",   dibutuhkan: 80,  terkumpul: 40,  icon: null },
      { nama: "Redstone",     dibutuhkan: 500, terkumpul: 500, icon: null },
      { nama: "Smooth Stone", dibutuhkan: 300, terkumpul: 300, icon: null },
    ]
  },
  {
    id: 4,
    nama: "Japanese Garden",
    kategori: "Dekorasi",
    icon: null,
    deskripsi: "Taman gaya Jepang dengan jembatan kayu, batu stepping, lantern, dan kolam koi.",
    materials: [
      { nama: "Cherry Log",   dibutuhkan: 200, terkumpul: 50,  icon: null },
      { nama: "Bamboo",       dibutuhkan: 300, terkumpul: 300, icon: null },
      { nama: "Stone Slab",   dibutuhkan: 150, terkumpul: 80,  icon: null },
      { nama: "Lily Pad",     dibutuhkan: 40,  terkumpul: 10,  icon: null },
      { nama: "Lantern",      dibutuhkan: 30,  terkumpul: 5,   icon: null },
    ]
  },
];

// ── STATE ─────────────────────────────────────────────
let builds = JSON.parse(localStorage.getItem('mc_builds') || 'null') || defaultBuilds;
let activeId = builds[0].id;
let activeFilter = 'all';

function save() {
  localStorage.setItem('mc_builds', JSON.stringify(builds));
}

function calcProgress(build) {
  const total = build.materials.reduce((s, m) => s + m.dibutuhkan, 0);
  const collected = build.materials.reduce((s, m) => s + Math.min(m.terkumpul, m.dibutuhkan), 0);
  return total === 0 ? 0 : Math.round((collected / total) * 100);
}

// ── SIDEBAR ───────────────────────────────────────────
function renderSidebar() {
  const list = document.getElementById('buildList');
  const query = document.getElementById('searchInput').value.toLowerCase();

  const filtered = builds.filter(b => {
    const matchFilter = activeFilter === 'all' || b.kategori === activeFilter;
    const matchSearch = b.nama.toLowerCase().includes(query);
    return matchFilter && matchSearch;
  });

  list.innerHTML = filtered.map(b => {
    const pct = calcProgress(b);
    const iconHTML = b.icon
      ? `<img src="${b.icon}" alt="${b.nama}" />`
      : `<div class="icon-placeholder">${b.nama.substring(0,2).toUpperCase()}</div>`;
    return `
      <div class="build-item ${b.id === activeId ? 'active' : ''}" data-id="${b.id}">
        <div class="build-icon">${iconHTML}</div>
        <div class="build-item-info">
          <div class="build-item-name">${b.nama}</div>
          <div class="build-item-cat">${b.kategori}</div>
          <div class="progress-mini">
            <div class="progress-mini-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.build-item').forEach(el => {
    el.addEventListener('click', () => {
      activeId = +el.dataset.id;
      renderSidebar();
      renderMain();
    });
  });
}

// ── MAIN CONTENT ──────────────────────────────────────
function renderMain() {
  const build = builds.find(b => b.id === activeId);
  if (!build) return;

  const pct = calcProgress(build);
  const totalMat = build.materials.length;
  const doneMat = build.materials.filter(m => m.terkumpul >= m.dibutuhkan).length;

  const previewHTML = build.icon
    ? `<img src="${build.icon}" alt="${build.nama}" />`
    : `<div class="img-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <rect x="3" y="3" width="18" height="18" rx="2"/>
           <circle cx="8.5" cy="8.5" r="1.5"/>
           <path d="M21 15l-5-5L5 21"/>
         </svg>
         <span>No Image</span>
       </div>`;

  const matHTML = build.materials.map((m, i) => {
    const matPct = Math.min(100, Math.round((m.terkumpul / m.dibutuhkan) * 100));
    const done = m.terkumpul >= m.dibutuhkan;
    const matIconHTML = m.icon
      ? `<img src="${m.icon}" alt="${m.nama}" />`
      : `<div class="mat-icon-placeholder">${m.nama.substring(0,2).toUpperCase()}</div>`;
    return `
      <div class="material-card ${done ? 'done' : ''}" data-build="${build.id}" data-mat="${i}">
        <div class="mat-checkbox">${done ? '&#10003;' : ''}</div>
        <div class="mat-icon">${matIconHTML}</div>
        <div class="mat-info">
          <div class="mat-name">${m.nama}</div>
          <div class="mat-qty"><b>${m.terkumpul.toLocaleString()}</b> / ${m.dibutuhkan.toLocaleString()} unit</div>
        </div>
        <div class="mat-bar-wrap">
          <div class="mat-bar-track">
            <div class="mat-bar-fill" style="width:${matPct}%"></div>
          </div>
          <div class="mat-bar-pct">${matPct}%</div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('mainContent').innerHTML = `
    <div class="build-header">
      <div class="preview-image">${previewHTML}</div>
      <div class="build-meta">
        <div class="build-title">${build.nama}</div>
        <div class="build-category">${build.kategori}</div>
        <div class="build-desc">${build.deskripsi}</div>
        <div class="progress-container">
          <div class="progress-label">
            <span>Progress Keseluruhan</span>
            <span>${pct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Progress</div>
        <div class="stat-value">${pct}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Material</div>
        <div class="stat-value">${doneMat}/${totalMat}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Item</div>
        <div class="stat-value">${build.materials.reduce((s,m)=>s+m.dibutuhkan,0).toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Kategori</div>
        <div class="stat-value" style="font-size:.8rem;color:var(--accent2)">${build.kategori}</div>
      </div>
    </div>

    <div>
      <div class="section-title">Material Checklist</div>
      <div class="material-list">${matHTML}</div>
    </div>
  `;

  document.querySelectorAll('.material-card').forEach(card => {
    card.addEventListener('click', () => {
      const bId = +card.dataset.build;
      const mIdx = +card.dataset.mat;
      const b = builds.find(x => x.id === bId);
      const m = b.materials[mIdx];
      m.terkumpul = m.terkumpul >= m.dibutuhkan ? 0 : m.dibutuhkan;
      save();
      renderSidebar();
      renderMain();
    });
  });
}

// ── FILTER TABS ───────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderSidebar();
  });
});

// ── SEARCH ────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', renderSidebar);

// ── THEME TOGGLE ─────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('mc_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? 'Light' : 'Dark';

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  themeToggle.textContent = next === 'dark' ? 'Light' : 'Dark';
  localStorage.setItem('mc_theme', next);
});

// ── INIT ──────────────────────────────────────────────
renderSidebar();
renderMain();
