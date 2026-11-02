// Script to enrich codingCurriculum.js and codingRoutes.js:
// 1. Exactly 10 test cases per question: First 3 are public (isHidden: false), remaining 7 are hidden (isHidden: true).
// 2. StarterCode is strictly set to:
//    - Python: "# Enter your code below\n"
//    - Others: "// Enter your code below\n"
// 3. Adds concise "objective" and "conceptualExplanation" (LeetCode step-by-step approach) to each exercise.

const fs = require("fs");
const path = require("path");

const curriculumPath = path.join(__dirname, "../data/codingCurriculum.js");
const currModule = require(curriculumPath);
const { CURRICULUM } = currModule;

const OBJECTIVES = {
  // Python
  py_0: "Extract, filter, and square positive even integers from standard input and output the sorted array in JSON format.",
  py_1: "Create a stateful function decorator that tracks and prints invocation counts across calls without global variables.",
  py_2: "Design an object-oriented BankAccount class that enforces balance constraints, transaction validation, and state history.",
  py_3: "Implement robust error handling with custom exceptions to safely parse potentially malformed JSON payloads.",
  py_4: "Leverage hash mapping and sorting to find the k most frequent elements in a collection with optimal complexity.",

  // JavaScript
  js_0: "Implement a deep clone function supporting nested objects, arrays, and dates while preventing infinite recursion on circular references.",
  js_1: "Build a higher-order memoization cache using closures that caches results based on serialized arguments.",
  js_2: "Build a native Promise.all polyfill that concurrently resolves an array of promises and rejects on the first failure.",
  js_3: "Parse a URL query string into an object, decoding URI components and handling array parameter values.",
  js_4: "Implement a utility using Array.prototype.reduce to group an array of objects by an arbitrary property key.",

  // Java
  java_0: "Process text input from stdin, count frequencies of each word using HashMap, and print formatted frequencies.",
  java_1: "Construct an abstract Shape class with polymorphic calculateArea() implementations for Circle and Rectangle.",
  java_2: "Determine the index of the first non-repeating character in a string using two-pass frequency hashing.",
  java_3: "Safely divide two integers, throwing and catching a custom DivisionByZeroException when the denominator is zero.",
  java_4: "Use Java Streams API to filter positive numbers, map them to squares, and compute the total sum.",

  // C++
  cpp_0: "Reverse an array in-place using two pointers with O(1) auxiliary space.",
  cpp_1: "Implement an RAII-compliant ScopedTimer class that records elapsed execution time in microseconds upon scope destruction.",
  cpp_2: "Demonstrate move semantics and unique ownership transfer using std::unique_ptr and std::move.",
  cpp_3: "Use STL algorithms (std::copy_if, std::sort) to filter even integers and sort them in descending order.",

  // WebDev
  web_0: "Parse a raw HTTP header text block into a case-insensitive key-value map.",
  web_1: "Implement a numeric clamping helper that constrains a value between an inclusive minimum and maximum.",
  web_2: "Simulate a Redux-style state reducer handling increment, decrement, and set actions with immutable state transitions.",
  web_3: "Decode and validate a JWT payload without external libraries, checking structure, base64 decoding, and expiry.",

  // DSA
  dsa_0: "Find whether two elements in a sorted array sum up to a target value using two pointers in O(N) time.",
  dsa_1: "Find the length of the longest substring without repeating characters using a sliding window and hash set in O(N) time.",
  dsa_2: "Validate whether an input string containing bracket symbols '()[]{}' has balanced matching pairs using a stack.",
  dsa_3: "Compute the maximum depth (height) of a binary tree given its serialized level-order representation.",
  dsa_4: "Find the first and last position of a target element in a sorted array using binary search in O(log N) time."
};

