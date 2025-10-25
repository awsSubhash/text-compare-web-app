const express = require('express');
const DiffMatchPatch = require('diff-match-patch');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const dmp = new DiffMatchPatch();

// Helper to count words in a string
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

app.post('/compare', (req, res) => {
  const { textA, textB } = req.body;
  
  // Compute diffs with semantic cleanup for better readability
  let diffs = dmp.diff_main(textA, textB);
  dmp.diff_cleanupSemantic(diffs);

  // Build HTML for left (Text A) and right (Text B), handling modified as yellow
  let htmlA = '';
  let htmlB = '';
  let numDiffs = 0;
  let addedWords = 0;
  let removedWords = 0;

  for (let i = 0; i < diffs.length; i++) {
    const op = diffs[i][0];
    const data = diffs[i][1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (op === 0) { // Equal
      htmlA += `<span class="diff-equal">${data}</span>`;
      htmlB += `<span class="diff-equal">${data}</span>`;
    } else if (op === -1) { // Delete
      if (i + 1 < diffs.length && diffs[i + 1][0] === 1) {
        // Treat consecutive delete + insert as modified (yellow)
        const insertData = diffs[i + 1][1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        htmlA += `<span class="diff-modified">${data}</span>`;
        htmlB += `<span class="diff-modified">${insertData}</span>`;
        addedWords += countWords(diffs[i + 1][1]);
        removedWords += countWords(data);
        numDiffs++;
        i++; // Skip next insert
      } else {
        // Pure delete (red in left)
        htmlA += `<span class="diff-deleted">${data}</span>`;
        removedWords += countWords(data);
        numDiffs++;
      }
    } else if (op === 1) { // Insert
      // Pure insert (green in right)
      htmlB += `<span class="diff-inserted">${data}</span>`;
      addedWords += countWords(data);
      numDiffs++;
    }
  }

  res.json({
    htmlA,
    htmlB,
    stats: {
      differences: numDiffs,
      wordsAdded: addedWords,
      wordsRemoved: removedWords
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
