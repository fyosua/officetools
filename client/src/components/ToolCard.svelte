<script>
  let { tool, onRun } = $props();
  let expanded = $state(false);
  let dragOver = $state(false);
  let result = $state(null);
  let input = $state('');
  let files = $state([]);
  let running = $state(false);
  let fileInput;

  function handleDragOver(e) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    dragOver = false;
    const dropped = [...e.dataTransfer.files];
    if (dropped.length && tool.acceptFiles) {
      files = dropped;
      input = dropped.map(f => f.name).join(', ');
    }
  }

  function handleClickUpload() {
    fileInput?.click();
  }

  function handleFileSelected(e) {
    const selected = [...(e.target?.files || [])];
    if (selected.length) {
      files = selected;
      input = selected.map(f => f.name).join(', ');
    }
  }

  async function handleRun() {
    running = true;
    result = null;
    try {
      const res = await onRun(tool.id, files);
      result = { ok: true, data: res };
    } catch (err) {
      result = { ok: false, data: err.message };
    } finally {
      running = false;
    }
  }
</script>

<div
  class="tool-card"
  class:expanded
  class:drag-over={dragOver}
>
  <div
    class="card-header"
    role="button"
    tabindex="0"
    onclick={() => expanded = !expanded}
    onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
  >
    <span class="card-icon">{tool.icon}</span>
    <div class="card-info">
      <span class="card-title">{tool.name}</span>
      <span class="card-desc">{tool.description}</span>
    </div>
    <span class="card-toggle">{expanded ? '−' : '+'}</span>
  </div>

  {#if expanded}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="card-body" ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}>
      {#if tool.acceptFiles}
        <div class="drop-zone" class:drag-over={dragOver} role="button" tabindex="0" onclick={handleClickUpload} onkeydown={(e) => e.key === 'Enter' && handleClickUpload()}>
          <span class="drop-icon">📁</span>
          <span class="drop-text">{dragOver ? 'DROP FILES HERE' : files.length ? files.map(f => f.name).join(', ') : 'Click or drag & drop files here'}</span>
        </div>
        <input type="file" bind:this={fileInput} onchange={handleFileSelected} style="display:none" multiple />
      {/if}

      <textarea
        class="tool-input"
        bind:value={input}
        placeholder={tool.placeholder || 'Enter input...'}
        rows="3"
        disabled={running}
      ></textarea>

      <button class="run-btn" onclick={handleRun} disabled={running}>
        {#if running}
          <span class="btn-spinner"></span> RUNNING...
        {:else}
          ⚡ RUN
        {/if}
      </button>

      {#if result}
        <div class="result-box" class:result-error={!result.ok}>
          <pre>{result.data}</pre>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tool-card {
    background: var(--card-bg);
    border: 1px solid rgba(0, 255, 245, 0.15);
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .tool-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--neon-cyan), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .tool-card:hover {
    border-color: var(--neon-cyan);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 255, 245, 0.1);
  }

  .tool-card:hover::before {
    opacity: 1;
  }

  .tool-card.expanded {
    border-color: var(--neon-cyan);
  }

  .tool-card.drag-over {
    border-color: var(--neon-magenta);
    box-shadow: 0 0 30px rgba(255, 0, 255, 0.2);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
  }

  .card-icon {
    font-size: 1.5rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 255, 245, 0.05);
    border: 1px solid rgba(0, 255, 245, 0.2);
    flex-shrink: 0;
  }

  .card-info {
    flex: 1;
    min-width: 0;
  }

  .card-title {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--neon-cyan);
    margin-bottom: 0.2rem;
    letter-spacing: 0.05em;
  }

  .card-desc {
    display: block;
    font-size: 0.75rem;
    color: var(--text);
    opacity: 0.7;
  }

  .card-toggle {
    color: var(--neon-cyan);
    font-size: 1.2rem;
    opacity: 0.6;
    flex-shrink: 0;
  }

  .card-body {
    padding: 0 1.25rem 1.25rem;
    border-top: 1px solid rgba(0, 255, 245, 0.1);
    padding-top: 1rem;
    animation: slide-down 0.2s ease;
  }

  @keyframes slide-down {
    from { opacity: 0; max-height: 0; }
    to { opacity: 1; max-height: 500px; }
  }

  .drop-zone {
    border: 2px dashed rgba(0, 255, 245, 0.3);
    padding: 1.5rem;
    text-align: center;
    margin-bottom: 0.75rem;
    transition: all 0.2s;
  }

  .drop-zone.drag-over {
    border-color: var(--neon-magenta);
    background: rgba(255, 0, 255, 0.05);
  }

  .drop-icon {
    display: block;
    font-size: 1.5rem;
    margin-bottom: 0.3rem;
  }

  .drop-text {
    font-size: 0.75rem;
    color: var(--text);
    opacity: 0.6;
    font-family: 'Courier New', monospace;
  }

  .tool-input {
    width: 100%;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 255, 245, 0.15);
    color: var(--text);
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    resize: vertical;
    outline: none;
    box-sizing: border-box;
    margin-bottom: 0.75rem;
  }

  .tool-input:focus {
    border-color: var(--neon-cyan);
  }

  .run-btn {
    width: 100%;
    padding: 0.7rem;
    background: transparent;
    border: 1px solid var(--neon-cyan);
    color: var(--neon-cyan);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .run-btn:hover:not(:disabled) {
    background: rgba(0, 255, 245, 0.1);
  }

  .run-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid transparent;
    border-top-color: var(--neon-cyan);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .result-box {
    padding: 0.75rem;
    background: rgba(0, 255, 245, 0.05);
    border: 1px solid rgba(0, 255, 245, 0.2);
    max-height: 200px;
    overflow-y: auto;
  }

  .result-box pre {
    margin: 0;
    font-size: 0.75rem;
    color: var(--neon-cyan);
    white-space: pre-wrap;
    word-break: break-all;
    font-family: 'Courier New', monospace;
  }

  .result-box.result-error {
    border-color: var(--neon-magenta);
  }

  .result-box.result-error pre {
    color: var(--neon-magenta);
  }
</style>