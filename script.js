document.addEventListener('DOMContentLoaded', () => {
  const codeInput = document.getElementById('codeInput');
  const lineNumbers = document.getElementById('lineNumbers');
  const editorCursor = document.getElementById('editorCursor');
  const languageSelect = document.getElementById('languageSelect');
  const editorFilename = document.getElementById('editorFilename');
  const extensionByLanguage = { cpp: 'cpp', python: 'py', java: 'java' };
  const analyzeButton = document.getElementById('analyzeButton');
  const coachStatus = document.getElementById('coachStatus');
  const coachFeedback = document.getElementById('coachFeedback');
  const algorithmSelect = document.getElementById('algorithmSelect');
  const simulateButton = document.getElementById('simulateButton');
  const canvas = document.getElementById('visualizerCanvas');
  const placeholder = document.getElementById('canvasPlaceholder');

  function updateLineNumbers() {
    const count = Math.max(1, codeInput.value.split('\n').length);
    lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join('\n');
    lineNumbers.scrollTop = codeInput.scrollTop;
  }

  codeInput.addEventListener('input', updateLineNumbers);
  codeInput.addEventListener('scroll', updateLineNumbers);
  codeInput.addEventListener('focus', () => editorCursor.classList.remove('hidden'));
  codeInput.addEventListener('blur', () => editorCursor.classList.add('hidden'));
  languageSelect.addEventListener('change', () => { editorFilename.textContent = `solution.${extensionByLanguage[languageSelect.value]}`; });
  updateLineNumbers();

  document.querySelectorAll('.stat-counter').forEach((counter) => {
    const target = Number(counter.dataset.target);
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      counter.textContent = Math.floor(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // --- Codeforces Practice Tag Detector ---
  // Scans the submitted code for keyword patterns and maps the strongest
  // match to a real Codeforces problemset tag. Order matters: more specific
  // patterns are checked before generic ones.
  const CF_TAG_RULES = [
    { tag: 'dp', label: 'Dynamic Programming', icon: 'fa-layer-group', test: /\b(dp\s*\[|memo(?:iz)?|tabulation|dynamic programming)\b/i },
    { tag: 'graphs', label: 'Graphs', test: /\b(dijkstra|bellman[- ]?ford|floyd[- ]?warshall|adjacency|graph)\b/i, icon: 'fa-diagram-project' },
    { tag: 'dfs and similar', label: 'DFS / Traversal', test: /\b(dfs|depth[-_ ]?first)\b/i, icon: 'fa-route' },
    { tag: 'shortest paths', label: 'BFS / Shortest Path', test: /\b(bfs|breadth[-_ ]?first|shortest[-_ ]?path)\b/i, icon: 'fa-route' },
    { tag: 'binary search', label: 'Binary Search', test: /\b(binary search|lower_bound|upper_bound|bsearch|binsearch)\b/i, icon: 'fa-magnifying-glass' },
    { tag: 'two pointers', label: 'Two Pointers / Sliding Window', test: /\b(two[- _]?pointer|sliding[- _]?window)\b/i, icon: 'fa-arrows-left-right' },
    { tag: 'trees', label: 'Trees / Segment Structures', test: /\b(segment tree|segtree|fenwick|binary indexed tree|trie|lca)\b/i, icon: 'fa-sitemap' },
    { tag: 'dsu', label: 'Disjoint Set Union', test: /\b(dsu|union[- _]?find|disjoint set)\b/i, icon: 'fa-object-ungroup' },
    { tag: 'greedy', label: 'Greedy', test: /\bgreedy\b/i, icon: 'fa-hand-holding-hand' },
    { tag: 'sortings', label: 'Sorting', test: /\b(\.sort\(|std::sort|sort\(|mergesort|quicksort|qsort|bubble\s*sort|insertion\s*sort|selection\s*sort|\bswap\s*\()\b/i, icon: 'fa-arrow-down-1-9' },
    { tag: 'math', label: 'Math', test: /\b(gcd|lcm|mod\s*pow|modpow|sieve|prime)\b/i, icon: 'fa-square-root-variable' },
  ];

  function detectCodeforcesTag(code) {
    for (const rule of CF_TAG_RULES) {
      if (rule.test.test(code)) return rule;
    }
    return null;
  }

  // Fallback: if the raw code has no literal keyword match (e.g. a hand-written
  // bubble/insertion sort with no "sort(" call, or an algorithm implemented
  // without any of our tracked keywords), fall back to scanning the AI
  // coach's own analysis text — it almost always names the pattern in plain
  // English even when the code itself doesn't.
  function detectCodeforcesTagFromFeedback(data) {
    const text = [
      data.logicAnalysis,
      ...(Array.isArray(data.edgeCases) ? data.edgeCases : []),
      ...(Array.isArray(data.optimization) ? data.optimization : []),
      ...(Array.isArray(data.hints) ? data.hints : []),
      data.complexity && data.complexity.explanation,
    ].filter(Boolean).join(' ');
    return detectCodeforcesTag(text);
  }

  function renderTagArenaCard(rule) {
    if (!rule) return '';
    const url = `https://codeforces.com/problemset?tags=${encodeURIComponent(rule.tag)}`;
    return `
      <a href="${url}" target="_blank" rel="noopener noreferrer"
         class="group relative block overflow-hidden rounded-lg border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 via-slate-900/40 to-violet-500/10 p-3.5 shadow-[0_0_18px_rgba(34,211,238,0.10)] transition-all duration-300 hover:border-cyan-300/60 hover:shadow-[0_0_26px_rgba(34,211,238,0.28)]">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]">
              <i class="fa-solid ${rule.icon}"></i>
            </span>
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-300">Practice Tag Arena</h4>
              <p class="text-sm font-semibold text-white">${rule.label}</p>
            </div>
          </div>
          <span class="flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-slate-950/60 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition-transform duration-300 group-hover:translate-x-0.5">
            Practice on Codeforces <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </span>
        </div>
      </a>
    `;
  }

  // Connect Frontend to Python Flask Backend
  analyzeButton.addEventListener('click', async () => {
    console.log('[CodeVision] analyzeButton click handler fired');

    const code = codeInput.value;
    const language = languageSelect.value;
    console.log('[CodeVision] language =', language, '| code length =', code.length);

    if (!code.trim()) {
      console.log('[CodeVision] blocked: code input is empty, showing alert and returning');
      alert("Please paste some code first!");
      return;
    }

    // Set Loading State
    coachStatus.textContent = 'Analyzing';
    coachStatus.className = 'rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300';
    coachFeedback.innerHTML = '<div class="flex items-center gap-3 text-slate-300"><i class="fa-solid fa-brain animate-pulse text-cyan-300"></i><span>Reviewing your approach via CodeVision Server...</span></div>';
    console.log('[CodeVision] loading state set, about to call fetch()');

    try {
      console.log('[CodeVision] fetch() call starting -> http://127.0.0.1:5000/api/analyze');
      const response = await fetch('http://127.0.0.1:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code, language: language })
      });
      console.log('[CodeVision] fetch() resolved, HTTP status =', response.status, response.ok ? '(ok)' : '(not ok)');

      const data = await response.json();
      console.log('[CodeVision] response body parsed as JSON:', data);

      if (!response.ok) {
        console.log('[CodeVision] response.ok is false, throwing to catch block');
        throw new Error(data.error || "Server Error");
      }

      console.log('[CodeVision] success path: rendering feedback into coachFeedback');
      coachStatus.textContent = 'Reviewed';
      coachStatus.className = 'rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300';

      const detectedTag = detectCodeforcesTag(code) || detectCodeforcesTagFromFeedback(data);
      console.log('[CodeVision] detected Codeforces tag:', detectedTag ? detectedTag.tag : 'none');

      coachFeedback.innerHTML = `
        <div class="space-y-4 text-slate-300 text-sm">
          <div class="p-3 bg-slate-900/50 rounded border border-slate-800">
            <h4 class="text-cyan-400 font-bold mb-1">💡 Logic Analysis:</h4>
            <p>${data.logicAnalysis}</p>
          </div>
          <div class="p-3 bg-slate-900/50 rounded border border-slate-800">
            <h4 class="text-amber-400 font-bold mb-1">⚠️ Edge Cases to Consider:</h4>
            <ul class="list-disc pl-4 space-y-1">${data.edgeCases.map(e => `<li>${e}</li>`).join('')}</ul>
          </div>
          <div class="p-3 bg-slate-900/50 rounded border border-slate-800">
            <h4 class="text-indigo-400 font-bold mb-1">📊 Complexity:</h4>
            <p><b>Time:</b> ${data.complexity.time} | <b>Space:</b> ${data.complexity.space}</p>
            <p class="text-xs text-slate-400 mt-1">${data.complexity.explanation}</p>
          </div>
          <div class="p-3 bg-slate-900/50 rounded border border-slate-800">
            <h4 class="text-emerald-400 font-bold mb-1">🚀 Optimization Suggestions:</h4>
            <ul class="list-disc pl-4 space-y-1">${data.optimization.map(o => `<li>${o}</li>`).join('')}</ul>
          </div>
          ${renderTagArenaCard(detectedTag)}
        </div>
      `;

    } catch (error) {
      console.error('[CodeVision] caught error in analyze handler:', error);
      coachStatus.textContent = 'Error';
      coachStatus.className = 'rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-300';
      coachFeedback.innerHTML = `<span class="text-rose-400">❌ Error: ${error.message}</span>`;
    }
  });

  algorithmSelect.addEventListener('change', () => {
    simulateButton.innerHTML = `<i class="fa-solid fa-play"></i> Simulate ${algorithmSelect.options[algorithmSelect.selectedIndex].text}`;
  });

  /* =========================================================================
     ALGORITHM SIMULATION ENGINE
     A single canvas-driven state machine. Selecting an algorithm + clicking
     "Simulate" cancels whatever is currently animating and boots a fresh run.
     Two render "modes" share the canvas: graph mode (BFS/DFS/Dijkstra) and
     array mode (Binary Search/Sliding Window).
     ========================================================================= */

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let STEP_MS = 500; // time each discrete algorithm step stays on screen (live-tunable via #speedSlider)

  // --- Animation Speed Control ---
  const speedSlider = document.getElementById('speedSlider');
  const speedValue = document.getElementById('speedValue');
  if (speedSlider && speedValue) {
    speedSlider.value = String(STEP_MS);
    speedValue.textContent = `${STEP_MS}ms`;
    speedSlider.addEventListener('input', () => {
      STEP_MS = Number(speedSlider.value);
      speedValue.textContent = `${STEP_MS}ms`;
      // Re-anchor the currently running simulation so the step it's mid-way
      // through doesn't jump/skip when the step duration changes.
      if (sim.algorithm && sim.rafId) {
        const elapsedSteps = (performance.now() - sim.startedAt) / previousStepMs;
        sim.startedAt = performance.now() - elapsedSteps * STEP_MS;
      }
      previousStepMs = STEP_MS;
    });
  }
  let previousStepMs = STEP_MS;

  // --- Shared graph model (positions are normalized 0..1 within the canvas) ---
  const graphNodes = [[0.16, 0.63], [0.34, 0.30], [0.48, 0.68], [0.66, 0.36], [0.84, 0.61]];
  const graphEdgesWeighted = [
    { from: 0, to: 1, w: 4 },
    { from: 0, to: 2, w: 1 },
    { from: 1, to: 2, w: 2 },
    { from: 1, to: 3, w: 7 },
    { from: 2, to: 3, w: 3 },
    { from: 2, to: 4, w: 9 },
    { from: 3, to: 4, w: 2 },
  ];

  function buildAdjacency(edges) {
    const adj = new Map();
    edges.forEach(({ from, to, w }) => {
      if (!adj.has(from)) adj.set(from, []);
      if (!adj.has(to)) adj.set(to, []);
      adj.get(from).push({ node: to, w });
      adj.get(to).push({ node: from, w });
    });
    // keep neighbor order deterministic (ascending node id)
    adj.forEach((list) => list.sort((a, b) => a.node - b.node));
    return adj;
  }
  const adjacency = buildAdjacency(graphEdgesWeighted);

  function computeBFSLayers(start) {
    const visited = new Set([start]);
    const layers = [[start]];
    let frontier = [start];
    while (frontier.length) {
      const next = [];
      frontier.forEach((node) => {
        (adjacency.get(node) || []).forEach(({ node: neighbor }) => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            next.push(neighbor);
          }
        });
      });
      if (next.length) layers.push(next);
      frontier = next;
    }
    return layers;
  }

  function computeDFSOrder(start) {
    const visited = new Set();
    const order = [];
    const edgeTrail = [];
    function walk(node, parent) {
      visited.add(node);
      order.push(node);
      if (parent !== null) edgeTrail.push([parent, node]);
      (adjacency.get(node) || []).forEach(({ node: neighbor }) => {
        if (!visited.has(neighbor)) walk(neighbor, node);
      });
    }
    walk(start, null);
    return { order, edgeTrail };
  }

  function computeDijkstra(start, end) {
    const dist = new Map();
    const prev = new Map();
    const visited = new Set();
    graphNodes.forEach((_, i) => dist.set(i, Infinity));
    dist.set(start, 0);

    while (visited.size < graphNodes.length) {
      let current = null;
      let best = Infinity;
      dist.forEach((d, node) => {
        if (!visited.has(node) && d < best) { best = d; current = node; }
      });
      if (current === null) break;
      visited.add(current);
      (adjacency.get(current) || []).forEach(({ node: neighbor, w }) => {
        const candidate = dist.get(current) + w;
        if (candidate < dist.get(neighbor)) {
          dist.set(neighbor, candidate);
          prev.set(neighbor, current);
        }
      });
    }

    const path = [end];
    let walker = end;
    while (prev.has(walker)) {
      walker = prev.get(walker);
      path.unshift(walker);
    }
    return { path, totalWeight: dist.get(end) };
  }

  // --- Array-based demo data ---
  const binaryArray = [3, 7, 12, 18, 24, 31, 39, 45, 52, 60, 68, 77];
  const binaryTarget = 45;
  function generateBinarySearchSteps(arr, target) {
    const steps = [];
    let low = 0, high = arr.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const found = arr[mid] === target;
      steps.push({ low, high, mid, found });
      if (found) break;
      if (arr[mid] < target) low = mid + 1; else high = mid - 1;
    }
    return steps;
  }

  const windowArray = [4, 2, 2, 7, 8, 1, 2, 8, 1, 0];
  const windowTarget = 15;
  function generateSlidingWindowSteps(arr, target) {
    const steps = [];
    let left = 0, sum = 0, bestLen = Infinity, bestLeft = -1, bestRight = -1;
    for (let right = 0; right < arr.length; right += 1) {
      sum += arr[right];
      steps.push({ left, right, sum, action: 'expand' });
      while (sum >= target) {
        if (right - left + 1 < bestLen) {
          bestLen = right - left + 1;
          bestLeft = left;
          bestRight = right;
        }
        steps.push({ left, right, sum, action: 'record', bestLeft, bestRight });
        sum -= arr[left];
        left += 1;
        if (sum >= target || left <= right) {
          steps.push({ left, right, sum, action: 'shrink' });
        }
      }
    }
    steps.push({ left, right: arr.length - 1, sum, action: 'done', bestLeft, bestRight });
    return steps;
  }

  // --- Simulation state machine ---
  const sim = {
    algorithm: null,      // 'bfs' | 'dfs' | 'dijkstra' | 'binary-search' | 'sliding-window' | null (idle)
    mode: null,           // 'graph' | 'array' | null
    startedAt: 0,
    rafId: null,
    data: null,
  };

  function stopSimulation() {
    if (sim.rafId) cancelAnimationFrame(sim.rafId);
    sim.rafId = null;
  }

  function prepareSimulation(algorithm) {
    stopSimulation();
    sim.algorithm = algorithm;
    sim.startedAt = performance.now();

    if (algorithm === 'bfs') {
      sim.mode = 'graph';
      sim.data = { layers: computeBFSLayers(0) };
    } else if (algorithm === 'dfs') {
      sim.mode = 'graph';
      sim.data = computeDFSOrder(0);
    } else if (algorithm === 'dijkstra') {
      sim.mode = 'graph';
      sim.data = computeDijkstra(0, 4);
    } else if (algorithm === 'binary-search') {
      sim.mode = 'array';
      sim.data = { steps: generateBinarySearchSteps(binaryArray, binaryTarget), arr: binaryArray, target: binaryTarget };
    } else if (algorithm === 'sliding-window') {
      sim.mode = 'array';
      sim.data = { steps: generateSlidingWindowSteps(windowArray, windowTarget), arr: windowArray, target: windowTarget };
    }
  }

  // --- Canvas helpers ---
  function getCtx() {
    const bounds = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.width * scale));
    const height = Math.max(1, Math.round(bounds.height * scale));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    return { ctx, bounds };
  }

  function toPoint([x, y], bounds) { return [x * bounds.width, y * bounds.height]; }

  function drawNode(ctx, [x, y], { active = false, color = '#8b5cf6', label = '', radius = 6.5, glow = 9 } = {}) {
    ctx.save();
    ctx.shadowColor = active ? 'rgba(34, 211, 238, 0.9)' : `${color}99`;
    ctx.shadowBlur = active ? glow + 6 : glow;
    ctx.fillStyle = active ? '#22d3ee' : color;
    ctx.beginPath();
    ctx.arc(x, y, active ? radius + 1.5 : radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (label !== '') {
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      ctx.font = '10px Inter';
      ctx.fillText(label, x - 3, y + 3.5);
    }
  }

  function drawEdge(ctx, p1, p2, { color = 'rgba(148, 163, 184, 0.20)', width = 1.3, dashOffset = 0, dashed = true } = {}) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dashed ? [5, 9] : []);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawEdgeLabel(ctx, p1, p2, text) {
    const mx = (p1[0] + p2[0]) / 2;
    const my = (p1[1] + p2[1]) / 2;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(mx - 9, my - 8, 18, 13);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.font = '9px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(text, mx, my + 2);
    ctx.textAlign = 'left';
  }

  function drawEmptyState(ctx, bounds, text) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(text, bounds.width / 2, bounds.height / 2);
    ctx.textAlign = 'left';
  }

  // --- Idle / default graph render (used before any simulation runs) ---
  function renderIdleGraph(ctx, bounds, time) {
    graphEdgesWeighted.forEach(({ from, to }, index) => {
      const p1 = toPoint(graphNodes[from], bounds);
      const p2 = toPoint(graphNodes[to], bounds);
      drawEdge(ctx, p1, p2, {
        color: index < 4 ? 'rgba(34, 211, 238, 0.34)' : 'rgba(148, 163, 184, 0.20)',
        dashOffset: prefersReducedMotion ? 0 : -time / 55,
      });
    });
    graphNodes.forEach((node, index) => {
      drawNode(ctx, toPoint(node, bounds), { active: index === 2, label: String(index + 1) });
    });
  }

  // --- BFS render: reveal layer by layer, glowing outward ---
  function renderBFS(ctx, bounds, time) {
    const { layers } = sim.data;
    const elapsed = time - sim.startedAt;
    const layerIndex = Math.min(layers.length - 1, Math.floor(elapsed / STEP_MS));
    const visited = new Set();
    for (let i = 0; i <= layerIndex; i += 1) layers[i].forEach((n) => visited.add(n));
    const currentLayer = new Set(layers[layerIndex]);
    const pulse = prefersReducedMotion ? 1 : 0.6 + 0.4 * Math.sin(time / 180);

    graphEdgesWeighted.forEach(({ from, to }) => {
      const bothVisited = visited.has(from) && visited.has(to);
      const p1 = toPoint(graphNodes[from], bounds);
      const p2 = toPoint(graphNodes[to], bounds);
      drawEdge(ctx, p1, p2, {
        color: bothVisited ? 'rgba(34, 211, 238, 0.55)' : 'rgba(148, 163, 184, 0.15)',
        dashOffset: prefersReducedMotion ? 0 : -time / 55,
      });
    });
    graphNodes.forEach((node, index) => {
      const isCurrent = currentLayer.has(index);
      const isVisited = visited.has(index);
      drawNode(ctx, toPoint(node, bounds), {
        active: isCurrent,
        glow: isCurrent ? 9 * pulse + 6 : isVisited ? 6 : 4,
        color: isVisited ? '#22d3ee' : '#334155',
        label: String(index + 1),
      });
    });
    const done = layerIndex >= layers.length - 1 && elapsed > layers.length * STEP_MS;
    return done;
  }

  // --- DFS render: pulse a single deep path forward ---
  function renderDFS(ctx, bounds, time) {
    const { order, edgeTrail } = sim.data;
    const elapsed = time - sim.startedAt;
    const visitedCount = Math.min(order.length, Math.floor(elapsed / STEP_MS) + 1);
    const visited = new Set(order.slice(0, visitedCount));
    const currentNode = order[visitedCount - 1];
    const pulse = prefersReducedMotion ? 1 : 0.6 + 0.4 * Math.sin(time / 150);

    graphEdgesWeighted.forEach(({ from, to }) => {
      const p1 = toPoint(graphNodes[from], bounds);
      const p2 = toPoint(graphNodes[to], bounds);
      const onTrail = edgeTrail.some(([a, b]) => (a === from && b === to) || (a === to && b === from)) &&
        visited.has(from) && visited.has(to);
      drawEdge(ctx, p1, p2, {
        color: onTrail ? 'rgba(139, 92, 246, 0.65)' : 'rgba(148, 163, 184, 0.15)',
        width: onTrail ? 2 : 1.3,
        dashed: !onTrail,
      });
    });
    graphNodes.forEach((node, index) => {
      const isVisited = visited.has(index);
      const isCurrent = index === currentNode;
      drawNode(ctx, toPoint(node, bounds), {
        active: isCurrent,
        glow: isCurrent ? 9 * pulse + 6 : isVisited ? 6 : 4,
        color: isVisited ? '#8b5cf6' : '#334155',
        label: String(index + 1),
      });
    });
    return visitedCount >= order.length && elapsed > order.length * STEP_MS;
  }

  // --- Dijkstra render: show all weights, trace shortest path step by step ---
  function renderDijkstra(ctx, bounds, time) {
    const { path } = sim.data;
    const elapsed = time - sim.startedAt;
    const edgesRevealed = Math.min(path.length - 1, Math.floor(elapsed / STEP_MS) + 1);
    const pulse = prefersReducedMotion ? 1 : 0.6 + 0.4 * Math.sin(time / 160);

    graphEdgesWeighted.forEach(({ from, to, w }) => {
      const p1 = toPoint(graphNodes[from], bounds);
      const p2 = toPoint(graphNodes[to], bounds);
      drawEdge(ctx, p1, p2, { color: 'rgba(148, 163, 184, 0.18)' });
      drawEdgeLabel(ctx, p1, p2, String(w));
    });

    for (let i = 0; i < edgesRevealed; i += 1) {
      const p1 = toPoint(graphNodes[path[i]], bounds);
      const p2 = toPoint(graphNodes[path[i + 1]], bounds);
      drawEdge(ctx, p1, p2, { color: 'rgba(52, 211, 153, 0.85)', width: 2.6, dashed: false });
    }

    const pathVisited = new Set(path.slice(0, edgesRevealed + 1));
    graphNodes.forEach((node, index) => {
      const isCurrent = path[edgesRevealed] === index;
      const onPath = pathVisited.has(index);
      drawNode(ctx, toPoint(node, bounds), {
        active: isCurrent,
        glow: isCurrent ? 9 * pulse + 6 : onPath ? 7 : 4,
        color: onPath ? '#34d399' : '#334155',
        label: String(index + 1),
      });
    });
    return edgesRevealed >= path.length - 1 && elapsed > path.length * STEP_MS;
  }

  // --- Binary Search render: bars with low/high/mid pointers ---
  function renderBinarySearch(ctx, bounds, time) {
    const { steps, arr, target } = sim.data;
    const elapsed = time - sim.startedAt;
    const stepIndex = Math.min(steps.length - 1, Math.floor(elapsed / STEP_MS));
    const step = steps[stepIndex];
    const pulse = prefersReducedMotion ? 1 : 0.65 + 0.35 * Math.sin(time / 160);

    const padding = 24;
    const gap = 8;
    const barWidth = (bounds.width - padding * 2 - gap * (arr.length - 1)) / arr.length;
    const maxVal = Math.max(...arr);
    const maxBarHeight = bounds.height - 64;
    const baseline = bounds.height - 28;

    ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`Target: ${target}`, bounds.width / 2, 16);

    arr.forEach((value, index) => {
      const x = padding + index * (barWidth + gap);
      const h = Math.max(10, (value / maxVal) * maxBarHeight);
      const y = baseline - h;

      const inRange = index >= step.low && index <= step.high;
      const isMid = index === step.mid;
      let color = 'rgba(51, 65, 85, 0.9)';
      if (inRange) color = 'rgba(34, 211, 238, 0.35)';
      if (isMid) color = step.found ? '#34d399' : '#f59e0b';

      ctx.save();
      if (isMid) {
        ctx.shadowColor = step.found ? 'rgba(52, 211, 153, 0.9)' : 'rgba(245, 158, 11, 0.85)';
        ctx.shadowBlur = 10 * pulse + 6;
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, 4);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      ctx.font = '10px Inter';
      ctx.fillText(String(value), x + barWidth / 2, baseline + 14);

      if (index === step.low) drawPointerTag(ctx, x + barWidth / 2, baseline + 26, 'low', '#22d3ee');
      if (index === step.high) drawPointerTag(ctx, x + barWidth / 2, baseline + 38, 'high', '#a855f7');
      if (isMid) drawPointerTag(ctx, x + barWidth / 2, y - 10, 'mid', step.found ? '#34d399' : '#f59e0b');
    });

    ctx.textAlign = 'left';
    return stepIndex >= steps.length - 1 && elapsed > steps.length * STEP_MS;
  }

  function drawPointerTag(ctx, x, y, text, color) {
    ctx.fillStyle = color;
    ctx.font = 'bold 9px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  // --- Sliding Window render: blocks with an expanding/shrinking highlight box ---
  function renderSlidingWindow(ctx, bounds, time) {
    const { steps, arr, target } = sim.data;
    const elapsed = time - sim.startedAt;
    const stepIndex = Math.min(steps.length - 1, Math.floor(elapsed / STEP_MS));
    const step = steps[stepIndex];
    const pulse = prefersReducedMotion ? 1 : 0.65 + 0.35 * Math.sin(time / 160);

    const padding = 24;
    const gap = 8;
    const blockSize = Math.min(52, (bounds.width - padding * 2 - gap * (arr.length - 1)) / arr.length);
    const totalWidth = arr.length * blockSize + (arr.length - 1) * gap;
    const startX = (bounds.width - totalWidth) / 2;
    const y = bounds.height / 2 - blockSize / 2;

    ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`Smallest window with sum ≥ ${target}   |   current sum: ${step.sum}`, bounds.width / 2, 18);

    const isBest = step.action === 'done' && step.bestLeft !== -1;

    if (step.left <= step.right) {
      const boxX = startX + step.left * (blockSize + gap) - 5;
      const boxW = (step.right - step.left + 1) * (blockSize + gap) - gap + 10;
      ctx.save();
      ctx.strokeStyle = step.action === 'record' ? '#34d399' : '#22d3ee';
      ctx.shadowColor = step.action === 'record' ? 'rgba(52, 211, 153, 0.8)' : 'rgba(34, 211, 238, 0.7)';
      ctx.shadowBlur = 10 * pulse + 4;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(boxX, y - 8, boxW, blockSize + 16);
      ctx.restore();
    }

    arr.forEach((value, index) => {
      const x = startX + index * (blockSize + gap);
      const inFinalBest = isBest && index >= step.bestLeft && index <= step.bestRight;
      const inWindow = index >= step.left && index <= step.right;
      let fill = 'rgba(51, 65, 85, 0.85)';
      if (inWindow) fill = 'rgba(34, 211, 238, 0.30)';
      if (inFinalBest) fill = 'rgba(52, 211, 153, 0.35)';

      ctx.fillStyle = fill;
      ctx.strokeStyle = inFinalBest ? '#34d399' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, blockSize, blockSize, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(String(value), x + blockSize / 2, y + blockSize / 2 + 4);
    });

    ctx.textAlign = 'left';
    if (isBest) {
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Best window length: ${step.bestRight - step.bestLeft + 1}`, bounds.width / 2, bounds.height - 12);
      ctx.textAlign = 'left';
    }
    return stepIndex >= steps.length - 1 && elapsed > steps.length * STEP_MS;
  }

  // --- Main render loop ---
  function mainLoop(time) {
    const { ctx, bounds } = getCtx();
    let finished = false;

    if (sim.algorithm === 'bfs') finished = renderBFS(ctx, bounds, time);
    else if (sim.algorithm === 'dfs') finished = renderDFS(ctx, bounds, time);
    else if (sim.algorithm === 'dijkstra') finished = renderDijkstra(ctx, bounds, time);
    else if (sim.algorithm === 'binary-search') finished = renderBinarySearch(ctx, bounds, time);
    else if (sim.algorithm === 'sliding-window') finished = renderSlidingWindow(ctx, bounds, time);
    else renderIdleGraph(ctx, bounds, time);

    if (finished && prefersReducedMotion) {
      sim.rafId = null; // reduced motion: land on final frame and stop
      return;
    }
    sim.rafId = requestAnimationFrame(mainLoop);
  }

  simulateButton.addEventListener('click', () => {
    placeholder.classList.add('hidden');
    prepareSimulation(algorithmSelect.value);
    sim.rafId = requestAnimationFrame(mainLoop);
  });

  // Idle animation runs on load, same as before, until the user simulates something.
  sim.rafId = requestAnimationFrame(mainLoop);
});