// Script to generate exactly 10 robust test cases for all 28 modules in codingCurriculum.js
// Tests 1 & 2 are public (isHidden: false)
// Tests 3 through 10 are hidden (isHidden: true)

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const PYTHON_BIN = "/usr/bin/python3";
const JAVAC_BIN = fs.existsSync("/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac")
  ? "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac"
  : fs.existsSync("/usr/local/bin/javac")
  ? "/usr/local/bin/javac"
  : "javac";
const JAVA_BIN = fs.existsSync("/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java")
  ? "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java"
  : fs.existsSync("/usr/local/bin/java")
  ? "/usr/local/bin/java"
  : "java";

function executeCode(lang, code, stdin) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen_tc_"));
  try {
    if (lang === "python") {
      const f = path.join(tmp, "main.py");
      fs.writeFileSync(f, code, "utf8");
      return execSync(`${PYTHON_BIN} "${f}"`, { input: stdin, timeout: 5000, encoding: "utf8" }).trim();
    } else if (lang === "javascript") {
      const f = path.join(tmp, "main.js");
      fs.writeFileSync(f, code, "utf8");
      return execSync(`node "${f}"`, { input: stdin, timeout: 5000, encoding: "utf8" }).trim();
    } else if (lang === "cpp") {
      const f = path.join(tmp, "main.cpp");
      const bin = path.join(tmp, "bin");
      fs.writeFileSync(f, code, "utf8");
      execSync(`clang++ -O2 "${f}" -o "${bin}"`, { timeout: 6000 });
      return execSync(`"${bin}"`, { input: stdin, timeout: 5000, encoding: "utf8" }).trim();
    } else if (lang === "java") {
      let cName = "Main";
      const m = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      if (m) cName = m[1];
      const f = path.join(tmp, `${cName}.java`);
      fs.writeFileSync(f, code, "utf8");
      execSync(`${JAVAC_BIN} "${f}"`, { timeout: 6000 });
      return execSync(`${JAVA_BIN} -cp "${tmp}" ${cName}`, { input: stdin, timeout: 5000, encoding: "utf8" }).trim();
    }
  } finally {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {}
  }
}

