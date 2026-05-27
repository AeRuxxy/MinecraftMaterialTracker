// ═══════════════════════════════════════════════════════════
//  schematic-import.js
//  Modul untuk import build dari file .schematic / .nbt.
//
//  Format .schematic (MCEdit/Sponge) adalah NBT binary.
//  Karena GitHub Pages tidak punya server, file di-parse
//  langsung di browser menggunakan pure JS NBT reader
//  (tidak ada library eksternal — implementasi minimal).
//
//  Bergantung pada: builds[], save(), renderSidebar(),
//                   renderMain(), activeId (dari script.js)
// ═══════════════════════════════════════════════════════════

const SchematicImport = (() => {

  // ── Referensi elemen ──────────────────────────────────
  const modal        = () => document.getElementById('modalSchematic');
  const body         = () => document.getElementById('modalSchematicBody');
  const btnImport    = () => document.getElementById('modalSchematicImport');
  const btnCancel    = () => document.getElementById('modalSchematicCancel');
  const btnClose     = () => document.getElementById('modalSchematicClose');

  // State lokal
  let parsedMaterials = [];
  let parsedFileName  = '';

  // ── Render UI ke dalam modal body ─────────────────────
  function renderUI() {
    body().innerHTML = `
      <div class="drop-zone" id="sc-dropzone">
        <div class="dz-icon">&#128196;</div>
        <div class="dz-label">Drag & drop file di sini</div>
        <div class="dz-sub">.schematic · .nbt · .litematic (MCEdit / WorldEdit / Litematica)</div>
      </div>

      <input type="file" id="sc-fileinput" accept=".schematic,.nbt,.litematic" style="display:none" />

      <div class="schematic-preview" id="sc-preview"></div>

      <div class="form-group">
        <label class="form-label">Nama Build *</label>
        <input
          class="form-input"
          id="sc-nama"
          type="text"
          placeholder="Nama untuk build ini..."
          maxlength="60"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Kategori</label>
        <select class="form-select" id="sc-kategori">
          <option value="Megabuild">Megabuild</option>
          <option value="Farm">Farm</option>
          <option value="Storage">Storage</option>
          <option value="Dekorasi">Dekorasi</option>
          <option value="Redstone">Redstone</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea
          class="form-textarea"
          id="sc-deskripsi"
          placeholder="Deskripsi singkat tentang build ini..."
          rows="2"
        ></textarea>
      </div>

      <p id="sc-error" style="
        color: var(--danger);
        font-size: 0.75rem;
        margin-top: .5rem;
        display: none;
      "></p>
    `;

    setupDropzone();
  }

  // ── Drag & drop / klik upload ──────────────────────────
  function setupDropzone() {
    const dz    = document.getElementById('sc-dropzone');
    const input = document.getElementById('sc-fileinput');

    dz.addEventListener('click', () => input.click());

    dz.addEventListener('dragover', e => {
      e.preventDefault();
      dz.classList.add('dragover');
    });

    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));

    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file) processFile(file);
    });
  }

  // ── Proses file ───────────────────────────────────────
  function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (!['schematic', 'nbt', 'litematic'].includes(ext)) {
      showError('Format file tidak didukung. Gunakan .schematic, .nbt, atau .litematic');
      return;
    }

    parsedFileName = file.name.replace(/\.[^.]+$/, '');

    // Isi nama build otomatis dari nama file
    const namaInput = document.getElementById('sc-nama');
    if (namaInput && !namaInput.value) {
      namaInput.value = parsedFileName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    const reader = new FileReader();
    reader.onload = e => {
      const buffer = e.target.result;
      try {
        parsedMaterials = parseNBT(new Uint8Array(buffer), ext);
        showPreview(file.name, parsedMaterials);
        btnImport().disabled = false;
      } catch (err) {
        showError('Gagal membaca file: ' + err.message);
        parsedMaterials = [];
        btnImport().disabled = true;
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ── NBT Parser (minimal, pure JS) ─────────────────────
  // Mendukung MCEdit .schematic (classic) & Sponge Schematic v2.
  // .litematic memiliki struktur serupa NBT.
  // Hanya membaca block palette & counts — tidak merender 3D.
  function parseNBT(bytes, ext) {
    // Coba decompress gzip (magic bytes 1f 8b)
    let data = bytes;
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      data = decompressGzip(bytes);
    }

    const nbt   = readNBTCompound(data, 0);
    const root  = nbt.value;

    // ── MCEdit Classic Schematic ──────────────────────────
    // Root keys: Width, Height, Length, Blocks, Data
    if ('Blocks' in root) {
      return parseMCEditSchematic(root);
    }

    // ── Sponge Schematic v2 / v3 ──────────────────────────
    // Root keys: Palette, BlockData, Width, Height, Length
    if ('Palette' in root) {
      return parseSpongeSchematic(root);
    }

    // ── Litematica .litematic ─────────────────────────────
    // Root key: Regions → each region has BlockStatePalette
    if ('Regions' in root) {
      return parseLitematic(root);
    }

    throw new Error('Struktur NBT tidak dikenali. Pastikan file adalah schematic yang valid.');
  }

  // ── MCEdit Schematic ───────────────────────────────────
  function parseMCEditSchematic(root) {
    const blockIds  = root['Blocks'].value;   // byte array
    const dataVals  = root['Data'].value;     // byte array

    const counts = {};
    for (let i = 0; i < blockIds.length; i++) {
      const id  = blockIds[i] & 0xFF;
      const dat = dataVals[i] & 0xFF;
      if (id === 0) continue; // air
      const key = `${id}:${dat}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => {
        const [id, dat] = key.split(':');
        return {
          nama:       legacyBlockName(+id, +dat),
          dibutuhkan: count,
          terkumpul:  0,
          icon:       null,
        };
      });
  }

  // ── Sponge Schematic ──────────────────────────────────
  function parseSpongeSchematic(root) {
    const palette   = root['Palette'].value;   // compound: name -> index
    const blockData = root['BlockData'].value; // int array or byte array (varint)

    // Baca varint list dari BlockData
    const indices = readVarIntArray(blockData);

    // Balik palette: index -> name
    const indexToName = {};
    for (const [name, tag] of Object.entries(palette)) {
      indexToName[tag.value] = name;
    }

    const counts = {};
    for (const idx of indices) {
      const name = indexToName[idx] || `unknown:${idx}`;
      if (name === 'minecraft:air' || name === 'minecraft:cave_air' || name === 'minecraft:void_air') continue;
      counts[name] = (counts[name] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        nama:       formatBlockName(name),
        dibutuhkan: count,
        terkumpul:  0,
        icon:       null,
      }));
  }

  // ── Litematica ────────────────────────────────────────
  function parseLitematic(root) {
    const regions = root['Regions'].value;
    const allCounts = {};

    for (const regionTag of Object.values(regions)) {
      const region  = regionTag.value;
      const palette = region['BlockStatePalette']?.value || [];
      const states  = region['BlockStates']?.value || [];

      if (!palette.length || !states.length) continue;

      const bits   = Math.max(4, Math.ceil(Math.log2(palette.length)));
      const mask   = (1n << BigInt(bits)) - 1n;
      const packed = Array.from(states).map(BigInt);

      let bitPos = 0n;
      for (const long of packed) {
        let remaining = 64n;
        while (remaining >= BigInt(bits)) {
          const idx  = Number((long >> bitPos % 64n) & mask);
          const name = palette[idx]?.value?.Name?.value || 'minecraft:air';
          if (name !== 'minecraft:air') {
            allCounts[name] = (allCounts[name] || 0) + 1;
          }
          bitPos += BigInt(bits);
          remaining -= BigInt(bits);
        }
      }
    }

    return Object.entries(allCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        nama:       formatBlockName(name),
        dibutuhkan: count,
        terkumpul:  0,
        icon:       null,
      }));
  }

  // ── NBT reader ────────────────────────────────────────
  const TAG = {
    END: 0, BYTE: 1, SHORT: 2, INT: 3, LONG: 4,
    FLOAT: 5, DOUBLE: 6, BYTE_ARRAY: 7, STRING: 8,
    LIST: 9, COMPOUND: 10, INT_ARRAY: 11, LONG_ARRAY: 12,
  };

  function readNBTCompound(data, offset) {
    const view = new DataView(data.buffer || data);
    return readCompound(view, { pos: offset });
  }

  function readCompound(view, cursor) {
    const result = {};
    while (true) {
      const type = view.getUint8(cursor.pos++);
      if (type === TAG.END) break;
      const nameLen = view.getUint16(cursor.pos); cursor.pos += 2;
      cursor.pos += nameLen; // skip name string for root
      const tag = readTag(view, cursor, type);
      const name = readString(view, { pos: cursor.pos - tag._nameLen - 2 });
      result[name.value] = tag;
    }
    return { value: result };
  }

  function readTag(view, cursor, type) {
    switch (type) {
      case TAG.BYTE:       { const v = view.getInt8(cursor.pos++); return { type, value: v }; }
      case TAG.SHORT:      { const v = view.getInt16(cursor.pos); cursor.pos += 2; return { type, value: v }; }
      case TAG.INT:        { const v = view.getInt32(cursor.pos); cursor.pos += 4; return { type, value: v }; }
      case TAG.LONG:       { const hi = view.getInt32(cursor.pos); const lo = view.getUint32(cursor.pos+4); cursor.pos += 8; return { type, value: hi * 0x100000000 + lo }; }
      case TAG.FLOAT:      { const v = view.getFloat32(cursor.pos); cursor.pos += 4; return { type, value: v }; }
      case TAG.DOUBLE:     { const v = view.getFloat64(cursor.pos); cursor.pos += 8; return { type, value: v }; }
      case TAG.BYTE_ARRAY: { const len = view.getInt32(cursor.pos); cursor.pos += 4; const arr = new Int8Array(view.buffer, cursor.pos, len); cursor.pos += len; return { type, value: arr }; }
      case TAG.INT_ARRAY:  { const len = view.getInt32(cursor.pos); cursor.pos += 4; const arr = new Int32Array(view.buffer, cursor.pos, len); cursor.pos += len * 4; return { type, value: arr }; }
      case TAG.LONG_ARRAY: { const len = view.getInt32(cursor.pos); cursor.pos += 4; cursor.pos += len * 8; return { type, value: [] }; }
      case TAG.STRING:     { return readStringTag(view, cursor); }
      case TAG.LIST:       { return readListTag(view, cursor); }
      case TAG.COMPOUND:   { return readCompoundTag(view, cursor); }
      default: throw new Error(`Unknown NBT tag type: ${type}`);
    }
  }

  function readStringTag(view, cursor) {
    const len = view.getUint16(cursor.pos); cursor.pos += 2;
    const bytes = new Uint8Array(view.buffer, cursor.pos, len); cursor.pos += len;
    return { type: TAG.STRING, value: new TextDecoder().decode(bytes) };
  }

  function readListTag(view, cursor) {
    const elemType = view.getUint8(cursor.pos++);
    const len = view.getInt32(cursor.pos); cursor.pos += 4;
    const items = [];
    for (let i = 0; i < len; i++) {
      items.push(readTag(view, cursor, elemType));
    }
    return { type: TAG.LIST, value: items };
  }

  function readCompoundTag(view, cursor) {
    const obj = {};
    while (true) {
      const type = view.getUint8(cursor.pos++);
      if (type === TAG.END) break;
      const nameLen = view.getUint16(cursor.pos); cursor.pos += 2;
      const nameBytes = new Uint8Array(view.buffer, cursor.pos, nameLen); cursor.pos += nameLen;
      const name = new TextDecoder().decode(nameBytes);
      const tag  = readTag(view, cursor, type);
      obj[name]  = tag;
    }
    return { type: TAG.COMPOUND, value: obj };
  }

  function readString(view, cursor) {
    const len = view.getUint16(cursor.pos); cursor.pos += 2;
    const bytes = new Uint8Array(view.buffer, cursor.pos, len); cursor.pos += len;
    return { value: new TextDecoder().decode(bytes) };
  }

  // ── Gzip decompressor (via DecompressionStream API) ───
  // DecompressionStream tersedia di modern browser (Chrome 80+, FF 113+, Safari 16.4+)
  function decompressGzip(bytes) {
    // Sync workaround: gunakan pako bila tersedia, fallback ke raw parse
    // Karena kita tidak load pako, kita throw dan minta user pakai file uncompressed
    // Di production, tambahkan <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js">
    if (typeof pako !== 'undefined') {
      return pako.inflate(bytes);
    }
    // Fallback: coba tanpa decompress (some tools save uncompressed)
    throw new Error(
      'File terkompresi (gzip). Tambahkan library pako ke index.html:\n' +
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"><\/script>'
    );
  }

  // ── Varint reader (Sponge BlockData) ─────────────────
  function readVarIntArray(bytes) {
    const result = [];
    let i = 0;
    while (i < bytes.length) {
      let value = 0, shift = 0, b;
      do {
        b = bytes[i++] & 0xFF;
        value |= (b & 0x7F) << shift;
        shift += 7;
      } while (b & 0x80);
      result.push(value);
    }
    return result;
  }

  // ── Format nama blok ──────────────────────────────────
  function formatBlockName(namespacedId) {
    // "minecraft:oak_log" → "Oak Log"
    const name = namespacedId.includes(':')
      ? namespacedId.split(':')[1]
      : namespacedId;
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── Legacy block ID → nama (subset umum) ─────────────
  function legacyBlockName(id, dat) {
    const MAP = {
      1:  'Stone', 2: 'Grass Block', 3: 'Dirt', 4: 'Cobblestone',
      5:  'Oak Plank', 17: 'Oak Log', 18: 'Oak Leaves',
      20: 'Glass', 24: 'Sandstone', 35: 'Wool',
      41: 'Gold Block', 42: 'Iron Block', 45: 'Brick Block',
      47: 'Bookshelf', 53: 'Oak Stair', 54: 'Chest',
      58: 'Crafting Table', 61: 'Furnace',
      67: 'Cobblestone Stair', 73: 'Redstone Ore',
      80: 'Snow Block', 86: 'Pumpkin',
      89: 'Glowstone', 98: 'Stone Brick',
      102: 'Glass Pane', 103: 'Melon Block',
    };
    return MAP[id] || `Block ID ${id}:${dat}`;
  }

  // ── Tampilkan preview material ────────────────────────
  function showPreview(fileName, materials) {
    const dz = document.getElementById('sc-dropzone');
    dz.classList.add('has-file');
    dz.querySelector('.dz-label').textContent = fileName;
    dz.querySelector('.dz-sub').textContent   = `${materials.length} jenis blok ditemukan`;

    const preview = document.getElementById('sc-preview');
    const top5    = materials.slice(0, 5);

    preview.innerHTML = `
      <b>${materials.length} jenis material</b> berhasil dibaca:
      <br><br>
      ${top5.map(m =>
        `<span style="color:var(--text)">${m.nama}</span>
         <span style="float:right;color:var(--accent)">${m.dibutuhkan.toLocaleString()} blok</span>
         <br>`
      ).join('')}
      ${materials.length > 5
        ? `<span style="color:var(--muted);font-size:.65rem">...dan ${materials.length - 5} material lainnya</span>`
        : ''}
    `;
    preview.classList.add('visible');
    hideError();
  }

  // ── Error helper ──────────────────────────────────────
  function showError(msg) {
    const el = document.getElementById('sc-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

  function hideError() {
    const el = document.getElementById('sc-error');
    if (el) el.style.display = 'none';
  }

  // ── Import build ──────────────────────────────────────
  function importBuild() {
    const nama      = (document.getElementById('sc-nama')?.value || '').trim();
    const kategori  = document.getElementById('sc-kategori')?.value || 'Lainnya';
    const deskripsi = (document.getElementById('sc-deskripsi')?.value || '').trim();

    if (!nama) { showError('Nama build tidak boleh kosong.'); return; }
    if (!parsedMaterials.length) { showError('Belum ada material yang berhasil dibaca.'); return; }

    const newId = builds.length > 0
      ? Math.max(...builds.map(b => b.id)) + 1
      : 1;

    builds.push({ id: newId, nama, kategori, icon: null, deskripsi, materials: parsedMaterials });
    save();

    activeId = newId;
    renderSidebar();
    renderMain();
    close();
  }

  // ── Buka modal ────────────────────────────────────────
  function open() {
    parsedMaterials = [];
    parsedFileName  = '';

    renderUI();
    btnImport().disabled = true;
    modal().classList.remove('hidden');

    btnImport().onclick = importBuild;
    btnCancel().onclick = close;
    btnClose().onclick  = close;

    modal().addEventListener('click', onOverlayClick);
  }

  // ── Tutup modal ───────────────────────────────────────
  function close() {
    modal().classList.add('hidden');
    modal().removeEventListener('click', onOverlayClick);
  }

  function onOverlayClick(e) {
    if (e.target === modal()) close();
  }

  // ── Public API ────────────────────────────────────────
  return { open };

})();
