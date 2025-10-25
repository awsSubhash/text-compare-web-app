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
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

app.post('/compare', (req, res) => {
  const { textA = '', textB = '' } = req.body;

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
  let globalLine = 0;

  for (let i = 0; i < diffs.length; i++) {
    const [op, data] = diffs[i];
    const lines = data.split('\n');

    for (let j = 0; j < lines.length; j++) {
      let line = lines[j];
      const isLastLineInChunk = j === lines.length - 1;
      const isLastChunk = i === diffs.length - 1;
      const isEmpty = line === '';
      const keepEmpty = isLastLineInChunk && isLastChunk;
      const displayLine = (isEmpty && keepEmpty) ? ' ' : line;

      if (isEmpty && !keepEmpty) continue;

      globalLine++;

      if (op === 0) {                                 // equal
        htmlA += `<div class="line" data-index="${globalLine}"><span class="num">${++lineIdxA}</span><span class="code equal">${escapeHtml(displayLine)}</span></div>`;
        htmlB += `<div class="line" data-index="${globalLine}"><span class="num">${++lineIdxB}</span><span class="code equal">${escapeHtml(displayLine)}</span></div>`;
      } else if (op === -1) {                         // delete
        htmlA += `<div class="line deleted" data-index="${globalLine}"><span class="num">${++lineIdxA}</span><span class="code">${escapeHtml(displayLine)}</span></div>`;
        if (displayLine.trim()) {
          changeSummary.push(`Line ${lineIdxA}: deleted`);
          removedWords += countWords(displayLine);
          numDiffs++;
        }

        // replace (delete + insert on same line)
        if (i + 1 < diffs.length && diffs[i + 1][0] === 1) {
          const ins = diffs[++i][1].split('\n')[j] || ' ';
          const insDisp = ins === '' ? ' ' : ins;
          globalLine++;
          htmlB += `<div class="line modified" data-index="${globalLine}"><span class="num">${++lineIdxB}</span><span class="code">${escapeHtml(insDisp)}</span></div>`;
          if (insDisp.trim()) {
            changeSummary.push(`Line ${lineIdxB}: modified`);
            addedWords += countWords(insDisp);
            numDiffs++;
          }
        }
      } else if (op === 1) {                         // insert
        htmlB += `<div class="line inserted" data-index="${globalLine}"><span class="num">${++lineIdxB}</span><span class="code">${escapeHtml(displayLine)}</span></div>`;
        if (displayLine.trim()) {
          changeSummary.push(`Line ${lineIdxB}: inserted`);
          addedWords += countWords(displayLine);
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

app.listen(port, () => console.log(`http://localhost:${port}`));