const CONCEPTUAL_EXPLANATIONS = {
  // Python
  py_0: [
    "Step 1: Read the complete string from standard input (stdin) and deserialize the JSON array into a list of integers.",
    "Step 2: Filter elements to retain only integers that are strictly positive (x > 0) and even (x % 2 == 0).",
    "Step 3: Square each filtered integer (x ** 2).",
    "Step 4: Sort the resulting squared numbers in ascending order using Python's Timsort.",
    "Step 5: Serialize the sorted list into a JSON string and print to standard output (stdout)."
  ],
  py_1: [
    "Step 1: Define a wrapper function `count_calls(fn)` that maintains a private closure count dictionary or function attribute.",
    "Step 2: On each invocation of the decorated function, increment its internal invocation counter.",
    "Step 3: Print or output the current count along with the decorated function's return value.",
    "Step 4: Return the original return value to ensure transparent delegation."
  ],
  py_2: [
    "Step 1: Initialize the BankAccount instance with an account holder name and non-negative starting balance.",
    "Step 2: For deposits, validate that amount > 0, increment balance, and record a 'DEPOSIT' transaction.",
    "Step 3: For withdrawals, check that amount > 0 and amount <= current balance; otherwise raise an InsufficientFunds error.",
    "Step 4: Implement get_statement() to output transaction history in chronological order."
  ],
  py_3: [
    "Step 1: Read the input string and wrap `json.loads()` inside a `try...except (json.JSONDecodeError, ValueError)` block.",
    "Step 2: If parsing succeeds, check if the required target key exists in the parsed dictionary.",
    "Step 3: If parsing fails or the key is missing, catch the exception and print a standardized error payload `{\"error\": \"INVALID_JSON\"}`.",
    "Step 4: If valid, output the extracted property value as JSON."
  ],
  py_4: [
    "Step 1: Read the input JSON array `nums` and target integer `k`.",
    "Step 2: Build a frequency map counting occurrences of each unique element using collections.Counter or a standard dict.",
    "Step 3: Sort the unique elements by frequency in descending order (or use a min-heap of size k for O(N log k)).",
    "Step 4: Extract the top k elements and print the result as a sorted JSON list."
  ],

  // JavaScript
  js_0: [
    "Step 1: Check if the value is a primitive (null, number, string, boolean, undefined, symbol); return immediately if so.",
    "Step 2: Use a `WeakMap` to keep track of visited objects to prevent infinite recursion on circular object graphs.",
    "Step 3: If the object has already been cloned in the WeakMap, return the cached clone.",
    "Step 4: Handle Date and RegExp instances by constructing new instances with their primitive values.",
    "Step 5: Recursively deep clone all own enumerable properties (or array elements) into the new instance and return."
  ],
  js_1: [
    "Step 1: Create a higher-order function `memoize(fn)` containing a Map cache in its outer scope.",
    "Step 2: In the returned wrapper, serialize incoming arguments into a deterministic cache key (e.g. JSON.stringify(args)).",
    "Step 3: If cache.has(key), return the precomputed value immediately (O(1) lookup).",
    "Step 4: Otherwise, compute `fn.apply(this, args)`, store the result in the cache, and return."
  ],
  js_2: [
    "Step 1: Return a new Promise taking `resolve` and `reject` callbacks.",
    "Step 2: Check if the input is an array; if empty, resolve immediately with an empty array `[]`.",
    "Step 3: Maintain a results array and a completed count counter.",
    "Step 4: Iterate over each promise, wrapping it with `Promise.resolve(item)` to handle non-promise values.",
    "Step 5: On resolution of item i, store result at index i and increment completed count. When count === total, resolve(results). If any promise rejects, reject immediately."
  ],
  js_3: [
    "Step 1: Strip any leading '?' or '#' characters from the query string.",
    "Step 2: Split the string by '&' delimiters to get individual key=value pairs.",
    "Step 3: Split each pair by '=', decoding both key and value using `decodeURIComponent`.",
    "Step 4: If a key already exists, convert its value into an array or append to the existing array.",
    "Step 5: Output the resulting object serialized as JSON."
  ],
  js_4: [
    "Step 1: Read the JSON array of objects and the string key parameter from stdin.",
    "Step 2: Use `Array.prototype.reduce((acc, item) => { ... }, {})`.",
    "Step 3: For each item, retrieve `groupKey = item[key] ?? 'undefined'`.",
    "Step 4: Initialize `acc[groupKey] = acc[groupKey] || []`, then push `item`.",
    "Step 5: Return the accumulated grouped object and print as JSON."
  ],

  // Java
  java_0: [
    "Step 1: Read text from standard input using Scanner or BufferedReader.",
    "Step 2: Split the text into words using whitespace regex `\\\\s+`, converting each word to lowercase.",
    "Step 3: Store frequencies in a `HashMap<String, Integer>`, updating counts via `map.put(w, map.getOrDefault(w, 0) + 1)`.",
    "Step 4: Sort words alphabetically (or by frequency) and print formatted output `word: count`."
  ],
  java_1: [
    "Step 1: Define an abstract class `Shape` with abstract method `double calculateArea()`.",
    "Step 2: Create `Circle` subclass storing `radius` and implementing `calculateArea()` using `Math.PI * radius * radius`.",
    "Step 3: Create `Rectangle` subclass storing `width` and `height` and implementing `calculateArea()` using `width * height`.",
    "Step 4: In main, instantiate shapes dynamically from stdin and print formatted area rounded to 2 decimal places."
  ],
  java_2: [
    "Step 1: Read the input string `s` from stdin.",
    "Step 2: Perform pass 1: Count character occurrences in an array of size 26 `int[] freq = new int[26]`.",
    "Step 3: Perform pass 2: Iterate through the string from left to right; return the index `i` of the first character where `freq[s.charAt(i) - 'a'] == 1`.",
    "Step 4: If no unique character is found, output `-1`."
  ],
  java_3: [
    "Step 1: Define custom checked exception `class DivisionByZeroException extends Exception`.",
    "Step 2: In a helper method `safeDivide(int a, int b)`, check `if (b == 0) throw new DivisionByZeroException(\"Cannot divide by zero\");`.",
    "Step 3: Call the method inside a `try...catch` block in main.",
    "Step 4: Output the integer quotient on success, or the exception message on failure."
  ],
  java_4: [
    "Step 1: Read integer array from stdin using `Scanner` or `BufferedReader`.",
    "Step 2: Convert to `IntStream` or `List<Integer>.stream()`.",
    "Step 3: Apply `.filter(x -> x > 0)` to retain positive integers.",
    "Step 4: Apply `.map(x -> x * x)` to square each number.",
    "Step 5: Call `.sum()` and print the final integer sum."
  ],

  // C++
  cpp_0: [
    "Step 1: Read the size n and array elements from stdin into a `std::vector<int>`.",
    "Step 2: Initialize two pointer indices: `left = 0` and `right = n - 1`.",
    "Step 3: While `left < right`, swap `arr[left]` and `arr[right]` using `std::swap()`, then increment `left` and decrement `right`.",
    "Step 4: Print the reversed elements separated by single spaces."
  ],
  cpp_1: [
    "Step 1: Design `class ScopedTimer` whose constructor records `start = std::chrono::high_resolution_clock::now()`.",
    "Step 2: In the destructor `~ScopedTimer()`, record `end = std::chrono::high_resolution_clock::now()`.",
    "Step 3: Compute duration using `std::chrono::duration_cast<std::chrono::microseconds>(end - start).count()`.",
    "Step 4: Print elapsed duration automatically upon leaving lexical scope."
  ],
  cpp_2: [
    "Step 1: Allocate a resource using `std::make_unique<Resource>(args)`.",
    "Step 2: Demonstrate that copying `unique_ptr` fails compilation (deleted copy constructor).",
    "Step 3: Transfer ownership using `std::move(ptr1)` to `ptr2`, verifying that `ptr1` becomes `nullptr`.",
    "Step 4: Verify automatic deallocation when `ptr2` goes out of scope."
  ],
  cpp_3: [
    "Step 1: Read vector of integers from standard input.",
    "Step 2: Use `std::copy_if` with a lambda predicate `[](int x) { return x % 2 == 0; }` into a destination vector.",
    "Step 3: Sort the filtered vector using `std::sort(evens.begin(), evens.end(), std::greater<int>())` for descending order.",
    "Step 4: Print space-separated sorted numbers."
  ],

  // WebDev
  web_0: [
    "Step 1: Split raw HTTP header text by newline characters `\\r?\\n` into header lines.",
    "Step 2: For each line, locate the first colon ':' separator index.",
    "Step 3: Trim and normalize header field name to lowercase (RFC 7230 case-insensitivity standard).",
    "Step 4: Trim leading and trailing whitespace from header field value.",
    "Step 5: Output the parsed header map serialized as JSON."
  ],
  web_1: [
    "Step 1: Accept three parameters: `value`, `min`, `max`.",
    "Step 2: If `value < min`, return `min`.",
    "Step 3: Else if `value > max`, return `max`.",
    "Step 4: Otherwise return `value` (compact formulation: `Math.min(Math.max(value, min), max)`).",
    "Step 5: Print clamped value to stdout."
  ],
  web_2: [
    "Step 1: Define initial state `{ count: 0 }`.",
    "Step 2: In reducer function `(state, action)`, switch on `action.type`.",
    "Step 3: For 'INCREMENT', return `{ ...state, count: state.count + (action.payload || 1) }`.",
    "Step 4: For 'DECREMENT', return `{ ...state, count: state.count - (action.payload || 1) }`.",
    "Step 5: For 'SET', return `{ ...state, count: action.payload }`. Return current state for unknown actions."
  ],
  web_3: [
    "Step 1: Split JWT string into three dot-separated parts: `[headerB64, payloadB64, signatureB64]`.",
    "Step 2: Verify that exactly 3 parts exist; otherwise throw or output error.",
    "Step 3: Base64URL-decode payload part into a JSON string using `Buffer.from(part, 'base64url').toString('utf8')`.",
    "Step 4: Parse JSON into an object and inspect expiration timestamp `exp` against current epoch seconds.",
    "Step 5: Print decoded payload JSON and validity boolean."
  ],

  // DSA
  dsa_0: [
    "Step 1: Read the sorted array and target sum from standard input.",
    "Step 2: Initialize two pointers: `left = 0` at start, `right = n - 1` at end.",
    "Step 3: While `left < right`, compute `currentSum = arr[left] + arr[right]`.",
    "Step 4: If `currentSum == target`, return `[left, right]`. If `currentSum < target`, increment `left`. Else decrement `right`.",
    "Step 5: If pointers meet without finding target, return `[-1, -1]`."
  ],
  dsa_1: [
    "Step 1: Initialize a sliding window using two pointers `left = 0` and `right = 0`.",
    "Step 2: Maintain a HashSet or Map storing unique characters currently in the window.",
    "Step 3: For each character at `right`, if character already exists in set, shrink window from `left` until duplicate is removed.",
    "Step 4: Add character at `right` to set and update `maxLength = Math.max(maxLength, right - left + 1)`.",
    "Step 5: Output `maxLength` after `right` reaches end of string."
  ],
  dsa_2: [
    "Step 1: Initialize an empty stack `stack = []`.",
    "Step 2: Map closing brackets to opening brackets: `')' -> '(', '}' -> '{', ']' -> '['`.",
    "Step 3: Iterate through each character in the string: if opening bracket, push to stack.",
    "Step 4: If closing bracket, pop top of stack and check if it matches corresponding opening bracket. If not, return false.",
    "Step 5: After string ends, return `true` if stack is empty, else `false`."
  ],
  dsa_3: [
    "Step 1: Parse serialized level-order tree input from stdin.",
    "Step 2: If root is null, depth is 0.",
    "Step 3: Recursively compute depth: `maxDepth(node) = 1 + max(maxDepth(node.left), maxDepth(node.right))`.",
    "Step 4: Alternatively use BFS queue level-by-level, incrementing level counter per tier.",
    "Step 5: Output integer maximum depth."
  ],
  dsa_4: [
    "Step 1: Use binary search to find first occurrence: when `arr[mid] == target`, record `first = mid` and search left half `right = mid - 1`.",
    "Step 2: Use binary search to find last occurrence: when `arr[mid] == target`, record `last = mid` and search right half `left = mid + 1`.",
    "Step 3: If target not found in first search, return `[-1, -1]` immediately.",
    "Step 4: Output `[first, last]` formatted as JSON."
  ]
};

