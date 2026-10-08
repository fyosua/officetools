<script>
  let { handleLogout } = $props();
  import { logout } from '../lib/auth.js';
  import { processFile } from '../lib/api.js';
  import ToolCard from '../components/ToolCard.svelte';

  let tools = $state([
    { id: 'merge', name: 'PDF MERGE', icon: '⬜', description: 'Combine multiple PDFs', acceptFiles: true },
    { id: 'split', name: 'PDF SPLIT', icon: '◻️', description: 'Split PDF by page range', acceptFiles: true },
    { id: 'compress', name: 'PDF COMPRESS', icon: '⬇️', description: 'Reduce file size', acceptFiles: true },
    { id: 'pdf-to-jpg', name: 'PDF TO JPG', icon: '🖼️', description: 'Convert pages to images', acceptFiles: true },
    { id: 'jpg-to-pdf', name: 'JPG TO PDF', icon: '📄', description: 'Convert images to PDF', acceptFiles: true },
    { id: 'docx-to-pdf', name: 'DOCX TO PDF', icon: '📝', description: 'Word to PDF', acceptFiles: true },
    { id: 'pdf-to-docx', name: 'PDF TO DOCX', icon: '✏️', description: 'PDF to Word', acceptFiles: true },
    { id: 'rotate', name: 'PDF ROTATE', icon: '🔄', description: 'Rotate pages', acceptFiles: true },
    { id: 'unlock', name: 'PDF UNLOCK', icon: '🔓', description: 'Remove password', acceptFiles: true },
    { id: 'protect', name: 'PDF PROTECT', icon: '🔒', description: 'Add password', acceptFiles: true },
    { id: 'pdf-to-text', name: 'PDF TO TEXT', icon: '📃', description: 'Extract text', acceptFiles: true },
    { id: 'pdf-editor', name: 'PDF EDITOR', icon: '🖊️', description: 'Add annotations', acceptFiles: true },
  ]);

  async function handleToolRun(toolId, input) {
    const formData = new FormData();
    formData.append('input', input);
    return await processFile(`/api/${toolId}`, formData);
  }

  async function doLogout() {
    await logout();
    handleLogout();
  }
</script>

<div class="dashboard">
  <header class="dash-header">
    <div class="header-left">
      <span class="header-logo">⚡</span>
      <h1>OFFICETOOLS</h1>
      <span class="header-version">v1.0</span>
    </div>
    <nav class="header-nav">
      <span class="status-dot"></span>
      <span class="status-text">SYSTEM ONLINE</span>
      <button class="logout-btn" onclick={doLogout}>EXIT</button>
    </nav>
  </header>

  <section class="tool-grid">
    {#each tools as tool}
      <ToolCard {tool} onRun={handleToolRun} />
    {/each}
  </section>

  <footer class="dash-footer">
    <span>OFFICETOOLS // {new Date().getFullYear()}</span>
    <span class="footer-blink">█</span>
  </footer>
</div>

<style>
  .dashboard {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .dash-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba(0, 255, 245, 0.15);
    background: rgba(10, 10, 15, 0.95);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-logo {
    font-size: 1.5rem;
  }

  .dash-header h1 {
    margin: 0;
    font-size: 1.2rem;
    letter-spacing: 0.25em;
    color: var(--neon-cyan);
    text-shadow: 0 0 15px rgba(0, 255, 245, 0.3);
  }

  .header-version {
    font-size: 0.65rem;
    color: var(--neon-magenta);
    font-family: 'Courier New', monospace;
    opacity: 0.7;
  }

  .header-nav {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    background: #00ff00;
    border-radius: 50%;
    animation: pulse-dot 2s ease-in-out infinite;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .status-text {
    font-size: 0.7rem;
    color: #00ff00;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
  }

  .logout-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--neon-magenta);
    color: var(--neon-magenta);
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.3s;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
  }

  .logout-btn:hover {
    background: rgba(255, 0, 255, 0.1);
    box-shadow: 0 0 15px rgba(255, 0, 255, 0.2);
  }

  .tool-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.25rem;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .dash-footer {
    padding: 1rem 2rem;
    border-top: 1px solid rgba(0, 255, 245, 0.1);
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text);
    opacity: 0.4;
    font-family: 'Courier New', monospace;
  }

  .footer-blink {
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }
</style>