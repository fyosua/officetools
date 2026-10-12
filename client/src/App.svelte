<script>
  import './app.css';
  // Officetools main page is the full PDFCraft toolkit only. The old custom tool
  // grid (Dashboard/ToolView) was removed; old files remain in git history.
  import PdfcraftEditor from './pages/PdfcraftEditor.svelte';
</script>

<main class="app-main">
  <!-- Full PDFCraft toolkit, edge-to-edge, public (no lock). -->
  <PdfcraftEditor />
</main>

<style>
  .app-main { min-height: 100vh; background: var(--bg); }
</style>