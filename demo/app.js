const STORAGE_KEYS = {
  splitLeft: 'webvtt_demo_split_left',
  input: 'webvtt_demo_input',
  sample: 'webvtt_demo_sample',
};

const SAMPLES = {
  default: `WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nThis is a sample WebVTT file.\n\n00:00:06.000 --> 00:00:10.000\nIt has multiple cues.`,
  invalid: `WEBVTT\n\n00:00:00.000 --> 00:00:AA.BBB\nThis cue has a broken timestamp.\n\n00:00:06.000 --> 00:00:02.000\nThis cue ends before it starts.`,
  tags: `WEBVTT\n\n00:00:01.000 --> 00:00:05.000\n<b>Bold</b> <i>Italic</i> <u>Underline</u>\n\n00:00:06.000 --> 00:00:10.000\n<v Speaker>Voice tag</v> and <c.green>class tag</c>.`,
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

function safeLocalStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function countBySeverity(diagnostics, DiagnosticSeverity) {
  const counts = { errors: 0, warnings: 0, info: 0 };
  for (const d of diagnostics) {
    if (d.severity === DiagnosticSeverity.Error) counts.errors += 1;
    else if (d.severity === DiagnosticSeverity.Warning) counts.warnings += 1;
    else counts.info += 1;
  }
  return counts;
}

function formatLoc(d) {
  if (!d.line) return 'File-level';
  return `Line ${d.line}:${d.col || 0}`;
}

function escapeText(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setSplitLeftPercent(pct) {
  document.documentElement.style.setProperty('--split-left', `${pct}%`);
  safeLocalStorageSet(STORAGE_KEYS.splitLeft, String(pct));
}

function getSplitLeftPercent() {
  const raw = safeLocalStorageGet(STORAGE_KEYS.splitLeft);
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return 52;
  return clamp(n, 20, 80);
}

function isSplitActiveLayout() {
  return window.matchMedia('(min-width: 921px)').matches;
}

async function loadValidator() {
  try {
    return await import('./dist/index.mjs');
  } catch {
    return await import('../dist/index.mjs');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const { parse, DiagnosticSeverity } = await loadValidator();

  const split = document.getElementById('split');
  const gutter = document.getElementById('gutter');
  const vttInput = document.getElementById('vttInput');
  const validateBtn = document.getElementById('validateBtn');
  const fileInput = document.getElementById('fileInput');
  const clearBtn = document.getElementById('clearBtn');
  const sampleSelect = document.getElementById('sampleSelect');

  const statusEl = document.getElementById('status');
  const diagnosticsEl = document.getElementById('diagnostics');
  const chipErrors = document.getElementById('chipErrors');
  const chipWarnings = document.getElementById('chipWarnings');
  const chipCues = document.getElementById('chipCues');

  setSplitLeftPercent(getSplitLeftPercent());

  // Restore input/sample.
  const savedSample = safeLocalStorageGet(STORAGE_KEYS.sample);
  if (savedSample && Object.hasOwn(SAMPLES, savedSample)) {
    sampleSelect.value = savedSample;
  }

  const savedInput = safeLocalStorageGet(STORAGE_KEYS.input);
  if (savedInput && savedInput.trim().length > 0) {
    vttInput.value = savedInput;
  } else {
    vttInput.value = SAMPLES[sampleSelect.value] ?? SAMPLES.default;
  }

  const runValidation = () => {
    const input = vttInput.value;
    safeLocalStorageSet(STORAGE_KEYS.input, input);

    let result;
    try {
      result = parse(input);
    } catch (err) {
      chipErrors.textContent = 'Errors: ?';
      chipWarnings.textContent = 'Warnings: ?';
      chipCues.textContent = 'Cues: 0';
      statusEl.innerHTML = `<div class="headline">INVALID</div><div class="meta">Parser threw an exception: ${escapeText(err?.message || String(err))}</div>`;
      diagnosticsEl.innerHTML = '';
      return;
    }

    const diagnostics = result?.diagnostics ?? [];
    const counts = countBySeverity(diagnostics, DiagnosticSeverity);

    chipErrors.textContent = `Errors: ${counts.errors}`;
    chipWarnings.textContent = `Warnings: ${counts.warnings}`;
    chipCues.textContent = `Cues: ${result?.cues?.length ?? 0}`;

    const isValid = counts.errors === 0;
    statusEl.innerHTML = isValid
      ? `<div class="headline">VALID</div><div class="meta">No errors detected. (${counts.warnings} warning${counts.warnings === 1 ? '' : 's'})</div>`
      : `<div class="headline">INVALID</div><div class="meta">${counts.errors} error${counts.errors === 1 ? '' : 's'}, ${counts.warnings} warning${counts.warnings === 1 ? '' : 's'}</div>`;

    if (diagnostics.length === 0) {
      diagnosticsEl.innerHTML = `<div class="diag"><div><span class="badge info">INFO</span></div><div class="diag-main"><div class="diag-title">No diagnostics</div><div class="diag-sub">No errors or warnings found.</div></div></div>`;
      return;
    }

    diagnosticsEl.innerHTML = diagnostics
      .map((d) => {
        const sev = d.severity || 'info';
        const badge = sev === DiagnosticSeverity.Error ? 'error' : (sev === DiagnosticSeverity.Warning ? 'warning' : 'info');
        const code = d.code != null ? `Code ${d.code}` : '';
        const loc = formatLoc(d);
        return `
          <div class="diag" data-line="${escapeText(d.line ?? '')}" data-col="${escapeText(d.col ?? '')}">
            <div>
              <span class="badge ${badge}">${escapeText(String(sev).toUpperCase())}</span>
            </div>
            <div class="diag-main">
              <div class="diag-title">${escapeText(loc)}${code ? ` • ${escapeText(code)}` : ''}</div>
              <div class="diag-sub">${escapeText(d.message || '')}</div>
            </div>
          </div>
        `.trim();
      })
      .join('');
  };

  const runValidationDebounced = debounce(runValidation, 200);

  vttInput.addEventListener('input', runValidationDebounced);
  validateBtn.addEventListener('click', runValidation);

  sampleSelect.addEventListener('change', () => {
    const key = sampleSelect.value;
    safeLocalStorageSet(STORAGE_KEYS.sample, key);
    vttInput.value = SAMPLES[key] ?? SAMPLES.default;
    runValidation();
  });

  clearBtn.addEventListener('click', () => {
    vttInput.value = '';
    runValidation();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result ?? '');
      vttInput.value = text;
      runValidation();
    };
    reader.readAsText(file);
  });

  // Splitter: pointer drag.
  let dragging = false;

  const onPointerMove = (ev) => {
    if (!dragging) return;
    if (!isSplitActiveLayout()) return;

    const rect = split.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const pct = clamp((x / rect.width) * 100, 20, 80);
    setSplitLeftPercent(Math.round(pct * 10) / 10);
  };

  const stopDragging = () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  gutter.addEventListener('pointerdown', (ev) => {
    if (!isSplitActiveLayout()) return;
    dragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    gutter.setPointerCapture(ev.pointerId);
  });

  gutter.addEventListener('pointermove', onPointerMove);
  gutter.addEventListener('pointerup', stopDragging);
  gutter.addEventListener('pointercancel', stopDragging);

  // Keyboard resizing on the gutter for accessibility.
  gutter.addEventListener('keydown', (ev) => {
    if (!isSplitActiveLayout()) return;

    const step = ev.shiftKey ? 5 : 2;
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      setSplitLeftPercent(clamp(getSplitLeftPercent() - step, 20, 80));
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      setSplitLeftPercent(clamp(getSplitLeftPercent() + step, 20, 80));
    } else if (ev.key === 'Home') {
      ev.preventDefault();
      setSplitLeftPercent(35);
    } else if (ev.key === 'End') {
      ev.preventDefault();
      setSplitLeftPercent(65);
    }
  });

  // Initial run.
  runValidation();
});
