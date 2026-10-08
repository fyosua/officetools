<script>
  let { images, rotations = $bindable({}), cur = $bindable(0) } = $props();

  function rotateCur() {
    rotations = { ...rotations, [cur + 1]: ((rotations[cur + 1] || 0) + 90) % 360 };
  }
  function prev() { cur = Math.max(0, cur - 1); }
  function next() { cur = Math.min(images.length - 1, cur + 1); }
  const rot = () => rotations[cur + 1] || 0;
</script>

<div class="viewer">
  <button class="nav" aria-label="Previous page" onclick={prev} disabled={cur === 0}>◀</button>
  <div class="stage">
    <img src={images[cur]} alt="Page {cur + 1}" style="transform: rotate({rot()}deg)" />
  </div>
  <button class="nav" aria-label="Next page" onclick={next} disabled={cur >= images.length - 1}>▶</button>
  <div class="controls">
    <span class="page-ind">{cur + 1} / {images.length} · rotated {rot()}°</span>
    <button class="rotate-btn" onclick={rotateCur}>⟳ Rotate page</button>
  </div>
</div>

<style>
  .viewer { display: flex; align-items: stretch; gap: 0.75rem; width: 100%; margin-top: 1.25rem; }
  .stage {
    flex: 1; display: flex; align-items: center; justify-content: center;
    min-height: 46vh; max-height: 62vh; overflow: auto;
    background: #e6e6e6;
    border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; padding: 0.5rem;
  }
  .stage img {
    width: 100%; height: auto; max-width: 460px; max-height: 58vh;
    box-shadow: 0 6px 22px rgba(0,0,0,0.6); background: #fff;
    transition: transform 0.25s ease;
  }
  .nav {
    align-self: center; width: 44px; height: 44px; font-size: 1.2rem; cursor: pointer;
    background: rgba(0,255,245,0.05); border: 1px solid rgba(0,255,245,0.4);
    color: var(--neon-cyan); font-family: inherit;
  }
  .nav:hover:not(:disabled) { background: rgba(0,255,245,0.15); }
  .nav:disabled { opacity: 0.3; cursor: not-allowed; }
  .controls { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; }
  .page-ind { font-size: 0.7rem; color: var(--dim); }
  .rotate-btn {
    padding: 0.55rem 1rem; cursor: pointer; font-family: inherit; font-size: 0.8rem;
    background: rgba(255,0,255,0.08); border: 1px solid var(--neon-magenta); color: var(--neon-magenta);
  }
  .rotate-btn:hover { background: rgba(255,0,255,0.18); }
</style>