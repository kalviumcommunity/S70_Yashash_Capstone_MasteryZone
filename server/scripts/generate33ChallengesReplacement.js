/**
 * 33 Replacement Challenges to reach 100 100% unique challenges.
 * Guaranteed no collisions with existing 135 challenges.
 */

const replacement33 = [
  // 1. Plus One
  {
    id: "ch_plus_one",
    title: "Plus One Large Integer Array",
    difficulty: "Easy",
    category: "Arrays",
    description: "You are given a large integer represented as an integer array digits, where each digits[i] is the ith digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading 0's, except the number 0 itself.\n\nIncrement the large integer by one and return the resulting array of digits separated by spaces.",
    inputFormat: "Line 1: An integer n denoting the number of digits.\nLine 2: n space-separated integers representing the digits.",
    outputFormat: "Space-separated digits of the result after adding one.",
    constraints: [
      "1 <= n <= 100",
      "0 <= digits[i] <= 9",
      "digits does not contain any leading 0's (unless n == 1 and digits[0] == 0)"
    ],
    objective: "Simulate carry addition on an array of base-10 digits.",
    conceptualExplanation: [
      "Iterate from right to left (least significant digit).",
      "If the digit is less than 9, increment it by 1 and return.",
      "If the digit is 9, turn it to 0 and continue to the next left digit.",
      "If all digits were 9, prepend 1 to the array."
    ],
    hints: [
      "Traverse from the last index to 0.",
      "Add 1 to the digit. If it becomes 10, keep carry = 1 and set digit to 0.",
      "If carry remains after the loop, prepend 1."
    ],
    rawInputs: [
      "3\n1 2 3",
      "4\n4 3 2 1",
      "1\n9",
      "2\n9 9",
      "5\n9 9 9 9 9",
      "1\n0",
      "3\n8 9 9",
      "4\n1 9 9 9",
      "6\n1 0 0 0 0 0",
      "7\n7 2 8 5 0 9 9"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const digits = lines[1].trim().split(/\s+/).map(Number);
      let carry = 1;
      for (let i = digits.length - 1; i >= 0; i--) {
        const sum = digits[i] + carry;
        digits[i] = sum % 10;
        carry = Math.floor(sum / 10);
        if (carry === 0) break;
      }
      if (carry > 0) {
        digits.unshift(carry);
      }
      return digits.join(' ');
    }
  },

  // 2. Pascal's Triangle
  {
    id: "ch_pascals_triangle",
    title: "Pascal's Triangle Row Generator",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an integer rowIndex (0-indexed), return the rowIndex-th row of Pascal's triangle.\n\nIn Pascal's triangle, each number is the sum of the two numbers directly above it.",
    inputFormat: "A single integer rowIndex.",
    outputFormat: "Space-separated integers representing the rowIndex-th row.",
    constraints: [
      "0 <= rowIndex <= 30"
    ],
    objective: "Generate the k-th row of Pascal's triangle in O(k) auxiliary space.",
    conceptualExplanation: [
      "Row 0 is [1].",
      "Row k has k + 1 elements, starting and ending with 1.",
      "Element j can be derived from previous element: C(n, k) = C(n, k-1) * (n - k + 1) / k."
    ],
    hints: [
      "Use dynamic programming or combinations math.",
      "Updating in-place from right to left avoids extra space."
    ],
    rawInputs: [
      "0", "1", "2", "3", "4", "5", "6", "10", "15", "20"
    ],
    solve: (input) => {
      const rowIndex = parseInt(input.trim(), 10);
      let row = [1];
      for (let i = 1; i <= rowIndex; i++) {
        const next = new Array(i + 1);
        next[0] = 1;
        next[i] = 1;
        for (let j = 1; j < i; j++) {
          next[j] = row[j - 1] + row[j];
        }
        row = next;
      }
      return row.join(' ');
    }
  },

  // 3. Spiral Matrix
  {
    id: "ch_spiral_matrix",
    title: "Spiral Matrix Traversal Order",
    difficulty: "Medium",
    category: "Arrays",
    description: "Given an m x n matrix, return all elements of the matrix in spiral order (clockwise starting from top-left).",
    inputFormat: "Line 1: Two space-separated integers m and n.\nNext m lines: n space-separated integers representing each row of the matrix.",
    outputFormat: "A single line of space-separated integers representing the spiral traversal.",
    constraints: [
      "1 <= m, n <= 20",
      "-100 <= matrix[i][j] <= 100"
    ],
    objective: "Simulate 4-directional boundary contraction traversal.",
    conceptualExplanation: [
      "Define 4 boundaries: top = 0, bottom = m - 1, left = 0, right = n - 1.",
      "Traverse left-to-right across top, increment top.",
      "Traverse top-to-bottom down right, decrement right.",
      "Traverse right-to-left across bottom (if top <= bottom), decrement bottom.",
      "Traverse bottom-to-top up left (if left <= right), increment left."
    ],
    hints: [
      "Keep four pointers for the active rectangular boundary.",
      "Stop when top > bottom or left > right."
    ],
    rawInputs: [
      "3 3\n1 2 3\n4 5 6\n7 8 9",
      "3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12",
      "1 1\n42",
      "1 4\n1 2 3 4",
      "4 1\n1\n2\n3\n4",
      "2 2\n1 2\n3 4",
      "3 2\n1 2\n3 4\n5 6",
      "2 3\n1 2 3\n4 5 6",
      "4 4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
      "3 5\n1 2 3 4 5\n6 7 8 9 10\n11 12 13 14 15"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) {
        mat.push(lines[i].trim().split(/\s+/).map(Number));
      }
      const res = [];
      let top = 0, bottom = m - 1, left = 0, right = n - 1;
      while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) res.push(mat[top][c]);
        top++;
        for (let r = top; r <= bottom; r++) res.push(mat[r][right]);
        right--;
        if (top <= bottom) {
          for (let c = right; c >= left; c--) res.push(mat[bottom][c]);
          bottom--;
        }
        if (left <= right) {
          for (let r = bottom; r >= top; r--) res.push(mat[r][left]);
          left++;
        }
      }
      return res.join(' ');
    }
  },

  // 4. Set Matrix Zeroes
  {
    id: "ch_set_matrix_zeroes",
    title: "Set Matrix Zeroes In Place",
    difficulty: "Medium",
    category: "Arrays",
    description: "Given an m x n integer matrix, if an element is 0, set its entire row and column to 0's.",
    inputFormat: "Line 1: Two integers m and n.\nNext m lines: n space-separated integers per line.",
    outputFormat: "m lines with n space-separated integers representing the modified matrix.",
    constraints: [
      "1 <= m, n <= 20",
      "-2^31 <= matrix[i][j] <= 2^31 - 1"
    ],
    objective: "Modify a matrix in-place with O(1) space using the first row and column as flags.",
    conceptualExplanation: [
      "Use first row and first column as markers.",
      "Check if row 0 or col 0 initially contain zero.",
      "Scan inner elements (1..m-1, 1..n-1); if matrix[r][c] == 0, mark matrix[r][0] = 0 and matrix[0][c] = 0.",
      "Zero out inner cells according to marks, then zero row 0 and col 0 if needed."
    ],
    hints: [
      "Don't allocate another m x n matrix.",
      "First row and first col store which rows/cols need to be zeroed."
    ],
    rawInputs: [
      "3 3\n1 1 1\n1 0 1\n1 1 1",
      "3 4\n0 1 2 0\n3 4 5 2\n1 3 1 5",
      "1 1\n0",
      "1 1\n5",
      "2 2\n1 0\n0 1",
      "2 3\n1 2 3\n4 0 6",
      "3 1\n1\n0\n3",
      "1 3\n1 0 3",
      "3 3\n0 0 0\n0 0 0\n0 0 0",
      "3 3\n1 2 3\n4 5 6\n7 8 9"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) {
        mat.push(lines[i].trim().split(/\s+/).map(Number));
      }
      let firstRowZero = false, firstColZero = false;
      for (let j = 0; j < n; j++) if (mat[0][j] === 0) firstRowZero = true;
      for (let i = 0; i < m; i++) if (mat[i][0] === 0) firstColZero = true;
      for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
          if (mat[i][j] === 0) {
            mat[i][0] = 0;
            mat[0][j] = 0;
          }
        }
      }
      for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
          if (mat[i][0] === 0 || mat[0][j] === 0) {
            mat[i][j] = 0;
          }
        }
      }
      if (firstRowZero) for (let j = 0; j < n; j++) mat[0][j] = 0;
      if (firstColZero) for (let i = 0; i < m; i++) mat[i][0] = 0;
      return mat.map(row => row.join(' ')).join('\n');
    }
  },

  // 5. Rotate Image
  {
    id: "ch_rotate_image",
    title: "Rotate Image 90 Degrees Clockwise",
    difficulty: "Medium",
    category: "Arrays",
    description: "You are given an n x n 2D matrix representing an image. Rotate the image by 90 degrees clockwise in-place.",
    inputFormat: "Line 1: A single integer n.\nNext n lines: n space-separated integers representing each row.",
    outputFormat: "n lines with n space-separated integers representing the rotated matrix.",
    constraints: [
      "1 <= n <= 20",
      "-1000 <= matrix[i][j] <= 1000"
    ],
    objective: "Rotate an n x n 2D array by transposing and reversing rows.",
    conceptualExplanation: [
      "Rotating 90 degrees clockwise is equivalent to:",
      "1. Transposing the matrix (swap mat[i][j] with mat[j][i]).",
      "2. Reversing each row horizontally."
    ],
    hints: [
      "Transpose along main diagonal first.",
      "Then reverse each row from left to right."
    ],
    rawInputs: [
      "3\n1 2 3\n4 5 6\n7 8 9",
      "4\n5 1 9 11\n2 4 8 10\n13 3 6 7\n15 14 12 16",
      "1\n7",
      "2\n1 2\n3 4",
      "2\n0 0\n0 0",
      "3\n1 0 0\n0 1 0\n0 0 1",
      "3\n9 8 7\n6 5 4\n3 2 1",
      "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16",
      "2\n-1 -2\n-3 -4",
      "3\n1 2 1\n2 3 2\n1 2 1"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const n = parseInt(lines[0].trim(), 10);
      const mat = [];
      for (let i = 1; i <= n; i++) {
        mat.push(lines[i].trim().split(/\s+/).map(Number));
      }
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const tmp = mat[i][j];
          mat[i][j] = mat[j][i];
          mat[j][i] = tmp;
        }
      }
      for (let i = 0; i < n; i++) {
        mat[i].reverse();
      }
      return mat.map(r => r.join(' ')).join('\n');
    }
  },

  // 6. Longest Mountain in Array
  {
    id: "ch_longest_mountain",
    title: "Longest Mountain in Array",
    difficulty: "Medium",
    category: "Two Pointers",
    description: "Given an integer array arr, return the length of the longest subarray, which is a mountain. Return 0 if there is no mountain subarray.\n\nRecall that arr[i] is a mountain if arr[0] < arr[1] < ... < arr[i - 1] < arr[i] > arr[i + 1] > ... > arr[arr.length - 1] and length >= 3.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated integers representing arr.",
    outputFormat: "A single integer denoting the length of the longest mountain.",
    constraints: [
      "1 <= n <= 10000",
      "0 <= arr[i] <= 10^4"
    ],
    objective: "Identify local peaks and expand outwards to calculate maximum mountain length.",
    conceptualExplanation: [
      "A mountain peak requires arr[i-1] < arr[i] > arr[i+1].",
      "For every peak, expand left while arr[l-1] < arr[l] and expand right while arr[r] > arr[r+1].",
      "Length is r - l + 1. Keep the maximum."
    ],
    hints: [
      "Check condition arr[i] > arr[i-1] && arr[i] > arr[i+1] to find peaks.",
      "Walk left and right pointers from each peak."
    ],
    rawInputs: [
      "7\n2 1 4 7 3 2 5",
      "3\n2 2 2",
      "5\n1 2 3 2 1",
      "4\n1 2 3 4",
      "4\n4 3 2 1",
      "6\n0 1 2 3 2 0",
      "8\n0 2 0 2 1 2 3 1",
      "2\n1 2",
      "9\n1 3 2 1 4 6 5 2 1",
      "5\n2 3 3 2 0"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const n = parseInt(lines[0].trim(), 10);
      if (n < 3) return "0";
      const arr = lines[1].trim().split(/\s+/).map(Number);
      let maxLen = 0;
      for (let i = 1; i < n - 1; i++) {
        if (arr[i] > arr[i - 1] && arr[i] > arr[i + 1]) {
          let l = i, r = i;
          while (l > 0 && arr[l - 1] < arr[l]) l--;
          while (r < n - 1 && arr[r] > arr[r + 1]) r++;
          maxLen = Math.max(maxLen, r - l + 1);
        }
      }
      return String(maxLen);
    }
  },

  // 7. Max Consecutive Ones
  {
    id: "ch_container_max_consecutive_ones",
    title: "Max Consecutive Ones Count",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given a binary array nums, return the maximum number of consecutive 1's in the array.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated binary digits (0 or 1).",
    outputFormat: "A single integer denoting the maximum count of consecutive 1s.",
    constraints: [
      "1 <= n <= 100000",
      "nums[i] is either 0 or 1"
    ],
    objective: "Track consecutive sequences of 1s in a single pass.",
    conceptualExplanation: [
      "Maintain a running counter for 1s.",
      "Increment counter when nums[i] == 1; reset counter to 0 on 0.",
      "Track global max."
    ],
    hints: [
      "Keep count = 0 and maxCount = 0.",
      "If num == 1, count++, else count = 0."
    ],
    rawInputs: [
      "6\n1 1 0 1 1 1",
      "6\n1 0 1 1 0 1",
      "1\n1",
      "1\n0",
      "5\n0 0 0 0 0",
      "5\n1 1 1 1 1",
      "8\n1 0 1 1 1 0 1 1",
      "4\n0 1 1 0",
      "7\n1 1 0 0 1 1 0",
      "10\n1 1 1 0 1 1 1 1 0 1"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const nums = lines[1].trim().split(/\s+/).map(Number);
      let maxCnt = 0, cur = 0;
      for (const x of nums) {
        if (x === 1) {
          cur++;
          if (cur > maxCnt) maxCnt = cur;
        } else {
          cur = 0;
        }
      }
      return String(maxCnt);
    }
  },

  // 8. Find Pivot Index
  {
    id: "ch_find_pivot_index",
    title: "Find Pivot Index (Equilibrium Point)",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array of integers nums, calculate the pivot index of this array.\n\nThe pivot index is the index where the sum of all the numbers strictly to the left of the index is equal to the sum of all the numbers strictly to the index's right.\n\nIf the index is on the left edge of the array, the left sum is 0 because there are no elements to the left. This also applies to the right edge of the array.\n\nReturn the leftmost pivot index. If no such index exists, return -1.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated integers.",
    outputFormat: "A single integer: the 0-based pivot index or -1.",
    constraints: [
      "1 <= n <= 10000",
      "-1000 <= nums[i] <= 1000"
    ],
    objective: "Compute prefix sums in O(n) to find the point where leftSum == rightSum.",
    conceptualExplanation: [
      "Compute totalSum.",
      "Iterate through nums maintaining leftSum.",
      "Right sum is totalSum - leftSum - nums[i].",
      "If leftSum == rightSum, return current index."
    ],
    hints: [
      "Compute total sum first.",
      "Check if leftSum == totalSum - leftSum - nums[i] at each step."
    ],
    rawInputs: [
      "6\n1 7 3 6 5 6",
      "3\n1 2 3",
      "3\n2 1 -1",
      "1\n5",
      "2\n0 0",
      "4\n-1 -1 -1 0",
      "5\n-1 -1 0 1 1",
      "4\n-1 -1 1 1",
      "5\n1 -1 2 2 -2",
      "6\n0 0 0 0 0 0"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const total = nums.reduce((a, b) => a + b, 0);
      let left = 0;
      for (let i = 0; i < nums.length; i++) {
        if (left === total - left - nums[i]) {
          return String(i);
        }
        left += nums[i];
      }
      return "-1";
    }
  },

  // 9. Running Sum of 1D Array
  {
    id: "ch_running_sum_1d",
    title: "Running Sum of 1D Array",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array nums. We define a running sum of an array as runningSum[i] = sum(nums[0]...nums[i]). Return the running sum of nums.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated integers.",
    outputFormat: "Space-separated integers representing the running sum.",
    constraints: [
      "1 <= n <= 1000",
      "-10^6 <= nums[i] <= 10^6"
    ],
    objective: "Perform cumulative summation in a single forward pass.",
    conceptualExplanation: [
      "runningSum[0] = nums[0].",
      "For i from 1 to n - 1, runningSum[i] = runningSum[i - 1] + nums[i]."
    ],
    hints: [
      "Keep an accumulator variable while iterating.",
      "Add current element to accumulator and append to result."
    ],
    rawInputs: [
      "4\n1 2 3 4",
      "5\n1 1 1 1 1",
      "5\n3 1 2 10 1",
      "1\n100",
      "3\n-1 -2 -3",
      "4\n0 0 0 0",
      "5\n10 -5 15 -10 20",
      "2\n-5 5",
      "6\n1 2 3 -3 -2 -1",
      "7\n2 4 6 8 10 12 14"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const nums = lines[1].trim().split(/\s+/).map(Number);
      let acc = 0;
      const res = nums.map(x => (acc += x));
      return res.join(' ');
    }
  },

  // 10. Valid Mountain Array
  {
    id: "ch_valid_mountain_array",
    title: "Valid Mountain Array Verification",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given an array of integers arr, return true if and only if it is a valid mountain array.\n\nRecall that arr is a mountain array if and only if:\n- arr.length >= 3\n- There exists some i with 0 < i < arr.length - 1 such that:\n  arr[0] < arr[1] < ... < arr[i - 1] < arr[i]\n  arr[i] > arr[i + 1] > ... > arr[arr.length - 1]",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated integers.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= n <= 10000",
      "0 <= arr[i] <= 10000"
    ],
    objective: "Use two pointer simulation to verify strictly increasing and then strictly decreasing order.",
    conceptualExplanation: [
      "Walk up from left while arr[i] < arr[i+1].",
      "Walk down from right while arr[j] < arr[j-1].",
      "Peak must be the same index and cannot be the first or last element (0 < i == j < n - 1)."
    ],
    hints: [
      "Walk up the hill as far as possible.",
      "Check that the peak is not the first or last element.",
      "Then walk down the hill to the end."
    ],
    rawInputs: [
      "2\n2 1",
      "3\n3 5 5",
      "4\n0 3 2 1",
      "3\n1 2 3",
      "3\n3 2 1",
      "5\n0 2 3 4 5",
      "5\n5 4 3 2 1",
      "5\n0 2 3 3 1",
      "6\n0 1 2 4 2 1",
      "7\n1 2 3 4 3 2 1"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const n = parseInt(lines[0].trim(), 10);
      if (n < 3) return "false";
      const arr = lines[1].trim().split(/\s+/).map(Number);
      let i = 0;
      while (i + 1 < n && arr[i] < arr[i + 1]) i++;
      if (i === 0 || i === n - 1) return "false";
      while (i + 1 < n && arr[i] > arr[i + 1]) i++;
      return i === n - 1 ? "true" : "false";
    }
  },

  // 11. Boats to Save People
  {
    id: "ch_boats_to_save_people",
    title: "Boats to Save People",
    difficulty: "Medium",
    category: "Two Pointers",
    description: "You are given an array people where people[i] is the weight of the ith person, and an infinite number of boats where each boat can carry a maximum weight of limit. Each boat carries at most two people at the same time, provided the sum of the weight of those people is at most limit.\n\nReturn the minimum number of boats to carry every given person.",
    inputFormat: "Line 1: Two integers n and limit.\nLine 2: n space-separated integers representing people weights.",
    outputFormat: "A single integer denoting the minimum number of boats.",
    constraints: [
      "1 <= n <= 50000",
      "1 <= people[i] <= limit <= 30000"
    ],
    objective: "Greedily pair the heaviest available person with the lightest available person.",
    conceptualExplanation: [
      "Sort people by weight.",
      "Use two pointers: left (lightest) and right (heaviest).",
      "If people[left] + people[right] <= limit, both take a boat (left++, right--).",
      "Otherwise, the heaviest must take the boat alone (right--).",
      "In either case, one boat is used."
    ],
    hints: [
      "Sort the array first.",
      "Pair heaviest with lightest if possible."
    ],
    rawInputs: [
      "2 3\n1 2",
      "4 5\n3 2 2 1",
      "4 5\n3 5 3 4",
      "1 3\n3",
      "5 6\n1 2 2 3 5",
      "6 5\n1 1 1 1 1 1",
      "4 4\n2 2 2 2",
      "3 4\n4 4 4",
      "5 10\n5 1 4 2 9",
      "6 8\n2 3 5 6 7 8"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [n, limit] = lines[0].trim().split(/\s+/).map(Number);
      const people = lines[1].trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      let left = 0, right = n - 1;
      let boats = 0;
      while (left <= right) {
        if (people[left] + people[right] <= limit) {
          left++;
        }
        right--;
        boats++;
      }
      return String(boats);
    }
  },

  // 12. Reverse Words in a String
  {
    id: "ch_reverse_words_in_string",
    title: "Reverse Words in a String",
    difficulty: "Medium",
    category: "Strings",
    description: "Given an input string s, reverse the order of the words.\n\nA word is defined as a sequence of non-space characters. The words in s will be separated by at least one space.\n\nReturn a string of the words in reverse order concatenated by a single space, with no leading or trailing spaces.",
    inputFormat: "A single line containing the string s.",
    outputFormat: "A single line containing the reversed words.",
    constraints: [
      "1 <= s.length <= 10^4",
      "s contains English letters (upper-case and lower-case), digits, and spaces ' '.",
      "There is at least one word in s."
    ],
    objective: "Split, filter whitespace, and reverse tokens efficiently.",
    conceptualExplanation: [
      "Split the input string by whitespace sequences.",
      "Filter out empty tokens caused by multiple consecutive spaces.",
      "Reverse the resulting array of word tokens and join with a single space."
    ],
    hints: [
      "Tokenize by whitespace.",
      "Ignore multiple consecutive spaces."
    ],
    rawInputs: [
      "the sky is blue",
      "  hello world  ",
      "a good   example",
      "single",
      "   spaces    everywhere   ",
      "EPIC coding challenge",
      "1 2 3 4 5",
      "   leading trailing   ",
      "Bob Loves Alice",
      "Alice   and   Bob"
    ],
    solve: (input) => {
      const words = input.trim().split(/\s+/).filter(Boolean);
      return words.reverse().join(' ');
    }
  },

  // 13. String to Integer (atoi)
  {
    id: "ch_string_to_integer_atoi",
    title: "String to Integer (atoi) Parser",
    difficulty: "Medium",
    category: "Strings",
    description: "Implement the myAtoi(string s) function, which converts a string to a 32-bit signed integer.\n\n1. Whitespace: Ignore any leading whitespace.\n2. Signedness: Determine the sign by checking if the next character is '-' or '+', assuming positivity if neither is present.\n3. Conversion: Read in next digits until next non-digit or end. Ignore remainder.\n4. Rounding: Clamp result to [-2^31, 2^31 - 1].",
    inputFormat: "A single line containing the string s.",
    outputFormat: "The parsed 32-bit integer.",
    constraints: [
      "0 <= s.length <= 200",
      "s consists of English letters, digits, ' ', '+', '-', and '.'"
    ],
    objective: "Simulate standard C atoi string parser with overflow clamp.",
    conceptualExplanation: [
      "Trim leading spaces.",
      "Read optional '+' or '-' sign.",
      "Iterate over consecutive digits and accumulate result.",
      "Clamp between -2147483648 and 2147483647."
    ],
    hints: [
      "Use BigInt or 64-bit integer during accumulation to prevent premature overflow.",
      "Stop parsing at first non-digit."
    ],
    rawInputs: [
      "42",
      "   -42",
      "4193 with words",
      "words and 987",
      "-91283472332",
      "+1",
      "+-12",
      "00000-42a1234",
      "2147483648",
      "-2147483649"
    ],
    solve: (input) => {
      let s = input.trim();
      let i = 0;
      while (i < s.length && s[i] === ' ') i++;
      if (i >= s.length) return "0";
      let sign = 1;
      if (s[i] === '+' || s[i] === '-') {
        if (s[i] === '-') sign = -1;
        i++;
      }
      let num = 0n;
      while (i < s.length && s[i] >= '0' && s[i] <= '9') {
        num = num * 10n + BigInt(s.charCodeAt(i) - 48);
        i++;
      }
      let val = BigInt(sign) * num;
      const INT_MIN = -2147483648n;
      const INT_MAX = 2147483647n;
      if (val < INT_MIN) val = INT_MIN;
      if (val > INT_MAX) val = INT_MAX;
      return val.toString();
    }
  },

  // 14. Isomorphic Strings
  {
    id: "ch_isomorphic_strings",
    title: "Isomorphic Strings Mapping",
    difficulty: "Easy",
    category: "Strings",
    description: "Given two strings s and t, determine if they are isomorphic.\n\nTwo strings s and t are isomorphic if the characters in s can be replaced to get t.\n\nAll occurrences of a character must be replaced with another character while preserving the order of characters. No two characters may map to the same character, but a character may map to itself.",
    inputFormat: "Line 1: String s.\nLine 2: String t.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= s.length <= 50000",
      "t.length == s.length",
      "s and t consist of any valid ascii character."
    ],
    objective: "Verify bijection between characters of two equal-length strings.",
    conceptualExplanation: [
      "Maintain two maps: mapS[charS] = charT and mapT[charT] = charS.",
      "If a conflict is detected in either mapping, return false.",
      "If all characters match the one-to-one bijection, return true."
    ],
    hints: [
      "A character from s cannot map to two different characters in t, and vice versa.",
      "Use two hash maps or arrays of size 256."
    ],
    rawInputs: [
      "egg\nadd",
      "foo\nbar",
      "paper\ntitle",
      "badc\nbaba",
      "a\na",
      "ab\naa",
      "bbbaaaba\naaabbbba",
      "abcdef\nghijkl",
      "aba\ncdc",
      "listen\nsilent"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const s = lines[0].trim();
      const t = lines[1].trim();
      if (s.length !== t.length) return "false";
      const s2t = {};
      const t2s = {};
      for (let i = 0; i < s.length; i++) {
        const c1 = s[i];
        const c2 = t[i];
        if (s2t[c1] && s2t[c1] !== c2) return "false";
        if (t2s[c2] && t2s[c2] !== c1) return "false";
        s2t[c1] = c2;
        t2s[c2] = c1;
      }
      return "true";
    }
  },

  // 15. Word Pattern
  {
    id: "ch_word_pattern",
    title: "Word Pattern Bijection",
    difficulty: "Easy",
    category: "Strings",
    description: "Given a pattern and a string s, find if s follows the same pattern.\n\nHere follow means a full match, such that there is a bijection between a letter in pattern and a non-empty word in s.",
    inputFormat: "Line 1: Pattern string.\nLine 2: String s of space-separated words.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= pattern.length <= 300",
      "pattern contains only lower-case English letters.",
      "1 <= s.length <= 3000",
      "s contains only lowercase English letters and spaces ' '."
    ],
    objective: "Establish a one-to-one bijection between pattern characters and words.",
    conceptualExplanation: [
      "Split s into words.",
      "If pattern.length !== words.length, return false.",
      "Maintain charToWord and wordToChar maps to ensure bijection."
    ],
    hints: [
      "Ensure words array length equals pattern length.",
      "Verify one-to-one and onto mapping."
    ],
    rawInputs: [
      "abba\ndog cat cat dog",
      "abba\ndog cat cat fish",
      "aaaa\ndog cat cat dog",
      "abba\ndog dog dog dog",
      "a\ndog",
      "abc\ncat dog bird",
      "aaa\naa aa aa",
      "jquery\njquery",
      "aba\ndog cat cat",
      "ab\nhappy happy"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const pattern = lines[0].trim();
      const words = lines[1].trim().split(/\s+/).filter(Boolean);
      if (pattern.length !== words.length) return "false";
      const p2w = {};
      const w2p = {};
      for (let i = 0; i < pattern.length; i++) {
        const p = pattern[i];
        const w = words[i];
        if (p2w[p] && p2w[p] !== w) return "false";
        if (w2p[w] && w2p[w] !== p) return "false";
        p2w[p] = w;
        w2p[w] = p;
      }
      return "true";
    }
  },

  // 16. Ransom Note
  {
    id: "ch_ransom_note",
    title: "Ransom Note Magazine Construction",
    difficulty: "Easy",
    category: "Strings",
    description: "Given two strings ransomNote and magazine, return true if ransomNote can be constructed by using the letters from magazine and false otherwise.\n\nEach letter in magazine can only be used once in ransomNote.",
    inputFormat: "Line 1: String ransomNote.\nLine 2: String magazine.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= ransomNote.length, magazine.length <= 10^5",
      "ransomNote and magazine consist of lowercase English letters."
    ],
    objective: "Verify character frequencies with frequency counting.",
    conceptualExplanation: [
      "Count character frequencies in magazine.",
      "Iterate through ransomNote, decrementing count for each character.",
      "If any character count drops below zero, return false."
    ],
    hints: [
      "Use an integer array of size 26 for frequencies.",
      "Ensure magazine has >= count for every character in ransomNote."
    ],
    rawInputs: [
      "a\nb",
      "aa\nab",
      "aa\naab",
      "hello\nolelh",
      "code\ncomputerprogramming",
      "abc\ndef",
      "z\nzzzz",
      "quiet\nquite",
      "test\ntesting",
      "all\nllama"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const note = lines[0].trim();
      const mag = lines[1].trim();
      const freq = {};
      for (const c of mag) freq[c] = (freq[c] || 0) + 1;
      for (const c of note) {
        if (!freq[c] || freq[c] <= 0) return "false";
        freq[c]--;
      }
      return "true";
    }
  },

  // 17. Minimum Add to Make Parentheses Valid
  {
    id: "ch_min_add_valid_parentheses",
    title: "Minimum Add to Make Parentheses Valid",
    difficulty: "Medium",
    category: "Stacks",
    description: "A parentheses string is valid if and only if:\n1. It is the empty string,\n2. It can be written as AB (A concatenated with B), where A and B are valid strings, or\n3. It can be written as (A), where A is a valid string.\n\nYou are given a parentheses string s. In one move, you can insert a parenthesis at any position of the string.\n\nReturn the minimum number of moves required to make s valid.",
    inputFormat: "A single line containing the string s.",
    outputFormat: "A single integer denoting the minimum moves.",
    constraints: [
      "1 <= s.length <= 1000",
      "s[i] is either '(' or ')'."
    ],
    objective: "Count unmatched opening and closing parentheses.",
    conceptualExplanation: [
      "Track openCount (unmatched '(') and addCount (missing '(' for ')').",
      "For '(', openCount++.",
      "For ')', if openCount > 0, openCount--; else addCount++.",
      "Total minimum additions = addCount + openCount."
    ],
    hints: [
      "Keep track of open balance.",
      "If ')' has no matching '(', increment needed."
    ],
    rawInputs: [
      "())",
      "(((",
      "()",
      "()))((",
      "((((((",
      "))))))",
      "()()()",
      "(()())(",
      "((()(())))",
      ")("
    ],
    solve: (input) => {
      const s = input.trim();
      let open = 0, add = 0;
      for (const ch of s) {
        if (ch === '(') {
          open++;
        } else if (ch === ')') {
          if (open > 0) open--;
          else add++;
        }
      }
      return String(add + open);
    }
  },

  // 18. Score of Parentheses
  {
    id: "ch_score_of_parentheses",
    title: "Score of Balanced Parentheses",
    difficulty: "Medium",
    category: "Stacks",
    description: "Given a balanced parentheses string s, return the score of the string.\n\nThe score of a balanced parentheses string is based on the following rule:\n- \"()\" has score 1.\n- AB has score A + B, where A and B are balanced parentheses strings.\n- (A) has score 2 * A, where A is a balanced parentheses string.",
    inputFormat: "A single line containing the balanced parentheses string s.",
    outputFormat: "A single integer denoting the score.",
    constraints: [
      "2 <= s.length <= 50",
      "s consists of only '(' and ')'.",
      "s is a balanced parentheses string."
    ],
    objective: "Calculate recursive nested score using a stack or depth tracking.",
    conceptualExplanation: [
      "Every \"()\" contributes 2^depth to the score where depth is current nesting level.",
      "Whenever s[i] == ')' and s[i-1] == '(', add 1 << depth to total score."
    ],
    hints: [
      "Track current depth (increments on '(', decrements on ')').",
      "Add 1 << depth whenever you encounter \"()\"."
    ],
    rawInputs: [
      "()",
      "(())",
      "()()",
      "(()(()))",
      "((()))",
      "(())(())",
      "((())())",
      "(((())))",
      "()(())()",
      "((()())(()))"
    ],
    solve: (input) => {
      const s = input.trim();
      let score = 0, depth = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') {
          depth++;
        } else {
          depth--;
          if (s[i - 1] === '(') {
            score += (1 << depth);
          }
        }
      }
      return String(score);
    }
  },

  // 19. Make The String Great
  {
    id: "ch_make_the_string_great",
    title: "Make The String Great",
    difficulty: "Easy",
    category: "Stacks",
    description: "Given a string s of lower and upper case English letters. A good string is a string which doesn't have two adjacent characters s[i] and s[i + 1] where:\n- 0 <= i <= s.length - 2\n- s[i] is a lower-case letter and s[i + 1] is the same letter but in upper-case or vice-versa.\n\nTo make the string good, you can choose two adjacent characters that make the string bad and remove them. You can keep doing this until the string becomes good.\n\nReturn the string after making it good. If the string becomes empty, return \"EMPTY\".",
    inputFormat: "A single line containing the string s.",
    outputFormat: "The good string or \"EMPTY\".",
    constraints: [
      "1 <= s.length <= 100",
      "s contains only lower and upper case English letters."
    ],
    objective: "Use a stack to cancel adjacent uppercase and lowercase matching characters.",
    conceptualExplanation: [
      "Use a stack.",
      "For each character, check if Math.abs(ch.charCodeAt(0) - stack.top().charCodeAt(0)) === 32.",
      "If yes, pop from stack; otherwise push.",
      "If stack is empty at the end, output EMPTY."
    ],
    hints: [
      "Difference in ASCII value between upper and lower case of same letter is 32.",
      "Stack simulates recursive deletion."
    ],
    rawInputs: [
      "leEeetcode",
      "abBAcC",
      "s",
      "Pp",
      "mC",
      "abBA",
      "HhHhHh",
      "aAabBAcC",
      "abcdef",
      "aAbBcC"
    ],
    solve: (input) => {
      const s = input.trim();
      const stack = [];
      for (const ch of s) {
        if (stack.length > 0 && Math.abs(ch.charCodeAt(0) - stack[stack.length - 1].charCodeAt(0)) === 32) {
          stack.pop();
        } else {
          stack.push(ch);
        }
      }
      return stack.length === 0 ? "EMPTY" : stack.join('');
    }
  },

  // 20. Crawler Log Folder
  {
    id: "ch_crawler_log_folder",
    title: "Crawler Log Folder Operations",
    difficulty: "Easy",
    category: "Stacks",
    description: "The Leetcode file system keeps a log each time, some user performs a change folder operation.\n\nThe operations are described below:\n- \"../\" : Move to the parent folder of the current folder. (If you are already in the main folder, remain in the same folder).\n- \"./\" : Remain in the same folder.\n- \"x/\" : Move to the child folder named x.\n\nYou are given a list of strings logs where logs[i] is the operation performed by the user at the ith step. Return the minimum number of steps needed to go back to the main folder after all operations.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated operation strings.",
    outputFormat: "A single integer denoting depth from root folder.",
    constraints: [
      "1 <= logs.length <= 10^4",
      "2 <= logs[i].length <= 10"
    ],
    objective: "Simulate stack directory depth.",
    conceptualExplanation: [
      "Initialize depth = 0.",
      "If \"../\", depth = Math.max(0, depth - 1).",
      "If \"./\", do nothing.",
      "Otherwise, depth++."
    ],
    hints: [
      "Depth cannot go below 0.",
      "Ignore \"./\"."
    ],
    rawInputs: [
      "5\nd1/ d2/ ../ d21/ ./",
      "6\nd1/ d2/ ./ d3/ ../ d31/",
      "4\nd1/ ../ ../ ../",
      "1\n./",
      "1\n../",
      "2\na/ b/",
      "5\na/ ../ a/ ../ a/",
      "6\nx/ y/ z/ ../ ../ ../",
      "4\nx/ ./ ./ ./",
      "7\na/ b/ c/ d/ ../ ../ ./"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const ops = lines[1].trim().split(/\s+/).filter(Boolean);
      let depth = 0;
      for (const op of ops) {
        if (op === '../') {
          if (depth > 0) depth--;
        } else if (op === './') {
          // do nothing
        } else {
          depth++;
        }
      }
      return String(depth);
    }
  },

  // 21. Dota2 Senate
  {
    id: "ch_dota2_senate",
    title: "Dota2 Senate Radiant vs Dire",
    difficulty: "Medium",
    category: "Queues",
    description: "In the world of Dota2, there are two parties: Radiant and Dire.\n\nThe Senate consists of senators from both parties. Each senator can exercise one of two rights:\n1. Ban one senator's right from the other party.\n2. Announce the victory if all remaining senators are from the same party.\n\nRound-based procedure starts from the first senator to the last. Predict whether \"Radiant\" or \"Dire\" will announce victory.",
    inputFormat: "A single line containing the string senate consisting of 'R' and 'D'.",
    outputFormat: "Radiant or Dire.",
    constraints: [
      "1 <= senate.length <= 10000"
    ],
    objective: "Use two queues to model senator turns and round-robin bans.",
    conceptualExplanation: [
      "Store indices of 'R' in queue R and 'D' in queue D.",
      "Pop the front of both queues; the smaller index bans the larger index.",
      "The winning senator is re-enqueued with index + senate.length.",
      "Repeat until one queue is empty."
    ],
    hints: [
      "Senator with earlier index always bans senator with later index.",
      "Simulate using two FIFO queues."
    ],
    rawInputs: [
      "RD",
      "RDD",
      "DDRRR",
      "R",
      "D",
      "RRDDD",
      "DDR",
      "RDRDRD",
      "DRRDRD",
      "RRRDDD"
    ],
    solve: (input) => {
      const senate = input.trim();
      const n = senate.length;
      const radiant = [];
      const dire = [];
      for (let i = 0; i < n; i++) {
        if (senate[i] === 'R') radiant.push(i);
        else dire.push(i);
      }
      while (radiant.length > 0 && dire.length > 0) {
        const r = radiant.shift();
        const d = dire.shift();
        if (r < d) {
          radiant.push(r + n);
        } else {
          dire.push(d + n);
        }
      }
      return radiant.length > 0 ? "Radiant" : "Dire";
    }
  },

  // 22. Number of Recent Calls
  {
    id: "ch_number_of_recent_calls",
    title: "Number of Recent Calls Ping Counter",
    difficulty: "Easy",
    category: "Queues",
    description: "You have a RecentCounter class which counts the number of recent requests within a certain time frame.\n\nGiven a sequence of ping timestamps t in strictly increasing order, for each ping, return the number of pings that have occurred in the past 3000 milliseconds inclusive (i.e., in the range [t - 3000, t]).",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated strictly increasing timestamps.",
    outputFormat: "n space-separated integers representing return values for each ping.",
    constraints: [
      "1 <= n <= 10000",
      "1 <= t <= 10^9",
      "Each t is strictly larger than the previous one."
    ],
    objective: "Evict elements older than t - 3000 from queue in amortized O(1).",
    conceptualExplanation: [
      "Maintain a FIFO queue.",
      "For each timestamp t, push t into queue.",
      "While queue.front() < t - 3000, pop front.",
      "Queue length is the answer for this ping."
    ],
    hints: [
      "Use sliding window / queue eviction.",
      "Amortized time is O(1) per ping."
    ],
    rawInputs: [
      "4\n1 100 3001 3002",
      "1\n1",
      "5\n10 20 30 40 50",
      "3\n1 3000 6000",
      "4\n1 3001 6001 9001",
      "5\n1000 2000 3000 4000 5000",
      "6\n1 2 3001 3002 6002 6003",
      "2\n100 3100",
      "3\n500 3500 3501",
      "5\n100 200 300 400 3500"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const pings = lines[1].trim().split(/\s+/).map(Number);
      const q = [];
      const res = [];
      for (const t of pings) {
        q.push(t);
        while (q.length > 0 && q[0] < t - 3000) {
          q.shift();
        }
        res.push(q.length);
      }
      return res.join(' ');
    }
  },

  // 23. Swapping Nodes in a Linked List
  {
    id: "ch_swapping_nodes_linked_list",
    title: "Swapping Nodes in a Linked List",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "You are given the head of a linked list, and an integer k.\n\nReturn the values of the list after swapping the values of the kth node from the beginning and the kth node from the end (the list is 1-indexed).",
    inputFormat: "Line 1: Two space-separated integers n and k.\nLine 2: n space-separated integers representing linked list node values.",
    outputFormat: "n space-separated integers representing the list after swapping.",
    constraints: [
      "1 <= k <= n <= 10^5",
      "0 <= Node.val <= 100"
    ],
    objective: "Identify k-th from front and k-th from end in one pass and swap values.",
    conceptualExplanation: [
      "Find k-th node from beginning (index k - 1).",
      "Find k-th node from end (index n - k).",
      "Swap their values."
    ],
    hints: [
      "First target is at index k-1.",
      "Second target is at index n-k."
    ],
    rawInputs: [
      "5 2\n1 2 3 4 5",
      "10 5\n7 9 6 6 7 8 3 0 9 5",
      "1 1\n1",
      "2 1\n1 2",
      "2 2\n1 2",
      "3 2\n1 2 3",
      "4 1\n1 2 3 4",
      "4 4\n1 2 3 4",
      "5 3\n1 2 3 4 5",
      "6 3\n10 20 30 40 50 60"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [n, k] = lines[0].trim().split(/\s+/).map(Number);
      const vals = lines[1].trim().split(/\s+/).map(Number);
      const idx1 = k - 1;
      const idx2 = n - k;
      const tmp = vals[idx1];
      vals[idx1] = vals[idx2];
      vals[idx2] = tmp;
      return vals.join(' ');
    }
  },

  // 24. Delete Node in a Linked List Without Head
  {
    id: "ch_delete_node_linked_list",
    title: "Delete Node in a Linked List Without Head",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "There is a singly-linked list and you are given the node to be deleted node. You will not be given access to the first node of head.\n\nAll the values of the linked list are unique, and it is guaranteed that the given node is not the last node in the linked list.\n\nDelete the given node and return the values of the remaining linked list.",
    inputFormat: "Line 1: Two space-separated integers n and targetVal (the value of node to delete).\nLine 2: n space-separated unique integers.",
    outputFormat: "Space-separated integers of the remaining linked list.",
    constraints: [
      "2 <= n <= 1000",
      "-1000 <= Node.val <= 1000",
      "targetVal is guaranteed not to be the last node."
    ],
    objective: "Simulate deleting a node by copying next node's value and bypassing next node.",
    conceptualExplanation: [
      "Since we do not have reference to predecessor node, copy next node's value into current node.",
      "Point current.next to current.next.next.",
      "This effectively removes target node."
    ],
    hints: [
      "node.val = node.next.val",
      "node.next = node.next.next"
    ],
    rawInputs: [
      "4 5\n4 5 1 9",
      "4 1\n4 5 1 9",
      "3 2\n1 2 3",
      "2 0\n0 1",
      "5 -3\n-3 5 -99 2 4",
      "4 10\n10 20 30 40",
      "4 20\n10 20 30 40",
      "5 3\n1 2 3 4 5",
      "6 100\n50 100 150 200 250 300",
      "3 7\n7 8 9"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [n, target] = lines[0].trim().split(/\s+/).map(Number);
      const vals = lines[1].trim().split(/\s+/).map(Number);
      const idx = vals.indexOf(target);
      if (idx !== -1 && idx < vals.length - 1) {
        vals.splice(idx, 1);
      }
      return vals.join(' ');
    }
  },

  // 25. Split Linked List in Parts
  {
    id: "ch_split_linked_list_in_parts",
    title: "Split Linked List in Parts",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "Given the head of a singly linked list and an integer k, split the linked list into k consecutive linked list parts.\n\nThe length of each part should be as equal as possible: no two parts should have a size differing by more than one. This may lead to some parts being null.\n\nThe parts should be in the order of occurrence in the input list, and parts occurring earlier should always have a size greater than or equal to parts occurring later.\n\nOutput the size of each part separated by space.",
    inputFormat: "Line 1: Two space-separated integers n and k.\nLine 2: n space-separated integers representing linked list (empty line if n == 0).",
    outputFormat: "k space-separated integers representing part lengths.",
    constraints: [
      "0 <= n <= 1000",
      "1 <= k <= 50"
    ],
    objective: "Distribute elements into k equal buckets with extra remainder allocated to earlier buckets.",
    conceptualExplanation: [
      "Base size of each part = Math.floor(n / k).",
      "Remainder extra = n % k.",
      "The first 'extra' parts have size base + 1, while the remaining parts have size base."
    ],
    hints: [
      "Quotient gives baseline size.",
      "Remainder gives number of buckets that receive one extra node."
    ],
    rawInputs: [
      "3 5\n1 2 3",
      "10 3\n1 2 3 4 5 6 7 8 9 10",
      "0 3\n",
      "5 1\n1 2 3 4 5",
      "4 4\n1 2 3 4",
      "7 3\n1 2 3 4 5 6 7",
      "6 4\n1 2 3 4 5 6",
      "1 2\n42",
      "8 4\n1 2 3 4 5 6 7 8",
      "11 3\n1 2 3 4 5 6 7 8 9 10 11"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [n, k] = lines[0].trim().split(/\s+/).map(Number);
      const base = Math.floor(n / k);
      let rem = n % k;
      const res = [];
      for (let i = 0; i < k; i++) {
        let sz = base + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
        res.push(sz);
      }
      return res.join(' ');
    }
  },

  // 26. Single Element in a Sorted Array
  {
    id: "ch_single_element_sorted_array",
    title: "Single Element in a Sorted Array (Log N)",
    difficulty: "Medium",
    category: "Binary Search",
    description: "You are given a sorted array consisting of only integers where every element appears exactly twice, except for one element which appears exactly once.\n\nReturn the single element that appears only once.\n\nYour solution must run in O(log n) time and O(1) space.",
    inputFormat: "Line 1: An integer n (always odd).\nLine 2: n space-separated integers in non-decreasing order.",
    outputFormat: "The single unique integer.",
    constraints: [
      "1 <= n <= 10^5",
      "0 <= nums[i] <= 10^5"
    ],
    objective: "Exploit even-odd index pairing invariant using binary search.",
    conceptualExplanation: [
      "Before single element, first instance of duplicate is at even index, second at odd index.",
      "After single element, pattern shifts (first instance is at odd index).",
      "Binary search midpoint: ensure mid is even (if odd, mid--). If nums[mid] == nums[mid+1], unique is to the right; else left."
    ],
    hints: [
      "Compare nums[mid] with nums[mid ^ 1].",
      "If they are equal, the single element is in the right half."
    ],
    rawInputs: [
      "9\n1 1 2 3 3 4 4 8 8",
      "7\n3 3 7 7 10 11 11",
      "1\n5",
      "3\n1 1 2",
      "3\n1 2 2",
      "5\n2 2 4 4 5",
      "5\n1 2 2 3 3",
      "7\n1 1 2 2 3 3 4",
      "9\n0 0 1 1 2 3 3 4 4",
      "11\n1 1 2 2 3 3 4 4 5 6 6"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const nums = lines[1].trim().split(/\s+/).map(Number);
      let low = 0, high = nums.length - 1;
      while (low < high) {
        let mid = Math.floor((low + high) / 2);
        if (mid % 2 === 1) mid--;
        if (nums[mid] === nums[mid + 1]) {
          low = mid + 2;
        } else {
          high = mid;
        }
      }
      return String(nums[low]);
    }
  },

  // 27. Search a 2D Matrix
  {
    id: "ch_search_2d_matrix",
    title: "Search a 2D Matrix (Row and Col Sorted)",
    difficulty: "Medium",
    category: "Binary Search",
    description: "You are given an m x n integer matrix with the following two properties:\n- Each row is sorted in non-decreasing order.\n- The first integer of each row is greater than the last integer of the previous row.\n\nGiven an integer target, return true if target is in matrix or false otherwise.\nSolve in O(log(m * n)) time.",
    inputFormat: "Line 1: Three integers m, n, target.\nNext m lines: n space-separated integers per line.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= m, n <= 100",
      "-10^4 <= matrix[i][j], target <= 10^4"
    ],
    objective: "Flatten 2D matrix into a virtual 1D array and binary search.",
    conceptualExplanation: [
      "Treat matrix of size m x n as 1D array of size m * n.",
      "Index mid maps to row = Math.floor(mid / n) and col = mid % n.",
      "Run standard binary search."
    ],
    hints: [
      "Map 1D index mid to matrix coordinates: row = mid / n, col = mid % n."
    ],
    rawInputs: [
      "3 4 3\n1 3 5 7\n10 11 16 20\n23 30 34 60",
      "3 4 13\n1 3 5 7\n10 11 16 20\n23 30 34 60",
      "1 1 0\n0",
      "1 1 1\n2",
      "2 2 4\n1 2\n3 4",
      "2 2 5\n1 2\n3 4",
      "3 3 9\n1 2 3\n4 5 6\n7 8 9",
      "3 3 1\n1 2 3\n4 5 6\n7 8 9",
      "1 3 2\n1 2 3",
      "3 1 2\n1\n2\n3"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [m, n, target] = lines[0].trim().split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) {
        mat.push(lines[i].trim().split(/\s+/).map(Number));
      }
      let low = 0, high = m * n - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const r = Math.floor(mid / n);
        const c = mid % n;
        const val = mat[r][c];
        if (val === target) return "true";
        if (val < target) low = mid + 1;
        else high = mid - 1;
      }
      return "false";
    }
  },

  // 28. First Bad Version
  {
    id: "ch_find_first_bad_version",
    title: "First Bad Version API Simulator",
    difficulty: "Easy",
    category: "Binary Search",
    description: "You are a product manager and currently leading a team to develop a new product. Unfortunately, the latest version of your product fails the quality check. Since each version is developed based on the previous version, all the versions after a bad version are also bad.\n\nSuppose you have n versions [1, 2, ..., n] and you are given the first bad version target. Return the first bad version using binary search.",
    inputFormat: "Line 1: Two integers n and firstBad (1 <= firstBad <= n).",
    outputFormat: "A single integer: the first bad version.",
    constraints: [
      "1 <= firstBad <= n <= 2^31 - 1"
    ],
    objective: "Implement lower-bound binary search on boolean predicate.",
    conceptualExplanation: [
      "Binary search range [1, n].",
      "If mid >= firstBad, then mid is bad; search left half [low, mid].",
      "Else, search right half [mid + 1, high].",
      "Terminate when low == high."
    ],
    hints: [
      "Avoid integer overflow using low + Math.floor((high - low) / 2)."
    ],
    rawInputs: [
      "5 4",
      "1 1",
      "10 1",
      "10 10",
      "100 50",
      "2147483647 123456789",
      "3 2",
      "2 1",
      "2 2",
      "1000 999"
    ],
    solve: (input) => {
      const [n, bad] = input.trim().split(/\s+/).map(Number);
      let low = 1, high = n;
      while (low < high) {
        const mid = Math.floor(low + (high - low) / 2);
        if (mid >= bad) {
          high = mid;
        } else {
          low = mid + 1;
        }
      }
      return String(low);
    }
  },

  // 29. Binary Tree Right Side View
  {
    id: "ch_binary_tree_right_side_view",
    title: "Binary Tree Right Side View",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a binary tree (represented as level-order array with 'null' for missing nodes), imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom.",
    inputFormat: "Line 1: An integer n denoting number of tokens.\nLine 2: n space-separated tokens representing level-order binary tree.",
    outputFormat: "Space-separated values visible from the right side.",
    constraints: [
      "0 <= n <= 1000"
    ],
    objective: "Use level-order BFS traversal to capture the last element of every depth level.",
    conceptualExplanation: [
      "Build binary tree from level order array.",
      "Perform BFS queue level-order traversal.",
      "The last node processed in each level queue is visible from the right."
    ],
    hints: [
      "BFS level by level.",
      "Add node.val of last element of each queue level."
    ],
    rawInputs: [
      "5\n1 2 3 null 5",
      "3\n1 null 3",
      "0\n",
      "1\n10",
      "7\n1 2 3 4 5 6 7",
      "4\n1 2 3 4",
      "6\n1 2 null 3 null 4",
      "5\n3 9 20 null 15",
      "6\n1 2 3 null null 4",
      "4\n1 2 3 null"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const n = parseInt(lines[0].trim(), 10);
      if (n === 0 || !lines[1] || lines[1].trim() === '') return "EMPTY";
      const tokens = lines[1].trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0 || tokens[0] === 'null') return "EMPTY";
      
      class TreeNode {
        constructor(val) {
          this.val = val;
          this.left = null;
          this.right = null;
        }
      }
      const root = new TreeNode(tokens[0]);
      const queue = [root];
      let i = 1;
      while (queue.length > 0 && i < tokens.length) {
        const curr = queue.shift();
        if (i < tokens.length && tokens[i] !== 'null') {
          curr.left = new TreeNode(tokens[i]);
          queue.push(curr.left);
        }
        i++;
        if (i < tokens.length && tokens[i] !== 'null') {
          curr.right = new TreeNode(tokens[i]);
          queue.push(curr.right);
        }
        i++;
      }
      
      const res = [];
      const bfs = [root];
      while (bfs.length > 0) {
        const sz = bfs.length;
        let rightVal = null;
        for (let s = 0; s < sz; s++) {
          const curr = bfs.shift();
          rightVal = curr.val;
          if (curr.left) bfs.push(curr.left);
          if (curr.right) bfs.push(curr.right);
        }
        if (rightVal !== null) res.push(rightVal);
      }
      return res.join(' ');
    }
  },

  // 30. Count Complete Tree Nodes
  {
    id: "ch_count_complete_tree_nodes",
    title: "Count Complete Tree Nodes in Sub-linear Time",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a complete binary tree, return the number of the nodes in the tree.\n\nAccording to Wikipedia, every level, except possibly the last, is completely filled in a complete binary tree, and all nodes in the last level are as far left as possible.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated tokens of level order traversal.",
    outputFormat: "A single integer denoting total node count.",
    constraints: [
      "0 <= n <= 50000"
    ],
    objective: "Count nodes in complete binary tree in O(log^2 N).",
    conceptualExplanation: [
      "Compute left height and right height.",
      "If left height == right height, tree is full: return (1 << height) - 1.",
      "Otherwise, 1 + count(left) + count(right)."
    ],
    hints: [
      "Check if left subtree height matches right subtree height."
    ],
    rawInputs: [
      "6\n1 2 3 4 5 6",
      "0\n",
      "1\n1",
      "3\n1 2 3",
      "4\n1 2 3 4",
      "7\n1 2 3 4 5 6 7",
      "5\n1 2 3 4 5",
      "2\n1 2",
      "8\n1 2 3 4 5 6 7 8",
      "10\n1 2 3 4 5 6 7 8 9 10"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const n = parseInt(lines[0].trim(), 10);
      if (n === 0 || !lines[1] || lines[1].trim() === '') return "0";
      const tokens = lines[1].trim().split(/\s+/).filter(Boolean);
      const count = tokens.filter(t => t !== 'null').length;
      return String(count);
    }
  },

  // 31. Path Sum II All Root to Leaf Paths
  {
    id: "ch_path_sum_ii",
    title: "Path Sum II All Root to Leaf Paths",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a binary tree and an integer targetSum, return the number of root-to-leaf paths where the sum of the node values in the path equals targetSum.",
    inputFormat: "Line 1: Two integers n and targetSum.\nLine 2: n space-separated tokens of tree level order.",
    outputFormat: "A single integer denoting the count of matching root-to-leaf paths.",
    constraints: [
      "0 <= n <= 5000",
      "-1000 <= targetSum <= 1000"
    ],
    objective: "DFS backtracking root-to-leaf path sum verification.",
    conceptualExplanation: [
      "Traverse from root to leaves maintaining running path sum.",
      "When reaching leaf (left == null && right == null), check if currentSum == targetSum.",
      "Return total path count."
    ],
    hints: [
      "Only check sum at leaf nodes.",
      "Subtract node value as you recurse down."
    ],
    rawInputs: [
      "10 22\n5 4 8 11 null 13 4 7 2 null",
      "3 5\n1 2 3",
      "2 0\n1 2",
      "1 5\n5",
      "0 10\n",
      "5 6\n1 2 3 3 2",
      "7 10\n5 2 2 3 null null 3",
      "4 4\n1 2 3 1",
      "3 4\n1 3 3",
      "5 18\n5 4 8 9 null"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [n, targetSum] = lines[0].trim().split(/\s+/).map(Number);
      if (n === 0 || !lines[1] || lines[1].trim() === '') return "0";
      const tokens = lines[1].trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0 || tokens[0] === 'null') return "0";

      class TreeNode {
        constructor(val) {
          this.val = val;
          this.left = null;
          this.right = null;
        }
      }
      const root = new TreeNode(parseInt(tokens[0], 10));
      const q = [root];
      let i = 1;
      while (q.length > 0 && i < tokens.length) {
        const curr = q.shift();
        if (i < tokens.length && tokens[i] !== 'null') {
          curr.left = new TreeNode(parseInt(tokens[i], 10));
          q.push(curr.left);
        }
        i++;
        if (i < tokens.length && tokens[i] !== 'null') {
          curr.right = new TreeNode(parseInt(tokens[i], 10));
          q.push(curr.right);
        }
        i++;
      }

      let count = 0;
      function dfs(node, curSum) {
        if (!node) return;
        curSum += node.val;
        if (!node.left && !node.right) {
          if (curSum === targetSum) count++;
          return;
        }
        dfs(node.left, curSum);
        dfs(node.right, curSum);
      }
      dfs(root, 0);
      return String(count);
    }
  },

  // 32. Maximum Width of Binary Tree
  {
    id: "ch_maximum_width_binary_tree",
    title: "Maximum Width of Binary Tree",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a binary tree, return the maximum width of the given tree.\n\nThe maximum width of a tree is the maximum width among all levels.\n\nThe width of one level is defined as the length between the end-nodes (the leftmost and rightmost non-null nodes), where the null nodes between the end-nodes that would be present in a complete binary tree extending down to that level are also counted into the length calculation.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated tokens of level-order tree.",
    outputFormat: "A single integer denoting the maximum width.",
    constraints: [
      "1 <= n <= 3000"
    ],
    objective: "Assign 1-based indices to nodes (left = 2*i, right = 2*i + 1) to measure level width.",
    conceptualExplanation: [
      "Index nodes at root = 0n.",
      "Left child = 2n * idx, right child = 2n * idx + 1n.",
      "At each BFS level, width = Number(lastIdx - firstIdx + 1n).",
      "Normalize indices per level to avoid BigInt overflow."
    ],
    hints: [
      "Use BFS with 0-indexed positions at each level.",
      "Subtract first index of level to keep numbers small."
    ],
    rawInputs: [
      "7\n1 3 2 5 3 null 9",
      "6\n1 3 2 5 null null 9",
      "4\n1 3 2 5",
      "1\n1",
      "3\n1 2 3",
      "5\n1 3 2 5 null",
      "7\n1 1 1 1 1 1 1",
      "5\n1 2 null 3 null",
      "4\n1 null 2 null",
      "7\n1 2 3 null 4 5 null"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const n = parseInt(lines[0].trim(), 10);
      if (n === 0 || !lines[1] || lines[1].trim() === '') return "0";
      const tokens = lines[1].trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0 || tokens[0] === 'null') return "0";

      class TreeNode {
        constructor(val) {
          this.val = val;
          this.left = null;
          this.right = null;
        }
      }
      const root = new TreeNode(tokens[0]);
      const q = [root];
      let i = 1;
      while (q.length > 0 && i < tokens.length) {
        const curr = q.shift();
        if (i < tokens.length && tokens[i] !== 'null') {
          curr.left = new TreeNode(tokens[i]);
          q.push(curr.left);
        }
        i++;
        if (i < tokens.length && tokens[i] !== 'null') {
          curr.right = new TreeNode(tokens[i]);
          q.push(curr.right);
        }
        i++;
      }

      let maxWidth = 1n;
      let bfs = [{ node: root, idx: 0n }];
      while (bfs.length > 0) {
        const sz = bfs.length;
        const minIdx = bfs[0].idx;
        const first = bfs[0].idx - minIdx;
        const last = bfs[sz - 1].idx - minIdx;
        const width = last - first + 1n;
        if (width > maxWidth) maxWidth = width;
        for (let s = 0; s < sz; s++) {
          const { node, idx } = bfs.shift();
          const norm = idx - minIdx;
          if (node.left) bfs.push({ node: node.left, idx: 2n * norm });
          if (node.right) bfs.push({ node: node.right, idx: 2n * norm + 1n });
        }
      }
      return maxWidth.toString();
    }
  },

  // 33. Minimum Genetic Mutation
  {
    id: "ch_minimum_genetic_mutation",
    title: "Minimum Genetic Mutation BFS",
    difficulty: "Medium",
    category: "Graphs",
    description: "A gene string can be represented by an 8-character long string, with choices from 'A', 'C', 'G', and 'T'.\n\nSuppose we need to investigate a mutation from a gene string startGene to a gene string endGene where one mutation is defined as one single character changed in the gene string.\n\nThere is also a gene bank bank that records all the valid gene mutations. A gene must be in bank to make it a valid mutation.\n\nReturn the minimum number of mutations needed to mutate from startGene to endGene. If there is no such a mutation, return -1.",
    inputFormat: "Line 1: startGene endGene\nLine 2: An integer b (size of bank).\nLine 3: b space-separated bank gene strings.",
    outputFormat: "A single integer denoting the minimum mutations or -1.",
    constraints: [
      "startGene.length == endGene.length == bank[i].length == 8",
      "startGene, endGene, and bank[i] consist of only 'A', 'C', 'G', 'T'.",
      "0 <= b <= 10"
    ],
    objective: "Model shortest path on unweighted graph of 8-character gene permutations using BFS.",
    conceptualExplanation: [
      "If endGene is not in bank, immediately return -1.",
      "BFS starting from startGene with distance 0.",
      "For each gene, test changing each of the 8 positions to 'A', 'C', 'G', 'T'.",
      "If the mutation is in bank and unvisited, add to queue and mark visited.",
      "First time endGene is popped, return distance."
    ],
    hints: [
      "BFS guarantees shortest mutation sequence.",
      "Characters are restricted to A, C, G, T."
    ],
    rawInputs: [
      "AACCGGTT AACCGGTA\n1\nAACCGGTA",
      "AACCGGTT AAACGGTA\n3\nAACCGGTA AACCGCTA AAACGGTA",
      "AAAAACCC AACCCCCC\n3\nAAAACCCC AAACCCCC AACCCCCC",
      "AACCGGTT AACCGGTT\n1\nAACCGGTT",
      "AACCGGTT TTTTTTTT\n2\nAACCGGTA AACCGGTT",
      "AAAAAAAA CCCCCCCC\n4\nAAAAAAAA CAAAAAAA CCAAACCC CCCCCCCC",
      "GGTTAACC GGTTAACT\n1\nGGTTAACT",
      "AACCGGTT AACCGGTA\n0\n",
      "AACCGGTT GGCCGGTT\n2\nAGCCGGTT GGCCGGTT",
      "AAAAAAAA AAAAAAAT\n1\nAAAAAAAT"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [start, end] = lines[0].trim().split(/\s+/);
      const b = parseInt(lines[1].trim(), 10);
      const bank = new Set(b > 0 && lines[2] ? lines[2].trim().split(/\s+/).filter(Boolean) : []);
      if (!bank.has(end)) return "-1";
      if (start === end) return "0";
      const q = [[start, 0]];
      const visited = new Set([start]);
      const genes = ['A', 'C', 'G', 'T'];
      while (q.length > 0) {
        const [curr, dist] = q.shift();
        if (curr === end) return String(dist);
        for (let i = 0; i < 8; i++) {
          for (const ch of genes) {
            if (ch !== curr[i]) {
              const next = curr.substring(0, i) + ch + curr.substring(i + 1);
              if (bank.has(next) && !visited.has(next)) {
                visited.add(next);
                q.push([next, dist + 1]);
              }
            }
          }
        }
      }
      return "-1";
    }
  }
];

module.exports = { replacement33 };
