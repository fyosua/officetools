<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { auth, checkAuth } from './lib/auth.js';
  import Login from './pages/Login.svelte';
  import Dashboard from './pages/Dashboard.svelte';

  let currentView = $state('loading');

  onMount(async () => {
    try {
      const user = await checkAuth();
      if (user) {
        currentView = 'dashboard';
      } else {
        currentView = 'login';
      }
    } catch {
      currentView = 'login';
    }
  });

  function handleLogin() {
    currentView = 'dashboard';
  }

  function handleLogout() {
    currentView = 'login';
  }
</script>

<div class="cyber-grid"></div>
<div class="scanlines"></div>

<main>
  {#if currentView === 'loading'}
    <div class="loading-screen">
      <div class="loader">
        <span class="loader-text">OFFICETOOLS</span>
        <div class="loader-bar"><div class="loader-fill"></div></div>
      </div>
    </div>
  {:else if currentView === 'login'}
    <Login {handleLogin} />
  {:else}
    <Dashboard {handleLogout} />
  {/if}
</main>
