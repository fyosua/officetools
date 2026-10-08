<script>
  let { handleLogin } = $props();
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  import { login } from '../lib/auth.js';

  async function submit(e) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      await login(password);
      handleLogin();
    } catch (err) {
      error = err.message || 'Invalid password';
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <form class="login-card" onsubmit={submit}>
    <div class="login-header">
      <span class="login-icon">⚡</span>
      <h1>OFFICETOOLS</h1>
      <p class="login-subtitle">// ACCESS TERMINAL v1.0</p>
    </div>

    <div class="input-group">
      <label for="password" class="input-label">AUTH_KEY</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        placeholder="············"
        class="cyber-input"
        disabled={loading}
      />
    </div>

    {#if error}
      <div class="error-msg">
        <span class="error-icon">!</span> {error}
      </div>
    {/if}

    <button type="submit" class="cyber-button" disabled={loading}>
      {#if loading}
        <span class="btn-spinner"></span> AUTHENTICATING...
      {:else}
        {">>_ ENTER_SYSTEM"}
      {/if}
    </button>
  </form>
</div>

<style>
  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
  }

  .login-card {
    background: var(--card-bg);
    border: 1px solid var(--neon-cyan);
    padding: 3rem;
    width: 100%;
    max-width: 440px;
    position: relative;
    box-shadow: 0 0 30px rgba(0, 255, 245, 0.1), inset 0 0 30px rgba(0, 255, 245, 0.03);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .login-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .login-card h1 {
    margin: 0;
    font-size: 1.8rem;
    letter-spacing: 0.3em;
    color: var(--neon-cyan);
    text-shadow: 0 0 20px rgba(0, 255, 245, 0.5);
  }

  .login-subtitle {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: var(--neon-magenta);
    letter-spacing: 0.15em;
    font-family: 'Courier New', monospace;
  }

  .input-group {
    margin-bottom: 1.5rem;
  }

  .input-label {
    display: block;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: var(--neon-cyan);
    margin-bottom: 0.5rem;
    opacity: 0.8;
  }

  .cyber-input {
    width: 100%;
    padding: 0.9rem 1rem;
    background: rgba(0, 255, 245, 0.05);
    border: 1px solid rgba(0, 255, 245, 0.3);
    color: var(--text);
    font-size: 1rem;
    font-family: 'Courier New', monospace;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .cyber-input:focus {
    border-color: var(--neon-cyan);
    box-shadow: 0 0 15px rgba(0, 255, 245, 0.2);
    background: rgba(0, 255, 245, 0.08);
  }

  .cyber-input::placeholder {
    color: rgba(224, 224, 224, 0.2);
  }

  .cyber-button {
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: 1px solid var(--neon-cyan);
    color: var(--neon-cyan);
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    cursor: pointer;
    transition: all 0.3s;
    font-family: 'Courier New', monospace;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .cyber-button:hover:not(:disabled) {
    background: rgba(0, 255, 245, 0.1);
    box-shadow: 0 0 20px rgba(0, 255, 245, 0.3);
  }

  .cyber-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top-color: var(--neon-cyan);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-msg {
    background: rgba(255, 0, 255, 0.1);
    border: 1px solid var(--neon-magenta);
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.8rem;
    color: var(--neon-magenta);
    font-family: 'Courier New', monospace;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .error-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: var(--neon-magenta);
    color: #0a0a0f;
    font-weight: bold;
    font-size: 0.7rem;
  }
</style>