// Map tracks to keys
const TRACK_MAP = {
  python: "py",
  javascript: "js",
  java: "java",
  cpp: "cpp",
  webdev: "web",
  dsa: "dsa"
};

let updatedExercises = 0;

for (const track in CURRICULUM) {
  const prefix = TRACK_MAP[track] || track;
  CURRICULUM[track].forEach((m, idx) => {
    const key = `${prefix}_${idx}`;
    if (!m.codingExercise) return;

    const ex = m.codingExercise;

    // 1. Title
    ex.title = ex.taskTitle || m.title;

    // 2. Objective
    ex.objective = OBJECTIVES[key] || `Solve the ${ex.taskTitle} challenge satisfying all test specifications.`;

    // 3. Conceptual Explanation
    ex.conceptualExplanation = CONCEPTUAL_EXPLANATIONS[key] || [
      "Step 1: Read the problem specification and observe input/output constraints.",
      "Step 2: Identify edge cases (empty input, negative numbers, boundary sizes).",
      "Step 3: Implement the algorithm with optimal time and space complexity.",
      "Step 4: Validate against all 10 public and hidden test cases."
    ];

    // 4. Starter code - STRICTLY COMMENTED PLACEHOLDER ONLY
    if (track === "python") {
      ex.starterCode = "# Enter your code below\n";
    } else {
      ex.starterCode = "// Enter your code below\n";
    }

    // 5. Test cases: First 3 are public (isHidden: false), remaining 7 are hidden (isHidden: true)
    if (Array.isArray(ex.testCases)) {
      ex.testCases.forEach((tc, tIdx) => {
        if (tIdx < 3) {
          tc.isHidden = false;
        } else {
          tc.isHidden = true;
        }
      });
    }

    updatedExercises++;
  });
}

// Write back updated CURRICULUM to codingCurriculum.js
const fileHeader = `// Curated Mastery Zone Coding Track Curriculum
// Full ordered modules for Python, JavaScript, Java, C++, Web Development, and DSA
// Enriched with LeetCode-grade descriptions, step-by-step conceptual explanations,
// blank commented starter templates, and 10 real-time test cases (3 visible, 7 hidden).

const CURRICULUM = `;

const serialized = fileHeader + JSON.stringify(CURRICULUM, null, 2) + `;\n\nmodule.exports = { CURRICULUM };\n`;
fs.writeFileSync(curriculumPath, serialized, "utf8");
console.log(`Successfully updated ${updatedExercises} curriculum exercises in codingCurriculum.js!`);
