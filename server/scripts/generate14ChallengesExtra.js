/**
 * 14 Extra Challenges to complete the exact 100 new challenges.
 */

const extra14 = [
  // 1. Can Place Flowers
  {
    id: "ch_can_place_flowers",
    title: "Can Place Flowers Without Adjacent Conflict",
    difficulty: "Easy",
    category: "Greedy",
    description: "You have a long flowerbed in which some of the plots are planted, and some are not. However, flowers cannot be planted in adjacent plots.\n\nGiven an integer array flowerbed containing 0's and 1's, where 0 means empty and 1 means not empty, and an integer n, return true if n new flowers can be planted in the flowerbed without violating the no-adjacent-flowers rule and false otherwise.",
    inputFormat: "Line 1: Two integers len and n.\nLine 2: len space-separated 0s and 1s.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= len <= 20000",
      "flowerbed[i] is 0 or 1",
      "0 <= n <= len"
    ],
    objective: "Greedily place flowers in available non-adjacent empty slots.",
    conceptualExplanation: [
      "Iterate through flowerbed.",
      "If plot is 0 and both previous (or i==0) and next (or i==len-1) plots are 0, plant flower (set to 1) and decrement n.",
      "Return n <= 0."
    ],
    hints: [
      "Check left and right neighbors.",
      "Plant as early as possible."
    ],
    rawInputs: [
      "5 1\n1 0 0 0 1",
      "5 2\n1 0 0 0 1",
      "1 1\n0",
      "1 0\n1",
      "3 1\n0 0 0",
      "3 2\n0 0 0",
      "6 2\n0 0 0 0 0 0",
      "4 2\n1 0 0 0",
      "5 1\n0 0 1 0 0",
      "7 3\n0 0 0 0 0 0 0"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [len, n] = lines[0].trim().split(/\s+/).map(Number);
      const bed = lines[1].trim().split(/\s+/).map(Number);
      let count = 0;
      for (let i = 0; i < len; i++) {
        if (bed[i] === 0) {
          const emptyLeft = (i === 0 || bed[i - 1] === 0);
          const emptyRight = (i === len - 1 || bed[i + 1] === 0);
          if (emptyLeft && emptyRight) {
            bed[i] = 1;
            count++;
          }
        }
      }
      return count >= n ? "true" : "false";
    }
  },

  // 2. Contains Duplicate II
  {
    id: "ch_contains_duplicate_ii",
    title: "Contains Duplicate II (Within K Distance)",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an integer array nums and an integer k, return true if there are two distinct indices i and j in the array such that nums[i] == nums[j] and abs(i - j) <= k.",
    inputFormat: "Line 1: Two integers n and k.\nLine 2: n space-separated integers.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= n <= 10^5",
      "-10^9 <= nums[i] <= 10^9",
      "0 <= k <= 10^5"
    ],
    objective: "Track seen element indices within a sliding window of size k using a hash map or hash set.",
    conceptualExplanation: [
      "Maintain a hash map of lastSeenIndex for each element.",
      "If nums[i] was seen and i - lastSeen[nums[i]] <= k, return true.",
      "Update lastSeen[nums[i]] = i."
    ],
    hints: [
      "Hash map from value to index.",
      "Check difference between current index and stored index."
    ],
    rawInputs: [
      "4 3\n1 2 3 1",
      "4 1\n1 0 1 1",
      "6 2\n1 2 3 1 2 3",
      "1 1\n1",
      "3 0\n1 2 1",
      "5 2\n99 99 99 99 99",
      "6 3\n1 2 3 4 5 1",
      "5 1\n1 2 3 4 5",
      "4 2\n1 2 1 2",
      "5 4\n5 1 2 3 5"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [n, k] = lines[0].trim().split(/\s+/).map(Number);
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const map = new Map();
      for (let i = 0; i < n; i++) {
        const val = nums[i];
        if (map.has(val) && i - map.get(val) <= k) {
          return "true";
        }
        map.set(val, i);
      }
      return "false";
    }
  },

  // 3. Longest Harmonious Subsequence
  {
    id: "ch_longest_harmonious_subseq",
    title: "Longest Harmonious Subsequence",
    difficulty: "Easy",
    category: "Arrays",
    description: "We define a harmonious array as an array where the difference between its maximum value and its minimum value is exactly 1.\n\nGiven an integer array nums, return the length of its longest harmonious subsequence among all its possible subsequences.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated integers.",
    outputFormat: "A single integer denoting the length of the longest harmonious subsequence.",
    constraints: [
      "1 <= n <= 20000",
      "-10^9 <= nums[i] <= 10^9"
    ],
    objective: "Count element frequencies and find max(freq[x] + freq[x+1]).",
    conceptualExplanation: [
      "Build a frequency count map of all numbers.",
      "For each key x, if x + 1 exists in the map, a harmonious subsequence of length freq[x] + freq[x+1] can be formed.",
      "Track the maximum length."
    ],
    hints: [
      "Harmonious subsequence only requires diff between min and max to be 1.",
      "Order does not matter because it is a subsequence."
    ],
    rawInputs: [
      "8\n1 3 2 2 5 2 3 7",
      "4\n1 2 3 4",
      "4\n1 1 1 1",
      "1\n10",
      "5\n1 2 2 1 1",
      "6\n1 4 1 3 1 -14",
      "7\n2 2 2 3 3 4 5",
      "5\n0 1 0 1 0",
      "4\n10 20 30 40",
      "6\n-3 -2 -2 -3 5 6"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const freq = new Map();
      for (const x of nums) {
        freq.set(x, (freq.get(x) || 0) + 1);
      }
      let maxLen = 0;
      for (const [key, cnt] of freq.entries()) {
        if (freq.has(key + 1)) {
          maxLen = Math.max(maxLen, cnt + freq.get(key + 1));
        }
      }
      return String(maxLen);
    }
  },

  // 4. Find the Difference of Two Arrays
  {
    id: "ch_find_difference_two_arrays",
    title: "Find the Difference of Two Distinct Arrays",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given two 0-indexed integer arrays nums1 and nums2, return two lines:\n- Line 1: Space-separated distinct integers in nums1 which are not present in nums2 (sorted in ascending order, or EMPTY if none).\n- Line 2: Space-separated distinct integers in nums2 which are not present in nums1 (sorted in ascending order, or EMPTY if none).",
    inputFormat: "Line 1: Two integers n1 and n2.\nLine 2: n1 space-separated integers for nums1.\nLine 3: n2 space-separated integers for nums2.",
    outputFormat: "Two lines with space-separated sorted distinct integers or EMPTY.",
    constraints: [
      "1 <= n1, n2 <= 1000",
      "-1000 <= nums1[i], nums2[i] <= 1000"
    ],
    objective: "Compute set difference between two collections.",
    conceptualExplanation: [
      "Convert nums1 and nums2 into sets S1 and S2.",
      "Diff1 = elements in S1 not in S2, sorted.",
      "Diff2 = elements in S2 not in S1, sorted."
    ],
    hints: [
      "Use HashSets to filter unique elements.",
      "Sort output for deterministic comparison."
    ],
    rawInputs: [
      "3 3\n1 2 3\n2 4 6",
      "4 4\n1 2 3 3\n1 1 2 2",
      "1 1\n5\n5",
      "2 2\n1 2\n3 4",
      "3 1\n1 2 3\n1",
      "1 3\n1\n1 2 3",
      "4 2\n-1 -2 -3 -4\n-1 -2",
      "3 3\n0 0 0\n0 1 2",
      "2 2\n10 20\n20 10",
      "4 4\n7 8 9 10\n1 2 3 4"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const nums1 = lines[1].trim().split(/\s+/).map(Number);
      const nums2 = lines[2].trim().split(/\s+/).map(Number);
      const s1 = new Set(nums1);
      const s2 = new Set(nums2);
      const diff1 = [...s1].filter(x => !s2.has(x)).sort((a, b) => a - b);
      const diff2 = [...s2].filter(x => !s1.has(x)).sort((a, b) => a - b);
      const line1 = diff1.length > 0 ? diff1.join(' ') : "EMPTY";
      const line2 = diff2.length > 0 ? diff2.join(' ') : "EMPTY";
      return `${line1}\n${line2}`;
    }
  },

  // 5. Unique Number of Occurrences
  {
    id: "ch_unique_number_of_occurrences",
    title: "Unique Number of Occurrences",
    difficulty: "Easy",
    category: "Arrays",
    description: "Given an array of integers arr, return true if the number of occurrences of each value in the array is unique or false otherwise.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated integers.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= arr.length <= 1000",
      "-1000 <= arr[i] <= 1000"
    ],
    objective: "Verify that all frequency counts in an array are pairwise distinct.",
    conceptualExplanation: [
      "Compute frequency map of each number in arr.",
      "Collect all frequency values.",
      "Check if number of unique frequencies equals the number of unique elements."
    ],
    hints: [
      "Compare size of frequencies set to number of distinct elements."
    ],
    rawInputs: [
      "6\n1 2 2 1 1 3",
      "2\n1 2",
      "10\n-3 0 1 -3 1 1 1 -3 10 0",
      "1\n42",
      "4\n1 1 2 2",
      "5\n5 5 5 5 5",
      "6\n1 2 3 4 5 6",
      "7\n1 2 2 3 3 3 4",
      "3\n1 2 3",
      "8\n1 1 2 2 2 3 3 3"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const arr = lines[1].trim().split(/\s+/).map(Number);
      const freq = new Map();
      for (const x of arr) freq.set(x, (freq.get(x) || 0) + 1);
      const counts = [...freq.values()];
      const set = new Set(counts);
      return set.size === counts.length ? "true" : "false";
    }
  },

  // 6. Minimum Recolors to Get K Consecutive Black Blocks
  {
    id: "ch_minimum_recolors_k_consecutive",
    title: "Minimum Recolors to Get K Consecutive Black Blocks",
    difficulty: "Easy",
    category: "Sliding Window",
    description: "You are given a 0-indexed string blocks of length n, where blocks[i] is either 'W' (white) or 'B' (black), representing the color of the ith block. You are also given an integer k, which is the desired number of consecutive black blocks.\n\nIn one operation, you can recolor a white block such that it becomes a black block.\n\nReturn the minimum number of operations needed such that there is at least one occurrence of k consecutive black blocks.",
    inputFormat: "Line 1: Two integers n and k.\nLine 2: String blocks.",
    outputFormat: "A single integer denoting minimum recolors.",
    constraints: [
      "1 <= n <= 100",
      "1 <= k <= n",
      "blocks[i] is either 'W' or 'B'."
    ],
    objective: "Find the minimum count of 'W' inside any fixed sliding window of size k.",
    conceptualExplanation: [
      "Count 'W's in the first window of length k.",
      "Slide the window across the string by adding blocks[i] and removing blocks[i - k].",
      "Return the minimum 'W' count seen."
    ],
    hints: [
      "Fixed-size sliding window of length k.",
      "Operations needed = count of 'W' in window."
    ],
    rawInputs: [
      "7 7\nWBBWWBB",
      "5 2\nWBWW",
      "5 1\nWWWWW",
      "5 1\nBBBBB",
      "6 3\nBWWWBB",
      "10 5\nWWBBBWBBWW",
      "8 4\nBWBBWBBB",
      "3 2\nBWB",
      "4 4\nWWWW",
      "7 3\nBBWWBBB"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [n, k] = lines[0].trim().split(/\s+/).map(Number);
      const blocks = lines[1].trim();
      let whites = 0;
      for (let i = 0; i < k; i++) {
        if (blocks[i] === 'W') whites++;
      }
      let minWhites = whites;
      for (let i = k; i < n; i++) {
        if (blocks[i] === 'W') whites++;
        if (blocks[i - k] === 'W') whites--;
        if (whites < minWhites) minWhites = whites;
      }
      return String(minWhites);
    }
  },

  // 7. Defanging an IP Address
  {
    id: "ch_defanging_ip_address",
    title: "Defanging an IPv4 Address",
    difficulty: "Easy",
    category: "Strings",
    description: "Given a valid (IPv4) IP address, return a defanged version of that IP address.\n\nA defanged IP address replaces every period '.' with '[.]'.",
    inputFormat: "A single line containing IPv4 address string.",
    outputFormat: "Defanged IPv4 address string.",
    constraints: [
      "The given address is a valid IPv4 address."
    ],
    objective: "Perform character substitution on IP periods.",
    conceptualExplanation: [
      "Split IP address on '.' and join with '[.]', or replace all '.' with '[.]'."
    ],
    hints: [
      "Replace all occurrences of '.' with '[.]'."
    ],
    rawInputs: [
      "1.1.1.1",
      "255.100.50.0",
      "192.168.1.1",
      "127.0.0.1",
      "10.0.0.1",
      "8.8.8.8",
      "8.8.4.4",
      "172.16.254.1",
      "0.0.0.0",
      "224.0.0.1"
    ],
    solve: (input) => {
      const s = input.trim();
      return s.split('.').join('[.]');
    }
  },

  // 8. Merge Strings Alternately
  {
    id: "ch_merge_strings_alternately",
    title: "Merge Strings Alternately",
    difficulty: "Easy",
    category: "Strings",
    description: "You are given two strings word1 and word2. Merge the strings by adding letters in alternating order, starting with word1. If a string is longer than the other, append the additional letters onto the end of the merged string.\n\nReturn the merged string.",
    inputFormat: "Line 1: word1 word2 (two space-separated words).",
    outputFormat: "The merged alternating string.",
    constraints: [
      "1 <= word1.length, word2.length <= 100",
      "word1 and word2 consist of lowercase English letters."
    ],
    objective: "Interleave characters from two strings with two pointers.",
    conceptualExplanation: [
      "Use two pointers i and j initialized to 0.",
      "Alternately append word1[i++] and word2[j++] while characters remain.",
      "Append remainder of longer string."
    ],
    hints: [
      "Loop up to Math.max(word1.length, word2.length)."
    ],
    rawInputs: [
      "abc pqr",
      "ab pqrs",
      "abcd pq",
      "a b",
      "hello world",
      "x yz",
      "xy z",
      "short verylongword",
      "coding challenge",
      "alpha beta"
    ],
    solve: (input) => {
      const [w1, w2] = input.trim().split(/\s+/);
      let res = '';
      const maxLen = Math.max(w1.length, w2.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < w1.length) res += w1[i];
        if (i < w2.length) res += w2[i];
      }
      return res;
    }
  },

  // 9. Greatest Common Divisor of Strings
  {
    id: "ch_greatest_common_divisor_strings",
    title: "Greatest Common Divisor of Strings",
    difficulty: "Easy",
    category: "Strings",
    description: "For two strings s and t, we say \"t divides s\" if and only if s = t + t + ... + t (i.e., t is concatenated with itself one or more times).\n\nGiven two strings str1 and str2, return the largest string x such that x divides both str1 and str2. If no such string exists, return \"EMPTY\".",
    inputFormat: "Line 1: str1\nLine 2: str2",
    outputFormat: "The GCD string or EMPTY.",
    constraints: [
      "1 <= str1.length, str2.length <= 1000",
      "str1 and str2 consist of English uppercase letters."
    ],
    objective: "Find largest common prefix repeating unit using Euclidean GCD algorithm.",
    conceptualExplanation: [
      "If str1 + str2 !== str2 + str1, no common divisor string exists (return EMPTY).",
      "Otherwise, the length of the GCD string is gcd(len1, len2).",
      "Return str1.substring(0, gcd(len1, len2))."
    ],
    hints: [
      "Check if str1 + str2 == str2 + str1.",
      "The length of the answer is GCD of lengths."
    ],
    rawInputs: [
      "ABCABC\nABC",
      "ABABAB\nABAB",
      "LEET\nCODE",
      "A\nA",
      "AA\nAAA",
      "ABCDEF\nABC",
      "ABAB\nAB",
      "AAAA\nAA",
      "XYZXYZXYZ\nXYZ",
      "HELLO\nWORLD"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const s1 = lines[0].trim();
      const s2 = lines[1].trim();
      if (s1 + s2 !== s2 + s1) return "EMPTY";
      function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
      }
      const g = gcd(s1.length, s2.length);
      return s1.substring(0, g);
    }
  },

  // 10. Kids With the Greatest Number of Candies
  {
    id: "ch_kids_greatest_candies",
    title: "Kids With the Greatest Number of Candies",
    difficulty: "Easy",
    category: "Arrays",
    description: "There are n kids with candies. You are given an integer array candies, where each candies[i] represents the number of candies the ith kid has, and an integer extraCandies, denoting the number of extra candies that you have.\n\nReturn a boolean array result separated by spaces, where result[i] is true if, after giving the ith kid all the extraCandies, they will have the greatest number of candies among all the kids, or false otherwise.",
    inputFormat: "Line 1: Two integers n and extraCandies.\nLine 2: n space-separated integers representing candies.",
    outputFormat: "Space-separated boolean values (true or false).",
    constraints: [
      "2 <= n <= 100",
      "1 <= candies[i] <= 100",
      "1 <= extraCandies <= 50"
    ],
    objective: "Compare each kid's augmented candy count against global maximum.",
    conceptualExplanation: [
      "Find maximum candies currently held by any kid.",
      "For each kid i, check if candies[i] + extraCandies >= maxCandies.",
      "Output true or false."
    ],
    hints: [
      "Find max element first.",
      "Compare (candies[i] + extraCandies) >= max."
    ],
    rawInputs: [
      "5 3\n2 3 5 1 3",
      "5 1\n4 2 1 1 2",
      "3 10\n12 1 12",
      "2 1\n1 2",
      "4 5\n5 5 5 5",
      "4 2\n1 3 5 7",
      "3 5\n10 2 8",
      "5 2\n2 8 4 1 9",
      "3 3\n3 3 1",
      "6 4\n1 4 2 6 3 5"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [n, extra] = lines[0].trim().split(/\s+/).map(Number);
      const candies = lines[1].trim().split(/\s+/).map(Number);
      const maxC = Math.max(...candies);
      return candies.map(c => (c + extra >= maxC ? "true" : "false")).join(' ');
    }
  },

  // 11. Valid Perfect Square
  {
    id: "ch_valid_perfect_square",
    title: "Valid Perfect Square (Binary Search)",
    difficulty: "Easy",
    category: "Binary Search",
    description: "Given a positive integer num, return true if num is a perfect square or false otherwise.\nA perfect square is an integer that is the square of an integer. In other words, it is the product of some integer with itself.\nYou must not use any built-in library function, such as sqrt.",
    inputFormat: "A single positive integer num.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= num <= 2^31 - 1"
    ],
    objective: "Determine if integer is a perfect square using integer binary search.",
    conceptualExplanation: [
      "Binary search range [1, num].",
      "Compute mid = Math.floor((low + high) / 2).",
      "Check mid * mid against num (using BigInt to avoid overflow).",
      "If mid * mid == num return true; else adjust search interval."
    ],
    hints: [
      "Use BigInt for mid * mid to prevent 32-bit overflow."
    ],
    rawInputs: [
      "16", "14", "1", "4", "9", "25", "100", "2147395600", "2147483647", "100000000"
    ],
    solve: (input) => {
      const num = BigInt(input.trim());
      if (num === 1n) return "true";
      let low = 1n, high = num;
      while (low <= high) {
        const mid = (low + high) / 2n;
        const sq = mid * mid;
        if (sq === num) return "true";
        if (sq < num) low = mid + 1n;
        else high = mid - 1n;
      }
      return "false";
    }
  },

  // 12. Arranging Coins
  {
    id: "ch_arranging_coins",
    title: "Arranging Coins Staircase Rows",
    difficulty: "Easy",
    category: "Binary Search",
    description: "You have n coins and you want to build a staircase with these coins. The staircase consists of k rows where the ith row has exactly i coins. The last row of the staircase may be incomplete.\n\nGiven the integer n, return the number of complete rows of the staircase you will build.",
    inputFormat: "A single integer n.",
    outputFormat: "A single integer denoting the number of complete rows.",
    constraints: [
      "1 <= n <= 2^31 - 1"
    ],
    objective: "Solve k*(k+1)/2 <= n for maximal integer k using binary search or quadratic formula.",
    conceptualExplanation: [
      "Sum of coins for k complete rows is k * (k + 1) / 2.",
      "Binary search k in range [1, n].",
      "Return maximal k such that k * (k + 1) / 2 <= n."
    ],
    hints: [
      "Binary search between 1 and n.",
      "Check (mid * (mid + 1)) / 2 <= n."
    ],
    rawInputs: [
      "5", "8", "1", "3", "6", "10", "15", "2147483647", "100", "1000"
    ],
    solve: (input) => {
      const n = BigInt(input.trim());
      let low = 1n, high = n, ans = 0n;
      while (low <= high) {
        const mid = (low + high) / 2n;
        const coins = (mid * (mid + 1n)) / 2n;
        if (coins <= n) {
          ans = mid;
          low = mid + 1n;
        } else {
          high = mid - 1n;
        }
      }
      return ans.toString();
    }
  },

  // 13. Cousins in Binary Tree
  {
    id: "ch_cousins_in_binary_tree",
    title: "Cousins in Binary Tree Verification",
    difficulty: "Easy",
    category: "Trees",
    description: "Given the root of a binary tree with unique values and the values of two different nodes of the tree x and y, return true if the nodes corresponding to the values x and y in the tree are cousins, or false otherwise.\n\nTwo nodes of a binary tree are cousins if they have the same depth with different parents.",
    inputFormat: "Line 1: Two space-separated integers x and y.\nLine 2: An integer n.\nLine 3: n space-separated tokens of binary tree level-order traversal.",
    outputFormat: "true or false.",
    constraints: [
      "2 <= n <= 100",
      "All node values are unique."
    ],
    objective: "Verify identical tree depth with distinct parent nodes.",
    conceptualExplanation: [
      "Run BFS tracking depth and parent value for each node.",
      "When nodes x and y are found, verify that depth(x) == depth(y) and parent(x) != parent(y)."
    ],
    hints: [
      "Record (depth, parent) for both target nodes.",
      "Return depth[x] == depth[y] && parent[x] != parent[y]."
    ],
    rawInputs: [
      "4 3\n4\n1 2 3 4",
      "5 4\n5\n1 2 3 null 4 null 5",
      "2 3\n3\n1 2 3",
      "4 5\n5\n1 2 3 4 5",
      "6 7\n7\n1 2 3 4 5 6 7",
      "4 6\n7\n1 2 3 4 5 6 7",
      "2 4\n4\n1 2 3 4",
      "5 6\n6\n1 2 3 4 5 6",
      "2 1\n2\n1 2",
      "7 8\n8\n1 2 3 4 5 6 7 8"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [x, y] = lines[0].trim().split(/\s+/).map(Number);
      const n = parseInt(lines[1].trim(), 10);
      const tokens = lines[2].trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0 || tokens[0] === 'null') return "false";

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

      let infoX = null, infoY = null;
      const bfs = [{ node: root, parent: null, depth: 0 }];
      while (bfs.length > 0) {
        const { node, parent, depth } = bfs.shift();
        if (node.val === x) infoX = { parent, depth };
        if (node.val === y) infoY = { parent, depth };
        if (node.left) bfs.push({ node: node.left, parent: node.val, depth: depth + 1 });
        if (node.right) bfs.push({ node: node.right, parent: node.val, depth: depth + 1 });
      }
      if (!infoX || !infoY) return "false";
      return (infoX.depth === infoY.depth && infoX.parent !== infoY.parent) ? "true" : "false";
    }
  },

  // 14. Univalued Binary Tree
  {
    id: "ch_univalued_binary_tree",
    title: "Univalued Binary Tree Check",
    difficulty: "Easy",
    category: "Trees",
    description: "A binary tree is uni-valued if every node in the tree has the same value.\n\nGiven the root of a binary tree, return true if the given tree is uni-valued, or false otherwise.",
    inputFormat: "Line 1: An integer n.\nLine 2: n space-separated tokens of binary tree level-order traversal.",
    outputFormat: "true or false.",
    constraints: [
      "1 <= n <= 100",
      "0 <= Node.val <= 99"
    ],
    objective: "DFS or BFS traversal to verify all node values match root.",
    conceptualExplanation: [
      "Extract root value.",
      "Traverse all non-null nodes in tree.",
      "If any node's value != root value, return false; otherwise true."
    ],
    hints: [
      "Compare every non-null token with tokens[0]."
    ],
    rawInputs: [
      "6\n1 1 1 1 1 null 1",
      "5\n2 2 2 5 2",
      "1\n5",
      "3\n1 1 1",
      "3\n1 2 1",
      "7\n9 9 9 9 9 9 9",
      "4\n3 3 3 4",
      "2\n7 7",
      "5\n4 4 4 4 1",
      "6\n0 0 0 0 0 0"
    ],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const tokens = lines[1].trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0 || tokens[0] === 'null') return "true";
      const rootVal = tokens[0];
      for (const t of tokens) {
        if (t !== 'null' && t !== rootVal) return "false";
      }
      return "true";
    }
  }
];

module.exports = { extra14 };
