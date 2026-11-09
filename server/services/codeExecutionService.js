const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFile, spawn } = require("child_process");
const https = require("https");
const http = require("http");

// Detect OpenJDK binaries
const JAVAC_BIN = fs.existsSync("/opt/homebrew/opt/openjdk/bin/javac")
  ? "/opt/homebrew/opt/openjdk/bin/javac"
  : fs.existsSync("/opt/homebrew/bin/javac")
  ? "/opt/homebrew/bin/javac"
  : fs.existsSync("/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac")
  ? "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac"
  : fs.existsSync("/usr/local/bin/javac")
  ? "/usr/local/bin/javac"
  : "javac";

const JAVA_BIN = fs.existsSync("/opt/homebrew/opt/openjdk/bin/java")
  ? "/opt/homebrew/opt/openjdk/bin/java"
  : fs.existsSync("/opt/homebrew/bin/java")
  ? "/opt/homebrew/bin/java"
  : fs.existsSync("/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java")
  ? "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java"
  : fs.existsSync("/usr/local/bin/java")
  ? "/usr/local/bin/java"
  : "java";

const GCC_BIN = fs.existsSync("/usr/bin/gcc") ? "/usr/bin/gcc" : "gcc";
const GPP_BIN = fs.existsSync("/usr/bin/g++") ? "/usr/bin/g++" : "g++";
const PYTHON_BIN = fs.existsSync("/usr/bin/python3") ? "/usr/bin/python3" : "python3";
const NODE_BIN = fs.existsSync("/usr/local/bin/node") ? "/usr/local/bin/node" : "node";

const executionRateLimits = new Map();
let activeExecutions = 0;
const MAX_CONCURRENT_EXECUTIONS = 8;
const batchEvaluationCache = new Map();
const MAX_EVAL_CACHE = 500;

function checkExecutionRateLimit(identifier, windowMs = 60000, maxRequests = 40) {
  const now = Date.now();
  let entry = executionRateLimits.get(identifier);
  if (!entry || now - entry.resetTime > windowMs) {
    entry = { count: 1, resetTime: now };
    executionRateLimits.set(identifier, entry);
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

function validateCodeSafety(language, code) {
  if (typeof code !== "string") return { safe: false, reason: "Invalid code payload." };
  const lang = (language || "").toLowerCase().trim();

  if (lang === "python" || lang === "py") {
    const dangerousPatterns = [
      /\bimport\s+(os|sys|subprocess|shutil|socket|urllib|requests|http|asyncio|multiprocessing|threading|ctypes|importlib|builtins|posix|pty|platform)\b/i,
      /\bfrom\s+(os|sys|subprocess|shutil|socket|urllib|requests|http|asyncio|multiprocessing|threading|ctypes|importlib|builtins|posix|pty|platform)\b/i,
      /\b(__import__|eval|exec|open|breakpoint|globals|locals|getattr|setattr)\s*\(/i,
      /\bos\.(system|popen|spawn|exec|remove|unlink|rmdir|mkdir|chmod|chown)\b/i,
    ];
    for (const pat of dangerousPatterns) {
      if (pat.test(code)) {
        return {
          safe: false,
          reason: "Security Violation: Source code contains restricted system call or forbidden module.",
        };
      }
    }
  } else if (lang === "javascript" || lang === "js" || lang === "node") {
    const dangerousPatterns = [
      /\brequire\s*\(\s*['"`](child_process|fs|net|http|https|vm|cluster|worker_threads|dgram|dns|tls)['"`]\s*\)/i,
      /\bimport\s+.*?\s+from\s+['"`](child_process|fs|net|http|https|vm|cluster|worker_threads|dgram|dns|tls)['"`]/i,
      /\bprocess\.(env|exit|kill|binding|dlopen|mainModule)\b/i,
      /\b(eval|Function)\s*\(/i,
    ];
    for (const pat of dangerousPatterns) {
      if (pat.test(code)) {
        return {
          safe: false,
          reason: "Security Violation: Source code contains restricted Node.js module or forbidden execution pattern.",
        };
      }
    }
  } else if (lang === "java") {
    const dangerousPatterns = [
      /\b(java\.lang\.Runtime|ProcessBuilder|java\.io\.File|java\.net\.|java\.nio\.file)\b/i,
      /\bSystem\.(exit|getenv|getProperty|load|loadLibrary)\b/i,
      /\b(ClassLoader|Reflection)\b/i,
    ];
    for (const pat of dangerousPatterns) {
      if (pat.test(code)) {
        return {
          safe: false,
          reason: "Security Violation: Source code contains restricted Java system API or reflection call.",
        };
      }
    }
  } else if (lang === "cpp" || lang === "c++" || lang === "c") {
    const dangerousPatterns = [
      /#\s*include\s*[<"](unistd\.h|sys\/|windows\.h|dirent\.h|fstream)[>"]/i,
      /\b(system|fork|exec|popen|kill|fopen|remove|unlink)\s*\(/i,
    ];
    for (const pat of dangerousPatterns) {
      if (pat.test(code)) {
        return {
          safe: false,
          reason: "Security Violation: Source code contains restricted C/C++ system header or execution call.",
        };
      }
    }
  }

  return { safe: true };
}

function terminateProcessTree(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform !== "win32") {
      try {
        process.kill(-proc.pid, "SIGKILL");
      } catch (e) {
        try {
          proc.kill("SIGKILL");
        } catch (e2) {}
      }
    } else {
      execFile("taskkill", ["/PID", String(proc.pid), "/T", "/F"], () => {});
    }
  } catch {}
}

function runSandboxedProcess(command, args, stdinInput = "", timeoutMs = 5000, cwd = os.tmpdir()) {
  return new Promise((resolve) => {
    if (activeExecutions >= MAX_CONCURRENT_EXECUTIONS) {
      return resolve({
        output: "",
        error: "Execution concurrency limit reached. Please wait a moment before running more code.",
        duration: 0,
        exitCode: 1,
      });
    }

    activeExecutions++;
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isSettled = false;

    const cleanup = () => {
      activeExecutions = Math.max(0, activeExecutions - 1);
    };

    let proc;
    try {
      proc = spawn(command, args, {
        cwd,
        env: {
          PATH: "/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin",
          HOME: cwd,
          TMPDIR: cwd,
          LANG: "en_US.UTF-8",
        },
        detached: process.platform !== "win32",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      cleanup();
      return resolve({
        output: "",
        error: `Failed to spawn process: ${err.message}`,
        duration: Date.now() - startTime,
        exitCode: 1,
      });
    }

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        terminateProcessTree(proc);
        resolve({
          output: stdout,
          error: `Execution timed out after ${timeoutMs / 1000} seconds. (Possible infinite loop or waiting for input)`,
          duration: Date.now() - startTime,
          exitCode: -1,
        });
      }
    }, timeoutMs);

    if (stdinInput && proc.stdin) {
      try {
        proc.stdin.write(stdinInput);
        proc.stdin.end();
      } catch {}
    } else if (proc.stdin) {
      try {
        proc.stdin.end();
      } catch {}
    }

    proc.stdout.on("data", (chunk) => {
      if (stdout.length < 1024 * 64) {
        stdout += chunk.toString();
      }
    });

    proc.stderr.on("data", (chunk) => {
      if (stderr.length < 1024 * 64) {
        stderr += chunk.toString();
      }
    });

    proc.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        cleanup();
        resolve({
          output: stdout,
          error: `Execution error: ${err.message}`,
          duration: Date.now() - startTime,
          exitCode: 1,
        });
      }
    });

    proc.on("close", (code) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        cleanup();
        resolve({
          output: stdout,
          error: stderr,
          duration: Date.now() - startTime,
          exitCode: code || 0,
        });
      }
    });
  });
}

