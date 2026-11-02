const fs = require("fs");
const path = require("path");

const { existingChallenges } = require("./catalogBase");
const { part1Challenges } = require("./challengesPart1");
const { part2Challenges } = require("./challengesPart2");
const { part3Challenges } = require("./challengesPart3");

const allChallenges = [
  ...existingChallenges,
  ...part1Challenges,
  ...part2Challenges,
  ...part3Challenges
];

console.log(`Total assembled challenges: ${allChallenges.length}`);

// Validation checks
if (allChallenges.length !== 65) {
  throw new Error(`Expected 65 challenges, got ${allChallenges.length}`);
}

const idSet = new Set();
const titleSet = new Set();
const categoryCounts = {};

for (const ch of allChallenges) {
  if (!ch.id) throw new Error("Challenge missing ID");
  if (idSet.has(ch.id)) throw new Error(`Duplicate challenge ID: ${ch.id}`);
  idSet.add(ch.id);

  if (!ch.title) throw new Error(`Challenge ${ch.id} missing title`);
  if (titleSet.has(ch.title)) throw new Error(`Duplicate title: ${ch.title}`);
  titleSet.add(ch.title);

  if (!["Easy", "Medium", "Hard"].includes(ch.difficulty)) {
    throw new Error(`Invalid difficulty ${ch.difficulty} in ${ch.id}`);
  }

  categoryCounts[ch.category] = (categoryCounts[ch.category] || 0) + 1;

  if (!ch.description || ch.description.length < 20) {
    throw new Error(`Challenge ${ch.id} description too short`);
  }

  if (!Array.isArray(ch.testCases) || ch.testCases.length !== 10) {
    throw new Error(`Challenge ${ch.id} does not have exactly 10 test cases (got ${ch.testCases?.length})`);
  }

  const publicTests = ch.testCases.filter(t => !t.isHidden);
  const hiddenTests = ch.testCases.filter(t => t.isHidden);
  if (publicTests.length !== 3 || hiddenTests.length !== 7) {
    throw new Error(`Challenge ${ch.id} expected 3 public and 7 hidden test cases, got ${publicTests.length} public and ${hiddenTests.length} hidden`);
  }

  for (let i = 0; i < ch.testCases.length; i++) {
    const t = ch.testCases[i];
    if (t.input === undefined || t.input === null) {
      throw new Error(`Challenge ${ch.id} test ${i} input is undefined`);
    }
    if (t.expectedOutput === undefined || t.expectedOutput === null) {
      throw new Error(`Challenge ${ch.id} test ${i} expectedOutput is undefined`);
    }
  }

  if (!ch.starterCode?.python?.includes("Enter your code below")) {
    throw new Error(`Challenge ${ch.id} starter code invalid`);
  }
}

console.log("Category counts:", categoryCounts);

const targetFile = path.join(__dirname, "../data/challengesCatalog.js");
const fileContent = `/**
 * MASTERY ZONE ALGORITHMIC CHALLENGES CATALOG
 * 65 Verified Challenges across 15 DSA Core Topics
 * Generated with strict 10 test cases (3 visible, 7 hidden) each.
 */

const CHALLENGES_CATALOG = ${JSON.stringify(allChallenges, null, 2)};

module.exports = CHALLENGES_CATALOG;
`;

fs.writeFileSync(targetFile, fileContent, "utf8");
console.log(`Successfully generated ${targetFile} with ${allChallenges.length} challenges!`);
