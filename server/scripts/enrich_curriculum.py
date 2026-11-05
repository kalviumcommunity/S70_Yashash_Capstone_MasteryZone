#!/usr/bin/env python3
import json
import subprocess
import os

root_dir = os.path.join(os.path.dirname(__file__), "..")
node_cmd = ["node", "-e", "const { CURRICULUM } = require('./data/codingCurriculum'); console.log(JSON.stringify(CURRICULUM));"]
res = subprocess.run(node_cmd, cwd=root_dir, capture_output=True, text=True)
if res.returncode != 0:
    print("Node error:", res.stderr)
    exit(1)

curriculum = json.loads(res.stdout)

# Helper function to create authoritative reference objects
def ref(title, url, source, category, desc):
    return {
        "title": title,
        "url": url,
        "source": source,
        "category": category,
        "description": desc
    }

def kc(qid, question, options, correct_idx, explanation):
    return {
        "id": qid,
        "question": question,
        "options": options,
        "correctIndex": correct_idx,
        "explanation": explanation
    }

def sec(title, content, code=None):
    d = {"title": title, "content": content}
    if code:
        d["codeExample"] = code
    return d

# Dictionary of all 28 modules with exhaustive technical content
DATA = {
    # ── PYTHON TRACK ──
    "python": {
        0: {
            "subtitle": "Variables, Object References, CPython Memory Layout, Mutability, and Control Flow.",
            "estimatedTime": "45 mins",
            "overview": "Deep dive into CPython's execution engine, object representation, private heap allocation, reference counting, variable binding mechanics, and optimized control flow constructs. In Python, variables are named pointers to objects rather than typed storage cells.",
            "sections": [
                sec("1. The CPython Object Model & Heap Architecture",
                    "Every entity in Python—integers, strings, functions, classes, and modules—is a first-class heap-allocated C struct (`PyObject` or `PyVarObject`). A `PyObject` contains at minimum two fields: `ob_refcnt` (reference count for deterministic deallocation) and `ob_type` (a pointer to the type object determining its capabilities and method resolution).\n\nWhen executing `x = 42`, CPython does not allocate a 32-bit register for `x`. Instead, it allocates a `PyLongObject` on the private heap and binds the symbol `x` in the local frame namespace (`f_locals` dictionary) to that object's memory address. Small integers between -5 and 256 are pre-allocated and interned in a global array during interpreter startup to maximize cache locality and eliminate allocation overhead.",
                    "import sys\n\n# Memory identity and small integer caching (interning)\na = 256\nb = 256\nprint(f\"a is b: {a is b}\")       # True: both reference pre-allocated singleton\nprint(f\"id(a): {hex(id(a))}\")     # Exact virtual memory address\nprint(f\"Refcount: {sys.getrefcount(a)}\")\n\nc = 999999\nd = 999999\nprint(f\"c is d: {c is d}\")       # False: allocated as distinct PyLongObject instances\nprint(f\"c == d: {c == d}\")       # True: structural value equality"),
                sec("2. Mutability vs Immutability: In-Place Mutations & Aliasing Hazards",
                    "Types in Python fall into two strict behavioral categories:\n• Immutable Types: int, float, complex, str, bytes, tuple, frozenset. Once allocated, their payload bytes can never change. Any modification produces a brand-new object.\n• Mutable Types: list, dict, set, bytearray, and custom class instances. Their internal buffer can be resized and modified in place without changing the object's identity (`id`).\n\nA critical source of production defects is unexpected aliasing: when multiple identifiers point to the same mutable container, in-place operations (`.append()`, `+=`) modify the shared state globally. Tuples provide shallow immutability: the tuple's references cannot change, but mutable objects contained inside the tuple can still be mutated in place.",
                    "# Aliasing hazard vs defensive cloning\noriginal = [1, [2, 3], 4]\naliased = original            # Shared reference\nshallow_copy = list(original) # New outer list, shared inner lists\nimport copy\ndeep_copy = copy.deepcopy(original) # Recursively cloned heap tree\n\noriginal[1].append(99)\nprint(f\"Aliased:      {aliased[1]}\")      # [2, 3, 99] (MUTATED)\nprint(f\"Shallow Copy: {shallow_copy[1]}\") # [2, 3, 99] (MUTATED! Shared inner reference)\nprint(f\"Deep Copy:    {deep_copy[1]}\")    # [2, 3]     (ISOLATED)"),
                sec("3. Advanced Control Flow: Match-Case, Iterators & Comprehensions",
                    "Python 3.10 introduced Structural Pattern Matching (`match ... case`), offering expressive destructuring of sequences, dictionaries, and class patterns with guard clauses (`if`). Unlike C/C++ switch statements, `match` evaluates structural shape and binds sub-patterns into local variables.\n\nList and dictionary comprehensions are compiled directly into bytecode loops executed in C within the CPython virtual machine. They bypass the overhead of repeatedly looking up `.append()` in the global or module scope, resulting in up to 35% faster execution compared to standard Python `for` loops.",
                    "def parse_api_event(event: dict) -> str:\n    match event:\n        case {\"type\": \"auth\", \"status\": 200, \"user\": {\"role\": \"admin\", \"name\": name}}:\n            return f\"Superadmin session authorized for: {name}\"\n        case {\"type\": \"auth\", \"status\": code} if code >= 400:\n            return f\"Security alert: Authentication rejected (HTTP {code})\"\n        case {\"type\": \"payment\", \"amount\": amt, \"currency\": curr} if amt > 10000:\n            return f\"High-value wire audit flag: {amt} {curr}\"\n        case _:\n            return \"Standard operational telemetry logged\"\n\nprint(parse_api_event({\"type\": \"auth\", \"status\": 200, \"user\": {\"role\": \"admin\", \"name\": \"Sarah\"}}))"),
                sec("4. Memory Complexity, Big-O Profiles & Garbage Collection (GC)",
                    "CPython employs a dual-strategy memory management engine:\n1. Reference Counting: Immediate deterministic deallocation when an object's reference counter drops to 0.\n2. Generational Cyclical Garbage Collector (GC): Handles self-referential cycles across three generations (Gen 0, Gen 1, Gen 2). Gen 0 runs frequently; objects surviving collection are promoted to older generations.\n\nMemory Profiling Table:\n• Integer: 28 bytes base (16 bytes PyObject header + 8 bytes digit count + 4 bytes value)\n• Float: 24 bytes\n• Empty List: 56 bytes (overallocates by factor of 1.125 upon growth)\n• Empty Dict: 64 bytes (compact hash table with separate index array)",
                    "import sys, gc\n\nclass Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\nn1 = Node(1)\nn2 = Node(2)\nn1.next = n2\nn2.next = n1 # Cyclical pointer loop\n\ndel n1\ndel n2 # Reference count never drops to 0 due to mutual references!\nunreachable = gc.collect()\nprint(f\"Unreachable cyclical objects reclaimed by GC: {unreachable}\")"),
                sec("5. Production Pitfalls & Anti-Patterns to Avoid",
                    "• Mutable Default Arguments: Defs like `def add_item(item, items=[])` bind `items` once at module import time, sharing the list across all invocations. Always default to `items=None` and initialize inside.\n• Unchecked `is` for Equality: Never use `is` to compare string or numeric equality (`if x is 500:`). Use `==` for structural equality.\n• Inefficient String Concatenation in Loops: Using `s += char` generates O(N^2) memory reallocations. Use `''.join(list_of_strings)` for strict O(N) linear time.",
                    "# ANTI-PATTERN:\ndef append_to_cache(key, val, cache={}):\n    cache[key] = val\n    return cache\n\n# PRODUCTION RECOMMENDED PATTERN:\ndef append_to_cache_safe(key, val, cache=None):\n    if cache is None:\n        cache = {}\n    cache[key] = val\n    return cache")
            ],
            "references": [
                ref("Official Python 3 Documentation — Data Model & Execution Model", "https://docs.python.org/3/reference/datamodel.html", "Python Software Foundation", "Official Standard Spec", "Definitive specification of objects, values, types, attribute lookups, and Python bytecode mechanics."),
                ref("PEP 634 — Structural Pattern Matching Specification", "https://peps.python.org/pep-0634/", "Python Enhancement Proposals (PEPs)", "Language Architecture Proposal", "Formal specification and grammar rules for match/case statement syntax and destructuring patterns."),
                ref("Fluent Python (2nd Edition) — Luciano Ramalho", "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/", "O'Reilly Media", "Authoritative Literature", "Industry gold-standard reference covering the Python data model, descriptors, memory management, and idioms.")
            ],
            "keyTakeaways": [
                "In Python, variables are names bound to heap objects, not typed memory boxes.",
                "Immutable types (int, float, str, tuple) cannot be mutated in place; mutable containers (list, dict, set) can be mutated across shared references.",
                "List comprehensions execute in C-speed within CPython and run faster than equivalent for-loops.",
                "Always use `items=None` for default arguments to avoid the shared mutable default argument hazard.",
                "CPython memory cleanup combines deterministic reference counting with a generational cyclic garbage collector."
            ],
            "knowledgeCheck": [
                kc("kc_py0_1", "Why does Python pre-allocate integers from -5 to 256 during interpreter startup?",
                   ["Because 32-bit registers can only store numbers up to 256", "To optimize cache locality and eliminate allocation overhead for frequently used numbers", "Because Python does not support numbers larger than 256 without external libraries", "To enforce immutable type restrictions on small values"],
                   1, "Small integers (-5 through 256) are used heavily in loops, indexing, and counters. Pre-allocating them as permanent singletons avoids thousands of heap allocation calls."),
                kc("kc_py0_2", "What is the primary danger of using `def process(data, cache=[])` in production?",
                   ["It triggers a SyntaxError in Python 3.10+", "The list is created once at function definition time, making the cache persist and leak state across all callers", "The list becomes read-only and will raise an AttributeError on .append()", "It prevents garbage collection of the entire module"],
                   1, "Default parameter expressions are evaluated once when the function definition is executed at module load time. Subsequent calls share that exact same list object.")
            ],
            "interactiveSandboxCode": "import sys\nx = [10, 20, 30]\ny = x\nprint(f\"x is y: {x is y}\")\ny.append(40)\nprint(f\"x after y.append(40): {x}\")\n"
        },
        1: {
            "subtitle": "First-Class Functions, Closures, Decorators, *args/**kwargs, and Variable Scope Hierarchy.",
            "estimatedTime: ": "50 mins",
            "overview": "Deep architectural survey of Python's execution frames, lexical scoping rules (LEGB), first-class callable objects, closures with cell variables, function decorators, and meta-programming techniques used across modern frameworks like FastAPI, Flask, and PyTorch.",
            "sections": [
                sec("1. The LEGB Scope Resolution Hierarchy & Frame Objects",
                    "When resolving any identifier in Python, the interpreter checks four scopes in strict hierarchical order (LEGB):\n1. Local (L): Defined inside current function via assignment.\n2. Enclosing (E): Defined in the local scope of enclosing functions (closures).\n3. Global (G): Defined at top level of the module (`globals()`).\n4. Built-in (B): Pre-loaded built-ins like `len`, `range` (`builtins`).\n\nIf you assign to a variable anywhere inside a function without `global` or `nonlocal`, Python flags it as strictly Local at compilation time. Referencing it before assignment raises `UnboundLocalError`.",
                    "counter = 0\ndef increment():\n    global counter\n    counter += 1\n    return counter\n\ndef outer_closure(initial_value):\n    val = initial_value\n    def inner_step(delta):\n        nonlocal val\n        val += delta\n        return val\n    return inner_step\n\nstepper = outer_closure(100)\nprint(stepper(15))  # 115\nprint(stepper(25))  # 140"),
                sec("2. Closures & Free Variables: Under the Hood with __closure__",
                    "A closure is a function that retains access to variables from its lexical enclosing scope even after the outer function has returned. CPython achieves this by creating special `cell` objects on the heap that store pointers to the free variables.",
                    "def make_rate_limiter(max_calls: int):\n    calls = 0\n    def allow() -> bool:\n        nonlocal calls\n        calls += 1\n        return calls <= max_calls\n    return allow\n\nlimiter = make_rate_limiter(2)\nprint([c.cell_contents for c in limiter.__closure__]) # [0, 2]\nprint(limiter(), limiter(), limiter()) # True, True, False"),
                sec("3. Advanced Decorators: Syntactic Sugar, Wrappers & functools.wraps",
                    "A decorator is a callable that wraps another callable. Without `@functools.wraps(func)`, the wrapper overwrites the decorated function's `__name__` and docstring, breaking logging and framework introspection.",
                    "from functools import wraps\nimport time\n\ndef benchmark(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        t0 = time.perf_counter()\n        res = func(*args, **kwargs)\n        print(f\"{func.__name__} took {(time.perf_counter() - t0)*1000:.2f}ms\")\n        return res\n    return wrapper\n\n@benchmark\ndef calculate(): return sum(i for i in range(100000))\ncalculate()"),
                sec("4. Variadic Arguments (*args, **kwargs) & Keyword-Only Enforcement",
                    "Python provides flexible argument packing: `*args` packs extra positional arguments into a tuple, while `**kwargs` packs named arguments into a dict. A bare `*` enforces keyword-only arguments for bulletproof APIs.",
                    "def connect(host: str, *, port: int = 5432, ssl: bool = True):\n    return f\"{host}:{port}?ssl={ssl}\"\n\nprint(connect(\"db.internal\", port=5433, ssl=False))"),
                sec("5. Production Pitfall: Late Binding in Loop Closures",
                    "Closures in Python bind variables by reference at execution time, not at definition time. Defining lambdas inside a loop results in all lambdas reading the final loop counter.",
                    "# Buggy: funcs = [lambda: i for i in range(3)] -> [2, 2, 2]\n# Fix: funcs = [lambda val=i: val for i in range(3)] -> [0, 1, 2]")
            ],
            "references": [
                ref("PEP 3102 — Keyword-Only Arguments", "https://peps.python.org/pep-3102/", "Python Enhancement Proposals", "Official Standard Spec", "Specification for named parameters that can only be supplied by keyword syntax."),
                ref("Python functools Module Documentation", "https://docs.python.org/3/library/functools.html", "Python Software Foundation", "Official Standard Library", "Technical reference for wraps, lru_cache, and higher-order function utilities.")
            ],
            "keyTakeaways": [
                "LEGB resolution governs variable lookup across Python scopes.",
                "Closures capture state on the heap using cell objects.",
                "Always decorate wrappers with `@functools.wraps`.",
                "Use bare `*` to enforce keyword-only parameters in APIs."
            ],
            "knowledgeCheck": [
                kc("kc_py1_1", "What does @functools.wraps do?",
                   ["Accelerates function bytecode execution in C", "Preserves the original function's __name__, docstrings, and signature on the wrapper", "Forces asynchronous thread execution", "Locks the function against monkey-patching"],
                   1, "wraps copies metadata from the original function to the wrapper function.")
            ],
            "interactiveSandboxCode": "def make_multiplier(factor):\n    return lambda x: x * factor\ndouble = make_multiplier(2)\ntriple = make_multiplier(3)\nprint(double(5), triple(5))\n"
        },
        2: {
            "subtitle": "Classes, Metaclasses, C3 Linearization (MRO), __slots__ Optimization, and Descriptors.",
            "estimatedTime": "55 mins",
            "overview": "Industrial object-oriented programming in Python. Master dynamic type creation, C3 superclass linearization, method resolution order (MRO), memory-saving `__slots__` arrays, the descriptor protocol (`__get__`, `__set__`), and abstract base classes (ABCs).",
            "sections": [
                sec("1. Class Instantiation: __new__ vs __init__ and Object Lifecycle",
                    "`__new__` is the static allocator that creates and returns a new instance of the class. `__init__` is the initializer that populates attributes on the created instance. Customizing `__new__` is required when subclassing immutable types (like int, str, tuple) or implementing the Singleton pattern.",
                    "class Singleton:\n    _inst = None\n    def __new__(cls):\n        if cls._inst is None:\n            cls._inst = super().__new__(cls)\n        return cls._inst\na, b = Singleton(), Singleton()\nprint(a is b) # True"),
                sec("2. Memory Optimization via __slots__",
                    "By default, every Python instance stores attributes in a dynamic `__dict__` taking ~104 bytes minimum. Declaring `__slots__ = ('name', 'id')` replaces the dictionary with a compact C pointer array, reducing memory usage by 60-70% and accelerating attribute lookups.",
                    "class FastUser:\n    __slots__ = ('uid', 'email')\n    def __init__(self, uid, email):\n        self.uid = uid; self.email = email\nu = FastUser(1, 'dev@corp.com')\nprint(hasattr(u, '__dict__')) # False"),
                sec("3. Multiple Inheritance & C3 Linearization (MRO)",
                    "Python resolves multiple inheritance using the C3 Linearization Algorithm to construct `cls.__mro__`. It ensures children precede parents and listed parent order is preserved. Always use cooperative `super().__init__()` with kwargs.",
                    "class Base: pass\nclass A(Base): pass\nclass B(Base): pass\nclass C(A, B): pass\nprint([cls.__name__ for cls in C.__mro__])"),
                sec("4. The Descriptor Protocol: __get__ and __set__",
                    "Descriptors power Python properties, methods, and ORMs. A descriptor implements `__get__`, `__set__`, or `__delete__`. Data descriptors implement `__set__` and take precedence over instance dictionaries.",
                    "class PositiveNumber:\n    def __set_name__(self, owner, name): self.name = f'_{name}'\n    def __get__(self, inst, owner): return getattr(inst, self.name, 0)\n    def __set__(self, inst, val):\n        if val <= 0: raise ValueError('Must be positive')\n        setattr(inst, self.name, val)\n\nclass Item:\n    price = PositiveNumber()"),
                sec("5. Best Practice: Composition over Inheritance",
                    "Avoid deep class hierarchies. Prefer composing small, testable collaborator objects (has-a) rather than rigid multi-tier subclass trees (is-a).",
                    "class Engine: pass\nclass Car:\n    def __init__(self, engine: Engine): self.engine = engine")
            ],
            "references": [
                ref("Python Descriptor HowTo Guide — Raymond Hettinger", "https://docs.python.org/3/howto/descriptor.html", "PSF", "Official Guide", "Authoritative guide on descriptors, properties, and method binding."),
                ref("Fluent Python Chapters 11-14: Object-Oriented Idioms", "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/", "O'Reilly", "Authoritative Literature", "Deep dive into special methods and descriptors.")
            ],
            "keyTakeaways": [
                "`__new__` allocates the object; `__init__` initializes attributes.",
                "`__slots__` reduces per-instance memory by up to 70% by eliminating `__dict__`.",
                "Descriptors intercept attribute lookup via `__get__` and `__set__`.",
                "Prefer composition over inheritance for extensible software architecture."
            ],
            "knowledgeCheck": [
                kc("kc_py2_1", "What does __slots__ eliminate on Python class instances?",
                   ["Method lookup tables", "The dynamic __dict__ attribute dictionary", "The garbage collector reference count", "Inheritance capabilities"],
                   1, "__slots__ eliminates the per-instance dictionary, replacing it with a fixed C array.")
            ],
            "interactiveSandboxCode": "class Slotted:\n    __slots__ = ('x', 'y')\n    def __init__(self, x, y): self.x = x; self.y = y\n\ns = Slotted(10, 20)\nprint(s.x, s.y)\n"
        },
        3: {
            "subtitle": "Context Managers, Streaming Buffer I/O, JSON/Protobuf Serialization, and Exception Chains.",
            "estimatedTime": "50 mins",
            "overview": "Production-grade input/output architecture in Python. Master streaming buffered I/O, file descriptor safety with context managers (`with`), modern serialization (JSON, Protocol Buffers, avoiding insecure pickle), robust custom exception hierarchies, and exception chaining (`raise ... from`).",
            "sections": [
                sec("1. The Context Manager Protocol: __enter__ & __exit__ Mechanics",
                    "The `with` statement guarantees deterministic resource cleanup. `__enter__` acquires resources and returns the bound target; `__exit__(self, exc_type, exc_val, exc_tb)` cleanups. Returning True from `__exit__` suppresses exceptions.",
                    "class SafeFile:\n    def __init__(self, path): self.path = path\n    def __enter__(self): self.f = open(self.path, 'w', encoding='utf-8'); return self.f\n    def __exit__(self, t, v, tb): self.f.close(); return False"),
                sec("2. Streaming Large Files: Generator Pipelines",
                    "Reading large multi-gigabyte files into memory causes Out-Of-Memory (OOM) failures. Python file objects are generators that yield line by line in O(1) constant memory.",
                    "def stream_errors(log_path):\n    with open(log_path, 'r', encoding='utf-8') as f:\n        for line in f:\n            if 'ERROR' in line: yield line.strip()"),
                sec("3. Safe Serialization: JSON vs Insecure Pickle",
                    "Never deserialize pickle payloads from untrusted network clients because pickle can execute arbitrary bytecode via `__reduce__`. Use JSON, MessagePack, or Protocol Buffers.",
                    "import json\ndata = {'service': 'auth', 'active': True}\njson_str = json.dumps(data)\nparsed = json.loads(json_str)"),
                sec("4. Exception Chaining: raise ... from original_exc",
                    "Use `raise NewException(...) from orig_exc` to preserve the underlying cause in `__cause__` while presenting high-level domain errors to callers.",
                    "try: int('invalid')\nexcept ValueError as err:\n    raise RuntimeError('Data parsing failed') from err"),
                sec("5. Atomic File Writes with os.replace",
                    "Never overwrite live production files directly. Write to a temporary file (`file.tmp`) and atomically replace it using `os.replace` to prevent corrupted partial reads.",
                    "import os\ndef atomic_write(path, data):\n    tmp = f'{path}.tmp'\n    with open(tmp, 'w', encoding='utf-8') as f: f.write(data)\n    os.replace(tmp, path)")
            ],
            "references": [
                ref("PEP 343 — The 'with' Statement", "https://peps.python.org/pep-0343/", "PSF", "Official Standard Spec", "Specification for context managers."),
                ref("PEP 3134 — Exception Chaining", "https://peps.python.org/pep-3134/", "PSF", "Official Standard Spec", "Specification for raise ... from and __cause__.")
            ],
            "keyTakeaways": [
                "Always use context managers (`with`) for deterministic file and socket closure.",
                "Stream large files line by line to keep memory consumption constant O(1).",
                "Avoid pickle for untrusted network input; use JSON or Protocol Buffers.",
                "Use `raise ... from` to preserve diagnostic tracebacks across architecture layers."
            ],
            "knowledgeCheck": [
                kc("kc_py3_1", "Why is pickle considered dangerous for untrusted input?",
                   ["It causes stack overflows", "It can execute arbitrary system commands via __reduce__ during deserialization", "It does not support strings", "It is slower than XML"],
                   1, "Pickle can construct arbitrary objects and execute system functions during unpickling.")
            ],
            "interactiveSandboxCode": "import json\npayload = {'status': 'healthy', 'uptime_sec': 3600}\nprint(json.dumps(payload, indent=2))\n"
        },
        4: {
            "subtitle": "Collections Module, Itertools, Functools (LRU Cache), Protocol Types, and GIL Implications.",
            "estimatedTime": "55 mins",
            "overview": "High-performance data structures and idiomatic Python patterns. Master the `collections` module (deque, Counter, defaultdict), infinite combinatoric iterators (`itertools`), memoization with `@lru_cache`, structural subtyping (`typing.Protocol`), and understanding the Global Interpreter Lock (GIL).",
            "sections": [
                sec("1. The collections Module: Deque, Counter & DefaultDict",
                    "`collections.deque` provides O(1) appends and pops from both ends, unlike lists where `pop(0)` is O(N). `Counter` simplifies frequency analysis. `defaultdict` eliminates missing-key checks.",
                    "from collections import deque, Counter, defaultdict\nq = deque([1, 2, 3])\nq.appendleft(0)\nprint(list(q)) # [0, 1, 2, 3] in O(1) time"),
                sec("2. The itertools Module: High-Speed Generator Pipelines",
                    "`itertools` provides C-accelerated iterator combinators like `chain`, `islice`, and `combinations` that stream infinite or large datasets in O(1) memory.",
                    "import itertools\ncombos = list(itertools.combinations(['A', 'B', 'C'], 2))\nprint(combos) # [('A', 'B'), ('A', 'C'), ('B', 'C')]"),
                sec("3. Memoization with functools.lru_cache",
                    "Decorating pure functions with `@functools.lru_cache` stores computed results in an in-memory hash table, collapsing recursive exponential time to linear O(N).",
                    "from functools import lru_cache\n@lru_cache(maxsize=128)\ndef fib(n): return n if n < 2 else fib(n-1) + fib(n-2)\nprint(fib(50))"),
                sec("4. Static Duck Typing with typing.Protocol",
                    "Python 3.8+ Protocol enables structural subtyping: any class implementing required methods matches the type without inheriting from a base class.",
                    "from typing import Protocol\nclass Greeter(Protocol):\n    def greet(self) -> str: ...\nclass Robot:\n    def greet(self) -> str: return 'Beep Boop'\n# Robot matches Greeter automatically!"),
                sec("5. Concurrency & The Global Interpreter Lock (GIL)",
                    "The GIL prevents multiple native OS threads from running Python bytecode concurrently. Use `threading`/`asyncio` for I/O-bound tasks and `multiprocessing` for CPU-bound tasks.",
                    "from concurrent.futures import ProcessPoolExecutor\n# Scales CPU bound work across multiple processor cores")
            ],
            "references": [
                ref("Python collections Documentation", "https://docs.python.org/3/library/collections.html", "PSF", "Official Standard Library", "Full specification of deque, Counter, and defaultdict."),
                ref("PEP 544 — Protocols: Structural Subtyping", "https://peps.python.org/pep-0544/", "PSF", "Official Standard Spec", "Specification for typing.Protocol.")
            ],
            "keyTakeaways": [
                "Use `deque` for O(1) double-ended queue operations instead of list.pop(0).",
                "`itertools` offers zero-overhead streaming combinators.",
                "`@lru_cache` memoizes pure recursive computations.",
                "The GIL requires multiprocessing for CPU-bound performance."
            ],
            "knowledgeCheck": [
                kc("kc_py4_1", "What is the time complexity of popping an element from the front of a list vs a deque?",
                   ["Both are O(1)", "list is O(N), deque is O(1)", "list is O(1), deque is O(N)", "Both are O(log N)"],
                   1, "list.pop(0) shifts all elements in memory, while deque simply unlinks the node in O(1).")
            ],
            "interactiveSandboxCode": "from collections import Counter\ncounts = Counter('abracadabra')\nprint(counts.most_common(3))\n"
        }
    },

    # ── JAVASCRIPT TRACK ──
    "javascript": {
        0: {
            "subtitle": "V8 Engine Architecture, Call Stack, Memory Heap, Hoisting, TDZ, and Type Coercion.",
            "estimatedTime": "50 mins",
            "overview": "A comprehensive deep dive into JavaScript's execution environment. Understand how the V8 engine compiles code via Ignition (bytecode interpreter) and TurboFan (JIT compiler), lexical environments, variable hoisting, the Temporal Dead Zone (TDZ), and strict equality.",
            "sections": [
                sec("1. V8 Engine Architecture: Ignition, TurboFan & The Call Stack",
                    "Modern JavaScript engines like Google V8 parse source code into an Abstract Syntax Tree (AST), which the Ignition interpreter converts into bytecode. Frequently executed functions ('hot code') are analyzed by TurboFan and optimized directly into machine code. The Call Stack manages execution frames synchronously using LIFO order.",
                    "function multiply(a, b) { return a * b; }\nfunction computeTotal(x) { return multiply(x, 1.2); }\nconsole.log(computeTotal(100)); // 120"),
                sec("2. Execution Contexts, Hoisting & The Temporal Dead Zone (TDZ)",
                    "Every execution context consists of a Variable Environment and a Lexical Environment. `var` declarations are hoisted and initialized to `undefined`. `let` and `const` declarations are hoisted into the lexical scope but remain uninitialized in the Temporal Dead Zone (TDZ) until their declaration line is executed.",
                    "// console.log(x); // ReferenceError: Cannot access 'x' before initialization (TDZ)\nlet x = 10;\nconsole.log(x); // 10\n\nconsole.log(legacyVar); // undefined (hoisted and initialized)\nvar legacyVar = 20;"),
                sec("3. Type Coercion Rules & Strict Equality (Object.is)",
                    "JavaScript features implicit type coercion in comparisons (`==`). The strict equality operator (`===`) checks both value and type without coercion. `Object.is()` resolves special edge cases: `Object.is(NaN, NaN)` is `true`, and `Object.is(-0, +0)` is `false`.",
                    "console.log([] == 0);          // true: [] coerces to '' then to 0\nconsole.log([] === 0);         // false: object vs number\nconsole.log(NaN === NaN);      // false: IEEE 754 standard\nconsole.log(Object.is(NaN, NaN)); // true"),
                sec("4. Memory Allocation & Garbage Collection (Mark-and-Sweep)",
                    "Primitive values (numbers, booleans, symbols) are stored on the execution stack, while non-primitives (objects, arrays, functions) reside in the Memory Heap. V8 collects garbage via a Generational Mark-and-Sweep collector: Young Generation (Scavenger Cheney algorithm) and Old Generation (Mark-Sweep-Compact).",
                    "let user = { name: 'Alice' }; // Heap allocated\nuser = null; // Unreachable: marked for sweep by V8 collector"),
                sec("5. Production Best Practices & Pitfalls",
                    "• Never use `var`: Always use `const` by default and `let` only for reassigned identifiers.\n• Beware of implicit NaN: Arithmetic on undefined returns `NaN` which silently propagates through business logic.\n• Enable Strict Mode: Always use `'use strict';` or ES Modules to disallow accidental global leaks.",
                    "'use strict';\nfunction safeCalculate(price, taxRate = 0.05) {\n    if (typeof price !== 'number' || isNaN(price)) throw new TypeError('Price must be a valid number');\n    return price * (1 + taxRate);\n}")
            ],
            "references": [
                ref("MDN Web Docs — JavaScript Guide: Memory Management", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management", "Mozilla Developer Network", "Authoritative Web Spec", "Comprehensive documentation on JavaScript heap memory, reference cycles, and mark-and-sweep garbage collection."),
                ref("ECMAScript 2024 Language Specification (ECMA-262)", "https://tc39.es/ecma262/", "Ecma International / TC39", "Official Standard Spec", "The official standard specification for JavaScript language grammar, runtime execution contexts, and types."),
                ref("V8 JavaScript Engine Architecture — Google Developers", "https://v8.dev/", "Google V8 Team", "Engine Engineering Reference", "Technical articles explaining Ignition bytecode compiler, TurboFan JIT optimizations, and hidden classes.")
            ],
            "keyTakeaways": [
                "V8 combines Ignition (bytecode interpreter) and TurboFan (JIT compiler) for maximum execution speed.",
                "`let` and `const` are hoisted into the Temporal Dead Zone (TDZ) and cannot be read before initialization.",
                "Always use strict equality (`===`) or `Object.is()` to avoid unexpected coercion bugs.",
                "Primitives live on the stack; objects, functions, and arrays live on the heap."
            ],
            "knowledgeCheck": [
                kc("kc_js0_1", "What causes a ReferenceError when reading a `let` variable before its declaration line?",
                   ["The variable was never compiled", "The variable exists in the Temporal Dead Zone (TDZ)", "Variables in JavaScript cannot be accessed outside functions", "let variables are stored on disk"],
                   1, "let and const are hoisted into the scope but are kept in the Temporal Dead Zone until their definition is evaluated."),
                kc("kc_js0_2", "Why is `Object.is(NaN, NaN)` true while `NaN === NaN` is false?",
                   ["Object.is converts NaN to 0", "NaN === NaN follows IEEE-754 semantics where NaN is not equal to itself, whereas Object.is tests exact value identity", "Strict equality only works on numbers below 100", "Object.is runs in WebAssembly"],
                   1, "IEEE-754 defines NaN as unequal to any value including itself. Object.is accurately tests same-value identity.")
            ],
            "interactiveSandboxCode": "console.log('Object.is(NaN, NaN):', Object.is(NaN, NaN));\nconsole.log('NaN === NaN:', NaN === NaN);\nconsole.log('Object.is(+0, -0):', Object.is(+0, -0));\n"
        },
        1: {
            "subtitle": "Lexical Scoping, Scope Chain, Mark-and-Sweep, Prototypes, __proto__, and Private Class Fields.",
            "estimatedTime": "55 mins",
            "overview": "Master JavaScript's closure mechanics, memory retention, prototype delegation, and modern encapsulation. Understand how lexical scope chains retain state, how prototype lookups traverse the chain, and how to implement clean module patterns and `#private` class fields.",
            "sections": [
                sec("1. Lexical Scope & Closure Architecture",
                    "A closure is the combination of a function bundled together with references to its surrounding lexical environment. Functions in JavaScript retain their scope chain even when invoked outside their original lexical context.",
                    "function createBankVault(initialBalance) {\n    let balance = initialBalance; // Private enclosed state\n    return {\n        deposit: (amount) => { balance += amount; return balance; },\n        withdraw: (amount) => {\n            if (amount > balance) throw new Error('Insufficient funds');\n            balance -= amount;\n            return balance;\n        },\n        getBalance: () => balance\n    };\n}\nconst vault = createBankVault(1000);\nconsole.log(vault.deposit(500)); // 1500"),
                sec("2. The Prototype Chain & Property Delegation",
                    "Every JavaScript object has an internal `[[Prototype]]` link. When accessing a property, the engine inspects the object; if missing, it traverses up the prototype chain until finding it or reaching `null` (`Object.prototype.__proto__ === null`).",
                    "const animal = { eats: true };\nconst rabbit = Object.create(animal);\nrabbit.jumps = true;\nconsole.log(rabbit.eats); // true (delegated up prototype chain)\nconsole.log(Object.getPrototypeOf(rabbit) === animal); // true"),
                sec("3. Modern Class Syntax & Private Fields (#)",
                    "ES2022 introduced native private fields and methods prefixed with `#`. Unlike closure-based private variables or convention underscores (`_private`), `#fields` are enforced at the language syntax level by the V8 runtime and cannot be inspected via `Object.keys()`.",
                    "class SecureApiKeyManager {\n    #secretKey; // True runtime private field\n    constructor(key) { this.#secretKey = key; }\n    validate(input) { return this.#hash(input) === this.#secretKey; }\n    #hash(val) { return `hashed_${val}`; }\n}"),
                sec("4. Currying & Functional Composition",
                    "Currying transforms a function accepting multiple arguments into a sequence of unary functions. It enables partial application, creating reusable utility functions in modern pipelines.",
                    "const multiply = a => b => a * b;\nconst double = multiply(2);\nconst triple = multiply(3);\nconsole.log([1, 2, 3].map(double)); // [2, 4, 6]"),
                sec("5. Production Anti-Pattern: Accidental Memory Leaks in Closures",
                    "Holding long-lived references to large objects inside closures attached to DOM event listeners or global caches prevents V8's garbage collector from sweeping the allocated heap memory.",
                    "function setupListener() {\n    const largeData = new Array(1000000).fill('leak');\n    window.addEventListener('resize', () => {\n        // If this listener references largeData, the 1M array is pinned in memory forever!\n    });\n}")
            ],
            "references": [
                ref("MDN Web Docs — Closures", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures", "Mozilla", "Authoritative Guide", "Comprehensive guide to lexical environments and closures."),
                ref("MDN Web Docs — Inheritance and the prototype chain", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain", "Mozilla", "Authoritative Guide", "Deep dive into prototype lookups and performance implications.")
            ],
            "keyTakeaways": [
                "Closures capture outer lexical scopes, preserving private state.",
                "JavaScript objects delegate property lookups up the prototype chain.",
                "Native `#private` fields enforce runtime privacy without memory overhead.",
                "Remove event listeners when unmounting components to avoid closure memory leaks."
            ],
            "knowledgeCheck": [
                kc("kc_js1_1", "What happens when an object does not have an accessed property?",
                   ["It throws a TypeError", "The engine looks up its [[Prototype]] chain until finding it or reaching null", "It creates the property as undefined on the current object", "It checks the global window object"],
                   1, "JavaScript traverses the prototype chain until it finds the property or reaches null.")
            ],
            "interactiveSandboxCode": "function counter() {\n    let count = 0;\n    return () => ++count;\n}\nconst c = counter();\nconsole.log(c(), c(), c());\n"
        },
        2: {
            "subtitle": "Event Loop, Microtasks vs Macrotasks, Promise Internals, and Async/Await Mechanics.",
            "estimatedTime": "55 mins",
            "overview": "The definitive architectural breakdown of JavaScript's asynchronous concurrency model. Understand the Call Stack, Libuv event loop, Macrotasks queue (setTimeout, I/O) vs Microtasks queue (Promise.then, MutationObserver), Promise state transitions, and async/await desugaring.",
            "sections": [
                sec("1. The Event Loop Architecture: Call Stack & Task Queues",
                    "JavaScript is single-threaded. Concurrency is orchestrated by the Event Loop. When asynchronous work (fetch, timers, disk I/O) is dispatched, the browser or Node.js background thread pool executes it and schedules callbacks onto queues:\n• Microtasks Queue: High-priority queue (Promise callbacks, `queueMicrotask`). Emptied completely before the next task runs.\n• Macrotasks Queue: Standard task queue (setTimeout, setInterval, setImmediate, I/O events).",
                    "console.log('1. Synchronous Start');\nsetTimeout(() => console.log('4. Macrotask (setTimeout)'), 0);\nPromise.resolve().then(() => console.log('2. Microtask (Promise 1)'))\n                 .then(() => console.log('3. Microtask (Promise 2)'));\nconsole.log('5. Synchronous End');\n// Output order: 1 -> 5 -> 2 -> 3 -> 4"),
                sec("2. Promise States & Internal Invariants",
                    "A Promise is an object representing eventual completion or failure of an asynchronous operation. It resides in one of three mutually exclusive states:\n1. Pending: Initial state, neither fulfilled nor rejected.\n2. Fulfilled: Completed successfully with a resolved value.\n3. Rejected: Failed with an error reason.\nOnce settled, a Promise's state and value are permanently immutable.",
                    "const fetchWithTimeout = (url, timeoutMs) => {\n    const timeoutPromise = new Promise((_, reject) =>\n        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)\n    );\n    return Promise.race([fetch(url), timeoutPromise]);\n};"),
                sec("3. Promise Combinators: all, allSettled, race & any",
                    "• `Promise.all`: Rejects immediately if ANY promise rejects (fail-fast).\n• `Promise.allSettled`: Waits for all promises to finish and returns an array of `{status, value|reason}`.\n• `Promise.race`: Resolves or rejects as soon as the first promise settles.\n• `Promise.any`: Resolves as soon as the first promise fulfills (ignores rejections unless all fail).",
                    "const p1 = Promise.resolve('Success');\nconst p2 = Promise.reject('Minor telemetry error');\nPromise.allSettled([p1, p2]).then(results => {\n    results.forEach(r => console.log(r.status, r.value || r.reason));\n});"),
                sec("4. Async/Await: Syntactic Sugar for Coroutines & Generators",
                    "`async` functions always return a Promise. The `await` keyword pauses execution of the async function, yields control back to the Event Loop, and resumes when the promise settles via microtask scheduling.",
                    "async function loadDashboardData() {\n    try {\n        const [user, stats] = await Promise.all([fetchUser(), fetchStats()]);\n        return { user, stats };\n    } catch (err) {\n        console.error('Failed to load dashboard:', err);\n        throw err;\n    }\n}"),
                sec("5. Production Anti-Pattern: Sequential Awaits in Loops",
                    "Using `await` inside a standard `for` loop causes sequential execution (waterfall latency). When tasks are independent, execute them concurrently using `Promise.all`.",
                    "// BAD: Sequential (3x latency)\n// for (const id of ids) { await fetchItem(id); }\n// GOOD: Concurrent\n// await Promise.all(ids.map(id => fetchItem(id)));")
            ],
            "references": [
                ref("MDN Web Docs — JavaScript Event Loop", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop", "Mozilla", "Authoritative Guide", "Comprehensive documentation on task queues, microtasks, and the runtime event loop."),
                ref("TC39 Promise Specification", "https://tc39.es/ecma262/#sec-promise-objects", "Ecma TC39", "Official Standard Spec", "Formal specification of Promise objects, internal slots, and reaction jobs.")
            ],
            "keyTakeaways": [
                "Microtasks (Promises) always run before the next Macrotask (setTimeout).",
                "Promises are permanently immutable once settled.",
                "Use `Promise.allSettled` when individual failures should not cancel remaining jobs.",
                "Avoid sequential `await` in loops for independent operations."
            ],
            "knowledgeCheck": [
                kc("kc_js2_1", "Which task queue takes priority when the call stack clears?",
                   ["The Macrotask queue (setTimeout)", "The Microtask queue (Promises)", "The Rendering pipeline", "File I/O callbacks"],
                   1, "The engine completely drains the Microtask queue after every task before processing the next macrotask.")
            ],
            "interactiveSandboxCode": "console.log('Start');\nPromise.resolve().then(() => console.log('Promise Microtask'));\nsetTimeout(() => console.log('Timeout Macrotask'), 0);\nconsole.log('End');\n"
        },
        3: {
            "subtitle": "DOM Tree Architecture, Event Bubbling & Capturing, Reflow vs Repaint, and Observer APIs.",
            "estimatedTime": "50 mins",
            "overview": "Browser rendering engine internals and high-performance DOM manipulation. Understand how HTML is parsed into the DOM Tree and CSSOM, the Render Tree, Layout (Reflow), Paint, Compositing, Event Delegation, and modern Observer APIs (IntersectionObserver, ResizeObserver).",
            "sections": [
                sec("1. The Browser Rendering Pipeline: Reflow vs Repaint",
                    "When the DOM or CSSOM changes, the browser updates pixels through the rendering pipeline:\n1. Layout (Reflow): Calculates exact geometric dimensions and screen positions.\n2. Paint: Fills pixels with colors, borders, and shadows.\n3. Composite: Combines GPU layers.\nTriggering reflow on layout-sensitive properties (`offsetHeight`, `clientWidth`) inside loops causes layout thrashing and frame drops below 60fps.",
                    "// BATCH DOM updates using DocumentFragment\nconst fragment = document.createDocumentFragment();\nfor (let i = 0; i < 100; i++) {\n    const div = document.createElement('div');\n    div.textContent = `Item ${i}`;\n    fragment.appendChild(div); // Zero reflows\n}\ndocument.body.appendChild(fragment); // Single reflow!"),
                sec("2. Event Propagation: Capturing, Target, and Bubbling",
                    "Events propagate in three phases:\n1. Capturing Phase: Travels down from `window` to the target element.\n2. Target Phase: Fires directly on the target element.\n3. Bubbling Phase: Bubbles up from target back to `window`.\nEvent Delegation leverages bubbling by attaching a single listener to a common ancestor, saving memory.",
                    "document.getElementById('list-container').addEventListener('click', (e) => {\n    const item = e.target.closest('.list-item');\n    if (!item) return;\n    console.log('Clicked item ID:', item.dataset.id);\n});"),
                sec("3. High-Performance APIs: IntersectionObserver & MutationObserver",
                    "Rather than binding scroll listeners with CPU-heavy `getBoundingClientRect()`, `IntersectionObserver` informs you asynchronously off the main thread when elements enter the viewport.",
                    "const lazyObserver = new IntersectionObserver((entries) => {\n    entries.forEach(entry => {\n        if (entry.isIntersecting) {\n            const img = entry.target;\n            img.src = img.dataset.src;\n            lazyObserver.unobserve(img);\n        }\n    });\n});"),
                sec("4. Debouncing vs Throttling",
                    "• Debounce: Delays execution until a period of silence has elapsed (ideal for search autocomplete inputs).\n• Throttle: Enforces a maximum execution frequency (e.g. at most once every 100ms for window resize or scroll tracking).",
                    "const debounce = (fn, delayMs) => {\n    let timer;\n    return (...args) => {\n        clearTimeout(timer);\n        timer = setTimeout(() => fn(...args), delayMs);\n    };\n};"),
                sec("5. Production Best Practices",
                    "• Use `requestAnimationFrame` for smooth 60fps/120fps visual animations.\n• Always clean up event listeners when elements or components unmount to prevent leaks.\n• Favor CSS transforms (`translate3d`, `scale`) over animating `top`, `left`, `width` to stay on the GPU compositor thread without triggering CPU reflows.",
                    "// Animate with transform (GPU compositor layer only, 0 reflow)\nelement.style.transform = 'translate3d(100px, 0, 0)';")
            ],
            "references": [
                ref("MDN Web Docs — Introduction to the DOM", "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction", "Mozilla", "Authoritative Guide", "Comprehensive guide to DOM nodes, attributes, and APIs."),
                ref("Google Web Fundamentals — Avoid Large, Complex Layouts and Layout Thrashing", "https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/", "Google Chrome Team", "Performance Guide", "Engineering guide to layout thrashing and rendering optimization.")
            ],
            "keyTakeaways": [
                "Reflow recalculates geometry; repaint fills pixels; compositing blends GPU layers.",
                "Event delegation attaches one listener to a parent, minimizing memory footprint.",
                "Use `IntersectionObserver` for lazy loading without scroll lag.",
                "Animate CSS `transform` and `opacity` to avoid triggering layout reflows."
            ],
            "knowledgeCheck": [
                kc("kc_js3_1", "Why is animating CSS `transform` faster than animating `left` or `top`?",
                   ["Transforms run in Web Workers", "Transforms are processed on the GPU composite layer without triggering layout reflows", "Transforms don't support colors", "Transforms are cached by the browser DNS"],
                   1, "Transforms and opacity bypass the Layout and Paint stages, operating entirely on the GPU compositor.")
            ],
            "interactiveSandboxCode": "const debounce = (fn, delay) => {\n  let t;\n  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };\n};\nconst log = debounce((val) => console.log('Executed:', val), 200);\nlog('A'); log('B'); log('C'); // Only 'C' logs after 200ms\n"
        },
        4: {
            "subtitle": "ES Modules (ESM), Destructuring, Generators, Iterators, and WeakMap/WeakSet.",
            "estimatedTime": "55 mins",
            "overview": "Modern enterprise JavaScript standards. Deeply understand ES Modules (live bindings vs CommonJS), advanced destructuring, generator functions (`function*`) and the iterator protocol (`Symbol.iterator`), `WeakMap` and `WeakSet` for zero-leak memory management, and structured cloning.",
            "sections": [
                sec("1. ES Modules (ESM) vs CommonJS (CJS)",
                    "ES Modules (`import`/`export`) are statically analyzable at compile time, enabling tree-shaking (dead code elimination). ESM exports live bindings to variables, whereas CommonJS (`require`/`module.exports`) copies values at runtime.",
                    "// ESM (Live Binding)\n// counter.js: export let count = 0; export const inc = () => count++;\n// main.js: import { count, inc } from './counter.js'; inc(); console.log(count); // 1"),
                sec("2. The Iterator and Generator Protocol (Symbol.iterator)",
                    "Any object implementing `[Symbol.iterator]()` that returns an object with a `.next()` method can be consumed by `for...of` loops and spread operators (`...`). Generators (`function*`) yield control lazily, streaming sequence items in O(1) memory.",
                    "function* infiniteSequence(start = 0, step = 1) {\n    let val = start;\n    while (true) {\n        yield val;\n        val += step;\n    }\n}\nconst nums = infiniteSequence(10, 5);\nconsole.log(nums.next().value); // 10\nconsole.log(nums.next().value); // 15"),
                sec("3. WeakMap & WeakSet for Zero-Leak Memory Management",
                    "Standard `Map` and `Set` hold strong references to keys, preventing garbage collection. `WeakMap` holds weak references: if no other reference to an object exists, the engine reclaims it automatically. WeakMap keys must strictly be objects.",
                    "const metadataStore = new WeakMap();\nlet userObj = { id: 42 };\nmetadataStore.set(userObj, { lastAccessed: Date.now() });\nuserObj = null; // metadataStore entry is automatically garbage-collected!"),
                sec("4. Native Deep Copying with structuredClone()",
                    "Historically, deep cloning required `JSON.parse(JSON.stringify(obj))` which drops dates, maps, sets, and circular references. Modern browsers and Node 17+ provide native `structuredClone()`, which handles cyclical graphs and typed arrays natively.",
                    "const original = { date: new Date(), map: new Map([['key', 'val']]) };\noriginal.self = original; // Circular reference!\nconst copy = structuredClone(original);\nconsole.log(copy.date instanceof Date); // true\nconsole.log(copy.self === copy);         // true"),
                sec("5. Production Best Practices",
                    "• Use Object.freeze() with TypeScript `as const` for immutable configuration objects.\n• Leverage optional chaining (`?.`) and nullish coalescing (`??`) to avoid `Cannot read properties of undefined` runtime crashes.",
                    "const config = Object.freeze({ apiBase: 'https://api.domain.com', timeout: 5000 });")
            ],
            "references": [
                ref("MDN Web Docs — Iterators and Generators", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators", "Mozilla", "Authoritative Guide", "Guide to custom iterables and generator functions."),
                ref("MDN Web Docs — structuredClone()", "https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone", "Mozilla", "Authoritative Guide", "Documentation on the structured clone algorithm.")
            ],
            "keyTakeaways": [
                "ES Modules provide static analysis, tree shaking, and live variable bindings.",
                "Generators yield values lazily, enabling infinite sequences in O(1) memory.",
                "`WeakMap` prevents memory leaks by allowing keys to be garbage-collected.",
                "`structuredClone` handles circular references and complex types natively."
            ],
            "knowledgeCheck": [
                kc("kc_js4_1", "What makes WeakMap different from Map regarding garbage collection?",
                   ["WeakMap holds weak references to keys, allowing keys to be collected when no other references exist", "WeakMap stores values on disk", "WeakMap is asynchronous", "WeakMap allows string keys only"],
                   0, "WeakMap does not prevent garbage collection of its object keys.")
            ],
            "interactiveSandboxCode": "function* idMaker() {\n  let id = 1;\n  while (id <= 3) yield id++;\n}\nfor (const id of idMaker()) console.log('ID:', id);\n"
        }
    },

    # ── JAVA TRACK ──
    "java": {
        0: {
            "subtitle": "JVM Architecture, ClassLoader, JIT Tiered Compilation, Stack vs Heap, and Primitive Types.",
            "estimatedTime": "50 mins",
            "overview": "Master Java Virtual Machine (JVM) internals. Understand the ClassLoader subsystem (Bootstrap, Extension, Application), memory layout (Method Area, Heap, JVM Stack, PC Registers, Native Stack), JIT tiered compilation (C1 Client vs C2 Server compilers), and escape analysis.",
            "sections": [
                sec("1. JVM Runtime Memory Layout & Subsystems",
                    "The JVM memory model partitions memory into five runtime data areas:\n• Heap Area: Shared across all threads; stores all object instances and arrays.\n• Method Area (Metaspace): Stores class metadata, bytecode, and runtime constant pool.\n• JVM Stack: Per-thread stack frames storing local variables, operand stacks, and frame data.\n• PC Registers: Tracks the current bytecode instruction address for each thread.\n• Native Method Stack: Supports native C/C++ JNI calls.",
                    "public class MemoryModel {\n    // Allocated in Heap (Instance field)\n    private int id = 100;\n    \n    public void compute() {\n        // Allocated in current thread's Stack Frame (Local primitive)\n        int localVal = 42;\n        // 'user' pointer on Stack, User object allocated in Heap\n        User user = new User(\"Alice\");\n    }\n}"),
                sec("2. The ClassLoader Subsystem & Delegation Model",
                    "Classes are loaded dynamically via three ClassLoaders in a hierarchical Parent Delegation Model:\n1. Bootstrap ClassLoader: Loads core classes (`java.lang.*`, `rt.jar`).\n2. Extension (Platform) ClassLoader: Loads platform extensions (`jre/lib/ext`).\n3. Application (System) ClassLoader: Loads classpath user classes.",
                    "ClassLoader cl = MemoryModel.class.getClassLoader();\nSystem.out.println(\"App ClassLoader: \" + cl);\nSystem.out.println(\"Parent (Platform): \" + cl.getParent());\nSystem.out.println(\"Bootstrap: \" + cl.getParent().getParent()); // null (C++ root)"),
                sec("3. JIT Tiered Compilation & Escape Analysis",
                    "HotSpot JVM starts by interpreting bytecode. Hot methods are identified via invocation counters and compiled by Tier 1 (C1 - quick optimization) and Tier 2 (C2 - aggressive optimization: loop unrolling, inlining, branch prediction).\n\nEscape Analysis detects if an allocated object escapes the declaring method scope. If it does not escape, the JVM can perform Scalar Replacement (allocating fields directly on the CPU stack instead of the heap) and Lock Elision.",
                    "// Non-escaping object: JVM can optimize to stack allocation\npublic int getPointDistance(int x, int y) {\n    Point p = new Point(x, y); // Does not escape method\n    return p.x + p.y;          // HotSpot optimizes away heap allocation!\n}"),
                sec("4. Primitive Types vs Wrapper Objects & Auto-Boxing Overhead",
                    "Java primitives (`int`, `double`, `boolean`) are 4-8 bytes of unboxed raw bits on the stack. Wrapper objects (`Integer`, `Double`) add a 12-16 byte object header plus 4-byte reference pointer, consuming 4x more memory and introducing cache misses. Avoid autoboxing inside tight loops.",
                    "// BAD: Autoboxing allocates 1,000,000 Integer objects on the heap\nLong sum = 0L;\nfor (long i = 0; i < 1_000_000; i++) sum += i;\n\n// GOOD: Zero heap allocations\nlong fastSum = 0L;\nfor (long i = 0; i < 1_000_000; i++) fastSum += i;"),
                sec("5. Production Best Practices",
                    "• Configure explicit heap bounds in production (`-Xms4g -Xmx4g`) to avoid dynamic heap resizing pauses.\n• Enable GC logging (`-Xlog:gc*`) to diagnose latency spikes and heap occupancy.",
                    "// JVM flags for low-latency production microservices:\n// java -Xms4g -Xmx4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar")
            ],
            "references": [
                ref("The Java Virtual Machine Specification (Java SE 17)", "https://docs.oracle.com/javase/specs/jvms/se17/html/", "Oracle", "Official Standard Spec", "Definitive specification of JVM class format, bytecode instructions, and memory layout."),
                ref("Effective Java (3rd Edition) — Joshua Bloch", "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/", "Addison-Wesley", "Authoritative Literature", "The industry gold-standard guide to Java programming best practices.")
            ],
            "keyTakeaways": [
                "JVM separates memory into Heap (shared objects) and Stack (per-thread frames).",
                "Parent delegation model prevents duplicate class definitions.",
                "JIT tiered compilation optimizes hot bytecode paths directly into machine code.",
                "Avoid autoboxing in performance-critical loops."
            ],
            "knowledgeCheck": [
                kc("kc_java0_1", "Where are local primitive variables stored in Java?",
                   ["In the Metaspace", "On the current thread's JVM Stack frame", "In the shared Heap area", "On the GPU"],
                   1, "Local primitives reside directly on the stack frame of the executing thread.")
            ],
            "interactiveSandboxCode": "public class Demo {\n  public static void main(String[] args) {\n    System.out.println(\"Java JVM Architecture Verified\");\n  }\n}\n"
        },
        1: {
            "subtitle": "Encapsulation, Polymorphism, vtable Dispatch, Records, Sealed Classes, and Interfaces.",
            "estimatedTime": "55 mins",
            "overview": "Enterprise object-oriented design in modern Java. Understand method overriding, virtual method table (vtable) dispatch, default interface methods, immutable Records (Java 16+), Sealed Classes (Java 17+), and the SOLID architectural principles.",
            "sections": [
                sec("1. Virtual Method Table (vtable) & Dynamic Dispatch",
                    "In Java, all non-static, non-final, non-private methods are virtual by default. The JVM resolves overrides at runtime using a Virtual Method Table (`vtable`). Each class has a vtable pointing to its concrete method implementations, achieving dynamic polymorphism with O(1) table lookup.",
                    "public interface PaymentProcessor {\n    void processPayment(double amount);\n}\npublic class StripeProcessor implements PaymentProcessor {\n    @Override public void processPayment(double amount) {\n        System.out.println(\"Processing via Stripe: $\" + amount);\n    }\n}"),
                sec("2. Modern Java: Records for Immutable Data Carriers",
                    "Java 16 introduced `record`, an immutable data class where the compiler automatically generates the private final fields, constructor, getters, `equals()`, `hashCode()`, and `toString()` with zero boilerplate.",
                    "public record UserCredential(String username, String role, boolean active) {\n    // Compact constructor for validation\n    public UserCredential {\n        if (username == null || username.isBlank())\n            throw new IllegalArgumentException(\"Username cannot be empty\");\n    }\n}\nUserCredential cred = new UserCredential(\"admin\", \"SUPERUSER\", true);\nSystem.out.println(cred.username()); // Getter method"),
                sec("3. Sealed Classes & Exhaustive Pattern Matching (Java 17+)",
                    "Sealed classes (`sealed ... permits`) restrict which subclasses can extend them. This enables compile-time exhaustive checks in switch expressions without requiring default branches.",
                    "public sealed interface Result permits Success, Failure {}\npublic record Success(String data) implements Result {}\npublic record Failure(String error) implements Result {}\n\npublic String handle(Result r) {\n    return switch (r) {\n        case Success s -> \"Data: \" + s.data();\n        case Failure f -> \"Error: \" + f.error();\n    }; // Compiler guarantees all subtypes are covered!\n}"),
                sec("4. Interfaces: Default & Static Methods vs Abstract Classes",
                    "Java 8+ allows interfaces to define `default` methods (providing backwards-compatible implementations) and `static` utility methods. Abstract classes maintain instance state (`protected fields`), while interfaces define capabilities.",
                    "public interface Auditable {\n    long getTimestamp();\n    default String getFormattedAuditLog() {\n        return \"Audit Entry created at: \" + new java.util.Date(getTimestamp());\n    }\n}"),
                sec("5. SOLID Best Practice: Dependency Inversion",
                    "High-level modules should not depend on low-level modules; both should depend on abstractions. Inject interfaces via constructors to enable test mocking.",
                    "public class OrderService {\n    private final PaymentProcessor paymentProcessor;\n    public OrderService(PaymentProcessor paymentProcessor) {\n        this.paymentProcessor = paymentProcessor;\n    }\n}")
            ],
            "references": [
                ref("JEP 395: Records (Java SE 16)", "https://openjdk.org/jeps/395", "OpenJDK", "Official Standard Spec", "Specification for Java records."),
                ref("JEP 409: Sealed Classes (Java SE 17)", "https://openjdk.org/jeps/409", "OpenJDK", "Official Standard Spec", "Specification for sealed classes and interfaces.")
            ],
            "keyTakeaways": [
                "vtable lookups provide O(1) dynamic method dispatch in the JVM.",
                "Java Records eliminate boilerplate for immutable data objects.",
                "Sealed classes allow exhaustive compile-time pattern matching.",
                "Always code against interfaces to satisfy the Dependency Inversion Principle."
            ],
            "knowledgeCheck": [
                kc("kc_java1_1", "What does declaring a class as `sealed` achieve in Java 17?",
                   ["It locks the class into Metaspace permanently", "It restricts which classes or interfaces may extend or implement it", "It disables serialization", "It forces all fields to be public static"],
                   1, "Sealed classes explicitly declare which subclasses are permitted to extend them.")
            ],
            "interactiveSandboxCode": "record Point(int x, int y) {}\nPoint p = new Point(10, 20);\nSystem.out.println(p.x() + \", \" + p.y());\n"
        },
        2: {
            "subtitle": "Collections Hierarchy, HashMap Buckets & Treeification, ConcurrentHashMap, and Generics PECS.",
            "estimatedTime": "55 mins",
            "overview": "Deep technical tour of the Java Collections Framework. Master ArrayList vs LinkedList performance, HashMap internal bucketing and Red-Black tree conversion (`TREEIFY_THRESHOLD = 8`), thread-safe `ConcurrentHashMap` with CAS, Generics type erasure, and bounded wildcards (`<? extends T>` and `<? super T>`).",
            "sections": [
                sec("1. HashMap Architecture: Hash Buckets & Red-Black Treeification",
                    "A `HashMap` stores key-value pairs in an internal array of nodes (`Node<K,V>[]`). When multiple keys hash to the same bucket (collision), they form a linked list. In Java 8+, if a single bucket reaches 8 elements (`TREEIFY_THRESHOLD = 8`) and capacity >= 64, the linked list transforms into a Red-Black Tree, improving worst-case search time from O(N) to O(log N).",
                    "import java.util.HashMap;\nHashMap<String, Integer> map = new HashMap<>(64, 0.75f);\nmap.put(\"metrics\", 42);\n// Hash calculation: (h = key.hashCode()) ^ (h >>> 16) distributes entropy"),
                sec("2. Thread Safety: ConcurrentHashMap vs Collections.synchronizedMap",
                    "`Collections.synchronizedMap` synchronizes the entire map with a single global mutex lock, bottlenecking concurrent threads. `ConcurrentHashMap` uses lock-free Compare-And-Swap (CAS) on empty bucket heads and synchronizes only on the specific bucket node when inserting, achieving high-concurrency throughput.",
                    "import java.util.concurrent.ConcurrentHashMap;\nConcurrentHashMap<String, Long> metrics = new ConcurrentHashMap<>();\nmetrics.compute(\"request_count\", (k, v) -> (v == null) ? 1L : v + 1L);"),
                sec("3. Generics & Type Erasure",
                    "Java generics exist at compile time for static type safety; they are eliminated at runtime via Type Erasure. `List<String>` and `List<Integer>` compile down to raw `List` in bytecode, with the compiler inserting automatic casts. Because of erasure, you cannot instantiate generic arrays (`new T[10]`) or check generic types (`obj instanceof List<String>`).",
                    "// Type erasure: both share the exact same runtime Class\nList<String> sList = new ArrayList<>();\nList<Integer> iList = new ArrayList<>();\nSystem.out.println(sList.getClass() == iList.getClass()); // true!"),
                sec("4. Bounded Wildcards & The PECS Principle",
                    "PECS stands for: Producer Extends, Consumer Super:\n• Producer (`<? extends T>`): If your method reads data from a collection, use `extends` (covariance).\n• Consumer (`<? super T>`): If your method writes data into a collection, use `super` (contravariance).",
                    "public static <T> void copy(List<? super T> dest, List<? extends T> src) {\n    for (T item : src) dest.add(item);\n}"),
                sec("5. Production Pitfall: Mutable HashMap Keys",
                    "If an object's fields used in its `hashCode()` method are modified after insertion into a `HashMap`, its bucket location changes, making the entry permanently lost and unretrievable. Always use immutable types (String, UUID, Integer, Record) as map keys.",
                    "// NEVER modify an object's fields after using it as a HashMap key!")
            ],
            "references": [
                ref("Oracle Java SE Collections Framework Overview", "https://docs.oracle.com/javase/8/docs/technotes/guides/collections/overview.html", "Oracle", "Official Documentation", "Detailed architectural specification of the Java Collections hierarchy."),
                ref("Effective Java Item 31: Use bounded wildcards to increase API flexibility", "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/", "Addison-Wesley", "Authoritative Literature", "Definitive guide on PECS and Java generics.")
            ],
            "keyTakeaways": [
                "HashMap converts collided linked lists into Red-Black trees at 8 nodes.",
                "ConcurrentHashMap uses CAS and bucket-level locking for lock-free scaling.",
                "Java Generics use compile-time Type Erasure.",
                "PECS: Producer Extends, Consumer Super."
            ],
            "knowledgeCheck": [
                kc("kc_java2_1", "What occurs in a Java 8+ HashMap when a single hash bucket contains 8 elements?",
                   ["The map throws an OutOfMemoryError", "The bucket linked list transforms into a Red-Black tree to guarantee O(log N) search", "The entire map is cleared", "The capacity doubles without re-hashing"],
                   1, "When bucket size hits TREEIFY_THRESHOLD (8), it treeifies into a Red-Black tree.")
            ],
            "interactiveSandboxCode": "java.util.List<String> list = new java.util.ArrayList<>();\nlist.add(\"Java\"); list.add(\"Collections\");\nSystem.out.println(list.size());\n"
        },
        3: {
            "subtitle": "Checked vs Unchecked Exceptions, Try-with-Resources, AutoCloseable, and Java NIO.2 Channels.",
            "estimatedTime": "50 mins",
            "overview": "Resilient error handling and modern asynchronous I/O in Java. Master checked vs unchecked exception philosophy, deterministic cleanup with Try-with-Resources (`AutoCloseable`), JVM exception table bytecode mechanics, and non-blocking Java NIO.2 Channels and ByteBuffers.",
            "sections": [
                sec("1. Exception Hierarchy: Checked vs Unchecked",
                    "`Throwable` splits into `Error` (JVM-level unrecoverable failures like `OutOfMemoryError`) and `Exception`. `Exception` splits into:\n• Checked Exceptions (`Exception` subclasses): Enforced at compile time (`IOException`, `SQLException`). Must be caught or declared.\n• Unchecked Exceptions (`RuntimeException` subclasses): Indicate programming bugs (`NullPointerException`, `IllegalArgumentException`).",
                    "public void readFile(String path) throws IOException { // Checked\n    if (path == null) throw new IllegalArgumentException(\"Path cannot be null\"); // Unchecked\n}"),
                sec("2. Try-with-Resources & The AutoCloseable Interface",
                    "Introduced in Java 7, Try-with-Resources automatically invokes `.close()` on all declared resources implementing `java.lang.AutoCloseable`, even when exceptions are thrown, eliminating `finally` block memory leaks.",
                    "import java.io.*;\npublic void copyFile(String src, String dest) throws IOException {\n    try (InputStream in = new FileInputStream(src);\n         OutputStream out = new FileOutputStream(dest)) {\n        in.transferTo(out);\n    } // Both streams closed automatically in reverse order\n}"),
                sec("3. JVM Exception Table Bytecode Mechanics",
                    "The JVM does not use costly runtime overhead during normal execution. It compiles `try-catch` blocks into an Exception Table specifying start PC, end PC, handler PC, and catch type. If an exception occurs, the JVM looks up the current instruction counter in the table in O(1).",
                    "// Bytecode Exception Table:\n// from    to  target type\n//    0     8    11   Class java/io/IOException"),
                sec("4. Java NIO.2: Asynchronous Channels & ByteBuffers",
                    "Java NIO replaces traditional blocking stream I/O with high-throughput non-blocking Channels and ByteBuffers. `Files.newByteChannel` and `FileChannel.map` allow direct memory-mapped file access (mmap) for zero-copy I/O.",
                    "import java.nio.file.*;\nimport java.nio.ByteBuffer;\nimport java.nio.channels.FileChannel;\n\npublic void readNio(Path path) throws Exception {\n    try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {\n        ByteBuffer buffer = ByteBuffer.allocateDirect(1024); // Native off-heap memory\n        int bytesRead = channel.read(buffer);\n    }\n}"),
                sec("5. Production Anti-Pattern: Swallowing Exceptions",
                    "Never write `catch (Exception e) {}`. Always log the full stack trace or wrap and re-throw with the original exception preserved as the cause.",
                    "try { doWork(); }\ncatch (SQLException e) {\n    throw new ServiceException(\"Database operation failed\", e); // Preserves cause\n}")
            ],
            "references": [
                ref("Oracle Java Tutorial — The try-with-resources Statement", "https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html", "Oracle", "Official Tutorial", "Official guide on AutoCloseable and resource management."),
                ref("Java NIO.2 Documentation", "https://docs.oracle.com/javase/8/docs/technotes/guides/io/index.html", "Oracle", "Official Guide", "Technical documentation on Channels, Buffers, and Paths.")
            ],
            "keyTakeaways": [
                "Use unchecked exceptions for recoverable programming bugs and checked for external failures.",
                "Try-with-resources closes all AutoCloseable objects deterministically.",
                "Exception tables provide zero runtime cost when no exceptions are thrown.",
                "Java NIO.2 direct buffers leverage off-heap memory for zero-copy I/O."
            ],
            "knowledgeCheck": [
                kc("kc_java3_1", "What interface must an object implement to be utilized within a Try-with-Resources statement?",
                   ["java.io.Serializable", "java.lang.AutoCloseable", "java.lang.Runnable", "java.util.Iterator"],
                   1, "Try-with-resources requires the object to implement AutoCloseable or Closeable.")
            ],
            "interactiveSandboxCode": "try (var s = new java.util.Scanner(\"Hello Java NIO\")) {\n  System.out.println(s.nextLine());\n}\n"
        },
        4: {
            "subtitle": "Java Memory Model (JMM), volatile, ReentrantLock, Virtual Threads, and Parallel Streams.",
            "estimatedTime": "55 mins",
            "overview": "Concurrent programming in modern Java. Understand the Java Memory Model (JMM), the happens-before relationship, `volatile` memory fences, `synchronized` vs `ReentrantLock`, thread pool executor sizing, and Java 21 Virtual Threads (Project Loom).",
            "sections": [
                sec("1. The Java Memory Model (JMM) & volatile Semantics",
                    "Modern multi-core CPUs use L1/L2 caches, causing threads to read stale data from CPU registers. The JMM defines the `happens-before` relationship. Declaring a field `volatile` ensures:\n1. Visibility: Reads and writes bypass CPU caches and go directly to main memory.\n2. Reordering Prevention: Inserts memory fences preventing instructions from being reordered across the read/write.",
                    "public class SharedFlag {\n    private volatile boolean running = true;\n    public void stop() { running = false; } // Visible to all threads immediately\n    public void run() { while (running) { /* CPU cache will not hide 'running' */ } }\n}"),
                sec("2. Synchronized vs ReentrantLock & Atomic Variables",
                    "• `synchronized`: Built-in JVM intrinsic lock with biased locking, lightweight locking (spin locks), and heavyweight OS mutex fallback.\n• `ReentrantLock`: Flexible lock offering fairness policies, timeouts (`tryLock`), and condition variables.\n• `AtomicInteger` / `AtomicReference`: Non-blocking lock-free counters utilizing CPU hardware CAS instructions.",
                    "import java.util.concurrent.atomic.AtomicInteger;\nimport java.util.concurrent.locks.ReentrantLock;\n\nAtomicInteger counter = new AtomicInteger(0);\ncounter.incrementAndGet(); // Lock-free atomic increment via CPU CAS"),
                sec("3. ThreadPoolExecutor Sizing & ForkJoinPool",
                    "Never create raw threads (`new Thread()`) in production because OS thread stacks cost ~1MB each. Use `ThreadPoolExecutor`:\n• CPU-bound tasks: Pool size = `Runtime.getRuntime().availableProcessors()`\n• I/O-bound tasks: Pool size = `CPU_cores * (1 + Wait_Time / Compute_Time)`",
                    "import java.util.concurrent.*;\nExecutorService pool = Executors.newFixedThreadPool(8);\npool.submit(() -> System.out.println(\"Executed in worker thread\"));\npool.shutdown();"),
                sec("4. Java 21 Project Loom: Virtual Threads",
                    "Java 21 introduced Virtual Threads (Project Loom). Unlike heavyweight OS platform threads, virtual threads are lightweight user-space threads managed directly by the JVM. Millions of virtual threads can run concurrently; when a virtual thread blocks on I/O, the JVM unmounts it from the carrier OS thread.",
                    "// Spawns 10,000 lightweight virtual threads without exhausting OS memory\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    for (int i = 0; i < 10_000; i++) {\n        executor.submit(() -> {\n            Thread.sleep(100); // Does NOT block the OS thread!\n            return \"Done\";\n        });\n    }\n}"),
                sec("5. Java Parallel Streams & ForkJoinPool Pitfalls",
                    "Parallel streams (`list.parallelStream()`) execute tasks concurrently across the common `ForkJoinPool`. Avoid running blocking I/O calls inside parallel streams as they starve the shared JVM common pool.",
                    "long sum = java.util.stream.LongStream.rangeClosed(1, 1_000_000)\n    .parallel().filter(x -> x % 2 == 0).sum();")
            ],
            "references": [
                ref("JSR 133: Java Memory Model and Thread Specification", "https://jcp.org/en/jsr/detail?id=133", "JCP", "Official Standard Spec", "The formal specification of the Java Memory Model and happens-before guarantees."),
                ref("JEP 444: Virtual Threads (Java SE 21)", "https://openjdk.org/jeps/444", "OpenJDK", "Official Standard Spec", "Specification for lightweight virtual threads in Java 21.")
            ],
            "keyTakeaways": [
                "`volatile` guarantees visibility and prevents instruction reordering.",
                "Atomic variables use CPU hardware CAS instructions for lock-free scaling.",
                "Virtual Threads (Java 21) allow millions of concurrent tasks with minimal memory.",
                "Never run blocking I/O inside the common ForkJoinPool."
            ],
            "knowledgeCheck": [
                kc("kc_java4_1", "What does the `volatile` keyword guarantee in Java?",
                   ["Atomic increment operations on variables", "Visibility across threads by bypassing CPU cache and preventing instruction reordering", "Automatic thread creation", "Encryption of data in memory"],
                   1, "volatile ensures that any read reads the most recent write from main memory across all threads.")
            ],
            "interactiveSandboxCode": "java.util.concurrent.atomic.AtomicInteger ai = new java.util.concurrent.atomic.AtomicInteger(10);\nSystem.out.println(ai.addAndGet(5));\n"
        }
    },

    # ── MODERN C++ TRACK ──
    "cpp": {
        0: {
            "subtitle": "Virtual Memory Models, Pointer Arithmetic, References, Cache Lines, and Undefined Behavior.",
            "estimatedTime": "50 mins",
            "overview": "Low-level system architecture with Modern C++20. Master the process virtual memory layout (Stack, Heap, Data, BSS, Text), raw pointer mechanics, pointer arithmetic, lvalue vs rvalue references, cache line alignment (`alignas`), false sharing, and Undefined Behavior (UB) prevention.",
            "sections": [
                sec("1. Process Virtual Memory Architecture",
                    "A C++ process operates within a virtual address space managed by the OS kernel and MMU:\n• Stack: Fast LIFO contiguous memory allocated by moving the stack pointer register (`RSP`). Holds local variables and return addresses.\n• Heap: Dynamic memory allocated via `malloc`/`new`, managed by runtime heap allocators (glibc ptmalloc, jemalloc).\n• Data & BSS: Global and static variables (initialized vs uninitialized).\n• Text: Read-only machine bytecode.",
                    "#include <iostream>\nint global_data = 100;\nint main() {\n    int stack_var = 42;\n    int* heap_var = new int(99);\n    std::cout << \"Stack: \" << &stack_var << \" | Heap: \" << heap_var << std::endl;\n    delete heap_var;\n}"),
                sec("2. Pointer Arithmetic & Memory Alignment",
                    "Pointers store virtual memory addresses. Pointer arithmetic advances by multiples of `sizeof(*ptr)`. CPU architectures require data to be aligned to natural boundaries (e.g. 64-bit doubles aligned to 8-byte addresses) to avoid unaligned access penalties.",
                    "#include <iostream>\nint arr[4] = {10, 20, 30, 40};\nint* ptr = arr;\nstd::cout << *(ptr + 2); // 30 (advances 2 * sizeof(int) = 8 bytes)"),
                sec("3. Cache Lines & False Sharing Prevention",
                    "CPUs load memory into cache hierarchies in 64-byte chunks called Cache Lines. When two threads on separate cores modify independent variables located on the exact same 64-byte cache line, CPU cache coherency protocols (MESI) invalidate caches repeatedly, causing False Sharing.\n\nUse `alignas(std::hardware_destructive_interference_size)` to align thread-local state onto distinct cache lines.",
                    "#include <new>\nstruct alignas(64) ThreadCounter {\n    uint64_t count{0}; // Isolated onto its own 64-byte cache line\n};"),
                sec("4. Undefined Behavior (UB) & Sanitizers",
                    "Undefined Behavior allows the compiler optimizer to assume conditions can never occur, leading to deleted security checks or phantom branches. Common UB triggers:\n• Dereferencing null or dangling pointers\n• Array out-of-bounds indexing\n• Signed integer overflow\nAlways compile with AddressSanitizer (`-fsanitize=address,undefined`) in CI/CD pipelines.",
                    "// NEVER invoke Undefined Behavior:\n// int* p = nullptr; *p = 10; // Crash or corrupted optimization"),
                sec("5. References vs Pointers",
                    "References are syntactically non-null aliases that cannot be reseated. Pointers can be null, reseated, and manipulated with pointer arithmetic. Favor references for parameter passing.",
                    "void increment(int& val) { val++; }\nint x = 5; increment(x); // x is now 6")
            ],
            "references": [
                ref("cppreference.com — C++ Memory Model", "https://en.cppreference.com/w/cpp/language/memory_model", "cppreference", "Authoritative Reference", "Detailed technical specification of C++ memory locations and threads."),
                ref("ISO/IEC 14882:2020 — Programming Language C++", "https://isocpp.org/std/the-standard", "ISO Standard", "Official Standard Spec", "The official ISO standard specification for C++20.")
            ],
            "keyTakeaways": [
                "Process memory is partitioned into Stack, Heap, Data, BSS, and Text segments.",
                "False sharing occurs when independent variables share a 64-byte cache line.",
                "Undefined Behavior permits aggressive compiler optimizations that break unverified code.",
                "Prefer non-null references over raw pointers for function arguments."
            ],
            "knowledgeCheck": [
                kc("kc_cpp0_1", "What is the typical size of a CPU cache line on modern x86-64 architectures?",
                   ["8 bytes", "64 bytes", "512 bytes", "4096 bytes"],
                   1, "Modern x86-64 CPUs load memory in 64-byte aligned chunks called cache lines.")
            ],
            "interactiveSandboxCode": "#include <iostream>\nint main() {\n  std::cout << \"C++ Systems Model Verified\" << std::endl;\n  return 0;\n}\n"
        },
        1: {
            "subtitle": "Resource Acquisition Is Initialization, Stack Unwinding, Rule of 3/5/0, and Mutex Guards.",
            "estimatedTime": "55 mins",
            "overview": "The foundational idiom of C++: Resource Acquisition Is Initialization (RAII). Master deterministic stack-based resource lifetime management, exception safety guarantees, stack unwinding, the Rule of Three, Five, and Zero, and scoped locking guards (`std::lock_guard`, `std::unique_lock`).",
            "sections": [
                sec("1. The RAII Idiom: Deterministic Lifetime Management",
                    "RAII binds the lifecycle of a resource (heap memory, file descriptors, network sockets, mutex locks) to the lifetime of a stack-allocated object. When the object leaves its lexical scope, its destructor is guaranteed to execute, releasing the resource deterministically even in the presence of exceptions.",
                    "#include <fstream>\n#include <string>\nvoid writeReport(const std::string& path, const std::string& data) {\n    std::ofstream file(path); // Resource acquired in constructor\n    file << data;\n} // file closed automatically in destructor upon scope exit"),
                sec("2. Stack Unwinding & Exception Safety Guarantees",
                    "When an exception is thrown, the C++ runtime walks down the Call Stack in reverse order, executing destructors for all fully constructed local objects (Stack Unwinding).\n• Basic Guarantee: Invariants preserved, no resource leaks.\n• Strong Guarantee: Commit-or-rollback semantics (operation succeeds or state unchanged).\n• Nothrow Guarantee (`noexcept`): Operation is guaranteed never to throw.",
                    "#include <mutex>\nstd::mutex mtx;\nvoid threadSafeOperation() {\n    std::lock_guard<std::mutex> lock(mtx); // Exception-safe RAII mutex lock\n    // If any exception throws here, 'lock' destructor releases 'mtx'!\n}"),
                sec("3. The Rule of Five & Rule of Zero",
                    "If a class directly manages a raw resource, you must explicitly implement or delete the Rule of Five:\n1. Destructor\n2. Copy Constructor\n3. Copy Assignment Operator\n4. Move Constructor\n5. Move Assignment Operator\n\nRule of Zero: Design classes that use standard RAII types (`std::vector`, `std::string`, `std::unique_ptr`) so you don't need to define any custom destructors or copy/move operations.",
                    "class RawBuffer {\n    int* data;\n    size_t size;\npublic:\n    RawBuffer(size_t sz) : data(new int[sz]), size(sz) {}\n    ~RawBuffer() { delete[] data; }\n    RawBuffer(const RawBuffer& other) : data(new int[other.size]), size(other.size) {\n        std::copy(other.data, other.data + size, data);\n    }\n    RawBuffer(RawBuffer&& other) noexcept : data(other.data), size(other.size) {\n        other.data = nullptr; other.size = 0;\n    }\n};"),
                sec("4. Scoped Locking with std::scoped_lock (Deadlock Prevention)",
                    "Acquiring multiple mutexes across threads can cause circular deadlocks. C++17 `std::scoped_lock` uses a deadlock-avoidance algorithm (equivalent to Peterson's or Chandy-Misra) to acquire multiple locks simultaneously.",
                    "#include <mutex>\nstd::mutex m1, m2;\nvoid transfer(int from, int to) {\n    std::scoped_lock lock(m1, m2); // Deadlock-free multi-lock acquisition\n}"),
                sec("5. Production Anti-Pattern: Throwing from Destructors",
                    "Never throw an exception from a destructor. If a destructor throws during stack unwinding while another exception is active, `std::terminate` is immediately called, aborting the process.",
                    "// Destructors are implicitly noexcept in modern C++!\n// ~MyClass() noexcept { /* Never throw here! */ }")
            ],
            "references": [
                ref("C++ Core Guidelines — Resource Management (R.1 - R.37)", "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r-resource-management", "Bjarne Stroustrup & Herb Sutter", "Authoritative Engineering Guidelines", "Official C++ Core Guidelines covering RAII, ownership, and smart pointers."),
                ref("Effective Modern C++ — Scott Meyers", "https://www.oreilly.com/library/view/effective-modern-c/9781491903988/", "O'Reilly", "Authoritative Literature", "Definitive guide on modern C++ idioms, move semantics, and smart pointer usage.")
            ],
            "keyTakeaways": [
                "RAII guarantees deterministic resource cleanup upon leaving scope.",
                "Stack unwinding invokes destructors automatically during exceptions.",
                "Follow the Rule of Five for raw resources, or Rule of Zero with standard RAII wrappers.",
                "Never throw exceptions from destructors."
            ],
            "knowledgeCheck": [
                kc("kc_cpp1_1", "What occurs if a destructor throws an exception while stack unwinding is already in progress?",
                   ["The second exception is queued", "std::terminate is immediately called, aborting the application", "The first exception is overwritten", "The program resumes"],
                   1, "Throwing during active stack unwinding calls std::terminate to prevent unmanageable concurrent exceptions.")
            ],
            "interactiveSandboxCode": "#include <iostream>\nstruct Guard {\n  Guard() { std::cout << \"Acquired\\n\"; }\n  ~Guard() { std::cout << \"Released\\n\"; }\n};\nint main() { Guard g; return 0; }\n"
        },
        2: {
            "subtitle": "Lvalues vs Rvalues, Move Semantics, std::move, std::unique_ptr, and std::shared_ptr.",
            "estimatedTime": "55 mins",
            "overview": "Modern memory safety in C++11/14/17/20. Master value categories (lvalue, prvalue, xvalue), rvalue references (`T&&`), zero-cost resource transfers with `std::move`, perfect forwarding with `std::forward`, and modern smart pointers (`std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`).",
            "sections": [
                sec("1. Value Categories & Rvalue References (T&&)",
                    "Every C++ expression has a type and a value category:\n• lvalue: An identity with a persistent memory location that can be placed on the left side of an assignment (`int x = 10;`).\n• rvalue: A temporary value without a persistent identity (`10`, `x + 5`, temporary function return).\nRvalue references (`T&&`) bind to temporary rvalues, allowing you to steal their internal resources rather than making deep copies.",
                    "#include <string>\n#include <iostream>\nstd::string a = \"Large Payload\";\nstd::string b = std::move(a); // Steals pointer buffer! 'a' is now empty\nstd::cout << \"b: \" << b << \" | a empty? \" << a.empty() << std::endl;"),
                sec("2. std::unique_ptr: Zero-Overhead Exclusive Ownership",
                    "`std::unique_ptr<T>` maintains exclusive ownership of a heap resource. It has zero runtime memory or speed overhead compared to a raw pointer (`sizeof(unique_ptr) == sizeof(void*)`). It cannot be copied, only moved.",
                    "#include <memory>\nstd::unique_ptr<int> p1 = std::make_unique<int>(42);\n// std::unique_ptr<int> p2 = p1; // Compile error! Cannot copy unique_ptr\nstd::unique_ptr<int> p2 = std::move(p1); // Transfers ownership; p1 is null"),
                sec("3. std::shared_ptr & Control Block Architecture",
                    "`std::shared_ptr<T>` enables shared ownership using atomic reference counting. It allocates a separate Control Block containing the strong reference count, weak reference count, and custom deleter. Always use `std::make_shared` to allocate the object and control block in a single contiguous memory chunk.",
                    "#include <memory>\nauto s1 = std::make_shared<std::string>(\"Shared Resource\");\nauto s2 = s1; // Refcount incremented to 2 (thread-safe atomic)\nstd::cout << \"Use count: \" << s1.use_count() << std::endl; // 2"),
                sec("4. std::weak_ptr & Cyclic Dependency Leaks",
                    "Circular `std::shared_ptr` references (Node A -> Node B and Node B -> Node A) prevent reference counts from ever reaching 0, causing permanent memory leaks. `std::weak_ptr` observes a `shared_ptr` without incrementing its strong reference count.",
                    "#include <memory>\nstruct Node {\n    std::weak_ptr<Node> next; // Breaks cyclical memory leak\n};"),
                sec("5. Perfect Forwarding with std::forward",
                    "Universal references (`T&&` in a template deduction context) combined with `std::forward<T>` forward arguments to another function preserving their exact value category (lvalue vs rvalue).",
                    "template <typename T>\nvoid forwardPayload(T&& arg) {\n    process(std::forward<T>(arg)); // Forwards rvalue as rvalue, lvalue as lvalue\n}")
            ],
            "references": [
                ref("Effective Modern C++ Items 18-22: Smart Pointers", "https://www.oreilly.com/library/view/effective-modern-c/9781491903988/", "Scott Meyers", "Authoritative Literature", "Definitive guide on unique_ptr, shared_ptr, and weak_ptr."),
                ref("cppreference.com — std::unique_ptr", "https://en.cppreference.com/w/cpp/memory/unique_ptr", "cppreference", "Technical Reference", "Complete API reference for std::unique_ptr.")
            ],
            "keyTakeaways": [
                "Move semantics allow transferring heap pointers from temporaries without deep copies.",
                "`std::unique_ptr` has zero overhead and enforces exclusive ownership.",
                "Always use `std::make_shared` to allocate object and control block together.",
                "Use `std::weak_ptr` to break circular reference memory leaks."
            ],
            "knowledgeCheck": [
                kc("kc_cpp2_1", "What is the memory size overhead of a std::unique_ptr compared to a raw pointer?",
                   ["16 bytes for reference count", "Zero overhead (same size as raw pointer)", "64 bytes for control block", "Depends on OS thread count"],
                   1, "std::unique_ptr with a default deleter has zero overhead and compiles into the exact same assembly as a raw pointer.")
            ],
            "interactiveSandboxCode": "#include <memory>\n#include <iostream>\nint main() {\n  auto p = std::make_unique<int>(100);\n  std::cout << *p << std::endl;\n  return 0;\n}\n"
        },
        3: {
            "subtitle": "Vector Amortized Growth, Deque Buffers, Unordered Maps, and Custom Lambdas.",
            "estimatedTime": "50 mins",
            "overview": "Master the Standard Template Library (STL). Understand vector contiguous memory allocation and geometric capacity growth (amortized O(1)), deque chunked buffers, associative containers (`std::map` Red-Black tree vs `std::unordered_map` hash table), algorithms, custom sort lambdas, and `std::span`.",
            "sections": [
                sec("1. std::vector: Contiguous Memory & Amortized O(1) Growth",
                    "`std::vector` stores elements in a contiguous heap array. When capacity is exceeded, it allocates a new array of 1.5x (MSVC) or 2.0x (GCC) capacity, copies/moves elements, and frees the old buffer. Use `vec.reserve(N)` upfront to eliminate reallocations.",
                    "#include <vector>\nstd::vector<int> v;\nv.reserve(1000); // Pre-allocates memory for 1000 elements\nfor (int i = 0; i < 1000; i++) v.push_back(i); // 0 reallocations!"),
                sec("2. std::map (Red-Black Tree) vs std::unordered_map (Hash Table)",
                    "• `std::map`: Implemented as a self-balancing Red-Black Tree. Keys are strictly ordered; search/insert is guaranteed O(log N).\n• `std::unordered_map`: Implemented as a bucketed hash table. Average search/insert is O(1), but worst-case is O(N) during high hash collisions.",
                    "#include <map>\n#include <unordered_map>\nstd::map<std::string, int> ordered; // Keys sorted alphabetically\nstd::unordered_map<std::string, int> hashed; // O(1) lookup"),
                sec("3. STL Algorithms & Custom Sort Lambdas",
                    "STL algorithms (`std::sort`, `std::find_if`, `std::transform`) operate on iterator ranges `[begin, end)`. Modern C++ lambdas can capture by value `[=]` or reference `[&]`.",
                    "#include <algorithm>\n#include <vector>\nstruct Task { int priority; std::string name; };\nstd::vector<Task> tasks = {{2, \"B\"}, {1, \"A\"}, {3, \"C\"}};\nstd::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {\n    return a.priority < b.priority; // Ascending priority sort\n});"),
                sec("4. Zero-Copy Views with std::string_view & std::span (C++20)",
                    "`std::string_view` and `std::span` (C++20) provide non-owning pointer-and-length views over contiguous data, eliminating deep string and vector copies during function calls.",
                    "#include <string_view>\nvoid printPrefix(std::string_view sv) {\n    // Bypasses std::string heap allocation entirely\n    std::cout << sv.substr(0, 4) << std::endl;\n}"),
                sec("5. Production Pitfall: Iterator Invalidation",
                    "Inserting into a vector can trigger memory reallocation, invalidating all existing pointers and iterators to its elements. Never dereference an iterator after pushing to a vector.",
                    "// BAD: iter invalidated if push_back triggers reallocation\n// for (auto it = v.begin(); it != v.end(); ++it) { v.push_back(*it); }")
            ],
            "references": [
                ref("cppreference.com — std::vector", "https://en.cppreference.com/w/cpp/container/vector", "cppreference", "Technical Reference", "Comprehensive documentation on vector capacity and reallocation mechanics."),
                ref("The C++ Standard Library (2nd Edition) — Nicolai Josuttis", "https://www.josuttis.com/libbook/", "Addison-Wesley", "Authoritative Literature", "The definitive encyclopedia of the C++ Standard Template Library.")
            ],
            "keyTakeaways": [
                "`std::vector` provides contiguous memory; call `reserve()` to prevent reallocations.",
                "`std::map` is ordered O(log N); `std::unordered_map` is hashed O(1).",
                "`std::span` and `std::string_view` provide zero-copy memory views.",
                "Modifying vectors can invalidate existing iterators."
            ],
            "knowledgeCheck": [
                kc("kc_cpp3_1", "Why should you call vector.reserve(N) before inserting N items?",
                   ["It locks the vector from modification", "It pre-allocates memory to eliminate repeated reallocations and buffer copying", "It sorts the vector automatically", "It enables multithreading"],
                   1, "reserve pre-allocates heap capacity so push_back executes without triggering array reallocations.")
            ],
            "interactiveSandboxCode": "#include <vector>\n#include <algorithm>\n#include <iostream>\nint main() {\n  std::vector<int> v = {3, 1, 4};\n  std::sort(v.begin(), v.end());\n  std::cout << v[0] << std::endl;\n  return 0;\n}\n"
        }
    },

    # ── FULL-STACK WEB DEVELOPMENT TRACK ──
    "webdev": {
        0: {
            "subtitle": "Client-Server Architecture, HTTP/2/3 Protocols, Semantic HTML5, and Core Web Vitals.",
            "estimatedTime": "50 mins",
            "overview": "Full-stack web architecture foundations. Understand HTTP/1.1 vs HTTP/2 multiplexing vs HTTP/3 QUIC (UDP), DNS resolution, TLS 1.3 handshakes, semantic HTML5 for SEO and WCAG 2.1 accessibility, and Google Core Web Vitals (LCP, INP, CLS).",
            "sections": [
                sec("1. Full-Stack Web Architecture & Protocols (HTTP/1 vs HTTP/2 vs HTTP/3)",
                    "Web architecture relies on the client-server model over TCP/IP:\n• HTTP/1.1: Suffers from Head-of-Line (HoL) blocking; browsers limit connections to 6 per domain.\n• HTTP/2: Binary protocol supporting bidirectional multiplexing over a single TCP connection.\n• HTTP/3: Operates over QUIC (UDP) eliminating TCP packet-level HoL blocking and accelerating TLS 1.3 0-RTT handshakes.",
                    "// HTTP/2 Multiplexing allows hundreds of assets to stream concurrently over 1 TCP socket"),
                sec("2. The DOM, Accessibility (WCAG 2.1) & Semantic HTML5",
                    "Semantic elements (`<main>`, `<article>`, `<nav>`, `<aside>`, `<header>`) provide meaningful accessibility trees for screen readers and SEO crawlers. Non-semantic `<div>` soup degrades accessibility and search rankings.",
                    "<main role=\"main\">\n  <article aria-labelledby=\"post-title\">\n    <h1 id=\"post-title\">Production Web Architecture</h1>\n    <p>Semantic document layout ensures accessible navigation.</p>\n  </article>\n</main>"),
                sec("3. Google Core Web Vitals Optimization",
                    "Core Web Vitals quantify real-world user experience:\n1. Largest Contentful Paint (LCP): Measures load performance (target <= 2.5s).\n2. Interaction to Next Paint (INP): Measures responsiveness (target <= 200ms).\n3. Cumulative Layout Shift (CLS): Measures visual stability (target <= 0.1).",
                    "<!-- Prevent Layout Shift (CLS) by specifying aspect-ratio or explicit dimensions -->\n<img src=\"hero.webp\" width=\"800\" height=\"450\" alt=\"Platform Dashboard\" style=\"aspect-ratio: 16/9;\">"),
                sec("4. Critical Rendering Path & Resource Hints",
                    "Accelerate page delivery using resource hints:\n• `dns-prefetch`: Resolves third-party DNS early.\n• `preconnect`: Performs DNS + TLS handshake in advance.\n• `preload`: Forces high-priority download of critical fonts and LCP images.",
                    "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preload\" href=\"/fonts/inter.woff2\" as=\"font\" type=\"font/woff2\" crossorigin>"),
                sec("5. Production Best Practices",
                    "• Use modern image formats (`AVIF`, `WebP`) with responsive `srcset`.\n• Minify HTML/CSS/JS and serve with Gzip or Brotli compression."
                )
            ],
            "references": [
                ref("MDN Web Docs — How the Web works", "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works", "Mozilla", "Authoritative Guide", "Foundational guide to DNS, TCP, and HTTP protocols."),
                ref("web.dev — Core Web Vitals Guide", "https://web.dev/vitals/", "Google Chrome Team", "Performance Standard", "Official metrics and optimization strategies for LCP, INP, and CLS.")
            ],
            "keyTakeaways": [
                "HTTP/2 multiplexes streams over one TCP connection; HTTP/3 uses QUIC over UDP.",
                "Semantic HTML improves SEO and accessibility compliance (WCAG 2.1).",
                "Core Web Vitals measure loading speed (LCP), responsiveness (INP), and visual stability (CLS).",
                "Always reserve space for images to prevent Cumulative Layout Shift (CLS)."
            ],
            "knowledgeCheck": [
                kc("kc_web0_1", "What does Cumulative Layout Shift (CLS) measure?",
                   ["Server response latency", "Unexpected movement of page content during loading", "JavaScript download time", "Database query execution speed"],
                   1, "CLS measures visual stability by tracking sudden layout shifts as fonts or images load.")
            ],
            "interactiveSandboxCode": "<!-- Semantic HTML structure -->\n<header><nav><a href=\"#\">Home</a></nav></header>\n<main><h1>Welcome</h1></main>\n"
        },
        1: {
            "subtitle": "CSS Box Model, BFC, Flexbox Alignment, CSS Grid 2D Systems, and Container Queries.",
            "estimatedTime": "50 mins",
            "overview": "Professional CSS layout engineering. Master the CSS Box Model (`border-box`), Block Formatting Context (BFC), Flexbox 1D layout mechanics, CSS Grid 2D layout systems with `minmax()` and `auto-fit`, fluid clamp typography, and modern Container Queries.",
            "sections": [
                sec("1. The CSS Box Model & box-sizing: border-box",
                    "By default (`content-box`), padding and borders add to an element's specified width, breaking layouts. Applying `box-sizing: border-box` globally ensures `width` includes content, padding, and border.",
                    "*, *::before, *::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}"),
                sec("2. Modern Flexbox 1D Architecture",
                    "Flexbox manages alignment and distribution along a single axis (row or column). Master `justify-content` (main axis), `align-items` (cross axis), `flex-grow`, `flex-shrink`, and `flex-basis`.",
                    ".navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n}"),
                sec("3. CSS Grid 2D Systems: auto-fit & minmax()",
                    "CSS Grid handles two-dimensional layouts simultaneously. Using `repeat(auto-fit, minmax(280px, 1fr))` creates a fully responsive card grid that wraps automatically without requiring media queries.",
                    ".card-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 24px;\n}"),
                sec("4. Fluid Typography with clamp()",
                    "CSS `clamp(min, preferred, max)` scales font sizes and spacing smoothly across viewport widths without abrupt breakpoint jumps.",
                    "h1 {\n  font-size: clamp(1.75rem, 4vw + 1rem, 3.25rem);\n}"),
                sec("5. Modern CSS: Container Queries (@container)",
                    "Media queries respond to the whole screen width. Container Queries respond to the size of the parent card, enabling truly modular, reusable responsive components.",
                    ".card-container { container-type: inline-size; }\n@container (min-width: 400px) {\n  .card { display: flex; }\n}")
            ],
            "references": [
                ref("MDN Web Docs — CSS Grid Layout", "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout", "Mozilla", "Authoritative Guide", "Comprehensive documentation on 2D grid layout systems."),
                ref("CSS-Tricks — A Complete Guide to Flexbox", "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", "CSS-Tricks", "Industry Guide", "The definitive visual guide to flexbox properties and alignment.")
            ],
            "keyTakeaways": [
                "Apply `box-sizing: border-box` globally to keep dimension calculations predictable.",
                "Use `repeat(auto-fit, minmax(px, 1fr))` for zero-media-query responsive grids.",
                "Use `clamp()` for fluid responsive typography.",
                "Container queries adapt components based on parent container width."
            ],
            "knowledgeCheck": [
                kc("kc_web1_1", "What does `box-sizing: border-box` do?",
                   ["Hides element borders", "Includes padding and border within the element's total specified width and height", "Centers text automatically", "Forces elements into CSS Grid mode"],
                   1, "border-box ensures that padding and borders do not expand the element beyond its defined width.")
            ],
            "interactiveSandboxCode": "/* Responsive Auto-Fitting Grid */\n.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }\n"
        },
        2: {
            "subtitle": "Virtual DOM, Fiber Reconciliation, Hooks Dependency Hygiene, and Component Lifecycle.",
            "estimatedTime": "55 mins",
            "overview": "React 19 engineering architecture. Master Virtual DOM diffing, Fiber reconciliation and concurrent scheduling, `useState` and `useEffect` dependency hygiene, memoization trade-offs (`useMemo`, `useCallback`), custom hook design, and state management.",
            "sections": [
                sec("1. Virtual DOM & Fiber Reconciliation Engine",
                    "React maintains an in-memory Virtual DOM tree. When state changes, React's Fiber reconciler breaks rendering work into incremental units (fibers) that can be paused, aborted, or prioritized, computing a minimal set of DOM mutations.",
                    "// React Fiber processes work units with interruptible scheduling"),
                sec("2. The Rules of Hooks & Dependency Hygiene",
                    "• Call hooks only at top level of React functions (never inside loops, conditions, or nested functions).\n• Always include all reactive values read by an effect in its dependency array to prevent stale closure bugs.",
                    "import { useState, useEffect } from 'react';\nfunction UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n  useEffect(() => {\n    let active = true;\n    fetch(`/api/users/${userId}`)\n      .then(res => res.json())\n      .then(data => { if (active) setUser(data); });\n    return () => { active = false; }; // Cleanup flag prevents race conditions\n  }, [userId]); // Dependency hygiene\n}"),
                sec("3. Performance Optimization: useMemo, useCallback & React.memo",
                    "Premature memoization adds memory overhead. Use `useMemo` for computationally expensive transforms (>10ms) and `useCallback` when passing callbacks to memoized children (`React.memo`).",
                    "import { useMemo, useCallback } from 'react';\nconst filteredList = useMemo(() => items.filter(i => i.score > threshold), [items, threshold]);\nconst handleClick = useCallback(() => onSelect(id), [id]);"),
                sec("4. Custom Hooks for Encapsulated Business Logic",
                    "Extract reusable stateful logic into custom hooks starting with `use`. They compose standard hooks without adding wrapper DOM nodes.",
                    "function useWindowWidth() {\n  const [width, setWidth] = useState(window.innerWidth);\n  useEffect(() => {\n    const handler = () => setWidth(window.innerWidth);\n    window.addEventListener('resize', handler);\n    return () => window.removeEventListener('resize', handler);\n  }, []);\n  return width;\n}"),
                sec("5. Production Anti-Pattern: Prop Drilling & State Placement",
                    "Avoid passing props down 5+ levels. Use Component Composition (passing children) or React Context for global state like themes, authentication, or notifications.",
                    "// Prefer composition: <Page><Sidebar user={user} /></Page>")
            ],
            "references": [
                ref("React Official Documentation (react.dev)", "https://react.dev/", "React Core Team (Meta)", "Official Documentation", "Official documentation covering hooks, components, and reconciliation."),
                ref("Overreacted — A Complete Guide to useEffect by Dan Abramov", "https://overreacted.io/a-complete-guide-to-useeffect/", "Dan Abramov", "Engineering Guide", "The definitive deep dive into React effects and closures.")
            ],
            "keyTakeaways": [
                "React Fiber enables interruptible, prioritized concurrent rendering.",
                "Always maintain complete dependency arrays in `useEffect`.",
                "Use cleanup functions in effects to cancel pending async requests.",
                "Custom hooks encapsulate reusable stateful logic cleanly."
            ],
            "knowledgeCheck": [
                kc("kc_web2_1", "Why must you return a cleanup function from an effect that subscribes to an event?",
                   ["To speed up JavaScript execution", "To prevent memory leaks and duplicate listeners when the component unmounts or dependencies change", "React will throw an error without it", "To clear the browser history"],
                   1, "Cleanup functions unsubscribe listeners and cancel pending async actions when components unmount.")
            ],
            "interactiveSandboxCode": "import { useState } from 'react';\nfunction Counter() {\n  const [c, setC] = useState(0);\n  return <button onClick={() => setC(c + 1)}>Count: {c}</button>;\n}\n"
        },
        3: {
            "subtitle": "REST Constraints vs GraphQL, Stateless JWT vs HttpOnly Cookies, and CORS/CSRF Security.",
            "estimatedTime": "55 mins",
            "overview": "Full-stack integration, API contracts, and security architecture. Master REST constraints vs GraphQL trade-offs, stateless JWT authentication vs secure HttpOnly SameSite session cookies, CORS preflight handshakes, and defenses against XSS and CSRF attacks.",
            "sections": [
                sec("1. REST Architectural Constraints & HTTP Methods",
                    "REST (Representational State Transfer) requires:\n• Statelessness: Every request contains all context needed for processing.\n• Proper HTTP Semantics: GET (safe/idempotent), POST (create non-idempotent), PUT (replace idempotent), PATCH (partial modify), DELETE (idempotent).",
                    "// RESTful Resource Endpoints\n// GET    /api/v1/tickets      (List)\n// POST   /api/v1/tickets      (Create)\n// GET    /api/v1/tickets/:id  (Retrieve)\n// PATCH  /api/v1/tickets/:id  (Update status)\n// DELETE /api/v1/tickets/:id  (Archive/Remove)"),
                sec("2. Secure Authentication: JWT vs HttpOnly Cookies",
                    "Storing JWT tokens in `localStorage` exposes them to theft via Cross-Site Scripting (XSS). In production, store authentication tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies that JavaScript cannot read.",
                    "// Express secure cookie response:\nres.cookie('token', jwtToken, {\n  httpOnly: true, // Inaccessible to document.cookie (XSS immune)\n  secure: true,   // HTTPS only\n  sameSite: 'strict', // CSRF defense\n  maxAge: 3600000 // 1 hour\n});"),
                sec("3. Cross-Origin Resource Sharing (CORS) Mechanics",
                    "CORS is a browser security mechanism that restricts cross-origin HTTP requests. For mutating requests, browsers send an `OPTIONS` preflight request verifying allowed origins, headers, and methods.",
                    "// Express CORS configuration\nconst cors = require('cors');\napp.use(cors({\n  origin: ['https://masteryzone.com'],\n  credentials: true,\n  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']\n}));"),
                sec("4. Defending Against OWASP Top Vulnerabilities (XSS & CSRF)",
                    "• XSS (Cross-Site Scripting): Sanitize untrusted input and avoid `dangerouslySetInnerHTML`.\n• CSRF (Cross-Site Request Forgery): Defended via `SameSite=Strict` cookies and anti-CSRF token verification on state-changing requests.",
                    "// Helmet middleware sets security headers (CSP, HSTS, X-Content-Type-Options)\nconst helmet = require('helmet');\napp.use(helmet());"),
                sec("5. Optimistic UI Updates & Cache Invalidation",
                    "Update the UI immediately upon user action before server confirmation, rolling back only if the network request fails, delivering instant perceived performance.",
                    "// Optimistic UI update pattern\nsetTodos(prev => [...prev, newTodo]);\napi.createTodo(newTodo).catch(() => setTodos(prev => prev.filter(t => t.id !== newTodo.id)));")
            ],
            "references": [
                ref("OWASP Top 10 Web Application Security Risks", "https://owasp.org/www-project-top-ten/", "OWASP Foundation", "Security Standard", "The authoritative global standard for web application security vulnerabilities."),
                ref("MDN Web Docs — Cross-Origin Resource Sharing (CORS)", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS", "Mozilla", "Authoritative Guide", "Comprehensive guide to CORS preflight handshakes and headers.")
            ],
            "keyTakeaways": [
                "Store sensitive authentication tokens in HttpOnly, Secure, SameSite cookies to mitigate XSS theft.",
                "REST APIs require proper HTTP verbs and stateless request lifecycles.",
                "CORS is enforced by browsers using OPTIONS preflight handshakes.",
                "Optimistic UI updates improve perceived performance on interactive apps."
            ],
            "knowledgeCheck": [
                kc("kc_web3_1", "Why should authentication tokens be stored in HttpOnly cookies instead of localStorage?",
                   ["Cookies are faster than localStorage", "HttpOnly cookies cannot be read by JavaScript, protecting them from XSS theft", "localStorage only stores numbers", "Browsers will delete localStorage after 1 hour"],
                   1, "HttpOnly cookies cannot be accessed via client-side JavaScript, rendering them immune to XSS token theft.")
            ],
            "interactiveSandboxCode": "// REST API request example\nfetch('/api/v1/health')\n  .then(res => res.json())\n  .then(data => console.log('API Status:', data));\n"
        }
    },

    # ── DATA STRUCTURES & ALGORITHMS TRACK ──
    "dsa": {
        0: {
            "subtitle": "Asymptotic Notation, Master Theorem, Amortized Analysis, and Memory Cache Locality.",
            "estimatedTime": "50 mins",
            "overview": "Rigorous algorithmic complexity analysis. Master Big-O (upper bound), Big-Omega (lower bound), and Big-Theta (tight bound), solving divide-and-conquer recurrences with the Master Theorem, amortized analysis via the accounting method, and hardware cache locality.",
            "sections": [
                sec("1. Asymptotic Notations: Big-O, Big-Omega & Big-Theta",
                    "Asymptotic analysis quantifies how algorithm time/space requirements scale as input size N tends toward infinity:\n• Big-O ($O(g(N))$): Formal upper bound ($T(N) \\le c \\cdot g(N)$ for $N \\ge N_0$).\n• Big-Omega ($\\Omega(g(N))$): Formal lower bound ($T(N) \\ge c \\cdot g(N)$).\n• Big-Theta ($\\Theta(g(N))$): Tight bound satisfying both upper and lower bounds simultaneously.",
                    "// Complexity Hierarchy:\n// O(1) < O(log N) < O(N) < O(N log N) < O(N^2) < O(2^N) < O(N!)"),
                sec("2. Master Theorem for Divide-and-Conquer Recurrences",
                    "For recurrence relations of the form $T(N) = a \\cdot T(N/b) + f(N)$:\n• Case 1: If $f(N) = O(N^{\\log_b a - \\epsilon})$, then $T(N) = \\Theta(N^{\\log_b a})$\n• Case 2: If $f(N) = \\Theta(N^{\\log_b a})$, then $T(N) = \\Theta(N^{\\log_b a} \\log N)$ (e.g. MergeSort: $2T(N/2) + O(N) \\rightarrow \\Theta(N \\log N)$)\n• Case 3: If $f(N) = \\Omega(N^{\\log_b a + \\epsilon})$, then $T(N) = \\Theta(f(N))$",
                    "// MergeSort recurrence: T(N) = 2T(N/2) + O(N)\n// a=2, b=2, log2(2) = 1. f(N) = N^1. Case 2 applies: O(N log N)."),
                sec("3. Amortized Analysis & Geometric Array Expansion",
                    "An individual operation may occasionally be expensive, but its average cost over a sequence of operations can be strictly O(1). Dynamic arrays (Python lists, C++ vectors) double their capacity when full. Doubling costs O(N), but happens so infrequently that the amortized cost per append is $O(1)$.",
                    "// Amortized Proof: N insertions require 1 + 2 + 4 + ... + N = 2N total copies.\n// 2N copies / N insertions = 2 operations per insertion = O(1) amortized."),
                sec("4. Hardware Cache Locality: Spatial & Temporal",
                    "Contiguous arrays outperform linked node structures because modern CPUs load memory in 64-byte cache lines. Iterating over an array yields a cache hit rate near 100%, whereas node pointers trigger random memory lookups and cache misses.",
                    "// Iterating array: Cache hits O(1)\n// Traversing linked list: Frequent CPU cache misses"),
                sec("5. Space Complexity: Auxiliary Space vs Total Space",
                    "Total space includes both the input size and any additional memory allocated. Auxiliary space measures only the extra temporary storage created by the algorithm (excluding input).",
                    "// In-place QuickSort auxiliary space: O(log N) stack frames\n// MergeSort auxiliary space: O(N) temporary array")
            ],
            "references": [
                ref("Introduction to Algorithms (CLRS) — Chapter 3: Growth of Functions", "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/", "MIT Press", "Authoritative Textbook", "The gold-standard reference for asymptotic proofs and Master Theorem."),
                ref("MIT OpenCourseWare — 6.006 Introduction to Algorithms", "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", "MIT", "Academic Curriculum", "Free lecture series on Big-O analysis and amortized cost.")
            ],
            "keyTakeaways": [
                "Big-O gives an asymptotic upper bound; Big-Theta gives a tight bound.",
                "Master Theorem solves recurrences like MergeSort in $O(N \\log N)$.",
                "Dynamic array resizing has an amortized cost of $O(1)$ per append.",
                "Contiguous memory layouts benefit from hardware spatial cache locality."
            ],
            "knowledgeCheck": [
                kc("kc_dsa0_1", "What is the time complexity of MergeSort derived via Master Theorem?",
                   ["O(N)", "O(N log N)", "O(N^2)", "O(log N)"],
                   1, "T(N) = 2T(N/2) + O(N) matches Case 2 of Master Theorem, yielding O(N log N).")
            ],
            "interactiveSandboxCode": "function measure(n) {\n  let ops = 0;\n  for (let i = 0; i < n; i++) ops++;\n  return ops;\n}\nconsole.log('Operations for N=100:', measure(100));\n"
        },
        1: {
            "subtitle": "Contiguous Memory, In-Place Converging Pointers, Dynamic Sliding Windows, and Prefix Sums.",
            "estimatedTime": "55 mins",
            "overview": "Fundamental linear data structures and optimization patterns. Master Two-Pointer convergence (left/right bounds, slow/fast runner), sliding window technique (fixed vs dynamic size), prefix sum arrays for O(1) range queries, and cyclic sort.",
            "sections": [
                sec("1. The Two-Pointer Technique: Converging Bounds & Partitioning",
                    "Two-pointer techniques reduce $O(N^2)$ brute-force nested loops down to optimal $O(N)$ linear time by leveraging sorted invariants. Pointers start at opposite ends and converge toward the center based on comparisons.",
                    "// Two Sum on Sorted Array in O(N) time and O(1) space\nfunction twoSumSorted(arr, target) {\n    let left = 0, right = arr.length - 1;\n    while (left < right) {\n        const sum = arr[left] + arr[right];\n        if (sum === target) return [left, right];\n        if (sum < target) left++;\n        else right--;\n    }\n    return [];\n}"),
                sec("2. Sliding Window: Fixed vs Dynamic Windows",
                    "• Fixed-Size Window: Maintain a window of length K, sliding right by adding the incoming element and subtracting the outgoing element in O(1).\n• Dynamic-Size Window: Expand the right pointer to satisfy a condition; shrink the left pointer to restore validity (e.g. longest substring without repeating characters).",
                    "// Longest Substring Without Repeating Characters in O(N)\nfunction lengthOfLongestSubstring(s) {\n    const lastSeen = new Map();\n    let maxLen = 0, left = 0;\n    for (let right = 0; right < s.length; right++) {\n        if (lastSeen.has(s[right])) {\n            left = Math.max(left, lastSeen.get(s[right]) + 1);\n        }\n        lastSeen.set(s[right], right);\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}"),
                sec("3. Prefix Sum Arrays for O(1) Range Queries",
                    "Pre-computing cumulative sums ($P[i] = P[i-1] + arr[i]$) allows querying the sum of any subarray from index $L$ to $R$ in strict $O(1)$ constant time via $P[R] - P[L-1]$, replacing $O(N)$ repeated loops.",
                    "class PrefixSum {\n    constructor(nums) {\n        this.prefix = [0];\n        for (const n of nums) this.prefix.push(this.prefix[this.prefix.length - 1] + n);\n    }\n    queryRange(L, R) { return this.prefix[R + 1] - this.prefix[L]; }\n}"),
                sec("4. Slow and Fast Pointer (Floyd's Tortoise & Hare)",
                    "A slow pointer moves 1 step while a fast pointer moves 2 steps. Used to detect cycles in linked lists, find the middle node of a sequence in a single pass, or detect duplicate numbers.",
                    "function findMiddleNode(head) {\n    let slow = head, fast = head;\n    while (fast && fast.next) {\n        slow = slow.next;\n        fast = fast.next.next;\n    }\n    return slow; // Points to middle element\n}"),
                sec("5. Production Pitfall: Off-by-One Boundary Errors",
                    "Always define whether your interval is inclusive `[left, right]` or half-open `[left, right)`. Mixing conventions causes infinite loops or array out-of-bounds index exceptions."
                )
            ],
            "references": [
                ref("LeetCode Explore — Array and String Techniques", "https://leetcode.com/explore/learn/card/array-and-string/", "LeetCode", "Interactive Practice", "Curated algorithmic problem set covering two pointers and sliding window."),
                ref("GeeksforGeeks — Window Sliding Technique", "https://www.geeksforgeeks.org/window-sliding-technique/", "GeeksforGeeks", "Technical Tutorial", "Clear visual explanations of sliding window optimization.")
            ],
            "keyTakeaways": [
                "Two-pointer techniques reduce $O(N^2)$ checks to $O(N)$ on sorted inputs.",
                "Sliding window maintains state incrementally as boundaries shift.",
                "Prefix sums allow $O(1)$ range sum lookups after $O(N)$ preprocessing.",
                "Slow/fast pointer finds middle elements and cycles in a single pass."
            ],
            "knowledgeCheck": [
                kc("kc_dsa1_1", "What is the time complexity of querying a range sum using a precomputed prefix sum array?",
                   ["O(N)", "O(1)", "O(log N)", "O(N^2)"],
                   1, "Prefix sum queries require only a single subtraction (P[R] - P[L-1]) in O(1) time.")
            ],
            "interactiveSandboxCode": "const nums = [1, 2, 3, 4, 5];\nconst prefix = [0];\nnums.forEach(n => prefix.push(prefix[prefix.length - 1] + n));\nconsole.log('Sum index 1 to 3:', prefix[4] - prefix[1]); // 2 + 3 + 4 = 9\n"
        },
        2: {
            "subtitle": "Monotonic Stacks, Ring Buffers, Singly/Doubly Linked Lists, and LRU Cache Architecture.",
            "estimatedTime": "55 mins",
            "overview": "Master linear data structure mechanics. Understand Stacks (LIFO) and Monotonic Stacks for Next Greater Element problems in O(N), Queues (FIFO) with circular ring buffers, Doubly Linked Lists with sentinel nodes, and implementing a production-grade Least Recently Used (LRU) Cache in O(1).",
            "sections": [
                sec("1. Monotonic Stacks: Next Greater Element in O(N)",
                    "A Monotonic Stack maintains elements in strictly increasing or decreasing order. When encountering an element that violates the monotonic order, we pop and resolve answers for all smaller elements, reducing $O(N^2)$ lookups to $O(N)$ linear time.",
                    "function nextGreaterElements(nums) {\n    const res = new Array(nums.length).fill(-1);\n    const stack = []; // Monotonic decreasing stack of indices\n    for (let i = 0; i < nums.length; i++) {\n        while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {\n            const idx = stack.pop();\n            res[idx] = nums[i];\n        }\n        stack.push(i);\n    }\n    return res;\n}\nconsole.log(nextGreaterElements([2, 1, 2, 4, 3])); // [4, 2, 4, -1, -1]"),
                sec("2. Circular Queues & Lock-Free Ring Buffers",
                    "A Circular Queue uses a fixed-size array with `head` and `tail` pointers that wrap around using modulo arithmetic (`(tail + 1) % capacity`). This eliminates shifting elements in memory and supports lock-free single-producer single-consumer (SPSC) concurrency.",
                    "class RingBuffer {\n    constructor(size) {\n        this.buf = new Array(size);\n        this.head = 0; this.tail = 0; this.size = size;\n    }\n    enqueue(val) {\n        this.buf[this.tail] = val;\n        this.tail = (this.tail + 1) % this.size;\n    }\n}"),
                sec("3. Doubly Linked Lists & Sentinel Nodes",
                    "Sentinel dummy nodes (`head` and `tail`) eliminate edge cases when inserting or deleting nodes at boundaries, removing null-check branching logic.",
                    "class Node { constructor(k, v) { this.k = k; this.v = v; this.prev = null; this.next = null; } }\nclass DoublyLinkedList {\n    constructor() {\n        this.head = new Node(0, 0); this.tail = new Node(0, 0);\n        this.head.next = this.tail; this.tail.prev = this.head;\n    }\n    remove(node) { node.prev.next = node.next; node.next.prev = node.prev; }\n    addToFront(node) {\n        node.next = this.head.next; node.prev = this.head;\n        this.head.next.prev = node; this.head.next = node;\n    }\n}"),
                sec("4. LRU Cache Implementation in O(1) Time",
                    "An LRU Cache combines a Hash Map (for O(1) key lookups) and a Doubly Linked List (for O(1) node reordering and eviction of the least recently used item).",
                    "class LRUCache {\n    constructor(capacity) {\n        this.cap = capacity; this.map = new Map();\n        this.dll = new DoublyLinkedList();\n    }\n    get(key) {\n        if (!this.map.has(key)) return -1;\n        const node = this.map.get(key);\n        this.dll.remove(node); this.dll.addToFront(node); // Mark recently used\n        return node.v;\n    }\n}"),
                sec("5. Production Trade-Offs",
                    "Linked lists have significant pointer overhead (16 bytes per node on 64-bit) and poor cache locality. Use arrays or deques unless constant O(1) splicing and reordering is strictly required."
                )
            ],
            "references": [
                ref("LeetCode 146 — LRU Cache", "https://leetcode.com/problems/lru-cache/", "LeetCode", "Benchmark Problem", "Classic industry problem implementing O(1) get and put operations."),
                ref("GeeksforGeeks — Monotonic Stack", "https://www.geeksforgeeks.org/introduction-to-monotonic-stack-2/", "GeeksforGeeks", "Technical Tutorial", "Complete analysis of monotonic stack patterns.")
            ],
            "keyTakeaways": [
                "Monotonic stacks resolve Next Greater / Smaller element problems in $O(N)$ time.",
                "Circular ring buffers support O(1) queue operations without memory reallocations.",
                "Sentinel dummy nodes eliminate null-check edge cases in linked lists.",
                "An LRU cache achieves O(1) lookups and evictions by combining a Hash Map and a Doubly Linked List."
            ],
            "knowledgeCheck": [
                kc("kc_dsa2_1", "What data structures combine to build an LRU Cache with O(1) get and put operations?",
                   ["Array and Stack", "Hash Map and Doubly Linked List", "Binary Search Tree and Queue", "Trie and Heap"],
                   1, "A Hash Map provides O(1) lookups, while a Doubly Linked List provides O(1) node reordering and tail eviction.")
            ],
            "interactiveSandboxCode": "const stack = [];\nstack.push(10); stack.push(20);\nconsole.log('Popped:', stack.pop()); // 20\n"
        },
        3: {
            "subtitle": "Tree Traversals (DFS/BFS), Binary Search Tree Invariants, Graph Representations, and Dijkstra.",
            "estimatedTime": "55 mins",
            "overview": "Hierarchical and network data structures. Master tree traversals (DFS Pre/In/Post-order recursive and iterative, BFS level-order), Binary Search Tree (BST) invariants, Graph representations (Adjacency List vs Matrix), topological sorting (Kahn's algorithm), and Dijkstra's shortest path algorithm.",
            "sections": [
                sec("1. Binary Tree Traversals: DFS vs BFS",
                    "• Depth-First Search (DFS):\n  - Pre-order (Node -> Left -> Right): Cloning trees, serialization.\n  - In-order (Left -> Node -> Right): Yields elements of a BST in sorted ascending order.\n  - Post-order (Left -> Right -> Node): Deleting nodes, evaluating postfix expressions.\n• Breadth-First Search (BFS): Traverses level by level using a FIFO queue.",
                    "function inorderTraversal(root) {\n    const res = [];\n    function dfs(node) {\n        if (!node) return;\n        dfs(node.left);\n        res.push(node.val); // In-order visitor\n        dfs(node.right);\n    }\n    dfs(root);\n    return res;\n}"),
                sec("2. Binary Search Tree (BST) Invariants & Validation",
                    "A valid BST requires that for EVERY node, all values in its left subtree are strictly less than node.val, and all values in its right subtree are strictly greater. Validating requires passing down valid `(min, max)` ranges.",
                    "function isValidBST(root, min = -Infinity, max = Infinity) {\n    if (!root) return true;\n    if (root.val <= min || root.val >= max) return false;\n    return isValidBST(root.left, min, root.val) && isValidBST(root.right, root.val, max);\n}"),
                sec("3. Graph Representations: Adjacency List vs Adjacency Matrix",
                    "• Adjacency List: Array or map of neighbor lists. Space complexity: $O(V + E)$. Ideal for sparse graphs.\n• Adjacency Matrix: 2D boolean array $V \\times V$. Space complexity: $O(V^2)$. Allows O(1) edge existence queries, but wastes memory on sparse graphs.",
                    "// Adjacency List Representation\nconst graph = new Map();\nfunction addEdge(u, v) {\n    if (!graph.has(u)) graph.set(u, []);\n    graph.get(u).push(v);\n}"),
                sec("4. Dijkstra's Shortest Path Algorithm",
                    "Finds the shortest path from a starting node to all other nodes in a weighted graph with non-negative edge weights. Operates greedily using a Min-Heap (Priority Queue) in $O((V + E) \\log V)$ time.",
                    "// Dijkstra prioritizes processing the closest unvisited vertex using a min-heap"),
                sec("5. Topological Sort (Kahn's Algorithm for DAGs)",
                    "Computes a linear ordering of tasks matching prerequisite dependencies. Calculates in-degrees for all vertices and iteratively enqueues nodes with in-degree 0. If processed count < V, a cycle exists."
                )
            ],
            "references": [
                ref("MIT OpenCourseWare — Graph Algorithms: BFS, DFS, Shortest Paths", "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", "MIT", "Academic Curriculum", "Deep conceptual lectures on graph algorithms."),
                ref("LeetCode Explore — Binary Search Tree", "https://leetcode.com/explore/learn/card/introduction-to-data-structure-binary-search-tree/", "LeetCode", "Interactive Practice", "Curated problem card covering BST search, insertion, and validation.")
            ],
            "keyTakeaways": [
                "In-order traversal of a valid BST always produces values in sorted order.",
                "Always validate BSTs by passing down strict `(min, max)` bounds.",
                "Adjacency lists use $O(V + E)$ space, outperforming $O(V^2)$ matrices on sparse graphs.",
                "Dijkstra's algorithm finds shortest paths in $O((V + E) \\log V)$ using a Min-Heap."
            ],
            "knowledgeCheck": [
                kc("kc_dsa3_1", "What traversal order produces sorted elements when run on a valid Binary Search Tree?",
                   ["Pre-order", "In-order", "Post-order", "Level-order (BFS)"],
                   1, "In-order traversal visits (Left, Root, Right), which traverses a BST in strictly sorted numerical order.")
            ],
            "interactiveSandboxCode": "const bst = { val: 2, left: { val: 1 }, right: { val: 3 } };\nconsole.log('Root:', bst.val, 'Left:', bst.left.val, 'Right:', bst.right.val);\n"
        },
        4: {
            "subtitle": "MergeSort, QuickSort, Timsort, Binary Search on Monotonic Predicates, and Dynamic Programming.",
            "estimatedTime": "55 mins",
            "overview": "High-efficiency sorting, searching, and optimization. Master QuickSort partitioning (Lomuto vs Hoare), MergeSort divide-and-conquer, Python/Java Timsort hybrid mechanics, Binary Search on monotonic condition spaces, and Dynamic Programming (memoization vs tabulation).",
            "sections": [
                sec("1. QuickSort vs MergeSort: Mechanics & Space-Time Trade-offs",
                    "• MergeSort: Divides array in half, recursively sorts, and merges in linear time. Time: Guaranteed $\\Theta(N \\log N)$, Auxiliary Space: $O(N)$ for merge buffer. Stable.\n• QuickSort: Picks a pivot, partitions elements into `< pivot` and `> pivot`. Time: Average $O(N \\log N)$, Worst-case $O(N^2)$ (sorted input with bad pivot). Auxiliary Space: $O(\\log N)$ in-place stack. Unstable.",
                    "function mergeSort(arr) {\n    if (arr.length <= 1) return arr;\n    const mid = Math.floor(arr.length / 2);\n    const left = mergeSort(arr.slice(0, mid));\n    const right = mergeSort(arr.slice(mid));\n    return merge(left, right);\n}\nfunction merge(left, right) {\n    let res = [], i = 0, j = 0;\n    while (i < left.length && j < right.length) {\n        if (left[i] <= right[j]) res.push(left[i++]);\n        else res.push(right[j++]);\n    }\n    return res.concat(left.slice(i)).concat(right.slice(j));\n}"),
                sec("2. Timsort: The Production Standard (Python & Java)",
                    "Timsort is a hybrid adaptive sorting algorithm combining MergeSort and InsertionSort. It detects already-sorted runs in the input data. Small runs (< 32 elements) are sorted via InsertionSort (benefiting from CPU cache locality), and merged using a balanced stack, achieving $O(N)$ best-case time on real-world partially sorted datasets.",
                    "// Timsort achieves O(N) on partially sorted data and O(N log N) worst-case."),
                sec("3. Binary Search on Answer Spaces (Monotonic Predicates)",
                    "Binary Search is not limited to sorted arrays. Any problem with a monotonic boolean predicate (`false, false, false, true, true, true`) can be solved in $O(\\log(\\text{range}))$ time by testing the midpoint and halving the search space.",
                    "// Binary Search Template\nfunction binarySearchFirstTrue(low, high, checkFn) {\n    while (low < high) {\n        const mid = Math.floor(low + (high - low) / 2);\n        if (checkFn(mid)) high = mid; // Answer is mid or to the left\n        else low = mid + 1;           // Answer is strictly to the right\n    }\n    return low;\n}"),
                sec("4. Dynamic Programming: Memoization vs Tabulation",
                    "DP applies when a problem exhibits Optimal Substructure and Overlapping Subproblems:\n• Top-Down Memoization: Recursive approach that caches computed subproblem results in a hash map or array.\n• Bottom-Up Tabulation: Iterative approach that fills a DP table from base cases up, often allowing space optimization from $O(N)$ to $O(1)$.",
                    "// 0/1 Knapsack & Fibonacci tabulation in O(N) time and O(1) space\nfunction fibOptimized(n) {\n    if (n < 2) return n;\n    let prev2 = 0, prev1 = 1;\n    for (let i = 2; i <= n; i++) {\n        const curr = prev1 + prev2;\n        prev2 = prev1;\n        prev1 = curr;\n    }\n    return prev1;\n}"),
                sec("5. Production Best Practices",
                    "• Always compute midpoints using `low + Math.floor((high - low) / 2)` to prevent 32-bit integer overflow bugs (`(low + high) / 2` can overflow in C++/Java).\n• Identify whether an algorithm requires stability (preserving equal-key ordering) before choosing between QuickSort and MergeSort."
                )
            ],
            "references": [
                ref("Tim Peters — Original Description of Timsort", "https://github.com/python/cpython/blob/main/Objects/listsort.txt", "CPython Source Code", "Engineering Specification", "The original design document detailing Timsort's adaptive runs and Galloping mode."),
                ref("TopCoder — Dynamic Programming from Novice to Advanced", "https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced", "TopCoder", "Authoritative Tutorial", "Comprehensive guide to identifying state transitions in DP.")
            ],
            "keyTakeaways": [
                "MergeSort provides guaranteed $O(N \\log N)$ time with $O(N)$ space; QuickSort operates in-place.",
                "Timsort achieves $O(N)$ on real-world partially sorted data by detecting natural runs.",
                "Binary Search applies to any monotonic predicate space, not just arrays.",
                "Calculate midpoints as `low + (high - low) / 2` to prevent integer overflow."
            ],
            "knowledgeCheck": [
                kc("kc_dsa4_1", "Why is `low + (high - low) / 2` preferred over `(low + high) / 2` in Binary Search?",
                   ["It executes faster on the CPU", "It prevents integer overflow when low + high exceeds maximum integer limits", "It handles negative numbers automatically", "It is required by the JavaScript engine"],
                   1, "When low and high are large positive integers, their sum can exceed 2^31 - 1, causing signed integer overflow.")
            ],
            "interactiveSandboxCode": "const arr = [5, 2, 8, 1, 9];\narr.sort((a, b) => a - b);\nconsole.log('Sorted:', arr); // [1, 2, 5, 8, 9]\n"
        }
    }
}

# Update all modules in the curriculum
total_updated = 0
for track, mods in curriculum.items():
    if track in DATA:
        track_enrichments = DATA[track]
        for m in mods:
            idx = m.get("moduleIndex", 0)
            if idx in track_enrichments:
                info = track_enrichments[idx]
                m["title"] = info.get("title", m["title"])
                m["subtitle"] = info.get("subtitle", m.get("subtitle", ""))
                m["estimatedTime"] = info.get("estimatedTime", m.get("estimatedTime", "45 mins"))
                m["overview"] = info.get("overview", m.get("overview", ""))
                m["sections"] = info.get("sections", m.get("sections", []))
                m["references"] = info.get("references", [])
                m["keyTakeaways"] = info.get("keyTakeaways", [])
                m["knowledgeCheck"] = info.get("knowledgeCheck", [])
                m["interactiveSandboxCode"] = info.get("interactiveSandboxCode", "")
                total_updated += 1

print(f"Total modules enriched across all tracks: {total_updated}")

# Write back to codingCurriculum.js
output_content = f"""// Curated Mastery Zone Coding Track Curriculum
// Full ordered modules for Python, JavaScript, Java, C++, Web Development, and DSA
// Enriched with in-depth conceptual notes, deep-dive sections, official references,
// interactive knowledge checks, LeetCode-grade exercise descriptions, and 10 test cases.

const CURRICULUM = {json.dumps(curriculum, indent=2)};

module.exports = {{
  CURRICULUM,
}};
"""

curriculum_path = os.path.join(root_dir, "data/codingCurriculum.js")
with open(curriculum_path, "w", encoding="utf-8") as f:
    f.write(output_content)

print(f"Successfully wrote enriched curriculum to {curriculum_path}")
