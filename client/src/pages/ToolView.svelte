<script>
  let { tool, onBack, onLogout } = $props();
  import { logout } from '../lib/auth.js';
  import { processFile } from '../lib/api.js';
  import PageViewer from '../components/PageViewer.svelte';
  import Organizer from '../components/Organizer.svelte';

  let files = $state([]);
  let dragOver = $state(false);
  let running = $state(false);
  let result = $state(null);
  let error = $state('');
  let fileInput;

  const configs = {
    merge: { label: 'Upload multiple PDFs to merge', accept: '.pdf', multiple: true, params: [] },
    split: { label: 'Upload a PDF to split', accept: '.pdf', multiple: false, display: 'grid', pageSelect: true, params: [{ key: 'mode', label: 'Split mode', options: ['split', 'extract', 'perpage'] }] },
    compress: { label: 'Upload a PDF to compress', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'mode', label: 'Compression mode', options: ['screen', 'ebook', 'printer', 'prepress'] }] },
    'pdf-to-jpg': { label: 'Upload a PDF to convert to images', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'dpi', label: 'Resolution (DPI)', type: 'range', min: 72, max: 300, step: 10 }] },
    'pdf-to-png': { label: 'Upload a PDF to convert to PNG', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'dpi', label: 'Resolution (DPI)', type: 'range', min: 72, max: 300, step: 10 }] },
    'delete-pages': { label: 'Upload a PDF, then click the pages to delete', accept: '.pdf', multiple: false, display: 'grid', pageSelect: true, params: [] },
    organize: { label: 'Drag pages to reorder; rotate, duplicate or delete per page', accept: '.pdf', multiple: false, display: 'organize', params: [] },
    'office-to-pdf': { label: 'Upload an Office file to convert to PDF', accept: '.docx,.xlsx,.pptx,.odt,.ods,.odp', multiple: false, params: [] },
    watermark: { label: 'Upload a PDF to watermark', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'text', label: 'Watermark text', placeholder: 'CONFIDENTIAL' }, { key: 'opacity', label: 'Opacity', type: 'range', min: 5, max: 100, step: 5, div: 100 }] },
    'number-pages': { label: 'Upload a PDF to number pages', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'position', label: 'Number position', type: 'position' }, { key: 'start', label: 'Start number', type: 'range', min: 1, max: 50, step: 1 }] },
    crop: { label: 'Upload a PDF to crop', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'margin', label: 'Crop % per side', type: 'range', min: 0, max: 40, step: 1 }] },
    'jpg-to-pdf': { label: 'Upload images to convert to PDF', accept: '.jpg,.jpeg,.png', multiple: true, params: [{ key: 'margin', label: 'Margin (points)', type: 'range', min: 0, max: 80, step: 5 }, { key: 'orientation', label: 'Orientation', options: ['auto', 'portrait', 'landscape'] }, { key: 'size', label: 'Page size', options: ['auto', 'a4', 'letter'] }] },
    'docx-to-pdf': { label: 'Upload a Word document to convert', accept: '.docx', multiple: false, params: [] },
    'pdf-to-docx': { label: 'Upload a PDF to convert to Word', accept: '.pdf', multiple: false, display: 'grid', params: [] },
    rotate: { label: 'Use the arrows to navigate, click Rotate on each page', accept: '.pdf', multiple: false, display: 'viewer', params: [] },
    unlock: { label: 'Upload a password-protected PDF', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'password', label: 'Document password', placeholder: 'Enter password' }] },
    protect: { label: 'Upload a PDF to protect', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'password', label: 'New password', placeholder: 'Set a password' }] },
    'pdf-to-text': { label: 'Upload a PDF to extract text', accept: '.pdf', multiple: false, display: 'grid', params: [] },
    'pdf-editor': { label: 'Upload a PDF to edit', accept: '.pdf', multiple: false, display: 'grid', params: [{ key: 'text', label: 'Text to add', placeholder: 'Enter annotation text' }] },
  };

  let cfg = configs[tool.id] || configs['merge'];
  let params = $state({});
  cfg.params.forEach((p) => { if (p.type === 'range' && params[p.key] === undefined) params[p.key] = p.min ?? 0; if (p.type === 'position' && params[p.key] === undefined) params[p.key] = 'bm'; });

  // Page preview + selection (Smallpdf-style thumbnails)
  let pageImages = $state([]);       // /api/pdf-to-png urls, one per page
  let selectedPages = $state([]);    // 1-based page numbers the user clicked (when grid pageSelect)
  let previewLoading = $state(false);
  let rotations = $state({});        // pageNum1based -> cumulative angle (rotate viewer)
  let rotateCur = $state(0);         // current page index in the rotate viewer
  let orgItems = $state([]);         // organize: [{src,rot}] final page list

  async function loadPreview() {
    pageImages = []; selectedPages = []; rotations = {}; rotateCur = 0; orgItems = [];
    if (!cfg.display || files.length !== 1) return;
    const ext = (files[0].name.split('.').pop() || '').toLowerCase();
    if (ext !== 'pdf') return;
    previewLoading = true;
    try {
      const fd = new FormData();
      fd.append('file', files[0]);
      fd.append('dpi', '144');
      const res = await processFile('/api/pdf-to-png', fd);
      pageImages = res.urls || [];
      if (tool.id === 'split' && pageImages.length) {
        parts = [pageImages.map((_, i) => i + 1)];
        curPart = 0;
      }
      if (tool.id === 'organize' && pageImages.length) {
        orgItems = pageImages.map((_, i) => ({ src: i + 1, rot: 0 }));
      }
    } catch (e) {
      pageImages = []; // preview is optional; tool still works
    } finally {
      previewLoading = false;
    }
  }
  function togglePage(p) {
    if (!cfg.pageSelect) return;
    selectedPages = selectedPages.includes(p)
      ? selectedPages.filter((x) => x !== p)
      : [...selectedPages, p].sort((a, b) => a - b);
  }

  function onDragOver(e) { e.preventDefault(); dragOver = true; }
  function onDragLeave() { dragOver = false; }
  function onDrop(e) {
    e.preventDefault(); dragOver = false;
    const dropped = [...e.dataTransfer.files];
    if (dropped.length) { files = dropped; loadPreview(); }
  }
  function onFilePick() { fileInput?.click(); }
  function onFileSelected(e) {
    const s = [...(e.target?.files || [])];
    if (s.length) { files = s; loadPreview(); }
  }
  function clearFiles() { files = []; result = null; error = ''; pageImages = []; selectedPages = []; rotations = {}; rotateCur = 0; parts = []; curPart = 0; dragIdx = null; orgItems = []; }

  // --- Merge: drag-drop to reorder the merged files (which file is first) ---
  let dragIdx = $state(null);
  function onDropOrder(i) {
    if (dragIdx === null || dragIdx === i) { dragIdx = null; return; }
    const arr = [...files];
    const [m] = arr.splice(dragIdx, 1);
    arr.splice(i, 0, m);
    files = arr;
    dragIdx = null;
  }
  // --- Split parts: group pages into custom parts (e.g. 2-page + 1-page) ---
  let parts = $state([]);        // array of arrays of 1-based page numbers
  let curPart = $state(0);
  function newPart() { parts = [...parts, []]; curPart = parts.length - 1; }
  function toggleToPart(p) {
    // remove p from every group, then add it to the current (open) group
    const without = parts.map((g) => g.filter((x) => x !== p));
    const open = without[curPart] && without[curPart].length ? without[curPart] : (without[curPart] || without[0] || []);
    open.push(p);
    open.sort((a, b) => a - b);
    parts = without;
    if (without[curPart] && !without[curPart].length) curPart = Math.min(curPart, without.length - 1);
  }
  function removePart(g) {
    if (parts.length <= 1) return;
    const rest = parts.filter((_, i) => i !== g);
    parts = rest; curPart = Math.min(curPart, rest.length - 1);
  }

  async function handleProcess() {
    if (!files.length) { error = 'Please select a file first'; return; }
    // Organize: send final page order + per-page rotation spec "src:rot,..."
    if (tool.id === 'organize') {
      if (!orgItems.length) { error = 'No pages to organize'; return; }
      running = true; error = ''; result = null;
      try {
        const fd = new FormData();
        for (const f of files) fd.append('file', f);
        fd.append('spec', orgItems.map((o) => `${o.src}:${o.rot || 0}`).join(','));
        const res = await processFile(`/api/${tool.id}`, fd);
        result = res;
      } catch (err) { error = err.message; }
      finally { running = false; }
      return;
    }
    // Split "parts" mode: send explicit page groups
    if (tool.id === 'split' && params.mode === 'parts') {
      const spec = parts.filter((g) => g.length).map((g) => g.join(',')).join(';');
      if (!spec) { error = 'Put at least one page in a part'; return; }
      running = true; error = ''; result = null;
      try {
        const fd = new FormData();
        for (const f of files) fd.append('file', f);
        fd.append('mode', 'parts');
        fd.append('parts', spec);
        const res = await processFile(`/api/${tool.id}`, fd);
        result = res;
      } catch (err) { error = err.message; }
      finally { running = false; }
      return;
    }
    // Rotate viewer: build per-page rotation spec "1:90,3:270" from the interactive viewer
    if (cfg.display === 'viewer') {
      const spec = Object.keys(rotations)
        .filter((k) => (rotations[k] || 0) % 360 !== 0)
        .map((k) => `${k}:${rotations[k]}`)
        .join(',');
      if (!spec) { error = 'Click ⟳ Rotate on at least one page first'; return; }
      running = true; error = ''; result = null;
      try {
        const fd = new FormData();
        for (const f of files) fd.append('file', f);
        fd.append('pages', spec);
        const res = await processFile(`/api/${tool.id}`, fd);
        result = res;
      } catch (err) { error = err.message; }
      finally { running = false; }
      return;
    }
    // Grid page selection drives the pages param
    if (cfg.pageSelect) {
      if (!selectedPages.length) {
        if (tool.id === 'delete-pages') { error = 'Click the page(s) you want to delete first'; return; }
      }
    }
    running = true; error = ''; result = null;
    try {
      const fd = new FormData();
      for (const f of files) fd.append('file', f);
      if (cfg.pageSelect && selectedPages.length) fd.append('pages', selectedPages.join(','));
      for (const p of cfg.params) {
        const val = params[p.key] ?? (p.type === 'range' ? (p.min ?? 0) : '');
        if (val !== '' && val !== undefined) fd.append(p.key, p.div ? String(Number(val) / p.div) : String(val));
      }
      const res = await processFile(`/api/${tool.id}`, fd);
      result = res;
    } catch (err) {
      error = err.message;
    } finally { running = false; }
  }
