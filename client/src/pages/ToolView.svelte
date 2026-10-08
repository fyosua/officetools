<script>
  let { tool, onBack, onLogout } = $props();
  import { logout } from '../lib/auth.js';
  import { processFile } from '../lib/api.js';

  let files = $state([]);
  let dragOver = $state(false);
  let running = $state(false);
  let result = $state(null);
  let error = $state('');
  let fileInput;

  const configs = {
    merge: { label: 'Upload multiple PDFs to merge', accept: '.pdf', multiple: true, params: [] },
    split: { label: 'Upload a PDF to split', accept: '.pdf', multiple: false, params: [{ key: 'mode', label: 'Split mode', options: ['split', 'extract', 'perpage'] }, { key: 'pages', label: 'Pages (e.g. 1-3,5,7-9)', placeholder: '1-999' }] },
    compress: { label: 'Upload a PDF to compress', accept: '.pdf', multiple: false, params: [{ key: 'mode', label: 'Compression mode', placeholder: 'ebook (lossy)', options: ['ebook', 'screen', 'printer', 'prepress'] }] },
    'pdf-to-jpg': { label: 'Upload a PDF to convert to images', accept: '.pdf', multiple: false, params: [{ key: 'dpi', label: 'Resolution (DPI)', placeholder: '150' }] },
    'pdf-to-png': { label: 'Upload a PDF to convert to PNG', accept: '.pdf', multiple: false, params: [{ key: 'dpi', label: 'Resolution (DPI)', placeholder: '150' }] },
    'delete-pages': { label: 'Upload a PDF to delete pages', accept: '.pdf', multiple: false, params: [{ key: 'pages', label: 'Pages to delete (e.g. 2,5)', placeholder: '2' }] },
    'office-to-pdf': { label: 'Upload an Office file to convert to PDF', accept: '.docx,.xlsx,.pptx,.odt,.ods,.odp', multiple: false, params: [] },
    watermark: { label: 'Upload a PDF to watermark', accept: '.pdf', multiple: false, params: [{ key: 'text', label: 'Watermark text', placeholder: 'CONFIDENTIAL' }] },
    'number-pages': { label: 'Upload a PDF to number pages', accept: '.pdf', multiple: false, params: [{ key: 'start', label: 'Start number', placeholder: '1' }] },
    crop: { label: 'Upload a PDF to crop', accept: '.pdf', multiple: false, params: [{ key: 'margin', label: 'Crop % per side', placeholder: '10' }] },
    'jpg-to-pdf': { label: 'Upload images to convert to PDF', accept: '.jpg,.jpeg,.png', multiple: true, params: [] },
    'docx-to-pdf': { label: 'Upload a Word document to convert', accept: '.docx', multiple: false, params: [] },
    'pdf-to-docx': { label: 'Upload a PDF to convert to Word', accept: '.pdf', multiple: false, params: [] },
    rotate: { label: 'Upload a PDF to rotate', accept: '.pdf', multiple: false, params: [{ key: 'angle', label: 'Rotation angle', placeholder: '90', options: ['90', '180', '270'] }] },
    unlock: { label: 'Upload a password-protected PDF', accept: '.pdf', multiple: false, params: [{ key: 'password', label: 'Document password', placeholder: 'Enter password' }] },
    protect: { label: 'Upload a PDF to protect', accept: '.pdf', multiple: false, params: [{ key: 'password', label: 'New password', placeholder: 'Set a password' }] },
    'pdf-to-text': { label: 'Upload a PDF to extract text', accept: '.pdf', multiple: false, params: [] },
    'pdf-editor': { label: 'Upload a PDF to edit', accept: '.pdf', multiple: false, params: [{ key: 'text', label: 'Text to add', placeholder: 'Enter annotation text' }] },
  };

  let cfg = configs[tool.id] || configs['merge'];
  let params = $state({});

  function onDragOver(e) { e.preventDefault(); dragOver = true; }
  function onDragLeave() { dragOver = false; }
  function onDrop(e) {
    e.preventDefault(); dragOver = false;
    const dropped = [...e.dataTransfer.files];
    if (dropped.length) files = dropped;
  }
  function onFilePick() { fileInput?.click(); }
  function onFileSelected(e) {
    const s = [...(e.target?.files || [])];
    if (s.length) files = s;
  }
  function clearFiles() { files = []; result = null; error = ''; }

  async function handleProcess() {
    if (!files.length) { error = 'Please select a file first'; return; }
    running = true; error = ''; result = null;
    try {
      const fd = new FormData();
      for (const f of files) fd.append('file', f);
      for (const p of cfg.params) {
        const val = params[p.key] || p.placeholder || '';
        fd.append(p.key, val);
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
        <!-- Step 2: Options -->
        {#if cfg.params.length}
          <div class="params-section">
            {#each cfg.params as p}
              <div class="param-row">
                <label class="param-label">{p.label}</label>
                {#if p.options}
                  <select class="param-input" bind:value={params[p.key]}>
                    {#each p.options as opt}
                      <option value={opt}>{opt}</option>
                    {/each}
                  </select>
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
</style>