const judge0LangMap = {
  python: 71,
  py: 71,
  javascript: 63,
  js: 63,
  node: 63,
  java: 62,
  cpp: 54,
  "c++": 54,
  c: 50,
};

function isProductionExecutionRestricted() {
  return process.env.NODE_ENV === "production";
}

async function executeViaJudge0(lang, code, stdin = "", timeoutMs = 5000) {
  if (!process.env.JUDGE0_API_HOST) return null;
  const langId = judge0LangMap[lang];
  if (!langId) {
    throw new Error(`Language '${lang}' is not supported by Judge0`);
  }

  let normalizedCode = code;
  if (lang === "java") {
    // Judge0 compiles Java in Main.java, so the public class name must be Main
    if (/public\s+class\s+[A-Za-z0-9_]+/i.test(normalizedCode)) {
      normalizedCode = normalizedCode.replace(/public\s+class\s+[A-Za-z0-9_]+/g, "public class Main");
    } else if (/\bclass\s+([A-Za-z0-9_]+)/i.test(normalizedCode)) {
      normalizedCode = normalizedCode.replace(/\bclass\s+[A-Za-z0-9_]+/i, "public class Main");
    }
  }

  const url = new URL("/submissions?wait=true", process.env.JUDGE0_API_HOST);
  const headers = {
    "Content-Type": "application/json",
  };
  if (process.env.JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = new URL(process.env.JUDGE0_API_HOST).hostname;
  }

  const bodyData = JSON.stringify({
    source_code: Buffer.from(normalizedCode).toString("base64"),
    language_id: langId,
    stdin: Buffer.from(stdin || "").toString("base64"),
    cpu_time_limit: Math.min(Math.max(Math.ceil(timeoutMs / 1000), 1), 10),
    wall_time_limit: Math.min(Math.max(Math.ceil((timeoutMs + 2000) / 1000), 2), 15),
    memory_limit: 128000,
    max_file_size: 1024,
  });

  const j0Result = await new Promise((resolve, reject) => {
    const reqModule = url.protocol === "https:" ? https : http;
    const jReq = reqModule.request(
      url,
      { method: "POST", headers, timeout: timeoutMs + 3000 },
      (jRes) => {
        let resData = "";
        jRes.on("data", (c) => (resData += c));
        jRes.on("end", () => {
          if (jRes.statusCode < 200 || jRes.statusCode >= 300) {
            return reject(new Error(`Judge0 HTTP Error ${jRes.statusCode}: ${resData || "Unexpected response"}`));
          }
          try {
            const parsed = JSON.parse(resData);
            if (!parsed || typeof parsed !== "object" || !parsed.status) {
              return reject(new Error("Judge0 returned malformed response or missing status"));
            }
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Judge0 JSON parsing failed: ${e.message}`));
          }
        });
      }
    );
    jReq.on("error", reject);
    jReq.on("timeout", () => {
      jReq.destroy();
      reject(new Error("Judge0 execution request timed out"));
    });
    jReq.write(bodyData);
    jReq.end();
  });

  if (j0Result && j0Result.status) {
    const stdout = j0Result.stdout ? Buffer.from(j0Result.stdout, "base64").toString("utf8") : "";
    const stderr = j0Result.stderr ? Buffer.from(j0Result.stderr, "base64").toString("utf8") : "";
    const compileOutput = j0Result.compile_output ? Buffer.from(j0Result.compile_output, "base64").toString("utf8") : "";
    return {
      output: stdout,
      error: stderr || compileOutput || (j0Result.status.id > 3 ? j0Result.status.description : ""),
      duration: Math.round(Number(j0Result.time || 0) * 1000) || 0,
      exitCode: j0Result.status.id === 3 ? 0 : 1,
      engine: "Judge0",
    };
  }
  throw new Error("Incomplete or empty Judge0 submission result");
}

function isCodeEmptyOrComments(code) {
  if (!code || typeof code !== "string") return true;
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "")
    .replace(/\s+/g, "");
  return stripped.length === 0;
}

function validateTestCaseOutput(actual, expected) {
  if (actual === undefined || actual === null) actual = "";
  if (expected === undefined || expected === null) expected = "";

  const cleanAct = String(actual).trim().replace(/\r\n/g, "\n");
  const cleanExp = String(expected).trim().replace(/\r\n/g, "\n");

  if (cleanAct === cleanExp) return true;

  const normalize = (s) =>
    s
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(" ");

  const normAct = normalize(cleanAct);
  const normExp = normalize(cleanExp);
  if (normAct === normExp) return true;

  if (normAct.toLowerCase() === normExp.toLowerCase()) return true;

  const stripPrefix = (s) => s.replace(/^(output|result)\s*[:=]\s*/i, "").trim();
  const strippedAct = stripPrefix(normAct);
  if (strippedAct === normExp || strippedAct.toLowerCase() === normExp.toLowerCase()) return true;

  try {
    const actJson = JSON.parse(normAct);
    const expJson = JSON.parse(normExp);
    if (JSON.stringify(actJson) === JSON.stringify(expJson)) return true;
  } catch {}

  const unquote = (s) => s.replace(/^["']|["']$/g, "").trim();
  if (unquote(normAct) === unquote(normExp)) return true;
  if (unquote(strippedAct) === unquote(normExp)) return true;

  const stripPunct = (s) => s.replace(/[\[\],]/g, " ").replace(/\s+/g, " ").trim();
  if (stripPunct(normAct) === stripPunct(normExp) && stripPunct(normExp).length > 0) return true;
  if (stripPunct(strippedAct) === stripPunct(normExp) && stripPunct(normExp).length > 0) return true;

  const numAct = Number(strippedAct || normAct);
  const numExp = Number(normExp);
  if (!isNaN(numAct) && !isNaN(numExp) && normExp !== "") {
    if (Math.abs(numAct - numExp) < 1e-4) return true;
  }

  try {
    const actArr = JSON.parse(normAct);
    const expArr = JSON.parse(normExp);
    if (Array.isArray(actArr) && Array.isArray(expArr) && actArr.length === expArr.length) {
      const sortedAct = [...actArr].sort();
      const sortedExp = [...expArr].sort();
      if (JSON.stringify(sortedAct) === JSON.stringify(sortedExp)) return true;
    }
  } catch {}

  return false;
}

// Universal Python function test harness
const PYTHON_FUNCTION_HARNESS = `
# --- MASTERY ZONE RUNNER HARNESS ---
import sys, json, inspect

def _mz_auto_runner():
    candidates = []
    if "Solution" in globals() and inspect.isclass(globals()["Solution"]):
        try:
            sol_inst = globals()["Solution"]()
            methods = [m for m in dir(sol_inst) if not m.startswith("_") and callable(getattr(sol_inst, m))]
            if methods:
                candidates.append(getattr(sol_inst, methods[0]))
        except Exception:
            pass

    if not candidates:
        for name, obj in list(globals().items()):
            if callable(obj) and not name.startswith("_") and not inspect.isclass(obj):
                if getattr(obj, "__module__", None) == "__main__":
                    candidates.append(obj)

    if not candidates:
        return

    func = candidates[0]
    raw = sys.stdin.read()
    if raw is None:
        return
    raw_str = str(raw).strip()

    sig = None
    param_count = 1
    try:
        sig = inspect.signature(func)
        param_count = len([p for p in sig.parameters.values() if p.default == inspect.Parameter.empty and p.kind in (inspect.Parameter.POSITIONAL_ONLY, inspect.Parameter.POSITIONAL_OR_KEYWORD)])
        if param_count == 0:
            param_count = len(sig.parameters)
    except Exception:
        pass

    def parse_token(s):
        s = s.strip()
        if not s:
            return s
        try:
            return json.loads(s)
        except Exception:
            pass
        if s.lower() == "true": return True
        if s.lower() == "false": return False
        try:
            if "." in s: return float(s)
            return int(s)
        except Exception:
            pass
        return s

    lines = [l for l in raw_str.split("\\n") if l.strip() != ""]
    args = []

    if param_count == 0:
        args = []
    elif param_count == 1:
        if len(lines) == 1:
            args = [parse_token(lines[0])]
        elif len(lines) > 1:
            try:
                args = [json.loads(raw_str)]
            except Exception:
                args = [parse_token(lines[0])]
        else:
            args = [parse_token(raw_str)] if raw_str else []
    elif param_count > 1 and len(lines) >= param_count:
        args = [parse_token(lines[i]) for i in range(param_count)]
    elif param_count > 1 and len(lines) == 1:
        tokens = raw_str.split()
        if len(tokens) == param_count:
            args = [parse_token(t) for t in tokens]
        else:
            args = [parse_token(l) for l in lines]
    else:
        args = [parse_token(l) for l in lines]

    res = func(*args)
    if res is not None:
        if isinstance(res, bool):
            print("true" if res else "false")
        elif isinstance(res, (list, dict)):
            print(json.dumps(res))
        else:
            print(res)

if __name__ == "__main__":
    _mz_auto_runner()
`;

/**
 * Universal Sandboxed Execution for a single run
 */
async function executeCode({ language, code, stdin = "", timeoutMs = 5000, files = [] }) {
  const lang = (language || "").toLowerCase().trim();
  const startTime = Date.now();

  const safety = validateCodeSafety(lang, code);
  if (!safety.safe) {
    return {
      output: "",
      error: safety.reason,
      exitCode: 1,
      duration: 0,
      engine: "Security Sandbox Validator",
      isSecurityViolation: true,
    };
  }

  // 1. External Judge0 Remote Isolation
  if (process.env.JUDGE0_API_HOST) {
    try {
      const j0 = await executeViaJudge0(lang, code, stdin, timeoutMs);
      if (j0) {
        return {
          ...j0,
          duration: j0.duration || Date.now() - startTime,
        };
      }
    } catch (j0Err) {
      if (process.env.NODE_ENV === "production" || process.env.JUDGE0_REQUIRED === "true") {
        return {
          output: "",
          error: "Isolated execution sandbox is temporarily unavailable. Please retry shortly.",
          duration: Date.now() - startTime,
          exitCode: 1,
          isUnavailable: true,
          engine: "Judge0",
        };
      }
    }
  }

  // Fail-closed check if local execution restricted
  if (process.env.NODE_ENV === "production" || isProductionExecutionRestricted()) {
    return {
      output: "",
      error: "Production execution requires a configured isolated execution environment (Judge0).",
      duration: Date.now() - startTime,
      exitCode: 1,
      isUnavailable: true,
      engine: "Security Sandbox Validator",
    };
  }

  // 2. Local Sandboxed Execution with Process Memory and Time Caps
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_exec_"));

  try {
    if (Array.isArray(files) && files.length > 0) {
      files.forEach((f) => {
        if (f.name && typeof f.content === "string") {
          try {
            fs.writeFileSync(path.join(tmpDir, path.basename(f.name)), f.content, "utf8");
          } catch {}
        }
      });
    }

    if (lang === "javascript" || lang === "js" || lang === "node") {
      const scriptPath = path.join(tmpDir, "index.js");
      fs.writeFileSync(scriptPath, code, "utf8");
      const result = await runSandboxedProcess(
        NODE_BIN,
        ["--max-old-space-size=128", scriptPath],
        stdin,
        timeoutMs,
        tmpDir
      );
      return { ...result, engine: "Node.js Sandboxed" };
    }

    if (lang === "python" || lang === "py") {
      const scriptPath = path.join(tmpDir, "main.py");
      fs.writeFileSync(scriptPath, code, "utf8");
      const result = await runSandboxedProcess(
        PYTHON_BIN,
        ["-u", "-I", scriptPath],
        stdin,
        timeoutMs,
        tmpDir
      );
      return { ...result, engine: "Python 3 Sandboxed" };
    }

    if (lang === "cpp" || lang === "c++") {
      const srcPath = path.join(tmpDir, "main.cpp");
      const binPath = path.join(tmpDir, "main_bin");
      fs.writeFileSync(srcPath, code, "utf8");

      const compileRes = await runSandboxedProcess(GPP_BIN, ["-O0", srcPath, "-o", binPath], "", 6000, tmpDir);
      if (compileRes.exitCode !== 0) {
        return {
          output: "",
          error: `Compilation Error:\n${compileRes.error}`,
          duration: Date.now() - startTime,
          exitCode: 1,
          engine: "Clang/G++ C++",
        };
      }

      const execRes = await runSandboxedProcess(binPath, [], stdin, timeoutMs, tmpDir);
      return { ...execRes, engine: "Clang/G++ C++" };
    }

    if (lang === "c") {
      const srcPath = path.join(tmpDir, "main.c");
      const binPath = path.join(tmpDir, "main_bin");
      fs.writeFileSync(srcPath, code, "utf8");

      const compileRes = await runSandboxedProcess(GCC_BIN, ["-O0", srcPath, "-o", binPath], "", 6000, tmpDir);
      if (compileRes.exitCode !== 0) {
        return {
          output: "",
          error: `Compilation Error:\n${compileRes.error}`,
          duration: Date.now() - startTime,
          exitCode: 1,
          engine: "Clang/GCC C",
        };
      }

      const execRes = await runSandboxedProcess(binPath, [], stdin, timeoutMs, tmpDir);
      return { ...execRes, engine: "Clang/GCC C" };
    }

    if (lang === "java") {
      let className = "Main";
      const publicClassMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      if (publicClassMatch && publicClassMatch[1]) {
        className = publicClassMatch[1];
      } else {
        const anyClassMatch = code.match(/\bclass\s+([A-Za-z0-9_]+)/);
        if (anyClassMatch && anyClassMatch[1]) {
          className = anyClassMatch[1];
        }
      }

      const srcPath = path.join(tmpDir, `${className}.java`);
      fs.writeFileSync(srcPath, code, "utf8");

      const compileRes = await runSandboxedProcess(JAVAC_BIN, [srcPath], "", 6000, tmpDir);
      if (compileRes.exitCode !== 0) {
        return {
          output: "",
          error: `Java Compilation Error:\n${compileRes.error}`,
          duration: Date.now() - startTime,
          exitCode: 1,
          engine: "OpenJDK 26",
        };
      }

      const execRes = await runSandboxedProcess(
        JAVA_BIN,
        ["-Xmx128m", "-cp", tmpDir, className],
        stdin,
        timeoutMs,
        tmpDir
      );
      return { ...execRes, engine: "OpenJDK 26" };
    }

    if (lang === "html" || lang === "htm" || lang === "css") {
      return {
        output: code,
        error: "",
        duration: Date.now() - startTime,
        exitCode: 0,
        engine: "Frontend Web Preview",
      };
    }

    return {
      output: "",
      error: `Unsupported language: ${language}`,
      duration: Date.now() - startTime,
      exitCode: 1,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Universal Batch Test Evaluation
 */
async function evaluateTestCasesBatch(language, code, testCases) {
  if (!Array.isArray(testCases) || testCases.length === 0) return [];
  const safeCode = typeof code === "string" ? code : "";

  if (isCodeEmptyOrComments(safeCode)) {
    return testCases.map((tc) => ({
      passed: false,
      actual: "",
      expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
      error: "No executable code provided. Please implement your solution.",
      duration: 0,
    }));
  }

  let lang = (language || "").toLowerCase().trim();

  const safety = validateCodeSafety(lang, safeCode);
  if (!safety.safe) {
    return testCases.map((tc) => ({
      passed: false,
      actual: "",
      expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
      error: safety.reason,
      duration: 0,
    }));
  }

  let cacheKey = "";
  try {
    const hash = crypto.createHash("sha256").update(`${lang}:::${safeCode}:::${JSON.stringify(testCases)}`).digest("hex");
    cacheKey = hash;
    if (batchEvaluationCache.has(cacheKey)) {
      return JSON.parse(JSON.stringify(batchEvaluationCache.get(cacheKey)));
    }
  } catch {}

  if (isProductionExecutionRestricted()) {
    return testCases.map((tc) => ({
      passed: false,
      actual: "",
      expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
      error: "Production execution requires a configured isolated execution environment (Judge0). Local fallback is disabled.",
      duration: 0,
    }));
  }

  if (process.env.JUDGE0_API_HOST) {
    try {
      const j0Results = await Promise.all(
        testCases.map((tc) => executeViaJudge0(lang, safeCode, tc.input || "", 4000))
      );
      if (j0Results.every((r) => r !== null)) {
        const results = testCases.map((tc, i) => {
          const res = j0Results[i];
          const actual = (res.output || "").trim();
          const expected = String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim();
          const passed = res.exitCode === 0 && !res.error && validateTestCaseOutput(actual, expected);
          return {
            passed,
            actual,
            expected,
            error: res.error,
            duration: res.duration,
          };
        });

        if (cacheKey && results.length > 0) {
          batchEvaluationCache.set(cacheKey, results);
          if (batchEvaluationCache.size > MAX_EVAL_CACHE) {
            const firstKey = batchEvaluationCache.keys().next().value;
            batchEvaluationCache.delete(firstKey);
          }
        }
        return results;
      }
    } catch (j0Err) {
      if (process.env.NODE_ENV === "production" || process.env.JUDGE0_REQUIRED === "true") {
        return testCases.map((tc) => ({
          passed: false,
          actual: "",
          expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
          error: "Isolated execution sandbox (Judge0) is temporarily unavailable.",
          duration: 0,
        }));
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    return testCases.map((tc) => ({
      passed: false,
      actual: "",
      expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
      error: "Production execution requires a configured isolated execution environment (Judge0). Local fallback is disabled.",
      duration: 0,
    }));
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mz_judge_"));
  const timeoutMs = 4000;

  const codeNoComments = safeCode
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "")
    .trim();

  const hasPythonDef = /^\s*def\s+[a-zA-Z0-9_]+\s*\(|import\s+sys|import\s+json/m.test(codeNoComments);
  const hasJsSyntax = /function\s+[a-zA-Z0-9_$]+|console\.log|const\s+[a-zA-Z0-9_$]+\s*=|let\s+[a-zA-Z0-9_$]+\s*=/m.test(codeNoComments);
  const hasJavaSyntax = /(public\s+)?class\s+[A-Za-z0-9_]+|System\.out\.print/m.test(codeNoComments);
  const hasCppSyntax = /#include\s*<[a-z]+>|std::|using\s+namespace\s+std/m.test(codeNoComments);

  if ((lang === "javascript" || lang === "js") && hasPythonDef && !hasJsSyntax) {
    lang = "python";
  } else if ((lang === "python" || lang === "py") && hasJsSyntax && !hasPythonDef) {
    lang = "javascript";
  } else if ((lang === "python" || lang === "py") && hasCppSyntax && !hasPythonDef) {
    lang = "cpp";
  } else if ((lang === "python" || lang === "py") && hasJavaSyntax && !hasPythonDef) {
    lang = "java";
  }

  try {
    let runner = null;

    if (lang === "python" || lang === "py") {
      const p = path.join(tmpDir, "solution.py");
      const hasStdin = /sys\.stdin|input\s*\(/.test(codeNoComments);
      const executableCode = hasStdin ? safeCode : `${safeCode}\n\n${PYTHON_FUNCTION_HARNESS}`;
      fs.writeFileSync(p, executableCode, "utf8");

      runner = (input) => runSandboxedProcess(PYTHON_BIN, ["-u", "-I", p], input, timeoutMs, tmpDir);
    } else if (lang === "javascript" || lang === "js" || lang === "node") {
      const p = path.join(tmpDir, "solution.js");
      const hasStdin = /fs\.readFileSync|readline|process\.stdin/.test(codeNoComments);

      const fnMatches = [...safeCode.matchAll(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g)];
      const extractedNames = fnMatches.map((m) => m[1] || m[2]).filter(Boolean);

      const jsHarness = `
;(() => {
  const fs = require("fs");
  let raw = "";
  try { raw = fs.readFileSync(0, "utf8"); } catch(e) { return; }
  if (raw === undefined || raw === null || !raw.trim()) return;
  const rawStr = raw.trim();

  let targetFn = null;
  if (typeof Solution === "function") {
    try {
      const s = new Solution();
      const proto = Object.getPrototypeOf(s);
      const methods = Object.getOwnPropertyNames(proto).filter(m => m !== "constructor" && typeof s[m] === "function");
      if (methods.length > 0) targetFn = s[methods[0]].bind(s);
    } catch(e) {}
  }

  if (!targetFn) {
    const candidateNames = ${JSON.stringify(extractedNames)};
    for (const name of candidateNames) {
      try {
        if (typeof eval(name) === "function") {
          targetFn = eval(name);
          break;
        }
      } catch(e) {}
    }
  }

  if (!targetFn) return;

  function parseToken(s) {
    s = s.trim();
    if (!s) return s;
    try { return JSON.parse(s); } catch(e) {}
    if (s.toLowerCase() === "true") return true;
    if (s.toLowerCase() === "false") return false;
    if (!isNaN(Number(s)) && s !== "") return Number(s);
    return s;
  }

  const lines = rawStr.split("\\n").map(l => l.trim()).filter(Boolean);
  const paramCount = typeof targetFn.length === "number" ? targetFn.length : 1;
  let args = [];

  if (paramCount === 0) {
    args = [];
  } else if (paramCount === 1) {
    if (lines.length === 1) {
      args = [parseToken(lines[0])];
    } else if (lines.length > 1) {
      try { args = [JSON.parse(rawStr)]; } catch(e) { args = [parseToken(lines[0])]; }
    } else {
      args = rawStr ? [parseToken(rawStr)] : [];
    }
  } else if (paramCount > 1 && lines.length >= paramCount) {
    args = lines.slice(0, paramCount).map(parseToken);
  } else if (paramCount > 1 && lines.length === 1) {
    const tokens = rawStr.split(/\\s+/);
    if (tokens.length === paramCount) {
      args = tokens.map(parseToken);
    } else {
      args = lines.map(parseToken);
    }
  } else {
    args = lines.map(parseToken);
  }

  const res = targetFn(...args);
  if (res !== undefined) {
    if (typeof res === "object" && res !== null) {
      console.log(JSON.stringify(res));
    } else {
      console.log(String(res));
    }
  }
})();
`;

      const executableCode = hasStdin ? safeCode : `${safeCode}\n\n${jsHarness}`;
      fs.writeFileSync(p, executableCode, "utf8");

      runner = (input) =>
        runSandboxedProcess(NODE_BIN, ["--max-old-space-size=128", p], input, timeoutMs, tmpDir);
    } else if (lang === "c") {
      const p = path.join(tmpDir, "solution.c");
      const bin = path.join(tmpDir, "sol_c_bin");
      fs.writeFileSync(p, safeCode, "utf8");

      const cRes = await runSandboxedProcess(GCC_BIN, ["-Wall", "-O0", "-pipe", p, "-o", bin], "", 5000, tmpDir);
      if (cRes.exitCode !== 0) {
        const compErr = `Compilation Error (C):\n${cRes.error || cRes.output}`;
        return testCases.map((tc) => ({
          passed: false,
          actual: "",
          expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
          error: compErr,
          duration: 0,
        }));
      }

      runner = (input) => runSandboxedProcess(bin, [], input, timeoutMs, tmpDir);
    } else if (lang === "cpp" || lang === "c++") {
      const p = path.join(tmpDir, "solution.cpp");
      const bin = path.join(tmpDir, "sol_bin");
      const hasMain = /(int|void)\s+main\s*\(/.test(codeNoComments);

      let cppFullCode = safeCode;
      if (!hasMain && /class\s+Solution/.test(codeNoComments)) {
        let callStatement = "Solution sol; sol.solve();";
        if (/twoSum/.test(codeNoComments)) {
          callStatement = "Solution sol; int target = nums.empty() ? 0 : nums.back(); if (!nums.empty()) nums.pop_back(); std::vector<int> res = sol.twoSum(nums, target); for(size_t i = 0; i < res.size(); i++) std::cout << res[i] << (i + 1 < res.size() ? \" \" : \"\"); std::cout << std::endl;";
        } else if (/findPeakElement/.test(codeNoComments)) {
          callStatement = "Solution sol; std::cout << sol.findPeakElement(nums) << std::endl;";
        } else if (/lengthOfLongestSubstring/.test(codeNoComments)) {
          callStatement = "Solution sol; std::cout << sol.lengthOfLongestSubstring(rawAll) << std::endl;";
        }

        cppFullCode = `#include <iostream>
#include <string>
#include <vector>
#include <sstream>
${safeCode}

int main() {
    std::string line;
    std::vector<int> nums;
    std::string rawAll = "";
    while (std::getline(std::cin, line)) {
        rawAll += line + "\\n";
        for (int i = 0; i < (int)line.size(); i++) {
            char c = line[i];
            if (c == 91 || c == 93 || c == 44 || c == 34) line[i] = 32;
        }
        std::stringstream ss(line);
        int val;
        while (ss >> val) {
            nums.push_back(val);
        }
    }
    ${callStatement}
    return 0;
}
`;
      }

      fs.writeFileSync(p, cppFullCode, "utf8");

      const cRes = await runSandboxedProcess(GPP_BIN, ["-Wall", "-O0", "-pipe", p, "-o", bin], "", 5000, tmpDir);
      if (cRes.exitCode !== 0) {
        const compErr = `Compilation Error (C++):\n${cRes.error || cRes.output}`;
        return testCases.map((tc) => ({
          passed: false,
          actual: "",
          expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
          error: compErr,
          duration: 0,
        }));
      }

      runner = (input) => runSandboxedProcess(bin, [], input, timeoutMs, tmpDir);
    } else if (lang === "java") {
      const hasMain = /public\s+static\s+void\s+main\s*\(|static\s+public\s+void\s+main\s*\(/.test(codeNoComments);
      let className = "Main";

      if (hasMain) {
        const match = safeCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
        if (match && match[1]) className = match[1];
        const p = path.join(tmpDir, `${className}.java`);
        fs.writeFileSync(p, safeCode, "utf8");
        const cRes = await runSandboxedProcess(JAVAC_BIN, [p], "", 5000, tmpDir);
        if (cRes.exitCode !== 0) {
          const compErr = `Compilation Error (Java):\n${cRes.error || cRes.output}`;
          return testCases.map((tc) => ({
            passed: false,
            actual: "",
            expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
            error: compErr,
            duration: 0,
          }));
        }
        runner = (input) =>
          runSandboxedProcess(
            JAVA_BIN,
            ["-XX:+TieredCompilation", "-XX:TieredStopAtLevel=1", "-Xms16m", "-Xmx128m", "-cp", tmpDir, className],
            input,
            timeoutMs,
            tmpDir
          );
      } else {
        const nonPublicCode = safeCode.replace(/public\s+class\s+Solution/g, "class Solution");
        const javaDriver = `
import java.util.*;
import java.lang.reflect.*;

${nonPublicCode}

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        StringBuilder sb = new StringBuilder();
        while (sc.hasNextLine()) {
            sb.append(sc.nextLine()).append("\\n");
        }
        String raw = sb.toString().trim();
        if (raw.isEmpty()) return;

        Solution sol = new Solution();
        Method[] methods = Solution.class.getDeclaredMethods();
        Method target = null;
        for (Method m : methods) {
            if (Modifier.isPublic(m.getModifiers())) {
                target = m;
                break;
            }
        }
        if (target == null && methods.length > 0) target = methods[0];
        if (target == null) return;

        Class<?>[] pTypes = target.getParameterTypes();
        Object[] callArgs = new Object[pTypes.length];
        String[] lines = raw.split("\\\\n");

        for (int i = 0; i < pTypes.length; i++) {
            String token = (i < lines.length) ? lines[i].trim() : (pTypes.length == 1 ? raw : "");
            Class<?> pt = pTypes[i];
            if (pt == int[].class) {
                String clean = token.replace("[", " ").replace("]", " ").replace(",", " ").trim();
                String[] parts = clean.isEmpty() ? new String[0] : clean.split("\\\\s+");
                int[] arr = new int[parts.length];
                for (int j = 0; j < parts.length; j++) arr[j] = Integer.parseInt(parts[j]);
                callArgs[i] = arr;
            } else if (pt == int.class || pt == Integer.class) {
                callArgs[i] = Integer.parseInt(token);
            } else if (pt == String.class) {
                callArgs[i] = token.replaceAll("^\\\"|\\\"$", "");
            } else {
                callArgs[i] = token;
            }
        }

        Object res = target.invoke(sol, callArgs);
        if (res != null) {
            if (res instanceof int[]) {
                System.out.println(Arrays.toString((int[]) res));
            } else {
                System.out.println(res);
            }
        }
    }
}
`;
        const p = path.join(tmpDir, "Main.java");
        fs.writeFileSync(p, javaDriver, "utf8");
        const cRes = await runSandboxedProcess(JAVAC_BIN, [p], "", 5000, tmpDir);
        if (cRes.exitCode !== 0) {
          const compErr = `Compilation Error (Java):\n${cRes.error || cRes.output}`;
          return testCases.map((tc) => ({
            passed: false,
            actual: "",
            expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
            error: compErr,
            duration: 0,
          }));
        }
        runner = (input) =>
          runSandboxedProcess(
            JAVA_BIN,
            ["-XX:+TieredCompilation", "-XX:TieredStopAtLevel=1", "-Xms16m", "-Xmx128m", "-cp", tmpDir, "Main"],
            input,
            timeoutMs,
            tmpDir
          );
      }
    } else {
      return testCases.map((tc) => ({
        passed: false,
        actual: "",
        expected: String(tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "")).trim(),
        error: `Unsupported language: ${language}. Supported languages are Python, JavaScript, Java, C, and C++.`,
        duration: 0,
      }));
    }

    const results = await Promise.all(
      testCases.map(async (tc) => {
        const tcStartTime = Date.now();
        const input = tc.input !== undefined ? tc.input : "";
        const expectedOutput = tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "");
        const res = await runner(input);
        const cleanActual = (res.output || "").trim().replace(/\r\n/g, "\n");
        const cleanExpected = (expectedOutput || "").trim().replace(/\r\n/g, "\n");
        const effectiveError = res.error || (res.exitCode !== 0 ? (cleanActual || "Runtime error") : "");
        const passed = res.exitCode === 0 && validateTestCaseOutput(cleanActual, cleanExpected);

        return {
          passed,
          actual: cleanActual,
          expected: cleanExpected,
          error: effectiveError,
          duration: res.duration || (Date.now() - tcStartTime),
        };
      })
    );

    try {
      if (cacheKey && results && results.length > 0) {
        if (batchEvaluationCache.size >= MAX_EVAL_CACHE) {
          const oldestKey = batchEvaluationCache.keys().next().value;
          batchEvaluationCache.delete(oldestKey);
        }
        batchEvaluationCache.set(cacheKey, results);
      }
    } catch {}

    return results;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Universal Single Test Case Evaluation
 */
async function evaluateSingleTestCase(language, code, input, expectedOutput) {
  const batch = await evaluateTestCasesBatch(language, code, [{ input, expectedOutput }]);
  return batch[0] || {
    passed: false,
    actual: "",
    expected: String(expectedOutput || "").trim(),
    error: "Execution failed",
    duration: 0,
  };
}

module.exports = {
  JAVAC_BIN,
  JAVA_BIN,
  GCC_BIN,
  GPP_BIN,
  PYTHON_BIN,
  NODE_BIN,
  checkExecutionRateLimit,
  validateCodeSafety,
  terminateProcessTree,
  runSandboxedProcess,
  judge0LangMap,
  executeViaJudge0,
  isProductionExecutionRestricted,
  isCodeEmptyOrComments,
  validateTestCaseOutput,
  executeCode,
  evaluateTestCasesBatch,
  evaluateSingleTestCase,
};
