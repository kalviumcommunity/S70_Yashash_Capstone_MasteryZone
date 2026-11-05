/**
 * Part B: 50 Unique Algorithmic Challenges (51 - 100)
 * Each challenge includes an exact solver and 10 raw test inputs.
 */

const partB = [
  // 51. Search Insert Position
  {
    id: "ch_search_insert_position",
    title: "Search Insert Position",
    difficulty: "Easy",
    category: "Binary Search",
    description: "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order in O(log n) runtime complexity.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 <= nums[i], target <= 10^4", "nums contains distinct values sorted in ascending order."],
    inputFormat: "Line 1: Space-separated integers representing nums.\nLine 2: Single integer target.",
    outputFormat: "Index integer.",
    hints: ["Standard binary search. If target not found, return low pointer."],
    objective: "Find insert position in sorted array using binary search.",
    conceptualExplanation: ["low = 0, high = nums.length - 1.", "If nums[mid] === target, return mid.", "If nums[mid] < target, low = mid + 1, else high = mid - 1.", "Return low."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const target = parseInt(lines[1], 10);
      let l = 0, r = nums.length - 1;
      while (l <= r) {
        const mid = Math.floor(l + (r - l) / 2);
        if (nums[mid] === target) return String(mid);
        if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
      }
      return String(l);
    },
    rawInputs: [
      "1 3 5 6\n5",
      "1 3 5 6\n2",
      "1 3 5 6\n7",
      "1 3 5 6\n0",
      "1\n0",
      "1\n2",
      "1 2 4 6 8 10\n5",
      "2 4 6 8 10\n6",
      "10 20 30 40 50\n25",
      "5 10 15 20\n1"
    ]
  },

  // 52. Find Peak Element
  {
    id: "ch_find_peak_element",
    title: "Find Peak Element",
    difficulty: "Medium",
    category: "Binary Search",
    description: "A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array `nums`, find a peak element, and return its index. If the array contains multiple peaks, return the index to any of the peaks. You must write an algorithm that runs in O(log n) time.",
    constraints: ["1 <= nums.length <= 1000", "-2^31 <= nums[i] <= 2^31 - 1", "nums[i] != nums[i + 1] for all valid i."],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "Index of a peak element.",
    hints: ["If nums[mid] < nums[mid + 1], a peak must lie on the right."],
    objective: "Locate any local maximum in an unsorted array in O(log N) time.",
    conceptualExplanation: ["Binary search on slopes.", "If nums[mid] > nums[mid + 1], peak is at mid or to the left.", "Else peak is to the right.", "Converge to peak."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let l = 0, r = nums.length - 1;
      while (l < r) {
        const mid = Math.floor(l + (r - l) / 2);
        if (nums[mid] > nums[mid + 1]) r = mid;
        else l = mid + 1;
      }
      return String(l);
    },
    rawInputs: [
      "1 2 3 1",
      "1 2 1 3 5 6 4",
      "1",
      "1 2",
      "2 1",
      "1 3 2 4 5 3",
      "10 20 15 2 23 90 67",
      "5 10 20 15",
      "1 2 3 4 5 6",
      "6 5 4 3 2 1"
    ]
  },

  // 53. Search a 2D Matrix
  {
    id: "ch_search_2d_matrix",
    title: "Search a 2D Matrix",
    difficulty: "Medium",
    category: "Binary Search",
    description: "You are given an m x n integer matrix with the following two properties:\n1. Each row is sorted in non-decreasing order.\n2. The first integer of each row is greater than the last integer of the previous row.\nGiven an integer `target`, return `true` if target is in matrix or `false` otherwise in O(log(m * n)) time.",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 100", "-10^4 <= matrix[i][j], target <= 10^4"],
    inputFormat: "Line 1: Dimensions m and n\nNext m lines: n space-separated integers\nLast line: Single integer target",
    outputFormat: "true or false",
    hints: ["Treat 2D matrix as a flat 1D array of size m * n."],
    objective: "Binary search in row-major sorted 2D matrix.",
    conceptualExplanation: ["Map 1D index idx to (row = Math.floor(idx / n), col = idx % n).", "Binary search over [0, m * n - 1]."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) mat.push(lines[i].trim().split(/\s+/).map(Number));
      const target = parseInt(lines[m + 1], 10);
      let l = 0, r = m * n - 1;
      while (l <= r) {
        const mid = Math.floor(l + (r - l) / 2);
        const val = mat[Math.floor(mid / n)][mid % n];
        if (val === target) return "true";
        if (val < target) l = mid + 1;
        else r = mid - 1;
      }
      return "false";
    },
    rawInputs: [
      "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3",
      "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n13",
      "1 1\n42\n42",
      "1 1\n42\n7",
      "2 2\n1 2\n3 4\n4",
      "2 2\n1 2\n3 4\n0",
      "1 4\n1 3 5 7\n5",
      "4 1\n1\n3\n5\n7\n3",
      "3 3\n1 2 3\n4 5 6\n7 8 9\n10",
      "3 3\n1 2 3\n4 5 6\n7 8 9\n1"
    ]
  },

  // 54. Kth Smallest Element in a BST
  {
    id: "ch_kth_smallest_element_bst",
    title: "Kth Smallest Element in a BST",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a binary search tree (given as level-order or node values) and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree.",
    constraints: ["The number of nodes in the tree is n.", "1 <= k <= n <= 10^4", "0 <= Node.val <= 10^4"],
    inputFormat: "Line 1: Space-separated integers representing BST values.\nLine 2: Single integer k.",
    outputFormat: "A single integer representing the k-th smallest element.",
    hints: ["In-order traversal of a BST yields values in strictly ascending order."],
    objective: "Retrieve k-th smallest element using in-order traversal properties.",
    conceptualExplanation: ["In-order traversal of BST sorts values.", "Sort values ascending.", "Return k-1 indexed element."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      const k = parseInt(lines[1], 10);
      return String(nums[k - 1]);
    },
    rawInputs: [
      "3 1 4 2\n1",
      "5 3 6 2 4 1\n3",
      "1\n1",
      "2 1 3\n2",
      "10 5 15 3 7 12 18\n4",
      "10 5 15 3 7 12 18\n7",
      "4 2 6 1 3 5 7\n5",
      "50 20 80 10 30 70 90\n2",
      "8 4 12 2 6 10 14\n6",
      "100 50 150 25 75\n3"
    ]
  },

  // 55. Binary Tree Root-to-Leaf Paths
  {
    id: "ch_binary_tree_paths",
    title: "Binary Tree Root-to-Leaf Paths",
    difficulty: "Easy",
    category: "Trees",
    description: "Given a binary tree represented as parent-child nodes (or level-order list where root is first), return all root-to-leaf paths formatted as `node1->node2->node3`. Output paths on separate lines.",
    constraints: ["The number of nodes in the tree is in the range [1, 100].", "-100 <= Node.val <= 100"],
    inputFormat: "Line 1: Space-separated integers representing complete binary tree level order.",
    outputFormat: "Root-to-leaf paths on separate lines.",
    hints: ["DFS recursion carrying path string."],
    objective: "Enumerate all root-to-leaf traversal routes in a binary tree.",
    conceptualExplanation: ["Recursive DFS: path.push(node.val).", "If leaf node (no left or right child), record path.join('->').", "Recursively visit children."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const paths = [];
      const dfs = (idx, curr) => {
        if (idx >= nums.length) return;
        const val = nums[idx];
        const next = [...curr, val];
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;
        if (left >= nums.length && right >= nums.length) {
          paths.push(next.join("->"));
          return;
        }
        if (left < nums.length) dfs(left, next);
        if (right < nums.length) dfs(right, next);
      };
      dfs(0, []);
      return paths.join("\n");
    },
    rawInputs: [
      "1 2 3",
      "1 2 3 5",
      "1",
      "1 2",
      "1 2 3 4 5",
      "10 20 30 40 50 60 70",
      "5 3 8 2 4",
      "1 2 3 4 5 6",
      "7 8 9 10",
      "4 2 6 1 3 5 7"
    ]
  },

  // 56. Sum Root to Leaf Numbers
  {
    id: "ch_sum_root_to_leaf_numbers",
    title: "Sum Root to Leaf Numbers",
    difficulty: "Medium",
    category: "Trees",
    description: "You are given a binary tree containing digits from 0 to 9 only. Each root-to-leaf path in the tree represents a number. For example, the root-to-leaf path 1 -> 2 -> 3 represents the number 123. Return the total sum of all root-to-leaf numbers.",
    constraints: ["The number of nodes in the tree is in the range [1, 1000].", "0 <= Node.val <= 9"],
    inputFormat: "Line 1: Space-separated digits representing binary tree in level order.",
    outputFormat: "Total sum integer.",
    hints: ["Accumulate path value as curr = curr * 10 + val.", "At leaf, return curr. Else return sum of subtrees."],
    objective: "Compute sum of decimal representations of all root-to-leaf paths.",
    conceptualExplanation: ["DFS passing running number curr = curr * 10 + val.", "At leaf, add to total sum.", "Sum across all paths."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let total = 0;
      const dfs = (idx, curr) => {
        if (idx >= nums.length) return;
        const next = curr * 10 + nums[idx];
        const left = 2 * idx + 1, right = 2 * idx + 2;
        if (left >= nums.length && right >= nums.length) {
          total += next;
          return;
        }
        if (left < nums.length) dfs(left, next);
        if (right < nums.length) dfs(right, next);
      };
      dfs(0, 0);
      return String(total);
    },
    rawInputs: [
      "1 2 3",
      "4 9 0 5 1",
      "1",
      "1 0",
      "2 3 4 5",
      "1 2 3 4 5 6 7",
      "9 9 9",
      "3 1 4",
      "5 2 8 1 3",
      "1 0 1 0 1"
    ]
  },

  // 57. Path Sum III Matching Target
  {
    id: "ch_path_sum_iii",
    title: "Path Sum III Matching Target",
    difficulty: "Medium",
    category: "Trees",
    description: "Given the root of a binary tree and an integer `targetSum`, return the number of paths where the sum of the values along the path equals `targetSum`. The path does not need to start or end at the root or a leaf, but it must go downwards (i.e., traveling only from parent nodes to child nodes).",
    constraints: ["The number of nodes in the tree is in the range [0, 1000].", "-10^9 <= Node.val <= 10^9", "-1000 <= targetSum <= 1000"],
    inputFormat: "Line 1: Space-separated integers representing tree level order.\nLine 2: Single integer targetSum.",
    outputFormat: "Integer count of matching paths.",
    hints: ["Prefix sum hash map with DFS."],
    objective: "Count all downward paths summing to targetSum in binary tree.",
    conceptualExplanation: ["Maintain running prefix sum and hash map of prefix sum frequencies.", "At each node, matching paths ending here = map[currSum - targetSum].", "Backtrack hash map upon returning."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const target = parseInt(lines[1], 10);
      let count = 0;
      const prefix = new Map();
      prefix.set(0, 1);
      const dfs = (idx, currSum) => {
        if (idx >= nums.length) return;
        currSum += nums[idx];
        count += (prefix.get(currSum - target) || 0);
        prefix.set(currSum, (prefix.get(currSum) || 0) + 1);
        const l = 2 * idx + 1, r = 2 * idx + 2;
        if (l < nums.length) dfs(l, currSum);
        if (r < nums.length) dfs(r, currSum);
        prefix.set(currSum, prefix.get(currSum) - 1);
      };
      dfs(0, 0);
      return String(count);
    },
    rawInputs: [
      "10 5 -3 3 2 11\n8",
      "5 4 8 11 13 4 7 2 5 1\n22",
      "1\n1",
      "1\n2",
      "1 2 3\n3",
      "1 -2 -3 1 3 -2 -1\n-1",
      "1 1 1 1\n2",
      "3 3 3\n3",
      "10 20 30\n50",
      "0 0 0 0\n0"
    ]
  },

  // 58. Lowest Common Ancestor of a Binary Tree
  {
    id: "ch_lowest_common_ancestor_bt",
    title: "Lowest Common Ancestor of a Binary Tree",
    difficulty: "Medium",
    category: "Trees",
    description: "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes `p` and `q` in the tree. The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow a node to be a descendant of itself).",
    constraints: ["The number of nodes in the tree is in the range [2, 10^5].", "-10^9 <= Node.val <= 10^9", "All Node.val are unique.", "p != q", "p and q exist in the tree."],
    inputFormat: "Line 1: Space-separated integers representing binary tree in level order.\nLine 2: Value p and value q.",
    outputFormat: "Value of the lowest common ancestor node.",
    hints: ["If root is p or q, root is LCA.", "Recurse on left and right subtrees. If both return non-null, root is LCA."],
    objective: "Identify LCA node for two target values in binary tree.",
    conceptualExplanation: ["DFS traversal: if current node matches p or q, return node.", "Search left and right subtrees.", "If both left and right return results, current node is the LCA."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const [p, q] = lines[1].trim().split(/\s+/).map(Number);
      const lca = (idx) => {
        if (idx >= nums.length) return null;
        if (nums[idx] === p || nums[idx] === q) return nums[idx];
        const left = lca(2 * idx + 1);
        const right = lca(2 * idx + 2);
        if (left !== null && right !== null) return nums[idx];
        return left !== null ? left : right;
      };
      return String(lca(0));
    },
    rawInputs: [
      "3 5 1 6 2 0 8\n5 1",
      "3 5 1 6 2 0 8\n5 4",
      "1 2 3\n2 3",
      "1 2\n1 2",
      "10 5 20 3 8 15 25\n3 8",
      "10 5 20 3 8 15 25\n3 25",
      "6 2 8 0 4 7 9\n2 8",
      "6 2 8 0 4 7 9\n2 4",
      "4 2 6 1 3 5 7\n1 7",
      "5 3 6 2 4\n2 4"
    ]
  },

  // 59. Construct Binary Tree from Preorder and Inorder
  {
    id: "ch_construct_binary_tree_pre_in",
    title: "Construct Tree from Preorder & Inorder",
    difficulty: "Medium",
    category: "Trees",
    description: "Given two integer arrays `preorder` and `inorder` where preorder is the preorder traversal of a binary tree and inorder is the inorder traversal of the same tree, construct and return the binary tree's postorder traversal.",
    constraints: ["1 <= preorder.length <= 3000", "inorder.length == preorder.length", "-3000 <= preorder[i], inorder[i] <= 3000", "All values are unique."],
    inputFormat: "Line 1: Space-separated integers representing preorder.\nLine 2: Space-separated integers representing inorder.",
    outputFormat: "Space-separated integers representing postorder traversal.",
    hints: ["First element in preorder is root.", "Find root index in inorder to divide left and right subtrees."],
    objective: "Reconstruct binary tree and return its postorder sequence.",
    conceptualExplanation: ["Root = preorder[0].", "Inorder index divides into leftSub and rightSub.", "Recursively construct left and right subtrees.", "Return postorder: left + right + root."],
    solve: (input) => {
      const [preStr, inStr] = input.trim().split("\n");
      const pre = preStr.trim().split(/\s+/).map(Number);
      const ino = inStr.trim().split(/\s+/).map(Number);
      const build = (pList, iList) => {
        if (!pList.length) return [];
        const root = pList[0];
        const mid = iList.indexOf(root);
        const leftIn = iList.slice(0, mid);
        const rightIn = iList.slice(mid + 1);
        const leftPre = pList.slice(1, 1 + leftIn.length);
        const rightPre = pList.slice(1 + leftIn.length);
        return [...build(leftPre, leftIn), ...build(rightPre, rightIn), root];
      };
      return build(pre, ino).join(" ");
    },
    rawInputs: [
      "3 9 20 15 7\n9 3 15 20 7",
      "-1\n-1",
      "1 2 4 5 3\n4 2 5 1 3",
      "1 2 3\n2 1 3",
      "10 5 2 7 15 12 20\n2 5 7 10 12 15 20",
      "1 2\n2 1",
      "1 2\n1 2",
      "4 2 1 3 6 5 7\n1 2 3 4 5 6 7",
      "2 1 3\n1 2 3",
      "5 3 2 4 7 6 8\n2 3 4 5 6 7 8"
    ]
  },

  // 60. Serialize and Deserialize Binary Tree
  {
    id: "ch_serialize_deserialize_bt",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "Hard",
    category: "Trees",
    description: "Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer. Design an algorithm to serialize a binary tree into a string and deserialize it back, outputting the reconstructed level-order traversal.",
    constraints: ["The number of nodes in the tree is in the range [0, 10^4].", "-1000 <= Node.val <= 1000"],
    inputFormat: "Line 1: Space-separated integers representing serialized binary tree.",
    outputFormat: "Space-separated integers representing deserialized tree values.",
    hints: ["Use preorder traversal with null markers 'null' or level order queue."],
    objective: "Verify complete serialization round-trip of binary tree data.",
    conceptualExplanation: ["Encode tree with preorder DFS.", "Decode by reconstructing nodes recursively from stream.", "Output reconstructed values."],
    solve: (input) => {
      const tokens = input.trim().split(/\s+/);
      return tokens.filter(t => t !== "null").join(" ");
    },
    rawInputs: [
      "1 2 3 null null 4 5",
      "null",
      "1",
      "1 2",
      "1 2 3 4 5",
      "10 20 null 30 null null 40",
      "5 3 6 2 4 null null",
      "100 200 300",
      "1 null 2 null 3",
      "4 2 7 1 3"
    ]
  },

  // 61. Implement Trie (Prefix Tree)
  {
    id: "ch_implement_trie",
    title: "Implement Trie (Prefix Tree)",
    difficulty: "Medium",
    category: "Tries",
    description: "Implement a Trie with `insert`, `search`, and `startsWith` methods.\nYou are given a series of operations:\n• `insert word`\n• `search word` -> outputs `true` or `false`\n• `startsWith prefix` -> outputs `true` or `false`\nReturn outputs of queries separated by space.",
    constraints: ["1 <= word.length, prefix.length <= 2000", "word and prefix consist only of lowercase English letters.", "At most 3 * 10^4 calls will be made."],
    inputFormat: "Multiple lines: operation followed by word.",
    outputFormat: "Space-separated boolean results for search and startsWith operations.",
    hints: ["Each TrieNode holds 26 children pointers and an isEndOfWord flag."],
    objective: "Implement an efficient prefix tree supporting insertion, exact search, and prefix matching.",
    conceptualExplanation: ["Trie node has children Map and isEnd boolean.", "insert: traverse/add characters.", "search: check all characters and isEnd.", "startsWith: check all characters exist."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const root = {};
      const res = [];
      for (const line of lines) {
        const [op, word] = line.trim().split(/\s+/);
        if (op === "insert") {
          let curr = root;
          for (const ch of word) {
            if (!curr[ch]) curr[ch] = {};
            curr = curr[ch];
          }
          curr.isEnd = true;
        } else if (op === "search") {
          let curr = root;
          let found = true;
          for (const ch of word) {
            if (!curr[ch]) { found = false; break; }
            curr = curr[ch];
          }
          res.push(String(Boolean(found && curr.isEnd)));
        } else if (op === "startsWith") {
          let curr = root;
          let found = true;
          for (const ch of word) {
            if (!curr[ch]) { found = false; break; }
            curr = curr[ch];
          }
          res.push(String(found));
        }
      }
      return res.join(" ");
    },
    rawInputs: [
      "insert apple\nsearch apple\nsearch app\nstartsWith app\ninsert app\nsearch app",
      "insert cat\ninsert car\nsearch cat\nsearch car\nsearch cap\nstartsWith ca",
      "insert a\nsearch a\nstartsWith a\nsearch b",
      "insert test\nstartsWith te\nstartsWith ta",
      "insert hello\nsearch hell\nstartsWith hell",
      "insert world\nsearch world\nstartsWith worl\nstartsWith word",
      "insert code\ninsert coder\nsearch code\nsearch coder\nsearch cod",
      "insert python\nsearch python\nstartsWith py\nstartsWith java",
      "insert abc\ninsert ab\nsearch ab\nsearch abc\nsearch a",
      "insert z\nsearch z\nstartsWith z\nsearch y"
    ]
  },

  // 62. Design Add and Search Words
  {
    id: "ch_design_add_search_words",
    title: "Design Add and Search Words with Wildcards",
    difficulty: "Medium",
    category: "Tries",
    description: "Design a data structure that supports adding new words and finding if a string matches any previously added string. Implement the WordDictionary with `addWord(word)` and `search(word)` where `word` in search may contain dots '.' where dots can match any letter.",
    constraints: ["1 <= word.length <= 25", "word in addWord consists of lowercase English letters.", "word in search consist of '.' or lowercase English letters.", "At most 10^4 calls will be made."],
    inputFormat: "Multiple lines: 'add word' or 'search word'.",
    outputFormat: "Space-separated boolean results for search queries.",
    hints: ["Use Trie. When '.' is encountered, recurse across all existing child nodes."],
    objective: "Implement wildcard character pattern matching with Trie recursion.",
    conceptualExplanation: ["Store words in Trie.", "When searching '.', branch into all child nodes.", "Return true if any branch reaches word end."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const root = {};
      const res = [];
      const searchHelper = (node, word, idx) => {
        if (!node) return false;
        if (idx === word.length) return Boolean(node.isEnd);
        const ch = word[idx];
        if (ch === '.') {
          for (const key of Object.keys(node)) {
            if (key !== "isEnd" && searchHelper(node[key], word, idx + 1)) return true;
          }
          return false;
        } else {
          return searchHelper(node[ch], word, idx + 1);
        }
      };
      for (const line of lines) {
        const [op, word] = line.trim().split(/\s+/);
        if (op === "add") {
          let curr = root;
          for (const ch of word) {
            if (!curr[ch]) curr[ch] = {};
            curr = curr[ch];
          }
          curr.isEnd = true;
        } else if (op === "search") {
          res.push(String(searchHelper(root, word, 0)));
        }
      }
      return res.join(" ");
    },
    rawInputs: [
      "add bad\nadd dad\nadd mad\nsearch pad\nsearch bad\nsearch .ad\nsearch b..",
      "add a\nadd a\nsearch .\nsearch a\nsearch aa\nsearch .a\nsearch a.",
      "add apple\nsearch app..\nsearch a.p.e\nsearch .....",
      "add cat\nadd dog\nsearch ...\nsearch c.t\nsearch d.g\nsearch .o.",
      "add test\nsearch t.st\nsearch ....",
      "add hello\nsearch h.l.o\nsearch h...o",
      "add code\nsearch c...\nsearch .o..\nsearch ....e",
      "add xyz\nsearch ...\nsearch x..\nsearch ..z",
      "add abc\nsearch abc\nsearch .bc\nsearch a.c\nsearch ab.",
      "add word\nsearch w...\nsearch .o.d\nsearch ...."
    ]
  },

  // 63. K Closest Points to Origin
  {
    id: "ch_k_closest_points_origin",
    title: "K Closest Points to Origin",
    difficulty: "Medium",
    category: "Heaps",
    description: "Given an array of points where `points[i] = [xi, yi]` represents a point on the X-Y plane and an integer `k`, return the `k` closest points to the origin `(0, 0)`. The distance between two points is the Euclidean distance `sqrt(x^2 + y^2)`. Output points ordered by distance ascending, one per line as `x y`.",
    constraints: ["1 <= k <= points.length <= 10^4", "-10^4 <= xi, yi <= 10^4"],
    inputFormat: "Line 1: Number of points n and integer k\nNext n lines: Two integers x and y per line.",
    outputFormat: "k lines of space-separated x y coordinates.",
    hints: ["Use max-heap of size k or sort by squared distance x^2 + y^2."],
    objective: "Select top k points closest to Euclidean origin using heaps.",
    conceptualExplanation: ["Compute distSq = x^2 + y^2.", "Sort points by distSq ascending.", "Return first k points."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [n, k] = lines[0].trim().split(/\s+/).map(Number);
      const points = [];
      for (let i = 1; i <= n; i++) {
        points.push(lines[i].trim().split(/\s+/).map(Number));
      }
      points.sort((a, b) => (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1]));
      return points.slice(0, k).map(p => `${p[0]} ${p[1]}`).join("\n");
    },
    rawInputs: [
      "2 1\n1 3\n-2 2",
      "3 2\n3 3\n5 -1\n-2 4",
      "1 1\n0 0",
      "3 3\n1 1\n2 2\n3 3",
      "4 2\n0 1\n1 0\n2 2\n-1 -1",
      "5 1\n10 10\n5 5\n1 1\n2 2\n3 3",
      "3 2\n-5 4\n-6 -5\n4 6",
      "4 3\n1 3\n-2 2\n2 -2\n5 5",
      "2 2\n1 2\n2 1",
      "5 3\n1 0\n0 2\n3 3\n0 0\n-1 -1"
    ]
  },

  // 64. Kth Largest Element in a Stream
  {
    id: "ch_kth_largest_stream",
    title: "Kth Largest Element in a Stream",
    difficulty: "Easy",
    category: "Heaps",
    description: "Design a class to find the kth largest element in a stream. You are given an integer k and initial scores, followed by incoming numbers. For each incoming number, return the element representing the kth largest element in the pool.",
    constraints: ["1 <= k <= 10^4", "0 <= nums.length <= 10^4", "-10^4 <= val <= 10^4"],
    inputFormat: "Line 1: Integer k\nLine 2: Initial space-separated integers\nLine 3: Incoming space-separated integers",
    outputFormat: "Space-separated kth largest values after each incoming element.",
    hints: ["Maintain a min-heap of size k.", "Heap top is always the kth largest element."],
    objective: "Track running kth largest number in real-time stream.",
    conceptualExplanation: ["Maintain min-heap of capacity k.", "Push new stream values.", "Heap top is the kth largest."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const k = parseInt(lines[0], 10);
      const init = lines[1] ? lines[1].trim().split(/\s+/).map(Number) : [];
      const stream = lines[2].trim().split(/\s+/).map(Number);
      const pool = [...init];
      const res = [];
      for (const val of stream) {
        pool.push(val);
        pool.sort((a, b) => b - a);
        res.push(pool[k - 1]);
      }
      return res.join(" ");
    },
    rawInputs: [
      "3\n4 5 8 2\n3 5 10 9 4",
      "1\n\n-3 -2 -4 0 4",
      "2\n0\n-1 1 -2 2 -3",
      "4\n7 7 7 7 8 3\n2 10 9 9",
      "3\n5 10 15\n20 25 30",
      "1\n10 20 30\n5 40 1",
      "2\n1 2 3\n4 5 6",
      "3\n1 1 1 1\n1 1",
      "2\n100 200\n150 250",
      "5\n1 2 3 4 5\n6 7 8"
    ]
  },

  // 65. Task Scheduler with Cooldown
  {
    id: "ch_task_scheduler_cooldown",
    title: "Task Scheduler with Cooldown",
    difficulty: "Medium",
    category: "Heaps",
    description: "Given a characters array `tasks`, representing the tasks a CPU needs to do, where each letter represents a different task. Tasks could be done in any order. Each task is done in one unit of time. For each unit of time, the CPU could complete either one task or just be idle. However, there is a non-negative integer `n` that represents the cooldown period between two same tasks. Return the least number of units of times that the CPU will take to finish all the given tasks.",
    constraints: ["1 <= tasks.length <= 10^4", "tasks[i] is upper-case English letter.", "The integer n is in the range [0, 100]."],
    inputFormat: "Line 1: Space-separated task characters.\nLine 2: Single integer n cooldown.",
    outputFormat: "Minimum CPU execution intervals integer.",
    hints: ["Find task with max frequency.", "Formula: (maxFreq - 1) * (n + 1) + countOfMaxFreqTasks."],
    objective: "Calculate minimum CPU cycles required to schedule tasks with cooldown.",
    conceptualExplanation: ["Tally task frequencies.", "Identify maxFreq and how many tasks share maxFreq.", "Total time = max(tasks.length, (maxFreq - 1) * (n + 1) + maxCount)."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const tasks = lines[0].trim().split(/\s+/);
      const n = parseInt(lines[1], 10);
      const counts = {};
      for (const t of tasks) counts[t] = (counts[t] || 0) + 1;
      const freqs = Object.values(counts);
      const maxFreq = Math.max(...freqs);
      const maxCount = freqs.filter(f => f === maxFreq).length;
      const ans = Math.max(tasks.length, (maxFreq - 1) * (n + 1) + maxCount);
      return String(ans);
    },
    rawInputs: [
      "A A A B B B\n2",
      "A A A B B B\n0",
      "A A A A A A B C D E F G\n2",
      "A B C D E\n2",
      "A A A\n1",
      "A B C A B C\n3",
      "A A B B C C D D\n2",
      "A A A B B B C C C\n2",
      "A\n5",
      "A A A A\n3"
    ]
  },

  // 66. Find Median from Data Stream
  {
    id: "ch_find_median_data_stream",
    title: "Find Median from Data Stream",
    difficulty: "Hard",
    category: "Heaps",
    description: "The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values. Design a data structure that supports adding numbers and finding the running median formatted to 1 decimal place.",
    constraints: ["-10^5 <= num <= 10^5", "There will be at least one element in the data structure before calling findMedian.", "At most 5 * 10^4 calls will be made."],
    inputFormat: "Line 1: Space-separated integers representing stream elements.",
    outputFormat: "Space-separated running medians rounded to 1 decimal place.",
    hints: ["Use two heaps: max-heap for lower half and min-heap for upper half."],
    objective: "Calculate running median of a dynamic stream in logarithmic time.",
    conceptualExplanation: ["Keep max-heap left and min-heap right.", "Balance sizes so left.size === right.size or left.size === right.size + 1.", "Median is left.peek or average of both peeks."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const arr = [];
      const medians = [];
      for (const x of nums) {
        arr.push(x);
        arr.sort((a, b) => a - b);
        const mid = Math.floor(arr.length / 2);
        if (arr.length % 2 === 1) {
          medians.push(arr[mid].toFixed(1));
        } else {
          medians.push(((arr[mid - 1] + arr[mid]) / 2).toFixed(1));
        }
      }
      return medians.join(" ");
    },
    rawInputs: [
      "1 2 3",
      "2 3 4",
      "5 15 1 3",
      "10",
      "10 20",
      "-1 -2 -3 -4 -5",
      "6 10 2 6 5 0 6 3 1 0 0",
      "100 50 150 25",
      "1 1 1 1",
      "7 3 9 1 5"
    ]
  },

  // 67. Subsets II with Duplicates
  {
    id: "ch_subsets_ii",
    title: "Subsets II with Duplicates",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given an integer array `nums` that may contain duplicates, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Output the count on line 1, and each subset space-separated on subsequent lines (empty line for empty subset).",
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10"],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "Line 1: Count of subsets\nSubsequent lines: Space-separated subset elements.",
    hints: ["Sort the array first.", "If nums[i] === nums[i - 1] and i > start, skip to avoid duplicate subsets."],
    objective: "Generate all unique subsets from a multiset using backtracking.",
    conceptualExplanation: ["Sort nums.", "Backtrack with start index.", "Skip duplicate elements when i > start.", "Collect all unique subsets."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      const res = [];
      const backtrack = (start, curr) => {
        res.push([...curr]);
        for (let i = start; i < nums.length; i++) {
          if (i > start && nums[i] === nums[i - 1]) continue;
          curr.push(nums[i]);
          backtrack(i + 1, curr);
          curr.pop();
        }
      };
      backtrack(0, []);
      return `${res.length}\n${res.map(s => s.join(" ")).join("\n")}`.trim();
    },
    rawInputs: [
      "1 2 2",
      "0",
      "1 1",
      "4 4 4 1 4",
      "1 2 3",
      "2 1 2",
      "1 1 1",
      "3 1 2 2",
      "5 5",
      "2 2 3 3"
    ]
  },

  // 68. Permutations II Unique
  {
    id: "ch_permutations_ii",
    title: "Permutations II Unique",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given a collection of numbers, `nums`, that might contain duplicates, return all possible unique permutations in any order. Output the count on line 1, and each permutation on subsequent lines.",
    constraints: ["1 <= nums.length <= 8", "-10 <= nums[i] <= 10"],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "Line 1: Count of unique permutations\nSubsequent lines: Space-separated permutation.",
    hints: ["Sort nums.", "Skip duplicates if !used[i-1] && nums[i] === nums[i-1]."],
    objective: "Generate all distinct permutations of an array containing duplicates.",
    conceptualExplanation: ["Sort array to cluster duplicates.", "Use boolean used[] array.", "Backtrack picking unused elements; skip if nums[i] == nums[i-1] and !used[i-1]."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      const res = [];
      const used = new Array(nums.length).fill(false);
      const backtrack = (curr) => {
        if (curr.length === nums.length) {
          res.push([...curr]);
          return;
        }
        for (let i = 0; i < nums.length; i++) {
          if (used[i]) continue;
          if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
          used[i] = true;
          curr.push(nums[i]);
          backtrack(curr);
          curr.pop();
          used[i] = false;
        }
      };
      backtrack([]);
      return `${res.length}\n${res.map(p => p.join(" ")).join("\n")}`.trim();
    },
    rawInputs: [
      "1 1 2",
      "1 2 3",
      "1 1",
      "2 2 1 1",
      "1",
      "3 3 0 3",
      "1 2 2",
      "2 2 2",
      "1 1 2 2",
      "5 5 6"
    ]
  },

  // 69. Combination Sum II
  {
    id: "ch_combination_sum_ii",
    title: "Combination Sum II (Unique Elements)",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given a collection of candidate numbers (`candidates`) and a target number (`target`), find all unique combinations in `candidates` where the candidate numbers sum to `target`. Each number in `candidates` may only be used once in the combination. Output count on line 1 and each combination on subsequent lines.",
    constraints: ["1 <= candidates.length <= 100", "1 <= candidates[i] <= 50", "1 <= target <= 30"],
    inputFormat: "Line 1: Space-separated integers representing candidates.\nLine 2: Single integer target.",
    outputFormat: "Line 1: Count of combinations\nSubsequent lines: Space-separated combination.",
    hints: ["Sort candidates.", "Skip duplicate numbers in the same recursion level if i > start && candidates[i] === candidates[i - 1]."],
    objective: "Find combinations summing to target where each candidate is used at most once.",
    conceptualExplanation: ["Sort candidates.", "Backtrack passing remaining target.", "Skip duplicate elements when branching.", "Record when target === 0."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const cands = lines[0].trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      const target = parseInt(lines[1], 10);
      const res = [];
      const backtrack = (start, remain, curr) => {
        if (remain === 0) {
          res.push([...curr]);
          return;
        }
        for (let i = start; i < cands.length; i++) {
          if (cands[i] > remain) break;
          if (i > start && cands[i] === cands[i - 1]) continue;
          curr.push(cands[i]);
          backtrack(i + 1, remain - cands[i], curr);
          curr.pop();
        }
      };
      backtrack(0, target, []);
      return `${res.length}${res.length > 0 ? "\n" + res.map(c => c.join(" ")).join("\n") : ""}`.trim();
    },
    rawInputs: [
      "10 1 2 7 6 1 5\n8",
      "2 5 2 1 2\n5",
      "1 2 3\n5",
      "1 1 1 1\n2",
      "5 10 15 20\n25",
      "1 1 2 5 6 7 10\n8",
      "2 3 6 7\n7",
      "3 4 5\n1",
      "1 2 3 4 5\n10",
      "1 1 1 1 1\n3"
    ]
  },

  // 70. Combination Sum III
  {
    id: "ch_combination_sum_iii",
    title: "Combination Sum III (K Digits Sum to N)",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Find all valid combinations of `k` numbers that sum up to `n` such that only numbers from 1 to 9 are used and each number is used at most once. Output count on line 1 and each combination on subsequent lines.",
    constraints: ["2 <= k <= 9", "1 <= n <= 60"],
    inputFormat: "Line 1: Integer k\nLine 2: Integer n",
    outputFormat: "Line 1: Count of combinations\nSubsequent lines: Space-separated combination.",
    hints: ["Backtrack from 1 to 9.", "Keep track of remaining count k and remaining sum n."],
    objective: "Select k distinct single-digit numbers summing to n.",
    conceptualExplanation: ["Recursive search from start digit 1 to 9.", "When k === 0 and n === 0, record path.", "Prune if n < 0."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const k = parseInt(lines[0], 10);
      const n = parseInt(lines[1], 10);
      const res = [];
      const backtrack = (start, count, remain, curr) => {
        if (count === 0 && remain === 0) {
          res.push([...curr]);
          return;
        }
        if (count === 0 || remain <= 0) return;
        for (let d = start; d <= 9; d++) {
          if (d > remain) break;
          curr.push(d);
          backtrack(d + 1, count - 1, remain - d, curr);
          curr.pop();
        }
      };
      backtrack(1, k, n, []);
      return `${res.length}${res.length > 0 ? "\n" + res.map(c => c.join(" ")).join("\n") : ""}`.trim();
    },
    rawInputs: [
      "3\n7",
      "3\n9",
      "4\n1",
      "3\n15",
      "2\n18",
      "2\n5",
      "4\n24",
      "9\n45",
      "1\n5",
      "3\n12"
    ]
  },

  // 71. Palindrome Partitioning
  {
    id: "ch_palindrome_partitioning",
    title: "Palindrome Partitioning",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given a string `s`, partition `s` such that every substring of the partition is a palindrome. Return all possible palindrome partitioning of `s`. Output count on line 1, and each partition on subsequent lines separated by commas.",
    constraints: ["1 <= s.length <= 16", "s contains only lowercase English letters."],
    inputFormat: "A single line containing string s.",
    outputFormat: "Line 1: Count of partitions\nSubsequent lines: Comma-separated palindrome substrings.",
    hints: ["Backtrack index.", "Check if s.slice(start, i + 1) is a palindrome."],
    objective: "Decompose string into sequences of palindrome substrings.",
    conceptualExplanation: ["Backtrack position from start.", "For each end position, if substring is palindrome, recurse on remainder.", "Record when start reaches end of string."],
    solve: (input) => {
      const s = input.trim();
      const res = [];
      const isPal = (sub) => {
        let i = 0, j = sub.length - 1;
        while (i < j) {
          if (sub[i++] !== sub[j--]) return false;
        }
        return true;
      };
      const backtrack = (start, curr) => {
        if (start === s.length) {
          res.push([...curr]);
          return;
        }
        for (let end = start + 1; end <= s.length; end++) {
          const sub = s.slice(start, end);
          if (isPal(sub)) {
            curr.push(sub);
            backtrack(end, curr);
            curr.pop();
          }
        }
      };
      backtrack(0, []);
      return `${res.length}\n${res.map(p => p.join(",")).join("\n")}`.trim();
    },
    rawInputs: [
      "aab",
      "a",
      "aba",
      "racecar",
      "cbbcc",
      "bb",
      "abc",
      "efe",
      "aaa",
      "abba"
    ]
  },

  // 72. Letter Case Permutation
  {
    id: "ch_letter_case_permutation",
    title: "Letter Case Permutation",
    difficulty: "Medium",
    category: "Backtracking",
    description: "Given a string `s`, you can transform every letter individually to be lowercase or uppercase to create another string. Return a list of all possible strings we could create. Output on a single line space-separated.",
    constraints: ["1 <= s.length <= 12", "s consists of lowercase English letters, uppercase English letters, and digits."],
    inputFormat: "A single line containing string s.",
    outputFormat: "Space-separated permutations.",
    hints: ["For digits, keep as is. For letters, branch into lower and upper."],
    objective: "Generate all binary letter-case variants of a string.",
    conceptualExplanation: ["DFS at index i.", "If digit, recurse with digit.", "If letter, branch with lowercase and branch with uppercase."],
    solve: (input) => {
      const s = input.trim();
      const res = [];
      const backtrack = (idx, curr) => {
        if (idx === s.length) {
          res.push(curr);
          return;
        }
        const ch = s[idx];
        if (ch >= '0' && ch <= '9') {
          backtrack(idx + 1, curr + ch);
        } else {
          backtrack(idx + 1, curr + ch.toLowerCase());
          backtrack(idx + 1, curr + ch.toUpperCase());
        }
      };
      backtrack(0, "");
      return res.join(" ");
    },
    rawInputs: [
      "a1b2",
      "3z4",
      "12345",
      "0",
      "C",
      "ab",
      "q1W2",
      "xyz",
      "a1b1c1",
      "Test"
    ]
  },

  // 73. Flood Fill Algorithm
  {
    id: "ch_flood_fill",
    title: "Flood Fill Algorithm",
    difficulty: "Easy",
    category: "Graphs",
    description: "An image is represented by an m x n integer grid `image` where `image[i][j]` represents the pixel value of the image. You are also given three integers `sr`, `sc`, and `color`. You should perform a flood fill on the image starting from the pixel `image[sr][sc]`.\n\nTo perform a flood fill, consider the starting pixel, plus any pixels connected 4-directionally to the starting pixel of the same color as the starting pixel, plus any pixels connected 4-directionally to those pixels, and so on. Replace the color of all of the aforementioned pixels with `color`.",
    constraints: ["m == image.length", "n == image[i].length", "1 <= m, n <= 50", "0 <= image[i][j], color < 2^16", "0 <= sr < m", "0 <= sc < n"],
    inputFormat: "Line 1: m and n\nNext m lines: n space-separated pixel values\nLast line: sr sc color",
    outputFormat: "m lines representing the modified image.",
    hints: ["Standard DFS / BFS from (sr, sc).", "Check if original color === new color to avoid infinite loop."],
    objective: "Recolor connected 4-directional matching pixel regions.",
    conceptualExplanation: ["Capture startColor = image[sr][sc].", "If startColor === newColor return.", "DFS/BFS in 4 directions replacing startColor with newColor."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const grid = [];
      for (let i = 1; i <= m; i++) grid.push(lines[i].trim().split(/\s+/).map(Number));
      const [sr, sc, newColor] = lines[m + 1].trim().split(/\s+/).map(Number);
      const startColor = grid[sr][sc];
      if (startColor === newColor) return grid.map(r => r.join(" ")).join("\n");
      const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== startColor) return;
        grid[r][c] = newColor;
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
      };
      dfs(sr, sc);
      return grid.map(r => r.join(" ")).join("\n");
    },
    rawInputs: [
      "3 3\n1 1 1\n1 1 0\n1 0 1\n1 1 2",
      "2 2\n0 0\n0 0\n0 0 0",
      "1 1\n5\n0 0 10",
      "3 3\n0 0 0\n0 1 1\n0 1 1\n1 1 1",
      "3 3\n2 2 2\n2 2 0\n2 0 1\n1 1 9",
      "2 3\n1 1 1\n1 0 1\n0 0 2",
      "3 2\n1 2\n1 1\n1 3\n1 0 5",
      "4 4\n1 1 1 1\n1 1 0 1\n1 0 0 1\n1 1 1 1\n1 1 3",
      "1 3\n1 1 1\n0 1 2",
      "3 1\n2\n2\n2\n1 0 7"
    ]
  },

  // 74. Surrounded Regions Capture
  {
    id: "ch_surrounded_regions",
    title: "Surrounded Regions Capture",
    difficulty: "Medium",
    category: "Graphs",
    description: "Given an m x n matrix board containing 'X' and 'O', capture all regions that are 4-directionally surrounded by 'X'. A region is captured by flipping all 'O's into 'X's in that surrounded region. An 'O' on the border cannot be captured.",
    constraints: ["m == board.length", "n == board[i].length", "1 <= m, n <= 200", "board[i][j] is 'X' or 'O'."],
    inputFormat: "Line 1: m and n\nNext m lines: Space-separated 'X' and 'O' row values.",
    outputFormat: "m lines representing the captured board.",
    hints: ["Start DFS from border 'O's and mark them safe.", "Flip all unmarked 'O's to 'X'."],
    objective: "Capture interior 'O' regions while sparing border-connected cells.",
    conceptualExplanation: ["DFS from all boundary 'O's, marking them 'S' (safe).", "Iterate entire grid: if 'O', flip to 'X'; if 'S', revert to 'O'."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const b = [];
      for (let i = 1; i <= m; i++) b.push(lines[i].trim().split(/\s+/));
      const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || b[r][c] !== 'O') return;
        b[r][c] = 'S';
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
      };
      for (let i = 0; i < m; i++) { dfs(i, 0); dfs(i, n - 1); }
      for (let j = 0; j < n; j++) { dfs(0, j); dfs(m - 1, j); }
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (b[i][j] === 'O') b[i][j] = 'X';
          else if (b[i][j] === 'S') b[i][j] = 'O';
        }
      }
      return b.map(r => r.join(" ")).join("\n");
    },
    rawInputs: [
      "4 4\nX X X X\nX O O X\nX X O X\nX O X X",
      "1 1\nX",
      "2 2\nO O\nO O",
      "3 3\nX X X\nX O X\nX X X",
      "3 3\nX O X\nX O X\nX O X",
      "4 4\nO X X O\nX O O X\nX O O X\nO X X O",
      "1 3\nO X O",
      "3 1\nO\nX\nO",
      "4 3\nX X X\nX O X\nX O X\nX X X",
      "3 4\nX X X X\nX O O X\nX X X X"
    ]
  },

  // 75. Rotting Oranges Multiverse BFS
  {
    id: "ch_rotting_oranges",
    title: "Rotting Oranges Multiverse BFS",
    difficulty: "Medium",
    category: "Graphs",
    description: "You are given an m x n grid where each cell can have one of three values:\n• 0 representing an empty cell,\n• 1 representing a fresh orange, or\n• 2 representing a rotten orange.\nEvery minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return -1.",
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 10", "grid[i][j] is 0, 1, or 2."],
    inputFormat: "Line 1: m and n\nNext m lines: n space-separated integers (0, 1, or 2).",
    outputFormat: "Minimum minutes integer, or -1.",
    hints: ["Multi-source BFS starting with all initial rotten oranges in the queue."],
    objective: "Model epidemic disease/rot propagation using multi-source BFS.",
    conceptualExplanation: ["Enqueue all cells with value 2.", "Count initial fresh oranges.", "Perform level-by-level BFS rotting adjacent fresh oranges.", "Return minutes if freshCount === 0, else -1."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const grid = [];
      for (let i = 1; i <= m; i++) grid.push(lines[i].trim().split(/\s+/).map(Number));
      const queue = [];
      let fresh = 0;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] === 2) queue.push([i, j, 0]);
          else if (grid[i][j] === 1) fresh++;
        }
      }
      let minutes = 0;
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      let head = 0;
      while (head < queue.length) {
        const [r, c, t] = queue[head++];
        minutes = Math.max(minutes, t);
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] === 1) {
            grid[nr][nc] = 2;
            fresh--;
            queue.push([nr, nc, t + 1]);
          }
        }
      }
      return String(fresh === 0 ? minutes : -1);
    },
    rawInputs: [
      "3 3\n2 1 1\n1 1 0\n0 1 1",
      "3 3\n2 1 1\n0 1 1\n1 0 1",
      "1 2\n0 2",
      "1 1\n1",
      "1 1\n2",
      "1 1\n0",
      "2 2\n2 1\n1 2",
      "3 3\n1 1 1\n1 2 1\n1 1 1",
      "2 3\n2 1 1\n1 1 2",
      "4 4\n2 1 0 2\n1 1 0 1\n0 0 0 0\n2 1 0 1"
    ]
  },

  // 76. Course Schedule II
  {
    id: "ch_course_schedule_ii",
    title: "Course Schedule II (Kahn's Topological Sort)",
    difficulty: "Medium",
    category: "Graphs",
    description: "There are a total of `numCourses` courses you have to take, labeled from 0 to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`. Return the valid ordering of courses you should take to finish all courses. If impossible due to cycles, return -1.",
    constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= numCourses * (numCourses - 1)", "All pairs [ai, bi] are distinct."],
    inputFormat: "Line 1: numCourses and m (number of prerequisites)\nNext m lines: ai bi (take bi before ai)",
    outputFormat: "Space-separated course ordering or -1.",
    hints: ["Kahn's algorithm using in-degree array and queue."],
    objective: "Derive valid course completion sequence with topological sort.",
    conceptualExplanation: ["Compute in-degree for all vertices.", "Enqueue all nodes with in-degree 0.", "Pop node, append to result, decrement neighbors.", "If order.length === numCourses return order, else -1."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [n, m] = lines[0].trim().split(/\s+/).map(Number);
      const inDeg = new Array(n).fill(0);
      const adj = Array.from({ length: n }, () => []);
      for (let i = 1; i <= m; i++) {
        if (!lines[i]) continue;
        const [a, b] = lines[i].trim().split(/\s+/).map(Number);
        adj[b].push(a);
        inDeg[a]++;
      }
      const queue = [];
      for (let i = 0; i < n; i++) {
        if (inDeg[i] === 0) queue.push(i);
      }
      const order = [];
      while (queue.length > 0) {
        const u = queue.shift();
        order.push(u);
        for (const v of adj[u]) {
          inDeg[v]--;
          if (inDeg[v] === 0) queue.push(v);
        }
      }
      return order.length === n ? order.join(" ") : "-1";
    },
    rawInputs: [
      "2 1\n1 0",
      "4 4\n1 0\n2 0\n3 1\n3 2",
      "1 0",
      "2 2\n0 1\n1 0",
      "3 2\n1 0\n2 1",
      "3 3\n1 0\n2 1\n0 2",
      "4 2\n1 0\n2 3",
      "5 4\n1 0\n2 1\n3 2\n4 3",
      "3 1\n2 0",
      "4 5\n1 0\n2 0\n3 1\n3 2\n2 3"
    ]
  },

  // 77. Number of Provinces
  {
    id: "ch_number_of_provinces",
    title: "Number of Connected Provinces",
    difficulty: "Medium",
    category: "Graphs",
    description: "There are `n` cities. Some of them are connected, while some are not. If city a is connected directly with city b, and city b is connected directly with city c, then city a is connected indirectly with city c. A province is a group of directly or indirectly connected cities and no other cities outside of the group. You are given an n x n matrix `isConnected` where `isConnected[i][j] = 1` if the i-th city and the j-th city are directly connected, and `isConnected[i][j] = 0` otherwise. Return the total number of provinces.",
    constraints: ["1 <= n <= 200", "n == isConnected.length == isConnected[i].length", "isConnected[i][j] is 1 or 0."],
    inputFormat: "Line 1: Integer n\nNext n lines: n space-separated 0s and 1s per row.",
    outputFormat: "Total count of provinces integer.",
    hints: ["Find connected components using DFS/BFS or Disjoint Set Union."],
    objective: "Count connected components in an undirected adjacency matrix.",
    conceptualExplanation: ["Iterate through cities 0..n-1.", "If city not visited, start DFS/BFS visiting all reachable cities and increment province count.", "Return count."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0], 10);
      const mat = [];
      for (let i = 1; i <= n; i++) mat.push(lines[i].trim().split(/\s+/).map(Number));
      const visited = new Set();
      let provinces = 0;
      const dfs = (u) => {
        visited.add(u);
        for (let v = 0; v < n; v++) {
          if (mat[u][v] === 1 && !visited.has(v)) dfs(v);
        }
      };
      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          provinces++;
          dfs(i);
        }
      }
      return String(provinces);
    },
    rawInputs: [
      "3\n1 1 0\n1 1 0\n0 0 1",
      "3\n1 0 0\n0 1 0\n0 0 1",
      "1\n1",
      "2\n1 1\n1 1",
      "2\n1 0\n0 1",
      "4\n1 1 0 0\n1 1 0 0\n0 0 1 1\n0 0 1 1",
      "4\n1 0 0 1\n0 1 1 0\n0 1 1 0\n1 0 0 1",
      "3\n1 1 1\n1 1 1\n1 1 1",
      "5\n1 0 0 0 0\n0 1 0 0 0\n0 0 1 0 0\n0 0 0 1 0\n0 0 0 0 1",
      "4\n1 1 1 1\n1 1 1 1\n1 1 1 1\n1 1 1 1"
    ]
  },

  // 78. Redundant Connection
  {
    id: "ch_redundant_connection",
    title: "Redundant Connection (Cycle in Undirected Graph)",
    difficulty: "Medium",
    category: "Graphs",
    description: "In this problem, a tree is an undirected graph that is connected and has no cycles. You are given a graph that started as a tree with n nodes labeled from 1 to n, with one additional edge added. Return an edge that can be removed so that the resulting graph is a tree of n nodes. If there are multiple answers, return the answer that occurs last in the input.",
    constraints: ["n == edges.length", "3 <= n <= 1000", "edges[i].length == 2", "1 <= ai < bi <= edges.length"],
    inputFormat: "Line 1: Integer n (number of edges)\nNext n lines: Two space-separated integers u and v per edge.",
    outputFormat: "Two space-separated integers representing the redundant edge.",
    hints: ["Use Disjoint Set Union (Union-Find).", "The edge connecting two already-connected vertices creates a cycle."],
    objective: "Detect the cycle-forming edge in a tree graph using Disjoint Set Union.",
    conceptualExplanation: ["Initialize Union-Find parent array.", "For each edge (u, v): if find(u) == find(v), return (u, v).", "Else union(u, v)."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0], 10);
      const parent = Array.from({ length: n + 1 }, (_, i) => i);
      const find = (i) => {
        if (parent[i] === i) return i;
        return parent[i] = find(parent[i]);
      };
      for (let i = 1; i <= n; i++) {
        const [u, v] = lines[i].trim().split(/\s+/).map(Number);
        const rootU = find(u), rootV = find(v);
        if (rootU === rootV) return `${u} ${v}`;
        parent[rootU] = rootV;
      }
      return "";
    },
    rawInputs: [
      "3\n1 2\n1 3\n2 3",
      "5\n1 2\n2 3\n3 4\n1 4\n1 5",
      "4\n1 2\n2 3\n3 4\n4 1",
      "5\n1 2\n1 3\n1 4\n1 5\n2 3",
      "3\n1 2\n2 3\n3 1",
      "6\n1 2\n2 3\n3 4\n4 5\n5 6\n6 2",
      "4\n1 2\n1 3\n2 4\n3 4",
      "5\n2 3\n3 4\n4 5\n5 1\n1 2",
      "4\n1 4\n4 2\n2 3\n3 1",
      "5\n1 3\n3 4\n4 5\n5 2\n2 4"
    ]
  },

  // 79. Network Delay Time
  {
    id: "ch_network_delay_time",
    title: "Network Delay Time (Dijkstra's Shortest Path)",
    difficulty: "Medium",
    category: "Graphs",
    description: "You are given a network of `n` nodes, labeled from 1 to `n`. You are also given `times`, a list of travel times as directed edges `times[i] = (ui, vi, wi)`, where `ui` is the source node, `vi` is the target node, and `wi` is the time it takes for a signal to travel from source to target. We will send a signal from a given node `k`. Return the minimum time it takes for all the `n` nodes to receive the signal. If it is impossible for all the `n` nodes to receive the signal, return -1.",
    constraints: ["1 <= k <= n <= 100", "1 <= times.length <= 6000", "times[i].length == 3", "1 <= ui, vi <= n", "0 <= wi <= 100"],
    inputFormat: "Line 1: n (nodes), m (edges), k (start node)\nNext m lines: u v w",
    outputFormat: "Minimum signal travel time integer, or -1.",
    hints: ["Run Dijkstra's algorithm from node k.", "Result is max distance across all nodes if all visited."],
    objective: "Calculate broadcast arrival latency with Dijkstra's shortest path.",
    conceptualExplanation: ["Initialize dist array with Infinity, dist[k] = 0.", "Use priority queue to greedily expand shortest distance nodes.", "If all nodes reached, return max(dist), else -1."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [n, m, k] = lines[0].trim().split(/\s+/).map(Number);
      const adj = Array.from({ length: n + 1 }, () => []);
      for (let i = 1; i <= m; i++) {
        if (!lines[i]) continue;
        const [u, v, w] = lines[i].trim().split(/\s+/).map(Number);
        adj[u].push([v, w]);
      }
      const dist = new Array(n + 1).fill(Infinity);
      dist[k] = 0;
      const pq = [[0, k]];
      while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0]);
        const [d, u] = pq.shift();
        if (d > dist[u]) continue;
        for (const [v, w] of adj[u]) {
          if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            pq.push([dist[v], v]);
          }
        }
      }
      let maxD = 0;
      for (let i = 1; i <= n; i++) {
        if (dist[i] === Infinity) return "-1";
        maxD = Math.max(maxD, dist[i]);
      }
      return String(maxD);
    },
    rawInputs: [
      "4 3 2\n2 1 1\n2 3 1\n3 4 1",
      "2 1 1\n1 2 1",
      "2 1 2\n1 2 1",
      "3 2 1\n1 2 5\n2 3 5",
      "3 3 1\n1 2 1\n2 3 2\n1 3 4",
      "4 4 1\n1 2 1\n2 3 2\n3 4 3\n1 4 10",
      "2 0 1",
      "3 2 3\n1 2 1\n2 3 1",
      "4 5 1\n1 2 2\n1 3 4\n2 3 1\n2 4 7\n3 4 1",
      "5 4 1\n1 2 1\n2 3 2\n3 4 3\n4 5 4"
    ]
  },

  // 80. Cheapest Flights Within K Stops
  {
    id: "ch_cheapest_flights_k_stops",
    title: "Cheapest Flights Within K Stops",
    difficulty: "Medium",
    category: "Graphs",
    description: "There are `n` cities connected by some number of flights. You are given an array `flights` where `flights[i] = [fromi, toi, pricei]` indicates that there is a flight from city `fromi` to city `toi` with cost `pricei`. You are also given three integers `src`, `dst`, and `k`, return the cheapest price from `src` to `dst` with at most `k` stops. If there is no such route, return -1.",
    constraints: ["1 <= n <= 100", "0 <= flights.length <= (n * (n - 1) / 2)", "0 <= k < n", "0 <= src, dst < n", "src != dst"],
    inputFormat: "Line 1: n m src dst k\nNext m lines: u v price",
    outputFormat: "Minimum flight cost integer, or -1.",
    hints: ["Bellman-Ford algorithm with k + 1 iterations."],
    objective: "Find shortest path constrained to at most k intermediate stops.",
    conceptualExplanation: ["Initialize prices array with Infinity, prices[src] = 0.", "Relax edges k + 1 times using a clone of current prices.", "Return prices[dst] if reachable, else -1."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [n, m, src, dst, k] = lines[0].trim().split(/\s+/).map(Number);
      const flights = [];
      for (let i = 1; i <= m; i++) {
        if (!lines[i]) continue;
        flights.push(lines[i].trim().split(/\s+/).map(Number));
      }
      let prices = new Array(n).fill(Infinity);
      prices[src] = 0;
      for (let i = 0; i <= k; i++) {
        const tmp = [...prices];
        for (const [u, v, p] of flights) {
          if (prices[u] === Infinity) continue;
          if (prices[u] + p < tmp[v]) tmp[v] = prices[u] + p;
        }
        prices = tmp;
      }
      return String(prices[dst] === Infinity ? -1 : prices[dst]);
    },
    rawInputs: [
      "4 5 0 3 1\n0 1 100\n1 2 100\n2 0 100\n1 3 600\n2 3 200",
      "3 3 0 2 1\n0 1 100\n1 2 100\n0 2 500",
      "3 3 0 2 0\n0 1 100\n1 2 100\n0 2 500",
      "2 1 0 1 0\n0 1 300",
      "4 4 0 3 1\n0 1 1\n1 2 1\n2 3 1\n0 3 10",
      "5 5 0 4 2\n0 1 10\n1 2 20\n2 3 30\n3 4 40\n0 4 150",
      "3 2 0 2 1\n0 1 50\n1 2 50",
      "4 3 0 3 1\n0 1 100\n1 2 100\n2 3 100",
      "3 2 0 2 0\n0 1 10\n1 2 10",
      "4 4 0 3 2\n0 1 10\n1 2 20\n2 3 30\n0 2 50"
    ]
  },

  // 81. Min Cost Climbing Stairs
  {
    id: "ch_climbing_stairs_min_cost",
    title: "Min Cost Climbing Stairs",
    difficulty: "Easy",
    category: "Dynamic Programming",
    description: "You are given an integer array `cost` where `cost[i]` is the cost of i-th step on a staircase. Once you pay the cost, you can either climb one or two steps. You can either start from the step with index 0, or the step with index 1. Return the minimum cost to reach the top of the floor.",
    constraints: ["2 <= cost.length <= 1000", "0 <= cost[i] <= 999"],
    inputFormat: "Line 1: Space-separated integers representing cost array.",
    outputFormat: "Minimum cost integer.",
    hints: ["dp[i] = cost[i] + min(dp[i-1], dp[i-2])."],
    objective: "Compute minimum step costs to reach staircase summit using 1D DP.",
    conceptualExplanation: ["Recurrence: dp[i] = min(dp[i-1], dp[i-2]) + cost[i].", "Final answer is min(dp[n-1], dp[n-2])."],
    solve: (input) => {
      const cost = input.trim().split(/\s+/).map(Number);
      let prev2 = cost[0], prev1 = cost[1];
      for (let i = 2; i < cost.length; i++) {
        const curr = cost[i] + Math.min(prev1, prev2);
        prev2 = prev1;
        prev1 = curr;
      }
      return String(Math.min(prev1, prev2));
    },
    rawInputs: [
      "10 15 20",
      "1 100 1 1 1 100 1 1 100 1",
      "0 0",
      "10 20",
      "1 2 3 4 5",
      "15 10",
      "5 10 15 20 25",
      "0 1 2 2",
      "100 1 100 1 100",
      "4 2 1 3 5 2"
    ]
  },

  // 82. House Robber II Circular Street
  {
    id: "ch_house_robber_ii",
    title: "House Robber II (Circular Street)",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses at this place are arranged in a circle. That means the first house is the neighbor of the last one. Meanwhile, adjacent houses have a security system connected, and it will automatically contact the police if two adjacent houses were broken into on the same night. Given an integer array `nums` representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 1000"],
    inputFormat: "Line 1: Space-separated integers representing house money.",
    outputFormat: "Maximum money robbed integer.",
    hints: ["Split into two standard House Robber subproblems: houses [0..n-2] and houses [1..n-1]."],
    objective: "Maximize robbed money along circular street without robbing adjacent houses.",
    conceptualExplanation: ["If length == 1, return nums[0].", "Compute max robbery on nums[0..n-2].", "Compute max robbery on nums[1..n-1].", "Return max of both."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      if (nums.length === 1) return String(nums[0]);
      const rob1 = (arr) => {
        let prev2 = 0, prev1 = 0;
        for (const x of arr) {
          const curr = Math.max(prev1, prev2 + x);
          prev2 = prev1;
          prev1 = curr;
        }
        return prev1;
      };
      const ans = Math.max(rob1(nums.slice(0, nums.length - 1)), rob1(nums.slice(1)));
      return String(ans);
    },
    rawInputs: [
      "2 3 2",
      "1 2 3 1",
      "1 2 3",
      "5",
      "10 20 30 40 50",
      "1 3 1 3 100",
      "20 1 1 20",
      "1 7 9 2",
      "10 5 10 5 10",
      "2 7 9 3 1"
    ]
  },

  // 83. Decode Ways to Digits
  {
    id: "ch_decode_ways",
    title: "Decode Ways to Digits",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "A message containing letters from A-Z can be encoded into numbers using the mapping 'A' -> 1, 'B' -> 2, ..., 'Z' -> 26. Given a string `s` containing only digits, return the number of ways to decode it.",
    constraints: ["1 <= s.length <= 100", "s contains only digits and may contain leading zero(s)."],
    inputFormat: "A single line containing digit string s.",
    outputFormat: "Integer count of decode ways.",
    hints: ["dp[i] represents decode ways for s.slice(0, i).", "Single digit valid if !== '0'. Two digits valid if 10 <= num <= 26."],
    objective: "Count total decoding variations using 1D dynamic programming.",
    conceptualExplanation: ["dp[0] = 1.", "If s[i-1] != '0', dp[i] += dp[i-1].", "If s[i-2..i-1] is between 10 and 26, dp[i] += dp[i-2].", "Return dp[n]."],
    solve: (input) => {
      const s = input.trim();
      if (!s || s[0] === '0') return "0";
      const n = s.length;
      const dp = new Array(n + 1).fill(0);
      dp[0] = 1;
      dp[1] = 1;
      for (let i = 2; i <= n; i++) {
        const one = parseInt(s.slice(i - 1, i), 10);
        const two = parseInt(s.slice(i - 2, i), 10);
        if (one >= 1 && one <= 9) dp[i] += dp[i - 1];
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
      }
      return String(dp[n]);
    },
    rawInputs: [
      "12",
      "226",
      "06",
      "10",
      "27",
      "1111",
      "2101",
      "1201234",
      "26",
      "100"
    ]
  },

  // 84. Word Break Problem
  {
    id: "ch_word_break",
    title: "Word Break Segmentation",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.",
    constraints: ["1 <= s.length <= 300", "1 <= wordDict.length <= 1000", "1 <= wordDict[i].length <= 20", "s and wordDict[i] consist of only lowercase English letters."],
    inputFormat: "Line 1: String s\nLine 2: Space-separated words in wordDict",
    outputFormat: "true or false",
    hints: ["dp[i] = true if s[0..i] can be segmented.", "dp[i] = dp[j] && wordDict.has(s[j..i])."],
    objective: "Determine if string can be decomposed into dictionary words.",
    conceptualExplanation: ["dp[0] = true.", "For i from 1 to s.length, check all j < i.", "If dp[j] is true and s.slice(j, i) in dictionary, dp[i] = true."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const s = lines[0].trim();
      const dict = new Set(lines[1].trim().split(/\s+/));
      const dp = new Array(s.length + 1).fill(false);
      dp[0] = true;
      for (let i = 1; i <= s.length; i++) {
        for (let j = 0; j < i; j++) {
          if (dp[j] && dict.has(s.slice(j, i))) {
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
      "cars\ncar ca rs",
      "a\na",
      "goalspecial\ngo goal special",
      "bb\na b bbb",
      "abcd\na abc b cd",
      "program\npro gram",
      "catanddog\ncat and dog"
    ]
  },

  // 85. Longest Palindromic Subsequence
  {
    id: "ch_longest_palindromic_subseq",
    title: "Longest Palindromic Subsequence",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given a string `s`, find the longest palindromic subsequence's length in `s`. A subsequence is a sequence that can be derived from another sequence by deleting some or no elements without changing the order of the remaining elements.",
    constraints: ["1 <= s.length <= 1000", "s consists only of lowercase English letters."],
    inputFormat: "A single line containing string s.",
    outputFormat: "Length of longest palindromic subsequence integer.",
    hints: ["2D DP over interval [i, j].", "If s[i] === s[j], dp[i][j] = 2 + dp[i+1][j-1]. Else max(dp[i+1][j], dp[i][j-1])."],
    objective: "Find maximum length subsequence that reads identically forwards and backwards.",
    conceptualExplanation: ["Interval dynamic programming.", "Base cases: dp[i][i] = 1.", "Iterate length from 2 to n, matching outer characters."],
    solve: (input) => {
      const s = input.trim();
      const n = s.length;
      const dp = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let i = 0; i < n; i++) dp[i][i] = 1;
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i <= n - len; i++) {
          const j = i + len - 1;
          if (s[i] === s[j]) {
            dp[i][j] = 2 + (len === 2 ? 0 : dp[i + 1][j - 1]);
          } else {
            dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
          }
        }
      }
      return String(dp[0][n - 1]);
    },
    rawInputs: [
      "bbbab",
      "cbbd",
      "a",
      "ab",
      "racecar",
      "character",
      "agbdba",
      "leetcode",
      "abcdefedcba",
      "banana"
    ]
  },

  // 86. Maximal Square of 1s in Binary Matrix
  {
    id: "ch_maximal_square",
    title: "Maximal Square of 1s",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given an m x n binary matrix filled with 0's and 1's, find the largest square containing only 1's and return its area.",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 300", "matrix[i][j] is '0' or '1'."],
    inputFormat: "Line 1: m and n\nNext m lines: n space-separated 0s and 1s.",
    outputFormat: "Integer area of maximal square.",
    hints: ["dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1."],
    objective: "Compute maximal area square of contiguous 1s.",
    conceptualExplanation: ["2D DP grid dp[i][j] tracks max square side ending at (i, j).", "If matrix[i][j] == 1, dp[i][j] = min(top, left, diagonal) + 1.", "Area = maxSide * maxSide."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const [m, n] = lines[0].trim().split(/\s+/).map(Number);
      const mat = [];
      for (let i = 1; i <= m; i++) mat.push(lines[i].trim().split(/\s+/).map(Number));
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      let maxSide = 0;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (mat[i - 1][j - 1] === 1) {
            dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
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
      "2 3\n1 1 0\n1 1 0",
      "3 3\n0 0 0\n0 0 0\n0 0 0",
      "4 4\n1 1 1 1\n1 1 1 1\n1 1 1 1\n1 1 1 1",
      "3 2\n1 1\n1 1\n1 1",
      "3 4\n1 0 1 1\n1 1 1 1\n0 1 1 1"
    ]
  },

  // 87. Target Sum (+ and - assignments)
  {
    id: "ch_target_sum",
    title: "Target Sum (+ and - Assignments)",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "You are given an integer array `nums` and an integer `target`. You want to build an expression out of nums by adding one of the symbols '+' and '-' before each integer in nums and then concatenate all the integers. Return the number of different expressions that you can build, which evaluates to `target`.",
    constraints: ["1 <= nums.length <= 20", "0 <= nums[i] <= 1000", "0 <= sum(nums[i]) <= 1000", "-1000 <= target <= 1000"],
    inputFormat: "Line 1: Space-separated integers representing nums.\nLine 2: Single integer target.",
    outputFormat: "Number of ways integer.",
    hints: ["Transform to subset sum: P - N = target, P + N = sum => 2P = sum + target => P = (sum + target) / 2."],
    objective: "Count sign assignments yielding target using knapsack dynamic programming.",
    conceptualExplanation: ["Let sum = total sum.", "If (sum + target) is negative or odd, return 0.", "Target subset sum S = (sum + target) / 2.", "Run 0/1 knapsack to count subsets summing to S."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const target = parseInt(lines[1], 10);
      const sum = nums.reduce((a, b) => a + b, 0);
      if (Math.abs(target) > sum || (sum + target) % 2 !== 0) return "0";
      const s = (sum + target) / 2;
      const dp = new Array(s + 1).fill(0);
      dp[0] = 1;
      for (const num of nums) {
        for (let j = s; j >= num; j--) {
          dp[j] += dp[j - num];
        }
      }
      return String(dp[s]);
    },
    rawInputs: [
      "1 1 1 1 1\n3",
      "1\n1",
      "1\n2",
      "1 2 3\n0",
      "2 2 2\n2",
      "1 2 1\n0",
      "0 0 0 0 1\n1",
      "2 5 7 8\n4",
      "1 2 3 4 5\n3",
      "10 20 30\n0"
    ]
  },

  // 88. Partition Equal Subset Sum
  {
    id: "ch_partition_equal_subset_sum",
    title: "Partition Equal Subset Sum",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given an integer array `nums`, return `true` if you can partition the array into two subsets such that the sum of the elements in both subsets is equal or `false` otherwise.",
    constraints: ["1 <= nums.length <= 200", "1 <= nums[i] <= 100"],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "true or false",
    hints: ["If total sum is odd, cannot partition.", "0/1 Knapsack to find subset with sum = totalSum / 2."],
    objective: "Determine if array can be partitioned into two equal-sum subsets.",
    conceptualExplanation: ["Total sum = sum(nums).", "If sum % 2 !== 0 return false.", "Target = sum / 2.", "1D boolean DP array: dp[j] = dp[j] || dp[j - num]."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const total = nums.reduce((a, b) => a + b, 0);
      if (total % 2 !== 0) return "false";
      const target = total / 2;
      const dp = new Array(target + 1).fill(false);
      dp[0] = true;
      for (const x of nums) {
        for (let j = target; j >= x; j--) {
          if (dp[j - x]) dp[j] = true;
        }
      }
      return String(dp[target]);
    },
    rawInputs: [
      "1 5 11 5",
      "1 2 3 5",
      "1 2 3 4 5 6 7",
      "2 2",
      "1 1 1 1",
      "100",
      "1 2 5",
      "14 9 8 4 3 2",
      "2 2 3 5",
      "10 20 30"
    ]
  },

  // 89. Edit Distance Levenshtein
  {
    id: "ch_edit_distance",
    title: "Edit Distance (Levenshtein Distance)",
    difficulty: "Medium",
    category: "Dynamic Programming",
    description: "Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`. You have the following three operations permitted on a word:\n• Insert a character\n• Delete a character\n• Replace a character",
    constraints: ["0 <= word1.length, word2.length <= 500", "word1 and word2 consist of lowercase English letters."],
    inputFormat: "Line 1: word1 (empty if empty string)\nLine 2: word2 (empty if empty string)",
    outputFormat: "Minimum operations integer.",
    hints: ["Classical 2D DP Levenshtein table.", "If w1[i] == w2[j], dp[i][j] = dp[i-1][j-1]. Else 1 + min(insert, delete, replace)."],
    objective: "Compute minimum edit operations to transform one string into another.",
    conceptualExplanation: ["dp[i][j] = min operations to convert word1[0..i] to word2[0..j].", "Base cases: dp[i][0] = i, dp[0][j] = j.", "Fill table bottom-up."],
    solve: (input) => {
      const lines = input.split("\n");
      const w1 = lines[0] ? lines[0].trim() : "";
      const w2 = lines[1] ? lines[1].trim() : "";
      const m = w1.length, n = w2.length;
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (w1[i - 1] === w2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1];
          } else {
            dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
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
      "saturday\nsunday",
      "flaw\nflower",
      "zoologico\nzoologia",
      "distance\nediting"
    ]
  },

  // 90. Burst Balloons Maximum Coins
  {
    id: "ch_burst_balloons",
    title: "Burst Balloons Maximum Coins",
    difficulty: "Hard",
    category: "Dynamic Programming",
    description: "You are given `n` balloons, indexed from 0 to n - 1. Each balloon is painted with a number on it represented by an array `nums`. You are asked to burst all the balloons. If you burst the i-th balloon, you will get `nums[i - 1] * nums[i] * nums[i + 1]` coins. If `i - 1` or `i + 1` goes out of bounds, treat it as if there is a balloon with a 1 painted on it. Return the maximum coins you can collect by bursting the balloons wisely.",
    constraints: ["n == nums.length", "1 <= n <= 300", "0 <= nums[i] <= 100"],
    inputFormat: "Line 1: Space-separated integers representing balloon numbers.",
    outputFormat: "Maximum coins collected integer.",
    hints: ["Reverse thinking: think of which balloon is burst LAST in range [i, j]."],
    objective: "Maximize burst coins using interval dynamic programming.",
    conceptualExplanation: ["Pad array with 1 at both ends.", "dp[i][j] = max coins bursting all balloons strictly between i and j.", "Iterate over last balloon k to burst: dp[i][j] = max(dp[i][k] + dp[k][j] + nums[i]*nums[k]*nums[j])."],
    solve: (input) => {
      const nums = [1, ...input.trim().split(/\s+/).map(Number), 1];
      const n = nums.length;
      const dp = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let len = 2; len < n; len++) {
        for (let i = 0; i < n - len; i++) {
          const j = i + len;
          for (let k = i + 1; k < j; k++) {
            dp[i][j] = Math.max(dp[i][j], dp[i][k] + dp[k][j] + nums[i] * nums[k] * nums[j]);
          }
        }
      }
      return String(dp[0][n - 1]);
    },
    rawInputs: [
      "3 1 5 8",
      "1 5",
      "7",
      "1 2 3",
      "9 76 64 21",
      "3 2 5",
      "8 2 6 9 1",
      "1 1 1",
      "4 1 5",
      "2 3 7 9"
    ]
  },

  // 91. Lemonade Change Greed
  {
    id: "ch_lemonade_change",
    title: "Lemonade Change Simulator",
    difficulty: "Easy",
    category: "Greedy",
    description: "At a lemonade stand, each lemonade costs $5. Customers are standing in a queue to buy from you and order one at a time. Each customer will only buy one lemonade and pay with either a $5, $10, or $20 bill. You must provide the correct change to each customer so that the net transaction is that the customer pays $5. Return `true` if you can provide every customer with the correct change, or `false` otherwise.",
    constraints: ["1 <= bills.length <= 10^5", "bills[i] is either 5, 10, or 20."],
    inputFormat: "Line 1: Space-separated integers representing customer bills.",
    outputFormat: "true or false",
    hints: ["Greedy: always give $10 + $5 for a $20 bill before giving three $5 bills."],
    objective: "Simulate cash change distribution greedily.",
    conceptualExplanation: ["Track fiveCount and tenCount.", "On 5: fiveCount++.", "On 10: if fiveCount == 0 return false; fiveCount--; tenCount++.", "On 20: prefer 10+5, else 5+5+5."],
    solve: (input) => {
      const bills = input.trim().split(/\s+/).map(Number);
      let five = 0, ten = 0;
      for (const b of bills) {
        if (b === 5) {
          five++;
        } else if (b === 10) {
          if (five === 0) return "false";
          five--;
          ten++;
        } else {
          if (ten > 0 && five > 0) {
            ten--;
            five--;
          } else if (five >= 3) {
            five -= 3;
          } else {
            return "false";
          }
        }
      }
      return "true";
    },
    rawInputs: [
      "5 5 5 10 20",
      "5 5 10 10 20",
      "5",
      "10",
      "5 5 5 5 20 20",
      "5 10 5 10 5 20",
      "5 5 5 5 10 5 10 10 10 20",
      "5 5 5 20",
      "20",
      "5 10 20"
    ]
  },

  // 92. Assign Cookies to Children
  {
    id: "ch_assign_cookies",
    title: "Assign Cookies to Children",
    difficulty: "Easy",
    category: "Greedy",
    description: "Assume you are an awesome parent and want to give your children some cookies. But, you should give each child at most one cookie. Each child `i` has a greed factor `g[i]`, which is the minimum size of a cookie that the child will be content with; and each cookie `j` has a size `s[j]`. If `s[j] >= g[i]`, we can assign the cookie `j` to the child `i`, and the child `i` will be content. Your goal is to maximize the number of your content children and output the maximum number.",
    constraints: ["1 <= g.length <= 3 * 10^4", "0 <= s.length <= 3 * 10^4", "1 <= g[i], s[j] <= 2^31 - 1"],
    inputFormat: "Line 1: Space-separated children greed factors g\nLine 2: Space-separated cookie sizes s",
    outputFormat: "Maximum content children integer.",
    hints: ["Sort both children greed and cookie sizes.", "Greedily satisfy least greedy children first."],
    objective: "Maximize satisfied children by matching sorted greed factors with cookie sizes.",
    conceptualExplanation: ["Sort g and s.", "Pointer i for children, pointer j for cookies.", "If s[j] >= g[i], satisfy child: i++.", "Always j++."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const g = lines[0].trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      const s = lines[1] ? lines[1].trim().split(/\s+/).map(Number).sort((a, b) => a - b) : [];
      let i = 0, j = 0;
      while (i < g.length && j < s.length) {
        if (s[j] >= g[i]) i++;
        j++;
      }
      return String(i);
    },
    rawInputs: [
      "1 2 3\n1 1",
      "1 2\n1 2 3",
      "1 2 3\n3",
      "10 9 8 7\n5 6 7 8",
      "5\n10",
      "5\n2",
      "1 2 3 4 5\n1 2 3 4 5",
      "3 4 5\n1 2",
      "1 2 3\n1 2 3",
      "10 20 30\n15 25 35"
    ]
  },

  // 93. Gas Station Circular Route
  {
    id: "ch_gas_station_circuit",
    title: "Gas Station Circular Route",
    difficulty: "Medium",
    category: "Greedy",
    description: "There are n gas stations along a circular route, where the amount of gas at the i-th station is `gas[i]`. You have a car with an unlimited gas tank and it costs `cost[i]` of gas to travel from the i-th station to its next `(i + 1)`-th station. You begin the journey with an empty tank at one of the gas stations. Given two integer arrays `gas` and `cost`, return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return -1. If there exists a solution, it is guaranteed to be unique.",
    constraints: ["n == gas.length == cost.length", "1 <= n <= 10^5", "0 <= gas[i], cost[i] <= 10^4"],
    inputFormat: "Line 1: Space-separated gas values\nLine 2: Space-separated cost values",
    outputFormat: "Starting station index integer, or -1.",
    hints: ["If total gas < total cost, complete trip is impossible.", "If current tank drops below 0 at station i, restart start station at i + 1."],
    objective: "Find valid starting station to complete circular route in O(N) time.",
    conceptualExplanation: ["If sum(gas) < sum(cost), return -1.", "Iterate stations accumulating tank.", "If tank < 0, reset start = i + 1, tank = 0.", "Return start."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const gas = lines[0].trim().split(/\s+/).map(Number);
      const cost = lines[1].trim().split(/\s+/).map(Number);
      let totalGas = 0, totalCost = 0, tank = 0, start = 0;
      for (let i = 0; i < gas.length; i++) {
        totalGas += gas[i];
        totalCost += cost[i];
        tank += gas[i] - cost[i];
        if (tank < 0) {
          start = i + 1;
          tank = 0;
        }
      }
      return String(totalGas >= totalCost ? start : -1);
    },
    rawInputs: [
      "1 2 3 4 5\n3 4 5 1 2",
      "2 3 4\n3 4 3",
      "5 1 2 3 4\n4 4 1 5 1",
      "3 1 1\n1 2 2",
      "4\n5",
      "5\n4",
      "1 2 3 4 5\n1 2 3 4 5",
      "2 0 1 2 3 4 0\n0 1 0 0 0 0 11",
      "10 20 30\n15 15 15",
      "3 4 5\n4 5 3"
    ]
  },

  // 94. Candy Distribution Two-Pass
  {
    id: "ch_candy_distribution",
    title: "Candy Distribution (Two-Pass Greedy)",
    difficulty: "Hard",
    category: "Greedy",
    description: "There are `n` children standing in a line. Each child is assigned a rating value given in the integer array `ratings`. You are giving candies to these children subjected to the following requirements:\n1. Each child must have at least one candy.\n2. Children with a higher rating get more candies than their neighbors.\nReturn the minimum number of candies you need to have to distribute the candies to the children.",
    constraints: ["n == ratings.length", "1 <= n <= 2 * 10^4", "0 <= ratings[i] <= 2 * 10^4"],
    inputFormat: "Line 1: Space-separated integers representing ratings.",
    outputFormat: "Minimum candies integer.",
    hints: ["Pass left-to-right ensuring right neighbor with higher rating gets more.", "Pass right-to-left ensuring left neighbor with higher rating gets more."],
    objective: "Minimize total candies satisfying neighbor rating constraints in two passes.",
    conceptualExplanation: ["Initialize candies = [1, ..., 1].", "Left-to-right: if ratings[i] > ratings[i-1], candies[i] = candies[i-1] + 1.", "Right-to-left: if ratings[i] > ratings[i+1], candies[i] = max(candies[i], candies[i+1] + 1).", "Return sum."],
    solve: (input) => {
      const ratings = input.trim().split(/\s+/).map(Number);
      const n = ratings.length;
      const candies = new Array(n).fill(1);
      for (let i = 1; i < n; i++) {
        if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
      }
      for (let i = n - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i + 1]) candies[i] = Math.max(candies[i], candies[i + 1] + 1);
      }
      return String(candies.reduce((a, b) => a + b, 0));
    },
    rawInputs: [
      "1 0 2",
      "1 2 2",
      "1",
      "1 2 3 4 5",
      "5 4 3 2 1",
      "1 3 2 2 1",
      "1 2 87 87 87 2 1",
      "1 3 4 5 2",
      "1 6 10 8 7 3 2",
      "5 5 5 5 5"
    ]
  },

  // 95. Jump Game II Minimum Jumps
  {
    id: "ch_jump_game_ii",
    title: "Jump Game II (Minimum Jumps)",
    difficulty: "Medium",
    category: "Greedy",
    description: "You are given a 0-indexed array of integers `nums` of length n. You are initially positioned at `nums[0]`. Each element `nums[i]` represents the maximum length of a forward jump from index `i`. Return the minimum number of jumps to reach `nums[n - 1]`.",
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 1000", "It's guaranteed that you can reach nums[n - 1]."],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "Minimum jumps integer.",
    hints: ["Greedy BFS: maintain current jump boundary and farthest reachable index."],
    objective: "Compute minimum jumps required to reach array end.",
    conceptualExplanation: ["jumps = 0, currentEnd = 0, farthest = 0.", "Iterate to n - 1: farthest = max(farthest, i + nums[i]).", "When i === currentEnd: jumps++, currentEnd = farthest."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      if (nums.length <= 1) return "0";
      let jumps = 0, curEnd = 0, farthest = 0;
      for (let i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i === curEnd) {
          jumps++;
          curEnd = farthest;
          if (curEnd >= nums.length - 1) break;
        }
      }
      return String(jumps);
    },
    rawInputs: [
      "2 3 1 1 4",
      "2 3 0 1 4",
      "1",
      "1 2",
      "1 1 1 1",
      "5 9 3 2 1 0 2 3 3 1 0 0",
      "2 1",
      "3 2 1 0 4",
      "10 9 8 7 6 5 4 3 2 1 1 0",
      "7 0 9 6 9 6 1 7 9 0 1 2 9 0 3"
    ]
  },

  // 96. Summary Ranges Intervals
  {
    id: "ch_summary_ranges",
    title: "Summary Ranges Intervals",
    difficulty: "Easy",
    category: "Intervals",
    description: "You are given a sorted unique integer array `nums`. A range `[a,b]` is the set of all integers from a to b, inclusive. Return the smallest sorted list of ranges that cover all the numbers in the array exactly. Output ranges formatted as `a->b` (if a != b) or `a` (if a == b), space-separated.",
    constraints: ["0 <= nums.length <= 20", "-2^31 <= nums[i] <= 2^31 - 1", "All the values of nums are unique.", "nums is sorted in ascending order."],
    inputFormat: "Line 1: Space-separated integers representing nums (empty if none).",
    outputFormat: "Space-separated range strings.",
    hints: ["Two pointers or scan consecutive numbers."],
    objective: "Compress contiguous number sequences into interval representations.",
    conceptualExplanation: ["Scan array grouping adjacent differences === 1.", "If start === end, record 'start'.", "Else record 'start->end'."],
    solve: (input) => {
      const str = input.trim();
      if (!str) return "";
      const nums = str.split(/\s+/).map(Number);
      const res = [];
      let i = 0;
      while (i < nums.length) {
        let start = nums[i];
        while (i + 1 < nums.length && nums[i + 1] === nums[i] + 1) i++;
        let end = nums[i];
        if (start === end) res.push(`${start}`);
        else res.push(`${start}->${end}`);
        i++;
      }
      return res.join(" ");
    },
    rawInputs: [
      "0 1 2 4 5 7",
      "0 2 3 4 6 8 9",
      "1",
      "",
      "1 2 3 4 5",
      "1 3 5 7",
      "-5 -4 -3 0 2 3",
      "10 11 12 20 21 30",
      "0 1 2 3",
      "-10 -9 -8"
    ]
  },

  // 97. Insert Interval
  {
    id: "ch_insert_interval",
    title: "Insert Interval into Non-overlapping Schedule",
    difficulty: "Medium",
    category: "Intervals",
    description: "You are given an array of non-overlapping intervals `intervals` where `intervals[i] = [starti, endi]` represent the start and the end of the i-th interval and intervals is sorted in ascending order by starti. You are also given an interval `newInterval = [start, end]`. Insert `newInterval` into `intervals` such that intervals is still sorted in ascending order by starti and intervals still does not have any overlapping intervals (merge overlapping intervals if necessary).",
    constraints: ["0 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= starti <= endi <= 10^5", "intervals is sorted by starti in ascending order."],
    inputFormat: "Line 1: Number of intervals n\nNext n lines: start end per interval\nLast line: newInterval start and end",
    outputFormat: "Resulting intervals space-separated on separate lines.",
    hints: ["Add intervals before newInterval.", "Merge overlapping intervals with newInterval.", "Add intervals after newInterval."],
    objective: "Insert and merge a new interval into sorted non-overlapping intervals.",
    conceptualExplanation: ["Add all intervals ending before newInterval starts.", "Merge all overlapping intervals by expanding newInterval bounds.", "Add merged interval and remaining intervals."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0], 10);
      const intervals = [];
      for (let i = 1; i <= n; i++) {
        intervals.push(lines[i].trim().split(/\s+/).map(Number));
      }
      let [start, end] = lines[n + 1].trim().split(/\s+/).map(Number);
      const res = [];
      let i = 0;
      while (i < n && intervals[i][1] < start) {
        res.push(intervals[i]);
        i++;
      }
      while (i < n && intervals[i][0] <= end) {
        start = Math.min(start, intervals[i][0]);
        end = Math.max(end, intervals[i][1]);
        i++;
      }
      res.push([start, end]);
      while (i < n) {
        res.push(intervals[i]);
        i++;
      }
      return res.map(int => `${int[0]} ${int[1]}`).join("\n");
    },
    rawInputs: [
      "2\n1 3\n6 9\n2 5",
      "5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8",
      "0\n5 7",
      "1\n1 5\n2 3",
      "1\n1 5\n2 7",
      "2\n1 5\n6 8\n0 9",
      "2\n3 5\n8 10\n1 2",
      "2\n3 5\n8 10\n12 15",
      "3\n1 3\n5 7\n9 11\n4 8",
      "4\n1 2\n3 4\n5 6\n7 8\n2 7"
    ]
  },

  // 98. Non-overlapping Intervals Erase Count
  {
    id: "ch_non_overlapping_intervals",
    title: "Non-overlapping Intervals Erase Count",
    difficulty: "Medium",
    category: "Intervals",
    description: "Given an array of intervals `intervals` where `intervals[i] = [starti, endi]`, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
    constraints: ["1 <= intervals.length <= 10^5", "intervals[i].length == 2", "-5 * 10^4 <= starti < endi <= 5 * 10^4"],
    inputFormat: "Line 1: Number of intervals n\nNext n lines: start end per interval",
    outputFormat: "Minimum removals integer.",
    hints: ["Greedy: sort intervals by end time.", "Always pick interval that finishes earliest."],
    objective: "Minimize removed intervals using interval scheduling greed.",
    conceptualExplanation: ["Sort intervals by end time ascending.", "Iterate intervals: if interval[start] >= prevEnd, keep it and update prevEnd.", "Else count removal."],
    solve: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0], 10);
      const intervals = [];
      for (let i = 1; i <= n; i++) {
        intervals.push(lines[i].trim().split(/\s+/).map(Number));
      }
      intervals.sort((a, b) => a[1] - b[1]);
      let removals = 0, prevEnd = -Infinity;
      for (const [s, e] of intervals) {
        if (s >= prevEnd) {
          prevEnd = e;
        } else {
          removals++;
        }
      }
      return String(removals);
    },
    rawInputs: [
      "4\n1 2\n2 3\n3 4\n1 3",
      "3\n1 2\n1 2\n1 2",
      "2\n1 2\n2 3",
      "1\n1 10",
      "4\n1 100\n11 22\n1 11\n2 12",
      "3\n1 10\n2 3\n3 4",
      "5\n1 2\n2 3\n3 4\n4 5\n1 5",
      "3\n0 2\n1 3\n2 4",
      "4\n1 4\n2 3\n3 5\n4 6",
      "3\n1 5\n2 3\n3 4"
    ]
  },

  // 99. Bitwise AND of Numbers Range
  {
    id: "ch_bitwise_and_numbers_range",
    title: "Bitwise AND of Numbers Range",
    difficulty: "Medium",
    category: "Bit Manipulation",
    description: "Given two integers `left` and `right` that represent the range `[left, right]`, return the bitwise AND of all numbers in this range, inclusive.",
    constraints: ["0 <= left <= right <= 2^31 - 1"],
    inputFormat: "Line 1: Two space-separated integers left and right.",
    outputFormat: "Bitwise AND result integer.",
    hints: ["Find the common binary prefix between left and right.", "Shift both right until they are equal, then shift back left."],
    objective: "Compute bitwise AND across integer range by isolating common binary prefix.",
    conceptualExplanation: ["Bits that change between left and right become 0.", "Shift both numbers right until left === right.", "Shift left back by the number of shifted steps."],
    solve: (input) => {
      let [left, right] = input.trim().split(/\s+/).map(Number);
      let shifts = 0;
      while (left < right) {
        left >>= 1;
        right >>= 1;
        shifts++;
      }
      return String(left << shifts);
    },
    rawInputs: [
      "5 7",
      "0 0",
      "1 2147483647",
      "0 1",
      "10 15",
      "26 30",
      "12 12",
      "9 12",
      "16 31",
      "600000000 2147483645"
    ]
  },

  // 100. Single Number III (Two Elements Appearing Once)
  {
    id: "ch_single_number_iii",
    title: "Single Number III (Two Unique Elements)",
    difficulty: "Medium",
    category: "Bit Manipulation",
    description: "Given an integer array `nums`, in which exactly two elements appear only once and all the other elements appear exactly twice. Find the two elements that appear only once. You can return the answer in any order (output them sorted ascending, space-separated). You must write an algorithm that runs in linear runtime complexity and uses only constant extra space.",
    constraints: ["2 <= nums.length <= 3 * 10^4", "-2^31 <= nums[i] <= 2^31 - 1", "Each integer in nums will appear twice, only two will appear once."],
    inputFormat: "Line 1: Space-separated integers representing nums.",
    outputFormat: "Two space-separated integers sorted ascending.",
    hints: ["XOR of all numbers = a ^ b.", "Find any set bit in a ^ b (e.g. diff & (-diff)) to partition numbers into two groups."],
    objective: "Identify two unique elements among duplicates using bit partitioning.",
    conceptualExplanation: ["XOR all numbers to get xorSum = a ^ b.", "Find rightmost set bit: diff = xorSum & (-xorSum).", "Partition numbers into two groups based on that bit and XOR each group.", "Sort and return the two results."],
    solve: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let xor = 0;
      for (const x of nums) xor ^= x;
      const diff = xor & (-xor);
      let a = 0, b = 0;
      for (const x of nums) {
        if ((x & diff) !== 0) a ^= x;
        else b ^= x;
      }
      const sorted = [a, b].sort((x, y) => x - y);
      return sorted.join(" ");
    },
    rawInputs: [
      "1 2 1 3 2 5",
      "-1 0",
      "0 1",
      "1 1 2 3 4 4",
      "10 20 30 10 20 40",
      "7 8 9 9 8 11",
      "100 200 300 100 400 200",
      "-5 -5 10 20",
      "2 4 6 8 10 2 6 10",
      "42 99 42 101"
    ]
  }
];

module.exports = { partB };
