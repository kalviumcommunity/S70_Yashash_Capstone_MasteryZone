// Part 1: Topics 1-5 (Arrays, Strings, Hashing, Two Pointers, Sliding Window)
// 4 challenges per topic = 20 challenges total

function makeChallenge({
  id, title, difficulty, category, description,
  inputFormat, outputFormat, constraints, examples, hints,
  objective, conceptualExplanation, testInputs, solver
}) {
  const testCases = testInputs.map((input, idx) => ({
    input,
    expectedOutput: solver(input),
    isHidden: idx >= 3
  }));
  return {
    id, title, difficulty, category, description,
    inputFormat, outputFormat, constraints, examples, hints,
    starterCode: {
      cpp: "// Enter your code below\n",
      python: "# Enter your code below\n",
      javascript: "// Enter your code below\n",
      java: "// Enter your code below\n"
    },
    testCases, objective, conceptualExplanation
  };
}

const part1Challenges = [
  // ================= 1. ARRAYS =================
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
      "On each day, calculate the profit if you sold today: currentPrice - minPriceSoFar.",
      "Update your maximum recorded profit if today's profit exceeds the previous best."
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
      "7 1 5 3 6 4", "7 6 4 3 1", "2 4 1", "1 2", "3 3 3 3",
      "1 2 3 4 5", "5 4 3 2 10", "10 2 9 1 8", "3 8 2 5 1 9", "100 180 260 310 40 535 695"
    ],
    solver: (input) => {
      const p = input.trim().split(/\s+/).map(Number);
      let min = Infinity, max = 0;
      for (const x of p) { if (x < min) min = x; else if (x - min > max) max = x - min; }
      return String(max);
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
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
    examples: [
      { input: "1 2 3 4", output: "24 12 8 6", explanation: "For index 0: 2*3*4=24. Index 1: 1*3*4=12. Index 2: 1*2*4=8. Index 3: 1*2*3=6." },
      { input: "-1 1 0 -3 3", output: "0 0 9 0 0", explanation: "Zero index gets product of non-zero elements." }
    ],
    hints: [
      "Think about prefix products: construct an array where res[i] contains product of elements to left of i.",
      "Traverse from right to left with a running suffix product accumulator.",
      "Multiply each res[i] by the suffix product."
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
      "1 2 3 4", "-1 1 0 -3 3", "2 3", "4 5 1 8 2", "0 0",
      "1 0", "2 2 2 2", "5 2 3", "-2 -3 -4", "1 1 1 1 1"
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
    constraints: ["1 <= nums.length <= 10^5", "0 <= k <= 10^5"],
    examples: [
      { input: "1 2 3 4 5 6 7\n3", output: "5 6 7 1 2 3 4", explanation: "Rotate 3 steps right moves last 3 elements to the front." },
      { input: "-1 -100 3 99\n2", output: "3 99 -1 -100", explanation: "Rotate 2 steps right moves last 2 elements to the front." }
    ],
    hints: [
      "Normalize k: k = k % nums.length.",
      "The elements shifted to front are the last k elements, followed by the first n - k elements.",
      "Combine both slices in order."
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
      "1 2 3 4 5 6 7\n3", "-1 -100 3 99\n2", "1 2\n3", "1\n0", "1 2 3\n0",
      "1 2 3\n3", "1 2 3 4\n1", "10 20 30 40 50\n4", "5 6 7 8\n6", "9 8 7 6 5 4\n5"
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
      { input: "1 2 3\n4 5 6", output: "1 2 3 4 5 6", explanation: "All elements of nums2 follow nums1." }
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
      "1 3 5\n2 4 6", "1 2 3\n4 5 6", "5\n1 2 3", "1 5 9\n2 6 10", "2\n1",
      "10 20 30\n5 15 25 35", "-5 -2 0\n-3 1 4", "1 1 1\n2 2 2", "4 7 9\n3 5 8 10", "100\n50 150"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const a = lines[0].trim() ? lines[0].trim().split(/\s+/).map(Number) : [];
      const b = lines[1].trim() ? lines[1].trim().split(/\s+/).map(Number) : [];
      return [...a, ...b].sort((x, y) => x - y).join(" ");
    }
  }),

  // ================= 2. STRINGS =================
  makeChallenge({
    id: "ch_longest_common_prefix",
    title: "Longest Common Prefix",
    difficulty: "Easy",
    category: "Strings",
    description: "Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string.",
    inputFormat: "A single line containing space-separated words.",
    outputFormat: "The longest common prefix string (empty if none).",
    constraints: ["1 <= words.length <= 200", "0 <= words[i].length <= 200"],
    examples: [
      { input: "flower flow flight", output: "fl", explanation: "'fl' is the longest common prefix among the words." },
      { input: "dog racecar car", output: "", explanation: "There is no common prefix among the input strings." }
    ],
    hints: [
      "Start with the first word as your candidate prefix.",
      "Compare it with each subsequent word, trimming characters from the end of the prefix until it matches the beginning of the word.",
      "If the prefix becomes empty at any point, stop and return empty string."
    ],
    objective: "Identify the longest leading character sequence shared across all given strings.",
    conceptualExplanation: [
      "Step 1: Read the space-separated words into a list.",
      "Step 2: If list is empty, return empty string.",
      "Step 3: Set prefix = words[0].",
      "Step 4: For each word in words[1..n], while word does not start with prefix, shorten prefix by 1 character.",
      "Step 5: Output the resulting prefix."
    ],
    testInputs: [
      "flower flow flight", "dog racecar car", "interspecies interstellar interstate", "apple app application", "alone",
      "throne throne", "prefix prejudice present", "a b c", "cir car", "master mastery masterzone"
    ],
    solver: (input) => {
      const words = input.trim().split(/\s+/).filter(Boolean);
      if (!words.length || !words[0]) return "";
      let prefix = words[0];
      for (let i = 1; i < words.length; i++) {
        while (words[i].indexOf(prefix) !== 0) {
          prefix = prefix.substring(0, prefix.length - 1);
          if (!prefix) return "";
        }
      }
      return prefix;
    }
  }),

  makeChallenge({
    id: "ch_valid_anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    category: "Strings",
    description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    inputFormat: "Line 1: String s.\nLine 2: String t.",
    outputFormat: "A single line with 'true' or 'false'.",
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    examples: [
      { input: "anagram\nnagaram", output: "true", explanation: "Both strings have the exact same character frequencies." },
      { input: "rat\ncar", output: "false", explanation: "Characters 't' and 'c' do not match." }
    ],
    hints: [
      "If the lengths of s and t differ, they cannot be anagrams.",
      "Use a hash map or frequency array of size 26 to count occurrences of each character in s and decrement for t.",
      "Alternatively, sort both strings and check if they are identical."
    ],
    objective: "Verify whether two strings contain identical character multisets.",
    conceptualExplanation: [
      "Step 1: Read strings s and t.",
      "Step 2: If s.length != t.length, return false immediately.",
      "Step 3: Sort characters of s and sort characters of t.",
      "Step 4: Check if sorted strings are identical.",
      "Step 5: Output 'true' if matching, else 'false'."
    ],
    testInputs: [
      "anagram\nnagaram", "rat\ncar", "listen\nsilent", "a\na", "a\nb",
      "ab\na", "triangle\nintegral", "dormitory\ndirtyroom", "hello\nbillion", "aabbcc\nabcabc"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const s = lines[0].trim();
      const t = lines[1].trim();
      if (s.length !== t.length) return "false";
      return s.split("").sort().join("") === t.split("").sort().join("") ? "true" : "false";
    }
  }),

  makeChallenge({
    id: "ch_string_compression",
    title: "String Compression Run Length",
    difficulty: "Medium",
    category: "Strings",
    description: "Given a string of characters, compress it using the following algorithm:\n\nBegin with an empty string `s`. For each group of consecutive repeating characters in the input, append the character followed by the group's length if length > 1 (if length is 1, just append the character).\n\nReturn the compressed string.",
    inputFormat: "A single line containing the string to compress.",
    outputFormat: "A single line containing the compressed string.",
    constraints: ["1 <= s.length <= 10^5", "s consists of lower or upper case letters."],
    examples: [
      { input: "aabcccccaaa", output: "a2bc5a3", explanation: "Two a's, one b, five c's, three a's." },
      { input: "abc", output: "abc", explanation: "No character repeats consecutively, so no counts are added." }
    ],
    hints: [
      "Use a pointer to traverse the string while counting identical consecutive characters.",
      "When character changes or string ends, append the character and its count (if > 1).",
      "Advance pointer to next distinct character."
    ],
    objective: "Perform run-length encoding on consecutive repeating characters.",
    conceptualExplanation: [
      "Step 1: Read the input string.",
      "Step 2: Initialize result string and index i = 0.",
      "Step 3: While i < length, note current char and count identical characters.",
      "Step 4: Append char; if count > 1, append count.",
      "Step 5: Output compressed string."
    ],
    testInputs: [
      "aabcccccaaa", "abc", "aabb", "a", "aaaa",
      "abbbbbbbbbb", "wwweerrr", "xyzzyx", "zzzzzz", "aaabbbccc"
    ],
    solver: (input) => {
      const s = input.trim();
      let res = "", i = 0;
      while (i < s.length) {
        const ch = s[i];
        let count = 0;
        while (i < s.length && s[i] === ch) { count++; i++; }
        res += ch + (count > 1 ? count : "");
      }
      return res;
    }
  }),

  makeChallenge({
    id: "ch_roman_to_integer",
    title: "Roman to Integer Converter",
    difficulty: "Easy",
    category: "Strings",
    description: "Roman numerals are represented by seven different symbols: I (1), V (5), X (10), L (50), C (100), D (500) and M (1000).\n\nGiven a roman numeral string, convert it to an integer.",
    inputFormat: "A single line containing a valid Roman numeral string.",
    outputFormat: "A single integer.",
    constraints: ["1 <= s.length <= 15", "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M').", "s is a valid roman numeral in the range [1, 3999]."],
    examples: [
      { input: "III", output: "3", explanation: "III = 3." },
      { input: "LVIII", output: "58", explanation: "L = 50, V = 5, III = 3." },
      { input: "MCMXCIV", output: "1994", explanation: "M = 1000, CM = 900, XC = 90 and IV = 4." }
    ],
    hints: [
      "Iterate through the string from left to right.",
      "If the current numeral is strictly less than the next numeral, subtract it from total (e.g. IV = 5 - 1).",
      "Otherwise, add it to total."
    ],
    objective: "Translate standard Roman numeral strings into base-10 integers.",
    conceptualExplanation: [
      "Step 1: Map symbols to values: I:1, V:5, X:10, L:50, C:100, D:500, M:1000.",
      "Step 2: Initialize total = 0.",
      "Step 3: Loop i from 0 to length - 1.",
      "Step 4: If val(s[i]) < val(s[i+1]), total -= val(s[i]), else total += val(s[i]).",
      "Step 5: Output integer total."
    ],
    testInputs: [
      "III", "LVIII", "MCMXCIV", "IV", "IX",
      "XL", "XC", "CD", "CM", "MMXXIV"
    ],
    solver: (input) => {
      const s = input.trim();
      const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        const cur = map[s[i]] || 0;
        const next = map[s[i + 1]] || 0;
        if (cur < next) total -= cur;
        else total += cur;
      }
      return String(total);
    }
  }),

  // ================= 3. HASHING =================
  makeChallenge({
    id: "ch_group_anagrams",
    title: "Group Anagrams Count",
    difficulty: "Medium",
    category: "Hashing",
    description: "Given an array of strings `strs`, group the anagrams together. Return the number of distinct anagram groups formed.",
    inputFormat: "A single line containing space-separated words.",
    outputFormat: "A single integer: the number of distinct anagram groups.",
    constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
    examples: [
      { input: "eat tea tan ate nat bat", output: "3", explanation: "Groups are ['eat','tea','ate'], ['tan','nat'], and ['bat']. Total 3 groups." },
      { input: "a", output: "1", explanation: "Only 1 group." }
    ],
    hints: [
      "Two words are anagrams if sorting their characters yields the same signature string.",
      "Use a hash map where key is sorted string and value is list of words.",
      "The number of keys in the hash map represents the total group count."
    ],
    objective: "Cluster words with identical character multiset frequencies and count unique clusters.",
    conceptualExplanation: [
      "Step 1: Read words from standard input.",
      "Step 2: Initialize hash map for anagram buckets.",
      "Step 3: For each word, sort its letters to generate key.",
      "Step 4: Insert word into map under key.",
      "Step 5: Output size of hash map."
    ],
    testInputs: [
      "eat tea tan ate nat bat", "a", "ab ba cd dc ef", "cat dog act god tac", "apple orange banana",
      "silent listen enlist inlet", "abc bca cab cba bac acb", "a b c d e", "hello olleh world dlrow", "one two three four"
    ],
    solver: (input) => {
      const words = input.trim().split(/\s+/).filter(Boolean);
      const groups = new Map();
      for (const w of words) {
        const k = w.split("").sort().join("");
        groups.set(k, (groups.get(k) || 0) + 1);
      }
      return String(groups.size);
    }
  }),

  makeChallenge({
    id: "ch_longest_consecutive_seq",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    category: "Hashing",
    description: "Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence.\n\nYou must write an algorithm that runs in O(n) time.",
    inputFormat: "A single line containing space-separated integers.",
    outputFormat: "A single integer: length of the longest consecutive sequence.",
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    examples: [
      { input: "100 4 200 1 3 2", output: "4", explanation: "The longest consecutive elements sequence is [1, 2, 3, 4]. Its length is 4." },
      { input: "0 3 7 2 5 8 4 6 0 1", output: "9", explanation: "Consecutive elements 0 through 8 have length 9." }
    ],
    hints: [
      "Insert all numbers into a Hash Set for O(1) lookups.",
      "An element num can only start a sequence if (num - 1) is not in the set.",
      "From each sequence start, check num + 1, num + 2, ... while in set, tracking longest streak."
    ],
    objective: "Determine length of the longest run of consecutive integers in an unsorted array.",
    conceptualExplanation: [
      "Step 1: Convert input array into a HashSet.",
      "Step 2: Initialize maxStreak = 0.",
      "Step 3: For each num in HashSet, check if num - 1 exists.",
      "Step 4: If not, count upward streak: while set.contains(num + streak), streak++.",
      "Step 5: Output maxStreak."
    ],
    testInputs: [
      "100 4 200 1 3 2", "0 3 7 2 5 8 4 6 0 1", "1 2 0 1", "10", "9 1 4 7 3 -1 0 5 8 -1 6",
      "5 4 3 2 1", "10 20 30 40", "-2 -1 0 1 2", "1 9 3 10 4 20 2", "100 200 101 201 102"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const set = new Set(nums);
      let maxLen = 0;
      for (const num of set) {
        if (!set.has(num - 1)) {
          let cur = num, streak = 1;
          while (set.has(cur + 1)) { cur++; streak++; }
          maxLen = Math.max(maxLen, streak);
        }
      }
      return String(maxLen);
    }
  }),

  makeChallenge({
    id: "ch_subarray_sum_k",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    category: "Hashing",
    description: "Given an array of integers `nums` and an integer `k`, return the total number of continuous subarrays whose sum equals to `k`.",
    inputFormat: "Line 1: Space-separated integers representing the array nums.\nLine 2: Integer k.",
    outputFormat: "A single integer: total count of subarrays.",
    constraints: ["1 <= nums.length <= 2 * 10^4", "-1000 <= nums[i] <= 1000", "-10^7 <= k <= 10^7"],
    examples: [
      { input: "1 1 1\n2", output: "2", explanation: "Subarrays [1, 1] at indices [0, 1] and [1, 2] sum to 2." },
      { input: "1 2 3\n3", output: "2", explanation: "Subarrays [1, 2] and [3] sum to 3." }
    ],
    hints: [
      "Use prefix sums: sum(i, j) = prefix[j] - prefix[i - 1].",
      "If prefix[j] - prefix[i - 1] == k, then prefix[i - 1] == prefix[j] - k.",
      "Maintain a hash map of prefix sum frequencies as you iterate."
    ],
    objective: "Count contiguous subarrays summing to target k using prefix sums and hashing in O(n).",
    conceptualExplanation: [
      "Step 1: Initialize prefix map with {0: 1}, running sum = 0, count = 0.",
      "Step 2: For each number x in array, add x to running sum.",
      "Step 3: If map contains (sum - k), add its frequency to count.",
      "Step 4: Increment frequency of sum in map.",
      "Step 5: Output count."
    ],
    testInputs: [
      "1 1 1\n2", "1 2 3\n3", "1 -1 0\n0", "3 4 7 2 -3 1 4 2\n7", "1\n1",
      "1\n0", "0 0 0 0\n0", "2 2 2 2\n4", "-1 -1 1\n0", "10 2 -2 -20 10\n-10"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const k = parseInt(lines[1].trim(), 10);
      const map = new Map();
      map.set(0, 1);
      let sum = 0, count = 0;
      for (const num of nums) {
        sum += num;
        if (map.has(sum - k)) count += map.get(sum - k);
        map.set(sum, (map.get(sum) || 0) + 1);
      }
      return String(count);
    }
  }),

  makeChallenge({
    id: "ch_first_unique_char",
    title: "First Unique Character in a String",
    difficulty: "Easy",
    category: "Hashing",
    description: "Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.",
    inputFormat: "A single line containing the string s.",
    outputFormat: "A single integer: 0-based index of the first non-repeating character, or -1.",
    constraints: ["1 <= s.length <= 10^5", "s consists of only lowercase English letters."],
    examples: [
      { input: "leetcode", output: "0", explanation: "Character 'l' at index 0 is non-repeating." },
      { input: "loveleetcode", output: "2", explanation: "'v' at index 2 is the first non-repeating character." },
      { input: "aabb", output: "-1", explanation: "All characters repeat." }
    ],
    hints: [
      "Perform a first pass to build a frequency map of all characters in the string.",
      "Perform a second pass through the string: the first character with frequency 1 is your answer.",
      "If no character has frequency 1, return -1."
    ],
    objective: "Identify the first distinct character position in a string using two-pass hashing.",
    conceptualExplanation: [
      "Step 1: Read the string.",
      "Step 2: Build frequency dictionary of characters.",
      "Step 3: Iterate through indices i = 0 to length - 1.",
      "Step 4: If freq[s[i]] == 1, return i.",
      "Step 5: If loop finishes, return -1."
    ],
    testInputs: [
      "leetcode", "loveleetcode", "aabb", "z", "aadada",
      "swiss", "abacabad", "masteryzone", "abcdeabcde", "redivider"
    ],
    solver: (input) => {
      const s = input.trim();
      const counts = {};
      for (const ch of s) counts[ch] = (counts[ch] || 0) + 1;
      for (let i = 0; i < s.length; i++) {
        if (counts[s[i]] === 1) return String(i);
      }
      return "-1";
    }
  }),

  // ================= 4. TWO POINTERS =================
  makeChallenge({
    id: "ch_container_water",
    title: "Container With Most Water",
    difficulty: "Medium",
    category: "Two Pointers",
    description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
    inputFormat: "A single line of space-separated integers representing vertical bar heights.",
    outputFormat: "A single integer: maximum area.",
    constraints: ["2 <= height.length <= 10^5", "0 <= height[i] <= 10^4"],
    examples: [
      { input: "1 8 6 2 5 4 8 3 7", output: "49", explanation: "Lines at index 1 and 8 (height 8 and 7) hold area min(8, 7) * (8 - 1) = 49." },
      { input: "1 1", output: "1", explanation: "Distance 1 with height 1 yields area 1." }
    ],
    hints: [
      "Place left pointer at 0 and right pointer at n - 1.",
      "Compute area = min(height[left], height[right]) * (right - left).",
      "Move the pointer pointing to the shorter line inward to attempt finding a taller boundary."
    ],
    objective: "Maximize container area between two boundaries using two pointers in O(n).",
    conceptualExplanation: [
      "Step 1: Set left = 0, right = n - 1, maxArea = 0.",
      "Step 2: While left < right, calculate area = min(h[left], h[right]) * (right - left).",
      "Step 3: Update maxArea = max(maxArea, area).",
      "Step 4: If h[left] < h[right], left++, else right--.",
      "Step 5: Output maxArea."
    ],
    testInputs: [
      "1 8 6 2 5 4 8 3 7", "1 1", "4 3 2 1 4", "1 2 1", "1 2 4 3",
      "2 3 4 5 18 17 6", "5 5 5 5 5", "1 3 2 5 25 24 5", "10 9 8 7 6 5 4 3 2 1", "3 9 3 4 7 2 12 6"
    ],
    solver: (input) => {
      const h = input.trim().split(/\s+/).map(Number);
      let l = 0, r = h.length - 1, max = 0;
      while (l < r) {
        const area = Math.min(h[l], h[r]) * (r - l);
        if (area > max) max = area;
        if (h[l] < h[r]) l++; else r--;
      }
      return String(max);
    }
  }),

  makeChallenge({
    id: "ch_three_sum",
    title: "3Sum Zero Triplet Count",
    difficulty: "Medium",
    category: "Two Pointers",
    description: "Given an integer array nums, return the number of unique triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.",
    inputFormat: "A single line containing space-separated integers.",
    outputFormat: "A single integer: number of unique zero-sum triplets.",
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    examples: [
      { input: "-1 0 1 2 -1 -4", output: "2", explanation: "Triplets are [-1, -1, 2] and [-1, 0, 1]. Total 2 unique triplets." },
      { input: "0 1 1", output: "0", explanation: "No triplet sums to 0." },
      { input: "0 0 0", output: "1", explanation: "Only [0, 0, 0] sums to 0." }
    ],
    hints: [
      "Sort the array first to enable two-pointer sweeps and easy duplicate skipping.",
      "Iterate i from 0 to n - 3. Set left = i + 1, right = n - 1.",
      "Skip duplicate values for i, left, and right to count only distinct triplets."
    ],
    objective: "Find all distinct three-element sets that sum to zero in O(n^2).",
    conceptualExplanation: [
      "Step 1: Sort the array in non-decreasing order.",
      "Step 2: Loop i from 0 to n - 3, skip if nums[i] == nums[i - 1].",
      "Step 3: Set left = i + 1, right = n - 1.",
      "Step 4: Check sum: if 0, increment count and skip duplicates on left and right; if < 0, left++; if > 0, right--.",
      "Step 5: Output triplet count."
    ],
    testInputs: [
      "-1 0 1 2 -1 -4", "0 1 1", "0 0 0", "-2 0 1 1 2", "-1 2 -1 -1 2 -1",
      "1 2 -2 -1", "-4 -2 -2 -2 0 1 2 2 2 3 3 4 4 6 6", "-5 2 3 -2 0", "3 0 -2 -1 1 2", "-3 1 2 -1 0 1"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      let count = 0;
      for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let left = i + 1, right = nums.length - 1;
        while (left < right) {
          const sum = nums[i] + nums[left] + nums[right];
          if (sum === 0) {
            count++;
            while (left < right && nums[left] === nums[left + 1]) left++;
            while (left < right && nums[right] === nums[right - 1]) right--;
            left++; right--;
          } else if (sum < 0) left++; else right--;
        }
      }
      return String(count);
    }
  }),

  makeChallenge({
    id: "ch_trapping_rain_water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    category: "Two Pointers",
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    inputFormat: "A single line containing space-separated integers representing the elevation heights.",
    outputFormat: "A single integer: total trapped water volume.",
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    examples: [
      { input: "0 1 0 2 1 0 1 3 2 1 2 1", output: "6", explanation: "Elevation map traps 6 units of rain water." },
      { input: "4 2 0 3 2 5", output: "9", explanation: "Elevation map traps 9 units of rain water." }
    ],
    hints: [
      "Use two pointers, left at 0 and right at n - 1, keeping track of maxLeft and maxRight.",
      "Whichever side has the smaller max boundary dictates the trapped water at that position.",
      "Advance the pointer with the smaller boundary."
    ],
    objective: "Calculate accumulated rainwater between elevation barriers in O(n) time and O(1) space.",
    conceptualExplanation: [
      "Step 1: Set left = 0, right = n - 1, maxL = 0, maxR = 0, water = 0.",
      "Step 2: While left <= right, compare height[left] and height[right].",
      "Step 3: If height[left] <= height[right]: if height[left] >= maxL, maxL = height[left], else water += maxL - height[left]; left++.",
      "Step 4: Else: if height[right] >= maxR, maxR = height[right], else water += maxR - height[right]; right--.",
      "Step 5: Output total water."
    ],
    testInputs: [
      "0 1 0 2 1 0 1 3 2 1 2 1", "4 2 0 3 2 5", "3 0 2 0 4", "2 0 2", "3 2 1",
      "1 2 3", "5 4 1 2", "0 2 0", "5 2 1 2 1 5", "6 4 2 0 3 2 0 3 1 4 5 3 2 7 5 3 0 1 2 1 3 4 6 8 1 3"
    ],
    solver: (input) => {
      const h = input.trim().split(/\s+/).map(Number);
      let left = 0, right = h.length - 1, maxL = 0, maxR = 0, water = 0;
      while (left <= right) {
        if (h[left] <= h[right]) {
          if (h[left] >= maxL) maxL = h[left]; else water += maxL - h[left];
          left++;
        } else {
          if (h[right] >= maxR) maxR = h[right]; else water += maxR - h[right];
          right--;
        }
      }
      return String(water);
    }
  }),

  makeChallenge({
    id: "ch_move_zeroes",
    title: "Move Zeroes to End",
    difficulty: "Easy",
    category: "Two Pointers",
    description: "Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements.\n\nNote that you must do this in-place without making a copy of the array.",
    inputFormat: "A single line containing space-separated integers.",
    outputFormat: "A single line of space-separated integers with zeroes relocated to the end.",
    constraints: ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    examples: [
      { input: "0 1 0 3 12", output: "1 3 12 0 0", explanation: "Non-zero values maintain relative order; zeroes move to end." },
      { input: "0", output: "0", explanation: "Single element array remains unchanged." }
    ],
    hints: [
      "Maintain a slow pointer for the position where the next non-zero element should be placed.",
      "Iterate through the array with a fast pointer; when you see a non-zero, write it to the slow pointer and increment slow.",
      "Fill the remaining positions from slow to end with zeroes."
    ],
    objective: "Consolidate all zeros at the tail of the array while preserving non-zero ordering.",
    conceptualExplanation: [
      "Step 1: Set insertPos = 0.",
      "Step 2: Loop through array with index i = 0 to n - 1.",
      "Step 3: If nums[i] != 0, assign nums[insertPos] = nums[i] and increment insertPos.",
      "Step 4: While insertPos < n, assign nums[insertPos++] = 0.",
      "Step 5: Output array joined with spaces."
    ],
    testInputs: [
      "0 1 0 3 12", "0", "1 2 3", "0 0 1", "2 1",
      "0 0 0", "4 2 4 0 0 3 0 5 1 0", "1 0 2 0 3 0", "-1 0 -2 0", "0 7 0 9 0 11"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let pos = 0;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] !== 0) nums[pos++] = nums[i];
      }
      while (pos < nums.length) nums[pos++] = 0;
      return nums.join(" ");
    }
  }),

  // ================= 5. SLIDING WINDOW =================
  makeChallenge({
    id: "ch_longest_substr_no_repeat",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    inputFormat: "A single line containing the string s.",
    outputFormat: "A single integer: length of the longest unique character substring.",
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    examples: [
      { input: "abcabcbb", output: "3", explanation: "The answer is 'abc', with length 3." },
      { input: "bbbbb", output: "1", explanation: "The answer is 'b', with length 1." },
      { input: "pwwkew", output: "3", explanation: "The answer is 'wke', with length 3." }
    ],
    hints: [
      "Use a sliding window with left and right boundaries.",
      "Store the most recent index of each character in a hash map.",
      "When encountering a character already in the window, advance left pointer to map[char] + 1."
    ],
    objective: "Identify the maximum contiguous span of unique characters using sliding window.",
    conceptualExplanation: [
      "Step 1: If string is empty, return 0.",
      "Step 2: Maintain left pointer and hash map of char to last-seen index.",
      "Step 3: For right pointer from 0 to length - 1, if char in map >= left, update left = map[char] + 1.",
      "Step 4: Update map[char] = right; update maxLen = max(maxLen, right - left + 1).",
      "Step 5: Output maxLen."
    ],
    testInputs: [
      "abcabcbb", "bbbbb", "pwwkew", " ", "au",
      "dvdf", "abcdef", "abba", "tmmzuxt", "aab"
    ],
    solver: (input) => {
      const s = input.trim();
      if (!s) return "0";
      let max = 0, l = 0;
      const map = new Map();
      for (let r = 0; r < s.length; r++) {
        const c = s[r];
        if (map.has(c) && map.get(c) >= l) l = map.get(c) + 1;
        map.set(c, r);
        max = Math.max(max, r - l + 1);
      }
      return String(max);
    }
  }),

  makeChallenge({
    id: "ch_min_window_substring",
    title: "Minimum Window Substring Length",
    difficulty: "Hard",
    category: "Sliding Window",
    description: "Given two strings `s` and `t`, return the minimum length of a substring in `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return `0`.",
    inputFormat: "Line 1: String s.\nLine 2: String t.",
    outputFormat: "A single integer: minimum window length (or 0).",
    constraints: ["m == s.length, n == t.length", "1 <= m, n <= 10^5", "s and t consist of uppercase and lowercase English letters."],
    examples: [
      { input: "ADOBECODEBANC\nABC", output: "4", explanation: "The minimum window substring is 'BANC' with length 4." },
      { input: "a\na", output: "1", explanation: "Entire string is minimum window with length 1." },
      { input: "a\naa", output: "0", explanation: "Target requires two 'a's but s only has one." }
    ],
    hints: [
      "Count character requirements of t in a hash table.",
      "Expand right pointer until all required characters are satisfied.",
      "Contract left pointer while maintaining the requirement to find minimum window size."
    ],
    objective: "Find the shortest substring spanning all characters of a target multiset.",
    conceptualExplanation: [
      "Step 1: Build frequency map of target string t.",
      "Step 2: Expand right pointer in s, updating window counts.",
      "Step 3: When window matches all characters in t, try shrinking from left.",
      "Step 4: Update minLen at each valid window state.",
      "Step 5: Output minLen if found, else 0."
    ],
    testInputs: [
      "ADOBECODEBANC\nABC", "a\na", "a\naa", "ab\nb", "ab\na",
      "abc\nac", "aaflslflsldkalskaaa\naaa", "bba\nab", "cabwefgewcwaefgcf\ncae", "aaaaaaaaaaaabbq\nba"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const s = lines[0].trim(), t = lines[1].trim();
      if (!s || !t) return "0";
      const need = {};
      for (const c of t) need[c] = (need[c] || 0) + 1;
      let have = 0, req = Object.keys(need).length;
      const win = {};
      let min = Infinity, l = 0;
      for (let r = 0; r < s.length; r++) {
        const c = s[r];
        win[c] = (win[c] || 0) + 1;
        if (need[c] && win[c] === need[c]) have++;
        while (have === req) {
          min = Math.min(min, r - l + 1);
          const lc = s[l];
          win[lc]--;
          if (need[lc] && win[lc] < need[lc]) have--;
          l++;
        }
      }
      return min === Infinity ? "0" : String(min);
    }
  }),

  makeChallenge({
    id: "ch_max_avg_subarray",
    title: "Maximum Average Subarray I",
    difficulty: "Easy",
    category: "Sliding Window",
    description: "You are given an integer array `nums` consisting of `n` elements, and an integer `k`.\n\nFind a contiguous subarray whose length is equal to `k` that has the maximum average value and return this value formatted to 2 decimal places.",
    inputFormat: "Line 1: Space-separated integers representing the array nums.\nLine 2: An integer k.",
    outputFormat: "A decimal number rounded to 2 decimal places (e.g. 12.75).",
    constraints: ["n == nums.length", "1 <= k <= n <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "1 12 -5 -6 50 3\n4", output: "12.75", explanation: "Maximum average is (12 - 5 - 6 + 50) / 4 = 51 / 4 = 12.75." },
      { input: "5\n1", output: "5.00", explanation: "Subarray [5] has average 5.00." }
    ],
    hints: [
      "Calculate the sum of the first k elements.",
      "Slide the window by adding the next element and subtracting the element that left the window.",
      "Track the maximum sum seen, then divide by k and format to 2 decimal places."
    ],
    objective: "Locate contiguous window of size k with highest arithmetic mean.",
    conceptualExplanation: [
      "Step 1: Compute sum of first k elements.",
      "Step 2: Initialize maxSum = sum.",
      "Step 3: Loop i from k to n - 1: sum += nums[i] - nums[i - k]; maxSum = max(maxSum, sum).",
      "Step 4: Compute average = maxSum / k.",
      "Step 5: Output average formatted to 2 decimal places."
    ],
    testInputs: [
      "1 12 -5 -6 50 3\n4", "5\n1", "0 4 0 3 2\n1", "0 1 1 3 3\n4", "-1\n1",
      "4 2 1 3 6\n2", "7 4 5 8 8 3 9 8 7 6\n7", "-5 -4 -3 -2 -1\n3", "10 20 30 40 50\n3", "1 2 3 4 5 6 7 8 9 10\n5"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const k = parseInt(lines[1].trim(), 10);
      let sum = 0;
      for (let i = 0; i < k; i++) sum += nums[i];
      let max = sum;
      for (let i = k; i < nums.length; i++) {
        sum += nums[i] - nums[i - k];
        if (sum > max) max = sum;
      }
      return (max / k).toFixed(2);
    }
  }),

  makeChallenge({
    id: "ch_longest_repeating_char_replace",
    title: "Longest Repeating Character Replacement",
    difficulty: "Medium",
    category: "Sliding Window",
    description: "You are given a string `s` and an integer `k`. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most `k` times.\n\nReturn the length of the longest substring containing the same letter you can get after performing the above operations.",
    inputFormat: "Line 1: Uppercase string s.\nLine 2: Integer k.",
    outputFormat: "A single integer: maximum length of uniform substring.",
    constraints: ["1 <= s.length <= 10^5", "s consists of only uppercase English letters.", "0 <= k <= s.length"],
    examples: [
      { input: "ABAB\n2", output: "4", explanation: "Replace the two 'A's with 'B's (or vice versa) to get 'BBBB' with length 4." },
      { input: "AABABBA\n1", output: "4", explanation: "Replace middle 'A' with 'B' to get 'AABBBBA' whose substring 'BBBB' has length 4." }
    ],
    hints: [
      "Window validity condition: (windowLength - maxCharFrequencyInWindow) <= k.",
      "If more than k characters need to be changed, shrink window from the left.",
      "Track the maximum valid window length observed."
    ],
    objective: "Maximize identical character substring by replacing at most k characters.",
    conceptualExplanation: [
      "Step 1: Set left = 0, maxCount = 0, maxLen = 0.",
      "Step 2: For right from 0 to length - 1, update char frequency and maxCount.",
      "Step 3: While (right - left + 1 - maxCount > k), decrement freq of s[left] and left++.",
      "Step 4: Update maxLen = max(maxLen, right - left + 1).",
      "Step 5: Output maxLen."
    ],
    testInputs: [
      "ABAB\n2", "AABABBA\n1", "A\n0", "AAAA\n2", "ABAA\n0",
      "ABCDE\n1", "BAAAB\n2", "KRSCDCSONAJNHLBMKATOAKSESKASCSBOBPAHXALUZBRGGIAJJGQISBEKSQNQIBAK\n4", "ABBB\n2", "EOEMQLLQTRQDDLJLOASFRPTCSRMGinventory\n5"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const s = lines[0].trim();
      const k = parseInt(lines[1].trim(), 10);
      const counts = {};
      let l = 0, maxC = 0, maxL = 0;
      for (let r = 0; r < s.length; r++) {
        const ch = s[r];
        counts[ch] = (counts[ch] || 0) + 1;
        maxC = Math.max(maxC, counts[ch]);
        while (r - l + 1 - maxC > k) {
          counts[s[l]]--;
          l++;
        }
        maxL = Math.max(maxL, r - l + 1);
      }
      return String(maxL);
    }
  })
];

module.exports = { part1Challenges };
