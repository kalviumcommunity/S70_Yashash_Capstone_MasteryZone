const fs = require("fs");
const path = require("path");

const routesPath = path.join(__dirname, "../routes/codingRoutes.js");
let content = fs.readFileSync(routesPath, "utf8");

// We will update CHALLENGES_CATALOG starterCode, testCases isHidden, and add objective/conceptualExplanation
const CHALLENGES_ENRICHMENT = {
  ch_tight_bound: {
    objective: "Compute the lower bound constant c1, upper bound constant c2, and threshold n0 to prove f(n) = Θ(n^d).",
    conceptualExplanation: [
      "Step 1: Read the polynomial coefficients from standard input.",
      "Step 2: The lower bound constant c1 is the leading coefficient (first coefficient).",
      "Step 3: The upper bound constant c2 is the sum of all coefficients.",
      "Step 4: The threshold n0 is 1.",
      "Step 5: Output c1, c2, and 1 separated by spaces."
    ]
  },
  ch_two_sum: {
    objective: "Find two distinct indices in an array whose elements sum up to the target value.",
    conceptualExplanation: [
      "Step 1: Parse the array of numbers and the target sum.",
      "Step 2: Use a hash map storing value-to-index pairs for O(1) complements.",
      "Step 3: For each element at index i, calculate complement = target - nums[i].",
      "Step 4: If complement exists in map, return [map[complement], i].",
      "Step 5: Output the zero-indexed pair as a JSON array."
    ]
  },
  ch_valid_parentheses: {
    objective: "Determine if an input string composed of brackets '()[]{}' has properly matched and nested pairs.",
    conceptualExplanation: [
      "Step 1: Initialize an empty stack data structure.",
      "Step 2: Iterate through each character; push opening brackets onto the stack.",
      "Step 3: When encountering a closing bracket, pop the stack and check matching type.",
      "Step 4: If stack is empty on closing bracket or doesn't match, return false.",
      "Step 5: Return true if stack is empty after the entire string is processed, else false."
    ]
  },
  ch_palindrome: {
    objective: "Determine whether an integer reads the same backwards as forwards without converting it to a string.",
    conceptualExplanation: [
      "Step 1: Negative numbers and non-zero multiples of 10 cannot be palindromes.",
      "Step 2: Reverse the second half of the digits by extracting `x % 10`.",
      "Step 3: When reversedNumber >= x, stop extracting.",
      "Step 4: Return true if x == reversedNumber or x == reversedNumber / 10.",
      "Step 5: Print true or false to standard output."
    ]
  },
  ch_max_subarray: {
    objective: "Find the contiguous subarray within an array of integers that has the largest sum using Kadane's algorithm.",
    conceptualExplanation: [
      "Step 1: Initialize `currentSum = nums[0]` and `maxSum = nums[0]`.",
      "Step 2: Iterate through nums starting from index 1.",
      "Step 3: For each num, `currentSum = max(num, currentSum + num)`.",
      "Step 4: Update `maxSum = max(maxSum, currentSum)`.",
      "Step 5: Print the integer maximum subarray sum."
    ]
  }
};

// Replace CHALLENGES_CATALOG in codingRoutes.js
// Find where CHALLENGES_CATALOG starts and ends
const startMarker = "const CHALLENGES_CATALOG = [";
const endMarker = "\n];\n\n// Helper to execute code against a single test case";

const sIdx = content.indexOf(startMarker);
const eIdx = content.indexOf(endMarker);

if (sIdx === -1 || eIdx === -1) {
  console.error("Could not find CHALLENGES_CATALOG bounds!");
  process.exit(1);
}

const originalCatalogStr = content.substring(sIdx + "const CHALLENGES_CATALOG = ".length, eIdx + 2);
const catalog = eval(originalCatalogStr);

for (const c of catalog) {
  const enrich = CHALLENGES_ENRICHMENT[c.id];
  if (enrich) {
    c.objective = enrich.objective;
    c.conceptualExplanation = enrich.conceptualExplanation;
  }
  // Enforce blank commented starter code only!
  c.starterCode = {
    cpp: "// Enter your code below\n",
    python: "# Enter your code below\n",
    javascript: "// Enter your code below\n",
    java: "// Enter your code below\n"
  };

  // Ensure first 3 are visible (isHidden: false), remaining 7 are hidden (isHidden: true)
  if (Array.isArray(c.testCases)) {
    c.testCases.forEach((tc, idx) => {
      if (idx < 3) {
        tc.isHidden = false;
      } else {
        tc.isHidden = true;
      }
    });
  }
}

const newCatalogStr = "const CHALLENGES_CATALOG = " + JSON.stringify(catalog, null, 2) + ";";
content = content.substring(0, sIdx) + newCatalogStr + content.substring(eIdx + 3);

fs.writeFileSync(routesPath, content, "utf8");
console.log("Successfully enriched CHALLENGES_CATALOG with LeetCode quality, 3 public test cases, and blank commented starters!");