// 10 Candidate inputs for each module
const INPUT_SETS = {
  // Python
  py_mod_0: [
    "[-4, -2, 0, 2, 4, 6]",
    "[1, 3, 5, 7]",
    "[-10, 10, -8, 8, 2]",
    "[12, 14, -2, 0, 4]",
    "[]",
    "[-2, -4, -6]",
    "[2]",
    "[100, -100, 50, 25]",
    "[0, 0, 0]",
    "[6, 4, 2, 8, 10]"
  ],
  py_mod_1: [
    '["cat", "apple", "dog", "banana", "kiwi"]',
    '["a", "ab", "abc"]',
    '["zebra", "elephant", "fox", "bear"]',
    '[]',
    '["code", "test", "run", "dev"]',
    '["four", "five", "six", "seven"]',
    '["python", "rust", "go", "c"]',
    '["supercalifragilistic"]',
    '["yes", "no", "maybe"]',
    '["alpha", "beta", "gamma", "delta"]'
  ],
  py_mod_2: [
    '[["deposit", 100], ["withdraw", 30], ["get_balance"]]',
    '[["deposit", 50], ["withdraw", 100], ["get_balance"]]',
    '[["deposit", 200], ["withdraw", 50], ["withdraw", 150], ["get_balance"]]',
    '[["get_balance"]]',
    '[["withdraw", 10], ["get_balance"]]',
    '[["deposit", 500], ["get_balance"]]',
    '[["deposit", 10], ["withdraw", 10], ["get_balance"]]',
    '[["deposit", 75], ["withdraw", 25], ["deposit", 50], ["get_balance"]]',
    '[["deposit", 1000], ["withdraw", 1001], ["get_balance"]]',
    '[["deposit", 100], ["withdraw", 20], ["withdraw", 30], ["get_balance"]]'
  ],
  py_mod_3: [
    '{"values": [10, 20, 30]}',
    '{"other": 123}',
    'invalid json text',
    '{"values": [5, 10, 15, 20]}',
    '{"values": [100]}',
    '{"values": []}',
    '{}',
    'not even close to json',
    '{"values": [-10, 10, -20, 20]}',
    '{"values": [2.5, 7.5, 10.0]}'
  ],
  py_mod_4: [
    '{"nums": [1,1,1,2,2,3], "k": 2}',
    '{"nums": [4,4,4,4], "k": 1}',
    '{"nums": [9,8,8,7,7,7], "k": 2}',
    '{"nums": [1,2,3,4,5], "k": 1}',
    '{"nums": [5,5,5,2,2,3,3,3,3], "k": 2}',
    '{"nums": [10,10,20,20,30,30,40,40,40], "k": 1}',
    '{"nums": [7], "k": 1}',
    '{"nums": [1,2,2,3,3,3,4,4,4,4], "k": 3}',
    '{"nums": [-1,-1,-2,-2,-2], "k": 1}',
    '{"nums": [100,200,100,200,300], "k": 2}'
  ],

  // JavaScript
  js_mod_0: [
    '{"user": "Alice", "nested": {"value": 42}}',
    '{"items": [1, 2, 3]}',
    '{"config": {"deep": {"nested": {"value": 1}}}}',
    '{}',
    '{"a": 1, "b": "str", "c": true}',
    '{"arr": [{"id": 1}, {"id": 2}]}',
    '{"num": 100}',
    '{"emptyObj": {}, "emptyArr": []}',
    '{"flag": false, "nullVal": null}',
    '{"x": 10, "y": 20, "sub": {"z": 30}}'
  ],
  js_mod_1: [
    '[5, 5, 2, 5]',
    '[10, 20, 30]',
    '[7, 7, 7, 7]',
    '[1]',
    '[42, 42]',
    '[1, 2, 1, 2, 1, 2]',
    '[100, 200, 300, 100, 200]',
    '[0, 0, 0]',
    '[-5, 5, -5, 5]',
    '[8, 9, 10, 8, 9, 10, 11]'
  ],
  js_mod_2: [
    '[1, 2, 3, 4]',
    '[]',
    '[10, 50, 100]',
    '[5]',
    '[0, 0, 0]',
    '[2, 4, 6, 8, 10]',
    '[1000]',
    '[7, 14, 21]',
    '[-1, -2, -3]',
    '[15, 25, 35, 45]'
  ],
  js_mod_3: [
    'https://example.com/search?q=javascript&page=2',
    'https://example.com/home',
    'https://api.test/data?filter=active&sort=asc&limit=10',
    'https://site.org/?lang=en',
    'https://site.org/path',
    'https://masteryzone.com/coding?track=python&module=2&view=code',
    'https://test.io/?a=1&b=2&c=3',
    'https://query.com/?token=xyz123',
    'https://demo.app/dashboard',
    'https://shop.com/products?category=books&inStock=true&maxPrice=50'
  ],
  js_mod_4: [
    '[{"name":"apple","category":"fruit"},{"name":"carrot","category":"vegetable"},{"name":"banana","category":"fruit"}]',
    '[]',
    '[{"name":"phone","category":"tech"},{"name":"laptop","category":"tech"}]',
    '[{"name":"item1","category":"A"}]',
    '[{"name":"cat","category":"mammal"},{"name":"eagle","category":"bird"},{"name":"dog","category":"mammal"}]',
    '[{"name":"x","category":"group1"},{"name":"y","category":"group2"},{"name":"z","category":"group1"}]',
    '[{"name":"red","category":"warm"},{"name":"blue","category":"cool"},{"name":"yellow","category":"warm"}]',
    '[{"name":"one","category":"num"},{"name":"two","category":"num"},{"name":"three","category":"num"}]',
    '[{"name":"a","category":"vowel"},{"name":"b","category":"consonant"},{"name":"e","category":"vowel"}]',
    '[{"name":"prodA","category":"tier1"},{"name":"prodB","category":"tier2"},{"name":"prodC","category":"tier1"},{"name":"prodD","category":"tier2"}]'
  ],

  // Java
  java_mod_0: [
    'apple banana apple orange banana apple',
    'java java java',
    'hello world mastery zone',
    'test',
    'cat dog cat dog cat fish',
    'one two three one two one',
    'code code code code code',
    'a b c d e f',
    'alpha beta gamma alpha beta alpha',
    'mastery zone mastery zone coding'
  ],
  java_mod_1: [
    '[{"type":"circle","r":5},{"type":"rect","w":4,"h":6}]',
    '[{"type":"rect","w":10,"h":10}]',
    '[{"type":"circle","r":2}]',
    '[{"type":"rect","w":5,"h":2},{"type":"rect","w":3,"h":4}]',
    '[{"type":"circle","r":10}]',
    '[{"type":"circle","r":1},{"type":"circle","r":2}]',
    '[{"type":"rect","w":1,"h":1}]',
    '[{"type":"circle","r":3},{"type":"rect","w":2,"h":5}]',
    '[{"type":"rect","w":20,"h":30}]',
    '[{"type":"circle","r":7},{"type":"rect","w":10,"h":5}]'
  ],
  java_mod_2: [
    'masteryzone',
    'aabb',
    'leetcode',
    'loveleetcode',
    'swiss',
    'z',
    'abcdefg',
    'racecar',
    'java',
    'concurrency'
  ],
  java_mod_3: [
    '10 2',
    '20 0',
    '100 5',
    '0 10',
    '50 5',
    '7 0',
    '81 9',
    '1000 25',
    '13 0',
    '42 6'
  ],
  java_mod_4: [
    '1 2 3 4 5 6',
    '1 3 5 7',
    '2 4 6 8 10',
    '10',
    '0 1 2 3',
    '2 2 2 2',
    '12 14 16',
    '1 2 3',
    '4 5 6 7 8',
    '20 25 30'
  ],

  // C++
  cpp_mod_0: [
    '1 2 3 4 5',
    '42',
    '10 20 30 40',
    '1 1 1 1',
    '5 4 3 2 1',
    '100 200',
    '-5 -4 -3 -2 -1',
    '0 0 0 0',
    '7 14 21 28 35',
    '9 8 7 6 5 4 3 2 1 0'
  ],
  cpp_mod_1: [
    '10 20 30',
    '5 5 5 5',
    '-10 10 100',
    '42',
    '0 0 0',
    '1 2 3 4 5 6 7 8 9 10',
    '-5 -15 -20',
    '100 200 500',
    '7 3 2',
    '50 50'
  ],
  cpp_mod_2: [
    'Modern C++ Systems',
    'Code',
    'Smart Pointers Rule',
    'Antigravity Engine',
    'High Performance Computing',
    'Mastery Zone',
    'RAII Memory Safety',
    'Clang LLVM Compiler',
    'Clean Architecture',
    'Zero Overhead Abstractions'
  ],
  cpp_mod_3: [
    '5 -2 10 0 3 -8',
    '-1 -2 -3',
    '1 9 4 7',
    '100 50 200 -50 0',
    '42',
    '-10 0 -20',
    '12 3 45 8 2',
    '9 8 7 6',
    '-5 15 -25 35',
    '1 1 1 1'
  ],

  // WebDev
  web_mod_0: [
    'Content-Type: application/json\nAuthorization: Bearer token123\nHost: masteryzone.com',
    'User-Agent: Mozilla/5.0',
    'Accept: */*\nConnection: keep-alive',
    'Host: localhost:3000\nContent-Length: 42',
    'X-Custom-Header: value123',
    'Cache-Control: no-cache\nPragma: no-cache',
    'Origin: http://example.com\nReferer: http://example.com/page',
    'Content-Type: text/html',
    'Cookie: session_id=xyz\nAccept-Language: en-US',
    'Server: nginx\nStrict-Transport-Security: max-age=31536000'
  ],
  web_mod_1: [
    '[150, 0, 100]',
    '[-25, 0, 100]',
    '[50, 0, 100]',
    '[0, 0, 10]',
    '[10, 0, 10]',
    '[25, 10, 20]',
    '[-100, -50, 50]',
    '[100, -50, 50]',
    '[0, -10, 10]',
    '[75, 50, 100]'
  ],
  web_mod_2: [
    '[{"type":"INCREMENT"},{"type":"INCREMENT"},{"type":"ADD","payload":10}]',
    '[{"type":"DECREMENT"},{"type":"DECREMENT"}]',
    '[{"type":"ADD","payload":50},{"type":"DECREMENT"}]',
    '[]',
    '[{"type":"INCREMENT"}]',
    '[{"type":"ADD","payload":100},{"type":"ADD","payload":200}]',
    '[{"type":"INCREMENT"},{"type":"DECREMENT"}]',
    '[{"type":"ADD","payload":25},{"type":"DECREMENT"},{"type":"DECREMENT"}]',
    '[{"type":"DECREMENT"},{"type":"ADD","payload":5}]',
    '[{"type":"INCREMENT"},{"type":"INCREMENT"},{"type":"INCREMENT"},{"type":"DECREMENT"}]'
  ],
  web_mod_3: [
    'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjM0NSIsIm5hbWUiOiJBbGV4In0.signature123',
    'invalid.token',
    'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MDAwMDAwMDB9.sig',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.sig',
    'badtoken',
    'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhdXRoMCJ9.sig',
    'a.b',
    'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20ifQ.sig',
    'not_a_jwt_at_all',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdGF0dXMiOiJhY3RpdmUiLCJjb3VudCI6NX0.sig'
  ],

  // DSA
  dsa_mod_0: [
    '[1, 2, 3, 9]\n8',
    '[1, 2, 4, 4]\n8',
    '[-5, -2, 0, 3, 10]\n5',
    '[1, 3, 5, 7]\n10',
    '[2, 4, 6, 8]\n11',
    '[1, 2]\n3',
    '[5]\n10',
    '[-10, -5, 0, 5, 10]\n0',
    '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n19',
    '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n25'
  ],
  dsa_mod_1: [
    'abcabcbb',
    'bbbbb',
    'pwwkew',
    ' ',
    'abcdef',
    'aab',
    'c',
    'tmmzuxt',
    'dvdf',
    'anviaj'
  ],
  dsa_mod_2: [
    '()[]{}',
    '(]',
    '([{}])',
    '((((',
    '()',
    '{[]}',
    '([)]',
    ']',
    '(([]){})',
    '{[()]}'
  ],
  dsa_mod_3: [
    '[3, 9, 20, null, null, 15, 7]',
    '[1]',
    '[]',
    '[1, 2, 3, 4, 5, 6, 7, 8]',
    '[1, 2, null, 3, null, 4]',
    '[1, null, 2, null, 3]',
    '[1, 2, 3]',
    '[1, 2, 3, 4, null, null, 5]',
    '[10, 5, 15, null, null, 12, 20]',
    '[1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, null, null, 5]'
  ],
  dsa_mod_4: [
    '[[5, 7, 7, 8, 8, 10], 8]',
    '[[5, 7, 7, 8, 8, 10], 6]',
    '[[1, 1, 1, 1], 1]',
    '[[1], 1]',
    '[[1], 2]',
    '[[], 0]',
    '[[2, 2], 2]',
    '[[1, 3, 5, 7], 5]',
    '[[1, 2, 3, 4, 5], 6]',
    '[[2, 4, 4, 4, 4, 6], 4]'
  ]
};

