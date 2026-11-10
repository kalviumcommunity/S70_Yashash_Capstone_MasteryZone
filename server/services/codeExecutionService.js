const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const os = require("os");
const crypto = require("crypto");
const { execFile, spawn } = require("child_process");
const https = require("https");
const http = require("http");

function resolveExecutable(binName, candidatePaths = []) {
  if ((binName === "node" || binName === "nodejs") && process.execPath && fs.existsSync(process.execPath)) {
    return process.execPath;
  }
  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  const sysPath = process.env.PATH || "";
  const dirs = sysPath.split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    const full = path.join(dir, binName);
    if (fs.existsSync(full)) return full;
  }
  return binName;
}

// Detect OpenJDK binaries
const JAVAC_BIN = resolveExecutable("javac", [
  "/opt/homebrew/opt/openjdk/bin/javac",
  "/opt/homebrew/bin/javac",
  "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/javac",
  "/usr/local/bin/javac",
  "/usr/bin/javac",
]);

const JAVA_BIN = resolveExecutable("java", [
  "/opt/homebrew/opt/openjdk/bin/java",
  "/opt/homebrew/bin/java",
  "/opt/homebrew/Cellar/openjdk/26.0.2.1/bin/java",
  "/usr/local/bin/java",
  "/usr/bin/java",
]);

const GCC_BIN = resolveExecutable("gcc", ["/usr/bin/gcc", "/usr/local/bin/gcc", "/opt/homebrew/bin/gcc"]);
const GPP_BIN = resolveExecutable("g++", ["/usr/bin/g++", "/usr/local/bin/g++", "/opt/homebrew/bin/g++"]);
const PYTHON_BIN = resolveExecutable("python3", ["/usr/bin/python3", "/usr/local/bin/python3", "/opt/homebrew/bin/python3"]);
const NODE_BIN = resolveExecutable("node", [
  process.execPath,
  "/usr/local/bin/node",
  "/usr/bin/node",
  "/opt/homebrew/bin/node",
]);

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

function getExecutionEnvironment(cwd = os.tmpdir()) {
  const nodeDir = path.dirname(process.execPath || "");
  const standardDirs = [
    nodeDir,
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/opt/homebrew/sbin",
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
  ];
  const existingPathDirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const combinedPath = Array.from(new Set([...standardDirs, ...existingPathDirs])).join(path.delimiter);

  return {
    PATH: combinedPath,
    HOME: cwd,
    TMPDIR: cwd,
    LANG: "en_US.UTF-8",
  };
}

function checkExecutableAvailable(command, envPath) {
  if (!command) return false;
  if (path.isAbsolute(command)) {
    return fs.existsSync(command);
  }
  const searchDirs = (envPath || "").split(path.delimiter).filter(Boolean);
  return searchDirs.some((dir) => fs.existsSync(path.join(dir, command)));
}

