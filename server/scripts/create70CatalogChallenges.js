/**
 * Dedicated Generator for 70 Brand New Unique Algorithmic Challenges for Mastery Zone
 * Total Challenges: 65 existing + 70 new = 135 challenges
 * Each challenge has exactly 10 real test cases (3 visible, 7 hidden).
 */

const fs = require('fs');
const path = require('path');
const existingCatalog = require('../data/challengesCatalog');

console.log(`Loaded ${existingCatalog.length} existing challenges.`);

// Definition list for 70 new challenges
const challenges = [
  // ==========================================
  // BIT MANIPULATION (1 - 7)
  // ==========================================
  {
    id: "ch_single_num",
    title: "Single Number",
    difficulty: "Easy",
    category: "Bit Manipulation",
    description: "Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with a linear runtime complexity and use only constant extra space.",
    constraints: ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4", "Each element appears twice except one."],
    inputFormat: "Line 1: A space-separated list of integers",
    outputFormat: "A single integer representing the unique element",
    hints: ["If we take XOR of zero and some bit, it will return that bit: a ^ 0 = a", "If we take XOR of two same bits, it will return 0: a ^ a = 0", "XOR all elements together; duplicate numbers cancel out."],
    objective: "Find the single element in an array where every other element appears twice.",
    conceptualExplanation: ["Initialize result = 0.", "XOR each number in the array into result.", "Duplicates cancel to 0, leaving only the unique number."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      return String(nums.reduce((acc, x) => acc ^ x, 0));
    },
    rawInputs: [
      "2 2 1",
      "4 1 2 1 2",
      "1",
      "7 3 5 3 7",
      "99 45 45 10 10",
      "-1 -1 -2",
      "100 200 300 200 100",
      "0 5 0",
      "8 9 10 11 8 9 10",
      "-42 15 15 -42 77"
    ]
  },
  {
    id: "ch_counting_bits",
    title: "Counting Bits",
    difficulty: "Easy",
    category: "Bit Manipulation",
    description: "Given an integer `n`, return an array `ans` of length `n + 1` such that for each `i` (`0 <= i <= n`), `ans[i]` is the number of 1's in the binary representation of `i`.",
    constraints: ["0 <= n <= 10^5"],
    inputFormat: "Line 1: An integer n",
    outputFormat: "Space-separated integers representing the count of 1s from 0 to n",
    hints: ["Notice relation between i and i / 2: ans[i] = ans[i >> 1] + (i & 1)", "Use dynamic programming using already computed values.", "O(n) time and O(n) space."],
    objective: "Compute the number of set bits for all numbers from 0 up to n.",
    conceptualExplanation: ["ans[0] = 0.", "For i from 1 to n: ans[i] = ans[i >> 1] + (i & 1).", "Print ans joined by spaces."],
    solve: (input) => {
      const n = parseInt(input.trim(), 10);
      const dp = new Array(n + 1).fill(0);
      for (let i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
      return dp.join(' ');
    },
    rawInputs: ["2", "5", "0", "1", "7", "10", "15", "16", "20", "31"]
  },
  {
    id: "ch_hamming_dist",
    title: "Hamming Distance",
    difficulty: "Easy",
    category: "Bit Manipulation",
    description: "The Hamming distance between two integers is the number of positions at which the corresponding bits are different.\n\nGiven two integers `x` and `y`, return the Hamming distance between them.",
    constraints: ["0 <= x, y <= 2^31 - 1"],
    inputFormat: "Line 1: Two space-separated integers x and y",
    outputFormat: "A single integer representing the Hamming distance",
    hints: ["Compute x ^ y to get 1 at positions where bits differ.", "Count the number of 1 bits in the XOR result (Brian Kernighan's algorithm or shift).", "n & (n - 1) clears the lowest set bit."],
    objective: "Count the number of differing bit positions between two integers.",
    conceptualExplanation: ["Compute xor = x ^ y.", "Count set bits using Brian Kernighan: while xor > 0: xor &= (xor - 1); count++.", "Output count."],
    solve: (input) => {
      const [x, y] = input.trim().split(/\s+/).map(Number);
      let xor = (x ^ y) >>> 0;
      let count = 0;
      while (xor > 0) { count += xor & 1; xor = xor >>> 1; }
      return String(count);
    },
    rawInputs: [
      "1 4", "3 1", "0 0", "1 1", "93 73",
      "100 200", "2147483647 0", "15 0", "255 128", "1024 1"
    ]
  },
  {
    id: "ch_reverse_bits",
    title: "Reverse Bits",
    difficulty: "Easy",
    category: "Bit Manipulation",
    description: "Reverse bits of a given 32-bit unsigned integer.",
    constraints: ["0 <= n <= 4294967295"],
    inputFormat: "Line 1: A 32-bit unsigned integer in decimal",
    outputFormat: "The resulting reversed integer in decimal",
    hints: ["Iterate 32 times.", "Shift the result left by 1 and add the least significant bit of n.", "Shift n right by 1 using unsigned shift (>>> 1)."],
    objective: "Reverse the 32 bits of an unsigned integer and return the decimal representation.",
    conceptualExplanation: ["Initialize rev = 0.", "Loop 32 times: rev = (rev << 1) | (n & 1); n = n >>> 1.", "Return rev >>> 0."],
    solve: (input) => {
      let n = Number(BigInt(input.trim()) & BigInt(0xFFFFFFFF));
      let rev = 0;
      for (let i = 0; i < 32; i++) {
        rev = ((rev << 1) | (n & 1)) >>> 0;
        n = n >>> 1;
      }
      return String(rev >>> 0);
    },
    rawInputs: ["43261596", "4294967293", "1", "2147483648", "0", "15", "1073741824", "3", "255", "16777216"]
  },
  {
    id: "ch_power_of_four",
    title: "Power of Four Verification",
    difficulty: "Easy",
    category: "Bit Manipulation",
    description: "Given an integer `n`, return `true` if it is a power of four. Otherwise, return `false`.\n\nAn integer `n` is a power of four if there exists an integer `x` such that `n == 4^x`.",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    inputFormat: "Line 1: An integer n",
    outputFormat: "true or false",
    hints: ["Must be positive.", "Must be a power of two: (n & (n - 1)) == 0.", "The single 1 bit must be at an odd position: (n & 0x55555555) != 0."],
    objective: "Determine if an integer is a positive power of four.",
    conceptualExplanation: ["Check n > 0.", "Check (n & (n - 1)) === 0 (power of 2).", "Check (n & 0x55555555) !== 0 to verify power of 4."],
    solve: (input) => {
      const n = parseInt(input.trim(), 10);
      const isPowerOf4 = n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0;
      return String(isPowerOf4);
    },
    rawInputs: ["16", "5", "1", "0", "-64", "64", "256", "8", "1024", "2"]
  },
  {
    id: "ch_bitwise_and_range",
    title: "Bitwise AND of Numbers Range",
    difficulty: "Medium",
    category: "Bit Manipulation",
    description: "Given two integers `left` and `right` that represent the range `[left, right]`, return the bitwise AND of all numbers in this range, inclusive.",
    constraints: ["0 <= left <= right <= 2^31 - 1"],
    inputFormat: "Line 1: Two space-separated integers left and right",
    outputFormat: "A single integer representing bitwise AND of range",
    hints: ["The bitwise AND of range [left, right] keeps only common prefix of binary representations of left and right.", "Shift both right until they are equal, counting shifts.", "Shift back left by shift count."],
    objective: "Find the common binary prefix between left and right bounds.",
    conceptualExplanation: ["Count shifts while left < right: left >>= 1, right >>= 1, shift++.", "Result = left << shift."],
    solve: (input) => {
      let [left, right] = input.trim().split(/\s+/).map(Number);
      let shift = 0;
      while (left < right) {
        left >>= 1;
        right >>= 1;
        shift++;
      }
      return String(left << shift);
    },
    rawInputs: ["5 7", "0 0", "1 2147483647", "6 7", "9 12", "16 31", "10 15", "0 1", "12 12", "26 30"]
  },
  {
    id: "ch_sum_two_integers",
    title: "Sum of Two Integers Without Plus Minus",
    difficulty: "Medium",
    category: "Bit Manipulation",
    description: "Given two integers `a` and `b`, return the sum of the two integers without using the operators `+` and `-`.",
    constraints: ["-1000 <= a, b <= 1000"],
    inputFormat: "Line 1: Two space-separated integers a and b",
    outputFormat: "The sum as an integer",
    hints: ["XOR (a ^ b) performs addition without carry.", "AND ((a & b) << 1) finds carry.", "Repeat until carry is zero."],
    objective: "Add two integers using half-adder bitwise simulation.",
    conceptualExplanation: ["While b !== 0: carry = (a & b) << 1; a = a ^ b; b = carry.", "Return a."],
    solve: (input) => {
      let [a, b] = input.trim().split(/\s+/).map(Number);
      while (b !== 0) {
        const carry = (a & b) << 1;
        a = a ^ b;
        b = carry;
      }
      return String(a);
    },
    rawInputs: ["1 2", "2 3", "-1 1", "-5 -7", "10 -3", "0 0", "100 250", "-50 20", "42 -42", "-15 -15"]
  },

  // ==========================================
  // TWO POINTERS (8 - 14)
  // ==========================================
  {
    id: "ch_valid_pal_ii",
    title: "Valid Palindrome II",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given a string `s`, return `true` if the `s` can be palindrome after deleting at most one character from it.",
    constraints: ["1 <= s.length <= 10^5", "s consists of lowercase English letters."],
    inputFormat: "Line 1: A string s",
    outputFormat: "true or false",
    hints: ["Use standard two pointers left and right.", "When s[left] !== s[right], check if s[left+1..right] is palindrome or s[left..right-1] is palindrome.", "If either is palindrome, return true."],
    objective: "Determine if a string can become a palindrome by removing at most one character.",
    conceptualExplanation: ["Pointers at start and end.", "When mismatch occurs at (i, j), check if substring(i+1, j) or substring(i, j-1) is palindrome.", "If match throughout, return true."],
    solve: (input) => {
      const s = input.trim();
      const isPal = (str, l, r) => {
        while (l < r) {
          if (str[l] !== str[r]) return false;
          l++; r--;
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
    rawInputs: ["aba", "abca", "abc", "raceacar", "deeee", "tebbem", "acxcyba", "a", "ab", "aguokepatgbnvfqmgmlcupuufxoohdfpgjdmysgvhmvffcnqxjjxqncffvmhvgsymdjgpfdhooxfuupuculmgmqfvnbgtapekouga"]
  },
  {
    id: "ch_two_sum_sorted",
    title: "Two Sum II Sorted Array",
    difficulty: "Medium",
    category: "Two Pointers",
    description: "Given a 1-indexed array of integers `numbers` that is already sorted in non-decreasing order, find two numbers such that they add up to a specific `target` number.\n\nReturn the indices of the two numbers, `index1` and `index2`, added by one as an integer array `[index1, index2]` of length 2.",
    constraints: ["2 <= numbers.length <= 3 * 10^4", "-1000 <= numbers[i] <= 1000", "Exactly one solution exists."],
    inputFormat: "Line 1: The integer target\nLine 2: Space-separated sorted integers",
    outputFormat: "Two space-separated 1-based indices",
    hints: ["Since array is sorted, start two pointers at beginning and end.", "If sum == target, found.", "If sum < target, left++; if sum > target, right--."],
    objective: "Find two 1-based indices whose elements sum to target in a sorted array.",
    conceptualExplanation: ["Left at 0, right at n - 1.", "Compute sum = nums[left] + nums[right].", "Adjust pointers according to comparison with target."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const target = parseInt(lines[0].trim(), 10);
      const nums = lines[1].trim().split(/\s+/).map(Number);
      let l = 0, r = nums.length - 1;
      while (l < r) {
        const sum = nums[l] + nums[r];
        if (sum === target) return `${l + 1} ${r + 1}`;
        if (sum < target) l++;
        else r--;
      }
      return "-1 -1";
    },
    rawInputs: [
      "9\n2 7 11 15",
      "6\n2 3 4",
      "-1\n-1 0",
      "10\n1 2 3 4 4 9 56 90",
      "0\n-3 3",
      "100\n5 25 75",
      "8\n1 2 3 4 5 6 7",
      "-10\n-15 -10 -5 -2 0 5",
      "14\n1 3 5 7 9 11",
      "50\n10 20 30 40 50"
    ]
  },
  {
    id: "ch_reverse_vowels",
    title: "Reverse Vowels of a String",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given a string `s`, reverse only all the vowels in the string and return it.\n\nThe vowels are 'a', 'e', 'i', 'o', and 'u', and they can appear in both lower and upper cases, more than once.",
    constraints: ["1 <= s.length <= 3 * 10^5", "s consist of printable ASCII characters."],
    inputFormat: "Line 1: A string s",
    outputFormat: "The string with vowels reversed",
    hints: ["Use two pointers at start and end.", "Advance left until vowel, decrease right until vowel.", "Swap vowels and move inward."],
    objective: "Reverse the positions of all vowels in a string while preserving other characters.",
    conceptualExplanation: ["Set of vowels = {a, e, i, o, u, A, E, I, O, U}.", "Scan inward with two pointers until both find vowels, swap them, repeat."],
    solve: (input) => {
      const chars = input.trim().split('');
      const vowels = new Set(['a','e','i','o','u','A','E','I','O','U']);
      let l = 0, r = chars.length - 1;
      while (l < r) {
        while (l < r && !vowels.has(chars[l])) l++;
        while (l < r && !vowels.has(chars[r])) r--;
        if (l < r) {
          const tmp = chars[l];
          chars[l] = chars[r];
          chars[r] = tmp;
          l++; r--;
        }
      }
      return chars.join('');
    },
    rawInputs: [
      "IceCreAm", "leetcode", "hello", "aA", "rhythm",
      "DesignPattern", "MasteryZone", "Algorithm", "AEIOU", "programming"
    ]
  },
  {
    id: "ch_remove_duplicates_sorted",
    title: "Remove Duplicates from Sorted Array",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given an integer array `nums` sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once.\n\nReturn the number of unique elements `k`.",
    constraints: ["1 <= nums.length <= 3 * 10^4", "-100 <= nums[i] <= 100", "nums is sorted."],
    inputFormat: "Line 1: Space-separated sorted integers",
    outputFormat: "An integer representing the count of unique elements",
    hints: ["Use slow pointer write_idx.", "When nums[fast] !== nums[write_idx], advance write_idx and copy nums[fast].", "Return write_idx + 1."],
    objective: "Calculate the number of unique elements in a non-decreasing sorted array.",
    conceptualExplanation: ["Slow pointer tracks unique elements.", "Fast pointer scans through array.", "Return count of unique items."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      if (nums.length === 0) return "0";
      let k = 1;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] !== nums[i - 1]) k++;
      }
      return String(k);
    },
    rawInputs: [
      "1 1 2",
      "0 0 1 1 1 2 2 3 3 4",
      "1",
      "1 2 3 4 5",
      "5 5 5 5 5",
      "-3 -3 -2 -1 -1 0 0",
      "10 20 20 30 30 40 50",
      "0 0 0",
      "-10 -10 -9 -8 -8 -7",
      "1 1 1 2 2 2 3 3 3"
    ]
  },
  {
    id: "ch_is_subsequence",
    title: "Is Subsequence",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given two strings `s` and `t`, return `true` if `s` is a subsequence of `t`, or `false` otherwise.\n\nA subsequence of a string is a new string that is formed from the original string by deleting some (can be none) of the characters without disturbing the relative positions of the remaining characters.",
    constraints: ["0 <= s.length <= 100", "0 <= t.length <= 10^4", "s and t consist only of lowercase English letters."],
    inputFormat: "Line 1: String s\nLine 2: String t",
    outputFormat: "true or false",
    hints: ["Use two pointers, one for s and one for t.", "Whenever s[i] == t[j], advance i.", "Advance j at every step. If i == s.length, return true."],
    objective: "Determine if string s is a subsequence of string t.",
    conceptualExplanation: ["Track index i in s and j in t.", "Iterate j across t. If s[i] matches t[j], increment i.", "If i reaches s.length, return true."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const s = lines[0] ? lines[0].trim() : '';
      const t = lines[1] ? lines[1].trim() : '';
      let i = 0, j = 0;
      while (i < s.length && j < t.length) {
        if (s[i] === t[j]) i++;
        j++;
      }
      return String(i === s.length);
    },
    rawInputs: [
      "abc\nahbgdc",
      "axc\nahbgdc",
      "ace\nabcde",
      "met\nmastery",
      "code\nleetcode",
      "a\nb",
      "zone\nmasteryzone",
      "hello\nworld",
      "sub\nsubsequence",
      "algo\nalgorithm"
    ]
  },
  {
    id: "ch_backspace_compare",
    title: "Backspace String Compare",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given two strings `s` and `t`, return `true` if they are equal when both are typed into empty text editors. `'#'` means a backspace character.\n\nNote that after backspacing an empty text, the text will continue empty.",
    constraints: ["1 <= s.length, t.length <= 200", "s and t only contain lowercase letters and '#' characters."],
    inputFormat: "Line 1: String s\nLine 2: String t",
    outputFormat: "true or false",
    hints: ["Can simulate using a stack or iterate backwards with two pointers.", "Traversing backwards, count '#' to skip characters.", "Compare active characters."],
    objective: "Determine if two typed strings with backspace symbols produce identical output.",
    conceptualExplanation: ["Simulate typed string: append chars, pop on '#'.", "Compare results for s and t."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const s = lines[0].trim();
      const t = lines[1].trim();
      const build = (str) => {
        const stack = [];
        for (const ch of str) {
          if (ch === '#') { if (stack.length > 0) stack.pop(); }
          else stack.push(ch);
        }
        return stack.join('');
      };
      return String(build(s) === build(t));
    },
    rawInputs: [
      "ab#c\nad#c",
      "ab##\nc#d#",
      "a#c\nb",
      "a##c\n#a#c",
      "xywrrmp\nxywrrmu#p",
      "bxj##tw\nbxj###tw",
      "y#fo##f\ny#f#o##f",
      "abc###\n#",
      "apple\napple",
      "xyz##a\nxa"
    ]
  },
  {
    id: "ch_squares_sorted_array",
    title: "Squares of a Sorted Array",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given an integer array `nums` sorted in non-decreasing order, return an array of the squares of each number sorted in non-decreasing order.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4", "nums is sorted in non-decreasing order."],
    inputFormat: "Line 1: Space-separated integers",
    outputFormat: "Space-separated sorted squares",
    hints: ["Since negatives become positive when squared, largest squares are at ends of array.", "Use two pointers from left and right.", "Fill result array from back."],
    objective: "Square elements of a sorted array and return them in non-decreasing order in O(n).",
    conceptualExplanation: ["Two pointers l = 0, r = n - 1.", "Compare nums[l]^2 and nums[r]^2, place larger at end of result, advance corresponding pointer."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const res = new Array(nums.length);
      let l = 0, r = nums.length - 1, idx = nums.length - 1;
      while (l <= r) {
        const sqL = nums[l] * nums[l];
        const sqR = nums[r] * nums[r];
        if (sqL > sqR) {
          res[idx--] = sqL;
          l++;
        } else {
          res[idx--] = sqR;
          r--;
        }
      }
      return res.join(' ');
    },
    rawInputs: [
      "-4 -1 0 3 10",
      "-7 -3 2 3 11",
      "-5 -4 -3 -2 -1",
      "0 1 2 3 4",
      "-10 0 10",
      "5",
      "-3",
      "-2 -2 2 2",
      "-100 -50 0 50 100",
      "-6 -4 -2 0 1 3 5"
    ]
  },

  // ==========================================
  // SLIDING WINDOW (15 - 20)
  // ==========================================
  {
    id: "ch_min_size_subarray",
    title: "Minimum Size Subarray Sum",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given an array of positive integers `nums` and a positive integer `target`, return the minimal length of a subarray whose sum is greater than or equal to `target`. If there is no such subarray, return 0 instead.",
    constraints: ["1 <= target <= 10^9", "1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^4"],
    inputFormat: "Line 1: An integer target\nLine 2: Space-separated integers",
    outputFormat: "Minimal length as integer, or 0",
    hints: ["Use a sliding window with left and right pointers.", "Expand right and add to running sum.", "While sum >= target, update minLen and shrink from left."],
    objective: "Find the minimal length of contiguous subarray with sum at least target.",
    conceptualExplanation: ["Sliding window with left pointer and right pointer.", "Add nums[right] to sum. While sum >= target: minLen = min(minLen, right - left + 1); sum -= nums[left++];", "Return minLen or 0."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const target = parseInt(lines[0].trim(), 10);
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
      "100\n10 20 30 40 50",
      "5\n2 3 1 1 1 1 1",
      "20\n5 1 3 5 10 7 4 9 2 8",
      "1\n1",
      "80\n10 30 20 40 50",
      "3\n1 1"
    ]
  },
  {
    id: "ch_fruit_into_baskets",
    title: "Fruit Into Baskets",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "You are visiting a farm that has a single row of fruit trees arranged from left to right. You are given an integer array `fruits` where `fruits[i]` is the type of fruit the `i-th` tree produces.\n\nYou have two baskets, and each basket can only hold a single type of fruit. Return the maximum number of fruits you can pick.",
    constraints: ["1 <= fruits.length <= 10^5", "0 <= fruits[i] < fruits.length"],
    inputFormat: "Line 1: Space-separated integers representing fruit types",
    outputFormat: "Maximum number of fruits picked",
    hints: ["This problem is equivalent to finding the longest subarray with at most 2 distinct integers.", "Use sliding window and a frequency map.", "When distinct elements exceed 2, shrink window from left."],
    objective: "Find the longest contiguous subarray with at most 2 distinct integers.",
    conceptualExplanation: ["Map stores counts of fruit types in window.", "Expand right; if map.size > 2, decrease left count and delete if 0.", "maxFruit = max(maxFruit, right - left + 1)."],
    solve: (input) => {
      const fruits = input.trim().split(/\s+/).map(Number);
      const count = new Map();
      let l = 0, maxF = 0;
      for (let r = 0; r < fruits.length; r++) {
        count.set(fruits[r], (count.get(fruits[r]) || 0) + 1);
        while (count.size > 2) {
          count.set(fruits[l], count.get(fruits[l]) - 1);
          if (count.get(fruits[l]) === 0) count.delete(fruits[l]);
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
      "1 1 1 1 1",
      "1 2 1 3 4 3 5 1 2",
      "0 1 6 6 4 4 6",
      "4 1 1 1 3 1 7 5",
      "1 0 1 4 1 4 1 2 3"
    ]
  },
  {
    id: "ch_longest_ones_flip",
    title: "Max Consecutive Ones III",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given a binary array `nums` and an integer `k`, return the maximum number of consecutive `1`'s in the array if you can flip at most `k` `0`'s.",
    constraints: ["1 <= nums.length <= 10^5", "nums[i] is either 0 or 1.", "0 <= k <= nums.length"],
    inputFormat: "Line 1: An integer k\nLine 2: Space-separated binary digits (0 or 1)",
    outputFormat: "Maximum number of consecutive 1s",
    hints: ["Find longest subarray with at most k zeros.", "Expand right pointer and increment zeroCount when nums[right] == 0.", "While zeroCount > k, shrink from left."],
    objective: "Find the longest window containing at most k zeros.",
    conceptualExplanation: ["Maintain zeroCount in sliding window.", "Increment zeroCount when nums[r] == 0. While zeroCount > k, if nums[l] == 0 zeroCount--, l++.", "Result = max(r - l + 1)."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const k = parseInt(lines[0].trim(), 10);
      const nums = lines[1].trim().split(/\s+/).map(Number);
      let l = 0, zeros = 0, maxLen = 0;
      for (let r = 0; r < nums.length; r++) {
        if (nums[r] === 0) zeros++;
        while (zeros > k) {
          if (nums[l] === 0) zeros--;
          l++;
        }
        maxLen = Math.max(maxLen, r - l + 1);
      }
      return String(maxLen);
    },
    rawInputs: [
      "2\n1 1 1 0 0 0 1 1 1 1 0",
      "3\n0 0 1 1 0 0 1 1 1 0 1 1 0 0 0 1 1 1 1",
      "0\n1 1 1 0 1 1",
      "1\n0 0 0 0",
      "5\n1 1 1 1 1",
      "1\n1 0 1 0 1 0 1",
      "2\n1 0 0 0 1 1 0 0 1 1 1",
      "0\n0 0 0",
      "2\n0 0 1 1 1 1 1 1 0 0",
      "4\n1 0 1 0 1 0 1 0 1"
    ]
  },
  {
    id: "ch_sub_k_distinct",
    title: "Subarrays with At Most K Different Integers",
    difficulty: "Hard",
    category: "Sliding Window",
    description: "Given an integer array `nums` and an integer `k`, return the number of good subarrays of `nums` that contain at most `k` different integers.",
    constraints: ["1 <= nums.length <= 2 * 10^4", "1 <= nums[i], k <= nums.length"],
    inputFormat: "Line 1: An integer k\nLine 2: Space-separated integers",
    outputFormat: "Number of subarrays with at most k distinct integers",
    hints: ["For any window [l, r] with at most k distinct elements, all subarrays ending at r starting from l to r are valid.", "Count of valid subarrays ending at r is (r - l + 1).", "Sum this over all r."],
    objective: "Count contiguous subarrays with at most k distinct integers.",
    conceptualExplanation: ["Use frequency map for distinct count.", "Shrink window from left whenever map.size > k.", "Add (r - l + 1) to total count."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const k = parseInt(lines[0].trim(), 10);
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const atMost = (limit) => {
        const count = new Map();
        let l = 0, res = 0;
        for (let r = 0; r < nums.length; r++) {
          count.set(nums[r], (count.get(nums[r]) || 0) + 1);
          while (count.size > limit) {
            count.set(nums[l], count.get(nums[l]) - 1);
            if (count.get(nums[l]) === 0) count.delete(nums[l]);
            l++;
          }
          res += (r - l + 1);
        }
        return res;
      };
      return String(atMost(k));
    },
    rawInputs: [
      "2\n1 2 1 2 3",
      "3\n1 2 1 3 4",
      "1\n1 2 1 2 1",
      "2\n1 1 1 1",
      "1\n5",
      "2\n2 1 1 1 2",
      "3\n1 2 3 4 5",
      "2\n1 2 3 1 2 3",
      "4\n1 2 3 4 1 2",
      "1\n1 2 3 4"
    ]
  },
  {
    id: "ch_permutation_in_string",
    title: "Permutation in String",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given two strings `s1` and `s2`, return `true` if `s2` contains a permutation of `s1`, or `false` otherwise.\n\nIn other words, return true if one of `s1`'s permutations is the substring of `s2`.",
    constraints: ["1 <= s1.length, s2.length <= 10^4", "s1 and s2 consist of lowercase English letters."],
    inputFormat: "Line 1: String s1\nLine 2: String s2",
    outputFormat: "true or false",
    hints: ["The permutation of s1 must have the exact same length as s1.", "Maintain a sliding window of length s1.length in s2.", "Compare frequency counts of characters in s1 and window."],
    objective: "Check whether a substring of s2 is an anagram/permutation of s1.",
    conceptualExplanation: ["Compute char counts for s1 and initial window in s2.", "Slide window one char at a time across s2.", "Return true if frequencies match at any point."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const s1 = lines[0].trim();
      const s2 = lines[1].trim();
      if (s1.length > s2.length) return "false";
      const c1 = new Array(26).fill(0);
      const c2 = new Array(26).fill(0);
      for (let i = 0; i < s1.length; i++) {
        c1[s1.charCodeAt(i) - 97]++;
        c2[s2.charCodeAt(i) - 97]++;
      }
      const matches = () => {
        for (let i = 0; i < 26; i++) {
          if (c1[i] !== c2[i]) return false;
        }
        return true;
      };
      if (matches()) return "true";
      for (let i = s1.length; i < s2.length; i++) {
        c2[s2.charCodeAt(i) - 97]++;
        c2[s2.charCodeAt(i - s1.length) - 97]--;
        if (matches()) return "true";
      }
      return "false";
    },
    rawInputs: [
      "ab\neidbaooo",
      "ab\neidboaoo",
      "adc\ndcda",
      "hello\nooolleoooleh",
      "abc\nbbbca",
      "a\na",
      "xyz\nzyx",
      "zone\nmasteryzonepro",
      "cat\nblackcat",
      "dog\ngodfather"
    ]
  },
  {
    id: "ch_find_all_anagrams",
    title: "Find All Anagrams Count",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given two strings `s` and `p`, return the number of start indices of `p`'s anagrams in `s`.\n\nAn Anagram is a word formed by rearranging the letters of a different word.",
    constraints: ["1 <= s.length, p.length <= 3 * 10^4", "s and p consist of lowercase English letters."],
    inputFormat: "Line 1: String s\nLine 2: String p",
    outputFormat: "An integer count of anagram occurrences",
    hints: ["Fixed sliding window of size p.length.", "Compare frequency array of size 26.", "Count how many times window matches p's frequency."],
    objective: "Count occurrences of anagrams of string p within string s.",
    conceptualExplanation: ["Use fixed window of size p.length in s.", "Slide across s, updating 26-char counts.", "Increment counter on match."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const s = lines[0].trim();
      const p = lines[1].trim();
      if (p.length > s.length) return "0";
      const pCount = new Array(26).fill(0);
      const sCount = new Array(26).fill(0);
      for (let i = 0; i < p.length; i++) {
        pCount[p.charCodeAt(i) - 97]++;
        sCount[s.charCodeAt(i) - 97]++;
      }
      let count = 0;
      const match = () => {
        for (let i = 0; i < 26; i++) if (pCount[i] !== sCount[i]) return false;
        return true;
      };
      if (match()) count++;
      for (let i = p.length; i < s.length; i++) {
        sCount[s.charCodeAt(i) - 97]++;
        sCount[s.charCodeAt(i - p.length) - 97]--;
        if (match()) count++;
      }
      return String(count);
    },
    rawInputs: [
      "cbaebabacd\nabc",
      "abab\nab",
      "baa\naa",
      "af\nbe",
      "masteryzone\nzone",
      "aaaaa\na",
      "abcde\nxyz",
      "racecar\ncar",
      "banana\nan",
      "mississippi\nsi"
    ]
  },

  // ==========================================
  // INTERVALS (21 - 25)
  // ==========================================
  {
    id: "ch_insert_interval",
    title: "Insert Interval",
    difficulty: "Medium",
    category: "Intervals",
    description: "You are given an array of non-overlapping intervals `intervals` where `intervals[i] = [start_i, end_i]` represent the start and the end of the `i-th` interval and `intervals` is sorted in ascending order by `start_i`.\n\nYou are also given an interval `newInterval = [start, end]` that represents the start and end of another interval.\n\nInsert `newInterval` into `intervals` such that `intervals` is still sorted and non-overlapping. Return the count of intervals after merging.",
    constraints: ["0 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^5"],
    inputFormat: "Line 1: An integer N representing number of existing intervals\nFollowing N lines: start end\nLast line: newIntervalStart newIntervalEnd",
    outputFormat: "An integer representing the count of intervals after insertion and merging",
    hints: ["Add all intervals that end before newInterval begins.", "Merge all overlapping intervals by expanding newInterval: newStart = min(start, newStart), newEnd = max(end, newEnd).", "Add all remaining intervals."],
    objective: "Insert a new interval into sorted non-overlapping intervals and return resulting interval count.",
    conceptualExplanation: ["Collect intervals ending before newInterval.", "Expand newInterval with any overlapping intervals.", "Append remaining intervals."],
    solve: (input) => {
      const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const n = parseInt(lines[0], 10);
      const intervals = [];
      for (let i = 1; i <= n; i++) {
        intervals.push(lines[i].split(/\s+/).map(Number));
      }
      const newInt = lines[n + 1].split(/\s+/).map(Number);
      const res = [];
      let i = 0;
      while (i < n && intervals[i][1] < newInt[0]) {
        res.push(intervals[i]);
        i++;
      }
      while (i < n && intervals[i][0] <= newInt[1]) {
        newInt[0] = Math.min(newInt[0], intervals[i][0]);
        newInt[1] = Math.max(newInt[1], intervals[i][1]);
        i++;
      }
      res.push(newInt);
      while (i < n) {
        res.push(intervals[i]);
        i++;
      }
      return String(res.length);
    },
    rawInputs: [
      "2\n1 3\n6 9\n2 5",
      "5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8",
      "0\n5 7",
      "1\n1 5\n2 3",
      "1\n1 5\n6 8",
      "2\n1 5\n6 8\n0 9",
      "3\n1 4\n7 9\n11 15\n5 6",
      "3\n1 3\n5 7\n9 11\n0 12",
      "2\n3 5\n8 10\n1 2",
      "4\n1 2\n3 4\n5 6\n7 8\n2 5"
    ]
  },
  {
    id: "ch_min_meeting_rooms",
    title: "Meeting Rooms II Min Conference Rooms",
    difficulty: "Medium",
    category: "Intervals",
    description: "Given an array of meeting time intervals `intervals` where `intervals[i] = [start_i, end_i]`, return the minimum number of conference rooms required.",
    constraints: ["1 <= intervals.length <= 10^4", "0 <= start_i < end_i <= 10^6"],
    inputFormat: "Line 1: An integer N representing number of meetings\nFollowing N lines: start end",
    outputFormat: "Minimum number of conference rooms required",
    hints: ["Extract all start times and end times into separate arrays.", "Sort both arrays independently.", "Use two pointers: when start < end, room needed (+1); otherwise room freed (-1)."],
    objective: "Calculate peak concurrent overlapping intervals.",
    conceptualExplanation: ["Separate start times and end times, sort both.", "Iterate with two pointers tracking simultaneous meetings.", "Record peak count."],
    solve: (input) => {
      const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const n = parseInt(lines[0], 10);
      const starts = [], ends = [];
      for (let i = 1; i <= n; i++) {
        const [s, e] = lines[i].split(/\s+/).map(Number);
        starts.push(s);
        ends.push(e);
      }
      starts.sort((a, b) => a - b);
      ends.sort((a, b) => a - b);
      let rooms = 0, maxRooms = 0, sIdx = 0, eIdx = 0;
      while (sIdx < n) {
        if (starts[sIdx] < ends[eIdx]) {
          rooms++;
          maxRooms = Math.max(maxRooms, rooms);
          sIdx++;
        } else {
          rooms--;
          eIdx++;
        }
      }
      return String(maxRooms);
    },
    rawInputs: [
      "3\n0 30\n5 10\n15 20",
      "3\n7 10\n2 4\n15 20",
      "1\n1 5",
      "4\n1 4\n2 5\n3 6\n4 7",
      "2\n1 10\n2 9",
      "5\n1 3\n2 4\n3 5\n4 6\n5 7",
      "3\n1 5\n5 10\n10 15",
      "4\n1 2\n2 3\n3 4\n4 5",
      "3\n0 10\n0 10\n0 10",
      "4\n5 8\n6 8\n7 8\n8 9"
    ]
  },
  {
    id: "ch_meeting_rooms_can_attend",
    title: "Meeting Rooms Can Attend All",
    difficulty: "Easy",
    category: "Intervals",
    description: "Given an array of meeting time intervals consisting of start and end times `[[s1,e1],[s2,e2],...]`, determine if a person could attend all meetings.",
    constraints: ["0 <= intervals.length <= 10^4", "0 <= start_i < end_i <= 10^6"],
    inputFormat: "Line 1: An integer N\nFollowing N lines: start end",
    outputFormat: "true or false",
    hints: ["Sort intervals by start time.", "Check if any adjacent intervals overlap (intervals[i][0] < intervals[i-1][1]).", "If overlap exists, return false; otherwise true."],
    objective: "Determine whether any two meetings conflict.",
    conceptualExplanation: ["Sort meetings by start time.", "If any meeting starts before the previous one ends, return false.", "If no conflicts, return true."],
    solve: (input) => {
      const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const n = parseInt(lines[0], 10);
      if (n <= 1) return "true";
      const intervals = [];
      for (let i = 1; i <= n; i++) {
        intervals.push(lines[i].split(/\s+/).map(Number));
      }
      intervals.sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < n; i++) {
        if (intervals[i][0] < intervals[i - 1][1]) return "false";
      }
      return "true";
    },
    rawInputs: [
      "3\n0 30\n5 10\n15 20",
      "2\n7 10\n2 4",
      "1\n0 10",
      "0",
      "3\n1 3\n3 5\n5 8",
      "2\n1 5\n4 6",
      "4\n1 2\n2 3\n3 4\n4 5",
      "2\n5 10\n0 6",
      "3\n10 20\n0 5\n25 30",
      "2\n2 8\n1 3"
    ]
  },
  {
    id: "ch_interval_intersection",
    title: "Interval List Intersections Count",
    difficulty: "Medium",
    category: "Intervals",
    description: "You are given two lists of closed intervals, `firstList` and `secondList`, where `firstList[i] = [start_i, end_i]` and `secondList[j] = [start_j, end_j]`. Each list of intervals is pairwise disjoint and in sorted order.\n\nReturn the number of intersections of these two interval lists.",
    constraints: ["0 <= firstList.length, secondList.length <= 1000", "0 <= start_i <= end_i <= 10^9"],
    inputFormat: "Line 1: N1 (number of intervals in firstList)\nFollowing N1 lines: start end\nNext line: N2 (number of intervals in secondList)\nFollowing N2 lines: start end",
    outputFormat: "Number of intersection intervals",
    hints: ["Intersection between [a1, a2] and [b1, b2] exists if max(a1, b1) <= min(a2, b2).", "Advance the pointer of whichever interval ends first.", "Count all valid intersections."],
    objective: "Compute the number of overlapping intersections between two disjoint sorted interval lists.",
    conceptualExplanation: ["Use two pointers i and j.", "Start = max(A[i].start, B[j].start), End = min(A[i].end, B[j].end). If Start <= End, intersection found.", "Advance i if A[i].end < B[j].end else advance j."],
    solve: (input) => {
      const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
      let lineIdx = 0;
      const n1 = parseInt(lines[lineIdx++], 10);
      const l1 = [];
      for (let i = 0; i < n1; i++) l1.push(lines[lineIdx++].split(/\s+/).map(Number));
      const n2 = parseInt(lines[lineIdx++], 10);
      const l2 = [];
      for (let i = 0; i < n2; i++) l2.push(lines[lineIdx++].split(/\s+/).map(Number));
      let i = 0, j = 0, count = 0;
      while (i < n1 && j < n2) {
        const lo = Math.max(l1[i][0], l2[j][0]);
        const hi = Math.min(l1[i][1], l2[j][1]);
        if (lo <= hi) count++;
        if (l1[i][1] < l2[j][1]) i++;
        else j++;
      }
      return String(count);
    },
    rawInputs: [
      "4\n0 2\n5 10\n13 23\n24 25\n4\n1 5\n8 12\n15 24\n25 26",
      "2\n1 3\n5 9\n0",
      "1\n1 7\n1\n3 10",
      "2\n1 5\n10 15\n2\n2 3\n4 12",
      "0\n0",
      "1\n1 10\n1\n2 8",
      "3\n1 3\n5 7\n9 11\n3\n2 4\n6 8\n10 12",
      "1\n5 5\n1\n5 5",
      "2\n1 2\n3 4\n2\n5 6\n7 8",
      "2\n1 4\n6 9\n2\n2 5\n7 10"
    ]
  },
  {
    id: "ch_teemo_attacking",
    title: "Teemo Attacking Poison Duration",
    difficulty: "Easy",
    category: "Intervals",
    description: "Our hero Teemo is attacking an enemy Ashe with poison attacks! When Teemo attacks Ashe, Ashe gets poisoned for exactly `duration` seconds.\n\nGiven a non-decreasing integer array `timeSeries` and an integer `duration`, return the total number of seconds that Ashe is poisoned.",
    constraints: ["1 <= timeSeries.length <= 10^4", "0 <= timeSeries[i], duration <= 10^7"],
    inputFormat: "Line 1: An integer duration\nLine 2: Space-separated integers timeSeries",
    outputFormat: "Total poison duration as an integer",
    hints: ["For each attack i, poison lasts min(duration, timeSeries[i+1] - timeSeries[i]).", "The last attack always contributes full duration.", "Sum contributions."],
    objective: "Calculate total merged duration of overlapping time intervals of fixed length.",
    conceptualExplanation: ["Loop through timeSeries from 0 to n - 2.", "Add min(duration, timeSeries[i+1] - timeSeries[i]).", "Add duration for final attack."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const duration = parseInt(lines[0].trim(), 10);
      const ts = lines[1].trim().split(/\s+/).map(Number);
      if (ts.length === 0 || duration === 0) return "0";
      let total = 0;
      for (let i = 0; i < ts.length - 1; i++) {
        total += Math.min(duration, ts[i + 1] - ts[i]);
      }
      total += duration;
      return String(total);
    },
    rawInputs: [
      "2\n1 4",
      "2\n1 2",
      "5\n1 2 3 4 5",
      "10\n0",
      "3\n1 5 10 15",
      "4\n1 3 5 7 9",
      "1\n1 2 3 4 5",
      "100\n10 50 200",
      "0\n1 2 3",
      "5\n2 4 6 8 10 12"
    ]
  },

  // ==========================================
  // STACKS (26 - 31)
  // ==========================================
  {
    id: "ch_baseball_game",
    title: "Baseball Game Score Tracker",
    difficulty: "Easy",
    category: "Stacks",
    description: "You are keeping score for a baseball game with strange rules. At the beginning of the game, you start with an empty record.\n\nYou are given a list of strings `operations`, where `operations[i]` is the `i-th` operation you must apply to the record:\n- An integer `x`: Record a new score of `x`.\n- `'+'`: Record a new score that is the sum of the previous two scores.\n- `'D'`: Record a new score that is double the previous score.\n- `'C'`: Invalidate the previous score, removing it from the record.\n\nReturn the sum of all the scores on the record.",
    constraints: ["1 <= operations.length <= 1000", "Valid operations guaranteed."],
    inputFormat: "Line 1: Space-separated operation tokens",
    outputFormat: "Total score sum as an integer",
    hints: ["Use a stack to keep track of scores.", "On '+', peek top two elements, sum them and push.", "On 'D', double top element and push. On 'C', pop top.", "Return sum of stack."],
    objective: "Simulate stack-based scoring rules and sum total points.",
    conceptualExplanation: ["Stack holds active scores.", "Handle each token (+, D, C, integer).", "Sum all elements in stack at the end."],
    solve: (input) => {
      const ops = input.trim().split(/\s+/);
      const stack = [];
      for (const op of ops) {
        if (op === '+') {
          stack.push(stack[stack.length - 1] + stack[stack.length - 2]);
        } else if (op === 'D') {
          stack.push(stack[stack.length - 1] * 2);
        } else if (op === 'C') {
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
      "100",
      "1 2 + + +",
      "-5 D C 10 +",
      "3 D D",
      "8 C 9 D +",
      "4 5 + D C"
    ]
  },
  {
    id: "ch_remove_adjacent_duplicates",
    title: "Remove All Adjacent Duplicates in String",
    difficulty: "Easy",
    category: "Stacks",
    description: "You are given a string `s` consisting of lowercase English letters. A duplicate removal consists of choosing two adjacent and equal letters and removing them.\n\nWe repeatedly make duplicate removals on `s` until we no longer can. Return the final string. If empty, return \"EMPTY\".",
    constraints: ["1 <= s.length <= 10^5", "s consists of lowercase English letters."],
    inputFormat: "Line 1: A string s",
    outputFormat: "The resulting string, or EMPTY",
    hints: ["Iterate through string using a stack.", "If current char equals stack.top, pop stack.", "Else push current char."],
    objective: "Eliminate duplicate adjacent pairs iteratively using a stack.",
    conceptualExplanation: ["Stack stores characters.", "For each char: if stack.top === char, pop; else push.", "Return stack string or 'EMPTY' if stack is empty."],
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
      return stack.length > 0 ? stack.join('') : "EMPTY";
    },
    rawInputs: [
      "abbaca", "azxxzy", "a", "aa", "aaaa",
      "mississippi", "masteryzone", "abccba", "aabbcc", "repaper"
    ]
  },
  {
    id: "ch_largest_rect_hist",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    category: "Stacks",
    description: "Given an array of integers `heights` representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.",
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    inputFormat: "Line 1: Space-separated integers representing heights",
    outputFormat: "Maximum rectangular area as integer",
    hints: ["Use a monotonic increasing stack storing bar indices.", "When current height is smaller than stack top, pop and calculate area with popped height as minimum height.", "Width is i - stack.top - 1."],
    objective: "Calculate the maximum rectangular area in a histogram in O(n) time.",
    conceptualExplanation: ["Monotonic stack of indices with ascending heights.", "Pop when current height < stack top height, compute width and area.", "Track overall max area."],
    solve: (input) => {
      const heights = input.trim().split(/\s+/).map(Number);
      const stack = [];
      let maxArea = 0;
      const h = [...heights, 0];
      for (let i = 0; i < h.length; i++) {
        while (stack.length > 0 && h[i] < h[stack[stack.length - 1]]) {
          const height = h[stack.pop()];
          const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
          maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
      }
      return String(maxArea);
    },
    rawInputs: [
      "2 1 5 6 2 3",
      "2 4",
      "1",
      "5 5 5 5",
      "1 2 3 4 5",
      "5 4 3 2 1",
      "6 2 5 4 5 1 6",
      "0 9",
      "3 6 5 7 4 8 1 0",
      "2 1 2"
    ]
  },
  {
    id: "ch_asteroid_collision",
    title: "Asteroid Collision",
    difficulty: "Medium",
    category: "Stacks",
    description: "We are given an array `asteroids` of integers representing asteroids in a row.\n\nFor each asteroid, the absolute value represents its size, and the sign represents its direction (positive meaning right, negative meaning left). Each asteroid moves at the same speed.\n\nFind out the state of the asteroids after all collisions. If two asteroids meet, the smaller one explodes. If both are the same size, both explode. Two asteroids moving in the same direction will never meet. Return space-separated integers, or \"EMPTY\".",
    constraints: ["2 <= asteroids.length <= 10^4", "-1000 <= asteroids[i] <= 1000", "asteroids[i] != 0"],
    inputFormat: "Line 1: Space-separated integers",
    outputFormat: "Space-separated remaining asteroids, or EMPTY",
    hints: ["Use a stack.", "Collision only happens when current asteroid is negative and stack top is positive.", "Compare sizes: pop top if smaller; destroy current if smaller; pop and destroy if equal."],
    objective: "Simulate asteroid collisions using a stack.",
    conceptualExplanation: ["Push positive asteroids directly.", "When negative arrives: while top > 0 and top < |current|, pop top; if top == |current|, pop and discard current.", "Output remaining stack."],
    solve: (input) => {
      const ast = input.trim().split(/\s+/).map(Number);
      const stack = [];
      for (const a of ast) {
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
      return stack.length > 0 ? stack.join(' ') : "EMPTY";
    },
    rawInputs: [
      "5 10 -5",
      "8 -8",
      "10 2 -5",
      "-2 -1 1 2",
      "-2 -2 1 -2",
      "1 -1",
      "5 4 3 2 1 -6",
      "10 5 -5 -10",
      "-5 5",
      "1 2 3 4 5"
    ]
  },
  {
    id: "ch_simplify_path",
    title: "Simplify Unix File Path",
    difficulty: "Medium",
    category: "Stacks",
    description: "Given an absolute path for a Unix-style file system, simplify it. In a Unix-style file system, a period `'.'` refers to the current directory, a double period `'..'` refers to the directory up a level, and any multiple consecutive slashes are treated as a single slash `'/'`.\n\nReturn the simplified canonical path.",
    constraints: ["1 <= path.length <= 3000", "path starts with a single slash '/'.", "path consists of English letters, digits, period '.', slash '/'."],
    inputFormat: "Line 1: An absolute Unix file path",
    outputFormat: "The simplified canonical path",
    hints: ["Split string by '/'.", "Ignore empty strings and '.'.", "On '..', pop from stack if not empty. Push directory names onto stack.", "Join stack with '/'."],
    objective: "Convert a Unix file path into its canonical normalized form.",
    conceptualExplanation: ["Split path by '/'.", "Filter out '.' and empty tokens.", "Pop on '..', push on valid name.", "Return '/' + stack.join('/')."],
    solve: (input) => {
      const p = input.trim();
      const parts = p.split('/');
      const stack = [];
      for (const part of parts) {
        if (!part || part === '.') continue;
        if (part === '..') {
          if (stack.length > 0) stack.pop();
        } else {
          stack.push(part);
        }
      }
      return '/' + stack.join('/');
    },
    rawInputs: [
      "/home/",
      "/../",
      "/home//foo/",
      "/a/./b/../../c/",
      "/a/../../b/../c//.//",
      "/a/b/c/d/..",
      "/.../a/../b/c/../d/./",
      "/mastery/zone/../compiler/./editor",
      "/home/user/Documents/../Pictures",
      "/x/y/z/../../../w"
    ]
  },
  {
    id: "ch_decode_string",
    title: "Decode String Pattern",
    difficulty: "Medium",
    category: "Stacks",
    description: "Given an encoded string, return its decoded string.\n\nThe encoding rule is: `k[encoded_string]`, where the `encoded_string` inside the square brackets is being repeated exactly `k` times. You may assume that `k` is a positive integer.",
    constraints: ["1 <= s.length <= 30", "s consists of lowercase English letters, digits, and square brackets '[]'."],
    inputFormat: "Line 1: An encoded string",
    outputFormat: "The fully decoded string",
    hints: ["Use two stacks: one for counts (k) and one for strings.", "When '[', push current count and current string.", "When ']', pop count and previous string, repeat current string count times and append to previous."],
    objective: "Decode nested multiplier patterns using stacks.",
    conceptualExplanation: ["Maintain curStr and curNum.", "On '[': push curStr and curNum to stacks, reset both.", "On ']': pop k and prevStr; curStr = prevStr + curStr.repeat(k)."],
    solve: (input) => {
      const s = input.trim();
      const numStack = [];
      const strStack = [];
      let curNum = 0;
      let curStr = '';
      for (const ch of s) {
        if (ch >= '0' && ch <= '9') {
          curNum = curNum * 10 + parseInt(ch, 10);
        } else if (ch === '[') {
          numStack.push(curNum);
          strStack.push(curStr);
          curNum = 0;
          curStr = '';
        } else if (ch === ']') {
          const k = numStack.pop();
          const prevStr = strStack.pop();
          curStr = prevStr + curStr.repeat(k);
        } else {
          curStr += ch;
        }
      }
      return curStr;
    },
    rawInputs: [
      "3[a]2[bc]",
      "3[a2[c]]",
      "2[abc]3[cd]ef",
      "abc",
      "10[a]",
      "2[z]3[cd]2[ef]",
      "1[mastery]2[zone]",
      "3[2[b]]",
      "2[2[2[a]]]",
      "4[ab]"
    ]
  },

  // ==========================================
  // BINARY SEARCH (32 - 37)
  // ==========================================
  {
    id: "ch_search_insert_position",
    title: "Search Insert Position",
    difficulty: "Easy",
    category: "Binary Search",
    description: "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 <= nums[i], target <= 10^4", "nums contains distinct values sorted in ascending order."],
    inputFormat: "Line 1: An integer target\nLine 2: Space-separated sorted distinct integers",
    outputFormat: "Index as integer",
    hints: ["Classic binary search.", "If target found, return mid.", "If loop terminates without match, left pointer is the exact insertion index."],
    objective: "Find the index of target or insertion index in sorted array in O(log n).",
    conceptualExplanation: ["Binary search with low = 0, high = n - 1.", "If nums[mid] === target, return mid.", "When search finishes, return low."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const target = parseInt(lines[0].trim(), 10);
      const nums = lines[1].trim().split(/\s+/).map(Number);
      let l = 0, r = nums.length - 1;
      while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] === target) return String(mid);
        if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
      }
      return String(l);
    },
    rawInputs: [
      "5\n1 3 5 6",
      "2\n1 3 5 6",
      "7\n1 3 5 6",
      "0\n1 3 5 6",
      "1\n1",
      "0\n1",
      "10\n2 4 6 8 10 12",
      "5\n2 4 6 8 10",
      "-5\n-10 -3 0 4 9",
      "50\n10 20 30 40 60 70"
    ]
  },
  {
    id: "ch_first_last_position",
    title: "Find First and Last Position in Sorted Array",
    difficulty: "Medium",
    category: "Binary Search",
    description: "Given an array of integers `nums` sorted in non-decreasing order, find the starting and ending position of a given `target` value.\n\nIf `target` is not found in the array, return `-1 -1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i], target <= 10^9", "nums is non-decreasing."],
    inputFormat: "Line 1: An integer target\nLine 2: Space-separated sorted integers",
    outputFormat: "Two space-separated integers: first last",
    hints: ["Run two binary searches: one finding leftmost occurrence and one finding rightmost occurrence.", "For leftmost: when nums[mid] == target, continue searching left (r = mid - 1).", "For rightmost: when nums[mid] == target, continue searching right (l = mid + 1)."],
    objective: "Find the boundary indices of a target in a sorted array in O(log n).",
    conceptualExplanation: ["Left search finds first index matching target.", "Right search finds last index matching target.", "Output 'first last'."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const target = parseInt(lines[0].trim(), 10);
      if (!lines[1] || !lines[1].trim()) return "-1 -1";
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const findFirst = () => {
        let l = 0, r = nums.length - 1, ans = -1;
        while (l <= r) {
          const mid = Math.floor((l + r) / 2);
          if (nums[mid] === target) { ans = mid; r = mid - 1; }
          else if (nums[mid] < target) l = mid + 1;
          else r = mid - 1;
        }
        return ans;
      };
      const findLast = () => {
        let l = 0, r = nums.length - 1, ans = -1;
        while (l <= r) {
          const mid = Math.floor((l + r) / 2);
          if (nums[mid] === target) { ans = mid; l = mid + 1; }
          else if (nums[mid] < target) l = mid + 1;
          else r = mid - 1;
        }
        return ans;
      };
      return `${findFirst()} ${findLast()}`;
    },
    rawInputs: [
      "8\n5 7 7 8 8 10",
      "6\n5 7 7 8 8 10",
      "0\n",
      "1\n1",
      "2\n2 2 2 2 2",
      "4\n1 2 3 4 5",
      "10\n10 10 20 30",
      "-5\n-10 -5 -5 -5 0",
      "7\n1 3 5 7 9 11",
      "3\n1 2 4 5"
    ]
  },
  {
    id: "ch_sqrt_x",
    title: "Integer Square Root Sqrt(x)",
    difficulty: "Easy",
    category: "Binary Search",
    description: "Given a non-negative integer `x`, return the square root of `x` rounded down to the nearest integer. The returned integer should be non-negative as well.\n\nYou must not use any built-in exponent function or operator, such as `pow(x, 0.5)` or `x ** 0.5`.",
    constraints: ["0 <= x <= 2^31 - 1"],
    inputFormat: "Line 1: An integer x",
    outputFormat: "The integer floor of square root",
    hints: ["Binary search in range [0, x].", "If mid * mid == x, return mid.", "If mid * mid < x, save mid as candidate and search right."],
    objective: "Compute integer floor(sqrt(x)) using binary search.",
    conceptualExplanation: ["Low = 0, High = x.", "If mid * mid <= x, record mid, low = mid + 1.", "Otherwise high = mid - 1."],
    solve: (input) => {
      const x = parseInt(input.trim(), 10);
      if (x <= 1) return String(x);
      let l = 1, r = Math.floor(x / 2), ans = 1;
      while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (mid * mid === x) return String(mid);
        if (mid * mid < x) {
          ans = mid;
          l = mid + 1;
        } else {
          r = mid - 1;
        }
      }
      return String(ans);
    },
    rawInputs: ["4", "8", "0", "1", "16", "25", "26", "99", "1000", "2147395599"]
  },
  {
    id: "ch_koko_bananas",
    title: "Koko Eating Bananas",
    difficulty: "Medium",
    category: "Binary Search",
    description: "Koko loves to eat bananas. There are `n` piles of bananas, the `i-th` pile has `piles[i]` bananas. The guards have gone and will come back in `h` hours.\n\nKoko can decide her bananas-per-hour eating speed of `k`. Each hour, she chooses some pile of bananas and eats `k` bananas from that pile. If the pile has less than `k` bananas, she eats all of them instead and will not eat any more bananas during this hour.\n\nReturn the minimum integer `k` such that she can eat all the bananas within `h` hours.",
    constraints: ["1 <= piles.length <= 10^4", "piles.length <= h <= 10^9", "1 <= piles[i] <= 10^9"],
    inputFormat: "Line 1: An integer h (hours)\nLine 2: Space-separated integers representing piles",
    outputFormat: "Minimum eating speed k",
    hints: ["The speed k ranges from 1 to max(piles).", "For a given speed k, hours needed = sum(ceil(pile / k)).", "Binary search on k between 1 and max(piles)."],
    objective: "Binary search on answer to find minimum eating speed satisfying hour constraint.",
    conceptualExplanation: ["Search space: low = 1, high = max(piles).", "Compute total hours for speed mid: sum(ceil(p / mid)).", "If total <= h, record mid and search lower half; else search upper half."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const h = parseInt(lines[0].trim(), 10);
      const piles = lines[1].trim().split(/\s+/).map(Number);
      let l = 1, r = Math.max(...piles), ans = r;
      while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        let hours = 0;
        for (const p of piles) {
          hours += Math.ceil(p / mid);
        }
        if (hours <= h) {
          ans = mid;
          r = mid - 1;
        } else {
          l = mid + 1;
        }
      }
      return String(ans);
    },
    rawInputs: [
      "8\n3 6 7 11",
      "5\n30 11 23 4 20",
      "6\n30 11 23 4 20",
      "4\n3 6 7 11",
      "10\n10 10 10 10",
      "15\n1 2 3 4 5 6 7 8 9 10",
      "5\n100",
      "7\n312884470",
      "9\n3 5 7 9 11 13",
      "12\n4 8 12 16 20"
    ]
  },
  {
    id: "ch_ship_packages",
    title: "Capacity To Ship Packages Within D Days",
    difficulty: "Medium",
    category: "Binary Search",
    description: "A conveyor belt has packages that must be shipped from one port to another within `days` days.\n\nThe `i-th` package on the conveyor belt has a weight of `weights[i]`. Each day, we load the ship with packages on the conveyor belt (in the order given by `weights`). We may not load more weight than the maximum weight capacity of the ship.\n\nReturn the least weight capacity of the ship that will result in all the packages on the conveyor belt being shipped within `days` days.",
    constraints: ["1 <= days <= weights.length <= 5 * 10^4", "1 <= weights[i] <= 500"],
    inputFormat: "Line 1: An integer days\nLine 2: Space-separated integers weights",
    outputFormat: "Minimum weight capacity as integer",
    hints: ["Minimum capacity must be at least max(weights).", "Maximum capacity is sum(weights).", "Binary search on capacity and simulate day splits."],
    objective: "Binary search on ship capacity to meet deadline days.",
    conceptualExplanation: ["Search range: low = max(weights), high = sum(weights).", "Check if capacity mid can ship packages in <= days.", "If feasible, search lower half; else upper half."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const days = parseInt(lines[0].trim(), 10);
      const weights = lines[1].trim().split(/\s+/).map(Number);
      let l = Math.max(...weights);
      let r = weights.reduce((a, b) => a + b, 0);
      let ans = r;
      while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        let d = 1, cur = 0;
        for (const w of weights) {
          if (cur + w > mid) {
            d++;
            cur = w;
          } else {
            cur += w;
          }
        }
        if (d <= days) {
          ans = mid;
          r = mid - 1;
        } else {
          l = mid + 1;
        }
      }
      return String(ans);
    },
    rawInputs: [
      "5\n1 2 3 4 5 6 7 8 9 10",
      "3\n3 2 2 4 1 4",
      "4\n1 2 3 1 1",
      "1\n1 2 3 4 5",
      "10\n1 1 1 1 1 1 1 1 1 1",
      "2\n10 20 30 40 50",
      "3\n1 2 3 4 5 6 7",
      "6\n5 5 5 5 5 5",
      "4\n10 5 15 20 25",
      "2\n100 200"
    ]
  },
  {
    id: "ch_find_k_closest",
    title: "Find K Closest Elements",
    difficulty: "Medium",
    category: "Binary Search",
    description: "Given a sorted integer array `arr`, two integers `k` and `x`, return the `k` closest integers to `x` in the array. The result should also be sorted in ascending order.\n\nAn integer `a` is closer to `x` than an integer `b` if `|a - x| < |b - x|`, or `|a - x| == |b - x|` and `a < b`.",
    constraints: ["1 <= k <= arr.length", "1 <= arr.length <= 10^4", "arr is sorted in ascending order.", "-10^4 <= arr[i], x <= 10^4"],
    inputFormat: "Line 1: Two space-separated integers k and x\nLine 2: Space-separated sorted integers arr",
    outputFormat: "Space-separated k closest integers in sorted order",
    hints: ["Find the window of size k with minimum distance to x.", "Binary search the starting index of the window: compare x - arr[mid] with arr[mid + k] - x.", "Return arr.slice(left, left + k)."],
    objective: "Identify k closest elements to target in sorted array.",
    conceptualExplanation: ["Binary search starting point in [0, n - k].", "Compare arr[mid] and arr[mid + k] distance to x.", "Return subarray of length k."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const [k, x] = lines[0].trim().split(/\s+/).map(Number);
      const arr = lines[1].trim().split(/\s+/).map(Number);
      let l = 0, r = arr.length - k;
      while (l < r) {
        const mid = Math.floor((l + r) / 2);
        if (x - arr[mid] > arr[mid + k] - x) {
          l = mid + 1;
        } else {
          r = mid;
        }
      }
      return arr.slice(l, l + k).join(' ');
    },
    rawInputs: [
      "4 3\n1 2 3 4 5",
      "4 -1\n1 2 3 4 5",
      "2 5\n1 2 3 4 5",
      "1 10\n1 2 3 4 5",
      "3 0\n-5 -2 0 1 4 9",
      "3 6\n1 3 5 7 9",
      "2 4\n1 2 4 4 5",
      "5 15\n10 12 15 18 20 25",
      "1 1\n1",
      "4 35\n10 20 30 40 50"
    ]
  },

  // ==========================================
  // LINKED LISTS (38 - 42)
  // ==========================================
  {
    id: "ch_middle_linked_list",
    title: "Middle of Singly Linked List",
    difficulty: "Easy",
    category: "Linked Lists",
    description: "Given the values of a singly linked list, return the value of the middle node.\n\nIf there are two middle nodes, return the second middle node's value.",
    constraints: ["The number of nodes in the list is in the range [1, 100].", "1 <= Node.val <= 100"],
    inputFormat: "Line 1: Space-separated integers representing linked list values",
    outputFormat: "Value of the middle node as an integer",
    hints: ["Use fast and slow pointer technique.", "Slow advances by 1 step while fast advances by 2 steps.", "When fast reaches end, slow is at the middle node."],
    objective: "Locate middle element in singly linked list in single pass.",
    conceptualExplanation: ["Slow pointer moves 1 step, fast pointer moves 2 steps.", "When fast hits end (or null), slow points to middle node.", "Return slow node value."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const mid = Math.floor(nums.length / 2);
      return String(nums[mid]);
    },
    rawInputs: [
      "1 2 3 4 5",
      "1 2 3 4 5 6",
      "1",
      "1 2",
      "10 20 30 40 50 60 70",
      "7 8 9",
      "5 10 15 20",
      "100 200 300 400 500",
      "42",
      "1 3 5 7 9 11 13 15"
    ]
  },
  {
    id: "ch_palindrome_linked_list",
    title: "Palindrome Linked List Verification",
    difficulty: "Easy",
    category: "Linked Lists",
    description: "Given the values of a singly linked list, return `true` if it is a palindrome, or `false` otherwise.",
    constraints: ["The number of nodes in the list is in the range [1, 10^5].", "0 <= Node.val <= 9"],
    inputFormat: "Line 1: Space-separated integers representing list values",
    outputFormat: "true or false",
    hints: ["Can check with two pointers if values are in array.", "In O(1) space: find middle, reverse second half, compare halves."],
    objective: "Verify whether elements in singly linked list form a palindrome.",
    conceptualExplanation: ["Compare elements from start and end inward.", "If any mismatch occurs, return false; otherwise true."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let l = 0, r = nums.length - 1;
      while (l < r) {
        if (nums[l] !== nums[r]) return "false";
        l++; r--;
      }
      return "true";
    },
    rawInputs: [
      "1 2 2 1",
      "1 2",
      "1",
      "1 2 3 2 1",
      "1 2 3 4 5",
      "0 0",
      "1 0 1",
      "1 2 3 3 2 1",
      "1 2 3 4 2 1",
      "9 9 9 9 9"
    ]
  },
  {
    id: "ch_remove_linked_list_elements",
    title: "Remove Linked List Elements",
    difficulty: "Easy",
    category: "Linked Lists",
    description: "Given the values of a singly linked list and an integer `val`, remove all nodes of the linked list that have `Node.val == val`.\n\nReturn the space-separated values of the remaining list, or \"EMPTY\" if empty.",
    constraints: ["The number of nodes in the list is in the range [0, 5000].", "1 <= Node.val <= 50", "0 <= val <= 50"],
    inputFormat: "Line 1: Target integer val to remove\nLine 2: Space-separated integers representing linked list (can be empty)",
    outputFormat: "Space-separated values of remaining list, or EMPTY",
    hints: ["Use a sentinel/dummy node pointing to head to easily delete head nodes.", "Iterate through list and bypass any node whose val equals target.", "Return remaining elements."],
    objective: "Filter out all instances of target value from linked list.",
    conceptualExplanation: ["Use dummy node before head.", "Skip nodes with matching value.", "Format output or return 'EMPTY'."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const val = parseInt(lines[0].trim(), 10);
      if (!lines[1] || !lines[1].trim()) return "EMPTY";
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const filtered = nums.filter(x => x !== val);
      return filtered.length > 0 ? filtered.join(' ') : "EMPTY";
    },
    rawInputs: [
      "6\n1 2 6 3 4 5 6",
      "1\n",
      "7\n7 7 7 7",
      "2\n1 2 2 1",
      "5\n5 10 15 20",
      "3\n1 2 3",
      "4\n4 4 1 2 3",
      "0\n1 2 0 3 0 4",
      "9\n1 9 2 9 3 9",
      "8\n8"
    ]
  },
  {
    id: "ch_odd_even_linked_list",
    title: "Odd Even Linked List",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "Given the head of a singly linked list, group all the nodes with odd indices together followed by the nodes with even indices, and return the reordered list.\n\nThe first node is considered odd, and the second node is even, and so on.",
    constraints: ["The number of nodes in the list is in the range [0, 10^4].", "-10^6 <= Node.val <= 10^6"],
    inputFormat: "Line 1: Space-separated integers representing list values",
    outputFormat: "Space-separated integers of reordered list",
    hints: ["Maintain two lists: odd list and even list.", "Connect odd.next = even.next, advance odd; even.next = odd.next, advance even.", "Connect end of odd list to head of even list."],
    objective: "Reorder list nodes by 1-based index parity in O(n) time and O(1) extra space.",
    conceptualExplanation: ["Odd pointer starts at index 0, even pointer starts at index 1.", "Alternate links between odds and evens.", "Join end of odd chain to start of even chain."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const odds = [], evens = [];
      for (let i = 0; i < nums.length; i++) {
        if (i % 2 === 0) odds.push(nums[i]);
        else evens.push(nums[i]);
      }
      return odds.concat(evens).join(' ');
    },
    rawInputs: [
      "1 2 3 4 5",
      "2 1 3 5 6 4 7",
      "1",
      "1 2",
      "1 2 3",
      "10 20 30 40",
      "7 8 9 10 11 12",
      "5 4 3 2 1",
      "100 200",
      "1 2 3 4 5 6 7 8 9 10"
    ]
  },
  {
    id: "ch_add_two_numbers_list",
    title: "Add Two Numbers Stored in Lists",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a space-separated linked list in reverse order.",
    constraints: ["The number of nodes in each list is in the range [1, 100].", "0 <= Node.val <= 9"],
    inputFormat: "Line 1: Space-separated digits of list 1 (reverse order)\nLine 2: Space-separated digits of list 2 (reverse order)",
    outputFormat: "Space-separated digits of sum list in reverse order",
    hints: ["Iterate through both lists with carry variable.", "sum = l1.val + l2.val + carry; digit = sum % 10; carry = Math.floor(sum / 10).", "Continue until both lists and carry are exhausted."],
    objective: "Perform addition on two numbers represented as reversed linked list digits.",
    conceptualExplanation: ["Add corresponding digits along with carry.", "Compute new digit and new carry.", "Append remaining carry if present."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const l1 = lines[0].trim().split(/\s+/).map(Number);
      const l2 = lines[1].trim().split(/\s+/).map(Number);
      const res = [];
      let i = 0, j = 0, carry = 0;
      while (i < l1.length || j < l2.length || carry > 0) {
        const v1 = i < l1.length ? l1[i++] : 0;
        const v2 = j < l2.length ? l2[j++] : 0;
        const total = v1 + v2 + carry;
        res.push(total % 10);
        carry = Math.floor(total / 10);
      }
      return res.join(' ');
    },
    rawInputs: [
      "2 4 3\n5 6 4",
      "0\n0",
      "9 9 9 9 9 9 9\n9 9 9 9",
      "1 8\n0",
      "5\n5",
      "9 9\n1",
      "1 2 3\n4 5 6",
      "7 8 9\n3 2 1",
      "5 4 3 2 1\n5 4 3 2 1",
      "6 7 8\n4"
    ]
  },

  // ==========================================
  // TREES (43 - 48)
  // ==========================================
  {
    id: "ch_same_tree",
    title: "Same Binary Tree Structural Equivalence",
    difficulty: "Easy",
    category: "Trees",
    description: "Given the roots of two binary trees `p` and `q`, write a function to check if they are the same or not.\n\nTwo binary trees are considered the same if they are structurally identical, and the nodes have the same value. Input is given as space-separated level-order traversal with 'null' representing missing children.",
    constraints: ["The number of nodes in both trees is in the range [0, 100].", "-10^4 <= Node.val <= 10^4"],
    inputFormat: "Line 1: Level-order traversal of tree p\nLine 2: Level-order traversal of tree q",
    outputFormat: "true or false",
    hints: ["If both nodes are null, return true.", "If one is null or values differ, return false.", "Recursively check left and right subtrees."],
    objective: "Verify structural and value identity between two binary trees.",
    conceptualExplanation: ["Compare roots: null checks then value check.", "Recurse on left subtrees and right subtrees.", "Return true if all match."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const p = lines[0].trim();
      const q = lines[1].trim();
      return String(p === q);
    },
    rawInputs: [
      "1 2 3\n1 2 3",
      "1 2\n1 null 2",
      "1 2 1\n1 1 2",
      "null\nnull",
      "1\n1",
      "1 2 3 4 5\n1 2 3 4 5",
      "1 2 3 4\n1 2 3 null 4",
      "10 5 15\n10 5 15",
      "1 2\n2 1",
      "3 9 20 null null 15 7\n3 9 20 null null 15 7"
    ]
  },
  {
    id: "ch_symmetric_tree",
    title: "Symmetric Binary Tree Mirror",
    difficulty: "Easy",
    category: "Trees",
    description: "Given the root of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center). Input is given in level-order format with 'null' for missing nodes.",
    constraints: ["The number of nodes in the tree is in the range [1, 1000].", "-100 <= Node.val <= 100"],
    inputFormat: "Line 1: Space-separated level-order traversal",
    outputFormat: "true or false",
    hints: ["A tree is symmetric if left subtree is mirror reflection of right subtree.", "Check t1.val == t2.val, and t1.left mirror of t2.right, and t1.right mirror of t2.left."],
    objective: "Determine whether a binary tree is symmetric around its vertical axis.",
    conceptualExplanation: ["Check symmetry helper(t1, t2).", "Values must match, t1.left matches t2.right, t1.right matches t2.left."],
    solve: (input) => {
      const tokens = input.trim().split(/\s+/);
      const isMirror = (idx1, idx2) => {
        if (idx1 >= tokens.length && idx2 >= tokens.length) return true;
        const v1 = tokens[idx1] || 'null';
        const v2 = tokens[idx2] || 'null';
        if (v1 === 'null' && v2 === 'null') return true;
        if (v1 !== v2) return false;
        return isMirror(2 * idx1 + 1, 2 * idx2 + 2) && isMirror(2 * idx1 + 2, 2 * idx2 + 1);
      };
      if (tokens.length <= 1) return "true";
      return String(isMirror(1, 2));
    },
    rawInputs: [
      "1 2 2 3 4 4 3",
      "1 2 2 null 3 null 3",
      "1",
      "1 2 2",
      "1 2 3",
      "1 2 2 3 null null 3",
      "1 2 2 null 4 4 null",
      "1 2 2 3 4 4 3 5 null null 6 6 null null 5",
      "2 3 3 4 5 5 4",
      "1 2 3 4 5 6 7"
    ]
  },
  {
    id: "ch_diameter_of_binary_tree",
    title: "Diameter of Binary Tree",
    difficulty: "Easy",
    category: "Trees",
    description: "Given the root of a binary tree, return the length of the diameter of the tree.\n\nThe diameter of a binary tree is the length of the longest path between any two nodes in a tree. This path may or may not pass through the root. The length of a path between two nodes is represented by the number of edges between them.",
    constraints: ["The number of nodes in the tree is in the range [1, 10^4].", "-100 <= Node.val <= 100"],
    inputFormat: "Line 1: Space-separated level-order values of the tree ('null' for absent nodes)",
    outputFormat: "Diameter length in edges as an integer",
    hints: ["The longest path passing through any node is leftDepth + rightDepth.", "Run a post-order DFS that returns the depth of each node.", "Update maxDiameter = max(maxDiameter, leftDepth + rightDepth) at each node."],
    objective: "Compute the maximum distance between any two nodes in a binary tree.",
    conceptualExplanation: ["DFS computes height of each subtree.", "Diameter at node = left_height + right_height.", "Maintain global maximum."],
    solve: (input) => {
      const tokens = input.trim().split(/\s+/);
      let maxDia = 0;
      const getDepth = (idx) => {
        if (idx >= tokens.length || tokens[idx] === 'null') return 0;
        const l = getDepth(2 * idx + 1);
        const r = getDepth(2 * idx + 2);
        maxDia = Math.max(maxDia, l + r);
        return 1 + Math.max(l, r);
      };
      getDepth(0);
      return String(maxDia);
    },
    rawInputs: [
      "1 2 3 4 5",
      "1 2",
      "1",
      "1 2 3",
      "1 2 null 3 null 4",
      "1 2 3 4 5 6 7",
      "1 2 3 null null 4 5",
      "1 2 3 4 null null 5 null 6",
      "10 5 15 3 7 null 18",
      "1 2 3 4 5 null null 6 null null 7"
    ]
  },
  {
    id: "ch_path_sum",
    title: "Path Sum Root to Leaf",
    difficulty: "Easy",
    category: "Trees",
    description: "Given the `root` of a binary tree and an integer `targetSum`, return `true` if the tree has a root-to-leaf path such that adding up all the values along the path equals `targetSum`.\n\nA leaf is a node with no children.",
    constraints: ["The number of nodes in the tree is in the range [0, 5000].", "-1000 <= Node.val, targetSum <= 1000"],
    inputFormat: "Line 1: targetSum integer\nLine 2: Space-separated level-order values ('null' for absent)",
    outputFormat: "true or false",
    hints: ["At each node, subtract node.val from targetSum.", "If leaf node, check if remaining targetSum == 0.", "Recursively check left and right subtrees."],
    objective: "Determine if any root-to-leaf path sums to targetSum.",
    conceptualExplanation: ["Traverse from root downward.", "Subtract current node value from target.", "If leaf node and remainder is 0, return true."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const target = parseInt(lines[0].trim(), 10);
      if (!lines[1] || !lines[1].trim()) return "false";
      const tokens = lines[1].trim().split(/\s+/);
      const hasPath = (idx, sum) => {
        if (idx >= tokens.length || tokens[idx] === 'null') return false;
        const val = parseInt(tokens[idx], 10);
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;
        const isLeaf = (left >= tokens.length || tokens[left] === 'null') &&
                       (right >= tokens.length || tokens[right] === 'null');
        if (isLeaf) return sum === val;
        return hasPath(left, sum - val) || hasPath(right, sum - val);
      };
      return String(hasPath(0, target));
    },
    rawInputs: [
      "22\n5 4 8 11 null 13 4 7 2 null null null 1",
      "5\n1 2 3",
      "0\n",
      "1\n1 2",
      "10\n5 5",
      "18\n10 5 15 3 7 null 18",
      "3\n1 2",
      "7\n2 5",
      "15\n10 2 5",
      "8\n3 5 4"
    ]
  },
  {
    id: "ch_level_order_traversal",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a binary tree, return the number of levels and total nodes in the tree.",
    constraints: ["The number of nodes in the tree is in the range [0, 2000].", "-1000 <= Node.val <= 1000"],
    inputFormat: "Line 1: Space-separated level order nodes ('null' for absent)",
    outputFormat: "Two space-separated integers: levels count",
    hints: ["Use BFS queue.", "Count levels and valid non-null nodes.", "Return levels and total count."],
    objective: "Compute height and node count of binary tree.",
    conceptualExplanation: ["Perform BFS layer by layer.", "Count total non-null nodes.", "Count number of layers."],
    solve: (input) => {
      if (!input.trim() || input.trim() === 'null') return "0 0";
      const tokens = input.trim().split(/\s+/);
      const valid = tokens.filter(x => x !== 'null');
      if (valid.length === 0) return "0 0";
      let levels = 0;
      let q = [0];
      let nodeCount = 0;
      while (q.length > 0) {
        const nextQ = [];
        let hasNode = false;
        for (const idx of q) {
          if (idx < tokens.length && tokens[idx] !== 'null') {
            hasNode = true;
            nodeCount++;
            nextQ.push(2 * idx + 1);
            nextQ.push(2 * idx + 2);
          }
        }
        if (hasNode) levels++;
        q = nextQ;
      }
      return `${levels} ${nodeCount}`;
    },
    rawInputs: [
      "3 9 20 null null 15 7",
      "1",
      "null",
      "1 2 3 4 5",
      "1 2 null 3 null 4",
      "1 2 3 4 5 6 7",
      "10 20 30",
      "5 4 8 11 null 13 4",
      "1 2 3 null null null 4",
      "1 2 2 3 4 4 3"
    ]
  },
  {
    id: "ch_kth_smallest_bst",
    title: "Kth Smallest Element in a BST",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a binary search tree (BST) and an integer `k`, return the `k-th` smallest value (1-indexed) of all the values of the nodes in the tree.",
    constraints: ["The number of nodes in the tree is n.", "1 <= k <= n <= 10^4", "0 <= Node.val <= 10^4"],
    inputFormat: "Line 1: An integer k\nLine 2: Space-separated BST nodes in level-order ('null' for absent)",
    outputFormat: "The kth smallest value as an integer",
    hints: ["Inorder traversal of a BST visits nodes in strictly ascending sorted order.", "Traverse in-order and stop at the k-th node.", "O(k) time with iterative stack."],
    objective: "Find kth smallest element in BST using in-order traversal.",
    conceptualExplanation: ["Inorder traversal of BST gives sorted values.", "Collect values in-order.", "Return element at index k - 1."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const k = parseInt(lines[0].trim(), 10);
      const tokens = lines[1].trim().split(/\s+/);
      const vals = [];
      const inorder = (idx) => {
        if (idx >= tokens.length || tokens[idx] === 'null') return;
        inorder(2 * idx + 1);
        vals.push(parseInt(tokens[idx], 10));
        inorder(2 * idx + 2);
      };
      inorder(0);
      vals.sort((a, b) => a - b);
      return String(vals[k - 1]);
    },
    rawInputs: [
      "1\n3 1 4 null 2",
      "3\n5 3 6 2 4 null null 1",
      "1\n2 1 3",
      "2\n2 1 3",
      "3\n2 1 3",
      "1\n1",
      "4\n4 2 6 1 3 5 7",
      "2\n10 5 15 null null 12 20",
      "5\n10 5 15 2 7 12 20",
      "3\n8 3 10 1 6 null 14"
    ]
  },

  // ==========================================
  // HEAPS & GREEDY (49 - 53)
  // ==========================================
  {
    id: "ch_last_stone_weight",
    title: "Last Stone Weight Simulation",
    difficulty: "Easy",
    category: "Heaps",
    description: "You are given an array of integers `stones` where `stones[i]` is the weight of the `i-th` stone.\n\nWe are playing a game with the stones. On each turn, we choose the heaviest two stones and smash them together. Suppose the heaviest two stones have weights `x` and `y` with `x <= y`:\n- If `x == y`, both stones are destroyed.\n- If `x != y`, the stone of weight `x` is destroyed, and the stone of weight `y` has new weight `y - x`.\n\nAt the end of the game, there is at most one stone left. Return the weight of the last remaining stone. If there are no stones left, return `0`.",
    constraints: ["1 <= stones.length <= 30", "1 <= stones[i] <= 1000"],
    inputFormat: "Line 1: Space-separated integers representing stone weights",
    outputFormat: "Weight of the last remaining stone (or 0)",
    hints: ["Use a max heap to always retrieve the two largest stones.", "Smash them: if difference > 0, push difference back into heap.", "Repeat until heap size <= 1."],
    objective: "Simulate stone destruction priority queue process until at most 1 stone remains.",
    conceptualExplanation: ["Sort or maintain max-heap.", "Pop two largest, push difference if non-zero.", "Return final stone or 0."],
    solve: (input) => {
      let stones = input.trim().split(/\s+/).map(Number);
      while (stones.length > 1) {
        stones.sort((a, b) => b - a);
        const y = stones.shift();
        const x = stones.shift();
        if (y !== x) stones.push(y - x);
      }
      return String(stones.length === 1 ? stones[0] : 0);
    },
    rawInputs: [
      "2 7 4 1 8 1",
      "1",
      "2 2",
      "3 7 2",
      "10 4 2 10",
      "8 8 8",
      "1 3 5 7 9",
      "31 26 33 21 40",
      "100 50 25",
      "5 5 5 5"
    ]
  },
  {
    id: "ch_top_k_frequent",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    category: "Heaps",
    description: "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements in descending order of frequency.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "k is in the range [1, the number of unique elements in the array]."],
    inputFormat: "Line 1: An integer k\nLine 2: Space-separated integers nums",
    outputFormat: "Space-separated k elements",
    hints: ["Count frequencies using a Hash Map.", "Use a min-heap of size k, or bucket sort.", "Return elements ordered by frequency."],
    objective: "Extract the k most frequent elements in array.",
    conceptualExplanation: ["Count frequency of each number.", "Sort distinct numbers by frequency descending.", "Return top k."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const k = parseInt(lines[0].trim(), 10);
      const nums = lines[1].trim().split(/\s+/).map(Number);
      const counts = new Map();
      for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      return sorted.slice(0, k).map(x => x[0]).join(' ');
    },
    rawInputs: [
      "2\n1 1 1 2 2 3",
      "1\n1",
      "3\n4 1 -1 2 -1 2 3",
      "1\n5 5 5 5 5",
      "2\n1 2 3 4 5 1 2",
      "2\n10 10 20 20 20 30",
      "1\n42 42 7 7 7",
      "3\n1 1 2 2 3 3 4",
      "2\n9 9 9 8 8 7",
      "4\n1 2 3 4"
    ]
  },
  {
    id: "ch_find_median_stream",
    title: "Running Median of Stream",
    difficulty: "Hard",
    category: "Heaps",
    description: "The median is the middle value in an ordered integer list. If the size of the list is even, the median is the mean of the two middle values.\n\nGiven a list of numbers from a data stream, return the median formatted with 1 decimal place if fractional, or integer if whole.",
    constraints: ["1 <= nums.length <= 5 * 10^4", "-10^5 <= nums[i] <= 10^5"],
    inputFormat: "Line 1: Space-separated integers",
    outputFormat: "Median value (e.g. 2 or 2.5)",
    hints: ["Use two heaps: a max-heap for lower half and a min-heap for upper half.", "Balance heaps so their sizes differ by at most 1.", "Median is either top of larger heap or average of both tops."],
    objective: "Calculate median of a numbers collection in O(n log n).",
    conceptualExplanation: ["Sort numbers array.", "If odd length: return middle element.", "If even: return average of two middle elements."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      nums.sort((a, b) => a - b);
      const n = nums.length;
      if (n % 2 === 1) {
        return String(nums[Math.floor(n / 2)]);
      } else {
        const mid = (nums[n / 2 - 1] + nums[n / 2]) / 2;
        return Number.isInteger(mid) ? String(mid) : mid.toFixed(1);
      }
    },
    rawInputs: [
      "2 3 4",
      "2 3",
      "1",
      "5 15 1 3",
      "10 20 30 40 50",
      "-5 -10 0 10 5",
      "1 2",
      "6 7 8 9 10 11",
      "100 200",
      "4 1 7 2 9 3 8"
    ]
  },
  {
    id: "ch_task_scheduler",
    title: "Task Scheduler CPU Cooling Intervals",
    difficulty: "Medium",
    category: "Heaps",
    description: "Given a characters array `tasks`, representing the tasks a CPU needs to do, where each letter represents a different task. Tasks could be done in any order. Each task is done in one unit of time. For each unit of time, the CPU could complete either one task or just be idle.\n\nHowever, there is a non-negative integer `n` that represents the cooldown period between two same tasks (the same letter in the array). Return the least number of units of times that the CPU will take to finish all the given tasks.",
    constraints: ["1 <= tasks.length <= 10^4", "tasks[i] is uppercase English letter.", "0 <= n <= 100"],
    inputFormat: "Line 1: Cooldown integer n\nLine 2: Space-separated task characters",
    outputFormat: "Least units of time as integer",
    hints: ["Find the task with the maximum frequency maxFreq.", "Calculate idle slots needed: (maxFreq - 1) * (n + 1) + countOfTasksWithMaxFreq.", "Result is max(tasks.length, calculatedSlots)."],
    objective: "Compute minimum CPU cycles including cooldowns using greedy frequency formula.",
    conceptualExplanation: ["Count frequency of each task.", "Find max frequency F and number of tasks with frequency F.", "Time = max(totalTasks, (F - 1) * (n + 1) + countMax)."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const n = parseInt(lines[0].trim(), 10);
      const tasks = lines[1].trim().split(/\s+/);
      const counts = new Map();
      let maxF = 0;
      for (const t of tasks) {
        const c = (counts.get(t) || 0) + 1;
        counts.set(t, c);
        maxF = Math.max(maxF, c);
      }
      let maxCount = 0;
      for (const c of counts.values()) {
        if (c === maxF) maxCount++;
      }
      const ans = Math.max(tasks.length, (maxF - 1) * (n + 1) + maxCount);
      return String(ans);
    },
    rawInputs: [
      "2\nA A A B B B",
      "0\nA A A B B B",
      "2\nA A A A A A B C D E F G",
      "1\nA B C D",
      "3\nA A A B B B C C",
      "2\nA",
      "1\nA A B B",
      "2\nA B C A B C",
      "4\nA A A B B",
      "3\nX X X Y Y Z"
    ]
  },
  {
    id: "ch_reorganize_string",
    title: "Reorganize String No Adjacent",
    difficulty: "Medium",
    category: "Heaps",
    description: "Given a string `s`, rearrange the characters of `s` so that any two adjacent characters are not the same.\n\nReturn true if possible, or false otherwise.",
    constraints: ["1 <= s.length <= 500", "s consists of lowercase English letters."],
    inputFormat: "Line 1: A string s",
    outputFormat: "true or false",
    hints: ["Count frequency of each character.", "If the most frequent character appears more than (s.length + 1) / 2 times, it is impossible.", "Otherwise, it is always possible."],
    objective: "Determine whether characters of a string can be rearranged with no adjacent duplicates.",
    conceptualExplanation: ["Find maximum frequency of any character.", "If maxFreq > Math.ceil(s.length / 2), return false.", "Otherwise return true."],
    solve: (input) => {
      const s = input.trim();
      const counts = new Map();
      let maxF = 0;
      for (const ch of s) {
        const c = (counts.get(ch) || 0) + 1;
        counts.set(ch, c);
        maxF = Math.max(maxF, c);
      }
      const limit = Math.floor((s.length + 1) / 2);
      return String(maxF <= limit);
    },
    rawInputs: [
      "aab",
      "aaab",
      "a",
      "vvvlo",
      "baaba",
      "masteryzone",
      "aaaaa",
      "abacaba",
      "aabbcc",
      "zzzzzzy"
    ]
  },

  // ==========================================
  // BACKTRACKING (54 - 58)
  // ==========================================
  {
    id: "ch_permutations_array",
    title: "Permutations of Distinct Integers Count",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given an array `nums` of distinct integers, return the number of all possible permutations.",
    constraints: ["1 <= nums.length <= 8", "-10 <= nums[i] <= 10", "All integers in nums are unique."],
    inputFormat: "Line 1: Space-separated integers",
    outputFormat: "Total count of permutations as an integer",
    hints: ["For n distinct numbers, total permutations is n! (factorial).", "Can also generate permutations using backtracking.", "Return n!."],
    objective: "Compute the number of permutations for an array of distinct integers.",
    conceptualExplanation: ["Count distinct elements n.", "Calculate factorial n! = 1 * 2 * ... * n.", "Output total count."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/);
      const n = nums.length;
      let fact = 1;
      for (let i = 2; i <= n; i++) fact *= i;
      return String(fact);
    },
    rawInputs: [
      "1 2 3",
      "0 1",
      "1",
      "1 2 3 4",
      "10 20 30 40 50",
      "7 8 9",
      "1 2 3 4 5 6",
      "42",
      "-1 -2",
      "1 3 5 7"
    ]
  },
  {
    id: "ch_combinations_k_of_n",
    title: "Combinations Count of K Numbers",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given two integers `n` and `k`, return the total number of possible combinations of `k` numbers chosen from the range `[1, n]`.",
    constraints: ["1 <= n <= 20", "1 <= k <= n"],
    inputFormat: "Line 1: Two space-separated integers n and k",
    outputFormat: "Number of combinations C(n, k) as integer",
    hints: ["Formula C(n, k) = n! / (k! * (n - k)!).", "Can compute iteratively or with backtracking.", "Return integer combinations count."],
    objective: "Calculate combinations count C(n, k).",
    conceptualExplanation: ["Compute n choose k.", "Use formula C(n, k) = C(n, k-1) * (n - k + 1) / k.", "Return integer."],
    solve: (input) => {
      const [n, k] = input.trim().split(/\s+/).map(Number);
      let res = 1;
      for (let i = 1; i <= k; i++) {
        res = (res * (n - i + 1)) / i;
      }
      return String(Math.round(res));
    },
    rawInputs: [
      "4 2", "1 1", "5 3", "6 2", "10 5",
      "7 4", "8 3", "5 1", "5 5", "12 4"
    ]
  },
  {
    id: "ch_letter_combos_phone",
    title: "Letter Combinations of a Phone Number",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given a string containing digits from `2-9` inclusive, return the number of all possible letter combinations that the number could represent based on the telephone keypad mappings.",
    constraints: ["0 <= digits.length <= 4", "digits[i] is a digit in the range ['2', '9']."],
    inputFormat: "Line 1: A string of digits",
    outputFormat: "Total count of letter combinations as integer",
    hints: ["Digits 2-6 and 8 map to 3 letters each.", "Digits 7 and 9 map to 4 letters each.", "Total combinations is the product of lengths of mapped letters."],
    objective: "Calculate the total number of combinations from phone keypad letters.",
    conceptualExplanation: ["If empty, return 0.", "Multiply letter choices for each digit: 7 and 9 have 4 choices; others have 3.", "Output product."],
    solve: (input) => {
      const digits = input.trim();
      if (!digits) return "0";
      const map = { '2': 3, '3': 3, '4': 3, '5': 3, '6': 3, '7': 4, '8': 3, '9': 4 };
      let prod = 1;
      for (const d of digits) {
        if (map[d]) prod *= map[d];
      }
      return String(prod);
    },
    rawInputs: ["23", "", "2", "79", "234", "99", "777", "88", "456", "2345"]
  },
  {
    id: "ch_palindrome_partitioning",
    title: "Palindrome Partitioning Ways",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given a string `s`, partition `s` such that every substring of the partition is a palindrome. Return the number of possible palindrome partitionings of `s`.",
    constraints: ["1 <= s.length <= 16", "s contains only lowercase English letters."],
    inputFormat: "Line 1: A string s",
    outputFormat: "Number of palindrome partitionings as integer",
    hints: ["Use backtracking starting at index 0.", "For each end index from start to n, if substring is palindrome, recurse on end + 1.", "Count completed partitionings reaching end of string."],
    objective: "Count valid palindrome partitions of a string.",
    conceptualExplanation: ["Backtracking from index 0.", "Check if prefix is palindrome; if yes, recursively count ways for remainder.", "Return total count."],
    solve: (input) => {
      const s = input.trim();
      const isPal = (l, r) => {
        while (l < r) {
          if (s[l++] !== s[r--]) return false;
        }
        return true;
      };
      let ways = 0;
      const dfs = (start) => {
        if (start === s.length) { ways++; return; }
        for (let end = start; end < s.length; end++) {
          if (isPal(start, end)) dfs(end + 1);
        }
      };
      dfs(0);
      return String(ways);
    },
    rawInputs: [
      "aab", "a", "ab", "aaa", "racecar",
      "aba", "abba", "bb", "code", "noon"
    ]
  },
  {
    id: "ch_n_queens_solutions",
    title: "N-Queens Solutions Count",
    difficulty: "Hard",
    category: "Backtracking",
    description: "The n-queens puzzle is the problem of placing `n` queens on an `n x n` chessboard such that no two queens attack each other.\n\nGiven an integer `n`, return the number of distinct solutions to the n-queens puzzle.",
    constraints: ["1 <= n <= 9"],
    inputFormat: "Line 1: An integer n",
    outputFormat: "Number of distinct solutions as an integer",
    hints: ["Place one queen per row.", "Track columns, main diagonals (r - c), and anti-diagonals (r + c) using sets.", "Count ways when row reaches n."],
    objective: "Count non-attacking queen arrangements on n x n chessboard.",
    conceptualExplanation: ["Backtrack row by row.", "Track occupied columns and diagonals.", "Increment counter when all n rows filled."],
    solve: (input) => {
      const n = parseInt(input.trim(), 10);
      let count = 0;
      const cols = new Set();
      const diag1 = new Set();
      const diag2 = new Set();
      const backtrack = (row) => {
        if (row === n) { count++; return; }
        for (let col = 0; col < n; col++) {
          if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
          cols.add(col);
          diag1.add(row - col);
          diag2.add(row + col);
          backtrack(row + 1);
          cols.delete(col);
          diag1.delete(row - col);
          diag2.delete(row + col);
        }
      };
      backtrack(0);
      return String(count);
    },
    rawInputs: ["4", "1", "2", "3", "5", "6", "7", "8", "9", "4"]
  },

  // ==========================================
  // DYNAMIC PROGRAMMING (59 - 68)
  // ==========================================
  {
    id: "ch_min_cost_climbing_stairs",
    title: "Min Cost Climbing Stairs",
    difficulty: "Easy",
    category: "Dynamic Programming",
    description: "You are given an integer array `cost` where `cost[i]` is the cost of `i-th` step on a staircase. Once you pay the cost, you can either climb one or two steps.\n\nYou can either start from the step with index 0, or the step with index 1. Return the minimum cost to reach the top of the floor.",
    constraints: ["2 <= cost.length <= 1000", "0 <= cost[i] <= 999"],
    inputFormat: "Line 1: Space-separated integers representing cost array",
    outputFormat: "Minimum cost as integer",
    hints: ["dp[i] is the minimum cost to reach step i.", "dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2]).", "Keep only the previous two costs in variables for O(1) space."],
    objective: "Calculate minimum cost to reach top of staircase using DP.",
    conceptualExplanation: ["prev2 = 0, prev1 = 0.", "For each cost: cur = min(prev1 + cost[i], prev2 + cost[i-1]).", "Return minimum."],
    solve: (input) => {
      const cost = input.trim().split(/\s+/).map(Number);
      let prev2 = 0, prev1 = 0;
      for (let i = 2; i <= cost.length; i++) {
        const cur = Math.min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
        prev2 = prev1;
        prev1 = cur;
      }
      return String(prev1);
    },
    rawInputs: [
      "10 15 20",
      "1 100 1 1 1 100 1 1 100 1",
      "0 0",
      "5 10",
      "10 15",
      "1 2 3 4 5",
      "100 1 100 1 100",
      "2 5 3 1 7 3",
      "10 20 30 40 50",
      "0 1 2 2"
    ]
  },
  {
    id: "ch_tribonacci_number",
    title: "N-th Tribonacci Number",
    difficulty: "Easy",
    category: "Dynamic Programming",
    description: "The Tribonacci sequence `T_n` is defined as follows:\n`T_0 = 0`, `T_1 = 1`, `T_2 = 1`, and `T_{n+3} = T_n + T_{n+1} + T_{n+2}` for `n >= 0`.\n\nGiven `n`, return the value of `T_n`.",
    constraints: ["0 <= n <= 37"],
    inputFormat: "Line 1: An integer n",
    outputFormat: "T_n as integer",
    hints: ["Base cases: T_0 = 0, T_1 = 1, T_2 = 1.", "Iterate from 3 to n maintaining the last three values.", "Update: next = a + b + c; a = b; b = c; c = next."],
    objective: "Compute n-th Tribonacci number iteratively in O(n) time.",
    conceptualExplanation: ["Handle base cases 0, 1, 2.", "Iterate up to n keeping previous three values.", "Return final sum."],
    solve: (input) => {
      const n = parseInt(input.trim(), 10);
      if (n === 0) return "0";
      if (n <= 2) return "1";
      let a = 0, b = 1, c = 1;
      for (let i = 3; i <= n; i++) {
        const next = a + b + c;
        a = b;
        b = c;
        c = next;
      }
      return String(c);
    },
    rawInputs: ["4", "25", "0", "1", "2", "3", "5", "10", "15", "20"]
  },
  {
    id: "ch_house_robber_ii",
    title: "House Robber II Circular Neighborhood",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses at this place are arranged in a circle. That means the first house is the neighbor of the last one. Adjacent houses have security systems connected.\n\nReturn the maximum amount of money you can rob tonight without alerting the police.",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 1000"],
    inputFormat: "Line 1: Space-separated integers representing house stash amounts",
    outputFormat: "Maximum loot as integer",
    hints: ["Since houses are circular, you cannot rob both first and last house.", "Problem splits into two linear House Robber subproblems: houses [0 .. n-2] and houses [1 .. n-1].", "Return max of the two solutions."],
    objective: "Solve circular house robber problem by evaluating two non-circular slices.",
    conceptualExplanation: ["If length 1, return nums[0].", "Compute linear house robber on nums[0..n-2].", "Compute linear house robber on nums[1..n-1].", "Return max of both."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      if (nums.length === 1) return String(nums[0]);
      const robLinear = (arr) => {
        let prev2 = 0, prev1 = 0;
        for (const x of arr) {
          const cur = Math.max(prev1, prev2 + x);
          prev2 = prev1;
          prev1 = cur;
        }
        return prev1;
      };
      const opt1 = robLinear(nums.slice(0, nums.length - 1));
      const opt2 = robLinear(nums.slice(1));
      return String(Math.max(opt1, opt2));
    },
    rawInputs: [
      "2 3 2",
      "1 2 3 1",
      "1 2 3",
      "10",
      "20 10",
      "1 3 1 3 100",
      "5 1 2 10 6 2",
      "100 200 300 400",
      "50 1 1 50",
      "4 1 2 7 5 3 1"
    ]
  },
  {
    id: "ch_decode_ways",
    title: "Decode Ways Num Decodings",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "A message containing letters from A-Z can be encoded into numbers using the mapping: 'A' -> \"1\", 'B' -> \"2\", ... 'Z' -> \"26\".\n\nGiven a string `s` containing only digits, return the number of ways to decode it.",
    constraints: ["1 <= s.length <= 100", "s contains only digits and may contain leading zero(s)."],
    inputFormat: "Line 1: A digit string s",
    outputFormat: "Number of valid decodings as integer",
    hints: ["dp[i] represents decodings for s[0..i-1].", "Single digit s[i-1] != '0' contributes dp[i-1].", "Two digits s[i-2..i-1] between 10 and 26 contributes dp[i-2]."],
    objective: "Calculate number of valid message decodings using DP.",
    conceptualExplanation: ["dp array of size n + 1.", "dp[0] = 1.", "Check valid 1-digit and 2-digit substrings."],
    solve: (input) => {
      const s = input.trim();
      if (!s || s[0] === '0') return "0";
      const dp = new Array(s.length + 1).fill(0);
      dp[0] = 1;
      dp[1] = 1;
      for (let i = 2; i <= s.length; i++) {
        const one = parseInt(s.substring(i - 1, i), 10);
        const two = parseInt(s.substring(i - 2, i), 10);
        if (one >= 1 && one <= 9) dp[i] += dp[i - 1];
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
      }
      return String(dp[s.length]);
    },
    rawInputs: [
      "12", "226", "06", "10", "27",
      "11106", "2101", "1234", "11111", "2611055"
    ]
  },
  {
    id: "ch_word_break_dict",
    title: "Word Break Verification",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.",
    constraints: ["1 <= s.length <= 300", "1 <= wordDict.length <= 1000", "1 <= wordDict[i].length <= 20", "s and wordDict[i] consist of lowercase English letters."],
    inputFormat: "Line 1: The string s\nLine 2: Space-separated dictionary words",
    outputFormat: "true or false",
    hints: ["dp[i] is true if s[0..i] can be segmented.", "dp[i] = true if dp[j] is true and s[j..i] is in wordDict.", "Use a Set for O(1) dictionary lookups."],
    objective: "Determine whether a string can be segmented using dictionary words.",
    conceptualExplanation: ["dp[0] = true.", "For each i from 1 to n: check if there exists j < i where dp[j] is true and s[j..i] in dict.", "Return dp[n]."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const s = lines[0].trim();
      const words = new Set(lines[1].trim().split(/\s+/));
      const dp = new Array(s.length + 1).fill(false);
      dp[0] = true;
      for (let i = 1; i <= s.length; i++) {
        for (let j = 0; j < i; j++) {
          if (dp[j] && words.has(s.substring(j, i))) {
            dp[i] = true;
            break;
          }
        }
      }
      return String(dp[s.length]);
    },
    rawInputs: [
      "leetcode\nleet code",
      "applepenapple\napple pen",
      "catsandog\ncats dog sand and cat",
      "masteryzone\nmastery zone",
      "cars\ncar ca rs",
      "a\na",
      "a\nb",
      "program\npro gram",
      "compiler\ncom pil er compile",
      "banana\nba na"
    ]
  },
  {
    id: "ch_unique_paths_grid",
    title: "Unique Paths in Grid",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "There is a robot on an `m x n` grid. The robot is initially located at the top-left corner `(grid[0][0])`. The robot tries to move to the bottom-right corner `(grid[m - 1][n - 1])`. The robot can only move either down or right at any point in time.\n\nGiven the two integers `m` and `n`, return the number of possible unique paths that the robot can take to reach the bottom-right corner.",
    constraints: ["1 <= m, n <= 20"],
    inputFormat: "Line 1: Two space-separated integers m and n",
    outputFormat: "Total unique paths as integer",
    hints: ["dp[i][j] = dp[i-1][j] + dp[i][j-1].", "First row and first column are all 1.", "Can compress to a single 1D array of size n."],
    objective: "Compute grid path count using 2D dynamic programming.",
    conceptualExplanation: ["Initialize 1D row of size n with 1s.", "For each subsequent row from 1 to m-1: row[j] += row[j-1].", "Return row[n-1]."],
    solve: (input) => {
      const [m, n] = input.trim().split(/\s+/).map(Number);
      const row = new Array(n).fill(1);
      for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
          row[j] += row[j - 1];
        }
      }
      return String(row[n - 1]);
    },
    rawInputs: [
      "3 7", "3 2", "1 1", "7 3", "3 3",
      "2 2", "10 10", "4 4", "5 3", "12 5"
    ]
  },
  {
    id: "ch_min_path_sum",
    title: "Minimum Path Sum in Grid",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given a `m x n` `grid` filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.\n\nYou can only move either down or right at any point in time.",
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 100", "0 <= grid[i][j] <= 100"],
    inputFormat: "Line 1: Two integers m and n\nFollowing m lines: n space-separated integers",
    outputFormat: "Minimum path sum as integer",
    hints: ["dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).", "Initialize first row and first column with cumulative sums.", "dp[m-1][n-1] holds the answer."],
    objective: "Find path of minimum weight in 2D grid from top-left to bottom-right.",
    conceptualExplanation: ["Accumulate sums along top row and left column.", "For inner cells: dp[i][j] = grid[i][j] + min(up, left).", "Return bottom-right value."],
    solve: (input) => {
      const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const [m, n] = lines[0].split(/\s+/).map(Number);
      const grid = [];
      for (let i = 1; i <= m; i++) {
        grid.push(lines[i].split(/\s+/).map(Number));
      }
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (i === 0 && j === 0) continue;
          if (i === 0) grid[i][j] += grid[i][j - 1];
          else if (j === 0) grid[i][j] += grid[i - 1][j];
          else grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]);
        }
      }
      return String(grid[m - 1][n - 1]);
    },
    rawInputs: [
      "3 3\n1 3 1\n1 5 1\n4 2 1",
      "2 3\n1 2 3\n4 5 6",
      "1 1\n5",
      "1 4\n1 2 3 4",
      "4 1\n1\n2\n3\n4",
      "2 2\n1 2\n1 1",
      "3 3\n5 1 2\n6 7 1\n1 1 1",
      "3 2\n1 10\n1 1\n10 1",
      "2 2\n0 0\n0 0",
      "3 4\n1 2 5 1\n3 2 1 1\n1 4 2 1"
    ]
  },
  {
    id: "ch_longest_common_subseq",
    title: "Longest Common Subsequence Length",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return `0`.",
    constraints: ["1 <= text1.length, text2.length <= 1000", "text1 and text2 consist of only lowercase English characters."],
    inputFormat: "Line 1: String text1\nLine 2: String text2",
    outputFormat: "Length of LCS as integer",
    hints: ["2D DP table of size (m+1) x (n+1).", "If text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1.", "Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])."],
    objective: "Compute length of longest common subsequence between two strings.",
    conceptualExplanation: ["Standard 2D dynamic programming.", "If characters match, increment diagonal value.", "Otherwise take max of left and up cells."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const s1 = lines[0].trim();
      const s2 = lines[1].trim();
      const m = s1.length, n = s2.length;
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (s1[i - 1] === s2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
          else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
      return String(dp[m][n]);
    },
    rawInputs: [
      "abcde\nace",
      "abc\nabc",
      "abc\ndef",
      "mastery\nzone",
      "algorithm\nlogarithm",
      "aggtab\ngxtxayb",
      "banana\natana",
      "a\na",
      "xyz\nx",
      "programming\ngaming"
    ]
  },
  {
    id: "ch_edit_distance_lev",
    title: "Edit Distance Levenshtein",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`.\n\nYou have the following three operations permitted on a word:\n- Insert a character\n- Delete a character\n- Replace a character",
    constraints: ["0 <= word1.length, word2.length <= 500", "word1 and word2 consist of lowercase English letters."],
    inputFormat: "Line 1: String word1 (can be empty)\nLine 2: String word2 (can be empty)",
    outputFormat: "Minimum operations as integer",
    hints: ["Classic Levenshtein DP.", "dp[i][j] represents edits to convert word1[0..i] to word2[0..j].", "If characters match, dp[i-1][j-1]; else 1 + min(insert, delete, replace)."],
    objective: "Calculate minimum edit operations to transform one word to another.",
    conceptualExplanation: ["Initialize dp matrix with boundary distances.", "Fill table based on match vs mismatch.", "Output dp[m][n]."],
    solve: (input) => {
      const lines = input.trim().split('\n');
      const w1 = lines[0] ? lines[0].trim() : '';
      const w2 = lines[1] ? lines[1].trim() : '';
      const m = w1.length, n = w2.length;
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (w1[i - 1] === w2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
          else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
        }
      }
      return String(dp[m][n]);
    },
    rawInputs: [
      "horse\nros",
      "intention\nexecution",
      "\na",
      "a\n",
      "abc\nabc",
      "kitten\nsitting",
      "mastery\nmister",
      "compiler\ncompute",
      "code\ndoc",
      "zoologico\nzoo"
    ]
  },
  {
    id: "ch_maximal_square",
    title: "Maximal Square of 1s Area",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given an `m x n` binary `matrix` filled with `0`'s and `1`'s, find the largest square containing only `1`'s and return its area.",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 100", "matrix[i][j] is '0' or '1'."],
    inputFormat: "Line 1: Two integers m and n\nFollowing m lines: n space-separated '0' or '1' values",
    outputFormat: "Area of the largest square as integer",
    hints: ["dp[i][j] represents side length of maximum square with bottom-right corner at (i, j).", "If matrix[i][j] == 1: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).", "Area is maxSide * maxSide."],
    objective: "Determine maximum area of a square sub-matrix of 1s.",
    conceptualExplanation: ["2D DP tracks maximum side length ending at (i, j).", "If cell is 1, take 1 + min(top, left, diagonal).", "Square the max side length for area."],
    solve: (input) => {
      const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const [m, n] = lines[0].split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) mat.push(lines[i].split(/\s+/).map(Number));
      const dp = Array.from({ length: m }, () => new Array(n).fill(0));
      let maxSide = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (mat[i][j] === 1) {
            if (i === 0 || j === 0) dp[i][j] = 1;
            else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            maxSide = Math.max(maxSide, dp[i][j]);
          }
        }
      }
      return String(maxSide * maxSide);
    },
    rawInputs: [
      "4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0",
      "2 2\n0 1\n1 0",
      "1 1\n0",
      "1 1\n1",
      "3 3\n1 1 1\n1 1 1\n1 1 1",
      "2 3\n1 1 1\n1 1 1",
      "3 3\n0 0 0\n0 0 0\n0 0 0",
      "4 4\n1 1 0 0\n1 1 0 0\n0 0 1 1\n0 0 1 1",
      "3 4\n1 0 1 1\n1 1 1 1\n1 1 1 1",
      "2 4\n1 1 1 1\n1 1 1 1"
    ]
  },

  // ==========================================
  // GRAPHS & MATRIX (69 - 70)
  // ==========================================
  {
    id: "ch_flood_fill",
    title: "Flood Fill Pixel Replacement",
    difficulty: "Easy",
    category: "Graphs",
    description: "An image is represented by an `m x n` integer grid `image` where `image[i][j]` represents the pixel value of the image.\n\nYou are also given three integers `sr`, `sc`, and `color`. You should perform a flood fill on the image starting from the pixel `image[sr][sc]`. Return the count of pixels whose color was changed.",
    constraints: ["m == image.length", "n == image[i].length", "1 <= m, n <= 50", "0 <= image[i][j], color < 65536", "0 <= sr < m", "0 <= sc < n"],
    inputFormat: "Line 1: Two integers m and n\nFollowing m lines: n space-separated integers\nLast line: Three integers sr sc color",
    outputFormat: "Number of modified pixels as integer",
    hints: ["Find starting pixel's original color.", "If original color equals new color, return 0.", "Run DFS or BFS in 4 directions to color connected component, counting filled pixels."],
    objective: "Execute flood fill traversal and count modified grid pixels.",
    conceptualExplanation: ["Check if start pixel already equals new color.", "DFS across connected 4-directional neighbours with original color.", "Return total modified pixel count."],
    solve: (input) => {
      const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const [m, n] = lines[0].split(/\s+/).map(Number);
      const img = [];
      for (let i = 1; i <= m; i++) img.push(lines[i].split(/\s+/).map(Number));
      const [sr, sc, newColor] = lines[m + 1].split(/\s+/).map(Number);
      const orig = img[sr][sc];
      if (orig === newColor) return "0";
      let count = 0;
      const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || img[r][c] !== orig) return;
        img[r][c] = newColor;
        count++;
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
      };
      dfs(sr, sc);
      return String(count);
    },
    rawInputs: [
      "3 3\n1 1 1\n1 1 0\n1 0 1\n1 1 2",
      "2 2\n0 0\n0 0\n0 0 0",
      "1 1\n5\n0 0 7",
      "3 3\n1 2 3\n4 5 6\n7 8 9\n1 1 0",
      "2 3\n1 1 1\n2 2 2\n0 0 3",
      "3 3\n0 0 0\n0 1 0\n0 0 0\n1 1 2",
      "4 4\n1 1 2 2\n1 1 2 2\n3 3 4 4\n3 3 4 4\n0 0 9",
      "2 2\n1 0\n0 1\n0 0 2",
      "3 1\n1\n1\n1\n0 0 5",
      "1 3\n2 2 2\n0 1 8"
    ]
  },
  {
    id: "ch_pacific_atlantic",
    title: "Pacific Atlantic Water Flow Count",
    difficulty: "Medium",
    category: "Graphs",
    description: "There is an `m x n` rectangular island that borders both the Pacific Ocean and Atlantic Ocean. The Pacific Ocean touches the island's left and top edges, and the Atlantic Ocean touches the island's right and bottom edges.\n\nThe island is partitioned into a grid of square cells. You are given an `m x n` integer matrix `heights` where `heights[r][c]` represents the height above sea level of the cell at coordinate `(r, c)`.\n\nWater can flow in 4 directions to neighboring cells of equal or lower height. Return the count of grid coordinates from which water can flow to both oceans.",
    constraints: ["m == heights.length", "n == heights[r].length", "1 <= m, n <= 200", "0 <= heights[r][c] <= 10^5"],
    inputFormat: "Line 1: Two integers m and n\nFollowing m lines: n space-separated heights",
    outputFormat: "Count of coordinates that flow to both oceans",
    hints: ["Reverse thinking: start DFS from the oceans inward to higher or equal cells.", "Run DFS from Pacific borders (top row, left column).", "Run DFS from Atlantic borders (bottom row, right column).", "Count cells reachable in both traversals."],
    objective: "Count cells with drainage paths to both oceans.",
    conceptualExplanation: ["DFS from borders towards higher or equal neighbors.", "pacific[r][c] tracks reachability to Pacific.", "atlantic[r][c] tracks reachability to Atlantic.", "Count cells where both are true."],
    solve: (input) => {
      const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const [m, n] = lines[0].split(/\s+/).map(Number);
      const h = [];
      for (let i = 1; i <= m; i++) h.push(lines[i].split(/\s+/).map(Number));
      const pac = Array.from({ length: m }, () => new Array(n).fill(false));
      const atl = Array.from({ length: m }, () => new Array(n).fill(false));
      const dfs = (r, c, ocean) => {
        ocean[r][c] = true;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < m && nc >= 0 && nc < n && !ocean[nr][nc] && h[nr][nc] >= h[r][c]) {
            dfs(nr, nc, ocean);
          }
        }
      };
      for (let i = 0; i < m; i++) {
        dfs(i, 0, pac);
        dfs(i, n - 1, atl);
      }
      for (let j = 0; j < n; j++) {
        dfs(0, j, pac);
        dfs(m - 1, j, atl);
      }
      let count = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (pac[i][j] && atl[i][j]) count++;
        }
      }
      return String(count);
    },
    rawInputs: [
      "5 5\n1 2 2 3 5\n3 2 3 4 4\n2 4 5 3 1\n6 7 1 4 5\n5 1 1 2 4",
      "1 1\n1",
      "2 2\n1 1\n1 1",
      "3 3\n1 2 3\n8 9 4\n7 6 5",
      "2 3\n1 2 3\n4 5 6",
      "3 1\n1\n2\n3",
      "1 3\n3 2 1",
      "3 3\n10 10 10\n10 1 10\n10 10 10",
      "2 2\n2 1\n1 2",
      "4 4\n1 1 1 1\n1 2 2 1\n1 2 2 1\n1 1 1 1"
    ]
  }
];

console.log(`Defined ${challenges.length} challenges.`);
if (challenges.length !== 70) {
  throw new Error(`Expected exactly 70 challenges, got ${challenges.length}`);
}

// Check for ID & Title uniqueness within new challenges and against existing catalog
const existingIds = new Set(existingCatalog.map(c => c.id));
const existingTitles = new Set(existingCatalog.map(c => c.title.toLowerCase().trim()));
const seenNewIds = new Set();
const seenNewTitles = new Set();

for (const c of challenges) {
  if (existingIds.has(c.id)) throw new Error(`Collision with existing catalog ID: ${c.id}`);
  if (existingTitles.has(c.title.toLowerCase().trim())) throw new Error(`Collision with existing catalog Title: ${c.title}`);
  if (seenNewIds.has(c.id)) throw new Error(`Duplicate ID in new challenges: ${c.id}`);
  if (seenNewTitles.has(c.title.toLowerCase().trim())) throw new Error(`Duplicate Title in new challenges: ${c.title}`);
  seenNewIds.add(c.id);
  seenNewTitles.add(c.title.toLowerCase().trim());
  if (!c.rawInputs || c.rawInputs.length !== 10) throw new Error(`Challenge ${c.id} does not have 10 test cases!`);
}

console.log('All 70 challenges passed ID & Title uniqueness checks.');

// Format challenges to match exact catalog schema
const formattedNewChallenges = challenges.map(def => {
  const testCases = def.rawInputs.map((inp, idx) => ({
    input: inp,
    expectedOutput: def.solve(inp),
    isHidden: idx >= 3
  }));

  const examples = [
    {
      input: testCases[0].input,
      output: testCases[0].expectedOutput,
      explanation: `Test case 1 verifies correct execution with sample input.`
    },
    {
      input: testCases[1].input,
      output: testCases[1].expectedOutput,
      explanation: `Test case 2 tests edge case handling.`
    }
  ];

  return {
    id: def.id,
    title: def.title,
    difficulty: def.difficulty,
    category: def.category,
    description: def.description,
    constraints: def.constraints,
    inputFormat: def.inputFormat,
    outputFormat: def.outputFormat,
    hints: def.hints,
    examples: examples,
    starterCode: {
      cpp: "// Enter your code below\n",
      python: "# Enter your code below\n",
      javascript: "// Enter your code below\n",
      java: "// Enter your code below\n"
    },
    testCases: testCases,
    objective: def.objective,
    conceptualExplanation: def.conceptualExplanation
  };
});

// Combine 65 existing + 70 new = 135 total
const combinedCatalog = [...existingCatalog, ...formattedNewChallenges];
console.log(`Total combined challenges: ${combinedCatalog.length}`);

// Write back to challengesCatalog.js
const catalogPath = path.join(__dirname, '../data/challengesCatalog.js');
const fileContent = `/**
 * MASTERY ZONE ALGORITHMIC CHALLENGES CATALOG
 * 135 Verified Challenges across Core DSA Topics
 * Generated with strict 10 test cases (3 visible, 7 hidden) each.
 */

const CHALLENGES_CATALOG = ${JSON.stringify(combinedCatalog, null, 2)};

module.exports = CHALLENGES_CATALOG;
`;

fs.writeFileSync(catalogPath, fileContent, 'utf8');
console.log(`Successfully wrote ${combinedCatalog.length} challenges to ${catalogPath}`);
