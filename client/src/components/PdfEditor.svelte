<script>
  let { images, annos = $bindable([]), imgFiles = $bindable([]), apply = () => {} } = $props();
  let cur = $state(0);
  let tool = $state('text');
  let dispW = $state(0), dispH = $state(0);
  let drawing = $state(false), pts = $state([]);
  let box = $state(null);
  let pendingText = $state(null); // {x,y}
  let txtInput = $state('');
  let signText = $state('Approved');
  let pendingImg = $state(null);  // imgFiles index waiting to be placed
  let stageEl, imgRef;

  function measure() { const r = stageEl.getBoundingClientRect(); dispW = r.width; dispH = r.height; }
  function norm(e) { const r = stageEl.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }
  function add(a) { annos = [...annos, { ...a, p: a.p ?? cur + 1 }]; }

  function onDown(e) {
    const n = norm(e);
    if (tool === 'draw') { drawing = true; pts = [n]; e.preventDefault(); }
    else if (tool === 'highlight') { box = { ...n, w: 0, h: 0 }; e.preventDefault(); }
    else if (tool === 'text') { pendingText = { x: n.x, y: n.y }; txtInput = ''; }
    else if (tool === 'sign') { if (signText) add({ type: 'sign', x: n.x, y: n.y, text: signText, color: '#1a1ae0', size: 0.09 }); }
    else if (tool === 'image') { if (pendingImg !== null) { add({ type: 'image', x: n.x, y: n.y, w: 0.3, imgIdx: pendingImg }); pendingImg = null; } }
  }
  function onMove(e) {
    if (drawing) pts = [...pts, norm(e)];
    else if (box) { const n = norm(e); box = { x: Math.min(box.x, n.x), y: Math.min(box.y, n.y), w: Math.abs(n.x - box.x), h: Math.abs(n.y - box.y) }; }
  }
  function onUp() {
    if (drawing) { drawing = false; if (pts.length > 1) add({ type: 'draw', points: pts, color: '#d81b60', width: 0.003 }); pts = []; }
    else if (box) { add({ type: 'highlight', x: box.x, y: box.y, w: box.w, h: box.h, color: '#ffe08a', opacity: 0.5 }); box = null; }
  }
  function commitText() {
    if (pendingText && txtInput) add({ type: 'text', x: pendingText.x, y: pendingText.y, text: txtInput, color: '#000000', size: 0.03 });
    pendingText = null;
  }
  function onImgChosen(e) {
    const f = e.target?.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    imgFiles = [...imgFiles, { file: f, url }];
    pendingImg = imgFiles.length - 1;
    tool = 'image';
    e.target.value = '';
  }
  function clearAll() { annos = []; imgFiles = []; pendingImg = null; }
  const curAnnos = () => annos.filter((a) => a.p === cur + 1);
  const PX = (n) => (n || 0) * dispW, PY = (n) => (n || 0) * dispH;
</script>

