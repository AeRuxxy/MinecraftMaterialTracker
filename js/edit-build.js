const EditBuild = (() => {

  const modal     = () => document.getElementById('modalEditBuild');
  const body      = () => document.getElementById('modalEditBuildBody');
  const btnSave   = () => document.getElementById('modalEditBuildSave');
  const btnCancel = () => document.getElementById('modalEditBuildCancel');
  const btnClose  = () => document.getElementById('modalEditBuildClose');
  const btnDelete = () => document.getElementById('modalEditBuildDelete');

  const KATEGORI = ['Megabuild', 'Farm', 'Storage', 'Dekorasi', 'Redstone', 'Lainnya'];

  let editingId = null;

  // ── Render form dengan data build yang ada ───────────────
  function renderForm(build) {
    body().innerHTML = `
      <div class="form-group">
        <label class="form-label">Nama Build *</label>
        <input
          class="form-input"
          id="ef-nama"
          type="text"
          placeholder="Nama build"
          maxlength="60"
          value="${escapeAttr(build.nama)}"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Kategori *</label>
        <select class="form-select" id="ef-kategori">
          ${KATEGORI.map(k =>
            `<option value="${k}" ${k === build.kategori ? 'selected' : ''}>${k}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea
          class="form-textarea"
          id="ef-deskripsi"
          placeholder="Deskripsi singkat..."
          rows="3"
        >${escapeHtml(build.deskripsi || '')}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Daftar Material *</label>
        <div class="mat-col-labels">
          <span>Nama Material</span>
          <span>Dibutuhkan</span>
          <span>Terkumpul</span>
          <span></span>
        </div>
        <div class="mat-rows" id="ef-mat-rows"></div>
        <button class="btn-add-mat" id="ef-add-row">+ Tambah Material</button>
      </div>

      <p id="ef-error" style="
        color: var(--danger);
        font-size: 0.75rem;
        margin-top: .5rem;
        display: none;
      "></p>
    `;

    // Isi baris material dari data build
    build.materials.forEach(m => addRow(m.nama, m.dibutuhkan, m.terkumpul));

    document.getElementById('ef-add-row').addEventListener('click', () => addRow());
  }

  // ── Tambah satu baris material ───────────────────────────
  function addRow(nama = '', dibutuhkan = '', terkumpul = 0) {
    const rows = document.getElementById('ef-mat-rows');
    const row  = document.createElement('div');
    row.className = 'mat-row';
    row.innerHTML = `
      <input class="form-input ef-mat-nama" type="text"   placeholder="Nama material" value="${escapeAttr(nama)}" />
      <input class="form-input ef-mat-need" type="number" placeholder="0" min="1"     value="${dibutuhkan}" />
      <input class="form-input ef-mat-have" type="number" placeholder="0" min="0"     value="${terkumpul}" />
      <button class="btn-mat-remove" title="Hapus baris">&#10005;</button>
    `;
    row.querySelector('.btn-mat-remove').addEventListener('click', () => row.remove());
    rows.appendChild(row);
  }

  // ── Baca & validasi form ─────────────────────────────────
  function collectForm() {
    const nama      = document.getElementById('ef-nama').value.trim();
    const kategori  = document.getElementById('ef-kategori').value;
    const deskripsi = document.getElementById('ef-deskripsi').value.trim();
    const matRows   = document.querySelectorAll('#ef-mat-rows .mat-row');

    const materials = [];
    let valid    = true;
    let errorMsg = '';

    if (!nama) {
      valid    = false;
      errorMsg = 'Nama build tidak boleh kosong.';
    }

    matRows.forEach(row => {
      const n = row.querySelector('.ef-mat-nama').value.trim();
      const d = parseInt(row.querySelector('.ef-mat-need').value, 10);
      const h = parseInt(row.querySelector('.ef-mat-have').value, 10) || 0;

      if (!n || isNaN(d) || d < 1) {
        valid    = false;
        errorMsg = errorMsg || 'Pastikan semua baris material memiliki nama dan jumlah dibutuhkan ≥ 1.';
        return;
      }
      materials.push({ nama: n, dibutuhkan: d, terkumpul: Math.min(h, d), icon: null });
    });

    if (materials.length === 0 && valid) {
      valid    = false;
      errorMsg = 'Tambahkan minimal 1 material.';
    }

    return { valid, errorMsg, nama, kategori, deskripsi, materials };
  }

  // ── Simpan perubahan ─────────────────────────────────────
  function saveEdit() {
    const { valid, errorMsg, nama, kategori, deskripsi, materials } = collectForm();
    const errEl = document.getElementById('ef-error');

    if (!valid) {
      errEl.textContent  = errorMsg;
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';

    const build = builds.find(b => b.id === editingId);
    if (!build) return;

    build.nama      = nama;
    build.kategori  = kategori;
    build.deskripsi = deskripsi;
    build.materials = materials;

    save();
    renderSidebar();
    renderMain();
    close();
  }

  // ── Hapus build ──────────────────────────────────────────
  function deleteBuild() {
    if (!confirm(`Hapus build "${builds.find(b => b.id === editingId)?.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    const idx = builds.findIndex(b => b.id === editingId);
    if (idx === -1) return;

    builds.splice(idx, 1);
    save();

    // Pindahkan activeId ke build pertama yang tersisa
    activeId = builds[0]?.id || null;

    renderSidebar();
    renderMain();
    close();
  }

  // ── Buka modal untuk build tertentu ─────────────────────
  function open(buildId) {
    const build = builds.find(b => b.id === buildId);
    if (!build) return;

    editingId = buildId;
    renderForm(build);
    modal().classList.remove('hidden');

    btnSave().onclick   = saveEdit;
    btnCancel().onclick = close;
    btnClose().onclick  = close;
    btnDelete().onclick = deleteBuild;

  }

  // ── Tutup modal ──────────────────────────────────────────
  function close() {
    modal().classList.add('hidden');
    editingId = null;
  }

  // ── Helpers ──────────────────────────────────────────────
  function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return { open };

})();
