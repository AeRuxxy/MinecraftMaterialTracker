// ═══════════════════════════════════════════════════════════
//  manual-add.js
//  Modul untuk menambahkan build baru secara manual.
//  Bergantung pada: builds[], save(), renderSidebar(),
//                   renderMain(), activeId (dari script.js)
// ═══════════════════════════════════════════════════════════

const ManualAdd = (() => {

  // ── Referensi elemen ──────────────────────────────────
  const modal       = () => document.getElementById('modalManual');
  const body        = () => document.getElementById('modalManualBody');
  const btnSave     = () => document.getElementById('modalManualSave');
  const btnCancel   = () => document.getElementById('modalManualCancel');
  const btnClose    = () => document.getElementById('modalManualClose');

  const KATEGORI = ['Megabuild', 'Farm', 'Storage', 'Dekorasi', 'Redstone', 'Lainnya'];

  // ── Render form ke dalam modal body ───────────────────
  function renderForm() {
    body().innerHTML = `
      <div class="form-group">
        <label class="form-label">Nama Build *</label>
        <input
          class="form-input"
          id="mf-nama"
          type="text"
          placeholder="Contoh: Medieval Castle"
          maxlength="60"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Kategori *</label>
        <select class="form-select" id="mf-kategori">
          ${KATEGORI.map(k => `<option value="${k}">${k}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea
          class="form-textarea"
          id="mf-deskripsi"
          placeholder="Deskripsi singkat tentang build ini..."
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Daftar Material *</label>
        <div class="mat-col-labels">
          <span>Nama Material</span>
          <span>Dibutuhkan</span>
          <span>Terkumpul</span>
          <span></span>
        </div>
        <div class="mat-rows" id="mf-mat-rows"></div>
        <button class="btn-add-mat" id="mf-add-row">+ Tambah Material</button>
      </div>

      <p id="mf-error" style="
        color: var(--danger);
        font-size: 0.75rem;
        margin-top: .5rem;
        display: none;
      "></p>
    `;

    // Satu baris material default
    addRow();

    // Tombol tambah baris
    document.getElementById('mf-add-row').addEventListener('click', addRow);
  }

  // ── Tambah satu baris material ─────────────────────────
  function addRow(nama = '', dibutuhkan = '', terkumpul = 0) {
    const rows = document.getElementById('mf-mat-rows');
    const row  = document.createElement('div');
    row.className = 'mat-row';
    row.innerHTML = `
      <input class="form-input mf-mat-nama"   type="text"   placeholder="Nama material" value="${nama}" />
      <input class="form-input mf-mat-need"   type="number" placeholder="0" min="1" value="${dibutuhkan}" />
      <input class="form-input mf-mat-have"   type="number" placeholder="0" min="0" value="${terkumpul}" />
      <button class="btn-mat-remove" title="Hapus baris">&#10005;</button>
    `;

    // Hapus baris
    row.querySelector('.btn-mat-remove').addEventListener('click', () => {
      row.remove();
    });

    rows.appendChild(row);
  }

  // ── Baca & validasi form ───────────────────────────────
  function collectForm() {
    const nama      = document.getElementById('mf-nama').value.trim();
    const kategori  = document.getElementById('mf-kategori').value;
    const deskripsi = document.getElementById('mf-deskripsi').value.trim();

    const matRows   = document.querySelectorAll('#mf-mat-rows .mat-row');
    const materials = [];

    let valid = true;
    let errorMsg = '';

    if (!nama) {
      valid = false;
      errorMsg = 'Nama build tidak boleh kosong.';
    }

    matRows.forEach(row => {
      const n = row.querySelector('.mf-mat-nama').value.trim();
      const d = parseInt(row.querySelector('.mf-mat-need').value, 10);
      const h = parseInt(row.querySelector('.mf-mat-have').value, 10) || 0;

      if (!n || isNaN(d) || d < 1) {
        valid = false;
        errorMsg = errorMsg || 'Pastikan semua baris material memiliki nama dan jumlah dibutuhkan ≥ 1.';
        return;
      }

      materials.push({ nama: n, dibutuhkan: d, terkumpul: Math.min(h, d), icon: null });
    });

    if (materials.length === 0 && valid) {
      valid = false;
      errorMsg = 'Tambahkan minimal 1 material.';
    }

    return { valid, errorMsg, nama, kategori, deskripsi, materials };
  }

  // ── Simpan build baru ──────────────────────────────────
  function saveBuild() {
    const { valid, errorMsg, nama, kategori, deskripsi, materials } = collectForm();

    const errEl = document.getElementById('mf-error');

    if (!valid) {
      errEl.textContent = errorMsg;
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';

    const newId = builds.length > 0
      ? Math.max(...builds.map(b => b.id)) + 1
      : 1;

    const newBuild = { id: newId, nama, kategori, icon: null, deskripsi, materials };

    builds.push(newBuild);
    save();

    // Pindah aktif ke build baru
    activeId = newId;

    renderSidebar();
    renderMain();
    close();
  }

  // ── Buka modal ─────────────────────────────────────────
  function open() {
    renderForm();
    modal().classList.remove('hidden');

    btnSave().onclick   = saveBuild;
    btnCancel().onclick = close;
    btnClose().onclick  = close;

    // Klik di luar modal TIDAK menutup — cegah kehilangan input tidak sengaja.
    // Tutup hanya lewat tombol X atau Batal.
  }

  // ── Tutup modal ────────────────────────────────────────
  function close() {
    modal().classList.add('hidden');
  }

  // ── Public API ────────────────────────────────────────
  return { open, addRow };

})();
