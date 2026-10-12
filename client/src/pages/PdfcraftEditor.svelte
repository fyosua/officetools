<script>
  let { onBack, onLogout } = $props();
  import { processFile } from '../lib/api.js';
  import { logout } from '../lib/auth.js';

  let file = $state(null);
  let e2;
  let pages = $state([]);      // {url, selected}
  let busy = $state(false);
  let result = $state(null);   // {label, urls:[], text}
  let error = $state('');
  let mode = $state('organize'); // organize | split | annotate | render | text | edit | combine

  const MODES = [
    { id: 'organize', label: 'Organize & Rotate' },
    { id: 'split', label: 'Split' },
    { id: 'annotate', label: 'Highlight' },
    { id: 'render', label: 'Render to PNG' },
    { id: 'text', label: 'Extract text' },
    { id: 'edit', label: 'Edit text' },
    { id: 'combine', label: 'Combine' },
  ];

  let splitEvery = $state(1);
  let findText = $state('INVOICE');
  let editText = $state('');
  let pageNum = $state(1);
  let dpi = $state(96);
  let degrees = $state(90);

  async function onFile(e) {
    file = e.target.files?.[0] || null;
    error = ''; result = null; pages = [];
    if (file?.name.toLowerCase().endsWith('.pdf')) {
      await loadThumbs();
    }
  }

  async function loadThumbs() {
    busy = true;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dpi', '120');
      const res = await processFile('/api/pdf-to-png', fd);
      pages = (res.urls || []).map((url, i) => ({ url, n: i + 1, sel: false }));
    } catch (err) { error = 'Preview failed (still usable): ' + err.message; }
    finally { busy = false; }
  }

  function toggleSel(p) { p.sel = !p.sel; }

  async function run(op) {
    if (!file) { error = 'Choose a PDF first'; return; }
    busy = true; error = ''; result = null;
    try {
      const fd = new FormData();
      fd.append('file', file);
      let res;
      switch (op) {
        case 'rotate': {
          const sel = pages.filter((p) => p.sel).map((p) => p.n);
          fd.append('pages', sel.length ? sel.join(',') : '1');
          fd.append('degrees', String(degrees));
          res = await processFile('/api/pdfcraft/rotate', fd);
          result = { label: 'Rotated PDF', urls: [res.url] };
          break;
        }
        case 'split':
          fd.append('mode', 'every');
          fd.append('every', String(splitEvery));
          res = await processFile('/api/pdfcraft/split', fd);
          result = { label: `Split into ${res.urls.length} part(s)`, urls: res.urls };
          break;
        case 'annotate':
          fd.append('type', 'highlight');
          fd.append('page', '1');
          fd.append('find', findText || 'INVOICE');
          res = await processFile('/api/pdfcraft/annotate', fd);
          result = { label: 'Highlighted PDF', urls: [res.url] };
          break;
        case 'render':
          fd.append('page', String(pageNum || 1));
          fd.append('dpi', String(dpi));
          res = await processFile('/api/pdfcraft/render', fd);
          result = { label: 'Rendered page image', urls: [res.url] };
          break;
        case 'text':
          res = await processFile('/api/pdfcraft/text', fd);
          result = { label: 'Extracted text', text: res.text };
          break;
        case 'edit':
          fd.append('page', String(pageNum || 1));
          fd.append('text', editText);
          res = await processFile('/api/pdfcraft/edit', fd);
          result = { label: 'Edited PDF', urls: [res.url] };
          break;
        case 'combine': {
          const files = e2.files;
          if (!files || files.length < 2) { error = 'Select 2+ PDFs to combine'; busy = false; return; }
          for (const f of files) fd.append('file', f);
          res = await processFile('/api/pdfcraft/combine', fd);
          result = { label: 'Combined PDF', urls: [res.url] };
          break;
        }
      }
    } catch (err) { error = err.message; }
    finally { busy = false; }
  }
</script>

