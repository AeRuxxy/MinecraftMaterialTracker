const SchematicImport = (() => {

  const modal     = () => document.getElementById('modalSchematic');
  const body      = () => document.getElementById('modalSchematicBody');
  const btnImport = () => document.getElementById('modalSchematicImport');
  const btnCancel = () => document.getElementById('modalSchematicCancel');
  const btnClose  = () => document.getElementById('modalSchematicClose');

  function renderUI() {
    body().innerHTML = `
      <div class="wip-banner">
        <div class="wip-title">Fitur Dalam Pengembangan</div>
        <div class="wip-desc">
          Import Schematic sedang dalam proses pengerjaan.
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

  }

  function close() {
    modal().classList.add('hidden');
  }

  return { open };

})();
