<script>
  let { images, items = $bindable([]) } = $props();
  let dragI = $state(null);

  function rot(i) { items[i].rot = ((items[i].rot || 0) + 90) % 360; items = [...items]; }
  function dup(i) { items = [...items.slice(0, i + 1), { ...items[i] }, ...items.slice(i + 1)]; }
  function del(i) { if (items.length > 1) items = items.filter((_, k) => k !== i); }
  function drop(i) {
    if (dragI === null || dragI === i) { dragI = null; return; }
    const a = [...items]; const [m] = a.splice(dragI, 1); a.splice(i, 0, m); items = a; dragI = null;
  }
</script>

<div class="organizer">
  <div class="preview-label">Drag to reorder · ⟳ rotate · ⧉ duplicate · ✕ delete — final page order top→bottom</div>
  <div class="organize-list">
    {#each items as it, i}
      <div class="organize-item" draggable="true"
        ondragstart={() => (dragI = i)}
        ondragover={(e) => e.preventDefault()}
        ondrop={() => drop(i)}>
        <img src={images[it.src - 1]} alt="page {it.src}" style="transform: rotate({it.rot || 0}deg)" />
        <div class="organize-actions">
          <button title="Rotate" onclick={() => rot(i)}>⟳</button>
          <button title="Duplicate" onclick={() => dup(i)}>⧉</button>
          <button title="Delete" onclick={() => del(i)}>✕</button>
        </div>
        <span class="thumb-label">{i + 1}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .organizer { width: 100%; margin-top: 1.25rem; }
  .organize-list { display: flex; flex-direction: column; gap: 0.6rem; }
  .organize-item {
    position: relative; display: flex; align-items: center; gap: 0.75rem;
    background: rgba(0,0,0,0.35); border: 1px solid rgba(0,255,245,0.22); padding: 0.5rem;
    border-radius: 6px; cursor: grab; user-select: none;
  }
  .organize-item:active { cursor: grabbing; }
  .organize-item img { width: 110px; height: auto; background: #fff; box-shadow: 0 3px 10px rgba(0,0,0,0.5); }
  .organize-actions { display: flex; gap: 0.4rem; }
  .organize-actions button {
    width: 30px; height: 30px; cursor: pointer; font-family: inherit; font-size: 0.9rem;
    background: rgba(0,255,245,0.06); border: 1px solid rgba(0,255,245,0.35); color: var(--neon-cyan); border-radius: 4px;
  }
  .organize-actions button:hover { background: rgba(0,255,245,0.18); }
  .organize-actions button:nth-child(3) { border-color: var(--neon-magenta); color: var(--neon-magenta); }
  .organize-actions button:nth-child(3):hover { background: rgba(255,0,255,0.18); }
</style>