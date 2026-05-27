// ── HELPERS ──────────────────────────────────────────────
function imgOrPlaceholder(src, alt, cls) {
  if (src) {
    return `<img src="${src}" alt="${alt}" />`;
  }
  const initials = alt.substring(0, 2).toUpperCase();
  return `<div class="${cls}-placeholder">${initials}</div>`;
}

// ── STATE ────────────────────────────────────────────────
let builds = [];
let activeId = null;
let activeFilter = 'all';

// ── LOAD DATA ────────────────────────────────────────────
async function loadBuilds() {
  try {
    const savedBuilds = localStorage.getItem('mc_builds');

    if (savedBuilds) {
      builds = JSON.parse(savedBuilds);
    } else {
      const response = await fetch('data/builds.json');

      if (!response.ok) {
        throw new Error('Gagal load builds.json');
      }

      builds = await response.json();
      localStorage.setItem('mc_builds', JSON.stringify(builds));
    }

    activeId = builds[0]?.id || null;
    renderSidebar();
    renderMain();

  } catch (error) {
    console.error('Error loading builds:', error);
    document.getElementById('mainContent').innerHTML = `
      <div class="section-title">Error</div>
      <p>Gagal memuat data build.</p>
    `;
  }
}

// ── SAVE ─────────────────────────────────────────────────
function save() {
  localStorage.setItem('mc_builds', JSON.stringify(builds));
}

// ── PROGRESS ─────────────────────────────────────────────
function calcProgress(build) {
  const total = build.materials.reduce((s, m) => s + m.dibutuhkan, 0);
  const collected = build.materials.reduce((s, m) => s + Math.min(m.terkumpul, m.dibutuhkan), 0);
  return total === 0 ? 0 : Math.round((collected / total) * 100);
}

// ── UPLOAD IMAGE ─────────────────────────────────────────
function handleImageUpload(buildId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;

    // Resize & convert ke base64 via canvas supaya hemat localStorage
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 256;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

        const base64 = canvas.toDataURL('image/webp', 0.85);
        const build = builds.find(b => b.id === buildId);
        if (build) {
          build.icon = base64;
          save();
          renderSidebar();
          renderMain();
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  input.click();
}

function handleImageRemove(buildId) {
  const build = builds.find(b => b.id === buildId);
  if (build) {
    build.icon = null;
    save();
    renderSidebar();
    renderMain();
  }
}

// ── SIDEBAR ───────────────────────────────────────────────
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

// ── MAIN CONTENT ──────────────────────────────────────────
function renderMain() {
  const build = builds.find(b => b.id === activeId);
  if (!build) return;

  const pct = calcProgress(build);
  const totalMat = build.materials.length;
  const doneMat = build.materials.filter(m => m.terkumpul >= m.dibutuhkan).length;

  const previewInner = build.icon
    ? `<img src="${build.icon}" alt="${build.nama}" />`
    : `<div class="img-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <rect x="3" y="3" width="18" height="18" rx="2"/>
           <circle cx="8.5" cy="8.5" r="1.5"/>
           <path d="M21 15l-5-5L5 21"/>
         </svg>
         <span>No Image</span>
       </div>`;

  const removeBtn = build.icon
    ? `<button class="btn-remove-img" id="btnRemoveImg" title="Hapus gambar">✕</button>`
    : '';

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
      <div class="preview-wrapper">
        <div class="preview-image">${previewInner}</div>
        <button class="btn-upload-img" id="btnUploadImg">&#128247; Ganti Gambar</button>
        ${removeBtn}
      </div>
      <div class="build-meta">
        <div class="build-title-row">
          <div class="build-title">${build.nama}</div>
          <button class="btn-edit-build" id="btnEditBuild" title="Edit Build">&#9998; Edit</button>
        </div>
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

  // Event: edit build
  document.getElementById('btnEditBuild').addEventListener('click', () => {
    EditBuild.open(build.id);
  });

  // Event: upload image
  document.getElementById('btnUploadImg').addEventListener('click', () => {
    handleImageUpload(build.id);
  });

  // Event: remove image
  const btnRemove = document.getElementById('btnRemoveImg');
  if (btnRemove) {
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      handleImageRemove(build.id);
    });
  }

  // Event: material checklist
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

// ── MODAL: PILIH METODE TAMBAH BUILD ─────────────────────
const modalChoose    = document.getElementById('modalChoose');
const btnAddBuild    = document.getElementById('btnAddBuild');

function openChooseModal() {
  modalChoose.classList.remove('hidden');
}

function closeChooseModal() {
  modalChoose.classList.add('hidden');
}

btnAddBuild.addEventListener('click', openChooseModal);
document.getElementById('modalChooseClose').addEventListener('click', closeChooseModal);

// Klik overlay untuk tutup
modalChoose.addEventListener('click', e => {
  if (e.target === modalChoose) closeChooseModal();
});

// Pilih: Input Manual
document.getElementById('chooseManual').addEventListener('click', () => {
  closeChooseModal();
  ManualAdd.open();
});

// Pilih: Import Schematic
document.getElementById('chooseSchematic').addEventListener('click', () => {
  closeChooseModal();
  SchematicImport.open();
});

// ── FILTER TABS ───────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderSidebar();
  });
});

// ── SEARCH ────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', renderSidebar);

// ── THEME TOGGLE ──────────────────────────────────────────
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

// ── INIT ──────────────────────────────────────────────────
loadBuilds();