</script>

<div class="tv">
  <header class="tv-header">
    <button class="back-btn" onclick={onBack}>← BACK</button>
    <div class="tv-title"><span class="tv-icon">{tool.icon}</span><h2>{tool.name}</h2></div>
    <button class="logout-btn" onclick={async () => { await logout(); onLogout(); }}>EXIT</button>
  </header>

  <div class="tv-body">
    {#if result}
      <div class="result-section">
        <p class="result-msg">⦿ Processing complete</p>
        <div class="result-actions">
          {#if result.url}
            <a href={result.url} class="action-btn primary" target="_blank" rel="noopener">DOWNLOAD FILE</a>
          {/if}
          {#if result.urls}
            <div class="result-files">
              {#each result.urls as u, i}
                <a href={u} class="action-btn primary" target="_blank" rel="noopener">PART {i + 1}</a>
              {/each}
            </div>
          {/if}
          {#if result.text}
            <div class="result-text-block"><pre class="result-text">{result.text}</pre></div>
          {/if}
          <button class="action-btn" onclick={clearFiles}>↻ PROCESS ANOTHER</button>
        </div>
      </div>
    {:else}
      <!-- Step 1: Upload -->
      <div class="upload-zone"
        class:drag-over={dragOver}
        ondragover={onDragOver}
        ondragleave={onDragLeave}
        ondrop={onDrop}
        onclick={onFilePick}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && onFilePick()}
      >
        <input type="file" bind:this={fileInput} onchange={onFileSelected} accept={cfg.accept} multiple={cfg.multiple} style="display:none" />
        {#if files.length}
          <div class="file-list">
            <span class="file-count">📎 {files.length} file(s) selected</span>
            {#each files as f}
              <span class="file-name">{f.name}</span>
            {/each}
          </div>
        {:else}
          <span class="upload-icon">📁</span>
          <span class="upload-text">{dragOver ? 'DROP HERE' : cfg.label}</span>
          <span class="upload-hint">or click to browse</span>
        {/if}
      </div>

      {#if files.length}
        <!-- Merge: drag-drop file order -->
        {#if tool.id === 'merge' && files.length > 1}
          <div class="merge-order">
            <div class="preview-label">Drag files to set merge order (top = first page)</div>
            {#each files as f, i}
              <div class="merge-card" draggable="true"
                ondragstart={() => (dragIdx = i)}
                ondragover={(e) => e.preventDefault()}
                ondrop={() => onDropOrder(i)}>
                <span class="merge-order-idx">{i + 1}</span>
                <span class="merge-name">{f.name}</span>
                <span class="merge-grip">⠿</span>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Split parts builder: group pages into custom parts -->
        {#if tool.id === 'split' && params.mode === 'parts' && pageImages.length}
          <div class="parts-builder">
            <div class="preview-label">Click pages to assign to the active part. Each part becomes one output file.</div>
            <div class="parts-list">
              {#each parts as g, gi}
                <button type="button" class:part-active={curPart === gi} onclick={() => (curPart = gi)}>
                  Part {gi + 1}: {g.length ? g.join(', ') : 'empty'}
                  {#if parts.length > 1}
                    <span class="part-del" onclick={(e) => { e.stopPropagation(); removePart(gi); }}>✕</span>
                  {/if}
                </button>
              {/each}
              <button type="button" class="part-new" onclick={newPart}>＋ New part</button>
            </div>
            <div class="parts-grid">
              {#each pageImages as url, i}
                <button type="button" class:part-in={parts.flat().includes(i + 1)} class:part-cur={parts[curPart]?.includes(i + 1)} onclick={() => toggleToPart(i + 1)}>
                  <img src={url} alt="Page {i + 1}" />
                  <span class="thumb-label">{i + 1}</span>
                  {#if parts[curPart]?.includes(i + 1)}<span class="thumb-check">●</span>{/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Preview: organize pages (drag reorder / rotate / duplicate / delete) -->
        {#if cfg.display === 'organize' && pageImages.length}
          <Organizer images={pageImages} bind:items={orgItems} />
        <!-- Preview: full-size single-page viewer (rotate) -->
        {:else if cfg.display === 'viewer' && pageImages.length}
          <PageViewer images={pageImages} bind:rotations bind:cur={rotateCur} />
        <!-- Preview: large thumbnails (grid / select) -->
        {:else if cfg.display && !(tool.id === 'split' && params.mode === 'parts') && (pageImages.length || previewLoading)}
          <div class="preview-section">
            <div class="preview-label">
              {#if cfg.pageSelect}
                <strong>{selectedPages.length || 0} selected</strong> · click pages to select
              {:else}
                <strong>{pageImages.length} page(s)</strong>
              {/if}
              {#if previewLoading}<span class="preview-loading">…loading preview</span>{/if}
            </div>
            <div class="thumb-grid">
              {#each pageImages as url, i}
                <button type="button"
                  class:thumb-selected={selectedPages.includes(i + 1)}
                  class:thumb-clickable={cfg.pageSelect}
                  onclick={() => togglePage(i + 1)}>
                  <img src={url} alt="Page {i + 1}" loading="lazy" />
                  <span class="thumb-label">{i + 1}</span>
                  {#if selectedPages.includes(i + 1)}<span class="thumb-check">✓</span>{/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Step 2: Options -->
        {#if cfg.params.length}
          <div class="params-section">
            {#each cfg.params as p}
              <div class="param-row">
                <label class="param-label">
                  {p.label}
                  {#if p.type === 'range'}<span class="param-val">{params[p.key]}</span>{/if}
                </label>
                {#if p.options}
                  <select class="param-input" bind:value={params[p.key]}>
                    {#each p.options as opt}
                      <option value={opt}>{opt}</option>
                    {/each}
                  </select>
                {:else if p.type === 'range'}
                  <input class="param-range" type="range" min={p.min} max={p.max} step={p.step || 1} bind:value={params[p.key]} />
                {:else if p.type === 'position'}
                  <div class="pos-grid">
                    {#each [['tl','tm','tr'],['ml','mm','mr'],['bl','bm','br']] as row}
                      <div class="pos-row">
                        {#each row as pos}
                          <button type="button" class:pos-active={params[p.key] === pos} onclick={() => (params[p.key] = pos)}>{pos}</button>
                        {/each}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <input class="param-input" type="text" placeholder={p.placeholder} bind:value={params[p.key]} />
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        <!-- Step 3: Process -->
        {#if error}
          <div class="error-msg">⚠ {error}</div>
        {/if}
        <button class="process-btn" onclick={handleProcess} disabled={running}>
          {#if running}
            <span class="spinner"></span> PROCESSING...
          {:else}
            ⚡ {tool.name.split(' ').slice(0,2).join(' ').replace('PDF','') || 'PROCESS'}
          {/if}
        </button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .tv { min-height: 100vh; display: flex; flex-direction: column; }
  .tv-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 2rem; border-bottom: 1px solid rgba(0,255,245,0.15);
    background: rgba(10,10,15,0.95);
  }
  .tv-title { display: flex; align-items: center; gap: 0.75rem; }
  .tv-icon { font-size: 1.5rem; }
  .tv-title h2 { margin: 0; font-size: 1.1rem; color: var(--neon-cyan); letter-spacing: 0.15em; }
  .back-btn {
    padding: 0.5rem 1rem; background: transparent; border: 1px solid var(--neon-cyan);
    color: var(--neon-cyan); font-size: 0.75rem; cursor: pointer; font-family: inherit;
  }
  .back-btn:hover { background: rgba(0,255,245,0.1); }
  .logout-btn {
    padding: 0.5rem 1rem; background: transparent; border: 1px solid var(--neon-magenta);
    color: var(--neon-magenta); font-size: 0.7rem; cursor: pointer; font-family: inherit; letter-spacing: 0.1em;
  }
  .logout-btn:hover { background: rgba(255,0,255,0.1); }
  .tv-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 3rem 1rem; max-width: 640px; margin: 0 auto; width: 100%; }
  .upload-zone {
    width: 100%; border: 2px dashed rgba(0,255,245,0.3); padding: 3rem 2rem;
    text-align: center; cursor: pointer; transition: all 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--neon-cyan); background: rgba(0,255,245,0.05);
    box-shadow: 0 0 30px rgba(0,255,245,0.1);
  }
  .upload-icon { font-size: 3rem; }
  .upload-text { font-size: 1rem; color: var(--text); }
  .upload-hint { font-size: 0.75rem; color: var(--dim); }
  .file-list { display: flex; flex-direction: column; gap: 0.3rem; }
  .file-count { font-size: 0.9rem; color: var(--neon-cyan); }
  .file-name { font-size: 0.8rem; color: var(--text); opacity: 0.8; }
  .params-section { width: 100%; margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .param-row { display: flex; flex-direction: column; gap: 0.3rem; }
  .param-label { font-size: 0.7rem; color: var(--neon-cyan); letter-spacing: 0.1em; }
  .param-input {
    padding: 0.7rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,255,245,0.2);
    color: var(--text); font-family: inherit; font-size: 0.85rem; outline: none;
  }
  .param-input:focus { border-color: var(--neon-cyan); }
  select.param-input { cursor: pointer; }
  .error-msg { width: 100%; margin-top: 1rem; padding: 0.75rem; background: rgba(255,0,255,0.1); border: 1px solid var(--neon-magenta); font-size: 0.8rem; color: var(--neon-magenta); }
  .process-btn {
    width: 100%; margin-top: 1.5rem; padding: 1rem;
    background: transparent; border: 1px solid var(--neon-cyan);
    color: var(--neon-cyan); font-size: 1rem; cursor: pointer;
    font-family: inherit; transition: all 0.3s; letter-spacing: 0.15em;
  }
  .process-btn:hover:not(:disabled) { background: rgba(0,255,245,0.1); box-shadow: 0 0 20px rgba(0,255,245,0.3); }
  .process-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid transparent; border-top-color: var(--neon-cyan); border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 0.5rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .result-section { width: 100%; text-align: center; }
  .result-msg { font-size: 1.1rem; color: #00ff00; margin-bottom: 1rem; text-shadow: 0 0 10px rgba(0,255,0,0.3); }
  .result-files { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
  .result-text { background: rgba(0,0,0,0.3); border: 1px solid rgba(0,255,245,0.2); padding: 1rem; font-size: 0.8rem; color: var(--text); text-align: left; white-space: pre-wrap; margin-bottom: 1rem; max-height: 400px; overflow-y: auto; }
  .result-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
  .action-btn {
    padding: 0.75rem 1.5rem; background: transparent; border: 1px solid var(--neon-cyan);
    color: var(--neon-cyan); cursor: pointer; font-size: 0.85rem; font-family: inherit;
    text-decoration: none; transition: all 0.3s;
  }
  .action-btn.primary { background: rgba(0,255,245,0.1); border-color: var(--neon-cyan); }
  .action-btn:hover { background: rgba(0,255,245,0.2); box-shadow: 0 0 15px rgba(0,255,245,0.2); }

  /* Page preview thumbnails (Smallpdf-style) */
  .preview-section { width: 100%; margin-top: 1.5rem; }
  .preview-label { font-size: 0.7rem; color: var(--neon-cyan); letter-spacing: 0.05em; margin-bottom: 0.6rem; }
  .preview-loading { opacity: 0.7; font-size: 0.65rem; margin-left: 0.5rem; }
  .thumb-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 0.8rem; width: 100%;
  }
  .thumb-grid button {
    position: relative; padding: 0; margin: 0; border: 2px solid rgba(0,255,245,0.22);
    background: rgba(0,0,0,0.3); cursor: default; overflow: hidden; border-radius: 6px;
  }
  .thumb-grid button.thumb-clickable { cursor: pointer; }
  .thumb-grid button.thumb-clickable:hover { border-color: var(--neon-cyan); }
  .thumb-grid button.thumb-selected {
    border-color: var(--neon-magenta); box-shadow: 0 0 14px rgba(255,0,255,0.5);
  }
  .thumb-grid img { width: 100%; display: block; }
  .thumb-label {
    position: absolute; top: 6px; left: 8px; font-size: 0.7rem;
    background: rgba(0,0,0,0.65); color: #fff; padding: 2px 7px; border-radius: 4px;
  }
  .thumb-check {
    position: absolute; top: 6px; right: 8px; font-size: 1rem; color: #00ff00; font-weight: bold;
    text-shadow: 0 0 5px rgba(0,0,0,0.9);
  }
  .param-row { display: flex; flex-direction: column; gap: 0.3rem; }
  .param-val { float: right; color: var(--neon-cyan); font-size: 0.72rem; letter-spacing: 0.05em; }
  .param-range { width: 100%; accent-color: var(--neon-cyan); }
  .pos-grid { display: flex; flex-direction: column; gap: 0.3rem; }
  .pos-row { display: flex; gap: 0.3rem; }
  .pos-grid button {
    width: 48px; height: 30px; font-size: 0.65rem; cursor: pointer; font-family: inherit; text-transform: uppercase;
    background: rgba(0,0,0,0.3); border: 1px solid rgba(0,255,245,0.22); color: var(--dim); border-radius: 4px;
  }
  .pos-grid button.pos-active { border-color: var(--neon-cyan); color: var(--neon-cyan); background: rgba(0,255,245,0.12); }

  /* Merge drag-order cards */
  .merge-order { width: 100%; margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .merge-card {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 1rem;
    background: rgba(0,0,0,0.35); border: 1px solid rgba(0,255,245,0.25); cursor: grab;
    border-radius: 6px; user-select: none;
  }
  .merge-card:active { cursor: grabbing; }
  .merge-order-idx { width: 22px; height: 22px; border-radius: 50%; background: var(--neon-cyan); color: #000; font-size: 0.7rem; font-weight: bold; display: flex; align-items: center; justify-content: center; }
  .merge-name { flex: 1; font-size: 0.85rem; color: var(--text); }
  .merge-grip { color: var(--dim); font-size: 1.1rem; }

  /* Split parts builder */
  .parts-builder { width: 100%; margin-top: 1.25rem; }
  .parts-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
  .parts-list button {
    padding: 0.4rem 0.7rem; cursor: pointer; font-family: inherit; font-size: 0.75rem;
    background: rgba(0,0,0,0.3); border: 1px solid rgba(0,255,245,0.25); color: var(--text); border-radius: 4px;
  }
  .parts-list button.part-active { border-color: var(--neon-magenta); color: var(--neon-magenta); }
  .parts-list button.part-new { border-style: dashed; }
  .part-del { margin-left: 0.5rem; color: var(--neon-magenta); }
  .parts-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.7rem;
  }
  .parts-grid button {
    position: relative; padding: 0; border: 2px solid rgba(0,255,245,0.22); background: rgba(0,0,0,0.3); cursor: pointer; overflow: hidden; border-radius: 5px;
  }
  .parts-grid button.part-cur { border-color: var(--neon-magenta); box-shadow: 0 0 12px rgba(255,0,255,0.45); }
  .parts-grid img { width: 100%; display: block; }
</style>