<div class="editor">
  <div class="toolbar">
    <button class:active={tool === 'text'} onclick={() => (tool = 'text')}>Text</button>
    <button class:active={tool === 'highlight'} onclick={() => (tool = 'highlight')}>Highlight</button>
    <button class:active={tool === 'draw'} onclick={() => (tool = 'draw')}>Draw</button>
    <button class:active={tool === 'sign'} onclick={() => (tool = 'sign')}>Sign</button>
    <button class:active={tool === 'image'} onclick={() => imgRef?.click()}>Image</button>
    <span class="sign-input">✍ <input placeholder="signature text" bind:value={signText} /></span>
    <input type="file" bind:this={imgRef} accept=".png,.jpg,.jpeg,.gif,.webp" onchange={onImgChosen} style="display:none" />
    <button class="apply" onclick={apply}>Apply</button>
    <button class="clear" onclick={clearAll}>Clear</button>
  </div>

  <div class="stage-wrap">
    <button class="nav" disabled={cur === 0} onclick={() => (cur--)}>◀</button>
    <div class="stage" bind:this={stageEl}
      onpointerdown={(e) => onDown(e)}
      onpointermove={(e) => onMove(e)}
      onpointerup={onUp}
      onpointercancel={onUp}>
      <img src={images[cur]} alt="page {cur + 1}" onload={measure} draggable="false" />
      {#each curAnnos() as a}
        {#if a.type === 'text' || a.type === 'sign'}
          <span class="anno-text" style="left:{PX(a.x)}px;top:{PY(a.y)}px;color:{a.color};font-size:{a.size * dispW}px;">{a.text}</span>
        {:else if a.type === 'highlight'}
          <div class="anno-hl" style="left:{PX(a.x)}px;top:{PY(a.y)}px;width:{PX(a.w)}px;height:{PY(a.h)}px;background:{a.color};"></div>
        {:else if a.type === 'draw'}
          <svg class="anno-svg" width={dispW} height={dispH}>
            <polyline fill="none" stroke={a.color} stroke-width={a.width * dispW} points={a.points.map((p) => `${PX(p[0])},${PY(p[1])}`).join(' ')} />
          </svg>
        {:else if a.type === 'image'}
          <img class="anno-image" src={imgFiles[a.imgIdx]?.url} style="left:{PX(a.x)}px;top:{PY(a.y)}px;width:{PX(a.w)}px;" alt="" />
        {/if}
      {/each}
      {#if drawing}
        <svg class="anno-svg" width={dispW} height={dispH}>
          <polyline fill="none" stroke="#d81b60" stroke-width={0.003 * dispW} points={pts.map((p) => `${PX(p.x)},${PY(p.y)}`).join(' ')} />
        </svg>
      {/if}
      {#if box}
        <div class="anno-hl" style="left:{PX(box.x)}px;top:{PY(box.y)}px;width:{PX(box.w)}px;height:{PY(box.h)}px;background:rgba(255,224,138,0.5);"></div>
      {/if}
      {#if pendingText}
        <div class="text-input" style="left:{PX(pendingText.x)}px;top:{PY(pendingText.y)}px;">
          <input bind:value={txtInput} placeholder="type…" onkeydown={(e) => e.key === 'Enter' && commitText()} />
          <button onclick={commitText}>✓</button>
        </div>
      {/if}
    </div>
    <button class="nav" disabled={cur >= images.length - 1} onclick={() => (cur++)}>▶</button>
  </div>
  <div class="page-ind">{cur + 1} / {images.length}</div>
</div>

<style>
  .editor { width: 100%; }
  .toolbar { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; align-items: center; }
  .toolbar button {
    padding: 0.4rem 0.7rem; cursor: pointer; font-family: inherit; font-size: 0.75rem;
    background: rgba(0,0,0,0.3); border: 1px solid rgba(0,255,245,0.3); color: var(--text); border-radius: 4px;
  }
  .toolbar button.active { border-color: var(--neon-magenta); color: var(--neon-magenta); }
  .toolbar button.apply { border-color: var(--neon-cyan); color: var(--neon-cyan); }
  .toolbar button.clear { border-color: var(--neon-magenta); color: var(--neon-magenta); }
  .sign-input { display: flex; align-items: center; gap: 0.3rem; font-size: 0.7rem; color: var(--dim); }
  .sign-input input { width: 110px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,255,245,0.2); color: var(--text); padding: 0.3rem; }
  .stage-wrap { display: flex; align-items: center; gap: 0.6rem; }
  .stage {
    position: relative; flex: 1; min-height: 46vh; overflow: hidden; cursor: crosshair;
    background: #e6e6e6; border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; touch-action: none;
  }
  .stage img { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
  .anno-text { position: absolute; transform: translateY(-100%); font-family: sans-serif; white-space: nowrap; pointer-events: none; }
  .anno-hl { position: absolute; opacity: 0.5; pointer-events: none; }
  .anno-image { position: absolute; pointer-events: none; }
  .anno-svg { position: absolute; inset: 0; pointer-events: none; }
  .text-input { position: absolute; display: flex; gap: 0.2rem; z-index: 5; }
  .text-input input { padding: 0.3rem; font-size: 0.85rem; border: 1px solid var(--neon-cyan); background: #111; color: #fff; }
  .text-input button { padding: 0.3rem 0.5rem; cursor: pointer; border: 1px solid var(--neon-cyan); background: #111; color: var(--neon-cyan); }
  .nav { width: 40px; height: 40px; font-size: 1.1rem; cursor: pointer; background: rgba(0,255,245,0.05); border: 1px solid rgba(0,255,245,0.4); color: var(--neon-cyan); }
  .nav:disabled { opacity: 0.3; cursor: not-allowed; }
  .page-ind { margin-top: 0.5rem; font-size: 0.7rem; color: var(--dim); text-align: center; }
</style>