document.addEventListener('DOMContentLoaded', () => {
  feather.replace();

  const textA = document.getElementById('textA');
  const textB = document.getElementById('textB');
  const compareBtn = document.getElementById('compareBtn');
  const clearBtn = document.getElementById('clearBtn');
  const modeToggle = document.getElementById('modeToggle');
  const themeToggle = document.getElementById('themeToggle');
  const results = document.getElementById('results');
  const htmlA = document.getElementById('htmlA');
  const htmlB = document.getElementById('htmlB');
  const stats = document.getElementById('stats');
  const changeSummary = document.getElementById('changeSummary');
  const saveMerged = document.getElementById('saveMerged');

  let isMergeMode = false;

  /* ------------------- THEME ------------------- */
  const setTheme = t => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    themeToggle.innerHTML = t === 'dark' ? '<i data-feather="sun"></i>' : '<i data-feather="moon"></i>';
    feather.replace();
  };
  const saved = localStorage.getItem('theme');
  if (saved) setTheme(saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(cur === 'dark' ? 'light' : 'dark');
  });

  /* ------------------- MODE TOGGLE ------------------- */
  modeToggle.addEventListener('click', () => {
    isMergeMode = !isMergeMode;
    modeToggle.classList.toggle('active');
    modeToggle.innerHTML = isMergeMode
      ? '<i data-feather="git-merge"></i> Merge'
      : '<i data-feather="git-compare"></i> Compare';

    htmlA.contentEditable = isMergeMode;
    htmlB.contentEditable = isMergeMode;
    document.querySelector('.merge-controls').style.display = isMergeMode ? 'flex' : 'none';
  });

  /* ------------------- COMPARE ------------------- */
  compareBtn.addEventListener('click', async () => {
    const res = await fetch('/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textA: textA.value, textB: textB.value })
    });
    const { htmlA: a, htmlB: b, stats: s, changeSummary: ch } = await res.json();

    htmlA.innerHTML = a;
    htmlB.innerHTML = b;
    stats.textContent = `Differences: ${s.differences} | Added: ${s.wordsAdded} | Removed: ${s.wordsRemoved}`;
    changeSummary.innerHTML = ch && ch.length
      ? `<strong>Changes:</strong> ${ch.join(' to ')}`
      : 'No changes detected.';

    results.classList.remove('hidden');
    addMergeArrows();

    if (isMergeMode) {
      htmlA.contentEditable = true;
      htmlB.contentEditable = true;
    }
  });

  /* ------------------- MERGE ARROWS ------------------- */
  function addMergeArrows() {
    // remove old arrows
    document.querySelectorAll('.merge-arrows').forEach(el => el.remove());

    const linesA = htmlA.querySelectorAll('.line');
    const linesB = htmlB.querySelectorAll('.line');

    linesA.forEach((lineA, i) => {
      const lineB = linesB[i];
      if (!lineB) return;

      const changed = lineA.classList.contains('deleted') ||
                      lineA.classList.contains('modified') ||
                      lineB.classList.contains('inserted') ||
                      lineB.classList.contains('modified');

      if (!changed) return;

      lineA.classList.add('changed');
      lineB.classList.add('changed');

      const arrows = document.createElement('div');
      arrows.className = 'merge-arrows';

      // B to A
      const b2a = document.createElement('button');
      b2a.className = 'merge-btn';
      b2a.title = 'Copy B to A';
      b2a.innerHTML = '<i data-feather="arrow-left"></i>';
      b2a.onclick = e => {
        e.stopPropagation();
        const src = lineB.querySelector('.code');
        const tgt = lineA.querySelector('.code');
        tgt.innerHTML = src.innerHTML;
        lineA.className = lineB.className.replace(/inserted|modified/g, '');
        arrows.remove();
      };

      // A to B
      const a2b = document.createElement('button');
      a2b.className = 'merge-btn';
      a2b.title = 'Copy A to B';
      a2b.innerHTML = '<i data-feather="arrow-right"></i>';
      a2b.onclick = e => {
        e.stopPropagation();
        const src = lineA.querySelector('.code');
        const tgt = lineB.querySelector('.code');
        tgt.innerHTML = src.innerHTML;
        lineB.className = lineA.className.replace(/deleted|modified/g, '');
        arrows.remove();
      };

      arrows.append(b2a, a2b);
      lineA.appendChild(arrows.cloneNode(true));
      lineB.appendChild(arrows);
    });

    feather.replace();
  }

  /* ------------------- SAVE MERGED ------------------- */
  saveMerged.addEventListener('click', () => {
    const merged = Array.from(htmlB.querySelectorAll('.line .code'))
      .map(c => c.textContent)
      .join('\n');
    navigator.clipboard.writeText(merged).then(() => alert('Merged text copied!'));
  });

  /* ------------------- CLEAR ------------------- */
  clearBtn.addEventListener('click', () => {
    textA.value = textB.value = '';
    results.classList.add('hidden');
  });

  /* ------------------- EXPORT ------------------- */
  const getPlain = el => el.textContent || el.innerText;
  const download = (content, file, type) => {
    const blob = new Blob([content], { type });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: file
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  document.getElementById('copyTextBtn').addEventListener('click', () => {
    const txt = `Text A:\n${getPlain(htmlA)}\n\nText B:\n${getPlain(htmlB)}`;
    navigator.clipboard.writeText(txt).then(() => alert('Copied!'));
  });
  document.getElementById('copyHtmlBtn').addEventListener('click', () => {
    const html = `<h3>Text A</h3>${htmlA.innerHTML}<h3>Text B</h3>${htmlB.innerHTML}`;
    navigator.clipboard.writeText(html).then(() => alert('HTML copied!'));
  });
  document.getElementById('downloadTextBtn').addEventListener('click', () => {
    const merged = Array.from(htmlB.querySelectorAll('.line .code'))
      .map(c => c.textContent)
      .join('\n');
    download(merged, 'merged.txt', 'text/plain');
  });
  document.getElementById('downloadHtml979Btn').addEventListener('click', () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Merged</title></head><body><pre>${htmlB.innerHTML}</pre></body></html>`;
    download(html, 'merged.html', 'text/html');
  });
});
