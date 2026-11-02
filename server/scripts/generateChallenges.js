const fs = require("fs");
const path = require("path");

// Existing 5 challenges preserved
const existingChallenges = [
  {
    id: "ch_tight_bound",
    title: "Tight Bound Proof Challenge",
    difficulty: "Medium",
    category: "Asymptotic Analysis & Big-O",
    description: "Given a polynomial f(n) = a_d*n^d + ... + a_1*n + a_0 with non-negative integer coefficients and a positive leading coefficient, compute the tight bound constants c1, c2, and n0 that prove f(n) = Θ(n^d).\n\nUse the two-step squeeze strategy:\n• Lower bound (Ω): Since all lower-order terms are non-negative, dropping them gives f(n) >= a_d*n^d. So c1 = a_d (the leading coefficient).\n• Upper bound (O): For n >= 1, n^i <= n^d for all i <= d, so each term a_i*n^i <= a_i*n^d. Summing all terms gives f(n) <= (sum a_i)*n^d. So c2 = sum of all coefficients.\n• Threshold: Both bounds hold simultaneously from n0 = 1.\n\nOutput: c1, c2, and n0 such that c1*n^d <= f(n) <= c2*n^d for all n >= n0.",
    inputFormat: "Line 1: A single integer k — the number of coefficients (k = d + 1, where d is the degree).\nLine 2: k space-separated non-negative integers representing the coefficients in descending order of degree (leading coefficient a_d first, constant term a_0 last).",
    outputFormat: "A single line with three space-separated integers: c1 c2 n0",
    constraints: [
      "2 <= k <= 6 (degree between 1 and 5)",
      "0 <= a_i <= 100 for all i",
      "a_d >= 1 (leading coefficient is positive)",
      "All coefficients are non-negative integers",
      "Time complexity: O(k) — single pass to sum all coefficients",
      "Space complexity: O(k) (or O(1) auxiliary if streaming input)"
    ],
    examples: [
      {
        input: "3\n4 3 1",
        output: "4 8 1",
        explanation: "f(n) = 4n^2 + 3n + 1. Leading coefficient = 4 -> c1 = 4. Sum of coefficients = 4 + 3 + 1 = 8 -> c2 = 8. Threshold n0 = 1. Verify: 4n^2 <= 4n^2 + 3n + 1 <= 8n^2 for all n >= 1."
      },
      {
        input: "3\n3 7 2",
        output: "3 12 1",
        explanation: "f(n) = 3n^2 + 7n + 2. c1 = 3 (leading), c2 = 3 + 7 + 2 = 12 (sum), n0 = 1. Verify: 3n^2 <= 3n^2 + 7n + 2 <= 12n^2 for all n >= 1."
      },
      {
        input: "4\n7 3 2 1",
        output: "7 13 1",
        explanation: "f(n) = 7n^3 + 3n^2 + 2n + 1. c1 = 7, c2 = 7 + 3 + 2 + 1 = 13, n0 = 1."
      }
    ],
    hints: [
      "The lower bound constant c1 is simply the leading coefficient (a_d), which is the first coefficient in the input sequence.",
      "The upper bound constant c2 is the sum of all coefficients in the list.",
      "The threshold n0 is always 1 using the squeeze strategy for non-negative polynomial terms."
    ],
    starterCode: {
      cpp: "// Enter your code below\n",
      python: "# Enter your code below\n",
      javascript: "// Enter your code below\n",
      java: "// Enter your code below\n"
    },
    testCases: [
      { input: "3\n4 3 1", expectedOutput: "4 8 1", isHidden: false },
      { input: "3\n3 7 2", expectedOutput: "3 12 1", isHidden: false },
      { input: "4\n7 3 2 1", expectedOutput: "7 13 1", isHidden: false },
      { input: "2\n5 10", expectedOutput: "5 15 1", isHidden: true },
      { input: "5\n1 2 3 4 5", expectedOutput: "1 15 1", isHidden: true },
      { input: "2\n10 0", expectedOutput: "10 10 1", isHidden: true },
      { input: "3\n1 0 0", expectedOutput: "1 1 1", isHidden: true },
      { input: "4\n12 8 0 5", expectedOutput: "12 25 1", isHidden: true },
      { input: "6\n2 4 6 8 10 12", expectedOutput: "2 42 1", isHidden: true },
      { input: "3\n99 1 50", expectedOutput: "99 150 1", isHidden: true }
    ],
    objective: "Compute the lower bound constant c1, upper bound constant c2, and threshold n0 to prove f(n) = Θ(n^d).",
    conceptualExplanation: [
      "Step 1: Read the polynomial coefficients from standard input.",
      "Step 2: The lower bound constant c1 is the leading coefficient (first coefficient).",
      "Step 3: The upper bound constant c2 is the sum of all coefficients.",
      "Step 4: The threshold n0 is 1.",
      "Step 5: Output c1, c2, and 1 separated by spaces."
    ]
  },
  {
    id: "ch_two_sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    inputFormat: "Line 1: A JSON array of integers `nums`\nLine 2: A single integer `target`",
    outputFormat: "A JSON array of two indices [i, j] representing the zero-based indices of the two numbers",
    hints: [
      "Think about using a Hash Map (or Dictionary) to remember numbers you've already seen as you iterate.",
      "For each element num at index i, calculate the complement: diff = target - num. Check if diff exists in the map.",
      "If the complement exists in the map, you've found the pair! Return [map[diff], i]. This achieves O(n) time and O(n) space."
    ],
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "nums[1] + nums[2] == 6."
      }
    ],
    starterCode: {
      cpp: "// Enter your code below\n",
      python: "# Enter your code below\n",
      javascript: "// Enter your code below\n",
      java: "// Enter your code below\n"
    },
    testCases: [
      { input: "[2, 7, 11, 15]\n9", expectedOutput: "[0, 1]", isHidden: false },
      { input: "[3, 2, 4]\n6", expectedOutput: "[1, 2]", isHidden: false },
      { input: "[3, 3]\n6", expectedOutput: "[0, 1]", isHidden: false },
      { input: "[1, 5, 7, 12, 19]\n20", expectedOutput: "[0, 4]", isHidden: true },
      { input: "[-3, 4, 3, 90]\n0", expectedOutput: "[0, 2]", isHidden: true },
      { input: "[0, 4, 3, 0]\n0", expectedOutput: "[0, 3]", isHidden: true },
      { input: "[-1, -2, -3, -4, -5]\n-8", expectedOutput: "[2, 4]", isHidden: true },
      { input: "[10, 20, 30, 40, 50, 60]\n100", expectedOutput: "[3, 5]", isHidden: true },
      { input: "[1000, 2000, 3000]\n5000", expectedOutput: "[1, 2]", isHidden: true },
      { input: "[7, 14, 21, 28, 35]\n49", expectedOutput: "[2, 3]", isHidden: true }
    ],
    objective: "Find two distinct indices in an array whose elements sum up to the target value.",
    conceptualExplanation: [
      "Step 1: Parse the array of numbers and the target sum.",
      "Step 2: Use a hash map storing value-to-index pairs for O(1) complements.",
      "Step 3: For each element at index i, calculate complement = target - nums[i].",
      "Step 4: If complement exists in map, return [map[complement], i].",
      "Step 5: Output the zero-indexed pair as a JSON array."
    ]
  },
  {
    id: "ch_valid_parentheses",
    title: "Valid Parentheses",
    difficulty: "Medium",
    category: "Stacks",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    inputFormat: "A single string s containing characters '(', ')', '{', '}', '[', ']'",
    outputFormat: "A single line with 'true' if the bracket sequences are valid, or 'false' otherwise",
    hints: [
      "A Last-In, First-Out (LIFO) stack is the natural data structure for bracket matching.",
      "When encountering an opening bracket '(', '{', or '[', push it onto the stack.",
      "When encountering a closing bracket, verify that the stack is non-empty and that the popped opening bracket matches this closing bracket.",
      "Ensure the stack is completely empty after iterating through the entire string to guard against unclosed brackets."
    ],
    examples: [
      { input: "()", output: "true", explanation: "Matching parentheses in proper order." },
      { input: "()[]{}", output: "true", explanation: "All consecutive pairs match properly." },
      { input: "(]", output: "false", explanation: "Mismatched closing bracket." }
    ],
    starterCode: {
      cpp: "// Enter your code below\n",
      python: "# Enter your code below\n",
      javascript: "// Enter your code below\n",
      java: "// Enter your code below\n"
    },
    testCases: [
      { input: "()", expectedOutput: "true", isHidden: false },
      { input: "()[]{}", expectedOutput: "true", isHidden: false },
      { input: "(]", expectedOutput: "false", isHidden: false },
      { input: "([)]", expectedOutput: "false", isHidden: true },
      { input: "{[]}", expectedOutput: "true", isHidden: true },
      { input: "]", expectedOutput: "false", isHidden: true },
      { input: "(((", expectedOutput: "false", isHidden: true },
      { input: "{[()]}", expectedOutput: "true", isHidden: true },
      { input: "(([]){})", expectedOutput: "true", isHidden: true },
      { input: "[", expectedOutput: "false", isHidden: true }
    ],
    objective: "Determine if an input string composed of brackets '()[]{}' has properly matched and nested pairs.",
    conceptualExplanation: [
      "Step 1: Initialize an empty stack data structure.",
      "Step 2: Iterate through each character; push opening brackets onto the stack.",
      "Step 3: When encountering a closing bracket, pop the stack and check matching type.",
      "Step 4: If stack is empty on closing bracket or doesn't match, return false.",
      "Step 5: Return true if stack is empty after the entire string is processed, else false."
    ]
  },
  {
    id: "ch_palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    constraints: [
      "1 <= s.length <= 2 * 10^5"
    ],
    inputFormat: "A single line containing the string s (may include punctuation, whitespace, and alphanumeric characters)",
    outputFormat: "A single line with 'true' if the cleaned string is a palindrome, or 'false' otherwise",
    hints: [
      "Convert the string to lowercase and filter out all characters that are not alphanumeric.",
      "A two-pointer approach (left pointer at start, right pointer at end) moving inward allows you to check palindrome symmetry with O(1) extra space.",
      "Consider how empty strings or strings with only non-alphanumeric characters behave (they are valid palindromes)."
    ],
    examples: [
      { input: "A man, a plan, a canal: Panama", output: "true", explanation: "Filtered to amanaplanacanalpanama which reads the same backward." },
      { input: "race a car", output: "false", explanation: "Filtered to raceacar which is not a palindrome." }
    ],
    starterCode: {
      cpp: "// Enter your code below\n",
      python: "# Enter your code below\n",
      javascript: "// Enter your code below\n",
      java: "// Enter your code below\n"
    },
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true", isHidden: false },
      { input: "race a car", expectedOutput: "false", isHidden: false },
      { input: " ", expectedOutput: "true", isHidden: false },
      { input: "0P", expectedOutput: "false", isHidden: true },
      { input: "ab_a", expectedOutput: "true", isHidden: true },
      { input: "Madam, I'm Adam", expectedOutput: "true", isHidden: true },
      { input: "No 'x' in Nixon", expectedOutput: "true", isHidden: true },
      { input: "Was it a car or a cat I saw?", expectedOutput: "true", isHidden: true },
      { input: "hello world", expectedOutput: "false", isHidden: true },
      { input: "12321", expectedOutput: "true", isHidden: true }
    ],
    objective: "Determine whether an alphanumeric string reads the same backwards as forwards ignoring non-alphanumerics and case.",
    conceptualExplanation: [
      "Step 1: Clean string by keeping alphanumeric chars and converting to lowercase.",
      "Step 2: Place left pointer at index 0 and right pointer at length - 1.",
      "Step 3: Compare characters at left and right pointers.",
      "Step 4: Increment left and decrement right while left < right.",
      "Step 5: Return 'true' if all characters match, else 'false'."
    ]
  },
  {
    id: "ch_max_subarray",
    title: "Maximum Subarray (Kadane's Algorithm)",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ],
    inputFormat: "A single JSON array of integers `nums` passed via standard input",
    outputFormat: "A single integer representing the maximum possible sum of any non-empty contiguous subarray",
    hints: [
      "Kadane's algorithm computes the maximum subarray sum in a single linear O(n) pass.",
      "At each element x, decide whether to append x to the ongoing running subarray sum, or start a fresh subarray at x.",
      "Keep track of the global maximum sum seen so far across all positions."
    ],
    examples: [
      { input: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", output: "6", explanation: "The contiguous subarray [4, -1, 2, 1] has the largest sum = 6." }
    ],
    starterCode: {
      cpp: "// Enter your code below\n",
      python: "# Enter your code below\n",
      javascript: "// Enter your code below\n",
      java: "// Enter your code below\n"
    },
    testCases: [
      { input: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", expectedOutput: "6", isHidden: false },
      { input: "[1]", expectedOutput: "1", isHidden: false },
      { input: "[5, 4, -1, 7, 8]", expectedOutput: "23", isHidden: false },
      { input: "[-1, -2, -3]", expectedOutput: "-1", isHidden: true },
      { input: "[-2, -1]", expectedOutput: "-1", isHidden: true },
      { input: "[1, 2, 3, 4]", expectedOutput: "10", isHidden: true },
      { input: "[-2, 1]", expectedOutput: "1", isHidden: true },
      { input: "[8, -19, 5, -4, 20]", expectedOutput: "21", isHidden: true },
      { input: "[-5, 4, -1, 7, -8, 10]", expectedOutput: "12", isHidden: true },
      { input: "[10, -5, 10, -5, 10]", expectedOutput: "20", isHidden: true }
    ],
    objective: "Find the contiguous subarray within an array of integers that has the largest sum using Kadane's algorithm.",
    conceptualExplanation: [
      "Step 1: Initialize currentSum = nums[0] and maxSum = nums[0].",
      "Step 2: Iterate through nums starting from index 1.",
      "Step 3: For each num, currentSum = max(num, currentSum + num).",
      "Step 4: Update maxSum = max(maxSum, currentSum).",
      "Step 5: Print the integer maximum subarray sum."
    ]
  }
];

