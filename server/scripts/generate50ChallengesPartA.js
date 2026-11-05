/**
 * Part A: 50 Unique Algorithmic Challenges (1 - 50)
 * Each challenge includes an exact solver and 10 raw test inputs.
 */

const partA = [
  // 1. Plus One
  {
    id: "ch_plus_one",
    title: "Plus One Large Integer",
    difficulty: "Easy",
    category: "Arrays",
    description: "You are given a large integer represented as an integer array `digits`, where each `digits[i]` is the i-th digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading 0's.\n\nIncrement the large integer by one and return the resulting array of digits.",
    constraints: ["1 <= digits.length <= 100", "0 <= digits[i] <= 9", "digits does not contain any leading 0's."],
    inputFormat: "Line 1: Space-separated integers representing digits.",
    outputFormat: "Space-separated integers representing the incremented digits.",
    hints: ["Traverse from the last digit to the first.", "If a digit is less than 9, increment and return.", "If 9, set to 0 and continue to propagate carry."],
    objective: "Increment a big integer represented as an array of digits by one.",
    conceptualExplanation: ["Start from the rightmost digit.", "If < 9, add 1 and stop.", "If 9, set to 0 and propagate carry left.", "If all digits were 9, prepend 1."],
    solve: (input) => {
      const digits = input.trim().split(/\s+/).map(Number);
      for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] < 9) {
          digits[i]++;
          return digits.join(" ");
        }
        digits[i] = 0;
      }
      return [1, ...digits].join(" ");
    },
    rawInputs: [
      "1 2 3",
      "4 3 2 1",
      "9",
      "9 9 9",
      "0",
      "1 0 9 9",
      "8 9 9 9",
      "2 9 9",
      "5 4 3 2 1 0",
      "9 9 9 9 9 9 9 9 9"
    ]
  },

  // 2. Remove Element
  {
    id: "ch_remove_element",
    title: "Remove Element in Place",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in `nums` in-place. The order of the elements may be changed. Then return the number of elements in `nums` which are not equal to `val`.\n\nOutput the remaining count k followed by the space-separated elements.",
    constraints: ["0 <= nums.length <= 100", "0 <= nums[i] <= 50", "0 <= val <= 100"],
    inputFormat: "Line 1: Space-separated integers representing nums (empty string if empty array).\nLine 2: Single integer val.",
    outputFormat: "Line 1: Integer count k.\nLine 2: Space-separated remaining elements (empty if k = 0).",
    hints: ["Use a two-pointer approach.", "One pointer reads, the other writes non-val elements."],
    objective: "Remove target elements in-place and return remaining count and array.",
    conceptualExplanation: ["Maintain write pointer k = 0.", "Scan array: if nums[i] !== val, write to nums[k] and k++.", "Return k and the sliced array."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const numsStr = lines[0] ? lines[0].trim() : "";
      const val = parseInt(lines[1], 10);
      const nums = numsStr ? numsStr.split(/\s+/).map(Number) : [];
      const remaining = nums.filter(x => x !== val);
      return `${remaining.length}\n${remaining.join(" ")}`.trim();
    },
    rawInputs: [
      "3 2 2 3\n3",
      "0 1 2 2 3 0 4 2\n2",
      "1\n1",
      "1 2 3 4 5\n6",
      "4 4 4 4\n4",
      "5 1 5 2 5 3\n5",
      "7 8 9 10\n7",
      "2 2 2 1\n2",
      "10 20 30\n20",
      "100\n0"
    ]
  },

  // 3. Majority Element
  {
    id: "ch_majority_element",
    title: "Majority Element (Boyer-Moore)",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array `nums` of size n, return the majority element. The majority element is the element that appears more than ⌊n / 2⌋ times. You may assume that the majority element always exists in the array.",
    constraints: ["n == nums.length", "1 <= n <= 5 * 10^4", "-10^9 <= nums[i] <= 10^9"],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "A single integer representing the majority element.",
    hints: ["Can you do it in linear time and O(1) space?", "Boyer-Moore Voting Algorithm cancels opposing votes."],
    objective: "Find the majority element in an array using O(1) extra memory.",
    conceptualExplanation: ["Initialize candidate = nums[0], count = 0.", "Increment count when element matches candidate, else decrement.", "When count reaches 0, select current element as new candidate."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let cand = nums[0], count = 0;
      for (const x of nums) {
        if (count === 0) cand = x;
        count += (x === cand ? 1 : -1);
      }
      return String(cand);
    },
    rawInputs: [
      "3 2 3",
      "2 2 1 1 1 2 2",
      "1",
      "6 6 6 7 7",
      "10 10 20 10 30 10 10",
      "-1 -1 -1 2 3 -1",
      "100 200 100",
      "5 5 5 5 1 2 3",
      "0 0 0 1 0",
      "42 42 42 42 42 1 2 3 4"
    ]
  },

  // 4. Find Pivot Index
  {
    id: "ch_find_pivot_index",
    title: "Find Pivot Index",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array of integers `nums`, calculate the pivot index of this array. The pivot index is the index where the sum of all the numbers strictly to the left of the index is equal to the sum of all the numbers strictly to the index's right. Return the leftmost pivot index. If no such index exists, return -1.",
    constraints: ["1 <= nums.length <= 10^4", "-1000 <= nums[i] <= 1000"],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "An integer representing the pivot index, or -1.",
    hints: ["Precompute the total sum.", "Iterate and maintain leftSum; check if leftSum === totalSum - leftSum - nums[i]."],
    objective: "Identify the index where prefix sum equals suffix sum.",
    conceptualExplanation: ["Calculate totalSum.", "Iterate through elements maintaining leftSum.", "At index i, rightSum = totalSum - leftSum - nums[i]. If equal, return i."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const total = nums.reduce((a, b) => a + b, 0);
      let left = 0;
      for (let i = 0; i < nums.length; i++) {
        if (left === total - left - nums[i]) return String(i);
        left += nums[i];
      }
      return "-1";
    },
    rawInputs: [
      "1 7 3 6 5 6",
      "1 2 3",
      "2 1 -1",
      "0 0 0 0",
      "-1 -1 -1 -1 -1 0",
      "1 -1 2",
      "10",
      "2 3 5 5",
      "5 1 2 3 2 1",
      "-1 -1 0 1 1 0"
    ]
  },

  // 5. Running Sum of 1D Array
  {
    id: "ch_running_sum",
    title: "Running Sum of 1D Array",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array `nums`. We define a running sum of an array as `runningSum[i] = sum(nums[0]…nums[i])`. Return the running sum of nums.",
    constraints: ["1 <= nums.length <= 1000", "-10^6 <= nums[i] <= 10^6"],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "Space-separated integers representing running sum.",
    hints: ["Keep a cumulative sum as you iterate."],
    objective: "Compute cumulative prefix sums across an array.",
    conceptualExplanation: ["Iterate through array.", "Add each element to cumulative sum.", "Return formatted results."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let sum = 0;
      return nums.map(x => { sum += x; return sum; }).join(" ");
    },
    rawInputs: [
      "1 2 3 4",
      "1 1 1 1 1",
      "3 1 2 10 1",
      "0 0 0",
      "-1 -2 -3 -4",
      "100",
      "5 -5 5 -5",
      "10 20 30 40 50",
      "-10 20 -30 40",
      "1 0 2 0 3"
    ]
  },

  // 6. Monotonic Array
  {
    id: "ch_monotonic_array",
    title: "Monotonic Array",
    difficulty: "Easy",
    category: "Arrays",
    description: "An array is monotonic if it is either monotone increasing or monotone decreasing. Return `true` if the given array is monotonic, or `false` otherwise.",
    constraints: ["1 <= nums.length <= 10^5", "-10^5 <= nums[i] <= 10^5"],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "true or false",
    hints: ["Check if nums is non-decreasing OR non-increasing."],
    objective: "Determine if an array maintains monotonic order.",
    conceptualExplanation: ["Flag increasing = true, decreasing = true.", "If nums[i] > nums[i-1], decreasing = false.", "If nums[i] < nums[i-1], increasing = false.", "Return increasing || decreasing."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let inc = true, dec = true;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] > nums[i - 1]) dec = false;
        if (nums[i] < nums[i - 1]) inc = false;
      }
      return String(inc || dec);
    },
    rawInputs: [
      "1 2 2 3",
      "6 5 4 4",
      "1 3 2",
      "1",
      "1 1 1 1",
      "1 2 4 5",
      "5 3 2 1",
      "2 2 2 1 4",
      "-5 -3 -1 0 2",
      "10 20 15 30"
    ]
  },

  // 7. Transpose Matrix
  {
    id: "ch_transpose_matrix",
    title: "Transpose Matrix",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given a 2D integer array `matrix`, return the transpose of `matrix`. The transpose of a matrix is the matrix flipped over its main diagonal, switching the matrix's row and column indices.",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 1000", "1 <= m * n <= 10^5", "-10^9 <= matrix[i][j] <= 10^9"],
    inputFormat: "Line 1: Two integers m and n.\nNext m lines: n space-separated integers per row.",
    outputFormat: "n lines of m space-separated integers representing transposed matrix.",
    hints: ["The element at row i, col j moves to row j, col i."],
    objective: "Transpose rows and columns of an m x n matrix.",
    conceptualExplanation: ["Create new n x m matrix.", "Assign transposed[j][i] = matrix[i][j]."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const matrix = [];
      for (let i = 1; i <= m; i++) {
        matrix.push(lines[i].trim().split(/\s+/).map(Number));
      }
      const res = [];
      for (let j = 0; j < n; j++) {
        const row = [];
        for (let i = 0; i < m; i++) {
          row.push(matrix[i][j]);
        }
        res.push(row.join(" "));
      }
      return res.join("\n");
    },
    rawInputs: [
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "2 3\n1 2 3\n4 5 6",
      "1 1\n42",
      "1 3\n10 20 30",
      "3 1\n10\n20\n30",
      "2 2\n1 0\n0 1",
      "2 2\n5 8\n9 3",
      "3 2\n1 2\n3 4\n5 6",
      "2 4\n1 2 3 4\n5 6 7 8",
      "4 2\n1 2\n3 4\n5 6\n7 8"
    ]
  },

  // 8. Set Matrix Zeroes
  {
    id: "ch_set_matrix_zeroes",
    title: "Set Matrix Zeroes",
    difficulty: "Medium",
    category: "Arrays",
    description: "Given an m x n integer matrix, if an element is 0, set its entire row and column to 0's in-place.",
    constraints: ["m == matrix.length", "n == matrix[0].length", "1 <= m, n <= 200", "-2^31 <= matrix[i][j] <= 2^31 - 1"],
    inputFormat: "Line 1: Dimensions m and n.\nNext m lines: n space-separated integers per row.",
    outputFormat: "m lines representing the modified matrix.",
    hints: ["Use the first row and column as markers to achieve O(1) space."],
    objective: "Zero out full rows and columns for any cell containing zero.",
    conceptualExplanation: ["Mark rows and cols that contain zero.", "Second pass: set cells to zero if row or col is marked."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) mat.push(lines[i].trim().split(/\s+/).map(Number));
      const zeroRows = new Set();
      const zeroCols = new Set();
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (mat[i][j] === 0) {
            zeroRows.add(i);
            zeroCols.add(j);
          }
        }
      }
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (zeroRows.has(i) || zeroCols.has(j)) mat[i][j] = 0;
        }
      }
      return mat.map(r => r.join(" ")).join("\n");
    },
    rawInputs: [
      "3 3\n1 1 1\n1 0 1\n1 1 1",
      "3 4\n0 1 2 0\n3 4 5 2\n1 3 1 5",
      "1 1\n0",
      "1 1\n5",
      "2 2\n1 2\n3 4",
      "2 2\n1 0\n3 4",
      "3 1\n1\n0\n3",
      "1 3\n1 0 3",
      "3 3\n0 0 0\n0 0 0\n0 0 0",
      "3 3\n1 2 3\n4 0 6\n7 8 9"
    ]
  },

  // 9. Spiral Matrix Traversal
  {
    id: "ch_spiral_matrix",
    title: "Spiral Matrix Traversal",
    difficulty: "Medium",
    category: "Arrays",
    description: "Given an m x n matrix, return all elements of the matrix in spiral order (clockwise starting from top-left).",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 20", "-100 <= matrix[i][j] <= 100"],
    inputFormat: "Line 1: Dimensions m and n.\nNext m lines: n space-separated integers per row.",
    outputFormat: "A single line with space-separated integers in spiral order.",
    hints: ["Maintain 4 boundaries: top, bottom, left, right.", "Traverse right, down, left, up and shrink boundaries."],
    objective: "Traverse matrix elements in clockwise spiral order.",
    conceptualExplanation: ["Initialize top=0, bottom=m-1, left=0, right=n-1.", "Loop while top <= bottom and left <= right.", "Collect elements along 4 edges and advance bounds."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) mat.push(lines[i].trim().split(/\s+/).map(Number));
      const res = [];
      let top = 0, bottom = m - 1, left = 0, right = n - 1;
      while (top <= bottom && left <= right) {
        for (let j = left; j <= right; j++) res.push(mat[top][j]);
        top++;
        for (let i = top; i <= bottom; i++) res.push(mat[i][right]);
        right--;
        if (top <= bottom) {
          for (let j = right; j >= left; j--) res.push(mat[bottom][j]);
          bottom--;
        }
        if (left <= right) {
          for (let i = bottom; i >= top; i--) res.push(mat[i][left]);
          left++;
        }
      }
      return res.join(" ");
    },
    rawInputs: [
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12",
      "1 1\n99",
      "1 4\n1 2 3 4",
      "4 1\n1\n2\n3\n4",
      "2 2\n1 2\n3 4",
      "2 3\n1 2 3\n4 5 6",
      "3 2\n1 2\n3 4\n5 6",
      "4 4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
      "3 1\n5\n10\n15"
    ]
  },

  // 10. Rotate Image 90 Degrees Clockwise
  {
    id: "ch_rotate_image",
    title: "Rotate Image 90 Degrees Clockwise",
    difficulty: "Medium",
    category: "Arrays",
    description: "You are given an n x n 2D matrix representing an image. Rotate the image by 90 degrees (clockwise) in-place.",
    constraints: ["n == matrix.length == matrix[i].length", "1 <= n <= 20", "-1000 <= matrix[i][j] <= 1000"],
    inputFormat: "Line 1: Integer n.\nNext n lines: n space-separated integers per row.",
    outputFormat: "n lines of space-separated integers representing rotated matrix.",
    hints: ["Transpose the matrix (swap matrix[i][j] with matrix[j][i]).", "Reverse each row horizontally."],
    objective: "Rotate a square matrix 90 degrees clockwise in-place.",
    conceptualExplanation: ["Step 1: Transpose matrix along main diagonal.", "Step 2: Reverse each row.", "Result is a 90-degree clockwise rotation."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0], 10);
      const mat = [];
      for (let i = 1; i <= n; i++) mat.push(lines[i].trim().split(/\s+/).map(Number));
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const tmp = mat[i][j];
          mat[i][j] = mat[j][i];
          mat[j][i] = tmp;
        }
      }
      for (let i = 0; i < n; i++) mat[i].reverse();
      return mat.map(r => r.join(" ")).join("\n");
    },
    rawInputs: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "4\n5 1 9 11\n2 4 8 10\n13 3 6 7\n15 14 12 16",
      "1\n1",
      "2\n1 2\n3 4",
      "2\n0 0\n0 0",
      "3\n1 0 0\n0 1 0\n0 0 1",
      "3\n9 8 7\n6 5 4\n3 2 1",
      "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
      "2\n-1 -2\n-3 -4",
      "3\n1 4 7\n2 5 8\n3 6 9"
    ]
  },

  // 11. Diagonal Traverse
  {
    id: "ch_diagonal_traverse",
    title: "Diagonal Traverse",
    difficulty: "Medium",
    category: "Arrays",
    description: "Given an m x n matrix `mat`, return an array of all the elements of the array in a diagonal order (alternating up-right and down-left directions).",
    constraints: ["m == mat.length", "n == mat[i].length", "1 <= m, n <= 100", "-10^5 <= mat[i][j] <= 10^5"],
    inputFormat: "Line 1: Dimensions m and n.\nNext m lines: n space-separated integers per row.",
    outputFormat: "Space-separated integers in diagonal order.",
    hints: ["Group elements by their diagonal sum d = i + j.", "Even sums go upwards (reverse order), odd sums go downwards."],
    objective: "Traverse matrix along alternating diagonal stripes.",
    conceptualExplanation: ["Sum of coordinates (i + j) is constant along diagonals.", "Collect elements by sum (i + j).", "Reverse elements on even sums."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) mat.push(lines[i].trim().split(/\s+/).map(Number));
      const diags = {};
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          const sum = i + j;
          if (!diags[sum]) diags[sum] = [];
          diags[sum].push(mat[i][j]);
        }
      }
      const res = [];
      const totalDiags = m + n - 1;
      for (let d = 0; d < totalDiags; d++) {
        if (d % 2 === 0) {
          res.push(...diags[d].reverse());
        } else {
          res.push(...diags[d]);
        }
      }
      return res.join(" ");
    },
    rawInputs: [
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "2 2\n1 2\n3 4",
      "1 1\n7",
      "1 3\n1 2 3",
      "3 1\n1\n2\n3",
      "2 3\n1 2 3\n4 5 6",
      "3 2\n1 2\n3 4\n5 6",
      "4 4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
      "2 4\n1 2 3 4\n5 6 7 8",
      "3 3\n0 1 0\n1 0 1\n0 1 0"
    ]
  },

  // 12. Ransom Note
  {
    id: "ch_ransom_note",
    title: "Ransom Note Construction",
    difficulty: "Easy",
    category: "Strings",
    description: "Given two strings `ransomNote` and `magazine`, return `true` if `ransomNote` can be constructed by using the letters from `magazine` and `false` otherwise. Each letter in `magazine` can only be used once in `ransomNote`.",
    constraints: ["1 <= ransomNote.length, magazine.length <= 10^5", "ransomNote and magazine consist of lowercase English letters."],
    inputFormat: "Line 1: ransomNote\nLine 2: magazine",
    outputFormat: "true or false",
    hints: ["Count character frequencies in magazine.", "Check if magazine has enough counts for each character in ransomNote."],
    objective: "Determine if a string can be constructed from a character pool.",
    conceptualExplanation: ["Tally magazine letters in a frequency hash map.", "Iterate ransomNote: decrement count. If missing or 0, return false.", "Return true."],
    solve: (input) => {
      const [note, mag] = input.trim().split("\n");
      const counts = {};
      for (const ch of (mag || "")) counts[ch] = (counts[ch] || 0) + 1;
      for (const ch of (note || "")) {
        if (!counts[ch]) return "false";
        counts[ch]--;
      }
      return "true";
    },
    rawInputs: [
      "a\nb",
      "aa\nab",
      "aa\naab",
      "hello\nolelhworld",
      "leetcode\ncodeleet",
      "abc\ndef",
      "zzz\nzz",
      "cat\ntacoma",
      "test\ntest",
      "abc\nabcdef"
    ]
  },

  // 13. Isomorphic Strings
  {
    id: "ch_isomorphic_strings",
    title: "Isomorphic Strings",
    difficulty: "Easy",
    category: "Strings",
    description: "Given two strings `s` and `t`, determine if they are isomorphic. Two strings `s` and `t` are isomorphic if the characters in `s` can be replaced to get `t`. All occurrences of a character must be replaced with another character while preserving the order of characters. No two characters may map to the same character, but a character may map to itself.",
    constraints: ["1 <= s.length <= 5 * 10^4", "t.length == s.length", "s and t consist of any valid ascii character."],
    inputFormat: "Line 1: String s\nLine 2: String t",
    outputFormat: "true or false",
    hints: ["Use two maps to track s->t and t->s mappings.", "Ensure bijection."],
    objective: "Verify one-to-one character correspondence between two strings.",
    conceptualExplanation: ["Map s[i] -> t[i] and t[i] -> s[i].", "If conflict occurs at any index, return false.", "Return true if bijection holds."],
    solve: (input) => {
      const [s, t] = input.trim().split("\n");
      if (s.length !== t.length) return "false";
      const mapST = {}, mapTS = {};
      for (let i = 0; i < s.length; i++) {
        const c1 = s[i], c2 = t[i];
        if (mapST[c1] && mapST[c1] !== c2) return "false";
        if (mapTS[c2] && mapTS[c2] !== c1) return "false";
        mapST[c1] = c2;
        mapTS[c2] = c1;
      }
      return "true";
    },
    rawInputs: [
      "egg\nadd",
      "foo\nbar",
      "paper\ntitle",
      "badc\nbaba",
      "a\na",
      "ab\naa",
      "abcdef\nabcdef",
      "turtle\nturing",
      "bbbaaaba\naaabbbab",
      "paper\ntitles"
    ]
  },

  // 14. Word Pattern
  {
    id: "ch_word_pattern",
    title: "Word Pattern Bijection",
    difficulty: "Easy",
    category: "Strings",
    description: "Given a `pattern` and a string `s`, find if `s` follows the same pattern. Here follow means a full match, such that there is a bijection between a letter in `pattern` and a non-empty word in `s`.",
    constraints: ["1 <= pattern.length <= 300", "pattern contains only lower-case English letters.", "1 <= s.length <= 3000", "s contains only lowercase English letters and spaces ' '."],
    inputFormat: "Line 1: pattern\nLine 2: string s",
    outputFormat: "true or false",
    hints: ["Split s into words.", "Check pattern.length === words.length.", "Enforce two-way map."],
    objective: "Verify bijective mapping between pattern letters and words.",
    conceptualExplanation: ["Split s into words.", "If lengths mismatch, return false.", "Check letter-to-word and word-to-letter consistency."],
    solve: (input) => {
      const [pattern, s] = input.trim().split("\n");
      const words = s.trim().split(/\s+/);
      if (pattern.length !== words.length) return "false";
      const p2w = {}, w2p = {};
      for (let i = 0; i < pattern.length; i++) {
        const p = pattern[i], w = words[i];
        if (p2w[p] && p2w[p] !== w) return "false";
        if (w2p[w] && w2p[w] !== p) return "false";
        p2w[p] = w;
        w2p[w] = p;
      }
      return "true";
    },
    rawInputs: [
      "abba\ndog cat cat dog",
      "abba\ndog cat cat fish",
      "aaaa\ndog cat cat dog",
      "abba\ndog dog dog dog",
      "a\nfish",
      "abc\ncat dog bird",
      "aaa\naaa aaa aaa",
      "aba\ncat dog cat",
      "ab\nred blue",
      "abc\ncat dog"
    ]
  },

  // 15. Reverse Words in a String
  {
    id: "ch_reverse_words",
    title: "Reverse Words in a String",
    difficulty: "Medium",
    category: "Strings",
    description: "Given an input string `s`, reverse the order of the words. A word is defined as a sequence of non-space characters. The words in `s` will be separated by at least one space. Return a string of the words in reverse order concatenated by a single space.",
    constraints: ["1 <= s.length <= 10^4", "s contains English letters, digits, and spaces ' '."],
    inputFormat: "A single line containing string s.",
    outputFormat: "The words in reverse order separated by a single space.",
    hints: ["Split by whitespace, filter empty tokens, reverse and join with space."],
    objective: "Reverse word sequence while cleaning multiple spaces.",
    conceptualExplanation: ["Trim leading/trailing whitespace.", "Split by regex /\\s+/ to handle consecutive spaces.", "Reverse word list and join with a single space."],
    solve: (input) => {
      const words = input.trim().split(/\s+/).filter(Boolean);
      return words.reverse().join(" ");
    },
    rawInputs: [
      "the sky is blue",
      "  hello world  ",
      "a good   example",
      "word",
      "   single   ",
      "Bob Loves Alice",
      "Alice does not love Bob",
      "1 2 3 4 5",
      "   multiple   spaces    between    words   ",
      "Open Source Community"
    ]
  },

  // 16. Length of Last Word
  {
    id: "ch_length_last_word",
    title: "Length of Last Word",
    difficulty: "Easy",
    category: "Strings",
    description: "Given a string `s` consisting of words and spaces, return the length of the last word in the string. A word is a maximal substring consisting of non-space characters only.",
    constraints: ["1 <= s.length <= 10^4", "s consists of only English letters and spaces ' '."],
    inputFormat: "A single line containing string s.",
    outputFormat: "An integer representing the length of the last word.",
    hints: ["Trim spaces from right, then count characters until next space."],
    objective: "Find the character count of the terminal word in a string.",
    conceptualExplanation: ["Trim string.", "Find last word.", "Return length."],
    solve: (input) => {
      const words = input.trim().split(/\s+/).filter(Boolean);
      return String(words[words.length - 1].length);
    },
    rawInputs: [
      "Hello World",
      "   fly me   to   the moon  ",
      "luffy is still joyboy",
      "a",
      "day",
      "   singleword   ",
      "Today is a nice day",
      "test string ending with wordlengthten",
      "b a",
      "c d e f g"
    ]
  },

  // 17. Valid Palindrome II
  {
    id: "ch_valid_palindrome_ii",
    title: "Valid Palindrome II (At Most One Deletion)",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given a string `s`, return `true` if the `s` can be palindrome after deleting at most one character from it.",
    constraints: ["1 <= s.length <= 10^5", "s consists of lowercase English letters."],
    inputFormat: "A single line containing string s.",
    outputFormat: "true or false",
    hints: ["Use two pointers from left and right.", "When mismatch occurs, check if skipping left or skipping right yields a palindrome."],
    objective: "Determine palindrome feasibility allowing at most one character deletion.",
    conceptualExplanation: ["Two pointers l=0, r=s.length-1.", "While l < r: if s[l] == s[r] continue.", "Else check if substring s[l+1..r] or s[l..r-1] is a palindrome."],
    solve: (input) => {
      const s = input.trim();
      const isPal = (str, i, j) => {
        while (i < j) {
          if (str[i] !== str[j]) return false;
          i++; j--;
        }
        return true;
      };
      let l = 0, r = s.length - 1;
      while (l < r) {
        if (s[l] !== s[r]) {
          return String(isPal(s, l + 1, r) || isPal(s, l, r - 1));
        }
        l++; r--;
      }
      return "true";
    },
    rawInputs: [
      "aba",
      "abca",
      "abc",
      "racecar",
      "deeee",
      "aguokepatgbnvfqmgmlcupuufxoohdfpgjdmysgvhmvffcnqxjjxqncffvmhvgvysmdjgpfdhooxfuupuculmgmqfvnbgtapekouga",
      "tebbem",
      "pidqr",
      "eeccccbebaeeabebccceea",
      "ab"
    ]
  },

  // 18. Reverse Vowels of a String
  {
    id: "ch_reverse_vowels",
    title: "Reverse Vowels of a String",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given a string `s`, reverse only all the vowels in the string and return it. The vowels are 'a', 'e', 'i', 'o', and 'u', and they can appear in both lower and upper cases, more than once.",
    constraints: ["1 <= s.length <= 3 * 10^5", "s consist of printable ASCII characters."],
    inputFormat: "A single line containing string s.",
    outputFormat: "String with reversed vowels.",
    hints: ["Two pointers from both ends, swap vowels."],
    objective: "Reverse vowel positions while preserving consonant order.",
    conceptualExplanation: ["Left and right pointers.", "Advance left until vowel, decrease right until vowel.", "Swap and repeat."],
    solve: (input) => {
      const s = input.trim().split("");
      const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']);
      let l = 0, r = s.length - 1;
      while (l < r) {
        while (l < r && !vowels.has(s[l])) l++;
        while (l < r && !vowels.has(s[r])) r--;
        if (l < r) {
          const tmp = s[l];
          s[l] = s[r];
          s[r] = tmp;
          l++; r--;
        }
      }
      return s.join("");
    },
    rawInputs: [
      "IceCreAm",
      "leetcode",
      "hello",
      "aeiou",
      "bcdfg",
      "aA",
      "race car",
      "MasteryZone",
      "Algorithm",
      "Python"
    ]
  },

  // 19. Squares of a Sorted Array
  {
    id: "ch_squares_sorted_array",
    title: "Squares of a Sorted Array (Two Pointers)",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given an integer array `nums` sorted in non-decreasing order, return an array of the squares of each number sorted in non-decreasing order in O(N) time.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4", "nums is sorted in non-decreasing order."],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "Space-separated integers representing sorted squares.",
    hints: ["Largest squares are at the extremes (far left or far right).", "Fill result array from back to front."],
    objective: "Square and sort a sorted array with negative numbers in linear time.",
    conceptualExplanation: ["Two pointers at left and right.", "Compare absolute values; place larger square at the end of output array.", "Decrement write position."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const n = nums.length;
      const res = new Array(n);
      let l = 0, r = n - 1, pos = n - 1;
      while (l <= r) {
        if (Math.abs(nums[l]) > Math.abs(nums[r])) {
          res[pos] = nums[l] * nums[l];
          l++;
        } else {
          res[pos] = nums[r] * nums[r];
          r--;
        }
        pos--;
      }
      return res.join(" ");
    },
    rawInputs: [
      "-4 -1 0 3 10",
      "-7 -3 2 3 11",
      "-5 -4 -3 -2 -1",
      "0",
      "1 2 3 4 5",
      "-10 0 10",
      "-2 -1 0 1 2",
      "-100",
      "-50 -20 0 10 30",
      "-3 -3 -3 3 3"
    ]
  },

  // 20. Move Zeroes
  {
    id: "ch_move_zeroes",
    title: "Move Zeroes in Place",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given an integer array `nums`, move all 0's to the end of it while maintaining the relative order of the non-zero elements. You must do this in-place without making a copy of the array.",
    constraints: ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "Space-separated integers after moving zeroes.",
    hints: ["Use a slow pointer to track next position for non-zero element."],
    objective: "Shift zeroes to array end preserving order in-place.",
    conceptualExplanation: ["Maintain write index pos = 0.", "Copy non-zero values to nums[pos++].", "Fill remainder of array from pos to end with zeroes."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let pos = 0;
      for (const x of nums) {
        if (x !== 0) nums[pos++] = x;
      }
      while (pos < nums.length) nums[pos++] = 0;
      return nums.join(" ");
    },
    rawInputs: [
      "0 1 0 3 12",
      "0",
      "1 0",
      "0 0 1",
      "4 2 4 0 0 3 0 5 1 0",
      "1 2 3 4 5",
      "0 0 0 0",
      "-1 0 -2 0 -3",
      "100 0 200 0 300",
      "0 5 0 10 0 15 0"
    ]
  },

  // 21. Backspace String Compare
  {
    id: "ch_backspace_compare",
    title: "Backspace String Compare",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given two strings `s` and `t`, return `true` if they are equal when both are typed into empty text editors. '#' means a backspace character. Note that after backspacing an empty text, the text will continue empty.",
    constraints: ["1 <= s.length, t.length <= 200", "s and t only contain lowercase letters and '#' characters."],
    inputFormat: "Line 1: String s\nLine 2: String t",
    outputFormat: "true or false",
    hints: ["Simulate typing using stacks or traverse backwards using skip counters."],
    objective: "Compare strings after processing backspace '#' characters.",
    conceptualExplanation: ["Process strings from left to right simulating stack or backwards.", "Return whether final strings match."],
    solve: (input) => {
      const [s, t] = input.trim().split("\n");
      const build = (str) => {
        const stack = [];
        for (const ch of (str || "")) {
          if (ch === '#') stack.pop();
          else stack.push(ch);
        }
        return stack.join("");
      };
      return String(build(s) === build(t));
    },
    rawInputs: [
      "ab#c\nad#c",
      "ab##\nc#d#",
      "a#c\nb",
      "y#fo##f\ny#f#o##f",
      "a##b\nb",
      "###\n#",
      "bxj##tw\nbxj###tw",
      "abc###\n#",
      "xywrrmp\nxywrrm#p",
      "a#b#c#\nd#e#f#"
    ]
  },

  // 22. 4Sum Problem
  {
    id: "ch_four_sum",
    title: "4Sum Quadruplets",
    difficulty: "Medium",
    category: "Two Pointers",
    description: "Given an array `nums` of n integers, return an array of all the unique quadruplets `[nums[a], nums[b], nums[c], nums[d]]` such that `a, b, c, d` are distinct and `nums[a] + nums[b] + nums[c] + nums[d] == target`. Output the count of quadruplets on line 1, and each quadruplet on a new line (space-separated, sorted).",
    constraints: ["1 <= nums.length <= 200", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
    inputFormat: "Line 1: Space-separated integers representing nums.\nLine 2: Single integer target.",
    outputFormat: "Line 1: Integer count.\nSubsequent lines: Space-separated quadruplet.",
    hints: ["Sort array.", "Fix two outer numbers and use two pointers for the inner pair."],
    objective: "Find all unique 4-element combinations summing to target.",
    conceptualExplanation: ["Sort nums.", "Loop i from 0..n-4, loop j from i+1..n-3.", "Use two pointers l and r to find remaining two elements.", "Skip duplicate elements."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      const target = parseInt(lines[1], 10);
      const res = [];
      const n = nums.length;
      for (let i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        for (let j = i + 1; j < n - 2; j++) {
          if (j > i + 1 && nums[j] === nums[j - 1]) continue;
          let l = j + 1, r = n - 1;
          while (l < r) {
            const sum = nums[i] + nums[j] + nums[l] + nums[r];
            if (sum === target) {
              res.push(`${nums[i]} ${nums[j]} ${nums[l]} ${nums[r]}`);
              while (l < r && nums[l] === nums[l + 1]) l++;
              while (l < r && nums[r] === nums[r - 1]) r--;
              l++; r--;
            } else if (sum < target) {
              l++;
            } else {
              r--;
            }
          }
        }
      }
      return `${res.length}${res.length > 0 ? "\n" + res.join("\n") : ""}`.trim();
    },
    rawInputs: [
      "1 0 -1 0 -2 2\n0",
      "2 2 2 2 2\n8",
      "1 2 3 4\n10",
      "0 0 0 0\n0",
      "-3 -2 -1 0 0 1 2 3\n0",
      "1 -2 -5 -4 -3 3 3 5\n-11",
      "1 2 3 4 5\n100",
      "1 1 1 1 1 1\n4",
      "-1 0 1 2 -1 -4\n-1",
      "1000000000 1000000000 1000000000 1000000000\n4000000000"
    ]
  },

  // 23. Max Consecutive Ones
  {
    id: "ch_max_consecutive_ones",
    title: "Max Consecutive Ones",
    difficulty: "Easy",
    category: "Sliding Window",
    description: "Given a binary array `nums`, return the maximum number of consecutive 1's in the array.",
    constraints: ["1 <= nums.length <= 10^5", "nums[i] is either 0 or 1."],
    inputFormat: "Line 1: Space-separated 0s and 1s.",
    outputFormat: "A single integer representing the maximum consecutive 1s.",
    hints: ["Maintain current count of 1s; reset on 0."],
    objective: "Find maximum uninterrupted run of 1s in a binary array.",
    conceptualExplanation: ["Scan through array.", "If element is 1, increment current streak and update max.", "If 0, reset current streak to 0."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let maxC = 0, curr = 0;
      for (const x of nums) {
        if (x === 1) {
          curr++;
          if (curr > maxC) maxC = curr;
        } else {
          curr = 0;
        }
      }
      return String(maxC);
    },
    rawInputs: [
      "1 1 0 1 1 1",
      "1 0 1 1 0 1",
      "0 0 0",
      "1 1 1 1 1",
      "0",
      "1",
      "1 0 0 1 1 0 1 1 1 1",
      "0 1 0 1 0 1",
      "1 1 0 0 1 1",
      "0 0 1 1 1 0 0 0 1 1"
    ]
  },

  // 24. Minimum Size Subarray Sum
  {
    id: "ch_min_size_subarray_sum",
    title: "Minimum Size Subarray Sum",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given an array of positive integers `nums` and a positive integer `target`, return the minimal length of a subarray whose sum is greater than or equal to `target`. If there is no such subarray, return 0 instead.",
    constraints: ["1 <= target <= 10^9", "1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^4"],
    inputFormat: "Line 1: Integer target\nLine 2: Space-separated integers representing nums.",
    outputFormat: "Minimal length integer, or 0.",
    hints: ["Sliding window with left and right pointers.", "Expand right until sum >= target, then shrink left."],
    objective: "Find shortest continuous subarray summing to at least target.",
    conceptualExplanation: ["Expand window adding nums[r].", "While currentSum >= target, record min length and subtract nums[l++].", "Return recorded min length or 0."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const target = parseInt(lines[0], 10);
      const nums = lines[1].trim().split(/\s+/).map(Number);
      let l = 0, sum = 0, minLen = Infinity;
      for (let r = 0; r < nums.length; r++) {
        sum += nums[r];
        while (sum >= target) {
          minLen = Math.min(minLen, r - l + 1);
          sum -= nums[l++];
        }
      }
      return String(minLen === Infinity ? 0 : minLen);
    },
    rawInputs: [
      "7\n2 3 1 2 4 3",
      "4\n1 4 4",
      "11\n1 1 1 1 1 1 1 1",
      "15\n1 2 3 4 5",
      "5\n2 3 1 1 1 1 1",
      "100\n10 20 30 40",
      "100\n100",
      "10\n1 2 3 4 5",
      "6\n10 1 2 3",
      "3\n1 1"
    ]
  },

  // 25. Fruit Into Baskets
  {
    id: "ch_fruit_into_baskets",
    title: "Fruit Into Baskets (Max 2 Types)",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "You are visiting a farm that has fruit trees in a row. The trees are represented by an integer array `fruits` where `fruits[i]` is the type of fruit the i-th tree produces. You have 2 baskets, and each basket can only hold a single type of fruit. Return the maximum number of fruits you can pick.",
    constraints: ["1 <= fruits.length <= 10^5", "0 <= fruits[i] < fruits.length"],
    inputFormat: "Line 1: Space-separated integers representing fruits array.",
    outputFormat: "A single integer representing the maximum fruits picked.",
    hints: ["Find longest contiguous subarray with at most 2 distinct integers.", "Sliding window frequency map."],
    objective: "Maximize window length containing at most two distinct types.",
    conceptualExplanation: ["Maintain sliding window with frequency map.", "While map.size > 2, shrink from left.", "Track max window size."],
    solve: (input) => {
      const fruits = input.trim().split(/\s+/).map(Number);
      const count = new Map();
      let l = 0, maxF = 0;
      for (let r = 0; r < fruits.length; r++) {
        count.set(fruits[r], (count.get(fruits[r]) || 0) + 1);
        while (count.size > 2) {
          const c = count.get(fruits[l]) - 1;
          if (c === 0) count.delete(fruits[l]);
          else count.set(fruits[l], c);
          l++;
        }
        maxF = Math.max(maxF, r - l + 1);
      }
      return String(maxF);
    },
    rawInputs: [
      "1 2 1",
      "0 1 2 2",
      "1 2 3 2 2",
      "3 3 3 1 2 1 1 2 3 3 4",
      "1",
      "1 1 1 1",
      "1 2 1 2 1 2",
      "5 10 5 10 5 20",
      "1 2 3 4 5",
      "4 4 4 2 2 3 3 3"
    ]
  },

  // 26. Permutation in String
  {
    id: "ch_permutation_in_string",
    title: "Permutation in String",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given two strings `s1` and `s2`, return `true` if `s2` contains a permutation of `s1`, or `false` otherwise. In other words, return true if one of s1's permutations is the substring of s2.",
    constraints: ["1 <= s1.length, s2.length <= 10^4", "s1 and s2 consist of lowercase English letters."],
    inputFormat: "Line 1: String s1\nLine 2: String s2",
    outputFormat: "true or false",
    hints: ["Fixed-size sliding window of length s1.length.", "Compare frequency counts of window against s1."],
    objective: "Detect if an anagram of s1 exists as a substring in s2.",
    conceptualExplanation: ["Create freq1 for s1.", "Maintain sliding window of size s1.length in s2.", "Compare frequency tables in O(26) = O(1) time."],
    solve: (input) => {
      const [s1, s2] = input.trim().split("\n");
      if (s1.length > s2.length) return "false";
      const f1 = new Array(26).fill(0);
      const f2 = new Array(26).fill(0);
      const code = c => c.charCodeAt(0) - 97;
      for (let i = 0; i < s1.length; i++) {
        f1[code(s1[i])]++;
        f2[code(s2[i])]++;
      }
      const match = () => f1.every((v, i) => v === f2[i]);
      if (match()) return "true";
      for (let i = s1.length; i < s2.length; i++) {
        f2[code(s2[i])]++;
        f2[code(s2[i - s1.length])]--;
        if (match()) return "true";
      }
      return "false";
    },
    rawInputs: [
      "ab\neidbaooo",
      "ab\neidboaoo",
      "a\na",
      "adc\ndcda",
      "hello\nooolleoooleh",
      "abc\nbca",
      "xyz\nzyxwv",
      "ab\na",
      "abc\ndef",
      "pq\npqqp"
    ]
  },

  // 27. Find All Anagrams in a String
  {
    id: "ch_find_all_anagrams",
    title: "Find All Anagrams in a String",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given two strings `s` and `p`, return an array of all the start indices of `p`'s anagrams in `s`. Output the count on line 1, and the space-separated start indices on line 2.",
    constraints: ["1 <= s.length, p.length <= 3 * 10^4", "s and p consist of lowercase English letters."],
    inputFormat: "Line 1: String s\nLine 2: String p",
    outputFormat: "Line 1: Count of anagram starts\nLine 2: Space-separated indices (empty if 0)",
    hints: ["Sliding window of length p.length across string s.", "Update 26-element frequency count."],
    objective: "Find all window starting positions that form anagrams of pattern p.",
    conceptualExplanation: ["Fixed window of length p.length.", "Slide across s, updating entering and leaving characters.", "Record matching indices."],
    solve: (input) => {
      const [s, p] = input.trim().split("\n");
      if (s.length < p.length) return "0";
      const code = c => c.charCodeAt(0) - 97;
      const fP = new Array(26).fill(0);
      const fS = new Array(26).fill(0);
      for (let i = 0; i < p.length; i++) {
        fP[code(p[i])]++;
        fS[code(s[i])]++;
      }
      const match = () => fP.every((v, i) => v === fS[i]);
      const res = [];
      if (match()) res.push(0);
      for (let i = p.length; i < s.length; i++) {
        fS[code(s[i])]++;
        fS[code(s[i - p.length])]--;
        if (match()) res.push(i - p.length + 1);
      }
      return `${res.length}\n${res.join(" ")}`.trim();
    },
    rawInputs: [
      "cbaebabacd\nabc",
      "abab\nab",
      "a\na",
      "aaaaaaaaaa\na",
      "abcdef\nghi",
      "baa\naa",
      "anagram\nmargana",
      "hello\nll",
      "xyz\nzyx",
      "abacbabc\nabc"
    ]
  },

  // 28. Longest Repeating Character Replacement
  {
    id: "ch_longest_repeating_char_replace",
    title: "Longest Repeating Character Replacement",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "You are given a string `s` and an integer `k`. You can choose any character of the string and change it to any other uppercase English character at most `k` times. Return the length of the longest substring containing the same letter you can get after performing the above operations.",
    constraints: ["1 <= s.length <= 10^5", "s consists of only uppercase English letters.", "0 <= k <= s.length"],
    inputFormat: "Line 1: String s\nLine 2: Integer k",
    outputFormat: "A single integer representing the max length.",
    hints: ["Window size - maxFrequency <= k means we can make all characters equal to the most frequent one."],
    objective: "Maximize identical character substring by replacing at most k characters.",
    conceptualExplanation: ["Expand window with right pointer.", "Track maxCount = most frequent character count in window.", "If windowLen - maxCount > k, shrink window from left.", "Max window achieved is the answer."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const s = lines[0].trim();
      const k = parseInt(lines[1], 10);
      const freq = {};
      let l = 0, maxCount = 0, maxLen = 0;
      for (let r = 0; r < s.length; r++) {
        freq[s[r]] = (freq[s[r]] || 0) + 1;
        maxCount = Math.max(maxCount, freq[s[r]]);
        while ((r - l + 1) - maxCount > k) {
          freq[s[l]]--;
          l++;
        }
        maxLen = Math.max(maxLen, r - l + 1);
      }
      return String(maxLen);
    },
    rawInputs: [
      "ABAB\n2",
      "AABABBA\n1",
      "A\n0",
      "AAAA\n2",
      "ABBB\n2",
      "ABCDE\n1",
      "KAAAK\n2",
      "AAABBBCCCDDD\n3",
      "BAAA\n0",
      "ABABBA\n2"
    ]
  },

  // 29. Baseball Game Record
  {
    id: "ch_baseball_game",
    title: "Baseball Game Score Keeper",
    difficulty: "Easy",
    category: "Stacks",
    description: "You are keeping the scores for a baseball game with strange rules. At the beginning of the game, you start with an empty record. You are given a list of strings `operations`:\n• An integer x: Record a new score of x.\n• '+': Record a new score that is the sum of the previous two scores.\n• 'D': Record a new score that is double of the previous score.\n• 'C': Invalidate the previous score, removing it from the record.\nReturn the sum of all the scores on the record.",
    constraints: ["1 <= operations.length <= 1000", "operations[i] is \"C\", \"D\", \"+\", or an integer string representing an integer in the range [-3 * 10^4, 3 * 10^4]."],
    inputFormat: "Line 1: Space-separated operation tokens.",
    outputFormat: "A single integer representing the final total score.",
    hints: ["Use a stack to track scores.", "Push integers, pop on 'C', push 2*peek on 'D', push sum of top two on '+'."],
    objective: "Simulate stack-based baseball score modifications and sum remaining scores.",
    conceptualExplanation: ["Iterate operations.", "Handle '+', 'D', 'C' using stack push/pop.", "Sum all values remaining in stack."],
    solve: (input) => {
      const ops = input.trim().split(/\s+/);
      const stack = [];
      for (const op of ops) {
        if (op === "+") {
          stack.push(stack[stack.length - 1] + stack[stack.length - 2]);
        } else if (op === "D") {
          stack.push(stack[stack.length - 1] * 2);
        } else if (op === "C") {
          stack.pop();
        } else {
          stack.push(parseInt(op, 10));
        }
      }
      return String(stack.reduce((a, b) => a + b, 0));
    },
    rawInputs: [
      "5 2 C D +",
      "5 -2 4 C D 9 + +",
      "1 C",
      "10 20 + D",
      "10",
      "-5 -5 +",
      "1 2 3 C C",
      "1 D D D",
      "100 C 50",
      "5 10 + D C"
    ]
  },

  // 30. Make The String Great
  {
    id: "ch_make_string_great",
    title: "Make The String Great",
    difficulty: "Easy",
    category: "Stacks",
    description: "A good string is a string which doesn't have two adjacent characters `s[i]` and `s[i + 1]` where: `0 <= i <= s.length - 2`, and `s[i]` is a lower-case letter and `s[i + 1]` is the same letter but in upper-case or vice-versa. Return the string after making it good.",
    constraints: ["1 <= s.length <= 100", "s contains only lower and upper case English letters."],
    inputFormat: "A single line containing string s.",
    outputFormat: "The resulting great string (or empty line if string becomes empty).",
    hints: ["Use a stack.", "If current char and stack top differ by 32 in ASCII, pop stack. Else push."],
    objective: "Cancel adjacent same-letter uppercase/lowercase pairs using a stack.",
    conceptualExplanation: ["Iterate characters.", "If Math.abs(ch.charCodeAt(0) - top.charCodeAt(0)) === 32, pop.", "Else push char to stack."],
    solve: (input) => {
      const s = input.trim();
      const stack = [];
      for (const ch of s) {
        if (stack.length > 0 && Math.abs(stack[stack.length - 1].charCodeAt(0) - ch.charCodeAt(0)) === 32) {
          stack.pop();
        } else {
          stack.push(ch);
        }
      }
      return stack.join("");
    },
    rawInputs: [
      "leEeetcode",
      "abBAcC",
      "s",
      "Pp",
      "mCmMcm",
      "qFxXfQo",
      "aA",
      "abBA",
      "AaBbCc",
      "HhOoWw"
    ]
  },

  // 31. Remove All Adjacent Duplicates in String
  {
    id: "ch_remove_adjacent_duplicates",
    title: "Remove All Adjacent Duplicates",
    difficulty: "Easy",
    category: "Stacks",
    description: "You are given a string `s` consisting of lowercase English letters. A duplicate removal consists of choosing two adjacent and equal letters and removing them. We repeatedly make duplicate removals on `s` until we no longer can. Return the final string after all such duplicate removals have been made.",
    constraints: ["1 <= s.length <= 10^5", "s consists of lowercase English letters."],
    inputFormat: "A single line containing string s.",
    outputFormat: "The string after duplicate removals.",
    hints: ["Use a stack. If incoming char equals stack top, pop stack."],
    objective: "Eliminate duplicate adjacent pairs iteratively.",
    conceptualExplanation: ["Scan string pushing characters to stack.", "If current char matches top of stack, pop instead.", "Return string formed by stack."],
    solve: (input) => {
      const s = input.trim();
      const stack = [];
      for (const ch of s) {
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop();
        } else {
          stack.push(ch);
        }
      }
      return stack.join("");
    },
    rawInputs: [
      "abbaca",
      "azxxzy",
      "a",
      "aa",
      "aababaab",
      "mississipie",
      "aaaaaaaa",
      "abcde",
      "cbaabc",
      "reallly"
    ]
  },

  // 32. Decode String with Repeat Counts
  {
    id: "ch_decode_string",
    title: "Decode String with Repeat Counts",
    difficulty: "Medium",
    category: "Stacks",
    description: "Given an encoded string, return its decoded string. The encoding rule is: `k[encoded_string]`, where the `encoded_string` inside the square brackets is being repeated exactly `k` times. Note that `k` is guaranteed to be a positive integer.",
    constraints: ["1 <= s.length <= 30", "s consists of digits, square brackets, and lowercase English letters."],
    inputFormat: "A single line containing string s.",
    outputFormat: "The decoded string.",
    hints: ["Use stacks to store numbers and current string prefixes when encountering '['.", "On ']', pop repeat count and prefix."],
    objective: "Expand nested repeat-count strings using dual stacks.",
    conceptualExplanation: ["Maintain currStr and currNum.", "On '[': push currStr and currNum to stacks, reset.", "On ']': pop count and prevStr, currStr = prevStr + currStr.repeat(count)."],
    solve: (input) => {
      const s = input.trim();
      const numStack = [];
      const strStack = [];
      let currStr = "";
      let currNum = 0;
      for (const ch of s) {
        if (ch >= '0' && ch <= '9') {
          currNum = currNum * 10 + parseInt(ch, 10);
        } else if (ch === '[') {
          numStack.push(currNum);
          strStack.push(currStr);
          currNum = 0;
          currStr = "";
        } else if (ch === ']') {
          const k = numStack.pop();
          const prevStr = strStack.pop();
          currStr = prevStr + currStr.repeat(k);
        } else {
          currStr += ch;
        }
      }
      return currStr;
    },
    rawInputs: [
      "3[a]2[bc]",
      "3[a2[c]]",
      "2[abc]3[cd]ef",
      "abc",
      "10[a]",
      "2[2[y]pq4[2[jk]e1[f]]]ga",
      "3[z]2[2[y]pq4[2[jk]e1[f]]]ga",
      "1[a]1[b]1[c]",
      "2[b3[a]]",
      "2[a]2[b]"
    ]
  },

  // 33. Evaluate Reverse Polish Notation
  {
    id: "ch_evaluate_rpn",
    title: "Evaluate Reverse Polish Notation",
    difficulty: "Medium",
    category: "Stacks",
    description: "Evaluate the value of an arithmetic expression in Reverse Polish Notation (Postfix notation). Valid operators are '+', '-', '*', and '/'. Each operand may be an integer or another expression. Division between two integers should truncate toward zero.",
    constraints: ["1 <= tokens.length <= 10^4", "tokens[i] is either an operator or an integer in range [-200, 200]."],
    inputFormat: "A single line of space-separated RPN tokens.",
    outputFormat: "An integer representing the evaluated result.",
    hints: ["Operands push to stack.", "Operators pop two operands, compute, and push result."],
    objective: "Evaluate postfix expressions using standard stack semantics.",
    conceptualExplanation: ["Scan tokens.", "If number, push to stack.", "If operator, pop b and a, compute a OP b (truncate division toward zero), and push."],
    solve: (input) => {
      const tokens = input.trim().split(/\s+/);
      const stack = [];
      for (const t of tokens) {
        if (t === "+" || t === "-" || t === "*" || t === "/") {
          const b = stack.pop();
          const a = stack.pop();
          if (t === "+") stack.push(a + b);
          else if (t === "-") stack.push(a - b);
          else if (t === "*") stack.push(a * b);
          else if (t === "/") stack.push(Math.trunc(a / b));
        } else {
          stack.push(parseInt(t, 10));
        }
      }
      return String(stack[0]);
    },
    rawInputs: [
      "2 1 + 3 *",
      "4 13 5 / +",
      "10 6 9 3 + -11 * / * 17 + 5 +",
      "3 4 +",
      "5 1 2 + 4 * + 3 -",
      "10 2 /",
      "15 7 1 1 + - / 3 * 2 1 1 + + -",
      "4 3 -",
      "0 3 /",
      "-1 1 +"
    ]
  },

  // 34. Asteroid Collision Simulator
  {
    id: "ch_asteroid_collision",
    title: "Asteroid Collision Simulator",
    difficulty: "Medium",
    category: "Stacks",
    description: "We are given an array `asteroids` of integers representing asteroids in a row. For each asteroid, the absolute value represents its size, and the sign represents its direction (positive meaning right, negative meaning left). Each asteroid moves at the same speed. Find out the state of the asteroids after all collisions. If two asteroids meet, the smaller one explodes. If both are the same size, both explode. Two asteroids moving in the same direction will never meet.",
    constraints: ["2 <= asteroids.length <= 10^4", "-1000 <= asteroids[i] <= 1000", "asteroids[i] != 0"],
    inputFormat: "Line 1: Space-separated integers representing asteroids.",
    outputFormat: "Space-separated surviving asteroids, or empty line if none remain.",
    hints: ["Collision only happens if stack top > 0 and incoming < 0."],
    objective: "Simulate directional kinetic collisions using a stack.",
    conceptualExplanation: ["Maintain stack of survivors.", "For each asteroid, while stack top > 0 and current < 0, compare sizes.", "Pop smaller asteroids or destroy both on equal size."],
    solve: (input) => {
      const asts = input.trim().split(/\s+/).map(Number);
      const stack = [];
      for (let a of asts) {
        let alive = true;
        while (alive && a < 0 && stack.length > 0 && stack[stack.length - 1] > 0) {
          const top = stack[stack.length - 1];
          if (top < -a) {
            stack.pop();
          } else if (top === -a) {
            stack.pop();
            alive = false;
          } else {
            alive = false;
          }
        }
        if (alive) stack.push(a);
      }
      return stack.join(" ");
    },
    rawInputs: [
      "5 10 -5",
      "8 -8",
      "10 2 -5",
      "-2 -1 1 2",
      "-2 -2 1 -2",
      "1 -1",
      "10 5 -10",
      "-5 5",
      "1 2 3 -4",
      "5 4 3 2 1 -6"
    ]
  },

  // 35. Daily Temperatures
  {
    id: "ch_daily_temperatures",
    title: "Daily Temperatures (Monotonic Stack)",
    difficulty: "Medium",
    category: "Stacks",
    description: "Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the i-th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.",
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    inputFormat: "Line 1: Space-separated integers representing temperatures.",
    outputFormat: "Space-separated integers representing wait days.",
    hints: ["Maintain a monotonic decreasing stack of indices."],
    objective: "Find distance to next warmer temperature using a monotonic stack.",
    conceptualExplanation: ["Stack stores indices with decreasing temperatures.", "When current temp > temp at stack top, pop index and record difference.", "Push current index to stack."],
    solve: (input) => {
      const temps = input.trim().split(/\s+/).map(Number);
      const n = temps.length;
      const res = new Array(n).fill(0);
      const stack = [];
      for (let i = 0; i < n; i++) {
        while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
          const prevIdx = stack.pop();
          res[prevIdx] = i - prevIdx;
        }
        stack.push(i);
      }
      return res.join(" ");
    },
    rawInputs: [
      "73 74 75 71 69 72 76 73",
      "30 40 50 60",
      "30 60 90",
      "80",
      "89 62 70 58 47 47 46 76 100 70",
      "55 54 53 52",
      "40 40 40",
      "70 71 70 72 70 73",
      "90 80 70 100",
      "50 60 70 80 90 100"
    ]
  },

  // 36. Next Greater Element I
  {
    id: "ch_next_greater_element_i",
    title: "Next Greater Element I",
    difficulty: "Easy",
    category: "Stacks",
    description: "The next greater element of some element x in an array is the first greater element that is to the right of x in the same array. You are given two distinct 0-indexed integer arrays `nums1` and `nums2`, where `nums1` is a subset of `nums2`. For each 0 <= i < nums1.length, find the index j such that nums1[i] == nums2[j] and determine the next greater element of nums2[j] in nums2. If there is no next greater element, then the answer for this query is -1.",
    constraints: ["1 <= nums1.length <= nums2.length <= 1000", "0 <= nums1[i], nums2[i] <= 10^4", "All integers in nums1 and nums2 are unique."],
    inputFormat: "Line 1: Space-separated integers representing nums1.\nLine 2: Space-separated integers representing nums2.",
    outputFormat: "Space-separated integers representing next greater elements.",
    hints: ["Use monotonic stack over nums2 and store next greater in a hash map."],
    objective: "Find next greater element for subset elements using a monotonic stack.",
    conceptualExplanation: ["Scan nums2 maintaining decreasing stack.", "When current > stack top, map[pop()] = current.", "Query map for each item in nums1."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums1 = lines[0].trim().split(/\s+/).map(Number);
      const nums2 = lines[1].trim().split(/\s+/).map(Number);
      const map = new Map();
      const stack = [];
      for (const x of nums2) {
        while (stack.length > 0 && x > stack[stack.length - 1]) {
          map.set(stack.pop(), x);
        }
        stack.push(x);
      }
      return nums1.map(x => map.has(x) ? map.get(x) : -1).join(" ");
    },
    rawInputs: [
      "4 1 2\n1 3 4 2",
      "2 4\n1 2 3 4",
      "1\n1",
      "1 3 5\n5 4 3 2 1",
      "3 1 5 7 9 2 6\n1 2 3 5 6 7 9 11",
      "10\n10 20 30",
      "5 2\n2 3 5 10",
      "7 3\n1 3 7 9",
      "8 6\n1 6 8 10",
      "4 2 1\n1 2 3 4 5"
    ]
  },

  // 37. Online Stock Span
  {
    id: "ch_online_stock_span",
    title: "Online Stock Span",
    difficulty: "Medium",
    category: "Stacks",
    description: "Design an algorithm that collects daily price quotes for some stock and returns the span of that stock's price for the current day. The span of the stock's price in one day is the maximum number of consecutive days (starting from that day and going backward) for which the stock price was less than or equal to the price of that day.",
    constraints: ["1 <= prices.length <= 10^4", "1 <= price <= 10^5"],
    inputFormat: "Line 1: Space-separated integers representing daily prices.",
    outputFormat: "Space-separated integers representing spans.",
    hints: ["Monotonic stack of (price, span) pairs.", "Collapse lower prices into span."],
    objective: "Compute continuous non-decreasing backward span for stream prices.",
    conceptualExplanation: ["Store [price, span] in stack.", "While stack top price <= current price, span += stack.pop()[1].", "Push [price, span] and output span."],
    solve: (input) => {
      const prices = input.trim().split(/\s+/).map(Number);
      const stack = [];
      const spans = [];
      for (const p of prices) {
        let span = 1;
        while (stack.length > 0 && stack[stack.length - 1][0] <= p) {
          span += stack.pop()[1];
        }
        stack.push([p, span]);
        spans.push(span);
      }
      return spans.join(" ");
    },
    rawInputs: [
      "100 80 60 70 60 75 85",
      "31 41 48 49 50",
      "10 9 8 7",
      "50 50 50",
      "10 20 30 40 50",
      "100",
      "29 91 62 76 51",
      "40 30 20 10 50",
      "90 80 85 87 95",
      "10 5 15 5 20"
    ]
  },

  // 38. Largest Rectangle in Histogram
  {
    id: "ch_largest_rectangle_histogram",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    category: "Stacks",
    description: "Given an array of integers `heights` representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.",
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    inputFormat: "Line 1: Space-separated integers representing bar heights.",
    outputFormat: "A single integer representing the maximum rectangle area.",
    hints: ["Monotonic increasing stack of indices.", "When height drops, pop and compute area with popped height."],
    objective: "Find maximum rectangular area under histogram bars.",
    conceptualExplanation: ["Append 0 to heights to flush remaining bars.", "Maintain monotonic increasing stack of indices.", "When current height < stack top, pop h, width = stack.isEmpty ? i : i - stack.top - 1.", "Max area = max(maxArea, h * width)."],
    solve: (input) => {
      const heights = input.trim().split(/\s+/).map(Number);
      heights.push(0);
      const stack = [];
      let maxArea = 0;
      for (let i = 0; i < heights.length; i++) {
        while (stack.length > 0 && heights[i] < heights[stack[stack.length - 1]]) {
          const h = heights[stack.pop()];
          const w = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
          maxArea = Math.max(maxArea, h * w);
        }
        stack.push(i);
      }
      return String(maxArea);
    },
    rawInputs: [
      "2 1 5 6 2 3",
      "2 4",
      "1",
      "0",
      "2 1 2",
      "6 7 5 2 4 5 9 3",
      "5 5 5 5 5",
      "1 2 3 4 5",
      "5 4 3 2 1",
      "3 6 5 7 4 8 1 0"
    ]
  },

  // 39. Dota2 Senate Voting
  {
    id: "ch_dota2_senate",
    title: "Dota2 Senate Voting Queue",
    difficulty: "Medium",
    category: "Queues",
    description: "In the world of Dota2, there are two parties: the Radiant and the Dire. The senate consists of senators from both parties. Each senator can ban one senator's right or announce victory. Radiant senators are represented by 'R' and Dire senators by 'D'. Suppose every senator exercises the best strategy for his own party. Predict which party will finally announce the victory.",
    constraints: ["n == senate.length", "1 <= n <= 10^4", "senate[i] is either 'R' or 'D'."],
    inputFormat: "A single line containing string senate.",
    outputFormat: "Radiant or Dire",
    hints: ["Use two queues for Radiant and Dire senator indices.", "Smaller index bans the larger index and requeues with index + n."],
    objective: "Simulate greedy round-robin elimination with queues.",
    conceptualExplanation: ["Queue rad holds R indices, queue dir holds D indices.", "Pop r from rad, d from dir.", "Whichever is smaller requeues as (idx + n). Other senator is eliminated.", "Winner is whichever queue is not empty."],
    solve: (input) => {
      const senate = input.trim();
      const n = senate.length;
      const rad = [], dir = [];
      for (let i = 0; i < n; i++) {
        if (senate[i] === 'R') rad.push(i);
        else dir.push(i);
      }
      while (rad.length > 0 && dir.length > 0) {
        const rIdx = rad.shift();
        const dIdx = dir.shift();
        if (rIdx < dIdx) rad.push(rIdx + n);
        else dir.push(dIdx + n);
      }
      return rad.length > 0 ? "Radiant" : "Dire";
    },
    rawInputs: [
      "RD",
      "RDD",
      "R",
      "D",
      "RRDDD",
      "DDRRR",
      "RDRDRD",
      "DDRDRR",
      "DRRDRD",
      "RRRDDD"
    ]
  },

  // 40. Moving Average from Data Stream
  {
    id: "ch_moving_average",
    title: "Moving Average from Data Stream",
    difficulty: "Easy",
    category: "Queues",
    description: "Given a stream of integers and a window size `size`, calculate the moving average of all integers in the sliding window. Format floating point numbers to 2 decimal places.",
    constraints: ["1 <= size <= 1000", "-10^5 <= val <= 10^5", "At most 10^4 calls will be made."],
    inputFormat: "Line 1: Integer size (window capacity)\nLine 2: Space-separated integers representing stream values.",
    outputFormat: "Space-separated moving averages rounded to 2 decimal places.",
    hints: ["Use a queue to store window elements and maintain running sum."],
    objective: "Compute sliding window moving averages in constant time per step.",
    conceptualExplanation: ["Maintain queue of size k.", "On new value, if queue.length === k, subtract queue.pop() from running sum.", "Push new value, add to sum, return sum / queue.length."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const size = parseInt(lines[0], 10);
      const vals = lines[1].trim().split(/\s+/).map(Number);
      const q = [];
      let sum = 0;
      const res = [];
      for (const v of vals) {
        q.push(v);
        sum += v;
        if (q.length > size) sum -= q.shift();
        res.push((sum / q.length).toFixed(2));
      }
      return res.join(" ");
    },
    rawInputs: [
      "3\n1 10 3 5",
      "1\n4 0 -4",
      "5\n1 2 3 4 5 6 7",
      "2\n10 20 30 40",
      "4\n100 200 300 400 500",
      "3\n0 0 0 0",
      "2\n-5 5 -5 5",
      "3\n1 2 1 2 1",
      "1\n42",
      "4\n2 4 6 8 10 12"
    ]
  },

  // 41. Sliding Window Maximum
  {
    id: "ch_sliding_window_max",
    title: "Sliding Window Maximum (Monotonic Deque)",
    difficulty: "Hard",
    category: "Queues",
    description: "You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position. Return the max sliding window.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "1 <= k <= nums.length"],
    inputFormat: "Line 1: Integer k\nLine 2: Space-separated integers representing nums.",
    outputFormat: "Space-separated integers representing window maximums.",
    hints: ["Use a monotonic decreasing deque storing indices."],
    objective: "Find maximum in every sliding window of size k in O(N) time.",
    conceptualExplanation: ["Maintain deque of indices in decreasing order of value.", "Remove elements out of window (<= i - k).", "Pop smaller elements from back before pushing i.", "Once i >= k - 1, deque.front is window maximum."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const k = parseInt(lines[0], 10);
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const deque = [];
      const res = [];
      for (let i = 0; i < nums.length; i++) {
        while (deque.length > 0 && deque[0] <= i - k) deque.shift();
        while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) deque.pop();
        deque.push(i);
        if (i >= k - 1) res.push(nums[deque[0]]);
      }
      return res.join(" ");
    },
    rawInputs: [
      "3\n1 3 -1 -3 5 3 6 7",
      "1\n1",
      "1\n1 -1",
      "2\n9 11",
      "2\n4 -2",
      "4\n1 3 1 2 0 5",
      "3\n7 2 4",
      "5\n10 9 8 7 6 5 4 3 2 1",
      "3\n1 2 3 4 5 6",
      "2\n-7 -8 7 5 7 1 6 0"
    ]
  },

  // 42. Delete Node in a Linked List
  {
    id: "ch_delete_node_linked_list",
    title: "Delete Node in a Linked List",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "There is a singly-linked list `head` and we want to delete a node with value `target` in it. You are given the values of the linked list and the target value to delete. Return the list after deletion.",
    constraints: ["The number of nodes in the list is in the range [2, 1000].", "-1000 <= Node.val <= 1000", "The value of each node in the list is unique."],
    inputFormat: "Line 1: Space-separated integers representing linked list.\nLine 2: Single integer target value to delete.",
    outputFormat: "Space-separated integers representing remaining list.",
    hints: ["Filter out target value."],
    objective: "Simulate node deletion in linked list.",
    conceptualExplanation: ["Filter target out of node sequence.", "Return joined list."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const target = parseInt(lines[1], 10);
      return nums.filter(x => x !== target).join(" ");
    },
    rawInputs: [
      "4 5 1 9\n5",
      "4 5 1 9\n1",
      "1 2 3 4\n3",
      "0 1\n0",
      "10 20 30 40 50\n50",
      "-3 5 -99\n5",
      "1 2 3\n1",
      "100 200\n200",
      "7 8 9 10\n8",
      "2 4 6 8\n6"
    ]
  },

  // 43. Remove Nth Node From End of List
  {
    id: "ch_remove_nth_node_end",
    title: "Remove N-th Node From End of List",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "Given the head of a linked list, remove the n-th node from the end of the list and return its head.",
    constraints: ["The number of nodes in the list is sz.", "1 <= sz <= 30", "0 <= Node.val <= 100", "1 <= n <= sz"],
    inputFormat: "Line 1: Space-separated integers representing list.\nLine 2: Integer n.",
    outputFormat: "Space-separated integers of modified list (empty line if list becomes empty).",
    hints: ["Two pointers fast and slow separated by n nodes."],
    objective: "Remove the n-th node from tail in one pass.",
    conceptualExplanation: ["Length = sz.", "Index to remove from front = sz - n.", "Remove element at that index."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const n = parseInt(lines[1], 10);
      const idxToRemove = nums.length - n;
      nums.splice(idxToRemove, 1);
      return nums.join(" ");
    },
    rawInputs: [
      "1 2 3 4 5\n2",
      "1\n1",
      "1 2\n1",
      "1 2\n2",
      "10 20 30 40\n4",
      "5 10 15 20 25\n1",
      "1 2 3 4\n3",
      "7 8 9\n2",
      "100 200 300\n3",
      "4 5 6 7 8 9\n5"
    ]
  },

  // 44. Rotate List by K Places
  {
    id: "ch_rotate_list_k",
    title: "Rotate List by K Places",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "Given the head of a linked list, rotate the list to the right by `k` places.",
    constraints: ["The number of nodes in the list is in the range [0, 500].", "-100 <= Node.val <= 100", "0 <= k <= 2 * 10^9"],
    inputFormat: "Line 1: Space-separated integers representing list (empty line if empty).\nLine 2: Integer k.",
    outputFormat: "Space-separated integers of rotated list.",
    hints: ["k = k % length.", "Split list at length - k."],
    objective: "Rotate linked list elements cyclically by k positions.",
    conceptualExplanation: ["Effective shift k = k % n.", "New tail is at index n - k - 1.", "Slice and recombine."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const listStr = lines[0] ? lines[0].trim() : "";
      if (!listStr) return "";
      const nums = listStr.split(/\s+/).map(Number);
      const k = parseInt(lines[1], 10) % nums.length;
      if (k === 0) return nums.join(" ");
      const rotated = [...nums.slice(-k), ...nums.slice(0, nums.length - k)];
      return rotated.join(" ");
    },
    rawInputs: [
      "1 2 3 4 5\n2",
      "0 1 2\n4",
      "1 2\n0",
      "1\n99",
      "1 2 3 4\n4",
      "10 20 30 40 50\n7",
      "5 10\n1",
      "1 2 3\n5",
      "7 8 9 10\n2",
      "4 5 6 7\n1000000"
    ]
  },

  // 45. Odd Even Linked List
  {
    id: "ch_odd_even_linked_list",
    title: "Odd Even Linked List",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "Given the head of a singly linked list, group all the nodes with odd indices together followed by the nodes with even indices, and return the reordered list. The first node is considered odd, and the second node is even, and so on. Must run in O(1) extra space.",
    constraints: ["The number of nodes in the linked list is in the range [0, 10^4].", "-10^6 <= Node.val <= 10^6"],
    inputFormat: "Line 1: Space-separated integers representing nodes.",
    outputFormat: "Space-separated integers grouped odd then even.",
    hints: ["Separate into odd pointer and even pointer, then link odd tail to even head."],
    objective: "Group odd and even 1-based index nodes in-place.",
    conceptualExplanation: ["Collect elements at 0-indexed even positions (1-based odd).", "Collect elements at 0-indexed odd positions (1-based even).", "Concatenate lists."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const odds = [], evens = [];
      nums.forEach((val, idx) => {
        if (idx % 2 === 0) odds.push(val);
        else evens.push(val);
      });
      return [...odds, ...evens].join(" ");
    },
    rawInputs: [
      "1 2 3 4 5",
      "2 1 3 5 6 4 7",
      "1",
      "1 2",
      "1 2 3",
      "10 20 30 40",
      "5 4 3 2 1",
      "7 8 9 10 11 12",
      "100 200 300 400 500",
      "0 1 0 1 0 1"
    ]
  },

  // 46. Swap Nodes in Pairs
  {
    id: "ch_swap_nodes_in_pairs",
    title: "Swap Nodes in Pairs",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed).",
    constraints: ["The number of nodes in the list is in the range [0, 100].", "0 <= Node.val <= 100"],
    inputFormat: "Line 1: Space-separated integers representing list.",
    outputFormat: "Space-separated integers after pairwise swaps.",
    hints: ["Swap nodes in chunks of 2."],
    objective: "Swap adjacent node pairs in linked list.",
    conceptualExplanation: ["Iterate in steps of 2.", "Swap nums[i] and nums[i+1] if i+1 exists."],
    solve: (input) => {
      const str = input.trim();
      if (!str) return "";
      const nums = str.split(/\s+/).map(Number);
      for (let i = 0; i < nums.length - 1; i += 2) {
        const tmp = nums[i];
        nums[i] = nums[i + 1];
        nums[i + 1] = tmp;
      }
      return nums.join(" ");
    },
    rawInputs: [
      "1 2 3 4",
      "1",
      "1 2 3",
      "1 2 3 4 5 6",
      "10 20",
      "5 10 15",
      "4 3 2 1",
      "7 8 9 10 11",
      "100 200 300 400",
      "2 4 6 8 10 12"
    ]
  },

  // 47. Reverse Nodes in K-Group
  {
    id: "ch_reverse_nodes_k_group",
    title: "Reverse Nodes in K-Group",
    difficulty: "Hard",
    category: "Linked Lists",
    description: "Given the head of a linked list, reverse the nodes of the list `k` at a time, and return the modified list. `k` is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of `k` then left-out nodes, in the end, should remain as it is.",
    constraints: ["The number of nodes in the list is n.", "1 <= k <= n <= 5000", "0 <= Node.val <= 1000"],
    inputFormat: "Line 1: Space-separated integers representing list.\nLine 2: Integer k.",
    outputFormat: "Space-separated integers of modified list.",
    hints: ["Reverse each slice of length k.", "If remaining length < k, keep order intact."],
    objective: "Reverse linked list nodes in groups of k.",
    conceptualExplanation: ["Chunk list by size k.", "If chunk.length === k, reverse it.", "Join all chunks."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const k = parseInt(lines[1], 10);
      const res = [];
      for (let i = 0; i < nums.length; i += k) {
        const chunk = nums.slice(i, i + k);
        if (chunk.length === k) {
          res.push(...chunk.reverse());
        } else {
          res.push(...chunk);
        }
      }
      return res.join(" ");
    },
    rawInputs: [
      "1 2 3 4 5\n2",
      "1 2 3 4 5\n3",
      "1 2 3 4 5 6\n2",
      "1 2 3 4 5 6\n3",
      "1 2\n2",
      "1\n1",
      "1 2 3 4 5 6 7 8\n4",
      "10 20 30 40 50\n5",
      "5 4 3 2 1\n2",
      "1 2 3 4 5 6 7\n3"
    ]
  },

  // 48. Guess Number Higher or Lower
  {
    id: "ch_guess_number_higher_lower",
    title: "Guess Number Higher or Lower",
    difficulty: "Easy",
    category: "Binary Search",
    description: "We are playing the Guess Game. The game will pick a number from 1 to n. You have to guess which number is picked. Given n and the picked target number, simulate binary search and return the target number.",
    constraints: ["1 <= target <= n <= 2^31 - 1"],
    inputFormat: "Line 1: Integer n (upper bound)\nLine 2: Integer pick (target number)",
    outputFormat: "The picked integer.",
    hints: ["Standard binary search between 1 and n."],
    objective: "Simulate binary search guess game bounds.",
    conceptualExplanation: ["Search interval [1, n].", "Mid = low + (high - low) / 2.", "Narrow bounds until mid === target."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0], 10);
      const pick = parseInt(lines[1], 10);
      let low = 1, high = n;
      while (low <= high) {
        const mid = Math.floor(low + (high - low) / 2);
        if (mid === pick) return String(mid);
        if (mid < pick) low = mid + 1;
        else high = mid - 1;
      }
      return String(pick);
    },
    rawInputs: [
      "10\n6",
      "1\n1",
      "2\n1",
      "100\n42",
      "1000\n789",
      "50\n25",
      "20\n19",
      "15\n1",
      "500\n333",
      "10000\n9999"
    ]
  },

  // 49. First Bad Version
  {
    id: "ch_first_bad_version",
    title: "First Bad Version (Binary Search Boundary)",
    difficulty: "Easy",
    category: "Binary Search",
    description: "You are a product manager and currently leading a team to develop a new product. Unfortunately, the latest version of your product fails the quality check. Since each version is developed based on the previous version, all the versions after a bad version are also bad. Given n versions [1, 2, ..., n] and the first bad version index, find the first bad version using binary search.",
    constraints: ["1 <= bad <= n <= 2^31 - 1"],
    inputFormat: "Line 1: Total versions n\nLine 2: First bad version bad",
    outputFormat: "Integer representing first bad version.",
    hints: ["Binary search: if isBadVersion(mid), first bad is <= mid. Else it is > mid."],
    objective: "Find monotonic false/true transition boundary with binary search.",
    conceptualExplanation: ["low = 1, high = n.", "mid = low + (high - low) / 2.", "if mid >= bad: high = mid.", "else: low = mid + 1.", "return low."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0], 10);
      const bad = parseInt(lines[1], 10);
      let low = 1, high = n;
      while (low < high) {
        const mid = Math.floor(low + (high - low) / 2);
        if (mid >= bad) high = mid;
        else low = mid + 1;
      }
      return String(low);
    },
    rawInputs: [
      "5\n4",
      "1\n1",
      "10\n10",
      "10\n1",
      "100\n55",
      "50\n23",
      "1000\n420",
      "2\n2",
      "2\n1",
      "10000\n7777"
    ]
  },

  // 50. Peak Index in a Mountain Array
  {
    id: "ch_peak_index_mountain",
    title: "Peak Index in a Mountain Array",
    difficulty: "Medium",
    category: "Binary Search",
    description: "An array `arr` is a mountain if `arr.length >= 3` and there exists some i with `0 < i < arr.length - 1` such that `arr[0] < arr[1] < ... < arr[i - 1] < arr[i]` and `arr[i] > arr[i + 1] > ... > arr[arr.length - 1]`. Given a mountain array `arr`, return the index `i` such that arr[0] < arr[1] < ... < arr[i - 1] < arr[i] > arr[i + 1] > ... > arr[arr.length - 1] in O(log(n)) time.",
    constraints: ["3 <= arr.length <= 10^5", "0 <= arr[i] <= 10^6", "arr is guaranteed to be a mountain array."],
    inputFormat: "Line 1: Space-separated integers representing mountain array.",
    outputFormat: "Index of the peak element.",
    hints: ["Binary search: compare arr[mid] with arr[mid + 1]."],
    objective: "Locate peak element in mountain array using O(log N) binary search.",
    conceptualExplanation: ["Binary search l=0, r=arr.length-1.", "If arr[mid] < arr[mid + 1], peak is to the right: l = mid + 1.", "Else peak is at mid or to the left: r = mid.", "Return l."],
    solve: (input) => {
      const arr = input.trim().split(/\s+/).map(Number);
      let l = 0, r = arr.length - 1;
      while (l < r) {
        const mid = Math.floor(l + (r - l) / 2);
        if (arr[mid] < arr[mid + 1]) l = mid + 1;
        else r = mid;
      }
      return String(l);
    },
    rawInputs: [
      "0 1 0",
      "0 2 1 0",
      "0 10 5 2",
      "3 5 3 2 0",
      "0 1 2 3 4 5 3 1",
      "10 20 30 40 35 25 15",
      "1 3 5 4 2",
      "0 100 0",
      "24 69 100 99 79 78 67 36 26 19",
      "1 2 3 4 5 6 7 8 9 10 9 8"
    ]
  }
];

module.exports = { partA };
