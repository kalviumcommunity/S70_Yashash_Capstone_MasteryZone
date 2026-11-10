/**
 * MASTERY ZONE AUTHORITATIVE PROBLEM EXECUTION REGISTRY
 * Explicit, validated problem execution configurations mapping problem IDs
 * to their authoritative function/method names and execution contracts.
 * 
 * Strictly replaces runtime regex guessing or prompt parsing.
 */

const PROBLEM_EXECUTION_REGISTRY = {
  "py_mod_0": {
    "functionName": "filter_and_square",
    "executionType": "function"
  },
  "py_mod_1": {
    "functionName": "process_words",
    "executionType": "hybrid"
  },
  "py_mod_2": {
    "functionName": "run_bank_account",
    "executionType": "hybrid"
  },
  "py_mod_3": {
    "functionName": "safe_json_parser",
    "executionType": "function"
  },
  "py_mod_4": {
    "functionName": "top_k_frequent",
    "executionType": "hybrid"
  },
  "js_mod_0": {
    "functionName": "deepClone",
    "executionType": "function"
  },
  "js_mod_1": {
    "functionName": "memoize",
    "executionType": "function"
  },
  "js_mod_2": {
    "functionName": "allPromises",
    "executionType": "function"
  },
  "js_mod_3": {
    "functionName": "parseQueryParams",
    "executionType": "function"
  },
  "js_mod_4": {
    "functionName": "groupBy",
    "executionType": "function"
  },
  "java_mod_0": {
    "functionName": "wordFrequency",
    "executionType": "stdin"
  },
  "java_mod_1": {
    "functionName": "totalArea",
    "executionType": "stdin"
  },
  "java_mod_2": {
    "functionName": "firstUniqChar",
    "executionType": "hybrid"
  },
  "java_mod_3": {
    "functionName": "safeDivide",
    "executionType": "stdin"
  },
  "java_mod_4": {
    "functionName": "filterAndSum",
    "executionType": "stdin"
  },
  "cpp_mod_0": {
    "functionName": "reverseArray",
    "executionType": "stdin"
  },
  "cpp_mod_1": {
    "functionName": "intBufferSum",
    "executionType": "stdin"
  },
  "cpp_mod_2": {
    "functionName": "transferStrings",
    "executionType": "stdin"
  },
  "cpp_mod_3": {
    "functionName": "filterAndSort",
    "executionType": "stdin"
  },
  "web_mod_0": {
    "functionName": "parseHeaders",
    "executionType": "function"
  },
  "web_mod_1": {
    "functionName": "clamp",
    "executionType": "function"
  },
  "web_mod_2": {
    "functionName": "stateReducer",
    "executionType": "function"
  },
  "web_mod_3": {
    "functionName": "parseJwtPayload",
    "executionType": "function"
  },
  "dsa_mod_0": {
    "functionName": "checkSortedPairSum",
    "executionType": "function"
  },
  "dsa_mod_1": {
    "functionName": "lengthOfLongestSubstring",
    "executionType": "function"
  },
  "dsa_mod_2": {
    "functionName": "isValid",
    "executionType": "function"
  },
  "dsa_mod_3": {
    "functionName": "maxDepth",
    "executionType": "function"
  },
  "dsa_mod_4": {
    "functionName": "searchRange",
    "executionType": "function"
  },
  "ch_tight_bound": {
    "functionName": "tightBound",
    "executionType": "hybrid"
  },
  "tight_bound": {
    "functionName": "tightBound",
    "executionType": "hybrid"
  },
  "ch_two_sum": {
    "functionName": "twoSum",
    "executionType": "hybrid"
  },
  "two_sum": {
    "functionName": "twoSum",
    "executionType": "hybrid"
  },
  "ch_valid_parentheses": {
    "functionName": "isValid",
    "executionType": "hybrid"
  },
  "valid_parentheses": {
    "functionName": "isValid",
    "executionType": "hybrid"
  },
  "ch_palindrome": {
    "functionName": "isPalindrome",
    "executionType": "hybrid"
  },
  "palindrome": {
    "functionName": "isPalindrome",
    "executionType": "hybrid"
  },
  "ch_max_subarray": {
    "functionName": "maxSubArray",
    "executionType": "hybrid"
  },
  "max_subarray": {
    "functionName": "maxSubArray",
    "executionType": "hybrid"
  },
  "ch_best_time_stock": {
    "functionName": "maxProfit",
    "executionType": "hybrid"
  },
  "best_time_stock": {
    "functionName": "maxProfit",
    "executionType": "hybrid"
  },
  "ch_product_except_self": {
    "functionName": "productExceptSelf",
    "executionType": "hybrid"
  },
  "product_except_self": {
    "functionName": "productExceptSelf",
    "executionType": "hybrid"
  },
  "ch_rotate_array": {
    "functionName": "rotate",
    "executionType": "hybrid"
  },
  "rotate_array": {
    "functionName": "rotate",
    "executionType": "hybrid"
  },
  "ch_merge_sorted_arrays": {
    "functionName": "merge",
    "executionType": "hybrid"
  },
  "merge_sorted_arrays": {
    "functionName": "merge",
    "executionType": "hybrid"
  },
  "ch_longest_common_prefix": {
    "functionName": "longestCommonPrefix",
    "executionType": "hybrid"
  },
  "longest_common_prefix": {
    "functionName": "longestCommonPrefix",
    "executionType": "hybrid"
  },
  "ch_valid_anagram": {
    "functionName": "isAnagram",
    "executionType": "hybrid"
  },
  "valid_anagram": {
    "functionName": "isAnagram",
    "executionType": "hybrid"
  },
  "ch_string_compression": {
    "functionName": "compress",
    "executionType": "hybrid"
  },
  "string_compression": {
    "functionName": "compress",
    "executionType": "hybrid"
  },
  "ch_roman_to_integer": {
    "functionName": "romanToInt",
    "executionType": "hybrid"
  },
  "roman_to_integer": {
    "functionName": "romanToInt",
    "executionType": "hybrid"
  },
  "ch_group_anagrams": {
    "functionName": "groupAnagrams",
    "executionType": "hybrid"
  },
  "group_anagrams": {
    "functionName": "groupAnagrams",
    "executionType": "hybrid"
  },
  "ch_longest_consecutive_seq": {
    "functionName": "longestConsecutive",
    "executionType": "hybrid"
  },
  "longest_consecutive_seq": {
    "functionName": "longestConsecutive",
    "executionType": "hybrid"
  },
  "ch_subarray_sum_k": {
    "functionName": "subarraySum",
    "executionType": "hybrid"
  },
  "subarray_sum_k": {
    "functionName": "subarraySum",
    "executionType": "hybrid"
  },
  "ch_first_unique_char": {
    "functionName": "firstUniqChar",
    "executionType": "hybrid"
  },
  "first_unique_char": {
    "functionName": "firstUniqChar",
    "executionType": "hybrid"
  },
  "ch_container_water": {
    "functionName": "maxArea",
    "executionType": "hybrid"
  },
  "container_water": {
    "functionName": "maxArea",
    "executionType": "hybrid"
  },
  "ch_three_sum": {
    "functionName": "threeSum",
    "executionType": "hybrid"
  },
  "three_sum": {
    "functionName": "threeSum",
    "executionType": "hybrid"
  },
  "ch_trapping_rain_water": {
    "functionName": "trap",
    "executionType": "hybrid"
  },
  "trapping_rain_water": {
    "functionName": "trap",
    "executionType": "hybrid"
  },
  "ch_move_zeroes": {
    "functionName": "moveZeroes",
    "executionType": "hybrid"
  },
  "move_zeroes": {
    "functionName": "moveZeroes",
    "executionType": "hybrid"
  },
  "ch_longest_substr_no_repeat": {
    "functionName": "lengthOfLongestSubstring",
    "executionType": "hybrid"
  },
  "longest_substr_no_repeat": {
    "functionName": "lengthOfLongestSubstring",
    "executionType": "hybrid"
  },
  "ch_min_window_substring": {
    "functionName": "minWindow",
    "executionType": "hybrid"
  },
  "min_window_substring": {
    "functionName": "minWindow",
    "executionType": "hybrid"
  },
  "ch_max_avg_subarray": {
    "functionName": "findMaxAverage",
    "executionType": "hybrid"
  },
  "max_avg_subarray": {
    "functionName": "findMaxAverage",
    "executionType": "hybrid"
  },
  "ch_longest_repeating_char_replace": {
    "functionName": "characterReplacement",
    "executionType": "hybrid"
  },
  "longest_repeating_char_replace": {
    "functionName": "characterReplacement",
    "executionType": "hybrid"
  },
  "ch_min_stack": {
    "functionName": "minStack",
    "executionType": "hybrid"
  },
  "min_stack": {
    "functionName": "minStack",
    "executionType": "hybrid"
  },
  "ch_daily_temperatures": {
    "functionName": "dailyTemperatures",
    "executionType": "hybrid"
  },
  "daily_temperatures": {
    "functionName": "dailyTemperatures",
    "executionType": "hybrid"
  },
  "ch_eval_rpn": {
    "functionName": "evalRPN",
    "executionType": "hybrid"
  },
  "eval_rpn": {
    "functionName": "evalRPN",
    "executionType": "hybrid"
  },
  "ch_next_greater_elem": {
    "functionName": "nextGreaterElement",
    "executionType": "hybrid"
  },
  "next_greater_elem": {
    "functionName": "nextGreaterElement",
    "executionType": "hybrid"
  },
  "ch_queue_using_stacks": {
    "functionName": "queueUsingStacks",
    "executionType": "hybrid"
  },
  "queue_using_stacks": {
    "functionName": "queueUsingStacks",
    "executionType": "hybrid"
  },
  "ch_sliding_window_max": {
    "functionName": "maxSlidingWindow",
    "executionType": "hybrid"
  },
  "sliding_window_max": {
    "functionName": "maxSlidingWindow",
    "executionType": "hybrid"
  },
  "ch_first_unique_stream": {
    "functionName": "firstUniqueStream",
    "executionType": "hybrid"
  },
  "first_unique_stream": {
    "functionName": "firstUniqueStream",
    "executionType": "hybrid"
  },
  "ch_circular_queue": {
    "functionName": "circularQueue",
    "executionType": "hybrid"
  },
  "circular_queue": {
    "functionName": "circularQueue",
    "executionType": "hybrid"
  },
  "ch_reverse_linked_list": {
    "functionName": "reverseList",
    "executionType": "hybrid"
  },
  "reverse_linked_list": {
    "functionName": "reverseList",
    "executionType": "hybrid"
  },
  "ch_merge_two_sorted_lists": {
    "functionName": "mergeTwoLists",
    "executionType": "hybrid"
  },
  "merge_two_sorted_lists": {
    "functionName": "mergeTwoLists",
    "executionType": "hybrid"
  },
  "ch_linked_list_cycle": {
    "functionName": "hasCycle",
    "executionType": "hybrid"
  },
  "linked_list_cycle": {
    "functionName": "hasCycle",
    "executionType": "hybrid"
  },
  "ch_remove_nth_from_end": {
    "functionName": "removeNthFromEnd",
    "executionType": "hybrid"
  },
  "remove_nth_from_end": {
    "functionName": "removeNthFromEnd",
    "executionType": "hybrid"
  },
  "ch_power_of_two": {
    "functionName": "isPowerOfTwo",
    "executionType": "hybrid"
  },
  "power_of_two": {
    "functionName": "isPowerOfTwo",
    "executionType": "hybrid"
  },
  "ch_generate_parentheses": {
    "functionName": "generateParenthesis",
    "executionType": "hybrid"
  },
  "generate_parentheses": {
    "functionName": "generateParenthesis",
    "executionType": "hybrid"
  },
  "ch_combination_sum": {
    "functionName": "combinationSum",
    "executionType": "hybrid"
  },
  "combination_sum": {
    "functionName": "combinationSum",
    "executionType": "hybrid"
  },
  "ch_subsets": {
    "functionName": "subsets",
    "executionType": "hybrid"
  },
  "subsets": {
    "functionName": "subsets",
    "executionType": "hybrid"
  },
  "ch_binary_search": {
    "functionName": "search",
    "executionType": "hybrid"
  },
  "binary_search": {
    "functionName": "search",
    "executionType": "hybrid"
  },
  "ch_search_rotated_array": {
    "functionName": "search",
    "executionType": "hybrid"
  },
  "search_rotated_array": {
    "functionName": "search",
    "executionType": "hybrid"
  },
  "ch_find_min_rotated": {
    "functionName": "findMin",
    "executionType": "hybrid"
  },
  "find_min_rotated": {
    "functionName": "findMin",
    "executionType": "hybrid"
  },
  "ch_find_peak_element": {
    "functionName": "findPeakElement",
    "executionType": "hybrid"
  },
  "find_peak_element": {
    "functionName": "findPeakElement",
    "executionType": "hybrid"
  },
  "ch_merge_intervals": {
    "functionName": "merge",
    "executionType": "hybrid"
  },
  "merge_intervals": {
    "functionName": "merge",
    "executionType": "hybrid"
  },
  "ch_sort_colors": {
    "functionName": "sortColors",
    "executionType": "hybrid"
  },
  "sort_colors": {
    "functionName": "sortColors",
    "executionType": "hybrid"
  },
  "ch_kth_largest_array": {
    "functionName": "findKthLargest",
    "executionType": "hybrid"
  },
  "kth_largest_array": {
    "functionName": "findKthLargest",
    "executionType": "hybrid"
  },
  "ch_non_overlapping_intervals": {
    "functionName": "nonOverlappingIntervals",
    "executionType": "hybrid"
  },
  "non_overlapping_intervals": {
    "functionName": "nonOverlappingIntervals",
    "executionType": "hybrid"
  },
  "ch_invert_binary_tree": {
    "functionName": "invertTree",
    "executionType": "hybrid"
  },
  "invert_binary_tree": {
    "functionName": "invertTree",
    "executionType": "hybrid"
  },
  "ch_max_depth_binary_tree": {
    "functionName": "maxDepth",
    "executionType": "hybrid"
  },
  "max_depth_binary_tree": {
    "functionName": "maxDepth",
    "executionType": "hybrid"
  },
  "ch_validate_bst": {
    "functionName": "isValidBST",
    "executionType": "hybrid"
  },
  "validate_bst": {
    "functionName": "isValidBST",
    "executionType": "hybrid"
  },
  "ch_lca_binary_tree": {
    "functionName": "lowestCommonAncestor",
    "executionType": "hybrid"
  },
  "lca_binary_tree": {
    "functionName": "lowestCommonAncestor",
    "executionType": "hybrid"
  },
  "ch_number_of_islands": {
    "functionName": "numIslands",
    "executionType": "hybrid"
  },
  "number_of_islands": {
    "functionName": "numIslands",
    "executionType": "hybrid"
  },
  "ch_clone_graph": {
    "functionName": "cloneGraph",
    "executionType": "hybrid"
  },
  "clone_graph": {
    "functionName": "cloneGraph",
    "executionType": "hybrid"
  },
  "ch_course_schedule": {
    "functionName": "canFinish",
    "executionType": "hybrid"
  },
  "course_schedule": {
    "functionName": "canFinish",
    "executionType": "hybrid"
  },
  "ch_rotting_oranges": {
    "functionName": "orangesRotting",
    "executionType": "hybrid"
  },
  "rotting_oranges": {
    "functionName": "orangesRotting",
    "executionType": "hybrid"
  },
  "ch_jump_game": {
    "functionName": "canJump",
    "executionType": "hybrid"
  },
  "jump_game": {
    "functionName": "canJump",
    "executionType": "hybrid"
  },
  "ch_gas_station": {
    "functionName": "gasStation",
    "executionType": "hybrid"
  },
  "gas_station": {
    "functionName": "gasStation",
    "executionType": "hybrid"
  },
  "ch_assign_cookies": {
    "functionName": "assignCookies",
    "executionType": "hybrid"
  },
  "assign_cookies": {
    "functionName": "assignCookies",
    "executionType": "hybrid"
  },
  "ch_partition_labels": {
    "functionName": "partitionLabels",
    "executionType": "hybrid"
  },
  "partition_labels": {
    "functionName": "partitionLabels",
    "executionType": "hybrid"
  },
  "ch_climbing_stairs": {
    "functionName": "climbStairs",
    "executionType": "hybrid"
  },
  "climbing_stairs": {
    "functionName": "climbStairs",
    "executionType": "hybrid"
  },
  "ch_coin_change": {
    "functionName": "coinChange",
    "executionType": "hybrid"
  },
  "coin_change": {
    "functionName": "coinChange",
    "executionType": "hybrid"
  },
  "ch_longest_increasing_subseq": {
    "functionName": "lengthOfLIS",
    "executionType": "hybrid"
  },
  "longest_increasing_subseq": {
    "functionName": "lengthOfLIS",
    "executionType": "hybrid"
  },
  "ch_house_robber": {
    "functionName": "houseRobber",
    "executionType": "hybrid"
  },
  "house_robber": {
    "functionName": "houseRobber",
    "executionType": "hybrid"
  },
  "ch_single_num": {
    "functionName": "singleNum",
    "executionType": "hybrid"
  },
  "single_num": {
    "functionName": "singleNum",
    "executionType": "hybrid"
  },
  "ch_counting_bits": {
    "functionName": "countingBits",
    "executionType": "hybrid"
  },
  "counting_bits": {
    "functionName": "countingBits",
    "executionType": "hybrid"
  },
  "ch_hamming_dist": {
    "functionName": "hammingDist",
    "executionType": "hybrid"
  },
  "hamming_dist": {
    "functionName": "hammingDist",
    "executionType": "hybrid"
  },
  "ch_reverse_bits": {
    "functionName": "reverseBits",
    "executionType": "hybrid"
  },
  "reverse_bits": {
    "functionName": "reverseBits",
    "executionType": "hybrid"
  },
  "ch_power_of_four": {
    "functionName": "powerOfFour",
    "executionType": "hybrid"
  },
  "power_of_four": {
    "functionName": "powerOfFour",
    "executionType": "hybrid"
  },
  "ch_bitwise_and_range": {
    "functionName": "bitwiseAndRange",
    "executionType": "hybrid"
  },
  "bitwise_and_range": {
    "functionName": "bitwiseAndRange",
    "executionType": "hybrid"
  },
  "ch_sum_two_integers": {
    "functionName": "sumTwoIntegers",
    "executionType": "hybrid"
  },
  "sum_two_integers": {
    "functionName": "sumTwoIntegers",
    "executionType": "hybrid"
  },
  "ch_valid_pal_ii": {
    "functionName": "validPalIi",
    "executionType": "hybrid"
  },
  "valid_pal_ii": {
    "functionName": "validPalIi",
    "executionType": "hybrid"
  },
  "ch_two_sum_sorted": {
    "functionName": "twoSumSorted",
    "executionType": "hybrid"
  },
  "two_sum_sorted": {
    "functionName": "twoSumSorted",
    "executionType": "hybrid"
  },
  "ch_reverse_vowels": {
    "functionName": "reverseVowels",
    "executionType": "hybrid"
  },
  "reverse_vowels": {
    "functionName": "reverseVowels",
    "executionType": "hybrid"
  },
  "ch_remove_duplicates_sorted": {
    "functionName": "removeDuplicatesSorted",
    "executionType": "hybrid"
  },
  "remove_duplicates_sorted": {
    "functionName": "removeDuplicatesSorted",
    "executionType": "hybrid"
  },
  "ch_is_subsequence": {
    "functionName": "isSubsequence",
    "executionType": "hybrid"
  },
  "is_subsequence": {
    "functionName": "isSubsequence",
    "executionType": "hybrid"
  },
  "ch_backspace_compare": {
    "functionName": "backspaceCompare",
    "executionType": "hybrid"
  },
  "backspace_compare": {
    "functionName": "backspaceCompare",
    "executionType": "hybrid"
  },
  "ch_squares_sorted_array": {
    "functionName": "squaresSortedArray",
    "executionType": "hybrid"
  },
  "squares_sorted_array": {
    "functionName": "squaresSortedArray",
    "executionType": "hybrid"
  },
  "ch_min_size_subarray": {
    "functionName": "minSizeSubarray",
    "executionType": "hybrid"
  },
  "min_size_subarray": {
    "functionName": "minSizeSubarray",
    "executionType": "hybrid"
  },
  "ch_fruit_into_baskets": {
    "functionName": "fruitIntoBaskets",
    "executionType": "hybrid"
  },
  "fruit_into_baskets": {
    "functionName": "fruitIntoBaskets",
    "executionType": "hybrid"
  },
  "ch_longest_ones_flip": {
    "functionName": "longestOnesFlip",
    "executionType": "hybrid"
  },
  "longest_ones_flip": {
    "functionName": "longestOnesFlip",
    "executionType": "hybrid"
  },
  "ch_sub_k_distinct": {
    "functionName": "subKDistinct",
    "executionType": "hybrid"
  },
  "sub_k_distinct": {
    "functionName": "subKDistinct",
    "executionType": "hybrid"
  },
  "ch_permutation_in_string": {
    "functionName": "permutationInString",
    "executionType": "hybrid"
  },
  "permutation_in_string": {
    "functionName": "permutationInString",
    "executionType": "hybrid"
  },
  "ch_find_all_anagrams": {
    "functionName": "findAllAnagrams",
    "executionType": "hybrid"
  },
  "find_all_anagrams": {
    "functionName": "findAllAnagrams",
    "executionType": "hybrid"
  },
  "ch_insert_interval": {
    "functionName": "insertInterval",
    "executionType": "hybrid"
  },
  "insert_interval": {
    "functionName": "insertInterval",
    "executionType": "hybrid"
  },
  "ch_min_meeting_rooms": {
    "functionName": "minMeetingRooms",
    "executionType": "hybrid"
  },
  "min_meeting_rooms": {
    "functionName": "minMeetingRooms",
    "executionType": "hybrid"
  },
  "ch_meeting_rooms_can_attend": {
    "functionName": "meetingRoomsCanAttend",
    "executionType": "hybrid"
  },
  "meeting_rooms_can_attend": {
    "functionName": "meetingRoomsCanAttend",
    "executionType": "hybrid"
  },
  "ch_interval_intersection": {
    "functionName": "intervalIntersection",
    "executionType": "hybrid"
  },
  "interval_intersection": {
    "functionName": "intervalIntersection",
    "executionType": "hybrid"
  },
  "ch_teemo_attacking": {
    "functionName": "teemoAttacking",
    "executionType": "hybrid"
  },
  "teemo_attacking": {
    "functionName": "teemoAttacking",
    "executionType": "hybrid"
  },
  "ch_baseball_game": {
    "functionName": "baseballGame",
    "executionType": "hybrid"
  },
  "baseball_game": {
    "functionName": "baseballGame",
    "executionType": "hybrid"
  },
  "ch_remove_adjacent_duplicates": {
    "functionName": "removeAdjacentDuplicates",
    "executionType": "hybrid"
  },
  "remove_adjacent_duplicates": {
    "functionName": "removeAdjacentDuplicates",
    "executionType": "hybrid"
  },
  "ch_largest_rect_hist": {
    "functionName": "largestRectHist",
    "executionType": "hybrid"
  },
  "largest_rect_hist": {
    "functionName": "largestRectHist",
    "executionType": "hybrid"
  },
  "ch_asteroid_collision": {
    "functionName": "asteroidCollision",
    "executionType": "hybrid"
  },
  "asteroid_collision": {
    "functionName": "asteroidCollision",
    "executionType": "hybrid"
  },
  "ch_simplify_path": {
    "functionName": "simplifyPath",
    "executionType": "hybrid"
  },
  "simplify_path": {
    "functionName": "simplifyPath",
    "executionType": "hybrid"
  },
  "ch_decode_string": {
    "functionName": "decodeString",
    "executionType": "hybrid"
  },
  "decode_string": {
    "functionName": "decodeString",
    "executionType": "hybrid"
  },
  "ch_search_insert_position": {
    "functionName": "searchInsertPosition",
    "executionType": "hybrid"
  },
  "search_insert_position": {
    "functionName": "searchInsertPosition",
    "executionType": "hybrid"
  },
  "ch_first_last_position": {
    "functionName": "firstLastPosition",
    "executionType": "hybrid"
  },
  "first_last_position": {
    "functionName": "firstLastPosition",
    "executionType": "hybrid"
  },
  "ch_sqrt_x": {
    "functionName": "sqrtX",
    "executionType": "hybrid"
  },
  "sqrt_x": {
    "functionName": "sqrtX",
    "executionType": "hybrid"
  },
  "ch_koko_bananas": {
    "functionName": "kokoBananas",
    "executionType": "hybrid"
  },
  "koko_bananas": {
    "functionName": "kokoBananas",
    "executionType": "hybrid"
  },
  "ch_ship_packages": {
    "functionName": "shipPackages",
    "executionType": "hybrid"
  },
  "ship_packages": {
    "functionName": "shipPackages",
    "executionType": "hybrid"
  },
  "ch_find_k_closest": {
    "functionName": "findKClosest",
    "executionType": "hybrid"
  },
  "find_k_closest": {
    "functionName": "findKClosest",
    "executionType": "hybrid"
  },
  "ch_middle_linked_list": {
    "functionName": "middleLinkedList",
    "executionType": "hybrid"
  },
  "middle_linked_list": {
    "functionName": "middleLinkedList",
    "executionType": "hybrid"
  },
  "ch_palindrome_linked_list": {
    "functionName": "palindromeLinkedList",
    "executionType": "hybrid"
  },
  "palindrome_linked_list": {
    "functionName": "palindromeLinkedList",
    "executionType": "hybrid"
  },
  "ch_remove_linked_list_elements": {
    "functionName": "removeLinkedListElements",
    "executionType": "hybrid"
  },
  "remove_linked_list_elements": {
    "functionName": "removeLinkedListElements",
    "executionType": "hybrid"
  },
  "ch_odd_even_linked_list": {
    "functionName": "oddEvenLinkedList",
    "executionType": "hybrid"
  },
  "odd_even_linked_list": {
    "functionName": "oddEvenLinkedList",
    "executionType": "hybrid"
  },
  "ch_add_two_numbers_list": {
    "functionName": "addTwoNumbersList",
    "executionType": "hybrid"
  },
  "add_two_numbers_list": {
    "functionName": "addTwoNumbersList",
    "executionType": "hybrid"
  },
  "ch_same_tree": {
    "functionName": "sameTree",
    "executionType": "hybrid"
  },
  "same_tree": {
    "functionName": "sameTree",
    "executionType": "hybrid"
  },
  "ch_symmetric_tree": {
    "functionName": "symmetricTree",
    "executionType": "hybrid"
  },
  "symmetric_tree": {
    "functionName": "symmetricTree",
    "executionType": "hybrid"
  },
  "ch_diameter_of_binary_tree": {
    "functionName": "diameterOfBinaryTree",
    "executionType": "hybrid"
  },
  "diameter_of_binary_tree": {
    "functionName": "diameterOfBinaryTree",
    "executionType": "hybrid"
  },
  "ch_path_sum": {
    "functionName": "pathSum",
    "executionType": "hybrid"
  },
  "path_sum": {
    "functionName": "pathSum",
    "executionType": "hybrid"
  },
  "ch_level_order_traversal": {
    "functionName": "levelOrderTraversal",
    "executionType": "hybrid"
  },
  "level_order_traversal": {
    "functionName": "levelOrderTraversal",
    "executionType": "hybrid"
  },
  "ch_kth_smallest_bst": {
    "functionName": "kthSmallestBst",
    "executionType": "hybrid"
  },
  "kth_smallest_bst": {
    "functionName": "kthSmallestBst",
    "executionType": "hybrid"
  },
  "ch_last_stone_weight": {
    "functionName": "lastStoneWeight",
    "executionType": "hybrid"
  },
  "last_stone_weight": {
    "functionName": "lastStoneWeight",
    "executionType": "hybrid"
  },
  "ch_top_k_frequent": {
    "functionName": "topKFrequent",
    "executionType": "hybrid"
  },
  "top_k_frequent": {
    "functionName": "topKFrequent",
    "executionType": "hybrid"
  },
  "ch_find_median_stream": {
    "functionName": "findMedianStream",
    "executionType": "hybrid"
  },
  "find_median_stream": {
    "functionName": "findMedianStream",
    "executionType": "hybrid"
  },
  "ch_task_scheduler": {
    "functionName": "taskScheduler",
    "executionType": "hybrid"
  },
  "task_scheduler": {
    "functionName": "taskScheduler",
    "executionType": "hybrid"
  },
  "ch_reorganize_string": {
    "functionName": "reorganizeString",
    "executionType": "hybrid"
  },
  "reorganize_string": {
    "functionName": "reorganizeString",
    "executionType": "hybrid"
  },
  "ch_permutations_array": {
    "functionName": "permutationsArray",
    "executionType": "hybrid"
  },
  "permutations_array": {
    "functionName": "permutationsArray",
    "executionType": "hybrid"
  },
  "ch_combinations_k_of_n": {
    "functionName": "combinationsKOfN",
    "executionType": "hybrid"
  },
  "combinations_k_of_n": {
    "functionName": "combinationsKOfN",
    "executionType": "hybrid"
  },
  "ch_letter_combos_phone": {
    "functionName": "letterCombosPhone",
    "executionType": "hybrid"
  },
  "letter_combos_phone": {
    "functionName": "letterCombosPhone",
    "executionType": "hybrid"
  },
  "ch_palindrome_partitioning": {
    "functionName": "palindromePartitioning",
    "executionType": "hybrid"
  },
  "palindrome_partitioning": {
    "functionName": "palindromePartitioning",
    "executionType": "hybrid"
  },
  "ch_n_queens_solutions": {
    "functionName": "nQueensSolutions",
    "executionType": "hybrid"
  },
  "n_queens_solutions": {
    "functionName": "nQueensSolutions",
    "executionType": "hybrid"
  },
  "ch_min_cost_climbing_stairs": {
    "functionName": "minCostClimbingStairs",
    "executionType": "hybrid"
  },
  "min_cost_climbing_stairs": {
    "functionName": "minCostClimbingStairs",
    "executionType": "hybrid"
  },
  "ch_tribonacci_number": {
    "functionName": "tribonacciNumber",
    "executionType": "hybrid"
  },
  "tribonacci_number": {
    "functionName": "tribonacciNumber",
    "executionType": "hybrid"
  },
  "ch_house_robber_ii": {
    "functionName": "houseRobberIi",
    "executionType": "hybrid"
  },
  "house_robber_ii": {
    "functionName": "houseRobberIi",
    "executionType": "hybrid"
  },
  "ch_decode_ways": {
    "functionName": "decodeWays",
    "executionType": "hybrid"
  },
  "decode_ways": {
    "functionName": "decodeWays",
    "executionType": "hybrid"
  },
  "ch_word_break_dict": {
    "functionName": "wordBreakDict",
    "executionType": "hybrid"
  },
  "word_break_dict": {
    "functionName": "wordBreakDict",
    "executionType": "hybrid"
  },
  "ch_unique_paths_grid": {
    "functionName": "uniquePathsGrid",
    "executionType": "hybrid"
  },
  "unique_paths_grid": {
    "functionName": "uniquePathsGrid",
    "executionType": "hybrid"
  },
  "ch_min_path_sum": {
    "functionName": "minPathSum",
    "executionType": "hybrid"
  },
  "min_path_sum": {
    "functionName": "minPathSum",
    "executionType": "hybrid"
  },
  "ch_longest_common_subseq": {
    "functionName": "longestCommonSubseq",
    "executionType": "hybrid"
  },
  "longest_common_subseq": {
    "functionName": "longestCommonSubseq",
    "executionType": "hybrid"
  },
  "ch_edit_distance_lev": {
    "functionName": "editDistanceLev",
    "executionType": "hybrid"
  },
  "edit_distance_lev": {
    "functionName": "editDistanceLev",
    "executionType": "hybrid"
  },
  "ch_maximal_square": {
    "functionName": "maximalSquare",
    "executionType": "hybrid"
  },
  "maximal_square": {
    "functionName": "maximalSquare",
    "executionType": "hybrid"
  },
  "ch_flood_fill": {
    "functionName": "floodFill",
    "executionType": "hybrid"
  },
  "flood_fill": {
    "functionName": "floodFill",
    "executionType": "hybrid"
  },
  "ch_pacific_atlantic": {
    "functionName": "pacificAtlantic",
    "executionType": "hybrid"
  },
  "pacific_atlantic": {
    "functionName": "pacificAtlantic",
    "executionType": "hybrid"
  },
  "ch_plus_one": {
    "functionName": "plusOne",
    "executionType": "hybrid"
  },
  "plus_one": {
    "functionName": "plusOne",
    "executionType": "hybrid"
  },
  "ch_remove_element": {
    "functionName": "removeElement",
    "executionType": "hybrid"
  },
  "remove_element": {
    "functionName": "removeElement",
    "executionType": "hybrid"
  },
  "ch_majority_element": {
    "functionName": "majorityElement",
    "executionType": "hybrid"
  },
  "majority_element": {
    "functionName": "majorityElement",
    "executionType": "hybrid"
  },
  "ch_find_pivot_index": {
    "functionName": "findPivotIndex",
    "executionType": "hybrid"
  },
  "find_pivot_index": {
    "functionName": "findPivotIndex",
    "executionType": "hybrid"
  },
  "ch_running_sum": {
    "functionName": "runningSum",
    "executionType": "hybrid"
  },
  "running_sum": {
    "functionName": "runningSum",
    "executionType": "hybrid"
  },
  "ch_monotonic_array": {
    "functionName": "monotonicArray",
    "executionType": "hybrid"
  },
  "monotonic_array": {
    "functionName": "monotonicArray",
    "executionType": "hybrid"
  },
  "ch_transpose_matrix": {
    "functionName": "transposeMatrix",
    "executionType": "hybrid"
  },
  "transpose_matrix": {
    "functionName": "transposeMatrix",
    "executionType": "hybrid"
  },
  "ch_set_matrix_zeroes": {
    "functionName": "setMatrixZeroes",
    "executionType": "hybrid"
  },
  "set_matrix_zeroes": {
    "functionName": "setMatrixZeroes",
    "executionType": "hybrid"
  },
  "ch_spiral_matrix": {
    "functionName": "spiralMatrix",
    "executionType": "hybrid"
  },
  "spiral_matrix": {
    "functionName": "spiralMatrix",
    "executionType": "hybrid"
  },
  "ch_rotate_image": {
    "functionName": "rotateImage",
    "executionType": "hybrid"
  },
  "rotate_image": {
    "functionName": "rotateImage",
    "executionType": "hybrid"
  },
  "ch_diagonal_traverse": {
    "functionName": "diagonalTraverse",
    "executionType": "hybrid"
  },
  "diagonal_traverse": {
    "functionName": "diagonalTraverse",
    "executionType": "hybrid"
  },
  "ch_ransom_note": {
    "functionName": "ransomNote",
    "executionType": "hybrid"
  },
  "ransom_note": {
    "functionName": "ransomNote",
    "executionType": "hybrid"
  },
  "ch_isomorphic_strings": {
    "functionName": "isomorphicStrings",
    "executionType": "hybrid"
  },
  "isomorphic_strings": {
    "functionName": "isomorphicStrings",
    "executionType": "hybrid"
  },
  "ch_word_pattern": {
    "functionName": "wordPattern",
    "executionType": "hybrid"
  },
  "word_pattern": {
    "functionName": "wordPattern",
    "executionType": "hybrid"
  },
  "ch_reverse_words": {
    "functionName": "reverseWords",
    "executionType": "hybrid"
  },
  "reverse_words": {
    "functionName": "reverseWords",
    "executionType": "hybrid"
  },
  "ch_length_last_word": {
    "functionName": "lengthLastWord",
    "executionType": "hybrid"
  },
  "length_last_word": {
    "functionName": "lengthLastWord",
    "executionType": "hybrid"
  },
  "ch_valid_palindrome_ii": {
    "functionName": "validPalindromeIi",
    "executionType": "hybrid"
  },
  "valid_palindrome_ii": {
    "functionName": "validPalindromeIi",
    "executionType": "hybrid"
  },
  "ch_four_sum": {
    "functionName": "fourSum",
    "executionType": "hybrid"
  },
  "four_sum": {
    "functionName": "fourSum",
    "executionType": "hybrid"
  },
  "ch_max_consecutive_ones": {
    "functionName": "maxConsecutiveOnes",
    "executionType": "hybrid"
  },
  "max_consecutive_ones": {
    "functionName": "maxConsecutiveOnes",
    "executionType": "hybrid"
  },
  "ch_make_string_great": {
    "functionName": "makeStringGreat",
    "executionType": "hybrid"
  },
  "make_string_great": {
    "functionName": "makeStringGreat",
    "executionType": "hybrid"
  },
  "ch_online_stock_span": {
    "functionName": "onlineStockSpan",
    "executionType": "hybrid"
  },
  "online_stock_span": {
    "functionName": "onlineStockSpan",
    "executionType": "hybrid"
  },
  "ch_dota2_senate": {
    "functionName": "dota2Senate",
    "executionType": "hybrid"
  },
  "dota2_senate": {
    "functionName": "dota2Senate",
    "executionType": "hybrid"
  },
  "ch_moving_average": {
    "functionName": "movingAverage",
    "executionType": "hybrid"
  },
  "moving_average": {
    "functionName": "movingAverage",
    "executionType": "hybrid"
  },
  "ch_delete_node_linked_list": {
    "functionName": "deleteNodeLinkedList",
    "executionType": "hybrid"
  },
  "delete_node_linked_list": {
    "functionName": "deleteNodeLinkedList",
    "executionType": "hybrid"
  },
  "ch_remove_nth_node_end": {
    "functionName": "removeNthNodeEnd",
    "executionType": "hybrid"
  },
  "remove_nth_node_end": {
    "functionName": "removeNthNodeEnd",
    "executionType": "hybrid"
  },
  "ch_rotate_list_k": {
    "functionName": "rotateListK",
    "executionType": "hybrid"
  },
  "rotate_list_k": {
    "functionName": "rotateListK",
    "executionType": "hybrid"
  },
  "ch_swap_nodes_in_pairs": {
    "functionName": "swapNodesInPairs",
    "executionType": "hybrid"
  },
  "swap_nodes_in_pairs": {
    "functionName": "swapNodesInPairs",
    "executionType": "hybrid"
  },
  "ch_reverse_nodes_k_group": {
    "functionName": "reverseNodesKGroup",
    "executionType": "hybrid"
  },
  "reverse_nodes_k_group": {
    "functionName": "reverseNodesKGroup",
    "executionType": "hybrid"
  },
  "ch_guess_number_higher_lower": {
    "functionName": "guessNumberHigherLower",
    "executionType": "hybrid"
  },
  "guess_number_higher_lower": {
    "functionName": "guessNumberHigherLower",
    "executionType": "hybrid"
  },
  "ch_first_bad_version": {
    "functionName": "firstBadVersion",
    "executionType": "hybrid"
  },
  "first_bad_version": {
    "functionName": "firstBadVersion",
    "executionType": "hybrid"
  },
  "ch_peak_index_mountain": {
    "functionName": "peakIndexMountain",
    "executionType": "hybrid"
  },
  "peak_index_mountain": {
    "functionName": "peakIndexMountain",
    "executionType": "hybrid"
  },
  "ch_search_2d_matrix": {
    "functionName": "search2dMatrix",
    "executionType": "hybrid"
  },
  "search_2d_matrix": {
    "functionName": "search2dMatrix",
    "executionType": "hybrid"
  },
  "ch_binary_tree_paths": {
    "functionName": "binaryTreePaths",
    "executionType": "hybrid"
  },
  "binary_tree_paths": {
    "functionName": "binaryTreePaths",
    "executionType": "hybrid"
  },
  "ch_sum_root_to_leaf_numbers": {
    "functionName": "sumRootToLeafNumbers",
    "executionType": "hybrid"
  },
  "sum_root_to_leaf_numbers": {
    "functionName": "sumRootToLeafNumbers",
    "executionType": "hybrid"
  },
  "ch_path_sum_iii": {
    "functionName": "pathSumIii",
    "executionType": "hybrid"
  },
  "path_sum_iii": {
    "functionName": "pathSumIii",
    "executionType": "hybrid"
  },
  "ch_lowest_common_ancestor_bt": {
    "functionName": "lowestCommonAncestorBt",
    "executionType": "hybrid"
  },
  "lowest_common_ancestor_bt": {
    "functionName": "lowestCommonAncestorBt",
    "executionType": "hybrid"
  },
  "ch_construct_binary_tree_pre_in": {
    "functionName": "constructBinaryTreePreIn",
    "executionType": "hybrid"
  },
  "construct_binary_tree_pre_in": {
    "functionName": "constructBinaryTreePreIn",
    "executionType": "hybrid"
  },
  "ch_serialize_deserialize_bt": {
    "functionName": "serializeDeserializeBt",
    "executionType": "hybrid"
  },
  "serialize_deserialize_bt": {
    "functionName": "serializeDeserializeBt",
    "executionType": "hybrid"
  },
  "ch_implement_trie": {
    "functionName": "implementTrie",
    "executionType": "hybrid"
  },
  "implement_trie": {
    "functionName": "implementTrie",
    "executionType": "hybrid"
  },
  "ch_design_add_search_words": {
    "functionName": "designAddSearchWords",
    "executionType": "hybrid"
  },
  "design_add_search_words": {
    "functionName": "designAddSearchWords",
    "executionType": "hybrid"
  },
  "ch_k_closest_points_origin": {
    "functionName": "kClosestPointsOrigin",
    "executionType": "hybrid"
  },
  "k_closest_points_origin": {
    "functionName": "kClosestPointsOrigin",
    "executionType": "hybrid"
  },
  "ch_kth_largest_stream": {
    "functionName": "kthLargestStream",
    "executionType": "hybrid"
  },
  "kth_largest_stream": {
    "functionName": "kthLargestStream",
    "executionType": "hybrid"
  },
  "ch_task_scheduler_cooldown": {
    "functionName": "taskSchedulerCooldown",
    "executionType": "hybrid"
  },
  "task_scheduler_cooldown": {
    "functionName": "taskSchedulerCooldown",
    "executionType": "hybrid"
  },
  "ch_find_median_data_stream": {
    "functionName": "findMedianDataStream",
    "executionType": "hybrid"
  },
  "find_median_data_stream": {
    "functionName": "findMedianDataStream",
    "executionType": "hybrid"
  },
  "ch_subsets_ii": {
    "functionName": "subsetsIi",
    "executionType": "hybrid"
  },
  "subsets_ii": {
    "functionName": "subsetsIi",
    "executionType": "hybrid"
  },
  "ch_permutations_ii": {
    "functionName": "permutationsIi",
    "executionType": "hybrid"
  },
  "permutations_ii": {
    "functionName": "permutationsIi",
    "executionType": "hybrid"
  },
  "ch_combination_sum_ii": {
    "functionName": "combinationSumIi",
    "executionType": "hybrid"
  },
  "combination_sum_ii": {
    "functionName": "combinationSumIi",
    "executionType": "hybrid"
  },
  "ch_combination_sum_iii": {
    "functionName": "combinationSumIii",
    "executionType": "hybrid"
  },
  "combination_sum_iii": {
    "functionName": "combinationSumIii",
    "executionType": "hybrid"
  },
  "ch_letter_case_permutation": {
    "functionName": "letterCasePermutation",
    "executionType": "hybrid"
  },
  "letter_case_permutation": {
    "functionName": "letterCasePermutation",
    "executionType": "hybrid"
  },
  "ch_surrounded_regions": {
    "functionName": "surroundedRegions",
    "executionType": "hybrid"
  },
  "surrounded_regions": {
    "functionName": "surroundedRegions",
    "executionType": "hybrid"
  },
  "ch_course_schedule_ii": {
    "functionName": "courseScheduleIi",
    "executionType": "hybrid"
  },
  "course_schedule_ii": {
    "functionName": "courseScheduleIi",
    "executionType": "hybrid"
  },
  "ch_number_of_provinces": {
    "functionName": "numberOfProvinces",
    "executionType": "hybrid"
  },
  "number_of_provinces": {
    "functionName": "numberOfProvinces",
    "executionType": "hybrid"
  },
  "ch_redundant_connection": {
    "functionName": "redundantConnection",
    "executionType": "hybrid"
  },
  "redundant_connection": {
    "functionName": "redundantConnection",
    "executionType": "hybrid"
  },
  "ch_network_delay_time": {
    "functionName": "networkDelayTime",
    "executionType": "hybrid"
  },
  "network_delay_time": {
    "functionName": "networkDelayTime",
    "executionType": "hybrid"
  },
  "ch_cheapest_flights_k_stops": {
    "functionName": "cheapestFlightsKStops",
    "executionType": "hybrid"
  },
  "cheapest_flights_k_stops": {
    "functionName": "cheapestFlightsKStops",
    "executionType": "hybrid"
  },
  "ch_word_break": {
    "functionName": "wordBreak",
    "executionType": "hybrid"
  },
  "word_break": {
    "functionName": "wordBreak",
    "executionType": "hybrid"
  },
  "ch_longest_palindromic_subseq": {
    "functionName": "longestPalindromicSubseq",
    "executionType": "hybrid"
  },
  "longest_palindromic_subseq": {
    "functionName": "longestPalindromicSubseq",
    "executionType": "hybrid"
  },
  "ch_target_sum": {
    "functionName": "targetSum",
    "executionType": "hybrid"
  },
  "target_sum": {
    "functionName": "targetSum",
    "executionType": "hybrid"
  },
  "ch_partition_equal_subset_sum": {
    "functionName": "partitionEqualSubsetSum",
    "executionType": "hybrid"
  },
  "partition_equal_subset_sum": {
    "functionName": "partitionEqualSubsetSum",
    "executionType": "hybrid"
  },
  "ch_edit_distance": {
    "functionName": "editDistance",
    "executionType": "hybrid"
  },
  "edit_distance": {
    "functionName": "editDistance",
    "executionType": "hybrid"
  },
  "ch_burst_balloons": {
    "functionName": "burstBalloons",
    "executionType": "hybrid"
  },
  "burst_balloons": {
    "functionName": "burstBalloons",
    "executionType": "hybrid"
  },
  "ch_lemonade_change": {
    "functionName": "lemonadeChange",
    "executionType": "hybrid"
  },
  "lemonade_change": {
    "functionName": "lemonadeChange",
    "executionType": "hybrid"
  },
  "ch_gas_station_circuit": {
    "functionName": "gasStationCircuit",
    "executionType": "hybrid"
  },
  "gas_station_circuit": {
    "functionName": "gasStationCircuit",
    "executionType": "hybrid"
  },
  "ch_candy_distribution": {
    "functionName": "candyDistribution",
    "executionType": "hybrid"
  },
  "candy_distribution": {
    "functionName": "candyDistribution",
    "executionType": "hybrid"
  },
  "ch_jump_game_ii": {
    "functionName": "jumpGameIi",
    "executionType": "hybrid"
  },
  "jump_game_ii": {
    "functionName": "jumpGameIi",
    "executionType": "hybrid"
  },
  "ch_summary_ranges": {
    "functionName": "summaryRanges",
    "executionType": "hybrid"
  },
  "summary_ranges": {
    "functionName": "summaryRanges",
    "executionType": "hybrid"
  },
  "ch_single_number_iii": {
    "functionName": "singleNumberIii",
    "executionType": "hybrid"
  },
  "single_number_iii": {
    "functionName": "singleNumberIii",
    "executionType": "hybrid"
  },
  "ch_pascals_triangle": {
    "functionName": "pascalsTriangle",
    "executionType": "hybrid"
  },
  "pascals_triangle": {
    "functionName": "pascalsTriangle",
    "executionType": "hybrid"
  },
  "ch_longest_mountain": {
    "functionName": "longestMountain",
    "executionType": "hybrid"
  },
  "longest_mountain": {
    "functionName": "longestMountain",
    "executionType": "hybrid"
  },
  "ch_container_max_consecutive_ones": {
    "functionName": "containerMaxConsecutiveOnes",
    "executionType": "hybrid"
  },
  "container_max_consecutive_ones": {
    "functionName": "containerMaxConsecutiveOnes",
    "executionType": "hybrid"
  },
  "ch_valid_mountain_array": {
    "functionName": "validMountainArray",
    "executionType": "hybrid"
  },
  "valid_mountain_array": {
    "functionName": "validMountainArray",
    "executionType": "hybrid"
  },
  "ch_boats_to_save_people": {
    "functionName": "boatsToSavePeople",
    "executionType": "hybrid"
  },
  "boats_to_save_people": {
    "functionName": "boatsToSavePeople",
    "executionType": "hybrid"
  },
  "ch_string_to_integer_atoi": {
    "functionName": "stringToIntegerAtoi",
    "executionType": "hybrid"
  },
  "string_to_integer_atoi": {
    "functionName": "stringToIntegerAtoi",
    "executionType": "hybrid"
  },
  "ch_min_add_valid_parentheses": {
    "functionName": "minAddValidParentheses",
    "executionType": "hybrid"
  },
  "min_add_valid_parentheses": {
    "functionName": "minAddValidParentheses",
    "executionType": "hybrid"
  },
  "ch_score_of_parentheses": {
    "functionName": "scoreOfParentheses",
    "executionType": "hybrid"
  },
  "score_of_parentheses": {
    "functionName": "scoreOfParentheses",
    "executionType": "hybrid"
  },
  "ch_crawler_log_folder": {
    "functionName": "crawlerLogFolder",
    "executionType": "hybrid"
  },
  "crawler_log_folder": {
    "functionName": "crawlerLogFolder",
    "executionType": "hybrid"
  },
  "ch_number_of_recent_calls": {
    "functionName": "numberOfRecentCalls",
    "executionType": "hybrid"
  },
  "number_of_recent_calls": {
    "functionName": "numberOfRecentCalls",
    "executionType": "hybrid"
  },
  "ch_swapping_nodes_linked_list": {
    "functionName": "swappingNodesLinkedList",
    "executionType": "hybrid"
  },
  "swapping_nodes_linked_list": {
    "functionName": "swappingNodesLinkedList",
    "executionType": "hybrid"
  },
  "ch_split_linked_list_in_parts": {
    "functionName": "splitLinkedListInParts",
    "executionType": "hybrid"
  },
  "split_linked_list_in_parts": {
    "functionName": "splitLinkedListInParts",
    "executionType": "hybrid"
  },
  "ch_single_element_sorted_array": {
    "functionName": "singleElementSortedArray",
    "executionType": "hybrid"
  },
  "single_element_sorted_array": {
    "functionName": "singleElementSortedArray",
    "executionType": "hybrid"
  },
  "ch_find_first_bad_version": {
    "functionName": "findFirstBadVersion",
    "executionType": "hybrid"
  },
  "find_first_bad_version": {
    "functionName": "findFirstBadVersion",
    "executionType": "hybrid"
  },
  "ch_binary_tree_right_side_view": {
    "functionName": "binaryTreeRightSideView",
    "executionType": "hybrid"
  },
  "binary_tree_right_side_view": {
    "functionName": "binaryTreeRightSideView",
    "executionType": "hybrid"
  },
  "ch_count_complete_tree_nodes": {
    "functionName": "countCompleteTreeNodes",
    "executionType": "hybrid"
  },
  "count_complete_tree_nodes": {
    "functionName": "countCompleteTreeNodes",
    "executionType": "hybrid"
  },
  "ch_path_sum_ii": {
    "functionName": "pathSumIi",
    "executionType": "hybrid"
  },
  "path_sum_ii": {
    "functionName": "pathSumIi",
    "executionType": "hybrid"
  },
  "ch_maximum_width_binary_tree": {
    "functionName": "maximumWidthBinaryTree",
    "executionType": "hybrid"
  },
  "maximum_width_binary_tree": {
    "functionName": "maximumWidthBinaryTree",
    "executionType": "hybrid"
  },
  "ch_minimum_genetic_mutation": {
    "functionName": "minimumGeneticMutation",
    "executionType": "hybrid"
  },
  "minimum_genetic_mutation": {
    "functionName": "minimumGeneticMutation",
    "executionType": "hybrid"
  },
  "ch_can_place_flowers": {
    "functionName": "canPlaceFlowers",
    "executionType": "hybrid"
  },
  "can_place_flowers": {
    "functionName": "canPlaceFlowers",
    "executionType": "hybrid"
  },
  "ch_contains_duplicate_ii": {
    "functionName": "containsDuplicateIi",
    "executionType": "hybrid"
  },
  "contains_duplicate_ii": {
    "functionName": "containsDuplicateIi",
    "executionType": "hybrid"
  },
  "ch_longest_harmonious_subseq": {
    "functionName": "longestHarmoniousSubseq",
    "executionType": "hybrid"
  },
  "longest_harmonious_subseq": {
    "functionName": "longestHarmoniousSubseq",
    "executionType": "hybrid"
  },
  "ch_find_difference_two_arrays": {
    "functionName": "findDifferenceTwoArrays",
    "executionType": "hybrid"
  },
  "find_difference_two_arrays": {
    "functionName": "findDifferenceTwoArrays",
    "executionType": "hybrid"
  },
  "ch_unique_number_of_occurrences": {
    "functionName": "uniqueNumberOfOccurrences",
    "executionType": "hybrid"
  },
  "unique_number_of_occurrences": {
    "functionName": "uniqueNumberOfOccurrences",
    "executionType": "hybrid"
  },
  "ch_minimum_recolors_k_consecutive": {
    "functionName": "minimumRecolorsKConsecutive",
    "executionType": "hybrid"
  },
  "minimum_recolors_k_consecutive": {
    "functionName": "minimumRecolorsKConsecutive",
    "executionType": "hybrid"
  },
  "ch_defanging_ip_address": {
    "functionName": "defangingIpAddress",
    "executionType": "hybrid"
  },
  "defanging_ip_address": {
    "functionName": "defangingIpAddress",
    "executionType": "hybrid"
  },
  "ch_merge_strings_alternately": {
    "functionName": "mergeStringsAlternately",
    "executionType": "hybrid"
  },
  "merge_strings_alternately": {
    "functionName": "mergeStringsAlternately",
    "executionType": "hybrid"
  },
  "ch_greatest_common_divisor_strings": {
    "functionName": "greatestCommonDivisorStrings",
    "executionType": "hybrid"
  },
  "greatest_common_divisor_strings": {
    "functionName": "greatestCommonDivisorStrings",
    "executionType": "hybrid"
  },
  "ch_kids_greatest_candies": {
    "functionName": "kidsGreatestCandies",
    "executionType": "hybrid"
  },
  "kids_greatest_candies": {
    "functionName": "kidsGreatestCandies",
    "executionType": "hybrid"
  },
  "ch_valid_perfect_square": {
    "functionName": "validPerfectSquare",
    "executionType": "hybrid"
  },
  "valid_perfect_square": {
    "functionName": "validPerfectSquare",
    "executionType": "hybrid"
  },
  "ch_arranging_coins": {
    "functionName": "arrangingCoins",
    "executionType": "hybrid"
  },
  "arranging_coins": {
    "functionName": "arrangingCoins",
    "executionType": "hybrid"
  },
  "ch_cousins_in_binary_tree": {
    "functionName": "cousinsInBinaryTree",
    "executionType": "hybrid"
  },
  "cousins_in_binary_tree": {
    "functionName": "cousinsInBinaryTree",
    "executionType": "hybrid"
  },
  "ch_univalued_binary_tree": {
    "functionName": "univaluedBinaryTree",
    "executionType": "hybrid"
  },
  "univalued_binary_tree": {
    "functionName": "univaluedBinaryTree",
    "executionType": "hybrid"
  }
};

