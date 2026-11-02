// Part 3: Topics 11-15 (Sorting, Trees, Graphs, Greedy, Dynamic Programming)
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

const part3Challenges = [
  // ================= 11. SORTING =================
  makeChallenge({
    id: "ch_merge_intervals",
    title: "Merge Overlapping Intervals",
    difficulty: "Medium",
    category: "Sorting",
    description: "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.\n\nPrint the merged intervals formatted as start-end pairs separated by space, e.g. `1-6 8-10 15-18`.",
    inputFormat: "Line 1: Integer n (number of intervals).\nNext n lines: Two space-separated integers start and end.",
    outputFormat: "A single line containing space-separated merged intervals in start-end format.",
    constraints: ["1 <= n <= 10^4", "0 <= start_i <= end_i <= 10^4"],
    examples: [
      { input: "4\n1 3\n2 6\n8 10\n15 18", output: "1-6 8-10 15-18", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { input: "2\n1 4\n4 5", output: "1-5", explanation: "Intervals [1,4] and [4,5] overlap at boundary 4, merge to [1,5]." }
    ],
    hints: [
      "Sort intervals primarily by start time in ascending order.",
      "Initialize merged list with the first interval.",
      "For each subsequent interval, if its start <= last merged end, extend last merged end = max(end, cur.end). Otherwise append as new interval."
    ],
    objective: "Coalesce intersecting intervals into minimal disjoint ranges.",
    conceptualExplanation: [
      "Step 1: Parse n intervals into [start, end] pairs.",
      "Step 2: Sort intervals ascending by start time.",
      "Step 3: Push first interval to merged array.",
      "Step 4: For each remaining interval, if cur[0] <= merged.last[1], update merged.last[1] = max(merged.last[1], cur[1]); else push cur.",
      "Step 5: Output intervals formatted as start-end space-separated."
    ],
    testInputs: [
      "4\n1 3\n2 6\n8 10\n15 18", "2\n1 4\n4 5", "1\n1 4", "2\n1 4\n0 4", "2\n1 4\n2 3",
      "3\n1 4\n5 6\n7 8", "3\n1 10\n2 3\n4 5", "4\n2 3\n4 5\n6 7\n8 9", "2\n1 4\n0 0", "3\n1 4\n0 2\n3 5"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0].trim(), 10);
      const intervals = [];
      for (let i = 1; i <= n; i++) intervals.push(lines[i].trim().split(/\s+/).map(Number));
      intervals.sort((a, b) => a[0] - b[0]);
      const merged = [intervals[0]];
      for (let i = 1; i < intervals.length; i++) {
        const last = merged[merged.length - 1];
        const cur = intervals[i];
        if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]);
        else merged.push(cur);
      }
      return merged.map((int) => `${int[0]}-${int[1]}`).join(" ");
    }
  }),

  makeChallenge({
    id: "ch_sort_colors",
    title: "Sort Colors (Dutch National Flag)",
    difficulty: "Medium",
    category: "Sorting",
    description: "Given an array `nums` with `n` objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue.\n\nWe will use the integers `0`, `1`, and `2` to represent the color red, white, and blue, respectively.\n\nYou must solve this problem without using the library's sort function and in one pass with O(1) extra memory.",
    inputFormat: "A single line containing space-separated integers (0, 1, or 2).",
    outputFormat: "A single line of space-separated integers in sorted order.",
    constraints: ["n == nums.length", "1 <= n <= 300", "nums[i] is either 0, 1, or 2."],
    examples: [
      { input: "2 0 2 1 1 0", output: "0 0 1 1 2 2", explanation: "All 0s first, followed by 1s, followed by 2s." },
      { input: "2 0 1", output: "0 1 2", explanation: "Sorted in three partitions." }
    ],
    hints: [
      "Dijkstra's Dutch National Flag partition algorithm uses three pointers: low, mid, and high.",
      "If nums[mid] == 0: swap(nums[low], nums[mid]), low++, mid++.",
      "If nums[mid] == 1: mid++.",
      "If nums[mid] == 2: swap(nums[mid], nums[high]), high--."
    ],
    objective: "Partition three distinct keys in-place in linear time with zero auxiliary memory.",
    conceptualExplanation: [
      "Step 1: Set low = 0, mid = 0, high = n - 1.",
      "Step 2: While mid <= high, inspect nums[mid].",
      "Step 3: If 0: swap nums[low] and nums[mid], low++, mid++.",
      "Step 4: If 1: mid++; If 2: swap nums[mid] and nums[high], high--.",
      "Step 5: Output sorted nums space-separated."
    ],
    testInputs: [
      "2 0 2 1 1 0", "2 0 1", "0", "1", "2",
      "1 0 2", "0 0 0", "2 2 2", "1 2 0 1 2 0", "2 1 0 2 1 0"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let low = 0, mid = 0, high = nums.length - 1;
      while (mid <= high) {
        if (nums[mid] === 0) {
          [nums[low], nums[mid]] = [nums[mid], nums[low]];
          low++; mid++;
        } else if (nums[mid] === 1) mid++;
        else {
          [nums[mid], nums[high]] = [nums[high], nums[mid]];
          high--;
        }
      }
      return nums.join(" ");
    }
  }),

  makeChallenge({
    id: "ch_kth_largest_array",
    title: "Kth Largest Element in an Array",
    difficulty: "Medium",
    category: "Sorting",
    description: "Given an integer array `nums` and an integer `k`, return the `k`th largest element in the array.\n\nNote that it is the `k`th largest element in sorted order, not the `k`th distinct element.",
    inputFormat: "Line 1: Space-separated integers representing array nums.\nLine 2: Integer k.",
    outputFormat: "A single integer: the kth largest element.",
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "3 2 1 5 6 4\n2", output: "5", explanation: "The 2nd largest element in [1, 2, 3, 4, 5, 6] is 5." },
      { input: "3 2 3 1 2 4 5 5 6\n4", output: "4", explanation: "The 4th largest element is 4." }
    ],
    hints: [
      "Quickselect algorithm finds kth largest in average O(n) time.",
      "Alternatively, maintain a min-heap of size k: the root will hold the kth largest element.",
      "Sorting descending puts kth largest at index k - 1."
    ],
    objective: "Select order statistic k from unsorted numbers with optimal partitioning.",
    conceptualExplanation: [
      "Step 1: Read array and integer k.",
      "Step 2: Sort array in descending order.",
      "Step 3: Access element at index k - 1.",
      "Step 4: Output value to standard output."
    ],
    testInputs: [
      "3 2 1 5 6 4\n2", "3 2 3 1 2 4 5 5 6\n4", "1\n1", "7 10 4 3 20 15\n3", "7 10 4 3 20 15\n4",
      "-1 2 0\n1", "-1 -2 -3 -4\n2", "1 2 3 4 5 6\n1", "1 2 3 4 5 6\n6", "100 50 150 200\n3"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const k = parseInt(lines[1].trim(), 10);
      nums.sort((a, b) => b - a);
      return String(nums[k - 1]);
    }
  }),

  makeChallenge({
    id: "ch_non_overlapping_intervals",
    title: "Non-overlapping Intervals Min Removal",
    difficulty: "Medium",
    category: "Sorting",
    description: "Given an array of intervals `intervals` where `intervals[i] = [start_i, end_i]`, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
    inputFormat: "Line 1: Integer n (number of intervals).\nNext n lines: Two space-separated integers start and end.",
    outputFormat: "A single integer: minimum intervals removed.",
    constraints: ["1 <= n <= 10^5", "-5 * 10^4 <= start_i < end_i <= 5 * 10^4"],
    examples: [
      { input: "4\n1 2\n2 3\n3 4\n1 3", output: "1", explanation: "[1,3] can be removed and the rest are non-overlapping." },
      { input: "3\n1 2\n1 2\n1 2", output: "2", explanation: "You need to remove two [1,2] to leave one interval." }
    ],
    hints: [
      "This is equivalent to finding the maximum number of mutually compatible intervals (Interval Scheduling).",
      "Sort intervals by end time in ascending order.",
      "Greedily select intervals that end earliest without overlapping previously chosen interval."
    ],
    objective: "Minimize removed interval count by maximizing non-conflicting schedule.",
    conceptualExplanation: [
      "Step 1: Read n intervals.",
      "Step 2: Sort intervals ascending by end coordinate.",
      "Step 3: Track end of last kept interval initialized to -Infinity.",
      "Step 4: For each interval: if start >= end, update end = interval.end; else removeCount++.",
      "Step 5: Output removeCount."
    ],
    testInputs: [
      "4\n1 2\n2 3\n3 4\n1 3", "3\n1 2\n1 2\n1 2", "3\n1 2\n2 3\n3 4", "1\n1 2", "2\n1 10\n2 3",
      "4\n1 100\n11 22\n1 11\n2 12", "3\n1 3\n2 4\n3 5", "2\n1 2\n1 3", "4\n0 2\n1 3\n2 4\n3 5", "5\n1 2\n2 3\n3 4\n4 5\n1 5"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0].trim(), 10);
      const intervals = [];
      for (let i = 1; i <= n; i++) intervals.push(lines[i].trim().split(/\s+/).map(Number));
      intervals.sort((a, b) => a[1] - b[1]);
      let count = 0, end = -Infinity;
      for (const [s, e] of intervals) {
        if (s >= end) end = e;
        else count++;
      }
      return String(count);
    }
  }),

  // ================= 12. TREES =================
  makeChallenge({
    id: "ch_invert_binary_tree",
    title: "Invert Binary Tree Level Order",
    difficulty: "Easy",
    category: "Trees",
    description: "Given the root of a binary tree in level order representation, invert the tree (swap left and right subtrees recursively), and return its inverted level-order traversal.",
    inputFormat: "A single line containing space-separated integers/nulls representing level-order binary tree.",
    outputFormat: "A single line containing space-separated level-order nodes of the inverted tree.",
    constraints: ["0 <= number of nodes <= 100", "-100 <= Node.val <= 100"],
    examples: [
      { input: "4 2 7 1 3 6 9", output: "4 7 2 9 6 3 1", explanation: "Left child 2 and right child 7 swap, and their children swap respectively." },
      { input: "2 1 3", output: "2 3 1", explanation: "Subtrees 1 and 3 swap." }
    ],
    hints: [
      "To invert a node, swap its left and right child pointers.",
      "Recursively invert the left subtree and right subtree.",
      "Serialize the resulting tree back to level order."
    ],
    objective: "Mirror left and right child branches across every hierarchy level.",
    conceptualExplanation: [
      "Step 1: Deserialize input level-order array into a Binary Tree.",
      "Step 2: Recursive invert function swaps node.left and node.right.",
      "Step 3: Call invert on root.left and root.right.",
      "Step 4: BFS queue serializes tree back to level-order array.",
      "Step 5: Trim trailing nulls and output space-separated."
    ],
    testInputs: [
      "4 2 7 1 3 6 9", "2 1 3", "1", "1 2 null", "1 null 2",
      "3 1 4 null 2", "1 2 3 4 5 6 7", "5 3 8 1 4", "10 5 15", "8 4 12 2 6 10 14"
    ],
    solver: (input) => {
      const tokens = input.trim().split(/\s+/).filter(Boolean);
      if (!tokens.length) return "";
      class TreeNode {
        constructor(val) { this.val = val; this.left = null; this.right = null; }
      }
      const root = new TreeNode(tokens[0]);
      const queue = [root];
      let i = 1;
      while (queue.length && i < tokens.length) {
        const node = queue.shift();
        if (tokens[i] !== "null" && tokens[i] !== undefined) {
          node.left = new TreeNode(tokens[i]);
          queue.push(node.left);
        }
        i++;
        if (i < tokens.length && tokens[i] !== "null" && tokens[i] !== undefined) {
          node.right = new TreeNode(tokens[i]);
          queue.push(node.right);
        }
        i++;
      }
      const invert = (node) => {
        if (!node) return;
        const tmp = node.left; node.left = node.right; node.right = tmp;
        invert(node.left); invert(node.right);
      };
      invert(root);
      const res = [];
      const q = [root];
      while (q.length) {
        const cur = q.shift();
        if (cur) {
          res.push(cur.val);
          q.push(cur.left);
          q.push(cur.right);
        } else res.push("null");
      }
      while (res[res.length - 1] === "null") res.pop();
      return res.join(" ");
    }
  }),

  makeChallenge({
    id: "ch_max_depth_binary_tree",
    title: "Maximum Depth of Binary Tree",
    difficulty: "Easy",
    category: "Trees",
    description: "Given the root of a binary tree in level order, return its maximum depth.\n\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    inputFormat: "A single line containing space-separated node values in level order ('null' for missing nodes).",
    outputFormat: "A single integer: maximum tree depth.",
    constraints: ["0 <= number of nodes <= 10^4", "-100 <= Node.val <= 100"],
    examples: [
      { input: "3 9 20 null null 15 7", output: "3", explanation: "Path 3 -> 20 -> 15 has length 3." },
      { input: "1 null 2", output: "2", explanation: "Depth is 2." }
    ],
    hints: [
      "The depth of a tree is 1 + max(depth(left), depth(right)).",
      "Base case: an empty tree (null) has depth 0."
    ],
    objective: "Compute vertical height of binary tree using depth-first tree traversal.",
    conceptualExplanation: [
      "Step 1: Deserialize tree from level-order tokens.",
      "Step 2: Recursive function getDepth(node): if !node return 0.",
      "Step 3: Return 1 + max(getDepth(node.left), getDepth(node.right)).",
      "Step 4: Output computed depth integer."
    ],
    testInputs: [
      "3 9 20 null null 15 7", "1 null 2", "1", "1 2 3 4 5", "1 2 null 3 null 4",
      "1 2 3 4 null null 5", "1 2 3 4 5 6 7", "1 null 2 null 3 null 4 null 5", "2 3", "5 4 8 11 null 13 4 7 2"
    ],
    solver: (input) => {
      const tokens = input.trim().split(/\s+/).filter(Boolean);
      if (!tokens.length) return "0";
      class TreeNode {
        constructor(val) { this.val = val; this.left = null; this.right = null; }
      }
      const root = new TreeNode(tokens[0]);
      const queue = [root];
      let i = 1;
      while (queue.length && i < tokens.length) {
        const node = queue.shift();
        if (tokens[i] !== "null" && tokens[i] !== undefined) {
          node.left = new TreeNode(tokens[i]);
          queue.push(node.left);
        }
        i++;
        if (i < tokens.length && tokens[i] !== "null" && tokens[i] !== undefined) {
          node.right = new TreeNode(tokens[i]);
          queue.push(node.right);
        }
        i++;
      }
      const getDepth = (node) => (!node ? 0 : 1 + Math.max(getDepth(node.left), getDepth(node.right)));
      return String(getDepth(root));
    }
  }),

  makeChallenge({
    id: "ch_validate_bst",
    title: "Validate Binary Search Tree",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a binary tree in level order, determine if it is a valid binary search tree (BST).\n\nA valid BST is defined as follows: the left subtree of a node contains only nodes with keys strictly less than the node's key; the right subtree contains only nodes with keys strictly greater; both left and right subtrees must also be binary search trees.",
    inputFormat: "A single line containing space-separated level-order node values ('null' for absent).",
    outputFormat: "A single line with 'true' if valid BST, or 'false' otherwise.",
    constraints: ["0 <= number of nodes <= 10^4", "-2^31 <= Node.val <= 2^31 - 1"],
    examples: [
      { input: "2 1 3", output: "true", explanation: "Root 2 has left child 1 (< 2) and right child 3 (> 2)." },
      { input: "5 1 4 null null 3 6", output: "false", explanation: "Root value 5 has right child 4 which violates BST property." }
    ],
    hints: [
      "Every node must satisfy a valid range [min, max].",
      "Root starts with range (-Infinity, Infinity).",
      "Left child must satisfy (min, node.val); right child must satisfy (node.val, max)."
    ],
    objective: "Verify global monotonic ordering invariant across all hierarchical tree subtrees.",
    conceptualExplanation: [
      "Step 1: Deserialize binary tree.",
      "Step 2: Recursive helper validate(node, min, max): if !node return true.",
      "Step 3: If node.val <= min or node.val >= max, return false.",
      "Step 4: Recurse: validate(node.left, min, node.val) && validate(node.right, node.val, max).",
      "Step 5: Output 'true' or 'false'."
    ],
    testInputs: [
      "2 1 3", "5 1 4 null null 3 6", "1", "2 2 2", "10 5 15 null null 6 20",
      "3 2 5 1 4", "5 3 7 2 4 6 8", "1 2", "2 1", "4 2 6 1 3 5 7"
    ],
    solver: (input) => {
      const tokens = input.trim().split(/\s+/).filter(Boolean);
      if (!tokens.length) return "true";
      class TreeNode {
        constructor(val) { this.val = val === "null" ? null : parseInt(val, 10); this.left = null; this.right = null; }
      }
      const root = new TreeNode(tokens[0]);
      const queue = [root];
      let i = 1;
      while (queue.length && i < tokens.length) {
        const node = queue.shift();
        if (tokens[i] !== "null" && tokens[i] !== undefined) {
          node.left = new TreeNode(tokens[i]);
          queue.push(node.left);
        }
        i++;
        if (i < tokens.length && tokens[i] !== "null" && tokens[i] !== undefined) {
          node.right = new TreeNode(tokens[i]);
          queue.push(node.right);
        }
        i++;
      }
      const validate = (node, min, max) => {
        if (!node) return true;
        if (node.val <= min || node.val >= max) return false;
        return validate(node.left, min, node.val) && validate(node.right, node.val, max);
      };
      return validate(root, -Infinity, Infinity) ? "true" : "false";
    }
  }),

  makeChallenge({
    id: "ch_lca_binary_tree",
    title: "Lowest Common Ancestor of Binary Tree",
    difficulty: "Medium",
    category: "Trees",
    description: "Given a binary tree in level order, find the lowest common ancestor (LCA) of two given nodes `p` and `q`.\n\nThe lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow a node to be a descendant of itself).",
    inputFormat: "Line 1: Space-separated level-order node values ('null' for missing).\nLine 2: Value p.\nLine 3: Value q.",
    outputFormat: "A single integer: value of the LCA node.",
    constraints: ["The number of nodes in the tree is in the range [2, 10^5].", "-10^9 <= Node.val <= 10^9", "All Node.val are unique.", "p != q", "p and q exist in the tree."],
    examples: [
      { input: "3 5 1 6 2 0 8 null null 7 4\n5\n1", output: "3", explanation: "LCA of 5 and 1 is 3." },
      { input: "3 5 1 6 2 0 8 null null 7 4\n5\n4", output: "5", explanation: "LCA of 5 and 4 is 5, since a node can be descendant of itself." }
    ],
    hints: [
      "Use post-order traversal: if current node is null, p, or q, return current node.",
      "Recurse on left and right subtrees.",
      "If both left and right return non-null, current node is the LCA. Otherwise return whichever subtree returned non-null."
    ],
    objective: "Identify the deepest shared ancestor node of two tree elements.",
    conceptualExplanation: [
      "Step 1: Parse tree and targets p, q.",
      "Step 2: Helper lca(node, p, q): if !node or node.val == p or node.val == q, return node.",
      "Step 3: left = lca(node.left, p, q); right = lca(node.right, p, q).",
      "Step 4: If left && right, return node; else return left || right.",
      "Step 5: Output LCA value."
    ],
    testInputs: [
      "3 5 1 6 2 0 8 null null 7 4\n5\n1", "3 5 1 6 2 0 8 null null 7 4\n5\n4", "1 2\n1\n2",
      "6 2 8 0 4 7 9\n2\n8", "6 2 8 0 4 7 9\n2\n4", "2 1 3\n1\n3", "3 5 1 6 2 0 8\n6\n2",
      "3 5 1 6 2 0 8\n7\n8", "1 2 3\n2\n3", "5 3 6 2 4\n2\n4"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const tokens = lines[0].trim().split(/\s+/).filter(Boolean);
      const p = parseInt(lines[1].trim(), 10);
      const q = parseInt(lines[2].trim(), 10);
      class TreeNode {
        constructor(val) { this.val = parseInt(val, 10); this.left = null; this.right = null; }
      }
      const root = new TreeNode(tokens[0]);
      const queue = [root];
      let i = 1;
      while (queue.length && i < tokens.length) {
        const node = queue.shift();
        if (tokens[i] !== "null" && tokens[i] !== undefined) {
          node.left = new TreeNode(tokens[i]);
          queue.push(node.left);
        }
        i++;
        if (i < tokens.length && tokens[i] !== "null" && tokens[i] !== undefined) {
          node.right = new TreeNode(tokens[i]);
          queue.push(node.right);
        }
        i++;
      }
      const lca = (node, v1, v2) => {
        if (!node) return null;
        if (node.val === v1 || node.val === v2) return node;
        const left = lca(node.left, v1, v2);
        const right = lca(node.right, v1, v2);
        if (left && right) return node;
        return left || right;
      };
      const ans = lca(root, p, q);
      return ans ? String(ans.val) : "";
    }
  }),

  // ================= 13. GRAPHS =================
  makeChallenge({
    id: "ch_number_of_islands",
    title: "Number of Islands",
    difficulty: "Medium",
    category: "Graphs",
    description: "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
    inputFormat: "Line 1: Two integers m and n (rows and columns).\nNext m lines: n space-separated characters ('1' or '0').",
    outputFormat: "A single integer: number of distinct islands.",
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300", "grid[i][j] is '0' or '1'."],
    examples: [
      { input: "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", output: "1", explanation: "All land cells form 1 single connected island." },
      { input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", output: "3", explanation: "Grid has 3 disconnected islands." }
    ],
    hints: [
      "Traverse every cell in the grid.",
      "When encountering a '1', increment island count and initiate DFS/BFS to sink all connected land cells by marking them '0'.",
      "Total number of initiated traversals equals the number of islands."
    ],
    objective: "Identify connected components in an unweighted grid graph using flood fill.",
    conceptualExplanation: [
      "Step 1: Read dimensions m, n and grid cells.",
      "Step 2: Initialize count = 0.",
      "Step 3: Define dfs(r, c): if out of bounds or grid[r][c] != '1', return; set grid[r][c] = '0'; recurse 4 directions.",
      "Step 4: Loop through all cells (r, c): if grid[r][c] == '1', count++ and dfs(r, c).",
      "Step 5: Output count."
    ],
    testInputs: [
      "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
      "1 1\n1", "1 1\n0", "2 2\n1 0\n0 1", "3 3\n1 1 1\n0 1 0\n1 1 1", "3 3\n1 0 1\n0 1 0\n1 0 1",
      "1 4\n1 0 1 0", "4 1\n1\n0\n1\n0", "3 3\n0 0 0\n0 0 0\n0 0 0"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const grid = [];
      for (let i = 1; i <= m; i++) grid.push(lines[i].trim().split(/\s+/));
      let count = 0;
      const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== "1") return;
        grid[r][c] = "0";
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
      };
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] === "1") { count++; dfs(r, c); }
        }
      }
      return String(count);
    }
  }),

  makeChallenge({
    id: "ch_clone_graph",
    title: "Graph Node Reachability Count",
    difficulty: "Medium",
    category: "Graphs",
    description: "Given an undirected connected graph with `n` nodes labeled `1` to `n` and `m` edges, count the total reachable nodes and edges from node `1`.\n\nOutput two space-separated integers: reachable node count and total edge count.",
    inputFormat: "Line 1: Two integers n and m.\nNext m lines: Two space-separated integers u and v representing an undirected edge.",
    outputFormat: "Two space-separated integers: reachable node count and total edge count.",
    constraints: ["1 <= n <= 100", "0 <= m <= 500", "1 <= u, v <= n"],
    examples: [
      { input: "4 4\n1 2\n2 3\n3 4\n4 1", output: "4 4", explanation: "All 4 nodes are connected in a cycle with 4 edges." },
      { input: "2 1\n1 2", output: "2 1", explanation: "2 nodes connected by 1 edge." }
    ],
    hints: [
      "Build an adjacency list from the edge list.",
      "Use BFS or DFS starting at node 1 to discover all reachable vertices.",
      "Return the size of the visited set along with m."
    ],
    objective: "Execute complete connected component graph discovery starting from vertex 1.",
    conceptualExplanation: [
      "Step 1: Read n and m.",
      "Step 2: Construct undirected adjacency graph.",
      "Step 3: Run DFS from node 1, tracking visited set.",
      "Step 4: Output visited.size and m separated by space."
    ],
    testInputs: [
      "4 4\n1 2\n2 3\n3 4\n4 1", "2 1\n1 2", "1 0", "3 3\n1 2\n2 3\n3 1", "4 3\n1 2\n1 3\n1 4",
      "5 4\n1 2\n2 3\n3 4\n4 5", "5 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 3", "3 2\n1 2\n2 3", "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4", "2 0"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const [n, m] = lines[0].trim().split(/\s+/).map(Number);
      const adj = new Map();
      for (let i = 1; i <= n; i++) adj.set(i, []);
      for (let i = 1; i <= m; i++) {
        const [u, v] = lines[i].trim().split(/\s+/).map(Number);
        adj.get(u).push(v); adj.get(v).push(u);
      }
      const visited = new Set();
      const dfs = (node) => {
        visited.add(node);
        for (const nxt of adj.get(node) || []) {
          if (!visited.has(nxt)) dfs(nxt);
        }
      };
      if (n > 0) dfs(1);
      return `${visited.size} ${m}`;
    }
  }),

  makeChallenge({
    id: "ch_course_schedule",
    title: "Course Schedule Cycle Detection",
    difficulty: "Medium",
    category: "Graphs",
    description: "There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [a_i, b_i]` indicates that you must take course `b_i` first if you want to take course `a_i`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.",
    inputFormat: "Line 1: Two integers numCourses and numPrerequisites.\nNext numPrerequisites lines: Two space-separated integers course a and prerequisite b.",
    outputFormat: "A single line with 'true' or 'false'.",
    constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= 5000", "All prerequisite pairs are unique."],
    examples: [
      { input: "2 1\n1 0", output: "true", explanation: "Take course 0 then course 1." },
      { input: "2 2\n1 0\n0 1", output: "false", explanation: "Cyclic dependency between course 0 and 1." }
    ],
    hints: [
      "This is cycle detection in a directed graph using Topological Sort (Kahn's Algorithm).",
      "Calculate in-degrees for each vertex. Queue all vertices with in-degree 0.",
      "Pop from queue, decrement neighbors' in-degrees, and queue any that reach 0.",
      "If total processed vertices equals numCourses, graph is acyclic (return true)."
    ],
    objective: "Detect cyclical dependency deadlocks in directed precedence graphs.",
    conceptualExplanation: [
      "Step 1: Build adjacency list and inDegree array of size numCourses.",
      "Step 2: Add all courses with inDegree == 0 to queue.",
      "Step 3: While queue is non-empty, pop course, increment processed count, decrement inDegree of dependent courses.",
      "Step 4: If a dependent reaches inDegree 0, push to queue.",
      "Step 5: Output 'true' if processedCount == numCourses, else 'false'."
    ],
    testInputs: [
      "2 1\n1 0", "2 2\n1 0\n0 1", "1 0", "3 2\n1 0\n2 1", "3 3\n1 0\n2 1\n0 2",
      "4 4\n1 0\n2 0\n3 1\n3 2", "4 4\n1 0\n2 1\n3 2\n1 3", "5 4\n1 0\n2 1\n3 2\n4 3", "3 1\n0 1", "2 1\n0 1"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const [numCourses, numPrereqs] = lines[0].trim().split(/\s+/).map(Number);
      const inDegree = new Array(numCourses).fill(0);
      const adj = Array.from({ length: numCourses }, () => []);
      for (let i = 1; i <= numPrereqs; i++) {
        const [c, p] = lines[i].trim().split(/\s+/).map(Number);
        adj[p].push(c); inDegree[c]++;
      }
      const q = [];
      for (let i = 0; i < numCourses; i++) { if (inDegree[i] === 0) q.push(i); }
      let visited = 0;
      while (q.length) {
        const u = q.shift();
        visited++;
        for (const v of adj[u]) {
          inDegree[v]--;
          if (inDegree[v] === 0) q.push(v);
        }
      }
      return visited === numCourses ? "true" : "false";
    }
  }),

  makeChallenge({
    id: "ch_rotting_oranges",
    title: "Rotting Oranges Multi-Source BFS",
    difficulty: "Medium",
    category: "Graphs",
    description: "You are given an `m x n` grid where each cell can have one of three values:\n• `0` representing an empty cell,\n• `1` representing a fresh orange, or\n• `2` representing a rotten orange.\n\nEvery minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.\n\nReturn the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return `-1`.",
    inputFormat: "Line 1: Two integers m and n.\nNext m lines: n space-separated integers (0, 1, or 2).",
    outputFormat: "A single integer: minimum minutes, or -1.",
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 10", "grid[i][j] is 0, 1, or 2."],
    examples: [
      { input: "3 3\n2 1 1\n1 1 0\n0 1 1", output: "4", explanation: "All fresh oranges rot in 4 minutes." },
      { input: "3 3\n2 1 1\n0 1 1\n1 0 1", output: "-1", explanation: "Orange in bottom-left corner never rots." },
      { input: "1 2\n0 2", output: "0", explanation: "Since there are already 0 fresh oranges at minute 0, the answer is just 0." }
    ],
    hints: [
      "Use Multi-source Breadth-First Search (BFS).",
      "Initialize queue with all coordinates containing rotten oranges (value 2) and time 0.",
      "Count total fresh oranges initially. Decrement count whenever an orange rots.",
      "If fresh oranges remaining is 0, return elapsed time; else return -1."
    ],
    objective: "Model epidemic propagation across grid graph using multi-source BFS.",
    conceptualExplanation: [
      "Step 1: Queue all rotten oranges [r, c, 0] and count fresh oranges.",
      "Step 2: If fresh == 0, return 0 immediately.",
      "Step 3: Run BFS: pop [r, c, t], infect 4-direction neighbors with value 1, set them to 2, fresh--, push [nr, nc, t + 1].",
      "Step 4: Keep track of maximum time elapsed.",
      "Step 5: Return fresh == 0 ? maxTime : -1."
    ],
    testInputs: [
      "3 3\n2 1 1\n1 1 0\n0 1 1", "3 3\n2 1 1\n0 1 1\n1 0 1", "1 2\n0 2", "1 1\n1", "1 1\n2",
      "2 2\n2 1\n1 2", "1 3\n2 1 1", "3 1\n2\n1\n1", "2 3\n2 1 1\n1 1 2", "3 3\n1 1 1\n1 2 1\n1 1 1"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const grid = [], q = [];
      let fresh = 0;
      for (let r = 0; r < m; r++) {
        const row = lines[r + 1].trim().split(/\s+/).map(Number);
        grid.push(row);
        for (let c = 0; c < n; c++) {
          if (row[c] === 2) q.push([r, c, 0]);
          else if (row[c] === 1) fresh++;
        }
      }
      let minutes = 0;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      while (q.length) {
        const [r, c, time] = q.shift();
        minutes = Math.max(minutes, time);
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === 1) {
            grid[nr][nc] = 2; fresh--;
            q.push([nr, nc, time + 1]);
          }
        }
      }
      return fresh === 0 ? String(minutes) : "-1";
    }
  }),

  // ================= 14. GREEDY =================
  makeChallenge({
    id: "ch_jump_game",
    title: "Jump Game Reachability",
    difficulty: "Medium",
    category: "Greedy",
    description: "You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn `true` if you can reach the last index, or `false` otherwise.",
    inputFormat: "A single line containing space-separated integers.",
    outputFormat: "A single line with 'true' or 'false'.",
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
    examples: [
      { input: "2 3 1 1 4", output: "true", explanation: "Jump 1 step from index 0 to 1, then 3 steps to the last index." },
      { input: "3 2 1 0 4", output: "false", explanation: "You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index." }
    ],
    hints: [
      "Keep track of the furthest index you can reach so far (maxReach).",
      "Iterate through the array: if current index > maxReach, you cannot proceed (return false).",
      "Update maxReach = max(maxReach, i + nums[i]). If maxReach >= n - 1, return true."
    ],
    objective: "Ascertain destination reachability by maintaining the optimal greedy frontier.",
    conceptualExplanation: [
      "Step 1: Read array nums.",
      "Step 2: Initialize maxReach = 0.",
      "Step 3: Loop i from 0 to n - 1: if i > maxReach, return 'false'.",
      "Step 4: Update maxReach = max(maxReach, i + nums[i]).",
      "Step 5: Return 'true'."
    ],
    testInputs: [
      "2 3 1 1 4", "3 2 1 0 4", "0", "2 0 0", "1 1 1 1",
      "0 2 3", "1 2 3", "2 5 0 0", "1 0 1 0", "1 1 0 1"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let max = 0;
      for (let i = 0; i < nums.length; i++) {
        if (i > max) return "false";
        max = Math.max(max, i + nums[i]);
      }
      return "true";
    }
  }),

  makeChallenge({
    id: "ch_gas_station",
    title: "Gas Station Circuit",
    difficulty: "Medium",
    category: "Greedy",
    description: "There are `n` gas stations along a circular route, where the amount of gas at the `i`th station is `gas[i]`.\n\nYou have a car with an unlimited gas tank and it costs `cost[i]` of gas to travel from the `i`th station to its next `(i + 1)`th station. You begin the journey with an empty tank at one of the gas stations.\n\nGiven two integer arrays `gas` and `cost`, return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return `-1`.\n\nIf there exists a solution, it is guaranteed to be unique.",
    inputFormat: "Line 1: Space-separated integers representing gas.\nLine 2: Space-separated integers representing cost.",
    outputFormat: "A single integer: starting index or -1.",
    constraints: ["n == gas.length == cost.length", "1 <= n <= 10^5", "0 <= gas[i], cost[i] <= 10^4"],
    examples: [
      { input: "1 2 3 4 5\n3 4 5 1 2", output: "3", explanation: "Start at station 3 (index 3). Fill with 4 gas. Travel to station 4. Tank = 4 - 1 + 5 = 8. And so on around." },
      { input: "2 3 4\n3 4 3", output: "-1", explanation: "Total gas (9) is less than total cost (10), so completing the circuit is impossible." }
    ],
    hints: [
      "If the sum of all gas is strictly less than the sum of all cost, completing the circuit is impossible (-1).",
      "If running tank becomes negative starting from candidate station, reset start to i + 1 and reset current tank to 0.",
      "The final candidate is guaranteed to be the unique solution."
    ],
    objective: "Determine starting position for circular circuit without fuel deficit in O(n).",
    conceptualExplanation: [
      "Step 1: Read gas and cost arrays.",
      "Step 2: Initialize totalTank = 0, currTank = 0, start = 0.",
      "Step 3: For i from 0 to n - 1: diff = gas[i] - cost[i]; totalTank += diff; currTank += diff.",
      "Step 4: If currTank < 0, start = i + 1 and currTank = 0.",
      "Step 5: Return totalTank >= 0 ? start : -1."
    ],
    testInputs: [
      "1 2 3 4 5\n3 4 5 1 2", "2 3 4\n3 4 3", "5 1 2 3 4\n4 4 1 5 1", "2\n2", "3 1 1\n1 2 2",
      "4 5 2 6 5 3\n3 2 7 3 2 9", "1 2\n2 1", "5 8 2 8\n6 5 6 6", "3 3 4\n3 4 4", "6 1 4 3 5\n3 8 2 4 2"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const gas = lines[0].trim().split(/\s+/).map(Number);
      const cost = lines[1].trim().split(/\s+/).map(Number);
      let totalTank = 0, currTank = 0, start = 0;
      for (let i = 0; i < gas.length; i++) {
        const diff = gas[i] - cost[i];
        totalTank += diff;
        currTank += diff;
        if (currTank < 0) { start = i + 1; currTank = 0; }
      }
      return totalTank >= 0 ? String(start) : "-1";
    }
  }),

  makeChallenge({
    id: "ch_assign_cookies",
    title: "Assign Cookies to Children",
    difficulty: "Easy",
    category: "Greedy",
    description: "Assume you are an awesome parent and want to give your children some cookies. But, you should give each child at most one cookie.\n\nEach child `i` has a greed factor `g[i]`, which is the minimum size of a cookie that the child will be content with; and each cookie `j` has a size `s[j]`. If `s[j] >= g[i]`, we can assign the cookie `j` to the child `i`, and the child `i` will be content.\n\nYour goal is to maximize the number of your content children and output the maximum number.",
    inputFormat: "Line 1: Space-separated integers for children greed factors g.\nLine 2: Space-separated integers for cookie sizes s.",
    outputFormat: "A single integer: maximum content children count.",
    constraints: ["1 <= g.length <= 3 * 10^4", "0 <= s.length <= 3 * 10^4", "1 <= g[i], s[j] <= 2^31 - 1"],
    examples: [
      { input: "1 2 3\n1 1", output: "1", explanation: "You have 3 children and 2 cookies. Both cookies have size 1. You can only make the child with greed factor 1 content." },
      { input: "1 2\n1 2 3", output: "2", explanation: "Both children can be satisfied." }
    ],
    hints: [
      "Sort both children greed array and cookie sizes array in ascending order.",
      "Use two pointers: match the smallest valid cookie that satisfies the least greedy child.",
      "Advance both pointers when a match occurs; advance only cookie pointer otherwise."
    ],
    objective: "Maximize satisfied client requests using greedy monotone sorting.",
    conceptualExplanation: [
      "Step 1: Read greed factors g and cookie sizes s.",
      "Step 2: Sort g and s in ascending order.",
      "Step 3: Pointers i = 0 (child), j = 0 (cookie).",
      "Step 4: While i < g.length and j < s.length: if s[j] >= g[i], i++; j++.",
      "Step 5: Output i (total content children)."
    ],
    testInputs: [
      "1 2 3\n1 1", "1 2\n1 2 3", "1 2 3\n3", "10 9 8 7\n5 6 7 8", "1 2 3\n1 2 3",
      "5\n1 2 3 4", "2 3 4\n1 1 1", "3 4 5\n6 7 8", "1 1\n1 1 1", "1 2 3 4 5\n5"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const g = lines[0].trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      const s = lines[1].trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      let i = 0, j = 0;
      while (i < g.length && j < s.length) {
        if (s[j] >= g[i]) i++;
        j++;
      }
      return String(i);
    }
  }),

  makeChallenge({
    id: "ch_partition_labels",
    title: "Partition String Labels",
    difficulty: "Medium",
    category: "Greedy",
    description: "You are given a string `s`. We want to partition the string into as many parts as possible so that each letter appears in at most one part.\n\nNote that the partition is done so that after concatenating all the parts in order, the resultant string should be `s`.\n\nReturn a space-separated list of integers representing the size of these parts.",
    inputFormat: "A single line containing the string s.",
    outputFormat: "A single line of space-separated integers representing partition sizes.",
    constraints: ["1 <= s.length <= 500", "s consists of lowercase English letters."],
    examples: [
      { input: "ababcbacadefegdehijhklij", output: "9 7 8", explanation: "Partitions are 'ababcbaca' (size 9), 'defegde' (size 7), 'hijhklij' (size 8)." },
      { input: "eccbbbbdec", output: "10", explanation: "Only one partition containing all characters." }
    ],
    hints: [
      "First record the last occurrence index of each character in s.",
      "Iterate through the string: maintain the furthest boundary `end = max(end, last[char])`.",
      "When the current index equals `end`, you have found a partition cut point."
    ],
    objective: "Disjointly partition a sequence such that distinct character alphabets are self-contained.",
    conceptualExplanation: [
      "Step 1: Map each character to its last index in string s.",
      "Step 2: Maintain start = 0, end = 0, and result array.",
      "Step 3: Loop i from 0 to length - 1: update end = max(end, last[s[i]]).",
      "Step 4: If i == end: push (end - start + 1) to result; start = i + 1.",
      "Step 5: Output result joined by spaces."
    ],
    testInputs: [
      "ababcbacadefegdehijhklij", "eccbbbbdec", "a", "ab", "aba",
      "abc", "caedbdedda", "vhaflvhcsiadjcalculate", "qiejxqjaqii", "abcdefghijklmnopqrstuvwxyz"
    ],
    solver: (input) => {
      const s = input.trim();
      const last = {};
      for (let i = 0; i < s.length; i++) last[s[i]] = i;
      const res = [];
      let start = 0, end = 0;
      for (let i = 0; i < s.length; i++) {
        end = Math.max(end, last[s[i]]);
        if (i === end) {
          res.push(end - start + 1);
          start = i + 1;
        }
      }
      return res.join(" ");
    }
  }),

  // ================= 15. DYNAMIC PROGRAMMING =================
  makeChallenge({
    id: "ch_climbing_stairs",
    title: "Climbing Stairs Ways",
    difficulty: "Easy",
    category: "Dynamic Programming",
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
    inputFormat: "A single line containing the integer n.",
    outputFormat: "A single integer: number of distinct ways.",
    constraints: ["1 <= n <= 45"],
    examples: [
      { input: "2", output: "2", explanation: "1 step + 1 step, or 2 steps." },
      { input: "3", output: "3", explanation: "1+1+1, 1+2, or 2+1." }
    ],
    hints: [
      "To reach step n, you can arrive from step n - 1 (1 step jump) or from step n - 2 (2 step jump).",
      "Recurrence relation: ways(n) = ways(n - 1) + ways(n - 2).",
      "This is identical to Fibonacci sequence with base cases ways(1) = 1, ways(2) = 2."
    ],
    objective: "Compute combination counts for multi-step transitions using state recurrence.",
    conceptualExplanation: [
      "Step 1: Read step count n.",
      "Step 2: Base cases: if n <= 2, return n.",
      "Step 3: Initialize a = 1, b = 2.",
      "Step 4: Loop from 3 to n: c = a + b, a = b, b = c.",
      "Step 5: Output b."
    ],
    testInputs: [
      "2", "3", "4", "1", "5", "6", "7", "8", "10", "15"
    ],
    solver: (input) => {
      const n = parseInt(input.trim(), 10);
      if (n <= 2) return String(n);
      let a = 1, b = 2;
      for (let i = 3; i <= n; i++) {
        const c = a + b; a = b; b = c;
      }
      return String(b);
    }
  }),

  makeChallenge({
    id: "ch_coin_change",
    title: "Coin Change Minimum Coins",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    inputFormat: "Line 1: Space-separated integers representing coin denominations.\nLine 2: Integer amount.",
    outputFormat: "A single integer: minimum number of coins, or -1.",
    constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
    examples: [
      { input: "1 2 5\n11", output: "3", explanation: "11 = 5 + 5 + 1 (3 coins)." },
      { input: "2\n3", output: "-1", explanation: "Amount 3 cannot be formed using only coin of 2." },
      { input: "1\n0", output: "0", explanation: "0 coins needed for amount 0." }
    ],
    hints: [
      "Use bottom-up DP where dp[i] is the minimum coins needed for amount i.",
      "Initialize dp array with Infinity, and dp[0] = 0.",
      "For each coin c, for each i from c to amount: dp[i] = min(dp[i], dp[i - c] + 1)."
    ],
    objective: "Solve unbounded knapsack variation to compute optimal coin combination.",
    conceptualExplanation: [
      "Step 1: Read coins array and amount.",
      "Step 2: Allocate dp array of size amount + 1 filled with Infinity, dp[0] = 0.",
      "Step 3: For coin in coins: loop i from coin to amount: dp[i] = min(dp[i], dp[i - coin] + 1).",
      "Step 4: If dp[amount] is Infinity, return -1.",
      "Step 5: Output dp[amount]."
    ],
    testInputs: [
      "1 2 5\n11", "2\n3", "1\n0", "1\n1", "1\n2",
      "2 5 10 1\n27", "186 419 83 408\n6249", "3 7 405 436\n8839", "2 4\n7", "1 5 10 25\n30"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const coins = lines[0].trim().split(/\s+/).map(Number);
      const amount = parseInt(lines[1].trim(), 10);
      const dp = new Array(amount + 1).fill(Infinity);
      dp[0] = 0;
      for (const c of coins) {
        for (let i = c; i <= amount; i++) {
          dp[i] = Math.min(dp[i], dp[i - c] + 1);
        }
      }
      return dp[amount] === Infinity ? "-1" : String(dp[amount]);
    }
  }),

  makeChallenge({
    id: "ch_longest_increasing_subseq",
    title: "Longest Increasing Subsequence",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\nA subsequence is an array that can be derived from another array by deleting some or no elements without changing the order of the remaining elements.",
    inputFormat: "A single line containing space-separated integers.",
    outputFormat: "A single integer: length of the LIS.",
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "10 9 2 5 3 7 101 18", output: "4", explanation: "The longest increasing subsequence is [2, 3, 7, 101], therefore the length is 4." },
      { input: "0 1 0 3 2 3", output: "4", explanation: "The LIS is [0, 1, 2, 3] with length 4." },
      { input: "7 7 7 7 7 7 7", output: "1", explanation: "Strictly increasing requires strictly greater elements." }
    ],
    hints: [
      "Dynamic programming solution: dp[i] is the length of the LIS ending at index i, computed in O(n^2).",
      "Patience sorting algorithm with binary search achieves O(n log n) by maintaining the smallest tail elements of all increasing subsequences of various lengths."
    ],
    objective: "Identify the maximum monotone ascending sequence length in an unsorted array.",
    conceptualExplanation: [
      "Step 1: Read array nums.",
      "Step 2: Maintain tails array.",
      "Step 3: For each x in nums, binary search for x in tails.",
      "Step 4: If x is greater than all elements, tails.push(x); else replace the element at the insertion point with x.",
      "Step 5: Output tails.length."
    ],
    testInputs: [
      "10 9 2 5 3 7 101 18", "0 1 0 3 2 3", "7 7 7 7 7 7 7", "1 3 6 7 9 4 10 5 6", "1",
      "4 10 4 3 8 9", "1 2 3 4 5", "5 4 3 2 1", "3 5 6 2 5 4 19 5 6 7 12", "2 2"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      if (!nums.length) return "0";
      const tails = [];
      for (const x of nums) {
        let l = 0, r = tails.length;
        while (l < r) {
          const mid = Math.floor((l + r) / 2);
          if (tails[mid] < x) l = mid + 1;
          else r = mid;
        }
        if (l === tails.length) tails.push(x);
        else tails[l] = x;
      }
      return String(tails.length);
    }
  }),

  makeChallenge({
    id: "ch_house_robber",
    title: "House Robber Maximum Loot",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.\n\nGiven an integer array `nums` representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.",
    inputFormat: "A single line containing space-separated integers representing money in each house.",
    outputFormat: "A single integer: maximum loot.",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    examples: [
      { input: "1 2 3 1", output: "4", explanation: "Rob house 1 (money = 1) and then rob house 3 (money = 3). Total amount you can rob = 1 + 3 = 4." },
      { input: "2 7 9 3 1", output: "12", explanation: "Rob house 1 (2), house 3 (9) and house 5 (1). Total loot = 2 + 9 + 1 = 12." }
    ],
    hints: [
      "At house i, you have two choices: rob house i (gaining nums[i] + max loot up to i - 2), or skip house i (keeping max loot up to i - 1).",
      "Recurrence: `dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])`.",
      "Optimize space to O(1) by maintaining two variables for the previous two houses."
    ],
    objective: "Optimize non-adjacent sequential selection to maximize aggregate reward.",
    conceptualExplanation: [
      "Step 1: Read house values.",
      "Step 2: Base cases: n == 0 -> 0, n == 1 -> nums[0].",
      "Step 3: Maintain prev2 = 0, prev1 = nums[0].",
      "Step 4: For i from 1 to n - 1: cur = max(prev1, prev2 + nums[i]); prev2 = prev1; prev1 = cur.",
      "Step 5: Output prev1."
    ],
    testInputs: [
      "1 2 3 1", "2 7 9 3 1", "2 1 1 2", "0", "10",
      "1 2", "2 1", "5 1 2 10 6 2", "1 3 1 3 100", "183 219 57 193 94 233 202 154 65 240 97 234 100 249 186 66 90 238 168 128"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      if (!nums.length) return "0";
      if (nums.length === 1) return String(nums[0]);
      let prev2 = 0, prev1 = nums[0];
      for (let i = 1; i < nums.length; i++) {
        const cur = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1; prev1 = cur;
      }
      return String(prev1);
    }
  })
];

module.exports = { part3Challenges };