// Helper to construct challenge
function makeChallenge({
  id,
  title,
  difficulty,
  category,
  description,
  inputFormat,
  outputFormat,
  constraints,
  examples,
  hints,
  objective,
  conceptualExplanation,
  testInputs,
  solver
}) {
  const testCases = testInputs.map((input, idx) => {
    const expectedOutput = solver(input);
    return {
      input,
      expectedOutput,
      isHidden: idx >= 3
    };
  });

  return {
    id,
    title,
    difficulty,
    category,
    description,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    hints,
    starterCode: {
      cpp: "// Enter your code below\n",
      python: "# Enter your code below\n",
      javascript: "// Enter your code below\n",
      java: "// Enter your code below\n"
    },
    testCases,
    objective,
    conceptualExplanation
  };
}

// Build 60 new challenges (4 per topic across 15 topics)
const newChallenges = [];

// ==========================================
// 1. ARRAYS
// ==========================================
newChallenges.push(
  makeChallenge({
    id: "ch_best_time_stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "Arrays",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    inputFormat: "A single line containing space-separated integers representing stock prices across consecutive days.",
    outputFormat: "A single integer: the maximum profit possible (or 0 if no profit).",
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    examples: [
      { input: "7 1 5 3 6 4", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5." },
      { input: "7 6 4 3 1", output: "0", explanation: "Prices are strictly decreasing, so no profitable transaction is possible." }
    ],
    hints: [
      "Keep track of the minimum purchase price observed so far as you iterate through the days.",
      "On each day, calculate the profit if you sold today: `currentPrice - minPriceSoFar`.",
      "Update your maximum recorded profit if the today's profit exceeds the previous best."
    ],
    objective: "Identify the optimal buying day and subsequent selling day to maximize financial gain.",
    conceptualExplanation: [
      "Step 1: Initialize minPrice = Infinity and maxProfit = 0.",
      "Step 2: Iterate over each price in the array.",
      "Step 3: If current price < minPrice, update minPrice.",
      "Step 4: Else if current price - minPrice > maxProfit, update maxProfit.",
      "Step 5: Output maxProfit to standard output."
    ],
    testInputs: [
      "7 1 5 3 6 4",
      "7 6 4 3 1",
      "2 4 1",
      "1 2",
      "3 3 3 3",
      "1 2 3 4 5",
      "5 4 3 2 10",
      "10 2 9 1 8",
      "3 8 2 5 1 9",
      "100 180 260 310 40 535 695"
    ],
    solver: (input) => {
      const prices = input.trim().split(/\s+/).map(Number);
      let min = Infinity, maxProfit = 0;
      for (const p of prices) {
        if (p < min) min = p;
        else if (p - min > maxProfit) maxProfit = p - min;
      }
      return String(maxProfit);
    }
  }),

  makeChallenge({
    id: "ch_product_except_self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    category: "Arrays",
    description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
    inputFormat: "A single line containing space-separated integers representing the array nums.",
    outputFormat: "A single line of space-separated integers representing the product array.",
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30", "The product of any prefix or suffix of nums fits in a 32-bit integer."],
    examples: [
      { input: "1 2 3 4", output: "24 12 8 6", explanation: "For index 0: 2*3*4=24. Index 1: 1*3*4=12. Index 2: 1*2*4=8. Index 3: 1*2*3=6." },
      { input: "-1 1 0 -3 3", output: "0 0 9 0 0", explanation: "Elements with zero yield zero product for other indices; zero index gets product of non-zero elements." }
    ],
    hints: [
      "Think about prefix products: construct an array where res[i] contains the product of all elements to the left of i.",
      "Then traverse from right to left with a running suffix product accumulator and multiply each res[i] by the suffix product.",
      "This computes all products without division in O(n) time and O(1) extra space excluding output."
    ],
    objective: "Compute the product of all other array elements for each index without using division.",
    conceptualExplanation: [
      "Step 1: Allocate result array of size n with initial value 1.",
      "Step 2: Traverse left-to-right maintaining prefix product; assign res[i] = prefix; multiply prefix by nums[i].",
      "Step 3: Traverse right-to-left maintaining suffix product; multiply res[i] by suffix; multiply suffix by nums[i].",
      "Step 4: Join result array with spaces.",
      "Step 5: Print output to standard output."
    ],
    testInputs: [
      "1 2 3 4",
      "-1 1 0 -3 3",
      "2 3",
      "4 5 1 8 2",
      "0 0",
      "1 0",
      "2 2 2 2",
      "5 2 3",
      "-2 -3 -4",
      "1 1 1 1 1"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const n = nums.length;
      const res = new Array(n).fill(1);
      let pre = 1;
      for (let i = 0; i < n; i++) { res[i] = pre; pre *= nums[i]; }
      let suf = 1;
      for (let i = n - 1; i >= 0; i--) { res[i] *= suf; suf *= nums[i]; }
      return res.join(" ");
    }
  }),

  makeChallenge({
    id: "ch_rotate_array",
    title: "Rotate Array by K Steps",
    difficulty: "Medium",
    category: "Arrays",
    description: "Given an integer array `nums`, rotate the array to the right by `k` steps, where `k` is non-negative.",
    inputFormat: "Line 1: Space-separated integers representing the array nums.\nLine 2: An integer k representing rotation steps.",
    outputFormat: "A single line containing space-separated integers of the rotated array.",
    constraints: ["1 <= nums.length <= 10^5", "-2^31 <= nums[i] <= 2^31 - 1", "0 <= k <= 10^5"],
    examples: [
      { input: "1 2 3 4 5 6 7\n3", output: "5 6 7 1 2 3 4", explanation: "Rotate 1 step: 7 1 2 3 4 5 6; 2 steps: 6 7 1 2 3 4 5; 3 steps: 5 6 7 1 2 3 4." },
      { input: "-1 -100 3 99\n2", output: "3 99 -1 -100", explanation: "Rotate 2 steps right moves the last two elements to the front." }
    ],
    hints: [
      "First reduce k modulo the length of the array: `k = k % nums.length`.",
      "The elements shifted to the front are the last k elements, followed by the first n - k elements.",
      "Alternatively, reverse the entire array, reverse the first k elements, and reverse the remaining n - k elements."
    ],
    objective: "Rotate all elements of an array circularly to the right by k positions.",
    conceptualExplanation: [
      "Step 1: Read array and rotation count k.",
      "Step 2: Normalize k = k % n to avoid redundant complete rotations.",
      "Step 3: If k == 0, return the original array.",
      "Step 4: Slice last k elements and prepend to the first n - k elements.",
      "Step 5: Output elements joined by single spaces."
    ],
    testInputs: [
      "1 2 3 4 5 6 7\n3",
      "-1 -100 3 99\n2",
      "1 2\n3",
      "1\n0",
      "1 2 3\n0",
      "1 2 3\n3",
      "1 2 3 4\n1",
      "10 20 30 40 50\n4",
      "5 6 7 8\n6",
      "9 8 7 6 5 4\n5"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const k = parseInt(lines[1].trim(), 10) % nums.length;
      if (k === 0) return nums.join(" ");
      return [...nums.slice(nums.length - k), ...nums.slice(0, nums.length - k)].join(" ");
    }
  }),

  makeChallenge({
    id: "ch_merge_sorted_arrays",
    title: "Merge Two Sorted Arrays",
    difficulty: "Easy",
    category: "Arrays",
    description: "You are given two integer arrays `nums1` and `nums2`, each sorted in non-decreasing order.\n\nMerge `nums1` and `nums2` into a single sorted array sorted in non-decreasing order.",
    inputFormat: "Line 1: Space-separated integers of the first sorted array.\nLine 2: Space-separated integers of the second sorted array.",
    outputFormat: "A single line containing space-separated integers of the combined sorted array.",
    constraints: ["0 <= nums1.length, nums2.length <= 10^4", "-10^9 <= nums1[i], nums2[j] <= 10^9"],
    examples: [
      { input: "1 3 5\n2 4 6", output: "1 2 3 4 5 6", explanation: "Elements are merged in ascending order." },
      { input: "1 2 3\n4 5 6", output: "1 2 3 4 5 6", explanation: "All elements of nums2 are greater than nums1." }
    ],
    hints: [
      "Use two pointers, one starting at nums1 and another at nums2.",
      "Compare elements at both pointers; take the smaller one and advance that pointer.",
      "Append any remaining elements once one array is exhausted."
    ],
    objective: "Combine two ordered arrays into a single unified ascending array in linear time.",
    conceptualExplanation: [
      "Step 1: Parse both sorted integer sequences.",
      "Step 2: Use two pointers i = 0, j = 0 and an output array.",
      "Step 3: While both pointers in bounds, push min(nums1[i], nums2[j]) and advance.",
      "Step 4: Push remaining elements from either array.",
      "Step 5: Output merged array space-separated."
    ],
    testInputs: [
      "1 3 5\n2 4 6",
      "1 2 3\n4 5 6",
      "5\n1 2 3",
      "1 5 9\n2 6 10",
      "2\n1",
      "10 20 30\n5 15 25 35",
      "-5 -2 0\n-3 1 4",
      "1 1 1\n2 2 2",
      "4 7 9\n3 5 8 10",
      "100\n50 150"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const a = lines[0].trim() ? lines[0].trim().split(/\s+/).map(Number) : [];
      const b = lines[1].trim() ? lines[1].trim().split(/\s+/).map(Number) : [];
      return [...a, ...b].sort((x, y) => x - y).join(" ");
    }
  })
);

// Save progress log
console.log("Topic 1 (Arrays) generated. Total new:", newChallenges.length);
