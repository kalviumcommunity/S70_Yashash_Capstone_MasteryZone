// Part 2: Topics 6-10 (Stacks, Queues, Linked Lists, Recursion, Binary Search)
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

const part2Challenges = [
  // ================= 6. STACKS =================
  makeChallenge({
    id: "ch_min_stack",
    title: "Min Stack Operations Simulator",
    difficulty: "Medium",
    category: "Stacks",
    description: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time O(1).\n\nSimulate operations: 'push val', 'pop', 'top', 'getMin'. Output space-separated answers for each 'top' and 'getMin' call.",
    inputFormat: "Line 1: Number of operations n.\nNext n lines: Command ('push X', 'pop', 'top', 'getMin').",
    outputFormat: "A single line containing space-separated results of 'top' and 'getMin' operations.",
    constraints: ["1 <= n <= 3 * 10^4", "Operations 'pop', 'top' and 'getMin' are only called on non-empty stacks."],
    examples: [
      { input: "6\npush -2\npush 0\npush -3\ngetMin\npop\ntop\ngetMin", output: "-3 0 -2", explanation: "getMin returns -3. After pop, top is 0 and getMin is -2." }
    ],
    hints: [
      "Use two stacks: a primary data stack and an auxiliary minStack.",
      "When pushing x, also push min(x, minStack.top()) onto minStack.",
      "Pop simultaneously from both stacks; getMin simply inspects minStack.top()."
    ],
    objective: "Implement a LIFO data structure supporting O(1) minimum element queries.",
    conceptualExplanation: [
      "Step 1: Read operation count n.",
      "Step 2: Maintain main stack and min-tracking stack.",
      "Step 3: On push x: push to main stack; if minStack empty or x <= minStack.top, push to minStack.",
      "Step 4: On pop: if popped == minStack.top, pop minStack as well.",
      "Step 5: Output top and getMin values space-separated."
    ],
    testInputs: [
      "6\npush -2\npush 0\npush -3\ngetMin\npop\ngetMin",
      "4\npush 5\npush 10\ntop\ngetMin",
      "5\npush 1\npush 2\ntop\ngetMin\ntop",
      "5\npush 2\npush 0\npush 3\npush 0\ngetMin",
      "7\npush 2147483646\npush 2147483646\npush 2147483647\ntop\npop\ngetMin\npop",
      "4\npush -1\ntop\ngetMin\npop",
      "8\npush 4\npush 3\npush 2\ngetMin\npop\ngetMin\npop\ngetMin",
      "6\npush 1\npush 1\npush 1\ngetMin\npop\ngetMin",
      "6\npush 10\npush -5\npush 20\ngetMin\ntop\npop",
      "7\npush 7\npush 3\npush 8\ngetMin\npop\ngetMin\ntop"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0].trim(), 10);
      const stack = [], minStack = [], output = [];
      for (let i = 1; i <= n; i++) {
        const parts = lines[i].trim().split(/\s+/);
        const cmd = parts[0];
        if (cmd === "push") {
          const val = parseInt(parts[1], 10);
          stack.push(val);
          if (!minStack.length || val <= minStack[minStack.length - 1]) minStack.push(val);
        } else if (cmd === "pop") {
          const popped = stack.pop();
          if (popped === minStack[minStack.length - 1]) minStack.pop();
        } else if (cmd === "top") {
          output.push(stack[stack.length - 1]);
        } else if (cmd === "getMin") {
          output.push(minStack[minStack.length - 1]);
        }
      }
      return output.join(" ");
    }
  }),

  makeChallenge({
    id: "ch_daily_temperatures",
    title: "Daily Temperatures",
    difficulty: "Medium",
    category: "Stacks",
    description: "Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the `i`th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0`.",
    inputFormat: "A single line containing space-separated integers representing daily temperatures.",
    outputFormat: "A single line containing space-separated integers of wait days.",
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    examples: [
      { input: "73 74 75 71 69 72 76 73", output: "1 1 4 2 1 1 0 0", explanation: "Day 0 (73) waits 1 day for 74. Day 2 (75) waits 4 days for 76." },
      { input: "30 40 50 60", output: "1 1 1 0", explanation: "Each day waits 1 day except the last." }
    ],
    hints: [
      "Use a monotonic decreasing stack storing indices of temperatures.",
      "When iterating through temperatures, while current temp is greater than temp at stack top, pop and record day difference.",
      "Push current index onto stack."
    ],
    objective: "Compute next warmer temperature span for each day using monotonic stack in O(n).",
    conceptualExplanation: [
      "Step 1: Allocate result array of size n initialized to 0.",
      "Step 2: Maintain stack of indices.",
      "Step 3: For i from 0 to n - 1, while stack non-empty and temp[i] > temp[stack.top], pop idx and res[idx] = i - idx.",
      "Step 4: Push i onto stack.",
      "Step 5: Output result array space-separated."
    ],
    testInputs: [
      "73 74 75 71 69 72 76 73", "30 40 50 60", "30 60 90", "50 40 30", "80",
      "40 40 40", "55 38 53 81 61 93 97 32 43 78", "89 62 70 58 47 47 46 76 100 70", "20 30 20 40", "10 20 15 25"
    ],
    solver: (input) => {
      const temps = input.trim().split(/\s+/).map(Number);
      const res = new Array(temps.length).fill(0);
      const stack = [];
      for (let i = 0; i < temps.length; i++) {
        while (stack.length && temps[i] > temps[stack[stack.length - 1]]) {
          const prev = stack.pop();
          res[prev] = i - prev;
        }
        stack.push(i);
      }
      return res.join(" ");
    }
  }),

  makeChallenge({
    id: "ch_eval_rpn",
    title: "Evaluate Reverse Polish Notation",
    difficulty: "Medium",
    category: "Stacks",
    description: "You are given an array of strings `tokens` that represents an arithmetic expression in Reverse Polish Notation (RPN).\n\nEvaluate the expression. Return an integer that represents the value of the expression.\n\nValid operators are `+`, `-`, `*`, and `/`. Division truncates toward zero.",
    inputFormat: "A single line containing space-separated tokens.",
    outputFormat: "A single integer: evaluated result.",
    constraints: ["1 <= tokens.length <= 10^4", "Each token is either an operator ('+', '-', '*', '/') or an integer in range [-200, 200]."],
    examples: [
      { input: "2 1 + 3 *", output: "9", explanation: "((2 + 1) * 3) = 9." },
      { input: "4 13 5 / +", output: "6", explanation: "(4 + (13 / 5)) = 6." }
    ],
    hints: [
      "Iterate through the tokens from left to right.",
      "If token is a number, push it onto the stack.",
      "If token is an operator, pop the two most recent numbers, apply operator (note order: second popped OP first popped), and push result."
    ],
    objective: "Evaluate postfix arithmetic expressions using an operand stack.",
    conceptualExplanation: [
      "Step 1: Read tokens space-separated.",
      "Step 2: Initialize stack.",
      "Step 3: If token is operator, pop b then a; compute a op b (Math.trunc for division); push result.",
      "Step 4: Else parse token as integer and push onto stack.",
      "Step 5: Output stack[0]."
    ],
    testInputs: [
      "2 1 + 3 *", "4 13 5 / +", "10 6 9 3 + -11 * / * 17 + 5 +", "3 4 -", "5",
      "15 7 1 1 + - / 3 * 2 1 1 + + -", "4 3 -", "-2 3 *", "6 2 /", "18 6 / 2 +"
    ],
    solver: (input) => {
      const tokens = input.trim().split(/\s+/);
      const stack = [];
      for (const t of tokens) {
        if (t === "+" || t === "-" || t === "*" || t === "/") {
          const b = stack.pop();
          const a = stack.pop();
          let val = 0;
          if (t === "+") val = a + b;
          else if (t === "-") val = a - b;
          else if (t === "*") val = a * b;
          else if (t === "/") val = Math.trunc(a / b);
          stack.push(val);
        } else {
          stack.push(parseInt(t, 10));
        }
      }
      return String(stack[0]);
    }
  }),

  makeChallenge({
    id: "ch_next_greater_elem",
    title: "Next Greater Element I",
    difficulty: "Easy",
    category: "Stacks",
    description: "The next greater element of some element `x` in an array is the first greater element that is to the right of `x` in the same array.\n\nYou are given two distinct 0-indexed integer arrays `nums1` and `nums2`, where `nums1` is a subset of `nums2`.\n\nFor each `0 <= i < nums1.length`, find the index `j` such that `nums1[i] == nums2[j]` and determine the next greater element of `nums2[j]` in `nums2`. If there is no next greater element, then the answer for this query is `-1`.",
    inputFormat: "Line 1: Space-separated integers for nums1.\nLine 2: Space-separated integers for nums2.",
    outputFormat: "A single line containing space-separated integers representing the next greater elements.",
    constraints: ["1 <= nums1.length <= nums2.length <= 1000", "0 <= nums1[i], nums2[i] <= 10^4", "All integers in nums1 and nums2 are unique."],
    examples: [
      { input: "4 1 2\n1 3 4 2", output: "-1 3 -1", explanation: "For 4: no greater element -> -1. For 1: next greater is 3. For 2: no greater element -> -1." },
      { input: "2 4\n1 2 3 4", output: "3 -1", explanation: "For 2: next greater is 3. For 4: no greater element -> -1." }
    ],
    hints: [
      "Use a monotonic stack to process nums2 from left to right.",
      "Whenever the current element is greater than stack top, the current element is the next greater element for stack.pop(). Store in a map.",
      "Query the map for each element in nums1."
    ],
    objective: "Precompute next greater elements using a monotonic stack and lookup queries.",
    conceptualExplanation: [
      "Step 1: Read nums1 and nums2.",
      "Step 2: Traverse nums2 with a stack; map popped elements to current number.",
      "Step 3: Unmapped elements remaining in stack default to -1.",
      "Step 4: Map each element of nums1 to its stored next greater element.",
      "Step 5: Output space-separated results."
    ],
    testInputs: [
      "4 1 2\n1 3 4 2", "2 4\n1 2 3 4", "1 3 5 2 4\n6 5 4 3 2 1 7", "1\n1", "3 1 2\n3 2 1 4",
      "4 2\n4 2 6 8", "5 6\n6 5", "2 1\n1 2 3", "9 8\n8 9 10", "10 20\n20 10 30"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nums1 = lines[0].trim().split(/\s+/).map(Number);
      const nums2 = lines[1].trim().split(/\s+/).map(Number);
      const nextMap = new Map();
      const stack = [];
      for (const num of nums2) {
        while (stack.length && num > stack[stack.length - 1]) {
          nextMap.set(stack.pop(), num);
        }
        stack.push(num);
      }
      return nums1.map((x) => (nextMap.has(x) ? nextMap.get(x) : -1)).join(" ");
    }
  }),

  // ================= 7. QUEUES =================
  makeChallenge({
    id: "ch_queue_using_stacks",
    title: "Implement Queue using Stacks",
    difficulty: "Easy",
    category: "Queues",
    description: "Implement a first in first out (FIFO) queue using only two stacks. The implemented queue should support normal queue operations: `push`, `pop`, `peek`, and `empty`.\n\nSimulate operations and output space-separated values for all `pop`, `peek`, and `empty` queries.",
    inputFormat: "Line 1: Number of operations n.\nNext n lines: Commands ('push X', 'pop', 'peek', 'empty').",
    outputFormat: "A single line containing space-separated results of query operations.",
    constraints: ["1 <= n <= 100", "All calls to pop and peek are valid on non-empty queue."],
    examples: [
      { input: "5\npush 1\npush 2\npeek\npop\nempty", output: "1 1 false", explanation: "peek returns 1, pop returns 1, queue is not empty so empty returns false." }
    ],
    hints: [
      "Maintain two stacks: inStack for push, outStack for pop/peek.",
      "When outStack is empty and pop/peek is called, transfer all elements from inStack to outStack (reversing their order).",
      "This amortizes each operation to O(1) time."
    ],
    objective: "Simulate a FIFO queue using two LIFO stacks with amortized O(1) efficiency.",
    conceptualExplanation: [
      "Step 1: Read operations count n.",
      "Step 2: Maintain inStack and outStack.",
      "Step 3: On push x: inStack.push(x).",
      "Step 4: On pop/peek: if outStack is empty, pop all from inStack and push to outStack; then perform operation on outStack.",
      "Step 5: Output all query results space-separated."
    ],
    testInputs: [
      "5\npush 1\npush 2\npeek\npop\nempty", "3\npush 10\npop\nempty", "6\npush 1\npush 2\npush 3\npop\npeek\npop",
      "2\npush 5\npeek", "6\npush 1\npop\nempty\npush 2\npop\nempty", "4\npush 4\npush 5\npop\npop",
      "7\npush 8\npush 9\npeek\npush 10\npop\npeek\npop", "3\npush 42\npeek\npop", "5\npush 1\npush 2\npop\npush 3\npeek", "4\npush 1\nempty\npop\nempty"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const n = parseInt(lines[0].trim(), 10);
      const inStack = [], outStack = [], output = [];
      for (let i = 1; i <= n; i++) {
        const parts = lines[i].trim().split(/\s+/);
        const cmd = parts[0];
        if (cmd === "push") inStack.push(parseInt(parts[1], 10));
        else {
          if (!outStack.length) {
            while (inStack.length) outStack.push(inStack.pop());
          }
          if (cmd === "pop") output.push(outStack.pop());
          else if (cmd === "peek") output.push(outStack[outStack.length - 1]);
          else if (cmd === "empty") output.push(inStack.length === 0 && outStack.length === 0 ? "true" : "false");
        }
      }
      return output.join(" ");
    }
  }),

  makeChallenge({
    id: "ch_sliding_window_max",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    category: "Queues",
    description: "You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position.\n\nReturn the max sliding window values space-separated.",
    inputFormat: "Line 1: Space-separated integers representing array nums.\nLine 2: Integer k.",
    outputFormat: "A single line of space-separated integers representing maximum in each window.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "1 <= k <= nums.length"],
    examples: [
      { input: "1 3 -1 -3 5 3 6 7\n3", output: "3 3 5 5 6 7", explanation: "Window [1 3 -1] -> 3, [3 -1 -3] -> 3, [-1 -3 5] -> 5, etc." },
      { input: "1\n1", output: "1", explanation: "Only one window with maximum 1." }
    ],
    hints: [
      "Use a monotonic decreasing double-ended queue (deque) storing indices.",
      "Discard indices outside the current window from the front.",
      "Pop elements from the back smaller than the current element.",
      "The front of the deque always holds the index of the maximum element in the window."
    ],
    objective: "Identify the maximum element of every sliding window of width k in O(n) time.",
    conceptualExplanation: [
      "Step 1: Read array and window size k.",
      "Step 2: Maintain a deque of indices with decreasing values.",
      "Step 3: For each element i: remove front if front < i - k + 1; remove back while nums[back] < nums[i]; push i.",
      "Step 4: If i >= k - 1, append nums[deque.front()] to results.",
      "Step 5: Output results space-separated."
    ],
    testInputs: [
      "1 3 -1 -3 5 3 6 7\n3", "1\n1", "1 -1\n1", "9 11\n2", "4 -2\n2",
      "1 3 1 2 0 5\n3", "7 2 4\n2", "2 1 3 4 6 3 8 9 10 12 56\n4", "-7 -8 7 5 7 1 6 0\n4", "1 2 3 4 5\n3"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const k = parseInt(lines[1].trim(), 10);
      const deque = [], res = [];
      for (let i = 0; i < nums.length; i++) {
        if (deque.length && deque[0] < i - k + 1) deque.shift();
        while (deque.length && nums[deque[deque.length - 1]] < nums[i]) deque.pop();
        deque.push(i);
        if (i >= k - 1) res.push(nums[deque[0]]);
      }
      return res.join(" ");
    }
  }),

  makeChallenge({
    id: "ch_first_unique_stream",
    title: "First Non-Repeating Character in Stream",
    difficulty: "Medium",
    category: "Queues",
    description: "Given a stream of characters as a string, find the first non-repeating character after reading each character. If there is no non-repeating character at any point, output `#`.\n\nReturn the concatenated sequence of characters produced at each step.",
    inputFormat: "A single line containing the stream of lowercase characters.",
    outputFormat: "A single string representing the first unique character after each input character.",
    constraints: ["1 <= s.length <= 10^4", "s consists of lowercase English letters."],
    examples: [
      { input: "aabc", output: "a#bb", explanation: "After 'a' -> 'a'. After 'a' -> '#' (both repeat). After 'b' -> 'b'. After 'c' -> 'b'." },
      { input: "zz", output: "z#", explanation: "After 'z' -> 'z'. After second 'z' -> '#'." }
    ],
    hints: [
      "Use a queue to track characters in order of their arrival.",
      "Use a frequency array or hash map to count character occurrences.",
      "Pop characters from the front of the queue if their frequency exceeds 1."
    ],
    objective: "Track real-time non-repeating stream elements using an order queue.",
    conceptualExplanation: [
      "Step 1: Read stream string.",
      "Step 2: Maintain frequency map and FIFO queue.",
      "Step 3: For each character, increment frequency and push to queue.",
      "Step 4: While queue front has frequency > 1, pop front.",
      "Step 5: Append queue.front if non-empty, else append '#'; output result string."
    ],
    testInputs: [
      "aabc", "zz", "abc", "a", "aabb",
      "abadbc", "mastery", "babcd", "aaaaa", "racecar"
    ],
    solver: (input) => {
      const s = input.trim();
      const freq = {};
      const q = [];
      let res = "";
      for (const ch of s) {
        freq[ch] = (freq[ch] || 0) + 1;
        q.push(ch);
        while (q.length && freq[q[0]] > 1) q.shift();
        res += q.length ? q[0] : "#";
      }
      return res;
    }
  }),

  makeChallenge({
    id: "ch_circular_queue",
    title: "Design Circular Queue Capacity",
    difficulty: "Medium",
    category: "Queues",
    description: "Design your implementation of the circular queue. The circular queue is a linear data structure in which the operations are performed based on FIFO principle and the last position is connected back to the first position to make a circle.\n\nSimulate operations: enQueue X, deQueue, Front, Rear, isEmpty, isFull. Output space-separated results for all non-void operations.",
    inputFormat: "Line 1: Integer k (capacity).\nLine 2: Integer m (number of commands).\nNext m lines: Commands.",
    outputFormat: "A single line containing space-separated results of query operations.",
    constraints: ["1 <= k <= 1000", "1 <= m <= 1000", "0 <= value <= 1000"],
    examples: [
      { input: "3\n6\nenQueue 1\nenQueue 2\nenQueue 3\nisFull\nFront\nRear", output: "true 1 3", explanation: "Queue is full (true), Front is 1, Rear is 3." }
    ],
    hints: [
      "Use a fixed-size array of length k with head, tail, and size pointers.",
      "Advance pointers using modulo arithmetic: `(ptr + 1) % k`.",
      "isEmpty check size == 0, isFull check size == k."
    ],
    objective: "Implement a bounded ring-buffer queue using circular pointer wrapping.",
    conceptualExplanation: [
      "Step 1: Initialize fixed array of size k, head = 0, tail = 0, size = 0.",
      "Step 2: enQueue: if size < k, store at tail, tail = (tail + 1) % k, size++.",
      "Step 3: deQueue: if size > 0, head = (head + 1) % k, size--.",
      "Step 4: Front: return size > 0 ? arr[head] : -1; Rear: return size > 0 ? arr[(tail - 1 + k) % k] : -1.",
      "Step 5: Output query answers space-separated."
    ],
    testInputs: [
      "3\n6\nenQueue 1\nenQueue 2\nenQueue 3\nisFull\nFront\nRear",
      "2\n4\nenQueue 5\nisEmpty\ndeQueue\nisEmpty",
      "1\n3\nenQueue 10\nFront\nRear",
      "3\n7\nenQueue 1\nenQueue 2\ndeQueue\nenQueue 3\nFront\nRear\nisFull",
      "2\n4\nisEmpty\nenQueue 9\nFront\nisFull",
      "2\n5\nenQueue 1\nenQueue 2\nisFull\ndeQueue\nisFull",
      "4\n6\nenQueue 1\nenQueue 2\nenQueue 3\nenQueue 4\nFront\nRear",
      "1\n4\nenQueue 7\nisFull\ndeQueue\nisEmpty",
      "3\n6\nenQueue 1\ndeQueue\nenQueue 2\nenQueue 3\nFront\nRear",
      "2\n4\nenQueue 4\nRear\ndeQueue\nisEmpty"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const k = parseInt(lines[0].trim(), 10);
      const m = parseInt(lines[1].trim(), 10);
      const queue = new Array(k);
      let head = 0, tail = 0, size = 0;
      const output = [];
      for (let i = 2; i < 2 + m; i++) {
        const parts = lines[i].trim().split(/\s+/);
        const cmd = parts[0];
        if (cmd === "enQueue") {
          if (size < k) {
            queue[tail] = parseInt(parts[1], 10);
            tail = (tail + 1) % k;
            size++;
          }
        } else if (cmd === "deQueue") {
          if (size > 0) {
            head = (head + 1) % k;
            size--;
          }
        } else if (cmd === "Front") output.push(size === 0 ? -1 : queue[head]);
        else if (cmd === "Rear") output.push(size === 0 ? -1 : queue[(tail - 1 + k) % k]);
        else if (cmd === "isEmpty") output.push(size === 0 ? "true" : "false");
        else if (cmd === "isFull") output.push(size === k ? "true" : "false");
      }
      return output.join(" ");
    }
  }),

  // ================= 8. LINKED LISTS =================
  makeChallenge({
    id: "ch_reverse_linked_list",
    title: "Reverse a Singly Linked List",
    difficulty: "Easy",
    category: "Linked Lists",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list nodes.",
    inputFormat: "A single line containing space-separated integers representing the linked list nodes.",
    outputFormat: "A single line containing space-separated integers of the reversed list.",
    constraints: ["0 <= number of nodes <= 5000", "-5000 <= Node.val <= 5000"],
    examples: [
      { input: "1 2 3 4 5", output: "5 4 3 2 1", explanation: "All node links are reversed in direction." },
      { input: "1 2", output: "2 1", explanation: "List [1 -> 2] becomes [2 -> 1]." }
    ],
    hints: [
      "Maintain three pointers: prev, curr, and next.",
      "At each step, save curr.next, redirect curr.next to prev, then advance prev = curr and curr = next.",
      "When curr reaches null, prev is the new head of the reversed list."
    ],
    objective: "Reverse node pointers of a singly linked list in a single O(n) pass.",
    conceptualExplanation: [
      "Step 1: Read space-separated node values into array.",
      "Step 2: Reverse array using two-pointer swap.",
      "Step 3: Join array with spaces.",
      "Step 4: Output reversed sequence."
    ],
    testInputs: [
      "1 2 3 4 5", "1 2", "1", "10 20 30 40 50 60", "3 7 9",
      "-1 -2 -3", "0 5 0", "4 4 4 4", "9 8 7 6 5 4 3 2 1", "100 200"
    ],
    solver: (input) => {
      const nodes = input.trim().split(/\s+/).filter(Boolean);
      return nodes.reverse().join(" ");
    }
  }),

  makeChallenge({
    id: "ch_merge_two_sorted_lists",
    title: "Merge Two Sorted Linked Lists",
    difficulty: "Easy",
    category: "Linked Lists",
    description: "You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the space-separated values of the merged linked list.",
    inputFormat: "Line 1: Space-separated integers of list1.\nLine 2: Space-separated integers of list2.",
    outputFormat: "A single line of space-separated integers of the merged sorted list.",
    constraints: ["0 <= number of nodes in both lists <= 50", "-100 <= Node.val <= 100", "Both list1 and list2 are sorted in non-decreasing order."],
    examples: [
      { input: "1 2 4\n1 3 4", output: "1 1 2 3 4 4", explanation: "Nodes are combined in ascending order." },
      { input: "2\n1", output: "1 2", explanation: "Merged nodes: 1 -> 2." }
    ],
    hints: [
      "Use a dummy head node to simplify list building.",
      "Compare head values of list1 and list2; attach smaller node to tail and advance that list's pointer.",
      "Append any remaining nodes when one list is exhausted."
    ],
    objective: "Combine two ordered lists into a single continuous sorted list.",
    conceptualExplanation: [
      "Step 1: Read two lists of integers.",
      "Step 2: Use two pointers to compare elements.",
      "Step 3: Push smaller element to result and advance.",
      "Step 4: Append remainder of non-empty list.",
      "Step 5: Output combined sorted list."
    ],
    testInputs: [
      "1 2 4\n1 3 4", "2\n1", "1 5 9\n2 4 8", "1 2 3\n4 5 6", "10 30 50\n20 40 60",
      "-3 -1 0\n-2 1 2", "5\n5", "1 1 1\n2 2 2", "3 7 11 15\n1 4 8 12", "100\n50 150"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const a = lines[0].trim() ? lines[0].trim().split(/\s+/).map(Number) : [];
      const b = lines[1].trim() ? lines[1].trim().split(/\s+/).map(Number) : [];
      return [...a, ...b].sort((x, y) => x - y).join(" ");
    }
  }),

  makeChallenge({
    id: "ch_linked_list_cycle",
    title: "Linked List Cycle Detection",
    difficulty: "Easy",
    category: "Linked Lists",
    description: "Given `head`, the head of a linked list, determine if the linked list has a cycle in it.\n\nThere is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the `next` pointer. Return `true` if there is a cycle, or `false` otherwise.",
    inputFormat: "Line 1: Space-separated integers representing nodes.\nLine 2: Integer pos representing the 0-based index where the tail connects (-1 if no cycle).",
    outputFormat: "A single line with 'true' or 'false'.",
    constraints: ["0 <= number of nodes <= 10^4", "-10^5 <= Node.val <= 10^5", "pos is -1 or a valid index in the linked-list."],
    examples: [
      { input: "3 2 0 -4\n1", output: "true", explanation: "Tail connects to the 1st node (0-indexed), creating a cycle." },
      { input: "1\n-1", output: "false", explanation: "No cycle in single-node list." }
    ],
    hints: [
      "Floyd's Cycle-Finding Algorithm (Tortoise and Hare): use two pointers, slow moves 1 step and fast moves 2 steps.",
      "If there is a cycle, the fast pointer will eventually catch up and meet the slow pointer.",
      "If fast reaches null, there is no cycle."
    ],
    objective: "Detect cyclical pointer references in a linked list using O(1) space.",
    conceptualExplanation: [
      "Step 1: Read nodes and cycle position pos.",
      "Step 2: If pos >= 0, a cycle exists connecting tail to index pos.",
      "Step 3: If pos == -1, no cycle exists.",
      "Step 4: Output 'true' if pos >= 0, else 'false'."
    ],
    testInputs: [
      "3 2 0 -4\n1", "1 2\n0", "1\n-1", "1 2 3 4 5\n-1", "1 2 3 4 5\n2",
      "1 2\n-1", "10 20 30\n0", "5 6 7 8\n3", "7\n0", "10 20 30 40 50\n-1"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const pos = parseInt(lines[1].trim(), 10);
      return pos >= 0 ? "true" : "false";
    }
  }),

  makeChallenge({
    id: "ch_remove_nth_from_end",
    title: "Remove Nth Node From End of List",
    difficulty: "Medium",
    category: "Linked Lists",
    description: "Given the head of a linked list, remove the `n`th node from the end of the list and return its nodes.",
    inputFormat: "Line 1: Space-separated integers representing list nodes.\nLine 2: Integer n.",
    outputFormat: "A single line of space-separated integers after removal.",
    constraints: ["1 <= sz <= 1000", "0 <= Node.val <= 100", "1 <= n <= sz"],
    examples: [
      { input: "1 2 3 4 5\n2", output: "1 2 3 5", explanation: "2nd node from end (node 4) is removed." },
      { input: "1\n1", output: "", explanation: "Only node is removed, leaving empty list." }
    ],
    hints: [
      "Use two pointers separated by n steps: fast and slow.",
      "Advance fast by n steps first.",
      "Then advance both fast and slow together until fast reaches the end; slow will point right before the node to remove."
    ],
    objective: "Remove the target node from the rear in a single linear pass.",
    conceptualExplanation: [
      "Step 1: Read node values into array.",
      "Step 2: Calculate targetIndex = length - n.",
      "Step 3: Remove element at targetIndex.",
      "Step 4: Output remaining elements space-separated."
    ],
    testInputs: [
      "1 2 3 4 5\n2", "1\n1", "1 2\n1", "1 2\n2", "1 2 3 4\n4",
      "1 2 3 4\n1", "10 20 30 40 50\n3", "7 8 9\n2", "5 6 7 8\n1", "1 3 5 7 9\n5"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nodes = lines[0].trim().split(/\s+/).filter(Boolean);
      const n = parseInt(lines[1].trim(), 10);
      const targetIdx = nodes.length - n;
      if (targetIdx >= 0 && targetIdx < nodes.length) nodes.splice(targetIdx, 1);
      return nodes.join(" ");
    }
  }),

  // ================= 9. RECURSION =================
  makeChallenge({
    id: "ch_power_of_two",
    title: "Power of Two & Recursion",
    difficulty: "Easy",
    category: "Recursion",
    description: "Given an integer `n`, return `true` if it is a power of two. Otherwise, return `false`.\n\nAn integer `n` is a power of two if there exists an integer `x` such that `n == 2^x`.",
    inputFormat: "A single line containing the integer n.",
    outputFormat: "A single line with 'true' or 'false'.",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    examples: [
      { input: "1", output: "true", explanation: "2^0 = 1." },
      { input: "16", output: "true", explanation: "2^4 = 16." },
      { input: "3", output: "false", explanation: "3 is not a power of two." }
    ],
    hints: [
      "Recursive case: if n <= 0, false; if n == 1, true; if n % 2 != 0, false; else recurse on n / 2.",
      "Bitwise trick: powers of two have exactly one bit set: `(n > 0) && (n & (n - 1)) == 0`."
    ],
    objective: "Verify exponential power-of-two membership recursively or bitwise.",
    conceptualExplanation: [
      "Step 1: Read integer n.",
      "Step 2: Base cases: n <= 0 -> false, n == 1 -> true.",
      "Step 3: If n is odd, return false.",
      "Step 4: Recurse on n / 2.",
      "Step 5: Output 'true' or 'false'."
    ],
    testInputs: [
      "1", "16", "3", "4", "5", "0", "-16", "64", "1024", "218"
    ],
    solver: (input) => {
      const n = parseInt(input.trim(), 10);
      return n > 0 && (n & (n - 1)) === 0 ? "true" : "false";
    }
  }),

  makeChallenge({
    id: "ch_generate_parentheses",
    title: "Generate Parentheses Combinations",
    difficulty: "Medium",
    category: "Recursion",
    description: "Given `n` pairs of parentheses, write a function to generate all combinations of well-formed parentheses in lexicographical order.",
    inputFormat: "A single integer n.",
    outputFormat: "A single line containing space-separated well-formed parentheses strings.",
    constraints: ["1 <= n <= 8"],
    examples: [
      { input: "3", output: "((())) (()()) (())() ()(()) ()()()", explanation: "All 5 valid combinations for n=3." },
      { input: "1", output: "()", explanation: "Only 1 valid combination." }
    ],
    hints: [
      "Use backtracking with counts of open and close brackets used so far.",
      "You can add an opening bracket if open < n.",
      "You can add a closing bracket if close < open."
    ],
    objective: "Enumerate all balanced parentheses permutations using recursive backtracking.",
    conceptualExplanation: [
      "Step 1: Read n.",
      "Step 2: Define backtrack(current, open, close).",
      "Step 3: If current.length == 2 * n, record combination.",
      "Step 4: If open < n, backtrack(current + '(', open + 1, close).",
      "Step 5: If close < open, backtrack(current + ')', open, close + 1); output results joined by spaces."
    ],
    testInputs: [
      "1", "2", "3", "4", "0", "2", "1", "3", "2", "1"
    ],
    solver: (input) => {
      const n = parseInt(input.trim(), 10);
      if (n === 0) return "";
      const res = [];
      const bt = (str, open, close) => {
        if (str.length === 2 * n) { res.push(str); return; }
        if (open < n) bt(str + "(", open + 1, close);
        if (close < open) bt(str + ")", open, close + 1);
      };
      bt("", 0, 0);
      return res.join(" ");
    }
  }),

  makeChallenge({
    id: "ch_combination_sum",
    title: "Combination Sum Count",
    difficulty: "Medium",
    category: "Recursion",
    description: "Given an array of distinct integers `candidates` and a target integer `target`, return the number of unique combinations of `candidates` where the chosen numbers sum to `target`.\n\nThe same number may be chosen from `candidates` an unlimited number of times.",
    inputFormat: "Line 1: Space-separated integers representing candidates.\nLine 2: Target integer.",
    outputFormat: "A single integer: number of unique combinations.",
    constraints: ["1 <= candidates.length <= 30", "2 <= candidates[i] <= 40", "All elements of candidates are distinct.", "1 <= target <= 40"],
    examples: [
      { input: "2 3 6 7\n7", output: "2", explanation: "2 and 3 sum to 7: [7] and [2, 2, 3]. Total 2 combinations." },
      { input: "2 3 5\n8", output: "3", explanation: "[2, 2, 2, 2], [2, 3, 3], and [3, 5] sum to 8. Total 3 combinations." }
    ],
    hints: [
      "Sort candidates in ascending order to enable early pruning.",
      "Backtrack with an index pointer start: explore choosing candidate[i] and continuing from i (allowing reuse).",
      "Terminate branch when remainder < 0 or candidate[i] > remainder."
    ],
    objective: "Count unique subsets with replacement summing to target using depth-first search.",
    conceptualExplanation: [
      "Step 1: Read candidates and target.",
      "Step 2: Sort candidates ascending.",
      "Step 3: Define dfs(start, rem): if rem == 0, count++.",
      "Step 4: For i from start to length: if candidates[i] > rem, break; dfs(i, rem - candidates[i]).",
      "Step 5: Output count."
    ],
    testInputs: [
      "2 3 6 7\n7", "2 3 5\n8", "2\n1", "1\n2", "3 5\n10",
      "2 4\n6", "1 2\n4", "2 3 4\n6", "5 10\n15", "2 5\n12"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const cands = lines[0].trim().split(/\s+/).map(Number).sort((a, b) => a - b);
      const target = parseInt(lines[1].trim(), 10);
      let count = 0;
      const dfs = (start, rem) => {
        if (rem === 0) { count++; return; }
        for (let i = start; i < cands.length; i++) {
          if (cands[i] > rem) break;
          dfs(i, rem - cands[i]);
        }
      };
      dfs(0, target);
      return String(count);
    }
  }),

  makeChallenge({
    id: "ch_subsets",
    title: "Subsets Power Set Count & Size",
    difficulty: "Medium",
    category: "Recursion",
    description: "Given an integer array `nums` of unique elements, return two space-separated integers: the total size of its power set (2^n) and the number of subsets with size >= 2.",
    inputFormat: "A single line containing space-separated unique integers.",
    outputFormat: "Two space-separated integers: total subsets count and subsets of size >= 2.",
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10", "All numbers of nums are unique."],
    examples: [
      { input: "1 2 3", output: "8 4", explanation: "Total 2^3 = 8 subsets. Subsets of size >= 2 are [1,2], [1,3], [2,3], [1,2,3] (total 4)." },
      { input: "0", output: "2 0", explanation: "Total subsets are [] and [0]. Subsets of size >= 2 is 0." }
    ],
    hints: [
      "The total number of subsets of a set of size n is exactly 2^n.",
      "The subsets of size < 2 are the empty set (size 0) and the n singletons (size 1).",
      "Subsets of size >= 2 equals 2^n - 1 - n."
    ],
    objective: "Compute power set size and filter subset combinations by cardinality.",
    conceptualExplanation: [
      "Step 1: Read numbers into array; n = nums.length.",
      "Step 2: Total power set count = 2^n.",
      "Step 3: Count of subsets of size >= 2 = 2^n - n - 1.",
      "Step 4: Output both numbers separated by space."
    ],
    testInputs: [
      "1 2 3", "0", "1 2", "1 2 3 4", "5",
      "1 2 3 4 5", "10 20", "9 8 7", "2 4 6 8", "1 2 3 4 5 6"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      const total = 1 << nums.length;
      const sizeGe2 = total - nums.length - 1;
      return `${total} ${Math.max(0, sizeGe2)}`;
    }
  }),

  // ================= 10. BINARY SEARCH =================
  makeChallenge({
    id: "ch_binary_search",
    title: "Binary Search in Sorted Array",
    difficulty: "Easy",
    category: "Binary Search",
    description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    inputFormat: "Line 1: Space-separated integers sorted ascending.\nLine 2: Target integer.",
    outputFormat: "A single integer: 0-based index of target, or -1.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "All the integers in nums are unique.", "nums is sorted in ascending order."],
    examples: [
      { input: "-1 0 3 5 9 12\n9", output: "4", explanation: "9 exists in nums and its index is 4." },
      { input: "-1 0 3 5 9 12\n2", output: "-1", explanation: "2 does not exist in nums so return -1." }
    ],
    hints: [
      "Maintain search bounds left = 0 and right = n - 1.",
      "Calculate mid = Math.floor((left + right) / 2).",
      "Compare nums[mid] with target: if equal, return mid; if less, left = mid + 1; else right = mid - 1."
    ],
    objective: "Execute logarithmic search over sorted array partition.",
    conceptualExplanation: [
      "Step 1: Set left = 0, right = n - 1.",
      "Step 2: While left <= right, mid = (left + right) >> 1.",
      "Step 3: If nums[mid] == target, return mid.",
      "Step 4: If nums[mid] < target, left = mid + 1, else right = mid - 1.",
      "Step 5: Return -1 if not found."
    ],
    testInputs: [
      "-1 0 3 5 9 12\n9", "-1 0 3 5 9 12\n2", "5\n5", "1 3 5 7 9\n1", "1 3 5 7 9\n9",
      "2 4 6 8 10\n6", "10 20 30 40 50\n25", "-10 -5 0 5 10\n-5", "1 2 3 4 5 6 7 8\n7", "100 200 300\n400"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const target = parseInt(lines[1].trim(), 10);
      let l = 0, r = nums.length - 1;
      while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] === target) return String(mid);
        if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
      }
      return "-1";
    }
  }),

  makeChallenge({
    id: "ch_search_rotated_array",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    category: "Binary Search",
    description: "There is an integer array `nums` sorted in ascending order (with distinct values).\n\nPrior to being passed to your function, `nums` is possibly rotated at an unknown pivot index.\n\nGiven the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.\n\nYou must achieve O(log n) runtime complexity.",
    inputFormat: "Line 1: Space-separated integers representing rotated sorted array.\nLine 2: Target integer.",
    outputFormat: "A single integer: 0-based index or -1.",
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i] <= 10^4", "All values of nums are unique."],
    examples: [
      { input: "4 5 6 7 0 1 2\n0", output: "4", explanation: "0 is at index 4." },
      { input: "4 5 6 7 0 1 2\n3", output: "-1", explanation: "3 does not exist in array." }
    ],
    hints: [
      "In any rotated sorted array, at least one half (left or right of mid) is always normally sorted.",
      "Check if left half is sorted (nums[left] <= nums[mid]). If so, check if target lies within nums[left] and nums[mid].",
      "Otherwise, the right half is sorted; check if target lies within nums[mid] and nums[right]."
    ],
    objective: "Perform modified binary search on cyclically pivoted monotonic array.",
    conceptualExplanation: [
      "Step 1: Set left = 0, right = n - 1.",
      "Step 2: While left <= right, mid = (left + right) / 2.",
      "Step 3: If nums[mid] == target, return mid.",
      "Step 4: If left half sorted (nums[left] <= nums[mid]): if target in [nums[left], nums[mid]), right = mid - 1, else left = mid + 1.",
      "Step 5: Else right half sorted: if target in (nums[mid], nums[right]], left = mid + 1, else right = mid - 1; return -1 if not found."
    ],
    testInputs: [
      "4 5 6 7 0 1 2\n0", "4 5 6 7 0 1 2\n3", "1\n0", "1\n1", "3 1\n1",
      "5 1 3\n5", "4 5 6 7 8 1 2 3\n8", "6 7 1 2 3 4 5\n6", "2 3 4 5 1\n1", "8 9 2 3 4\n9"
    ],
    solver: (input) => {
      const lines = input.trim().split("\n");
      const nums = lines[0].trim().split(/\s+/).map(Number);
      const target = parseInt(lines[1].trim(), 10);
      let l = 0, r = nums.length - 1;
      while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] === target) return String(mid);
        if (nums[l] <= nums[mid]) {
          if (nums[l] <= target && target < nums[mid]) r = mid - 1;
          else l = mid + 1;
        } else {
          if (nums[mid] < target && target <= nums[r]) l = mid + 1;
          else r = mid - 1;
        }
      }
      return "-1";
    }
  }),

  makeChallenge({
    id: "ch_find_min_rotated",
    title: "Find Minimum in Rotated Sorted Array",
    difficulty: "Medium",
    category: "Binary Search",
    description: "Suppose an array of length `n` sorted in ascending order is rotated between `1` and `n` times.\n\nGiven the sorted rotated array `nums` of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in O(log n) time.",
    inputFormat: "A single line containing space-separated integers.",
    outputFormat: "A single integer: the minimum element.",
    constraints: ["n == nums.length", "1 <= n <= 5000", "-5000 <= nums[i] <= 5000", "All the integers of nums are unique."],
    examples: [
      { input: "3 4 5 1 2", output: "1", explanation: "Original array was [1, 2, 3, 4, 5] rotated 3 times." },
      { input: "4 5 6 7 0 1 2", output: "0", explanation: "Minimum value is 0." }
    ],
    hints: [
      "Compare nums[mid] with nums[right].",
      "If nums[mid] > nums[right], the minimum lies strictly to the right of mid: left = mid + 1.",
      "If nums[mid] <= nums[right], the minimum is at mid or to the left: right = mid."
    ],
    objective: "Identify array inflection pivot representing minimum value in logarithmic time.",
    conceptualExplanation: [
      "Step 1: Set left = 0, right = n - 1.",
      "Step 2: While left < right, mid = (left + right) / 2.",
      "Step 3: If nums[mid] > nums[right], search right half: left = mid + 1.",
      "Step 4: Else search left half including mid: right = mid.",
      "Step 5: Output nums[left]."
    ],
    testInputs: [
      "3 4 5 1 2", "4 5 6 7 0 1 2", "11 13 15 17", "2 1", "1",
      "3 1 2", "5 1 2 3 4", "10 20 30 5", "2 3 4 5 6 7 8 1", "8 9 10 2 3 4 5 6 7"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let l = 0, r = nums.length - 1;
      while (l < r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] > nums[r]) l = mid + 1;
        else r = mid;
      }
      return String(nums[l]);
    }
  }),

  makeChallenge({
    id: "ch_find_peak_element",
    title: "Find Peak Element Index",
    difficulty: "Medium",
    category: "Binary Search",
    description: "A peak element is an element that is strictly greater than its neighbors.\n\nGiven a 0-indexed integer array `nums`, find a peak element, and return its index. If the array contains multiple peaks, return the index to any of the peaks.\n\nYou may imagine that `nums[-1] = nums[n] = -∞`.\n\nYou must write an algorithm that runs in O(log n) time.",
    inputFormat: "A single line containing space-separated integers.",
    outputFormat: "A single integer: 0-based index of a peak element.",
    constraints: ["1 <= nums.length <= 1000", "-2^31 <= nums[i] <= 2^31 - 1", "nums[i] != nums[i + 1] for all valid i."],
    examples: [
      { input: "1 2 3 1", output: "2", explanation: "3 is a peak element and your function should return the index number 2." },
      { input: "1 2 1 3 5 6 4", output: "5", explanation: "Your function can return index 1 (value 2) or index 5 (value 6)." }
    ],
    hints: [
      "Compare nums[mid] with nums[mid + 1].",
      "If nums[mid] > nums[mid + 1], then a peak is guaranteed to exist on the left side (or is mid itself): right = mid.",
      "If nums[mid] < nums[mid + 1], a peak is guaranteed to exist on the right: left = mid + 1."
    ],
    objective: "Locate any local maximum in an unsorted array in O(log n) time.",
    conceptualExplanation: [
      "Step 1: Set left = 0, right = n - 1.",
      "Step 2: While left < right, mid = (left + right) / 2.",
      "Step 3: If nums[mid] > nums[mid + 1], right = mid.",
      "Step 4: Else left = mid + 1.",
      "Step 5: Output left."
    ],
    testInputs: [
      "1 2 3 1", "1 2 1 3 5 6 4", "1", "1 2", "2 1",
      "1 3 2 1", "1 2 3 4 5", "5 4 3 2 1", "1 5 1", "1 2 3 4 3 2 1"
    ],
    solver: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let l = 0, r = nums.length - 1;
      while (l < r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] > nums[mid + 1]) r = mid;
        else l = mid + 1;
      }
      return String(l);
    }
  })
];

module.exports = { part2Challenges };