/**
 * Resolves the explicit execution configuration for a problem, module, or question.
 * @param {string|object} problemOrId - Problem ID, challenge object, curriculum module, or question.
 * @returns {{ functionName: string|null, executionType: string, isConfigured: boolean, problemId: string }}
 */
function getProblemExecutionConfig(problemOrId) {
  if (!problemOrId) {
    return { functionName: null, executionType: "unknown", isConfigured: false, problemId: "" };
  }

  // 1. Direct explicit functionName on the provided problem object
  if (typeof problemOrId === "object") {
    const directFn =
      problemOrId.functionName ||
      problemOrId.targetFunctionName ||
      problemOrId.codingExercise?.functionName ||
      problemOrId.executionConfig?.functionName;

    const probId =
      problemOrId.questionId ||
      problemOrId.challengeId ||
      problemOrId.moduleId ||
      (typeof problemOrId.id === "string" && !problemOrId.id.match(/^[0-9a-fA-F]{24}$/) ? problemOrId.id : null) ||
      (problemOrId._id && typeof problemOrId._id === "string" && !problemOrId._id.match(/^[0-9a-fA-F]{24}$/) ? problemOrId._id : null) ||
      problemOrId.id ||
      problemOrId._id ||
      "";

    if (directFn && typeof directFn === "string" && directFn.trim()) {
      return {
        functionName: directFn.trim(),
        executionType: problemOrId.executionType || "function",
        isConfigured: true,
        problemId: String(probId),
      };
    }

    if (probId) {
      return getProblemExecutionConfig(probId);
    }
  }

  // 2. Lookup in explicit validated registry by ID
  const idStr = String(problemOrId).trim();
  if (PROBLEM_EXECUTION_REGISTRY[idStr]) {
    const entry = PROBLEM_EXECUTION_REGISTRY[idStr];
    return {
      functionName: entry.functionName,
      executionType: entry.executionType,
      isConfigured: true,
      problemId: idStr,
    };
  }

  const normalized = idStr.toLowerCase().replace(/^(ch_|mod_|q_)/, "");
  if (PROBLEM_EXECUTION_REGISTRY[normalized]) {
    const entry = PROBLEM_EXECUTION_REGISTRY[normalized];
    return {
      functionName: entry.functionName,
      executionType: entry.executionType,
      isConfigured: true,
      problemId: idStr,
    };
  }

  return {
    functionName: null,
    executionType: "unknown",
    isConfigured: false,
    problemId: idStr,
  };
}

module.exports = {
  PROBLEM_EXECUTION_REGISTRY,
  getProblemExecutionConfig,
};
