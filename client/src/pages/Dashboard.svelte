<script>
  let { onSelectTool, onLogout } = $props();
  import { logout } from '../lib/auth.js';

  const ALL = {
    'pdf-to-jpg': { id: 'pdf-to-jpg', name: 'PDF TO JPG', icon: '🖼️', desc: 'Convert PDF pages to images' },
    'pdf-to-png': { id: 'pdf-to-png', name: 'PDF TO PNG', icon: '🌄', desc: 'Convert PDF pages to PNG' },
    'jpg-to-pdf': { id: 'jpg-to-pdf', name: 'JPG TO PDF', icon: '📄', desc: 'Convert images to PDF' },
    'docx-to-pdf': { id: 'docx-to-pdf', name: 'DOCX TO PDF', icon: '📝', desc: 'Convert Word to PDF' },
    'pdf-to-docx': { id: 'pdf-to-docx', name: 'PDF TO DOCX', icon: '✏️', desc: 'Convert PDF to Word' },
    'office-to-pdf': { id: 'office-to-pdf', name: 'OFFICE TO PDF', icon: '📊', desc: 'Convert Excel/PPT/OpenOffice to PDF' },
    merge: { id: 'merge', name: 'MERGE', icon: '⬜', desc: 'Combine multiple PDFs & images' },
    split: { id: 'split', name: 'SPLIT', icon: '◻️', desc: 'Split into parts or per page' },
    organize: { id: 'organize', name: 'ORGANIZE', icon: '🧲', desc: 'Reorder, rotate, duplicate, delete' },
    'delete-pages': { id: 'delete-pages', name: 'DELETE PAGES', icon: '🗑️', desc: 'Remove pages from a PDF' },
    rotate: { id: 'rotate', name: 'ROTATE', icon: '🔄', desc: 'Rotate pages (interactive)' },
    crop: { id: 'crop', name: 'CROP', icon: '✂️', desc: 'Trim page margins' },
    'pdf-editor': { id: 'pdf-editor', name: 'PDF EDITOR', icon: '🖊️', desc: 'Annotate: text, highlight, draw, sign' },
    watermark: { id: 'watermark', name: 'WATERMARK', icon: '💧', desc: 'Add a text watermark' },
    'number-pages': { id: 'number-pages', name: 'NUMBER PAGES', icon: '🔢', desc: 'Add page numbers anywhere' },
    unlock: { id: 'unlock', name: 'UNLOCK', icon: '🔓', desc: 'Remove password protection' },
    protect: { id: 'protect', name: 'PROTECT', icon: '🔒', desc: 'Add password protection' },
    'pdf-to-text': { id: 'pdf-to-text', name: 'EXTRACT TEXT', icon: '📃', desc: 'Pull text out of a PDF' },
    compress: { id: 'compress', name: 'COMPRESS', icon: '⬇️', desc: 'Reduce PDF file size' },
  };

  const groups = [
    { name: 'Convert', icon: '🔁', blurb: 'Change file types (PDF ↔ Office ↔ images)', ids: ['pdf-to-jpg', 'pdf-to-png', 'jpg-to-pdf', 'docx-to-pdf', 'pdf-to-docx', 'office-to-pdf'] },
    { name: 'Organize', icon: '📑', blurb: 'Structure your pages', ids: ['merge', 'split', 'organize', 'delete-pages', 'rotate', 'crop'] },
    { name: 'Edit & Sign', icon: '✍️', blurb: 'Annotate, edit and sign', ids: ['pdf-editor', 'watermark', 'number-pages'] },
    { name: 'Protect', icon: '🔒', blurb: 'Keep your PDFs secure', ids: ['unlock', 'protect'] },
    { name: 'Extract & Compress', icon: '📃', blurb: 'Read, reuse and shrink', ids: ['pdf-to-text', 'compress'] },
  ];

  async function doLogout() { await logout(); onLogout(); }
  let collapsed = $state(Object.fromEntries(groups.map((g) => [g.name, true])));
  function toggle(name) { collapsed = { ...collapsed, [name]: !collapsed[name] }; }
</script>

