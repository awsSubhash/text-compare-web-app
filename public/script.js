document.addEventListener('DOMContentLoaded', () => {
  feather.replace();

  const textA = document.getElementById('textA');
  const textB = document.getElementById('textB');
  const compareBtn = document.getElementById('compareBtn');
  const clearBtn = document.getElementById('clearBtn');
  const themeToggle = document.getElementById('themeToggle');
  const results = document.getElementById('results');
  const htmlA = document.getElementById('htmlA');
  const htmlB = document.getElementById('htmlB');
  const stats = document.getElementById('stats');
  const changeSummary = document.getElementById('changeSummary');

  const copyTextBtn = document.getElementById('copyTextBtn');
  const copyHtmlBtn = document.getElementById('copyHtmlBtn');
  const downloadTextBtn = document.getElementById('downloadTextBtn');
  const downloadHtmlBtn = document.getElementById('downloadHtmlBtn');

  // Theme
  const saved = localStorage.getItem('theme');
  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.innerHTML = theme === 'dark'
      ? '<i data-feather="sun"></i>'
      : '<i data-feather="moon"></i>';
    feather.replace();
  };
  if (saved) setTheme(saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Compare
  compareBtn.addEventListener('click', async () => {
    const res = await fetch('/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textA: textA.value, textB: textB.value })
    });
    const { htmlA: a, htmlB: b, stats: s, changeSummary: changes } = await res.json();

    htmlA.innerHTML = a;
    htmlB.innerHTML = b;
    stats.textContent = `Differences: ${s.differences} | Added: ${s.wordsAdded} | Removed: ${s.wordsRemoved}`;

    if (changes && changes.length > 0) {
      changeSummary.innerHTML = `<strong>Changes:</strong> ${changes.join(' • ')}`;
    } else {
      changeSummary.textContent = 'No changes detected.';
    }

    results.classList.remove('hidden');
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    textA.value = textB.value = '';
    results.classList.add('hidden');
  });

  // Export
  const getPlain = el => el.textContent || el.innerText;
  const download = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  };

  copyTextBtn.onclick = () => {
    const txt = `Text A:\n${getPlain(htmlA)}\n\nText B:\n${getPlain(htmlB)}`;
    navigator.clipboard.writeText(txt).then(() => alert('Copied as text!'));
  };
  copyHtmlBtn.onclick = () => {
    const html = `<h3>Text A</h3>${htmlA.innerHTML}<h3>Text B</h3>${htmlB.innerHTML}`;
    navigator.clipboard.writeText(html).then(() => alert('Copied as HTML!'));
  };
  downloadTextBtn.onclick = () => {
    const txt = `Text A:\n${getPlain(htmlA)}\n\nText B:\n${getPlain(htmlB)}`;
    download(txt, 'comparison.txt', 'text/plain');
  };
  downloadHtmlBtn.onclick = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comparison</title></head><body><h1>Text Comparison</h1><h3>Text A</h3>${htmlA.innerHTML}<h3>Text B</h3>${htmlB.innerHTML}</body></html>`;
    download(html, 'comparison.html', 'text/html');
  };
});
