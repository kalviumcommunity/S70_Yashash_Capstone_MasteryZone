const fs = require('fs');
const path = require('path');

const existingCatalog = require('../data/challengesCatalog.js');
const { partA } = require('./generate50ChallengesPartA');
const { partB } = require('./generate50ChallengesPartB');
const { replacement33 } = require('./generate33ChallengesReplacement');
const { extra14 } = require('./generate14ChallengesExtra');

console.log('Existing challenges count:', existingCatalog.length);

const existingIds = new Set(existingCatalog.map(c => c.id));
const existingTitles = new Set(existingCatalog.map(c => c.title.toLowerCase()));

const validPartA = partA.filter(c => !existingIds.has(c.id) && !existingTitles.has(c.title.toLowerCase()));
const validPartB = partB.filter(c => !existingIds.has(c.id) && !existingTitles.has(c.title.toLowerCase()));

const setABIds = new Set([...validPartA, ...validPartB].map(c => c.id));
const setABTitles = new Set([...validPartA, ...validPartB].map(c => c.title.toLowerCase()));

const uniqueInRepl = replacement33.filter(
  c => !setABIds.has(c.id) && !setABTitles.has(c.title.toLowerCase()) && !existingIds.has(c.id) && !existingTitles.has(c.title.toLowerCase())
);

const all100 = [...validPartA, ...validPartB, ...uniqueInRepl, ...extra14];
console.log('New challenges count:', all100.length);

if (all100.length !== 100) {
  console.error(`ERROR: Expected 100 new challenges, got ${all100.length}`);
  process.exit(1);
}

const formatted100 = all100.map((item, idx) => {
  const testCases = item.rawInputs.map((inp, inpIdx) => ({
    input: inp,
    expectedOutput: item.solve(inp),
    isHidden: inpIdx >= 3
  }));

  const examples = [
    {
      input: testCases[0].input,
      output: testCases[0].expectedOutput,
      explanation: (item.conceptualExplanation && item.conceptualExplanation[0]) || `Demonstrates standard behavior for ${item.title}.`
    },
    {
      input: testCases[1].input,
      output: testCases[1].expectedOutput,
      explanation: (item.conceptualExplanation && item.conceptualExplanation[1]) || `Additional verification case.`
    }
  ];

  return {
    id: item.id,
    title: item.title,
    difficulty: item.difficulty,
    category: item.category,
    description: item.description,
    inputFormat: item.inputFormat,
    outputFormat: item.outputFormat,
    constraints: item.constraints,
    examples: item.examples || examples,
    hints: item.hints,
    starterCode: {
      cpp: '// Enter your code below\n',
      python: '# Enter your code below\n',
      javascript: '// Enter your code below\n',
      java: '// Enter your code below\n'
    },
    testCases,
    objective: item.objective || `Master ${item.title} using optimal algorithmic techniques.`,
    conceptualExplanation: item.conceptualExplanation || [
      `Analyze problem requirements and identify key invariants.`,
      `Implement optimal approach meeting constraints.`
    ]
  };
});

const fullCatalog = [...existingCatalog, ...formatted100];
console.log('Combined total challenges:', fullCatalog.length);

if (fullCatalog.length !== 235) {
  console.error(`ERROR: Expected 235 total challenges, got ${fullCatalog.length}`);
  process.exit(1);
}

// Strict validation of the 235 catalog
const finalIds = new Set();
const finalTitles = new Set();
fullCatalog.forEach((c, idx) => {
  if (finalIds.has(c.id)) {
    throw new Error(`Duplicate ID at index ${idx}: ${c.id}`);
  }
  finalIds.add(c.id);

  const lt = c.title.toLowerCase();
  if (finalTitles.has(lt)) {
    throw new Error(`Duplicate Title at index ${idx}: ${c.title}`);
  }
  finalTitles.add(lt);

  if (!Array.isArray(c.testCases) || c.testCases.length !== 10) {
    throw new Error(`Challenge ${c.id} does not have 10 testCases (has ${c.testCases ? c.testCases.length : 0})`);
  }
});

console.log('All 235 challenges passed strict uniqueness and test case count checks!');

const fileContent = `/**
 * MASTERY ZONE ALGORITHMIC CHALLENGES CATALOG
 * 235 Verified Challenges across Core DSA Topics
 * Generated with strict 10 test cases (3 visible, 7 hidden) each.
 */

const CHALLENGES_CATALOG = ${JSON.stringify(fullCatalog, null, 2)};

module.exports = CHALLENGES_CATALOG;
`;

const catalogPath = path.join(__dirname, '../data/challengesCatalog.js');
fs.writeFileSync(catalogPath, fileContent, 'utf-8');
console.log(`Successfully wrote 235 challenges to ${catalogPath}`);