<div class="pe">
  <header class="pe-head">
    <button class="pe-back" onclick={onBack}>← Back</button>
    <div class="pe-title"><span class="pe-logo">✏️</span><h1>PDF Editor — PdfCraft engine</h1></div>
    <button class="pe-logout" onclick={async () => { await logout(); onLogout(); }}>Exit</button>
  </header>

  <div class="pe-modes">
    {#each MODES as m}
      <button class="pe-mode" class:active={mode === m.id} onclick={() => { mode = m.id; result = null; error = ''; }}>{m.label}</button>
    {/each}
  </div>

  <div class="pe-body">
    {#if mode !== 'combine'}
      <label class="pe-upload">
        <span class="pe-upload-icon">📄</span>
        <span>{file ? file.name : 'Choose a PDF'}</span>
        <input type="file" accept="application/pdf,.pdf" onchange={onFile} />
      </label>
    {:else}
      <label class="pe-upload" for="combine-input">
        <span class="pe-upload-icon">📚</span>
        <span>Choose {file ? 'another' : 'two or more'} PDFs to combine</span>
      </label>
      <input id="combine-input" type="file" accept="application/pdf,.pdf" multiple bind:this={e2} />
    {/if}

    {#if pages.length}
      <div class="pe-thumbs">
        <div class="pe-thumbs-label">Click pages to select for Rotate. {pages.filter((p) => p.sel).length} selected.</div>
        <div class="pe-thumbs-grid">
          {#each pages as p}
            <button class="pe-thumb" class:sel={p.sel} onclick={() => toggleSel(p)}>
              <img src={p.url} alt="Page {p.n}" />
              <span class="pe-thumb-n">{p.n}</span>
              {#if p.sel}<span class="pe-thumb-check">✓</span>{/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="pe-controls">
      {#if mode === 'organize'}
        <label>Rotate selected pages by <select bind:value={degrees}>{#each [90,180,270] as d}<option value={d}>{d}°</option>{/each}</select></label>
        <button class="pe-run" onclick={() => run('rotate')} disabled={busy}>{busy ? 'Working…' : 'Rotate'}</button>
      {:else if mode === 'split'}
        <label>Every <input type="number" min="1" bind:value={splitEvery} /> page(s) per file</label>
        <button class="pe-run" onclick={() => run('split')} disabled={busy}>{busy ? 'Working…' : 'Split'}</button>
      {:else if mode === 'annotate'}
        <label>Highlight text: <input type="text" bind:value={findText} placeholder="INVOICE" /></label>
        <button class="pe-run" onclick={() => run('annotate')} disabled={busy}>{busy ? 'Working…' : 'Highlight'}</button>
      {:else if mode === 'render'}
        <label>Page <input type="number" min="1" bind:value={pageNum} /> @ <input type="number" min="72" max="300" bind:value={dpi} /> DPI</label>
        <button class="pe-run" onclick={() => run('render')} disabled={busy}>{busy ? 'Working…' : 'Render'}</button>
      {:else if mode === 'text'}
        <button class="pe-run" onclick={() => run('text')} disabled={busy}>{busy ? 'Working…' : 'Extract text'}</button>
      {:else if mode === 'edit'}
        <label>Replace text (Latin): <input type="text" bind:value={editText} placeholder="Replacement text" /></label>
        <label>On page <input type="number" min="1" bind:value={pageNum} /></label>
        <button class="pe-run" onclick={() => run('edit')} disabled={busy}>{busy ? 'Working…' : 'Edit text'}</button>
      {:else if mode === 'combine'}
        <button class="pe-run" onclick={() => run('combine')} disabled={busy}>{busy ? 'Working…' : 'Combine'}</button>
      {/if}
    </div>

    {#if error}<div class="pe-error">⚠ {error}</div>{/if}

    {#if result}
      <div class="pe-result">
        <div class="pe-result-ok">✔ {result.label}</div>
        {#if result.urls}
          <div class="pe-result-links">
            {#each result.urls as u, i}
              <a class="pe-dl" href={u} target="_blank" rel="noopener">DOWNLOAD {result.urls.length > 1 ? `PART ${i + 1}` : 'FILE'}</a>
            {/each}
          </div>
        {/if}
        {#if result.text}<pre class="pe-text">{result.text}</pre>{/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .pe { min-height: 100vh; background: #fbfbfd; color: #1f2430; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .pe-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: #ffffff; border-bottom: 1px solid #e6e8ee; }
  .pe-title { display: flex; align-items: center; gap: 10px; }
  .pe-title h1 { margin: 0; font-size: 17px; font-weight: 600; color: #2b3447; }
  .pe-logo { font-size: 20px; }
  .pe-back, .pe-logout { background: #fff; border: 1px solid #d4d9e3; color: #3a4256; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; }
  .pe-back:hover, .pe-logout:hover { background: #f4f6fa; }
  .pe-modes { display: flex; gap: 8px; padding: 14px 24px; flex-wrap: wrap; background: #ffffff; border-bottom: 1px solid #eef0f5; }
  .pe-mode { border: 1px solid #d4d9e3; background: #fff; color: #3a4256; padding: 8px 14px; border-radius: 20px; cursor: pointer; font-size: 13px; }
  .pe-mode.active { background: #ff4d00; border-color: #ff4d00; color: #fff; font-weight: 600; }
  .pe-body { max-width: 860px; margin: 0 auto; padding: 28px 24px 60px; }
  .pe-upload { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 34px 20px; border: 2px dashed #cdd4e0; border-radius: 14px; cursor: pointer; color: #6b7384; font-size: 14px; }
  .pe-upload:hover { border-color: #ff4d00; }
  .pe-upload input, #combine-input { display: none; }
  .pe-upload-icon { font-size: 30px; }
  .pe-thumbs { margin-top: 22px; }
  .pe-thumbs-label { font-size: 13px; color: #6b7384; margin-bottom: 10px; }
  .pe-thumbs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
  .pe-thumb { position: relative; padding: 0; border: 2px solid #e2e6ee; border-radius: 8px; overflow: hidden; background: #fff; cursor: pointer; }
  .pe-thumb.sel { border-color: #ff4d00; box-shadow: 0 0 0 3px rgba(255,77,0,0.18); }
  .pe-thumb img { width: 100%; display: block; }
  .pe-thumb-n { position: absolute; top: 6px; left: 8px; background: rgba(0,0,0,0.6); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 10px; }
  .pe-thumb-check { position: absolute; top: 6px; right: 8px; color: #ff4d00; font-weight: bold; font-size: 15px; }
  .pe-controls { margin-top: 24px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .pe-controls label { font-size: 13px; color: #2b3447; display: flex; align-items: center; gap: 8px; }
  .pe-controls input, .pe-controls select { padding: 8px 10px; border: 1px solid #cdd4e0; border-radius: 8px; font-size: 13px; }
  .pe-run { background: #ff4d00; border: none; color: #fff; padding: 11px 22px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .pe-run:disabled { opacity: 0.5; cursor: not-allowed; }
  .pe-error { margin-top: 16px; background: #fdeeee; color: #b3261e; padding: 12px 14px; border-radius: 10px; font-size: 13px; }
  .pe-result { margin-top: 22px; background: #ffffff; border: 1px solid #e6e8ee; border-radius: 14px; padding: 18px; }
  .pe-result-ok { font-size: 15px; font-weight: 600; color: #188038; margin-bottom: 12px; }
  .pe-result-links { display: flex; gap: 10px; flex-wrap: wrap; }
  .pe-dl { background: #ff4d00; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; }
  .pe-dl:hover { background: #e64500; }
  .pe-text { background: #f6f7fa; border: 1px solid #e6e8ee; padding: 14px; border-radius: 10px; font-size: 12px; white-space: pre-wrap; max-height: 320px; overflow: auto; color: #2b3447; }
</style>
