// Comprehensive Coding Track Curriculum Data
const CURRICULUM = {
  "python": [
    {
      "id": "py_mod_0",
      "trackId": "python",
      "moduleIndex": 0,
      "title": "Python Basics & Core",
      "subtitle": "Variables, Object References, CPython Memory Layout, Mutability, and Control Flow.",
      "estimatedTime": "45 mins",
      "icon": "python",
      "overview": "Deep dive into CPython's execution engine, object representation, private heap allocation, reference counting, variable binding mechanics, and optimized control flow constructs. In Python, variables are named pointers to objects rather than typed storage cells.",
      "sections": [
        {
          "title": "1. The CPython Object Model & Heap Architecture",
          "content": "Every entity in Python—integers, strings, functions, classes, and modules—is a first-class heap-allocated C struct (`PyObject` or `PyVarObject`). A `PyObject` contains at minimum two fields: `ob_refcnt` (reference count for deterministic deallocation) and `ob_type` (a pointer to the type object determining its capabilities and method resolution).\n\nWhen executing `x = 42`, CPython does not allocate a 32-bit register for `x`. Instead, it allocates a `PyLongObject` on the private heap and binds the symbol `x` in the local frame namespace (`f_locals` dictionary) to that object's memory address. Small integers between -5 and 256 are pre-allocated and interned in a global array during interpreter startup to maximize cache locality and eliminate allocation overhead.",
          "codeExample": "import sys\n\n# Memory identity and small integer caching (interning)\na = 256\nb = 256\nprint(f\"a is b: {a is b}\")       # True: both reference pre-allocated singleton\nprint(f\"id(a): {hex(id(a))}\")     # Exact virtual memory address\nprint(f\"Refcount: {sys.getrefcount(a)}\")\n\nc = 999999\nd = 999999\nprint(f\"c is d: {c is d}\")       # False: allocated as distinct PyLongObject instances\nprint(f\"c == d: {c == d}\")       # True: structural value equality"
        },
        {
          "title": "2. Mutability vs Immutability: In-Place Mutations & Aliasing Hazards",
          "content": "Types in Python fall into two strict behavioral categories:\n• Immutable Types: int, float, complex, str, bytes, tuple, frozenset. Once allocated, their payload bytes can never change. Any modification produces a brand-new object.\n• Mutable Types: list, dict, set, bytearray, and custom class instances. Their internal buffer can be resized and modified in place without changing the object's identity (`id`).\n\nA critical source of production defects is unexpected aliasing: when multiple identifiers point to the same mutable container, in-place operations (`.append()`, `+=`) modify the shared state globally. Tuples provide shallow immutability: the tuple's references cannot change, but mutable objects contained inside the tuple can still be mutated in place.",
          "codeExample": "# Aliasing hazard vs defensive cloning\noriginal = [1, [2, 3], 4]\naliased = original            # Shared reference\nshallow_copy = list(original) # New outer list, shared inner lists\nimport copy\ndeep_copy = copy.deepcopy(original) # Recursively cloned heap tree\n\noriginal[1].append(99)\nprint(f\"Aliased:      {aliased[1]}\")      # [2, 3, 99] (MUTATED)\nprint(f\"Shallow Copy: {shallow_copy[1]}\") # [2, 3, 99] (MUTATED! Shared inner reference)\nprint(f\"Deep Copy:    {deep_copy[1]}\")    # [2, 3]     (ISOLATED)"
        },
        {
          "title": "3. Advanced Control Flow: Match-Case, Iterators & Comprehensions",
          "content": "Python 3.10 introduced Structural Pattern Matching (`match ... case`), offering expressive destructuring of sequences, dictionaries, and class patterns with guard clauses (`if`). Unlike C/C++ switch statements, `match` evaluates structural shape and binds sub-patterns into local variables.\n\nList and dictionary comprehensions are compiled directly into bytecode loops executed in C within the CPython virtual machine. They bypass the overhead of repeatedly looking up `.append()` in the global or module scope, resulting in up to 35% faster execution compared to standard Python `for` loops.",
          "codeExample": "def parse_api_event(event: dict) -> str:\n    match event:\n        case {\"type\": \"auth\", \"status\": 200, \"user\": {\"role\": \"admin\", \"name\": name}}:\n            return f\"Superadmin session authorized for: {name}\"\n        case {\"type\": \"auth\", \"status\": code} if code >= 400:\n            return f\"Security alert: Authentication rejected (HTTP {code})\"\n        case {\"type\": \"payment\", \"amount\": amt, \"currency\": curr} if amt > 10000:\n            return f\"High-value wire audit flag: {amt} {curr}\"\n        case _:\n            return \"Standard operational telemetry logged\"\n\nprint(parse_api_event({\"type\": \"auth\", \"status\": 200, \"user\": {\"role\": \"admin\", \"name\": \"Sarah\"}}))"
        },
        {
          "title": "4. Memory Complexity, Big-O Profiles & Garbage Collection (GC)",
          "content": "CPython employs a dual-strategy memory management engine:\n1. Reference Counting: Immediate deterministic deallocation when an object's reference counter drops to 0.\n2. Generational Cyclical Garbage Collector (GC): Handles self-referential cycles across three generations (Gen 0, Gen 1, Gen 2). Gen 0 runs frequently; objects surviving collection are promoted to older generations.\n\nMemory Profiling Table:\n• Integer: 28 bytes base (16 bytes PyObject header + 8 bytes digit count + 4 bytes value)\n• Float: 24 bytes\n• Empty List: 56 bytes (overallocates by factor of 1.125 upon growth)\n• Empty Dict: 64 bytes (compact hash table with separate index array)",
          "codeExample": "import sys, gc\n\nclass Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\nn1 = Node(1)\nn2 = Node(2)\nn1.next = n2\nn2.next = n1 # Cyclical pointer loop\n\ndel n1\ndel n2 # Reference count never drops to 0 due to mutual references!\nunreachable = gc.collect()\nprint(f\"Unreachable cyclical objects reclaimed by GC: {unreachable}\")"
        },
        {
          "title": "5. Production Pitfalls & Anti-Patterns to Avoid",
          "content": "• Mutable Default Arguments: Defs like `def add_item(item, items=[])` bind `items` once at module import time, sharing the list across all invocations. Always default to `items=None` and initialize inside.\n• Unchecked `is` for Equality: Never use `is` to compare string or numeric equality (`if x is 500:`). Use `==` for structural equality.\n• Inefficient String Concatenation in Loops: Using `s += char` generates O(N^2) memory reallocations. Use `''.join(list_of_strings)` for strict O(N) linear time.",
          "codeExample": "# ANTI-PATTERN:\ndef append_to_cache(key, val, cache={}):\n    cache[key] = val\n    return cache\n\n# PRODUCTION RECOMMENDED PATTERN:\ndef append_to_cache_safe(key, val, cache=None):\n    if cache is None:\n        cache = {}\n    cache[key] = val\n    return cache"
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement In-Place Filter & Square",
        "functionName": "filter_and_square",
        "prompt": "Write a function `filter_and_square(nums)` that takes a list of integers from stdin (JSON array) and returns a list containing the squares of all positive even integers in ascending order.",
        "starterCode": "# Enter your code below\n",
        "testCases": [
          {
            "input": "[-4, -2, 0, 2, 4, 6]",
            "expectedOutput": "[4, 16, 36]",
            "isHidden": false
          },
          {
            "input": "[1, 3, 5, 7]",
            "expectedOutput": "[]",
            "isHidden": false
          },
          {
            "input": "[-10, 10, -8, 8, 2]",
            "expectedOutput": "[4, 64, 100]",
            "isHidden": false
          },
          {
            "input": "[12, 14, -2, 0, 4]",
            "expectedOutput": "[16, 144, 196]",
            "isHidden": true
          },
          {
            "input": "[]",
            "expectedOutput": "[]",
            "isHidden": true
          },
          {
            "input": "[-2, -4, -6]",
            "expectedOutput": "[]",
            "isHidden": true
          },
          {
            "input": "[2]",
            "expectedOutput": "[4]",
            "isHidden": true
          },
          {
            "input": "[100, -100, 50, 25]",
            "expectedOutput": "[2500, 10000]",
            "isHidden": true
          },
          {
            "input": "[0, 0, 0]",
            "expectedOutput": "[]",
            "isHidden": true
          },
          {
            "input": "[6, 4, 2, 8, 10]",
            "expectedOutput": "[4, 16, 36, 64, 100]",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "Python Object Model & List Comprehensions",
        "inputFormat": "A single line containing a JSON array of integers `nums` from standard input (stdin).",
        "outputFormat": "A single line containing a JSON array of sorted squares of all positive even integers.",
        "constraints": [
          "0 <= nums.length <= 10^4",
          "-10^4 <= nums[i] <= 10^4",
          "Only positive even integers (x > 0 and x % 2 == 0) must be included.",
          "Output array must be sorted in ascending numerical order.",
          "Time Complexity: O(N log N) or O(N), Space Complexity: O(N)."
        ],
        "examples": [
          {
            "input": "[-4, -2, 0, 2, 4, 6]",
            "output": "[4, 16, 36]",
            "explanation": "Filtering for positive even integers yields [2, 4, 6]. Squaring each gives [4, 16, 36], already sorted in ascending order."
          },
          {
            "input": "[1, 3, 5, 7]",
            "output": "[]",
            "explanation": "All elements are odd; no positive even integers exist, so an empty array [] is returned."
          }
        ],
        "hints": [
          "Use a list comprehension or filter() to select numbers satisfying both `x > 0` and `x % 2 == 0`.",
          "Square the filtered numbers: `x ** 2`.",
          "Sort the resulting list in ascending order with `sorted()` before returning."
        ],
        "title": "Implement In-Place Filter & Square",
        "objective": "Extract, filter, and square positive even integers from standard input and output the sorted array in JSON format.",
        "conceptualExplanation": [
          "Step 1: Read the complete string from standard input (stdin) and deserialize the JSON array into a list of integers.",
          "Step 2: Filter elements to retain only integers that are strictly positive (x > 0) and even (x % 2 == 0).",
          "Step 3: Square each filtered integer (x ** 2).",
          "Step 4: Sort the resulting squared numbers in ascending order using Python's Timsort.",
          "Step 5: Serialize the sorted list into a JSON string and print to standard output (stdout)."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "py0_q1",
            "question": "In CPython, what does the 'is' operator evaluate between two variables?",
            "options": [
              "Structural equality of values",
              "Memory identity / address comparison",
              "Type equality",
              "Hash value match"
            ],
            "correctIndex": 1,
            "explanation": "The 'is' operator checks whether two variables refer to the exact same object in memory using id(x) == id(y)."
          },
          {
            "id": "py0_q2",
            "question": "Which of the following built-in Python types is mutable?",
            "options": [
              "tuple",
              "frozenset",
              "bytearray",
              "str"
            ],
            "correctIndex": 2,
            "explanation": "bytearray is a mutable sequence of integers in the range 0 <= x < 256. tuple, frozenset, and str are immutable."
          },
          {
            "id": "py0_q3",
            "question": "What happens when you modify a default mutable argument like `def func(lst=[])` across calls?",
            "options": [
              "A fresh list is allocated on every call",
              "The default list persists across multiple function calls",
              "Python raises an UnboundLocalError",
              "The list is garbage-collected on function exit"
            ],
            "correctIndex": 1,
            "explanation": "Default arguments are evaluated once when the function definition is executed, so the same mutable object is reused across calls."
          },
          {
            "id": "py0_q4",
            "question": "What is the time complexity of checking membership `x in s` if `s` is a Python `set` with N elements on average?",
            "options": [
              "O(N)",
              "O(1)",
              "O(log N)",
              "O(N log N)"
            ],
            "correctIndex": 1,
            "explanation": "Python sets are implemented using hash tables, offering average O(1) time complexity for lookup and membership testing."
          },
          {
            "id": "py0_q5",
            "question": "What does the expression `[x for x in range(5) if x % 2 == 0]` evaluate to?",
            "options": [
              "[0, 2, 4]",
              "[2, 4]",
              "[1, 3]",
              "[0, 1, 2, 3, 4]"
            ],
            "correctIndex": 0,
            "explanation": "range(5) yields 0, 1, 2, 3, 4. The numbers with x % 2 == 0 are 0, 2, and 4."
          },
          {
            "id": "py0_q6",
            "question": "Which built-in function returns a new iterator yielding pairs of index and value?",
            "options": [
              "zip()",
              "enumerate()",
              "map()",
              "filter()"
            ],
            "correctIndex": 1,
            "explanation": "enumerate(iterable) produces tuples of (index, element) starting from index 0 by default."
          },
          {
            "id": "py0_q7",
            "question": "What is the result of `'hello'[::-1]` in Python?",
            "options": [
              "'hello'",
              "'olleh'",
              "['o', 'l', 'l', 'e', 'h']",
              "IndexError"
            ],
            "correctIndex": 1,
            "explanation": "Extended slicing syntax [start:stop:step] with step -1 reverses the string, yielding 'olleh'."
          },
          {
            "id": "py0_q8",
            "question": "What does the `pass` statement do in Python?",
            "options": [
              "Terminates the current loop immediately",
              "Skips to the next iteration of the loop",
              "Serves as a null operation placeholder where code is syntactically required",
              "Returns None from the enclosing function"
            ],
            "correctIndex": 2,
            "explanation": "pass is a no-op statement used when a statement is required syntactically but no code needs to be executed."
          },
          {
            "id": "py0_q9",
            "question": "Which statement correctly describes Python's Global Interpreter Lock (GIL)?",
            "options": [
              "It prevents multi-processing from running across CPU cores",
              "It is a mutex in CPython that prevents multiple native threads from executing Python bytecodes simultaneously",
              "It speeds up CPU-bound multithreaded computation automatically",
              "It restricts Python scripts to a single network connection"
            ],
            "correctIndex": 1,
            "explanation": "CPython's GIL ensures thread safety by allowing only one native thread to execute Python bytecode at a time."
          },
          {
            "id": "py0_q10",
            "question": "What does `dict.get(key, default)` return when `key` is absent from the dictionary?",
            "options": [
              "KeyError exception",
              "None",
              "The specified `default` argument",
              "False"
            ],
            "correctIndex": 2,
            "explanation": "dict.get(key, default) avoids KeyError by returning the provided default value (or None if omitted) when the key is not found."
          }
        ]
      },
      "references": [
        {
          "title": "Official Python 3 Documentation — Data Model & Execution Model",
          "url": "https://docs.python.org/3/reference/datamodel.html",
          "source": "Python Software Foundation",
          "category": "Official Standard Spec",
          "description": "Definitive specification of objects, values, types, attribute lookups, and Python bytecode mechanics."
        },
        {
          "title": "PEP 634 — Structural Pattern Matching Specification",
          "url": "https://peps.python.org/pep-0634/",
          "source": "Python Enhancement Proposals (PEPs)",
          "category": "Language Architecture Proposal",
          "description": "Formal specification and grammar rules for match/case statement syntax and destructuring patterns."
        },
        {
          "title": "Fluent Python (2nd Edition) — Luciano Ramalho",
          "url": "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/",
          "source": "O'Reilly Media",
          "category": "Authoritative Literature",
          "description": "Industry gold-standard reference covering the Python data model, descriptors, memory management, and idioms."
        }
      ],
      "keyTakeaways": [
        "In Python, variables are names bound to heap objects, not typed memory boxes.",
        "Immutable types (int, float, str, tuple) cannot be mutated in place; mutable containers (list, dict, set) can be mutated across shared references.",
        "List comprehensions execute in C-speed within CPython and run faster than equivalent for-loops.",
        "Always use `items=None` for default arguments to avoid the shared mutable default argument hazard.",
        "CPython memory cleanup combines deterministic reference counting with a generational cyclic garbage collector."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_py0_1",
          "question": "Why does Python pre-allocate integers from -5 to 256 during interpreter startup?",
          "options": [
            "Because 32-bit registers can only store numbers up to 256",
            "To optimize cache locality and eliminate allocation overhead for frequently used numbers",
            "Because Python does not support numbers larger than 256 without external libraries",
            "To enforce immutable type restrictions on small values"
          ],
          "correctIndex": 1,
          "explanation": "Small integers (-5 through 256) are used heavily in loops, indexing, and counters. Pre-allocating them as permanent singletons avoids thousands of heap allocation calls."
        },
        {
          "id": "kc_py0_2",
          "question": "What is the primary danger of using `def process(data, cache=[])` in production?",
          "options": [
            "It triggers a SyntaxError in Python 3.10+",
            "The list is created once at function definition time, making the cache persist and leak state across all callers",
            "The list becomes read-only and will raise an AttributeError on .append()",
            "It prevents garbage collection of the entire module"
          ],
          "correctIndex": 1,
          "explanation": "Default parameter expressions are evaluated once when the function definition is executed at module load time. Subsequent calls share that exact same list object."
        }
      ],
      "interactiveSandboxCode": "import sys\nx = [10, 20, 30]\ny = x\nprint(f\"x is y: {x is y}\")\ny.append(40)\nprint(f\"x after y.append(40): {x}\")\n"
    },
    {
      "id": "py_mod_1",
      "trackId": "python",
      "moduleIndex": 1,
      "title": "Functions, Scopes & Lambda Expressions",
      "subtitle": "First-Class Functions, Closures, Decorators, *args/**kwargs, and Variable Scope Hierarchy.",
      "estimatedTime": "35 mins",
      "icon": "python",
      "overview": "Deep architectural survey of Python's execution frames, lexical scoping rules (LEGB), first-class callable objects, closures with cell variables, function decorators, and meta-programming techniques used across modern frameworks like FastAPI, Flask, and PyTorch.",
      "sections": [
        {
          "title": "1. The LEGB Scope Resolution Hierarchy & Frame Objects",
          "content": "When resolving any identifier in Python, the interpreter checks four scopes in strict hierarchical order (LEGB):\n1. Local (L): Defined inside current function via assignment.\n2. Enclosing (E): Defined in the local scope of enclosing functions (closures).\n3. Global (G): Defined at top level of the module (`globals()`).\n4. Built-in (B): Pre-loaded built-ins like `len`, `range` (`builtins`).\n\nIf you assign to a variable anywhere inside a function without `global` or `nonlocal`, Python flags it as strictly Local at compilation time. Referencing it before assignment raises `UnboundLocalError`.",
          "codeExample": "counter = 0\ndef increment():\n    global counter\n    counter += 1\n    return counter\n\ndef outer_closure(initial_value):\n    val = initial_value\n    def inner_step(delta):\n        nonlocal val\n        val += delta\n        return val\n    return inner_step\n\nstepper = outer_closure(100)\nprint(stepper(15))  # 115\nprint(stepper(25))  # 140"
        },
        {
          "title": "2. Closures & Free Variables: Under the Hood with __closure__",
          "content": "A closure is a function that retains access to variables from its lexical enclosing scope even after the outer function has returned. CPython achieves this by creating special `cell` objects on the heap that store pointers to the free variables.",
          "codeExample": "def make_rate_limiter(max_calls: int):\n    calls = 0\n    def allow() -> bool:\n        nonlocal calls\n        calls += 1\n        return calls <= max_calls\n    return allow\n\nlimiter = make_rate_limiter(2)\nprint([c.cell_contents for c in limiter.__closure__]) # [0, 2]\nprint(limiter(), limiter(), limiter()) # True, True, False"
        },
        {
          "title": "3. Advanced Decorators: Syntactic Sugar, Wrappers & functools.wraps",
          "content": "A decorator is a callable that wraps another callable. Without `@functools.wraps(func)`, the wrapper overwrites the decorated function's `__name__` and docstring, breaking logging and framework introspection.",
          "codeExample": "from functools import wraps\nimport time\n\ndef benchmark(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        t0 = time.perf_counter()\n        res = func(*args, **kwargs)\n        print(f\"{func.__name__} took {(time.perf_counter() - t0)*1000:.2f}ms\")\n        return res\n    return wrapper\n\n@benchmark\ndef calculate(): return sum(i for i in range(100000))\ncalculate()"
        },
        {
          "title": "4. Variadic Arguments (*args, **kwargs) & Keyword-Only Enforcement",
          "content": "Python provides flexible argument packing: `*args` packs extra positional arguments into a tuple, while `**kwargs` packs named arguments into a dict. A bare `*` enforces keyword-only arguments for bulletproof APIs.",
          "codeExample": "def connect(host: str, *, port: int = 5432, ssl: bool = True):\n    return f\"{host}:{port}?ssl={ssl}\"\n\nprint(connect(\"db.internal\", port=5433, ssl=False))"
        },
        {
          "title": "5. Production Pitfall: Late Binding in Loop Closures",
          "content": "Closures in Python bind variables by reference at execution time, not at definition time. Defining lambdas inside a loop results in all lambdas reading the final loop counter.",
          "codeExample": "# Buggy: funcs = [lambda: i for i in range(3)] -> [2, 2, 2]\n# Fix: funcs = [lambda val=i: val for i in range(3)] -> [0, 1, 2]"
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement Custom Function Counter Decorator",
        "functionName": "process_words",
        "prompt": "Write a Python script that takes a JSON array of words from stdin and uses a lambda with `map` and `filter` to return all words of length > 3 converted to uppercase, sorted alphabetically.",
        "starterCode": "# Enter your code below\n",
        "testCases": [
          {
            "input": "[\"cat\", \"apple\", \"dog\", \"banana\", \"kiwi\"]",
            "expectedOutput": "[\"APPLE\", \"BANANA\", \"KIWI\"]",
            "isHidden": false
          },
          {
            "input": "[\"a\", \"ab\", \"abc\"]",
            "expectedOutput": "[]",
            "isHidden": false
          },
          {
            "input": "[\"zebra\", \"elephant\", \"fox\", \"bear\"]",
            "expectedOutput": "[\"BEAR\", \"ELEPHANT\", \"ZEBRA\"]",
            "isHidden": false
          },
          {
            "input": "[]",
            "expectedOutput": "[]",
            "isHidden": true
          },
          {
            "input": "[\"code\", \"test\", \"run\", \"dev\"]",
            "expectedOutput": "[\"CODE\", \"TEST\"]",
            "isHidden": true
          },
          {
            "input": "[\"four\", \"five\", \"six\", \"seven\"]",
            "expectedOutput": "[\"FIVE\", \"FOUR\", \"SEVEN\"]",
            "isHidden": true
          },
          {
            "input": "[\"python\", \"rust\", \"go\", \"c\"]",
            "expectedOutput": "[\"PYTHON\", \"RUST\"]",
            "isHidden": true
          },
          {
            "input": "[\"supercalifragilistic\"]",
            "expectedOutput": "[\"SUPERCALIFRAGILISTIC\"]",
            "isHidden": true
          },
          {
            "input": "[\"yes\", \"no\", \"maybe\"]",
            "expectedOutput": "[\"MAYBE\"]",
            "isHidden": true
          },
          {
            "input": "[\"alpha\", \"beta\", \"gamma\", \"delta\"]",
            "expectedOutput": "[\"ALPHA\", \"BETA\", \"DELTA\", \"GAMMA\"]",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "Functional Programming, Lambda & Filters",
        "inputFormat": "A single line from stdin containing a JSON array of strings `words`.",
        "outputFormat": "A JSON array of uppercase strings of length > 3, sorted alphabetically.",
        "constraints": [
          "0 <= words.length <= 10^4",
          "Each word consists of alphanumeric characters.",
          "Time Complexity: O(N log N), Space Complexity: O(N)."
        ],
        "examples": [
          {
            "input": "[\"cat\", \"apple\", \"dog\", \"banana\", \"kiwi\"]",
            "output": "[\"APPLE\", \"BANANA\", \"KIWI\"]",
            "explanation": "\"apple\", \"banana\", and \"kiwi\" have length > 3. In uppercase and alphabetical order: [\"APPLE\", \"BANANA\", \"KIWI\"]."
          },
          {
            "input": "[\"a\", \"ab\", \"abc\"]",
            "output": "[]",
            "explanation": "None of the strings exceed 3 characters in length."
          }
        ],
        "hints": [
          "Use `filter` or a comprehension with condition `len(w) > 3`.",
          "Transform words to uppercase using `.upper()`.",
          "Sort the filtered uppercase strings using `sorted()`."
        ],
        "title": "Implement Custom Function Counter Decorator",
        "objective": "Create a stateful function decorator that tracks and prints invocation counts across calls without global variables.",
        "conceptualExplanation": [
          "Step 1: Define a wrapper function `count_calls(fn)` that maintains a private closure count dictionary or function attribute.",
          "Step 2: On each invocation of the decorated function, increment its internal invocation counter.",
          "Step 3: Print or output the current count along with the decorated function's return value.",
          "Step 4: Return the original return value to ensure transparent delegation."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "py1_q1",
            "question": "What does the LEGB acronym in Python name resolution stand for?",
            "options": [
              "Linear, Enclosed, Global, Base",
              "Local, Enclosing, Global, Built-in",
              "Logical, Execution, Garbage, Binary",
              "Lexical, Environment, Global, Bytecode"
            ],
            "correctIndex": 1,
            "explanation": "LEGB stands for Local, Enclosing, Global, and Built-in."
          },
          {
            "id": "py1_q2",
            "question": "Which keyword is used to modify a variable in the outer (non-global) enclosing scope?",
            "options": [
              "global",
              "nonlocal",
              "outer",
              "super"
            ],
            "correctIndex": 1,
            "explanation": "The 'nonlocal' keyword allows re-binding variables in outer non-global scopes."
          },
          {
            "id": "py1_q3",
            "question": "What data structure does `*args` unpack into inside a function body?",
            "options": [
              "List",
              "Tuple",
              "Dictionary",
              "Set"
            ],
            "correctIndex": 1,
            "explanation": "*args collects variable positional arguments into an immutable tuple."
          },
          {
            "id": "py1_q4",
            "question": "What data structure does `**kwargs` unpack into inside a function body?",
            "options": [
              "List",
              "Tuple",
              "Dictionary",
              "Generator"
            ],
            "correctIndex": 2,
            "explanation": "**kwargs collects keyword arguments into a standard Python dictionary."
          },
          {
            "id": "py1_q5",
            "question": "What is a closure in Python?",
            "options": [
              "A function that returns nothing",
              "A nested function that retains access to variables from its lexical enclosing scope",
              "A function executed in a sandbox",
              "A private class member"
            ],
            "correctIndex": 1,
            "explanation": "A closure is a function object that remembers values in enclosing scopes even if they are not in memory."
          },
          {
            "id": "py1_q6",
            "question": "How does a Python decorator `@my_decorator` modify `def foo():` syntactically?",
            "options": [
              "foo = my_decorator(foo)",
              "my_decorator = foo()",
              "foo.decorate(my_decorator)",
              "eval(my_decorator)"
            ],
            "correctIndex": 0,
            "explanation": "The @syntax is syntactic sugar for reassigning `foo = my_decorator(foo)`."
          },
          {
            "id": "py1_q7",
            "question": "What is the return type of a Python `lambda` expression?",
            "options": [
              "None",
              "An anonymous function object",
              "A generator",
              "A string representation of the expression"
            ],
            "correctIndex": 1,
            "explanation": "Lambda creates and returns an anonymous callable function object."
          },
          {
            "id": "py1_q8",
            "question": "What does `functools.wraps(func)` do when writing a decorator?",
            "options": [
              "Prevents the wrapped function from throwing errors",
              "Copies metadata such as __name__ and __doc__ from the original function to the wrapper",
              "Executes the function in parallel",
              "Caches return values"
            ],
            "correctIndex": 1,
            "explanation": "functools.wraps preserves the original function's name, docstring, and annotations."
          },
          {
            "id": "py1_q9",
            "question": "Can a Python lambda expression contain multiple statements or assignments?",
            "options": [
              "Yes, if separated by commas",
              "No, lambdas can only contain a single expression whose result is returned",
              "Yes, using semicolon delimiters",
              "Yes, within parentheses"
            ],
            "correctIndex": 1,
            "explanation": "Python lambdas are restricted to a single syntactic expression."
          },
          {
            "id": "py1_q10",
            "question": "What happens if a function has default arguments placed before non-default arguments?",
            "options": [
              "It raises a SyntaxError at compile/parse time",
              "Default values are assigned from right to left",
              "The function executes normally",
              "It raises a TypeError when called"
            ],
            "correctIndex": 0,
            "explanation": "Non-default arguments cannot follow default arguments; Python raises SyntaxError."
          }
        ]
      },
      "references": [
        {
          "title": "PEP 3102 — Keyword-Only Arguments",
          "url": "https://peps.python.org/pep-3102/",
          "source": "Python Enhancement Proposals",
          "category": "Official Standard Spec",
          "description": "Specification for named parameters that can only be supplied by keyword syntax."
        },
        {
          "title": "Python functools Module Documentation",
          "url": "https://docs.python.org/3/library/functools.html",
          "source": "Python Software Foundation",
          "category": "Official Standard Library",
          "description": "Technical reference for wraps, lru_cache, and higher-order function utilities."
        },
        {
          "title": "PEP 3102 — Keyword-Only Arguments & API Design",
          "url": "https://peps.python.org/pep-3102/",
          "source": "Python Software Foundation",
          "category": "Official PEP Specification",
          "description": "Standard specification for syntactic enforcement of keyword-only arguments in clean library design."
        }
      ],
      "keyTakeaways": [
        "LEGB resolution governs variable lookup across Python scopes.",
        "Closures capture state on the heap using cell objects.",
        "Always decorate wrappers with `@functools.wraps`.",
        "Use bare `*` to enforce keyword-only parameters in APIs."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_py1_1",
          "question": "What does @functools.wraps do?",
          "options": [
            "Accelerates function bytecode execution in C",
            "Preserves the original function's __name__, docstrings, and signature on the wrapper",
            "Forces asynchronous thread execution",
            "Locks the function against monkey-patching"
          ],
          "correctIndex": 1,
          "explanation": "wraps copies metadata from the original function to the wrapper function."
        },
        {
          "id": "kc_py1_2",
          "question": "What is the primary architectural benefit of using keyword-only parameters (`def func(*, timeout=30)`)?",
          "options": [
            "It enables automatic multi-threading",
            "It prevents silent argument ordering bugs when callers invoke APIs with multiple optional parameters",
            "It restricts the function to only accept dictionary arguments",
            "It forces compilation to native C extensions"
          ],
          "correctIndex": 1,
          "explanation": "Keyword-only parameters eliminate confusing positional calls like connect('db', True, False, 10, True) where boolean flags are easily transposed."
        }
      ],
      "interactiveSandboxCode": "def make_multiplier(factor):\n    return lambda x: x * factor\ndouble = make_multiplier(2)\ntriple = make_multiplier(3)\nprint(double(5), triple(5))\n"
    },
    {
      "id": "py_mod_2",
      "trackId": "python",
      "moduleIndex": 2,
      "title": "Object-Oriented Architecture & Dunder Methods",
      "subtitle": "Classes, Metaclasses, C3 Linearization (MRO), __slots__ Optimization, and Descriptors.",
      "estimatedTime": "55 mins",
      "icon": "python",
      "overview": "Industrial object-oriented programming in Python. Master dynamic type creation, C3 superclass linearization, method resolution order (MRO), memory-saving `__slots__` arrays, the descriptor protocol (`__get__`, `__set__`), and abstract base classes (ABCs).",
      "sections": [
        {
          "title": "1. Class Instantiation: __new__ vs __init__ and Object Lifecycle",
          "content": "`__new__` is the static allocator that creates and returns a new instance of the class. `__init__` is the initializer that populates attributes on the created instance. Customizing `__new__` is required when subclassing immutable types (like int, str, tuple) or implementing the Singleton pattern.",
          "codeExample": "class Singleton:\n    _inst = None\n    def __new__(cls):\n        if cls._inst is None:\n            cls._inst = super().__new__(cls)\n        return cls._inst\na, b = Singleton(), Singleton()\nprint(a is b) # True"
        },
        {
          "title": "2. Memory Optimization via __slots__",
          "content": "By default, every Python instance stores attributes in a dynamic `__dict__` taking ~104 bytes minimum. Declaring `__slots__ = ('name', 'id')` replaces the dictionary with a compact C pointer array, reducing memory usage by 60-70% and accelerating attribute lookups.",
          "codeExample": "class FastUser:\n    __slots__ = ('uid', 'email')\n    def __init__(self, uid, email):\n        self.uid = uid; self.email = email\nu = FastUser(1, 'dev@corp.com')\nprint(hasattr(u, '__dict__')) # False"
        },
        {
          "title": "3. Multiple Inheritance & C3 Linearization (MRO)",
          "content": "Python resolves multiple inheritance using the C3 Linearization Algorithm to construct `cls.__mro__`. It ensures children precede parents and listed parent order is preserved. Always use cooperative `super().__init__()` with kwargs.",
          "codeExample": "class Base: pass\nclass A(Base): pass\nclass B(Base): pass\nclass C(A, B): pass\nprint([cls.__name__ for cls in C.__mro__])"
        },
        {
          "title": "4. The Descriptor Protocol: __get__ and __set__",
          "content": "Descriptors power Python properties, methods, and ORMs. A descriptor implements `__get__`, `__set__`, or `__delete__`. Data descriptors implement `__set__` and take precedence over instance dictionaries.",
          "codeExample": "class PositiveNumber:\n    def __set_name__(self, owner, name): self.name = f'_{name}'\n    def __get__(self, inst, owner): return getattr(inst, self.name, 0)\n    def __set__(self, inst, val):\n        if val <= 0: raise ValueError('Must be positive')\n        setattr(inst, self.name, val)\n\nclass Item:\n    price = PositiveNumber()"
        },
        {
          "title": "5. Best Practice: Composition over Inheritance",
          "content": "Avoid deep class hierarchies. Prefer composing small, testable collaborator objects (has-a) rather than rigid multi-tier subclass trees (is-a).",
          "codeExample": "class Engine: pass\nclass Car:\n    def __init__(self, engine: Engine): self.engine = engine"
        }
      ],
      "codingExercise": {
        "taskTitle": "Build a Custom BankAccount Class",
        "functionName": "run_bank_account",
        "prompt": "Create a class `BankAccount` with `deposit(amount)`, `withdraw(amount)`, and `get_balance()`. Withdrawals exceeding the balance should not decrease balance and return False; otherwise return True. Read JSON commands from stdin: `[[\"deposit\", 100], [\"withdraw\", 40], [\"get_balance\"]]` and output the results as a JSON array.",
        "starterCode": "# Enter your code below\n",
        "testCases": [
          {
            "input": "[[\"deposit\", 100], [\"withdraw\", 30], [\"get_balance\"]]",
            "expectedOutput": "[100, true, 70]",
            "isHidden": false
          },
          {
            "input": "[[\"deposit\", 50], [\"withdraw\", 100], [\"get_balance\"]]",
            "expectedOutput": "[50, false, 50]",
            "isHidden": false
          },
          {
            "input": "[[\"deposit\", 200], [\"withdraw\", 50], [\"withdraw\", 150], [\"get_balance\"]]",
            "expectedOutput": "[200, true, true, 0]",
            "isHidden": false
          },
          {
            "input": "[[\"get_balance\"]]",
            "expectedOutput": "[0]",
            "isHidden": true
          },
          {
            "input": "[[\"withdraw\", 10], [\"get_balance\"]]",
            "expectedOutput": "[false, 0]",
            "isHidden": true
          },
          {
            "input": "[[\"deposit\", 500], [\"get_balance\"]]",
            "expectedOutput": "[500, 500]",
            "isHidden": true
          },
          {
            "input": "[[\"deposit\", 10], [\"withdraw\", 10], [\"get_balance\"]]",
            "expectedOutput": "[10, true, 0]",
            "isHidden": true
          },
          {
            "input": "[[\"deposit\", 75], [\"withdraw\", 25], [\"deposit\", 50], [\"get_balance\"]]",
            "expectedOutput": "[75, true, 100, 100]",
            "isHidden": true
          },
          {
            "input": "[[\"deposit\", 1000], [\"withdraw\", 1001], [\"get_balance\"]]",
            "expectedOutput": "[1000, false, 1000]",
            "isHidden": true
          },
          {
            "input": "[[\"deposit\", 100], [\"withdraw\", 20], [\"withdraw\", 30], [\"get_balance\"]]",
            "expectedOutput": "[100, true, true, 50]",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Object-Oriented Programming & Encapsulation",
        "inputFormat": "A JSON array of command pairs `[[\"action\", amount?], ...]` via stdin.",
        "outputFormat": "A JSON array containing the return value of each executed command in sequence.",
        "constraints": [
          "1 <= commands.length <= 100",
          "deposit amount > 0, withdraw amount > 0",
          "withdrawals exceeding balance must fail and return False without mutating balance."
        ],
        "examples": [
          {
            "input": "[[\"deposit\", 100], [\"withdraw\", 30], [\"get_balance\"]]",
            "output": "[100, true, 70]",
            "explanation": "Deposit 100 -> balance 100. Withdraw 30 (sufficient balance) -> returns True, balance is 70. get_balance -> returns 70."
          },
          {
            "input": "[[\"deposit\", 50], [\"withdraw\", 100], [\"get_balance\"]]",
            "output": "[50, false, 50]",
            "explanation": "Withdraw 100 exceeds balance 50 -> returns False, balance stays 50."
          }
        ],
        "hints": [
          "Maintain `self.balance` initialized to 0 in `__init__`.",
          "In `deposit`, add `amount` to `self.balance` and return the new balance.",
          "In `withdraw`, check `if amount > self.balance: return False`. Otherwise deduct and return True."
        ],
        "title": "Build a Custom BankAccount Class",
        "objective": "Design an object-oriented BankAccount class that enforces balance constraints, transaction validation, and state history.",
        "conceptualExplanation": [
          "Step 1: Initialize the BankAccount instance with an account holder name and non-negative starting balance.",
          "Step 2: For deposits, validate that amount > 0, increment balance, and record a 'DEPOSIT' transaction.",
          "Step 3: For withdrawals, check that amount > 0 and amount <= current balance; otherwise raise an InsufficientFunds error.",
          "Step 4: Implement get_statement() to output transaction history in chronological order."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "py2_q1",
            "question": "What is the difference between `__str__` and `__repr__` in Python?",
            "options": [
              "`__str__` is for developers; `__repr__` is for end users",
              "`__repr__` should be unambiguous and ideally valid Python code; `__str__` is readable for end users",
              "They are identical aliases",
              "`__repr__` cannot return a string"
            ],
            "correctIndex": 1,
            "explanation": "__repr__ aims to be unambiguous and machine-readable; __str__ is informal and human-readable."
          },
          {
            "id": "py2_q2",
            "question": "Which method is the actual constructor responsible for creating and returning a new object instance before `__init__`?",
            "options": [
              "__new__",
              "__build__",
              "__construct__",
              "__start__"
            ],
            "correctIndex": 0,
            "explanation": "__new__ is the static method that allocates memory and returns a new instance of the class."
          },
          {
            "id": "py2_q3",
            "question": "How does Python resolve method calls in multiple inheritance?",
            "options": [
              "Random selection",
              "C3 Linearization / Method Resolution Order (MRO)",
              "Left-to-right DFS only",
              "Alphabetical order"
            ],
            "correctIndex": 1,
            "explanation": "Python uses the C3 Linearization algorithm to compute the class MRO."
          },
          {
            "id": "py2_q4",
            "question": "What does the `@property` decorator achieve on a class method?",
            "options": [
              "Makes the method private",
              "Allows accessing a method like an attribute without calling ()",
              "Compiles the method to C",
              "Prevents inheritance"
            ],
            "correctIndex": 1,
            "explanation": "The @property decorator creates getter descriptors, allowing attribute-like access."
          },
          {
            "id": "py2_q5",
            "question": "What is the purpose of `__slots__` in a Python class?",
            "options": [
              "Allows dynamic addition of arbitrary attributes",
              "Restricts valid instance attributes, reducing memory consumption by avoiding a per-instance `__dict__`",
              "Enables multithreading safety",
              "Automatically serializes to JSON"
            ],
            "correctIndex": 1,
            "explanation": "__slots__ reserves space for declared attributes, skipping the default __dict__ to optimize memory."
          },
          {
            "id": "py2_q6",
            "question": "What is the first argument passed to a `@classmethod` by convention?",
            "options": [
              "self (instance)",
              "cls (the class itself)",
              "args",
              "super"
            ],
            "correctIndex": 1,
            "explanation": "@classmethod receives the class object `cls` as its first argument."
          },
          {
            "id": "py2_q7",
            "question": "Which dunder method must be implemented to support the `len(obj)` built-in function?",
            "options": [
              "__size__",
              "__count__",
              "__len__",
              "__length__"
            ],
            "correctIndex": 2,
            "explanation": "__len__ is invoked by the len() built-in and must return a non-negative integer."
          },
          {
            "id": "py2_q8",
            "question": "What does `super()` return?",
            "options": [
              "The parent class type directly",
              "A proxy object that delegates method calls to a parent or sibling class in the MRO",
              "A copy of self",
              "None"
            ],
            "correctIndex": 1,
            "explanation": "super() returns a proxy object that delegates method calls to classes in the caller's MRO."
          },
          {
            "id": "py2_q9",
            "question": "How does Python indicate private attributes by convention?",
            "options": [
              "private keyword",
              "Two leading underscores like `__var` triggers name mangling",
              "Protected tag in docstring",
              "CamelCase naming"
            ],
            "correctIndex": 1,
            "explanation": "Two leading underscores trigger name mangling (e.g. `_ClassName__var`) to prevent accidental overrides."
          },
          {
            "id": "py2_q10",
            "question": "Which dunder method allows an instance of a class to be called like a function `obj()`?",
            "options": [
              "__call__",
              "__invoke__",
              "__exec__",
              "__run__"
            ],
            "correctIndex": 0,
            "explanation": "Implementing `__call__` makes an instance callable like a standard function."
          }
        ]
      },
      "references": [
        {
          "title": "Python Descriptor HowTo Guide — Raymond Hettinger",
          "url": "https://docs.python.org/3/howto/descriptor.html",
          "source": "PSF",
          "category": "Official Guide",
          "description": "Authoritative guide on descriptors, properties, and method binding."
        },
        {
          "title": "Fluent Python Chapters 11-14: Object-Oriented Idioms",
          "url": "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/",
          "source": "O'Reilly",
          "category": "Authoritative Literature",
          "description": "Deep dive into special methods and descriptors."
        },
        {
          "title": "Fluent Python: Clear, Concise, and Effective Programming (2nd Edition)",
          "url": "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/",
          "source": "Luciano Ramalho / O'Reilly",
          "category": "Recommended Engineering Literature",
          "description": "Authoritative treatise on Python data models, descriptors, metaclasses, and memory management."
        }
      ],
      "keyTakeaways": [
        "`__new__` allocates the object; `__init__` initializes attributes.",
        "`__slots__` reduces per-instance memory by up to 70% by eliminating `__dict__`.",
        "Descriptors intercept attribute lookup via `__get__` and `__set__`.",
        "Prefer composition over inheritance for extensible software architecture."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_py2_1",
          "question": "What does __slots__ eliminate on Python class instances?",
          "options": [
            "Method lookup tables",
            "The dynamic __dict__ attribute dictionary",
            "The garbage collector reference count",
            "Inheritance capabilities"
          ],
          "correctIndex": 1,
          "explanation": "__slots__ eliminates the per-instance dictionary, replacing it with a fixed C array."
        },
        {
          "id": "kc_py2_2",
          "question": "How does defining `__slots__` on a Python class reduce memory consumption?",
          "options": [
            "It forces Python to store attributes on the GPU",
            "It replaces the dynamic per-instance `__dict__` hash table with a fixed-size C array of descriptor pointers",
            "It compresses all string attributes with gzip",
            "It prevents subclasses from being instantiated"
          ],
          "correctIndex": 1,
          "explanation": "Standard Python instances allocate an internal dict (~100+ bytes) per instance. `__slots__` eliminates `__dict__`, reducing per-instance memory by up to 70%."
        }
      ],
      "interactiveSandboxCode": "class Slotted:\n    __slots__ = ('x', 'y')\n    def __init__(self, x, y): self.x = x; self.y = y\n\ns = Slotted(10, 20)\nprint(s.x, s.y)\n"
    },
    {
      "id": "py_mod_3",
      "trackId": "python",
      "moduleIndex": 3,
      "title": "File I/O, Serialization & Error Handling",
      "subtitle": "Context Managers, Streaming Buffer I/O, JSON/Protobuf Serialization, and Exception Chains.",
      "estimatedTime": "50 mins",
      "icon": "python",
      "overview": "Production-grade input/output architecture in Python. Master streaming buffered I/O, file descriptor safety with context managers (`with`), modern serialization (JSON, Protocol Buffers, avoiding insecure pickle), robust custom exception hierarchies, and exception chaining (`raise ... from`).",
      "sections": [
        {
          "title": "1. The Context Manager Protocol: __enter__ & __exit__ Mechanics",
          "content": "The `with` statement guarantees deterministic resource cleanup. `__enter__` acquires resources and returns the bound target; `__exit__(self, exc_type, exc_val, exc_tb)` cleanups. Returning True from `__exit__` suppresses exceptions.",
          "codeExample": "class SafeFile:\n    def __init__(self, path): self.path = path\n    def __enter__(self): self.f = open(self.path, 'w', encoding='utf-8'); return self.f\n    def __exit__(self, t, v, tb): self.f.close(); return False"
        },
        {
          "title": "2. Streaming Large Files: Generator Pipelines",
          "content": "Reading large multi-gigabyte files into memory causes Out-Of-Memory (OOM) failures. Python file objects are generators that yield line by line in O(1) constant memory.",
          "codeExample": "def stream_errors(log_path):\n    with open(log_path, 'r', encoding='utf-8') as f:\n        for line in f:\n            if 'ERROR' in line: yield line.strip()"
        },
        {
          "title": "3. Safe Serialization: JSON vs Insecure Pickle",
          "content": "Never deserialize pickle payloads from untrusted network clients because pickle can execute arbitrary bytecode via `__reduce__`. Use JSON, MessagePack, or Protocol Buffers.",
          "codeExample": "import json\ndata = {'service': 'auth', 'active': True}\njson_str = json.dumps(data)\nparsed = json.loads(json_str)"
        },
        {
          "title": "4. Exception Chaining: raise ... from original_exc",
          "content": "Use `raise NewException(...) from orig_exc` to preserve the underlying cause in `__cause__` while presenting high-level domain errors to callers.",
          "codeExample": "try: int('invalid')\nexcept ValueError as err:\n    raise RuntimeError('Data parsing failed') from err"
        },
        {
          "title": "5. Atomic File Writes with os.replace",
          "content": "Never overwrite live production files directly. Write to a temporary file (`file.tmp`) and atomically replace it using `os.replace` to prevent corrupted partial reads.",
          "codeExample": "import os\ndef atomic_write(path, data):\n    tmp = f'{path}.tmp'\n    with open(tmp, 'w', encoding='utf-8') as f: f.write(data)\n    os.replace(tmp, path)"
        }
      ],
      "codingExercise": {
        "taskTitle": "Safe JSON Parser & Property Extractor",
        "functionName": "safe_json_parser",
        "prompt": "Write a function that parses a JSON string from stdin. If valid JSON with key `values` (a list of numbers), return the average rounded to 2 decimal places. If invalid JSON or key is missing, return -1.",
        "starterCode": "# Enter your code below\n",
        "testCases": [
          {
            "input": "{\"values\": [10, 20, 30]}",
            "expectedOutput": "20.0",
            "isHidden": false
          },
          {
            "input": "{\"other\": 123}",
            "expectedOutput": "-1",
            "isHidden": false
          },
          {
            "input": "invalid json text",
            "expectedOutput": "-1",
            "isHidden": false
          },
          {
            "input": "{\"values\": [5, 10, 15, 20]}",
            "expectedOutput": "12.5",
            "isHidden": true
          },
          {
            "input": "{\"values\": [100]}",
            "expectedOutput": "100.0",
            "isHidden": true
          },
          {
            "input": "{\"values\": []}",
            "expectedOutput": "-1",
            "isHidden": true
          },
          {
            "input": "{}",
            "expectedOutput": "-1",
            "isHidden": true
          },
          {
            "input": "not even close to json",
            "expectedOutput": "-1",
            "isHidden": true
          },
          {
            "input": "{\"values\": [-10, 10, -20, 20]}",
            "expectedOutput": "0.0",
            "isHidden": true
          },
          {
            "input": "{\"values\": [2.5, 7.5, 10.0]}",
            "expectedOutput": "6.67",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Exception Handling & JSON Serialization",
        "inputFormat": "A raw string from stdin representing a potential JSON payload.",
        "outputFormat": "A single float (average of values) or integer -1 on error.",
        "constraints": [
          "Catch JSONDecodeError, KeyError, TypeError, and ZeroDivisionError gracefully.",
          "Return float rounded to 2 decimal places if valid list with numbers exists.",
          "Return -1 if invalid JSON, missing 'values', or empty list."
        ],
        "examples": [
          {
            "input": "{\"values\": [10, 20, 30]}",
            "output": "20.0",
            "explanation": "Average of [10, 20, 30] is 60 / 3 = 20.0."
          },
          {
            "input": "{\"other\": 123}",
            "output": "-1",
            "explanation": "'values' key is missing, so -1 is returned."
          }
        ],
        "hints": [
          "Wrap `json.loads(raw_text)` in a `try...except` block.",
          "Verify `\"values\" in data` and `isinstance(data[\"values\"], list)` and `len(data[\"values\"]) > 0`.",
          "Compute `sum(data[\"values\"]) / len(data[\"values\"])` and round to 2 decimals."
        ],
        "title": "Safe JSON Parser & Property Extractor",
        "objective": "Implement robust error handling with custom exceptions to safely parse potentially malformed JSON payloads.",
        "conceptualExplanation": [
          "Step 1: Read the input string and wrap `json.loads()` inside a `try...except (json.JSONDecodeError, ValueError)` block.",
          "Step 2: If parsing succeeds, check if the required target key exists in the parsed dictionary.",
          "Step 3: If parsing fails or the key is missing, catch the exception and print a standardized error payload `{\"error\": \"INVALID_JSON\"}`.",
          "Step 4: If valid, output the extracted property value as JSON."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "py3_q1",
            "question": "What two dunder methods must an object implement to adhere to Python's context management protocol?",
            "options": [
              "__open__ and __close__",
              "__enter__ and __exit__",
              "__start__ and __stop__",
              "__init__ and __del__"
            ],
            "correctIndex": 1,
            "explanation": "Context managers require __enter__() and __exit__()."
          },
          {
            "id": "py3_q2",
            "question": "Which base class should all user-defined exceptions inherit from directly or indirectly?",
            "options": [
              "BaseException",
              "Exception",
              "RuntimeError",
              "SystemError"
            ],
            "correctIndex": 1,
            "explanation": "User-defined exceptions should inherit from Exception, reserving BaseException for system-exiting exceptions like KeyboardInterrupt."
          },
          {
            "id": "py3_q3",
            "question": "When does the `finally` block execute in a `try...except...finally` construct?",
            "options": [
              "Only if an exception was raised",
              "Only if no exception was raised",
              "Always, regardless of whether an exception occurred or was handled",
              "Only if the process crashes"
            ],
            "correctIndex": 2,
            "explanation": "The finally block is guaranteed to execute regardless of how the try block exits."
          },
          {
            "id": "py3_q4",
            "question": "What does the `json.dumps()` method do?",
            "options": [
              "Reads JSON from a file pointer",
              "Serializes a Python object into a JSON-formatted string",
              "Deserializes a JSON string into a Python object",
              "Validates a JSON schema"
            ],
            "correctIndex": 1,
            "explanation": "json.dumps() serializes an in-memory Python object into a JSON string."
          },
          {
            "id": "py3_q5",
            "question": "What mode string should be passed to `open()` to open a file for reading in binary mode?",
            "options": [
              "'r'",
              "'rb'",
              "'wb'",
              "'w+'"
            ],
            "correctIndex": 1,
            "explanation": "'rb' opens a file in binary read mode, returning bytes instead of strings."
          },
          {
            "id": "py3_q6",
            "question": "What happens if an unhandled exception occurs inside a `with` statement's body?",
            "options": [
              "The file descriptor remains open",
              "__exit__ is invoked, and if it returns a falsey value, the exception propagates",
              "Python ignores the exception",
              "Memory is corrupted"
            ],
            "correctIndex": 1,
            "explanation": "__exit__ is called with (exc_type, exc_val, exc_tb). If it doesn't return True, the exception propagates."
          },
          {
            "id": "py3_q7",
            "question": "Which module from the Python standard library provides a decorator to create context managers using generators?",
            "options": [
              "functools",
              "contextlib",
              "itertools",
              "sys"
            ],
            "correctIndex": 1,
            "explanation": "@contextlib.contextmanager allows writing context managers using a generator with yield."
          },
          {
            "id": "py3_q8",
            "question": "What does the `else` block in a `try...except...else` construct do?",
            "options": [
              "Runs if an exception was caught",
              "Runs only if NO exceptions were raised in the try block",
              "Runs after finally",
              "Catches all errors"
            ],
            "correctIndex": 1,
            "explanation": "The else block in a try statement runs strictly when the try block executes without raising any exceptions."
          },
          {
            "id": "py3_q9",
            "question": "How do you re-raise the active exception currently being handled in an `except` block?",
            "options": [
              "raise active",
              "raise",
              "raise Exception()",
              "throw"
            ],
            "correctIndex": 1,
            "explanation": "A bare `raise` statement re-raises the current active exception."
          },
          {
            "id": "py3_q10",
            "question": "What is the difference between `json.load()` and `json.loads()`?",
            "options": [
              "json.load() parses from a file-like stream; json.loads() parses from a string",
              "json.load() is deprecated",
              "json.loads() is faster",
              "They are identical aliases"
            ],
            "correctIndex": 0,
            "explanation": "load() takes a readable stream/file object; loads() takes a string or byte string."
          }
        ]
      },
      "references": [
        {
          "title": "PEP 343 — The 'with' Statement",
          "url": "https://peps.python.org/pep-0343/",
          "source": "PSF",
          "category": "Official Standard Spec",
          "description": "Specification for context managers."
        },
        {
          "title": "PEP 3134 — Exception Chaining",
          "url": "https://peps.python.org/pep-3134/",
          "source": "PSF",
          "category": "Official Standard Spec",
          "description": "Specification for raise ... from and __cause__."
        },
        {
          "title": "PEP 342 — Coroutines via Enhanced Generators",
          "url": "https://peps.python.org/pep-0342/",
          "source": "Python Software Foundation",
          "category": "Official PEP Specification",
          "description": "Core specification introducing two-way communication (.send, .throw) via Python generators."
        }
      ],
      "keyTakeaways": [
        "Always use context managers (`with`) for deterministic file and socket closure.",
        "Stream large files line by line to keep memory consumption constant O(1).",
        "Avoid pickle for untrusted network input; use JSON or Protocol Buffers.",
        "Use `raise ... from` to preserve diagnostic tracebacks across architecture layers."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_py3_1",
          "question": "Why is pickle considered dangerous for untrusted input?",
          "options": [
            "It causes stack overflows",
            "It can execute arbitrary system commands via __reduce__ during deserialization",
            "It does not support strings",
            "It is slower than XML"
          ],
          "correctIndex": 1,
          "explanation": "Pickle can construct arbitrary objects and execute system functions during unpickling."
        },
        {
          "id": "kc_py3_2",
          "question": "Why are generator pipelines (`(x for x in stream)`) preferred over list comprehensions for processing large log files?",
          "options": [
            "Generators bypass the Global Interpreter Lock (GIL)",
            "Generators yield elements lazily one at a time, maintaining O(1) memory consumption regardless of stream size",
            "Generators are automatically compiled to assembly",
            "Generators write logs directly to NVMe SSDs"
          ],
          "correctIndex": 1,
          "explanation": "A list comprehension materializes the entire file in RAM simultaneously, causing Out-Of-Memory crashes. Generators evaluate lazily in constant memory."
        }
      ],
      "interactiveSandboxCode": "import json\npayload = {'status': 'healthy', 'uptime_sec': 3600}\nprint(json.dumps(payload, indent=2))\n"
    },
    {
      "id": "py_mod_4",
      "trackId": "python",
      "moduleIndex": 4,
      "title": "Advanced Collections & Pythonic Design Patterns",
      "subtitle": "Collections Module, Itertools, Functools (LRU Cache), Protocol Types, and GIL Implications.",
      "estimatedTime": "55 mins",
      "icon": "python",
      "overview": "High-performance data structures and idiomatic Python patterns. Master the `collections` module (deque, Counter, defaultdict), infinite combinatoric iterators (`itertools`), memoization with `@lru_cache`, structural subtyping (`typing.Protocol`), and understanding the Global Interpreter Lock (GIL).",
      "sections": [
        {
          "title": "1. The collections Module: Deque, Counter & DefaultDict",
          "content": "`collections.deque` provides O(1) appends and pops from both ends, unlike lists where `pop(0)` is O(N). `Counter` simplifies frequency analysis. `defaultdict` eliminates missing-key checks.",
          "codeExample": "from collections import deque, Counter, defaultdict\nq = deque([1, 2, 3])\nq.appendleft(0)\nprint(list(q)) # [0, 1, 2, 3] in O(1) time"
        },
        {
          "title": "2. The itertools Module: High-Speed Generator Pipelines",
          "content": "`itertools` provides C-accelerated iterator combinators like `chain`, `islice`, and `combinations` that stream infinite or large datasets in O(1) memory.",
          "codeExample": "import itertools\ncombos = list(itertools.combinations(['A', 'B', 'C'], 2))\nprint(combos) # [('A', 'B'), ('A', 'C'), ('B', 'C')]"
        },
        {
          "title": "3. Memoization with functools.lru_cache",
          "content": "Decorating pure functions with `@functools.lru_cache` stores computed results in an in-memory hash table, collapsing recursive exponential time to linear O(N).",
          "codeExample": "from functools import lru_cache\n@lru_cache(maxsize=128)\ndef fib(n): return n if n < 2 else fib(n-1) + fib(n-2)\nprint(fib(50))"
        },
        {
          "title": "4. Static Duck Typing with typing.Protocol",
          "content": "Python 3.8+ Protocol enables structural subtyping: any class implementing required methods matches the type without inheriting from a base class.",
          "codeExample": "from typing import Protocol\nclass Greeter(Protocol):\n    def greet(self) -> str: ...\nclass Robot:\n    def greet(self) -> str: return 'Beep Boop'\n# Robot matches Greeter automatically!"
        },
        {
          "title": "5. Concurrency & The Global Interpreter Lock (GIL)",
          "content": "The GIL prevents multiple native OS threads from running Python bytecode concurrently. Use `threading`/`asyncio` for I/O-bound tasks and `multiprocessing` for CPU-bound tasks.",
          "codeExample": "from concurrent.futures import ProcessPoolExecutor\n# Scales CPU bound work across multiple processor cores"
        }
      ],
      "codingExercise": {
        "taskTitle": "Top-K Frequent Elements with Counter",
        "functionName": "top_k_frequent",
        "prompt": "Write a Python script that reads a JSON object `{\"nums\": [1,1,1,2,2,3], \"k\": 2}` from stdin and returns the top `k` most frequent numbers in descending order of frequency as a JSON array.",
        "starterCode": "# Enter your code below\n",
        "testCases": [
          {
            "input": "{\"nums\": [1,1,1,2,2,3], \"k\": 2}",
            "expectedOutput": "[1, 2]",
            "isHidden": false
          },
          {
            "input": "{\"nums\": [4,4,4,4], \"k\": 1}",
            "expectedOutput": "[4]",
            "isHidden": false
          },
          {
            "input": "{\"nums\": [9,8,8,7,7,7], \"k\": 2}",
            "expectedOutput": "[7, 8]",
            "isHidden": false
          },
          {
            "input": "{\"nums\": [1,2,3,4,5], \"k\": 1}",
            "expectedOutput": "[1]",
            "isHidden": true
          },
          {
            "input": "{\"nums\": [5,5,5,2,2,3,3,3,3], \"k\": 2}",
            "expectedOutput": "[3, 5]",
            "isHidden": true
          },
          {
            "input": "{\"nums\": [10,10,20,20,30,30,40,40,40], \"k\": 1}",
            "expectedOutput": "[40]",
            "isHidden": true
          },
          {
            "input": "{\"nums\": [7], \"k\": 1}",
            "expectedOutput": "[7]",
            "isHidden": true
          },
          {
            "input": "{\"nums\": [1,2,2,3,3,3,4,4,4,4], \"k\": 3}",
            "expectedOutput": "[4, 3, 2]",
            "isHidden": true
          },
          {
            "input": "{\"nums\": [-1,-1,-2,-2,-2], \"k\": 1}",
            "expectedOutput": "[-2]",
            "isHidden": true
          },
          {
            "input": "{\"nums\": [100,200,100,200,300], \"k\": 2}",
            "expectedOutput": "[100, 200]",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Collections Counter & Frequency Sorting",
        "inputFormat": "A JSON object `{\"nums\": [...], \"k\": int}` from stdin.",
        "outputFormat": "A JSON array of the top k most frequent integers.",
        "constraints": [
          "1 <= k <= number of unique elements <= 10^5",
          "nums contains integers in range [-10^5, 10^5].",
          "Time Complexity: O(N log k) or O(N)."
        ],
        "examples": [
          {
            "input": "{\"nums\": [1,1,1,2,2,3], \"k\": 2}",
            "output": "[1, 2]",
            "explanation": "1 appears 3 times, 2 appears 2 times, 3 appears 1 time. Top 2 are [1, 2]."
          },
          {
            "input": "{\"nums\": [4,4,4,4], \"k\": 1}",
            "output": "[4]",
            "explanation": "4 is the only and most frequent element."
          }
        ],
        "hints": [
          "Use `collections.Counter(nums)` to count frequencies.",
          "Call `counter.most_common(k)` to retrieve the top k pairs.",
          "Extract just the keys from the pairs to return the final list."
        ],
        "title": "Top-K Frequent Elements with Counter",
        "objective": "Leverage hash mapping and sorting to find the k most frequent elements in a collection with optimal complexity.",
        "conceptualExplanation": [
          "Step 1: Read the input JSON array `nums` and target integer `k`.",
          "Step 2: Build a frequency map counting occurrences of each unique element using collections.Counter or a standard dict.",
          "Step 3: Sort the unique elements by frequency in descending order (or use a min-heap of size k for O(N log k)).",
          "Step 4: Extract the top k elements and print the result as a sorted JSON list."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "py4_q1",
            "question": "What does a function containing a `yield` statement return when initially invoked?",
            "options": [
              "The yielded value",
              "A generator object",
              "None",
              "A list containing all values"
            ],
            "correctIndex": 1,
            "explanation": "Calling a generator function returns a generator iterator object without executing the body until __next__() is called."
          },
          {
            "id": "py4_q2",
            "question": "What is the primary memory advantage of a generator over a list comprehension?",
            "options": [
              "Generators use CPU cache",
              "Generators produce items on demand in O(1) space instead of allocating the entire list in memory",
              "Generators are compiled to binary",
              "There is no difference"
            ],
            "correctIndex": 1,
            "explanation": "Generators evaluate lazily, consuming O(1) memory regardless of stream length."
          },
          {
            "id": "py4_q3",
            "question": "What exception is raised by an iterator when there are no further items to yield?",
            "options": [
              "IndexError",
              "StopIteration",
              "EOFError",
              "KeyError"
            ],
            "correctIndex": 1,
            "explanation": "The iterator protocol signals termination by raising StopIteration."
          },
          {
            "id": "py4_q4",
            "question": "What does `collections.defaultdict(list)` do when a missing key is accessed?",
            "options": [
              "Raises a KeyError",
              "Automatically calls `list()` to initialize the key with `[]` and returns it",
              "Returns None",
              "Deletes the key"
            ],
            "correctIndex": 1,
            "explanation": "defaultdict invokes its default_factory callable to create an initial value for missing keys."
          },
          {
            "id": "py4_q5",
            "question": "What is the time complexity of popping an element from the left end of a `collections.deque`?",
            "options": [
              "O(N)",
              "O(1)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 1,
            "explanation": "deques are doubly linked lists under the hood, enabling O(1) appends and pops from both ends."
          },
          {
            "id": "py4_q6",
            "question": "Which decorator introduced in Python 3.7 automatically writes boilerplate methods like `__init__` and `__repr__` based on type annotations?",
            "options": [
              "@pydantic",
              "@dataclass",
              "@struct",
              "@model"
            ],
            "correctIndex": 1,
            "explanation": "The `@dataclass` decorator from `dataclasses` generates standard boilerplate methods."
          },
          {
            "id": "py4_q7",
            "question": "What does `itertools.chain(iter1, iter2)` do?",
            "options": [
              "Executes both in parallel",
              "Treats consecutive iterables as a single continuous sequence",
              "Multiplies their elements",
              "Zips them into pairs"
            ],
            "correctIndex": 1,
            "explanation": "itertools.chain chains multiple iterables sequentially into one iterator."
          },
          {
            "id": "py4_q8",
            "question": "What does the expression `(x**2 for x in range(10))` produce?",
            "options": [
              "A list of 10 squared integers",
              "A generator expression",
              "A tuple of 10 squared integers",
              "A set comprehension"
            ],
            "correctIndex": 1,
            "explanation": "Parentheses around a comprehension syntax create a generator expression."
          },
          {
            "id": "py4_q9",
            "question": "What is the time complexity of `collections.Counter(lst)` where `lst` has length N?",
            "options": [
              "O(N)",
              "O(N log N)",
              "O(N²)",
              "O(1)"
            ],
            "correctIndex": 0,
            "explanation": "Counter counts elements in a single linear pass over the iterable in O(N) time."
          },
          {
            "id": "py4_q10",
            "question": "How do you make an instance of a `@dataclass` immutable (read-only)?",
            "options": [
              "Pass `frozen=True` into `@dataclass(frozen=True)`",
              "Use const keyword",
              "Declare all attributes as private",
              "Use tuple inheritance"
            ],
            "correctIndex": 0,
            "explanation": "@dataclass(frozen=True) generates a class where setting attributes raises FrozenInstanceError."
          }
        ]
      },
      "references": [
        {
          "title": "Python collections Documentation",
          "url": "https://docs.python.org/3/library/collections.html",
          "source": "PSF",
          "category": "Official Standard Library",
          "description": "Full specification of deque, Counter, and defaultdict."
        },
        {
          "title": "PEP 544 — Protocols: Structural Subtyping",
          "url": "https://peps.python.org/pep-0544/",
          "source": "PSF",
          "category": "Official Standard Spec",
          "description": "Specification for typing.Protocol."
        },
        {
          "title": "PEP 492 — Coroutines with async and await syntax",
          "url": "https://peps.python.org/pep-0492/",
          "source": "Python Software Foundation",
          "category": "Official PEP Specification",
          "description": "Foundational Python asynchronous language standard introducing native coroutine semantics."
        }
      ],
      "keyTakeaways": [
        "Use `deque` for O(1) double-ended queue operations instead of list.pop(0).",
        "`itertools` offers zero-overhead streaming combinators.",
        "`@lru_cache` memoizes pure recursive computations.",
        "The GIL requires multiprocessing for CPU-bound performance."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_py4_1",
          "question": "What is the time complexity of popping an element from the front of a list vs a deque?",
          "options": [
            "Both are O(1)",
            "list is O(N), deque is O(1)",
            "list is O(1), deque is O(N)",
            "Both are O(log N)"
          ],
          "correctIndex": 1,
          "explanation": "list.pop(0) shifts all elements in memory, while deque simply unlinks the node in O(1)."
        },
        {
          "id": "kc_py4_2",
          "question": "What is the primary pitfall of running CPU-bound numerical tasks with `asyncio`?",
          "options": [
            "Asyncio will raise a TypeError on float calculations",
            "CPU-bound tasks block the single-threaded event loop, preventing all concurrent I/O coroutines from progressing",
            "Asyncio requires 64-bit ARM architecture",
            "Coroutines cannot return integer values"
          ],
          "correctIndex": 1,
          "explanation": "Asyncio uses cooperative multitasking on a single thread. A long CPU computation never yields execution, freezing all other network/HTTP handlers unless offloaded to a ProcessPoolExecutor."
        }
      ],
      "interactiveSandboxCode": "from collections import Counter\ncounts = Counter('abracadabra')\nprint(counts.most_common(3))\n"
    }
  ],
  "javascript": [
    {
      "id": "js_mod_0",
      "trackId": "javascript",
      "moduleIndex": 0,
      "title": "JavaScript Essentials",
      "subtitle": "V8 Engine Architecture, Call Stack, Memory Heap, Hoisting, TDZ, and Type Coercion.",
      "estimatedTime": "50 mins",
      "icon": "javascript",
      "overview": "A comprehensive deep dive into JavaScript's execution environment. Understand how the V8 engine compiles code via Ignition (bytecode interpreter) and TurboFan (JIT compiler), lexical environments, variable hoisting, the Temporal Dead Zone (TDZ), and strict equality.",
      "sections": [
        {
          "title": "1. V8 Engine Architecture: Ignition, TurboFan & The Call Stack",
          "content": "Modern JavaScript engines like Google V8 parse source code into an Abstract Syntax Tree (AST), which the Ignition interpreter converts into bytecode. Frequently executed functions ('hot code') are analyzed by TurboFan and optimized directly into machine code. The Call Stack manages execution frames synchronously using LIFO order.",
          "codeExample": "function multiply(a, b) { return a * b; }\nfunction computeTotal(x) { return multiply(x, 1.2); }\nconsole.log(computeTotal(100)); // 120"
        },
        {
          "title": "2. Execution Contexts, Hoisting & The Temporal Dead Zone (TDZ)",
          "content": "Every execution context consists of a Variable Environment and a Lexical Environment. `var` declarations are hoisted and initialized to `undefined`. `let` and `const` declarations are hoisted into the lexical scope but remain uninitialized in the Temporal Dead Zone (TDZ) until their declaration line is executed.",
          "codeExample": "// console.log(x); // ReferenceError: Cannot access 'x' before initialization (TDZ)\nlet x = 10;\nconsole.log(x); // 10\n\nconsole.log(legacyVar); // undefined (hoisted and initialized)\nvar legacyVar = 20;"
        },
        {
          "title": "3. Type Coercion Rules & Strict Equality (Object.is)",
          "content": "JavaScript features implicit type coercion in comparisons (`==`). The strict equality operator (`===`) checks both value and type without coercion. `Object.is()` resolves special edge cases: `Object.is(NaN, NaN)` is `true`, and `Object.is(-0, +0)` is `false`.",
          "codeExample": "console.log([] == 0);          // true: [] coerces to '' then to 0\nconsole.log([] === 0);         // false: object vs number\nconsole.log(NaN === NaN);      // false: IEEE 754 standard\nconsole.log(Object.is(NaN, NaN)); // true"
        },
        {
          "title": "4. Memory Allocation & Garbage Collection (Mark-and-Sweep)",
          "content": "Primitive values (numbers, booleans, symbols) are stored on the execution stack, while non-primitives (objects, arrays, functions) reside in the Memory Heap. V8 collects garbage via a Generational Mark-and-Sweep collector: Young Generation (Scavenger Cheney algorithm) and Old Generation (Mark-Sweep-Compact).",
          "codeExample": "let user = { name: 'Alice' }; // Heap allocated\nuser = null; // Unreachable: marked for sweep by V8 collector"
        },
        {
          "title": "5. Production Best Practices & Pitfalls",
          "content": "• Never use `var`: Always use `const` by default and `let` only for reassigned identifiers.\n• Beware of implicit NaN: Arithmetic on undefined returns `NaN` which silently propagates through business logic.\n• Enable Strict Mode: Always use `'use strict';` or ES Modules to disallow accidental global leaks.",
          "codeExample": "'use strict';\nfunction safeCalculate(price, taxRate = 0.05) {\n    if (typeof price !== 'number' || isNaN(price)) throw new TypeError('Price must be a valid number');\n    return price * (1 + taxRate);\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Deep Clone An Object with Circular Reference Safety",
        "functionName": "deepClone",
        "prompt": "Implement a deep clone utility function `deepClone(obj)` in JavaScript. Read a JSON object from stdin, deep-clone it, mutate a nested property on the clone without affecting the original, and return true if original remained unmutated.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "{\"user\": \"Alice\", \"nested\": {\"value\": 42}}",
            "expectedOutput": "true",
            "isHidden": false
          },
          {
            "input": "{\"items\": [1, 2, 3]}",
            "expectedOutput": "true",
            "isHidden": false
          },
          {
            "input": "{\"config\": {\"deep\": {\"nested\": {\"value\": 1}}}}",
            "expectedOutput": "true",
            "isHidden": false
          },
          {
            "input": "{}",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "{\"a\": 1, \"b\": \"str\", \"c\": true}",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "{\"arr\": [{\"id\": 1}, {\"id\": 2}]}",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "{\"num\": 100}",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "{\"emptyObj\": {}, \"emptyArr\": []}",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "{\"flag\": false, \"nullVal\": null}",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "{\"x\": 10, \"y\": 20, \"sub\": {\"z\": 30}}",
            "expectedOutput": "true",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "V8 Memory Model & Deep Cloning",
        "inputFormat": "A JSON string representing an object with nested properties via stdin.",
        "outputFormat": "Print 'true' if the object was cloned deeply without shared references.",
        "constraints": [
          "Must handle nested objects, arrays, and primitives.",
          "Mutating clone must never alter original object."
        ],
        "examples": [
          {
            "input": "{\"user\": \"Alice\", \"nested\": {\"value\": 42}}",
            "output": "true",
            "explanation": "Deep clone successfully duplicates nested structures into independent heap memory."
          }
        ],
        "hints": [
          "Recursively clone objects and arrays, or use `structuredClone(obj)`.",
          "Verify that primitive types (strings, numbers, null) are returned directly."
        ],
        "title": "Deep Clone An Object with Circular Reference Safety",
        "objective": "Implement a deep clone function supporting nested objects, arrays, and dates while preventing infinite recursion on circular references.",
        "conceptualExplanation": [
          "Step 1: Check if the value is a primitive (null, number, string, boolean, undefined, symbol); return immediately if so.",
          "Step 2: Use a `WeakMap` to keep track of visited objects to prevent infinite recursion on circular object graphs.",
          "Step 3: If the object has already been cloned in the WeakMap, return the cached clone.",
          "Step 4: Handle Date and RegExp instances by constructing new instances with their primitive values.",
          "Step 5: Recursively deep clone all own enumerable properties (or array elements) into the new instance and return."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "js0_q1",
            "question": "What occurs during the Creation Phase of a JavaScript Execution Context?",
            "options": [
              "Code is executed line by line",
              "Memory is allocated for variables and functions, and 'this' is bound",
              "The garbage collector runs",
              "DOM events are dispatched"
            ],
            "correctIndex": 1,
            "explanation": "The engine creates the global object, binds 'this', and registers variable declarations."
          },
          {
            "id": "js0_q2",
            "question": "What is the Temporal Dead Zone (TDZ) in JavaScript?",
            "options": [
              "A period when memory is frozen",
              "The region of a block before a `let` or `const` declaration where accessing the variable throws ReferenceError",
              "The timeout interval in setTimeout",
              "A thread starvation state"
            ],
            "correctIndex": 1,
            "explanation": "Variables declared with let and const exist in the TDZ from block start until declaration is evaluated."
          },
          {
            "id": "js0_q3",
            "question": "Which JavaScript data type is stored by reference rather than by value?",
            "options": [
              "Symbol",
              "BigInt",
              "Object (including Array and Function)",
              "String"
            ],
            "correctIndex": 2,
            "explanation": "Objects are stored in the memory heap and accessed via reference pointers."
          },
          {
            "id": "js0_q4",
            "question": "What does `typeof null` return in JavaScript?",
            "options": [
              "'null'",
              "'object'",
              "'undefined'",
              "'boolean'"
            ],
            "correctIndex": 1,
            "explanation": "Due to a legacy bug in JavaScript's original type tag implementation, typeof null returns 'object'."
          },
          {
            "id": "js0_q5",
            "question": "What is the result of `0.1 + 0.2 === 0.3` in JavaScript?",
            "options": [
              "true",
              "false",
              "NaN",
              "TypeError"
            ],
            "correctIndex": 1,
            "explanation": "Because of IEEE 754 binary floating-point rounding errors, 0.1 + 0.2 evaluates to 0.30000000000000004."
          },
          {
            "id": "js0_q6",
            "question": "How does JavaScript determine which function is currently executing?",
            "options": [
              "Through the top frame of the Call Stack",
              "Through the microtask queue",
              "Using the DOM tree",
              "By checking global scope"
            ],
            "correctIndex": 0,
            "explanation": "The call stack tracks execution frames in LIFO order; the top frame is the active one."
          },
          {
            "id": "js0_q7",
            "question": "What is the difference between `==` and `===` in JavaScript?",
            "options": [
              "`==` compares memory references; `===` compares values",
              "`==` performs implicit type coercion; `===` requires strict type and value identity",
              "`===` is deprecated",
              "There is no difference"
            ],
            "correctIndex": 1,
            "explanation": "`==` converts operands to a common type before comparison; `===` checks type and value without coercion."
          },
          {
            "id": "js0_q8",
            "question": "What is the scope of a variable declared with `var` inside an `if` block?",
            "options": [
              "The `if` block only",
              "The enclosing function (or global scope if outside a function)",
              "Module scope only",
              "Block scope"
            ],
            "correctIndex": 1,
            "explanation": "`var` is function-scoped (or globally scoped), not block-scoped."
          },
          {
            "id": "js0_q9",
            "question": "What is the purpose of the V8 Just-In-Time (JIT) compiler (TurboFan)?",
            "options": [
              "To format JavaScript code",
              "To compile hot bytecode into optimized machine code at runtime",
              "To manage cookies",
              "To interpret CSS"
            ],
            "correctIndex": 1,
            "explanation": "TurboFan compiles frequently executed bytecode into optimized machine code."
          },
          {
            "id": "js0_q10",
            "question": "What error is thrown if you try to reassign a `const` variable?",
            "options": [
              "ReferenceError",
              "TypeError",
              "SyntaxError",
              "RangeError"
            ],
            "correctIndex": 1,
            "explanation": "Reassigning a constant variable throws a TypeError: Assignment to constant variable."
          }
        ]
      },
      "references": [
        {
          "title": "MDN Web Docs — JavaScript Guide: Memory Management",
          "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management",
          "source": "Mozilla Developer Network",
          "category": "Authoritative Web Spec",
          "description": "Comprehensive documentation on JavaScript heap memory, reference cycles, and mark-and-sweep garbage collection."
        },
        {
          "title": "ECMAScript 2024 Language Specification (ECMA-262)",
          "url": "https://tc39.es/ecma262/",
          "source": "Ecma International / TC39",
          "category": "Official Standard Spec",
          "description": "The official standard specification for JavaScript language grammar, runtime execution contexts, and types."
        },
        {
          "title": "V8 JavaScript Engine Architecture — Google Developers",
          "url": "https://v8.dev/",
          "source": "Google V8 Team",
          "category": "Engine Engineering Reference",
          "description": "Technical articles explaining Ignition bytecode compiler, TurboFan JIT optimizations, and hidden classes."
        }
      ],
      "keyTakeaways": [
        "V8 combines Ignition (bytecode interpreter) and TurboFan (JIT compiler) for maximum execution speed.",
        "`let` and `const` are hoisted into the Temporal Dead Zone (TDZ) and cannot be read before initialization.",
        "Always use strict equality (`===`) or `Object.is()` to avoid unexpected coercion bugs.",
        "Primitives live on the stack; objects, functions, and arrays live on the heap."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_js0_1",
          "question": "What causes a ReferenceError when reading a `let` variable before its declaration line?",
          "options": [
            "The variable was never compiled",
            "The variable exists in the Temporal Dead Zone (TDZ)",
            "Variables in JavaScript cannot be accessed outside functions",
            "let variables are stored on disk"
          ],
          "correctIndex": 1,
          "explanation": "let and const are hoisted into the scope but are kept in the Temporal Dead Zone until their definition is evaluated."
        },
        {
          "id": "kc_js0_2",
          "question": "Why is `Object.is(NaN, NaN)` true while `NaN === NaN` is false?",
          "options": [
            "Object.is converts NaN to 0",
            "NaN === NaN follows IEEE-754 semantics where NaN is not equal to itself, whereas Object.is tests exact value identity",
            "Strict equality only works on numbers below 100",
            "Object.is runs in WebAssembly"
          ],
          "correctIndex": 1,
          "explanation": "IEEE-754 defines NaN as unequal to any value including itself. Object.is accurately tests same-value identity."
        }
      ],
      "interactiveSandboxCode": "console.log('Object.is(NaN, NaN):', Object.is(NaN, NaN));\nconsole.log('NaN === NaN:', NaN === NaN);\nconsole.log('Object.is(+0, -0):', Object.is(+0, -0));\n"
    },
    {
      "id": "js_mod_1",
      "trackId": "javascript",
      "moduleIndex": 1,
      "title": "Closures, Scope Chains & Prototypal Inheritance",
      "subtitle": "Lexical Scoping, Scope Chain, Mark-and-Sweep, Prototypes, __proto__, and Private Class Fields.",
      "estimatedTime": "55 mins",
      "icon": "javascript",
      "overview": "Master JavaScript's closure mechanics, memory retention, prototype delegation, and modern encapsulation. Understand how lexical scope chains retain state, how prototype lookups traverse the chain, and how to implement clean module patterns and `#private` class fields.",
      "sections": [
        {
          "title": "1. Lexical Scope & Closure Architecture",
          "content": "A closure is the combination of a function bundled together with references to its surrounding lexical environment. Functions in JavaScript retain their scope chain even when invoked outside their original lexical context.",
          "codeExample": "function createBankVault(initialBalance) {\n    let balance = initialBalance; // Private enclosed state\n    return {\n        deposit: (amount) => { balance += amount; return balance; },\n        withdraw: (amount) => {\n            if (amount > balance) throw new Error('Insufficient funds');\n            balance -= amount;\n            return balance;\n        },\n        getBalance: () => balance\n    };\n}\nconst vault = createBankVault(1000);\nconsole.log(vault.deposit(500)); // 1500"
        },
        {
          "title": "2. The Prototype Chain & Property Delegation",
          "content": "Every JavaScript object has an internal `[[Prototype]]` link. When accessing a property, the engine inspects the object; if missing, it traverses up the prototype chain until finding it or reaching `null` (`Object.prototype.__proto__ === null`).",
          "codeExample": "const animal = { eats: true };\nconst rabbit = Object.create(animal);\nrabbit.jumps = true;\nconsole.log(rabbit.eats); // true (delegated up prototype chain)\nconsole.log(Object.getPrototypeOf(rabbit) === animal); // true"
        },
        {
          "title": "3. Modern Class Syntax & Private Fields (#)",
          "content": "ES2022 introduced native private fields and methods prefixed with `#`. Unlike closure-based private variables or convention underscores (`_private`), `#fields` are enforced at the language syntax level by the V8 runtime and cannot be inspected via `Object.keys()`.",
          "codeExample": "class SecureApiKeyManager {\n    #secretKey; // True runtime private field\n    constructor(key) { this.#secretKey = key; }\n    validate(input) { return this.#hash(input) === this.#secretKey; }\n    #hash(val) { return `hashed_${val}`; }\n}"
        },
        {
          "title": "4. Currying & Functional Composition",
          "content": "Currying transforms a function accepting multiple arguments into a sequence of unary functions. It enables partial application, creating reusable utility functions in modern pipelines.",
          "codeExample": "const multiply = a => b => a * b;\nconst double = multiply(2);\nconst triple = multiply(3);\nconsole.log([1, 2, 3].map(double)); // [2, 4, 6]"
        },
        {
          "title": "5. Production Anti-Pattern: Accidental Memory Leaks in Closures",
          "content": "Holding long-lived references to large objects inside closures attached to DOM event listeners or global caches prevents V8's garbage collector from sweeping the allocated heap memory.",
          "codeExample": "function setupListener() {\n    const largeData = new Array(1000000).fill('leak');\n    window.addEventListener('resize', () => {\n        // If this listener references largeData, the 1M array is pinned in memory forever!\n    });\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement Memoization Cache using Closure",
        "functionName": "memoize",
        "prompt": "Write a memoization wrapper `memoize(fn)` that caches results of a function based on stringified arguments. Read numbers from stdin, apply a memoized square function, and verify cache hit count.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[5, 5, 2, 5]",
            "expectedOutput": "[false,true,false,true]",
            "isHidden": false
          },
          {
            "input": "[10, 20, 30]",
            "expectedOutput": "[false,false,false]",
            "isHidden": false
          },
          {
            "input": "[7, 7, 7, 7]",
            "expectedOutput": "[false,true,true,true]",
            "isHidden": false
          },
          {
            "input": "[1]",
            "expectedOutput": "[false]",
            "isHidden": true
          },
          {
            "input": "[42, 42]",
            "expectedOutput": "[false,true]",
            "isHidden": true
          },
          {
            "input": "[1, 2, 1, 2, 1, 2]",
            "expectedOutput": "[false,false,true,true,true,true]",
            "isHidden": true
          },
          {
            "input": "[100, 200, 300, 100, 200]",
            "expectedOutput": "[false,false,false,true,true]",
            "isHidden": true
          },
          {
            "input": "[0, 0, 0]",
            "expectedOutput": "[false,true,true]",
            "isHidden": true
          },
          {
            "input": "[-5, 5, -5, 5]",
            "expectedOutput": "[false,false,true,true]",
            "isHidden": true
          },
          {
            "input": "[8, 9, 10, 8, 9, 10, 11]",
            "expectedOutput": "[false,false,false,true,true,true,false]",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Closures, Lexical Scope & Caching",
        "inputFormat": "A JSON array of integers from stdin.",
        "outputFormat": "A JSON array of booleans indicating whether each call was a cache hit.",
        "constraints": [
          "Cache must use closures to encapsulate memory.",
          "Time Complexity: O(1) for cached calls."
        ],
        "examples": [
          {
            "input": "[5, 5, 2, 5]",
            "output": "[false,true,false,true]",
            "explanation": "First 5 is computed (false). Second 5 is cached (true). 2 is computed (false). Third 5 is cached (true)."
          }
        ],
        "hints": [
          "Create a `Map` inside the closure of `memoize`.",
          "Check `map.has(key)`. If present, record cache hit = true. Otherwise compute, store, and record hit = false."
        ],
        "title": "Implement Memoization Cache using Closure",
        "objective": "Build a higher-order memoization cache using closures that caches results based on serialized arguments.",
        "conceptualExplanation": [
          "Step 1: Create a higher-order function `memoize(fn)` containing a Map cache in its outer scope.",
          "Step 2: In the returned wrapper, serialize incoming arguments into a deterministic cache key (e.g. JSON.stringify(args)).",
          "Step 3: If cache.has(key), return the precomputed value immediately (O(1) lookup).",
          "Step 4: Otherwise, compute `fn.apply(this, args)`, store the result in the cache, and return."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "js1_q1",
            "question": "What is a closure in JavaScript?",
            "options": [
              "A method to close browser tabs",
              "A function bundled with references to its lexical environment",
              "A syntax error",
              "An encrypted script"
            ],
            "correctIndex": 1,
            "explanation": "A closure gives you access to an outer function's scope from an inner function."
          },
          {
            "id": "js1_q2",
            "question": "Where does JavaScript look next if a property is not found directly on an object?",
            "options": [
              "Global window object immediately",
              "The object's prototype (__proto__ / [[Prototype]])",
              "Local storage",
              "In the call stack"
            ],
            "correctIndex": 1,
            "explanation": "JavaScript traverses up the prototype chain until it finds the property or reaches null."
          },
          {
            "id": "js1_q3",
            "question": "What is the top-most prototype in the standard prototype chain?",
            "options": [
              "Function.prototype",
              "Object.prototype",
              "null",
              "undefined"
            ],
            "correctIndex": 2,
            "explanation": "Object.prototype's [[Prototype]] is null, which terminates the prototype chain."
          },
          {
            "id": "js1_q4",
            "question": "What does `this` refer to inside a traditional function called without an explicit context (in non-strict mode)?",
            "options": [
              "The calling function",
              "The global object (window or global)",
              "undefined",
              "null"
            ],
            "correctIndex": 1,
            "explanation": "In sloppy mode, `this` defaults to the global object; in strict mode ('use strict'), it is undefined."
          },
          {
            "id": "js1_q5",
            "question": "How do Arrow Functions handle the `this` binding?",
            "options": [
              "They dynamically bind `this` to the invoker",
              "They capture `this` lexically from their enclosing scope",
              "They set `this` to null",
              "They have their own `this` keyword"
            ],
            "correctIndex": 1,
            "explanation": "Arrow functions do not have their own `this`; they inherit it lexically from the parent scope."
          },
          {
            "id": "js1_q6",
            "question": "What is the difference between `call` and `apply`?",
            "options": [
              "`call` takes arguments comma-separated; `apply` takes an array of arguments",
              "`apply` is asynchronous",
              "`call` cannot bind `this`",
              "There is no difference"
            ],
            "correctIndex": 0,
            "explanation": "`call(thisArg, a, b)` accepts arguments individually; `apply(thisArg, [a, b])` takes an array."
          },
          {
            "id": "js1_q7",
            "question": "What method permanently creates a new function with its `this` bound to a specific object?",
            "options": [
              "Function.prototype.bind()",
              "Function.prototype.lock()",
              "Object.freeze()",
              "Function.prototype.attach()"
            ],
            "correctIndex": 0,
            "explanation": "bind() returns a new function with `this` bound to the specified object."
          },
          {
            "id": "js1_q8",
            "question": "What does `Object.create(proto)` do?",
            "options": [
              "Creates an identical copy of proto",
              "Creates a new object with its internal `[[Prototype]]` set to `proto`",
              "Deletes proto",
              "Freezes proto"
            ],
            "correctIndex": 1,
            "explanation": "Object.create() creates a new object using an existing object as its prototype."
          },
          {
            "id": "js1_q9",
            "question": "Can closures lead to increased memory usage if references are not freed?",
            "options": [
              "No, V8 cleans up all closures immediately",
              "Yes, because variables in retained closures cannot be garbage collected while the closure is reachable",
              "Only in old browsers",
              "Only with arrow functions"
            ],
            "correctIndex": 1,
            "explanation": "Retained closures keep referenced variables alive in memory, preventing garbage collection."
          },
          {
            "id": "js1_q10",
            "question": "What does `instanceof` check?",
            "options": [
              "Whether an object has a specific property name",
              "Whether a constructor's prototype property appears anywhere in the prototype chain of an object",
              "The class name string",
              "Memory address equality"
            ],
            "correctIndex": 1,
            "explanation": "`a instanceof B` checks if B.prototype exists anywhere in the prototype chain of a."
          }
        ]
      },
      "references": [
        {
          "title": "MDN Web Docs — Closures",
          "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Comprehensive guide to lexical environments and closures."
        },
        {
          "title": "MDN Web Docs — Inheritance and the prototype chain",
          "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Deep dive into prototype lookups and performance implications."
        },
        {
          "title": "HTML Standard: Event loops and Task Queues (WHATWG)",
          "url": "https://html.spec.whatwg.org/multipage/webappapis.html#event-loops",
          "source": "WHATWG Standards Committee",
          "category": "Web Standard Specification",
          "description": "The authoritative normative standard defining microtask draining, macrotasks, and rendering pipeline phases."
        }
      ],
      "keyTakeaways": [
        "Closures capture outer lexical scopes, preserving private state.",
        "JavaScript objects delegate property lookups up the prototype chain.",
        "Native `#private` fields enforce runtime privacy without memory overhead.",
        "Remove event listeners when unmounting components to avoid closure memory leaks."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_js1_1",
          "question": "What happens when an object does not have an accessed property?",
          "options": [
            "It throws a TypeError",
            "The engine looks up its [[Prototype]] chain until finding it or reaching null",
            "It creates the property as undefined on the current object",
            "It checks the global window object"
          ],
          "correctIndex": 1,
          "explanation": "JavaScript traverses the prototype chain until it finds the property or reaches null."
        },
        {
          "id": "kc_js1_2",
          "question": "In what order are Promise microtasks executed relative to Macrotasks (e.g. `setTimeout`) in the V8 Event Loop?",
          "options": [
            "Macrotasks execute first, followed by microtasks at the end of the day",
            "The microtask queue is completely drained after each execution turn before the next macrotask is dequeued",
            "They execute in random order depending on CPU cache lines",
            "Promises and timeouts execute simultaneously on separate OS threads"
          ],
          "correctIndex": 1,
          "explanation": "After synchronous JavaScript completes or after each macrotask completes, the event loop drains the entire microtask queue (Promise.then, queueMicrotask) before moving to the next macrotask."
        }
      ],
      "interactiveSandboxCode": "function counter() {\n    let count = 0;\n    return () => ++count;\n}\nconst c = counter();\nconsole.log(c(), c(), c());\n"
    },
    {
      "id": "js_mod_2",
      "trackId": "javascript",
      "moduleIndex": 2,
      "title": "Asynchronous JavaScript, Promises & Event Loop",
      "subtitle": "Event Loop, Microtasks vs Macrotasks, Promise Internals, and Async/Await Mechanics.",
      "estimatedTime": "55 mins",
      "icon": "javascript",
      "overview": "The definitive architectural breakdown of JavaScript's asynchronous concurrency model. Understand the Call Stack, Libuv event loop, Macrotasks queue (setTimeout, I/O) vs Microtasks queue (Promise.then, MutationObserver), Promise state transitions, and async/await desugaring.",
      "sections": [
        {
          "title": "1. The Event Loop Architecture: Call Stack & Task Queues",
          "content": "JavaScript is single-threaded. Concurrency is orchestrated by the Event Loop. When asynchronous work (fetch, timers, disk I/O) is dispatched, the browser or Node.js background thread pool executes it and schedules callbacks onto queues:\n• Microtasks Queue: High-priority queue (Promise callbacks, `queueMicrotask`). Emptied completely before the next task runs.\n• Macrotasks Queue: Standard task queue (setTimeout, setInterval, setImmediate, I/O events).",
          "codeExample": "console.log('1. Synchronous Start');\nsetTimeout(() => console.log('4. Macrotask (setTimeout)'), 0);\nPromise.resolve().then(() => console.log('2. Microtask (Promise 1)'))\n                 .then(() => console.log('3. Microtask (Promise 2)'));\nconsole.log('5. Synchronous End');\n// Output order: 1 -> 5 -> 2 -> 3 -> 4"
        },
        {
          "title": "2. Promise States & Internal Invariants",
          "content": "A Promise is an object representing eventual completion or failure of an asynchronous operation. It resides in one of three mutually exclusive states:\n1. Pending: Initial state, neither fulfilled nor rejected.\n2. Fulfilled: Completed successfully with a resolved value.\n3. Rejected: Failed with an error reason.\nOnce settled, a Promise's state and value are permanently immutable.",
          "codeExample": "const fetchWithTimeout = (url, timeoutMs) => {\n    const timeoutPromise = new Promise((_, reject) =>\n        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)\n    );\n    return Promise.race([fetch(url), timeoutPromise]);\n};"
        },
        {
          "title": "3. Promise Combinators: all, allSettled, race & any",
          "content": "• `Promise.all`: Rejects immediately if ANY promise rejects (fail-fast).\n• `Promise.allSettled`: Waits for all promises to finish and returns an array of `{status, value|reason}`.\n• `Promise.race`: Resolves or rejects as soon as the first promise settles.\n• `Promise.any`: Resolves as soon as the first promise fulfills (ignores rejections unless all fail).",
          "codeExample": "const p1 = Promise.resolve('Success');\nconst p2 = Promise.reject('Minor telemetry error');\nPromise.allSettled([p1, p2]).then(results => {\n    results.forEach(r => console.log(r.status, r.value || r.reason));\n});"
        },
        {
          "title": "4. Async/Await: Syntactic Sugar for Coroutines & Generators",
          "content": "`async` functions always return a Promise. The `await` keyword pauses execution of the async function, yields control back to the Event Loop, and resumes when the promise settles via microtask scheduling.",
          "codeExample": "async function loadDashboardData() {\n    try {\n        const [user, stats] = await Promise.all([fetchUser(), fetchStats()]);\n        return { user, stats };\n    } catch (err) {\n        console.error('Failed to load dashboard:', err);\n        throw err;\n    }\n}"
        },
        {
          "title": "5. Production Anti-Pattern: Sequential Awaits in Loops",
          "content": "Using `await` inside a standard `for` loop causes sequential execution (waterfall latency). When tasks are independent, execute them concurrently using `Promise.all`.",
          "codeExample": "// BAD: Sequential (3x latency)\n// for (const id of ids) { await fetchItem(id); }\n// GOOD: Concurrent\n// await Promise.all(ids.map(id => fetchItem(id)));"
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement Promise.all Polyfill",
        "functionName": "allPromises",
        "prompt": "Implement a function `allPromises(promises)` that behaves like `Promise.all`. It resolves with an array of values when all succeed, or rejects with the first error. Read a JSON array from stdin and output resolved array.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[1, 2, 3, 4]",
            "expectedOutput": "[2,4,6,8]",
            "isHidden": false
          },
          {
            "input": "[]",
            "expectedOutput": "[]",
            "isHidden": false
          },
          {
            "input": "[10, 50, 100]",
            "expectedOutput": "[20,100,200]",
            "isHidden": false
          },
          {
            "input": "[5]",
            "expectedOutput": "[10]",
            "isHidden": true
          },
          {
            "input": "[0, 0, 0]",
            "expectedOutput": "[0,0,0]",
            "isHidden": true
          },
          {
            "input": "[2, 4, 6, 8, 10]",
            "expectedOutput": "[4,8,12,16,20]",
            "isHidden": true
          },
          {
            "input": "[1000]",
            "expectedOutput": "[2000]",
            "isHidden": true
          },
          {
            "input": "[7, 14, 21]",
            "expectedOutput": "[14,28,42]",
            "isHidden": true
          },
          {
            "input": "[-1, -2, -3]",
            "expectedOutput": "[-2,-4,-6]",
            "isHidden": true
          },
          {
            "input": "[15, 25, 35, 45]",
            "expectedOutput": "[30,50,70,90]",
            "isHidden": true
          }
        ],
        "difficulty": "Hard",
        "category": "Asynchronous JavaScript & Promises",
        "inputFormat": "A JSON array of numbers from stdin.",
        "outputFormat": "A JSON array of doubled values resolved concurrently.",
        "constraints": [
          "Must wait for all asynchronous operations to resolve before resolving parent promise."
        ],
        "examples": [
          {
            "input": "[1, 2, 3, 4]",
            "output": "[2, 4, 6, 8]",
            "explanation": "All elements are doubled asynchronously and gathered in order."
          }
        ],
        "hints": [
          "Return a `new Promise((resolve, reject) => {...})`.",
          "Maintain a counter `completed = 0` and results array.",
          "When `completed === promises.length`, call `resolve(results)`."
        ],
        "title": "Implement Promise.all Polyfill",
        "objective": "Build a native Promise.all polyfill that concurrently resolves an array of promises and rejects on the first failure.",
        "conceptualExplanation": [
          "Step 1: Return a new Promise taking `resolve` and `reject` callbacks.",
          "Step 2: Check if the input is an array; if empty, resolve immediately with an empty array `[]`.",
          "Step 3: Maintain a results array and a completed count counter.",
          "Step 4: Iterate over each promise, wrapping it with `Promise.resolve(item)` to handle non-promise values.",
          "Step 5: On resolution of item i, store result at index i and increment completed count. When count === total, resolve(results). If any promise rejects, reject immediately."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "js2_q1",
            "question": "Which task queue has higher priority in the JavaScript Event Loop?",
            "options": [
              "Macrotask Queue (setTimeout, setInterval)",
              "Microtask Queue (Promise.then, queueMicrotask)",
              "Network request queue",
              "Garbage collection queue"
            ],
            "correctIndex": 1,
            "explanation": "The microtask queue is prioritized and completely drained before the next macrotask runs."
          },
          {
            "id": "js2_q2",
            "question": "What is the initial state of a newly created `new Promise(...)`?",
            "options": [
              "Fulfilled",
              "Rejected",
              "Pending",
              "Settled"
            ],
            "correctIndex": 2,
            "explanation": "A new Promise starts in the 'pending' state until resolved or rejected."
          },
          {
            "id": "js2_q3",
            "question": "What does `await` do when placed before a Promise inside an `async` function?",
            "options": [
              "Blocks the entire OS thread",
              "Pauses execution of the async function until the Promise settles, yielding control back to the event loop",
              "Cancels the Promise",
              "Runs it synchronously"
            ],
            "correctIndex": 1,
            "explanation": "await pauses the async function execution without blocking the main browser thread."
          },
          {
            "id": "js2_q4",
            "question": "What does `Promise.allSettled()` return?",
            "options": [
              "Rejects if any promise rejects",
              "A promise that resolves after all input promises have settled, with an array describing each result",
              "The fastest promise result",
              "An error"
            ],
            "correctIndex": 1,
            "explanation": "Promise.allSettled() returns an array of objects ({ status, value } or { status, reason }) for all promises."
          },
          {
            "id": "js2_q5",
            "question": "What happens if an error is thrown inside a Promise constructor function?",
            "options": [
              "It crashes the Node.js process immediately",
              "The Promise automatically transitions to the Rejected state with that error",
              "The error is ignored",
              "It retries the function"
            ],
            "correctIndex": 1,
            "explanation": "Uncaught errors inside the Promise executor callback reject the promise automatically."
          },
          {
            "id": "js2_q6",
            "question": "What is the return type of any function marked with the `async` keyword?",
            "options": [
              "The value returned directly",
              "A Promise that resolves with the returned value",
              "A generator",
              "A Callback function"
            ],
            "correctIndex": 1,
            "explanation": "Async functions always return a Promise, wrapping non-promise return values in Promise.resolve()."
          },
          {
            "id": "js2_q7",
            "question": "Which API provides an abortable signal to cancel pending HTTP fetch requests?",
            "options": [
              "CancelToken",
              "AbortController & AbortSignal",
              "fetch.cancel()",
              "StopSignal"
            ],
            "correctIndex": 1,
            "explanation": "AbortController provides signal to cancel modern fetch() requests."
          },
          {
            "id": "js2_q8",
            "question": "What is 'callback hell' in JavaScript?",
            "options": [
              "A memory corruption error",
              "Deeply nested asynchronous callbacks making code unreadable and error-prone",
              "An infinite loop in the event loop",
              "A compiler error"
            ],
            "correctIndex": 1,
            "explanation": "Callback hell refers to excessive pyramidal indentation caused by nesting async callbacks."
          },
          {
            "id": "js2_q9",
            "question": "Can `Promise.race()` settle with a rejection?",
            "options": [
              "No, it only resolves",
              "Yes, if the earliest settling promise rejects, Promise.race rejects with that reason",
              "Only in strict mode",
              "Only with timeout"
            ],
            "correctIndex": 1,
            "explanation": "Promise.race settles with the first promise that settles, whether fulfilled or rejected."
          },
          {
            "id": "js2_q10",
            "question": "What happens if you omit the `catch` handler on a rejected Promise in modern Node.js?",
            "options": [
              "Nothing",
              "An 'UnhandledPromiseRejection' event is emitted and the process may terminate",
              "The promise retries",
              "It logs a warning and continues silently"
            ],
            "correctIndex": 1,
            "explanation": "Modern Node.js crashes or emits unhandledRejection events for unhandled promise rejections."
          }
        ]
      },
      "references": [
        {
          "title": "MDN Web Docs — JavaScript Event Loop",
          "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Comprehensive documentation on task queues, microtasks, and the runtime event loop."
        },
        {
          "title": "TC39 Promise Specification",
          "url": "https://tc39.es/ecma262/#sec-promise-objects",
          "source": "Ecma TC39",
          "category": "Official Standard Spec",
          "description": "Formal specification of Promise objects, internal slots, and reaction jobs."
        },
        {
          "title": "You Don't Know JS Yet: Objects & Classes",
          "url": "https://github.com/getify/You-Dont-Know-JS",
          "source": "Kyle Simpson / O'Reilly",
          "category": "Authoritative Reference",
          "description": "In-depth breakdown of prototype delegation, behavior delegation, and JavaScript lexical binding."
        }
      ],
      "keyTakeaways": [
        "Microtasks (Promises) always run before the next Macrotask (setTimeout).",
        "Promises are permanently immutable once settled.",
        "Use `Promise.allSettled` when individual failures should not cancel remaining jobs.",
        "Avoid sequential `await` in loops for independent operations."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_js2_1",
          "question": "Which task queue takes priority when the call stack clears?",
          "options": [
            "The Macrotask queue (setTimeout)",
            "The Microtask queue (Promises)",
            "The Rendering pipeline",
            "File I/O callbacks"
          ],
          "correctIndex": 1,
          "explanation": "The engine completely drains the Microtask queue after every task before processing the next macrotask."
        },
        {
          "id": "kc_js2_2",
          "question": "How does `Object.create(proto)` differ from object literal instantiation `{}`?",
          "options": [
            "Object.create allocates memory on the stack instead of heap",
            "Object.create explicitly sets the internal `[[Prototype]]` link to the passed prototype without invoking a constructor",
            "Object.create makes the resulting object permanently immutable",
            "Object.create only works with TypeScript"
          ],
          "correctIndex": 1,
          "explanation": "Object.create directly binds the `[[Prototype]]` delegation link, facilitating clean prototype inheritance without constructor side effects."
        }
      ],
      "interactiveSandboxCode": "console.log('Start');\nPromise.resolve().then(() => console.log('Promise Microtask'));\nsetTimeout(() => console.log('Timeout Macrotask'), 0);\nconsole.log('End');\n"
    },
    {
      "id": "js_mod_3",
      "trackId": "javascript",
      "moduleIndex": 3,
      "title": "DOM Architecture, Events & Browser Web APIs",
      "subtitle": "DOM Tree Architecture, Event Bubbling & Capturing, Reflow vs Repaint, and Observer APIs.",
      "estimatedTime": "50 mins",
      "icon": "javascript",
      "overview": "Browser rendering engine internals and high-performance DOM manipulation. Understand how HTML is parsed into the DOM Tree and CSSOM, the Render Tree, Layout (Reflow), Paint, Compositing, Event Delegation, and modern Observer APIs (IntersectionObserver, ResizeObserver).",
      "sections": [
        {
          "title": "1. The Browser Rendering Pipeline: Reflow vs Repaint",
          "content": "When the DOM or CSSOM changes, the browser updates pixels through the rendering pipeline:\n1. Layout (Reflow): Calculates exact geometric dimensions and screen positions.\n2. Paint: Fills pixels with colors, borders, and shadows.\n3. Composite: Combines GPU layers.\nTriggering reflow on layout-sensitive properties (`offsetHeight`, `clientWidth`) inside loops causes layout thrashing and frame drops below 60fps.",
          "codeExample": "// BATCH DOM updates using DocumentFragment\nconst fragment = document.createDocumentFragment();\nfor (let i = 0; i < 100; i++) {\n    const div = document.createElement('div');\n    div.textContent = `Item ${i}`;\n    fragment.appendChild(div); // Zero reflows\n}\ndocument.body.appendChild(fragment); // Single reflow!"
        },
        {
          "title": "2. Event Propagation: Capturing, Target, and Bubbling",
          "content": "Events propagate in three phases:\n1. Capturing Phase: Travels down from `window` to the target element.\n2. Target Phase: Fires directly on the target element.\n3. Bubbling Phase: Bubbles up from target back to `window`.\nEvent Delegation leverages bubbling by attaching a single listener to a common ancestor, saving memory.",
          "codeExample": "document.getElementById('list-container').addEventListener('click', (e) => {\n    const item = e.target.closest('.list-item');\n    if (!item) return;\n    console.log('Clicked item ID:', item.dataset.id);\n});"
        },
        {
          "title": "3. High-Performance APIs: IntersectionObserver & MutationObserver",
          "content": "Rather than binding scroll listeners with CPU-heavy `getBoundingClientRect()`, `IntersectionObserver` informs you asynchronously off the main thread when elements enter the viewport.",
          "codeExample": "const lazyObserver = new IntersectionObserver((entries) => {\n    entries.forEach(entry => {\n        if (entry.isIntersecting) {\n            const img = entry.target;\n            img.src = img.dataset.src;\n            lazyObserver.unobserve(img);\n        }\n    });\n});"
        },
        {
          "title": "4. Debouncing vs Throttling",
          "content": "• Debounce: Delays execution until a period of silence has elapsed (ideal for search autocomplete inputs).\n• Throttle: Enforces a maximum execution frequency (e.g. at most once every 100ms for window resize or scroll tracking).",
          "codeExample": "const debounce = (fn, delayMs) => {\n    let timer;\n    return (...args) => {\n        clearTimeout(timer);\n        timer = setTimeout(() => fn(...args), delayMs);\n    };\n};"
        },
        {
          "title": "5. Production Best Practices",
          "content": "• Use `requestAnimationFrame` for smooth 60fps/120fps visual animations.\n• Always clean up event listeners when elements or components unmount to prevent leaks.\n• Favor CSS transforms (`translate3d`, `scale`) over animating `top`, `left`, `width` to stay on the GPU compositor thread without triggering CPU reflows.",
          "codeExample": "// Animate with transform (GPU compositor layer only, 0 reflow)\nelement.style.transform = 'translate3d(100px, 0, 0)';"
        }
      ],
      "codingExercise": {
        "taskTitle": "Parse Query Parameters into Object",
        "functionName": "parseQueryParams",
        "prompt": "Write a utility function `parseQueryParams(url)` that extracts query parameters from a URL string into a JavaScript object. Read a URL from stdin and output the JSON string.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "https://example.com/search?q=javascript&page=2",
            "expectedOutput": "{\"q\":\"javascript\",\"page\":\"2\"}",
            "isHidden": false
          },
          {
            "input": "https://example.com/home",
            "expectedOutput": "{}",
            "isHidden": false
          },
          {
            "input": "https://api.test/data?filter=active&sort=asc&limit=10",
            "expectedOutput": "{\"filter\":\"active\",\"sort\":\"asc\",\"limit\":\"10\"}",
            "isHidden": false
          },
          {
            "input": "https://site.org/?lang=en",
            "expectedOutput": "{\"lang\":\"en\"}",
            "isHidden": true
          },
          {
            "input": "https://site.org/path",
            "expectedOutput": "{}",
            "isHidden": true
          },
          {
            "input": "https://masteryzone.com/coding?track=python&module=2&view=code",
            "expectedOutput": "{\"track\":\"python\",\"module\":\"2\",\"view\":\"code\"}",
            "isHidden": true
          },
          {
            "input": "https://test.io/?a=1&b=2&c=3",
            "expectedOutput": "{\"a\":\"1\",\"b\":\"2\",\"c\":\"3\"}",
            "isHidden": true
          },
          {
            "input": "https://query.com/?token=xyz123",
            "expectedOutput": "{\"token\":\"xyz123\"}",
            "isHidden": true
          },
          {
            "input": "https://demo.app/dashboard",
            "expectedOutput": "{}",
            "isHidden": true
          },
          {
            "input": "https://shop.com/products?category=books&inStock=true&maxPrice=50",
            "expectedOutput": "{\"category\":\"books\",\"inStock\":\"true\",\"maxPrice\":\"50\"}",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "URL APIs & String Manipulation",
        "inputFormat": "A URL string from stdin.",
        "outputFormat": "A JSON object of parsed query parameters.",
        "constraints": [
          "If no query string exists, return `{}`.",
          "URL-decode keys and values."
        ],
        "examples": [
          {
            "input": "https://example.com/search?q=javascript&page=2",
            "output": "{\"q\":\"javascript\",\"page\":\"2\"}",
            "explanation": "Extracted q and page parameters into key-value map."
          }
        ],
        "hints": [
          "Locate the '?' character using `indexOf('?')`.",
          "Split parameter pairs by '&', then split key/value by '='.",
          "Decode components using `decodeURIComponent`."
        ],
        "title": "Parse Query Parameters into Object",
        "objective": "Parse a URL query string into an object, decoding URI components and handling array parameter values.",
        "conceptualExplanation": [
          "Step 1: Strip any leading '?' or '#' characters from the query string.",
          "Step 2: Split the string by '&' delimiters to get individual key=value pairs.",
          "Step 3: Split each pair by '=', decoding both key and value using `decodeURIComponent`.",
          "Step 4: If a key already exists, convert its value into an array or append to the existing array.",
          "Step 5: Output the resulting object serialized as JSON."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "js3_q1",
            "question": "In which direction do events propagate during the Bubbling phase?",
            "options": [
              "From the Window down to the target element",
              "From the target element up through its ancestors to Window",
              "Horizontally across sibling elements",
              "Directly to the server"
            ],
            "correctIndex": 1,
            "explanation": "Event bubbling propagates upward from the target element up the DOM hierarchy."
          },
          {
            "id": "js3_q2",
            "question": "What is Event Delegation in frontend development?",
            "options": [
              "Assigning a delegate function in TypeScript",
              "Attaching a single event listener to a common ancestor to manage events for all descendants",
              "Delegating event processing to Web Workers",
              "Passing events via WebSockets"
            ],
            "correctIndex": 1,
            "explanation": "Event delegation leverages bubbling to handle events at a parent container efficiently."
          },
          {
            "id": "js3_q3",
            "question": "What does `event.preventDefault()` do?",
            "options": [
              "Stops the event from bubbling",
              "Prevents the browser's default action associated with the event (e.g. form submission or link navigation)",
              "Deletes the target element",
              "Closes the window"
            ],
            "correctIndex": 1,
            "explanation": "preventDefault() stops standard browser behavior associated with the event."
          },
          {
            "id": "js3_q4",
            "question": "What is the primary difference between `localStorage` and `sessionStorage`?",
            "options": [
              "localStorage is faster",
              "sessionStorage data is cleared when the page session / browser tab ends; localStorage persists indefinitely",
              "localStorage is encrypted",
              "sessionStorage allows only numbers"
            ],
            "correctIndex": 1,
            "explanation": "sessionStorage is tab-scoped and transient, whereas localStorage survives browser restarts."
          },
          {
            "id": "js3_q5",
            "question": "Which method adds a CSS class to a DOM element's class list?",
            "options": [
              "element.class.add()",
              "element.classList.add()",
              "element.className.append()",
              "element.addClass()"
            ],
            "correctIndex": 1,
            "explanation": "The modern DOM API provides element.classList.add('className')."
          },
          {
            "id": "js3_q6",
            "question": "What is the Return value of `document.querySelectorAll()`?",
            "options": [
              "An Array",
              "A static NodeList",
              "A live HTMLCollection",
              "A DOMTokenList"
            ],
            "correctIndex": 1,
            "explanation": "querySelectorAll returns a static NodeList representing a snapshot of matched elements."
          },
          {
            "id": "js3_q7",
            "question": "Which browser API allows running CPU-intensive JavaScript in background threads without freezing the UI?",
            "options": [
              "Service Worker",
              "Web Worker",
              "LocalStorage",
              "IndexedDB"
            ],
            "correctIndex": 1,
            "explanation": "Web Workers execute scripts in background threads, communicating via message passing."
          },
          {
            "id": "js3_q8",
            "question": "What header do servers use to control Cross-Origin Resource Sharing (CORS)?",
            "options": [
              "Access-Control-Allow-Origin",
              "Origin-Check-Allowed",
              "Allow-Web-Requests",
              "CORS-Status"
            ],
            "correctIndex": 0,
            "explanation": "Access-Control-Allow-Origin specifies which origins are permitted to access resources."
          },
          {
            "id": "js3_q9",
            "question": "What is the purpose of the `IntersectionObserver` API?",
            "options": [
              "To observe changes in DOM text",
              "To efficiently detect when an element enters or leaves the browser viewport",
              "To observe network requests",
              "To intercept keystrokes"
            ],
            "correctIndex": 1,
            "explanation": "IntersectionObserver enables performant lazy-loading and scroll detection."
          },
          {
            "id": "js3_q10",
            "question": "What happens to cookies marked with the `HttpOnly` flag?",
            "options": [
              "They cannot be accessed via JavaScript's `document.cookie` (mitigating XSS theft)",
              "They can only be sent over HTTP, not HTTPS",
              "They expire in 1 hour",
              "They are readable by all third-party scripts"
            ],
            "correctIndex": 0,
            "explanation": "HttpOnly cookies are inaccessible to client-side scripts, protecting session tokens from XSS."
          }
        ]
      },
      "references": [
        {
          "title": "MDN Web Docs — Introduction to the DOM",
          "url": "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Comprehensive guide to DOM nodes, attributes, and APIs."
        },
        {
          "title": "Google Web Fundamentals — Avoid Large, Complex Layouts and Layout Thrashing",
          "url": "https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/",
          "source": "Google Chrome Team",
          "category": "Performance Guide",
          "description": "Engineering guide to layout thrashing and rendering optimization."
        },
        {
          "title": "Functional-Light JavaScript: Pragmatic, Balanced FP in JavaScript",
          "url": "https://github.com/getify/Functional-Light-JS",
          "source": "Kyle Simpson",
          "category": "Recommended Engineering Literature",
          "description": "Pragmatic guide to pure functions, immutable structures, and functional algorithmic efficiency."
        }
      ],
      "keyTakeaways": [
        "Reflow recalculates geometry; repaint fills pixels; compositing blends GPU layers.",
        "Event delegation attaches one listener to a parent, minimizing memory footprint.",
        "Use `IntersectionObserver` for lazy loading without scroll lag.",
        "Animate CSS `transform` and `opacity` to avoid triggering layout reflows."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_js3_1",
          "question": "Why is animating CSS `transform` faster than animating `left` or `top`?",
          "options": [
            "Transforms run in Web Workers",
            "Transforms are processed on the GPU composite layer without triggering layout reflows",
            "Transforms don't support colors",
            "Transforms are cached by the browser DNS"
          ],
          "correctIndex": 1,
          "explanation": "Transforms and opacity bypass the Layout and Paint stages, operating entirely on the GPU compositor."
        },
        {
          "id": "kc_js3_2",
          "question": "Why is `reduce()` with object spread `{ ...acc, [k]: v }` considered an O(N^2) anti-pattern for large arrays?",
          "options": [
            "V8 throws a stack overflow error on object keys",
            "Every spread operation copies all existing keys into a brand-new object, creating N object allocations and quadratic time",
            "JavaScript objects cannot store more than 100 properties",
            "Object spread mutates the original prototype"
          ],
          "correctIndex": 1,
          "explanation": "Copying an object of size K takes O(K) time. Across N iterations, spreading produces 1 + 2 + ... + N = O(N^2) work. Mutating a local accumulator `acc[k] = v` preserves O(N) linear performance."
        }
      ],
      "interactiveSandboxCode": "const debounce = (fn, delay) => {\n  let t;\n  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };\n};\nconst log = debounce((val) => console.log('Executed:', val), 200);\nlog('A'); log('B'); log('C'); // Only 'C' logs after 200ms\n"
    },
    {
      "id": "js_mod_4",
      "trackId": "javascript",
      "moduleIndex": 4,
      "title": "Modern ES6+, Modular Architecture & Functional Patterns",
      "subtitle": "ES Modules (ESM), Destructuring, Generators, Iterators, and WeakMap/WeakSet.",
      "estimatedTime": "55 mins",
      "icon": "javascript",
      "overview": "Modern enterprise JavaScript standards. Deeply understand ES Modules (live bindings vs CommonJS), advanced destructuring, generator functions (`function*`) and the iterator protocol (`Symbol.iterator`), `WeakMap` and `WeakSet` for zero-leak memory management, and structured cloning.",
      "sections": [
        {
          "title": "1. ES Modules (ESM) vs CommonJS (CJS)",
          "content": "ES Modules (`import`/`export`) are statically analyzable at compile time, enabling tree-shaking (dead code elimination). ESM exports live bindings to variables, whereas CommonJS (`require`/`module.exports`) copies values at runtime.",
          "codeExample": "// ESM (Live Binding)\n// counter.js: export let count = 0; export const inc = () => count++;\n// main.js: import { count, inc } from './counter.js'; inc(); console.log(count); // 1"
        },
        {
          "title": "2. The Iterator and Generator Protocol (Symbol.iterator)",
          "content": "Any object implementing `[Symbol.iterator]()` that returns an object with a `.next()` method can be consumed by `for...of` loops and spread operators (`...`). Generators (`function*`) yield control lazily, streaming sequence items in O(1) memory.",
          "codeExample": "function* infiniteSequence(start = 0, step = 1) {\n    let val = start;\n    while (true) {\n        yield val;\n        val += step;\n    }\n}\nconst nums = infiniteSequence(10, 5);\nconsole.log(nums.next().value); // 10\nconsole.log(nums.next().value); // 15"
        },
        {
          "title": "3. WeakMap & WeakSet for Zero-Leak Memory Management",
          "content": "Standard `Map` and `Set` hold strong references to keys, preventing garbage collection. `WeakMap` holds weak references: if no other reference to an object exists, the engine reclaims it automatically. WeakMap keys must strictly be objects.",
          "codeExample": "const metadataStore = new WeakMap();\nlet userObj = { id: 42 };\nmetadataStore.set(userObj, { lastAccessed: Date.now() });\nuserObj = null; // metadataStore entry is automatically garbage-collected!"
        },
        {
          "title": "4. Native Deep Copying with structuredClone()",
          "content": "Historically, deep cloning required `JSON.parse(JSON.stringify(obj))` which drops dates, maps, sets, and circular references. Modern browsers and Node 17+ provide native `structuredClone()`, which handles cyclical graphs and typed arrays natively.",
          "codeExample": "const original = { date: new Date(), map: new Map([['key', 'val']]) };\noriginal.self = original; // Circular reference!\nconst copy = structuredClone(original);\nconsole.log(copy.date instanceof Date); // true\nconsole.log(copy.self === copy);         // true"
        },
        {
          "title": "5. Production Best Practices",
          "content": "• Use Object.freeze() with TypeScript `as const` for immutable configuration objects.\n• Leverage optional chaining (`?.`) and nullish coalescing (`??`) to avoid `Cannot read properties of undefined` runtime crashes.",
          "codeExample": "const config = Object.freeze({ apiBase: 'https://api.domain.com', timeout: 5000 });"
        }
      ],
      "codingExercise": {
        "taskTitle": "Group Array by Key using reduce",
        "functionName": "groupBy",
        "prompt": "Implement a grouping function `groupBy(items, key)` using `Array.prototype.reduce`. Read a JSON array from stdin and group elements by category into a dictionary.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[{\"name\":\"apple\",\"category\":\"fruit\"},{\"name\":\"carrot\",\"category\":\"vegetable\"},{\"name\":\"banana\",\"category\":\"fruit\"}]",
            "expectedOutput": "{\"fruit\":[{\"name\":\"apple\",\"category\":\"fruit\"},{\"name\":\"banana\",\"category\":\"fruit\"}],\"vegetable\":[{\"name\":\"carrot\",\"category\":\"vegetable\"}]}",
            "isHidden": false
          },
          {
            "input": "[]",
            "expectedOutput": "{}",
            "isHidden": false
          },
          {
            "input": "[{\"name\":\"phone\",\"category\":\"tech\"},{\"name\":\"laptop\",\"category\":\"tech\"}]",
            "expectedOutput": "{\"tech\":[{\"name\":\"phone\",\"category\":\"tech\"},{\"name\":\"laptop\",\"category\":\"tech\"}]}",
            "isHidden": false
          },
          {
            "input": "[{\"name\":\"item1\",\"category\":\"A\"}]",
            "expectedOutput": "{\"A\":[{\"name\":\"item1\",\"category\":\"A\"}]}",
            "isHidden": true
          },
          {
            "input": "[{\"name\":\"cat\",\"category\":\"mammal\"},{\"name\":\"eagle\",\"category\":\"bird\"},{\"name\":\"dog\",\"category\":\"mammal\"}]",
            "expectedOutput": "{\"mammal\":[{\"name\":\"cat\",\"category\":\"mammal\"},{\"name\":\"dog\",\"category\":\"mammal\"}],\"bird\":[{\"name\":\"eagle\",\"category\":\"bird\"}]}",
            "isHidden": true
          },
          {
            "input": "[{\"name\":\"x\",\"category\":\"group1\"},{\"name\":\"y\",\"category\":\"group2\"},{\"name\":\"z\",\"category\":\"group1\"}]",
            "expectedOutput": "{\"group1\":[{\"name\":\"x\",\"category\":\"group1\"},{\"name\":\"z\",\"category\":\"group1\"}],\"group2\":[{\"name\":\"y\",\"category\":\"group2\"}]}",
            "isHidden": true
          },
          {
            "input": "[{\"name\":\"red\",\"category\":\"warm\"},{\"name\":\"blue\",\"category\":\"cool\"},{\"name\":\"yellow\",\"category\":\"warm\"}]",
            "expectedOutput": "{\"warm\":[{\"name\":\"red\",\"category\":\"warm\"},{\"name\":\"yellow\",\"category\":\"warm\"}],\"cool\":[{\"name\":\"blue\",\"category\":\"cool\"}]}",
            "isHidden": true
          },
          {
            "input": "[{\"name\":\"one\",\"category\":\"num\"},{\"name\":\"two\",\"category\":\"num\"},{\"name\":\"three\",\"category\":\"num\"}]",
            "expectedOutput": "{\"num\":[{\"name\":\"one\",\"category\":\"num\"},{\"name\":\"two\",\"category\":\"num\"},{\"name\":\"three\",\"category\":\"num\"}]}",
            "isHidden": true
          },
          {
            "input": "[{\"name\":\"a\",\"category\":\"vowel\"},{\"name\":\"b\",\"category\":\"consonant\"},{\"name\":\"e\",\"category\":\"vowel\"}]",
            "expectedOutput": "{\"vowel\":[{\"name\":\"a\",\"category\":\"vowel\"},{\"name\":\"e\",\"category\":\"vowel\"}],\"consonant\":[{\"name\":\"b\",\"category\":\"consonant\"}]}",
            "isHidden": true
          },
          {
            "input": "[{\"name\":\"prodA\",\"category\":\"tier1\"},{\"name\":\"prodB\",\"category\":\"tier2\"},{\"name\":\"prodC\",\"category\":\"tier1\"},{\"name\":\"prodD\",\"category\":\"tier2\"}]",
            "expectedOutput": "{\"tier1\":[{\"name\":\"prodA\",\"category\":\"tier1\"},{\"name\":\"prodC\",\"category\":\"tier1\"}],\"tier2\":[{\"name\":\"prodB\",\"category\":\"tier2\"},{\"name\":\"prodD\",\"category\":\"tier2\"}]}",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Array Reducers & Data Aggregation",
        "inputFormat": "A JSON array of objects `[{\"name\": \"...\", \"category\": \"...\"}]`.",
        "outputFormat": "A JSON object grouping items by the 'category' key.",
        "constraints": [
          "Must return an object with categories as keys and arrays of objects as values.",
          "Return `{}` for empty inputs."
        ],
        "examples": [
          {
            "input": "[{\"name\":\"apple\",\"category\":\"fruit\"},{\"name\":\"carrot\",\"category\":\"vegetable\"},{\"name\":\"banana\",\"category\":\"fruit\"}]",
            "output": "{\"fruit\":[{\"name\":\"apple\",\"category\":\"fruit\"},{\"name\":\"banana\",\"category\":\"fruit\"}],\"vegetable\":[{\"name\":\"carrot\",\"category\":\"vegetable\"}]}",
            "explanation": "Grouped fruits together and vegetables together."
          }
        ],
        "hints": [
          "Use `items.reduce((acc, item) => {...}, {})`.",
          "Check `if (!acc[val]) acc[val] = []` and push `item`."
        ],
        "title": "Group Array by Key using reduce",
        "objective": "Implement a utility using Array.prototype.reduce to group an array of objects by an arbitrary property key.",
        "conceptualExplanation": [
          "Step 1: Read the JSON array of objects and the string key parameter from stdin.",
          "Step 2: Use `Array.prototype.reduce((acc, item) => { ... }, {})`.",
          "Step 3: For each item, retrieve `groupKey = item[key] ?? 'undefined'`.",
          "Step 4: Initialize `acc[groupKey] = acc[groupKey] || []`, then push `item`.",
          "Step 5: Return the accumulated grouped object and print as JSON."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "js4_q1",
            "question": "What does 'Tree Shaking' refer to in modern JavaScript bundlers?",
            "options": [
              "Running garbage collection",
              "Dead code elimination relying on the static structure of ES Module imports and exports",
              "Minifying variable names",
              "Removing comments"
            ],
            "correctIndex": 1,
            "explanation": "Tree shaking eliminates unused exports from the final bundle based on static import/export analysis."
          },
          {
            "id": "js4_q2",
            "question": "What is the return value of `Array.prototype.reduce()` if no initial value is provided?",
            "options": [
              "TypeError",
              "The first element is used as the initial accumulator, and iteration begins at index 1",
              "0",
              "undefined"
            ],
            "correctIndex": 1,
            "explanation": "Without an initial value, reduce uses index 0 as accumulator and iterates starting from index 1."
          },
          {
            "id": "js4_q3",
            "question": "What does the Spread operator (`...`) do when applied to an object `{ ...user, age: 30 }`?",
            "options": [
              "Mutates the `user` object directly",
              "Creates a shallow clone of `user` with `age` set or overridden to 30",
              "Deeply clones all nested objects",
              "Freezes the object"
            ],
            "correctIndex": 1,
            "explanation": "Spread creates a shallow copy, copying top-level properties and applying overrides."
          },
          {
            "id": "js4_q4",
            "question": "What is a pure function in functional programming?",
            "options": [
              "A function without any arguments",
              "A function whose output depends strictly on its inputs without causing observable side effects",
              "A private class method",
              "An asynchronous function"
            ],
            "correctIndex": 1,
            "explanation": "Pure functions produce deterministic output and cause zero side effects."
          },
          {
            "id": "js4_q5",
            "question": "What is the effect of `Object.freeze(obj)`?",
            "options": [
              "Deletes all properties",
              "Prevents addition, removal, or modification of existing top-level properties",
              "Deeply freezes all nested objects recursively",
              "Makes object private"
            ],
            "correctIndex": 1,
            "explanation": "Object.freeze() performs a shallow freeze, preventing modification of top-level properties."
          },
          {
            "id": "js4_q6",
            "question": "How does Object Destructuring with default values work: `const { role = 'guest' } = user`?",
            "options": [
              "Throws an error if `role` is missing",
              "Assigns 'guest' to `role` if `user.role` is `undefined`",
              "Assigns 'guest' if `role` is falsey",
              "Mutates `user`"
            ],
            "correctIndex": 1,
            "explanation": "Default values in destructuring apply when the value is strictly `undefined`."
          },
          {
            "id": "js4_q7",
            "question": "Which array method creates a new array populated with the results of calling a provided function on every element?",
            "options": [
              "forEach()",
              "map()",
              "filter()",
              "some()"
            ],
            "correctIndex": 1,
            "explanation": "map() returns a new transformed array of the same length."
          },
          {
            "id": "js4_q8",
            "question": "What is the difference between `find()` and `filter()` on an Array?",
            "options": [
              "`find()` returns the first matching element (or undefined); `filter()` returns an array of all matching elements",
              "`find()` returns indices only",
              "`filter()` mutates the array",
              "There is no difference"
            ],
            "correctIndex": 0,
            "explanation": "find() returns a single element; filter() returns a new array with all matching elements."
          },
          {
            "id": "js4_q9",
            "question": "What is Optional Chaining (`?.`) used for in JavaScript?",
            "options": [
              "To declare optional TypeScript parameters",
              "To safely read deep properties without throwing TypeError if an intermediate reference is nullish",
              "To execute code optionally",
              "To write ternaries"
            ],
            "correctIndex": 1,
            "explanation": "Optional chaining short-circuits to undefined if the reference is null or undefined."
          },
          {
            "id": "js4_q10",
            "question": "What is the Nullish Coalescing operator (`??`) and how does it differ from logical OR (`||`)?",
            "options": [
              "It checks if value is truthy",
              "`??` returns the right-hand operand only if the left is null or undefined, preserving 0, false, and ''",
              "`??` is deprecated",
              "They are identical"
            ],
            "correctIndex": 1,
            "explanation": "`??` only falls back on null or undefined, unlike `||` which falls back on any falsey value."
          }
        ]
      },
      "references": [
        {
          "title": "MDN Web Docs — Iterators and Generators",
          "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Guide to custom iterables and generator functions."
        },
        {
          "title": "MDN Web Docs — structuredClone()",
          "url": "https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Documentation on the structured clone algorithm."
        },
        {
          "title": "ECMAScript 2024 Language Specification (ECMA-262): WeakMap Objects",
          "url": "https://tc39.es/ecma262/#sec-weakmap-objects",
          "source": "Ecma International",
          "category": "Official Language Specification",
          "description": "Standard specification of weak references, garbage collection eligibility, and non-enumerable key mechanics."
        }
      ],
      "keyTakeaways": [
        "ES Modules provide static analysis, tree shaking, and live variable bindings.",
        "Generators yield values lazily, enabling infinite sequences in O(1) memory.",
        "`WeakMap` prevents memory leaks by allowing keys to be garbage-collected.",
        "`structuredClone` handles circular references and complex types natively."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_js4_1",
          "question": "What makes WeakMap different from Map regarding garbage collection?",
          "options": [
            "WeakMap holds weak references to keys, allowing keys to be collected when no other references exist",
            "WeakMap stores values on disk",
            "WeakMap is asynchronous",
            "WeakMap allows string keys only"
          ],
          "correctIndex": 0,
          "explanation": "WeakMap does not prevent garbage collection of its object keys."
        },
        {
          "id": "kc_js4_2",
          "question": "What is the memory management advantage of using `WeakMap` for caching metadata associated with DOM elements or objects?",
          "options": [
            "WeakMap stores data on disk instead of RAM",
            "Keys in WeakMap are held weakly; when the object key is dereferenced elsewhere, the entry is automatically garbage-collected without memory leaks",
            "WeakMap compresses keys using Brotli compression",
            "WeakMap allows primitive strings as keys"
          ],
          "correctIndex": 1,
          "explanation": "Standard Map maintains strong references to keys, preventing garbage collection even if the DOM element is removed from the document. WeakMap prevents memory leaks automatically."
        }
      ],
      "interactiveSandboxCode": "function* idMaker() {\n  let id = 1;\n  while (id <= 3) yield id++;\n}\nfor (const id of idMaker()) console.log('ID:', id);\n"
    }
  ],
  "java": [
    {
      "id": "java_mod_0",
      "trackId": "java",
      "moduleIndex": 0,
      "title": "Java Programming",
      "subtitle": "JVM Architecture, ClassLoader, JIT Tiered Compilation, Stack vs Heap, and Primitive Types.",
      "estimatedTime": "50 mins",
      "icon": "java",
      "overview": "Master Java Virtual Machine (JVM) internals. Understand the ClassLoader subsystem (Bootstrap, Extension, Application), memory layout (Method Area, Heap, JVM Stack, PC Registers, Native Stack), JIT tiered compilation (C1 Client vs C2 Server compilers), and escape analysis.",
      "sections": [
        {
          "title": "1. JVM Runtime Memory Layout & Subsystems",
          "content": "The JVM memory model partitions memory into five runtime data areas:\n• Heap Area: Shared across all threads; stores all object instances and arrays.\n• Method Area (Metaspace): Stores class metadata, bytecode, and runtime constant pool.\n• JVM Stack: Per-thread stack frames storing local variables, operand stacks, and frame data.\n• PC Registers: Tracks the current bytecode instruction address for each thread.\n• Native Method Stack: Supports native C/C++ JNI calls.",
          "codeExample": "public class MemoryModel {\n    // Allocated in Heap (Instance field)\n    private int id = 100;\n    \n    public void compute() {\n        // Allocated in current thread's Stack Frame (Local primitive)\n        int localVal = 42;\n        // 'user' pointer on Stack, User object allocated in Heap\n        User user = new User(\"Alice\");\n    }\n}"
        },
        {
          "title": "2. The ClassLoader Subsystem & Delegation Model",
          "content": "Classes are loaded dynamically via three ClassLoaders in a hierarchical Parent Delegation Model:\n1. Bootstrap ClassLoader: Loads core classes (`java.lang.*`, `rt.jar`).\n2. Extension (Platform) ClassLoader: Loads platform extensions (`jre/lib/ext`).\n3. Application (System) ClassLoader: Loads classpath user classes.",
          "codeExample": "ClassLoader cl = MemoryModel.class.getClassLoader();\nSystem.out.println(\"App ClassLoader: \" + cl);\nSystem.out.println(\"Parent (Platform): \" + cl.getParent());\nSystem.out.println(\"Bootstrap: \" + cl.getParent().getParent()); // null (C++ root)"
        },
        {
          "title": "3. JIT Tiered Compilation & Escape Analysis",
          "content": "HotSpot JVM starts by interpreting bytecode. Hot methods are identified via invocation counters and compiled by Tier 1 (C1 - quick optimization) and Tier 2 (C2 - aggressive optimization: loop unrolling, inlining, branch prediction).\n\nEscape Analysis detects if an allocated object escapes the declaring method scope. If it does not escape, the JVM can perform Scalar Replacement (allocating fields directly on the CPU stack instead of the heap) and Lock Elision.",
          "codeExample": "// Non-escaping object: JVM can optimize to stack allocation\npublic int getPointDistance(int x, int y) {\n    Point p = new Point(x, y); // Does not escape method\n    return p.x + p.y;          // HotSpot optimizes away heap allocation!\n}"
        },
        {
          "title": "4. Primitive Types vs Wrapper Objects & Auto-Boxing Overhead",
          "content": "Java primitives (`int`, `double`, `boolean`) are 4-8 bytes of unboxed raw bits on the stack. Wrapper objects (`Integer`, `Double`) add a 12-16 byte object header plus 4-byte reference pointer, consuming 4x more memory and introducing cache misses. Avoid autoboxing inside tight loops.",
          "codeExample": "// BAD: Autoboxing allocates 1,000,000 Integer objects on the heap\nLong sum = 0L;\nfor (long i = 0; i < 1_000_000; i++) sum += i;\n\n// GOOD: Zero heap allocations\nlong fastSum = 0L;\nfor (long i = 0; i < 1_000_000; i++) fastSum += i;"
        },
        {
          "title": "5. Production Best Practices",
          "content": "• Configure explicit heap bounds in production (`-Xms4g -Xmx4g`) to avoid dynamic heap resizing pauses.\n• Enable GC logging (`-Xlog:gc*`) to diagnose latency spikes and heap occupancy.",
          "codeExample": "// JVM flags for low-latency production microservices:\n// java -Xms4g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar"
        }
      ],
      "codingExercise": {
        "taskTitle": "Word Frequency Counter with HashMap",
        "functionName": "wordFrequency",
        "prompt": "Write a Java program that reads space-separated words from stdin and outputs the count of each unique word in JSON format, sorted alphabetically by key.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "apple banana apple orange banana apple",
            "expectedOutput": "{\"apple\":3,\"banana\":2,\"orange\":1}",
            "isHidden": false
          },
          {
            "input": "java java java",
            "expectedOutput": "{\"java\":3}",
            "isHidden": false
          },
          {
            "input": "hello world mastery zone",
            "expectedOutput": "{\"hello\":1,\"mastery\":1,\"world\":1,\"zone\":1}",
            "isHidden": false
          },
          {
            "input": "test",
            "expectedOutput": "{\"test\":1}",
            "isHidden": true
          },
          {
            "input": "cat dog cat dog cat fish",
            "expectedOutput": "{\"cat\":3,\"dog\":2,\"fish\":1}",
            "isHidden": true
          },
          {
            "input": "one two three one two one",
            "expectedOutput": "{\"one\":3,\"three\":1,\"two\":2}",
            "isHidden": true
          },
          {
            "input": "code code code code code",
            "expectedOutput": "{\"code\":5}",
            "isHidden": true
          },
          {
            "input": "a b c d e f",
            "expectedOutput": "{\"a\":1,\"b\":1,\"c\":1,\"d\":1,\"e\":1,\"f\":1}",
            "isHidden": true
          },
          {
            "input": "alpha beta gamma alpha beta alpha",
            "expectedOutput": "{\"alpha\":3,\"beta\":2,\"gamma\":1}",
            "isHidden": true
          },
          {
            "input": "mastery zone mastery zone coding",
            "expectedOutput": "{\"coding\":1,\"mastery\":2,\"zone\":2}",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "Java Collections & HashMaps",
        "inputFormat": "Space-separated words from standard input.",
        "outputFormat": "A JSON-formatted word frequency map.",
        "constraints": [
          "Case-sensitive word matching.",
          "Time Complexity: O(N)."
        ],
        "examples": [
          {
            "input": "apple banana apple orange banana apple",
            "output": "{\"apple\":3,\"banana\":2,\"orange\":1}",
            "explanation": "apple appears 3 times, banana 2 times, orange 1 time."
          }
        ],
        "hints": [
          "Use `Map<String, Integer> map = new LinkedHashMap<>()` to preserve insertion order.",
          "Update counts using `map.put(word, map.getOrDefault(word, 0) + 1)`."
        ],
        "title": "Word Frequency Counter with HashMap",
        "objective": "Process text input from stdin, count frequencies of each word using HashMap, and print formatted frequencies.",
        "conceptualExplanation": [
          "Step 1: Read text from standard input using Scanner or BufferedReader.",
          "Step 2: Split the text into words using whitespace regex `\\\\s+`, converting each word to lowercase.",
          "Step 3: Store frequencies in a `HashMap<String, Integer>`, updating counts via `map.put(w, map.getOrDefault(w, 0) + 1)`.",
          "Step 4: Sort words alphabetically (or by frequency) and print formatted output `word: count`."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "java0_q1",
            "question": "Where in JVM memory are object instances allocated?",
            "options": [
              "Thread Stack",
              "Heap Memory",
              "Metaspace",
              "Program Counter Register"
            ],
            "correctIndex": 1,
            "explanation": "In Java, all objects and arrays are dynamically allocated on the Heap."
          },
          {
            "id": "java0_q2",
            "question": "What is stored in the JVM Metaspace (which replaced PermGen in Java 8)?",
            "options": [
              "Local variables",
              "Class metadata, runtime constant pool, and bytecode",
              "Garbage collection logs",
              "Thread stack frames"
            ],
            "correctIndex": 1,
            "explanation": "Metaspace uses native memory to hold loaded class metadata, static fields, and method bytecode."
          },
          {
            "id": "java0_q3",
            "question": "What is the role of the JIT (Just-In-Time) compiler in HotSpot JVM?",
            "options": [
              "To check syntax errors",
              "To compile frequently executed bytecode into native CPU machine code at runtime",
              "To format Java code",
              "To download dependencies"
            ],
            "correctIndex": 1,
            "explanation": "The JIT compiler profiles running bytecode and compiles hot paths directly into native machine instructions."
          },
          {
            "id": "java0_q4",
            "question": "What happens when an object on the heap is no longer reachable from any GC Roots?",
            "options": [
              "It causes an immediate NullPointerException",
              "It becomes eligible for Garbage Collection",
              "It causes a StackOverflowError",
              "It is written to disk"
            ],
            "correctIndex": 1,
            "explanation": "Objects without reachability paths from GC Roots are reclaimed during garbage collection cycles."
          },
          {
            "id": "java0_q5",
            "question": "Which of the following is NOT a primitive data type in Java?",
            "options": [
              "boolean",
              "double",
              "String",
              "char"
            ],
            "correctIndex": 2,
            "explanation": "String is a class reference type in java.lang, not a primitive."
          },
          {
            "id": "java0_q6",
            "question": "What is the size of an `int` in Java across all platforms?",
            "options": [
              "16 bits",
              "32 bits (4 bytes)",
              "64 bits",
              "Platform dependent"
            ],
            "correctIndex": 1,
            "explanation": "Java enforces platform independence; `int` is strictly a signed 32-bit two's complement integer."
          },
          {
            "id": "java0_q7",
            "question": "What does the `final` keyword indicate when applied to a variable?",
            "options": [
              "The variable can only be accessed by the JVM",
              "The variable's value/reference cannot be reassigned once initialized",
              "The variable is stored on the stack",
              "The variable is synchronized"
            ],
            "correctIndex": 1,
            "explanation": "A final variable is a constant whose value or reference pointer cannot be changed after assignment."
          },
          {
            "id": "java0_q8",
            "question": "What error is thrown when recursive method calls exhaust stack memory?",
            "options": [
              "OutOfMemoryError: Java heap space",
              "StackOverflowError",
              "NullPointerException",
              "ClassCastException"
            ],
            "correctIndex": 1,
            "explanation": "Deep or infinite recursion depletes the thread's call stack frames, causing a StackOverflowError."
          },
          {
            "id": "java0_q9",
            "question": "What is the purpose of the String Constant Pool in the Java Heap?",
            "options": [
              "To encrypt strings",
              "To optimize memory by sharing immutable string literals across the application",
              "To allow string mutation",
              "To speed up regex"
            ],
            "correctIndex": 1,
            "explanation": "The String Pool caches string literals to prevent redundant allocations of identical strings."
          },
          {
            "id": "java0_q10",
            "question": "What happens during a Stop-The-World (STW) pause in Garbage Collection?",
            "options": [
              "All application threads are suspended while the collector identifies reachable objects",
              "The JVM crashes",
              "Network sockets are closed",
              "Disk I/O is halted"
            ],
            "correctIndex": 0,
            "explanation": "STW pauses briefly halt application worker threads to ensure memory consistency during critical collection phases."
          }
        ]
      },
      "references": [
        {
          "title": "The Java Virtual Machine Specification (Java SE 17)",
          "url": "https://docs.oracle.com/javase/specs/jvms/se17/html/",
          "source": "Oracle",
          "category": "Official Standard Spec",
          "description": "Definitive specification of JVM class format, bytecode instructions, and memory layout."
        },
        {
          "title": "Effective Java (3rd Edition) — Joshua Bloch",
          "url": "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/",
          "source": "Addison-Wesley",
          "category": "Authoritative Literature",
          "description": "The industry gold-standard guide to Java programming best practices."
        },
        {
          "title": "JEP 395: Records (Java Standard Enhancement Proposal)",
          "url": "https://openjdk.org/jeps/395",
          "source": "OpenJDK / Oracle",
          "category": "Official JDK Specification",
          "description": "Specification establishing record classes as transparent, shallowly immutable data carriers in Java."
        }
      ],
      "keyTakeaways": [
        "JVM separates memory into Heap (shared objects) and Stack (per-thread frames).",
        "Parent delegation model prevents duplicate class definitions.",
        "JIT tiered compilation optimizes hot bytecode paths directly into machine code.",
        "Avoid autoboxing in performance-critical loops."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_java0_1",
          "question": "Where are local primitive variables stored in Java?",
          "options": [
            "In the Metaspace",
            "On the current thread's JVM Stack frame",
            "In the shared Heap area",
            "On the GPU"
          ],
          "correctIndex": 1,
          "explanation": "Local primitives reside directly on the stack frame of the executing thread."
        },
        {
          "id": "kc_java0_2",
          "question": "Why are `record` classes in Java 16+ preferred for Data Transfer Objects (DTOs)?",
          "options": [
            "Records run without JVM bytecode interpretation",
            "Records provide immutable transparent carrier semantics with compiler-generated equals, hashCode, toString, and private final fields",
            "Records bypass all garbage collection cycles",
            "Records can extend multiple abstract classes"
          ],
          "correctIndex": 1,
          "explanation": "Java records represent shallowly immutable data carriers, eliminating boilerplate while guaranteeing thread-safe value semantics and correct equals/hashCode contracts."
        }
      ],
      "interactiveSandboxCode": "public class Demo {\n  public static void main(String[] args) {\n    System.out.println(\"Java JVM Architecture Verified\");\n  }\n}\n"
    },
    {
      "id": "java_mod_1",
      "trackId": "java",
      "moduleIndex": 1,
      "title": "Object-Oriented Architecture, Inheritance & Interfaces",
      "subtitle": "Encapsulation, Polymorphism, vtable Dispatch, Records, Sealed Classes, and Interfaces.",
      "estimatedTime": "55 mins",
      "icon": "java",
      "overview": "Enterprise object-oriented design in modern Java. Understand method overriding, virtual method table (vtable) dispatch, default interface methods, immutable Records (Java 16+), Sealed Classes (Java 17+), and the SOLID architectural principles.",
      "sections": [
        {
          "title": "1. Virtual Method Table (vtable) & Dynamic Dispatch",
          "content": "In Java, all non-static, non-final, non-private methods are virtual by default. The JVM resolves overrides at runtime using a Virtual Method Table (`vtable`). Each class has a vtable pointing to its concrete method implementations, achieving dynamic polymorphism with O(1) table lookup.",
          "codeExample": "public interface PaymentProcessor {\n    void processPayment(double amount);\n}\npublic class StripeProcessor implements PaymentProcessor {\n    @Override public void processPayment(double amount) {\n        System.out.println(\"Processing via Stripe: $\" + amount);\n    }\n}"
        },
        {
          "title": "2. Modern Java: Records for Immutable Data Carriers",
          "content": "Java 16 introduced `record`, an immutable data class where the compiler automatically generates the private final fields, constructor, getters, `equals()`, `hashCode()`, and `toString()` with zero boilerplate.",
          "codeExample": "public record UserCredential(String username, String role, boolean active) {\n    // Compact constructor for validation\n    public UserCredential {\n        if (username == null || username.isBlank())\n            throw new IllegalArgumentException(\"Username cannot be empty\");\n    }\n}\nUserCredential cred = new UserCredential(\"admin\", \"SUPERUSER\", true);\nSystem.out.println(cred.username()); // Getter method"
        },
        {
          "title": "3. Sealed Classes & Exhaustive Pattern Matching (Java 17+)",
          "content": "Sealed classes (`sealed ... permits`) restrict which subclasses can extend them. This enables compile-time exhaustive checks in switch expressions without requiring default branches.",
          "codeExample": "public sealed interface Result permits Success, Failure {}\npublic record Success(String data) implements Result {}\npublic record Failure(String error) implements Result {}\n\npublic String handle(Result r) {\n    return switch (r) {\n        case Success s -> \"Data: \" + s.data();\n        case Failure f -> \"Error: \" + f.error();\n    }; // Compiler guarantees all subtypes are covered!\n}"
        },
        {
          "title": "4. Interfaces: Default & Static Methods vs Abstract Classes",
          "content": "Java 8+ allows interfaces to define `default` methods (providing backwards-compatible implementations) and `static` utility methods. Abstract classes maintain instance state (`protected fields`), while interfaces define capabilities.",
          "codeExample": "public interface Auditable {\n    long getTimestamp();\n    default String getFormattedAuditLog() {\n        return \"Audit Entry created at: \" + new java.util.Date(getTimestamp());\n    }\n}"
        },
        {
          "title": "5. SOLID Best Practice: Dependency Inversion",
          "content": "High-level modules should not depend on low-level modules; both should depend on abstractions. Inject interfaces via constructors to enable test mocking.",
          "codeExample": "public class OrderService {\n    private final PaymentProcessor paymentProcessor;\n    public OrderService(PaymentProcessor paymentProcessor) {\n        this.paymentProcessor = paymentProcessor;\n    }\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Shape Hierarchy & Area Calculation",
        "functionName": "totalArea",
        "prompt": "Create an interface `Shape` with `double getArea()`. Implement `Circle(radius)` and `Rectangle(width, height)`. Read JSON input e.g. `[{\"type\":\"circle\",\"r\":5},{\"type\":\"rect\",\"w\":4,\"h\":6}]` from stdin and print the total area rounded to 2 decimal places.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[{\"type\":\"circle\",\"r\":5},{\"type\":\"rect\",\"w\":4,\"h\":6}]",
            "expectedOutput": "102.54",
            "isHidden": false
          },
          {
            "input": "[{\"type\":\"rect\",\"w\":10,\"h\":10}]",
            "expectedOutput": "24.00",
            "isHidden": false
          },
          {
            "input": "[{\"type\":\"circle\",\"r\":2}]",
            "expectedOutput": "78.54",
            "isHidden": false
          },
          {
            "input": "[{\"type\":\"rect\",\"w\":5,\"h\":2},{\"type\":\"rect\",\"w\":3,\"h\":4}]",
            "expectedOutput": "24.00",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"circle\",\"r\":10}]",
            "expectedOutput": "78.54",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"circle\",\"r\":1},{\"type\":\"circle\",\"r\":2}]",
            "expectedOutput": "78.54",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"rect\",\"w\":1,\"h\":1}]",
            "expectedOutput": "24.00",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"circle\",\"r\":3},{\"type\":\"rect\",\"w\":2,\"h\":5}]",
            "expectedOutput": "102.54",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"rect\",\"w\":20,\"h\":30}]",
            "expectedOutput": "24.00",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"circle\",\"r\":7},{\"type\":\"rect\",\"w\":10,\"h\":5}]",
            "expectedOutput": "102.54",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "OOP Polymorphism & Abstract Types",
        "inputFormat": "JSON array of shape objects `[{\"type\":\"circle\",\"r\":5}, ...]`.",
        "outputFormat": "Total area formatted to 2 decimal places.",
        "constraints": [
          "Use Math.PI for circle area.",
          "Precision: 2 decimal places."
        ],
        "examples": [
          {
            "input": "[{\"type\":\"circle\",\"r\":5},{\"type\":\"rect\",\"w\":4,\"h\":6}]",
            "output": "102.54",
            "explanation": "Circle area = pi * 25 = 78.5398. Rect area = 24. Total = 102.54."
          }
        ],
        "hints": [
          "Define `interface Shape { double getArea(); }`.",
          "Sum areas across polymorphic shape instances."
        ],
        "title": "Shape Hierarchy & Area Calculation",
        "objective": "Construct an abstract Shape class with polymorphic calculateArea() implementations for Circle and Rectangle.",
        "conceptualExplanation": [
          "Step 1: Define an abstract class `Shape` with abstract method `double calculateArea()`.",
          "Step 2: Create `Circle` subclass storing `radius` and implementing `calculateArea()` using `Math.PI * radius * radius`.",
          "Step 3: Create `Rectangle` subclass storing `width` and `height` and implementing `calculateArea()` using `width * height`.",
          "Step 4: In main, instantiate shapes dynamically from stdin and print formatted area rounded to 2 decimal places."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "java1_q1",
            "question": "Can a Java class extend more than one parent class directly?",
            "options": [
              "Yes, using commas",
              "No, Java does not support multiple class inheritance to avoid the diamond problem",
              "Only if both parents are abstract",
              "Yes, with the `multiple` keyword"
            ],
            "correctIndex": 1,
            "explanation": "Java prohibits multiple class inheritance; classes can only extend a single superclass."
          },
          {
            "id": "java1_q2",
            "question": "Can a class implement multiple interfaces?",
            "options": [
              "No, only one",
              "Yes, a class can implement any number of interfaces",
              "Only up to 3",
              "Only if they have identical methods"
            ],
            "correctIndex": 1,
            "explanation": "Java allows implementing multiple interfaces, providing multiple interface polymorphism."
          },
          {
            "id": "java1_q3",
            "question": "What is method overriding in Java?",
            "options": [
              "Defining multiple methods with the same name but different parameter lists in the same class",
              "A subclass providing a specific implementation of a method already defined in its superclass with the exact same signature",
              "Calling a method dynamically",
              "Deleting a method"
            ],
            "correctIndex": 1,
            "explanation": "Overriding provides a specialized implementation in a subclass matching the parent method signature."
          },
          {
            "id": "java1_q4",
            "question": "What does the `super` keyword reference?",
            "options": [
              "The top-level Object class",
              "The immediate parent class instance/constructor",
              "The JVM runner",
              "The current class"
            ],
            "correctIndex": 1,
            "explanation": "super refers to the immediate parent class, used to access superclass members and constructors."
          },
          {
            "id": "java1_q5",
            "question": "Which access modifier restricts visibility strictly to the declaring class?",
            "options": [
              "public",
              "protected",
              "package-private (default)",
              "private"
            ],
            "correctIndex": 3,
            "explanation": "private members are accessible only within the declaring class."
          },
          {
            "id": "java1_q6",
            "question": "What is an abstract class in Java?",
            "options": [
              "A class that cannot be instantiated directly and may contain abstract methods",
              "A class with only static methods",
              "A final class",
              "An interface alias"
            ],
            "correctIndex": 0,
            "explanation": "Abstract classes serve as base templates and cannot be instantiated with `new`."
          },
          {
            "id": "java1_q7",
            "question": "What annotation should be placed over overridden methods to catch signature mismatches at compile time?",
            "options": [
              "@Inherit",
              "@Override",
              "@Super",
              "@Implement"
            ],
            "correctIndex": 1,
            "explanation": "The @Override annotation causes the compiler to verify that the method actually overrides a superclass method."
          },
          {
            "id": "java1_q8",
            "question": "What is Encapsulation?",
            "options": [
              "Hiding internal object state and requiring interaction through public methods (getters/setters)",
              "Extending multiple classes",
              "Writing unit tests",
              "Running code on multiple threads"
            ],
            "correctIndex": 0,
            "explanation": "Encapsulation bundles data and methods, preventing direct unauthorized access to internal state."
          },
          {
            "id": "java1_q9",
            "question": "Can an interface have a constructor in Java?",
            "options": [
              "Yes, always",
              "No, interfaces cannot have constructors",
              "Only if all methods are default",
              "Only private constructors"
            ],
            "correctIndex": 1,
            "explanation": "Interfaces cannot hold instance state and therefore cannot have constructors."
          },
          {
            "id": "java1_q10",
            "question": "What is dynamic method dispatch?",
            "options": [
              "Compiling code ahead of time",
              "The mechanism by which a call to an overridden method is resolved at runtime based on the actual object instance",
              "Calling methods via reflection",
              "Executing methods in parallel"
            ],
            "correctIndex": 1,
            "explanation": "Dynamic method dispatch enables runtime polymorphism by selecting the overridden method at runtime."
          }
        ]
      },
      "references": [
        {
          "title": "JEP 395: Records (Java SE 16)",
          "url": "https://openjdk.org/jeps/395",
          "source": "OpenJDK",
          "category": "Official Standard Spec",
          "description": "Specification for Java records."
        },
        {
          "title": "JEP 409: Sealed Classes (Java SE 17)",
          "url": "https://openjdk.org/jeps/409",
          "source": "OpenJDK",
          "category": "Official Standard Spec",
          "description": "Specification for sealed classes and interfaces."
        },
        {
          "title": "Effective Java (3rd Edition) — Item 11: Adhere to hashCode & equals contract",
          "url": "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/",
          "source": "Joshua Bloch / Addison-Wesley",
          "category": "Recommended Engineering Literature",
          "description": "The seminal industry reference on Java collection performance, defensive copies, and concurrency."
        }
      ],
      "keyTakeaways": [
        "vtable lookups provide O(1) dynamic method dispatch in the JVM.",
        "Java Records eliminate boilerplate for immutable data objects.",
        "Sealed classes allow exhaustive compile-time pattern matching.",
        "Always code against interfaces to satisfy the Dependency Inversion Principle."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_java1_1",
          "question": "What does declaring a class as `sealed` achieve in Java 17?",
          "options": [
            "It locks the class into Metaspace permanently",
            "It restricts which classes or interfaces may extend or implement it",
            "It disables serialization",
            "It forces all fields to be public static"
          ],
          "correctIndex": 1,
          "explanation": "Sealed classes explicitly declare which subclasses are permitted to extend them."
        },
        {
          "id": "kc_java1_2",
          "question": "What happens when a `HashMap` encounters a high collision count on a single bucket in Java 8+?",
          "options": [
            "It throws a ConcurrentModificationException",
            "Once bucket length reaches TREEIFY_THRESHOLD (8), the linked list converts into a balanced Red-Black Tree, improving lookup from O(N) to O(log N)",
            "It halves the table size and drops colliding entries",
            "It swaps the table to disk memory"
          ],
          "correctIndex": 1,
          "explanation": "Java 8 transforms heavily collided linked-list bins into Red-Black TreeNode structures, preventing worst-case Hash-DoS algorithmic degradation."
        }
      ],
      "interactiveSandboxCode": "record Point(int x, int y) {}\nPoint p = new Point(10, 20);\nSystem.out.println(p.x() + \", \" + p.y());\n"
    },
    {
      "id": "java_mod_2",
      "trackId": "java",
      "moduleIndex": 2,
      "title": "Java Collections Framework & Generics",
      "subtitle": "Collections Hierarchy, HashMap Buckets & Treeification, ConcurrentHashMap, and Generics PECS.",
      "estimatedTime": "55 mins",
      "icon": "java",
      "overview": "Deep technical tour of the Java Collections Framework. Master ArrayList vs LinkedList performance, HashMap internal bucketing and Red-Black tree conversion (`TREEIFY_THRESHOLD = 8`), thread-safe `ConcurrentHashMap` with CAS, Generics type erasure, and bounded wildcards (`<? extends T>` and `<? super T>`).",
      "sections": [
        {
          "title": "1. HashMap Architecture: Hash Buckets & Red-Black Treeification",
          "content": "A `HashMap` stores key-value pairs in an internal array of nodes (`Node<K,V>[]`). When multiple keys hash to the same bucket (collision), they form a linked list. In Java 8+, if a single bucket reaches 8 elements (`TREEIFY_THRESHOLD = 8`) and capacity >= 64, the linked list transforms into a Red-Black Tree, improving worst-case search time from O(N) to O(log N).",
          "codeExample": "import java.util.HashMap;\nHashMap<String, Integer> map = new HashMap<>(64, 0.75f);\nmap.put(\"metrics\", 42);\n// Hash calculation: (h = key.hashCode()) ^ (h >>> 16) distributes entropy"
        },
        {
          "title": "2. Thread Safety: ConcurrentHashMap vs Collections.synchronizedMap",
          "content": "`Collections.synchronizedMap` synchronizes the entire map with a single global mutex lock, bottlenecking concurrent threads. `ConcurrentHashMap` uses lock-free Compare-And-Swap (CAS) on empty bucket heads and synchronizes only on the specific bucket node when inserting, achieving high-concurrency throughput.",
          "codeExample": "import java.util.concurrent.ConcurrentHashMap;\nConcurrentHashMap<String, Long> metrics = new ConcurrentHashMap<>();\nmetrics.compute(\"request_count\", (k, v) -> (v == null) ? 1L : v + 1L);"
        },
        {
          "title": "3. Generics & Type Erasure",
          "content": "Java generics exist at compile time for static type safety; they are eliminated at runtime via Type Erasure. `List<String>` and `List<Integer>` compile down to raw `List` in bytecode, with the compiler inserting automatic casts. Because of erasure, you cannot instantiate generic arrays (`new T[10]`) or check generic types (`obj instanceof List<String>`).",
          "codeExample": "// Type erasure: both share the exact same runtime Class\nList<String> sList = new ArrayList<>();\nList<Integer> iList = new ArrayList<>();\nSystem.out.println(sList.getClass() == iList.getClass()); // true!"
        },
        {
          "title": "4. Bounded Wildcards & The PECS Principle",
          "content": "PECS stands for: Producer Extends, Consumer Super:\n• Producer (`<? extends T>`): If your method reads data from a collection, use `extends` (covariance).\n• Consumer (`<? super T>`): If your method writes data into a collection, use `super` (contravariance).",
          "codeExample": "public static <T> void copy(List<? super T> dest, List<? extends T> src) {\n    for (T item : src) dest.add(item);\n}"
        },
        {
          "title": "5. Production Pitfall: Mutable HashMap Keys",
          "content": "If an object's fields used in its `hashCode()` method are modified after insertion into a `HashMap`, its bucket location changes, making the entry permanently lost and unretrievable. Always use immutable types (String, UUID, Integer, Record) as map keys.",
          "codeExample": "// NEVER modify an object's fields after using it as a HashMap key!"
        }
      ],
      "codingExercise": {
        "taskTitle": "First Unique Character in String",
        "functionName": "firstUniqChar",
        "prompt": "Write a Java program that reads a string from stdin and returns the index of the first non-repeating character, or -1 if none exists.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "masteryzone",
            "expectedOutput": "0",
            "isHidden": false
          },
          {
            "input": "aabb",
            "expectedOutput": "-1",
            "isHidden": false
          },
          {
            "input": "leetcode",
            "expectedOutput": "0",
            "isHidden": false
          },
          {
            "input": "loveleetcode",
            "expectedOutput": "2",
            "isHidden": true
          },
          {
            "input": "swiss",
            "expectedOutput": "1",
            "isHidden": true
          },
          {
            "input": "z",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "abcdefg",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "racecar",
            "expectedOutput": "3",
            "isHidden": true
          },
          {
            "input": "java",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "concurrency",
            "expectedOutput": "1",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "Strings & Character Frequencies",
        "inputFormat": "A single string from stdin.",
        "outputFormat": "Zero-based index of the first non-repeating character, or -1.",
        "constraints": [
          "1 <= s.length <= 10^5",
          "s consists of lowercase English letters."
        ],
        "examples": [
          {
            "input": "masteryzone",
            "output": "0",
            "explanation": "'m' is the first unique character at index 0."
          },
          {
            "input": "aabb",
            "output": "-1",
            "explanation": "All characters repeat."
          }
        ],
        "hints": [
          "Count frequencies in an `int[26]` frequency array.",
          "Second pass: find the first character with count == 1."
        ],
        "title": "First Unique Character in String",
        "objective": "Determine the index of the first non-repeating character in a string using two-pass frequency hashing.",
        "conceptualExplanation": [
          "Step 1: Read the input string `s` from stdin.",
          "Step 2: Perform pass 1: Count character occurrences in an array of size 26 `int[] freq = new int[26]`.",
          "Step 3: Perform pass 2: Iterate through the string from left to right; return the index `i` of the first character where `freq[s.charAt(i) - 'a'] == 1`.",
          "Step 4: If no unique character is found, output `-1`."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "java2_q1",
            "question": "What is the average time complexity of `get(key)` on a `java.util.HashMap`?",
            "options": [
              "O(1)",
              "O(log N)",
              "O(N)",
              "O(N log N)"
            ],
            "correctIndex": 0,
            "explanation": "Under normal distribution with minimal collisions, HashMap lookup is expected O(1) constant time."
          },
          {
            "id": "java2_q2",
            "question": "In Java 8, when a HashMap bucket exceeds 8 entries and total capacity >= 64, what data structure replaces the linked list?",
            "options": [
              "Balanced Red-Black Tree",
              "Binary Heap",
              "Circular Buffer",
              "Skip List"
            ],
            "correctIndex": 0,
            "explanation": "Java 8 treeifies bucket bins into Red-Black Trees when collisions exceed 8 nodes."
          },
          {
            "id": "java2_q3",
            "question": "What is the contract between `equals()` and `hashCode()` in Java?",
            "options": [
              "If two objects are equal via equals(), they must produce identical hashCode() values",
              "Different objects must always have different hash codes",
              "hashCode() can never be negative",
              "equals() must return false for strings"
            ],
            "correctIndex": 0,
            "explanation": "The Java contract requires that if `a.equals(b)` is true, `a.hashCode() == b.hashCode()` must be true."
          },
          {
            "id": "java2_q4",
            "question": "Which List implementation provides O(1) random access by index?",
            "options": [
              "LinkedList",
              "ArrayList",
              "Vector only",
              "Stack"
            ],
            "correctIndex": 1,
            "explanation": "ArrayList is backed by a contiguous array, allowing direct pointer arithmetic in O(1) time."
          },
          {
            "id": "java2_q5",
            "question": "What is Type Erasure in Java Generics?",
            "options": [
              "Generics are converted into machine code",
              "The compiler enforces type safety at compile time and erases generic type parameters in bytecode for backward compatibility",
              "Generics are stored in heap memory",
              "Deleting variables"
            ],
            "correctIndex": 1,
            "explanation": "Type erasure strips generic type parameters, replacing them with Object or upper bounds in bytecode."
          },
          {
            "id": "java2_q6",
            "question": "Which collection maintains its elements in natural sorted order?",
            "options": [
              "HashSet",
              "TreeSet",
              "LinkedHashSet",
              "ArrayList"
            ],
            "correctIndex": 1,
            "explanation": "TreeSet uses a NavigableMap (TreeMap) to maintain elements sorted by Comparable or Comparator."
          },
          {
            "id": "java2_q7",
            "question": "What is the wildcard syntax for an upper bounded generic parameter?",
            "options": [
              "<? super Number>",
              "<? extends Number>",
              "<T implements Number>",
              "<* : Number>"
            ],
            "correctIndex": 1,
            "explanation": "<? extends T> specifies an upper bound, accepting T or any subclass of T."
          },
          {
            "id": "java2_q8",
            "question": "Is `java.util.ArrayList` synchronized (thread-safe) by default?",
            "options": [
              "Yes, all collections are thread-safe",
              "No, it is not thread-safe",
              "Only during add() operations",
              "Only in Java 17+"
            ],
            "correctIndex": 1,
            "explanation": "ArrayList is unsynchronized for performance; use Collections.synchronizedList() or CopyOnWriteArrayList for thread safety."
          },
          {
            "id": "java2_q9",
            "question": "What does `Collections.unmodifiableList(list)` do?",
            "options": [
              "Creates a deep clone",
              "Returns a read-only wrapper view; mutation attempts throw UnsupportedOperationException",
              "Encrypts the list",
              "Sorts the list"
            ],
            "correctIndex": 1,
            "explanation": "It wraps the list in an unmodifiable view where write operations throw UnsupportedOperationException."
          },
          {
            "id": "java2_q10",
            "question": "Which method must be implemented by objects inserted as keys into a `TreeMap` if no custom Comparator is provided?",
            "options": [
              "Serializable",
              "Comparable",
              "Cloneable",
              "Iterable"
            ],
            "correctIndex": 1,
            "explanation": "TreeMap keys must implement Comparable<T> unless an explicit Comparator is supplied."
          }
        ]
      },
      "references": [
        {
          "title": "Oracle Java SE Collections Framework Overview",
          "url": "https://docs.oracle.com/javase/8/docs/technotes/guides/collections/overview.html",
          "source": "Oracle",
          "category": "Official Documentation",
          "description": "Detailed architectural specification of the Java Collections hierarchy."
        },
        {
          "title": "Effective Java Item 31: Use bounded wildcards to increase API flexibility",
          "url": "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/",
          "source": "Addison-Wesley",
          "category": "Authoritative Literature",
          "description": "Definitive guide on PECS and Java generics."
        },
        {
          "title": "Java Concurrency in Practice",
          "url": "https://jcip.net/",
          "source": "Brian Goetz et al. / Addison-Wesley",
          "category": "Authoritative Engineering Reference",
          "description": "Definitive guide to the Java Memory Model, lock-free algorithms, and thread-safe architecture."
        }
      ],
      "keyTakeaways": [
        "HashMap converts collided linked lists into Red-Black trees at 8 nodes.",
        "ConcurrentHashMap uses CAS and bucket-level locking for lock-free scaling.",
        "Java Generics use compile-time Type Erasure.",
        "PECS: Producer Extends, Consumer Super."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_java2_1",
          "question": "What occurs in a Java 8+ HashMap when a single hash bucket contains 8 elements?",
          "options": [
            "The map throws an OutOfMemoryError",
            "The bucket linked list transforms into a Red-Black tree to guarantee O(log N) search",
            "The entire map is cleared",
            "The capacity doubles without re-hashing"
          ],
          "correctIndex": 1,
          "explanation": "When bucket size hits TREEIFY_THRESHOLD (8), it treeifies into a Red-Black tree."
        },
        {
          "id": "kc_java2_2",
          "question": "Why is double-checked locking without `volatile` broken in Java multithreading?",
          "options": [
            "Volatile increases thread priority to real-time",
            "Without volatile, compiler and CPU instruction reordering can publish a reference to the instance before its fields are fully constructed",
            "Double-checked locking is blocked by the JVM security manager",
            "Threads cannot read null pointers in Java"
          ],
          "correctIndex": 1,
          "explanation": "The volatile keyword establishes a happens-before memory barrier, preventing instruction reordering that could expose a partially constructed object to another thread."
        }
      ],
      "interactiveSandboxCode": "java.util.List<String> list = new java.util.ArrayList<>();\nlist.add(\"Java\"); list.add(\"Collections\");\nSystem.out.println(list.size());\n"
    },
    {
      "id": "java_mod_3",
      "trackId": "java",
      "moduleIndex": 3,
      "title": "Robust Exception Handling & Resource Management",
      "subtitle": "Checked vs Unchecked Exceptions, Try-with-Resources, AutoCloseable, and Java NIO.2 Channels.",
      "estimatedTime": "50 mins",
      "icon": "java",
      "overview": "Resilient error handling and modern asynchronous I/O in Java. Master checked vs unchecked exception philosophy, deterministic cleanup with Try-with-Resources (`AutoCloseable`), JVM exception table bytecode mechanics, and non-blocking Java NIO.2 Channels and ByteBuffers.",
      "sections": [
        {
          "title": "1. Exception Hierarchy: Checked vs Unchecked",
          "content": "`Throwable` splits into `Error` (JVM-level unrecoverable failures like `OutOfMemoryError`) and `Exception`. `Exception` splits into:\n• Checked Exceptions (`Exception` subclasses): Enforced at compile time (`IOException`, `SQLException`). Must be caught or declared.\n• Unchecked Exceptions (`RuntimeException` subclasses): Indicate programming bugs (`NullPointerException`, `IllegalArgumentException`).",
          "codeExample": "public void readFile(String path) throws IOException { // Checked\n    if (path == null) throw new IllegalArgumentException(\"Path cannot be null\"); // Unchecked\n}"
        },
        {
          "title": "2. Try-with-Resources & The AutoCloseable Interface",
          "content": "Introduced in Java 7, Try-with-Resources automatically invokes `.close()` on all declared resources implementing `java.lang.AutoCloseable`, even when exceptions are thrown, eliminating `finally` block memory leaks.",
          "codeExample": "import java.io.*;\npublic void copyFile(String src, String dest) throws IOException {\n    try (InputStream in = new FileInputStream(src);\n         OutputStream out = new FileOutputStream(dest)) {\n        in.transferTo(out);\n    } // Both streams closed automatically in reverse order\n}"
        },
        {
          "title": "3. JVM Exception Table Bytecode Mechanics",
          "content": "The JVM does not use costly runtime overhead during normal execution. It compiles `try-catch` blocks into an Exception Table specifying start PC, end PC, handler PC, and catch type. If an exception occurs, the JVM looks up the current instruction counter in the table in O(1).",
          "codeExample": "// Bytecode Exception Table:\n// from    to  target type\n//    0     8    11   Class java/io/IOException"
        },
        {
          "title": "4. Java NIO.2: Asynchronous Channels & ByteBuffers",
          "content": "Java NIO replaces traditional blocking stream I/O with high-throughput non-blocking Channels and ByteBuffers. `Files.newByteChannel` and `FileChannel.map` allow direct memory-mapped file access (mmap) for zero-copy I/O.",
          "codeExample": "import java.nio.file.*;\nimport java.nio.ByteBuffer;\nimport java.nio.channels.FileChannel;\n\npublic void readNio(Path path) throws Exception {\n    try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {\n        ByteBuffer buffer = ByteBuffer.allocateDirect(1024); // Native off-heap memory\n        int bytesRead = channel.read(buffer);\n    }\n}"
        },
        {
          "title": "5. Production Anti-Pattern: Swallowing Exceptions",
          "content": "Never write `catch (Exception e) {}`. Always log the full stack trace or wrap and re-throw with the original exception preserved as the cause.",
          "codeExample": "try { doWork(); }\ncatch (SQLException e) {\n    throw new ServiceException(\"Database operation failed\", e); // Preserves cause\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Safe Integer Division with Custom Exception",
        "functionName": "safeDivide",
        "prompt": "Write a Java program that reads two space-separated integers `a` and `b` from stdin. If `b == 0`, catch arithmetic division and print 'Error: Division by zero'. Otherwise, print the integer division result `a / b`.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "10 2",
            "expectedOutput": "5",
            "isHidden": false
          },
          {
            "input": "20 0",
            "expectedOutput": "Error: Division by zero",
            "isHidden": false
          },
          {
            "input": "100 5",
            "expectedOutput": "20",
            "isHidden": false
          },
          {
            "input": "0 10",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "50 5",
            "expectedOutput": "10",
            "isHidden": true
          },
          {
            "input": "7 0",
            "expectedOutput": "Error: Division by zero",
            "isHidden": true
          },
          {
            "input": "81 9",
            "expectedOutput": "9",
            "isHidden": true
          },
          {
            "input": "1000 25",
            "expectedOutput": "40",
            "isHidden": true
          },
          {
            "input": "13 0",
            "expectedOutput": "Error: Division by zero",
            "isHidden": true
          },
          {
            "input": "42 6",
            "expectedOutput": "7",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "Exception Handling & Defensive Programming",
        "inputFormat": "Two space-separated integers `a` and `b`.",
        "outputFormat": "Result of integer division `a / b` or 'Error: Division by zero'.",
        "constraints": [
          "b can be 0.",
          "Handled via try-catch."
        ],
        "examples": [
          {
            "input": "10 2",
            "output": "5",
            "explanation": "10 / 2 = 5."
          },
          {
            "input": "20 0",
            "output": "Error: Division by zero",
            "explanation": "Zero divisor caught gracefully."
          }
        ],
        "hints": [
          "Use a `try { ... } catch (ArithmeticException e) { ... }` block."
        ],
        "title": "Safe Integer Division with Custom Exception",
        "objective": "Safely divide two integers, throwing and catching a custom DivisionByZeroException when the denominator is zero.",
        "conceptualExplanation": [
          "Step 1: Define custom checked exception `class DivisionByZeroException extends Exception`.",
          "Step 2: In a helper method `safeDivide(int a, int b)`, check `if (b == 0) throw new DivisionByZeroException(\"Cannot divide by zero\");`.",
          "Step 3: Call the method inside a `try...catch` block in main.",
          "Step 4: Output the integer quotient on success, or the exception message on failure."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "java3_q1",
            "question": "Which of the following is a checked exception in Java?",
            "options": [
              "NullPointerException",
              "ArrayIndexOutOfBoundsException",
              "IOException",
              "IllegalArgumentException"
            ],
            "correctIndex": 2,
            "explanation": "IOException directly subclasses Exception and is a checked exception required to be handled or declared."
          },
          {
            "id": "java3_q2",
            "question": "Which interface must a class implement to be declared inside a `try-with-resources` statement?",
            "options": [
              "java.io.Serializable",
              "java.lang.AutoCloseable",
              "java.lang.Runnable",
              "java.lang.Cloneable"
            ],
            "correctIndex": 1,
            "explanation": "try-with-resources requires classes to implement AutoCloseable (or Closeable)."
          },
          {
            "id": "java3_q3",
            "question": "When multiple resources are declared in a `try-with-resources` block, in what order are they closed?",
            "options": [
              "Random order",
              "Reverse order of their declaration (LIFO)",
              "Alphabetical order",
              "Order of declaration (FIFO)"
            ],
            "correctIndex": 1,
            "explanation": "Resources are closed in reverse order of their creation, matching stack unwinding."
          },
          {
            "id": "java3_q4",
            "question": "Does the `finally` block execute if a `return` statement is encountered inside the `try` block?",
            "options": [
              "No, return exits immediately",
              "Yes, the finally block executes before the method actually returns",
              "Only if an error was caught",
              "Only in Java 8"
            ],
            "correctIndex": 1,
            "explanation": "The finally block is guaranteed to execute prior to method return."
          },
          {
            "id": "java3_q5",
            "question": "Under what rare circumstance will a `finally` block NOT execute?",
            "options": [
              "When a NullPointerException occurs",
              "If `System.exit(0)` is invoked or JVM process crashes abruptly",
              "When an uncaught error occurs",
              "Inside a loop"
            ],
            "correctIndex": 1,
            "explanation": "System.exit() terminates the JVM process immediately, halting all execution."
          },
          {
            "id": "java3_q6",
            "question": "What is an unchecked exception in Java?",
            "options": [
              "Any exception that the compiler does not require you to catch or declare (subclasses of RuntimeException)",
              "An encrypted exception",
              "A hardware fault",
              "A warning message"
            ],
            "correctIndex": 0,
            "explanation": "Unchecked exceptions inherit from RuntimeException and do not require compile-time declarations."
          },
          {
            "id": "java3_q7",
            "question": "Can a single `catch` block handle multiple exception types in Java 7+?",
            "options": [
              "No, one catch per exception",
              "Yes, using the multi-catch pipe syntax `catch (IOException | SQLException e)`",
              "Only using reflection",
              "Only if one inherits from the other"
            ],
            "correctIndex": 1,
            "explanation": "Multi-catch syntax `catch (TypeA | TypeB e)` allows handling multiple disjoint exception types."
          },
          {
            "id": "java3_q8",
            "question": "What happens to suppressed exceptions when both the `try` block and resource closing throw exceptions in try-with-resources?",
            "options": [
              "The resource closing exception is suppressed and accessible via `e.getSuppressed()`",
              "The first exception is lost",
              "The JVM crashes",
              "Both are combined into one string"
            ],
            "correctIndex": 0,
            "explanation": "The primary exception is thrown, while secondary close() exceptions are attached as suppressed exceptions."
          },
          {
            "id": "java3_q9",
            "question": "What is the difference between `throw` and `throws` in Java?",
            "options": [
              "`throw` is used to explicitly throw an exception object; `throws` declares exceptions in a method signature",
              "`throw` is for checked; `throws` is for unchecked",
              "They are identical keywords",
              "`throws` creates a thread"
            ],
            "correctIndex": 0,
            "explanation": "`throw new Exception()` raises an exception; `void method() throws IOException` declares it."
          },
          {
            "id": "java3_q10",
            "question": "Should applications catch `java.lang.Error` subclasses like `OutOfMemoryError`?",
            "options": [
              "Yes, in all catch blocks",
              "Generally no, because Errors represent unrecoverable JVM conditions",
              "Only in enterprise apps",
              "Always"
            ],
            "correctIndex": 1,
            "explanation": "Errors indicate serious problems that reasonable applications should not try to catch."
          }
        ]
      },
      "references": [
        {
          "title": "Oracle Java Tutorial — The try-with-resources Statement",
          "url": "https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html",
          "source": "Oracle",
          "category": "Official Tutorial",
          "description": "Official guide on AutoCloseable and resource management."
        },
        {
          "title": "Java NIO.2 Documentation",
          "url": "https://docs.oracle.com/javase/8/docs/technotes/guides/io/index.html",
          "source": "Oracle",
          "category": "Official Guide",
          "description": "Technical documentation on Channels, Buffers, and Paths."
        },
        {
          "title": "Java 8 Streams API Specification & Pipelines",
          "url": "https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html",
          "source": "Oracle Corporation",
          "category": "Official Standard Spec",
          "description": "Comprehensive specification of functional stream operations, spliterators, and parallel pipeline evaluation."
        }
      ],
      "keyTakeaways": [
        "Use unchecked exceptions for recoverable programming bugs and checked for external failures.",
        "Try-with-resources closes all AutoCloseable objects deterministically.",
        "Exception tables provide zero runtime cost when no exceptions are thrown.",
        "Java NIO.2 direct buffers leverage off-heap memory for zero-copy I/O."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_java3_1",
          "question": "What interface must an object implement to be utilized within a Try-with-Resources statement?",
          "options": [
            "java.io.Serializable",
            "java.lang.AutoCloseable",
            "java.lang.Runnable",
            "java.util.Iterator"
          ],
          "correctIndex": 1,
          "explanation": "Try-with-resources requires the object to implement AutoCloseable or Closeable."
        },
        {
          "id": "kc_java3_2",
          "question": "Why should you never store an `Optional` in a class field or pass it as a method parameter in enterprise Java?",
          "options": [
            "Optional is not serializable and creates unnecessary heap object wrapper allocations",
            "Optional triggers memory leaks in the young generation",
            "Optional causes deadlock when accessed by streams",
            "The compiler forbids Optional fields in Java 17"
          ],
          "correctIndex": 0,
          "explanation": "Optional was strictly designed as a method return type to clearly signify 'no result'. Using it as a field wastes heap memory (~16-24 bytes) and breaks Java serialization."
        }
      ],
      "interactiveSandboxCode": "try (var s = new java.util.Scanner(\"Hello Java NIO\")) {\n  System.out.println(s.nextLine());\n}\n"
    },
    {
      "id": "java_mod_4",
      "trackId": "java",
      "moduleIndex": 4,
      "title": "Multithreading, Concurrency & Modern Java Streams",
      "subtitle": "Java Memory Model (JMM), volatile, ReentrantLock, Virtual Threads, and Parallel Streams.",
      "estimatedTime": "55 mins",
      "icon": "java",
      "overview": "Concurrent programming in modern Java. Understand the Java Memory Model (JMM), the happens-before relationship, `volatile` memory fences, `synchronized` vs `ReentrantLock`, thread pool executor sizing, and Java 21 Virtual Threads (Project Loom).",
      "sections": [
        {
          "title": "1. The Java Memory Model (JMM) & volatile Semantics",
          "content": "Modern multi-core CPUs use L1/L2 caches, causing threads to read stale data from CPU registers. The JMM defines the `happens-before` relationship. Declaring a field `volatile` ensures:\n1. Visibility: Reads and writes bypass CPU caches and go directly to main memory.\n2. Reordering Prevention: Inserts memory fences preventing instructions from being reordered across the read/write.",
          "codeExample": "public class SharedFlag {\n    private volatile boolean running = true;\n    public void stop() { running = false; } // Visible to all threads immediately\n    public void run() { while (running) { /* CPU cache will not hide 'running' */ } }\n}"
        },
        {
          "title": "2. Synchronized vs ReentrantLock & Atomic Variables",
          "content": "• `synchronized`: Built-in JVM intrinsic lock with biased locking, lightweight locking (spin locks), and heavyweight OS mutex fallback.\n• `ReentrantLock`: Flexible lock offering fairness policies, timeouts (`tryLock`), and condition variables.\n• `AtomicInteger` / `AtomicReference`: Non-blocking lock-free counters utilizing CPU hardware CAS instructions.",
          "codeExample": "import java.util.concurrent.atomic.AtomicInteger;\nimport java.util.concurrent.locks.ReentrantLock;\n\nAtomicInteger counter = new AtomicInteger(0);\ncounter.incrementAndGet(); // Lock-free atomic increment via CPU CAS"
        },
        {
          "title": "3. ThreadPoolExecutor Sizing & ForkJoinPool",
          "content": "Never create raw threads (`new Thread()`) in production because OS thread stacks cost ~1MB each. Use `ThreadPoolExecutor`:\n• CPU-bound tasks: Pool size = `Runtime.getRuntime().availableProcessors()`\n• I/O-bound tasks: Pool size = `CPU_cores * (1 + Wait_Time / Compute_Time)`",
          "codeExample": "import java.util.concurrent.*;\nExecutorService pool = Executors.newFixedThreadPool(8);\npool.submit(() -> System.out.println(\"Executed in worker thread\"));\npool.shutdown();"
        },
        {
          "title": "4. Java 21 Project Loom: Virtual Threads",
          "content": "Java 21 introduced Virtual Threads (Project Loom). Unlike heavyweight OS platform threads, virtual threads are lightweight user-space threads managed directly by the JVM. Millions of virtual threads can run concurrently; when a virtual thread blocks on I/O, the JVM unmounts it from the carrier OS thread.",
          "codeExample": "// Spawns 10,000 lightweight virtual threads without exhausting OS memory\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    for (int i = 0; i < 10_000; i++) {\n        executor.submit(() -> {\n            Thread.sleep(100); // Does NOT block the OS thread!\n            return \"Done\";\n        });\n    }\n}"
        },
        {
          "title": "5. Java Parallel Streams & ForkJoinPool Pitfalls",
          "content": "Parallel streams (`list.parallelStream()`) execute tasks concurrently across the common `ForkJoinPool`. Avoid running blocking I/O calls inside parallel streams as they starve the shared JVM common pool.",
          "codeExample": "long sum = java.util.stream.LongStream.rangeClosed(1, 1_000_000)\n    .parallel().filter(x -> x % 2 == 0).sum();"
        }
      ],
      "codingExercise": {
        "taskTitle": "Filter & Sum with Streams API",
        "functionName": "filterAndSum",
        "prompt": "Write a Java program that reads space-separated integers from stdin, filters for positive even numbers, squares each, and prints their sum.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "1 2 3 4 5 6",
            "expectedOutput": "56",
            "isHidden": false
          },
          {
            "input": "1 3 5 7",
            "expectedOutput": "0",
            "isHidden": false
          },
          {
            "input": "2 4 6 8 10",
            "expectedOutput": "220",
            "isHidden": false
          },
          {
            "input": "10",
            "expectedOutput": "100",
            "isHidden": true
          },
          {
            "input": "0 1 2 3",
            "expectedOutput": "4",
            "isHidden": true
          },
          {
            "input": "2 2 2 2",
            "expectedOutput": "16",
            "isHidden": true
          },
          {
            "input": "12 14 16",
            "expectedOutput": "596",
            "isHidden": true
          },
          {
            "input": "1 2 3",
            "expectedOutput": "4",
            "isHidden": true
          },
          {
            "input": "4 5 6 7 8",
            "expectedOutput": "116",
            "isHidden": true
          },
          {
            "input": "20 25 30",
            "expectedOutput": "1300",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Modern Java Streams API & Functional Pipeline",
        "inputFormat": "Space-separated integers from stdin.",
        "outputFormat": "Sum of squares of all even positive integers.",
        "constraints": [
          "Use Java Streams API (filter, map, sum)."
        ],
        "examples": [
          {
            "input": "1 2 3 4 5 6",
            "output": "56",
            "explanation": "Evens: 2, 4, 6. Squares: 4 + 16 + 36 = 56."
          }
        ],
        "hints": [
          "Convert tokens to `IntStream` or `Stream<Integer>`.",
          "Apply `.filter(n -> n > 0 && n % 2 == 0).map(n -> n * n).sum()`."
        ],
        "title": "Filter & Sum with Streams API",
        "objective": "Use Java Streams API to filter positive numbers, map them to squares, and compute the total sum.",
        "conceptualExplanation": [
          "Step 1: Read integer array from stdin using `Scanner` or `BufferedReader`.",
          "Step 2: Convert to `IntStream` or `List<Integer>.stream()`.",
          "Step 3: Apply `.filter(x -> x > 0)` to retain positive integers.",
          "Step 4: Apply `.map(x -> x * x)` to square each number.",
          "Step 5: Call `.sum()` and print the final integer sum."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "java4_q1",
            "question": "What does the `volatile` keyword guarantee in Java multi-threaded programming?",
            "options": [
              "Mutual exclusion / atomic operations",
              "Visibility of writes across threads by reading directly from main memory",
              "Prevents class unloading",
              "Synchronizes method calls"
            ],
            "correctIndex": 1,
            "explanation": "volatile ensures changes written by one thread are immediately visible to all other threads."
          },
          {
            "id": "java4_q2",
            "question": "What is the difference between intermediate and terminal operations in the Java Streams API?",
            "options": [
              "Intermediate operations execute immediately; terminal operations are lazy",
              "Intermediate operations return a new Stream and are lazily evaluated; terminal operations trigger pipeline execution and produce a non-stream result",
              "Intermediate operations mutate input",
              "There is no difference"
            ],
            "correctIndex": 1,
            "explanation": "Streams are lazy: intermediate operations accumulate transformations until a terminal operation is called."
          },
          {
            "id": "java4_q3",
            "question": "Which interface from `java.util.concurrent` represents a thread pool that manages task queues and thread lifecycles?",
            "options": [
              "ThreadManager",
              "ExecutorService",
              "TaskDispatcher",
              "ThreadFactory"
            ],
            "correctIndex": 1,
            "explanation": "ExecutorService manages a pool of worker threads, accepting Runnable and Callable tasks."
          },
          {
            "id": "java4_q4",
            "question": "What is the difference between `Runnable` and `Callable`?",
            "options": [
              "Runnable can throw checked exceptions and return values; Callable cannot",
              "Callable's `call()` method can return a result and throw checked exceptions; Runnable's `run()` returns void and cannot throw checked exceptions",
              "They are identical",
              "Runnable is newer"
            ],
            "correctIndex": 1,
            "explanation": "Callable<V> returns V and throws Exception; Runnable returns void."
          },
          {
            "id": "java4_q5",
            "question": "What does `CompletableFuture.supplyAsync()` do?",
            "options": [
              "Runs a task synchronously",
              "Asynchronously executes a supplier function on the common ForkJoinPool and returns a CompletableFuture",
              "Blocks until complete",
              "Cancels pending tasks"
            ],
            "correctIndex": 1,
            "explanation": "supplyAsync() runs a supplier asynchronously on a thread pool."
          },
          {
            "id": "java4_q6",
            "question": "What is a deadlock in concurrency?",
            "options": [
              "A thread running out of CPU",
              "A condition where two or more threads are blocked forever, each waiting for a lock held by the other",
              "A thread terminating abruptly",
              "A memory leak"
            ],
            "correctIndex": 1,
            "explanation": "Deadlock occurs when circular lock dependencies prevent involved threads from making progress."
          },
          {
            "id": "java4_q7",
            "question": "Which class provides lock-free, atomic operations on integers using hardware CAS (Compare-And-Swap)?",
            "options": [
              "VolatileInteger",
              "AtomicInteger",
              "SyncInt",
              "LockedNumber"
            ],
            "correctIndex": 1,
            "explanation": "AtomicInteger in java.util.concurrent.atomic provides lock-free atomic updates."
          },
          {
            "id": "java4_q8",
            "question": "What does `Stream.parallel()` do?",
            "options": [
              "Executes each element in a separate JVM",
              "Splits the stream pipeline to execute concurrently across multiple threads via ForkJoinPool.commonPool()",
              "Sorts elements",
              "Caches stream elements"
            ],
            "correctIndex": 1,
            "explanation": "parallel() converts a sequential stream into a parallel stream leveraging multi-core processors."
          },
          {
            "id": "java4_q9",
            "question": "What is the result of invoking `start()` vs `run()` on a Java `Thread` object?",
            "options": [
              "`start()` spawns a new OS thread and invokes `run()` on it; calling `run()` directly simply executes it synchronously on the current thread",
              "They are identical",
              "`run()` spawns a thread; `start()` pauses it",
              "`run()` is deprecated"
            ],
            "correctIndex": 0,
            "explanation": "start() initializes the native thread; calling run() directly executes synchronously on the caller's thread."
          },
          {
            "id": "java4_q10",
            "question": "Which functional interface in `java.util.function` takes one argument and returns a boolean?",
            "options": [
              "Consumer<T>",
              "Supplier<T>",
              "Predicate<T>",
              "Function<T, R>"
            ],
            "correctIndex": 2,
            "explanation": "Predicate<T> defines `boolean test(T t)`."
          }
        ]
      },
      "references": [
        {
          "title": "JSR 133: Java Memory Model and Thread Specification",
          "url": "https://jcp.org/en/jsr/detail?id=133",
          "source": "JCP",
          "category": "Official Standard Spec",
          "description": "The formal specification of the Java Memory Model and happens-before guarantees."
        },
        {
          "title": "JEP 444: Virtual Threads (Java SE 21)",
          "url": "https://openjdk.org/jeps/444",
          "source": "OpenJDK",
          "category": "Official Standard Spec",
          "description": "Specification for lightweight virtual threads in Java 21."
        },
        {
          "title": "JEP 444: Virtual Threads (JDK 21 Standard)",
          "url": "https://openjdk.org/jeps/444",
          "source": "OpenJDK / Oracle",
          "category": "Official JDK Specification",
          "description": "Normative specification introducing lightweight virtual threads to high-throughput Java enterprise services."
        }
      ],
      "keyTakeaways": [
        "`volatile` guarantees visibility and prevents instruction reordering.",
        "Atomic variables use CPU hardware CAS instructions for lock-free scaling.",
        "Virtual Threads (Java 21) allow millions of concurrent tasks with minimal memory.",
        "Never run blocking I/O inside the common ForkJoinPool."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_java4_1",
          "question": "What does the `volatile` keyword guarantee in Java?",
          "options": [
            "Atomic increment operations on variables",
            "Visibility across threads by bypassing CPU cache and preventing instruction reordering",
            "Automatic thread creation",
            "Encryption of data in memory"
          ],
          "correctIndex": 1,
          "explanation": "volatile ensures that any read reads the most recent write from main memory across all threads."
        },
        {
          "id": "kc_java4_2",
          "question": "What is the primary operational advantage of Virtual Threads (Project Loom) over traditional platform threads in Java 21?",
          "options": [
            "Virtual threads make CPU-bound matrix multiplication 100x faster",
            "Virtual threads are cheap user-mode threads managed by the JVM (~1KB RAM vs ~1MB OS stack), enabling millions of concurrent I/O operations without reactive complexity",
            "Virtual threads eliminate all try-catch blocks",
            "Virtual threads do not require garbage collection"
          ],
          "correctIndex": 1,
          "explanation": "Virtual threads decouple Java threads from OS kernel threads. When a virtual thread blocks on socket I/O, the JVM unmounts it from the carrier thread, allowing millions of concurrent tasks."
        }
      ],
      "interactiveSandboxCode": "java.util.concurrent.atomic.AtomicInteger ai = new java.util.concurrent.atomic.AtomicInteger(10);\nSystem.out.println(ai.addAndGet(5));\n"
    }
  ],
  "cpp": [
    {
      "id": "cpp_mod_0",
      "trackId": "cpp",
      "moduleIndex": 0,
      "title": "Modern C++ Systems",
      "subtitle": "Virtual Memory Models, Pointer Arithmetic, References, Cache Lines, and Undefined Behavior.",
      "estimatedTime": "50 mins",
      "icon": "cpp",
      "overview": "Low-level system architecture with Modern C++20. Master the process virtual memory layout (Stack, Heap, Data, BSS, Text), raw pointer mechanics, pointer arithmetic, lvalue vs rvalue references, cache line alignment (`alignas`), false sharing, and Undefined Behavior (UB) prevention.",
      "sections": [
        {
          "title": "1. Process Virtual Memory Architecture",
          "content": "A C++ process operates within a virtual address space managed by the OS kernel and MMU:\n• Stack: Fast LIFO contiguous memory allocated by moving the stack pointer register (`RSP`). Holds local variables and return addresses.\n• Heap: Dynamic memory allocated via `malloc`/`new`, managed by runtime heap allocators (glibc ptmalloc, jemalloc).\n• Data & BSS: Global and static variables (initialized vs uninitialized).\n• Text: Read-only machine bytecode.",
          "codeExample": "#include <iostream>\nint global_data = 100;\nint main() {\n    int stack_var = 42;\n    int* heap_var = new int(99);\n    std::cout << \"Stack: \" << &stack_var << \" | Heap: \" << heap_var << std::endl;\n    delete heap_var;\n}"
        },
        {
          "title": "2. Pointer Arithmetic & Memory Alignment",
          "content": "Pointers store virtual memory addresses. Pointer arithmetic advances by multiples of `sizeof(*ptr)`. CPU architectures require data to be aligned to natural boundaries (e.g. 64-bit doubles aligned to 8-byte addresses) to avoid unaligned access penalties.",
          "codeExample": "#include <iostream>\nint arr[4] = {10, 20, 30, 40};\nint* ptr = arr;\nstd::cout << *(ptr + 2); // 30 (advances 2 * sizeof(int) = 8 bytes)"
        },
        {
          "title": "3. Cache Lines & False Sharing Prevention",
          "content": "CPUs load memory into cache hierarchies in 64-byte chunks called Cache Lines. When two threads on separate cores modify independent variables located on the exact same 64-byte cache line, CPU cache coherency protocols (MESI) invalidate caches repeatedly, causing False Sharing.\n\nUse `alignas(std::hardware_destructive_interference_size)` to align thread-local state onto distinct cache lines.",
          "codeExample": "#include <new>\nstruct alignas(64) ThreadCounter {\n    uint64_t count{0}; // Isolated onto its own 64-byte cache line\n};"
        },
        {
          "title": "4. Undefined Behavior (UB) & Sanitizers",
          "content": "Undefined Behavior allows the compiler optimizer to assume conditions can never occur, leading to deleted security checks or phantom branches. Common UB triggers:\n• Dereferencing null or dangling pointers\n• Array out-of-bounds indexing\n• Signed integer overflow\nAlways compile with AddressSanitizer (`-fsanitize=address,undefined`) in CI/CD pipelines.",
          "codeExample": "// NEVER invoke Undefined Behavior:\n// int* p = nullptr; *p = 10; // Crash or corrupted optimization"
        },
        {
          "title": "5. References vs Pointers",
          "content": "References are syntactically non-null aliases that cannot be reseated. Pointers can be null, reseated, and manipulated with pointer arithmetic. Favor references for parameter passing.",
          "codeExample": "void increment(int& val) { val++; }\nint x = 5; increment(x); // x is now 6"
        }
      ],
      "codingExercise": {
        "taskTitle": "Array Inversion with Two Pointers",
        "functionName": "reverseArray",
        "prompt": "Write a C++ program that reads space-separated integers from stdin, reverses them in-place using two pointer swaps, and prints the result space-separated.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "1 2 3 4 5",
            "expectedOutput": "5 4 3 2 1",
            "isHidden": false
          },
          {
            "input": "42",
            "expectedOutput": "42",
            "isHidden": false
          },
          {
            "input": "10 20 30 40",
            "expectedOutput": "40 30 20 10",
            "isHidden": false
          },
          {
            "input": "1 1 1 1",
            "expectedOutput": "1 1 1 1",
            "isHidden": true
          },
          {
            "input": "5 4 3 2 1",
            "expectedOutput": "1 2 3 4 5",
            "isHidden": true
          },
          {
            "input": "100 200",
            "expectedOutput": "200 100",
            "isHidden": true
          },
          {
            "input": "-5 -4 -3 -2 -1",
            "expectedOutput": "-1 -2 -3 -4 -5",
            "isHidden": true
          },
          {
            "input": "0 0 0 0",
            "expectedOutput": "0 0 0 0",
            "isHidden": true
          },
          {
            "input": "7 14 21 28 35",
            "expectedOutput": "35 28 21 14 7",
            "isHidden": true
          },
          {
            "input": "9 8 7 6 5 4 3 2 1 0",
            "expectedOutput": "0 1 2 3 4 5 6 7 8 9",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "Pointers & In-Place Array Reversal",
        "inputFormat": "Space-separated integers from stdin.",
        "outputFormat": "Space-separated reversed integers.",
        "constraints": [
          "Must reverse in-place using two pointers.",
          "Time: O(N), Space: O(1)."
        ],
        "examples": [
          {
            "input": "1 2 3 4 5",
            "output": "5 4 3 2 1",
            "explanation": "In-place reversed sequence."
          }
        ],
        "hints": [
          "Initialize `int left = 0, right = n - 1`.",
          "Swap elements while `left < right`."
        ],
        "title": "Array Inversion with Two Pointers",
        "objective": "Reverse an array in-place using two pointers with O(1) auxiliary space.",
        "conceptualExplanation": [
          "Step 1: Read the size n and array elements from stdin into a `std::vector<int>`.",
          "Step 2: Initialize two pointer indices: `left = 0` and `right = n - 1`.",
          "Step 3: While `left < right`, swap `arr[left]` and `arr[right]` using `std::swap()`, then increment `left` and decrement `right`.",
          "Step 4: Print the reversed elements separated by single spaces."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "cpp0_q1",
            "question": "What does the dereference operator `*ptr` do when applied to a pointer variable?",
            "options": [
              "Returns the memory address of ptr",
              "Accesses the value stored at the memory address pointed to by ptr",
              "Multiplies ptr by 2",
              "Frees the memory"
            ],
            "correctIndex": 1,
            "explanation": "Dereferencing `*ptr` accesses the underlying value stored at that address."
          },
          {
            "id": "cpp0_q2",
            "question": "If `int* p = (int*)0x1000;` on a system where `sizeof(int) == 4`, what address is `p + 1`?",
            "options": [
              "0x1001",
              "0x1004",
              "0x1008",
              "0x1000"
            ],
            "correctIndex": 1,
            "explanation": "Pointer arithmetic scales offsets by `sizeof(T)`. Adding 1 to an `int*` increments the address by 4 bytes."
          },
          {
            "id": "cpp0_q3",
            "question": "What is the primary difference between a C++ reference (`int&`) and a pointer (`int*`)?",
            "options": [
              "Pointers cannot be null",
              "References cannot be null (in valid code) and cannot be rebound to another variable after initialization",
              "References require explicit dereferencing with *",
              "There is no difference"
            ],
            "correctIndex": 1,
            "explanation": "References act as permanent, non-null aliases to existing objects without pointer syntax."
          },
          {
            "id": "cpp0_q4",
            "question": "What occurs if dynamically allocated memory via `new` is never deleted before the program exits?",
            "options": [
              "The operating system crashes",
              "A memory leak occurs, retaining the heap memory until the OS reclaims the process address space",
              "A compile-time error",
              "The memory is converted to stack space"
            ],
            "correctIndex": 1,
            "explanation": "Failing to delete dynamic heap allocations causes memory leaks during program execution."
          },
          {
            "id": "cpp0_q5",
            "question": "What is undefined behavior (UB) in C++?",
            "options": [
              "A syntax error caught by the compiler",
              "Code execution for which the C++ language standard imposes no requirements; anything can happen (crashes, silent corruption)",
              "A standard exception",
              "A linker error"
            ],
            "correctIndex": 1,
            "explanation": "UB means the standard specifies no behavior, meaning the program may crash or exhibit erratic bugs."
          },
          {
            "id": "cpp0_q6",
            "question": "Which segment of process memory typically grows downward towards the heap?",
            "options": [
              "Data Segment",
              "Call Stack",
              "Text Segment",
              "BSS Segment"
            ],
            "correctIndex": 1,
            "explanation": "On most architectures, the Call Stack grows downward toward lower memory addresses, while the heap grows upward."
          },
          {
            "id": "cpp0_q7",
            "question": "What is the difference between `const int* p` and `int* const p`?",
            "options": [
              "`const int* p` is a pointer to constant data; `int* const p` is a constant pointer to mutable data",
              "They are identical",
              "`const int* p` is on the heap",
              "`int* const p` is a reference"
            ],
            "correctIndex": 0,
            "explanation": "Read from right to left: `const int*` = pointer to const int; `int* const` = const pointer to int."
          },
          {
            "id": "cpp0_q8",
            "question": "What does `sizeof(char)` evaluate to in C++ by standard definition?",
            "options": [
              "1 byte always",
              "4 bytes",
              "Platform dependent",
              "2 bytes"
            ],
            "correctIndex": 0,
            "explanation": "By C++ standard definition, `sizeof(char)` is always exactly 1."
          },
          {
            "id": "cpp0_q9",
            "question": "What is a dangling pointer?",
            "options": [
              "A pointer set to nullptr",
              "A pointer that continues to point to a memory location that has already been deallocated",
              "A pointer to an array",
              "A circular reference"
            ],
            "correctIndex": 1,
            "explanation": "A dangling pointer references deallocated memory, leading to undefined behavior if dereferenced."
          },
          {
            "id": "cpp0_q10",
            "question": "What operator is used in modern C++ to safely represent a null pointer constant?",
            "options": [
              "NULL",
              "0",
              "nullptr",
              "nil"
            ],
            "correctIndex": 2,
            "explanation": "nullptr is strongly typed as `std::nullptr_t`, eliminating integer overload ambiguities caused by NULL (0)."
          }
        ]
      },
      "references": [
        {
          "title": "cppreference.com — C++ Memory Model",
          "url": "https://en.cppreference.com/w/cpp/language/memory_model",
          "source": "cppreference",
          "category": "Authoritative Reference",
          "description": "Detailed technical specification of C++ memory locations and threads."
        },
        {
          "title": "ISO/IEC 14882:2020 — Programming Language C++",
          "url": "https://isocpp.org/std/the-standard",
          "source": "ISO Standard",
          "category": "Official Standard Spec",
          "description": "The official ISO standard specification for C++20."
        },
        {
          "title": "Effective Modern C++: 42 Specific Ways to Improve Your Use of C++11 and C++14",
          "url": "https://www.oreilly.com/library/view/effective-modern-c/9781491908419/",
          "source": "Scott Meyers / O'Reilly",
          "category": "Recommended Engineering Literature",
          "description": "Essential guidance on move semantics, smart pointers, lambda captures, and modern C++ idiomatic design."
        }
      ],
      "keyTakeaways": [
        "Process memory is partitioned into Stack, Heap, Data, BSS, and Text segments.",
        "False sharing occurs when independent variables share a 64-byte cache line.",
        "Undefined Behavior permits aggressive compiler optimizations that break unverified code.",
        "Prefer non-null references over raw pointers for function arguments."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_cpp0_1",
          "question": "What is the typical size of a CPU cache line on modern x86-64 architectures?",
          "options": [
            "8 bytes",
            "64 bytes",
            "512 bytes",
            "4096 bytes"
          ],
          "correctIndex": 1,
          "explanation": "Modern x86-64 CPUs load memory in 64-byte aligned chunks called cache lines."
        },
        {
          "id": "kc_cpp0_2",
          "question": "Why must every base class intended for polymorphic deletion have a `virtual` destructor?",
          "options": [
            "To ensure the compiler allocates memory in the BSS segment",
            "Deleting a derived class object through a pointer to base without a virtual destructor triggers undefined behavior and resource leaks",
            "To prevent static variables from being modified",
            "To enable C++20 module compilation"
          ],
          "correctIndex": 1,
          "explanation": "Without a virtual destructor, delete basePtr invokes only the Base destructor, skipping the Derived destructor and leaking any resources held by the derived class."
        }
      ],
      "interactiveSandboxCode": "#include <iostream>\nint main() {\n  std::cout << \"C++ Systems Model Verified\" << std::endl;\n  return 0;\n}\n"
    },
    {
      "id": "cpp_mod_1",
      "trackId": "cpp",
      "moduleIndex": 1,
      "title": "RAII, Object Lifecycle & Resource Management",
      "subtitle": "Resource Acquisition Is Initialization, Stack Unwinding, Rule of 3/5/0, and Mutex Guards.",
      "estimatedTime": "55 mins",
      "icon": "cpp",
      "overview": "The foundational idiom of C++: Resource Acquisition Is Initialization (RAII). Master deterministic stack-based resource lifetime management, exception safety guarantees, stack unwinding, the Rule of Three, Five, and Zero, and scoped locking guards (`std::lock_guard`, `std::unique_lock`).",
      "sections": [
        {
          "title": "1. The RAII Idiom: Deterministic Lifetime Management",
          "content": "RAII binds the lifecycle of a resource (heap memory, file descriptors, network sockets, mutex locks) to the lifetime of a stack-allocated object. When the object leaves its lexical scope, its destructor is guaranteed to execute, releasing the resource deterministically even in the presence of exceptions.",
          "codeExample": "#include <fstream>\n#include <string>\nvoid writeReport(const std::string& path, const std::string& data) {\n    std::ofstream file(path); // Resource acquired in constructor\n    file << data;\n} // file closed automatically in destructor upon scope exit"
        },
        {
          "title": "2. Stack Unwinding & Exception Safety Guarantees",
          "content": "When an exception is thrown, the C++ runtime walks down the Call Stack in reverse order, executing destructors for all fully constructed local objects (Stack Unwinding).\n• Basic Guarantee: Invariants preserved, no resource leaks.\n• Strong Guarantee: Commit-or-rollback semantics (operation succeeds or state unchanged).\n• Nothrow Guarantee (`noexcept`): Operation is guaranteed never to throw.",
          "codeExample": "#include <mutex>\nstd::mutex mtx;\nvoid threadSafeOperation() {\n    std::lock_guard<std::mutex> lock(mtx); // Exception-safe RAII mutex lock\n    // If any exception throws here, 'lock' destructor releases 'mtx'!\n}"
        },
        {
          "title": "3. The Rule of Five & Rule of Zero",
          "content": "If a class directly manages a raw resource, you must explicitly implement or delete the Rule of Five:\n1. Destructor\n2. Copy Constructor\n3. Copy Assignment Operator\n4. Move Constructor\n5. Move Assignment Operator\n\nRule of Zero: Design classes that use standard RAII types (`std::vector`, `std::string`, `std::unique_ptr`) so you don't need to define any custom destructors or copy/move operations.",
          "codeExample": "class RawBuffer {\n    int* data;\n    size_t size;\npublic:\n    RawBuffer(size_t sz) : data(new int[sz]), size(sz) {}\n    ~RawBuffer() { delete[] data; }\n    RawBuffer(const RawBuffer& other) : data(new int[other.size]), size(other.size) {\n        std::copy(other.data, other.data + size, data);\n    }\n    RawBuffer(RawBuffer&& other) noexcept : data(other.data), size(other.size) {\n        other.data = nullptr; other.size = 0;\n    }\n};"
        },
        {
          "title": "4. Scoped Locking with std::scoped_lock (Deadlock Prevention)",
          "content": "Acquiring multiple mutexes across threads can cause circular deadlocks. C++17 `std::scoped_lock` uses a deadlock-avoidance algorithm (equivalent to Peterson's or Chandy-Misra) to acquire multiple locks simultaneously.",
          "codeExample": "#include <mutex>\nstd::mutex m1, m2;\nvoid transfer(int from, int to) {\n    std::scoped_lock lock(m1, m2); // Deadlock-free multi-lock acquisition\n}"
        },
        {
          "title": "5. Production Anti-Pattern: Throwing from Destructors",
          "content": "Never throw an exception from a destructor. If a destructor throws during stack unwinding while another exception is active, `std::terminate` is immediately called, aborting the process.",
          "codeExample": "// Destructors are implicitly noexcept in modern C++!\n// ~MyClass() noexcept { /* Never throw here! */ }"
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement Scoped Timer RAII Logger",
        "functionName": "intBufferSum",
        "prompt": "Write a C++ class `IntBuffer` that allocates dynamic memory for N integers in its constructor and deletes it in its destructor. Read integers from stdin, store in IntBuffer, and print the sum.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "10 20 30",
            "expectedOutput": "60",
            "isHidden": false
          },
          {
            "input": "5 5 5 5",
            "expectedOutput": "20",
            "isHidden": false
          },
          {
            "input": "-10 10 100",
            "expectedOutput": "100",
            "isHidden": false
          },
          {
            "input": "42",
            "expectedOutput": "42",
            "isHidden": true
          },
          {
            "input": "0 0 0",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "1 2 3 4 5 6 7 8 9 10",
            "expectedOutput": "55",
            "isHidden": true
          },
          {
            "input": "-5 -15 -20",
            "expectedOutput": "-40",
            "isHidden": true
          },
          {
            "input": "100 200 500",
            "expectedOutput": "800",
            "isHidden": true
          },
          {
            "input": "7 3 2",
            "expectedOutput": "12",
            "isHidden": true
          },
          {
            "input": "50 50",
            "expectedOutput": "100",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "RAII Pattern & Dynamic Memory Management",
        "inputFormat": "Space-separated integers from stdin.",
        "outputFormat": "Sum of the integers computed via RAII managed buffer.",
        "constraints": [
          "Memory must be dynamically allocated with new[] and freed with delete[] in destructor."
        ],
        "examples": [
          {
            "input": "10 20 30",
            "output": "60",
            "explanation": "10 + 20 + 30 = 60."
          }
        ],
        "hints": [
          "In constructor: `data = new int[sz];`.",
          "In destructor: `delete[] data;`."
        ],
        "title": "Implement Scoped Timer RAII Logger",
        "objective": "Implement an RAII-compliant ScopedTimer class that records elapsed execution time in microseconds upon scope destruction.",
        "conceptualExplanation": [
          "Step 1: Design `class ScopedTimer` whose constructor records `start = std::chrono::high_resolution_clock::now()`.",
          "Step 2: In the destructor `~ScopedTimer()`, record `end = std::chrono::high_resolution_clock::now()`.",
          "Step 3: Compute duration using `std::chrono::duration_cast<std::chrono::microseconds>(end - start).count()`.",
          "Step 4: Print elapsed duration automatically upon leaving lexical scope."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "cpp1_q1",
            "question": "What does RAII stand for in C++ programming?",
            "options": [
              "Rapid Allocation In Initialization",
              "Resource Acquisition Is Initialization",
              "Recursive Algorithm In Iteration",
              "Runtime Application Interface Initialization"
            ],
            "correctIndex": 1,
            "explanation": "RAII binds the lifecycle of resources to the lifetime of stack objects."
          },
          {
            "id": "cpp1_q2",
            "question": "When is an automatic (stack) object's destructor executed?",
            "options": [
              "Only when delete is called",
              "Automatically when execution leaves the enclosing scope, even during exception unwinding",
              "During program termination only",
              "When the garbage collector runs"
            ],
            "correctIndex": 1,
            "explanation": "Destructors execute deterministically whenever an object goes out of scope."
          },
          {
            "id": "cpp1_q3",
            "question": "What member functions constitute the 'Rule of Three' in C++98?",
            "options": [
              "Constructor, Copy Constructor, Destructor",
              "Destructor, Copy Constructor, Copy Assignment Operator",
              "Constructor, Destructor, Print",
              "New, Delete, Free"
            ],
            "correctIndex": 1,
            "explanation": "Rule of 3: If you need a destructor, you almost certainly need a copy constructor and copy assignment operator."
          },
          {
            "id": "cpp1_q4",
            "question": "What two member functions were added in C++11 to create the 'Rule of Five'?",
            "options": [
              "Move Constructor and Move Assignment Operator",
              "Default Constructor and Virtual Destructor",
              "Print and Clone",
              "Serialize and Deserialize"
            ],
            "correctIndex": 0,
            "explanation": "C++11 move semantics added the Move Constructor and Move Assignment Operator."
          },
          {
            "id": "cpp1_q5",
            "question": "What is the 'Rule of Zero'?",
            "options": [
              "Write zero classes",
              "Design classes so they rely on existing RAII types (like std::string or std::vector), requiring zero custom special member functions",
              "Have zero bugs",
              "Do not use pointers"
            ],
            "correctIndex": 1,
            "explanation": "Rule of Zero advises delegating resource management to standard library types."
          },
          {
            "id": "cpp1_q6",
            "question": "What happens if a base class destructor is NOT declared `virtual` when deleting through a base pointer?",
            "options": [
              "Compile error",
              "Undefined behavior: derived class destructors will not execute, leaking resources",
              "It works normally",
              "The JVM handles it"
            ],
            "correctIndex": 1,
            "explanation": "Base classes intended for polymorphic deletion must have virtual destructors to invoke derived cleanup."
          },
          {
            "id": "cpp1_q7",
            "question": "Can an exception thrown inside a destructor that is already unwinding another exception crash the program?",
            "options": [
              "No, it is caught",
              "Yes, `std::terminate()` is called immediately if a destructor throws during stack unwinding",
              "It logs a warning",
              "The compiler fixes it"
            ],
            "correctIndex": 1,
            "explanation": "Destructors must be `noexcept` by default; throwing during active unwinding calls std::terminate()."
          },
          {
            "id": "cpp1_q8",
            "question": "What does `= default;` indicate on a special member function?",
            "options": [
              "It sets values to zero",
              "Directs the compiler to generate the standard default implementation",
              "Deletes the method",
              "Makes it private"
            ],
            "correctIndex": 1,
            "explanation": "`= default;` explicitly asks the compiler for its default implementation."
          },
          {
            "id": "cpp1_q9",
            "question": "What does `= delete;` indicate on a copy constructor?",
            "options": [
              "Deletes the object",
              "Disables copy construction at compile time, preventing object copying",
              "Frees heap memory",
              "Throws an exception at runtime"
            ],
            "correctIndex": 1,
            "explanation": "`= delete;` prevents copy operations at compile-time."
          },
          {
            "id": "cpp1_q10",
            "question": "Which standard library type provides an RAII wrapper around a mutex lock?",
            "options": [
              "std::thread",
              "std::lock_guard (or std::unique_lock)",
              "std::atomic",
              "std::shared_mutex"
            ],
            "correctIndex": 1,
            "explanation": "std::lock_guard acquires a mutex in its constructor and releases it deterministically in its destructor."
          }
        ]
      },
      "references": [
        {
          "title": "C++ Core Guidelines — Resource Management (R.1 - R.37)",
          "url": "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r-resource-management",
          "source": "Bjarne Stroustrup & Herb Sutter",
          "category": "Authoritative Engineering Guidelines",
          "description": "Official C++ Core Guidelines covering RAII, ownership, and smart pointers."
        },
        {
          "title": "Effective Modern C++ — Scott Meyers",
          "url": "https://www.oreilly.com/library/view/effective-modern-c/9781491903988/",
          "source": "O'Reilly",
          "category": "Authoritative Literature",
          "description": "Definitive guide on modern C++ idioms, move semantics, and smart pointer usage."
        },
        {
          "title": "C++ Core Guidelines — Resource Management Rules (R.1 - R.37)",
          "url": "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r-resource-management",
          "source": "Bjarne Stroustrup & Herb Sutter",
          "category": "Official Engineering Standard",
          "description": "Standard guidelines for lifetime management, smart pointers, RAII, and memory safety in production C++."
        }
      ],
      "keyTakeaways": [
        "RAII guarantees deterministic resource cleanup upon leaving scope.",
        "Stack unwinding invokes destructors automatically during exceptions.",
        "Follow the Rule of Five for raw resources, or Rule of Zero with standard RAII wrappers.",
        "Never throw exceptions from destructors."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_cpp1_1",
          "question": "What occurs if a destructor throws an exception while stack unwinding is already in progress?",
          "options": [
            "The second exception is queued",
            "std::terminate is immediately called, aborting the application",
            "The first exception is overwritten",
            "The program resumes"
          ],
          "correctIndex": 1,
          "explanation": "Throwing during active stack unwinding calls std::terminate to prevent unmanageable concurrent exceptions."
        },
        {
          "id": "kc_cpp1_2",
          "question": "What is the runtime overhead of a `std::unique_ptr` compared to a raw pointer?",
          "options": [
            "16 bytes per dereference",
            "Zero overhead — with the default deleter, it compiles to the exact same assembly instructions and machine size as a raw pointer",
            "It requires a mutex lock on every access",
            "It doubles memory usage due to virtual method tables"
          ],
          "correctIndex": 1,
          "explanation": "std::unique_ptr adheres to the C++ zero-overhead principle: you pay only for what you use. Its size is exactly 1 pointer (8 bytes on 64-bit systems)."
        }
      ],
      "interactiveSandboxCode": "#include <iostream>\nstruct Guard {\n  Guard() { std::cout << \"Acquired\\n\"; }\n  ~Guard() { std::cout << \"Released\\n\"; }\n};\nint main() { Guard g; return 0; }\n"
    },
    {
      "id": "cpp_mod_2",
      "trackId": "cpp",
      "moduleIndex": 2,
      "title": "Smart Pointers, Move Semantics & Memory Safety",
      "subtitle": "Lvalues vs Rvalues, Move Semantics, std::move, std::unique_ptr, and std::shared_ptr.",
      "estimatedTime": "55 mins",
      "icon": "cpp",
      "overview": "Modern memory safety in C++11/14/17/20. Master value categories (lvalue, prvalue, xvalue), rvalue references (`T&&`), zero-cost resource transfers with `std::move`, perfect forwarding with `std::forward`, and modern smart pointers (`std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`).",
      "sections": [
        {
          "title": "1. Value Categories & Rvalue References (T&&)",
          "content": "Every C++ expression has a type and a value category:\n• lvalue: An identity with a persistent memory location that can be placed on the left side of an assignment (`int x = 10;`).\n• rvalue: A temporary value without a persistent identity (`10`, `x + 5`, temporary function return).\nRvalue references (`T&&`) bind to temporary rvalues, allowing you to steal their internal resources rather than making deep copies.",
          "codeExample": "#include <string>\n#include <iostream>\nstd::string a = \"Large Payload\";\nstd::string b = std::move(a); // Steals pointer buffer! 'a' is now empty\nstd::cout << \"b: \" << b << \" | a empty? \" << a.empty() << std::endl;"
        },
        {
          "title": "2. std::unique_ptr: Zero-Overhead Exclusive Ownership",
          "content": "`std::unique_ptr<T>` maintains exclusive ownership of a heap resource. It has zero runtime memory or speed overhead compared to a raw pointer (`sizeof(unique_ptr) == sizeof(void*)`). It cannot be copied, only moved.",
          "codeExample": "#include <memory>\nstd::unique_ptr<int> p1 = std::make_unique<int>(42);\n// std::unique_ptr<int> p2 = p1; // Compile error! Cannot copy unique_ptr\nstd::unique_ptr<int> p2 = std::move(p1); // Transfers ownership; p1 is null"
        },
        {
          "title": "3. std::shared_ptr & Control Block Architecture",
          "content": "`std::shared_ptr<T>` enables shared ownership using atomic reference counting. It allocates a separate Control Block containing the strong reference count, weak reference count, and custom deleter. Always use `std::make_shared` to allocate the object and control block in a single contiguous memory chunk.",
          "codeExample": "#include <memory>\nauto s1 = std::make_shared<std::string>(\"Shared Resource\");\nauto s2 = s1; // Refcount incremented to 2 (thread-safe atomic)\nstd::cout << \"Use count: \" << s1.use_count() << std::endl; // 2"
        },
        {
          "title": "4. std::weak_ptr & Cyclic Dependency Leaks",
          "content": "Circular `std::shared_ptr` references (Node A -> Node B and Node B -> Node A) prevent reference counts from ever reaching 0, causing permanent memory leaks. `std::weak_ptr` observes a `shared_ptr` without incrementing its strong reference count.",
          "codeExample": "#include <memory>\nstruct Node {\n    std::weak_ptr<Node> next; // Breaks cyclical memory leak\n};"
        },
        {
          "title": "5. Perfect Forwarding with std::forward",
          "content": "Universal references (`T&&` in a template deduction context) combined with `std::forward<T>` forward arguments to another function preserving their exact value category (lvalue vs rvalue).",
          "codeExample": "template <typename T>\nvoid forwardPayload(T&& arg) {\n    process(std::forward<T>(arg)); // Forwards rvalue as rvalue, lvalue as lvalue\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Exclusive Ownership Transfer with unique_ptr",
        "functionName": "transferStrings",
        "prompt": "Write a C++ program using `std::unique_ptr` that reads strings from stdin, stores them in unique_ptrs in a vector, transfers them using `std::move`, and prints them concatenated with commas.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "Modern C++ Systems",
            "expectedOutput": "Modern,C++,Systems",
            "isHidden": false
          },
          {
            "input": "Code",
            "expectedOutput": "Code",
            "isHidden": false
          },
          {
            "input": "Smart Pointers Rule",
            "expectedOutput": "Smart,Pointers,Rule",
            "isHidden": false
          },
          {
            "input": "Antigravity Engine",
            "expectedOutput": "Antigravity,Engine",
            "isHidden": true
          },
          {
            "input": "High Performance Computing",
            "expectedOutput": "High,Performance,Computing",
            "isHidden": true
          },
          {
            "input": "Mastery Zone",
            "expectedOutput": "Mastery,Zone",
            "isHidden": true
          },
          {
            "input": "RAII Memory Safety",
            "expectedOutput": "RAII,Memory,Safety",
            "isHidden": true
          },
          {
            "input": "Clang LLVM Compiler",
            "expectedOutput": "Clang,LLVM,Compiler",
            "isHidden": true
          },
          {
            "input": "Clean Architecture",
            "expectedOutput": "Clean,Architecture",
            "isHidden": true
          },
          {
            "input": "Zero Overhead Abstractions",
            "expectedOutput": "Zero,Overhead,Abstractions",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Modern C++ Smart Pointers & Move Semantics",
        "inputFormat": "Space-separated string tokens from stdin.",
        "outputFormat": "Comma-separated strings from moved unique_ptr vector.",
        "constraints": [
          "Must use std::unique_ptr and std::move."
        ],
        "examples": [
          {
            "input": "Modern C++ Systems",
            "output": "Modern,C++,Systems",
            "explanation": "Tokens moved into unique ownership."
          }
        ],
        "hints": [
          "Use `std::make_unique<std::string>(token)`.",
          "Transfer with `std::move(ptr)`."
        ],
        "title": "Exclusive Ownership Transfer with unique_ptr",
        "objective": "Demonstrate move semantics and unique ownership transfer using std::unique_ptr and std::move.",
        "conceptualExplanation": [
          "Step 1: Allocate a resource using `std::make_unique<Resource>(args)`.",
          "Step 2: Demonstrate that copying `unique_ptr` fails compilation (deleted copy constructor).",
          "Step 3: Transfer ownership using `std::move(ptr1)` to `ptr2`, verifying that `ptr1` becomes `nullptr`.",
          "Step 4: Verify automatic deallocation when `ptr2` goes out of scope."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "cpp2_q1",
            "question": "What is the memory and runtime overhead of `std::unique_ptr` compared to a raw pointer?",
            "options": [
              "2x memory overhead",
              "Zero overhead: identical size and runtime performance to a raw pointer",
              "4x overhead due to GC",
              "O(log N) lookup overhead"
            ],
            "correctIndex": 1,
            "explanation": "std::unique_ptr has zero size and performance overhead relative to raw pointers."
          },
          {
            "id": "cpp2_q2",
            "question": "Can a `std::unique_ptr` be copied?",
            "options": [
              "Yes, using the copy constructor",
              "No, copy constructor and copy assignment are deleted; it can only be moved",
              "Only if the pointee is primitive",
              "Only with memcpy"
            ],
            "correctIndex": 1,
            "explanation": "std::unique_ptr enforces strict exclusive ownership; copying is explicitly deleted."
          },
          {
            "id": "cpp2_q3",
            "question": "What factory function should always be preferred over `new` when instantiating `std::unique_ptr` in C++14+?",
            "options": [
              "std::new_unique()",
              "std::make_unique()",
              "std::create_ptr()",
              "std::alloc_unique()"
            ],
            "correctIndex": 1,
            "explanation": "std::make_unique() is exception-safe and prevents accidental memory leaks."
          },
          {
            "id": "cpp2_q4",
            "question": "How does `std::shared_ptr` track ownership of the managed object?",
            "options": [
              "Using a global registry",
              "Using an atomic reference count stored in a dynamically allocated control block",
              "Via thread-local storage",
              "Using the OS kernel"
            ],
            "correctIndex": 1,
            "explanation": "std::shared_ptr increments and decrements a thread-safe atomic reference count in its control block."
          },
          {
            "id": "cpp2_q5",
            "question": "What problem occurs when two `std::shared_ptr` objects hold references to each other?",
            "options": [
              "Segmentation fault",
              "Circular dependency prevents reference counts from reaching zero, causing a permanent memory leak",
              "Compile error",
              "Stack overflow"
            ],
            "correctIndex": 1,
            "explanation": "Cyclic references prevent reference counts from ever reaching 0; `std::weak_ptr` must be used to break cycles."
          },
          {
            "id": "cpp2_q6",
            "question": "What does `std::move` actually do under the hood?",
            "options": [
              "Copies memory to another thread",
              "Performs an unconditional static_cast of an expression to an rvalue reference type",
              "Frees memory",
              "Runs asynchronously"
            ],
            "correctIndex": 1,
            "explanation": "std::move does not move anything at runtime; it merely casts an lvalue to an rvalue reference."
          },
          {
            "id": "cpp2_q7",
            "question": "What state is an object left in after being moved from by a valid move constructor?",
            "options": [
              "Null pointer",
              "A valid but unspecified state, safe to be destructed or reassigned",
              "Memory is corrupted",
              "Deleted"
            ],
            "correctIndex": 1,
            "explanation": "Moved-from objects must be left in a valid destructible state according to the standard."
          },
          {
            "id": "cpp2_q8",
            "question": "What does `std::weak_ptr::lock()` return?",
            "options": [
              "A raw pointer",
              "A `std::shared_ptr` that shares ownership if the object is still alive, or an empty shared_ptr if expired",
              "A boolean",
              "An exception"
            ],
            "correctIndex": 1,
            "explanation": "lock() safely attempts to promote the weak pointer to a shared_ptr."
          },
          {
            "id": "cpp2_q9",
            "question": "What is an rvalue in C++?",
            "options": [
              "A variable with a name that has an identifiable memory address",
              "A temporary value or expression that does not have an identifiable persistent memory address",
              "A register value",
              "A const reference"
            ],
            "correctIndex": 1,
            "explanation": "Rvalues are temporaries that can be safely moved from."
          },
          {
            "id": "cpp2_q10",
            "question": "Why should `std::make_shared` be preferred over `std::shared_ptr<T>(new T)`?",
            "options": [
              "It runs in a separate thread",
              "It performs a single memory allocation for both the object and the control block instead of two separate allocations",
              "It avoids multithreading",
              "It encrypts the pointer"
            ],
            "correctIndex": 1,
            "explanation": "make_shared performs a single combined allocation for object and control block, improving cache locality and performance."
          }
        ]
      },
      "references": [
        {
          "title": "Effective Modern C++ Items 18-22: Smart Pointers",
          "url": "https://www.oreilly.com/library/view/effective-modern-c/9781491903988/",
          "source": "Scott Meyers",
          "category": "Authoritative Literature",
          "description": "Definitive guide on unique_ptr, shared_ptr, and weak_ptr."
        },
        {
          "title": "cppreference.com — std::unique_ptr",
          "url": "https://en.cppreference.com/w/cpp/memory/unique_ptr",
          "source": "cppreference",
          "category": "Technical Reference",
          "description": "Complete API reference for std::unique_ptr."
        },
        {
          "title": "The C++ Programming Language (4th Edition)",
          "url": "https://www.stroustrup.com/4th.html",
          "source": "Bjarne Stroustrup / Addison-Wesley",
          "category": "Authoritative Reference",
          "description": "Comprehensive reference by the creator of C++ detailing STL algorithms, allocators, and container performance."
        }
      ],
      "keyTakeaways": [
        "Move semantics allow transferring heap pointers from temporaries without deep copies.",
        "`std::unique_ptr` has zero overhead and enforces exclusive ownership.",
        "Always use `std::make_shared` to allocate object and control block together.",
        "Use `std::weak_ptr` to break circular reference memory leaks."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_cpp2_1",
          "question": "What is the memory size overhead of a std::unique_ptr compared to a raw pointer?",
          "options": [
            "16 bytes for reference count",
            "Zero overhead (same size as raw pointer)",
            "64 bytes for control block",
            "Depends on OS thread count"
          ],
          "correctIndex": 1,
          "explanation": "std::unique_ptr with a default deleter has zero overhead and compiles into the exact same assembly as a raw pointer."
        },
        {
          "id": "kc_cpp2_2",
          "question": "Why should you prefer `std::vector::emplace_back` over `push_back` when inserting newly constructed objects?",
          "options": [
            "emplace_back automatically sorts the vector",
            "emplace_back forwards constructor arguments directly to construct the object in-place in vector memory, avoiding temporary copy/move operations",
            "emplace_back runs asynchronously on a worker thread",
            "emplace_back guarantees O(1) worst-case time without reallocation"
          ],
          "correctIndex": 1,
          "explanation": "emplace_back uses perfect forwarding (std::forward) to construct the instance directly within the contiguous buffer, eliminating redundant temporary allocations."
        }
      ],
      "interactiveSandboxCode": "#include <memory>\n#include <iostream>\nint main() {\n  auto p = std::make_unique<int>(100);\n  std::cout << *p << std::endl;\n  return 0;\n}\n"
    },
    {
      "id": "cpp_mod_3",
      "trackId": "cpp",
      "moduleIndex": 3,
      "title": "Standard Template Library (STL) Containers & Algorithms",
      "subtitle": "Vector Amortized Growth, Deque Buffers, Unordered Maps, and Custom Lambdas.",
      "estimatedTime": "50 mins",
      "icon": "cpp",
      "overview": "Master the Standard Template Library (STL). Understand vector contiguous memory allocation and geometric capacity growth (amortized O(1)), deque chunked buffers, associative containers (`std::map` Red-Black tree vs `std::unordered_map` hash table), algorithms, custom sort lambdas, and `std::span`.",
      "sections": [
        {
          "title": "1. std::vector: Contiguous Memory & Amortized O(1) Growth",
          "content": "`std::vector` stores elements in a contiguous heap array. When capacity is exceeded, it allocates a new array of 1.5x (MSVC) or 2.0x (GCC) capacity, copies/moves elements, and frees the old buffer. Use `vec.reserve(N)` upfront to eliminate reallocations.",
          "codeExample": "#include <vector>\nstd::vector<int> v;\nv.reserve(1000); // Pre-allocates memory for 1000 elements\nfor (int i = 0; i < 1000; i++) v.push_back(i); // 0 reallocations!"
        },
        {
          "title": "2. std::map (Red-Black Tree) vs std::unordered_map (Hash Table)",
          "content": "• `std::map`: Implemented as a self-balancing Red-Black Tree. Keys are strictly ordered; search/insert is guaranteed O(log N).\n• `std::unordered_map`: Implemented as a bucketed hash table. Average search/insert is O(1), but worst-case is O(N) during high hash collisions.",
          "codeExample": "#include <map>\n#include <unordered_map>\nstd::map<std::string, int> ordered; // Keys sorted alphabetically\nstd::unordered_map<std::string, int> hashed; // O(1) lookup"
        },
        {
          "title": "3. STL Algorithms & Custom Sort Lambdas",
          "content": "STL algorithms (`std::sort`, `std::find_if`, `std::transform`) operate on iterator ranges `[begin, end)`. Modern C++ lambdas can capture by value `[=]` or reference `[&]`.",
          "codeExample": "#include <algorithm>\n#include <vector>\nstruct Task { int priority; std::string name; };\nstd::vector<Task> tasks = {{2, \"B\"}, {1, \"A\"}, {3, \"C\"}};\nstd::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {\n    return a.priority < b.priority; // Ascending priority sort\n});"
        },
        {
          "title": "4. Zero-Copy Views with std::string_view & std::span (C++20)",
          "content": "`std::string_view` and `std::span` (C++20) provide non-owning pointer-and-length views over contiguous data, eliminating deep string and vector copies during function calls.",
          "codeExample": "#include <string_view>\nvoid printPrefix(std::string_view sv) {\n    // Bypasses std::string heap allocation entirely\n    std::cout << sv.substr(0, 4) << std::endl;\n}"
        },
        {
          "title": "5. Production Pitfall: Iterator Invalidation",
          "content": "Inserting into a vector can trigger memory reallocation, invalidating all existing pointers and iterators to its elements. Never dereference an iterator after pushing to a vector.",
          "codeExample": "// BAD: iter invalidated if push_back triggers reallocation\n// for (auto it = v.begin(); it != v.end(); ++it) { v.push_back(*it); }"
        }
      ],
      "codingExercise": {
        "taskTitle": "Filter & Sort with STL Algorithms",
        "functionName": "filterAndSort",
        "prompt": "Write a C++ program that reads integers from stdin, filters for positive numbers, sorts them in descending order using `std::sort` with a lambda comparator, and prints them space-separated.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "5 -2 10 0 3 -8",
            "expectedOutput": "10 5 3",
            "isHidden": false
          },
          {
            "input": "-1 -2 -3",
            "expectedOutput": "",
            "isHidden": false
          },
          {
            "input": "1 9 4 7",
            "expectedOutput": "9 7 4 1",
            "isHidden": false
          },
          {
            "input": "100 50 200 -50 0",
            "expectedOutput": "200 100 50",
            "isHidden": true
          },
          {
            "input": "42",
            "expectedOutput": "42",
            "isHidden": true
          },
          {
            "input": "-10 0 -20",
            "expectedOutput": "",
            "isHidden": true
          },
          {
            "input": "12 3 45 8 2",
            "expectedOutput": "45 12 8 3 2",
            "isHidden": true
          },
          {
            "input": "9 8 7 6",
            "expectedOutput": "9 8 7 6",
            "isHidden": true
          },
          {
            "input": "-5 15 -25 35",
            "expectedOutput": "35 15",
            "isHidden": true
          },
          {
            "input": "1 1 1 1",
            "expectedOutput": "1 1 1 1",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "STL Containers & Algorithms",
        "inputFormat": "Space-separated integers from stdin.",
        "outputFormat": "Positive numbers sorted descending, space-separated.",
        "constraints": [
          "Use std::sort and std::greater<int>()."
        ],
        "examples": [
          {
            "input": "5 -2 10 0 3 -8",
            "output": "10 5 3",
            "explanation": "Positives are 5, 10, 3. Descending order is 10 5 3."
          }
        ],
        "hints": [
          "Filter for numbers > 0.",
          "Sort with `std::sort(pos.begin(), pos.end(), std::greater<int>())`."
        ],
        "title": "Filter & Sort with STL Algorithms",
        "objective": "Use STL algorithms (std::copy_if, std::sort) to filter even integers and sort them in descending order.",
        "conceptualExplanation": [
          "Step 1: Read vector of integers from standard input.",
          "Step 2: Use `std::copy_if` with a lambda predicate `[](int x) { return x % 2 == 0; }` into a destination vector.",
          "Step 3: Sort the filtered vector using `std::sort(evens.begin(), evens.end(), std::greater<int>())` for descending order.",
          "Step 4: Print space-separated sorted numbers."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "cpp3_q1",
            "question": "What underlying data structure is used by `std::map` in modern C++ standard libraries?",
            "options": [
              "Hash table",
              "Self-balancing Red-Black Tree",
              "Dynamic array",
              "Doubly linked list"
            ],
            "correctIndex": 1,
            "explanation": "std::map is implemented as a self-balancing binary search tree (typically Red-Black Tree)."
          },
          {
            "id": "cpp3_q2",
            "question": "What is the average time complexity of finding a key in `std::unordered_map`?",
            "options": [
              "O(1)",
              "O(log N)",
              "O(N)",
              "O(N log N)"
            ],
            "correctIndex": 0,
            "explanation": "std::unordered_map uses a hash table, providing average O(1) constant-time lookup."
          },
          {
            "id": "cpp3_q3",
            "question": "Why is `std::vector` typically faster in practice than `std::list` even for middle insertions of small types?",
            "options": [
              "Because list is deprecated",
              "Because vector elements are contiguous in memory, providing superior CPU cache locality",
              "Vector uses hardware acceleration",
              "List has more virtual methods"
            ],
            "correctIndex": 1,
            "explanation": "Contiguous memory layout gives vector massive CPU cache hit advantages over node-based lists."
          },
          {
            "id": "cpp3_q4",
            "question": "What sorting algorithm is typically implemented by `std::sort`?",
            "options": [
              "Pure QuickSort",
              "IntroSort (hybrid of QuickSort, HeapSort, and InsertionSort)",
              "MergeSort only",
              "BubbleSort"
            ],
            "correctIndex": 1,
            "explanation": "std::sort uses Introsort, guaranteeing O(N log N) worst-case time complexity."
          },
          {
            "id": "cpp3_q5",
            "question": "What does the capture clause `[&]` mean in a C++ lambda expression?",
            "options": [
              "Capture all outer variables by value (copy)",
              "Capture all outer variables by reference",
              "Capture nothing",
              "Capture global variables only"
            ],
            "correctIndex": 1,
            "explanation": "[&] captures all referenced variables from the enclosing scope by reference."
          },
          {
            "id": "cpp3_q6",
            "question": "What is iterator invalidation?",
            "options": [
              "An iterator syntax error",
              "When modifying a container (e.g. reallocating a vector) causes existing iterators/pointers to refer to invalid memory",
              "A compiler optimization",
              "Dereferencing a null iterator"
            ],
            "correctIndex": 1,
            "explanation": "Reallocations or deletions invalidate existing iterators, causing undefined behavior if reused."
          },
          {
            "id": "cpp3_q7",
            "question": "Which STL algorithm computes the sum of elements in an iterator range?",
            "options": [
              "std::sum",
              "std::accumulate (in <numeric>)",
              "std::total",
              "std::aggregate"
            ],
            "correctIndex": 1,
            "explanation": "std::accumulate calculates sum or folds values across an iterator range."
          },
          {
            "id": "cpp3_q8",
            "question": "What does `vec.reserve(N)` do on a `std::vector`?",
            "options": [
              "Resizes the vector to N elements with default values",
              "Pre-allocates capacity for at least N elements without constructing objects, avoiding reallocations",
              "Clears the vector",
              "Sorts the vector"
            ],
            "correctIndex": 1,
            "explanation": "reserve() allocates capacity upfront, avoiding costly reallocations during push_back()."
          },
          {
            "id": "cpp3_q9",
            "question": "What is the return type of dereferencing a `std::map<K, V>::iterator`?",
            "options": [
              "std::pair<const K, V>&",
              "V&",
              "K&",
              "std::tuple<K, V>"
            ],
            "correctIndex": 0,
            "explanation": "Dereferencing map iterators yields `std::pair<const K, V>&`, where key is constant."
          },
          {
            "id": "cpp3_q10",
            "question": "What method should be used to construct an element directly in-place inside a container without extra copies?",
            "options": [
              "push_back()",
              "emplace_back()",
              "insert_new()",
              "append()"
            ],
            "correctIndex": 1,
            "explanation": "emplace_back() forwards constructor arguments to construct the object directly in container memory."
          }
        ]
      },
      "references": [
        {
          "title": "cppreference.com — std::vector",
          "url": "https://en.cppreference.com/w/cpp/container/vector",
          "source": "cppreference",
          "category": "Technical Reference",
          "description": "Comprehensive documentation on vector capacity and reallocation mechanics."
        },
        {
          "title": "The C++ Standard Library (2nd Edition) — Nicolai Josuttis",
          "url": "https://www.josuttis.com/libbook/",
          "source": "Addison-Wesley",
          "category": "Authoritative Literature",
          "description": "The definitive encyclopedia of the C++ Standard Template Library."
        },
        {
          "title": "ISO/IEC 14882:2020 — Programming Languages: C++20",
          "url": "https://www.iso.org/standard/79358.html",
          "source": "International Organization for Standardization",
          "category": "Official International Standard",
          "description": "The definitive international standard specification for C++20 language features, concepts, ranges, and coroutines."
        }
      ],
      "keyTakeaways": [
        "`std::vector` provides contiguous memory; call `reserve()` to prevent reallocations.",
        "`std::map` is ordered O(log N); `std::unordered_map` is hashed O(1).",
        "`std::span` and `std::string_view` provide zero-copy memory views.",
        "Modifying vectors can invalidate existing iterators."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_cpp3_1",
          "question": "Why should you call vector.reserve(N) before inserting N items?",
          "options": [
            "It locks the vector from modification",
            "It pre-allocates memory to eliminate repeated reallocations and buffer copying",
            "It sorts the vector automatically",
            "It enables multithreading"
          ],
          "correctIndex": 1,
          "explanation": "reserve pre-allocates heap capacity so push_back executes without triggering array reallocations."
        },
        {
          "id": "kc_cpp3_2",
          "question": "How do C++20 Concepts improve template metaprogramming compared to legacy SFINAE / `std::enable_if`?",
          "options": [
            "Concepts eliminate all template compilation entirely",
            "Concepts provide concise, readable compile-time constraints with precise compiler error messages and faster compile times",
            "Concepts allow templates to run on the GPU",
            "Concepts make all template arguments dynamically typed"
          ],
          "correctIndex": 1,
          "explanation": "Concepts replace cryptic compiler errors and template metaprogramming hacks with explicit constraint declarations validated directly by the compiler."
        }
      ],
      "interactiveSandboxCode": "#include <vector>\n#include <algorithm>\n#include <iostream>\nint main() {\n  std::vector<int> v = {3, 1, 4};\n  std::sort(v.begin(), v.end());\n  std::cout << v[0] << std::endl;\n  return 0;\n}\n"
    }
  ],
  "webdev": [
    {
      "id": "web_mod_0",
      "trackId": "webdev",
      "moduleIndex": 0,
      "title": "Full-Stack Web Development",
      "subtitle": "Client-Server Architecture, HTTP/2/3 Protocols, Semantic HTML5, and Core Web Vitals.",
      "estimatedTime": "50 mins",
      "icon": "webdev",
      "overview": "Full-stack web architecture foundations. Understand HTTP/1.1 vs HTTP/2 multiplexing vs HTTP/3 QUIC (UDP), DNS resolution, TLS 1.3 handshakes, semantic HTML5 for SEO and WCAG 2.1 accessibility, and Google Core Web Vitals (LCP, INP, CLS).",
      "sections": [
        {
          "title": "1. Full-Stack Web Architecture & Protocols (HTTP/1 vs HTTP/2 vs HTTP/3)",
          "content": "Web architecture relies on the client-server model over TCP/IP:\n• HTTP/1.1: Suffers from Head-of-Line (HoL) blocking; browsers limit connections to 6 per domain.\n• HTTP/2: Binary protocol supporting bidirectional multiplexing over a single TCP connection.\n• HTTP/3: Operates over QUIC (UDP) eliminating TCP packet-level HoL blocking and accelerating TLS 1.3 0-RTT handshakes.",
          "codeExample": "// HTTP/2 Multiplexing allows hundreds of assets to stream concurrently over 1 TCP socket"
        },
        {
          "title": "2. The DOM, Accessibility (WCAG 2.1) & Semantic HTML5",
          "content": "Semantic elements (`<main>`, `<article>`, `<nav>`, `<aside>`, `<header>`) provide meaningful accessibility trees for screen readers and SEO crawlers. Non-semantic `<div>` soup degrades accessibility and search rankings.",
          "codeExample": "<main role=\"main\">\n  <article aria-labelledby=\"post-title\">\n    <h1 id=\"post-title\">Production Web Architecture</h1>\n    <p>Semantic document layout ensures accessible navigation.</p>\n  </article>\n</main>"
        },
        {
          "title": "3. Google Core Web Vitals Optimization",
          "content": "Core Web Vitals quantify real-world user experience:\n1. Largest Contentful Paint (LCP): Measures load performance (target <= 2.5s).\n2. Interaction to Next Paint (INP): Measures responsiveness (target <= 200ms).\n3. Cumulative Layout Shift (CLS): Measures visual stability (target <= 0.1).",
          "codeExample": "<!-- Prevent Layout Shift (CLS) by specifying aspect-ratio or explicit dimensions -->\n<img src=\"hero.webp\" width=\"800\" height=\"450\" alt=\"Platform Dashboard\" style=\"aspect-ratio: 16/9;\">"
        },
        {
          "title": "4. Critical Rendering Path & Resource Hints",
          "content": "Accelerate page delivery using resource hints:\n• `dns-prefetch`: Resolves third-party DNS early.\n• `preconnect`: Performs DNS + TLS handshake in advance.\n• `preload`: Forces high-priority download of critical fonts and LCP images.",
          "codeExample": "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preload\" href=\"/fonts/inter.woff2\" as=\"font\" type=\"font/woff2\" crossorigin>"
        },
        {
          "title": "5. Production Best Practices",
          "content": "• Use modern image formats (`AVIF`, `WebP`) with responsive `srcset`.\n• Minify HTML/CSS/JS and serve with Gzip or Brotli compression."
        }
      ],
      "codingExercise": {
        "taskTitle": "Parse HTTP Request Header String",
        "functionName": "parseHeaders",
        "prompt": "Write a JavaScript function that parses a raw HTTP header text from stdin into a key-value JSON object with lowercase keys. Read stdin and output JSON.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "Content-Type: application/json\nAuthorization: Bearer token123\nHost: masteryzone.com",
            "expectedOutput": "{\"content-type\":\"application/json\",\"authorization\":\"Bearer token123\",\"host\":\"masteryzone.com\"}",
            "isHidden": false
          },
          {
            "input": "User-Agent: Mozilla/5.0",
            "expectedOutput": "{\"user-agent\":\"Mozilla/5.0\"}",
            "isHidden": false
          },
          {
            "input": "Accept: */*\nConnection: keep-alive",
            "expectedOutput": "{\"accept\":\"*/*\",\"connection\":\"keep-alive\"}",
            "isHidden": false
          },
          {
            "input": "Host: localhost:3000\nContent-Length: 42",
            "expectedOutput": "{\"host\":\"localhost:3000\",\"content-length\":\"42\"}",
            "isHidden": true
          },
          {
            "input": "X-Custom-Header: value123",
            "expectedOutput": "{\"x-custom-header\":\"value123\"}",
            "isHidden": true
          },
          {
            "input": "Cache-Control: no-cache\nPragma: no-cache",
            "expectedOutput": "{\"cache-control\":\"no-cache\",\"pragma\":\"no-cache\"}",
            "isHidden": true
          },
          {
            "input": "Origin: http://example.com\nReferer: http://example.com/page",
            "expectedOutput": "{\"origin\":\"http://example.com\",\"referer\":\"http://example.com/page\"}",
            "isHidden": true
          },
          {
            "input": "Content-Type: text/html",
            "expectedOutput": "{\"content-type\":\"text/html\"}",
            "isHidden": true
          },
          {
            "input": "Cookie: session_id=xyz\nAccept-Language: en-US",
            "expectedOutput": "{\"cookie\":\"session_id=xyz\",\"accept-language\":\"en-US\"}",
            "isHidden": true
          },
          {
            "input": "Server: nginx\nStrict-Transport-Security: max-age=31536000",
            "expectedOutput": "{\"server\":\"nginx\",\"strict-transport-security\":\"max-age=31536000\"}",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "HTTP Protocols & Header Parsing",
        "inputFormat": "Raw HTTP header string (multi-line) from stdin.",
        "outputFormat": "JSON object mapping lowercase header names to values.",
        "constraints": [
          "Headers separated by colon.",
          "Names lowercase and trimmed."
        ],
        "examples": [
          {
            "input": "Content-Type: application/json\nHost: masteryzone.com",
            "output": "{\"content-type\":\"application/json\",\"host\":\"masteryzone.com\"}",
            "explanation": "Parsed lines into normalized header dictionary."
          }
        ],
        "hints": [
          "Split input by newline.",
          "Split each line on first colon `: `."
        ],
        "title": "Parse HTTP Request Header String",
        "objective": "Parse a raw HTTP header text block into a case-insensitive key-value map.",
        "conceptualExplanation": [
          "Step 1: Split raw HTTP header text by newline characters `\\r?\\n` into header lines.",
          "Step 2: For each line, locate the first colon ':' separator index.",
          "Step 3: Trim and normalize header field name to lowercase (RFC 7230 case-insensitivity standard).",
          "Step 4: Trim leading and trailing whitespace from header field value.",
          "Step 5: Output the parsed header map serialized as JSON."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "web0_q1",
            "question": "What does `box-sizing: border-box;` do in CSS?",
            "options": [
              "Excludes padding and border from element width",
              "Includes padding and border within the element's specified width and height",
              "Centers the box on the screen",
              "Renders a shadow border"
            ],
            "correctIndex": 1,
            "explanation": "border-box ensures padding and borders do not increase declared box dimensions."
          },
          {
            "id": "web0_q2",
            "question": "Which HTTP status code indicates that a requested resource was created successfully?",
            "options": [
              "200 OK",
              "201 Created",
              "204 No Content",
              "301 Moved Permanently"
            ],
            "correctIndex": 1,
            "explanation": "HTTP 201 Created signals that a new resource was created as a result of the request."
          },
          {
            "id": "web0_q3",
            "question": "What is the primary difference between CSS Flexbox and CSS Grid?",
            "options": [
              "Flexbox is for 3D; Grid is for 2D",
              "Flexbox is designed for 1-dimensional layouts (row OR column); CSS Grid is designed for 2-dimensional layouts (rows AND columns simultaneously)",
              "Grid is deprecated",
              "Flexbox only works in Chrome"
            ],
            "correctIndex": 1,
            "explanation": "Flexbox operates in a single dimension; Grid handles simultaneous two-dimensional layouts."
          },
          {
            "id": "web0_q4",
            "question": "Which semantic HTML5 tag represents the dominant content area of the document body?",
            "options": [
              "<center>",
              "<main>",
              "<content>",
              "<master>"
            ],
            "correctIndex": 1,
            "explanation": "<main> represents the dominant, central content unique to the document."
          },
          {
            "id": "web0_q5",
            "question": "What is the idempotency property of HTTP methods?",
            "options": [
              "The request runs in parallel",
              "Making multiple identical requests produces the exact same server resource state as making a single request (e.g. GET, PUT, DELETE)",
              "The request is cached in the browser",
              "The request is encrypted"
            ],
            "correctIndex": 1,
            "explanation": "Idempotent methods (GET, HEAD, PUT, DELETE) produce identical side effects regardless of repetition count."
          },
          {
            "id": "web0_q6",
            "question": "What does the HTTP header `Content-Security-Policy` (CSP) mitigate?",
            "options": [
              "SQL Injection",
              "Cross-Site Scripting (XSS) and data injection attacks",
              "Buffer overflows",
              "DDoS attacks"
            ],
            "correctIndex": 1,
            "explanation": "CSP restricts which scripts and resources can execute, preventing malicious script injections."
          },
          {
            "id": "web0_q7",
            "question": "Which CSS property specifies how flex items wrap when exceeding container bounds?",
            "options": [
              "flex-wrap: wrap;",
              "flex-flow: multi;",
              "wrap-content: true;",
              "overflow: wrap;"
            ],
            "correctIndex": 0,
            "explanation": "flex-wrap controls whether flex items remain single-line or wrap onto multiple lines."
          },
          {
            "id": "web0_q8",
            "question": "What does the `alt` attribute on an `<img>` tag provide?",
            "options": [
              "Image resolution",
              "An accessible text description for screen readers and fallback if the image fails to load",
              "Image tooltip title only",
              "CSS styling selector"
            ],
            "correctIndex": 1,
            "explanation": "The alt attribute provides critical fallback description for assistive technologies and broken image states."
          },
          {
            "id": "web0_q9",
            "question": "What is the difference between `display: none;` and `visibility: hidden;` in CSS?",
            "options": [
              "They are identical",
              "`display: none` removes the element entirely from the layout flow; `visibility: hidden` hides the element while retaining its original layout space",
              "`visibility: hidden` deletes the DOM node",
              "`display: none` applies to text only"
            ],
            "correctIndex": 1,
            "explanation": "display: none collapses layout geometry; visibility: hidden maintains reserved box space."
          },
          {
            "id": "web0_q10",
            "question": "What HTTP status code range represents Client Errors?",
            "options": [
              "1xx",
              "2xx",
              "4xx",
              "5xx"
            ],
            "correctIndex": 2,
            "explanation": "4xx status codes indicate client-side errors (such as 400 Bad Request, 401 Unauthorized, 404 Not Found)."
          }
        ]
      },
      "references": [
        {
          "title": "MDN Web Docs — How the Web works",
          "url": "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Foundational guide to DNS, TCP, and HTTP protocols."
        },
        {
          "title": "web.dev — Core Web Vitals Guide",
          "url": "https://web.dev/vitals/",
          "source": "Google Chrome Team",
          "category": "Performance Standard",
          "description": "Official metrics and optimization strategies for LCP, INP, and CLS."
        },
        {
          "title": "Web Performance Fundamentals & CSS Triggers",
          "url": "https://web.dev/rendering-performance/",
          "source": "Google Chrome Developers",
          "category": "Official Engineering Standard",
          "description": "In-depth guide to browser layout engines, compositing layers, frame budgets, and 60fps rendering."
        }
      ],
      "keyTakeaways": [
        "HTTP/2 multiplexes streams over one TCP connection; HTTP/3 uses QUIC over UDP.",
        "Semantic HTML improves SEO and accessibility compliance (WCAG 2.1).",
        "Core Web Vitals measure loading speed (LCP), responsiveness (INP), and visual stability (CLS).",
        "Always reserve space for images to prevent Cumulative Layout Shift (CLS)."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_web0_1",
          "question": "What does Cumulative Layout Shift (CLS) measure?",
          "options": [
            "Server response latency",
            "Unexpected movement of page content during loading",
            "JavaScript download time",
            "Database query execution speed"
          ],
          "correctIndex": 1,
          "explanation": "CLS measures visual stability by tracking sudden layout shifts as fonts or images load."
        },
        {
          "id": "kc_web0_2",
          "question": "What is the primary browser rendering pipeline difference between modifying `transform: translate()` vs `top / left`?",
          "options": [
            "transform requires an HTTP request to recalculate",
            "transform is handled entirely on the GPU compositor thread without triggering expensive Layout or Paint recalculations",
            "top and left are faster on mobile devices",
            "There is no performance difference in modern browsers"
          ],
          "correctIndex": 1,
          "explanation": "Changes to top/left invalidate geometry, forcing Layout (reflow) and Paint across the DOM tree. transform bypasses layout and paint, executing directly on the GPU compositor at 60/120fps."
        }
      ],
      "interactiveSandboxCode": "<!-- Semantic HTML structure -->\n<header><nav><a href=\"#\">Home</a></nav></header>\n<main><h1>Welcome</h1></main>\n"
    },
    {
      "id": "web_mod_1",
      "trackId": "webdev",
      "moduleIndex": 1,
      "title": "Responsive Design, CSS Systems & Accessibility",
      "subtitle": "CSS Box Model, BFC, Flexbox Alignment, CSS Grid 2D Systems, and Container Queries.",
      "estimatedTime": "50 mins",
      "icon": "webdev",
      "overview": "Professional CSS layout engineering. Master the CSS Box Model (`border-box`), Block Formatting Context (BFC), Flexbox 1D layout mechanics, CSS Grid 2D layout systems with `minmax()` and `auto-fit`, fluid clamp typography, and modern Container Queries.",
      "sections": [
        {
          "title": "1. The CSS Box Model & box-sizing: border-box",
          "content": "By default (`content-box`), padding and borders add to an element's specified width, breaking layouts. Applying `box-sizing: border-box` globally ensures `width` includes content, padding, and border.",
          "codeExample": "*, *::before, *::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}"
        },
        {
          "title": "2. Modern Flexbox 1D Architecture",
          "content": "Flexbox manages alignment and distribution along a single axis (row or column). Master `justify-content` (main axis), `align-items` (cross axis), `flex-grow`, `flex-shrink`, and `flex-basis`.",
          "codeExample": ".navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n}"
        },
        {
          "title": "3. CSS Grid 2D Systems: auto-fit & minmax()",
          "content": "CSS Grid handles two-dimensional layouts simultaneously. Using `repeat(auto-fit, minmax(280px, 1fr))` creates a fully responsive card grid that wraps automatically without requiring media queries.",
          "codeExample": ".card-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 24px;\n}"
        },
        {
          "title": "4. Fluid Typography with clamp()",
          "content": "CSS `clamp(min, preferred, max)` scales font sizes and spacing smoothly across viewport widths without abrupt breakpoint jumps.",
          "codeExample": "h1 {\n  font-size: clamp(1.75rem, 4vw + 1rem, 3.25rem);\n}"
        },
        {
          "title": "5. Modern CSS: Container Queries (@container)",
          "content": "Media queries respond to the whole screen width. Container Queries respond to the size of the parent card, enabling truly modular, reusable responsive components.",
          "codeExample": ".card-container { container-type: inline-size; }\n@container (min-width: 400px) {\n  .card { display: flex; }\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Clamp Number Utility Function",
        "functionName": "clamp",
        "prompt": "Write a utility function `clamp(val, min, max)` that restricts a value to lie between min and max bounds. Read a JSON array `[val, min, max]` from stdin and return the clamped value.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[150, 0, 100]",
            "expectedOutput": "100",
            "isHidden": false
          },
          {
            "input": "[-25, 0, 100]",
            "expectedOutput": "0",
            "isHidden": false
          },
          {
            "input": "[50, 0, 100]",
            "expectedOutput": "50",
            "isHidden": false
          },
          {
            "input": "[0, 0, 10]",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "[10, 0, 10]",
            "expectedOutput": "10",
            "isHidden": true
          },
          {
            "input": "[25, 10, 20]",
            "expectedOutput": "20",
            "isHidden": true
          },
          {
            "input": "[-100, -50, 50]",
            "expectedOutput": "-50",
            "isHidden": true
          },
          {
            "input": "[100, -50, 50]",
            "expectedOutput": "50",
            "isHidden": true
          },
          {
            "input": "[0, -10, 10]",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "[75, 50, 100]",
            "expectedOutput": "75",
            "isHidden": true
          }
        ],
        "difficulty": "Easy",
        "category": "Mathematical Utilities & Boundary Clamping",
        "inputFormat": "JSON array `[val, min, max]` from stdin.",
        "outputFormat": "Integer clamped within range `[min, max]`.",
        "constraints": [
          "min <= max."
        ],
        "examples": [
          {
            "input": "[150, 0, 100]",
            "output": "100",
            "explanation": "150 clamped to upper bound 100."
          },
          {
            "input": "[-25, 0, 100]",
            "output": "0",
            "explanation": "-25 clamped to lower bound 0."
          }
        ],
        "hints": [
          "Use `Math.max(min, Math.min(val, max))`."
        ],
        "title": "Clamp Number Utility Function",
        "objective": "Implement a numeric clamping helper that constrains a value between an inclusive minimum and maximum.",
        "conceptualExplanation": [
          "Step 1: Accept three parameters: `value`, `min`, `max`.",
          "Step 2: If `value < min`, return `min`.",
          "Step 3: Else if `value > max`, return `max`.",
          "Step 4: Otherwise return `value` (compact formulation: `Math.min(Math.max(value, min), max)`).",
          "Step 5: Print clamped value to stdout."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "web1_q1",
            "question": "What does 'Mobile-First' design imply when structuring CSS media queries?",
            "options": [
              "Writing styles exclusively for smartphones",
              "Writing base styles for small screens first, then progressively enhancing using `min-width` queries",
              "Using JavaScript to detect screen sizes",
              "Using only pixel units"
            ],
            "correctIndex": 1,
            "explanation": "Mobile-first builds the minimum core experience first, adding layout enhancements via min-width queries."
          },
          {
            "id": "web1_q2",
            "question": "Which CSS properties can the browser animate on the GPU compositor thread without triggering layout reflow?",
            "options": [
              "width and height",
              "transform and opacity",
              "margin and padding",
              "top and left"
            ],
            "correctIndex": 1,
            "explanation": "Transform and opacity bypass layout and paint stages, executing directly on the GPU compositor thread."
          },
          {
            "id": "web1_q3",
            "question": "How are CSS Custom Properties (variables) defined and referenced?",
            "options": [
              "$color: red; color: $color;",
              "var --color = red; color: var(--color);",
              "--primary: #333; color: var(--primary);",
              "@variable color: red;"
            ],
            "correctIndex": 2,
            "explanation": "CSS variables use `--name: value;` and are retrieved using `var(--name)`."
          },
          {
            "id": "web1_q4",
            "question": "What CSS function enables fluid responsive typography between minimum and maximum bounds?",
            "options": [
              "clamp(min, preferred, max)",
              "calc(min + max)",
              "max(preferred)",
              "scale(font)"
            ],
            "correctIndex": 0,
            "explanation": "clamp(min, val, max) sets fluid values that adapt dynamically within specified limits."
          },
          {
            "id": "web1_q5",
            "question": "What is the purpose of the `<meta name='viewport' content='width=device-width, initial-scale=1.0'>` tag?",
            "options": [
              "To enable cookies",
              "To set the viewport width to the device screen width, preventing unwanted mobile scaling",
              "To load mobile fonts",
              "To detect orientation"
            ],
            "correctIndex": 1,
            "explanation": "The viewport meta tag ensures pages render at 1:1 scale on mobile device displays."
          },
          {
            "id": "web1_q6",
            "question": "What WCAG contrast ratio is required for normal body text to meet AA accessibility compliance?",
            "options": [
              "2:1",
              "3:1",
              "4.5:1",
              "7:1"
            ],
            "correctIndex": 2,
            "explanation": "WCAG 2.1 AA mandates at least a 4.5:1 contrast ratio for standard text against its background."
          },
          {
            "id": "web1_q7",
            "question": "What does the `rem` CSS unit represent?",
            "options": [
              "Relative to the parent element's font size",
              "Relative to the root (`<html>`) element's font size",
              "Relative to the viewport width",
              "Pixels divided by 2"
            ],
            "correctIndex": 1,
            "explanation": "rem (root em) scales relative to the root font size, enabling consistent user-configurable zooming."
          },
          {
            "id": "web1_q8",
            "question": "What CSS media feature detects whether a user has requested a dark color scheme in their OS?",
            "options": [
              "@media (theme: dark)",
              "@media (prefers-color-scheme: dark)",
              "@media (os-color: dark)",
              "@media (color-mode: dark)"
            ],
            "correctIndex": 1,
            "explanation": "prefers-color-scheme allows matching user OS dark/light mode preferences."
          },
          {
            "id": "web1_q9",
            "question": "What does `aria-label` provide on an interactive HTML button with only an icon?",
            "options": [
              "A tooltip on hover",
              "An accessible name for screen readers when visible text is absent",
              "A CSS style selector",
              "A database identifier"
            ],
            "correctIndex": 1,
            "explanation": "aria-label provides screen readers with an accessible textual name for icon-only buttons."
          },
          {
            "id": "web1_q10",
            "question": "What is the difference between `em` and `rem` units in CSS?",
            "options": [
              "`em` is relative to current/parent element font-size; `rem` is strictly relative to root `<html>` font-size",
              "`rem` is for text only",
              "`em` is deprecated",
              "There is no difference"
            ],
            "correctIndex": 0,
            "explanation": "em compounds relative to inherited parent font size; rem remains anchored to root font size."
          }
        ]
      },
      "references": [
        {
          "title": "MDN Web Docs — CSS Grid Layout",
          "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Comprehensive documentation on 2D grid layout systems."
        },
        {
          "title": "CSS-Tricks — A Complete Guide to Flexbox",
          "url": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
          "source": "CSS-Tricks",
          "category": "Industry Guide",
          "description": "The definitive visual guide to flexbox properties and alignment."
        },
        {
          "title": "React Architecture: Reconciliation & Diffing Algorithm",
          "url": "https://react.dev/learn/preserving-and-resetting-state",
          "source": "Meta / React Core Team",
          "category": "Official Framework Documentation",
          "description": "Official documentation detailing component identity, state preservation, and fiber reconciliation."
        }
      ],
      "keyTakeaways": [
        "Apply `box-sizing: border-box` globally to keep dimension calculations predictable.",
        "Use `repeat(auto-fit, minmax(px, 1fr))` for zero-media-query responsive grids.",
        "Use `clamp()` for fluid responsive typography.",
        "Container queries adapt components based on parent container width."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_web1_1",
          "question": "What does `box-sizing: border-box` do?",
          "options": [
            "Hides element borders",
            "Includes padding and border within the element's total specified width and height",
            "Centers text automatically",
            "Forces elements into CSS Grid mode"
          ],
          "correctIndex": 1,
          "explanation": "border-box ensures that padding and borders do not expand the element beyond its defined width."
        },
        {
          "id": "kc_web1_2",
          "question": "Why is relying on array index as React `key` prop (`key={index}`) an anti-pattern when rendering dynamic lists?",
          "options": [
            "React throws an immediate Uncaught TypeError",
            "When items are inserted, deleted, or reordered, index keys corrupt component local state and cause incorrect reconciliation",
            "Index keys disable CSS styling",
            "Index keys increase network packet size"
          ],
          "correctIndex": 1,
          "explanation": "React uses keys to identify DOM identity across renders. When reordering items, index keys falsely map unchanged indices to different data, causing inputs and animation states to desync."
        }
      ],
      "interactiveSandboxCode": "/* Responsive Auto-Fitting Grid */\n.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }\n"
    },
    {
      "id": "web_mod_2",
      "trackId": "webdev",
      "moduleIndex": 2,
      "title": "Modern React Architecture, Hooks & Component Lifecycle",
      "subtitle": "Virtual DOM, Fiber Reconciliation, Hooks Dependency Hygiene, and Component Lifecycle.",
      "estimatedTime": "55 mins",
      "icon": "webdev",
      "overview": "React 19 engineering architecture. Master Virtual DOM diffing, Fiber reconciliation and concurrent scheduling, `useState` and `useEffect` dependency hygiene, memoization trade-offs (`useMemo`, `useCallback`), custom hook design, and state management.",
      "sections": [
        {
          "title": "1. Virtual DOM & Fiber Reconciliation Engine",
          "content": "React maintains an in-memory Virtual DOM tree. When state changes, React's Fiber reconciler breaks rendering work into incremental units (fibers) that can be paused, aborted, or prioritized, computing a minimal set of DOM mutations.",
          "codeExample": "// React Fiber processes work units with interruptible scheduling"
        },
        {
          "title": "2. The Rules of Hooks & Dependency Hygiene",
          "content": "• Call hooks only at top level of React functions (never inside loops, conditions, or nested functions).\n• Always include all reactive values read by an effect in its dependency array to prevent stale closure bugs.",
          "codeExample": "import { useState, useEffect } from 'react';\nfunction UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n  useEffect(() => {\n    let active = true;\n    fetch(`/api/users/${userId}`)\n      .then(res => res.json())\n      .then(data => { if (active) setUser(data); });\n    return () => { active = false; }; // Cleanup flag prevents race conditions\n  }, [userId]); // Dependency hygiene\n}"
        },
        {
          "title": "3. Performance Optimization: useMemo, useCallback & React.memo",
          "content": "Premature memoization adds memory overhead. Use `useMemo` for computationally expensive transforms (>10ms) and `useCallback` when passing callbacks to memoized children (`React.memo`).",
          "codeExample": "import { useMemo, useCallback } from 'react';\nconst filteredList = useMemo(() => items.filter(i => i.score > threshold), [items, threshold]);\nconst handleClick = useCallback(() => onSelect(id), [id]);"
        },
        {
          "title": "4. Custom Hooks for Encapsulated Business Logic",
          "content": "Extract reusable stateful logic into custom hooks starting with `use`. They compose standard hooks without adding wrapper DOM nodes.",
          "codeExample": "function useWindowWidth() {\n  const [width, setWidth] = useState(window.innerWidth);\n  useEffect(() => {\n    const handler = () => setWidth(window.innerWidth);\n    window.addEventListener('resize', handler);\n    return () => window.removeEventListener('resize', handler);\n  }, []);\n  return width;\n}"
        },
        {
          "title": "5. Production Anti-Pattern: Prop Drilling & State Placement",
          "content": "Avoid passing props down 5+ levels. Use Component Composition (passing children) or React Context for global state like themes, authentication, or notifications.",
          "codeExample": "// Prefer composition: <Page><Sidebar user={user} /></Page>"
        }
      ],
      "codingExercise": {
        "taskTitle": "State Reducer Simulation",
        "functionName": "stateReducer",
        "prompt": "Implement a state reducer simulation that processes an array of actions `[{\"type\":\"INCREMENT\"},{\"type\":\"DECREMENT\"},{\"type\":\"ADD\",\"payload\":10}]` starting from count = 0. Output the final count.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[{\"type\":\"INCREMENT\"},{\"type\":\"INCREMENT\"},{\"type\":\"ADD\",\"payload\":10}]",
            "expectedOutput": "12",
            "isHidden": false
          },
          {
            "input": "[{\"type\":\"DECREMENT\"},{\"type\":\"DECREMENT\"}]",
            "expectedOutput": "-2",
            "isHidden": false
          },
          {
            "input": "[{\"type\":\"ADD\",\"payload\":50},{\"type\":\"DECREMENT\"}]",
            "expectedOutput": "49",
            "isHidden": false
          },
          {
            "input": "[]",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"INCREMENT\"}]",
            "expectedOutput": "1",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"ADD\",\"payload\":100},{\"type\":\"ADD\",\"payload\":200}]",
            "expectedOutput": "300",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"INCREMENT\"},{\"type\":\"DECREMENT\"}]",
            "expectedOutput": "0",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"ADD\",\"payload\":25},{\"type\":\"DECREMENT\"},{\"type\":\"DECREMENT\"}]",
            "expectedOutput": "23",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"DECREMENT\"},{\"type\":\"ADD\",\"payload\":5}]",
            "expectedOutput": "4",
            "isHidden": true
          },
          {
            "input": "[{\"type\":\"INCREMENT\"},{\"type\":\"INCREMENT\"},{\"type\":\"INCREMENT\"},{\"type\":\"DECREMENT\"}]",
            "expectedOutput": "2",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "State Management & Reducer Patterns",
        "inputFormat": "JSON array of action objects `[{\"type\": \"INCREMENT\"}, ...]`.",
        "outputFormat": "Final integer count after reducing actions.",
        "constraints": [
          "Initial state is count = 0.",
          "Actions: INCREMENT, DECREMENT, ADD (payload)."
        ],
        "examples": [
          {
            "input": "[{\"type\":\"INCREMENT\"},{\"type\":\"INCREMENT\"},{\"type\":\"ADD\",\"payload\":10}]",
            "output": "12",
            "explanation": "0 + 1 + 1 + 10 = 12."
          }
        ],
        "hints": [
          "Use a switch statement inside a reducer function."
        ],
        "title": "State Reducer Simulation",
        "objective": "Simulate a Redux-style state reducer handling increment, decrement, and set actions with immutable state transitions.",
        "conceptualExplanation": [
          "Step 1: Define initial state `{ count: 0 }`.",
          "Step 2: In reducer function `(state, action)`, switch on `action.type`.",
          "Step 3: For 'INCREMENT', return `{ ...state, count: state.count + (action.payload || 1) }`.",
          "Step 4: For 'DECREMENT', return `{ ...state, count: state.count - (action.payload || 1) }`.",
          "Step 5: For 'SET', return `{ ...state, count: action.payload }`. Return current state for unknown actions."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "web2_q1",
            "question": "Why must the `key` prop be stable and unique when rendering lists in React?",
            "options": [
              "To apply CSS styles",
              "To help React's reconciliation engine identify which items changed, were added, or removed",
              "To count list items",
              "To serialize components"
            ],
            "correctIndex": 1,
            "explanation": "Unique keys enable React Fiber to match elements across renders without recreating DOM nodes unnecessarily."
          },
          {
            "id": "web2_q2",
            "question": "When does the cleanup function returned from `useEffect` execute?",
            "options": [
              "Immediately before component mounts",
              "Before re-running the effect on dependency change and when the component unmounts",
              "Only when the browser tab closes",
              "During every state change"
            ],
            "correctIndex": 1,
            "explanation": "The cleanup function runs to clean up old effect subscriptions before subsequent effects or unmount."
          },
          {
            "id": "web2_q3",
            "question": "What is the primary purpose of the `useCallback` hook in React?",
            "options": [
              "To run an async function",
              "To memoize a callback function instance between renders, preventing unnecessary child re-renders",
              "To replace useState",
              "To bind this"
            ],
            "correctIndex": 1,
            "explanation": "useCallback caches a function definition between renders unless its dependencies change."
          },
          {
            "id": "web2_q4",
            "question": "What does `React.memo` do for a functional component?",
            "options": [
              "Makes the component asynchronous",
              "Performs a shallow comparison of props and skips rendering if unchanged",
              "Converts it to a class component",
              "Caches state"
            ],
            "correctIndex": 1,
            "explanation": "React.memo is a higher-order component that skips re-rendering if props are shallowly equal."
          },
          {
            "id": "web2_q5",
            "question": "Can hooks be invoked conditionally inside an `if` statement?",
            "options": [
              "Yes, if the condition is boolean",
              "No, hooks must always be invoked in the exact same order on every render",
              "Only in development mode",
              "Only useEffect can be conditional"
            ],
            "correctIndex": 1,
            "explanation": "React relies on consistent hook call order to match state variables across renders."
          },
          {
            "id": "web2_q6",
            "question": "What is the Virtual DOM in React?",
            "options": [
              "A browser plugin",
              "An in-memory lightweight representation of the real DOM used for diffing and batching updates",
              "A database engine",
              "A virtual machine"
            ],
            "correctIndex": 1,
            "explanation": "The Virtual DOM is a tree of plain JS objects that React reconciles against the actual DOM."
          },
          {
            "id": "web2_q7",
            "question": "What hook should be used to access DOM elements directly in a React functional component?",
            "options": [
              "useDOM",
              "useRef",
              "useState",
              "useId"
            ],
            "correctIndex": 1,
            "explanation": "useRef returns a mutable ref object whose `.current` property can reference a mounted DOM element."
          },
          {
            "id": "web2_q8",
            "question": "What is 'prop drilling' in React application architecture?",
            "options": [
              "Validating prop types",
              "Passing props through multiple intermediate components that do not need them just to reach a deeply nested child",
              "Drilling holes in UI",
              "Modifying props"
            ],
            "correctIndex": 1,
            "explanation": "Prop drilling describes excessive cascading of props through intermediate component layers."
          },
          {
            "id": "web2_q9",
            "question": "How does React state update batching work in React 18 and 19?",
            "options": [
              "Updates are executed one by one synchronously",
              "All state updates within timeouts, promises, and event handlers are batched automatically into a single re-render",
              "Batching is disabled by default",
              "Requires explicit dispatch"
            ],
            "correctIndex": 1,
            "explanation": "React 18+ automatically batches state updates across microtasks, timeouts, and native events."
          },
          {
            "id": "web2_q10",
            "question": "What is the difference between `useMemo` and `useCallback`?",
            "options": [
              "`useMemo` caches the calculated return value; `useCallback` caches the function reference itself",
              "useMemo is for arrays only",
              "They are identical",
              "useCallback is asynchronous"
            ],
            "correctIndex": 0,
            "explanation": "useMemo returns a memoized value; useCallback returns a memoized function."
          }
        ]
      },
      "references": [
        {
          "title": "React Official Documentation (react.dev)",
          "url": "https://react.dev/",
          "source": "React Core Team (Meta)",
          "category": "Official Documentation",
          "description": "Official documentation covering hooks, components, and reconciliation."
        },
        {
          "title": "Overreacted — A Complete Guide to useEffect by Dan Abramov",
          "url": "https://overreacted.io/a-complete-guide-to-useeffect/",
          "source": "Dan Abramov",
          "category": "Engineering Guide",
          "description": "The definitive deep dive into React effects and closures."
        },
        {
          "title": "Synchronizing with Effects: Official React Documentation",
          "url": "https://react.dev/learn/synchronizing-with-effects",
          "source": "Meta / React Core Team",
          "category": "Official Framework Documentation",
          "description": "Best practices for lifecycle synchronization, connection lifecycles, and avoiding effect race conditions."
        }
      ],
      "keyTakeaways": [
        "React Fiber enables interruptible, prioritized concurrent rendering.",
        "Always maintain complete dependency arrays in `useEffect`.",
        "Use cleanup functions in effects to cancel pending async requests.",
        "Custom hooks encapsulate reusable stateful logic cleanly."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_web2_1",
          "question": "Why must you return a cleanup function from an effect that subscribes to an event?",
          "options": [
            "To speed up JavaScript execution",
            "To prevent memory leaks and duplicate listeners when the component unmounts or dependencies change",
            "React will throw an error without it",
            "To clear the browser history"
          ],
          "correctIndex": 1,
          "explanation": "Cleanup functions unsubscribe listeners and cancel pending async actions when components unmount."
        },
        {
          "id": "kc_web2_2",
          "question": "What is the consequence of failing to provide a cleanup function in a `useEffect` that establishes a WebSocket connection?",
          "options": [
            "The browser closes the active tab automatically",
            "Every component re-render creates another open socket connection, causing ghost message processing and memory leaks",
            "The WebSocket converts into an HTTP GET request",
            "React switches to server-side rendering"
          ],
          "correctIndex": 1,
          "explanation": "Without returning a cleanup function (return () => socket.close()), unmounted components leave active network listeners open in memory, causing connection leaks."
        }
      ],
      "interactiveSandboxCode": "import { useState } from 'react';\nfunction Counter() {\n  const [c, setC] = useState(0);\n  return <button onClick={() => setC(c + 1)}>Count: {c}</button>;\n}\n"
    },
    {
      "id": "web_mod_3",
      "trackId": "webdev",
      "moduleIndex": 3,
      "title": "Full-Stack REST API Integration & Secure Authentication",
      "subtitle": "REST Constraints vs GraphQL, Stateless JWT vs HttpOnly Cookies, and CORS/CSRF Security.",
      "estimatedTime": "55 mins",
      "icon": "webdev",
      "overview": "Full-stack integration, API contracts, and security architecture. Master REST constraints vs GraphQL trade-offs, stateless JWT authentication vs secure HttpOnly SameSite session cookies, CORS preflight handshakes, and defenses against XSS and CSRF attacks.",
      "sections": [
        {
          "title": "1. REST Architectural Constraints & HTTP Methods",
          "content": "REST (Representational State Transfer) requires:\n• Statelessness: Every request contains all context needed for processing.\n• Proper HTTP Semantics: GET (safe/idempotent), POST (create non-idempotent), PUT (replace idempotent), PATCH (partial modify), DELETE (idempotent).",
          "codeExample": "// RESTful Resource Endpoints\n// GET    /api/v1/tickets      (List)\n// POST   /api/v1/tickets      (Create)\n// GET    /api/v1/tickets/:id  (Retrieve)\n// PATCH  /api/v1/tickets/:id  (Update status)\n// DELETE /api/v1/tickets/:id  (Archive/Remove)"
        },
        {
          "title": "2. Secure Authentication: JWT vs HttpOnly Cookies",
          "content": "Storing JWT tokens in `localStorage` exposes them to theft via Cross-Site Scripting (XSS). In production, store authentication tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies that JavaScript cannot read.",
          "codeExample": "// Express secure cookie response:\nres.cookie('token', jwtToken, {\n  httpOnly: true, // Inaccessible to document.cookie (XSS immune)\n  secure: true,   // HTTPS only\n  sameSite: 'strict', // CSRF defense\n  maxAge: 3600000 // 1 hour\n});"
        },
        {
          "title": "3. Cross-Origin Resource Sharing (CORS) Mechanics",
          "content": "CORS is a browser security mechanism that restricts cross-origin HTTP requests. For mutating requests, browsers send an `OPTIONS` preflight request verifying allowed origins, headers, and methods.",
          "codeExample": "// Express CORS configuration\nconst cors = require('cors');\napp.use(cors({\n  origin: ['https://masteryzone.com'],\n  credentials: true,\n  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']\n}));"
        },
        {
          "title": "4. Defending Against OWASP Top Vulnerabilities (XSS & CSRF)",
          "content": "• XSS (Cross-Site Scripting): Sanitize untrusted input and avoid `dangerouslySetInnerHTML`.\n• CSRF (Cross-Site Request Forgery): Defended via `SameSite=Strict` cookies and anti-CSRF token verification on state-changing requests.",
          "codeExample": "// Helmet middleware sets security headers (CSP, HSTS, X-Content-Type-Options)\nconst helmet = require('helmet');\napp.use(helmet());"
        },
        {
          "title": "5. Optimistic UI Updates & Cache Invalidation",
          "content": "Update the UI immediately upon user action before server confirmation, rolling back only if the network request fails, delivering instant perceived performance.",
          "codeExample": "// Optimistic UI update pattern\nsetTodos(prev => [...prev, newTodo]);\napi.createTodo(newTodo).catch(() => setTodos(prev => prev.filter(t => t.id !== newTodo.id)));"
        }
      ],
      "codingExercise": {
        "taskTitle": "Parse and Validate JWT Payload",
        "functionName": "parseJwtPayload",
        "prompt": "Write a function that takes a raw JWT token from stdin, extracts the Base64-encoded payload (second segment), decodes it from Base64, and returns the parsed JSON object.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjM0NSIsIm5hbWUiOiJBbGV4In0.signature123",
            "expectedOutput": "{\"userId\":\"12345\",\"name\":\"Alex\"}",
            "isHidden": false
          },
          {
            "input": "invalid.token",
            "expectedOutput": "null",
            "isHidden": false
          },
          {
            "input": "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MDAwMDAwMDB9.sig",
            "expectedOutput": "{\"role\":\"admin\",\"iat\":1600000000}",
            "isHidden": false
          },
          {
            "input": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.sig",
            "expectedOutput": "{\"sub\":\"1234567890\",\"name\":\"John Doe\"}",
            "isHidden": true
          },
          {
            "input": "badtoken",
            "expectedOutput": "null",
            "isHidden": true
          },
          {
            "input": "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhdXRoMCJ9.sig",
            "expectedOutput": "{\"iss\":\"auth0\"}",
            "isHidden": true
          },
          {
            "input": "a.b",
            "expectedOutput": "null",
            "isHidden": true
          },
          {
            "input": "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20ifQ.sig",
            "expectedOutput": "{\"email\":\"user@example.com\"}",
            "isHidden": true
          },
          {
            "input": "not_a_jwt_at_all",
            "expectedOutput": "null",
            "isHidden": true
          },
          {
            "input": "eyJhbGciOiJIUzI1NiJ9.eyJzdGF0dXMiOiJhY3RpdmUiLCJjb3VudCI6NX0.sig",
            "expectedOutput": "{\"status\":\"active\",\"count\":5}",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Security, Web Tokens & Base64 Decoding",
        "inputFormat": "Raw JWT token string from stdin.",
        "outputFormat": "Parsed payload JSON object, or null on error.",
        "constraints": [
          "JWT has 3 parts separated by dots.",
          "Payload is Base64Url encoded in the second part."
        ],
        "examples": [
          {
            "input": "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjM0NSIsIm5hbWUiOiJBbGV4In0.signature123",
            "output": "{\"userId\":\"12345\",\"name\":\"Alex\"}",
            "explanation": "Extracted and decoded second segment."
          }
        ],
        "hints": [
          "Split token by `.` and check `parts.length === 3`.",
          "Decode using `Buffer.from(parts[1], 'base64').toString('utf8')`."
        ],
        "title": "Parse and Validate JWT Payload",
        "objective": "Decode and validate a JWT payload without external libraries, checking structure, base64 decoding, and expiry.",
        "conceptualExplanation": [
          "Step 1: Split JWT string into three dot-separated parts: `[headerB64, payloadB64, signatureB64]`.",
          "Step 2: Verify that exactly 3 parts exist; otherwise throw or output error.",
          "Step 3: Base64URL-decode payload part into a JSON string using `Buffer.from(part, 'base64url').toString('utf8')`.",
          "Step 4: Parse JSON into an object and inspect expiration timestamp `exp` against current epoch seconds.",
          "Step 5: Print decoded payload JSON and validity boolean."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "web3_q1",
            "question": "What are the three components of a JSON Web Token (JWT) separated by dots?",
            "options": [
              "Key, Value, Signature",
              "Header, Payload, Signature",
              "User, Expiration, Hash",
              "Method, Path, Protocol"
            ],
            "correctIndex": 1,
            "explanation": "A JWT consists of Header (algorithm), Payload (claims), and Signature (verification hash)."
          },
          {
            "id": "web3_q2",
            "question": "Which HTTP status code should a server return when a client makes a request without providing an authentication token?",
            "options": [
              "400 Bad Request",
              "401 Unauthorized",
              "403 Forbidden",
              "404 Not Found"
            ],
            "correctIndex": 1,
            "explanation": "401 Unauthorized indicates that the request lacks valid authentication credentials."
          },
          {
            "id": "web3_q3",
            "question": "What is the difference between 401 Unauthorized and 403 Forbidden?",
            "options": [
              "401 means unauthenticated (missing/invalid credentials); 403 means authenticated but lacking permissions to access the resource",
              "They are identical aliases",
              "403 is for server errors",
              "401 is deprecated"
            ],
            "correctIndex": 0,
            "explanation": "401 means user identity is unverified; 403 means user is verified but forbidden from this action."
          },
          {
            "id": "web3_q4",
            "question": "Where in an HTTP request is a Bearer token standardly transmitted?",
            "options": [
              "Query parameter `?token=...`",
              "Authorization header: `Authorization: Bearer <token>`",
              "Cookie named session_id only",
              "Request body JSON key"
            ],
            "correctIndex": 1,
            "explanation": "RFC 6750 standardizes bearer tokens in the `Authorization: Bearer <token>` header."
          },
          {
            "id": "web3_q5",
            "question": "Can the contents of a standard JWT payload be decoded and read by anyone with access to the token string?",
            "options": [
              "No, JWTs are automatically encrypted",
              "Yes, the payload is only Base64Url-encoded, not encrypted (unless using JWE)",
              "Only the server can read it",
              "Only with private key"
            ],
            "correctIndex": 1,
            "explanation": "Standard JWTs (JWS) are signed, not encrypted; anyone can decode and view claims in the payload."
          },
          {
            "id": "web3_q6",
            "question": "What is CORS (Cross-Origin Resource Sharing)?",
            "options": [
              "A security mechanism enforced by web browsers that restricts cross-origin HTTP requests unless permitted by the server's headers",
              "A database protocol",
              "A CSS framework",
              "A router library"
            ],
            "correctIndex": 0,
            "explanation": "CORS is a browser security mechanism restricting cross-origin requests."
          },
          {
            "id": "web3_q7",
            "question": "Which HTTP verb should be used when partially updating specific fields of an existing resource?",
            "options": [
              "PUT",
              "PATCH",
              "POST",
              "UPDATE"
            ],
            "correctIndex": 1,
            "explanation": "PATCH applies partial modifications, whereas PUT typically replaces the entire resource."
          },
          {
            "id": "web3_q8",
            "question": "What is the purpose of the `exp` claim in a JWT payload?",
            "options": [
              "The token creation timestamp",
              "The expiration timestamp (in seconds since UNIX epoch) after which the token is invalid",
              "The user's experience points",
              "The encryption standard"
            ],
            "correctIndex": 1,
            "explanation": "The `exp` registered claim defines the expiration timestamp of the token."
          },
          {
            "id": "web3_q9",
            "question": "What is SQL / NoSQL Injection?",
            "options": [
              "An algorithm optimization",
              "An attack where untrusted user input is concatenated into database queries, allowing attackers to manipulate query logic",
              "A compiler error",
              "A connection pool failure"
            ],
            "correctIndex": 1,
            "explanation": "Injection occurs when untrusted input is executed as code/commands by database engines."
          },
          {
            "id": "web3_q10",
            "question": "What is the recommended storage mechanism for sensitive auth tokens in modern web apps to mitigate XSS theft?",
            "options": [
              "localStorage",
              "Secure, HttpOnly, SameSite cookies",
              "sessionStorage",
              "Global window object"
            ],
            "correctIndex": 1,
            "explanation": "HttpOnly cookies cannot be read by JavaScript, protecting tokens from Cross-Site Scripting (XSS) extraction."
          }
        ]
      },
      "references": [
        {
          "title": "OWASP Top 10 Web Application Security Risks",
          "url": "https://owasp.org/www-project-top-ten/",
          "source": "OWASP Foundation",
          "category": "Security Standard",
          "description": "The authoritative global standard for web application security vulnerabilities."
        },
        {
          "title": "MDN Web Docs — Cross-Origin Resource Sharing (CORS)",
          "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
          "source": "Mozilla",
          "category": "Authoritative Guide",
          "description": "Comprehensive guide to CORS preflight handshakes and headers."
        },
        {
          "title": "RFC 6265bis: Cookies — HTTP State Management Mechanism",
          "url": "https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis",
          "source": "Internet Engineering Task Force (IETF)",
          "category": "Internet RFC Standard",
          "description": "Standard defining cookie flags: HttpOnly, Secure, SameSite, and cross-site privacy protections."
        }
      ],
      "keyTakeaways": [
        "Store sensitive authentication tokens in HttpOnly, Secure, SameSite cookies to mitigate XSS theft.",
        "REST APIs require proper HTTP verbs and stateless request lifecycles.",
        "CORS is enforced by browsers using OPTIONS preflight handshakes.",
        "Optimistic UI updates improve perceived performance on interactive apps."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_web3_1",
          "question": "Why should authentication tokens be stored in HttpOnly cookies instead of localStorage?",
          "options": [
            "Cookies are faster than localStorage",
            "HttpOnly cookies cannot be read by JavaScript, protecting them from XSS theft",
            "localStorage only stores numbers",
            "Browsers will delete localStorage after 1 hour"
          ],
          "correctIndex": 1,
          "explanation": "HttpOnly cookies cannot be accessed via client-side JavaScript, rendering them immune to XSS token theft."
        },
        {
          "id": "kc_web3_2",
          "question": "What security risk does setting `SameSite=None` on a session cookie introduce if `Secure` is omitted?",
          "options": [
            "The browser prevents JavaScript execution",
            "The cookie will be rejected by modern browsers and is vulnerable to Cross-Site Request Forgery (CSRF) over unencrypted connections",
            "The cookie exceeds maximum header size",
            "It enables automatic SQL injection"
          ],
          "correctIndex": 1,
          "explanation": "Modern browsers strictly mandate that cookies with SameSite=None must also have the Secure attribute to protect user sessions from man-in-the-middle attacks and cross-origin CSRF exploits."
        }
      ],
      "interactiveSandboxCode": "// REST API request example\nfetch('/api/v1/health')\n  .then(res => res.json())\n  .then(data => console.log('API Status:', data));\n"
    }
  ],
  "dsa": [
    {
      "id": "dsa_mod_0",
      "trackId": "dsa",
      "moduleIndex": 0,
      "title": "Data Structures & Algorithms",
      "subtitle": "Asymptotic Notation, Master Theorem, Amortized Analysis, and Memory Cache Locality.",
      "estimatedTime": "50 mins",
      "icon": "dsa",
      "overview": "Rigorous algorithmic complexity analysis. Master Big-O (upper bound), Big-Omega (lower bound), and Big-Theta (tight bound), solving divide-and-conquer recurrences with the Master Theorem, amortized analysis via the accounting method, and hardware cache locality.",
      "sections": [
        {
          "title": "1. Asymptotic Notations: Big-O, Big-Omega & Big-Theta",
          "content": "Asymptotic analysis quantifies how algorithm time/space requirements scale as input size N tends toward infinity:\n• Big-O ($O(g(N))$): Formal upper bound ($T(N) \\le c \\cdot g(N)$ for $N \\ge N_0$).\n• Big-Omega ($\\Omega(g(N))$): Formal lower bound ($T(N) \\ge c \\cdot g(N)$).\n• Big-Theta ($\\Theta(g(N))$): Tight bound satisfying both upper and lower bounds simultaneously.",
          "codeExample": "// Complexity Hierarchy:\n// O(1) < O(log N) < O(N) < O(N log N) < O(N^2) < O(2^N) < O(N!)"
        },
        {
          "title": "2. Master Theorem for Divide-and-Conquer Recurrences",
          "content": "For recurrence relations of the form $T(N) = a \\cdot T(N/b) + f(N)$:\n• Case 1: If $f(N) = O(N^{\\log_b a - \\epsilon})$, then $T(N) = \\Theta(N^{\\log_b a})$\n• Case 2: If $f(N) = \\Theta(N^{\\log_b a})$, then $T(N) = \\Theta(N^{\\log_b a} \\log N)$ (e.g. MergeSort: $2T(N/2) + O(N) \\rightarrow \\Theta(N \\log N)$)\n• Case 3: If $f(N) = \\Omega(N^{\\log_b a + \\epsilon})$, then $T(N) = \\Theta(f(N))$",
          "codeExample": "// MergeSort recurrence: T(N) = 2T(N/2) + O(N)\n// a=2, b=2, log2(2) = 1. f(N) = N^1. Case 2 applies: O(N log N)."
        },
        {
          "title": "3. Amortized Analysis & Geometric Array Expansion",
          "content": "An individual operation may occasionally be expensive, but its average cost over a sequence of operations can be strictly O(1). Dynamic arrays (Python lists, C++ vectors) double their capacity when full. Doubling costs O(N), but happens so infrequently that the amortized cost per append is $O(1)$.",
          "codeExample": "// Amortized Proof: N insertions require 1 + 2 + 4 + ... + N = 2N total copies.\n// 2N copies / N insertions = 2 operations per insertion = O(1) amortized."
        },
        {
          "title": "4. Hardware Cache Locality: Spatial & Temporal",
          "content": "Contiguous arrays outperform linked node structures because modern CPUs load memory in 64-byte cache lines. Iterating over an array yields a cache hit rate near 100%, whereas node pointers trigger random memory lookups and cache misses.",
          "codeExample": "// Iterating array: Cache hits O(1)\n// Traversing linked list: Frequent CPU cache misses"
        },
        {
          "title": "5. Space Complexity: Auxiliary Space vs Total Space",
          "content": "Total space includes both the input size and any additional memory allocated. Auxiliary space measures only the extra temporary storage created by the algorithm (excluding input).",
          "codeExample": "// In-place QuickSort auxiliary space: O(log N) stack frames\n// MergeSort auxiliary space: O(N) temporary array"
        }
      ],
      "codingExercise": {
        "taskTitle": "Check Sorted Pair Sum (Two Pointers)",
        "functionName": "checkSortedPairSum",
        "prompt": "Write a JavaScript program that reads a sorted JSON array of numbers and an integer target from stdin, and returns true if any two distinct elements add up to target, or false otherwise.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[1, 2, 3, 9]\n8",
            "expectedOutput": "false",
            "isHidden": false
          },
          {
            "input": "[1, 2, 4, 4]\n8",
            "expectedOutput": "true",
            "isHidden": false
          },
          {
            "input": "[-5, -2, 0, 3, 10]\n5",
            "expectedOutput": "true",
            "isHidden": false
          },
          {
            "input": "[1, 3, 5, 7]\n10",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "[2, 4, 6, 8]\n11",
            "expectedOutput": "false",
            "isHidden": true
          },
          {
            "input": "[1, 2]\n3",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "[5]\n10",
            "expectedOutput": "false",
            "isHidden": true
          },
          {
            "input": "[-10, -5, 0, 5, 10]\n0",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n19",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n25",
            "expectedOutput": "false",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Two-Pointer Strategy & Asymptotic Bounds",
        "inputFormat": "Line 1: Sorted JSON array of integers `nums`.\nLine 2: Target integer.",
        "outputFormat": "Print 'true' if any pair sums to target, otherwise 'false'.",
        "constraints": [
          "Array is sorted in ascending order.",
          "Time Complexity: O(N), Space: O(1)."
        ],
        "examples": [
          {
            "input": "[1, 2, 3, 9]\n8",
            "output": "false",
            "explanation": "No pair adds up to 8."
          },
          {
            "input": "[1, 2, 4, 4]\n8",
            "output": "true",
            "explanation": "4 + 4 = 8."
          }
        ],
        "hints": [
          "Place left pointer at 0 and right pointer at nums.length - 1.",
          "If sum < target: left++. If sum > target: right--."
        ],
        "title": "Check Sorted Pair Sum (Two Pointers)",
        "objective": "Find whether two elements in a sorted array sum up to a target value using two pointers in O(N) time.",
        "conceptualExplanation": [
          "Step 1: Read the sorted array and target sum from standard input.",
          "Step 2: Initialize two pointers: `left = 0` at start, `right = n - 1` at end.",
          "Step 3: While `left < right`, compute `currentSum = arr[left] + arr[right]`.",
          "Step 4: If `currentSum == target`, return `[left, right]`. If `currentSum < target`, increment `left`. Else decrement `right`.",
          "Step 5: If pointers meet without finding target, return `[-1, -1]`."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "dsa0_q1",
            "question": "What is the worst-case time complexity of Binary Search on a sorted array of size N?",
            "options": [
              "O(1)",
              "O(log N)",
              "O(N)",
              "O(N log N)"
            ],
            "correctIndex": 1,
            "explanation": "Binary search divides the search interval in half with each comparison, taking at most log2(N) steps."
          },
          {
            "id": "dsa0_q2",
            "question": "What is the average time complexity of inserting an element into a Hash Table with good hash distribution?",
            "options": [
              "O(1)",
              "O(N)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 0,
            "explanation": "Under uniform hashing, hash table insertion takes expected O(1) constant time."
          },
          {
            "id": "dsa0_q3",
            "question": "Which data structure follows the Last-In, First-Out (LIFO) access principle?",
            "options": [
              "Queue",
              "Stack",
              "Binary Heap",
              "Linked List"
            ],
            "correctIndex": 1,
            "explanation": "A Stack processes elements in LIFO order using push and pop operations."
          },
          {
            "id": "dsa0_q4",
            "question": "What is the time complexity of finding an element by index in a contiguous dynamic array like an ArrayList or vector?",
            "options": [
              "O(1)",
              "O(N)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 0,
            "explanation": "Direct index access calculates the memory address as base_address + index * element_size in constant O(1) time."
          },
          {
            "id": "dsa0_q5",
            "question": "What is the optimal time complexity of comparison-based sorting algorithms like Merge Sort in the worst case?",
            "options": [
              "O(N)",
              "O(N log N)",
              "O(N²)",
              "O(log N)"
            ],
            "correctIndex": 1,
            "explanation": "The theoretical lower bound for comparison-based sorting algorithms is Ω(N log N), which Merge Sort satisfies."
          },
          {
            "id": "dsa0_q6",
            "question": "In a singly linked list, what is the time complexity of deleting a node given only a pointer to the head and the value to remove?",
            "options": [
              "O(1)",
              "O(N)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 1,
            "explanation": "You must traverse the list sequentially from the head to locate the node and its predecessor, taking O(N) time."
          },
          {
            "id": "dsa0_q7",
            "question": "Which algorithmic technique evaluates all possibilities recursively by trying a choice and undoing it if invalid?",
            "options": [
              "Greedy algorithm",
              "Backtracking",
              "Dynamic Programming",
              "Sliding Window"
            ],
            "correctIndex": 1,
            "explanation": "Backtracking builds candidates incrementally and abandons a candidate as soon as it determines it cannot yield a valid solution."
          },
          {
            "id": "dsa0_q8",
            "question": "What problem occurs when multiple keys produce the exact same index in a Hash Table?",
            "options": [
              "Hash Collision",
              "Memory Leak",
              "Stack Overflow",
              "Deadlock"
            ],
            "correctIndex": 0,
            "explanation": "A hash collision happens when distinct keys map to the same bucket, resolved via chaining or open addressing."
          },
          {
            "id": "dsa0_q9",
            "question": "What is the space complexity of an in-place algorithm that modifies input data using only a fixed number of scalar pointers?",
            "options": [
              "O(1)",
              "O(N)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 0,
            "explanation": "In-place algorithms use O(1) auxiliary space beyond the input storage."
          },
          {
            "id": "dsa0_q10",
            "question": "What does the Two-Pointer technique achieve on a sorted array when searching for target pairs?",
            "options": [
              "Reduces an O(N²) brute-force nested search down to linear O(N) time",
              "Sorts the array automatically",
              "Compresses array memory footprint",
              "Increases runtime by O(log N)"
            ],
            "correctIndex": 0,
            "explanation": "By adjusting left and right pointers based on whether current sum is less or greater than target, the array is scanned in O(N) time."
          }
        ]
      },
      "references": [
        {
          "title": "Introduction to Algorithms (CLRS) — Chapter 3: Growth of Functions",
          "url": "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/",
          "source": "MIT Press",
          "category": "Authoritative Textbook",
          "description": "The gold-standard reference for asymptotic proofs and Master Theorem."
        },
        {
          "title": "MIT OpenCourseWare — 6.006 Introduction to Algorithms",
          "url": "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
          "source": "MIT",
          "category": "Academic Curriculum",
          "description": "Free lecture series on Big-O analysis and amortized cost."
        },
        {
          "title": "Introduction to Algorithms (CLRS 4th Edition) — Chapter 7: Quicksort",
          "url": "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/",
          "source": "Cormen, Leiserson, Rivest, Stein / MIT Press",
          "category": "Academic Standard Textbook",
          "description": "Rigorous mathematical proof of Quicksort partition invariants, indicator random variables, and average-case O(N log N) bounds."
        }
      ],
      "keyTakeaways": [
        "Big-O gives an asymptotic upper bound; Big-Theta gives a tight bound.",
        "Master Theorem solves recurrences like MergeSort in $O(N \\log N)$.",
        "Dynamic array resizing has an amortized cost of $O(1)$ per append.",
        "Contiguous memory layouts benefit from hardware spatial cache locality."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_dsa0_1",
          "question": "What is the time complexity of MergeSort derived via Master Theorem?",
          "options": [
            "O(N)",
            "O(N log N)",
            "O(N^2)",
            "O(log N)"
          ],
          "correctIndex": 1,
          "explanation": "T(N) = 2T(N/2) + O(N) matches Case 2 of Master Theorem, yielding O(N log N)."
        },
        {
          "id": "kc_dsa0_2",
          "question": "Why is QuickSort's worst-case time complexity O(N^2), and how does Randomized Pivot selection prevent it?",
          "options": [
            "QuickSort requires O(N) extra disk memory",
            "If the pivot is always the minimum or maximum element (e.g. sorted input with first element pivot), partitions become skewed (size 1 and N-1); randomizing pivots guarantees O(N log N) expected time",
            "QuickSort fails on negative numbers",
            "QuickSort cannot run on arrays larger than 1024 elements"
          ],
          "correctIndex": 1,
          "explanation": "Pathological inputs (already sorted arrays) cause standard QuickSort to recurse N times with N comparisons each. Choosing a random pivot prevents adversarial inputs from forcing worst-case splits."
        }
      ],
      "interactiveSandboxCode": "function measure(n) {\n  let ops = 0;\n  for (let i = 0; i < n; i++) ops++;\n  return ops;\n}\nconsole.log('Operations for N=100:', measure(100));\n"
    },
    {
      "id": "dsa_mod_1",
      "trackId": "dsa",
      "moduleIndex": 1,
      "title": "Arrays, Strings & Two-Pointer Techniques",
      "subtitle": "Contiguous Memory, In-Place Converging Pointers, Dynamic Sliding Windows, and Prefix Sums.",
      "estimatedTime": "55 mins",
      "icon": "dsa",
      "overview": "Fundamental linear data structures and optimization patterns. Master Two-Pointer convergence (left/right bounds, slow/fast runner), sliding window technique (fixed vs dynamic size), prefix sum arrays for O(1) range queries, and cyclic sort.",
      "sections": [
        {
          "title": "1. The Two-Pointer Technique: Converging Bounds & Partitioning",
          "content": "Two-pointer techniques reduce $O(N^2)$ brute-force nested loops down to optimal $O(N)$ linear time by leveraging sorted invariants. Pointers start at opposite ends and converge toward the center based on comparisons.",
          "codeExample": "// Two Sum on Sorted Array in O(N) time and O(1) space\nfunction twoSumSorted(arr, target) {\n    let left = 0, right = arr.length - 1;\n    while (left < right) {\n        const sum = arr[left] + arr[right];\n        if (sum === target) return [left, right];\n        if (sum < target) left++;\n        else right--;\n    }\n    return [];\n}"
        },
        {
          "title": "2. Sliding Window: Fixed vs Dynamic Windows",
          "content": "• Fixed-Size Window: Maintain a window of length K, sliding right by adding the incoming element and subtracting the outgoing element in O(1).\n• Dynamic-Size Window: Expand the right pointer to satisfy a condition; shrink the left pointer to restore validity (e.g. longest substring without repeating characters).",
          "codeExample": "// Longest Substring Without Repeating Characters in O(N)\nfunction lengthOfLongestSubstring(s) {\n    const lastSeen = new Map();\n    let maxLen = 0, left = 0;\n    for (let right = 0; right < s.length; right++) {\n        if (lastSeen.has(s[right])) {\n            left = Math.max(left, lastSeen.get(s[right]) + 1);\n        }\n        lastSeen.set(s[right], right);\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}"
        },
        {
          "title": "3. Prefix Sum Arrays for O(1) Range Queries",
          "content": "Pre-computing cumulative sums ($P[i] = P[i-1] + arr[i]$) allows querying the sum of any subarray from index $L$ to $R$ in strict $O(1)$ constant time via $P[R] - P[L-1]$, replacing $O(N)$ repeated loops.",
          "codeExample": "class PrefixSum {\n    constructor(nums) {\n        this.prefix = [0];\n        for (const n of nums) this.prefix.push(this.prefix[this.prefix.length - 1] + n);\n    }\n    queryRange(L, R) { return this.prefix[R + 1] - this.prefix[L]; }\n}"
        },
        {
          "title": "4. Slow and Fast Pointer (Floyd's Tortoise & Hare)",
          "content": "A slow pointer moves 1 step while a fast pointer moves 2 steps. Used to detect cycles in linked lists, find the middle node of a sequence in a single pass, or detect duplicate numbers.",
          "codeExample": "function findMiddleNode(head) {\n    let slow = head, fast = head;\n    while (fast && fast.next) {\n        slow = slow.next;\n        fast = fast.next.next;\n    }\n    return slow; // Points to middle element\n}"
        },
        {
          "title": "5. Production Pitfall: Off-by-One Boundary Errors",
          "content": "Always define whether your interval is inclusive `[left, right]` or half-open `[left, right)`. Mixing conventions causes infinite loops or array out-of-bounds index exceptions."
        }
      ],
      "codingExercise": {
        "taskTitle": "Longest Substring Without Repeating Characters",
        "functionName": "lengthOfLongestSubstring",
        "prompt": "Write a function that calculates the length of the longest substring without repeating characters using the dynamic sliding window pattern. Read a string from stdin and output the integer length.",
        "starterCode": "// Enter your code below\n",
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
            "input": "abcdef",
            "expectedOutput": "6",
            "isHidden": true
          },
          {
            "input": "aab",
            "expectedOutput": "2",
            "isHidden": true
          },
          {
            "input": "c",
            "expectedOutput": "1",
            "isHidden": true
          },
          {
            "input": "tmmzuxt",
            "expectedOutput": "5",
            "isHidden": true
          },
          {
            "input": "dvdf",
            "expectedOutput": "3",
            "isHidden": true
          },
          {
            "input": "anviaj",
            "expectedOutput": "5",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Sliding Window & Hash Maps",
        "inputFormat": "A single string s from stdin.",
        "outputFormat": "Integer length of the longest substring without repeating characters.",
        "constraints": [
          "0 <= s.length <= 5 * 10^4",
          "Time Complexity: O(N), Space: O(min(m, n))."
        ],
        "examples": [
          {
            "input": "abcabcbb",
            "output": "3",
            "explanation": "'abc' is the longest substring with length 3."
          },
          {
            "input": "bbbbb",
            "output": "1",
            "explanation": "'b' has length 1."
          }
        ],
        "hints": [
          "Use a sliding window with `start` and a Map of characters to last seen index."
        ],
        "title": "Longest Substring Without Repeating Characters",
        "objective": "Find the length of the longest substring without repeating characters using a sliding window and hash set in O(N) time.",
        "conceptualExplanation": [
          "Step 1: Initialize a sliding window using two pointers `left = 0` and `right = 0`.",
          "Step 2: Maintain a HashSet or Map storing unique characters currently in the window.",
          "Step 3: For each character at `right`, if character already exists in set, shrink window from `left` until duplicate is removed.",
          "Step 4: Add character at `right` to set and update `maxLength = Math.max(maxLength, right - left + 1)`.",
          "Step 5: Output `maxLength` after `right` reaches end of string."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "dsa1_q1",
            "question": "What is the time complexity of the Sliding Window technique when finding the max sum of sub-arrays of size K across an array of length N?",
            "options": [
              "O(N²)",
              "O(N)",
              "O(N log N)",
              "O(K²)"
            ],
            "correctIndex": 1,
            "explanation": "The sliding window updates the sum by subtracting the left element and adding the new right element in O(1) per step, yielding overall O(N) time."
          },
          {
            "id": "dsa1_q2",
            "question": "In what type of array does the Two-Pointer opposite-ends technique (left = 0, right = n-1) work to find a pair with a target sum?",
            "options": [
              "Any unordered array",
              "Sorted array",
              "Array containing only prime numbers",
              "Circular array only"
            ],
            "correctIndex": 1,
            "explanation": "The monotonic property of a sorted array ensures pointer movements predictably increase or decrease the sum."
          },
          {
            "id": "dsa1_q3",
            "question": "What is a Prefix Sum array used for?",
            "options": [
              "To sort an array in O(N)",
              "To answer range sum queries `sum(L, R)` in constant O(1) time after O(N) precomputation",
              "To reverse an array",
              "To find prime numbers"
            ],
            "correctIndex": 1,
            "explanation": "Prefix sum precalculates cumulative sums, allowing `sum(L, R) = prefix[R] - prefix[L - 1]` in O(1) time."
          },
          {
            "id": "dsa1_q4",
            "question": "What is Floyd's Cycle-Finding Algorithm (Tortoise and Hare)?",
            "options": [
              "A sorting algorithm",
              "A two-pointer technique using slow and fast runners to detect loops in linked lists in O(N) time and O(1) space",
              "A string compression algorithm",
              "A graph shortest path algorithm"
            ],
            "correctIndex": 1,
            "explanation": "Floyd's algorithm uses pointers moving at 1x and 2x speeds to detect cyclic loops."
          },
          {
            "id": "dsa1_q5",
            "question": "What is the space complexity of an algorithm that removes duplicates in-place from a sorted array?",
            "options": [
              "O(N)",
              "O(1)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 1,
            "explanation": "In-place modifications use constant O(1) auxiliary space beyond the input buffer."
          },
          {
            "id": "dsa1_q6",
            "question": "How does a dynamic sliding window contract when the window invariant is violated?",
            "options": [
              "The left pointer advances forward to shrink the window",
              "The right pointer resets to 0",
              "The array is cleared",
              "The algorithm restarts"
            ],
            "correctIndex": 0,
            "explanation": "When an invalid condition occurs (e.g. character duplicate), `left` moves forward until the window is valid again."
          },
          {
            "id": "dsa1_q7",
            "question": "What is the time complexity of reversing a string of length N in-place using two pointers?",
            "options": [
              "O(N²)",
              "O(N)",
              "O(log N)",
              "O(1)"
            ],
            "correctIndex": 1,
            "explanation": "Two pointers converge toward the center, swapping N/2 pairs in linear O(N) time."
          },
          {
            "id": "dsa1_q8",
            "question": "What algorithm solves the Dutch National Flag problem (sorting an array of 0s, 1s, and 2s) in a single linear pass?",
            "options": [
              "Three-pointer partition in O(N) time and O(1) space",
              "MergeSort",
              "Binary Search",
              "Hash Map counter"
            ],
            "correctIndex": 0,
            "explanation": "Dijkstra's Dutch National Flag algorithm uses low, mid, and high pointers to partition elements in one pass."
          },
          {
            "id": "dsa1_q9",
            "question": "Can binary search be applied to an unsorted array directly?",
            "options": [
              "Yes, always",
              "No, binary search requires elements to follow a monotonic sorted order",
              "Only if array has even length",
              "Only with strings"
            ],
            "correctIndex": 1,
            "explanation": "Binary search requires sorted or monotonic order to determine whether to discard the left or right half."
          },
          {
            "id": "dsa1_q10",
            "question": "What is the space complexity of calculating the Prefix Sum array for an array of size N if stored in a new array?",
            "options": [
              "O(1)",
              "O(N)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 1,
            "explanation": "Storing N cumulative prefix sums requires O(N) auxiliary space."
          }
        ]
      },
      "references": [
        {
          "title": "LeetCode Explore — Array and String Techniques",
          "url": "https://leetcode.com/explore/learn/card/array-and-string/",
          "source": "LeetCode",
          "category": "Interactive Practice",
          "description": "Curated algorithmic problem set covering two pointers and sliding window."
        },
        {
          "title": "GeeksforGeeks — Window Sliding Technique",
          "url": "https://www.geeksforgeeks.org/window-sliding-technique/",
          "source": "GeeksforGeeks",
          "category": "Technical Tutorial",
          "description": "Clear visual explanations of sliding window optimization."
        },
        {
          "title": "The Art of Computer Programming, Volume 2: Seminumerical Algorithms",
          "url": "https://www-cs-faculty.stanford.edu/~knuth/taocp.html",
          "source": "Donald E. Knuth / Addison-Wesley",
          "category": "Foundational Computer Science Literature",
          "description": "Seminal mathematical treatment of cycle detection algorithms and pseudo-random sequence properties."
        }
      ],
      "keyTakeaways": [
        "Two-pointer techniques reduce $O(N^2)$ checks to $O(N)$ on sorted inputs.",
        "Sliding window maintains state incrementally as boundaries shift.",
        "Prefix sums allow $O(1)$ range sum lookups after $O(N)$ preprocessing.",
        "Slow/fast pointer finds middle elements and cycles in a single pass."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_dsa1_1",
          "question": "What is the time complexity of querying a range sum using a precomputed prefix sum array?",
          "options": [
            "O(N)",
            "O(1)",
            "O(log N)",
            "O(N^2)"
          ],
          "correctIndex": 1,
          "explanation": "Prefix sum queries require only a single subtraction (P[R] - P[L-1]) in O(1) time."
        },
        {
          "id": "kc_dsa1_2",
          "question": "How does Floyd's Tortoise and Hare algorithm detect a cycle in a singly linked list in O(1) auxiliary space?",
          "options": [
            "It reverses the pointers in place",
            "Slow pointer advances 1 step while fast advances 2 steps; if a cycle exists, the distance between them decreases by 1 each step until they meet inside the loop",
            "It computes cryptographic SHA-256 hashes of every node address",
            "It counts total nodes and checks if count exceeds 1,000,000"
          ],
          "correctIndex": 1,
          "explanation": "In modular arithmetic, moving at relative speed 1 inside a loop of length L guarantees the fast pointer laps the slow pointer in at most L steps without any hash table allocations."
        }
      ],
      "interactiveSandboxCode": "const nums = [1, 2, 3, 4, 5];\nconst prefix = [0];\nnums.forEach(n => prefix.push(prefix[prefix.length - 1] + n));\nconsole.log('Sum index 1 to 3:', prefix[4] - prefix[1]); // 2 + 3 + 4 = 9\n"
    },
    {
      "id": "dsa_mod_2",
      "trackId": "dsa",
      "moduleIndex": 2,
      "title": "Stacks, Queues & Linked List Architectures",
      "subtitle": "Monotonic Stacks, Ring Buffers, Singly/Doubly Linked Lists, and LRU Cache Architecture.",
      "estimatedTime": "55 mins",
      "icon": "dsa",
      "overview": "Master linear data structure mechanics. Understand Stacks (LIFO) and Monotonic Stacks for Next Greater Element problems in O(N), Queues (FIFO) with circular ring buffers, Doubly Linked Lists with sentinel nodes, and implementing a production-grade Least Recently Used (LRU) Cache in O(1).",
      "sections": [
        {
          "title": "1. Monotonic Stacks: Next Greater Element in O(N)",
          "content": "A Monotonic Stack maintains elements in strictly increasing or decreasing order. When encountering an element that violates the monotonic order, we pop and resolve answers for all smaller elements, reducing $O(N^2)$ lookups to $O(N)$ linear time.",
          "codeExample": "function nextGreaterElements(nums) {\n    const res = new Array(nums.length).fill(-1);\n    const stack = []; // Monotonic decreasing stack of indices\n    for (let i = 0; i < nums.length; i++) {\n        while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {\n            const idx = stack.pop();\n            res[idx] = nums[i];\n        }\n        stack.push(i);\n    }\n    return res;\n}\nconsole.log(nextGreaterElements([2, 1, 2, 4, 3])); // [4, 2, 4, -1, -1]"
        },
        {
          "title": "2. Circular Queues & Lock-Free Ring Buffers",
          "content": "A Circular Queue uses a fixed-size array with `head` and `tail` pointers that wrap around using modulo arithmetic (`(tail + 1) % capacity`). This eliminates shifting elements in memory and supports lock-free single-producer single-consumer (SPSC) concurrency.",
          "codeExample": "class RingBuffer {\n    constructor(size) {\n        this.buf = new Array(size);\n        this.head = 0; this.tail = 0; this.size = size;\n    }\n    enqueue(val) {\n        this.buf[this.tail] = val;\n        this.tail = (this.tail + 1) % this.size;\n    }\n}"
        },
        {
          "title": "3. Doubly Linked Lists & Sentinel Nodes",
          "content": "Sentinel dummy nodes (`head` and `tail`) eliminate edge cases when inserting or deleting nodes at boundaries, removing null-check branching logic.",
          "codeExample": "class Node { constructor(k, v) { this.k = k; this.v = v; this.prev = null; this.next = null; } }\nclass DoublyLinkedList {\n    constructor() {\n        this.head = new Node(0, 0); this.tail = new Node(0, 0);\n        this.head.next = this.tail; this.tail.prev = this.head;\n    }\n    remove(node) { node.prev.next = node.next; node.next.prev = node.prev; }\n    addToFront(node) {\n        node.next = this.head.next; node.prev = this.head;\n        this.head.next.prev = node; this.head.next = node;\n    }\n}"
        },
        {
          "title": "4. LRU Cache Implementation in O(1) Time",
          "content": "An LRU Cache combines a Hash Map (for O(1) key lookups) and a Doubly Linked List (for O(1) node reordering and eviction of the least recently used item).",
          "codeExample": "class LRUCache {\n    constructor(capacity) {\n        this.cap = capacity; this.map = new Map();\n        this.dll = new DoublyLinkedList();\n    }\n    get(key) {\n        if (!this.map.has(key)) return -1;\n        const node = this.map.get(key);\n        this.dll.remove(node); this.dll.addToFront(node); // Mark recently used\n        return node.v;\n    }\n}"
        },
        {
          "title": "5. Production Trade-Offs",
          "content": "Linked lists have significant pointer overhead (16 bytes per node on 64-bit) and poor cache locality. Use arrays or deques unless constant O(1) splicing and reordering is strictly required."
        }
      ],
      "codingExercise": {
        "taskTitle": "Valid Parentheses with Stack",
        "functionName": "isValid",
        "prompt": "Write a function `isValid(s)` that determines if an input string of brackets `()[]{}` is valid using a Stack. Read a string from stdin and output true or false.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
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
            "input": "([{}])",
            "expectedOutput": "true",
            "isHidden": false
          },
          {
            "input": "((((",
            "expectedOutput": "false",
            "isHidden": true
          },
          {
            "input": "()",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "{[]}",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "([)]",
            "expectedOutput": "false",
            "isHidden": true
          },
          {
            "input": "]",
            "expectedOutput": "false",
            "isHidden": true
          },
          {
            "input": "(([]){})",
            "expectedOutput": "true",
            "isHidden": true
          },
          {
            "input": "{[()]}",
            "expectedOutput": "true",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Stacks & Bracket Balance Invariants",
        "inputFormat": "A string consisting only of brackets '()[]{}'.",
        "outputFormat": "Print 'true' if valid, otherwise 'false'.",
        "constraints": [
          "1 <= s.length <= 10^4",
          "Stack must be empty at the end."
        ],
        "examples": [
          {
            "input": "()[]{}",
            "output": "true",
            "explanation": "All bracket types are closed in correct sequence."
          },
          {
            "input": "(]",
            "output": "false",
            "explanation": "Mismatched bracket pair."
          }
        ],
        "hints": [
          "Push opening brackets onto stack.",
          "On closing bracket, check stack.pop() matches."
        ],
        "title": "Valid Parentheses with Stack",
        "objective": "Validate whether an input string containing bracket symbols '()[]{}' has balanced matching pairs using a stack.",
        "conceptualExplanation": [
          "Step 1: Initialize an empty stack `stack = []`.",
          "Step 2: Map closing brackets to opening brackets: `')' -> '(', '}' -> '{', ']' -> '['`.",
          "Step 3: Iterate through each character in the string: if opening bracket, push to stack.",
          "Step 4: If closing bracket, pop top of stack and check if it matches corresponding opening bracket. If not, return false.",
          "Step 5: After string ends, return `true` if stack is empty, else `false`."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "dsa2_q1",
            "question": "What is the time complexity of pushing an element onto a stack implemented via a linked list?",
            "options": [
              "O(N)",
              "O(1)",
              "O(log N)",
              "O(N log N)"
            ],
            "correctIndex": 1,
            "explanation": "Inserting a new node at the head of a linked list is a constant O(1) pointer assignment."
          },
          {
            "id": "dsa2_q2",
            "question": "Which data structure follows the First-In, First-Out (FIFO) principle?",
            "options": [
              "Stack",
              "Queue",
              "Binary Heap",
              "Hash Map"
            ],
            "correctIndex": 1,
            "explanation": "A Queue processes elements in FIFO order: first inserted is first removed."
          },
          {
            "id": "dsa2_q3",
            "question": "What is the space complexity of reversing a singly linked list in-place using three pointers?",
            "options": [
              "O(N)",
              "O(1)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 1,
            "explanation": "In-place reversal uses three scalar pointers (prev, curr, next), consuming O(1) auxiliary space."
          },
          {
            "id": "dsa2_q4",
            "question": "How can a Queue be implemented using two Stacks (inbox and outbox)?",
            "options": [
              "Push to inbox; on pop, if outbox is empty, pop all elements from inbox and push to outbox",
              "Merge both stacks into an array",
              "Alternate pushes between stacks",
              "Not possible"
            ],
            "correctIndex": 0,
            "explanation": "Pouring elements from inbox to outbox reverses their order, providing amortized O(1) FIFO operations."
          },
          {
            "id": "dsa2_q5",
            "question": "What is the total time complexity of finding the Next Greater Element for all N elements using a Monotonic Stack?",
            "options": [
              "O(N²)",
              "O(N)",
              "O(N log N)",
              "O(1)"
            ],
            "correctIndex": 1,
            "explanation": "Each index is pushed onto and popped from the stack at most once, resulting in linear O(N) runtime."
          },
          {
            "id": "dsa2_q6",
            "question": "What is a circular queue?",
            "options": [
              "A queue with a cycle bug",
              "A fixed-size FIFO buffer that reuses vacated head slots by wrapping indices using modulo arithmetic",
              "A doubly linked list",
              "A recursive queue"
            ],
            "correctIndex": 1,
            "explanation": "Circular queues wrap indices around using `(rear + 1) % capacity` to reuse freed buffer space."
          },
          {
            "id": "dsa2_q7",
            "question": "In a doubly linked list, how many pointers does each node maintain?",
            "options": [
              "One",
              "Two (prev and next)",
              "Three",
              "Zero"
            ],
            "correctIndex": 1,
            "explanation": "Each node in a doubly linked list maintains pointers to both its predecessor (`prev`) and successor (`next`)."
          },
          {
            "id": "dsa2_q8",
            "question": "What happens when an algorithm attempts to pop an element from an empty stack?",
            "options": [
              "Stack Overflow",
              "Stack Underflow",
              "Memory Leak",
              "Deadlock"
            ],
            "correctIndex": 1,
            "explanation": "Popping from an empty stack causes a Stack Underflow condition."
          },
          {
            "id": "dsa2_q9",
            "question": "How does Floyd's Tortoise and Hare algorithm detect the start of a cycle in a linked list after intersection?",
            "options": [
              "Reset one pointer to head; advance both one step at a time until they meet again",
              "Reverse the list",
              "Sort the addresses",
              "Count total nodes"
            ],
            "correctIndex": 0,
            "explanation": "Mathematical analysis proves that moving one pointer to head and stepping both at 1x intersects exactly at the cycle start."
          },
          {
            "id": "dsa2_q10",
            "question": "Which data structure is ideal for tracking browser history (Back button navigation)?",
            "options": [
              "Queue",
              "Stack",
              "Binary Tree",
              "Hash Set"
            ],
            "correctIndex": 1,
            "explanation": "A Stack's LIFO property naturally models visiting and unwinding page history."
          }
        ]
      },
      "references": [
        {
          "title": "LeetCode 146 — LRU Cache",
          "url": "https://leetcode.com/problems/lru-cache/",
          "source": "LeetCode",
          "category": "Benchmark Problem",
          "description": "Classic industry problem implementing O(1) get and put operations."
        },
        {
          "title": "GeeksforGeeks — Monotonic Stack",
          "url": "https://www.geeksforgeeks.org/introduction-to-monotonic-stack-2/",
          "source": "GeeksforGeeks",
          "category": "Technical Tutorial",
          "description": "Complete analysis of monotonic stack patterns."
        },
        {
          "title": "Algorithms (4th Edition) — Balanced Search Trees",
          "url": "https://algs4.cs.princeton.edu/33balanced/",
          "source": "Robert Sedgewick & Kevin Wayne / Princeton University",
          "category": "Academic Reference",
          "description": "Clear algorithmic visualization of red-black trees, AVL trees, and 2-3 search tree transformations."
        }
      ],
      "keyTakeaways": [
        "Monotonic stacks resolve Next Greater / Smaller element problems in $O(N)$ time.",
        "Circular ring buffers support O(1) queue operations without memory reallocations.",
        "Sentinel dummy nodes eliminate null-check edge cases in linked lists.",
        "An LRU cache achieves O(1) lookups and evictions by combining a Hash Map and a Doubly Linked List."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_dsa2_1",
          "question": "What data structures combine to build an LRU Cache with O(1) get and put operations?",
          "options": [
            "Array and Stack",
            "Hash Map and Doubly Linked List",
            "Binary Search Tree and Queue",
            "Trie and Heap"
          ],
          "correctIndex": 1,
          "explanation": "A Hash Map provides O(1) lookups, while a Doubly Linked List provides O(1) node reordering and tail eviction."
        },
        {
          "id": "kc_dsa2_2",
          "question": "What is the defining invariant of an AVL tree compared to a standard Binary Search Tree?",
          "options": [
            "All keys must be prime numbers",
            "For every node, the height difference between left and right subtrees (balance factor) cannot exceed 1, guaranteeing strictly O(log N) operations",
            "Nodes cannot have more than 1 child",
            "Leaves must all be colored red"
          ],
          "correctIndex": 1,
          "explanation": "By maintaining |height(left) - height(right)| <= 1 using tree rotations on insertion/deletion, AVL trees prevent tree degeneration into O(N) linked lists."
        }
      ],
      "interactiveSandboxCode": "const stack = [];\nstack.push(10); stack.push(20);\nconsole.log('Popped:', stack.pop()); // 20\n"
    },
    {
      "id": "dsa_mod_3",
      "trackId": "dsa",
      "moduleIndex": 3,
      "title": "Binary Trees, Binary Search Trees & Tree Traversals",
      "subtitle": "Tree Traversals (DFS/BFS), Binary Search Tree Invariants, Graph Representations, and Dijkstra.",
      "estimatedTime": "55 mins",
      "icon": "dsa",
      "overview": "Hierarchical and network data structures. Master tree traversals (DFS Pre/In/Post-order recursive and iterative, BFS level-order), Binary Search Tree (BST) invariants, Graph representations (Adjacency List vs Matrix), topological sorting (Kahn's algorithm), and Dijkstra's shortest path algorithm.",
      "sections": [
        {
          "title": "1. Binary Tree Traversals: DFS vs BFS",
          "content": "• Depth-First Search (DFS):\n  - Pre-order (Node -> Left -> Right): Cloning trees, serialization.\n  - In-order (Left -> Node -> Right): Yields elements of a BST in sorted ascending order.\n  - Post-order (Left -> Right -> Node): Deleting nodes, evaluating postfix expressions.\n• Breadth-First Search (BFS): Traverses level by level using a FIFO queue.",
          "codeExample": "function inorderTraversal(root) {\n    const res = [];\n    function dfs(node) {\n        if (!node) return;\n        dfs(node.left);\n        res.push(node.val); // In-order visitor\n        dfs(node.right);\n    }\n    dfs(root);\n    return res;\n}"
        },
        {
          "title": "2. Binary Search Tree (BST) Invariants & Validation",
          "content": "A valid BST requires that for EVERY node, all values in its left subtree are strictly less than node.val, and all values in its right subtree are strictly greater. Validating requires passing down valid `(min, max)` ranges.",
          "codeExample": "function isValidBST(root, min = -Infinity, max = Infinity) {\n    if (!root) return true;\n    if (root.val <= min || root.val >= max) return false;\n    return isValidBST(root.left, min, root.val) && isValidBST(root.right, root.val, max);\n}"
        },
        {
          "title": "3. Graph Representations: Adjacency List vs Adjacency Matrix",
          "content": "• Adjacency List: Array or map of neighbor lists. Space complexity: $O(V + E)$. Ideal for sparse graphs.\n• Adjacency Matrix: 2D boolean array $V \\times V$. Space complexity: $O(V^2)$. Allows O(1) edge existence queries, but wastes memory on sparse graphs.",
          "codeExample": "// Adjacency List Representation\nconst graph = new Map();\nfunction addEdge(u, v) {\n    if (!graph.has(u)) graph.set(u, []);\n    graph.get(u).push(v);\n}"
        },
        {
          "title": "4. Dijkstra's Shortest Path Algorithm",
          "content": "Finds the shortest path from a starting node to all other nodes in a weighted graph with non-negative edge weights. Operates greedily using a Min-Heap (Priority Queue) in $O((V + E) \\log V)$ time.",
          "codeExample": "// Dijkstra prioritizes processing the closest unvisited vertex using a min-heap"
        },
        {
          "title": "5. Topological Sort (Kahn's Algorithm for DAGs)",
          "content": "Computes a linear ordering of tasks matching prerequisite dependencies. Calculates in-degrees for all vertices and iteratively enqueues nodes with in-degree 0. If processed count < V, a cycle exists."
        }
      ],
      "codingExercise": {
        "taskTitle": "Maximum Depth of Binary Tree",
        "functionName": "maxDepth",
        "prompt": "Write a function that calculates the maximum depth (height) of a binary tree represented as an array in breadth-first level order. Read JSON array from stdin and print the maximum integer depth.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[3, 9, 20, null, null, 15, 7]",
            "expectedOutput": "3",
            "isHidden": false
          },
          {
            "input": "[1]",
            "expectedOutput": "1",
            "isHidden": false
          },
          {
            "input": "[]",
            "expectedOutput": "0",
            "isHidden": false
          },
          {
            "input": "[1, 2, 3, 4, 5, 6, 7, 8]",
            "expectedOutput": "4",
            "isHidden": true
          },
          {
            "input": "[1, 2, null, 3, null, 4]",
            "expectedOutput": "3",
            "isHidden": true
          },
          {
            "input": "[1, null, 2, null, 3]",
            "expectedOutput": "3",
            "isHidden": true
          },
          {
            "input": "[1, 2, 3]",
            "expectedOutput": "2",
            "isHidden": true
          },
          {
            "input": "[1, 2, 3, 4, null, null, 5]",
            "expectedOutput": "3",
            "isHidden": true
          },
          {
            "input": "[10, 5, 15, null, null, 12, 20]",
            "expectedOutput": "3",
            "isHidden": true
          },
          {
            "input": "[1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, null, null, 5]",
            "expectedOutput": "5",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Binary Trees & Breadth-First Level Traversal",
        "inputFormat": "JSON array representing binary tree in level-order.",
        "outputFormat": "Maximum integer depth of the tree.",
        "constraints": [
          "Tree nodes <= 10^4."
        ],
        "examples": [
          {
            "input": "[3, 9, 20, null, null, 15, 7]",
            "output": "3",
            "explanation": "Tree has 3 levels: [3] -> [9, 20] -> [15, 7]."
          },
          {
            "input": "[1]",
            "output": "1",
            "explanation": "Root node only has depth 1."
          }
        ],
        "hints": [
          "Child indices for index i: left = 2*i + 1, right = 2*i + 2.",
          "Calculate max depth recursively or iteratively."
        ],
        "title": "Maximum Depth of Binary Tree",
        "objective": "Compute the maximum depth (height) of a binary tree given its serialized level-order representation.",
        "conceptualExplanation": [
          "Step 1: Parse serialized level-order tree input from stdin.",
          "Step 2: If root is null, depth is 0.",
          "Step 3: Recursively compute depth: `maxDepth(node) = 1 + max(maxDepth(node.left), maxDepth(node.right))`.",
          "Step 4: Alternatively use BFS queue level-by-level, incrementing level counter per tier.",
          "Step 5: Output integer maximum depth."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "dsa3_q1",
            "question": "What property is guaranteed by performing an In-Order traversal (Left, Root, Right) on a valid Binary Search Tree (BST)?",
            "options": [
              "Nodes are visited in descending order",
              "Nodes are visited in strictly ascending sorted order",
              "Leaves are visited before roots",
              "Nodes are visited level by level"
            ],
            "correctIndex": 1,
            "explanation": "In-order traversal of a BST always yields keys in non-decreasing sorted order."
          },
          {
            "id": "dsa3_q2",
            "question": "What is the worst-case time complexity of searching for a value in an unbalanced (skewed) BST with N nodes?",
            "options": [
              "O(1)",
              "O(log N)",
              "O(N)",
              "O(N log N)"
            ],
            "correctIndex": 2,
            "explanation": "A degenerately unbalanced BST resembles a linked list, degrading search to linear O(N) time."
          },
          {
            "id": "dsa3_q3",
            "question": "What data structure is standardly used to implement Level-Order (BFS) traversal of a tree?",
            "options": [
              "Stack",
              "Queue",
              "Priority Queue",
              "Hash Map"
            ],
            "correctIndex": 1,
            "explanation": "Level-order traversal requires a FIFO Queue to process nodes layer by layer."
          },
          {
            "id": "dsa3_q4",
            "question": "What is the maximum number of nodes in a full binary tree of height H (where root is height 0)?",
            "options": [
              "2^H",
              "2^(H + 1) - 1",
              "H²",
              "2 * H"
            ],
            "correctIndex": 1,
            "explanation": "A full binary tree contains sum(2^i) from i=0 to H, which equals 2^(H+1) - 1 nodes."
          },
          {
            "id": "dsa3_q5",
            "question": "What is the time complexity of searching a balanced BST (such as an AVL or Red-Black Tree) with N nodes?",
            "options": [
              "O(1)",
              "O(log N)",
              "O(N)",
              "O(N²)"
            ],
            "correctIndex": 1,
            "explanation": "Balanced BSTs guarantee maximum height of O(log N), keeping search in logarithmic time."
          },
          {
            "id": "dsa3_q6",
            "question": "Which tree traversal order visits the root node AFTER visiting both of its subtrees?",
            "options": [
              "Pre-order",
              "In-order",
              "Post-order",
              "Level-order"
            ],
            "correctIndex": 2,
            "explanation": "Post-order traversal visits Left, Right, and then Root."
          },
          {
            "id": "dsa3_q7",
            "question": "What defines a self-balancing binary search tree like an AVL Tree?",
            "options": [
              "All leaf nodes are at depth 0",
              "The height difference (balance factor) between left and right subtrees of any node is at most 1",
              "It contains only 2 nodes",
              "It has no right children"
            ],
            "correctIndex": 1,
            "explanation": "AVL trees enforce balance factor `|height(left) - height(right)| <= 1` using tree rotations."
          },
          {
            "id": "dsa3_q8",
            "question": "What is the lowest common ancestor (LCA) of two nodes p and q in a tree?",
            "options": [
              "The root node always",
              "The deepest node that has both p and q as descendants",
              "The leaf node",
              "The sibling node"
            ],
            "correctIndex": 1,
            "explanation": "LCA is defined as the lowest node in T that has both p and q as descendants."
          },
          {
            "id": "dsa3_q9",
            "question": "What is a leaf node in a binary tree?",
            "options": [
              "A node with a single child",
              "A node with no children (left == null and right == null)",
              "The top root node",
              "A node with value 0"
            ],
            "correctIndex": 1,
            "explanation": "Leaf nodes are terminal nodes with degree 0."
          },
          {
            "id": "dsa3_q10",
            "question": "What operation is used to restore balance in an AVL tree after an insertion?",
            "options": [
              "Tree rotations (Left, Right, Left-Right, Right-Left)",
              "Array resize",
              "Hash re-indexing",
              "Linear search"
            ],
            "correctIndex": 0,
            "explanation": "AVL trees perform single or double tree rotations in O(1) time to restore the balance factor."
          }
        ]
      },
      "references": [
        {
          "title": "MIT OpenCourseWare — Graph Algorithms: BFS, DFS, Shortest Paths",
          "url": "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
          "source": "MIT",
          "category": "Academic Curriculum",
          "description": "Deep conceptual lectures on graph algorithms."
        },
        {
          "title": "LeetCode Explore — Binary Search Tree",
          "url": "https://leetcode.com/explore/learn/card/introduction-to-data-structure-binary-search-tree/",
          "source": "LeetCode",
          "category": "Interactive Practice",
          "description": "Curated problem card covering BST search, insertion, and validation."
        },
        {
          "title": "Network Flows: Theory, Algorithms, and Applications",
          "url": "https://openlibrary.org/books/OL1402279M/Network_flows",
          "source": "Ahuja, Magnanti, Orlin / Prentice Hall",
          "category": "Academic Reference",
          "description": "Standard treatise on shortest-path algorithms, min-cost flows, and graph optimization."
        }
      ],
      "keyTakeaways": [
        "In-order traversal of a valid BST always produces values in sorted order.",
        "Always validate BSTs by passing down strict `(min, max)` bounds.",
        "Adjacency lists use $O(V + E)$ space, outperforming $O(V^2)$ matrices on sparse graphs.",
        "Dijkstra's algorithm finds shortest paths in $O((V + E) \\log V)$ using a Min-Heap."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_dsa3_1",
          "question": "What traversal order produces sorted elements when run on a valid Binary Search Tree?",
          "options": [
            "Pre-order",
            "In-order",
            "Post-order",
            "Level-order (BFS)"
          ],
          "correctIndex": 1,
          "explanation": "In-order traversal visits (Left, Root, Right), which traverses a BST in strictly sorted numerical order."
        },
        {
          "id": "kc_dsa3_2",
          "question": "Why does Dijkstra's algorithm fail to find the shortest path on graphs containing negative edge weights?",
          "options": [
            "Dijkstra uses too much heap memory",
            "Dijkstra greedily assumes once a vertex is marked finalized/visited with minimum distance, its distance cannot decrease; negative edges invalidate this greedy assumption",
            "Priority queues in computer science cannot accept negative numbers",
            "Dijkstra only works on directed trees"
          ],
          "correctIndex": 1,
          "explanation": "Dijkstra is a greedy algorithm based on non-decreasing path lengths. A negative edge can retroactively make an already-finalized path shorter. For negative weights, the Bellman-Ford algorithm must be used."
        }
      ],
      "interactiveSandboxCode": "const bst = { val: 2, left: { val: 1 }, right: { val: 3 } };\nconsole.log('Root:', bst.val, 'Left:', bst.left.val, 'Right:', bst.right.val);\n"
    },
    {
      "id": "dsa_mod_4",
      "trackId": "dsa",
      "moduleIndex": 4,
      "title": "Sorting Algorithms, Binary Search & Divide and Conquer",
      "subtitle": "MergeSort, QuickSort, Timsort, Binary Search on Monotonic Predicates, and Dynamic Programming.",
      "estimatedTime": "55 mins",
      "icon": "dsa",
      "overview": "High-efficiency sorting, searching, and optimization. Master QuickSort partitioning (Lomuto vs Hoare), MergeSort divide-and-conquer, Python/Java Timsort hybrid mechanics, Binary Search on monotonic condition spaces, and Dynamic Programming (memoization vs tabulation).",
      "sections": [
        {
          "title": "1. QuickSort vs MergeSort: Mechanics & Space-Time Trade-offs",
          "content": "• MergeSort: Divides array in half, recursively sorts, and merges in linear time. Time: Guaranteed $\\Theta(N \\log N)$, Auxiliary Space: $O(N)$ for merge buffer. Stable.\n• QuickSort: Picks a pivot, partitions elements into `< pivot` and `> pivot`. Time: Average $O(N \\log N)$, Worst-case $O(N^2)$ (sorted input with bad pivot). Auxiliary Space: $O(\\log N)$ in-place stack. Unstable.",
          "codeExample": "function mergeSort(arr) {\n    if (arr.length <= 1) return arr;\n    const mid = Math.floor(arr.length / 2);\n    const left = mergeSort(arr.slice(0, mid));\n    const right = mergeSort(arr.slice(mid));\n    return merge(left, right);\n}\nfunction merge(left, right) {\n    let res = [], i = 0, j = 0;\n    while (i < left.length && j < right.length) {\n        if (left[i] <= right[j]) res.push(left[i++]);\n        else res.push(right[j++]);\n    }\n    return res.concat(left.slice(i)).concat(right.slice(j));\n}"
        },
        {
          "title": "2. Timsort: The Production Standard (Python & Java)",
          "content": "Timsort is a hybrid adaptive sorting algorithm combining MergeSort and InsertionSort. It detects already-sorted runs in the input data. Small runs (< 32 elements) are sorted via InsertionSort (benefiting from CPU cache locality), and merged using a balanced stack, achieving $O(N)$ best-case time on real-world partially sorted datasets.",
          "codeExample": "// Timsort achieves O(N) on partially sorted data and O(N log N) worst-case."
        },
        {
          "title": "3. Binary Search on Answer Spaces (Monotonic Predicates)",
          "content": "Binary Search is not limited to sorted arrays. Any problem with a monotonic boolean predicate (`false, false, false, true, true, true`) can be solved in $O(\\log(\\text{range}))$ time by testing the midpoint and halving the search space.",
          "codeExample": "// Binary Search Template\nfunction binarySearchFirstTrue(low, high, checkFn) {\n    while (low < high) {\n        const mid = Math.floor(low + (high - low) / 2);\n        if (checkFn(mid)) high = mid; // Answer is mid or to the left\n        else low = mid + 1;           // Answer is strictly to the right\n    }\n    return low;\n}"
        },
        {
          "title": "4. Dynamic Programming: Memoization vs Tabulation",
          "content": "DP applies when a problem exhibits Optimal Substructure and Overlapping Subproblems:\n• Top-Down Memoization: Recursive approach that caches computed subproblem results in a hash map or array.\n• Bottom-Up Tabulation: Iterative approach that fills a DP table from base cases up, often allowing space optimization from $O(N)$ to $O(1)$.",
          "codeExample": "// 0/1 Knapsack & Fibonacci tabulation in O(N) time and O(1) space\nfunction fibOptimized(n) {\n    if (n < 2) return n;\n    let prev2 = 0, prev1 = 1;\n    for (let i = 2; i <= n; i++) {\n        const curr = prev1 + prev2;\n        prev2 = prev1;\n        prev1 = curr;\n    }\n    return prev1;\n}"
        },
        {
          "title": "5. Production Best Practices",
          "content": "• Always compute midpoints using `low + Math.floor((high - low) / 2)` to prevent 32-bit integer overflow bugs (`(low + high) / 2` can overflow in C++/Java).\n• Identify whether an algorithm requires stability (preserving equal-key ordering) before choosing between QuickSort and MergeSort."
        }
      ],
      "codingExercise": {
        "taskTitle": "Binary Search: Find First and Last Position",
        "functionName": "searchRange",
        "prompt": "Write a function that finds the starting and ending position of a target in a sorted JSON array from stdin. Read input `[nums, target]`, output `[start, end]` or `[-1, -1]`.",
        "starterCode": "// Enter your code below\n",
        "testCases": [
          {
            "input": "[[5, 7, 7, 8, 8, 10], 8]",
            "expectedOutput": "[3,4]",
            "isHidden": false
          },
          {
            "input": "[[5, 7, 7, 8, 8, 10], 6]",
            "expectedOutput": "[-1,-1]",
            "isHidden": false
          },
          {
            "input": "[[1, 1, 1, 1], 1]",
            "expectedOutput": "[0,3]",
            "isHidden": false
          },
          {
            "input": "[[1], 1]",
            "expectedOutput": "[0,0]",
            "isHidden": true
          },
          {
            "input": "[[1], 2]",
            "expectedOutput": "[-1,-1]",
            "isHidden": true
          },
          {
            "input": "[[], 0]",
            "expectedOutput": "[-1,-1]",
            "isHidden": true
          },
          {
            "input": "[[2, 2], 2]",
            "expectedOutput": "[0,1]",
            "isHidden": true
          },
          {
            "input": "[[1, 3, 5, 7], 5]",
            "expectedOutput": "[2,2]",
            "isHidden": true
          },
          {
            "input": "[[1, 2, 3, 4, 5], 6]",
            "expectedOutput": "[-1,-1]",
            "isHidden": true
          },
          {
            "input": "[[2, 4, 4, 4, 4, 6], 4]",
            "expectedOutput": "[1,4]",
            "isHidden": true
          }
        ],
        "difficulty": "Medium",
        "category": "Binary Search & Range Bounds",
        "inputFormat": "JSON array `[nums, target]` where nums is sorted.",
        "outputFormat": "JSON array `[start, end]` of indices or `[-1, -1]`.",
        "constraints": [
          "O(log N) runtime complexity required."
        ],
        "examples": [
          {
            "input": "[[5, 7, 7, 8, 8, 10], 8]",
            "output": "[3,4]",
            "explanation": "8 first appears at index 3 and ends at index 4."
          },
          {
            "input": "[[5, 7, 7, 8, 8, 10], 6]",
            "output": "[-1,-1]",
            "explanation": "6 does not exist in array."
          }
        ],
        "hints": [
          "Run two binary searches: one for the leftmost bound, one for rightmost bound."
        ],
        "title": "Binary Search: Find First and Last Position",
        "objective": "Find the first and last position of a target element in a sorted array using binary search in O(log N) time.",
        "conceptualExplanation": [
          "Step 1: Use binary search to find first occurrence: when `arr[mid] == target`, record `first = mid` and search left half `right = mid - 1`.",
          "Step 2: Use binary search to find last occurrence: when `arr[mid] == target`, record `last = mid` and search right half `left = mid + 1`.",
          "Step 3: If target not found in first search, return `[-1, -1]` immediately.",
          "Step 4: Output `[first, last]` formatted as JSON."
        ]
      },
      "assessment": {
        "timeLimitSeconds": 600,
        "passingScore": 80,
        "questions": [
          {
            "id": "dsa4_q1",
            "question": "What is the worst-case time complexity of Merge Sort?",
            "options": [
              "O(N²)",
              "O(N log N)",
              "O(N)",
              "O(log N)"
            ],
            "correctIndex": 1,
            "explanation": "Merge sort splits and merges deterministically in O(N log N) time in worst, average, and best cases."
          },
          {
            "id": "dsa4_q2",
            "question": "What is the worst-case time complexity of Quick Sort?",
            "options": [
              "O(N log N)",
              "O(N²)",
              "O(N)",
              "O(2^N)"
            ],
            "correctIndex": 1,
            "explanation": "When the chosen pivot is consistently the smallest or largest element, QuickSort degrades to O(N²)."
          },
          {
            "id": "dsa4_q3",
            "question": "What does it mean for a sorting algorithm to be 'stable'?",
            "options": [
              "It uses zero memory",
              "It preserves the relative order of elements that have equal sorting keys",
              "It runs in O(N)",
              "It never crashes"
            ],
            "correctIndex": 1,
            "explanation": "Stability preserves the relative positional order of duplicate key records."
          },
          {
            "id": "dsa4_q4",
            "question": "What is the auxiliary space complexity of standard Merge Sort on an array of length N?",
            "options": [
              "O(1)",
              "O(N)",
              "O(log N)",
              "O(N²)"
            ],
            "correctIndex": 1,
            "explanation": "Merge sort allocates an auxiliary buffer of size O(N) to merge sub-arrays."
          },
          {
            "id": "dsa4_q5",
            "question": "What is the lower bound time complexity of any comparison-based sorting algorithm on N elements?",
            "options": [
              "Ω(N)",
              "Ω(N log N)",
              "Ω(N²)",
              "Ω(log N)"
            ],
            "correctIndex": 1,
            "explanation": "Decision tree analysis proves that comparison sorts require at least Ω(N log N) comparisons."
          },
          {
            "id": "dsa4_q6",
            "question": "Which non-comparison sorting algorithm runs in O(N + K) time when sorting integers in range [0, K]?",
            "options": [
              "QuickSort",
              "Counting Sort",
              "MergeSort",
              "HeapSort"
            ],
            "correctIndex": 1,
            "explanation": "Counting sort tallies frequencies directly, sorting in linear O(N + K) time without comparisons."
          },
          {
            "id": "dsa4_q7",
            "question": "How does randomized pivot selection benefit Quick Sort?",
            "options": [
              "It reduces memory to zero",
              "It makes the worst-case O(N²) quadratic behavior extremely improbable in practice",
              "It makes QuickSort stable",
              "It eliminates recursion"
            ],
            "correctIndex": 1,
            "explanation": "Random pivots prevent adversarial pre-sorted inputs from triggering worst-case splits."
          },
          {
            "id": "dsa4_q8",
            "question": "What recurrence relation describes Merge Sort in the Master Theorem?",
            "options": [
              "T(N) = 2T(N/2) + O(N)",
              "T(N) = T(N - 1) + O(1)",
              "T(N) = T(N/2) + O(1)",
              "T(N) = 4T(N/2) + O(N²)"
            ],
            "correctIndex": 0,
            "explanation": "Merge sort divides into 2 subproblems of size N/2 and merges in O(N) time, yielding T(N) = 2T(N/2) + O(N)."
          },
          {
            "id": "dsa4_q9",
            "question": "In Binary Search, why is `mid = left + (right - left) / 2` preferred over `(left + right) / 2` in fixed-width languages like Java and C++?",
            "options": [
              "It is faster for CPU",
              "It prevents 32-bit integer overflow when `left + right > Integer.MAX_VALUE`",
              "It rounds to float",
              "It avoids division by zero"
            ],
            "correctIndex": 1,
            "explanation": "`left + (right - left) / 2` avoids potential integer overflow when large indices are summed."
          },
          {
            "id": "dsa4_q10",
            "question": "What is the in-place sorting algorithm that uses a Binary Heap with O(N log N) worst-case time and O(1) space?",
            "options": [
              "MergeSort",
              "HeapSort",
              "InsertionSort",
              "RadixSort"
            ],
            "correctIndex": 1,
            "explanation": "HeapSort builds a max-heap in-place and extracts elements, achieving guaranteed O(N log N) in O(1) space."
          }
        ]
      },
      "references": [
        {
          "title": "Tim Peters — Original Description of Timsort",
          "url": "https://github.com/python/cpython/blob/main/Objects/listsort.txt",
          "source": "CPython Source Code",
          "category": "Engineering Specification",
          "description": "The original design document detailing Timsort's adaptive runs and Galloping mode."
        },
        {
          "title": "TopCoder — Dynamic Programming from Novice to Advanced",
          "url": "https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced",
          "source": "TopCoder",
          "category": "Authoritative Tutorial",
          "description": "Comprehensive guide to identifying state transitions in DP."
        },
        {
          "title": "Dynamic Programming (Richard Bellman)",
          "url": "https://press.princeton.edu/books/paperback/9780691146683/dynamic-programming",
          "source": "Princeton University Press",
          "category": "Foundational Academic Literature",
          "description": "The original work formalizing the Principle of Optimality and multi-stage decision processes."
        }
      ],
      "keyTakeaways": [
        "MergeSort provides guaranteed $O(N \\log N)$ time with $O(N)$ space; QuickSort operates in-place.",
        "Timsort achieves $O(N)$ on real-world partially sorted data by detecting natural runs.",
        "Binary Search applies to any monotonic predicate space, not just arrays.",
        "Calculate midpoints as `low + (high - low) / 2` to prevent integer overflow."
      ],
      "knowledgeCheck": [
        {
          "id": "kc_dsa4_1",
          "question": "Why is `low + (high - low) / 2` preferred over `(low + high) / 2` in Binary Search?",
          "options": [
            "It executes faster on the CPU",
            "It prevents integer overflow when low + high exceeds maximum integer limits",
            "It handles negative numbers automatically",
            "It is required by the JavaScript engine"
          ],
          "correctIndex": 1,
          "explanation": "When low and high are large positive integers, their sum can exceed 2^31 - 1, causing signed integer overflow."
        },
        {
          "id": "kc_dsa4_2",
          "question": "What makes a problem solvable by Dynamic Programming rather than standard Divide-and-Conquer?",
          "options": [
            "The problem must only take floating point inputs",
            "The problem must exhibit Optimal Substructure AND Overlapping Subproblems",
            "The problem must execute in constant O(1) time",
            "The problem cannot be solved recursively"
          ],
          "correctIndex": 1,
          "explanation": "Divide-and-conquer solves independent subproblems (like MergeSort). Dynamic programming is essential when subproblems overlap heavily, allowing memoization or bottom-up tabulation to avoid redundant exponential recalculation."
        }
      ],
      "interactiveSandboxCode": "const arr = [5, 2, 8, 1, 9];\narr.sort((a, b) => a - b);\nconsole.log('Sorted:', arr); // [1, 2, 5, 8, 9]\n"
    }
  ]
};

module.exports = {
  CURRICULUM,
};
