// Curated Mastery Zone Coding Track Curriculum
// Full ordered modules for Python, JavaScript, Java, C++, Web Development, and DSA
// Enriched with LeetCode-grade descriptions, step-by-step conceptual explanations,
// blank commented starter templates, and 10 real-time test cases (3 visible, 7 hidden).

const CURRICULUM = {
  "python": [
    {
      "id": "py_mod_0",
      "trackId": "python",
      "moduleIndex": 0,
      "title": "Python Basics & Core",
      "subtitle": "Variables, control flow, functions, OOP, and data structures.",
      "estimatedTime": "30 mins",
      "icon": "python",
      "overview": "Understand Python's object model, memory references, immutable vs mutable types, and structured control flow. Everything in Python is an object, and variables are names bound to memory locations rather than typed memory slots.",
      "sections": [
        {
          "title": "1. The Python Object Model & References",
          "content": "In Python, variables do not store values directly; they store references to objects allocated on the private heap.\nWhen you write `x = 42`, an integer object representing 42 is created, and `x` points to it.\nImmutable types include: `int`, `float`, `str`, `tuple`, `bool`, and `frozenset`.\nMutable types include: `list`, `dict`, `set`, and custom class instances.\n\nKey takeaway: Reassigning an immutable variable changes the reference to a new object; modifying a mutable object changes it in place.",
          "codeExample": "# Reference demonstration\na = [1, 2, 3]\nb = a          # b references the exact same list in memory\nb.append(4)\nprint(a)       # Outputs [1, 2, 3, 4]\nprint(a is b)  # True: identity check confirms identical memory address"
        },
        {
          "title": "2. Control Flow: Conditionals, Loops, & Comprehensions",
          "content": "Python uses indentation to define scope rather than curly braces.\nList comprehensions provide a concise way to create lists without boilerplate loops.\nThey are executed in C-speed within the CPython interpreter, making them both more readable and faster than traditional for-loops.",
          "codeExample": "# List comprehension with conditional filtering\nnumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\nevens_squared = [x**2 for x in numbers if x % 2 == 0]\nprint(evens_squared)  # [4, 16, 36, 64, 100]"
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement In-Place Filter & Square",
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
      }
    },
    {
      "id": "py_mod_1",
      "trackId": "python",
      "moduleIndex": 1,
      "title": "Functions, Scopes & Lambda Expressions",
      "subtitle": "First-class functions, closures, decorators, *args, **kwargs, and lambda syntax.",
      "estimatedTime": "35 mins",
      "icon": "python",
      "overview": "Deep dive into Python's functional capabilities. Learn LEGB variable resolution, how closures encapsulate state, crafting custom decorators, and leveraging anonymous lambda expressions.",
      "sections": [
        {
          "title": "1. The LEGB Scope Rule & Closures",
          "content": "Python resolves variable names using the LEGB rule:\n1. Local: inside current function\n2. Enclosing: inside enclosing functions (closures)\n3. Global: module level\n4. Built-in: Python standard built-ins\n\nWhen an inner function accesses variables from its enclosing scope, it forms a closure, preserving that state even after the outer function terminates.",
          "codeExample": "def make_multiplier(factor):\n    def multiply(n):\n        return n * factor  # factor captured from enclosing scope\n    return multiply\n\ndouble = make_multiplier(2)\nprint(double(5))  # 10"
        },
        {
          "title": "2. Variable Arguments (*args, **kwargs) & Decorators",
          "content": "Functions can accept arbitrary positional arguments with `*args` (tuple) and keyword arguments with `**kwargs` (dictionary).\nDecorators wrap functions to dynamically modify or audit their behavior.",
          "codeExample": "def log_call(func):\n    def wrapper(*args, **kwargs):\n        print(f\"Calling {func.__name__}\")\n        return func(*args, **kwargs)\n    return wrapper\n\n@log_call\ndef greet(name):\n    return f\"Hello, {name}\""
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement Custom Function Counter Decorator",
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
      }
    },
    {
      "id": "py_mod_2",
      "trackId": "python",
      "moduleIndex": 2,
      "title": "Object-Oriented Architecture & Dunder Methods",
      "subtitle": "Classes, inheritance, encapsulation, magic methods, and clean design.",
      "estimatedTime": "40 mins",
      "icon": "python",
      "overview": "Deepen your Python mastery with object-oriented paradigms. Explore classes, instance vs class attributes, encapsulation with property getters/setters, inheritance hierarchies, and special double-underscore (dunder) methods.",
      "sections": [
        {
          "title": "1. Classes, Attributes, & The `self` Parameter",
          "content": "In Python, class definitions are executable blocks. When a class is created, a class object is constructed.\nInstance attributes belong to specific objects, whereas class attributes are shared across all instances.\nThe `__init__` method is the initializer, while `__new__` is the actual object constructor.",
          "codeExample": "class Account:\n    bank_name = \"Mastery Bank\"  # Class attribute\n\n    def __init__(self, owner: str, balance: float = 0.0):\n        self.owner = owner      # Instance attribute\n        self._balance = balance # Protected attribute by convention"
        },
        {
          "title": "2. Dunder (Magic) Methods & Operator Overloading",
          "content": "Special methods surrounded by double underscores (e.g. `__str__`, `__repr__`, `__eq__`, `__add__`) let custom classes integrate seamlessly with Python's operators and built-in functions.",
          "codeExample": "class Vector:\n    def __init__(self, x: int, y: int):\n        self.x = x\n        self.y = y\n\n    def __add__(self, other):\n        return Vector(self.x + other.x, self.y + other.y)\n\n    def __repr__(self):\n        return f\"Vector({self.x}, {self.y})\""
        }
      ],
      "codingExercise": {
        "taskTitle": "Build a Custom BankAccount Class",
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
      }
    },
    {
      "id": "py_mod_3",
      "trackId": "python",
      "moduleIndex": 3,
      "title": "File I/O, Serialization & Error Handling",
      "subtitle": "Context managers, file streams, JSON parsing, custom exceptions, and try/except/finally.",
      "estimatedTime": "40 mins",
      "icon": "python",
      "overview": "Master robust real-world I/O and defensive programming. Learn deterministic resource cleanup with context managers, stream processing, parsing structured JSON, and architecting custom exception hierarchies.",
      "sections": [
        {
          "title": "1. Deterministic Resource Management with `with`",
          "content": "Files and network sockets require deterministic cleanup. The `with` statement employs the context management protocol (`__enter__` and `__exit__`).\nEven if an unhandled exception occurs inside the block, `__exit__` is guaranteed to run, closing descriptors.",
          "codeExample": "with open(\"data.json\", \"w\", encoding=\"utf-8\") as f:\n    f.write('{\"status\": \"ok\"}')\n# File automatically closed here"
        },
        {
          "title": "2. Exception Hierarchies & Custom Exceptions",
          "content": "All exceptions must inherit from `BaseException`, typically subclassing `Exception`.\nThe `finally` block runs regardless of whether an exception was raised or handled.",
          "codeExample": "class InsufficientFundsError(Exception):\n    \"\"\"Raised when withdrawal exceeds account balance.\"\"\"\n    pass\n\ntry:\n    raise InsufficientFundsError(\"Balance is below required threshold\")\nexcept InsufficientFundsError as err:\n    print(f\"Error caught: {err}\")\nfinally:\n    print(\"Cleanup completed\")"
        }
      ],
      "codingExercise": {
        "taskTitle": "Safe JSON Parser & Property Extractor",
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
      }
    },
    {
      "id": "py_mod_4",
      "trackId": "python",
      "moduleIndex": 4,
      "title": "Advanced Collections & Pythonic Design Patterns",
      "subtitle": "Comprehensions, generators (yield), itertools, defaultdict, and dataclasses.",
      "estimatedTime": "45 mins",
      "icon": "python",
      "overview": "Write idiomatic, high-performance Python. Understand lazy generator pipelines that handle infinite data streams with constant memory, exploit specialized `collections` data structures, and use `dataclasses` for clean data models.",
      "sections": [
        {
          "title": "1. Generators & Lazy Evaluation (`yield`)",
          "content": "A generator function contains the `yield` keyword. Unlike regular functions that return a single value and terminate, generators pause execution, preserving local frame state.\nGenerators use O(1) memory regardless of whether they process 10 items or 10 billion items.",
          "codeExample": "def fibonacci_sequence(limit):\n    a, b = 0, 1\n    for _ in range(limit):\n        yield a\n        a, b = b, a + b\n\n# Memory-efficient iteration\nfor num in fibonacci_sequence(5):\n    print(num)  # 0, 1, 1, 2, 3"
        },
        {
          "title": "2. The `collections` Module & `dataclasses`",
          "content": "Python's `collections` provides high-performance alternatives to standard types:\n- `defaultdict`: never raises KeyError\n- `Counter`: multiset frequency counter\n- `deque`: O(1) double-ended queue\n`dataclasses` auto-generates `__init__`, `__repr__`, and `__eq__` boilerplate.",
          "codeExample": "from dataclasses import dataclass\nfrom collections import Counter\n\n@dataclass\nclass Transaction:\n    user_id: str\n    amount: float\n\ncounts = Counter([\"apple\", \"banana\", \"apple\"])\nprint(counts[\"apple\"])  # 2"
        }
      ],
      "codingExercise": {
        "taskTitle": "Top-K Frequent Elements with Counter",
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
      }
    }
  ],
  "javascript": [
    {
      "id": "js_mod_0",
      "trackId": "javascript",
      "moduleIndex": 0,
      "title": "JavaScript Essentials",
      "subtitle": "DOM manipulation, async/await, closures, and ES6+ features.",
      "estimatedTime": "30 mins",
      "icon": "javascript",
      "overview": "Understand how the JavaScript V8 engine parses, compiles, and executes code. Master the creation and execution phases of Execution Contexts, the call stack, lexical environments, variable hoisting, and how primitives vs reference objects reside in memory.",
      "sections": [
        {
          "title": "1. The Two-Phase Execution Lifecycle",
          "content": "Before executing a single line of JavaScript, the V8 engine runs a Creation Phase:\n1. Global Object creation (window or global)\n2. 'this' keyword binding\n3. Memory allocation for variables and function declarations (Hoisting)\n- `var` variables are initialized with `undefined`.\n- `let` and `const` are allocated in the Temporal Dead Zone (TDZ) and cannot be accessed before declaration.\n- Function declarations are placed in memory fully intact.",
          "codeExample": "// Hoisting behavior demonstration\nconsole.log(myVar); // Outputs undefined (not ReferenceError)\nvar myVar = 10;\n\n// console.log(myLet); // Uncaught ReferenceError: Cannot access 'myLet' before initialization\nlet myLet = 20;"
        },
        {
          "title": "2. The Call Stack & Primitive vs Reference Storage",
          "content": "Primitives (Number, String, Boolean, null, undefined, Symbol, BigInt) are stored directly on the Stack (or inlined for performance).\nObjects (Arrays, Functions, Object literals) are stored on the Heap, while variables hold memory addresses pointing to those heap blocks.",
          "codeExample": "let objA = { score: 100 };\nlet objB = objA; // Copies memory address reference\nobjB.score = 250;\nconsole.log(objA.score); // 250 (mutated through shared reference)"
        }
      ],
      "codingExercise": {
        "taskTitle": "Deep Clone An Object with Circular Reference Safety",
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
      }
    },
    {
      "id": "js_mod_1",
      "trackId": "javascript",
      "moduleIndex": 1,
      "title": "Closures, Scope Chains & Prototypal Inheritance",
      "subtitle": "Lexical scoping, closure memory retention, prototype chain, and ES6 classes.",
      "estimatedTime": "35 mins",
      "icon": "javascript",
      "overview": "Delve into closures and prototypes—the foundational pillars of JavaScript's object system. Learn how closures preserve lexical environments for private encapsulation and how prototypes enable dynamic method sharing.",
      "sections": [
        {
          "title": "1. Lexical Scope & Closures in Depth",
          "content": "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment).\nEvery execution context has a reference to its outer lexical environment. Closures allow functions to maintain state across invocations without polluting global scope.",
          "codeExample": "function createCounter() {\n  let count = 0; // Private state encapsulated by closure\n  return {\n    increment: () => ++count,\n    get: () => count\n  };\n}\nconst counter = createCounter();\nconsole.log(counter.increment()); // 1"
        },
        {
          "title": "2. The Prototype Chain & ES6 Classes",
          "content": "In JavaScript, objects have an internal `[[Prototype]]` link accessed via `Object.getPrototypeOf()`.\nWhen a property is requested on an object, JavaScript searches the object itself, then its prototype, up to `Object.prototype`.\nES6 `class` syntax is syntactic sugar over prototype delegation.",
          "codeExample": "class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return `${this.name} makes a noise.`; }\n}\nclass Dog extends Animal {\n  speak() { return `${this.name} barks.`; }\n}\nconst d = new Dog(\"Rex\");\nconsole.log(d.speak()); // \"Rex barks.\""
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement Memoization Cache using Closure",
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
      }
    },
    {
      "id": "js_mod_2",
      "trackId": "javascript",
      "moduleIndex": 2,
      "title": "Asynchronous JavaScript, Promises & Event Loop",
      "subtitle": "Event loop, microtasks vs macrotasks, Promise chaining, async/await, and concurrency.",
      "estimatedTime": "40 mins",
      "icon": "javascript",
      "overview": "Master JavaScript's non-blocking single-threaded concurrency model. Understand the call stack, Web APIs, Task Queue, Microtask Queue, Promise lifecycle states, and writing resilient asynchronous code with async/await.",
      "sections": [
        {
          "title": "1. The Event Loop: Microtasks vs Macrotasks",
          "content": "JavaScript executes on a single thread. Asynchronous operations run as follows:\n1. Synchronous code executes on the Call Stack.\n2. Microtask Queue (Promise callbacks, `queueMicrotask`) is drained completely between every macrotask.\n3. Macrotask Queue (`setTimeout`, `setInterval`, I/O) executes one task per tick.",
          "codeExample": "console.log(\"1 - Sync\");\nsetTimeout(() => console.log(\"4 - Macrotask\"), 0);\nPromise.resolve().then(() => console.log(\"3 - Microtask\"));\nconsole.log(\"2 - Sync\");\n// Order: 1, 2, 3, 4"
        },
        {
          "title": "2. Promises & Concurrent Composition",
          "content": "A Promise has three states: Pending, Fulfilled, Rejected.\n- `Promise.all()`: Fails fast if any promise rejects.\n- `Promise.allSettled()`: Waits for all to finish, returning status for each.\n- `Promise.race()`: Resolves/rejects with the first settled promise.",
          "codeExample": "async function fetchUserData(userId) {\n  try {\n    const res = await fetch(`/api/users/${userId}`);\n    if (!res.ok) throw new Error(\"HTTP error \" + res.status);\n    return await res.json();\n  } catch (err) {\n    console.error(\"Fetch failed:\", err);\n    throw err;\n  }\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement Promise.all Polyfill",
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
      }
    },
    {
      "id": "js_mod_3",
      "trackId": "javascript",
      "moduleIndex": 3,
      "title": "DOM Architecture, Events & Browser Web APIs",
      "subtitle": "DOM tree manipulation, event bubbling & capturing, delegation, Fetch API, and Storage.",
      "estimatedTime": "40 mins",
      "icon": "javascript",
      "overview": "Bridge JavaScript logic with the browser runtime. Understand the Document Object Model (DOM), how events propagate through capture and bubble phases, high-performance event delegation, and browser persistence APIs.",
      "sections": [
        {
          "title": "1. Event Propagation: Capturing, Target, & Bubbling",
          "content": "When an event fires in the browser, it travels in 3 phases:\n1. Capturing Phase: Down from the Window through ancestor nodes to the target.\n2. Target Phase: Fired on the target element itself.\n3. Bubbling Phase: Bubbles back up the DOM tree to the Window.\n`event.stopPropagation()` prevents further upward or downward propagation.",
          "codeExample": "// Event delegation: single listener on parent\ndocument.querySelector(\"#list\").addEventListener(\"click\", (e) => {\n  if (e.target.matches(\"li.item\")) {\n    console.log(\"Item clicked:\", e.target.textContent);\n  }\n});"
        },
        {
          "title": "2. Modern Storage: LocalStorage vs SessionStorage vs Cookies",
          "content": "- `localStorage`: Persists until explicitly cleared (5-10MB limit per origin).\n- `sessionStorage`: Scoped to the browser tab lifecycle.\n- `IndexedDB`: Asynchronous transactional NoSQL database for large data.",
          "codeExample": "// Storing and retrieving structured data\nlocalStorage.setItem(\"user_pref\", JSON.stringify({ theme: \"dark\" }));\nconst pref = JSON.parse(localStorage.getItem(\"user_pref\"));\nconsole.log(pref.theme); // \"dark\""
        }
      ],
      "codingExercise": {
        "taskTitle": "Parse Query Parameters into Object",
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
      }
    },
    {
      "id": "js_mod_4",
      "trackId": "javascript",
      "moduleIndex": 4,
      "title": "Modern ES6+, Modular Architecture & Functional Patterns",
      "subtitle": "ES modules, destructuring, rest/spread, higher-order array methods, and immutability.",
      "estimatedTime": "35 mins",
      "icon": "javascript",
      "overview": "Adopt modern software engineering patterns with ECMAScript standards. Leverage ES Modules, object/array destructuring, rest/spread mechanics, pure functions, and immutability for scalable applications.",
      "sections": [
        {
          "title": "1. Higher-Order Functions: map, filter, & reduce",
          "content": "Functional programming avoids shared mutable state.\n- `map`: Transforms each item into a new array of identical length.\n- `filter`: Retains items that satisfy a predicate.\n- `reduce`: Accumulates values into an arbitrary data structure (number, object, map).",
          "codeExample": "const transactions = [100, -20, 50, -10];\nconst totalIncome = transactions\n  .filter((t) => t > 0)\n  .reduce((acc, t) => acc + t, 0);\nconsole.log(totalIncome); // 150"
        },
        {
          "title": "2. ES Modules: Named vs Default Exports",
          "content": "ES Modules (`import` / `export`) are statically analyzed at compile time.\nThis enables tree-shaking (dead code elimination) by modern bundlers like Vite and Rollup.",
          "codeExample": "// math.js\nexport const add = (a, b) => a + b;\nexport default function multiply(a, b) { return a * b; }\n\n// main.js\nimport multiply, { add } from './math.js';"
        }
      ],
      "codingExercise": {
        "taskTitle": "Group Array by Key using reduce",
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
      }
    }
  ],
  "java": [
    {
      "id": "java_mod_0",
      "trackId": "java",
      "moduleIndex": 0,
      "title": "Java Programming",
      "subtitle": "OOP principles, collections, multithreading, and enterprise design.",
      "estimatedTime": "40 mins",
      "icon": "java",
      "overview": "Understand enterprise Java execution. Learn the lifecycle of a Java application from .java source to .class bytecode executed by the JVM. Master Heap vs Stack memory allocation, Garbage Collection algorithms (G1, ZGC), and Just-In-Time (JIT) HotSpot compilation.",
      "sections": [
        {
          "title": "1. The Java Virtual Machine (JVM) Memory Model",
          "content": "The JVM divides runtime memory into specific zones:\n1. Heap: Stores all class instances and arrays. Shared across all threads; managed by Garbage Collection.\n2. Stack: Each thread has its own call stack storing primitive local variables and object reference pointers.\n3. Metaspace: Stores class metadata, bytecode, static variables, and runtime constant pool.",
          "codeExample": "public class MemoryDemo {\n    public static void main(String[] args) {\n        int primitiveVar = 42; // Allocated on the Thread Stack\n        String text = new String(\"Mastery Zone\"); // Object on Heap, reference on Stack\n    }\n}"
        },
        {
          "title": "2. Garbage Collection & Generational Hypothesis",
          "content": "Most objects die young. Modern JVM GC (such as G1GC) divides the heap into generations:\n- Young Generation (Eden + Survivor Spaces S0/S1)\n- Old (Tenured) Generation\nMinor GCs collect the Young generation with minimal pause; surviving objects promote to Old Generation.",
          "codeExample": "// Requesting explicit GC hint (not guaranteed)\nSystem.gc();"
        }
      ],
      "codingExercise": {
        "taskTitle": "Word Frequency Counter with HashMap",
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
      }
    },
    {
      "id": "java_mod_1",
      "trackId": "java",
      "moduleIndex": 1,
      "title": "Object-Oriented Architecture, Inheritance & Interfaces",
      "subtitle": "Classes, abstract classes, interfaces, polymorphism, access modifiers, and SOLID.",
      "estimatedTime": "40 mins",
      "icon": "java",
      "overview": "Architect clean, extensible enterprise software. Master the four pillars of OOP (Encapsulation, Abstraction, Inheritance, Polymorphism), interface contracts vs abstract classes, default methods, and dynamic method dispatch.",
      "sections": [
        {
          "title": "1. Interfaces vs Abstract Classes",
          "content": "In modern Java:\n- An `interface` defines a capability contract. A class can implement multiple interfaces.\n- Interfaces can contain default and static methods (since Java 8) and private helper methods (since Java 9).\n- An `abstract class` represents an 'is-a' core identity and can maintain instance state (fields and constructors).",
          "codeExample": "public interface PaymentProcessor {\n    boolean processPayment(double amount);\n    default void logTransaction(double amount) {\n        System.out.println(\"Payment logged: $\" + amount);\n    }\n}"
        },
        {
          "title": "2. Polymorphism & Dynamic Method Dispatch",
          "content": "Polymorphism allows treating derived classes through their common base interface.\nDynamic method dispatch resolves the overridden method at runtime based on the actual object instance on the heap, not the reference type.",
          "codeExample": "PaymentProcessor processor = new StripeProcessor();\nprocessor.processPayment(99.0); // Dispatches to StripeProcessor implementation"
        }
      ],
      "codingExercise": {
        "taskTitle": "Shape Hierarchy & Area Calculation",
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
      }
    },
    {
      "id": "java_mod_2",
      "trackId": "java",
      "moduleIndex": 2,
      "title": "Java Collections Framework & Generics",
      "subtitle": "List, Set, Map, HashMap internals, ArrayList vs LinkedList, and generic type bounds.",
      "estimatedTime": "45 mins",
      "icon": "java",
      "overview": "Deeply understand Java's standard data structures. Compare ArrayList vs LinkedList, explore HashMap collision resolution (buckets, linked lists, red-black tree bins), and master compile-time type safety with Generics and Wildcards.",
      "sections": [
        {
          "title": "1. The Collections Architecture: List, Set, & Queue",
          "content": "- `List` (ArrayList, LinkedList): Ordered, allows duplicates.\n  - `ArrayList`: Resizable array, O(1) random access, amortized O(1) append.\n  - `LinkedList`: Doubly linked nodes, O(1) insert at ends, O(N) index access.\n- `Set` (HashSet, TreeSet): Unique elements.\n  - `HashSet`: O(1) hash table lookup.\n  - `TreeSet`: O(log N) Red-Black tree sorted order.",
          "codeExample": "List<String> names = new ArrayList<>();\nnames.add(\"Java\");\nSet<Integer> unique = new HashSet<>(Arrays.asList(1, 2, 2, 3));\nSystem.out.println(unique.size()); // 3"
        },
        {
          "title": "2. HashMap Internals & Collision Resolution",
          "content": "A HashMap stores entries in an array of buckets indexed by `hash(key) & (n - 1)`.\nWhen multiple keys hash to the same bucket (collision):\n- Java 8+ chains entries in a singly linked list.\n- If a bucket exceeds 8 nodes (`TREEIFY_THRESHOLD`), the linked list converts into a Red-Black Tree, reducing worst-case lookup from O(N) to O(log N).",
          "codeExample": "Map<String, Integer> map = new HashMap<>();\nmap.put(\"Key\", 42); // Invokes hashCode() and equals()"
        }
      ],
      "codingExercise": {
        "taskTitle": "First Unique Character in String",
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
      }
    },
    {
      "id": "java_mod_3",
      "trackId": "java",
      "moduleIndex": 3,
      "title": "Robust Exception Handling & Resource Management",
      "subtitle": "Checked vs unchecked exceptions, try-with-resources, AutoCloseable, and custom errors.",
      "estimatedTime": "35 mins",
      "icon": "java",
      "overview": "Design fault-tolerant backend applications. Understand the Java Throwable hierarchy, checked exceptions (compile-time verified) vs unchecked RuntimeExceptions, deterministic cleanup with try-with-resources, and building custom exceptions.",
      "sections": [
        {
          "title": "1. The Throwable Hierarchy: Checked vs Unchecked",
          "content": "- `Throwable`: Root of all errors and exceptions.\n  - `Error`: Catastrophic JVM conditions (OutOfMemoryError, StackOverflowError) that applications should not attempt to catch.\n  - `Exception`:\n    - Checked Exceptions (subclasses of `Exception` excluding `RuntimeException`): Compiler mandates handling with `try-catch` or `throws` (e.g. `IOException`, `SQLException`).\n    - Unchecked Exceptions (`RuntimeException` and subclasses): Programming flaws (e.g. `NullPointerException`, `IllegalArgumentException`).",
          "codeExample": "// Checked exception declaration\npublic void readFile(String path) throws IOException {\n    FileReader fr = new FileReader(path);\n}"
        },
        {
          "title": "2. The `try-with-resources` Statement",
          "content": "Introduced in Java 7, `try-with-resources` ensures every resource declared in parentheses is closed automatically at block end, eliminating tedious `finally` boilerplate.\nAny class implementing `java.lang.AutoCloseable` can be managed by `try-with-resources`.",
          "codeExample": "try (BufferedReader br = new BufferedReader(new FileReader(\"data.txt\"))) {\n    String line = br.readLine();\n} // br.close() is automatically invoked here, even on exception"
        }
      ],
      "codingExercise": {
        "taskTitle": "Safe Integer Division with Custom Exception",
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
      }
    },
    {
      "id": "java_mod_4",
      "trackId": "java",
      "moduleIndex": 4,
      "title": "Multithreading, Concurrency & Modern Java Streams",
      "subtitle": "Threads, synchronized, ExecutorService, CompletableFuture, Lambdas, and Streams API.",
      "estimatedTime": "50 mins",
      "icon": "java",
      "overview": "Harness multi-core CPU power with modern Java concurrency. Master the Java Memory Model, synchronization primitives, thread pools with `ExecutorService`, asynchronous composition with `CompletableFuture`, and declarative data processing using the Java Streams API.",
      "sections": [
        {
          "title": "1. Thread Safety, Volatile & Synchronization",
          "content": "Multiple threads sharing mutable memory lead to race conditions.\n- `synchronized` keyword: Acquires an intrinsic monitor lock on an object, providing mutual exclusion.\n- `volatile` keyword: Guarantees memory visibility across CPU cores by preventing hardware cache stale reads.\n- `java.util.concurrent.atomic`: Lock-free CAS (Compare-And-Swap) operations (e.g. `AtomicInteger`).",
          "codeExample": "AtomicInteger counter = new AtomicInteger(0);\ncounter.incrementAndGet(); // Thread-safe atomic increment"
        },
        {
          "title": "2. Modern Streams API & Functional Pipelines",
          "content": "Java 8 introduced functional pipelines:\n- Intermediate operations: `filter`, `map`, `sorted` (lazy evaluation).\n- Terminal operations: `collect`, `reduce`, `forEach` (triggers execution).",
          "codeExample": "List<String> names = Arrays.asList(\"Alice\", \"Bob\", \"Charlie\", \"David\");\nList<String> result = names.stream()\n    .filter(n -> n.length() > 3)\n    .map(String::toUpperCase)\n    .collect(Collectors.toList());"
        }
      ],
      "codingExercise": {
        "taskTitle": "Filter & Sum with Streams API",
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
      }
    }
  ],
  "cpp": [
    {
      "id": "cpp_mod_0",
      "trackId": "cpp",
      "moduleIndex": 0,
      "title": "Modern C++ Systems",
      "subtitle": "Pointers, memory management, STL containers, and performance.",
      "estimatedTime": "40 mins",
      "icon": "cpp",
      "overview": "Master low-level systems programming in C++. Understand how variables are mapped in process memory (Text, Data, BSS, Heap, Stack), pointer manipulation, pointer arithmetic, const-correctness, and references.",
      "sections": [
        {
          "title": "1. The Process Memory Map & Stack Allocation",
          "content": "A running C++ process contains distinct segments:\n- Stack: Fast, automatic storage for local variables and function call frames. Managed by CPU stack pointer.\n- Heap: Dynamically allocated memory via `new` or `malloc`. Must be explicitly freed.\n- Data/BSS: Global and static variables.\n- Text: Read-only executable machine code.",
          "codeExample": "#include <iostream>\nint main() {\n    int val = 100; // Stack allocation\n    int* ptr = &val; // Pointer holds address of val\n    *ptr = 200; // Dereference and write\n    std::cout << val << \"\\n\"; // 200\n}"
        },
        {
          "title": "2. Pointer Arithmetic & References",
          "content": "Pointer arithmetic operates in units of the pointee type size (`sizeof(T)`).\nA reference (`int&`) is an alias for an existing object and cannot be null or rebound.",
          "codeExample": "int arr[3] = {10, 20, 30};\nint* p = arr;\nstd::cout << *(p + 1) << \"\\n\"; // 20"
        }
      ],
      "codingExercise": {
        "taskTitle": "Array Inversion with Two Pointers",
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
      }
    },
    {
      "id": "cpp_mod_1",
      "trackId": "cpp",
      "moduleIndex": 1,
      "title": "RAII, Object Lifecycle & Resource Management",
      "subtitle": "Resource Acquisition Is Initialization, constructors, destructors, and Rule of 3/5/0.",
      "estimatedTime": "40 mins",
      "icon": "cpp",
      "overview": "Embrace RAII—the single most important idiom in C++. Tie resource lifecycles (heap memory, file handles, mutex locks) to object lifetimes. Master deterministic destructors and implement the Rule of Three, Five, and Zero.",
      "sections": [
        {
          "title": "1. The RAII Paradigm (Resource Acquisition Is Initialization)",
          "content": "Resources must be acquired in a constructor and released in the destructor.\nWhen an object goes out of scope (normal exit or via exception stack unwinding), its destructor is guaranteed to execute deterministically.",
          "codeExample": "class FileHandle {\n    FILE* file;\npublic:\n    FileHandle(const char* path) { file = fopen(path, \"r\"); }\n    ~FileHandle() { if (file) fclose(file); } // Deterministic cleanup\n};"
        },
        {
          "title": "2. The Rule of Three & Rule of Five",
          "content": "If a class manages raw resources, you must explicitly declare or delete:\n- Rule of 3 (C++98): Destructor, Copy Constructor, Copy Assignment.\n- Rule of 5 (C++11): Add Move Constructor and Move Assignment.\n- Rule of 0: Prefer using classes (like `std::vector` or `std::string`) that manage resources automatically, requiring no custom special member functions.",
          "codeExample": "class Buffer {\n    int* data;\n    size_t size;\npublic:\n    Buffer(size_t s) : size(s), data(new int[s]) {}\n    ~Buffer() { delete[] data; }\n    // Rule of 5: define copy & move operations\n};"
        }
      ],
      "codingExercise": {
        "taskTitle": "Implement Scoped Timer RAII Logger",
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
      }
    },
    {
      "id": "cpp_mod_2",
      "trackId": "cpp",
      "moduleIndex": 2,
      "title": "Smart Pointers, Move Semantics & Memory Safety",
      "subtitle": "std::unique_ptr, std::shared_ptr, std::weak_ptr, rvalue references, and std::move.",
      "estimatedTime": "45 mins",
      "icon": "cpp",
      "overview": "Eliminate raw pointer bugs. Learn Modern C++ smart pointers: exclusive ownership with `std::unique_ptr`, shared reference-counted ownership with `std::shared_ptr`, cycle-breaking with `std::weak_ptr`, and zero-copy performance via move semantics (`std::move`).",
      "sections": [
        {
          "title": "1. Modern Smart Pointers: unique_ptr & shared_ptr",
          "content": "- `std::unique_ptr`: Zero-overhead exclusive ownership. Cannot be copied, only moved.\n- `std::shared_ptr`: Shared ownership using atomic reference counting.\n- `std::weak_ptr`: Non-owning observer that prevents circular reference memory leaks.",
          "codeExample": "#include <memory>\nauto ptr = std::make_unique<int>(42); // Zero overhead over raw pointer\n// auto copy = ptr; // Error: cannot copy unique_ptr!\nauto moved = std::move(ptr); // Ownership transferred; ptr is now nullptr"
        },
        {
          "title": "2. Rvalue References & Move Semantics (`&&`)",
          "content": "Move semantics allow 'stealing' internal resources (such as heap buffer pointers) from temporary rvalues without expensive deep copies.\n`std::move` casts an lvalue to an rvalue reference, signaling that its resources can be pilfered.",
          "codeExample": "std::vector<int> v1(1000000, 42);\nstd::vector<int> v2 = std::move(v1); // O(1) pointer swap, zero copies!"
        }
      ],
      "codingExercise": {
        "taskTitle": "Exclusive Ownership Transfer with unique_ptr",
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
      }
    },
    {
      "id": "cpp_mod_3",
      "trackId": "cpp",
      "moduleIndex": 3,
      "title": "Standard Template Library (STL) Containers & Algorithms",
      "subtitle": "vector, map, unordered_map, iterators, std::sort, std::transform, and lambdas.",
      "estimatedTime": "40 mins",
      "icon": "cpp",
      "overview": "Leverage the full power of the C++ Standard Template Library. Compare sequential containers (`vector`, `deque`, `list`) with associative containers (`map`, `unordered_map`). Master STL iterators, algorithms (`std::sort`, `std::accumulate`), and C++ lambdas.",
      "sections": [
        {
          "title": "1. STL Container Performance Trade-offs",
          "content": "- `std::vector`: Contiguous memory. O(1) random access, cache-friendly iteration. The default choice.\n- `std::map`: Ordered Red-Black tree. O(log N) lookup and insertion.\n- `std::unordered_map`: Hash table. Average O(1) lookup.",
          "codeExample": "#include <vector>\n#include <algorithm>\nstd::vector<int> nums = {5, 2, 8, 1};\nstd::sort(nums.begin(), nums.end()); // O(N log N) IntroSort"
        },
        {
          "title": "2. STL Algorithms & Lambda Closures",
          "content": "C++ algorithms operate on iterator ranges (`begin()`, `end()`).\nLambdas capture variables by value `[=]` or reference `[&]`.",
          "codeExample": "#include <numeric>\nint threshold = 3;\nauto count = std::count_if(nums.begin(), nums.end(), [threshold](int x) {\n    return x > threshold;\n});"
        }
      ],
      "codingExercise": {
        "taskTitle": "Filter & Sort with STL Algorithms",
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
      }
    }
  ],
  "webdev": [
    {
      "id": "web_mod_0",
      "trackId": "webdev",
      "moduleIndex": 0,
      "title": "Full-Stack Web Development",
      "subtitle": "HTML5 semantic markup, CSS3 Flex/Grid, React, and REST APIs.",
      "estimatedTime": "35 mins",
      "icon": "webdev",
      "overview": "Build a rock-solid foundation for modern web engineering. Understand semantic HTML5 accessibility (a11y), the CSS Box Model (content, padding, border, margin), Flexbox vs CSS Grid, and HTTP protocol foundations (verbs, status codes, and headers).",
      "sections": [
        {
          "title": "1. Semantic HTML5 & Accessibility (a11y)",
          "content": "Semantic tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`) convey structure and meaning to screen readers and search engines.\nAvoid generic `<div>` soup for interactive landmarks.",
          "codeExample": "<main role=\"main\">\n  <article>\n    <header><h1>Mastery Zone Architecture</h1></header>\n    <p>Semantic tags improve accessibility and SEO.</p>\n  </article>\n</main>"
        },
        {
          "title": "2. The CSS Box Model & Modern Flexbox/Grid",
          "content": "Always set `box-sizing: border-box` so padding and borders do not expand declared dimensions.\n- Flexbox: 1-dimensional layout (row or column alignment).\n- CSS Grid: 2-dimensional layout (rows and columns simultaneously).",
          "codeExample": "* { box-sizing: border-box; }\n.dashboard-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 1.5rem;\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Parse HTTP Request Header String",
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
      }
    },
    {
      "id": "web_mod_1",
      "trackId": "webdev",
      "moduleIndex": 1,
      "title": "Responsive Design, CSS Systems & Accessibility",
      "subtitle": "Media queries, mobile-first design, CSS custom properties (variables), and animations.",
      "estimatedTime": "40 mins",
      "icon": "webdev",
      "overview": "Craft adaptable, beautiful interfaces. Implement fluid typography, CSS custom properties for dynamic design tokens (theming), mobile-first media queries, hardware-accelerated CSS animations (`transform`, `opacity`), and WCAG accessibility standards.",
      "sections": [
        {
          "title": "1. Mobile-First Media Queries & Breakpoints",
          "content": "Design starting from small mobile viewports and use `min-width` queries to progressively enhance the layout on larger screens.\nCommon breakpoints:\n- Mobile: base styles (< 640px)\n- Tablet: `@media (min-width: 768px)`\n- Desktop: `@media (min-width: 1024px)`\n- Wide: `@media (min-width: 1280px)`",
          "codeExample": "/* Mobile default */\n.container { padding: 1rem; }\n\n/* Desktop enhancement */\n@media (min-width: 768px) {\n  .container { padding: 2.5rem; }\n}"
        },
        {
          "title": "2. CSS Custom Properties & GPU Acceleration",
          "content": "CSS variables (`--primary-color: #6366f1`) enable runtime theming without rebuilding styles.\nFor smooth 60fps animations, animate only compositor properties: `transform` and `opacity`.",
          "codeExample": ":root {\n  --primary-accent: #6366f1;\n}\n.btn-animate {\n  transition: transform 0.2s ease, opacity 0.2s ease;\n}\n.btn-animate:hover {\n  transform: translateY(-2px);\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Clamp Number Utility Function",
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
      }
    },
    {
      "id": "web_mod_2",
      "trackId": "webdev",
      "moduleIndex": 2,
      "title": "Modern React Architecture, Hooks & Component Lifecycle",
      "subtitle": "Virtual DOM, JSX, useState, useEffect, useCallback, useMemo, and clean component patterns.",
      "estimatedTime": "45 mins",
      "icon": "webdev",
      "overview": "Master modern component architecture in React 19. Understand Virtual DOM reconciliation (Fiber engine), pure functional components, hook dependency graphs, performance optimization with `useMemo` and `useCallback`, and clean state management.",
      "sections": [
        {
          "title": "1. The React Render Lifecycle & Hook Rules",
          "content": "React components re-render when state or props change.\nHook rules:\n1. Only call hooks at the top level (never inside loops, conditions, or nested functions).\n2. Only call hooks from React function components or custom hooks.\nUse `useEffect` strictly for synchronization with external systems (APIs, timers, subscriptions).",
          "codeExample": "import { useState, useEffect } from 'react';\n\nexport function UserStatus({ userId }) {\n  const [online, setOnline] = useState(false);\n\n  useEffect(() => {\n    const unsub = subscribeStatus(userId, setOnline);\n    return () => unsub(); // Cleanup on unmount or userId change\n  }, [userId]);\n\n  return <span>{online ? \"Online\" : \"Offline\"}</span>;\n}"
        },
        {
          "title": "2. Performance Optimization: memo, useMemo & useCallback",
          "content": "- `React.memo`: Prevents re-rendering if props are shallowly identical.\n- `useMemo`: Caches the result of an expensive calculation.\n- `useCallback`: Caches a function reference to prevent child re-renders.",
          "codeExample": "const cachedData = useMemo(() => computeHeavyStats(items), [items]);\nconst handleClick = useCallback(() => onItemSelect(id), [id]);"
        }
      ],
      "codingExercise": {
        "taskTitle": "State Reducer Simulation",
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
      }
    },
    {
      "id": "web_mod_3",
      "trackId": "webdev",
      "moduleIndex": 3,
      "title": "Full-Stack REST API Integration & Secure Authentication",
      "subtitle": "REST API design, JSON communication, JWT tokens, CORS, and defensive backend integration.",
      "estimatedTime": "40 mins",
      "icon": "webdev",
      "overview": "Integrate client and server into a cohesive, secure full-stack system. Understand RESTful endpoint conventions, JSON serialization, stateful vs stateless sessions, JSON Web Tokens (JWT: header, payload, signature), CORS configuration, and defensive error propagation.",
      "sections": [
        {
          "title": "1. RESTful Conventions & HTTP Verbs",
          "content": "REST APIs use standardized verbs on resource endpoints:\n- `GET /api/users`: Read collection (idempotent, safe)\n- `POST /api/users`: Create new resource\n- `PUT /api/users/:id`: Full replace\n- `PATCH /api/users/:id`: Partial update\n- `DELETE /api/users/:id`: Remove resource",
          "codeExample": "// Express REST controller\napp.get('/api/users/:id', async (req, res) => {\n  const user = await User.findById(req.params.id);\n  if (!user) return res.status(404).json({ error: \"User not found\" });\n  res.json(user);\n});"
        },
        {
          "title": "2. Stateless Authentication with JWTs",
          "content": "A JSON Web Token consists of 3 dot-separated Base64Url segments:\n1. Header: Algorithm & token type (e.g. HS256)\n2. Payload: Claims (userId, role, exp)\n3. Signature: Cryptographic hash of header + payload using secret key.",
          "codeExample": "// Verification middleware\nconst authGuard = (req, res, next) => {\n  const token = req.headers.authorization?.split(\" \")[1];\n  if (!token) return res.status(401).json({ error: \"Missing token\" });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch {\n    res.status(403).json({ error: \"Invalid token\" });\n  }\n};"
        }
      ],
      "codingExercise": {
        "taskTitle": "Parse and Validate JWT Payload",
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
      }
    }
  ],
  "dsa": [
    {
      "id": "dsa_mod_0",
      "trackId": "dsa",
      "moduleIndex": 0,
      "title": "Data Structures & Algorithms",
      "subtitle": "Arrays, stacks, queues, trees, graphs, and dynamic programming.",
      "estimatedTime": "35 mins",
      "icon": "dsa",
      "overview": "Master the mathematical foundations of computer science. Analyze runtime and space growth rates using Big-O, Big-Omega, and Big-Theta notation. Understand the physical trade-offs of contiguous arrays vs linked memory and hash table load factors.",
      "sections": [
        {
          "title": "1. Asymptotic Analysis: Big-O, Big-Omega, & Big-Theta",
          "content": "Big-O notation describes the upper bound of an algorithm's runtime growth relative to input size N.\nCommon complexity classes:\n- O(1): Constant time (Hash map lookup)\n- O(log N): Logarithmic time (Binary search)\n- O(N): Linear time (Single loop over array)\n- O(N log N): Linearithmic time (Merge sort, Quicksort)\n- O(N²): Quadratic time (Nested loops, Bubble sort)",
          "codeExample": "// Binary Search: O(log N)\nfunction binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}"
        },
        {
          "title": "2. Hash Tables & Dynamic Arrays Internals",
          "content": "Dynamic arrays double capacity when full, achieving amortized O(1) appends.\nHash tables achieve average O(1) operations, degrading to O(N) when high collision clusters form without rehashing.",
          "codeExample": "// Amortized O(1) insertion\nconst list = [];\nlist.push(42); // Amortized constant time"
        }
      ],
      "codingExercise": {
        "taskTitle": "Check Sorted Pair Sum (Two Pointers)",
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
      }
    },
    {
      "id": "dsa_mod_1",
      "trackId": "dsa",
      "moduleIndex": 1,
      "title": "Arrays, Strings & Two-Pointer Techniques",
      "subtitle": "Two pointers, sliding window, prefix sums, and in-place array manipulation.",
      "estimatedTime": "40 mins",
      "icon": "dsa",
      "overview": "Transform brute-force O(N²) quadratic loops into high-speed O(N) linear solutions. Master converging two-pointer patterns, fast/slow runners, fixed and dynamic sliding windows, and cumulative prefix sums.",
      "sections": [
        {
          "title": "1. The Sliding Window Paradigm",
          "content": "Sliding window maintains a running window across a sequence:\n- Fixed Window: Useful for sub-arrays of size K (e.g. maximum sum of K consecutive elements).\n- Dynamic Window: Expands right pointer until a condition is violated, then contracts left pointer.",
          "codeExample": "// Maximum sum subarray of size K\nfunction maxSubArraySum(arr, k) {\n  let maxSum = 0, windowSum = 0;\n  for (let i = 0; i < k; i++) windowSum += arr[i];\n  maxSum = windowSum;\n  for (let i = k; i < arr.length; i++) {\n    windowSum += arr[i] - arr[i - k]; // Slide window in O(1)\n    maxSum = Math.max(maxSum, windowSum);\n  }\n  return maxSum;\n}"
        },
        {
          "title": "2. In-Place Array Manipulation",
          "content": "Modify arrays without allocating O(N) extra space.\nExamples: In-place array reversal, removing duplicates from sorted arrays, and Dutch National Flag three-way partitioning.",
          "codeExample": "// Remove duplicates in-place from sorted array\nfunction removeDuplicates(nums) {\n  if (nums.length === 0) return 0;\n  let write = 1;\n  for (let read = 1; read < nums.length; read++) {\n    if (nums[read] !== nums[read - 1]) {\n      nums[write++] = nums[read];\n    }\n  }\n  return write;\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Longest Substring Without Repeating Characters",
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
      }
    },
    {
      "id": "dsa_mod_2",
      "trackId": "dsa",
      "moduleIndex": 2,
      "title": "Stacks, Queues & Linked List Architectures",
      "subtitle": "LIFO vs FIFO, singly & doubly linked lists, monotonic stacks, and cycle detection.",
      "estimatedTime": "45 mins",
      "icon": "dsa",
      "overview": "Master linear node and buffer structures. Implement singly and doubly linked lists, reverse linked lists in O(N) time and O(1) space, exploit Monotonic Stacks to solve 'Next Greater Element' in O(N), and build FIFO Queues using two stacks.",
      "sections": [
        {
          "title": "1. Singly Linked List Inversion",
          "content": "Reversing a linked list in-place requires three pointers: `prev`, `curr`, and `next`.\nWe traverse once, redirecting each node's pointer backward.",
          "codeExample": "function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr !== null) {\n    const next = curr.next;\n    curr.next = prev; // Reverse pointer\n    prev = curr;\n    curr = next;\n  }\n  return prev; // New head\n}"
        },
        {
          "title": "2. The Monotonic Stack Pattern",
          "content": "A monotonic stack maintains elements in strictly increasing or decreasing order.\nIt solves nearest greater/smaller element queries across an array in single-pass O(N) time instead of O(N²).",
          "codeExample": "// Next Greater Element using Monotonic Decreasing Stack\nfunction nextGreater(nums) {\n  const res = new Array(nums.length).fill(-1);\n  const stack = []; // Stores indices\n  for (let i = 0; i < nums.length; i++) {\n    while (stack.length > 0 && nums[stack[stack.length - 1]] < nums[i]) {\n      res[stack.pop()] = nums[i];\n    }\n    stack.push(i);\n  }\n  return res;\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Valid Parentheses with Stack",
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
      }
    },
    {
      "id": "dsa_mod_3",
      "trackId": "dsa",
      "moduleIndex": 3,
      "title": "Binary Trees, Binary Search Trees & Tree Traversals",
      "subtitle": "Tree properties, DFS traversals (pre/in/post-order), BFS level-order, and BST invariants.",
      "estimatedTime": "45 mins",
      "icon": "dsa",
      "overview": "Master hierarchical tree algorithms. Understand binary tree properties, DFS recursive traversals (In-order, Pre-order, Post-order), BFS Level-Order traversal using a Queue, Binary Search Tree (BST) invariants, and calculating tree depth/diameter.",
      "sections": [
        {
          "title": "1. DFS Traversals & BST Invariants",
          "content": "A Binary Search Tree (BST) enforces that for any node:\n- All keys in left subtree are strictly less (< node.val).\n- All keys in right subtree are strictly greater (> node.val).\nIn-order traversal (Left, Root, Right) of a BST visits nodes in strictly ascending sorted order!",
          "codeExample": "// In-order traversal yields sorted sequence\nfunction inOrder(root, res = []) {\n  if (!root) return res;\n  inOrder(root.left, res);\n  res.push(root.val);\n  inOrder(root.right, res);\n  return res;\n}"
        },
        {
          "title": "2. BFS Level-Order Traversal with Queue",
          "content": "Breadth-First Search (BFS) processes trees level by level using a FIFO Queue.\nIt is the standard algorithm for shortest-path unweighted graph searches and calculating tree width.",
          "codeExample": "function levelOrder(root) {\n  if (!root) return [];\n  const queue = [root];\n  const result = [];\n  while (queue.length > 0) {\n    const node = queue.shift();\n    result.push(node.val);\n    if (node.left) queue.push(node.left);\n    if (node.right) queue.push(node.right);\n  }\n  return result;\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Maximum Depth of Binary Tree",
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
      }
    },
    {
      "id": "dsa_mod_4",
      "trackId": "dsa",
      "moduleIndex": 4,
      "title": "Sorting Algorithms, Binary Search & Divide and Conquer",
      "subtitle": "Merge sort, Quick sort, lower/upper bounds, and divide-and-conquer recurrences.",
      "estimatedTime": "45 mins",
      "icon": "dsa",
      "overview": "Master the quintessential divide-and-conquer algorithms. Compare Merge Sort (stable, guaranteed O(N log N), O(N) space) with Quick Sort (in-place, cache-friendly, average O(N log N)), binary search bound variations (bisect_left/right), and recurrence relations.",
      "sections": [
        {
          "title": "1. Merge Sort: Divide and Conquer",
          "content": "Merge Sort splits the array into two halves, recursively sorts them, and merges the sorted halves in linear O(N) time.\n- Time Complexity: O(N log N) in all cases (worst, best, average).\n- Space Complexity: O(N) auxiliary memory for buffer merging.\n- Stability: Stable (preserves relative order of duplicate elements).",
          "codeExample": "function mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}"
        },
        {
          "title": "2. Binary Search: Finding Search Bounds",
          "content": "Binary search solves more than exact matches. It finds transition boundaries:\n- Lower Bound: First index where `arr[i] >= target`.\n- Upper Bound: First index where `arr[i] > target`.",
          "codeExample": "function lowerBound(arr, target) {\n  let left = 0, right = arr.length;\n  while (left < right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] >= target) right = mid;\n    else left = mid + 1;\n  }\n  return left;\n}"
        }
      ],
      "codingExercise": {
        "taskTitle": "Binary Search: Find First and Last Position",
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
      }
    }
  ]
};

module.exports = { CURRICULUM };
