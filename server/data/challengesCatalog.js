/**
 * MASTERY ZONE ALGORITHMIC CHALLENGES CATALOG
 * 135 Verified Challenges across Core DSA Topics
 * Generated with strict 10 test cases (3 visible, 7 hidden) each.
 */

const CHALLENGES_CATALOG = [
  {
    "id": "ch_tight_bound",
    "title": "Tight Bound Proof Challenge",
    "difficulty": "Medium",
    "category": "Asymptotic Analysis & Big-O",
    "description": "Given a polynomial f(n) = a_d*n^d + ... + a_1*n + a_0 with non-negative integer coefficients and a positive leading coefficient, compute the tight bound constants c1, c2, and n0 that prove f(n) = Θ(n^d).\n\nUse the two-step squeeze strategy:\n• Lower bound (Ω): Since all lower-order terms are non-negative, dropping them gives f(n) >= a_d*n^d. So c1 = a_d (the leading coefficient).\n• Upper bound (O): For n >= 1, n^i <= n^d for all i <= d, so each term a_i*n^i <= a_i*n^d. Summing all terms gives f(n) <= (sum a_i)*n^d. So c2 = sum of all coefficients.\n• Threshold: Both bounds hold simultaneously from n0 = 1.\n\nOutput: c1, c2, and n0 such that c1*n^d <= f(n) <= c2*n^d for all n >= n0.",
    "inputFormat": "Line 1: A single integer k — the number of coefficients (k = d + 1, where d is the degree).\nLine 2: k space-separated non-negative integers representing the coefficients in descending order of degree (leading coefficient a_d first, constant term a_0 last).",
    "outputFormat": "A single line with three space-separated integers: c1 c2 n0",
    "constraints": [
      "2 <= k <= 6 (degree between 1 and 5)",
      "0 <= a_i <= 100 for all i",
      "a_d >= 1 (leading coefficient is positive)",
      "All coefficients are non-negative integers",
      "Time complexity: O(k) — single pass to sum all coefficients",
      "Space complexity: O(k) (or O(1) auxiliary if streaming input)"
    ],
    "examples": [
      {
        "input": "3\n4 3 1",
        "output": "4 8 1",
        "explanation": "f(n) = 4n^2 + 3n + 1. Leading coefficient = 4 -> c1 = 4. Sum of coefficients = 4 + 3 + 1 = 8 -> c2 = 8. Threshold n0 = 1. Verify: 4n^2 <= 4n^2 + 3n + 1 <= 8n^2 for all n >= 1."
      },
      {
        "input": "3\n3 7 2",
        "output": "3 12 1",
        "explanation": "f(n) = 3n^2 + 7n + 2. c1 = 3 (leading), c2 = 3 + 7 + 2 = 12 (sum), n0 = 1. Verify: 3n^2 <= 3n^2 + 7n + 2 <= 12n^2 for all n >= 1."
      },
      {
        "input": "4\n7 3 2 1",
        "output": "7 13 1",
        "explanation": "f(n) = 7n^3 + 3n^2 + 2n + 1. c1 = 7, c2 = 7 + 3 + 2 + 1 = 13, n0 = 1."
      }
    ],
    "hints": [
      "The lower bound constant c1 is simply the leading coefficient (a_d), which is the first coefficient in the input sequence.",
      "The upper bound constant c2 is the sum of all coefficients in the list.",
      "The threshold n0 is always 1 using the squeeze strategy for non-negative polynomial terms."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3\n4 3 1",
        "expectedOutput": "4 8 1",
        "isHidden": false
      },
      {
        "input": "3\n3 7 2",
        "expectedOutput": "3 12 1",
        "isHidden": false
      },
      {
        "input": "4\n7 3 2 1",
        "expectedOutput": "7 13 1",
        "isHidden": false
      },
      {
        "input": "2\n5 10",
        "expectedOutput": "5 15 1",
        "isHidden": true
      },
      {
        "input": "5\n1 2 3 4 5",
        "expectedOutput": "1 15 1",
        "isHidden": true
      },
      {
        "input": "2\n10 0",
        "expectedOutput": "10 10 1",
        "isHidden": true
      },
      {
        "input": "3\n1 0 0",
        "expectedOutput": "1 1 1",
        "isHidden": true
      },
      {
        "input": "4\n12 8 0 5",
        "expectedOutput": "12 25 1",
        "isHidden": true
      },
      {
        "input": "6\n2 4 6 8 10 12",
        "expectedOutput": "2 42 1",
        "isHidden": true
      },
      {
        "input": "3\n99 1 50",
        "expectedOutput": "99 150 1",
        "isHidden": true
      }
    ],
    "objective": "Compute the lower bound constant c1, upper bound constant c2, and threshold n0 to prove f(n) = Θ(n^d).",
    "conceptualExplanation": [
      "Step 1: Read the polynomial coefficients from standard input.",
      "Step 2: The lower bound constant c1 is the leading coefficient (first coefficient).",
      "Step 3: The upper bound constant c2 is the sum of all coefficients.",
      "Step 4: The threshold n0 is 1.",
      "Step 5: Output c1, c2, and 1 separated by spaces."
    ]
  },
  {
    "id": "ch_two_sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "category": "Arrays",
    "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    "constraints": [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    "inputFormat": "Line 1: A JSON array of integers `nums`\nLine 2: A single integer `target`",
    "outputFormat": "A JSON array of two indices [i, j] representing the zero-based indices of the two numbers",
    "hints": [
      "Think about using a Hash Map (or Dictionary) to remember numbers you've already seen as you iterate.",
      "For each element num at index i, calculate the complement: diff = target - num. Check if diff exists in the map.",
      "If the complement exists in the map, you've found the pair! Return [map[diff], i]. This achieves O(n) time and O(n) space."
    ],
    "examples": [
      {
        "input": "nums = [2, 7, 11, 15], target = 9",
        "output": "[0, 1]",
        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        "input": "nums = [3, 2, 4], target = 6",
        "output": "[1, 2]",
        "explanation": "nums[1] + nums[2] == 6."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "[2, 7, 11, 15]\n9",
        "expectedOutput": "[0, 1]",
        "isHidden": false
      },
      {
        "input": "[3, 2, 4]\n6",
        "expectedOutput": "[1, 2]",
        "isHidden": false
      },
      {
        "input": "[3, 3]\n6",
        "expectedOutput": "[0, 1]",
        "isHidden": false
      },
      {
        "input": "[1, 5, 7, 12, 19]\n20",
        "expectedOutput": "[0, 4]",
        "isHidden": true
      },
      {
        "input": "[-3, 4, 3, 90]\n0",
        "expectedOutput": "[0, 2]",
        "isHidden": true
      },
      {
        "input": "[0, 4, 3, 0]\n0",
        "expectedOutput": "[0, 3]",
        "isHidden": true
      },
      {
        "input": "[-1, -2, -3, -4, -5]\n-8",
        "expectedOutput": "[2, 4]",
        "isHidden": true
      },
      {
        "input": "[10, 20, 30, 40, 50, 60]\n100",
        "expectedOutput": "[3, 5]",
        "isHidden": true
      },
      {
        "input": "[1000, 2000, 3000]\n5000",
        "expectedOutput": "[1, 2]",
        "isHidden": true
      },
      {
        "input": "[7, 14, 21, 28, 35]\n49",
        "expectedOutput": "[2, 3]",
        "isHidden": true
      }
    ],
    "objective": "Find two distinct indices in an array whose elements sum up to the target value.",
    "conceptualExplanation": [
      "Step 1: Parse the array of numbers and the target sum.",
      "Step 2: Use a hash map storing value-to-index pairs for O(1) complements.",
      "Step 3: For each element at index i, calculate complement = target - nums[i].",
      "Step 4: If complement exists in map, return [map[complement], i].",
      "Step 5: Output the zero-indexed pair as a JSON array."
    ]
  },
  {
    "id": "ch_valid_parentheses",
    "title": "Valid Parentheses",
    "difficulty": "Medium",
    "category": "Stacks",
    "description": "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    "constraints": [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    "inputFormat": "A single string s containing characters '(', ')', '{', '}', '[', ']'",
    "outputFormat": "A single line with 'true' if the bracket sequences are valid, or 'false' otherwise",
    "hints": [
      "A Last-In, First-Out (LIFO) stack is the natural data structure for bracket matching.",
      "When encountering an opening bracket '(', '{', or '[', push it onto the stack.",
      "When encountering a closing bracket, verify that the stack is non-empty and that the popped opening bracket matches this closing bracket.",
      "Ensure the stack is completely empty after iterating through the entire string to guard against unclosed brackets."
    ],
    "examples": [
      {
        "input": "()",
        "output": "true",
        "explanation": "Matching parentheses in proper order."
      },
      {
        "input": "()[]{}",
        "output": "true",
        "explanation": "All consecutive pairs match properly."
      },
      {
        "input": "(]",
        "output": "false",
        "explanation": "Mismatched closing bracket."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "()",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "()[]{}",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "(]",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "([)]",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "{[]}",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "]",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "(((",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "{[()]}",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "(([]){})",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "[",
        "expectedOutput": "false",
        "isHidden": true
      }
    ],
    "objective": "Determine if an input string composed of brackets '()[]{}' has properly matched and nested pairs.",
    "conceptualExplanation": [
      "Step 1: Initialize an empty stack data structure.",
      "Step 2: Iterate through each character; push opening brackets onto the stack.",
      "Step 3: When encountering a closing bracket, pop the stack and check matching type.",
      "Step 4: If stack is empty on closing bracket or doesn't match, return false.",
      "Step 5: Return true if stack is empty after the entire string is processed, else false."
    ]
  },
  {
    "id": "ch_palindrome",
    "title": "Valid Palindrome",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    "constraints": [
      "1 <= s.length <= 2 * 10^5"
    ],
    "inputFormat": "A single line containing the string s (may include punctuation, whitespace, and alphanumeric characters)",
    "outputFormat": "A single line with 'true' if the cleaned string is a palindrome, or 'false' otherwise",
    "hints": [
      "Convert the string to lowercase and filter out all characters that are not alphanumeric.",
      "A two-pointer approach (left pointer at start, right pointer at end) moving inward allows you to check palindrome symmetry with O(1) extra space.",
      "Consider how empty strings or strings with only non-alphanumeric characters behave (they are valid palindromes)."
    ],
    "examples": [
      {
        "input": "A man, a plan, a canal: Panama",
        "output": "true",
        "explanation": "Filtered to amanaplanacanalpanama which reads the same backward."
      },
      {
        "input": "race a car",
        "output": "false",
        "explanation": "Filtered to raceacar which is not a palindrome."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "A man, a plan, a canal: Panama",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "race a car",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": " ",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "0P",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "ab_a",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "Madam, I'm Adam",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "No 'x' in Nixon",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "Was it a car or a cat I saw?",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "hello world",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "12321",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Determine whether an alphanumeric string reads the same backwards as forwards ignoring non-alphanumerics and case.",
    "conceptualExplanation": [
      "Step 1: Clean string by keeping alphanumeric chars and converting to lowercase.",
      "Step 2: Place left pointer at index 0 and right pointer at length - 1.",
      "Step 3: Compare characters at left and right pointers.",
      "Step 4: Increment left and decrement right while left < right.",
      "Step 5: Return 'true' if all characters match, else 'false'."
    ]
  },
  {
    "id": "ch_max_subarray",
    "title": "Maximum Subarray (Kadane's Algorithm)",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
    "constraints": [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ],
    "inputFormat": "A single JSON array of integers `nums` passed via standard input",
    "outputFormat": "A single integer representing the maximum possible sum of any non-empty contiguous subarray",
    "hints": [
      "Kadane's algorithm computes the maximum subarray sum in a single linear O(n) pass.",
      "At each element x, decide whether to append x to the ongoing running subarray sum, or start a fresh subarray at x.",
      "Keep track of the global maximum sum seen so far across all positions."
    ],
    "examples": [
      {
        "input": "[-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        "output": "6",
        "explanation": "The contiguous subarray [4, -1, 2, 1] has the largest sum = 6."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "[-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "[1]",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "[5, 4, -1, 7, 8]",
        "expectedOutput": "23",
        "isHidden": false
      },
      {
        "input": "[-1, -2, -3]",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "[-2, -1]",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "[1, 2, 3, 4]",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "[-2, 1]",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "[8, -19, 5, -4, 20]",
        "expectedOutput": "21",
        "isHidden": true
      },
      {
        "input": "[-5, 4, -1, 7, -8, 10]",
        "expectedOutput": "12",
        "isHidden": true
      },
      {
        "input": "[10, -5, 10, -5, 10]",
        "expectedOutput": "20",
        "isHidden": true
      }
    ],
    "objective": "Find the contiguous subarray within an array of integers that has the largest sum using Kadane's algorithm.",
    "conceptualExplanation": [
      "Step 1: Initialize currentSum = nums[0] and maxSum = nums[0].",
      "Step 2: Iterate through nums starting from index 1.",
      "Step 3: For each num, currentSum = max(num, currentSum + num).",
      "Step 4: Update maxSum = max(maxSum, currentSum).",
      "Step 5: Print the integer maximum subarray sum."
    ]
  },
  {
    "id": "ch_best_time_stock",
    "title": "Best Time to Buy and Sell Stock",
    "difficulty": "Easy",
    "category": "Arrays",
    "description": "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    "inputFormat": "A single line containing space-separated integers representing stock prices across consecutive days.",
    "outputFormat": "A single integer: the maximum profit possible (or 0 if no profit).",
    "constraints": [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4"
    ],
    "examples": [
      {
        "input": "7 1 5 3 6 4",
        "output": "5",
        "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5."
      },
      {
        "input": "7 6 4 3 1",
        "output": "0",
        "explanation": "Prices are strictly decreasing, so no profitable transaction is possible."
      }
    ],
    "hints": [
      "Keep track of the minimum purchase price observed so far as you iterate through the days.",
      "On each day, calculate the profit if you sold today: currentPrice - minPriceSoFar.",
      "Update your maximum recorded profit if today's profit exceeds the previous best."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "7 1 5 3 6 4",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "7 6 4 3 1",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "2 4 1",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "1 2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3 3 3 3",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "5 4 3 2 10",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "10 2 9 1 8",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "3 8 2 5 1 9",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "100 180 260 310 40 535 695",
        "expectedOutput": "655",
        "isHidden": true
      }
    ],
    "objective": "Identify the optimal buying day and subsequent selling day to maximize financial gain.",
    "conceptualExplanation": [
      "Step 1: Initialize minPrice = Infinity and maxProfit = 0.",
      "Step 2: Iterate over each price in the array.",
      "Step 3: If current price < minPrice, update minPrice.",
      "Step 4: Else if current price - minPrice > maxProfit, update maxProfit.",
      "Step 5: Output maxProfit to standard output."
    ]
  },
  {
    "id": "ch_product_except_self",
    "title": "Product of Array Except Self",
    "difficulty": "Medium",
    "category": "Arrays",
    "description": "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
    "inputFormat": "A single line containing space-separated integers representing the array nums.",
    "outputFormat": "A single line of space-separated integers representing the product array.",
    "constraints": [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30"
    ],
    "examples": [
      {
        "input": "1 2 3 4",
        "output": "24 12 8 6",
        "explanation": "For index 0: 2*3*4=24. Index 1: 1*3*4=12. Index 2: 1*2*4=8. Index 3: 1*2*3=6."
      },
      {
        "input": "-1 1 0 -3 3",
        "output": "0 0 9 0 0",
        "explanation": "Zero index gets product of non-zero elements."
      }
    ],
    "hints": [
      "Think about prefix products: construct an array where res[i] contains product of elements to left of i.",
      "Traverse from right to left with a running suffix product accumulator.",
      "Multiply each res[i] by the suffix product."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 4",
        "expectedOutput": "24 12 8 6",
        "isHidden": false
      },
      {
        "input": "-1 1 0 -3 3",
        "expectedOutput": "0 0 9 0 0",
        "isHidden": false
      },
      {
        "input": "2 3",
        "expectedOutput": "3 2",
        "isHidden": false
      },
      {
        "input": "4 5 1 8 2",
        "expectedOutput": "80 64 320 40 160",
        "isHidden": true
      },
      {
        "input": "0 0",
        "expectedOutput": "0 0",
        "isHidden": true
      },
      {
        "input": "1 0",
        "expectedOutput": "0 1",
        "isHidden": true
      },
      {
        "input": "2 2 2 2",
        "expectedOutput": "8 8 8 8",
        "isHidden": true
      },
      {
        "input": "5 2 3",
        "expectedOutput": "6 15 10",
        "isHidden": true
      },
      {
        "input": "-2 -3 -4",
        "expectedOutput": "12 8 6",
        "isHidden": true
      },
      {
        "input": "1 1 1 1 1",
        "expectedOutput": "1 1 1 1 1",
        "isHidden": true
      }
    ],
    "objective": "Compute the product of all other array elements for each index without using division.",
    "conceptualExplanation": [
      "Step 1: Allocate result array of size n with initial value 1.",
      "Step 2: Traverse left-to-right maintaining prefix product; assign res[i] = prefix; multiply prefix by nums[i].",
      "Step 3: Traverse right-to-left maintaining suffix product; multiply res[i] by suffix; multiply suffix by nums[i].",
      "Step 4: Join result array with spaces.",
      "Step 5: Print output to standard output."
    ]
  },
  {
    "id": "ch_rotate_array",
    "title": "Rotate Array by K Steps",
    "difficulty": "Medium",
    "category": "Arrays",
    "description": "Given an integer array `nums`, rotate the array to the right by `k` steps, where `k` is non-negative.",
    "inputFormat": "Line 1: Space-separated integers representing the array nums.\nLine 2: An integer k representing rotation steps.",
    "outputFormat": "A single line containing space-separated integers of the rotated array.",
    "constraints": [
      "1 <= nums.length <= 10^5",
      "0 <= k <= 10^5"
    ],
    "examples": [
      {
        "input": "1 2 3 4 5 6 7\n3",
        "output": "5 6 7 1 2 3 4",
        "explanation": "Rotate 3 steps right moves last 3 elements to the front."
      },
      {
        "input": "-1 -100 3 99\n2",
        "output": "3 99 -1 -100",
        "explanation": "Rotate 2 steps right moves last 2 elements to the front."
      }
    ],
    "hints": [
      "Normalize k: k = k % nums.length.",
      "The elements shifted to front are the last k elements, followed by the first n - k elements.",
      "Combine both slices in order."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 4 5 6 7\n3",
        "expectedOutput": "5 6 7 1 2 3 4",
        "isHidden": false
      },
      {
        "input": "-1 -100 3 99\n2",
        "expectedOutput": "3 99 -1 -100",
        "isHidden": false
      },
      {
        "input": "1 2\n3",
        "expectedOutput": "2 1",
        "isHidden": false
      },
      {
        "input": "1\n0",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1 2 3\n0",
        "expectedOutput": "1 2 3",
        "isHidden": true
      },
      {
        "input": "1 2 3\n3",
        "expectedOutput": "1 2 3",
        "isHidden": true
      },
      {
        "input": "1 2 3 4\n1",
        "expectedOutput": "4 1 2 3",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50\n4",
        "expectedOutput": "20 30 40 50 10",
        "isHidden": true
      },
      {
        "input": "5 6 7 8\n6",
        "expectedOutput": "7 8 5 6",
        "isHidden": true
      },
      {
        "input": "9 8 7 6 5 4\n5",
        "expectedOutput": "8 7 6 5 4 9",
        "isHidden": true
      }
    ],
    "objective": "Rotate all elements of an array circularly to the right by k positions.",
    "conceptualExplanation": [
      "Step 1: Read array and rotation count k.",
      "Step 2: Normalize k = k % n to avoid redundant complete rotations.",
      "Step 3: If k == 0, return the original array.",
      "Step 4: Slice last k elements and prepend to the first n - k elements.",
      "Step 5: Output elements joined by single spaces."
    ]
  },
  {
    "id": "ch_merge_sorted_arrays",
    "title": "Merge Two Sorted Arrays",
    "difficulty": "Easy",
    "category": "Arrays",
    "description": "You are given two integer arrays `nums1` and `nums2`, each sorted in non-decreasing order.\n\nMerge `nums1` and `nums2` into a single sorted array sorted in non-decreasing order.",
    "inputFormat": "Line 1: Space-separated integers of the first sorted array.\nLine 2: Space-separated integers of the second sorted array.",
    "outputFormat": "A single line containing space-separated integers of the combined sorted array.",
    "constraints": [
      "0 <= nums1.length, nums2.length <= 10^4",
      "-10^9 <= nums1[i], nums2[j] <= 10^9"
    ],
    "examples": [
      {
        "input": "1 3 5\n2 4 6",
        "output": "1 2 3 4 5 6",
        "explanation": "Elements are merged in ascending order."
      },
      {
        "input": "1 2 3\n4 5 6",
        "output": "1 2 3 4 5 6",
        "explanation": "All elements of nums2 follow nums1."
      }
    ],
    "hints": [
      "Use two pointers, one starting at nums1 and another at nums2.",
      "Compare elements at both pointers; take the smaller one and advance that pointer.",
      "Append any remaining elements once one array is exhausted."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 3 5\n2 4 6",
        "expectedOutput": "1 2 3 4 5 6",
        "isHidden": false
      },
      {
        "input": "1 2 3\n4 5 6",
        "expectedOutput": "1 2 3 4 5 6",
        "isHidden": false
      },
      {
        "input": "5\n1 2 3",
        "expectedOutput": "1 2 3 5",
        "isHidden": false
      },
      {
        "input": "1 5 9\n2 6 10",
        "expectedOutput": "1 2 5 6 9 10",
        "isHidden": true
      },
      {
        "input": "2\n1",
        "expectedOutput": "1 2",
        "isHidden": true
      },
      {
        "input": "10 20 30\n5 15 25 35",
        "expectedOutput": "5 10 15 20 25 30 35",
        "isHidden": true
      },
      {
        "input": "-5 -2 0\n-3 1 4",
        "expectedOutput": "-5 -3 -2 0 1 4",
        "isHidden": true
      },
      {
        "input": "1 1 1\n2 2 2",
        "expectedOutput": "1 1 1 2 2 2",
        "isHidden": true
      },
      {
        "input": "4 7 9\n3 5 8 10",
        "expectedOutput": "3 4 5 7 8 9 10",
        "isHidden": true
      },
      {
        "input": "100\n50 150",
        "expectedOutput": "50 100 150",
        "isHidden": true
      }
    ],
    "objective": "Combine two ordered arrays into a single unified ascending array in linear time.",
    "conceptualExplanation": [
      "Step 1: Parse both sorted integer sequences.",
      "Step 2: Use two pointers i = 0, j = 0 and an output array.",
      "Step 3: While both pointers in bounds, push min(nums1[i], nums2[j]) and advance.",
      "Step 4: Push remaining elements from either array.",
      "Step 5: Output merged array space-separated."
    ]
  },
  {
    "id": "ch_longest_common_prefix",
    "title": "Longest Common Prefix",
    "difficulty": "Easy",
    "category": "Strings",
    "description": "Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string.",
    "inputFormat": "A single line containing space-separated words.",
    "outputFormat": "The longest common prefix string (empty if none).",
    "constraints": [
      "1 <= words.length <= 200",
      "0 <= words[i].length <= 200"
    ],
    "examples": [
      {
        "input": "flower flow flight",
        "output": "fl",
        "explanation": "'fl' is the longest common prefix among the words."
      },
      {
        "input": "dog racecar car",
        "output": "",
        "explanation": "There is no common prefix among the input strings."
      }
    ],
    "hints": [
      "Start with the first word as your candidate prefix.",
      "Compare it with each subsequent word, trimming characters from the end of the prefix until it matches the beginning of the word.",
      "If the prefix becomes empty at any point, stop and return empty string."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "flower flow flight",
        "expectedOutput": "fl",
        "isHidden": false
      },
      {
        "input": "dog racecar car",
        "expectedOutput": "",
        "isHidden": false
      },
      {
        "input": "interspecies interstellar interstate",
        "expectedOutput": "inters",
        "isHidden": false
      },
      {
        "input": "apple app application",
        "expectedOutput": "app",
        "isHidden": true
      },
      {
        "input": "alone",
        "expectedOutput": "alone",
        "isHidden": true
      },
      {
        "input": "throne throne",
        "expectedOutput": "throne",
        "isHidden": true
      },
      {
        "input": "prefix prejudice present",
        "expectedOutput": "pre",
        "isHidden": true
      },
      {
        "input": "a b c",
        "expectedOutput": "",
        "isHidden": true
      },
      {
        "input": "cir car",
        "expectedOutput": "c",
        "isHidden": true
      },
      {
        "input": "master mastery masterzone",
        "expectedOutput": "master",
        "isHidden": true
      }
    ],
    "objective": "Identify the longest leading character sequence shared across all given strings.",
    "conceptualExplanation": [
      "Step 1: Read the space-separated words into a list.",
      "Step 2: If list is empty, return empty string.",
      "Step 3: Set prefix = words[0].",
      "Step 4: For each word in words[1..n], while word does not start with prefix, shorten prefix by 1 character.",
      "Step 5: Output the resulting prefix."
    ]
  },
  {
    "id": "ch_valid_anagram",
    "title": "Valid Anagram",
    "difficulty": "Easy",
    "category": "Strings",
    "description": "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
    "inputFormat": "Line 1: String s.\nLine 2: String t.",
    "outputFormat": "A single line with 'true' or 'false'.",
    "constraints": [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters."
    ],
    "examples": [
      {
        "input": "anagram\nnagaram",
        "output": "true",
        "explanation": "Both strings have the exact same character frequencies."
      },
      {
        "input": "rat\ncar",
        "output": "false",
        "explanation": "Characters 't' and 'c' do not match."
      }
    ],
    "hints": [
      "If the lengths of s and t differ, they cannot be anagrams.",
      "Use a hash map or frequency array of size 26 to count occurrences of each character in s and decrement for t.",
      "Alternatively, sort both strings and check if they are identical."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "anagram\nnagaram",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "rat\ncar",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "listen\nsilent",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "a\na",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "a\nb",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "ab\na",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "triangle\nintegral",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "dormitory\ndirtyroom",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "hello\nbillion",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "aabbcc\nabcabc",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Verify whether two strings contain identical character multisets.",
    "conceptualExplanation": [
      "Step 1: Read strings s and t.",
      "Step 2: If s.length != t.length, return false immediately.",
      "Step 3: Sort characters of s and sort characters of t.",
      "Step 4: Check if sorted strings are identical.",
      "Step 5: Output 'true' if matching, else 'false'."
    ]
  },
  {
    "id": "ch_string_compression",
    "title": "String Compression Run Length",
    "difficulty": "Medium",
    "category": "Strings",
    "description": "Given a string of characters, compress it using the following algorithm:\n\nBegin with an empty string `s`. For each group of consecutive repeating characters in the input, append the character followed by the group's length if length > 1 (if length is 1, just append the character).\n\nReturn the compressed string.",
    "inputFormat": "A single line containing the string to compress.",
    "outputFormat": "A single line containing the compressed string.",
    "constraints": [
      "1 <= s.length <= 10^5",
      "s consists of lower or upper case letters."
    ],
    "examples": [
      {
        "input": "aabcccccaaa",
        "output": "a2bc5a3",
        "explanation": "Two a's, one b, five c's, three a's."
      },
      {
        "input": "abc",
        "output": "abc",
        "explanation": "No character repeats consecutively, so no counts are added."
      }
    ],
    "hints": [
      "Use a pointer to traverse the string while counting identical consecutive characters.",
      "When character changes or string ends, append the character and its count (if > 1).",
      "Advance pointer to next distinct character."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "aabcccccaaa",
        "expectedOutput": "a2bc5a3",
        "isHidden": false
      },
      {
        "input": "abc",
        "expectedOutput": "abc",
        "isHidden": false
      },
      {
        "input": "aabb",
        "expectedOutput": "a2b2",
        "isHidden": false
      },
      {
        "input": "a",
        "expectedOutput": "a",
        "isHidden": true
      },
      {
        "input": "aaaa",
        "expectedOutput": "a4",
        "isHidden": true
      },
      {
        "input": "abbbbbbbbbb",
        "expectedOutput": "ab10",
        "isHidden": true
      },
      {
        "input": "wwweerrr",
        "expectedOutput": "w3e2r3",
        "isHidden": true
      },
      {
        "input": "xyzzyx",
        "expectedOutput": "xyz2yx",
        "isHidden": true
      },
      {
        "input": "zzzzzz",
        "expectedOutput": "z6",
        "isHidden": true
      },
      {
        "input": "aaabbbccc",
        "expectedOutput": "a3b3c3",
        "isHidden": true
      }
    ],
    "objective": "Perform run-length encoding on consecutive repeating characters.",
    "conceptualExplanation": [
      "Step 1: Read the input string.",
      "Step 2: Initialize result string and index i = 0.",
      "Step 3: While i < length, note current char and count identical characters.",
      "Step 4: Append char; if count > 1, append count.",
      "Step 5: Output compressed string."
    ]
  },
  {
    "id": "ch_roman_to_integer",
    "title": "Roman to Integer Converter",
    "difficulty": "Easy",
    "category": "Strings",
    "description": "Roman numerals are represented by seven different symbols: I (1), V (5), X (10), L (50), C (100), D (500) and M (1000).\n\nGiven a roman numeral string, convert it to an integer.",
    "inputFormat": "A single line containing a valid Roman numeral string.",
    "outputFormat": "A single integer.",
    "constraints": [
      "1 <= s.length <= 15",
      "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M').",
      "s is a valid roman numeral in the range [1, 3999]."
    ],
    "examples": [
      {
        "input": "III",
        "output": "3",
        "explanation": "III = 3."
      },
      {
        "input": "LVIII",
        "output": "58",
        "explanation": "L = 50, V = 5, III = 3."
      },
      {
        "input": "MCMXCIV",
        "output": "1994",
        "explanation": "M = 1000, CM = 900, XC = 90 and IV = 4."
      }
    ],
    "hints": [
      "Iterate through the string from left to right.",
      "If the current numeral is strictly less than the next numeral, subtract it from total (e.g. IV = 5 - 1).",
      "Otherwise, add it to total."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "III",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "LVIII",
        "expectedOutput": "58",
        "isHidden": false
      },
      {
        "input": "MCMXCIV",
        "expectedOutput": "1994",
        "isHidden": false
      },
      {
        "input": "IV",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "IX",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "XL",
        "expectedOutput": "40",
        "isHidden": true
      },
      {
        "input": "XC",
        "expectedOutput": "90",
        "isHidden": true
      },
      {
        "input": "CD",
        "expectedOutput": "400",
        "isHidden": true
      },
      {
        "input": "CM",
        "expectedOutput": "900",
        "isHidden": true
      },
      {
        "input": "MMXXIV",
        "expectedOutput": "2024",
        "isHidden": true
      }
    ],
    "objective": "Translate standard Roman numeral strings into base-10 integers.",
    "conceptualExplanation": [
      "Step 1: Map symbols to values: I:1, V:5, X:10, L:50, C:100, D:500, M:1000.",
      "Step 2: Initialize total = 0.",
      "Step 3: Loop i from 0 to length - 1.",
      "Step 4: If val(s[i]) < val(s[i+1]), total -= val(s[i]), else total += val(s[i]).",
      "Step 5: Output integer total."
    ]
  },
  {
    "id": "ch_group_anagrams",
    "title": "Group Anagrams Count",
    "difficulty": "Medium",
    "category": "Hashing",
    "description": "Given an array of strings `strs`, group the anagrams together. Return the number of distinct anagram groups formed.",
    "inputFormat": "A single line containing space-separated words.",
    "outputFormat": "A single integer: the number of distinct anagram groups.",
    "constraints": [
      "1 <= strs.length <= 10^4",
      "0 <= strs[i].length <= 100",
      "strs[i] consists of lowercase English letters."
    ],
    "examples": [
      {
        "input": "eat tea tan ate nat bat",
        "output": "3",
        "explanation": "Groups are ['eat','tea','ate'], ['tan','nat'], and ['bat']. Total 3 groups."
      },
      {
        "input": "a",
        "output": "1",
        "explanation": "Only 1 group."
      }
    ],
    "hints": [
      "Two words are anagrams if sorting their characters yields the same signature string.",
      "Use a hash map where key is sorted string and value is list of words.",
      "The number of keys in the hash map represents the total group count."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "eat tea tan ate nat bat",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "a",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "ab ba cd dc ef",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "cat dog act god tac",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "apple orange banana",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "silent listen enlist inlet",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "abc bca cab cba bac acb",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "a b c d e",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "hello olleh world dlrow",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "one two three four",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Cluster words with identical character multiset frequencies and count unique clusters.",
    "conceptualExplanation": [
      "Step 1: Read words from standard input.",
      "Step 2: Initialize hash map for anagram buckets.",
      "Step 3: For each word, sort its letters to generate key.",
      "Step 4: Insert word into map under key.",
      "Step 5: Output size of hash map."
    ]
  },
  {
    "id": "ch_longest_consecutive_seq",
    "title": "Longest Consecutive Sequence",
    "difficulty": "Medium",
    "category": "Hashing",
    "description": "Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence.\n\nYou must write an algorithm that runs in O(n) time.",
    "inputFormat": "A single line containing space-separated integers.",
    "outputFormat": "A single integer: length of the longest consecutive sequence.",
    "constraints": [
      "0 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9"
    ],
    "examples": [
      {
        "input": "100 4 200 1 3 2",
        "output": "4",
        "explanation": "The longest consecutive elements sequence is [1, 2, 3, 4]. Its length is 4."
      },
      {
        "input": "0 3 7 2 5 8 4 6 0 1",
        "output": "9",
        "explanation": "Consecutive elements 0 through 8 have length 9."
      }
    ],
    "hints": [
      "Insert all numbers into a Hash Set for O(1) lookups.",
      "An element num can only start a sequence if (num - 1) is not in the set.",
      "From each sequence start, check num + 1, num + 2, ... while in set, tracking longest streak."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "100 4 200 1 3 2",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "0 3 7 2 5 8 4 6 0 1",
        "expectedOutput": "9",
        "isHidden": false
      },
      {
        "input": "1 2 0 1",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "10",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "9 1 4 7 3 -1 0 5 8 -1 6",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "5 4 3 2 1",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "10 20 30 40",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "-2 -1 0 1 2",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "1 9 3 10 4 20 2",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "100 200 101 201 102",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Determine length of the longest run of consecutive integers in an unsorted array.",
    "conceptualExplanation": [
      "Step 1: Convert input array into a HashSet.",
      "Step 2: Initialize maxStreak = 0.",
      "Step 3: For each num in HashSet, check if num - 1 exists.",
      "Step 4: If not, count upward streak: while set.contains(num + streak), streak++.",
      "Step 5: Output maxStreak."
    ]
  },
  {
    "id": "ch_subarray_sum_k",
    "title": "Subarray Sum Equals K",
    "difficulty": "Medium",
    "category": "Hashing",
    "description": "Given an array of integers `nums` and an integer `k`, return the total number of continuous subarrays whose sum equals to `k`.",
    "inputFormat": "Line 1: Space-separated integers representing the array nums.\nLine 2: Integer k.",
    "outputFormat": "A single integer: total count of subarrays.",
    "constraints": [
      "1 <= nums.length <= 2 * 10^4",
      "-1000 <= nums[i] <= 1000",
      "-10^7 <= k <= 10^7"
    ],
    "examples": [
      {
        "input": "1 1 1\n2",
        "output": "2",
        "explanation": "Subarrays [1, 1] at indices [0, 1] and [1, 2] sum to 2."
      },
      {
        "input": "1 2 3\n3",
        "output": "2",
        "explanation": "Subarrays [1, 2] and [3] sum to 3."
      }
    ],
    "hints": [
      "Use prefix sums: sum(i, j) = prefix[j] - prefix[i - 1].",
      "If prefix[j] - prefix[i - 1] == k, then prefix[i - 1] == prefix[j] - k.",
      "Maintain a hash map of prefix sum frequencies as you iterate."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 1 1\n2",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "1 2 3\n3",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "1 -1 0\n0",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "3 4 7 2 -3 1 4 2\n7",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "1\n1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1\n0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "0 0 0 0\n0",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "2 2 2 2\n4",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "-1 -1 1\n0",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "10 2 -2 -20 10\n-10",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Count contiguous subarrays summing to target k using prefix sums and hashing in O(n).",
    "conceptualExplanation": [
      "Step 1: Initialize prefix map with {0: 1}, running sum = 0, count = 0.",
      "Step 2: For each number x in array, add x to running sum.",
      "Step 3: If map contains (sum - k), add its frequency to count.",
      "Step 4: Increment frequency of sum in map.",
      "Step 5: Output count."
    ]
  },
  {
    "id": "ch_first_unique_char",
    "title": "First Unique Character in a String",
    "difficulty": "Easy",
    "category": "Hashing",
    "description": "Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.",
    "inputFormat": "A single line containing the string s.",
    "outputFormat": "A single integer: 0-based index of the first non-repeating character, or -1.",
    "constraints": [
      "1 <= s.length <= 10^5",
      "s consists of only lowercase English letters."
    ],
    "examples": [
      {
        "input": "leetcode",
        "output": "0",
        "explanation": "Character 'l' at index 0 is non-repeating."
      },
      {
        "input": "loveleetcode",
        "output": "2",
        "explanation": "'v' at index 2 is the first non-repeating character."
      },
      {
        "input": "aabb",
        "output": "-1",
        "explanation": "All characters repeat."
      }
    ],
    "hints": [
      "Perform a first pass to build a frequency map of all characters in the string.",
      "Perform a second pass through the string: the first character with frequency 1 is your answer.",
      "If no character has frequency 1, return -1."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "leetcode",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "loveleetcode",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "aabb",
        "expectedOutput": "-1",
        "isHidden": false
      },
      {
        "input": "z",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "aadada",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "swiss",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "abacabad",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "masteryzone",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "abcdeabcde",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "redivider",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Identify the first distinct character position in a string using two-pass hashing.",
    "conceptualExplanation": [
      "Step 1: Read the string.",
      "Step 2: Build frequency dictionary of characters.",
      "Step 3: Iterate through indices i = 0 to length - 1.",
      "Step 4: If freq[s[i]] == 1, return i.",
      "Step 5: If loop finishes, return -1."
    ]
  },
  {
    "id": "ch_container_water",
    "title": "Container With Most Water",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "description": "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
    "inputFormat": "A single line of space-separated integers representing vertical bar heights.",
    "outputFormat": "A single integer: maximum area.",
    "constraints": [
      "2 <= height.length <= 10^5",
      "0 <= height[i] <= 10^4"
    ],
    "examples": [
      {
        "input": "1 8 6 2 5 4 8 3 7",
        "output": "49",
        "explanation": "Lines at index 1 and 8 (height 8 and 7) hold area min(8, 7) * (8 - 1) = 49."
      },
      {
        "input": "1 1",
        "output": "1",
        "explanation": "Distance 1 with height 1 yields area 1."
      }
    ],
    "hints": [
      "Place left pointer at 0 and right pointer at n - 1.",
      "Compute area = min(height[left], height[right]) * (right - left).",
      "Move the pointer pointing to the shorter line inward to attempt finding a taller boundary."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 8 6 2 5 4 8 3 7",
        "expectedOutput": "49",
        "isHidden": false
      },
      {
        "input": "1 1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "4 3 2 1 4",
        "expectedOutput": "16",
        "isHidden": false
      },
      {
        "input": "1 2 1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 2 4 3",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "2 3 4 5 18 17 6",
        "expectedOutput": "17",
        "isHidden": true
      },
      {
        "input": "5 5 5 5 5",
        "expectedOutput": "20",
        "isHidden": true
      },
      {
        "input": "1 3 2 5 25 24 5",
        "expectedOutput": "24",
        "isHidden": true
      },
      {
        "input": "10 9 8 7 6 5 4 3 2 1",
        "expectedOutput": "25",
        "isHidden": true
      },
      {
        "input": "3 9 3 4 7 2 12 6",
        "expectedOutput": "45",
        "isHidden": true
      }
    ],
    "objective": "Maximize container area between two boundaries using two pointers in O(n).",
    "conceptualExplanation": [
      "Step 1: Set left = 0, right = n - 1, maxArea = 0.",
      "Step 2: While left < right, calculate area = min(h[left], h[right]) * (right - left).",
      "Step 3: Update maxArea = max(maxArea, area).",
      "Step 4: If h[left] < h[right], left++, else right--.",
      "Step 5: Output maxArea."
    ]
  },
  {
    "id": "ch_three_sum",
    "title": "3Sum Zero Triplet Count",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "description": "Given an integer array nums, return the number of unique triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.",
    "inputFormat": "A single line containing space-separated integers.",
    "outputFormat": "A single integer: number of unique zero-sum triplets.",
    "constraints": [
      "3 <= nums.length <= 3000",
      "-10^5 <= nums[i] <= 10^5"
    ],
    "examples": [
      {
        "input": "-1 0 1 2 -1 -4",
        "output": "2",
        "explanation": "Triplets are [-1, -1, 2] and [-1, 0, 1]. Total 2 unique triplets."
      },
      {
        "input": "0 1 1",
        "output": "0",
        "explanation": "No triplet sums to 0."
      },
      {
        "input": "0 0 0",
        "output": "1",
        "explanation": "Only [0, 0, 0] sums to 0."
      }
    ],
    "hints": [
      "Sort the array first to enable two-pointer sweeps and easy duplicate skipping.",
      "Iterate i from 0 to n - 3. Set left = i + 1, right = n - 1.",
      "Skip duplicate values for i, left, and right to count only distinct triplets."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "-1 0 1 2 -1 -4",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "0 1 1",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "0 0 0",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "-2 0 1 1 2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "-1 2 -1 -1 2 -1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1 2 -2 -1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "-4 -2 -2 -2 0 1 2 2 2 3 3 4 4 6 6",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "-5 2 3 -2 0",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3 0 -2 -1 1 2",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "-3 1 2 -1 0 1",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Find all distinct three-element sets that sum to zero in O(n^2).",
    "conceptualExplanation": [
      "Step 1: Sort the array in non-decreasing order.",
      "Step 2: Loop i from 0 to n - 3, skip if nums[i] == nums[i - 1].",
      "Step 3: Set left = i + 1, right = n - 1.",
      "Step 4: Check sum: if 0, increment count and skip duplicates on left and right; if < 0, left++; if > 0, right--.",
      "Step 5: Output triplet count."
    ]
  },
  {
    "id": "ch_trapping_rain_water",
    "title": "Trapping Rain Water",
    "difficulty": "Hard",
    "category": "Two Pointers",
    "description": "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    "inputFormat": "A single line containing space-separated integers representing the elevation heights.",
    "outputFormat": "A single integer: total trapped water volume.",
    "constraints": [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5"
    ],
    "examples": [
      {
        "input": "0 1 0 2 1 0 1 3 2 1 2 1",
        "output": "6",
        "explanation": "Elevation map traps 6 units of rain water."
      },
      {
        "input": "4 2 0 3 2 5",
        "output": "9",
        "explanation": "Elevation map traps 9 units of rain water."
      }
    ],
    "hints": [
      "Use two pointers, left at 0 and right at n - 1, keeping track of maxLeft and maxRight.",
      "Whichever side has the smaller max boundary dictates the trapped water at that position.",
      "Advance the pointer with the smaller boundary."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "0 1 0 2 1 0 1 3 2 1 2 1",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "4 2 0 3 2 5",
        "expectedOutput": "9",
        "isHidden": false
      },
      {
        "input": "3 0 2 0 4",
        "expectedOutput": "7",
        "isHidden": false
      },
      {
        "input": "2 0 2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3 2 1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1 2 3",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "5 4 1 2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "0 2 0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "5 2 1 2 1 5",
        "expectedOutput": "14",
        "isHidden": true
      },
      {
        "input": "6 4 2 0 3 2 0 3 1 4 5 3 2 7 5 3 0 1 2 1 3 4 6 8 1 3",
        "expectedOutput": "83",
        "isHidden": true
      }
    ],
    "objective": "Calculate accumulated rainwater between elevation barriers in O(n) time and O(1) space.",
    "conceptualExplanation": [
      "Step 1: Set left = 0, right = n - 1, maxL = 0, maxR = 0, water = 0.",
      "Step 2: While left <= right, compare height[left] and height[right].",
      "Step 3: If height[left] <= height[right]: if height[left] >= maxL, maxL = height[left], else water += maxL - height[left]; left++.",
      "Step 4: Else: if height[right] >= maxR, maxR = height[right], else water += maxR - height[right]; right--.",
      "Step 5: Output total water."
    ]
  },
  {
    "id": "ch_move_zeroes",
    "title": "Move Zeroes to End",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements.\n\nNote that you must do this in-place without making a copy of the array.",
    "inputFormat": "A single line containing space-separated integers.",
    "outputFormat": "A single line of space-separated integers with zeroes relocated to the end.",
    "constraints": [
      "1 <= nums.length <= 10^4",
      "-2^31 <= nums[i] <= 2^31 - 1"
    ],
    "examples": [
      {
        "input": "0 1 0 3 12",
        "output": "1 3 12 0 0",
        "explanation": "Non-zero values maintain relative order; zeroes move to end."
      },
      {
        "input": "0",
        "output": "0",
        "explanation": "Single element array remains unchanged."
      }
    ],
    "hints": [
      "Maintain a slow pointer for the position where the next non-zero element should be placed.",
      "Iterate through the array with a fast pointer; when you see a non-zero, write it to the slow pointer and increment slow.",
      "Fill the remaining positions from slow to end with zeroes."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "0 1 0 3 12",
        "expectedOutput": "1 3 12 0 0",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 2 3",
        "expectedOutput": "1 2 3",
        "isHidden": false
      },
      {
        "input": "0 0 1",
        "expectedOutput": "1 0 0",
        "isHidden": true
      },
      {
        "input": "2 1",
        "expectedOutput": "2 1",
        "isHidden": true
      },
      {
        "input": "0 0 0",
        "expectedOutput": "0 0 0",
        "isHidden": true
      },
      {
        "input": "4 2 4 0 0 3 0 5 1 0",
        "expectedOutput": "4 2 4 3 5 1 0 0 0 0",
        "isHidden": true
      },
      {
        "input": "1 0 2 0 3 0",
        "expectedOutput": "1 2 3 0 0 0",
        "isHidden": true
      },
      {
        "input": "-1 0 -2 0",
        "expectedOutput": "-1 -2 0 0",
        "isHidden": true
      },
      {
        "input": "0 7 0 9 0 11",
        "expectedOutput": "7 9 11 0 0 0",
        "isHidden": true
      }
    ],
    "objective": "Consolidate all zeros at the tail of the array while preserving non-zero ordering.",
    "conceptualExplanation": [
      "Step 1: Set insertPos = 0.",
      "Step 2: Loop through array with index i = 0 to n - 1.",
      "Step 3: If nums[i] != 0, assign nums[insertPos] = nums[i] and increment insertPos.",
      "Step 4: While insertPos < n, assign nums[insertPos++] = 0.",
      "Step 5: Output array joined with spaces."
    ]
  },
  {
    "id": "ch_longest_substr_no_repeat",
    "title": "Longest Substring Without Repeating Characters",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "Given a string `s`, find the length of the longest substring without repeating characters.",
    "inputFormat": "A single line containing the string s.",
    "outputFormat": "A single integer: length of the longest unique character substring.",
    "constraints": [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    "examples": [
      {
        "input": "abcabcbb",
        "output": "3",
        "explanation": "The answer is 'abc', with length 3."
      },
      {
        "input": "bbbbb",
        "output": "1",
        "explanation": "The answer is 'b', with length 1."
      },
      {
        "input": "pwwkew",
        "output": "3",
        "explanation": "The answer is 'wke', with length 3."
      }
    ],
    "hints": [
      "Use a sliding window with left and right boundaries.",
      "Store the most recent index of each character in a hash map.",
      "When encountering a character already in the window, advance left pointer to map[char] + 1."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "abcabcbb",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "bbbbb",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "pwwkew",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": " ",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "au",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "dvdf",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "abcdef",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "abba",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "tmmzuxt",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "aab",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Identify the maximum contiguous span of unique characters using sliding window.",
    "conceptualExplanation": [
      "Step 1: If string is empty, return 0.",
      "Step 2: Maintain left pointer and hash map of char to last-seen index.",
      "Step 3: For right pointer from 0 to length - 1, if char in map >= left, update left = map[char] + 1.",
      "Step 4: Update map[char] = right; update maxLen = max(maxLen, right - left + 1).",
      "Step 5: Output maxLen."
    ]
  },
  {
    "id": "ch_min_window_substring",
    "title": "Minimum Window Substring Length",
    "difficulty": "Hard",
    "category": "Sliding Window",
    "description": "Given two strings `s` and `t`, return the minimum length of a substring in `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return `0`.",
    "inputFormat": "Line 1: String s.\nLine 2: String t.",
    "outputFormat": "A single integer: minimum window length (or 0).",
    "constraints": [
      "m == s.length, n == t.length",
      "1 <= m, n <= 10^5",
      "s and t consist of uppercase and lowercase English letters."
    ],
    "examples": [
      {
        "input": "ADOBECODEBANC\nABC",
        "output": "4",
        "explanation": "The minimum window substring is 'BANC' with length 4."
      },
      {
        "input": "a\na",
        "output": "1",
        "explanation": "Entire string is minimum window with length 1."
      },
      {
        "input": "a\naa",
        "output": "0",
        "explanation": "Target requires two 'a's but s only has one."
      }
    ],
    "hints": [
      "Count character requirements of t in a hash table.",
      "Expand right pointer until all required characters are satisfied.",
      "Contract left pointer while maintaining the requirement to find minimum window size."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "ADOBECODEBANC\nABC",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "a\na",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "a\naa",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "ab\nb",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "ab\na",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "abc\nac",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "aaflslflsldkalskaaa\naaa",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "bba\nab",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "cabwefgewcwaefgcf\ncae",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "aaaaaaaaaaaabbq\nba",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Find the shortest substring spanning all characters of a target multiset.",
    "conceptualExplanation": [
      "Step 1: Build frequency map of target string t.",
      "Step 2: Expand right pointer in s, updating window counts.",
      "Step 3: When window matches all characters in t, try shrinking from left.",
      "Step 4: Update minLen at each valid window state.",
      "Step 5: Output minLen if found, else 0."
    ]
  },
  {
    "id": "ch_max_avg_subarray",
    "title": "Maximum Average Subarray I",
    "difficulty": "Easy",
    "category": "Sliding Window",
    "description": "You are given an integer array `nums` consisting of `n` elements, and an integer `k`.\n\nFind a contiguous subarray whose length is equal to `k` that has the maximum average value and return this value formatted to 2 decimal places.",
    "inputFormat": "Line 1: Space-separated integers representing the array nums.\nLine 2: An integer k.",
    "outputFormat": "A decimal number rounded to 2 decimal places (e.g. 12.75).",
    "constraints": [
      "n == nums.length",
      "1 <= k <= n <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ],
    "examples": [
      {
        "input": "1 12 -5 -6 50 3\n4",
        "output": "12.75",
        "explanation": "Maximum average is (12 - 5 - 6 + 50) / 4 = 51 / 4 = 12.75."
      },
      {
        "input": "5\n1",
        "output": "5.00",
        "explanation": "Subarray [5] has average 5.00."
      }
    ],
    "hints": [
      "Calculate the sum of the first k elements.",
      "Slide the window by adding the next element and subtracting the element that left the window.",
      "Track the maximum sum seen, then divide by k and format to 2 decimal places."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 12 -5 -6 50 3\n4",
        "expectedOutput": "12.75",
        "isHidden": false
      },
      {
        "input": "5\n1",
        "expectedOutput": "5.00",
        "isHidden": false
      },
      {
        "input": "0 4 0 3 2\n1",
        "expectedOutput": "4.00",
        "isHidden": false
      },
      {
        "input": "0 1 1 3 3\n4",
        "expectedOutput": "2.00",
        "isHidden": true
      },
      {
        "input": "-1\n1",
        "expectedOutput": "-1.00",
        "isHidden": true
      },
      {
        "input": "4 2 1 3 6\n2",
        "expectedOutput": "4.50",
        "isHidden": true
      },
      {
        "input": "7 4 5 8 8 3 9 8 7 6\n7",
        "expectedOutput": "7.00",
        "isHidden": true
      },
      {
        "input": "-5 -4 -3 -2 -1\n3",
        "expectedOutput": "-2.00",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50\n3",
        "expectedOutput": "40.00",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6 7 8 9 10\n5",
        "expectedOutput": "8.00",
        "isHidden": true
      }
    ],
    "objective": "Locate contiguous window of size k with highest arithmetic mean.",
    "conceptualExplanation": [
      "Step 1: Compute sum of first k elements.",
      "Step 2: Initialize maxSum = sum.",
      "Step 3: Loop i from k to n - 1: sum += nums[i] - nums[i - k]; maxSum = max(maxSum, sum).",
      "Step 4: Compute average = maxSum / k.",
      "Step 5: Output average formatted to 2 decimal places."
    ]
  },
  {
    "id": "ch_longest_repeating_char_replace",
    "title": "Longest Repeating Character Replacement",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "You are given a string `s` and an integer `k`. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most `k` times.\n\nReturn the length of the longest substring containing the same letter you can get after performing the above operations.",
    "inputFormat": "Line 1: Uppercase string s.\nLine 2: Integer k.",
    "outputFormat": "A single integer: maximum length of uniform substring.",
    "constraints": [
      "1 <= s.length <= 10^5",
      "s consists of only uppercase English letters.",
      "0 <= k <= s.length"
    ],
    "examples": [
      {
        "input": "ABAB\n2",
        "output": "4",
        "explanation": "Replace the two 'A's with 'B's (or vice versa) to get 'BBBB' with length 4."
      },
      {
        "input": "AABABBA\n1",
        "output": "4",
        "explanation": "Replace middle 'A' with 'B' to get 'AABBBBA' whose substring 'BBBB' has length 4."
      }
    ],
    "hints": [
      "Window validity condition: (windowLength - maxCharFrequencyInWindow) <= k.",
      "If more than k characters need to be changed, shrink window from the left.",
      "Track the maximum valid window length observed."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "ABAB\n2",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "AABABBA\n1",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "A\n0",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "AAAA\n2",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "ABAA\n0",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "ABCDE\n1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "BAAAB\n2",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "KRSCDCSONAJNHLBMKATOAKSESKASCSBOBPAHXALUZBRGGIAJJGQISBEKSQNQIBAK\n4",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "ABBB\n2",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "EOEMQLLQTRQDDLJLOASFRPTCSRMGinventory\n5",
        "expectedOutput": "8",
        "isHidden": true
      }
    ],
    "objective": "Maximize identical character substring by replacing at most k characters.",
    "conceptualExplanation": [
      "Step 1: Set left = 0, maxCount = 0, maxLen = 0.",
      "Step 2: For right from 0 to length - 1, update char frequency and maxCount.",
      "Step 3: While (right - left + 1 - maxCount > k), decrement freq of s[left] and left++.",
      "Step 4: Update maxLen = max(maxLen, right - left + 1).",
      "Step 5: Output maxLen."
    ]
  },
  {
    "id": "ch_min_stack",
    "title": "Min Stack Operations Simulator",
    "difficulty": "Medium",
    "category": "Stacks",
    "description": "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time O(1).\n\nSimulate operations: 'push val', 'pop', 'top', 'getMin'. Output space-separated answers for each 'top' and 'getMin' call.",
    "inputFormat": "Line 1: Number of operations n.\nNext n lines: Command ('push X', 'pop', 'top', 'getMin').",
    "outputFormat": "A single line containing space-separated results of 'top' and 'getMin' operations.",
    "constraints": [
      "1 <= n <= 3 * 10^4",
      "Operations 'pop', 'top' and 'getMin' are only called on non-empty stacks."
    ],
    "examples": [
      {
        "input": "6\npush -2\npush 0\npush -3\ngetMin\npop\ntop\ngetMin",
        "output": "-3 0 -2",
        "explanation": "getMin returns -3. After pop, top is 0 and getMin is -2."
      }
    ],
    "hints": [
      "Use two stacks: a primary data stack and an auxiliary minStack.",
      "When pushing x, also push min(x, minStack.top()) onto minStack.",
      "Pop simultaneously from both stacks; getMin simply inspects minStack.top()."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "6\npush -2\npush 0\npush -3\ngetMin\npop\ngetMin",
        "expectedOutput": "-3 -2",
        "isHidden": false
      },
      {
        "input": "4\npush 5\npush 10\ntop\ngetMin",
        "expectedOutput": "10 5",
        "isHidden": false
      },
      {
        "input": "5\npush 1\npush 2\ntop\ngetMin\ntop",
        "expectedOutput": "2 1 2",
        "isHidden": false
      },
      {
        "input": "5\npush 2\npush 0\npush 3\npush 0\ngetMin",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "7\npush 2147483646\npush 2147483646\npush 2147483647\ntop\npop\ngetMin\npop",
        "expectedOutput": "2147483647 2147483646",
        "isHidden": true
      },
      {
        "input": "4\npush -1\ntop\ngetMin\npop",
        "expectedOutput": "-1 -1",
        "isHidden": true
      },
      {
        "input": "8\npush 4\npush 3\npush 2\ngetMin\npop\ngetMin\npop\ngetMin",
        "expectedOutput": "2 3 4",
        "isHidden": true
      },
      {
        "input": "6\npush 1\npush 1\npush 1\ngetMin\npop\ngetMin",
        "expectedOutput": "1 1",
        "isHidden": true
      },
      {
        "input": "6\npush 10\npush -5\npush 20\ngetMin\ntop\npop",
        "expectedOutput": "-5 20",
        "isHidden": true
      },
      {
        "input": "7\npush 7\npush 3\npush 8\ngetMin\npop\ngetMin\ntop",
        "expectedOutput": "3 3 3",
        "isHidden": true
      }
    ],
    "objective": "Implement a LIFO data structure supporting O(1) minimum element queries.",
    "conceptualExplanation": [
      "Step 1: Read operation count n.",
      "Step 2: Maintain main stack and min-tracking stack.",
      "Step 3: On push x: push to main stack; if minStack empty or x <= minStack.top, push to minStack.",
      "Step 4: On pop: if popped == minStack.top, pop minStack as well.",
      "Step 5: Output top and getMin values space-separated."
    ]
  },
  {
    "id": "ch_daily_temperatures",
    "title": "Daily Temperatures",
    "difficulty": "Medium",
    "category": "Stacks",
    "description": "Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the `i`th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0`.",
    "inputFormat": "A single line containing space-separated integers representing daily temperatures.",
    "outputFormat": "A single line containing space-separated integers of wait days.",
    "constraints": [
      "1 <= temperatures.length <= 10^5",
      "30 <= temperatures[i] <= 100"
    ],
    "examples": [
      {
        "input": "73 74 75 71 69 72 76 73",
        "output": "1 1 4 2 1 1 0 0",
        "explanation": "Day 0 (73) waits 1 day for 74. Day 2 (75) waits 4 days for 76."
      },
      {
        "input": "30 40 50 60",
        "output": "1 1 1 0",
        "explanation": "Each day waits 1 day except the last."
      }
    ],
    "hints": [
      "Use a monotonic decreasing stack storing indices of temperatures.",
      "When iterating through temperatures, while current temp is greater than temp at stack top, pop and record day difference.",
      "Push current index onto stack."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "73 74 75 71 69 72 76 73",
        "expectedOutput": "1 1 4 2 1 1 0 0",
        "isHidden": false
      },
      {
        "input": "30 40 50 60",
        "expectedOutput": "1 1 1 0",
        "isHidden": false
      },
      {
        "input": "30 60 90",
        "expectedOutput": "1 1 0",
        "isHidden": false
      },
      {
        "input": "50 40 30",
        "expectedOutput": "0 0 0",
        "isHidden": true
      },
      {
        "input": "80",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "40 40 40",
        "expectedOutput": "0 0 0",
        "isHidden": true
      },
      {
        "input": "55 38 53 81 61 93 97 32 43 78",
        "expectedOutput": "3 1 1 2 1 1 0 1 1 0",
        "isHidden": true
      },
      {
        "input": "89 62 70 58 47 47 46 76 100 70",
        "expectedOutput": "8 1 5 4 3 2 1 1 0 0",
        "isHidden": true
      },
      {
        "input": "20 30 20 40",
        "expectedOutput": "1 2 1 0",
        "isHidden": true
      },
      {
        "input": "10 20 15 25",
        "expectedOutput": "1 2 1 0",
        "isHidden": true
      }
    ],
    "objective": "Compute next warmer temperature span for each day using monotonic stack in O(n).",
    "conceptualExplanation": [
      "Step 1: Allocate result array of size n initialized to 0.",
      "Step 2: Maintain stack of indices.",
      "Step 3: For i from 0 to n - 1, while stack non-empty and temp[i] > temp[stack.top], pop idx and res[idx] = i - idx.",
      "Step 4: Push i onto stack.",
      "Step 5: Output result array space-separated."
    ]
  },
  {
    "id": "ch_eval_rpn",
    "title": "Evaluate Reverse Polish Notation",
    "difficulty": "Medium",
    "category": "Stacks",
    "description": "You are given an array of strings `tokens` that represents an arithmetic expression in Reverse Polish Notation (RPN).\n\nEvaluate the expression. Return an integer that represents the value of the expression.\n\nValid operators are `+`, `-`, `*`, and `/`. Division truncates toward zero.",
    "inputFormat": "A single line containing space-separated tokens.",
    "outputFormat": "A single integer: evaluated result.",
    "constraints": [
      "1 <= tokens.length <= 10^4",
      "Each token is either an operator ('+', '-', '*', '/') or an integer in range [-200, 200]."
    ],
    "examples": [
      {
        "input": "2 1 + 3 *",
        "output": "9",
        "explanation": "((2 + 1) * 3) = 9."
      },
      {
        "input": "4 13 5 / +",
        "output": "6",
        "explanation": "(4 + (13 / 5)) = 6."
      }
    ],
    "hints": [
      "Iterate through the tokens from left to right.",
      "If token is a number, push it onto the stack.",
      "If token is an operator, pop the two most recent numbers, apply operator (note order: second popped OP first popped), and push result."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 1 + 3 *",
        "expectedOutput": "9",
        "isHidden": false
      },
      {
        "input": "4 13 5 / +",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "10 6 9 3 + -11 * / * 17 + 5 +",
        "expectedOutput": "22",
        "isHidden": false
      },
      {
        "input": "3 4 -",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "15 7 1 1 + - / 3 * 2 1 1 + + -",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "4 3 -",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "-2 3 *",
        "expectedOutput": "-6",
        "isHidden": true
      },
      {
        "input": "6 2 /",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "18 6 / 2 +",
        "expectedOutput": "5",
        "isHidden": true
      }
    ],
    "objective": "Evaluate postfix arithmetic expressions using an operand stack.",
    "conceptualExplanation": [
      "Step 1: Read tokens space-separated.",
      "Step 2: Initialize stack.",
      "Step 3: If token is operator, pop b then a; compute a op b (Math.trunc for division); push result.",
      "Step 4: Else parse token as integer and push onto stack.",
      "Step 5: Output stack[0]."
    ]
  },
  {
    "id": "ch_next_greater_elem",
    "title": "Next Greater Element I",
    "difficulty": "Easy",
    "category": "Stacks",
    "description": "The next greater element of some element `x` in an array is the first greater element that is to the right of `x` in the same array.\n\nYou are given two distinct 0-indexed integer arrays `nums1` and `nums2`, where `nums1` is a subset of `nums2`.\n\nFor each `0 <= i < nums1.length`, find the index `j` such that `nums1[i] == nums2[j]` and determine the next greater element of `nums2[j]` in `nums2`. If there is no next greater element, then the answer for this query is `-1`.",
    "inputFormat": "Line 1: Space-separated integers for nums1.\nLine 2: Space-separated integers for nums2.",
    "outputFormat": "A single line containing space-separated integers representing the next greater elements.",
    "constraints": [
      "1 <= nums1.length <= nums2.length <= 1000",
      "0 <= nums1[i], nums2[i] <= 10^4",
      "All integers in nums1 and nums2 are unique."
    ],
    "examples": [
      {
        "input": "4 1 2\n1 3 4 2",
        "output": "-1 3 -1",
        "explanation": "For 4: no greater element -> -1. For 1: next greater is 3. For 2: no greater element -> -1."
      },
      {
        "input": "2 4\n1 2 3 4",
        "output": "3 -1",
        "explanation": "For 2: next greater is 3. For 4: no greater element -> -1."
      }
    ],
    "hints": [
      "Use a monotonic stack to process nums2 from left to right.",
      "Whenever the current element is greater than stack top, the current element is the next greater element for stack.pop(). Store in a map.",
      "Query the map for each element in nums1."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4 1 2\n1 3 4 2",
        "expectedOutput": "-1 3 -1",
        "isHidden": false
      },
      {
        "input": "2 4\n1 2 3 4",
        "expectedOutput": "3 -1",
        "isHidden": false
      },
      {
        "input": "1 3 5 2 4\n6 5 4 3 2 1 7",
        "expectedOutput": "7 7 7 7 7",
        "isHidden": false
      },
      {
        "input": "1\n1",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "3 1 2\n3 2 1 4",
        "expectedOutput": "4 4 4",
        "isHidden": true
      },
      {
        "input": "4 2\n4 2 6 8",
        "expectedOutput": "6 6",
        "isHidden": true
      },
      {
        "input": "5 6\n6 5",
        "expectedOutput": "-1 -1",
        "isHidden": true
      },
      {
        "input": "2 1\n1 2 3",
        "expectedOutput": "3 2",
        "isHidden": true
      },
      {
        "input": "9 8\n8 9 10",
        "expectedOutput": "10 9",
        "isHidden": true
      },
      {
        "input": "10 20\n20 10 30",
        "expectedOutput": "30 30",
        "isHidden": true
      }
    ],
    "objective": "Precompute next greater elements using a monotonic stack and lookup queries.",
    "conceptualExplanation": [
      "Step 1: Read nums1 and nums2.",
      "Step 2: Traverse nums2 with a stack; map popped elements to current number.",
      "Step 3: Unmapped elements remaining in stack default to -1.",
      "Step 4: Map each element of nums1 to its stored next greater element.",
      "Step 5: Output space-separated results."
    ]
  },
  {
    "id": "ch_queue_using_stacks",
    "title": "Implement Queue using Stacks",
    "difficulty": "Easy",
    "category": "Queues",
    "description": "Implement a first in first out (FIFO) queue using only two stacks. The implemented queue should support normal queue operations: `push`, `pop`, `peek`, and `empty`.\n\nSimulate operations and output space-separated values for all `pop`, `peek`, and `empty` queries.",
    "inputFormat": "Line 1: Number of operations n.\nNext n lines: Commands ('push X', 'pop', 'peek', 'empty').",
    "outputFormat": "A single line containing space-separated results of query operations.",
    "constraints": [
      "1 <= n <= 100",
      "All calls to pop and peek are valid on non-empty queue."
    ],
    "examples": [
      {
        "input": "5\npush 1\npush 2\npeek\npop\nempty",
        "output": "1 1 false",
        "explanation": "peek returns 1, pop returns 1, queue is not empty so empty returns false."
      }
    ],
    "hints": [
      "Maintain two stacks: inStack for push, outStack for pop/peek.",
      "When outStack is empty and pop/peek is called, transfer all elements from inStack to outStack (reversing their order).",
      "This amortizes each operation to O(1) time."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "5\npush 1\npush 2\npeek\npop\nempty",
        "expectedOutput": "1 1 false",
        "isHidden": false
      },
      {
        "input": "3\npush 10\npop\nempty",
        "expectedOutput": "10 true",
        "isHidden": false
      },
      {
        "input": "6\npush 1\npush 2\npush 3\npop\npeek\npop",
        "expectedOutput": "1 2 2",
        "isHidden": false
      },
      {
        "input": "2\npush 5\npeek",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "6\npush 1\npop\nempty\npush 2\npop\nempty",
        "expectedOutput": "1 true 2 true",
        "isHidden": true
      },
      {
        "input": "4\npush 4\npush 5\npop\npop",
        "expectedOutput": "4 5",
        "isHidden": true
      },
      {
        "input": "7\npush 8\npush 9\npeek\npush 10\npop\npeek\npop",
        "expectedOutput": "8 8 9 9",
        "isHidden": true
      },
      {
        "input": "3\npush 42\npeek\npop",
        "expectedOutput": "42 42",
        "isHidden": true
      },
      {
        "input": "5\npush 1\npush 2\npop\npush 3\npeek",
        "expectedOutput": "1 2",
        "isHidden": true
      },
      {
        "input": "4\npush 1\nempty\npop\nempty",
        "expectedOutput": "false 1 true",
        "isHidden": true
      }
    ],
    "objective": "Simulate a FIFO queue using two LIFO stacks with amortized O(1) efficiency.",
    "conceptualExplanation": [
      "Step 1: Read operations count n.",
      "Step 2: Maintain inStack and outStack.",
      "Step 3: On push x: inStack.push(x).",
      "Step 4: On pop/peek: if outStack is empty, pop all from inStack and push to outStack; then perform operation on outStack.",
      "Step 5: Output all query results space-separated."
    ]
  },
  {
    "id": "ch_sliding_window_max",
    "title": "Sliding Window Maximum",
    "difficulty": "Hard",
    "category": "Queues",
    "description": "You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position.\n\nReturn the max sliding window values space-separated.",
    "inputFormat": "Line 1: Space-separated integers representing array nums.\nLine 2: Integer k.",
    "outputFormat": "A single line of space-separated integers representing maximum in each window.",
    "constraints": [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "1 <= k <= nums.length"
    ],
    "examples": [
      {
        "input": "1 3 -1 -3 5 3 6 7\n3",
        "output": "3 3 5 5 6 7",
        "explanation": "Window [1 3 -1] -> 3, [3 -1 -3] -> 3, [-1 -3 5] -> 5, etc."
      },
      {
        "input": "1\n1",
        "output": "1",
        "explanation": "Only one window with maximum 1."
      }
    ],
    "hints": [
      "Use a monotonic decreasing double-ended queue (deque) storing indices.",
      "Discard indices outside the current window from the front.",
      "Pop elements from the back smaller than the current element.",
      "The front of the deque always holds the index of the maximum element in the window."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 3 -1 -3 5 3 6 7\n3",
        "expectedOutput": "3 3 5 5 6 7",
        "isHidden": false
      },
      {
        "input": "1\n1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 -1\n1",
        "expectedOutput": "1 -1",
        "isHidden": false
      },
      {
        "input": "9 11\n2",
        "expectedOutput": "11",
        "isHidden": true
      },
      {
        "input": "4 -2\n2",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "1 3 1 2 0 5\n3",
        "expectedOutput": "3 3 2 5",
        "isHidden": true
      },
      {
        "input": "7 2 4\n2",
        "expectedOutput": "7 4",
        "isHidden": true
      },
      {
        "input": "2 1 3 4 6 3 8 9 10 12 56\n4",
        "expectedOutput": "4 6 6 8 9 10 12 56",
        "isHidden": true
      },
      {
        "input": "-7 -8 7 5 7 1 6 0\n4",
        "expectedOutput": "7 7 7 7 7",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5\n3",
        "expectedOutput": "3 4 5",
        "isHidden": true
      }
    ],
    "objective": "Identify the maximum element of every sliding window of width k in O(n) time.",
    "conceptualExplanation": [
      "Step 1: Read array and window size k.",
      "Step 2: Maintain a deque of indices with decreasing values.",
      "Step 3: For each element i: remove front if front < i - k + 1; remove back while nums[back] < nums[i]; push i.",
      "Step 4: If i >= k - 1, append nums[deque.front()] to results.",
      "Step 5: Output results space-separated."
    ]
  },
  {
    "id": "ch_first_unique_stream",
    "title": "First Non-Repeating Character in Stream",
    "difficulty": "Medium",
    "category": "Queues",
    "description": "Given a stream of characters as a string, find the first non-repeating character after reading each character. If there is no non-repeating character at any point, output `#`.\n\nReturn the concatenated sequence of characters produced at each step.",
    "inputFormat": "A single line containing the stream of lowercase characters.",
    "outputFormat": "A single string representing the first unique character after each input character.",
    "constraints": [
      "1 <= s.length <= 10^4",
      "s consists of lowercase English letters."
    ],
    "examples": [
      {
        "input": "aabc",
        "output": "a#bb",
        "explanation": "After 'a' -> 'a'. After 'a' -> '#' (both repeat). After 'b' -> 'b'. After 'c' -> 'b'."
      },
      {
        "input": "zz",
        "output": "z#",
        "explanation": "After 'z' -> 'z'. After second 'z' -> '#'."
      }
    ],
    "hints": [
      "Use a queue to track characters in order of their arrival.",
      "Use a frequency array or hash map to count character occurrences.",
      "Pop characters from the front of the queue if their frequency exceeds 1."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "aabc",
        "expectedOutput": "a#bb",
        "isHidden": false
      },
      {
        "input": "zz",
        "expectedOutput": "z#",
        "isHidden": false
      },
      {
        "input": "abc",
        "expectedOutput": "aaa",
        "isHidden": false
      },
      {
        "input": "a",
        "expectedOutput": "a",
        "isHidden": true
      },
      {
        "input": "aabb",
        "expectedOutput": "a#b#",
        "isHidden": true
      },
      {
        "input": "abadbc",
        "expectedOutput": "aabbdd",
        "isHidden": true
      },
      {
        "input": "mastery",
        "expectedOutput": "mmmmmmm",
        "isHidden": true
      },
      {
        "input": "babcd",
        "expectedOutput": "bbaaa",
        "isHidden": true
      },
      {
        "input": "aaaaa",
        "expectedOutput": "a####",
        "isHidden": true
      },
      {
        "input": "racecar",
        "expectedOutput": "rrrrrre",
        "isHidden": true
      }
    ],
    "objective": "Track real-time non-repeating stream elements using an order queue.",
    "conceptualExplanation": [
      "Step 1: Read stream string.",
      "Step 2: Maintain frequency map and FIFO queue.",
      "Step 3: For each character, increment frequency and push to queue.",
      "Step 4: While queue front has frequency > 1, pop front.",
      "Step 5: Append queue.front if non-empty, else append '#'; output result string."
    ]
  },
  {
    "id": "ch_circular_queue",
    "title": "Design Circular Queue Capacity",
    "difficulty": "Medium",
    "category": "Queues",
    "description": "Design your implementation of the circular queue. The circular queue is a linear data structure in which the operations are performed based on FIFO principle and the last position is connected back to the first position to make a circle.\n\nSimulate operations: enQueue X, deQueue, Front, Rear, isEmpty, isFull. Output space-separated results for all non-void operations.",
    "inputFormat": "Line 1: Integer k (capacity).\nLine 2: Integer m (number of commands).\nNext m lines: Commands.",
    "outputFormat": "A single line containing space-separated results of query operations.",
    "constraints": [
      "1 <= k <= 1000",
      "1 <= m <= 1000",
      "0 <= value <= 1000"
    ],
    "examples": [
      {
        "input": "3\n6\nenQueue 1\nenQueue 2\nenQueue 3\nisFull\nFront\nRear",
        "output": "true 1 3",
        "explanation": "Queue is full (true), Front is 1, Rear is 3."
      }
    ],
    "hints": [
      "Use a fixed-size array of length k with head, tail, and size pointers.",
      "Advance pointers using modulo arithmetic: `(ptr + 1) % k`.",
      "isEmpty check size == 0, isFull check size == k."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3\n6\nenQueue 1\nenQueue 2\nenQueue 3\nisFull\nFront\nRear",
        "expectedOutput": "true 1 3",
        "isHidden": false
      },
      {
        "input": "2\n4\nenQueue 5\nisEmpty\ndeQueue\nisEmpty",
        "expectedOutput": "false true",
        "isHidden": false
      },
      {
        "input": "1\n3\nenQueue 10\nFront\nRear",
        "expectedOutput": "10 10",
        "isHidden": false
      },
      {
        "input": "3\n7\nenQueue 1\nenQueue 2\ndeQueue\nenQueue 3\nFront\nRear\nisFull",
        "expectedOutput": "2 3 false",
        "isHidden": true
      },
      {
        "input": "2\n4\nisEmpty\nenQueue 9\nFront\nisFull",
        "expectedOutput": "true 9 false",
        "isHidden": true
      },
      {
        "input": "2\n5\nenQueue 1\nenQueue 2\nisFull\ndeQueue\nisFull",
        "expectedOutput": "true false",
        "isHidden": true
      },
      {
        "input": "4\n6\nenQueue 1\nenQueue 2\nenQueue 3\nenQueue 4\nFront\nRear",
        "expectedOutput": "1 4",
        "isHidden": true
      },
      {
        "input": "1\n4\nenQueue 7\nisFull\ndeQueue\nisEmpty",
        "expectedOutput": "true true",
        "isHidden": true
      },
      {
        "input": "3\n6\nenQueue 1\ndeQueue\nenQueue 2\nenQueue 3\nFront\nRear",
        "expectedOutput": "2 3",
        "isHidden": true
      },
      {
        "input": "2\n4\nenQueue 4\nRear\ndeQueue\nisEmpty",
        "expectedOutput": "4 true",
        "isHidden": true
      }
    ],
    "objective": "Implement a bounded ring-buffer queue using circular pointer wrapping.",
    "conceptualExplanation": [
      "Step 1: Initialize fixed array of size k, head = 0, tail = 0, size = 0.",
      "Step 2: enQueue: if size < k, store at tail, tail = (tail + 1) % k, size++.",
      "Step 3: deQueue: if size > 0, head = (head + 1) % k, size--.",
      "Step 4: Front: return size > 0 ? arr[head] : -1; Rear: return size > 0 ? arr[(tail - 1 + k) % k] : -1.",
      "Step 5: Output query answers space-separated."
    ]
  },
  {
    "id": "ch_reverse_linked_list",
    "title": "Reverse a Singly Linked List",
    "difficulty": "Easy",
    "category": "Linked Lists",
    "description": "Given the head of a singly linked list, reverse the list, and return the reversed list nodes.",
    "inputFormat": "A single line containing space-separated integers representing the linked list nodes.",
    "outputFormat": "A single line containing space-separated integers of the reversed list.",
    "constraints": [
      "0 <= number of nodes <= 5000",
      "-5000 <= Node.val <= 5000"
    ],
    "examples": [
      {
        "input": "1 2 3 4 5",
        "output": "5 4 3 2 1",
        "explanation": "All node links are reversed in direction."
      },
      {
        "input": "1 2",
        "output": "2 1",
        "explanation": "List [1 -> 2] becomes [2 -> 1]."
      }
    ],
    "hints": [
      "Maintain three pointers: prev, curr, and next.",
      "At each step, save curr.next, redirect curr.next to prev, then advance prev = curr and curr = next.",
      "When curr reaches null, prev is the new head of the reversed list."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "5 4 3 2 1",
        "isHidden": false
      },
      {
        "input": "1 2",
        "expectedOutput": "2 1",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "10 20 30 40 50 60",
        "expectedOutput": "60 50 40 30 20 10",
        "isHidden": true
      },
      {
        "input": "3 7 9",
        "expectedOutput": "9 7 3",
        "isHidden": true
      },
      {
        "input": "-1 -2 -3",
        "expectedOutput": "-3 -2 -1",
        "isHidden": true
      },
      {
        "input": "0 5 0",
        "expectedOutput": "0 5 0",
        "isHidden": true
      },
      {
        "input": "4 4 4 4",
        "expectedOutput": "4 4 4 4",
        "isHidden": true
      },
      {
        "input": "9 8 7 6 5 4 3 2 1",
        "expectedOutput": "1 2 3 4 5 6 7 8 9",
        "isHidden": true
      },
      {
        "input": "100 200",
        "expectedOutput": "200 100",
        "isHidden": true
      }
    ],
    "objective": "Reverse node pointers of a singly linked list in a single O(n) pass.",
    "conceptualExplanation": [
      "Step 1: Read space-separated node values into array.",
      "Step 2: Reverse array using two-pointer swap.",
      "Step 3: Join array with spaces.",
      "Step 4: Output reversed sequence."
    ]
  },
  {
    "id": "ch_merge_two_sorted_lists",
    "title": "Merge Two Sorted Linked Lists",
    "difficulty": "Easy",
    "category": "Linked Lists",
    "description": "You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the space-separated values of the merged linked list.",
    "inputFormat": "Line 1: Space-separated integers of list1.\nLine 2: Space-separated integers of list2.",
    "outputFormat": "A single line of space-separated integers of the merged sorted list.",
    "constraints": [
      "0 <= number of nodes in both lists <= 50",
      "-100 <= Node.val <= 100",
      "Both list1 and list2 are sorted in non-decreasing order."
    ],
    "examples": [
      {
        "input": "1 2 4\n1 3 4",
        "output": "1 1 2 3 4 4",
        "explanation": "Nodes are combined in ascending order."
      },
      {
        "input": "2\n1",
        "output": "1 2",
        "explanation": "Merged nodes: 1 -> 2."
      }
    ],
    "hints": [
      "Use a dummy head node to simplify list building.",
      "Compare head values of list1 and list2; attach smaller node to tail and advance that list's pointer.",
      "Append any remaining nodes when one list is exhausted."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 4\n1 3 4",
        "expectedOutput": "1 1 2 3 4 4",
        "isHidden": false
      },
      {
        "input": "2\n1",
        "expectedOutput": "1 2",
        "isHidden": false
      },
      {
        "input": "1 5 9\n2 4 8",
        "expectedOutput": "1 2 4 5 8 9",
        "isHidden": false
      },
      {
        "input": "1 2 3\n4 5 6",
        "expectedOutput": "1 2 3 4 5 6",
        "isHidden": true
      },
      {
        "input": "10 30 50\n20 40 60",
        "expectedOutput": "10 20 30 40 50 60",
        "isHidden": true
      },
      {
        "input": "-3 -1 0\n-2 1 2",
        "expectedOutput": "-3 -2 -1 0 1 2",
        "isHidden": true
      },
      {
        "input": "5\n5",
        "expectedOutput": "5 5",
        "isHidden": true
      },
      {
        "input": "1 1 1\n2 2 2",
        "expectedOutput": "1 1 1 2 2 2",
        "isHidden": true
      },
      {
        "input": "3 7 11 15\n1 4 8 12",
        "expectedOutput": "1 3 4 7 8 11 12 15",
        "isHidden": true
      },
      {
        "input": "100\n50 150",
        "expectedOutput": "50 100 150",
        "isHidden": true
      }
    ],
    "objective": "Combine two ordered lists into a single continuous sorted list.",
    "conceptualExplanation": [
      "Step 1: Read two lists of integers.",
      "Step 2: Use two pointers to compare elements.",
      "Step 3: Push smaller element to result and advance.",
      "Step 4: Append remainder of non-empty list.",
      "Step 5: Output combined sorted list."
    ]
  },
  {
    "id": "ch_linked_list_cycle",
    "title": "Linked List Cycle Detection",
    "difficulty": "Easy",
    "category": "Linked Lists",
    "description": "Given `head`, the head of a linked list, determine if the linked list has a cycle in it.\n\nThere is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the `next` pointer. Return `true` if there is a cycle, or `false` otherwise.",
    "inputFormat": "Line 1: Space-separated integers representing nodes.\nLine 2: Integer pos representing the 0-based index where the tail connects (-1 if no cycle).",
    "outputFormat": "A single line with 'true' or 'false'.",
    "constraints": [
      "0 <= number of nodes <= 10^4",
      "-10^5 <= Node.val <= 10^5",
      "pos is -1 or a valid index in the linked-list."
    ],
    "examples": [
      {
        "input": "3 2 0 -4\n1",
        "output": "true",
        "explanation": "Tail connects to the 1st node (0-indexed), creating a cycle."
      },
      {
        "input": "1\n-1",
        "output": "false",
        "explanation": "No cycle in single-node list."
      }
    ],
    "hints": [
      "Floyd's Cycle-Finding Algorithm (Tortoise and Hare): use two pointers, slow moves 1 step and fast moves 2 steps.",
      "If there is a cycle, the fast pointer will eventually catch up and meet the slow pointer.",
      "If fast reaches null, there is no cycle."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 2 0 -4\n1",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "1 2\n0",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "1\n-1",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "1 2 3 4 5\n-1",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5\n2",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2\n-1",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "10 20 30\n0",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "5 6 7 8\n3",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "7\n0",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50\n-1",
        "expectedOutput": "false",
        "isHidden": true
      }
    ],
    "objective": "Detect cyclical pointer references in a linked list using O(1) space.",
    "conceptualExplanation": [
      "Step 1: Read nodes and cycle position pos.",
      "Step 2: If pos >= 0, a cycle exists connecting tail to index pos.",
      "Step 3: If pos == -1, no cycle exists.",
      "Step 4: Output 'true' if pos >= 0, else 'false'."
    ]
  },
  {
    "id": "ch_remove_nth_from_end",
    "title": "Remove Nth Node From End of List",
    "difficulty": "Medium",
    "category": "Linked Lists",
    "description": "Given the head of a linked list, remove the `n`th node from the end of the list and return its nodes.",
    "inputFormat": "Line 1: Space-separated integers representing list nodes.\nLine 2: Integer n.",
    "outputFormat": "A single line of space-separated integers after removal.",
    "constraints": [
      "1 <= sz <= 1000",
      "0 <= Node.val <= 100",
      "1 <= n <= sz"
    ],
    "examples": [
      {
        "input": "1 2 3 4 5\n2",
        "output": "1 2 3 5",
        "explanation": "2nd node from end (node 4) is removed."
      },
      {
        "input": "1\n1",
        "output": "",
        "explanation": "Only node is removed, leaving empty list."
      }
    ],
    "hints": [
      "Use two pointers separated by n steps: fast and slow.",
      "Advance fast by n steps first.",
      "Then advance both fast and slow together until fast reaches the end; slow will point right before the node to remove."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 4 5\n2",
        "expectedOutput": "1 2 3 5",
        "isHidden": false
      },
      {
        "input": "1\n1",
        "expectedOutput": "",
        "isHidden": false
      },
      {
        "input": "1 2\n1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 2\n2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 2 3 4\n4",
        "expectedOutput": "2 3 4",
        "isHidden": true
      },
      {
        "input": "1 2 3 4\n1",
        "expectedOutput": "1 2 3",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50\n3",
        "expectedOutput": "10 20 40 50",
        "isHidden": true
      },
      {
        "input": "7 8 9\n2",
        "expectedOutput": "7 9",
        "isHidden": true
      },
      {
        "input": "5 6 7 8\n1",
        "expectedOutput": "5 6 7",
        "isHidden": true
      },
      {
        "input": "1 3 5 7 9\n5",
        "expectedOutput": "3 5 7 9",
        "isHidden": true
      }
    ],
    "objective": "Remove the target node from the rear in a single linear pass.",
    "conceptualExplanation": [
      "Step 1: Read node values into array.",
      "Step 2: Calculate targetIndex = length - n.",
      "Step 3: Remove element at targetIndex.",
      "Step 4: Output remaining elements space-separated."
    ]
  },
  {
    "id": "ch_power_of_two",
    "title": "Power of Two & Recursion",
    "difficulty": "Easy",
    "category": "Recursion",
    "description": "Given an integer `n`, return `true` if it is a power of two. Otherwise, return `false`.\n\nAn integer `n` is a power of two if there exists an integer `x` such that `n == 2^x`.",
    "inputFormat": "A single line containing the integer n.",
    "outputFormat": "A single line with 'true' or 'false'.",
    "constraints": [
      "-2^31 <= n <= 2^31 - 1"
    ],
    "examples": [
      {
        "input": "1",
        "output": "true",
        "explanation": "2^0 = 1."
      },
      {
        "input": "16",
        "output": "true",
        "explanation": "2^4 = 16."
      },
      {
        "input": "3",
        "output": "false",
        "explanation": "3 is not a power of two."
      }
    ],
    "hints": [
      "Recursive case: if n <= 0, false; if n == 1, true; if n % 2 != 0, false; else recurse on n / 2.",
      "Bitwise trick: powers of two have exactly one bit set: `(n > 0) && (n & (n - 1)) == 0`."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "16",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "3",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "4",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "5",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "0",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "-16",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "64",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1024",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "218",
        "expectedOutput": "false",
        "isHidden": true
      }
    ],
    "objective": "Verify exponential power-of-two membership recursively or bitwise.",
    "conceptualExplanation": [
      "Step 1: Read integer n.",
      "Step 2: Base cases: n <= 0 -> false, n == 1 -> true.",
      "Step 3: If n is odd, return false.",
      "Step 4: Recurse on n / 2.",
      "Step 5: Output 'true' or 'false'."
    ]
  },
  {
    "id": "ch_generate_parentheses",
    "title": "Generate Parentheses Combinations",
    "difficulty": "Medium",
    "category": "Recursion",
    "description": "Given `n` pairs of parentheses, write a function to generate all combinations of well-formed parentheses in lexicographical order.",
    "inputFormat": "A single integer n.",
    "outputFormat": "A single line containing space-separated well-formed parentheses strings.",
    "constraints": [
      "1 <= n <= 8"
    ],
    "examples": [
      {
        "input": "3",
        "output": "((())) (()()) (())() ()(()) ()()()",
        "explanation": "All 5 valid combinations for n=3."
      },
      {
        "input": "1",
        "output": "()",
        "explanation": "Only 1 valid combination."
      }
    ],
    "hints": [
      "Use backtracking with counts of open and close brackets used so far.",
      "You can add an opening bracket if open < n.",
      "You can add a closing bracket if close < open."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1",
        "expectedOutput": "()",
        "isHidden": false
      },
      {
        "input": "2",
        "expectedOutput": "(()) ()()",
        "isHidden": false
      },
      {
        "input": "3",
        "expectedOutput": "((())) (()()) (())() ()(()) ()()()",
        "isHidden": false
      },
      {
        "input": "4",
        "expectedOutput": "(((()))) ((()())) ((())()) ((()))() (()(())) (()()()) (()())() (())(()) (())()() ()((())) ()(()()) ()(())() ()()(()) ()()()()",
        "isHidden": true
      },
      {
        "input": "0",
        "expectedOutput": "",
        "isHidden": true
      },
      {
        "input": "2",
        "expectedOutput": "(()) ()()",
        "isHidden": true
      },
      {
        "input": "1",
        "expectedOutput": "()",
        "isHidden": true
      },
      {
        "input": "3",
        "expectedOutput": "((())) (()()) (())() ()(()) ()()()",
        "isHidden": true
      },
      {
        "input": "2",
        "expectedOutput": "(()) ()()",
        "isHidden": true
      },
      {
        "input": "1",
        "expectedOutput": "()",
        "isHidden": true
      }
    ],
    "objective": "Enumerate all balanced parentheses permutations using recursive backtracking.",
    "conceptualExplanation": [
      "Step 1: Read n.",
      "Step 2: Define backtrack(current, open, close).",
      "Step 3: If current.length == 2 * n, record combination.",
      "Step 4: If open < n, backtrack(current + '(', open + 1, close).",
      "Step 5: If close < open, backtrack(current + ')', open, close + 1); output results joined by spaces."
    ]
  },
  {
    "id": "ch_combination_sum",
    "title": "Combination Sum Count",
    "difficulty": "Medium",
    "category": "Recursion",
    "description": "Given an array of distinct integers `candidates` and a target integer `target`, return the number of unique combinations of `candidates` where the chosen numbers sum to `target`.\n\nThe same number may be chosen from `candidates` an unlimited number of times.",
    "inputFormat": "Line 1: Space-separated integers representing candidates.\nLine 2: Target integer.",
    "outputFormat": "A single integer: number of unique combinations.",
    "constraints": [
      "1 <= candidates.length <= 30",
      "2 <= candidates[i] <= 40",
      "All elements of candidates are distinct.",
      "1 <= target <= 40"
    ],
    "examples": [
      {
        "input": "2 3 6 7\n7",
        "output": "2",
        "explanation": "2 and 3 sum to 7: [7] and [2, 2, 3]. Total 2 combinations."
      },
      {
        "input": "2 3 5\n8",
        "output": "3",
        "explanation": "[2, 2, 2, 2], [2, 3, 3], and [3, 5] sum to 8. Total 3 combinations."
      }
    ],
    "hints": [
      "Sort candidates in ascending order to enable early pruning.",
      "Backtrack with an index pointer start: explore choosing candidate[i] and continuing from i (allowing reuse).",
      "Terminate branch when remainder < 0 or candidate[i] > remainder."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 3 6 7\n7",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "2 3 5\n8",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "2\n1",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1\n2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3 5\n10",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2 4\n6",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 2\n4",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "2 3 4\n6",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "5 10\n15",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "2 5\n12",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Count unique subsets with replacement summing to target using depth-first search.",
    "conceptualExplanation": [
      "Step 1: Read candidates and target.",
      "Step 2: Sort candidates ascending.",
      "Step 3: Define dfs(start, rem): if rem == 0, count++.",
      "Step 4: For i from start to length: if candidates[i] > rem, break; dfs(i, rem - candidates[i]).",
      "Step 5: Output count."
    ]
  },
  {
    "id": "ch_subsets",
    "title": "Subsets Power Set Count & Size",
    "difficulty": "Medium",
    "category": "Recursion",
    "description": "Given an integer array `nums` of unique elements, return two space-separated integers: the total size of its power set (2^n) and the number of subsets with size >= 2.",
    "inputFormat": "A single line containing space-separated unique integers.",
    "outputFormat": "Two space-separated integers: total subsets count and subsets of size >= 2.",
    "constraints": [
      "1 <= nums.length <= 10",
      "-10 <= nums[i] <= 10",
      "All numbers of nums are unique."
    ],
    "examples": [
      {
        "input": "1 2 3",
        "output": "8 4",
        "explanation": "Total 2^3 = 8 subsets. Subsets of size >= 2 are [1,2], [1,3], [2,3], [1,2,3] (total 4)."
      },
      {
        "input": "0",
        "output": "2 0",
        "explanation": "Total subsets are [] and [0]. Subsets of size >= 2 is 0."
      }
    ],
    "hints": [
      "The total number of subsets of a set of size n is exactly 2^n.",
      "The subsets of size < 2 are the empty set (size 0) and the n singletons (size 1).",
      "Subsets of size >= 2 equals 2^n - 1 - n."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3",
        "expectedOutput": "8 4",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "2 0",
        "isHidden": false
      },
      {
        "input": "1 2",
        "expectedOutput": "4 1",
        "isHidden": false
      },
      {
        "input": "1 2 3 4",
        "expectedOutput": "16 11",
        "isHidden": true
      },
      {
        "input": "5",
        "expectedOutput": "2 0",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "32 26",
        "isHidden": true
      },
      {
        "input": "10 20",
        "expectedOutput": "4 1",
        "isHidden": true
      },
      {
        "input": "9 8 7",
        "expectedOutput": "8 4",
        "isHidden": true
      },
      {
        "input": "2 4 6 8",
        "expectedOutput": "16 11",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6",
        "expectedOutput": "64 57",
        "isHidden": true
      }
    ],
    "objective": "Compute power set size and filter subset combinations by cardinality.",
    "conceptualExplanation": [
      "Step 1: Read numbers into array; n = nums.length.",
      "Step 2: Total power set count = 2^n.",
      "Step 3: Count of subsets of size >= 2 = 2^n - n - 1.",
      "Step 4: Output both numbers separated by space."
    ]
  },
  {
    "id": "ch_binary_search",
    "title": "Binary Search in Sorted Array",
    "difficulty": "Easy",
    "category": "Binary Search",
    "description": "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    "inputFormat": "Line 1: Space-separated integers sorted ascending.\nLine 2: Target integer.",
    "outputFormat": "A single integer: 0-based index of target, or -1.",
    "constraints": [
      "1 <= nums.length <= 10^4",
      "-10^4 < nums[i], target < 10^4",
      "All the integers in nums are unique.",
      "nums is sorted in ascending order."
    ],
    "examples": [
      {
        "input": "-1 0 3 5 9 12\n9",
        "output": "4",
        "explanation": "9 exists in nums and its index is 4."
      },
      {
        "input": "-1 0 3 5 9 12\n2",
        "output": "-1",
        "explanation": "2 does not exist in nums so return -1."
      }
    ],
    "hints": [
      "Maintain search bounds left = 0 and right = n - 1.",
      "Calculate mid = Math.floor((left + right) / 2).",
      "Compare nums[mid] with target: if equal, return mid; if less, left = mid + 1; else right = mid - 1."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "-1 0 3 5 9 12\n9",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "-1 0 3 5 9 12\n2",
        "expectedOutput": "-1",
        "isHidden": false
      },
      {
        "input": "5\n5",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 3 5 7 9\n1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1 3 5 7 9\n9",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "2 4 6 8 10\n6",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50\n25",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "-10 -5 0 5 10\n-5",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6 7 8\n7",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "100 200 300\n400",
        "expectedOutput": "-1",
        "isHidden": true
      }
    ],
    "objective": "Execute logarithmic search over sorted array partition.",
    "conceptualExplanation": [
      "Step 1: Set left = 0, right = n - 1.",
      "Step 2: While left <= right, mid = (left + right) >> 1.",
      "Step 3: If nums[mid] == target, return mid.",
      "Step 4: If nums[mid] < target, left = mid + 1, else right = mid - 1.",
      "Step 5: Return -1 if not found."
    ]
  },
  {
    "id": "ch_search_rotated_array",
    "title": "Search in Rotated Sorted Array",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "There is an integer array `nums` sorted in ascending order (with distinct values).\n\nPrior to being passed to your function, `nums` is possibly rotated at an unknown pivot index.\n\nGiven the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.\n\nYou must achieve O(log n) runtime complexity.",
    "inputFormat": "Line 1: Space-separated integers representing rotated sorted array.\nLine 2: Target integer.",
    "outputFormat": "A single integer: 0-based index or -1.",
    "constraints": [
      "1 <= nums.length <= 5000",
      "-10^4 <= nums[i] <= 10^4",
      "All values of nums are unique."
    ],
    "examples": [
      {
        "input": "4 5 6 7 0 1 2\n0",
        "output": "4",
        "explanation": "0 is at index 4."
      },
      {
        "input": "4 5 6 7 0 1 2\n3",
        "output": "-1",
        "explanation": "3 does not exist in array."
      }
    ],
    "hints": [
      "In any rotated sorted array, at least one half (left or right of mid) is always normally sorted.",
      "Check if left half is sorted (nums[left] <= nums[mid]). If so, check if target lies within nums[left] and nums[mid].",
      "Otherwise, the right half is sorted; check if target lies within nums[mid] and nums[right]."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4 5 6 7 0 1 2\n0",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "4 5 6 7 0 1 2\n3",
        "expectedOutput": "-1",
        "isHidden": false
      },
      {
        "input": "1\n0",
        "expectedOutput": "-1",
        "isHidden": false
      },
      {
        "input": "1\n1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "3 1\n1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "5 1 3\n5",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "4 5 6 7 8 1 2 3\n8",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "6 7 1 2 3 4 5\n6",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "2 3 4 5 1\n1",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "8 9 2 3 4\n9",
        "expectedOutput": "1",
        "isHidden": true
      }
    ],
    "objective": "Perform modified binary search on cyclically pivoted monotonic array.",
    "conceptualExplanation": [
      "Step 1: Set left = 0, right = n - 1.",
      "Step 2: While left <= right, mid = (left + right) / 2.",
      "Step 3: If nums[mid] == target, return mid.",
      "Step 4: If left half sorted (nums[left] <= nums[mid]): if target in [nums[left], nums[mid]), right = mid - 1, else left = mid + 1.",
      "Step 5: Else right half sorted: if target in (nums[mid], nums[right]], left = mid + 1, else right = mid - 1; return -1 if not found."
    ]
  },
  {
    "id": "ch_find_min_rotated",
    "title": "Find Minimum in Rotated Sorted Array",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "Suppose an array of length `n` sorted in ascending order is rotated between `1` and `n` times.\n\nGiven the sorted rotated array `nums` of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in O(log n) time.",
    "inputFormat": "A single line containing space-separated integers.",
    "outputFormat": "A single integer: the minimum element.",
    "constraints": [
      "n == nums.length",
      "1 <= n <= 5000",
      "-5000 <= nums[i] <= 5000",
      "All the integers of nums are unique."
    ],
    "examples": [
      {
        "input": "3 4 5 1 2",
        "output": "1",
        "explanation": "Original array was [1, 2, 3, 4, 5] rotated 3 times."
      },
      {
        "input": "4 5 6 7 0 1 2",
        "output": "0",
        "explanation": "Minimum value is 0."
      }
    ],
    "hints": [
      "Compare nums[mid] with nums[right].",
      "If nums[mid] > nums[right], the minimum lies strictly to the right of mid: left = mid + 1.",
      "If nums[mid] <= nums[right], the minimum is at mid or to the left: right = mid."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 4 5 1 2",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "4 5 6 7 0 1 2",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "11 13 15 17",
        "expectedOutput": "11",
        "isHidden": false
      },
      {
        "input": "2 1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3 1 2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "5 1 2 3 4",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "10 20 30 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "2 3 4 5 6 7 8 1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "8 9 10 2 3 4 5 6 7",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Identify array inflection pivot representing minimum value in logarithmic time.",
    "conceptualExplanation": [
      "Step 1: Set left = 0, right = n - 1.",
      "Step 2: While left < right, mid = (left + right) / 2.",
      "Step 3: If nums[mid] > nums[right], search right half: left = mid + 1.",
      "Step 4: Else search left half including mid: right = mid.",
      "Step 5: Output nums[left]."
    ]
  },
  {
    "id": "ch_find_peak_element",
    "title": "Find Peak Element Index",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "A peak element is an element that is strictly greater than its neighbors.\n\nGiven a 0-indexed integer array `nums`, find a peak element, and return its index. If the array contains multiple peaks, return the index to any of the peaks.\n\nYou may imagine that `nums[-1] = nums[n] = -∞`.\n\nYou must write an algorithm that runs in O(log n) time.",
    "inputFormat": "A single line containing space-separated integers.",
    "outputFormat": "A single integer: 0-based index of a peak element.",
    "constraints": [
      "1 <= nums.length <= 1000",
      "-2^31 <= nums[i] <= 2^31 - 1",
      "nums[i] != nums[i + 1] for all valid i."
    ],
    "examples": [
      {
        "input": "1 2 3 1",
        "output": "2",
        "explanation": "3 is a peak element and your function should return the index number 2."
      },
      {
        "input": "1 2 1 3 5 6 4",
        "output": "5",
        "explanation": "Your function can return index 1 (value 2) or index 5 (value 6)."
      }
    ],
    "hints": [
      "Compare nums[mid] with nums[mid + 1].",
      "If nums[mid] > nums[mid + 1], then a peak is guaranteed to exist on the left side (or is mid itself): right = mid.",
      "If nums[mid] < nums[mid + 1], a peak is guaranteed to exist on the right: left = mid + 1."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 1",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "1 2 1 3 5 6 4",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2 1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1 3 2 1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "5 4 3 2 1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1 5 1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 3 2 1",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Locate any local maximum in an unsorted array in O(log n) time.",
    "conceptualExplanation": [
      "Step 1: Set left = 0, right = n - 1.",
      "Step 2: While left < right, mid = (left + right) / 2.",
      "Step 3: If nums[mid] > nums[mid + 1], right = mid.",
      "Step 4: Else left = mid + 1.",
      "Step 5: Output left."
    ]
  },
  {
    "id": "ch_merge_intervals",
    "title": "Merge Overlapping Intervals",
    "difficulty": "Medium",
    "category": "Sorting",
    "description": "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.\n\nPrint the merged intervals formatted as start-end pairs separated by space, e.g. `1-6 8-10 15-18`.",
    "inputFormat": "Line 1: Integer n (number of intervals).\nNext n lines: Two space-separated integers start and end.",
    "outputFormat": "A single line containing space-separated merged intervals in start-end format.",
    "constraints": [
      "1 <= n <= 10^4",
      "0 <= start_i <= end_i <= 10^4"
    ],
    "examples": [
      {
        "input": "4\n1 3\n2 6\n8 10\n15 18",
        "output": "1-6 8-10 15-18",
        "explanation": "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."
      },
      {
        "input": "2\n1 4\n4 5",
        "output": "1-5",
        "explanation": "Intervals [1,4] and [4,5] overlap at boundary 4, merge to [1,5]."
      }
    ],
    "hints": [
      "Sort intervals primarily by start time in ascending order.",
      "Initialize merged list with the first interval.",
      "For each subsequent interval, if its start <= last merged end, extend last merged end = max(end, cur.end). Otherwise append as new interval."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4\n1 3\n2 6\n8 10\n15 18",
        "expectedOutput": "1-6 8-10 15-18",
        "isHidden": false
      },
      {
        "input": "2\n1 4\n4 5",
        "expectedOutput": "1-5",
        "isHidden": false
      },
      {
        "input": "1\n1 4",
        "expectedOutput": "1-4",
        "isHidden": false
      },
      {
        "input": "2\n1 4\n0 4",
        "expectedOutput": "0-4",
        "isHidden": true
      },
      {
        "input": "2\n1 4\n2 3",
        "expectedOutput": "1-4",
        "isHidden": true
      },
      {
        "input": "3\n1 4\n5 6\n7 8",
        "expectedOutput": "1-4 5-6 7-8",
        "isHidden": true
      },
      {
        "input": "3\n1 10\n2 3\n4 5",
        "expectedOutput": "1-10",
        "isHidden": true
      },
      {
        "input": "4\n2 3\n4 5\n6 7\n8 9",
        "expectedOutput": "2-3 4-5 6-7 8-9",
        "isHidden": true
      },
      {
        "input": "2\n1 4\n0 0",
        "expectedOutput": "0-0 1-4",
        "isHidden": true
      },
      {
        "input": "3\n1 4\n0 2\n3 5",
        "expectedOutput": "0-5",
        "isHidden": true
      }
    ],
    "objective": "Coalesce intersecting intervals into minimal disjoint ranges.",
    "conceptualExplanation": [
      "Step 1: Parse n intervals into [start, end] pairs.",
      "Step 2: Sort intervals ascending by start time.",
      "Step 3: Push first interval to merged array.",
      "Step 4: For each remaining interval, if cur[0] <= merged.last[1], update merged.last[1] = max(merged.last[1], cur[1]); else push cur.",
      "Step 5: Output intervals formatted as start-end space-separated."
    ]
  },
  {
    "id": "ch_sort_colors",
    "title": "Sort Colors (Dutch National Flag)",
    "difficulty": "Medium",
    "category": "Sorting",
    "description": "Given an array `nums` with `n` objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue.\n\nWe will use the integers `0`, `1`, and `2` to represent the color red, white, and blue, respectively.\n\nYou must solve this problem without using the library's sort function and in one pass with O(1) extra memory.",
    "inputFormat": "A single line containing space-separated integers (0, 1, or 2).",
    "outputFormat": "A single line of space-separated integers in sorted order.",
    "constraints": [
      "n == nums.length",
      "1 <= n <= 300",
      "nums[i] is either 0, 1, or 2."
    ],
    "examples": [
      {
        "input": "2 0 2 1 1 0",
        "output": "0 0 1 1 2 2",
        "explanation": "All 0s first, followed by 1s, followed by 2s."
      },
      {
        "input": "2 0 1",
        "output": "0 1 2",
        "explanation": "Sorted in three partitions."
      }
    ],
    "hints": [
      "Dijkstra's Dutch National Flag partition algorithm uses three pointers: low, mid, and high.",
      "If nums[mid] == 0: swap(nums[low], nums[mid]), low++, mid++.",
      "If nums[mid] == 1: mid++.",
      "If nums[mid] == 2: swap(nums[mid], nums[high]), high--."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 0 2 1 1 0",
        "expectedOutput": "0 0 1 1 2 2",
        "isHidden": false
      },
      {
        "input": "2 0 1",
        "expectedOutput": "0 1 2",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 0 2",
        "expectedOutput": "0 1 2",
        "isHidden": true
      },
      {
        "input": "0 0 0",
        "expectedOutput": "0 0 0",
        "isHidden": true
      },
      {
        "input": "2 2 2",
        "expectedOutput": "2 2 2",
        "isHidden": true
      },
      {
        "input": "1 2 0 1 2 0",
        "expectedOutput": "0 0 1 1 2 2",
        "isHidden": true
      },
      {
        "input": "2 1 0 2 1 0",
        "expectedOutput": "0 0 1 1 2 2",
        "isHidden": true
      }
    ],
    "objective": "Partition three distinct keys in-place in linear time with zero auxiliary memory.",
    "conceptualExplanation": [
      "Step 1: Set low = 0, mid = 0, high = n - 1.",
      "Step 2: While mid <= high, inspect nums[mid].",
      "Step 3: If 0: swap nums[low] and nums[mid], low++, mid++.",
      "Step 4: If 1: mid++; If 2: swap nums[mid] and nums[high], high--.",
      "Step 5: Output sorted nums space-separated."
    ]
  },
  {
    "id": "ch_kth_largest_array",
    "title": "Kth Largest Element in an Array",
    "difficulty": "Medium",
    "category": "Sorting",
    "description": "Given an integer array `nums` and an integer `k`, return the `k`th largest element in the array.\n\nNote that it is the `k`th largest element in sorted order, not the `k`th distinct element.",
    "inputFormat": "Line 1: Space-separated integers representing array nums.\nLine 2: Integer k.",
    "outputFormat": "A single integer: the kth largest element.",
    "constraints": [
      "1 <= k <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ],
    "examples": [
      {
        "input": "3 2 1 5 6 4\n2",
        "output": "5",
        "explanation": "The 2nd largest element in [1, 2, 3, 4, 5, 6] is 5."
      },
      {
        "input": "3 2 3 1 2 4 5 5 6\n4",
        "output": "4",
        "explanation": "The 4th largest element is 4."
      }
    ],
    "hints": [
      "Quickselect algorithm finds kth largest in average O(n) time.",
      "Alternatively, maintain a min-heap of size k: the root will hold the kth largest element.",
      "Sorting descending puts kth largest at index k - 1."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 2 1 5 6 4\n2",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "3 2 3 1 2 4 5 5 6\n4",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "1\n1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "7 10 4 3 20 15\n3",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "7 10 4 3 20 15\n4",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "-1 2 0\n1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "-1 -2 -3 -4\n2",
        "expectedOutput": "-2",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6\n1",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6\n6",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "100 50 150 200\n3",
        "expectedOutput": "100",
        "isHidden": true
      }
    ],
    "objective": "Select order statistic k from unsorted numbers with optimal partitioning.",
    "conceptualExplanation": [
      "Step 1: Read array and integer k.",
      "Step 2: Sort array in descending order.",
      "Step 3: Access element at index k - 1.",
      "Step 4: Output value to standard output."
    ]
  },
  {
    "id": "ch_non_overlapping_intervals",
    "title": "Non-overlapping Intervals Min Removal",
    "difficulty": "Medium",
    "category": "Sorting",
    "description": "Given an array of intervals `intervals` where `intervals[i] = [start_i, end_i]`, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
    "inputFormat": "Line 1: Integer n (number of intervals).\nNext n lines: Two space-separated integers start and end.",
    "outputFormat": "A single integer: minimum intervals removed.",
    "constraints": [
      "1 <= n <= 10^5",
      "-5 * 10^4 <= start_i < end_i <= 5 * 10^4"
    ],
    "examples": [
      {
        "input": "4\n1 2\n2 3\n3 4\n1 3",
        "output": "1",
        "explanation": "[1,3] can be removed and the rest are non-overlapping."
      },
      {
        "input": "3\n1 2\n1 2\n1 2",
        "output": "2",
        "explanation": "You need to remove two [1,2] to leave one interval."
      }
    ],
    "hints": [
      "This is equivalent to finding the maximum number of mutually compatible intervals (Interval Scheduling).",
      "Sort intervals by end time in ascending order.",
      "Greedily select intervals that end earliest without overlapping previously chosen interval."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4\n1 2\n2 3\n3 4\n1 3",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "3\n1 2\n1 2\n1 2",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "3\n1 2\n2 3\n3 4",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1\n1 2",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "2\n1 10\n2 3",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "4\n1 100\n11 22\n1 11\n2 12",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3\n1 3\n2 4\n3 5",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2\n1 2\n1 3",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "4\n0 2\n1 3\n2 4\n3 5",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "5\n1 2\n2 3\n3 4\n4 5\n1 5",
        "expectedOutput": "1",
        "isHidden": true
      }
    ],
    "objective": "Minimize removed interval count by maximizing non-conflicting schedule.",
    "conceptualExplanation": [
      "Step 1: Read n intervals.",
      "Step 2: Sort intervals ascending by end coordinate.",
      "Step 3: Track end of last kept interval initialized to -Infinity.",
      "Step 4: For each interval: if start >= end, update end = interval.end; else removeCount++.",
      "Step 5: Output removeCount."
    ]
  },
  {
    "id": "ch_invert_binary_tree",
    "title": "Invert Binary Tree Level Order",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the root of a binary tree in level order representation, invert the tree (swap left and right subtrees recursively), and return its inverted level-order traversal.",
    "inputFormat": "A single line containing space-separated integers/nulls representing level-order binary tree.",
    "outputFormat": "A single line containing space-separated level-order nodes of the inverted tree.",
    "constraints": [
      "0 <= number of nodes <= 100",
      "-100 <= Node.val <= 100"
    ],
    "examples": [
      {
        "input": "4 2 7 1 3 6 9",
        "output": "4 7 2 9 6 3 1",
        "explanation": "Left child 2 and right child 7 swap, and their children swap respectively."
      },
      {
        "input": "2 1 3",
        "output": "2 3 1",
        "explanation": "Subtrees 1 and 3 swap."
      }
    ],
    "hints": [
      "To invert a node, swap its left and right child pointers.",
      "Recursively invert the left subtree and right subtree.",
      "Serialize the resulting tree back to level order."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4 2 7 1 3 6 9",
        "expectedOutput": "4 7 2 9 6 3 1",
        "isHidden": false
      },
      {
        "input": "2 1 3",
        "expectedOutput": "2 3 1",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 2 null",
        "expectedOutput": "1 null 2",
        "isHidden": true
      },
      {
        "input": "1 null 2",
        "expectedOutput": "1 2",
        "isHidden": true
      },
      {
        "input": "3 1 4 null 2",
        "expectedOutput": "3 4 1 null null 2",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6 7",
        "expectedOutput": "1 3 2 7 6 5 4",
        "isHidden": true
      },
      {
        "input": "5 3 8 1 4",
        "expectedOutput": "5 8 3 null null 4 1",
        "isHidden": true
      },
      {
        "input": "10 5 15",
        "expectedOutput": "10 15 5",
        "isHidden": true
      },
      {
        "input": "8 4 12 2 6 10 14",
        "expectedOutput": "8 12 4 14 10 6 2",
        "isHidden": true
      }
    ],
    "objective": "Mirror left and right child branches across every hierarchy level.",
    "conceptualExplanation": [
      "Step 1: Deserialize input level-order array into a Binary Tree.",
      "Step 2: Recursive invert function swaps node.left and node.right.",
      "Step 3: Call invert on root.left and root.right.",
      "Step 4: BFS queue serializes tree back to level-order array.",
      "Step 5: Trim trailing nulls and output space-separated."
    ]
  },
  {
    "id": "ch_max_depth_binary_tree",
    "title": "Maximum Depth of Binary Tree",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the root of a binary tree in level order, return its maximum depth.\n\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    "inputFormat": "A single line containing space-separated node values in level order ('null' for missing nodes).",
    "outputFormat": "A single integer: maximum tree depth.",
    "constraints": [
      "0 <= number of nodes <= 10^4",
      "-100 <= Node.val <= 100"
    ],
    "examples": [
      {
        "input": "3 9 20 null null 15 7",
        "output": "3",
        "explanation": "Path 3 -> 20 -> 15 has length 3."
      },
      {
        "input": "1 null 2",
        "output": "2",
        "explanation": "Depth is 2."
      }
    ],
    "hints": [
      "The depth of a tree is 1 + max(depth(left), depth(right)).",
      "Base case: an empty tree (null) has depth 0."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 9 20 null null 15 7",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1 null 2",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1 2 null 3 null 4",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 null null 5",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6 7",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1 null 2 null 3 null 4 null 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "2 3",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "5 4 8 11 null 13 4 7 2",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Compute vertical height of binary tree using depth-first tree traversal.",
    "conceptualExplanation": [
      "Step 1: Deserialize tree from level-order tokens.",
      "Step 2: Recursive function getDepth(node): if !node return 0.",
      "Step 3: Return 1 + max(getDepth(node.left), getDepth(node.right)).",
      "Step 4: Output computed depth integer."
    ]
  },
  {
    "id": "ch_validate_bst",
    "title": "Validate Binary Search Tree",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given the root of a binary tree in level order, determine if it is a valid binary search tree (BST).\n\nA valid BST is defined as follows: the left subtree of a node contains only nodes with keys strictly less than the node's key; the right subtree contains only nodes with keys strictly greater; both left and right subtrees must also be binary search trees.",
    "inputFormat": "A single line containing space-separated level-order node values ('null' for absent).",
    "outputFormat": "A single line with 'true' if valid BST, or 'false' otherwise.",
    "constraints": [
      "0 <= number of nodes <= 10^4",
      "-2^31 <= Node.val <= 2^31 - 1"
    ],
    "examples": [
      {
        "input": "2 1 3",
        "output": "true",
        "explanation": "Root 2 has left child 1 (< 2) and right child 3 (> 2)."
      },
      {
        "input": "5 1 4 null null 3 6",
        "output": "false",
        "explanation": "Root value 5 has right child 4 which violates BST property."
      }
    ],
    "hints": [
      "Every node must satisfy a valid range [min, max].",
      "Root starts with range (-Infinity, Infinity).",
      "Left child must satisfy (min, node.val); right child must satisfy (node.val, max)."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 1 3",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "5 1 4 null null 3 6",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "2 2 2",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "10 5 15 null null 6 20",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "3 2 5 1 4",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "5 3 7 2 4 6 8",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "2 1",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "4 2 6 1 3 5 7",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Verify global monotonic ordering invariant across all hierarchical tree subtrees.",
    "conceptualExplanation": [
      "Step 1: Deserialize binary tree.",
      "Step 2: Recursive helper validate(node, min, max): if !node return true.",
      "Step 3: If node.val <= min or node.val >= max, return false.",
      "Step 4: Recurse: validate(node.left, min, node.val) && validate(node.right, node.val, max).",
      "Step 5: Output 'true' or 'false'."
    ]
  },
  {
    "id": "ch_lca_binary_tree",
    "title": "Lowest Common Ancestor of Binary Tree",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given a binary tree in level order, find the lowest common ancestor (LCA) of two given nodes `p` and `q`.\n\nThe lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow a node to be a descendant of itself).",
    "inputFormat": "Line 1: Space-separated level-order node values ('null' for missing).\nLine 2: Value p.\nLine 3: Value q.",
    "outputFormat": "A single integer: value of the LCA node.",
    "constraints": [
      "The number of nodes in the tree is in the range [2, 10^5].",
      "-10^9 <= Node.val <= 10^9",
      "All Node.val are unique.",
      "p != q",
      "p and q exist in the tree."
    ],
    "examples": [
      {
        "input": "3 5 1 6 2 0 8 null null 7 4\n5\n1",
        "output": "3",
        "explanation": "LCA of 5 and 1 is 3."
      },
      {
        "input": "3 5 1 6 2 0 8 null null 7 4\n5\n4",
        "output": "5",
        "explanation": "LCA of 5 and 4 is 5, since a node can be descendant of itself."
      }
    ],
    "hints": [
      "Use post-order traversal: if current node is null, p, or q, return current node.",
      "Recurse on left and right subtrees.",
      "If both left and right return non-null, current node is the LCA. Otherwise return whichever subtree returned non-null."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 5 1 6 2 0 8 null null 7 4\n5\n1",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "3 5 1 6 2 0 8 null null 7 4\n5\n4",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "1 2\n1\n2",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "6 2 8 0 4 7 9\n2\n8",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "6 2 8 0 4 7 9\n2\n4",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "2 1 3\n1\n3",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3 5 1 6 2 0 8\n6\n2",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "3 5 1 6 2 0 8\n7\n8",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "1 2 3\n2\n3",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "5 3 6 2 4\n2\n4",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Identify the deepest shared ancestor node of two tree elements.",
    "conceptualExplanation": [
      "Step 1: Parse tree and targets p, q.",
      "Step 2: Helper lca(node, p, q): if !node or node.val == p or node.val == q, return node.",
      "Step 3: left = lca(node.left, p, q); right = lca(node.right, p, q).",
      "Step 4: If left && right, return node; else return left || right.",
      "Step 5: Output LCA value."
    ]
  },
  {
    "id": "ch_number_of_islands",
    "title": "Number of Islands",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
    "inputFormat": "Line 1: Two integers m and n (rows and columns).\nNext m lines: n space-separated characters ('1' or '0').",
    "outputFormat": "A single integer: number of distinct islands.",
    "constraints": [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      "grid[i][j] is '0' or '1'."
    ],
    "examples": [
      {
        "input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
        "output": "1",
        "explanation": "All land cells form 1 single connected island."
      },
      {
        "input": "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
        "output": "3",
        "explanation": "Grid has 3 disconnected islands."
      }
    ],
    "hints": [
      "Traverse every cell in the grid.",
      "When encountering a '1', increment island count and initiate DFS/BFS to sink all connected land cells by marking them '0'.",
      "Total number of initiated traversals equals the number of islands."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1 1\n1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 1\n0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "2 2\n1 0\n0 1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3 3\n1 1 1\n0 1 0\n1 1 1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3 3\n1 0 1\n0 1 0\n1 0 1",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "1 4\n1 0 1 0",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "4 1\n1\n0\n1\n0",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3 3\n0 0 0\n0 0 0\n0 0 0",
        "expectedOutput": "0",
        "isHidden": true
      }
    ],
    "objective": "Identify connected components in an unweighted grid graph using flood fill.",
    "conceptualExplanation": [
      "Step 1: Read dimensions m, n and grid cells.",
      "Step 2: Initialize count = 0.",
      "Step 3: Define dfs(r, c): if out of bounds or grid[r][c] != '1', return; set grid[r][c] = '0'; recurse 4 directions.",
      "Step 4: Loop through all cells (r, c): if grid[r][c] == '1', count++ and dfs(r, c).",
      "Step 5: Output count."
    ]
  },
  {
    "id": "ch_clone_graph",
    "title": "Graph Node Reachability Count",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "Given an undirected connected graph with `n` nodes labeled `1` to `n` and `m` edges, count the total reachable nodes and edges from node `1`.\n\nOutput two space-separated integers: reachable node count and total edge count.",
    "inputFormat": "Line 1: Two integers n and m.\nNext m lines: Two space-separated integers u and v representing an undirected edge.",
    "outputFormat": "Two space-separated integers: reachable node count and total edge count.",
    "constraints": [
      "1 <= n <= 100",
      "0 <= m <= 500",
      "1 <= u, v <= n"
    ],
    "examples": [
      {
        "input": "4 4\n1 2\n2 3\n3 4\n4 1",
        "output": "4 4",
        "explanation": "All 4 nodes are connected in a cycle with 4 edges."
      },
      {
        "input": "2 1\n1 2",
        "output": "2 1",
        "explanation": "2 nodes connected by 1 edge."
      }
    ],
    "hints": [
      "Build an adjacency list from the edge list.",
      "Use BFS or DFS starting at node 1 to discover all reachable vertices.",
      "Return the size of the visited set along with m."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4 4\n1 2\n2 3\n3 4\n4 1",
        "expectedOutput": "4 4",
        "isHidden": false
      },
      {
        "input": "2 1\n1 2",
        "expectedOutput": "2 1",
        "isHidden": false
      },
      {
        "input": "1 0",
        "expectedOutput": "1 0",
        "isHidden": false
      },
      {
        "input": "3 3\n1 2\n2 3\n3 1",
        "expectedOutput": "3 3",
        "isHidden": true
      },
      {
        "input": "4 3\n1 2\n1 3\n1 4",
        "expectedOutput": "4 3",
        "isHidden": true
      },
      {
        "input": "5 4\n1 2\n2 3\n3 4\n4 5",
        "expectedOutput": "5 4",
        "isHidden": true
      },
      {
        "input": "5 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 3",
        "expectedOutput": "5 6",
        "isHidden": true
      },
      {
        "input": "3 2\n1 2\n2 3",
        "expectedOutput": "3 2",
        "isHidden": true
      },
      {
        "input": "4 6\n1 2\n1 3\n1 4\n2 3\n2 4\n3 4",
        "expectedOutput": "4 6",
        "isHidden": true
      },
      {
        "input": "2 0",
        "expectedOutput": "1 0",
        "isHidden": true
      }
    ],
    "objective": "Execute complete connected component graph discovery starting from vertex 1.",
    "conceptualExplanation": [
      "Step 1: Read n and m.",
      "Step 2: Construct undirected adjacency graph.",
      "Step 3: Run DFS from node 1, tracking visited set.",
      "Step 4: Output visited.size and m separated by space."
    ]
  },
  {
    "id": "ch_course_schedule",
    "title": "Course Schedule Cycle Detection",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [a_i, b_i]` indicates that you must take course `b_i` first if you want to take course `a_i`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.",
    "inputFormat": "Line 1: Two integers numCourses and numPrerequisites.\nNext numPrerequisites lines: Two space-separated integers course a and prerequisite b.",
    "outputFormat": "A single line with 'true' or 'false'.",
    "constraints": [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= 5000",
      "All prerequisite pairs are unique."
    ],
    "examples": [
      {
        "input": "2 1\n1 0",
        "output": "true",
        "explanation": "Take course 0 then course 1."
      },
      {
        "input": "2 2\n1 0\n0 1",
        "output": "false",
        "explanation": "Cyclic dependency between course 0 and 1."
      }
    ],
    "hints": [
      "This is cycle detection in a directed graph using Topological Sort (Kahn's Algorithm).",
      "Calculate in-degrees for each vertex. Queue all vertices with in-degree 0.",
      "Pop from queue, decrement neighbors' in-degrees, and queue any that reach 0.",
      "If total processed vertices equals numCourses, graph is acyclic (return true)."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 1\n1 0",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "2 2\n1 0\n0 1",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "1 0",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "3 2\n1 0\n2 1",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "3 3\n1 0\n2 1\n0 2",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "4 4\n1 0\n2 0\n3 1\n3 2",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "4 4\n1 0\n2 1\n3 2\n1 3",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "5 4\n1 0\n2 1\n3 2\n4 3",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "3 1\n0 1",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "2 1\n0 1",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Detect cyclical dependency deadlocks in directed precedence graphs.",
    "conceptualExplanation": [
      "Step 1: Build adjacency list and inDegree array of size numCourses.",
      "Step 2: Add all courses with inDegree == 0 to queue.",
      "Step 3: While queue is non-empty, pop course, increment processed count, decrement inDegree of dependent courses.",
      "Step 4: If a dependent reaches inDegree 0, push to queue.",
      "Step 5: Output 'true' if processedCount == numCourses, else 'false'."
    ]
  },
  {
    "id": "ch_rotting_oranges",
    "title": "Rotting Oranges Multi-Source BFS",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "You are given an `m x n` grid where each cell can have one of three values:\n• `0` representing an empty cell,\n• `1` representing a fresh orange, or\n• `2` representing a rotten orange.\n\nEvery minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.\n\nReturn the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return `-1`.",
    "inputFormat": "Line 1: Two integers m and n.\nNext m lines: n space-separated integers (0, 1, or 2).",
    "outputFormat": "A single integer: minimum minutes, or -1.",
    "constraints": [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 10",
      "grid[i][j] is 0, 1, or 2."
    ],
    "examples": [
      {
        "input": "3 3\n2 1 1\n1 1 0\n0 1 1",
        "output": "4",
        "explanation": "All fresh oranges rot in 4 minutes."
      },
      {
        "input": "3 3\n2 1 1\n0 1 1\n1 0 1",
        "output": "-1",
        "explanation": "Orange in bottom-left corner never rots."
      },
      {
        "input": "1 2\n0 2",
        "output": "0",
        "explanation": "Since there are already 0 fresh oranges at minute 0, the answer is just 0."
      }
    ],
    "hints": [
      "Use Multi-source Breadth-First Search (BFS).",
      "Initialize queue with all coordinates containing rotten oranges (value 2) and time 0.",
      "Count total fresh oranges initially. Decrement count whenever an orange rots.",
      "If fresh oranges remaining is 0, return elapsed time; else return -1."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 3\n2 1 1\n1 1 0\n0 1 1",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "3 3\n2 1 1\n0 1 1\n1 0 1",
        "expectedOutput": "-1",
        "isHidden": false
      },
      {
        "input": "1 2\n0 2",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 1\n1",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "1 1\n2",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "2 2\n2 1\n1 2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1 3\n2 1 1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3 1\n2\n1\n1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "2 3\n2 1 1\n1 1 2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3 3\n1 1 1\n1 2 1\n1 1 1",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Model epidemic propagation across grid graph using multi-source BFS.",
    "conceptualExplanation": [
      "Step 1: Queue all rotten oranges [r, c, 0] and count fresh oranges.",
      "Step 2: If fresh == 0, return 0 immediately.",
      "Step 3: Run BFS: pop [r, c, t], infect 4-direction neighbors with value 1, set them to 2, fresh--, push [nr, nc, t + 1].",
      "Step 4: Keep track of maximum time elapsed.",
      "Step 5: Return fresh == 0 ? maxTime : -1."
    ]
  },
  {
    "id": "ch_jump_game",
    "title": "Jump Game Reachability",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn `true` if you can reach the last index, or `false` otherwise.",
    "inputFormat": "A single line containing space-separated integers.",
    "outputFormat": "A single line with 'true' or 'false'.",
    "constraints": [
      "1 <= nums.length <= 10^4",
      "0 <= nums[i] <= 10^5"
    ],
    "examples": [
      {
        "input": "2 3 1 1 4",
        "output": "true",
        "explanation": "Jump 1 step from index 0 to 1, then 3 steps to the last index."
      },
      {
        "input": "3 2 1 0 4",
        "output": "false",
        "explanation": "You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index."
      }
    ],
    "hints": [
      "Keep track of the furthest index you can reach so far (maxReach).",
      "Iterate through the array: if current index > maxReach, you cannot proceed (return false).",
      "Update maxReach = max(maxReach, i + nums[i]). If maxReach >= n - 1, return true."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 3 1 1 4",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "3 2 1 0 4",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "2 0 0",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 1 1 1",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "0 2 3",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "1 2 3",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "2 5 0 0",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 0 1 0",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "1 1 0 1",
        "expectedOutput": "false",
        "isHidden": true
      }
    ],
    "objective": "Ascertain destination reachability by maintaining the optimal greedy frontier.",
    "conceptualExplanation": [
      "Step 1: Read array nums.",
      "Step 2: Initialize maxReach = 0.",
      "Step 3: Loop i from 0 to n - 1: if i > maxReach, return 'false'.",
      "Step 4: Update maxReach = max(maxReach, i + nums[i]).",
      "Step 5: Return 'true'."
    ]
  },
  {
    "id": "ch_gas_station",
    "title": "Gas Station Circuit",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "There are `n` gas stations along a circular route, where the amount of gas at the `i`th station is `gas[i]`.\n\nYou have a car with an unlimited gas tank and it costs `cost[i]` of gas to travel from the `i`th station to its next `(i + 1)`th station. You begin the journey with an empty tank at one of the gas stations.\n\nGiven two integer arrays `gas` and `cost`, return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return `-1`.\n\nIf there exists a solution, it is guaranteed to be unique.",
    "inputFormat": "Line 1: Space-separated integers representing gas.\nLine 2: Space-separated integers representing cost.",
    "outputFormat": "A single integer: starting index or -1.",
    "constraints": [
      "n == gas.length == cost.length",
      "1 <= n <= 10^5",
      "0 <= gas[i], cost[i] <= 10^4"
    ],
    "examples": [
      {
        "input": "1 2 3 4 5\n3 4 5 1 2",
        "output": "3",
        "explanation": "Start at station 3 (index 3). Fill with 4 gas. Travel to station 4. Tank = 4 - 1 + 5 = 8. And so on around."
      },
      {
        "input": "2 3 4\n3 4 3",
        "output": "-1",
        "explanation": "Total gas (9) is less than total cost (10), so completing the circuit is impossible."
      }
    ],
    "hints": [
      "If the sum of all gas is strictly less than the sum of all cost, completing the circuit is impossible (-1).",
      "If running tank becomes negative starting from candidate station, reset start to i + 1 and reset current tank to 0.",
      "The final candidate is guaranteed to be the unique solution."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 4 5\n3 4 5 1 2",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "2 3 4\n3 4 3",
        "expectedOutput": "-1",
        "isHidden": false
      },
      {
        "input": "5 1 2 3 4\n4 4 1 5 1",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "2\n2",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "3 1 1\n1 2 2",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "4 5 2 6 5 3\n3 2 7 3 2 9",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "1 2\n2 1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "5 8 2 8\n6 5 6 6",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "3 3 4\n3 4 4",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "6 1 4 3 5\n3 8 2 4 2",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Determine starting position for circular circuit without fuel deficit in O(n).",
    "conceptualExplanation": [
      "Step 1: Read gas and cost arrays.",
      "Step 2: Initialize totalTank = 0, currTank = 0, start = 0.",
      "Step 3: For i from 0 to n - 1: diff = gas[i] - cost[i]; totalTank += diff; currTank += diff.",
      "Step 4: If currTank < 0, start = i + 1 and currTank = 0.",
      "Step 5: Return totalTank >= 0 ? start : -1."
    ]
  },
  {
    "id": "ch_assign_cookies",
    "title": "Assign Cookies to Children",
    "difficulty": "Easy",
    "category": "Greedy",
    "description": "Assume you are an awesome parent and want to give your children some cookies. But, you should give each child at most one cookie.\n\nEach child `i` has a greed factor `g[i]`, which is the minimum size of a cookie that the child will be content with; and each cookie `j` has a size `s[j]`. If `s[j] >= g[i]`, we can assign the cookie `j` to the child `i`, and the child `i` will be content.\n\nYour goal is to maximize the number of your content children and output the maximum number.",
    "inputFormat": "Line 1: Space-separated integers for children greed factors g.\nLine 2: Space-separated integers for cookie sizes s.",
    "outputFormat": "A single integer: maximum content children count.",
    "constraints": [
      "1 <= g.length <= 3 * 10^4",
      "0 <= s.length <= 3 * 10^4",
      "1 <= g[i], s[j] <= 2^31 - 1"
    ],
    "examples": [
      {
        "input": "1 2 3\n1 1",
        "output": "1",
        "explanation": "You have 3 children and 2 cookies. Both cookies have size 1. You can only make the child with greed factor 1 content."
      },
      {
        "input": "1 2\n1 2 3",
        "output": "2",
        "explanation": "Both children can be satisfied."
      }
    ],
    "hints": [
      "Sort both children greed array and cookie sizes array in ascending order.",
      "Use two pointers: match the smallest valid cookie that satisfies the least greedy child.",
      "Advance both pointers when a match occurs; advance only cookie pointer otherwise."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3\n1 1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 2\n1 2 3",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "1 2 3\n3",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "10 9 8 7\n5 6 7 8",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 2 3\n1 2 3",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "5\n1 2 3 4",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "2 3 4\n1 1 1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "3 4 5\n6 7 8",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1 1\n1 1 1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5\n5",
        "expectedOutput": "1",
        "isHidden": true
      }
    ],
    "objective": "Maximize satisfied client requests using greedy monotone sorting.",
    "conceptualExplanation": [
      "Step 1: Read greed factors g and cookie sizes s.",
      "Step 2: Sort g and s in ascending order.",
      "Step 3: Pointers i = 0 (child), j = 0 (cookie).",
      "Step 4: While i < g.length and j < s.length: if s[j] >= g[i], i++; j++.",
      "Step 5: Output i (total content children)."
    ]
  },
  {
    "id": "ch_partition_labels",
    "title": "Partition String Labels",
    "difficulty": "Medium",
    "category": "Greedy",
    "description": "You are given a string `s`. We want to partition the string into as many parts as possible so that each letter appears in at most one part.\n\nNote that the partition is done so that after concatenating all the parts in order, the resultant string should be `s`.\n\nReturn a space-separated list of integers representing the size of these parts.",
    "inputFormat": "A single line containing the string s.",
    "outputFormat": "A single line of space-separated integers representing partition sizes.",
    "constraints": [
      "1 <= s.length <= 500",
      "s consists of lowercase English letters."
    ],
    "examples": [
      {
        "input": "ababcbacadefegdehijhklij",
        "output": "9 7 8",
        "explanation": "Partitions are 'ababcbaca' (size 9), 'defegde' (size 7), 'hijhklij' (size 8)."
      },
      {
        "input": "eccbbbbdec",
        "output": "10",
        "explanation": "Only one partition containing all characters."
      }
    ],
    "hints": [
      "First record the last occurrence index of each character in s.",
      "Iterate through the string: maintain the furthest boundary `end = max(end, last[char])`.",
      "When the current index equals `end`, you have found a partition cut point."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "ababcbacadefegdehijhklij",
        "expectedOutput": "9 7 8",
        "isHidden": false
      },
      {
        "input": "eccbbbbdec",
        "expectedOutput": "10",
        "isHidden": false
      },
      {
        "input": "a",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "ab",
        "expectedOutput": "1 1",
        "isHidden": true
      },
      {
        "input": "aba",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "abc",
        "expectedOutput": "1 1 1",
        "isHidden": true
      },
      {
        "input": "caedbdedda",
        "expectedOutput": "1 9",
        "isHidden": true
      },
      {
        "input": "vhaflvhcsiadjcalculate",
        "expectedOutput": "20 1 1",
        "isHidden": true
      },
      {
        "input": "qiejxqjaqii",
        "expectedOutput": "11",
        "isHidden": true
      },
      {
        "input": "abcdefghijklmnopqrstuvwxyz",
        "expectedOutput": "1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1",
        "isHidden": true
      }
    ],
    "objective": "Disjointly partition a sequence such that distinct character alphabets are self-contained.",
    "conceptualExplanation": [
      "Step 1: Map each character to its last index in string s.",
      "Step 2: Maintain start = 0, end = 0, and result array.",
      "Step 3: Loop i from 0 to length - 1: update end = max(end, last[s[i]]).",
      "Step 4: If i == end: push (end - start + 1) to result; start = i + 1.",
      "Step 5: Output result joined by spaces."
    ]
  },
  {
    "id": "ch_climbing_stairs",
    "title": "Climbing Stairs Ways",
    "difficulty": "Easy",
    "category": "Dynamic Programming",
    "description": "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
    "inputFormat": "A single line containing the integer n.",
    "outputFormat": "A single integer: number of distinct ways.",
    "constraints": [
      "1 <= n <= 45"
    ],
    "examples": [
      {
        "input": "2",
        "output": "2",
        "explanation": "1 step + 1 step, or 2 steps."
      },
      {
        "input": "3",
        "output": "3",
        "explanation": "1+1+1, 1+2, or 2+1."
      }
    ],
    "hints": [
      "To reach step n, you can arrive from step n - 1 (1 step jump) or from step n - 2 (2 step jump).",
      "Recurrence relation: ways(n) = ways(n - 1) + ways(n - 2).",
      "This is identical to Fibonacci sequence with base cases ways(1) = 1, ways(2) = 2."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "3",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "4",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "5",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "6",
        "expectedOutput": "13",
        "isHidden": true
      },
      {
        "input": "7",
        "expectedOutput": "21",
        "isHidden": true
      },
      {
        "input": "8",
        "expectedOutput": "34",
        "isHidden": true
      },
      {
        "input": "10",
        "expectedOutput": "89",
        "isHidden": true
      },
      {
        "input": "15",
        "expectedOutput": "987",
        "isHidden": true
      }
    ],
    "objective": "Compute combination counts for multi-step transitions using state recurrence.",
    "conceptualExplanation": [
      "Step 1: Read step count n.",
      "Step 2: Base cases: if n <= 2, return n.",
      "Step 3: Initialize a = 1, b = 2.",
      "Step 4: Loop from 3 to n: c = a + b, a = b, b = c.",
      "Step 5: Output b."
    ]
  },
  {
    "id": "ch_coin_change",
    "title": "Coin Change Minimum Coins",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    "inputFormat": "Line 1: Space-separated integers representing coin denominations.\nLine 2: Integer amount.",
    "outputFormat": "A single integer: minimum number of coins, or -1.",
    "constraints": [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4"
    ],
    "examples": [
      {
        "input": "1 2 5\n11",
        "output": "3",
        "explanation": "11 = 5 + 5 + 1 (3 coins)."
      },
      {
        "input": "2\n3",
        "output": "-1",
        "explanation": "Amount 3 cannot be formed using only coin of 2."
      },
      {
        "input": "1\n0",
        "output": "0",
        "explanation": "0 coins needed for amount 0."
      }
    ],
    "hints": [
      "Use bottom-up DP where dp[i] is the minimum coins needed for amount i.",
      "Initialize dp array with Infinity, and dp[0] = 0.",
      "For each coin c, for each i from c to amount: dp[i] = min(dp[i], dp[i - c] + 1)."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 5\n11",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "2\n3",
        "expectedOutput": "-1",
        "isHidden": false
      },
      {
        "input": "1\n0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1\n1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1\n2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "2 5 10 1\n27",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "186 419 83 408\n6249",
        "expectedOutput": "20",
        "isHidden": true
      },
      {
        "input": "3 7 405 436\n8839",
        "expectedOutput": "25",
        "isHidden": true
      },
      {
        "input": "2 4\n7",
        "expectedOutput": "-1",
        "isHidden": true
      },
      {
        "input": "1 5 10 25\n30",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Solve unbounded knapsack variation to compute optimal coin combination.",
    "conceptualExplanation": [
      "Step 1: Read coins array and amount.",
      "Step 2: Allocate dp array of size amount + 1 filled with Infinity, dp[0] = 0.",
      "Step 3: For coin in coins: loop i from coin to amount: dp[i] = min(dp[i], dp[i - coin] + 1).",
      "Step 4: If dp[amount] is Infinity, return -1.",
      "Step 5: Output dp[amount]."
    ]
  },
  {
    "id": "ch_longest_increasing_subseq",
    "title": "Longest Increasing Subsequence",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\nA subsequence is an array that can be derived from another array by deleting some or no elements without changing the order of the remaining elements.",
    "inputFormat": "A single line containing space-separated integers.",
    "outputFormat": "A single integer: length of the LIS.",
    "constraints": [
      "1 <= nums.length <= 2500",
      "-10^4 <= nums[i] <= 10^4"
    ],
    "examples": [
      {
        "input": "10 9 2 5 3 7 101 18",
        "output": "4",
        "explanation": "The longest increasing subsequence is [2, 3, 7, 101], therefore the length is 4."
      },
      {
        "input": "0 1 0 3 2 3",
        "output": "4",
        "explanation": "The LIS is [0, 1, 2, 3] with length 4."
      },
      {
        "input": "7 7 7 7 7 7 7",
        "output": "1",
        "explanation": "Strictly increasing requires strictly greater elements."
      }
    ],
    "hints": [
      "Dynamic programming solution: dp[i] is the length of the LIS ending at index i, computed in O(n^2).",
      "Patience sorting algorithm with binary search achieves O(n log n) by maintaining the smallest tail elements of all increasing subsequences of various lengths."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "10 9 2 5 3 7 101 18",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "0 1 0 3 2 3",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "7 7 7 7 7 7 7",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 3 6 7 9 4 10 5 6",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "4 10 4 3 8 9",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "5 4 3 2 1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3 5 6 2 5 4 19 5 6 7 12",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "2 2",
        "expectedOutput": "1",
        "isHidden": true
      }
    ],
    "objective": "Identify the maximum monotone ascending sequence length in an unsorted array.",
    "conceptualExplanation": [
      "Step 1: Read array nums.",
      "Step 2: Maintain tails array.",
      "Step 3: For each x in nums, binary search for x in tails.",
      "Step 4: If x is greater than all elements, tails.push(x); else replace the element at the insertion point with x.",
      "Step 5: Output tails.length."
    ]
  },
  {
    "id": "ch_house_robber",
    "title": "House Robber Maximum Loot",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.\n\nGiven an integer array `nums` representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.",
    "inputFormat": "A single line containing space-separated integers representing money in each house.",
    "outputFormat": "A single integer: maximum loot.",
    "constraints": [
      "1 <= nums.length <= 100",
      "0 <= nums[i] <= 400"
    ],
    "examples": [
      {
        "input": "1 2 3 1",
        "output": "4",
        "explanation": "Rob house 1 (money = 1) and then rob house 3 (money = 3). Total amount you can rob = 1 + 3 = 4."
      },
      {
        "input": "2 7 9 3 1",
        "output": "12",
        "explanation": "Rob house 1 (2), house 3 (9) and house 5 (1). Total loot = 2 + 9 + 1 = 12."
      }
    ],
    "hints": [
      "At house i, you have two choices: rob house i (gaining nums[i] + max loot up to i - 2), or skip house i (keeping max loot up to i - 1).",
      "Recurrence: `dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])`.",
      "Optimize space to O(1) by maintaining two variables for the previous two houses."
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 1",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "2 7 9 3 1",
        "expectedOutput": "12",
        "isHidden": false
      },
      {
        "input": "2 1 1 2",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "10",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "1 2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "2 1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "5 1 2 10 6 2",
        "expectedOutput": "17",
        "isHidden": true
      },
      {
        "input": "1 3 1 3 100",
        "expectedOutput": "103",
        "isHidden": true
      },
      {
        "input": "183 219 57 193 94 233 202 154 65 240 97 234 100 249 186 66 90 238 168 128",
        "expectedOutput": "1954",
        "isHidden": true
      }
    ],
    "objective": "Optimize non-adjacent sequential selection to maximize aggregate reward.",
    "conceptualExplanation": [
      "Step 1: Read house values.",
      "Step 2: Base cases: n == 0 -> 0, n == 1 -> nums[0].",
      "Step 3: Maintain prev2 = 0, prev1 = nums[0].",
      "Step 4: For i from 1 to n - 1: cur = max(prev1, prev2 + nums[i]); prev2 = prev1; prev1 = cur.",
      "Step 5: Output prev1."
    ]
  },
  {
    "id": "ch_single_num",
    "title": "Single Number",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with a linear runtime complexity and use only constant extra space.",
    "constraints": [
      "1 <= nums.length <= 3 * 10^4",
      "-3 * 10^4 <= nums[i] <= 3 * 10^4",
      "Each element appears twice except one."
    ],
    "inputFormat": "Line 1: A space-separated list of integers",
    "outputFormat": "A single integer representing the unique element",
    "hints": [
      "If we take XOR of zero and some bit, it will return that bit: a ^ 0 = a",
      "If we take XOR of two same bits, it will return 0: a ^ a = 0",
      "XOR all elements together; duplicate numbers cancel out."
    ],
    "examples": [
      {
        "input": "2 2 1",
        "output": "1",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "4 1 2 1 2",
        "output": "4",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 2 1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "4 1 2 1 2",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "7 3 5 3 7",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "99 45 45 10 10",
        "expectedOutput": "99",
        "isHidden": true
      },
      {
        "input": "-1 -1 -2",
        "expectedOutput": "-2",
        "isHidden": true
      },
      {
        "input": "100 200 300 200 100",
        "expectedOutput": "300",
        "isHidden": true
      },
      {
        "input": "0 5 0",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "8 9 10 11 8 9 10",
        "expectedOutput": "11",
        "isHidden": true
      },
      {
        "input": "-42 15 15 -42 77",
        "expectedOutput": "77",
        "isHidden": true
      }
    ],
    "objective": "Find the single element in an array where every other element appears twice.",
    "conceptualExplanation": [
      "Initialize result = 0.",
      "XOR each number in the array into result.",
      "Duplicates cancel to 0, leaving only the unique number."
    ]
  },
  {
    "id": "ch_counting_bits",
    "title": "Counting Bits",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Given an integer `n`, return an array `ans` of length `n + 1` such that for each `i` (`0 <= i <= n`), `ans[i]` is the number of 1's in the binary representation of `i`.",
    "constraints": [
      "0 <= n <= 10^5"
    ],
    "inputFormat": "Line 1: An integer n",
    "outputFormat": "Space-separated integers representing the count of 1s from 0 to n",
    "hints": [
      "Notice relation between i and i / 2: ans[i] = ans[i >> 1] + (i & 1)",
      "Use dynamic programming using already computed values.",
      "O(n) time and O(n) space."
    ],
    "examples": [
      {
        "input": "2",
        "output": "0 1 1",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "5",
        "output": "0 1 1 2 1 2",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2",
        "expectedOutput": "0 1 1",
        "isHidden": false
      },
      {
        "input": "5",
        "expectedOutput": "0 1 1 2 1 2",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "0 1",
        "isHidden": true
      },
      {
        "input": "7",
        "expectedOutput": "0 1 1 2 1 2 2 3",
        "isHidden": true
      },
      {
        "input": "10",
        "expectedOutput": "0 1 1 2 1 2 2 3 1 2 2",
        "isHidden": true
      },
      {
        "input": "15",
        "expectedOutput": "0 1 1 2 1 2 2 3 1 2 2 3 2 3 3 4",
        "isHidden": true
      },
      {
        "input": "16",
        "expectedOutput": "0 1 1 2 1 2 2 3 1 2 2 3 2 3 3 4 1",
        "isHidden": true
      },
      {
        "input": "20",
        "expectedOutput": "0 1 1 2 1 2 2 3 1 2 2 3 2 3 3 4 1 2 2 3 2",
        "isHidden": true
      },
      {
        "input": "31",
        "expectedOutput": "0 1 1 2 1 2 2 3 1 2 2 3 2 3 3 4 1 2 2 3 2 3 3 4 2 3 3 4 3 4 4 5",
        "isHidden": true
      }
    ],
    "objective": "Compute the number of set bits for all numbers from 0 up to n.",
    "conceptualExplanation": [
      "ans[0] = 0.",
      "For i from 1 to n: ans[i] = ans[i >> 1] + (i & 1).",
      "Print ans joined by spaces."
    ]
  },
  {
    "id": "ch_hamming_dist",
    "title": "Hamming Distance",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "The Hamming distance between two integers is the number of positions at which the corresponding bits are different.\n\nGiven two integers `x` and `y`, return the Hamming distance between them.",
    "constraints": [
      "0 <= x, y <= 2^31 - 1"
    ],
    "inputFormat": "Line 1: Two space-separated integers x and y",
    "outputFormat": "A single integer representing the Hamming distance",
    "hints": [
      "Compute x ^ y to get 1 at positions where bits differ.",
      "Count the number of 1 bits in the XOR result (Brian Kernighan's algorithm or shift).",
      "n & (n - 1) clears the lowest set bit."
    ],
    "examples": [
      {
        "input": "1 4",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "3 1",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 4",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "3 1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "0 0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "93 73",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "100 200",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "2147483647 0",
        "expectedOutput": "31",
        "isHidden": true
      },
      {
        "input": "15 0",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "255 128",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "1024 1",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Count the number of differing bit positions between two integers.",
    "conceptualExplanation": [
      "Compute xor = x ^ y.",
      "Count set bits using Brian Kernighan: while xor > 0: xor &= (xor - 1); count++.",
      "Output count."
    ]
  },
  {
    "id": "ch_reverse_bits",
    "title": "Reverse Bits",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Reverse bits of a given 32-bit unsigned integer.",
    "constraints": [
      "0 <= n <= 4294967295"
    ],
    "inputFormat": "Line 1: A 32-bit unsigned integer in decimal",
    "outputFormat": "The resulting reversed integer in decimal",
    "hints": [
      "Iterate 32 times.",
      "Shift the result left by 1 and add the least significant bit of n.",
      "Shift n right by 1 using unsigned shift (>>> 1)."
    ],
    "examples": [
      {
        "input": "43261596",
        "output": "964176192",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "4294967293",
        "output": "3221225471",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "43261596",
        "expectedOutput": "964176192",
        "isHidden": false
      },
      {
        "input": "4294967293",
        "expectedOutput": "3221225471",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "2147483648",
        "isHidden": false
      },
      {
        "input": "2147483648",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "15",
        "expectedOutput": "4026531840",
        "isHidden": true
      },
      {
        "input": "1073741824",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3",
        "expectedOutput": "3221225472",
        "isHidden": true
      },
      {
        "input": "255",
        "expectedOutput": "4278190080",
        "isHidden": true
      },
      {
        "input": "16777216",
        "expectedOutput": "128",
        "isHidden": true
      }
    ],
    "objective": "Reverse the 32 bits of an unsigned integer and return the decimal representation.",
    "conceptualExplanation": [
      "Initialize rev = 0.",
      "Loop 32 times: rev = (rev << 1) | (n & 1); n = n >>> 1.",
      "Return rev >>> 0."
    ]
  },
  {
    "id": "ch_power_of_four",
    "title": "Power of Four Verification",
    "difficulty": "Easy",
    "category": "Bit Manipulation",
    "description": "Given an integer `n`, return `true` if it is a power of four. Otherwise, return `false`.\n\nAn integer `n` is a power of four if there exists an integer `x` such that `n == 4^x`.",
    "constraints": [
      "-2^31 <= n <= 2^31 - 1"
    ],
    "inputFormat": "Line 1: An integer n",
    "outputFormat": "true or false",
    "hints": [
      "Must be positive.",
      "Must be a power of two: (n & (n - 1)) == 0.",
      "The single 1 bit must be at an odd position: (n & 0x55555555) != 0."
    ],
    "examples": [
      {
        "input": "16",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "5",
        "output": "false",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "16",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "5",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "-64",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "64",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "256",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "8",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "1024",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "2",
        "expectedOutput": "false",
        "isHidden": true
      }
    ],
    "objective": "Determine if an integer is a positive power of four.",
    "conceptualExplanation": [
      "Check n > 0.",
      "Check (n & (n - 1)) === 0 (power of 2).",
      "Check (n & 0x55555555) !== 0 to verify power of 4."
    ]
  },
  {
    "id": "ch_bitwise_and_range",
    "title": "Bitwise AND of Numbers Range",
    "difficulty": "Medium",
    "category": "Bit Manipulation",
    "description": "Given two integers `left` and `right` that represent the range `[left, right]`, return the bitwise AND of all numbers in this range, inclusive.",
    "constraints": [
      "0 <= left <= right <= 2^31 - 1"
    ],
    "inputFormat": "Line 1: Two space-separated integers left and right",
    "outputFormat": "A single integer representing bitwise AND of range",
    "hints": [
      "The bitwise AND of range [left, right] keeps only common prefix of binary representations of left and right.",
      "Shift both right until they are equal, counting shifts.",
      "Shift back left by shift count."
    ],
    "examples": [
      {
        "input": "5 7",
        "output": "4",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "0 0",
        "output": "0",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "5 7",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "0 0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 2147483647",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "6 7",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "9 12",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "16 31",
        "expectedOutput": "16",
        "isHidden": true
      },
      {
        "input": "10 15",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "0 1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "12 12",
        "expectedOutput": "12",
        "isHidden": true
      },
      {
        "input": "26 30",
        "expectedOutput": "24",
        "isHidden": true
      }
    ],
    "objective": "Find the common binary prefix between left and right bounds.",
    "conceptualExplanation": [
      "Count shifts while left < right: left >>= 1, right >>= 1, shift++.",
      "Result = left << shift."
    ]
  },
  {
    "id": "ch_sum_two_integers",
    "title": "Sum of Two Integers Without Plus Minus",
    "difficulty": "Medium",
    "category": "Bit Manipulation",
    "description": "Given two integers `a` and `b`, return the sum of the two integers without using the operators `+` and `-`.",
    "constraints": [
      "-1000 <= a, b <= 1000"
    ],
    "inputFormat": "Line 1: Two space-separated integers a and b",
    "outputFormat": "The sum as an integer",
    "hints": [
      "XOR (a ^ b) performs addition without carry.",
      "AND ((a & b) << 1) finds carry.",
      "Repeat until carry is zero."
    ],
    "examples": [
      {
        "input": "1 2",
        "output": "3",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2 3",
        "output": "5",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "2 3",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "-1 1",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "-5 -7",
        "expectedOutput": "-12",
        "isHidden": true
      },
      {
        "input": "10 -3",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "0 0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "100 250",
        "expectedOutput": "350",
        "isHidden": true
      },
      {
        "input": "-50 20",
        "expectedOutput": "-30",
        "isHidden": true
      },
      {
        "input": "42 -42",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "-15 -15",
        "expectedOutput": "-30",
        "isHidden": true
      }
    ],
    "objective": "Add two integers using half-adder bitwise simulation.",
    "conceptualExplanation": [
      "While b !== 0: carry = (a & b) << 1; a = a ^ b; b = carry.",
      "Return a."
    ]
  },
  {
    "id": "ch_valid_pal_ii",
    "title": "Valid Palindrome II",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "Given a string `s`, return `true` if the `s` can be palindrome after deleting at most one character from it.",
    "constraints": [
      "1 <= s.length <= 10^5",
      "s consists of lowercase English letters."
    ],
    "inputFormat": "Line 1: A string s",
    "outputFormat": "true or false",
    "hints": [
      "Use standard two pointers left and right.",
      "When s[left] !== s[right], check if s[left+1..right] is palindrome or s[left..right-1] is palindrome.",
      "If either is palindrome, return true."
    ],
    "examples": [
      {
        "input": "aba",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "abca",
        "output": "true",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "aba",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "abca",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "abc",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "raceacar",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "deeee",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "tebbem",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "acxcyba",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "a",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "ab",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "aguokepatgbnvfqmgmlcupuufxoohdfpgjdmysgvhmvffcnqxjjxqncffvmhvgsymdjgpfdhooxfuupuculmgmqfvnbgtapekouga",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Determine if a string can become a palindrome by removing at most one character.",
    "conceptualExplanation": [
      "Pointers at start and end.",
      "When mismatch occurs at (i, j), check if substring(i+1, j) or substring(i, j-1) is palindrome.",
      "If match throughout, return true."
    ]
  },
  {
    "id": "ch_two_sum_sorted",
    "title": "Two Sum II Sorted Array",
    "difficulty": "Medium",
    "category": "Two Pointers",
    "description": "Given a 1-indexed array of integers `numbers` that is already sorted in non-decreasing order, find two numbers such that they add up to a specific `target` number.\n\nReturn the indices of the two numbers, `index1` and `index2`, added by one as an integer array `[index1, index2]` of length 2.",
    "constraints": [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "Exactly one solution exists."
    ],
    "inputFormat": "Line 1: The integer target\nLine 2: Space-separated sorted integers",
    "outputFormat": "Two space-separated 1-based indices",
    "hints": [
      "Since array is sorted, start two pointers at beginning and end.",
      "If sum == target, found.",
      "If sum < target, left++; if sum > target, right--."
    ],
    "examples": [
      {
        "input": "9\n2 7 11 15",
        "output": "1 2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "6\n2 3 4",
        "output": "1 3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "9\n2 7 11 15",
        "expectedOutput": "1 2",
        "isHidden": false
      },
      {
        "input": "6\n2 3 4",
        "expectedOutput": "1 3",
        "isHidden": false
      },
      {
        "input": "-1\n-1 0",
        "expectedOutput": "1 2",
        "isHidden": false
      },
      {
        "input": "10\n1 2 3 4 4 9 56 90",
        "expectedOutput": "1 6",
        "isHidden": true
      },
      {
        "input": "0\n-3 3",
        "expectedOutput": "1 2",
        "isHidden": true
      },
      {
        "input": "100\n5 25 75",
        "expectedOutput": "2 3",
        "isHidden": true
      },
      {
        "input": "8\n1 2 3 4 5 6 7",
        "expectedOutput": "1 7",
        "isHidden": true
      },
      {
        "input": "-10\n-15 -10 -5 -2 0 5",
        "expectedOutput": "1 6",
        "isHidden": true
      },
      {
        "input": "14\n1 3 5 7 9 11",
        "expectedOutput": "2 6",
        "isHidden": true
      },
      {
        "input": "50\n10 20 30 40 50",
        "expectedOutput": "1 4",
        "isHidden": true
      }
    ],
    "objective": "Find two 1-based indices whose elements sum to target in a sorted array.",
    "conceptualExplanation": [
      "Left at 0, right at n - 1.",
      "Compute sum = nums[left] + nums[right].",
      "Adjust pointers according to comparison with target."
    ]
  },
  {
    "id": "ch_reverse_vowels",
    "title": "Reverse Vowels of a String",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "Given a string `s`, reverse only all the vowels in the string and return it.\n\nThe vowels are 'a', 'e', 'i', 'o', and 'u', and they can appear in both lower and upper cases, more than once.",
    "constraints": [
      "1 <= s.length <= 3 * 10^5",
      "s consist of printable ASCII characters."
    ],
    "inputFormat": "Line 1: A string s",
    "outputFormat": "The string with vowels reversed",
    "hints": [
      "Use two pointers at start and end.",
      "Advance left until vowel, decrease right until vowel.",
      "Swap vowels and move inward."
    ],
    "examples": [
      {
        "input": "IceCreAm",
        "output": "AceCreIm",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "leetcode",
        "output": "leotcede",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "IceCreAm",
        "expectedOutput": "AceCreIm",
        "isHidden": false
      },
      {
        "input": "leetcode",
        "expectedOutput": "leotcede",
        "isHidden": false
      },
      {
        "input": "hello",
        "expectedOutput": "holle",
        "isHidden": false
      },
      {
        "input": "aA",
        "expectedOutput": "Aa",
        "isHidden": true
      },
      {
        "input": "rhythm",
        "expectedOutput": "rhythm",
        "isHidden": true
      },
      {
        "input": "DesignPattern",
        "expectedOutput": "DesagnPittern",
        "isHidden": true
      },
      {
        "input": "MasteryZone",
        "expectedOutput": "MestoryZena",
        "isHidden": true
      },
      {
        "input": "Algorithm",
        "expectedOutput": "ilgorAthm",
        "isHidden": true
      },
      {
        "input": "AEIOU",
        "expectedOutput": "UOIEA",
        "isHidden": true
      },
      {
        "input": "programming",
        "expectedOutput": "prigrammong",
        "isHidden": true
      }
    ],
    "objective": "Reverse the positions of all vowels in a string while preserving other characters.",
    "conceptualExplanation": [
      "Set of vowels = {a, e, i, o, u, A, E, I, O, U}.",
      "Scan inward with two pointers until both find vowels, swap them, repeat."
    ]
  },
  {
    "id": "ch_remove_duplicates_sorted",
    "title": "Remove Duplicates from Sorted Array",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "Given an integer array `nums` sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once.\n\nReturn the number of unique elements `k`.",
    "constraints": [
      "1 <= nums.length <= 3 * 10^4",
      "-100 <= nums[i] <= 100",
      "nums is sorted."
    ],
    "inputFormat": "Line 1: Space-separated sorted integers",
    "outputFormat": "An integer representing the count of unique elements",
    "hints": [
      "Use slow pointer write_idx.",
      "When nums[fast] !== nums[write_idx], advance write_idx and copy nums[fast].",
      "Return write_idx + 1."
    ],
    "examples": [
      {
        "input": "1 1 2",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "0 0 1 1 1 2 2 3 3 4",
        "output": "5",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 1 2",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "0 0 1 1 1 2 2 3 3 4",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "5 5 5 5 5",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "-3 -3 -2 -1 -1 0 0",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "10 20 20 30 30 40 50",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "0 0 0",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "-10 -10 -9 -8 -8 -7",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "1 1 1 2 2 2 3 3 3",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Calculate the number of unique elements in a non-decreasing sorted array.",
    "conceptualExplanation": [
      "Slow pointer tracks unique elements.",
      "Fast pointer scans through array.",
      "Return count of unique items."
    ]
  },
  {
    "id": "ch_is_subsequence",
    "title": "Is Subsequence",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "Given two strings `s` and `t`, return `true` if `s` is a subsequence of `t`, or `false` otherwise.\n\nA subsequence of a string is a new string that is formed from the original string by deleting some (can be none) of the characters without disturbing the relative positions of the remaining characters.",
    "constraints": [
      "0 <= s.length <= 100",
      "0 <= t.length <= 10^4",
      "s and t consist only of lowercase English letters."
    ],
    "inputFormat": "Line 1: String s\nLine 2: String t",
    "outputFormat": "true or false",
    "hints": [
      "Use two pointers, one for s and one for t.",
      "Whenever s[i] == t[j], advance i.",
      "Advance j at every step. If i == s.length, return true."
    ],
    "examples": [
      {
        "input": "abc\nahbgdc",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "axc\nahbgdc",
        "output": "false",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "abc\nahbgdc",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "axc\nahbgdc",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "ace\nabcde",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "met\nmastery",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "code\nleetcode",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "a\nb",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "zone\nmasteryzone",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "hello\nworld",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "sub\nsubsequence",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "algo\nalgorithm",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Determine if string s is a subsequence of string t.",
    "conceptualExplanation": [
      "Track index i in s and j in t.",
      "Iterate j across t. If s[i] matches t[j], increment i.",
      "If i reaches s.length, return true."
    ]
  },
  {
    "id": "ch_backspace_compare",
    "title": "Backspace String Compare",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "Given two strings `s` and `t`, return `true` if they are equal when both are typed into empty text editors. `'#'` means a backspace character.\n\nNote that after backspacing an empty text, the text will continue empty.",
    "constraints": [
      "1 <= s.length, t.length <= 200",
      "s and t only contain lowercase letters and '#' characters."
    ],
    "inputFormat": "Line 1: String s\nLine 2: String t",
    "outputFormat": "true or false",
    "hints": [
      "Can simulate using a stack or iterate backwards with two pointers.",
      "Traversing backwards, count '#' to skip characters.",
      "Compare active characters."
    ],
    "examples": [
      {
        "input": "ab#c\nad#c",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "ab##\nc#d#",
        "output": "true",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "ab#c\nad#c",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "ab##\nc#d#",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "a#c\nb",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "a##c\n#a#c",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "xywrrmp\nxywrrmu#p",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "bxj##tw\nbxj###tw",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "y#fo##f\ny#f#o##f",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "abc###\n#",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "apple\napple",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "xyz##a\nxa",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Determine if two typed strings with backspace symbols produce identical output.",
    "conceptualExplanation": [
      "Simulate typed string: append chars, pop on '#'.",
      "Compare results for s and t."
    ]
  },
  {
    "id": "ch_squares_sorted_array",
    "title": "Squares of a Sorted Array",
    "difficulty": "Easy",
    "category": "Two Pointers",
    "description": "Given an integer array `nums` sorted in non-decreasing order, return an array of the squares of each number sorted in non-decreasing order.",
    "constraints": [
      "1 <= nums.length <= 10^4",
      "-10^4 <= nums[i] <= 10^4",
      "nums is sorted in non-decreasing order."
    ],
    "inputFormat": "Line 1: Space-separated integers",
    "outputFormat": "Space-separated sorted squares",
    "hints": [
      "Since negatives become positive when squared, largest squares are at ends of array.",
      "Use two pointers from left and right.",
      "Fill result array from back."
    ],
    "examples": [
      {
        "input": "-4 -1 0 3 10",
        "output": "0 1 9 16 100",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "-7 -3 2 3 11",
        "output": "4 9 9 49 121",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "-4 -1 0 3 10",
        "expectedOutput": "0 1 9 16 100",
        "isHidden": false
      },
      {
        "input": "-7 -3 2 3 11",
        "expectedOutput": "4 9 9 49 121",
        "isHidden": false
      },
      {
        "input": "-5 -4 -3 -2 -1",
        "expectedOutput": "1 4 9 16 25",
        "isHidden": false
      },
      {
        "input": "0 1 2 3 4",
        "expectedOutput": "0 1 4 9 16",
        "isHidden": true
      },
      {
        "input": "-10 0 10",
        "expectedOutput": "0 100 100",
        "isHidden": true
      },
      {
        "input": "5",
        "expectedOutput": "25",
        "isHidden": true
      },
      {
        "input": "-3",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "-2 -2 2 2",
        "expectedOutput": "4 4 4 4",
        "isHidden": true
      },
      {
        "input": "-100 -50 0 50 100",
        "expectedOutput": "0 2500 2500 10000 10000",
        "isHidden": true
      },
      {
        "input": "-6 -4 -2 0 1 3 5",
        "expectedOutput": "0 1 4 9 16 25 36",
        "isHidden": true
      }
    ],
    "objective": "Square elements of a sorted array and return them in non-decreasing order in O(n).",
    "conceptualExplanation": [
      "Two pointers l = 0, r = n - 1.",
      "Compare nums[l]^2 and nums[r]^2, place larger at end of result, advance corresponding pointer."
    ]
  },
  {
    "id": "ch_min_size_subarray",
    "title": "Minimum Size Subarray Sum",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "Given an array of positive integers `nums` and a positive integer `target`, return the minimal length of a subarray whose sum is greater than or equal to `target`. If there is no such subarray, return 0 instead.",
    "constraints": [
      "1 <= target <= 10^9",
      "1 <= nums.length <= 10^5",
      "1 <= nums[i] <= 10^4"
    ],
    "inputFormat": "Line 1: An integer target\nLine 2: Space-separated integers",
    "outputFormat": "Minimal length as integer, or 0",
    "hints": [
      "Use a sliding window with left and right pointers.",
      "Expand right and add to running sum.",
      "While sum >= target, update minLen and shrink from left."
    ],
    "examples": [
      {
        "input": "7\n2 3 1 2 4 3",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "4\n1 4 4",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "7\n2 3 1 2 4 3",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "4\n1 4 4",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "11\n1 1 1 1 1 1 1 1",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "15\n1 2 3 4 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "100\n10 20 30 40 50",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "5\n2 3 1 1 1 1 1",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "20\n5 1 3 5 10 7 4 9 2 8",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1\n1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "80\n10 30 20 40 50",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3\n1 1",
        "expectedOutput": "0",
        "isHidden": true
      }
    ],
    "objective": "Find the minimal length of contiguous subarray with sum at least target.",
    "conceptualExplanation": [
      "Sliding window with left pointer and right pointer.",
      "Add nums[right] to sum. While sum >= target: minLen = min(minLen, right - left + 1); sum -= nums[left++];",
      "Return minLen or 0."
    ]
  },
  {
    "id": "ch_fruit_into_baskets",
    "title": "Fruit Into Baskets",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "You are visiting a farm that has a single row of fruit trees arranged from left to right. You are given an integer array `fruits` where `fruits[i]` is the type of fruit the `i-th` tree produces.\n\nYou have two baskets, and each basket can only hold a single type of fruit. Return the maximum number of fruits you can pick.",
    "constraints": [
      "1 <= fruits.length <= 10^5",
      "0 <= fruits[i] < fruits.length"
    ],
    "inputFormat": "Line 1: Space-separated integers representing fruit types",
    "outputFormat": "Maximum number of fruits picked",
    "hints": [
      "This problem is equivalent to finding the longest subarray with at most 2 distinct integers.",
      "Use sliding window and a frequency map.",
      "When distinct elements exceed 2, shrink window from left."
    ],
    "examples": [
      {
        "input": "1 2 1",
        "output": "3",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "0 1 2 2",
        "output": "3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 1",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "0 1 2 2",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1 2 3 2 2",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "3 3 3 1 2 1 1 2 3 3 4",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1 1 1 1 1",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "1 2 1 3 4 3 5 1 2",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "0 1 6 6 4 4 6",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "4 1 1 1 3 1 7 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "1 0 1 4 1 4 1 2 3",
        "expectedOutput": "5",
        "isHidden": true
      }
    ],
    "objective": "Find the longest contiguous subarray with at most 2 distinct integers.",
    "conceptualExplanation": [
      "Map stores counts of fruit types in window.",
      "Expand right; if map.size > 2, decrease left count and delete if 0.",
      "maxFruit = max(maxFruit, right - left + 1)."
    ]
  },
  {
    "id": "ch_longest_ones_flip",
    "title": "Max Consecutive Ones III",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "Given a binary array `nums` and an integer `k`, return the maximum number of consecutive `1`'s in the array if you can flip at most `k` `0`'s.",
    "constraints": [
      "1 <= nums.length <= 10^5",
      "nums[i] is either 0 or 1.",
      "0 <= k <= nums.length"
    ],
    "inputFormat": "Line 1: An integer k\nLine 2: Space-separated binary digits (0 or 1)",
    "outputFormat": "Maximum number of consecutive 1s",
    "hints": [
      "Find longest subarray with at most k zeros.",
      "Expand right pointer and increment zeroCount when nums[right] == 0.",
      "While zeroCount > k, shrink from left."
    ],
    "examples": [
      {
        "input": "2\n1 1 1 0 0 0 1 1 1 1 0",
        "output": "6",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "3\n0 0 1 1 0 0 1 1 1 0 1 1 0 0 0 1 1 1 1",
        "output": "10",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2\n1 1 1 0 0 0 1 1 1 1 0",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "3\n0 0 1 1 0 0 1 1 1 0 1 1 0 0 0 1 1 1 1",
        "expectedOutput": "10",
        "isHidden": false
      },
      {
        "input": "0\n1 1 1 0 1 1",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1\n0 0 0 0",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "5\n1 1 1 1 1",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "1\n1 0 1 0 1 0 1",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "2\n1 0 0 0 1 1 0 0 1 1 1",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "0\n0 0 0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "2\n0 0 1 1 1 1 1 1 0 0",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "4\n1 0 1 0 1 0 1 0 1",
        "expectedOutput": "9",
        "isHidden": true
      }
    ],
    "objective": "Find the longest window containing at most k zeros.",
    "conceptualExplanation": [
      "Maintain zeroCount in sliding window.",
      "Increment zeroCount when nums[r] == 0. While zeroCount > k, if nums[l] == 0 zeroCount--, l++.",
      "Result = max(r - l + 1)."
    ]
  },
  {
    "id": "ch_sub_k_distinct",
    "title": "Subarrays with At Most K Different Integers",
    "difficulty": "Hard",
    "category": "Sliding Window",
    "description": "Given an integer array `nums` and an integer `k`, return the number of good subarrays of `nums` that contain at most `k` different integers.",
    "constraints": [
      "1 <= nums.length <= 2 * 10^4",
      "1 <= nums[i], k <= nums.length"
    ],
    "inputFormat": "Line 1: An integer k\nLine 2: Space-separated integers",
    "outputFormat": "Number of subarrays with at most k distinct integers",
    "hints": [
      "For any window [l, r] with at most k distinct elements, all subarrays ending at r starting from l to r are valid.",
      "Count of valid subarrays ending at r is (r - l + 1).",
      "Sum this over all r."
    ],
    "examples": [
      {
        "input": "2\n1 2 1 2 3",
        "output": "12",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "3\n1 2 1 3 4",
        "output": "13",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2\n1 2 1 2 3",
        "expectedOutput": "12",
        "isHidden": false
      },
      {
        "input": "3\n1 2 1 3 4",
        "expectedOutput": "13",
        "isHidden": false
      },
      {
        "input": "1\n1 2 1 2 1",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "2\n1 1 1 1",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "1\n5",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2\n2 1 1 1 2",
        "expectedOutput": "15",
        "isHidden": true
      },
      {
        "input": "3\n1 2 3 4 5",
        "expectedOutput": "12",
        "isHidden": true
      },
      {
        "input": "2\n1 2 3 1 2 3",
        "expectedOutput": "11",
        "isHidden": true
      },
      {
        "input": "4\n1 2 3 4 1 2",
        "expectedOutput": "21",
        "isHidden": true
      },
      {
        "input": "1\n1 2 3 4",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Count contiguous subarrays with at most k distinct integers.",
    "conceptualExplanation": [
      "Use frequency map for distinct count.",
      "Shrink window from left whenever map.size > k.",
      "Add (r - l + 1) to total count."
    ]
  },
  {
    "id": "ch_permutation_in_string",
    "title": "Permutation in String",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "Given two strings `s1` and `s2`, return `true` if `s2` contains a permutation of `s1`, or `false` otherwise.\n\nIn other words, return true if one of `s1`'s permutations is the substring of `s2`.",
    "constraints": [
      "1 <= s1.length, s2.length <= 10^4",
      "s1 and s2 consist of lowercase English letters."
    ],
    "inputFormat": "Line 1: String s1\nLine 2: String s2",
    "outputFormat": "true or false",
    "hints": [
      "The permutation of s1 must have the exact same length as s1.",
      "Maintain a sliding window of length s1.length in s2.",
      "Compare frequency counts of characters in s1 and window."
    ],
    "examples": [
      {
        "input": "ab\neidbaooo",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "ab\neidboaoo",
        "output": "false",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "ab\neidbaooo",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "ab\neidboaoo",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "adc\ndcda",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "hello\nooolleoooleh",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "abc\nbbbca",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "a\na",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "xyz\nzyx",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "zone\nmasteryzonepro",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "cat\nblackcat",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "dog\ngodfather",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Check whether a substring of s2 is an anagram/permutation of s1.",
    "conceptualExplanation": [
      "Compute char counts for s1 and initial window in s2.",
      "Slide window one char at a time across s2.",
      "Return true if frequencies match at any point."
    ]
  },
  {
    "id": "ch_find_all_anagrams",
    "title": "Find All Anagrams Count",
    "difficulty": "Medium",
    "category": "Sliding Window",
    "description": "Given two strings `s` and `p`, return the number of start indices of `p`'s anagrams in `s`.\n\nAn Anagram is a word formed by rearranging the letters of a different word.",
    "constraints": [
      "1 <= s.length, p.length <= 3 * 10^4",
      "s and p consist of lowercase English letters."
    ],
    "inputFormat": "Line 1: String s\nLine 2: String p",
    "outputFormat": "An integer count of anagram occurrences",
    "hints": [
      "Fixed sliding window of size p.length.",
      "Compare frequency array of size 26.",
      "Count how many times window matches p's frequency."
    ],
    "examples": [
      {
        "input": "cbaebabacd\nabc",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "abab\nab",
        "output": "3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "cbaebabacd\nabc",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "abab\nab",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "baa\naa",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "af\nbe",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "masteryzone\nzone",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "aaaaa\na",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "abcde\nxyz",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "racecar\ncar",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "banana\nan",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "mississippi\nsi",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Count occurrences of anagrams of string p within string s.",
    "conceptualExplanation": [
      "Use fixed window of size p.length in s.",
      "Slide across s, updating 26-char counts.",
      "Increment counter on match."
    ]
  },
  {
    "id": "ch_insert_interval",
    "title": "Insert Interval",
    "difficulty": "Medium",
    "category": "Intervals",
    "description": "You are given an array of non-overlapping intervals `intervals` where `intervals[i] = [start_i, end_i]` represent the start and the end of the `i-th` interval and `intervals` is sorted in ascending order by `start_i`.\n\nYou are also given an interval `newInterval = [start, end]` that represents the start and end of another interval.\n\nInsert `newInterval` into `intervals` such that `intervals` is still sorted and non-overlapping. Return the count of intervals after merging.",
    "constraints": [
      "0 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start_i <= end_i <= 10^5"
    ],
    "inputFormat": "Line 1: An integer N representing number of existing intervals\nFollowing N lines: start end\nLast line: newIntervalStart newIntervalEnd",
    "outputFormat": "An integer representing the count of intervals after insertion and merging",
    "hints": [
      "Add all intervals that end before newInterval begins.",
      "Merge all overlapping intervals by expanding newInterval: newStart = min(start, newStart), newEnd = max(end, newEnd).",
      "Add all remaining intervals."
    ],
    "examples": [
      {
        "input": "2\n1 3\n6 9\n2 5",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8",
        "output": "3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2\n1 3\n6 9\n2 5",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "0\n5 7",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1\n1 5\n2 3",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1\n1 5\n6 8",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "2\n1 5\n6 8\n0 9",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3\n1 4\n7 9\n11 15\n5 6",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "3\n1 3\n5 7\n9 11\n0 12",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2\n3 5\n8 10\n1 2",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "4\n1 2\n3 4\n5 6\n7 8\n2 5",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Insert a new interval into sorted non-overlapping intervals and return resulting interval count.",
    "conceptualExplanation": [
      "Collect intervals ending before newInterval.",
      "Expand newInterval with any overlapping intervals.",
      "Append remaining intervals."
    ]
  },
  {
    "id": "ch_min_meeting_rooms",
    "title": "Meeting Rooms II Min Conference Rooms",
    "difficulty": "Medium",
    "category": "Intervals",
    "description": "Given an array of meeting time intervals `intervals` where `intervals[i] = [start_i, end_i]`, return the minimum number of conference rooms required.",
    "constraints": [
      "1 <= intervals.length <= 10^4",
      "0 <= start_i < end_i <= 10^6"
    ],
    "inputFormat": "Line 1: An integer N representing number of meetings\nFollowing N lines: start end",
    "outputFormat": "Minimum number of conference rooms required",
    "hints": [
      "Extract all start times and end times into separate arrays.",
      "Sort both arrays independently.",
      "Use two pointers: when start < end, room needed (+1); otherwise room freed (-1)."
    ],
    "examples": [
      {
        "input": "3\n0 30\n5 10\n15 20",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "3\n7 10\n2 4\n15 20",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3\n0 30\n5 10\n15 20",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "3\n7 10\n2 4\n15 20",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1\n1 5",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "4\n1 4\n2 5\n3 6\n4 7",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "2\n1 10\n2 9",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "5\n1 3\n2 4\n3 5\n4 6\n5 7",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3\n1 5\n5 10\n10 15",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "4\n1 2\n2 3\n3 4\n4 5",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3\n0 10\n0 10\n0 10",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "4\n5 8\n6 8\n7 8\n8 9",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Calculate peak concurrent overlapping intervals.",
    "conceptualExplanation": [
      "Separate start times and end times, sort both.",
      "Iterate with two pointers tracking simultaneous meetings.",
      "Record peak count."
    ]
  },
  {
    "id": "ch_meeting_rooms_can_attend",
    "title": "Meeting Rooms Can Attend All",
    "difficulty": "Easy",
    "category": "Intervals",
    "description": "Given an array of meeting time intervals consisting of start and end times `[[s1,e1],[s2,e2],...]`, determine if a person could attend all meetings.",
    "constraints": [
      "0 <= intervals.length <= 10^4",
      "0 <= start_i < end_i <= 10^6"
    ],
    "inputFormat": "Line 1: An integer N\nFollowing N lines: start end",
    "outputFormat": "true or false",
    "hints": [
      "Sort intervals by start time.",
      "Check if any adjacent intervals overlap (intervals[i][0] < intervals[i-1][1]).",
      "If overlap exists, return false; otherwise true."
    ],
    "examples": [
      {
        "input": "3\n0 30\n5 10\n15 20",
        "output": "false",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2\n7 10\n2 4",
        "output": "true",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3\n0 30\n5 10\n15 20",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "2\n7 10\n2 4",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "1\n0 10",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "3\n1 3\n3 5\n5 8",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "2\n1 5\n4 6",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "4\n1 2\n2 3\n3 4\n4 5",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "2\n5 10\n0 6",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "3\n10 20\n0 5\n25 30",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "2\n2 8\n1 3",
        "expectedOutput": "false",
        "isHidden": true
      }
    ],
    "objective": "Determine whether any two meetings conflict.",
    "conceptualExplanation": [
      "Sort meetings by start time.",
      "If any meeting starts before the previous one ends, return false.",
      "If no conflicts, return true."
    ]
  },
  {
    "id": "ch_interval_intersection",
    "title": "Interval List Intersections Count",
    "difficulty": "Medium",
    "category": "Intervals",
    "description": "You are given two lists of closed intervals, `firstList` and `secondList`, where `firstList[i] = [start_i, end_i]` and `secondList[j] = [start_j, end_j]`. Each list of intervals is pairwise disjoint and in sorted order.\n\nReturn the number of intersections of these two interval lists.",
    "constraints": [
      "0 <= firstList.length, secondList.length <= 1000",
      "0 <= start_i <= end_i <= 10^9"
    ],
    "inputFormat": "Line 1: N1 (number of intervals in firstList)\nFollowing N1 lines: start end\nNext line: N2 (number of intervals in secondList)\nFollowing N2 lines: start end",
    "outputFormat": "Number of intersection intervals",
    "hints": [
      "Intersection between [a1, a2] and [b1, b2] exists if max(a1, b1) <= min(a2, b2).",
      "Advance the pointer of whichever interval ends first.",
      "Count all valid intersections."
    ],
    "examples": [
      {
        "input": "4\n0 2\n5 10\n13 23\n24 25\n4\n1 5\n8 12\n15 24\n25 26",
        "output": "6",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2\n1 3\n5 9\n0",
        "output": "0",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4\n0 2\n5 10\n13 23\n24 25\n4\n1 5\n8 12\n15 24\n25 26",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "2\n1 3\n5 9\n0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1\n1 7\n1\n3 10",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "2\n1 5\n10 15\n2\n2 3\n4 12",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "0\n0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1\n1 10\n1\n2 8",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3\n1 3\n5 7\n9 11\n3\n2 4\n6 8\n10 12",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1\n5 5\n1\n5 5",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2\n1 2\n3 4\n2\n5 6\n7 8",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "2\n1 4\n6 9\n2\n2 5\n7 10",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Compute the number of overlapping intersections between two disjoint sorted interval lists.",
    "conceptualExplanation": [
      "Use two pointers i and j.",
      "Start = max(A[i].start, B[j].start), End = min(A[i].end, B[j].end). If Start <= End, intersection found.",
      "Advance i if A[i].end < B[j].end else advance j."
    ]
  },
  {
    "id": "ch_teemo_attacking",
    "title": "Teemo Attacking Poison Duration",
    "difficulty": "Easy",
    "category": "Intervals",
    "description": "Our hero Teemo is attacking an enemy Ashe with poison attacks! When Teemo attacks Ashe, Ashe gets poisoned for exactly `duration` seconds.\n\nGiven a non-decreasing integer array `timeSeries` and an integer `duration`, return the total number of seconds that Ashe is poisoned.",
    "constraints": [
      "1 <= timeSeries.length <= 10^4",
      "0 <= timeSeries[i], duration <= 10^7"
    ],
    "inputFormat": "Line 1: An integer duration\nLine 2: Space-separated integers timeSeries",
    "outputFormat": "Total poison duration as an integer",
    "hints": [
      "For each attack i, poison lasts min(duration, timeSeries[i+1] - timeSeries[i]).",
      "The last attack always contributes full duration.",
      "Sum contributions."
    ],
    "examples": [
      {
        "input": "2\n1 4",
        "output": "4",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2\n1 2",
        "output": "3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2\n1 4",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "2\n1 2",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "5\n1 2 3 4 5",
        "expectedOutput": "9",
        "isHidden": false
      },
      {
        "input": "10\n0",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "3\n1 5 10 15",
        "expectedOutput": "12",
        "isHidden": true
      },
      {
        "input": "4\n1 3 5 7 9",
        "expectedOutput": "12",
        "isHidden": true
      },
      {
        "input": "1\n1 2 3 4 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "100\n10 50 200",
        "expectedOutput": "240",
        "isHidden": true
      },
      {
        "input": "0\n1 2 3",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "5\n2 4 6 8 10 12",
        "expectedOutput": "15",
        "isHidden": true
      }
    ],
    "objective": "Calculate total merged duration of overlapping time intervals of fixed length.",
    "conceptualExplanation": [
      "Loop through timeSeries from 0 to n - 2.",
      "Add min(duration, timeSeries[i+1] - timeSeries[i]).",
      "Add duration for final attack."
    ]
  },
  {
    "id": "ch_baseball_game",
    "title": "Baseball Game Score Tracker",
    "difficulty": "Easy",
    "category": "Stacks",
    "description": "You are keeping score for a baseball game with strange rules. At the beginning of the game, you start with an empty record.\n\nYou are given a list of strings `operations`, where `operations[i]` is the `i-th` operation you must apply to the record:\n- An integer `x`: Record a new score of `x`.\n- `'+'`: Record a new score that is the sum of the previous two scores.\n- `'D'`: Record a new score that is double the previous score.\n- `'C'`: Invalidate the previous score, removing it from the record.\n\nReturn the sum of all the scores on the record.",
    "constraints": [
      "1 <= operations.length <= 1000",
      "Valid operations guaranteed."
    ],
    "inputFormat": "Line 1: Space-separated operation tokens",
    "outputFormat": "Total score sum as an integer",
    "hints": [
      "Use a stack to keep track of scores.",
      "On '+', peek top two elements, sum them and push.",
      "On 'D', double top element and push. On 'C', pop top.",
      "Return sum of stack."
    ],
    "examples": [
      {
        "input": "5 2 C D +",
        "output": "30",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "5 -2 4 C D 9 + +",
        "output": "27",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "5 2 C D +",
        "expectedOutput": "30",
        "isHidden": false
      },
      {
        "input": "5 -2 4 C D 9 + +",
        "expectedOutput": "27",
        "isHidden": false
      },
      {
        "input": "1 C",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "10 20 + D",
        "expectedOutput": "120",
        "isHidden": true
      },
      {
        "input": "100",
        "expectedOutput": "100",
        "isHidden": true
      },
      {
        "input": "1 2 + + +",
        "expectedOutput": "19",
        "isHidden": true
      },
      {
        "input": "-5 D C 10 +",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "3 D D",
        "expectedOutput": "21",
        "isHidden": true
      },
      {
        "input": "8 C 9 D +",
        "expectedOutput": "54",
        "isHidden": true
      },
      {
        "input": "4 5 + D C",
        "expectedOutput": "18",
        "isHidden": true
      }
    ],
    "objective": "Simulate stack-based scoring rules and sum total points.",
    "conceptualExplanation": [
      "Stack holds active scores.",
      "Handle each token (+, D, C, integer).",
      "Sum all elements in stack at the end."
    ]
  },
  {
    "id": "ch_remove_adjacent_duplicates",
    "title": "Remove All Adjacent Duplicates in String",
    "difficulty": "Easy",
    "category": "Stacks",
    "description": "You are given a string `s` consisting of lowercase English letters. A duplicate removal consists of choosing two adjacent and equal letters and removing them.\n\nWe repeatedly make duplicate removals on `s` until we no longer can. Return the final string. If empty, return \"EMPTY\".",
    "constraints": [
      "1 <= s.length <= 10^5",
      "s consists of lowercase English letters."
    ],
    "inputFormat": "Line 1: A string s",
    "outputFormat": "The resulting string, or EMPTY",
    "hints": [
      "Iterate through string using a stack.",
      "If current char equals stack.top, pop stack.",
      "Else push current char."
    ],
    "examples": [
      {
        "input": "abbaca",
        "output": "ca",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "azxxzy",
        "output": "ay",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "abbaca",
        "expectedOutput": "ca",
        "isHidden": false
      },
      {
        "input": "azxxzy",
        "expectedOutput": "ay",
        "isHidden": false
      },
      {
        "input": "a",
        "expectedOutput": "a",
        "isHidden": false
      },
      {
        "input": "aa",
        "expectedOutput": "EMPTY",
        "isHidden": true
      },
      {
        "input": "aaaa",
        "expectedOutput": "EMPTY",
        "isHidden": true
      },
      {
        "input": "mississippi",
        "expectedOutput": "m",
        "isHidden": true
      },
      {
        "input": "masteryzone",
        "expectedOutput": "masteryzone",
        "isHidden": true
      },
      {
        "input": "abccba",
        "expectedOutput": "EMPTY",
        "isHidden": true
      },
      {
        "input": "aabbcc",
        "expectedOutput": "EMPTY",
        "isHidden": true
      },
      {
        "input": "repaper",
        "expectedOutput": "repaper",
        "isHidden": true
      }
    ],
    "objective": "Eliminate duplicate adjacent pairs iteratively using a stack.",
    "conceptualExplanation": [
      "Stack stores characters.",
      "For each char: if stack.top === char, pop; else push.",
      "Return stack string or 'EMPTY' if stack is empty."
    ]
  },
  {
    "id": "ch_largest_rect_hist",
    "title": "Largest Rectangle in Histogram",
    "difficulty": "Hard",
    "category": "Stacks",
    "description": "Given an array of integers `heights` representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.",
    "constraints": [
      "1 <= heights.length <= 10^5",
      "0 <= heights[i] <= 10^4"
    ],
    "inputFormat": "Line 1: Space-separated integers representing heights",
    "outputFormat": "Maximum rectangular area as integer",
    "hints": [
      "Use a monotonic increasing stack storing bar indices.",
      "When current height is smaller than stack top, pop and calculate area with popped height as minimum height.",
      "Width is i - stack.top - 1."
    ],
    "examples": [
      {
        "input": "2 1 5 6 2 3",
        "output": "10",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2 4",
        "output": "4",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 1 5 6 2 3",
        "expectedOutput": "10",
        "isHidden": false
      },
      {
        "input": "2 4",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "5 5 5 5",
        "expectedOutput": "20",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "5 4 3 2 1",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "6 2 5 4 5 1 6",
        "expectedOutput": "12",
        "isHidden": true
      },
      {
        "input": "0 9",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "3 6 5 7 4 8 1 0",
        "expectedOutput": "20",
        "isHidden": true
      },
      {
        "input": "2 1 2",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Calculate the maximum rectangular area in a histogram in O(n) time.",
    "conceptualExplanation": [
      "Monotonic stack of indices with ascending heights.",
      "Pop when current height < stack top height, compute width and area.",
      "Track overall max area."
    ]
  },
  {
    "id": "ch_asteroid_collision",
    "title": "Asteroid Collision",
    "difficulty": "Medium",
    "category": "Stacks",
    "description": "We are given an array `asteroids` of integers representing asteroids in a row.\n\nFor each asteroid, the absolute value represents its size, and the sign represents its direction (positive meaning right, negative meaning left). Each asteroid moves at the same speed.\n\nFind out the state of the asteroids after all collisions. If two asteroids meet, the smaller one explodes. If both are the same size, both explode. Two asteroids moving in the same direction will never meet. Return space-separated integers, or \"EMPTY\".",
    "constraints": [
      "2 <= asteroids.length <= 10^4",
      "-1000 <= asteroids[i] <= 1000",
      "asteroids[i] != 0"
    ],
    "inputFormat": "Line 1: Space-separated integers",
    "outputFormat": "Space-separated remaining asteroids, or EMPTY",
    "hints": [
      "Use a stack.",
      "Collision only happens when current asteroid is negative and stack top is positive.",
      "Compare sizes: pop top if smaller; destroy current if smaller; pop and destroy if equal."
    ],
    "examples": [
      {
        "input": "5 10 -5",
        "output": "5 10",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "8 -8",
        "output": "EMPTY",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "5 10 -5",
        "expectedOutput": "5 10",
        "isHidden": false
      },
      {
        "input": "8 -8",
        "expectedOutput": "EMPTY",
        "isHidden": false
      },
      {
        "input": "10 2 -5",
        "expectedOutput": "10",
        "isHidden": false
      },
      {
        "input": "-2 -1 1 2",
        "expectedOutput": "-2 -1 1 2",
        "isHidden": true
      },
      {
        "input": "-2 -2 1 -2",
        "expectedOutput": "-2 -2 -2",
        "isHidden": true
      },
      {
        "input": "1 -1",
        "expectedOutput": "EMPTY",
        "isHidden": true
      },
      {
        "input": "5 4 3 2 1 -6",
        "expectedOutput": "-6",
        "isHidden": true
      },
      {
        "input": "10 5 -5 -10",
        "expectedOutput": "EMPTY",
        "isHidden": true
      },
      {
        "input": "-5 5",
        "expectedOutput": "-5 5",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "1 2 3 4 5",
        "isHidden": true
      }
    ],
    "objective": "Simulate asteroid collisions using a stack.",
    "conceptualExplanation": [
      "Push positive asteroids directly.",
      "When negative arrives: while top > 0 and top < |current|, pop top; if top == |current|, pop and discard current.",
      "Output remaining stack."
    ]
  },
  {
    "id": "ch_simplify_path",
    "title": "Simplify Unix File Path",
    "difficulty": "Medium",
    "category": "Stacks",
    "description": "Given an absolute path for a Unix-style file system, simplify it. In a Unix-style file system, a period `'.'` refers to the current directory, a double period `'..'` refers to the directory up a level, and any multiple consecutive slashes are treated as a single slash `'/'`.\n\nReturn the simplified canonical path.",
    "constraints": [
      "1 <= path.length <= 3000",
      "path starts with a single slash '/'.",
      "path consists of English letters, digits, period '.', slash '/'."
    ],
    "inputFormat": "Line 1: An absolute Unix file path",
    "outputFormat": "The simplified canonical path",
    "hints": [
      "Split string by '/'.",
      "Ignore empty strings and '.'.",
      "On '..', pop from stack if not empty. Push directory names onto stack.",
      "Join stack with '/'."
    ],
    "examples": [
      {
        "input": "/home/",
        "output": "/home",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "/../",
        "output": "/",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "/home/",
        "expectedOutput": "/home",
        "isHidden": false
      },
      {
        "input": "/../",
        "expectedOutput": "/",
        "isHidden": false
      },
      {
        "input": "/home//foo/",
        "expectedOutput": "/home/foo",
        "isHidden": false
      },
      {
        "input": "/a/./b/../../c/",
        "expectedOutput": "/c",
        "isHidden": true
      },
      {
        "input": "/a/../../b/../c//.//",
        "expectedOutput": "/c",
        "isHidden": true
      },
      {
        "input": "/a/b/c/d/..",
        "expectedOutput": "/a/b/c",
        "isHidden": true
      },
      {
        "input": "/.../a/../b/c/../d/./",
        "expectedOutput": "/.../b/d",
        "isHidden": true
      },
      {
        "input": "/mastery/zone/../compiler/./editor",
        "expectedOutput": "/mastery/compiler/editor",
        "isHidden": true
      },
      {
        "input": "/home/user/Documents/../Pictures",
        "expectedOutput": "/home/user/Pictures",
        "isHidden": true
      },
      {
        "input": "/x/y/z/../../../w",
        "expectedOutput": "/w",
        "isHidden": true
      }
    ],
    "objective": "Convert a Unix file path into its canonical normalized form.",
    "conceptualExplanation": [
      "Split path by '/'.",
      "Filter out '.' and empty tokens.",
      "Pop on '..', push on valid name.",
      "Return '/' + stack.join('/')."
    ]
  },
  {
    "id": "ch_decode_string",
    "title": "Decode String Pattern",
    "difficulty": "Medium",
    "category": "Stacks",
    "description": "Given an encoded string, return its decoded string.\n\nThe encoding rule is: `k[encoded_string]`, where the `encoded_string` inside the square brackets is being repeated exactly `k` times. You may assume that `k` is a positive integer.",
    "constraints": [
      "1 <= s.length <= 30",
      "s consists of lowercase English letters, digits, and square brackets '[]'."
    ],
    "inputFormat": "Line 1: An encoded string",
    "outputFormat": "The fully decoded string",
    "hints": [
      "Use two stacks: one for counts (k) and one for strings.",
      "When '[', push current count and current string.",
      "When ']', pop count and previous string, repeat current string count times and append to previous."
    ],
    "examples": [
      {
        "input": "3[a]2[bc]",
        "output": "aaabcbc",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "3[a2[c]]",
        "output": "accaccacc",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3[a]2[bc]",
        "expectedOutput": "aaabcbc",
        "isHidden": false
      },
      {
        "input": "3[a2[c]]",
        "expectedOutput": "accaccacc",
        "isHidden": false
      },
      {
        "input": "2[abc]3[cd]ef",
        "expectedOutput": "abcabccdcdcdef",
        "isHidden": false
      },
      {
        "input": "abc",
        "expectedOutput": "abc",
        "isHidden": true
      },
      {
        "input": "10[a]",
        "expectedOutput": "aaaaaaaaaa",
        "isHidden": true
      },
      {
        "input": "2[z]3[cd]2[ef]",
        "expectedOutput": "zzcdcdcdefef",
        "isHidden": true
      },
      {
        "input": "1[mastery]2[zone]",
        "expectedOutput": "masteryzonezone",
        "isHidden": true
      },
      {
        "input": "3[2[b]]",
        "expectedOutput": "bbbbbb",
        "isHidden": true
      },
      {
        "input": "2[2[2[a]]]",
        "expectedOutput": "aaaaaaaa",
        "isHidden": true
      },
      {
        "input": "4[ab]",
        "expectedOutput": "abababab",
        "isHidden": true
      }
    ],
    "objective": "Decode nested multiplier patterns using stacks.",
    "conceptualExplanation": [
      "Maintain curStr and curNum.",
      "On '[': push curStr and curNum to stacks, reset both.",
      "On ']': pop k and prevStr; curStr = prevStr + curStr.repeat(k)."
    ]
  },
  {
    "id": "ch_search_insert_position",
    "title": "Search Insert Position",
    "difficulty": "Easy",
    "category": "Binary Search",
    "description": "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    "constraints": [
      "1 <= nums.length <= 10^4",
      "-10^4 <= nums[i], target <= 10^4",
      "nums contains distinct values sorted in ascending order."
    ],
    "inputFormat": "Line 1: An integer target\nLine 2: Space-separated sorted distinct integers",
    "outputFormat": "Index as integer",
    "hints": [
      "Classic binary search.",
      "If target found, return mid.",
      "If loop terminates without match, left pointer is the exact insertion index."
    ],
    "examples": [
      {
        "input": "5\n1 3 5 6",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2\n1 3 5 6",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "5\n1 3 5 6",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "2\n1 3 5 6",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "7\n1 3 5 6",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "0\n1 3 5 6",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1\n1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "0\n1",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "10\n2 4 6 8 10 12",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "5\n2 4 6 8 10",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "-5\n-10 -3 0 4 9",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "50\n10 20 30 40 60 70",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Find the index of target or insertion index in sorted array in O(log n).",
    "conceptualExplanation": [
      "Binary search with low = 0, high = n - 1.",
      "If nums[mid] === target, return mid.",
      "When search finishes, return low."
    ]
  },
  {
    "id": "ch_first_last_position",
    "title": "Find First and Last Position in Sorted Array",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "Given an array of integers `nums` sorted in non-decreasing order, find the starting and ending position of a given `target` value.\n\nIf `target` is not found in the array, return `-1 -1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    "constraints": [
      "0 <= nums.length <= 10^5",
      "-10^9 <= nums[i], target <= 10^9",
      "nums is non-decreasing."
    ],
    "inputFormat": "Line 1: An integer target\nLine 2: Space-separated sorted integers",
    "outputFormat": "Two space-separated integers: first last",
    "hints": [
      "Run two binary searches: one finding leftmost occurrence and one finding rightmost occurrence.",
      "For leftmost: when nums[mid] == target, continue searching left (r = mid - 1).",
      "For rightmost: when nums[mid] == target, continue searching right (l = mid + 1)."
    ],
    "examples": [
      {
        "input": "8\n5 7 7 8 8 10",
        "output": "3 4",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "6\n5 7 7 8 8 10",
        "output": "-1 -1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "8\n5 7 7 8 8 10",
        "expectedOutput": "3 4",
        "isHidden": false
      },
      {
        "input": "6\n5 7 7 8 8 10",
        "expectedOutput": "-1 -1",
        "isHidden": false
      },
      {
        "input": "0\n",
        "expectedOutput": "-1 -1",
        "isHidden": false
      },
      {
        "input": "1\n1",
        "expectedOutput": "0 0",
        "isHidden": true
      },
      {
        "input": "2\n2 2 2 2 2",
        "expectedOutput": "0 4",
        "isHidden": true
      },
      {
        "input": "4\n1 2 3 4 5",
        "expectedOutput": "3 3",
        "isHidden": true
      },
      {
        "input": "10\n10 10 20 30",
        "expectedOutput": "0 1",
        "isHidden": true
      },
      {
        "input": "-5\n-10 -5 -5 -5 0",
        "expectedOutput": "1 3",
        "isHidden": true
      },
      {
        "input": "7\n1 3 5 7 9 11",
        "expectedOutput": "3 3",
        "isHidden": true
      },
      {
        "input": "3\n1 2 4 5",
        "expectedOutput": "-1 -1",
        "isHidden": true
      }
    ],
    "objective": "Find the boundary indices of a target in a sorted array in O(log n).",
    "conceptualExplanation": [
      "Left search finds first index matching target.",
      "Right search finds last index matching target.",
      "Output 'first last'."
    ]
  },
  {
    "id": "ch_sqrt_x",
    "title": "Integer Square Root Sqrt(x)",
    "difficulty": "Easy",
    "category": "Binary Search",
    "description": "Given a non-negative integer `x`, return the square root of `x` rounded down to the nearest integer. The returned integer should be non-negative as well.\n\nYou must not use any built-in exponent function or operator, such as `pow(x, 0.5)` or `x ** 0.5`.",
    "constraints": [
      "0 <= x <= 2^31 - 1"
    ],
    "inputFormat": "Line 1: An integer x",
    "outputFormat": "The integer floor of square root",
    "hints": [
      "Binary search in range [0, x].",
      "If mid * mid == x, return mid.",
      "If mid * mid < x, save mid as candidate and search right."
    ],
    "examples": [
      {
        "input": "4",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "8",
        "output": "2",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "8",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "16",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "25",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "26",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "99",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "1000",
        "expectedOutput": "31",
        "isHidden": true
      },
      {
        "input": "2147395599",
        "expectedOutput": "46339",
        "isHidden": true
      }
    ],
    "objective": "Compute integer floor(sqrt(x)) using binary search.",
    "conceptualExplanation": [
      "Low = 0, High = x.",
      "If mid * mid <= x, record mid, low = mid + 1.",
      "Otherwise high = mid - 1."
    ]
  },
  {
    "id": "ch_koko_bananas",
    "title": "Koko Eating Bananas",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "Koko loves to eat bananas. There are `n` piles of bananas, the `i-th` pile has `piles[i]` bananas. The guards have gone and will come back in `h` hours.\n\nKoko can decide her bananas-per-hour eating speed of `k`. Each hour, she chooses some pile of bananas and eats `k` bananas from that pile. If the pile has less than `k` bananas, she eats all of them instead and will not eat any more bananas during this hour.\n\nReturn the minimum integer `k` such that she can eat all the bananas within `h` hours.",
    "constraints": [
      "1 <= piles.length <= 10^4",
      "piles.length <= h <= 10^9",
      "1 <= piles[i] <= 10^9"
    ],
    "inputFormat": "Line 1: An integer h (hours)\nLine 2: Space-separated integers representing piles",
    "outputFormat": "Minimum eating speed k",
    "hints": [
      "The speed k ranges from 1 to max(piles).",
      "For a given speed k, hours needed = sum(ceil(pile / k)).",
      "Binary search on k between 1 and max(piles)."
    ],
    "examples": [
      {
        "input": "8\n3 6 7 11",
        "output": "4",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "5\n30 11 23 4 20",
        "output": "30",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "8\n3 6 7 11",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "5\n30 11 23 4 20",
        "expectedOutput": "30",
        "isHidden": false
      },
      {
        "input": "6\n30 11 23 4 20",
        "expectedOutput": "23",
        "isHidden": false
      },
      {
        "input": "4\n3 6 7 11",
        "expectedOutput": "11",
        "isHidden": true
      },
      {
        "input": "10\n10 10 10 10",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "15\n1 2 3 4 5 6 7 8 9 10",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "5\n100",
        "expectedOutput": "20",
        "isHidden": true
      },
      {
        "input": "7\n312884470",
        "expectedOutput": "44697782",
        "isHidden": true
      },
      {
        "input": "9\n3 5 7 9 11 13",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "12\n4 8 12 16 20",
        "expectedOutput": "6",
        "isHidden": true
      }
    ],
    "objective": "Binary search on answer to find minimum eating speed satisfying hour constraint.",
    "conceptualExplanation": [
      "Search space: low = 1, high = max(piles).",
      "Compute total hours for speed mid: sum(ceil(p / mid)).",
      "If total <= h, record mid and search lower half; else search upper half."
    ]
  },
  {
    "id": "ch_ship_packages",
    "title": "Capacity To Ship Packages Within D Days",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "A conveyor belt has packages that must be shipped from one port to another within `days` days.\n\nThe `i-th` package on the conveyor belt has a weight of `weights[i]`. Each day, we load the ship with packages on the conveyor belt (in the order given by `weights`). We may not load more weight than the maximum weight capacity of the ship.\n\nReturn the least weight capacity of the ship that will result in all the packages on the conveyor belt being shipped within `days` days.",
    "constraints": [
      "1 <= days <= weights.length <= 5 * 10^4",
      "1 <= weights[i] <= 500"
    ],
    "inputFormat": "Line 1: An integer days\nLine 2: Space-separated integers weights",
    "outputFormat": "Minimum weight capacity as integer",
    "hints": [
      "Minimum capacity must be at least max(weights).",
      "Maximum capacity is sum(weights).",
      "Binary search on capacity and simulate day splits."
    ],
    "examples": [
      {
        "input": "5\n1 2 3 4 5 6 7 8 9 10",
        "output": "15",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "3\n3 2 2 4 1 4",
        "output": "6",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "5\n1 2 3 4 5 6 7 8 9 10",
        "expectedOutput": "15",
        "isHidden": false
      },
      {
        "input": "3\n3 2 2 4 1 4",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "4\n1 2 3 1 1",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1\n1 2 3 4 5",
        "expectedOutput": "15",
        "isHidden": true
      },
      {
        "input": "10\n1 1 1 1 1 1 1 1 1 1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2\n10 20 30 40 50",
        "expectedOutput": "90",
        "isHidden": true
      },
      {
        "input": "3\n1 2 3 4 5 6 7",
        "expectedOutput": "11",
        "isHidden": true
      },
      {
        "input": "6\n5 5 5 5 5 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "4\n10 5 15 20 25",
        "expectedOutput": "25",
        "isHidden": true
      },
      {
        "input": "2\n100 200",
        "expectedOutput": "200",
        "isHidden": true
      }
    ],
    "objective": "Binary search on ship capacity to meet deadline days.",
    "conceptualExplanation": [
      "Search range: low = max(weights), high = sum(weights).",
      "Check if capacity mid can ship packages in <= days.",
      "If feasible, search lower half; else upper half."
    ]
  },
  {
    "id": "ch_find_k_closest",
    "title": "Find K Closest Elements",
    "difficulty": "Medium",
    "category": "Binary Search",
    "description": "Given a sorted integer array `arr`, two integers `k` and `x`, return the `k` closest integers to `x` in the array. The result should also be sorted in ascending order.\n\nAn integer `a` is closer to `x` than an integer `b` if `|a - x| < |b - x|`, or `|a - x| == |b - x|` and `a < b`.",
    "constraints": [
      "1 <= k <= arr.length",
      "1 <= arr.length <= 10^4",
      "arr is sorted in ascending order.",
      "-10^4 <= arr[i], x <= 10^4"
    ],
    "inputFormat": "Line 1: Two space-separated integers k and x\nLine 2: Space-separated sorted integers arr",
    "outputFormat": "Space-separated k closest integers in sorted order",
    "hints": [
      "Find the window of size k with minimum distance to x.",
      "Binary search the starting index of the window: compare x - arr[mid] with arr[mid + k] - x.",
      "Return arr.slice(left, left + k)."
    ],
    "examples": [
      {
        "input": "4 3\n1 2 3 4 5",
        "output": "1 2 3 4",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "4 -1\n1 2 3 4 5",
        "output": "1 2 3 4",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4 3\n1 2 3 4 5",
        "expectedOutput": "1 2 3 4",
        "isHidden": false
      },
      {
        "input": "4 -1\n1 2 3 4 5",
        "expectedOutput": "1 2 3 4",
        "isHidden": false
      },
      {
        "input": "2 5\n1 2 3 4 5",
        "expectedOutput": "4 5",
        "isHidden": false
      },
      {
        "input": "1 10\n1 2 3 4 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "3 0\n-5 -2 0 1 4 9",
        "expectedOutput": "-2 0 1",
        "isHidden": true
      },
      {
        "input": "3 6\n1 3 5 7 9",
        "expectedOutput": "3 5 7",
        "isHidden": true
      },
      {
        "input": "2 4\n1 2 4 4 5",
        "expectedOutput": "4 4",
        "isHidden": true
      },
      {
        "input": "5 15\n10 12 15 18 20 25",
        "expectedOutput": "10 12 15 18 20",
        "isHidden": true
      },
      {
        "input": "1 1\n1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "4 35\n10 20 30 40 50",
        "expectedOutput": "20 30 40 50",
        "isHidden": true
      }
    ],
    "objective": "Identify k closest elements to target in sorted array.",
    "conceptualExplanation": [
      "Binary search starting point in [0, n - k].",
      "Compare arr[mid] and arr[mid + k] distance to x.",
      "Return subarray of length k."
    ]
  },
  {
    "id": "ch_middle_linked_list",
    "title": "Middle of Singly Linked List",
    "difficulty": "Easy",
    "category": "Linked Lists",
    "description": "Given the values of a singly linked list, return the value of the middle node.\n\nIf there are two middle nodes, return the second middle node's value.",
    "constraints": [
      "The number of nodes in the list is in the range [1, 100].",
      "1 <= Node.val <= 100"
    ],
    "inputFormat": "Line 1: Space-separated integers representing linked list values",
    "outputFormat": "Value of the middle node as an integer",
    "hints": [
      "Use fast and slow pointer technique.",
      "Slow advances by 1 step while fast advances by 2 steps.",
      "When fast reaches end, slow is at the middle node."
    ],
    "examples": [
      {
        "input": "1 2 3 4 5",
        "output": "3",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 2 3 4 5 6",
        "output": "4",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1 2 3 4 5 6",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50 60 70",
        "expectedOutput": "40",
        "isHidden": true
      },
      {
        "input": "7 8 9",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "5 10 15 20",
        "expectedOutput": "15",
        "isHidden": true
      },
      {
        "input": "100 200 300 400 500",
        "expectedOutput": "300",
        "isHidden": true
      },
      {
        "input": "42",
        "expectedOutput": "42",
        "isHidden": true
      },
      {
        "input": "1 3 5 7 9 11 13 15",
        "expectedOutput": "9",
        "isHidden": true
      }
    ],
    "objective": "Locate middle element in singly linked list in single pass.",
    "conceptualExplanation": [
      "Slow pointer moves 1 step, fast pointer moves 2 steps.",
      "When fast hits end (or null), slow points to middle node.",
      "Return slow node value."
    ]
  },
  {
    "id": "ch_palindrome_linked_list",
    "title": "Palindrome Linked List Verification",
    "difficulty": "Easy",
    "category": "Linked Lists",
    "description": "Given the values of a singly linked list, return `true` if it is a palindrome, or `false` otherwise.",
    "constraints": [
      "The number of nodes in the list is in the range [1, 10^5].",
      "0 <= Node.val <= 9"
    ],
    "inputFormat": "Line 1: Space-separated integers representing list values",
    "outputFormat": "true or false",
    "hints": [
      "Can check with two pointers if values are in array.",
      "In O(1) space: find middle, reverse second half, compare halves."
    ],
    "examples": [
      {
        "input": "1 2 2 1",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 2",
        "output": "false",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 2 1",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "1 2",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "1 2 3 2 1",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "0 0",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 0 1",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 3 3 2 1",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 2 1",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "9 9 9 9 9",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Verify whether elements in singly linked list form a palindrome.",
    "conceptualExplanation": [
      "Compare elements from start and end inward.",
      "If any mismatch occurs, return false; otherwise true."
    ]
  },
  {
    "id": "ch_remove_linked_list_elements",
    "title": "Remove Linked List Elements",
    "difficulty": "Easy",
    "category": "Linked Lists",
    "description": "Given the values of a singly linked list and an integer `val`, remove all nodes of the linked list that have `Node.val == val`.\n\nReturn the space-separated values of the remaining list, or \"EMPTY\" if empty.",
    "constraints": [
      "The number of nodes in the list is in the range [0, 5000].",
      "1 <= Node.val <= 50",
      "0 <= val <= 50"
    ],
    "inputFormat": "Line 1: Target integer val to remove\nLine 2: Space-separated integers representing linked list (can be empty)",
    "outputFormat": "Space-separated values of remaining list, or EMPTY",
    "hints": [
      "Use a sentinel/dummy node pointing to head to easily delete head nodes.",
      "Iterate through list and bypass any node whose val equals target.",
      "Return remaining elements."
    ],
    "examples": [
      {
        "input": "6\n1 2 6 3 4 5 6",
        "output": "1 2 3 4 5",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1\n",
        "output": "EMPTY",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "6\n1 2 6 3 4 5 6",
        "expectedOutput": "1 2 3 4 5",
        "isHidden": false
      },
      {
        "input": "1\n",
        "expectedOutput": "EMPTY",
        "isHidden": false
      },
      {
        "input": "7\n7 7 7 7",
        "expectedOutput": "EMPTY",
        "isHidden": false
      },
      {
        "input": "2\n1 2 2 1",
        "expectedOutput": "1 1",
        "isHidden": true
      },
      {
        "input": "5\n5 10 15 20",
        "expectedOutput": "10 15 20",
        "isHidden": true
      },
      {
        "input": "3\n1 2 3",
        "expectedOutput": "1 2",
        "isHidden": true
      },
      {
        "input": "4\n4 4 1 2 3",
        "expectedOutput": "1 2 3",
        "isHidden": true
      },
      {
        "input": "0\n1 2 0 3 0 4",
        "expectedOutput": "1 2 3 4",
        "isHidden": true
      },
      {
        "input": "9\n1 9 2 9 3 9",
        "expectedOutput": "1 2 3",
        "isHidden": true
      },
      {
        "input": "8\n8",
        "expectedOutput": "EMPTY",
        "isHidden": true
      }
    ],
    "objective": "Filter out all instances of target value from linked list.",
    "conceptualExplanation": [
      "Use dummy node before head.",
      "Skip nodes with matching value.",
      "Format output or return 'EMPTY'."
    ]
  },
  {
    "id": "ch_odd_even_linked_list",
    "title": "Odd Even Linked List",
    "difficulty": "Medium",
    "category": "Linked Lists",
    "description": "Given the head of a singly linked list, group all the nodes with odd indices together followed by the nodes with even indices, and return the reordered list.\n\nThe first node is considered odd, and the second node is even, and so on.",
    "constraints": [
      "The number of nodes in the list is in the range [0, 10^4].",
      "-10^6 <= Node.val <= 10^6"
    ],
    "inputFormat": "Line 1: Space-separated integers representing list values",
    "outputFormat": "Space-separated integers of reordered list",
    "hints": [
      "Maintain two lists: odd list and even list.",
      "Connect odd.next = even.next, advance odd; even.next = odd.next, advance even.",
      "Connect end of odd list to head of even list."
    ],
    "examples": [
      {
        "input": "1 2 3 4 5",
        "output": "1 3 5 2 4",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2 1 3 5 6 4 7",
        "output": "2 3 6 7 1 5 4",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "1 3 5 2 4",
        "isHidden": false
      },
      {
        "input": "2 1 3 5 6 4 7",
        "expectedOutput": "2 3 6 7 1 5 4",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 2",
        "expectedOutput": "1 2",
        "isHidden": true
      },
      {
        "input": "1 2 3",
        "expectedOutput": "1 3 2",
        "isHidden": true
      },
      {
        "input": "10 20 30 40",
        "expectedOutput": "10 30 20 40",
        "isHidden": true
      },
      {
        "input": "7 8 9 10 11 12",
        "expectedOutput": "7 9 11 8 10 12",
        "isHidden": true
      },
      {
        "input": "5 4 3 2 1",
        "expectedOutput": "5 3 1 4 2",
        "isHidden": true
      },
      {
        "input": "100 200",
        "expectedOutput": "100 200",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6 7 8 9 10",
        "expectedOutput": "1 3 5 7 9 2 4 6 8 10",
        "isHidden": true
      }
    ],
    "objective": "Reorder list nodes by 1-based index parity in O(n) time and O(1) extra space.",
    "conceptualExplanation": [
      "Odd pointer starts at index 0, even pointer starts at index 1.",
      "Alternate links between odds and evens.",
      "Join end of odd chain to start of even chain."
    ]
  },
  {
    "id": "ch_add_two_numbers_list",
    "title": "Add Two Numbers Stored in Lists",
    "difficulty": "Medium",
    "category": "Linked Lists",
    "description": "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a space-separated linked list in reverse order.",
    "constraints": [
      "The number of nodes in each list is in the range [1, 100].",
      "0 <= Node.val <= 9"
    ],
    "inputFormat": "Line 1: Space-separated digits of list 1 (reverse order)\nLine 2: Space-separated digits of list 2 (reverse order)",
    "outputFormat": "Space-separated digits of sum list in reverse order",
    "hints": [
      "Iterate through both lists with carry variable.",
      "sum = l1.val + l2.val + carry; digit = sum % 10; carry = Math.floor(sum / 10).",
      "Continue until both lists and carry are exhausted."
    ],
    "examples": [
      {
        "input": "2 4 3\n5 6 4",
        "output": "7 0 8",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "0\n0",
        "output": "0",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 4 3\n5 6 4",
        "expectedOutput": "7 0 8",
        "isHidden": false
      },
      {
        "input": "0\n0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "9 9 9 9 9 9 9\n9 9 9 9",
        "expectedOutput": "8 9 9 9 0 0 0 1",
        "isHidden": false
      },
      {
        "input": "1 8\n0",
        "expectedOutput": "1 8",
        "isHidden": true
      },
      {
        "input": "5\n5",
        "expectedOutput": "0 1",
        "isHidden": true
      },
      {
        "input": "9 9\n1",
        "expectedOutput": "0 0 1",
        "isHidden": true
      },
      {
        "input": "1 2 3\n4 5 6",
        "expectedOutput": "5 7 9",
        "isHidden": true
      },
      {
        "input": "7 8 9\n3 2 1",
        "expectedOutput": "0 1 1 1",
        "isHidden": true
      },
      {
        "input": "5 4 3 2 1\n5 4 3 2 1",
        "expectedOutput": "0 9 6 4 2",
        "isHidden": true
      },
      {
        "input": "6 7 8\n4",
        "expectedOutput": "0 8 8",
        "isHidden": true
      }
    ],
    "objective": "Perform addition on two numbers represented as reversed linked list digits.",
    "conceptualExplanation": [
      "Add corresponding digits along with carry.",
      "Compute new digit and new carry.",
      "Append remaining carry if present."
    ]
  },
  {
    "id": "ch_same_tree",
    "title": "Same Binary Tree Structural Equivalence",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the roots of two binary trees `p` and `q`, write a function to check if they are the same or not.\n\nTwo binary trees are considered the same if they are structurally identical, and the nodes have the same value. Input is given as space-separated level-order traversal with 'null' representing missing children.",
    "constraints": [
      "The number of nodes in both trees is in the range [0, 100].",
      "-10^4 <= Node.val <= 10^4"
    ],
    "inputFormat": "Line 1: Level-order traversal of tree p\nLine 2: Level-order traversal of tree q",
    "outputFormat": "true or false",
    "hints": [
      "If both nodes are null, return true.",
      "If one is null or values differ, return false.",
      "Recursively check left and right subtrees."
    ],
    "examples": [
      {
        "input": "1 2 3\n1 2 3",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 2\n1 null 2",
        "output": "false",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3\n1 2 3",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "1 2\n1 null 2",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "1 2 1\n1 1 2",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "null\nnull",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1\n1",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5\n1 2 3 4 5",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 3 4\n1 2 3 null 4",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "10 5 15\n10 5 15",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2\n2 1",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "3 9 20 null null 15 7\n3 9 20 null null 15 7",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Verify structural and value identity between two binary trees.",
    "conceptualExplanation": [
      "Compare roots: null checks then value check.",
      "Recurse on left subtrees and right subtrees.",
      "Return true if all match."
    ]
  },
  {
    "id": "ch_symmetric_tree",
    "title": "Symmetric Binary Tree Mirror",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the root of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center). Input is given in level-order format with 'null' for missing nodes.",
    "constraints": [
      "The number of nodes in the tree is in the range [1, 1000].",
      "-100 <= Node.val <= 100"
    ],
    "inputFormat": "Line 1: Space-separated level-order traversal",
    "outputFormat": "true or false",
    "hints": [
      "A tree is symmetric if left subtree is mirror reflection of right subtree.",
      "Check t1.val == t2.val, and t1.left mirror of t2.right, and t1.right mirror of t2.left."
    ],
    "examples": [
      {
        "input": "1 2 2 3 4 4 3",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 2 2 null 3 null 3",
        "output": "false",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 2 3 4 4 3",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "1 2 2 null 3 null 3",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "1 2 2",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 3",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "1 2 2 3 null null 3",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 2 null 4 4 null",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 2 3 4 4 3 5 null null 6 6 null null 5",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "2 3 3 4 5 5 4",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6 7",
        "expectedOutput": "false",
        "isHidden": true
      }
    ],
    "objective": "Determine whether a binary tree is symmetric around its vertical axis.",
    "conceptualExplanation": [
      "Check symmetry helper(t1, t2).",
      "Values must match, t1.left matches t2.right, t1.right matches t2.left."
    ]
  },
  {
    "id": "ch_diameter_of_binary_tree",
    "title": "Diameter of Binary Tree",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the root of a binary tree, return the length of the diameter of the tree.\n\nThe diameter of a binary tree is the length of the longest path between any two nodes in a tree. This path may or may not pass through the root. The length of a path between two nodes is represented by the number of edges between them.",
    "constraints": [
      "The number of nodes in the tree is in the range [1, 10^4].",
      "-100 <= Node.val <= 100"
    ],
    "inputFormat": "Line 1: Space-separated level-order values of the tree ('null' for absent nodes)",
    "outputFormat": "Diameter length in edges as an integer",
    "hints": [
      "The longest path passing through any node is leftDepth + rightDepth.",
      "Run a post-order DFS that returns the depth of each node.",
      "Update maxDiameter = max(maxDiameter, leftDepth + rightDepth) at each node."
    ],
    "examples": [
      {
        "input": "1 2 3 4 5",
        "output": "3",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 2",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1 2",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 2 3",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 2 null 3 null 4",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6 7",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "1 2 3 null null 4 5",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 null null 5 null 6",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "10 5 15 3 7 null 18",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 null null 6 null null 7",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Compute the maximum distance between any two nodes in a binary tree.",
    "conceptualExplanation": [
      "DFS computes height of each subtree.",
      "Diameter at node = left_height + right_height.",
      "Maintain global maximum."
    ]
  },
  {
    "id": "ch_path_sum",
    "title": "Path Sum Root to Leaf",
    "difficulty": "Easy",
    "category": "Trees",
    "description": "Given the `root` of a binary tree and an integer `targetSum`, return `true` if the tree has a root-to-leaf path such that adding up all the values along the path equals `targetSum`.\n\nA leaf is a node with no children.",
    "constraints": [
      "The number of nodes in the tree is in the range [0, 5000].",
      "-1000 <= Node.val, targetSum <= 1000"
    ],
    "inputFormat": "Line 1: targetSum integer\nLine 2: Space-separated level-order values ('null' for absent)",
    "outputFormat": "true or false",
    "hints": [
      "At each node, subtract node.val from targetSum.",
      "If leaf node, check if remaining targetSum == 0.",
      "Recursively check left and right subtrees."
    ],
    "examples": [
      {
        "input": "22\n5 4 8 11 null 13 4 7 2 null null null 1",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "5\n1 2 3",
        "output": "false",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "22\n5 4 8 11 null 13 4 7 2 null null null 1",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "5\n1 2 3",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "0\n",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "1\n1 2",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "10\n5 5",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "18\n10 5 15 3 7 null 18",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "3\n1 2",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "7\n2 5",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "15\n10 2 5",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "8\n3 5 4",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Determine if any root-to-leaf path sums to targetSum.",
    "conceptualExplanation": [
      "Traverse from root downward.",
      "Subtract current node value from target.",
      "If leaf node and remainder is 0, return true."
    ]
  },
  {
    "id": "ch_level_order_traversal",
    "title": "Binary Tree Level Order Traversal",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given the root of a binary tree, return the number of levels and total nodes in the tree.",
    "constraints": [
      "The number of nodes in the tree is in the range [0, 2000].",
      "-1000 <= Node.val <= 1000"
    ],
    "inputFormat": "Line 1: Space-separated level order nodes ('null' for absent)",
    "outputFormat": "Two space-separated integers: levels count",
    "hints": [
      "Use BFS queue.",
      "Count levels and valid non-null nodes.",
      "Return levels and total count."
    ],
    "examples": [
      {
        "input": "3 9 20 null null 15 7",
        "output": "3 5",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1",
        "output": "1 1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 9 20 null null 15 7",
        "expectedOutput": "3 5",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1 1",
        "isHidden": false
      },
      {
        "input": "null",
        "expectedOutput": "0 0",
        "isHidden": false
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "3 5",
        "isHidden": true
      },
      {
        "input": "1 2 null 3 null 4",
        "expectedOutput": "3 3",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6 7",
        "expectedOutput": "3 7",
        "isHidden": true
      },
      {
        "input": "10 20 30",
        "expectedOutput": "2 3",
        "isHidden": true
      },
      {
        "input": "5 4 8 11 null 13 4",
        "expectedOutput": "3 6",
        "isHidden": true
      },
      {
        "input": "1 2 3 null null null 4",
        "expectedOutput": "3 4",
        "isHidden": true
      },
      {
        "input": "1 2 2 3 4 4 3",
        "expectedOutput": "3 7",
        "isHidden": true
      }
    ],
    "objective": "Compute height and node count of binary tree.",
    "conceptualExplanation": [
      "Perform BFS layer by layer.",
      "Count total non-null nodes.",
      "Count number of layers."
    ]
  },
  {
    "id": "ch_kth_smallest_bst",
    "title": "Kth Smallest Element in a BST",
    "difficulty": "Medium",
    "category": "Trees",
    "description": "Given the root of a binary search tree (BST) and an integer `k`, return the `k-th` smallest value (1-indexed) of all the values of the nodes in the tree.",
    "constraints": [
      "The number of nodes in the tree is n.",
      "1 <= k <= n <= 10^4",
      "0 <= Node.val <= 10^4"
    ],
    "inputFormat": "Line 1: An integer k\nLine 2: Space-separated BST nodes in level-order ('null' for absent)",
    "outputFormat": "The kth smallest value as an integer",
    "hints": [
      "Inorder traversal of a BST visits nodes in strictly ascending sorted order.",
      "Traverse in-order and stop at the k-th node.",
      "O(k) time with iterative stack."
    ],
    "examples": [
      {
        "input": "1\n3 1 4 null 2",
        "output": "1",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "3\n5 3 6 2 4 null null 1",
        "output": "3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1\n3 1 4 null 2",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "3\n5 3 6 2 4 null null 1",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1\n2 1 3",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "2\n2 1 3",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "3\n2 1 3",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1\n1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "4\n4 2 6 1 3 5 7",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "2\n10 5 15 null null 12 20",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "5\n10 5 15 2 7 12 20",
        "expectedOutput": "12",
        "isHidden": true
      },
      {
        "input": "3\n8 3 10 1 6 null 14",
        "expectedOutput": "6",
        "isHidden": true
      }
    ],
    "objective": "Find kth smallest element in BST using in-order traversal.",
    "conceptualExplanation": [
      "Inorder traversal of BST gives sorted values.",
      "Collect values in-order.",
      "Return element at index k - 1."
    ]
  },
  {
    "id": "ch_last_stone_weight",
    "title": "Last Stone Weight Simulation",
    "difficulty": "Easy",
    "category": "Heaps",
    "description": "You are given an array of integers `stones` where `stones[i]` is the weight of the `i-th` stone.\n\nWe are playing a game with the stones. On each turn, we choose the heaviest two stones and smash them together. Suppose the heaviest two stones have weights `x` and `y` with `x <= y`:\n- If `x == y`, both stones are destroyed.\n- If `x != y`, the stone of weight `x` is destroyed, and the stone of weight `y` has new weight `y - x`.\n\nAt the end of the game, there is at most one stone left. Return the weight of the last remaining stone. If there are no stones left, return `0`.",
    "constraints": [
      "1 <= stones.length <= 30",
      "1 <= stones[i] <= 1000"
    ],
    "inputFormat": "Line 1: Space-separated integers representing stone weights",
    "outputFormat": "Weight of the last remaining stone (or 0)",
    "hints": [
      "Use a max heap to always retrieve the two largest stones.",
      "Smash them: if difference > 0, push difference back into heap.",
      "Repeat until heap size <= 1."
    ],
    "examples": [
      {
        "input": "2 7 4 1 8 1",
        "output": "1",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 7 4 1 8 1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "2 2",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "3 7 2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "10 4 2 10",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "8 8 8",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "1 3 5 7 9",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "31 26 33 21 40",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "100 50 25",
        "expectedOutput": "25",
        "isHidden": true
      },
      {
        "input": "5 5 5 5",
        "expectedOutput": "0",
        "isHidden": true
      }
    ],
    "objective": "Simulate stone destruction priority queue process until at most 1 stone remains.",
    "conceptualExplanation": [
      "Sort or maintain max-heap.",
      "Pop two largest, push difference if non-zero.",
      "Return final stone or 0."
    ]
  },
  {
    "id": "ch_top_k_frequent",
    "title": "Top K Frequent Elements",
    "difficulty": "Medium",
    "category": "Heaps",
    "description": "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements in descending order of frequency.",
    "constraints": [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "k is in the range [1, the number of unique elements in the array]."
    ],
    "inputFormat": "Line 1: An integer k\nLine 2: Space-separated integers nums",
    "outputFormat": "Space-separated k elements",
    "hints": [
      "Count frequencies using a Hash Map.",
      "Use a min-heap of size k, or bucket sort.",
      "Return elements ordered by frequency."
    ],
    "examples": [
      {
        "input": "2\n1 1 1 2 2 3",
        "output": "1 2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1\n1",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2\n1 1 1 2 2 3",
        "expectedOutput": "1 2",
        "isHidden": false
      },
      {
        "input": "1\n1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "3\n4 1 -1 2 -1 2 3",
        "expectedOutput": "-1 2 4",
        "isHidden": false
      },
      {
        "input": "1\n5 5 5 5 5",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "2\n1 2 3 4 5 1 2",
        "expectedOutput": "1 2",
        "isHidden": true
      },
      {
        "input": "2\n10 10 20 20 20 30",
        "expectedOutput": "20 10",
        "isHidden": true
      },
      {
        "input": "1\n42 42 7 7 7",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "3\n1 1 2 2 3 3 4",
        "expectedOutput": "1 2 3",
        "isHidden": true
      },
      {
        "input": "2\n9 9 9 8 8 7",
        "expectedOutput": "9 8",
        "isHidden": true
      },
      {
        "input": "4\n1 2 3 4",
        "expectedOutput": "1 2 3 4",
        "isHidden": true
      }
    ],
    "objective": "Extract the k most frequent elements in array.",
    "conceptualExplanation": [
      "Count frequency of each number.",
      "Sort distinct numbers by frequency descending.",
      "Return top k."
    ]
  },
  {
    "id": "ch_find_median_stream",
    "title": "Running Median of Stream",
    "difficulty": "Hard",
    "category": "Heaps",
    "description": "The median is the middle value in an ordered integer list. If the size of the list is even, the median is the mean of the two middle values.\n\nGiven a list of numbers from a data stream, return the median formatted with 1 decimal place if fractional, or integer if whole.",
    "constraints": [
      "1 <= nums.length <= 5 * 10^4",
      "-10^5 <= nums[i] <= 10^5"
    ],
    "inputFormat": "Line 1: Space-separated integers",
    "outputFormat": "Median value (e.g. 2 or 2.5)",
    "hints": [
      "Use two heaps: a max-heap for lower half and a min-heap for upper half.",
      "Balance heaps so their sizes differ by at most 1.",
      "Median is either top of larger heap or average of both tops."
    ],
    "examples": [
      {
        "input": "2 3 4",
        "output": "3",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2 3",
        "output": "2.5",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 3 4",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "2 3",
        "expectedOutput": "2.5",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "5 15 1 3",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50",
        "expectedOutput": "30",
        "isHidden": true
      },
      {
        "input": "-5 -10 0 10 5",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "1 2",
        "expectedOutput": "1.5",
        "isHidden": true
      },
      {
        "input": "6 7 8 9 10 11",
        "expectedOutput": "8.5",
        "isHidden": true
      },
      {
        "input": "100 200",
        "expectedOutput": "150",
        "isHidden": true
      },
      {
        "input": "4 1 7 2 9 3 8",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Calculate median of a numbers collection in O(n log n).",
    "conceptualExplanation": [
      "Sort numbers array.",
      "If odd length: return middle element.",
      "If even: return average of two middle elements."
    ]
  },
  {
    "id": "ch_task_scheduler",
    "title": "Task Scheduler CPU Cooling Intervals",
    "difficulty": "Medium",
    "category": "Heaps",
    "description": "Given a characters array `tasks`, representing the tasks a CPU needs to do, where each letter represents a different task. Tasks could be done in any order. Each task is done in one unit of time. For each unit of time, the CPU could complete either one task or just be idle.\n\nHowever, there is a non-negative integer `n` that represents the cooldown period between two same tasks (the same letter in the array). Return the least number of units of times that the CPU will take to finish all the given tasks.",
    "constraints": [
      "1 <= tasks.length <= 10^4",
      "tasks[i] is uppercase English letter.",
      "0 <= n <= 100"
    ],
    "inputFormat": "Line 1: Cooldown integer n\nLine 2: Space-separated task characters",
    "outputFormat": "Least units of time as integer",
    "hints": [
      "Find the task with the maximum frequency maxFreq.",
      "Calculate idle slots needed: (maxFreq - 1) * (n + 1) + countOfTasksWithMaxFreq.",
      "Result is max(tasks.length, calculatedSlots)."
    ],
    "examples": [
      {
        "input": "2\nA A A B B B",
        "output": "8",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "0\nA A A B B B",
        "output": "6",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2\nA A A B B B",
        "expectedOutput": "8",
        "isHidden": false
      },
      {
        "input": "0\nA A A B B B",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "2\nA A A A A A B C D E F G",
        "expectedOutput": "16",
        "isHidden": false
      },
      {
        "input": "1\nA B C D",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "3\nA A A B B B C C",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "2\nA",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1\nA A B B",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "2\nA B C A B C",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "4\nA A A B B",
        "expectedOutput": "11",
        "isHidden": true
      },
      {
        "input": "3\nX X X Y Y Z",
        "expectedOutput": "9",
        "isHidden": true
      }
    ],
    "objective": "Compute minimum CPU cycles including cooldowns using greedy frequency formula.",
    "conceptualExplanation": [
      "Count frequency of each task.",
      "Find max frequency F and number of tasks with frequency F.",
      "Time = max(totalTasks, (F - 1) * (n + 1) + countMax)."
    ]
  },
  {
    "id": "ch_reorganize_string",
    "title": "Reorganize String No Adjacent",
    "difficulty": "Medium",
    "category": "Heaps",
    "description": "Given a string `s`, rearrange the characters of `s` so that any two adjacent characters are not the same.\n\nReturn true if possible, or false otherwise.",
    "constraints": [
      "1 <= s.length <= 500",
      "s consists of lowercase English letters."
    ],
    "inputFormat": "Line 1: A string s",
    "outputFormat": "true or false",
    "hints": [
      "Count frequency of each character.",
      "If the most frequent character appears more than (s.length + 1) / 2 times, it is impossible.",
      "Otherwise, it is always possible."
    ],
    "examples": [
      {
        "input": "aab",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "aaab",
        "output": "false",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "aab",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "aaab",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "a",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "vvvlo",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "baaba",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "masteryzone",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "aaaaa",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "abacaba",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "aabbcc",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "zzzzzzy",
        "expectedOutput": "false",
        "isHidden": true
      }
    ],
    "objective": "Determine whether characters of a string can be rearranged with no adjacent duplicates.",
    "conceptualExplanation": [
      "Find maximum frequency of any character.",
      "If maxFreq > Math.ceil(s.length / 2), return false.",
      "Otherwise return true."
    ]
  },
  {
    "id": "ch_permutations_array",
    "title": "Permutations of Distinct Integers Count",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given an array `nums` of distinct integers, return the number of all possible permutations.",
    "constraints": [
      "1 <= nums.length <= 8",
      "-10 <= nums[i] <= 10",
      "All integers in nums are unique."
    ],
    "inputFormat": "Line 1: Space-separated integers",
    "outputFormat": "Total count of permutations as an integer",
    "hints": [
      "For n distinct numbers, total permutations is n! (factorial).",
      "Can also generate permutations using backtracking.",
      "Return n!."
    ],
    "examples": [
      {
        "input": "1 2 3",
        "output": "6",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "0 1",
        "output": "2",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "1 2 3",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "0 1",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 2 3 4",
        "expectedOutput": "24",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50",
        "expectedOutput": "120",
        "isHidden": true
      },
      {
        "input": "7 8 9",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5 6",
        "expectedOutput": "720",
        "isHidden": true
      },
      {
        "input": "42",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "-1 -2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "1 3 5 7",
        "expectedOutput": "24",
        "isHidden": true
      }
    ],
    "objective": "Compute the number of permutations for an array of distinct integers.",
    "conceptualExplanation": [
      "Count distinct elements n.",
      "Calculate factorial n! = 1 * 2 * ... * n.",
      "Output total count."
    ]
  },
  {
    "id": "ch_combinations_k_of_n",
    "title": "Combinations Count of K Numbers",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given two integers `n` and `k`, return the total number of possible combinations of `k` numbers chosen from the range `[1, n]`.",
    "constraints": [
      "1 <= n <= 20",
      "1 <= k <= n"
    ],
    "inputFormat": "Line 1: Two space-separated integers n and k",
    "outputFormat": "Number of combinations C(n, k) as integer",
    "hints": [
      "Formula C(n, k) = n! / (k! * (n - k)!).",
      "Can compute iteratively or with backtracking.",
      "Return integer combinations count."
    ],
    "examples": [
      {
        "input": "4 2",
        "output": "6",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 1",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4 2",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "1 1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "5 3",
        "expectedOutput": "10",
        "isHidden": false
      },
      {
        "input": "6 2",
        "expectedOutput": "15",
        "isHidden": true
      },
      {
        "input": "10 5",
        "expectedOutput": "252",
        "isHidden": true
      },
      {
        "input": "7 4",
        "expectedOutput": "35",
        "isHidden": true
      },
      {
        "input": "8 3",
        "expectedOutput": "56",
        "isHidden": true
      },
      {
        "input": "5 1",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "5 5",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "12 4",
        "expectedOutput": "495",
        "isHidden": true
      }
    ],
    "objective": "Calculate combinations count C(n, k).",
    "conceptualExplanation": [
      "Compute n choose k.",
      "Use formula C(n, k) = C(n, k-1) * (n - k + 1) / k.",
      "Return integer."
    ]
  },
  {
    "id": "ch_letter_combos_phone",
    "title": "Letter Combinations of a Phone Number",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given a string containing digits from `2-9` inclusive, return the number of all possible letter combinations that the number could represent based on the telephone keypad mappings.",
    "constraints": [
      "0 <= digits.length <= 4",
      "digits[i] is a digit in the range ['2', '9']."
    ],
    "inputFormat": "Line 1: A string of digits",
    "outputFormat": "Total count of letter combinations as integer",
    "hints": [
      "Digits 2-6 and 8 map to 3 letters each.",
      "Digits 7 and 9 map to 4 letters each.",
      "Total combinations is the product of lengths of mapped letters."
    ],
    "examples": [
      {
        "input": "23",
        "output": "9",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "",
        "output": "0",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "23",
        "expectedOutput": "9",
        "isHidden": false
      },
      {
        "input": "",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "2",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "79",
        "expectedOutput": "16",
        "isHidden": true
      },
      {
        "input": "234",
        "expectedOutput": "27",
        "isHidden": true
      },
      {
        "input": "99",
        "expectedOutput": "16",
        "isHidden": true
      },
      {
        "input": "777",
        "expectedOutput": "64",
        "isHidden": true
      },
      {
        "input": "88",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "456",
        "expectedOutput": "27",
        "isHidden": true
      },
      {
        "input": "2345",
        "expectedOutput": "81",
        "isHidden": true
      }
    ],
    "objective": "Calculate the total number of combinations from phone keypad letters.",
    "conceptualExplanation": [
      "If empty, return 0.",
      "Multiply letter choices for each digit: 7 and 9 have 4 choices; others have 3.",
      "Output product."
    ]
  },
  {
    "id": "ch_palindrome_partitioning",
    "title": "Palindrome Partitioning Ways",
    "difficulty": "Medium",
    "category": "Backtracking",
    "description": "Given a string `s`, partition `s` such that every substring of the partition is a palindrome. Return the number of possible palindrome partitionings of `s`.",
    "constraints": [
      "1 <= s.length <= 16",
      "s contains only lowercase English letters."
    ],
    "inputFormat": "Line 1: A string s",
    "outputFormat": "Number of palindrome partitionings as integer",
    "hints": [
      "Use backtracking starting at index 0.",
      "For each end index from start to n, if substring is palindrome, recurse on end + 1.",
      "Count completed partitionings reaching end of string."
    ],
    "examples": [
      {
        "input": "aab",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "a",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "aab",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "a",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "ab",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "aaa",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "racecar",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "aba",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "abba",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "bb",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "code",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "noon",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Count valid palindrome partitions of a string.",
    "conceptualExplanation": [
      "Backtracking from index 0.",
      "Check if prefix is palindrome; if yes, recursively count ways for remainder.",
      "Return total count."
    ]
  },
  {
    "id": "ch_n_queens_solutions",
    "title": "N-Queens Solutions Count",
    "difficulty": "Hard",
    "category": "Backtracking",
    "description": "The n-queens puzzle is the problem of placing `n` queens on an `n x n` chessboard such that no two queens attack each other.\n\nGiven an integer `n`, return the number of distinct solutions to the n-queens puzzle.",
    "constraints": [
      "1 <= n <= 9"
    ],
    "inputFormat": "Line 1: An integer n",
    "outputFormat": "Number of distinct solutions as an integer",
    "hints": [
      "Place one queen per row.",
      "Track columns, main diagonals (r - c), and anti-diagonals (r + c) using sets.",
      "Count ways when row reaches n."
    ],
    "examples": [
      {
        "input": "4",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "2",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "3",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "5",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "6",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "7",
        "expectedOutput": "40",
        "isHidden": true
      },
      {
        "input": "8",
        "expectedOutput": "92",
        "isHidden": true
      },
      {
        "input": "9",
        "expectedOutput": "352",
        "isHidden": true
      },
      {
        "input": "4",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Count non-attacking queen arrangements on n x n chessboard.",
    "conceptualExplanation": [
      "Backtrack row by row.",
      "Track occupied columns and diagonals.",
      "Increment counter when all n rows filled."
    ]
  },
  {
    "id": "ch_min_cost_climbing_stairs",
    "title": "Min Cost Climbing Stairs",
    "difficulty": "Easy",
    "category": "Dynamic Programming",
    "description": "You are given an integer array `cost` where `cost[i]` is the cost of `i-th` step on a staircase. Once you pay the cost, you can either climb one or two steps.\n\nYou can either start from the step with index 0, or the step with index 1. Return the minimum cost to reach the top of the floor.",
    "constraints": [
      "2 <= cost.length <= 1000",
      "0 <= cost[i] <= 999"
    ],
    "inputFormat": "Line 1: Space-separated integers representing cost array",
    "outputFormat": "Minimum cost as integer",
    "hints": [
      "dp[i] is the minimum cost to reach step i.",
      "dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2]).",
      "Keep only the previous two costs in variables for O(1) space."
    ],
    "examples": [
      {
        "input": "10 15 20",
        "output": "15",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 100 1 1 1 100 1 1 100 1",
        "output": "6",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "10 15 20",
        "expectedOutput": "15",
        "isHidden": false
      },
      {
        "input": "1 100 1 1 1 100 1 1 100 1",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "0 0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "5 10",
        "expectedOutput": "5",
        "isHidden": true
      },
      {
        "input": "10 15",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "1 2 3 4 5",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "100 1 100 1 100",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "2 5 3 1 7 3",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "10 20 30 40 50",
        "expectedOutput": "60",
        "isHidden": true
      },
      {
        "input": "0 1 2 2",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Calculate minimum cost to reach top of staircase using DP.",
    "conceptualExplanation": [
      "prev2 = 0, prev1 = 0.",
      "For each cost: cur = min(prev1 + cost[i], prev2 + cost[i-1]).",
      "Return minimum."
    ]
  },
  {
    "id": "ch_tribonacci_number",
    "title": "N-th Tribonacci Number",
    "difficulty": "Easy",
    "category": "Dynamic Programming",
    "description": "The Tribonacci sequence `T_n` is defined as follows:\n`T_0 = 0`, `T_1 = 1`, `T_2 = 1`, and `T_{n+3} = T_n + T_{n+1} + T_{n+2}` for `n >= 0`.\n\nGiven `n`, return the value of `T_n`.",
    "constraints": [
      "0 <= n <= 37"
    ],
    "inputFormat": "Line 1: An integer n",
    "outputFormat": "T_n as integer",
    "hints": [
      "Base cases: T_0 = 0, T_1 = 1, T_2 = 1.",
      "Iterate from 3 to n maintaining the last three values.",
      "Update: next = a + b + c; a = b; b = c; c = next."
    ],
    "examples": [
      {
        "input": "4",
        "output": "4",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "25",
        "output": "1389537",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "25",
        "expectedOutput": "1389537",
        "isHidden": false
      },
      {
        "input": "0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "5",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "10",
        "expectedOutput": "149",
        "isHidden": true
      },
      {
        "input": "15",
        "expectedOutput": "3136",
        "isHidden": true
      },
      {
        "input": "20",
        "expectedOutput": "66012",
        "isHidden": true
      }
    ],
    "objective": "Compute n-th Tribonacci number iteratively in O(n) time.",
    "conceptualExplanation": [
      "Handle base cases 0, 1, 2.",
      "Iterate up to n keeping previous three values.",
      "Return final sum."
    ]
  },
  {
    "id": "ch_house_robber_ii",
    "title": "House Robber II Circular Neighborhood",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses at this place are arranged in a circle. That means the first house is the neighbor of the last one. Adjacent houses have security systems connected.\n\nReturn the maximum amount of money you can rob tonight without alerting the police.",
    "constraints": [
      "1 <= nums.length <= 100",
      "0 <= nums[i] <= 1000"
    ],
    "inputFormat": "Line 1: Space-separated integers representing house stash amounts",
    "outputFormat": "Maximum loot as integer",
    "hints": [
      "Since houses are circular, you cannot rob both first and last house.",
      "Problem splits into two linear House Robber subproblems: houses [0 .. n-2] and houses [1 .. n-1].",
      "Return max of the two solutions."
    ],
    "examples": [
      {
        "input": "2 3 2",
        "output": "3",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 2 3 1",
        "output": "4",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "2 3 2",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1 2 3 1",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "1 2 3",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "10",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "20 10",
        "expectedOutput": "20",
        "isHidden": true
      },
      {
        "input": "1 3 1 3 100",
        "expectedOutput": "103",
        "isHidden": true
      },
      {
        "input": "5 1 2 10 6 2",
        "expectedOutput": "15",
        "isHidden": true
      },
      {
        "input": "100 200 300 400",
        "expectedOutput": "600",
        "isHidden": true
      },
      {
        "input": "50 1 1 50",
        "expectedOutput": "51",
        "isHidden": true
      },
      {
        "input": "4 1 2 7 5 3 1",
        "expectedOutput": "14",
        "isHidden": true
      }
    ],
    "objective": "Solve circular house robber problem by evaluating two non-circular slices.",
    "conceptualExplanation": [
      "If length 1, return nums[0].",
      "Compute linear house robber on nums[0..n-2].",
      "Compute linear house robber on nums[1..n-1].",
      "Return max of both."
    ]
  },
  {
    "id": "ch_decode_ways",
    "title": "Decode Ways Num Decodings",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "A message containing letters from A-Z can be encoded into numbers using the mapping: 'A' -> \"1\", 'B' -> \"2\", ... 'Z' -> \"26\".\n\nGiven a string `s` containing only digits, return the number of ways to decode it.",
    "constraints": [
      "1 <= s.length <= 100",
      "s contains only digits and may contain leading zero(s)."
    ],
    "inputFormat": "Line 1: A digit string s",
    "outputFormat": "Number of valid decodings as integer",
    "hints": [
      "dp[i] represents decodings for s[0..i-1].",
      "Single digit s[i-1] != '0' contributes dp[i-1].",
      "Two digits s[i-2..i-1] between 10 and 26 contributes dp[i-2]."
    ],
    "examples": [
      {
        "input": "12",
        "output": "2",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "226",
        "output": "3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "12",
        "expectedOutput": "2",
        "isHidden": false
      },
      {
        "input": "226",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "06",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "10",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "27",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "11106",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "2101",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "1234",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "11111",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "2611055",
        "expectedOutput": "2",
        "isHidden": true
      }
    ],
    "objective": "Calculate number of valid message decodings using DP.",
    "conceptualExplanation": [
      "dp array of size n + 1.",
      "dp[0] = 1.",
      "Check valid 1-digit and 2-digit substrings."
    ]
  },
  {
    "id": "ch_word_break_dict",
    "title": "Word Break Verification",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.",
    "constraints": [
      "1 <= s.length <= 300",
      "1 <= wordDict.length <= 1000",
      "1 <= wordDict[i].length <= 20",
      "s and wordDict[i] consist of lowercase English letters."
    ],
    "inputFormat": "Line 1: The string s\nLine 2: Space-separated dictionary words",
    "outputFormat": "true or false",
    "hints": [
      "dp[i] is true if s[0..i] can be segmented.",
      "dp[i] = true if dp[j] is true and s[j..i] is in wordDict.",
      "Use a Set for O(1) dictionary lookups."
    ],
    "examples": [
      {
        "input": "leetcode\nleet code",
        "output": "true",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "applepenapple\napple pen",
        "output": "true",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "leetcode\nleet code",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "applepenapple\napple pen",
        "expectedOutput": "true",
        "isHidden": false
      },
      {
        "input": "catsandog\ncats dog sand and cat",
        "expectedOutput": "false",
        "isHidden": false
      },
      {
        "input": "masteryzone\nmastery zone",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "cars\ncar ca rs",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "a\na",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "a\nb",
        "expectedOutput": "false",
        "isHidden": true
      },
      {
        "input": "program\npro gram",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "compiler\ncom pil er compile",
        "expectedOutput": "true",
        "isHidden": true
      },
      {
        "input": "banana\nba na",
        "expectedOutput": "true",
        "isHidden": true
      }
    ],
    "objective": "Determine whether a string can be segmented using dictionary words.",
    "conceptualExplanation": [
      "dp[0] = true.",
      "For each i from 1 to n: check if there exists j < i where dp[j] is true and s[j..i] in dict.",
      "Return dp[n]."
    ]
  },
  {
    "id": "ch_unique_paths_grid",
    "title": "Unique Paths in Grid",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "There is a robot on an `m x n` grid. The robot is initially located at the top-left corner `(grid[0][0])`. The robot tries to move to the bottom-right corner `(grid[m - 1][n - 1])`. The robot can only move either down or right at any point in time.\n\nGiven the two integers `m` and `n`, return the number of possible unique paths that the robot can take to reach the bottom-right corner.",
    "constraints": [
      "1 <= m, n <= 20"
    ],
    "inputFormat": "Line 1: Two space-separated integers m and n",
    "outputFormat": "Total unique paths as integer",
    "hints": [
      "dp[i][j] = dp[i-1][j] + dp[i][j-1].",
      "First row and first column are all 1.",
      "Can compress to a single 1D array of size n."
    ],
    "examples": [
      {
        "input": "3 7",
        "output": "28",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "3 2",
        "output": "3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 7",
        "expectedOutput": "28",
        "isHidden": false
      },
      {
        "input": "3 2",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "1 1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "7 3",
        "expectedOutput": "28",
        "isHidden": true
      },
      {
        "input": "3 3",
        "expectedOutput": "6",
        "isHidden": true
      },
      {
        "input": "2 2",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "10 10",
        "expectedOutput": "48620",
        "isHidden": true
      },
      {
        "input": "4 4",
        "expectedOutput": "20",
        "isHidden": true
      },
      {
        "input": "5 3",
        "expectedOutput": "15",
        "isHidden": true
      },
      {
        "input": "12 5",
        "expectedOutput": "1365",
        "isHidden": true
      }
    ],
    "objective": "Compute grid path count using 2D dynamic programming.",
    "conceptualExplanation": [
      "Initialize 1D row of size n with 1s.",
      "For each subsequent row from 1 to m-1: row[j] += row[j-1].",
      "Return row[n-1]."
    ]
  },
  {
    "id": "ch_min_path_sum",
    "title": "Minimum Path Sum in Grid",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "Given a `m x n` `grid` filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.\n\nYou can only move either down or right at any point in time.",
    "constraints": [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 100",
      "0 <= grid[i][j] <= 100"
    ],
    "inputFormat": "Line 1: Two integers m and n\nFollowing m lines: n space-separated integers",
    "outputFormat": "Minimum path sum as integer",
    "hints": [
      "dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).",
      "Initialize first row and first column with cumulative sums.",
      "dp[m-1][n-1] holds the answer."
    ],
    "examples": [
      {
        "input": "3 3\n1 3 1\n1 5 1\n4 2 1",
        "output": "7",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2 3\n1 2 3\n4 5 6",
        "output": "12",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 3\n1 3 1\n1 5 1\n4 2 1",
        "expectedOutput": "7",
        "isHidden": false
      },
      {
        "input": "2 3\n1 2 3\n4 5 6",
        "expectedOutput": "12",
        "isHidden": false
      },
      {
        "input": "1 1\n5",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "1 4\n1 2 3 4",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "4 1\n1\n2\n3\n4",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "2 2\n1 2\n1 1",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "3 3\n5 1 2\n6 7 1\n1 1 1",
        "expectedOutput": "10",
        "isHidden": true
      },
      {
        "input": "3 2\n1 10\n1 1\n10 1",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "2 2\n0 0\n0 0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "3 4\n1 2 5 1\n3 2 1 1\n1 4 2 1",
        "expectedOutput": "8",
        "isHidden": true
      }
    ],
    "objective": "Find path of minimum weight in 2D grid from top-left to bottom-right.",
    "conceptualExplanation": [
      "Accumulate sums along top row and left column.",
      "For inner cells: dp[i][j] = grid[i][j] + min(up, left).",
      "Return bottom-right value."
    ]
  },
  {
    "id": "ch_longest_common_subseq",
    "title": "Longest Common Subsequence Length",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return `0`.",
    "constraints": [
      "1 <= text1.length, text2.length <= 1000",
      "text1 and text2 consist of only lowercase English characters."
    ],
    "inputFormat": "Line 1: String text1\nLine 2: String text2",
    "outputFormat": "Length of LCS as integer",
    "hints": [
      "2D DP table of size (m+1) x (n+1).",
      "If text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1.",
      "Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])."
    ],
    "examples": [
      {
        "input": "abcde\nace",
        "output": "3",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "abc\nabc",
        "output": "3",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "abcde\nace",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "abc\nabc",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "abc\ndef",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "mastery\nzone",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "algorithm\nlogarithm",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "aggtab\ngxtxayb",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "banana\natana",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "a\na",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "xyz\nx",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "programming\ngaming",
        "expectedOutput": "6",
        "isHidden": true
      }
    ],
    "objective": "Compute length of longest common subsequence between two strings.",
    "conceptualExplanation": [
      "Standard 2D dynamic programming.",
      "If characters match, increment diagonal value.",
      "Otherwise take max of left and up cells."
    ]
  },
  {
    "id": "ch_edit_distance_lev",
    "title": "Edit Distance Levenshtein",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`.\n\nYou have the following three operations permitted on a word:\n- Insert a character\n- Delete a character\n- Replace a character",
    "constraints": [
      "0 <= word1.length, word2.length <= 500",
      "word1 and word2 consist of lowercase English letters."
    ],
    "inputFormat": "Line 1: String word1 (can be empty)\nLine 2: String word2 (can be empty)",
    "outputFormat": "Minimum operations as integer",
    "hints": [
      "Classic Levenshtein DP.",
      "dp[i][j] represents edits to convert word1[0..i] to word2[0..j].",
      "If characters match, dp[i-1][j-1]; else 1 + min(insert, delete, replace)."
    ],
    "examples": [
      {
        "input": "horse\nros",
        "output": "3",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "intention\nexecution",
        "output": "5",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "horse\nros",
        "expectedOutput": "3",
        "isHidden": false
      },
      {
        "input": "intention\nexecution",
        "expectedOutput": "5",
        "isHidden": false
      },
      {
        "input": "\na",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "a\n",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "abc\nabc",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "kitten\nsitting",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "mastery\nmister",
        "expectedOutput": "2",
        "isHidden": true
      },
      {
        "input": "compiler\ncompute",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "code\ndoc",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "zoologico\nzoo",
        "expectedOutput": "6",
        "isHidden": true
      }
    ],
    "objective": "Calculate minimum edit operations to transform one word to another.",
    "conceptualExplanation": [
      "Initialize dp matrix with boundary distances.",
      "Fill table based on match vs mismatch.",
      "Output dp[m][n]."
    ]
  },
  {
    "id": "ch_maximal_square",
    "title": "Maximal Square of 1s Area",
    "difficulty": "Medium",
    "category": "Dynamic Programming",
    "description": "Given an `m x n` binary `matrix` filled with `0`'s and `1`'s, find the largest square containing only `1`'s and return its area.",
    "constraints": [
      "m == matrix.length",
      "n == matrix[i].length",
      "1 <= m, n <= 100",
      "matrix[i][j] is '0' or '1'."
    ],
    "inputFormat": "Line 1: Two integers m and n\nFollowing m lines: n space-separated '0' or '1' values",
    "outputFormat": "Area of the largest square as integer",
    "hints": [
      "dp[i][j] represents side length of maximum square with bottom-right corner at (i, j).",
      "If matrix[i][j] == 1: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).",
      "Area is maxSide * maxSide."
    ],
    "examples": [
      {
        "input": "4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0",
        "output": "4",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2 2\n0 1\n1 0",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "2 2\n0 1\n1 0",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "1 1\n0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 1\n1",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3 3\n1 1 1\n1 1 1\n1 1 1",
        "expectedOutput": "9",
        "isHidden": true
      },
      {
        "input": "2 3\n1 1 1\n1 1 1",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "3 3\n0 0 0\n0 0 0\n0 0 0",
        "expectedOutput": "0",
        "isHidden": true
      },
      {
        "input": "4 4\n1 1 0 0\n1 1 0 0\n0 0 1 1\n0 0 1 1",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "3 4\n1 0 1 1\n1 1 1 1\n1 1 1 1",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "2 4\n1 1 1 1\n1 1 1 1",
        "expectedOutput": "4",
        "isHidden": true
      }
    ],
    "objective": "Determine maximum area of a square sub-matrix of 1s.",
    "conceptualExplanation": [
      "2D DP tracks maximum side length ending at (i, j).",
      "If cell is 1, take 1 + min(top, left, diagonal).",
      "Square the max side length for area."
    ]
  },
  {
    "id": "ch_flood_fill",
    "title": "Flood Fill Pixel Replacement",
    "difficulty": "Easy",
    "category": "Graphs",
    "description": "An image is represented by an `m x n` integer grid `image` where `image[i][j]` represents the pixel value of the image.\n\nYou are also given three integers `sr`, `sc`, and `color`. You should perform a flood fill on the image starting from the pixel `image[sr][sc]`. Return the count of pixels whose color was changed.",
    "constraints": [
      "m == image.length",
      "n == image[i].length",
      "1 <= m, n <= 50",
      "0 <= image[i][j], color < 65536",
      "0 <= sr < m",
      "0 <= sc < n"
    ],
    "inputFormat": "Line 1: Two integers m and n\nFollowing m lines: n space-separated integers\nLast line: Three integers sr sc color",
    "outputFormat": "Number of modified pixels as integer",
    "hints": [
      "Find starting pixel's original color.",
      "If original color equals new color, return 0.",
      "Run DFS or BFS in 4 directions to color connected component, counting filled pixels."
    ],
    "examples": [
      {
        "input": "3 3\n1 1 1\n1 1 0\n1 0 1\n1 1 2",
        "output": "6",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "2 2\n0 0\n0 0\n0 0 0",
        "output": "0",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "3 3\n1 1 1\n1 1 0\n1 0 1\n1 1 2",
        "expectedOutput": "6",
        "isHidden": false
      },
      {
        "input": "2 2\n0 0\n0 0\n0 0 0",
        "expectedOutput": "0",
        "isHidden": false
      },
      {
        "input": "1 1\n5\n0 0 7",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "3 3\n1 2 3\n4 5 6\n7 8 9\n1 1 0",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "2 3\n1 1 1\n2 2 2\n0 0 3",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "3 3\n0 0 0\n0 1 0\n0 0 0\n1 1 2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "4 4\n1 1 2 2\n1 1 2 2\n3 3 4 4\n3 3 4 4\n0 0 9",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "2 2\n1 0\n0 1\n0 0 2",
        "expectedOutput": "1",
        "isHidden": true
      },
      {
        "input": "3 1\n1\n1\n1\n0 0 5",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1 3\n2 2 2\n0 1 8",
        "expectedOutput": "3",
        "isHidden": true
      }
    ],
    "objective": "Execute flood fill traversal and count modified grid pixels.",
    "conceptualExplanation": [
      "Check if start pixel already equals new color.",
      "DFS across connected 4-directional neighbours with original color.",
      "Return total modified pixel count."
    ]
  },
  {
    "id": "ch_pacific_atlantic",
    "title": "Pacific Atlantic Water Flow Count",
    "difficulty": "Medium",
    "category": "Graphs",
    "description": "There is an `m x n` rectangular island that borders both the Pacific Ocean and Atlantic Ocean. The Pacific Ocean touches the island's left and top edges, and the Atlantic Ocean touches the island's right and bottom edges.\n\nThe island is partitioned into a grid of square cells. You are given an `m x n` integer matrix `heights` where `heights[r][c]` represents the height above sea level of the cell at coordinate `(r, c)`.\n\nWater can flow in 4 directions to neighboring cells of equal or lower height. Return the count of grid coordinates from which water can flow to both oceans.",
    "constraints": [
      "m == heights.length",
      "n == heights[r].length",
      "1 <= m, n <= 200",
      "0 <= heights[r][c] <= 10^5"
    ],
    "inputFormat": "Line 1: Two integers m and n\nFollowing m lines: n space-separated heights",
    "outputFormat": "Count of coordinates that flow to both oceans",
    "hints": [
      "Reverse thinking: start DFS from the oceans inward to higher or equal cells.",
      "Run DFS from Pacific borders (top row, left column).",
      "Run DFS from Atlantic borders (bottom row, right column).",
      "Count cells reachable in both traversals."
    ],
    "examples": [
      {
        "input": "5 5\n1 2 2 3 5\n3 2 3 4 4\n2 4 5 3 1\n6 7 1 4 5\n5 1 1 2 4",
        "output": "7",
        "explanation": "Test case 1 verifies correct execution with sample input."
      },
      {
        "input": "1 1\n1",
        "output": "1",
        "explanation": "Test case 2 tests edge case handling."
      }
    ],
    "starterCode": {
      "cpp": "// Enter your code below\n",
      "python": "# Enter your code below\n",
      "javascript": "// Enter your code below\n",
      "java": "// Enter your code below\n"
    },
    "testCases": [
      {
        "input": "5 5\n1 2 2 3 5\n3 2 3 4 4\n2 4 5 3 1\n6 7 1 4 5\n5 1 1 2 4",
        "expectedOutput": "7",
        "isHidden": false
      },
      {
        "input": "1 1\n1",
        "expectedOutput": "1",
        "isHidden": false
      },
      {
        "input": "2 2\n1 1\n1 1",
        "expectedOutput": "4",
        "isHidden": false
      },
      {
        "input": "3 3\n1 2 3\n8 9 4\n7 6 5",
        "expectedOutput": "7",
        "isHidden": true
      },
      {
        "input": "2 3\n1 2 3\n4 5 6",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "3 1\n1\n2\n3",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "1 3\n3 2 1",
        "expectedOutput": "3",
        "isHidden": true
      },
      {
        "input": "3 3\n10 10 10\n10 1 10\n10 10 10",
        "expectedOutput": "8",
        "isHidden": true
      },
      {
        "input": "2 2\n2 1\n1 2",
        "expectedOutput": "4",
        "isHidden": true
      },
      {
        "input": "4 4\n1 1 1 1\n1 2 2 1\n1 2 2 1\n1 1 1 1",
        "expectedOutput": "16",
        "isHidden": true
      }
    ],
    "objective": "Count cells with drainage paths to both oceans.",
    "conceptualExplanation": [
      "DFS from borders towards higher or equal neighbors.",
      "pacific[r][c] tracks reachability to Pacific.",
      "atlantic[r][c] tracks reachability to Atlantic.",
      "Count cells where both are true."
    ]
  }
];

module.exports = CHALLENGES_CATALOG;
