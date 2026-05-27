// ═══════════════════════════════════════════════════════════
//  schematic-import.js
//  STATUS: 🚧 ON PROGRESS — fitur ini masih dalam pengembangan
//  Parser NBT masih memiliki bug pada beberapa format file.
//  Untuk sementara, modal ini menampilkan notifikasi status.
// ═══════════════════════════════════════════════════════════

const SchematicImport = (() => {

  const modal     = () => document.getElementById('modalSchematic');
  const body      = () => document.getElementById('modalSchematicBody');
  const btnImport = () => document.getElementById('modalSchematicImport');
  const btnCancel = () => document.getElementById('modalSchematicCancel');
  const btnClose  = () => document.getElementById('modalSchematicClose');

  function renderUI() {
    body().innerHTML = `
      <div class="wip-banner">
        <div class="wip-icon">🚧</div>
        <div class="wip-title">Fitur Dalam Pengembangan</div>
        <div class="wip-desc">
          Import Schematic sedang dalam proses pengerjaan.<br>
          Parser NBT masih mengalami error pada beberapa format file
          (.schematic terkompresi, .litematic, dll).
        </div>
        <div class="wip-progress-wrap">
          <div class="wip-progress-label">
            <span>Progress Pengembangan</span>
            <span class="wip-pct">60%</span>
          </div>
          <div class="wip-track">
            <div class="wip-fill" style="width: 60%"></div>
          </div>
        </div>
        <div class="wip-checklist">
          <div class="wip-check done">✓ &nbsp;UI drop zone & file reader</div>
          <div class="wip-check done">✓ &nbsp;NBT tag parser (basic)</div>
          <div class="wip-check done">✓ &nbsp;Sponge Schematic v2 palette</div>
          <div class="wip-check pending">⧖ &nbsp;Gzip decompressor (pako integration)</div>
          <div class="wip-check pending">⧖ &nbsp;Litematica .litematic support</div>
          <div class="wip-check pending">⧖ &nbsp;Error handling & fallback UI</div>
        </div>
        <div class="wip-note">
          Sementara gunakan <strong>Input Manual</strong> untuk menambah build.
        </div>
      </div>
    `;

    // Nonaktifkan tombol Import
    btnImport().disabled = true;
  }

  function open() {
    renderUI();
    modal().classList.remove('hidden');

    btnCancel().onclick = close;
    btnClose().onclick  = close;
    btnImport().onclick = null;

    // Klik overlay TIDAK menutup (konsisten dengan manual-add)
    // Hanya tombol X / Batal yang menutup
  }

  function close() {
    modal().classList.add('hidden');
  }

  return { open };

})();