<div class="dash">
  <header class="dash-header">
    <div class="header-left">
      <span class="logo">⚡</span>
      <h1>OFFICETOOLS</h1>
    </div>
    <button class="logout-btn" onclick={doLogout}>EXIT</button>
  </header>

  <main class="groups">
    {#each groups as g}
      <section class="group">
        <button class="group-head" onclick={() => toggle(g.name)} aria-expanded={!collapsed[g.name]}>
          <span class="chevron">{collapsed[g.name] ? '▸' : '▾'}</span>
          <span class="group-icon">{g.icon}</span>
          <div class="group-title">
            <h2>{g.name}</h2>
            <span class="group-blurb">{g.blurb}</span>
          </div>
          <span class="group-count">{g.ids.length}</span>
        </button>
        {#if !collapsed[g.name]}
          <div class="tool-grid">
            {#each g.ids as id}
              {@const tool = ALL[id]}
              {#if tool}
                <button class="tool-card" onclick={() => onSelectTool(tool)}>
                  <span class="tool-icon">{tool.icon}</span>
                  <span class="tool-name">{tool.name}</span>
                  <span class="tool-desc">{tool.desc}</span>
                </button>
              {/if}
            {/each}
          </div>
        {/if}
      </section>
    {/each}
  </main>
</div>

<style>
  .dash { min-height: 100vh; display: flex; flex-direction: column; }
  .dash-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 2rem; border-bottom: 1px solid rgba(0,255,245,0.15);
    background: rgba(10,10,15,0.95); position: sticky; top: 0; z-index: 10;
  }
  .header-left { display: flex; align-items: center; gap: 0.75rem; }
  .logo { font-size: 1.5rem; }
  h1 { margin: 0; font-size: 1.2rem; letter-spacing: 0.25em; color: var(--neon-cyan); text-shadow: 0 0 15px rgba(0,255,245,0.3); }
  .logout-btn {
    padding: 0.5rem 1rem; background: transparent; border: 1px solid var(--neon-magenta);
    color: var(--neon-magenta); font-size: 0.7rem; cursor: pointer;
    font-family: 'Courier New', monospace; letter-spacing: 0.1em;
  }
  .logout-btn:hover { background: rgba(255,0,255,0.1); box-shadow: 0 0 15px rgba(255,0,255,0.2); }
  .groups { flex: 1; padding: 2rem; max-width: 1240px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 2.5rem; }
  .group { display: flex; flex-direction: column; gap: 1rem; }
  .group-head {
    display: flex; align-items: center; gap: 0.9rem; width: 100%;
    background: none; border: none; padding: 0; margin: 0; cursor: pointer;
    font-family: inherit; text-align: left;
  }
  .group-head:hover .group-title h2 { text-shadow: 0 0 12px rgba(0,255,245,0.3); }
  .chevron { font-size: 1rem; color: var(--neon-cyan); width: 1rem; transition: transform 0.2s; }
  .group-count {
    margin-left: auto; font-size: 0.7rem; color: var(--dim);
    background: rgba(0,255,245,0.08); border: 1px solid rgba(0,255,245,0.2);
    padding: 0.2rem 0.6rem; border-radius: 10px;
  }
  .group-icon { font-size: 1.7rem; }
  .group-title h2 {
    margin: 0; font-size: 1.1rem; letter-spacing: 0.12em; color: var(--neon-cyan);
    text-transform: uppercase;
  }
  .group-blurb { font-size: 0.75rem; color: var(--text); opacity: 0.6; }
  .tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
  .tool-card {
    background: var(--card-bg); border: 1px solid rgba(0,255,245,0.15);
    padding: 1.5rem 1.25rem; text-align: center; cursor: pointer;
    transition: all 0.3s; font-family: inherit;
    display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
  }
  .tool-card:hover {
    border-color: var(--neon-cyan); transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,255,245,0.1);
  }
  .tool-icon { font-size: 2.2rem; }
  .tool-name { font-size: 0.85rem; font-weight: 600; color: var(--neon-cyan); letter-spacing: 0.08em; }
  .tool-desc { font-size: 0.72rem; color: var(--text); opacity: 0.7; }
</style>