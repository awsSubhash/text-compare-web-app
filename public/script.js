document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feather icons
  feather.replace();

  // Elements
  const textA = document.getElementById('textA');
  const textB = document.getElementById('textB');
  const compareBtn = document.getElementById('compareBtn');
  const clearBtn = document.getElementById('clearBtn');
  const themeToggle = document.getElementById('themeToggle');
  const results = document.getElementById('results');
  const htmlA = document.getElementById('htmlA');
  const htmlB = document.getElementById('htmlB');
  const stats = document.getElementById('stats');

  const copyTextBtn = document.getElementById('copyTextBtn');
  const copyHtmlBtn = document.getElementById('copyHtmlBtn');
  const downloadTextBtn = document.getElementById('downloadTextBtn');
  const downloadHtmlBtn = document.getElementById('downloadHtmlBtn');

  // === THEME TOGGLE ===
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.innerHTML = theme === 'dark'
      ? '<i data-feather="sun"></i>'
      : '<i data-feather="moon"></i>';
    feather.replace();
  };

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (prefersDark) {
    setTheme('dark');
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // === COMPARE ===
  compareBtn.addEventListener('click', async () => {
    const res = await fetch('/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textA: textA.value, textB: textB.value })
    });
    const { htmlA: a, htmlB: b, stats: s } = await res.json();

    htmlA.innerHTML = a;
    htmlB.innerHTML = b;
    stats.textContent = `Differences: ${s.differences} | Added: ${s.wordsAdded} | Removed: ${s.wordsRemoved}`;
    results.classList.remove('hidden');
  });

  // === CLEAR ===
  clearBtn.addEventListener('click', () => {
    textA.value = textB.value = '';
    results.classList.add('hidden');
  });

  // === HELPERS ===
  const getPlain = (el) => el.textContent || el.innerText;

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  };

  // === EXPORT ACTIONS ===
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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Text Comparison</title></head><body><h1>Text Comparison</h1><h3>Text A</h3>${htmlA.innerHTML}<h3>Text B</h3>${htmlB.innerHTML}</body></html>`;
    download(html, 'comparison.html', 'text/html');
  };
});
