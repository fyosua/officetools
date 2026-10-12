<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { checkAuth } from './lib/auth.js';
  import Login from './pages/Login.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import ToolView from './pages/ToolView.svelte';
  // PdfcraftEditor.svelte (thin CLI form) is RETIRED as the user-facing editor path.
  // The white-labeled OfficeTools PDF toolkit (server :3010, AGPL fork) is the editor.
  // The component file is kept on disk for reference only.

  let currentView = $state('loading');
  let activeTool = $state(null);

  onMount(async () => {
    try {
      currentView = (await checkAuth()) ? 'dashboard' : 'login';
    } catch { currentView = 'login'; }
  });

  function handleLogin() { currentView = 'dashboard'; }
  function handleLogout() { currentView = 'login'; }
  function handleSelectTool(tool) { activeTool = tool; currentView = 'tool'; }
  function handleBack() { activeTool = null; currentView = 'dashboard'; }
  // Open the white-labeled OfficeTools PDF toolkit in a new tab (client-side, no upload).
  const PDF_TOOLKIT_PORT = 3010;
  function openPdfcraft() {
    const proto = window.location.protocol === 'https:' ? 'https' : 'http';
    window.open(`${proto}://${window.location.hostname}:${PDF_TOOLKIT_PORT}/en`, '_blank', 'noopener');
  }
</script>

<main>
  {#if currentView === 'loading'}
    <div class="loading-screen"><div class="loader"><span class="loader-text">OFFICETOOLS</span><div class="loader-bar"><div class="loader-fill"></div></div></div></div>
  {:else if currentView === 'login'}
    <Login {handleLogin} />
  {:else if currentView === 'tool' && activeTool}
    <ToolView tool={activeTool} onBack={handleBack} onLogout={handleLogout} />
  {:else}
    <Dashboard onSelectTool={handleSelectTool} onLogout={handleLogout} onOpenPdfcraft={openPdfcraft} />
  {/if}
</main>