async function main() {
  const curriculumPath = path.join(__dirname, "../data/codingCurriculum.js");
  const { CURRICULUM } = require(curriculumPath);

  // Fix starterCode for web_mod_0 and dsa_mod_0 if needed so they split on /\r?\n|\\n/
  const web0 = CURRICULUM.webdev[0].codingExercise;
  if (!web0.starterCode.includes("split(/\\r?\\n|\\\\n/)")) {
    web0.starterCode = web0.starterCode.replace(
      "rawHeaders.trim().split('\\n')",
      "rawHeaders.trim().split(/\\r?\\n|\\\\n/)"
    );
  }

  const dsa0 = CURRICULUM.dsa[0].codingExercise;
  if (!dsa0.starterCode.includes("split(/\\r?\\n|\\\\n/)")) {
    dsa0.starterCode = dsa0.starterCode.replace(
      "fs.readFileSync(0, 'utf-8').trim().split('\\n')",
      "fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n|\\\\n/)"
    );
  }

  console.log("Generating 10 test cases for each of the 28 modules...");
  let totalOk = 0;

  for (const trackKey of Object.keys(CURRICULUM)) {
    const lang =
      trackKey === "cpp"
        ? "cpp"
        : trackKey === "java"
        ? "java"
        : trackKey === "python"
        ? "python"
        : "javascript";

    for (const mod of CURRICULUM[trackKey]) {
      const inputs = INPUT_SETS[mod.id];
      if (!inputs || inputs.length !== 10) {
        throw new Error(`Missing or incomplete input set for ${mod.id}`);
      }

      const generatedTestCases = [];
      for (let i = 0; i < 10; i++) {
        const inp = inputs[i];
        const expected = executeCode(lang, mod.codingExercise.starterCode, inp);
        generatedTestCases.push({
          input: inp,
          expectedOutput: expected,
          isHidden: i >= 2, // Tests 1 & 2 are public, tests 3-10 are hidden!
        });
      }

      mod.codingExercise.testCases = generatedTestCases;
      console.log(`  ✓ ${mod.id} (${lang}) -> 10 test cases verified`);
      totalOk++;
    }
  }

  console.log(`Successfully verified ${totalOk}/28 modules.`);

  // Write updated curriculum back to file
  const fileContent = `// Comprehensive Curriculum for Mastery Zone
// 6 Tracks: Python, JavaScript, Java, C++, Web Development, Data Structures & Algorithms
// 28 Modules with authentic, comprehensive learning content, 10-Question Assessments, and 10-TestCase Coding Exercises.

const CURRICULUM = ${JSON.stringify(CURRICULUM, null, 2)};

module.exports = {
  CURRICULUM,
};
`;

  fs.writeFileSync(curriculumPath, fileContent, "utf8");
  console.log("Successfully updated server/data/codingCurriculum.js with all 10-test case suites!");
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
