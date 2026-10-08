<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { checkAuth } from './lib/auth.js';
  import Login from './pages/Login.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import ToolView from './pages/ToolView.svelte';

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
</script>

<main>
  {#if currentView === 'loading'}
    <div class="loading-screen"><div class="loader"><span class="loader-text">OFFICETOOLS</span><div class="loader-bar"><div class="loader-fill"></div></div></div></div>
  {:else if currentView === 'login'}
    <Login {handleLogin} />
  {:else if currentView === 'tool' && activeTool}
    <ToolView tool={activeTool} onBack={handleBack} onLogout={handleLogout} />
  {:else}
    <Dashboard onSelectTool={handleSelectTool} onLogout={handleLogout} />
  {/if}
</main>