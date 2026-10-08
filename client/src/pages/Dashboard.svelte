<script>
  let { onSelectTool, onLogout } = $props();
  import { logout } from '../lib/auth.js';

  let tools = [
    { id: 'merge', name: 'PDF MERGE', icon: '⬜', desc: 'Combine multiple PDFs into one' },
    { id: 'split', name: 'PDF SPLIT', icon: '◻️', desc: 'Split PDF by page range' },
    { id: 'compress', name: 'PDF COMPRESS', icon: '⬇️', desc: 'Reduce PDF file size' },
    { id: 'pdf-to-jpg', name: 'PDF TO JPG', icon: '🖼️', desc: 'Convert PDF pages to images' },
    { id: 'pdf-to-png', name: 'PDF TO PNG', icon: '🌄', desc: 'Convert PDF pages to PNG' },
    { id: 'jpg-to-pdf', name: 'JPG TO PDF', icon: '📄', desc: 'Convert images to PDF' },
    { id: 'docx-to-pdf', name: 'DOCX TO PDF', icon: '📝', desc: 'Convert Word to PDF' },
    { id: 'pdf-to-docx', name: 'PDF TO DOCX', icon: '✏️', desc: 'Convert PDF to Word' },
    { id: 'rotate', name: 'PDF ROTATE', icon: '🔄', desc: 'Rotate PDF pages' },
    { id: 'unlock', name: 'PDF UNLOCK', icon: '🔓', desc: 'Remove password protection' },
    { id: 'protect', name: 'PDF PROTECT', icon: '🔒', desc: 'Add password protection' },
    { id: 'pdf-to-text', name: 'PDF TO TEXT', icon: '📃', desc: 'Extract text from PDF' },
    { id: 'pdf-editor', name: 'PDF EDITOR', icon: '🖊️', desc: 'Add text annotations' },
    { id: 'delete-pages', name: 'DELETE PAGES', icon: '🗑️', desc: 'Remove pages from a PDF' },
    { id: 'organize', name: 'ORGANIZE', icon: '🧲', desc: 'Reorder, rotate, duplicate, delete pages' },
    { id: 'office-to-pdf', name: 'OFFICE TO PDF', icon: '📊', desc: 'Convert Excel/PPT/OpenOffice to PDF' },
    { id: 'watermark', name: 'WATERMARK', icon: '💧', desc: 'Add a text watermark' },
    { id: 'number-pages', name: 'NUMBER PAGES', icon: '🔢', desc: 'Add page numbers' },
    { id: 'crop', name: 'CROP PDF', icon: '✂️', desc: 'Trim page margins' },
  ];

  async function doLogout() { await logout(); onLogout(); }
</script>

<div class="dash">
  <header class="dash-header">
    <div class="header-left">
      <span class="logo">⚡</span>
      <h1>OFFICETOOLS</h1>
    </div>
    <button class="logout-btn" onclick={doLogout}>EXIT</button>
  </header>
  <section class="tool-grid">
    {#each tools as tool}
      <button class="tool-card" onclick={() => onSelectTool(tool)}>
        <span class="tool-icon">{tool.icon}</span>
        <span class="tool-name">{tool.name}</span>
        <span class="tool-desc">{tool.desc}</span>
      </button>
    {/each}
  </section>
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
  .tool-grid {
    flex: 1; display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem; padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%;
  }
  .tool-card {
    background: var(--card-bg); border: 1px solid rgba(0,255,245,0.15);
    padding: 2rem 1.5rem; text-align: center; cursor: pointer;
    transition: all 0.3s; font-family: inherit;
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  }
  .tool-card:hover {
    border-color: var(--neon-cyan); transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,255,245,0.1);
  }
  .tool-icon { font-size: 2.5rem; }
  .tool-name { font-size: 0.9rem; font-weight: 600; color: var(--neon-cyan); letter-spacing: 0.1em; }
  .tool-desc { font-size: 0.75rem; color: var(--text); opacity: 0.7; }
</style>