function runSandboxedProcess(command, args, stdinInput = "", timeoutMs = 5000, cwd = os.tmpdir()) {
  return new Promise(async (resolve) => {
    // Fail closed: enforce execution environment security at every process spawn site
    if (!isLocalExecutionPermitted()) {
      return resolve({
        output: "",
        error: "Execution security policy violation: Local process execution is strictly disabled in untrusted/non-development environments.",
        duration: 0,
        exitCode: 1,
        isUnavailable: true,
      });
    }

    const queueStart = Date.now();
    while (activeExecutions >= MAX_CONCURRENT_EXECUTIONS) {
      if (Date.now() - queueStart > 4000) {
        return resolve({
          output: "",
          error: "Execution concurrency limit reached. Please wait a moment before running more code.",
          duration: 0,
          exitCode: 1,
        });
      }
      await new Promise((r) => setTimeout(r, 25));
    }

    activeExecutions++;
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isSettled = false;

    const cleanup = () => {
      activeExecutions = Math.max(0, activeExecutions - 1);
    };

    const execEnv = getExecutionEnvironment(cwd);
    if (!checkExecutableAvailable(command, execEnv.PATH)) {
      cleanup();
      return resolve({
        output: "",
        error: `Execution error: Runtime executable '${command}' not found on server environment. Please ensure '${command}' is installed.`,
        duration: Date.now() - startTime,
        exitCode: 1,
      });
    }

    let proc;
    try {
      proc = spawn(command, args, {
        cwd,
        env: execEnv,
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
      stdout += chunk.toString();
      if (stdout.length > 1024 * 256) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          cleanup();
          terminateProcessTree(proc);
          return resolve({
            output: stdout.slice(0, 1024 * 64),
            error: "Execution limit exceeded: Output size exceeded maximum allowed buffer (256 KB).",
            duration: Date.now() - startTime,
            exitCode: -1,
          });
        }
      }
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 1024 * 256) {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          cleanup();
          terminateProcessTree(proc);
          return resolve({
            output: stdout.slice(0, 1024 * 64),
            error: "Execution limit exceeded: Error output size exceeded maximum allowed buffer (256 KB).",
            duration: Date.now() - startTime,
            exitCode: -1,
          });
        }
      }
    });

    proc.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        cleanup();
        resolve({
          output: stdout,
          error: `Execution error: Failed to execute runtime '${command}': ${err.message}`,
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

const COMMON_HELPER_NAMES = [
  "swap",
  "helper",
  "util",
  "dfs",
  "bfs",
  "gcd",
  "lcm",
  "print",
  "display",
  "tostring",
  "equals",
  "hashcode",
];

function parseCppSolution(code, targetMethodName = "") {
  const classMatch = code.match(/class\s+Solution\s*\{([\s\S]*?)\};/);
  if (!classMatch) return null;
  const body = classMatch[1];

  const methodRegex = /([a-zA-Z0-9_:<>&*]+(?:\s+[a-zA-Z0-9_:<>&*]+)?)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
  const methods = [];
  let m;
  while ((m = methodRegex.exec(body)) !== null) {
    const rawRet = m[1].replace(/public:|private:|protected:/g, "").trim();
    const name = m[2].trim();
    const paramsRaw = m[3].trim();
    if (!["if", "while", "for", "switch", "catch"].includes(name)) {
      const params = paramsRaw
        ? paramsRaw.split(",").map((p) => {
            const parts = p.trim().split(/\s+/);
            const pName = parts.pop().replace(/^[&*]+/, "");
            const pType = parts.join(" ");
            return { type: pType, name: pName };
          })
        : [];
      methods.push({ retType: rawRet, name, params });
    }
  }

  if (targetMethodName) {
    const found = methods.find((m) => m.name === targetMethodName);
    if (found) return found;
  }
  return null;
}

function generateCppExecutable(code, options = {}) {
  const codeNoComments = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();

  const hasMain = /(int|void)\s+main\s*\(/.test(codeNoComments);
  if (hasMain) {
    return code;
  }

  const targetMethodName = options.functionName || "";
  if (!targetMethodName) {
    return `#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
${code}

int main() {
    Solution sol;
    std::cerr << "Configuration Error: Function-based execution requires an explicit function name\\n";
    return 1;
}
`;
  }

  const method = parseCppSolution(codeNoComments, targetMethodName);

  if (!method) {
    return `#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
${code}

int main() {
    std::cerr << "Compilation/Link Error: Expected method '${targetMethodName}' was not found in class Solution\\n";
    return 1;
}
`;
  }

  let paramSetup = "";
  const callArgs = [];

  method.params.forEach((p, idx) => {
    const argName = `arg_${idx}`;
    if (p.type.includes("vector<int>") || p.type.includes("vector<long long>")) {
      paramSetup += `
    std::vector<int> ${argName};
    {
        std::string line;
        if (std::getline(std::cin, line)) {
            for (size_t ci = 0; ci < line.size(); ci++) {
                char c = line[ci];
                if (c == 91 || c == 93 || c == 44 || c == 34) line[ci] = 32;
            }
            std::stringstream ss(line);
            int v;
            while (ss >> v) ${argName}.push_back(v);
        }
    }`;
      callArgs.push(argName);
    } else if (p.type.includes("vector<string>")) {
      paramSetup += `
    std::vector<std::string> ${argName};
    {
        std::string line;
        if (std::getline(std::cin, line)) {
            for (size_t ci = 0; ci < line.size(); ci++) {
                char c = line[ci];
                if (c == 91 || c == 93 || c == 44 || c == 34) line[ci] = 32;
            }
            std::stringstream ss(line);
            std::string s;
            while (ss >> s) ${argName}.push_back(s);
        }
    }`;
      callArgs.push(argName);
    } else if (p.type.includes("int") || p.type.includes("long")) {
      paramSetup += `
    int ${argName} = 0;
    std::cin >> ${argName};`;
      callArgs.push(argName);
    } else if (p.type.includes("double") || p.type.includes("float")) {
      paramSetup += `
    double ${argName} = 0.0;
    std::cin >> ${argName};`;
      callArgs.push(argName);
    } else if (p.type.includes("bool")) {
      paramSetup += `
    bool ${argName} = false;
    std::cin >> std::boolalpha >> ${argName};`;
      callArgs.push(argName);
    } else if (p.type.includes("string")) {
      paramSetup += `
    std::string ${argName};
    std::getline(std::cin, ${argName});
    if (${argName}.empty()) std::cin >> ${argName};`;
      callArgs.push(argName);
    } else {
      paramSetup += `
    std::string ${argName};
    std::getline(std::cin, ${argName});`;
      callArgs.push(argName);
    }
  });

  let outputStmt = "";
  if (method.retType.includes("vector<int>") || method.retType.includes("vector<long long>")) {
    outputStmt = `for (size_t i = 0; i < res.size(); i++) std::cout << res[i] << (i + 1 < res.size() ? " " : ""); std::cout << std::endl;`;
  } else if (method.retType.includes("vector<string>")) {
    outputStmt = `for (size_t i = 0; i < res.size(); i++) std::cout << res[i] << (i + 1 < res.size() ? " " : ""); std::cout << std::endl;`;
  } else if (method.retType.includes("bool")) {
    outputStmt = `std::cout << (res ? "true" : "false") << std::endl;`;
  } else {
    outputStmt = `std::cout << res << std::endl;`;
  }

  return `#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>

${code}

int main() {
${paramSetup}
    Solution sol;
    auto res = sol.${method.name}(${callArgs.join(", ")});
    ${outputStmt}
    return 0;
}
`;
}

function generateJavaExecutable(code, options = {}) {
  const codeNoComments = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();

  const hasMain = /public\s+static\s+void\s+main\s*\(|static\s+public\s+void\s+main\s*\(/.test(codeNoComments);
  if (hasMain) {
    return { code, hasMain: true };
  }

  const targetMethodName = options.functionName || "";
  const nonPublicCode = code.replace(/public\s+class\s+Solution/g, "class Solution");

  const driver = `import java.util.*;
import java.lang.reflect.*;

${nonPublicCode}

public class Main {
    static String formatValue(Object obj) {
        if (obj == null) return "null";
        if (obj.getClass().isArray()) {
            int len = Array.getLength(obj);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < len; i++) {
                if (i > 0) sb.append(", ");
                Object elem = Array.get(obj, i);
                sb.append(formatValue(elem));
            }
            sb.append("]");
            return sb.toString();
        }
        return String.valueOf(obj);
    }

    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        StringBuilder sb = new StringBuilder();
        while (sc.hasNextLine()) {
            sb.append(sc.nextLine()).append("\\n");
        }
        String raw = sb.toString().trim();

        final String preferredName = ${JSON.stringify(targetMethodName)};
        if (preferredName == null || preferredName.isEmpty()) {
            System.err.println("Configuration Error: Function-based execution requires an explicit function name");
            System.exit(1);
            return;
        }

        Solution sol = new Solution();
        Method[] methods = Solution.class.getDeclaredMethods();
        Method target = null;
        for (Method m : methods) {
            if (Modifier.isPublic(m.getModifiers()) && m.getName().equals(preferredName)) {
                target = m;
                break;
            }
        }

        if (target == null) {
            System.err.println("NoSuchMethodError: Solution does not define expected public method '" + preferredName + "'");
            System.exit(1);
            return;
        }

        Class<?>[] pTypes = target.getParameterTypes();
        if (pTypes.length == 0) {
            try {
                Object result = target.invoke(sol, new Object[0]);
                if (target.getReturnType() != void.class && result != null) {
                    System.out.println(formatValue(result));
                }
            } catch (InvocationTargetException ite) {
                Throwable cause = ite.getCause() != null ? ite.getCause() : ite;
                System.err.println("Runtime Exception: " + cause.toString());
                cause.printStackTrace(System.err);
                System.exit(1);
            } catch (Exception ex) {
                System.err.println("Runtime Exception: " + ex.toString());
                ex.printStackTrace(System.err);
                System.exit(1);
            }
            return;
        }

        if (raw.isEmpty()) {
            System.err.println("InputError: Method '" + preferredName + "' expects " + pTypes.length + " parameter(s) but input was empty");
            System.exit(1);
            return;
        }

        Object[] callArgs = new Object[pTypes.length];
        String[] lines = raw.split("\\\\n");

        for (int i = 0; i < pTypes.length; i++) {
            String token = (i < lines.length) ? lines[i].trim() : (pTypes.length == 1 ? raw : "");
            Class<?> pt = pTypes[i];
            if (pt == int[].class) {
                String clean = token.replace("[", " ").replace("]", " ").replace(",", " ").trim();
                String[] nums = clean.isEmpty() ? new String[0] : clean.split("\\\\s+");
                int[] arr = new int[nums.length];
                for (int j = 0; j < nums.length; j++) arr[j] = Integer.parseInt(nums[j]);
                callArgs[i] = arr;
            } else if (pt == long[].class) {
                String clean = token.replace("[", " ").replace("]", " ").replace(",", " ").trim();
                String[] nums = clean.isEmpty() ? new String[0] : clean.split("\\\\s+");
                long[] arr = new long[nums.length];
                for (int j = 0; j < nums.length; j++) arr[j] = Long.parseLong(nums[j]);
                callArgs[i] = arr;
            } else if (pt == double[].class) {
                String clean = token.replace("[", " ").replace("]", " ").replace(",", " ").trim();
                String[] nums = clean.isEmpty() ? new String[0] : clean.split("\\\\s+");
                double[] arr = new double[nums.length];
                for (int j = 0; j < nums.length; j++) arr[j] = Double.parseDouble(nums[j]);
                callArgs[i] = arr;
            } else if (pt == float[].class) {
                String clean = token.replace("[", " ").replace("]", " ").replace(",", " ").trim();
                String[] nums = clean.isEmpty() ? new String[0] : clean.split("\\\\s+");
                float[] arr = new float[nums.length];
                for (int j = 0; j < nums.length; j++) arr[j] = Float.parseFloat(nums[j]);
                callArgs[i] = arr;
            } else if (pt == boolean[].class) {
                String clean = token.replace("[", " ").replace("]", " ").replace(",", " ").trim();
                String[] bools = clean.isEmpty() ? new String[0] : clean.split("\\\\s+");
                boolean[] arr = new boolean[bools.length];
                for (int j = 0; j < bools.length; j++) arr[j] = Boolean.parseBoolean(bools[j]);
                callArgs[i] = arr;
            } else if (pt == short[].class) {
                String clean = token.replace("[", " ").replace("]", " ").replace(",", " ").trim();
                String[] nums = clean.isEmpty() ? new String[0] : clean.split("\\\\s+");
                short[] arr = new short[nums.length];
                for (int j = 0; j < nums.length; j++) arr[j] = Short.parseShort(nums[j]);
                callArgs[i] = arr;
            } else if (pt == byte[].class) {
                String clean = token.replace("[", " ").replace("]", " ").replace(",", " ").trim();
                String[] nums = clean.isEmpty() ? new String[0] : clean.split("\\\\s+");
                byte[] arr = new byte[nums.length];
                for (int j = 0; j < nums.length; j++) arr[j] = Byte.parseByte(nums[j]);
                callArgs[i] = arr;
            } else if (pt == char[].class) {
                String clean = token.replace("[", "").replace("]", "").replace(",", "").trim();
                callArgs[i] = clean.toCharArray();
            } else if (pt == int.class || pt == Integer.class) {
                callArgs[i] = Integer.parseInt(token);
            } else if (pt == long.class || pt == Long.class) {
                callArgs[i] = Long.parseLong(token);
            } else if (pt == double.class || pt == Double.class) {
                callArgs[i] = Double.parseDouble(token);
            } else if (pt == float.class || pt == Float.class) {
                callArgs[i] = Float.parseFloat(token);
            } else if (pt == boolean.class || pt == Boolean.class) {
                callArgs[i] = Boolean.parseBoolean(token);
            } else if (pt == short.class || pt == Short.class) {
                callArgs[i] = Short.parseShort(token);
            } else if (pt == byte.class || pt == Byte.class) {
                callArgs[i] = Byte.parseByte(token);
            } else if (pt == char.class || pt == Character.class) {
                callArgs[i] = token.isEmpty() ? '\0' : token.charAt(0);
            } else if (pt == String[].class) {
                String clean = token.replace("[", "").replace("]", "").replace("\\\"", "").replace("\x27", "").trim();
                callArgs[i] = clean.isEmpty() ? new String[0] : clean.split("[,\\\\s]+");
            } else {
                String sTok = token;
                if (sTok.startsWith("\\\"") && sTok.endsWith("\\\"") && sTok.length() >= 2) {
                    sTok = sTok.substring(1, sTok.length() - 1);
                } else if (sTok.startsWith("\x27") && sTok.endsWith("\x27") && sTok.length() >= 2) {
                    sTok = sTok.substring(1, sTok.length() - 1);
                }
                callArgs[i] = sTok;
            }
        }

        try {
            Object result = target.invoke(sol, callArgs);
            if (target.getReturnType() != void.class && result != null) {
                System.out.println(formatValue(result));
            }
        } catch (InvocationTargetException ite) {
            Throwable cause = ite.getCause() != null ? ite.getCause() : ite;
            System.err.println("Runtime Exception: " + cause.toString());
            cause.printStackTrace(System.err);
            System.exit(1);
        } catch (Exception ex) {
            System.err.println("Runtime Exception: " + ex.toString());
            ex.printStackTrace(System.err);
            System.exit(1);
        }
    }
}
`;
  return { code: driver, hasMain: false };
}

function generatePythonExecutable(code, options = {}) {
  const codeNoComments = code
    .replace(/#.*$/gm, "")
    .replace(/'''[\s\S]*?'''/g, "")
    .replace(/"""[\s\S]*?"""/g, "")
    .trim();

  const hasStdin = /sys\.stdin|input\s*\(/.test(codeNoComments);
  if (hasStdin) {
    return code;
  }

  const hasFunctionOrClass = /\b(def\s+[a-zA-Z0-9_]+|class\s+[a-zA-Z0-9_]+)\b/.test(codeNoComments);
  if (!hasFunctionOrClass) {
    return code;
  }

  const targetName = options.functionName || "";
  const harness = `
# --- MASTERY ZONE RUNNER HARNESS ---
import sys, json, inspect

def _mz_auto_runner():
    target_name = ${JSON.stringify(targetName)}
    if not target_name:
        sys.stderr.write("Configuration Error: Function-based execution requires an explicit function name\\n")
        sys.exit(1)

    candidates = []

    if "Solution" in globals() and inspect.isclass(globals()["Solution"]):
        try:
            sol_inst = globals()["Solution"]()
            if hasattr(sol_inst, target_name) and callable(getattr(sol_inst, target_name)):
                candidates.append(getattr(sol_inst, target_name))
            else:
                sys.stderr.write(f"AttributeError: Solution does not define required method '{target_name}'\\n")
                sys.exit(1)
        except Exception as e:
            sys.stderr.write(f"Initialization Error: {e}\\n")
            sys.exit(1)

    if not candidates:
        if target_name in globals() and callable(globals()[target_name]):
            candidates.append(globals()[target_name])
        else:
            sys.stderr.write(f"NameError: Expected function '{target_name}' is not defined\\n")
            sys.exit(1)

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
        if s.lower() == "true":
            return True
        if s.lower() == "false":
            return False
        try:
            return int(s)
        except Exception:
            try:
                return float(s)
            except Exception:
                return s

    args = []
    if param_count == 0:
        args = []
    elif not raw_str:
        sys.stderr.write(f"InputError: Function '{target_name}' expects {param_count} parameter(s) but input was empty\\n")
        sys.exit(1)
    elif param_count == 1:
        try:
            args = [json.loads(raw_str)]
        except Exception:
            args = [parse_token(raw_str)]
    else:
        try:
            parsed = json.loads(raw_str)
            if isinstance(parsed, (list, tuple)) and len(parsed) == param_count:
                args = list(parsed)
            else:
                lines = [l.strip() for l in raw_str.splitlines() if l.strip()]
                if len(lines) >= param_count:
                    args = [parse_token(lines[i]) for i in range(param_count)]
                else:
                    args = [parse_token(t) for t in raw_str.split()[:param_count]]
        except Exception:
            lines = [l.strip() for l in raw_str.splitlines() if l.strip()]
            if len(lines) >= param_count:
                args = [parse_token(lines[i]) for i in range(param_count)]
            else:
                tokens = raw_str.split()
                if len(tokens) >= param_count:
                    args = [parse_token(tokens[i]) for i in range(param_count)]
                else:
                    args = [parse_token(raw_str)]

    try:
        res = func(*args)
        if res is not None:
            if isinstance(res, bool):
                print("true" if res else "false")
            elif isinstance(res, (dict, list, tuple)):
                print(json.dumps(res, separators=(',', ':')))
            else:
                print(res)
    except Exception as e:
        sys.stderr.write(f"Runtime Exception: {e}\\n")
        sys.exit(1)

if __name__ == "__main__":
    _mz_auto_runner()
`;
  return `${code}\n\n${harness}`;
}

function generateJsExecutable(code, options = {}) {
  const codeNoComments = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();

  const hasStdin = /fs\.readFileSync|readline|process\.stdin/.test(codeNoComments);
  if (hasStdin) {
    return code;
  }

  const hasFunctionOrClass = /(?:function\s+[a-zA-Z0-9_$]+|(?:const|let|var)\s+[a-zA-Z0-9_$]+\s*=\s*(?:function|\([^)]*\)\s*=>)|class\s+[a-zA-Z0-9_$]+)/.test(codeNoComments);
  if (!hasFunctionOrClass) {
    return code;
  }

  const targetName = options.functionName || "";
  const fnMatches = [...code.matchAll(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g)];
  const extractedNames = fnMatches.map((m) => m[1] || m[2]).filter(Boolean);

  const jsHarness = `
;(() => {
  const fs = require("fs");
  let raw = "";
  try { raw = fs.readFileSync(0, "utf8"); } catch(e) { raw = ""; }
  const rawStr = typeof raw === "string" ? raw.trim() : "";

  const targetName = ${JSON.stringify(targetName)};
  if (!targetName) {
    console.error("Configuration Error: Function-based execution requires an explicit function name");
    process.exit(1);
  }

  let targetFn = null;

  if (typeof Solution === "function") {
    try {
      const s = new Solution();
      if (typeof s[targetName] === "function") {
        targetFn = s[targetName].bind(s);
      }
    } catch(e) {}
  }

  if (!targetFn) {
    try {
      if (typeof eval(targetName) === "function") targetFn = eval(targetName);
    } catch(e) {}
  }

  if (!targetFn) {
    console.error("ReferenceError: Expected function '" + targetName + "' is not defined in submitted solution");
    process.exit(1);
  }

  function parseToken(s) {
    s = s.trim();
    if (!s) return s;
    try { return JSON.parse(s); } catch(e) {}
    if (s.toLowerCase() === "true") return true;
    if (s.toLowerCase() === "false") return false;
    if (!isNaN(Number(s)) && s !== "") return Number(s);
    return s;
  }

  const paramCount = typeof targetFn.length === "number" ? targetFn.length : 0;
  let parsedArgs = [];

  if (paramCount === 0) {
    parsedArgs = [];
  } else if (!rawStr) {
    console.error("InputError: Function '" + targetName + "' expects " + paramCount + " parameter(s) but input was empty");
    process.exit(1);
  } else {
    const lines = rawStr.split("\\n").map(l => l.trim()).filter(Boolean);
    if (paramCount === 1) {
      if (lines.length === 1) {
        parsedArgs = [parseToken(lines[0])];
      } else if (lines.length > 1) {
        try { parsedArgs = [JSON.parse(rawStr)]; } catch(e) { parsedArgs = [parseToken(lines[0])]; }
      } else {
        parsedArgs = rawStr ? [parseToken(rawStr)] : [];
      }
    } else if (paramCount > 1 && lines.length >= paramCount) {
      parsedArgs = lines.slice(0, paramCount).map(parseToken);
    } else if (paramCount > 1 && lines.length === 1) {
      try {
        const parsed = JSON.parse(rawStr);
        if (Array.isArray(parsed) && parsed.length === paramCount) parsedArgs = parsed;
        else {
          const tokens = rawStr.split(/\\s+/);
          parsedArgs = tokens.length === paramCount ? tokens.map(parseToken) : [parseToken(rawStr)];
        }
      } catch(e) {
        const tokens = rawStr.split(/\\s+/);
        parsedArgs = tokens.length === paramCount ? tokens.map(parseToken) : [parseToken(rawStr)];
      }
    } else {
      parsedArgs = lines.map(parseToken);
    }
  }

  try {
    const res = targetFn(...parsedArgs);
    if (res !== undefined) {
      if (res === null) {
        console.log("null");
      } else if (typeof res === "object") {
        console.log(JSON.stringify(res));
      } else {
        console.log(String(res));
      }
    }
  } catch(e) {
    console.error("Runtime Exception: " + (e && e.stack ? e.stack : e));
    process.exit(1);
  }
})();
`;
  return `${code}\n\n${jsHarness}`;
}

const TRUSTED_LOCAL_ENVS = new Set(["development", "test"]);
const PUBLIC_OR_STAGING_ENVS = new Set(["production", "staging", "prod", "stage"]);

function getExecutionEnvironmentName() {
  return (process.env.NODE_ENV || "").trim().toLowerCase();
}

/**
 * Returns true if the environment is public, staging, production, or untrusted/unknown.
 * Missing or unrecognized NODE_ENV strictly fails closed into untrusted mode.
 */
function isPublicUntrustedEnvironment() {
  const env = getExecutionEnvironmentName();
  if (PUBLIC_OR_STAGING_ENVS.has(env)) {
    return true;
  }
  if (process.env.JUDGE0_REQUIRED === "true" || process.env.STAGING === "true") {
    return true;
  }
  // Any environment other than explicitly trusted local development or test
  // is treated as untrusted and must fail closed.
  // ALLOW_LOCAL_CODE_EXECUTION must NEVER override staging, production, preview, or unknown environments.
  return !TRUSTED_LOCAL_ENVS.has(env);
}

/**
 * Returns true ONLY if local process execution is explicitly permitted
 * for trusted local development or automated testing.
 * Unknown or preview environments must ALWAYS fail closed.
 * Missing NODE_ENV NEVER automatically enables local execution.
 * ALLOW_LOCAL_CODE_EXECUTION=true must NOT override staging, production, preview, or unknown environments.
 */
function isLocalExecutionPermitted() {
  const env = getExecutionEnvironmentName();
  // Only explicitly trusted local environments (development, test) are eligible for local process execution
  if (!TRUSTED_LOCAL_ENVS.has(env)) {
    return false;
  }
  // Even in trusted environments, respect explicit disable or Judge0 requirement
  if (process.env.ALLOW_LOCAL_CODE_EXECUTION === "false" || process.env.JUDGE0_REQUIRED === "true") {
    return false;
  }
  return true;
}

function isProductionExecutionRestricted() {
  return isPublicUntrustedEnvironment() && !process.env.JUDGE0_API_HOST;
}

async function executeViaJudge0(lang, code, stdin = "", timeoutMs = 5000, options = {}) {
  if (!process.env.JUDGE0_API_HOST) return null;
  const langId = judge0LangMap[lang];
  if (!langId) {
    throw new Error(`Language '${lang}' is not supported by Judge0`);
  }

  let normalizedCode = code;
  if (lang === "python" || lang === "py") {
    normalizedCode = generatePythonExecutable(normalizedCode, options);
  } else if (lang === "java") {
    const javaExec = generateJavaExecutable(normalizedCode, options);
    normalizedCode = javaExec.code;
    if (javaExec.hasMain) {
      if (/public\s+class\s+[A-Za-z0-9_]+/i.test(normalizedCode)) {
        normalizedCode = normalizedCode.replace(/public\s+class\s+[A-Za-z0-9_]+/g, "public class Main");
      } else if (/\bclass\s+([A-Za-z0-9_]+)/i.test(normalizedCode)) {
        normalizedCode = normalizedCode.replace(/\bclass\s+[A-Za-z0-9_]+/i, "public class Main");
      }
    }
  } else if (lang === "cpp" || lang === "c++") {
    normalizedCode = generateCppExecutable(normalizedCode, options);
  } else if (lang === "javascript" || lang === "js" || lang === "node") {
    normalizedCode = generateJsExecutable(normalizedCode, options);
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

function deepEqualStructural(a, b) {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= 1e-6;
  }
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqualStructural(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqualStructural(a[k], b[k])) return false;
  }
  return true;
}

function validateTestCaseOutput(actual, expected) {
  if (actual === undefined || actual === null || expected === undefined || expected === null) return false;

  // 1. Strict equality check
  if (actual === expected) return true;

  // 2. Normalize whitespace (CRLF -> LF, trim start/end of string)
  const cleanAct = String(actual).replace(/\r\n/g, "\n").trim();
  const cleanExp = String(expected).replace(/\r\n/g, "\n").trim();

  if (cleanAct === cleanExp) return true;
  if (cleanAct === "" || cleanExp === "") return false;

  // 3. Strip runner output prefix (e.g. "Output: " or "Result: ")
  const stripPrefix = (s) => s.replace(/^(output|result)\s*[:=]\s*/i, "").trim();
  const strippedAct = stripPrefix(cleanAct);
  if (strippedAct === cleanExp) return true;

  // 4. Strict boolean comparison (ONLY when expected output is explicitly boolean)
  const isBoolExp = /^(true|false)$/i.test(cleanExp);
  if (isBoolExp) {
    const bExp = cleanExp.toLowerCase() === "true";
    const bAct = strippedAct.toLowerCase() === "true" || strippedAct === "1";
    const bActFalse = strippedAct.toLowerCase() === "false" || strippedAct === "0";
    if (bExp && bAct) return true;
    if (!bExp && bActFalse) return true;
    return false;
  }

  // 5. Explicit numeric tolerance comparison
  // Both must be valid numeric representations, not arbitrary strings
  const isNumericStr = (s) => /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(s.trim());
  if (isNumericStr(cleanExp) && isNumericStr(strippedAct)) {
    const numAct = Number(strippedAct);
    const numExp = Number(cleanExp);
    if (!isNaN(numAct) && !isNaN(numExp)) {
      if (Math.abs(numAct - numExp) <= 1e-6) return true;
    }
  }

  // 6. JSON / Structured structural equality (Strict type & case sensitive!)
  try {
    const parsedAct = JSON.parse(strippedAct);
    const parsedExp = JSON.parse(cleanExp);
    if (deepEqualStructural(parsedAct, parsedExp)) return true;
  } catch {}

  // 7. Quoted string comparison (Strict case-sensitive!)
  const unquote = (s) => s.replace(/^["'\x27]|["'\x27]$/g, "").trim();
  if (unquote(strippedAct) === unquote(cleanExp)) return true;

  // 8. Array / List / Token comparison (Strict case-sensitive token matching with whitespace normalization)
  const tokenizeList = (s) => {
    const clean = s.replace(/^\[|\]$/g, "").replace(/,/g, " ").trim();
    return clean.length === 0 ? [] : clean.split(/\s+/);
  };
  const tokensAct = tokenizeList(strippedAct);
  const tokensExp = tokenizeList(cleanExp);
  if (tokensAct.length > 0 && tokensAct.length === tokensExp.length) {
    const allMatch = tokensAct.every((tok, idx) => {
      const expTok = tokensExp[idx];
      if (tok === expTok) return true;
      if (unquote(tok) === unquote(expTok)) return true;
      if (isNumericStr(tok) && isNumericStr(expTok)) {
        const nAct = Number(tok);
        const nExp = Number(expTok);
        if (!isNaN(nAct) && !isNaN(nExp) && Math.abs(nAct - nExp) <= 1e-6) return true;
      }
      return false;
    });
    if (allMatch) return true;
  }

  // 9. Multiline normalization (trimming end of lines, but strictly case-sensitive!)
  const linesAct = cleanAct.split("\n").map((l) => l.trimEnd()).filter((l) => l.length > 0);
  const linesExp = cleanExp.split("\n").map((l) => l.trimEnd()).filter((l) => l.length > 0);
  if (linesAct.length > 1 && linesAct.length === linesExp.length) {
    if (linesAct.join("\n") === linesExp.join("\n")) return true;
  }

  return false;
}

// Universal Python function test harness (kept for backwards compatibility)
const PYTHON_FUNCTION_HARNESS = `
# --- MASTERY ZONE RUNNER HARNESS ---
import sys, json, inspect

def _mz_auto_runner():
    candidates = []
    target_name = globals().get("_MZ_TARGET_FUNCTION_NAME", "")
    if not target_name:
        sys.stderr.write("Configuration Error: Function-based execution requires an explicit function name\\n")
        sys.exit(1)

    if "Solution" in globals() and inspect.isclass(globals()["Solution"]):
        try:
            sol_inst = globals()["Solution"]()
            if hasattr(sol_inst, target_name) and callable(getattr(sol_inst, target_name)):
                candidates.append(getattr(sol_inst, target_name))
            else:
                sys.stderr.write(f"AttributeError: Solution does not define required method '{target_name}'\\n")
                sys.exit(1)
        except Exception as e:
            sys.stderr.write(f"Initialization Error: {e}\\n")
            sys.exit(1)

    if not candidates:
        if target_name in globals() and callable(globals()[target_name]):
            candidates.append(globals()[target_name])
        else:
            sys.stderr.write(f"NameError: Expected function '{target_name}' is not defined\\n")
            sys.exit(1)

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
async function executeCode(paramsOrLang, maybeCode, maybeStdin = "", maybeTimeoutMs = 5000, maybeFiles = [], maybeOptions = {}) {
  let language, code, stdin, timeoutMs, files, options;
  if (typeof paramsOrLang === "object" && paramsOrLang !== null && !Array.isArray(paramsOrLang)) {
    language = paramsOrLang.language;
    code = paramsOrLang.code;
    stdin = paramsOrLang.stdin || "";
    timeoutMs = paramsOrLang.timeoutMs || 5000;
    files = paramsOrLang.files || [];
    options = paramsOrLang.options || {};
  } else {
    language = paramsOrLang;
    code = maybeCode;
    stdin = maybeStdin;
    timeoutMs = maybeTimeoutMs;
    files = maybeFiles;
    options = maybeOptions;
  }
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
      const j0 = await executeViaJudge0(lang, code, stdin, timeoutMs, options);
      if (j0) {
        return {
          ...j0,
          duration: j0.duration || Date.now() - startTime,
        };
      }
    } catch (j0Err) {
      if (isPublicUntrustedEnvironment() || !isLocalExecutionPermitted()) {
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
  if (isPublicUntrustedEnvironment() || !isLocalExecutionPermitted()) {
    return {
      output: "",
      error: "Production execution requires a configured isolated execution environment (Judge0). Local fallback is disabled.",
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
      const executableCode = generateJsExecutable(code, options);
      fs.writeFileSync(scriptPath, executableCode, "utf8");
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
      const executableCode = generatePythonExecutable(code, options);
      fs.writeFileSync(scriptPath, executableCode, "utf8");
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
      const executableCode = generateCppExecutable(code, options);
      fs.writeFileSync(srcPath, executableCode, "utf8");

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
      const javaExec = generateJavaExecutable(code, options);
      let className = "Main";
      let codeToWrite = javaExec.code;

      if (javaExec.hasMain) {
        const publicClassMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
        if (publicClassMatch && publicClassMatch[1]) {
          className = publicClassMatch[1];
        } else {
          const anyClassMatch = code.match(/\bclass\s+([A-Za-z0-9_]+)/);
          if (anyClassMatch && anyClassMatch[1]) {
            className = anyClassMatch[1];
          }
        }
        codeToWrite = code;
      }

      const srcPath = path.join(tmpDir, `${className}.java`);
      fs.writeFileSync(srcPath, codeToWrite, "utf8");

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
async function evaluateTestCasesBatch(language, code, testCases, options = {}) {
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

  const lang = (language || "").toLowerCase().trim();

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
    const hash = crypto.createHash("sha256").update(`${lang}:::${safeCode}:::${JSON.stringify(testCases)}:::${JSON.stringify(options)}`).digest("hex");
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
        testCases.map((tc) => executeViaJudge0(lang, safeCode, tc.input || "", 4000, options))
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
      if (isPublicUntrustedEnvironment() || !isLocalExecutionPermitted()) {
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

  if (isPublicUntrustedEnvironment() || !isLocalExecutionPermitted()) {
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

  try {
    let runner = null;

    if (lang === "python" || lang === "py") {
      const p = path.join(tmpDir, "solution.py");
      const executableCode = generatePythonExecutable(safeCode, options);
      fs.writeFileSync(p, executableCode, "utf8");

      runner = (input) => runSandboxedProcess(PYTHON_BIN, ["-u", "-I", p], input, timeoutMs, tmpDir);
    } else if (lang === "javascript" || lang === "js" || lang === "node") {
      const p = path.join(tmpDir, "solution.js");
      const executableCode = generateJsExecutable(safeCode, options);
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
      const cppFullCode = generateCppExecutable(safeCode, options);

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
      const javaExec = generateJavaExecutable(safeCode, options);
      let className = "Main";

      if (javaExec.hasMain) {
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
        const p = path.join(tmpDir, "Main.java");
        fs.writeFileSync(p, javaExec.code, "utf8");
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

    const results = [];
    for (const tc of testCases) {
      const tcStartTime = Date.now();
      const input = tc.input !== undefined ? tc.input : "";
      const expectedOutput = tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.expected || "");
      const res = await runner(input);
      const cleanActual = (res.output || "").trim().replace(/\r\n/g, "\n");
      const cleanExpected = (expectedOutput || "").trim().replace(/\r\n/g, "\n");
      const effectiveError = res.error || (res.exitCode !== 0 ? (cleanActual || "Runtime error") : "");
      const passed = res.exitCode === 0 && validateTestCaseOutput(cleanActual, cleanExpected);

      results.push({
        passed,
        actual: cleanActual,
        expected: cleanExpected,
        error: effectiveError,
        duration: res.duration || (Date.now() - tcStartTime),
      });
    }

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
async function evaluateSingleTestCase(language, code, input, expectedOutput, options = {}) {
  const batch = await evaluateTestCasesBatch(language, code, [{ input, expectedOutput }], options);
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
  isPublicUntrustedEnvironment,
  isLocalExecutionPermitted,
  isProductionExecutionRestricted,
  isCodeEmptyOrComments,
  validateTestCaseOutput,
  deepEqualStructural,
  generatePythonExecutable,
  generateJsExecutable,
  generateJavaExecutable,
  generateCppExecutable,
  parseCppSolution,
  executeCode,
  evaluateTestCasesBatch,
  evaluateSingleTestCase,
  checkExecutableAvailable,
  getExecutionEnvironment,
  resolveExecutable,
};
