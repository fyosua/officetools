<script>
  let { onBack, onLogout } = $props();
  import { logout } from '../lib/auth.js';
</script>

<div class="pe">
  <header class="pe-head">
    <button class="pe-back" onclick={onBack}>← Back</button>
    <div class="pe-title"><span class="pe-logo">📦</span><h1>PDF TOOLKIT — full edition</h1></div>
    <button class="pe-logout" onclick={async () => { await logout(); onLogout(); }}>Exit</button>
  </header>
  <div class="pe-frame-wrap">
    <iframe class="pe-frame" src="/pdfcraft/" title="PDF Toolkit" />
  </div>
</div>

<style>
  .pe { display: flex; flex-direction: column; min-height: 100vh; height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-mono); }
  .pe-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.7rem 1.5rem; border-bottom: 1px solid rgba(0,255,245,0.15);
    background: rgba(10,10,15,0.95); flex: 0 0 auto;
  }
  .pe-title { display: flex; align-items: center; gap: 0.75rem; }
  .pe-title h1 { margin: 0; font-size: 1rem; letter-spacing: 0.2em; color: var(--neon-cyan); text-shadow: 0 0 15px rgba(0,255,245,0.3); text-transform: uppercase; }
  .pe-logo { font-size: 1.3rem; }
  .pe-back {
    padding: 0.5rem 1rem; background: transparent; border: 1px solid var(--neon-cyan);
    color: var(--neon-cyan); font-size: 0.7rem; cursor: pointer; font-family: inherit; letter-spacing: 0.1em;
  }
  .pe-back:hover { background: rgba(0,255,245,0.15); }
  .pe-logout {
    padding: 0.5rem 1rem; background: transparent; border: 1px solid var(--neon-magenta);
    color: var(--neon-magenta); font-size: 0.7rem; cursor: pointer; font-family: inherit; letter-spacing: 0.1em;
  }
  .pe-logout:hover { background: rgba(255,0,255,0.1); box-shadow: 0 0 15px rgba(255,0,255,0.2); }
  .pe-frame-wrap { flex: 1 1 auto; min-height: 0; }
  .pe-frame { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
</style>