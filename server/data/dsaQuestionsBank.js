/**
 * DATA STRUCTURES & ALGORITHMS (DSA) CERTIFICATION QUESTION BANK
 * 50 Rigorous, Industry-Standard MCQs covering Asymptotic Complexity,
 * Arrays, Strings, Two Pointers, Linked Lists, Stacks, Queues, Trees,
 * BSTs, Heaps, Hashing, Sorting, Searching, Graphs, and Dynamic Programming.
 */

const DSA_MCQ_BANK = [
  {
    id: "dsa_mcq_01",
    question: "What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) containing n nodes?",
    options: ["O(log n)", "O(n)", "O(n log n)", "O(1)"],
    correctAnswer: 1,
    topic: "Binary Search Trees",
    difficulty: "Easy",
    explanation: "In the worst case (e.g. elements inserted in sorted order), an unbalanced BST degrades into a linked list of depth n, leading to O(n) search time."
  },
  {
    id: "dsa_mcq_02",
    question: "Which of the following sorting algorithms is guaranteed to be stable and have an O(n log n) worst-case time complexity?",
    options: ["Quicksort", "Heapsort", "Merge Sort", "Selection Sort"],
    correctAnswer: 2,
    topic: "Sorting Algorithms",
    difficulty: "Medium",
    explanation: "Merge Sort consistently divides the array and merges in O(n log n) time in all cases while maintaining the relative order of duplicate keys (stability)."
  },
  {
    id: "dsa_mcq_03",
    question: "What is the tight bound time complexity of building a Binary Heap from an arbitrary array of n elements using the bottom-up Heapify approach?",
    options: ["O(n log n)", "O(n)", "O(log n)", "O(n^2)"],
    correctAnswer: 1,
    topic: "Heaps & Priority Queues",
    difficulty: "Medium",
    explanation: "Because the number of operations per node decreases as the level increases, summing the series (h / 2^h) yields a linear O(n) bound for bottom-up heap construction."
  },
  {
    id: "dsa_mcq_04",
    question: "In hash tables with open addressing using linear probing, what primary phenomenon degrades lookup performance as the load factor increases?",
    options: ["Primary Clustering", "Secondary Clustering", "Quadratic Thrashing", "Bucket Starvation"],
    correctAnswer: 0,
    topic: "Hashing",
    difficulty: "Medium",
    explanation: "Linear probing creates long contiguous runs of occupied slots known as primary clustering, which increases average probe sequence length."
  },
  {
    id: "dsa_mcq_05",
    question: "What is the time complexity of detecting whether a cycle exists in a singly linked list with n nodes using Floyd's Tortoise and Hare algorithm?",
    options: ["O(n) time and O(n) space", "O(n log n) time and O(1) space", "O(n) time and O(1) space", "O(1) time and O(1) space"],
    correctAnswer: 2,
    topic: "Linked Lists",
    difficulty: "Easy",
    explanation: "Floyd's cycle-finding algorithm moves two pointers (slow by 1, fast by 2) needing at most O(n) steps and only two pointer variables (O(1) auxiliary space)."
  },
  {
    id: "dsa_mcq_06",
    question: "Which data structure is optimal for finding the 'Next Greater Element' for all elements in an array of size n in overall O(n) time?",
    options: ["Monotonic Stack", "Min-Heap", "Trie", "Disjoint Set Union (DSU)"],
    correctAnswer: 0,
    topic: "Stacks & Queues",
    difficulty: "Medium",
    explanation: "A monotonic decreasing stack processes each element at most twice (one push, one pop), giving a total O(n) runtime to find next greater elements."
  },
  {
    id: "dsa_mcq_07",
    question: "Given a connected, undirected graph with V vertices and E edges, what is the time complexity of Breadth-First Search (BFS) using an adjacency list representation?",
    options: ["O(V * E)", "O(V + E)", "O(V^2)", "O(E log V)"],
    correctAnswer: 1,
    topic: "Graphs",
    difficulty: "Easy",
    explanation: "BFS visits each vertex once and traverses each edge in the adjacency list exactly twice (once from each endpoint), resulting in O(V + E) time."
  },
  {
    id: "dsa_mcq_08",
    question: "What traversal order of a Binary Search Tree (BST) visits nodes in strictly ascending sorted order of their keys?",
    options: ["Pre-order (Root-Left-Right)", "Post-order (Left-Right-Root)", "In-order (Left-Root-Right)", "Level-order (BFS)"],
    correctAnswer: 2,
    topic: "Trees",
    difficulty: "Easy",
    explanation: "In a BST, all keys in the left subtree are smaller than the root, and all in the right subtree are larger. Thus, Left -> Root -> Right yields sorted ascending keys."
  },
  {
    id: "dsa_mcq_09",
    question: "What is the minimum number of queues required to implement a Last-In-First-Out (LIFO) Stack?",
    options: ["1", "2", "3", "Not possible"],
    correctAnswer: 1,
    topic: "Stacks & Queues",
    difficulty: "Medium",
    explanation: "A stack can be simulated using two queues by pushing new elements into an empty queue and transferring all older elements to preserve LIFO order (or by rotating on pop)."
  },
  {
    id: "dsa_mcq_10",
    question: "Which of the following recurrences represents the time complexity of standard Binary Search on a sorted array of size n?",
    options: ["T(n) = 2T(n/2) + O(1)", "T(n) = T(n/2) + O(1)", "T(n) = T(n/2) + O(n)", "T(n) = 2T(n/2) + O(n)"],
    correctAnswer: 1,
    topic: "Searching Algorithms",
    difficulty: "Easy",
    explanation: "Binary Search inspects the middle element in O(1) time and recursively discards half of the search space: T(n) = T(n/2) + O(1), which solves to O(log n)."
  },
  {
    id: "dsa_mcq_11",
    question: "In Dijkstra's algorithm implemented with a Min-Heap (priority queue), what is the tight asymptotic time complexity for a graph with V vertices and E edges?",
    options: ["O(V^2)", "O((V + E) log V)", "O(E * V)", "O(V log E)"],
    correctAnswer: 1,
    topic: "Graphs",
    difficulty: "Hard",
    explanation: "Each vertex is extracted from the priority queue once (V log V), and each edge relaxation may update the key (E log V), yielding O((V + E) log V)."
  },
  {
    id: "dsa_mcq_12",
    question: "What is the worst-case time complexity of Kadane's algorithm for finding the maximum subarray sum in a 1D array of size n?",
    options: ["O(n^2)", "O(n log n)", "O(n)", "O(1)"],
    correctAnswer: 2,
    topic: "Dynamic Programming",
    difficulty: "Easy",
    explanation: "Kadane's algorithm maintains the maximum subarray sum ending at each index in a single linear pass of the array, requiring O(n) time and O(1) space."
  },
  {
    id: "dsa_mcq_13",
    question: "What is the maximum number of nodes in a binary tree of height h (where height of a single-node tree is defined as 0)?",
    options: ["2^h", "2^(h + 1) - 1", "2^h - 1", "2^(h - 1)"],
    correctAnswer: 1,
    topic: "Trees",
    difficulty: "Easy",
    explanation: "A binary tree has 2^0 nodes at level 0, 2^1 at level 1, ..., 2^h at level h. Summing the geometric series gives 2^(h + 1) - 1 nodes."
  },
  {
    id: "dsa_mcq_14",
    question: "Which design paradigm does the 0/1 Knapsack problem typically use to achieve an O(n * W) pseudo-polynomial time solution?",
    options: ["Greedy Algorithm", "Dynamic Programming", "Divide and Conquer", "Backtracking without memoization"],
    correctAnswer: 1,
    topic: "Dynamic Programming",
    difficulty: "Medium",
    explanation: "0/1 Knapsack requires Dynamic Programming (memoization or 2D/1D DP table) because greedy selection fails when items cannot be divided fractionally."
  },
  {
    id: "dsa_mcq_15",
    question: "What is the space complexity of Depth-First Search (DFS) on a general tree with maximum depth D?",
    options: ["O(D)", "O(V * E)", "O(1)", "O(V^2)"],
    correctAnswer: 0,
    topic: "Graphs",
    difficulty: "Easy",
    explanation: "The maximum memory allocated by DFS is determined by the call stack (or explicit stack), which holds at most D frames corresponding to the path from the root."
  },
  {
    id: "dsa_mcq_16",
    question: "In a Red-Black Tree, what is the maximum possible height of a tree with n internal nodes?",
    options: ["log2(n + 1)", "2 * log2(n + 1)", "n / 2", "sqrt(n)"],
    correctAnswer: 1,
    topic: "Balanced Search Trees",
    difficulty: "Hard",
    explanation: "Because red nodes cannot have red children and every path from root to leaf has the same number of black nodes, the maximum height is strictly at most 2 * log2(n + 1)."
  },
  {
    id: "dsa_mcq_17",
    question: "What is the primary condition required to compute a valid Topological Ordering of vertices in a directed graph?",
    options: ["The graph must be strongly connected", "The graph must be a Directed Acyclic Graph (DAG)", "The graph must be a tree", "The graph must contain at least one Hamiltonian cycle"],
    correctAnswer: 1,
    topic: "Graphs",
    difficulty: "Easy",
    explanation: "Topological sorting requires that for every directed edge u -> v, u comes before v. If a cycle exists, no valid linear ordering is possible; hence the graph must be a DAG."
  },
  {
    id: "dsa_mcq_18",
    question: "Which of the following data structures allows O(1) amortized insertion, O(1) amortized deletion, and O(1) random lookup by value?",
    options: ["Balanced BST (AVL)", "Array + Hash Map combination", "Singly Linked List", "Min-Max Heap"],
    correctAnswer: 1,
    topic: "Data Structure Design",
    difficulty: "Hard",
    explanation: "Combining a dynamic array (for O(1) random access by index) with a hash map storing value-to-index mappings allows swap-with-last removal and insert in O(1) amortized time."
  },
  {
    id: "dsa_mcq_19",
    question: "What is the optimal algorithm for finding the Strongly Connected Components (SCCs) of a directed graph in O(V + E) time?",
    options: ["Tarjan's or Kosaraju's Algorithm", "Kruskal's Algorithm", "Floyd-Warshall Algorithm", "Bellman-Ford Algorithm"],
    correctAnswer: 0,
    topic: "Graphs",
    difficulty: "Hard",
    explanation: "Both Tarjan's algorithm (using DFS discovery and low-link values) and Kosaraju's algorithm (using two DFS passes and transpose graph) find all SCCs in linear O(V + E) time."
  },
  {
    id: "dsa_mcq_20",
    question: "In an array representation of a 0-indexed complete binary tree, if a node is located at index i, at what index is its right child located?",
    options: ["2 * i", "2 * i + 1", "2 * i + 2", "i / 2"],
    correctAnswer: 2,
    topic: "Trees",
    difficulty: "Easy",
    explanation: "In a 0-indexed binary heap/tree array, for a parent at index i: the left child is at 2*i + 1, and the right child is at 2*i + 2."
  },
  {
    id: "dsa_mcq_21",
    question: "What is the worst-case time complexity of Quicksort when the pivot is always chosen as the first element on an already sorted array?",
    options: ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"],
    correctAnswer: 1,
    topic: "Sorting Algorithms",
    difficulty: "Medium",
    explanation: "When picking the first element on a sorted array, each partition step splits n elements into 0 and n - 1, creating a recurrence of T(n) = T(n - 1) + O(n), which solves to O(n^2)."
  },
  {
    id: "dsa_mcq_22",
    question: "What is the auxiliary space complexity of an in-place Quickselect algorithm for finding the k-th smallest element in an array?",
    options: ["O(1) iterative or O(log n) recursion stack", "O(n)", "O(n log n)", "O(k)"],
    correctAnswer: 0,
    topic: "Searching Algorithms",
    difficulty: "Medium",
    explanation: "Quickselect operates in-place by partitioning the array directly; an iterative loop uses O(1) extra space, and a standard recursive implementation uses O(log n) stack space average."
  },
  {
    id: "dsa_mcq_23",
    question: "Which of the following operations on a Trie (Prefix Tree) with key length L takes O(L) time?",
    options: ["Insertion only", "Search only", "Prefix search only", "Insertion, Search, and Prefix search"],
    correctAnswer: 3,
    topic: "Trees & Tries",
    difficulty: "Easy",
    explanation: "A Trie processes each character of the key of length L exactly once through pointer transitions, making Insert, Search, and StartsWith all O(L) independent of the number of words."
  },
  {
    id: "dsa_mcq_24",
    question: "In the context of Disjoint Set Union (DSU), what is the asymptotic time complexity of m operations on n elements when using both Path Compression and Union by Rank?",
    options: ["O(m * n)", "O(m * alpha(n))", "O(m log n)", "O(n log m)"],
    correctAnswer: 1,
    topic: "Advanced Data Structures",
    difficulty: "Hard",
    explanation: "When combining Path Compression with Union by Rank (or Size), the amortized cost per operation is O(alpha(n)), where alpha is the inverse Ackermann function (effectively constant <= 4)."
  },
  {
    id: "dsa_mcq_25",
    question: "What is the time complexity of finding the length of the Longest Increasing Subsequence (LIS) in an array of size n using patience sorting / binary search?",
    options: ["O(n^2)", "O(n log n)", "O(n)", "O(2^n)"],
    correctAnswer: 1,
    topic: "Dynamic Programming",
    difficulty: "Hard",
    explanation: "Patience sorting maintains a tails array where elements are updated via binary search in O(log n) time per element, achieving overall O(n log n) time."
  },
  {
    id: "dsa_mcq_26",
    question: "Which collision resolution technique in hash tables maintains a linked list (or balanced tree) of entries for each index in the hash table array?",
    options: ["Linear Probing", "Quadratic Probing", "Separate Chaining", "Double Hashing"],
    correctAnswer: 2,
    topic: "Hashing",
    difficulty: "Easy",
    explanation: "Separate chaining handles collisions by storing all colliding keys in an auxiliary data structure (such as a linked list or red-black tree) at that bucket index."
  },
  {
    id: "dsa_mcq_27",
    question: "What is the time complexity to insert a new node at the tail of a singly linked list with only a head pointer and no tail pointer?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
    correctAnswer: 2,
    topic: "Linked Lists",
    difficulty: "Easy",
    explanation: "Without a direct tail reference, the algorithm must traverse all n nodes starting from the head to reach the last node, taking linear O(n) time."
  },
  {
    id: "dsa_mcq_28",
    question: "In an undirected graph, what is the minimum number of edges needed to connect V vertices into a spanning tree?",
    options: ["V - 1", "V", "V + 1", "V * (V - 1) / 2"],
    correctAnswer: 0,
    topic: "Graphs",
    difficulty: "Easy",
    explanation: "Any tree with V vertices contains exactly V - 1 edges and no cycles. Adding an edge creates a cycle; removing one disconnects the graph."
  },
  {
    id: "dsa_mcq_29",
    question: "What is the amortized cost of inserting an element into a dynamic array (like std::vector in C++ or ArrayList in Java) when resizing doubles the capacity?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"],
    correctAnswer: 2,
    topic: "Arrays",
    difficulty: "Medium",
    explanation: "Although doubling the array takes O(n) during the reallocation step, this happens exponentially infrequently (at sizes 1, 2, 4, 8, 16...). Amortized over all insertions, the cost is O(1)."
  },
  {
    id: "dsa_mcq_30",
    question: "Which of the following algorithm paradigms is utilized by Kruskal's Minimum Spanning Tree algorithm?",
    options: ["Greedy with Disjoint Set Union", "Dynamic Programming", "Divide and Conquer", "Branch and Bound"],
    correctAnswer: 0,
    topic: "Graphs",
    difficulty: "Medium",
    explanation: "Kruskal's algorithm sorts all edges by weight (greedy choice) and iteratively adds the smallest edge that does not form a cycle, using Disjoint Set Union for cycle checks."
  },
  {
    id: "dsa_mcq_31",
    question: "Given a 2D grid representing a maze, what algorithm guarantees finding the shortest path between the start and goal cells if all edge weights are uniform (1)?",
    options: ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Greedy Best-First Search", "Pre-order Traversal"],
    correctAnswer: 1,
    topic: "Graphs",
    difficulty: "Easy",
    explanation: "BFS explores vertices in order of increasing distance from the source. In an unweighted or uniform-weight graph, the first time a target node is visited is guaranteed to be the shortest path."
  },
  {
    id: "dsa_mcq_32",
    question: "What is the space complexity of an in-place implementation of Heapsort for sorting an array of n numbers?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    correctAnswer: 0,
    topic: "Sorting Algorithms",
    difficulty: "Medium",
    explanation: "Heapsort converts the input array into a heap in-place and repeatedly swaps the maximum with the end element, using only a few loop variables (O(1) auxiliary space)."
  },
  {
    id: "dsa_mcq_33",
    question: "What property must a directed graph satisfy in order to use Bellman-Ford algorithm to find shortest paths from a single source?",
    options: ["All edge weights must be positive", "No negative weight cycles reachable from the source", "The graph must be a DAG", "The graph must be bipartite"],
    correctAnswer: 1,
    topic: "Graphs",
    difficulty: "Medium",
    explanation: "Bellman-Ford handles negative edge weights, but if a negative cycle is reachable, distances can decrease infinitely. The algorithm can detect such negative cycles."
  },
  {
    id: "dsa_mcq_34",
    question: "What does the expression (x & (x - 1)) compute in binary arithmetic for a non-negative integer x?",
    options: ["Inverts all bits of x", "Clears the lowest set bit (rightmost 1-bit)", "Checks if x is an odd number", "Multiplies x by 2"],
    correctAnswer: 1,
    topic: "Bit Manipulation",
    difficulty: "Medium",
    explanation: "Subtracting 1 flips all bits after the lowest set bit (inclusive). Performing bitwise AND with x zeroes out that lowest set bit (used in Brian Kernighan's bit count algorithm)."
  },
  {
    id: "dsa_mcq_35",
    question: "In an AVL Tree, what is the maximum allowed absolute difference between the heights of the left and right subtrees for any node?",
    options: ["0", "1", "2", "log(n)"],
    correctAnswer: 1,
    topic: "Balanced Search Trees",
    difficulty: "Easy",
    explanation: "The AVL balance factor is defined as height(left) - height(right). For the tree to remain balanced, this balance factor must be in {-1, 0, 1} for every node."
  },
  {
    id: "dsa_mcq_36",
    question: "What is the lower bound for comparison-based sorting of n elements in the worst case?",
    options: ["Omega(n)", "Omega(n log n)", "Omega(n^2)", "Omega(log n)"],
    correctAnswer: 1,
    topic: "Sorting Theory",
    difficulty: "Hard",
    explanation: "A decision tree for n items has n! leaves. The height of a binary decision tree must be at least log2(n!) = Theta(n log n) by Stirling's approximation."
  },
  {
    id: "dsa_mcq_37",
    question: "What is the time complexity of inserting a key into a Skip List with n elements on average?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
    correctAnswer: 1,
    topic: "Advanced Data Structures",
    difficulty: "Medium",
    explanation: "Skip lists use probabilistic tower heights with coin flips, providing O(log n) average search, insertion, and deletion times, similar to a balanced search tree."
  },
  {
    id: "dsa_mcq_38",
    question: "Which of the following string search algorithms preprocesses the pattern to compute a 'Longest Prefix Suffix' (LPS) array in O(m) time to avoid backtracking?",
    options: ["Knuth-Morris-Pratt (KMP)", "Rabin-Karp", "Boyer-Moore", "Naive Pattern Matcher"],
    correctAnswer: 0,
    topic: "Strings & Pattern Matching",
    difficulty: "Hard",
    explanation: "The KMP algorithm constructs the LPS table for a pattern of length m in O(m) time and searches text of length n in O(n) time without moving backwards in the text."
  },
  {
    id: "dsa_mcq_39",
    question: "What is the space complexity of calculating the n-th Fibonacci number using space-optimized iterative dynamic programming?",
    options: ["O(n)", "O(1)", "O(log n)", "O(2^n)"],
    correctAnswer: 1,
    topic: "Dynamic Programming",
    difficulty: "Easy",
    explanation: "Because F(n) depends only on F(n-1) and F(n-2), keeping two variables (prev and curr) enables computing the n-th Fibonacci number in O(1) space."
  },
  {
    id: "dsa_mcq_40",
    question: "What is the maximum number of edges in a simple undirected graph with V vertices?",
    options: ["V * (V - 1)", "V * (V - 1) / 2", "V^2", "2^V"],
    correctAnswer: 1,
    topic: "Graphs",
    difficulty: "Easy",
    explanation: "In a complete undirected graph without self-loops or multi-edges, every pair of distinct vertices has an edge: C(V, 2) = V * (V - 1) / 2."
  },
  {
    id: "dsa_mcq_41",
    question: "In a circular queue of capacity N implemented with an array and indices 'front' and 'rear', what condition indicates that the queue is full?",
    options: ["front == rear", "(rear + 1) % N == front", "rear == N - 1", "front == 0"],
    correctAnswer: 1,
    topic: "Stacks & Queues",
    difficulty: "Medium",
    explanation: "Leaving one slot empty or using a modulo increment condition ((rear + 1) % N == front) distinguishes between a completely full queue and an empty queue (front == rear)."
  },
  {
    id: "dsa_mcq_42",
    question: "What is the optimal algorithmic technique for finding the median of a continuous real-time data stream of numbers?",
    options: ["Two Heaps (Max-Heap for lower half, Min-Heap for upper half)", "A single dynamic sorted array", "A Hash Table with frequency counters", "Stack and Queue combination"],
    correctAnswer: 0,
    topic: "Heaps & Priority Queues",
    difficulty: "Hard",
    explanation: "Maintaining a max-heap of smaller values and a min-heap of larger values with balanced sizes permits O(log n) insertions and instant O(1) median retrieval."
  },
  {
    id: "dsa_mcq_43",
    question: "In an undirected graph, a vertex whose removal increases the number of connected components is called what?",
    options: ["Bridge", "Articulation Point (Cut Vertex)", "Leaf Node", "Sink Vertex"],
    correctAnswer: 1,
    topic: "Graphs",
    difficulty: "Medium",
    explanation: "An articulation point (or cut vertex) is any vertex whose removal disconnects the graph or increases its number of connected components."
  },
  {
    id: "dsa_mcq_44",
    question: "What is the time complexity of the Floyd-Warshall algorithm for finding all-pairs shortest paths in a graph with V vertices?",
    options: ["O(V^2)", "O(V^3)", "O(V * E log V)", "O(E * V)"],
    correctAnswer: 1,
    topic: "Graphs",
    difficulty: "Medium",
    explanation: "Floyd-Warshall uses three nested loops over intermediate vertices k, source vertices i, and destination vertices j from 1 to V, resulting in O(V^3) time."
  },
  {
    id: "dsa_mcq_45",
    question: "Which of the following is true regarding counting sort on n integers ranging from 0 to k?",
    options: ["It is a comparison-based sort with O(n log n) time", "It runs in O(n + k) time and is stable when implemented correctly", "It runs in O(k log n) time and O(1) space", "It is unstable and runs in O(n^2) time"],
    correctAnswer: 1,
    topic: "Sorting Algorithms",
    difficulty: "Medium",
    explanation: "Counting sort counts frequencies and computes prefix sums in O(n + k) time. Iterating backwards through the input preserves stability for duplicate values."
  },
  {
    id: "dsa_mcq_46",
    question: "In a min-heap with n elements, what is the time complexity of finding the maximum element in the heap?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: 2,
    topic: "Heaps & Priority Queues",
    difficulty: "Medium",
    explanation: "In a min-heap, the minimum is at the root, but the maximum can be at any of the leaves (which comprise approximately ceil(n/2) elements), requiring O(n) to find."
  },
  {
    id: "dsa_mcq_47",
    question: "What is the time complexity of finding the Lowest Common Ancestor (LCA) of two nodes in a balanced Binary Search Tree (BST) of height h?",
    options: ["O(h) which is O(log n)", "O(n)", "O(1)", "O(n log n)"],
    correctAnswer: 0,
    topic: "Trees",
    difficulty: "Easy",
    explanation: "Starting from the root, if both nodes are smaller, move left; if both are larger, move right; otherwise the current node is the LCA split point, taking at most O(h) = O(log n) steps."
  },
  {
    id: "dsa_mcq_48",
    question: "Which algorithm technique uses memoization to store solutions to subproblems to avoid redundant exponential recalculation?",
    options: ["Top-down Dynamic Programming", "Bottom-up Dynamic Programming", "Branch and Bound", "Divide and Conquer"],
    correctAnswer: 0,
    topic: "Dynamic Programming",
    difficulty: "Easy",
    explanation: "Top-down Dynamic Programming retains the natural recursive formulation of the problem but caches results in a lookup table (memoization) upon first computation."
  },
  {
    id: "dsa_mcq_49",
    question: "What is the auxiliary space complexity of an in-place Breadth-First Search queue in the worst case for a balanced binary tree with n nodes?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
    correctAnswer: 2,
    topic: "Trees",
    difficulty: "Medium",
    explanation: "At the widest level of a balanced binary tree, there are ceil(n / 2) leaf nodes. The BFS queue must store this entire level simultaneously, requiring O(n) space."
  },
  {
    id: "dsa_mcq_50",
    question: "In algorithm analysis, what does the Little-o notation (f(n) = o(g(n))) formally signify?",
    options: ["f(n) is asymptotically strictly less than g(n) (limit of f(n)/g(n) as n -> inf is 0)", "f(n) is bounded both above and below by g(n)", "f(n) is greater than or equal to g(n)", "f(n) has the exact same order of growth as g(n)"],
    correctAnswer: 0,
    topic: "Asymptotic Analysis",
    difficulty: "Hard",
    explanation: "Little-o represents an upper bound that is not asymptotically tight: f(n) grows strictly slower than g(n), such that lim (n -> inf) f(n) / g(n) = 0."
  }
];

module.exports = { DSA_MCQ_BANK };
