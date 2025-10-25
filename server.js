const express = require('express');
const DiffMatchPatch = require('diff-match-patch');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const dmp = new DiffMatchPatch();

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w).length;
}

app.post('/compare', (req, res) => {
  const { textA, textB } = req.body;

  let diffs = dmp.diff_main(textA, textB);
  dmp.diff_cleanupSemantic(diffs);

  let htmlA = '';
  let htmlB = '';
  let numDiffs = 0;
  let addedWords = 0;
  let removedWords = 0;
  let changeSummary = [];

  let lineIdxA = 0;
  let lineIdxB = 0;

  for (let i = 0; i < diffs.length; i++) {
    const [op, data] = diffs[i];
    const lines = data.split('\n');

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      const isLastLine = j === lines.length - 1;
      const isLastDiff = i === diffs.length - 1;

      if (op === 0) { // Equal
        if (line !== '' || (isLastLine && isLastDiff)) {
          htmlA += `<div class="line"><span class="num">${++lineIdxA}</span><span class="code equal">${escapeHtml(line)}</span></div>`;
          htmlB += `<div class="line"><span class="num">${++lineIdxB}</span><span class="code equal">${escapeHtml(line)}</span></div>`;
        }
      } else if (op === -1) { // Delete
        if (line !== '' || (isLastLine && isLastDiff)) {
          htmlA += `<div class="line deleted"><span class="num">${++lineIdxA}</span><span class="code">${escapeHtml(line)}</span><span class="change-icon" title="Deleted">Removed</span></div>`;
          changeSummary.push(`Line ${lineIdxA}: deleted`);
          removedWords += countWords(line);
          numDiffs++;
        }

        // Check if next is insert (modified)
        if (i + 1 < diffs.length && diffs[i + 1][0] === 1) {
          const insertLine = diffs[++i][1].split('\n')[j] || '';
          if (insertLine !== '' || (isLastLine && isLastDiff)) {
            htmlB += `<div class="line modified"><span class="num">${++lineIdxB}</span><span class="code">${escapeHtml(insertLine)}</span><span class="change-icon" title="Modified">Modified</span></div>`;
            changeSummary.push(`Line ${lineIdxB}: modified`);
            addedWords += countWords(insertLine);
            numDiffs++;
          }
          continue;
        }
      } else if (op === 1) { // Insert
        if (line !== '' || (isLastLine && isLastDiff)) {
          htmlB += `<div class="line inserted"><span class="num">${++lineIdxB}</span><span class="code">${escapeHtml(line)}</span><span class="change-icon" title="Inserted">Added</span></div>`;
          changeSummary.push(`Line ${lineIdxB}: inserted`);
          addedWords += countWords(line);
          numDiffs++;
        }
      }
    }
  }

  res.json({
    htmlA: `<div class="code-block">${htmlA}</div>`,
    htmlB: `<div class="code-block">${htmlB}</div>`,
    stats: { differences: numDiffs, wordsAdded: addedWords, wordsRemoved: removedWords },
    changeSummary
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
