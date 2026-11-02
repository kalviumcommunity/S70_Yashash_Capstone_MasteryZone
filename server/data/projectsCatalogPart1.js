/**
 * MASTERY ZONE — REAL-WORLD PORTFOLIO PROJECTS CATALOG (PART 1: PROJECTS 1 - 7)
 * Includes the 4 core projects + first 3 new industry-grade projects.
 * Every project has multi-file starter code, multi-file reference implementation,
 * unique functional & technical requirements, 6-8 structured tasks, 100-mark rubric,
 * and 6 deterministic automated test cases (4 visible + 2 hidden edge cases).
 */

const PROJECTS_PART_1 = [
  // =========================================================================
  // 1. EXISTING PROJECT 1: Modern Developer Portfolio
  // =========================================================================
  {
    id: "proj_portfolio",
    title: "Modern Developer Portfolio",
    category: "Full-Stack & Web",
    track: "Web Development",
    level: "Beginner",
    difficulty: "Beginner",
    starterLanguage: "javascript",
    technologies: ["HTML5", "CSS3 Grid", "JavaScript ES6", "DOM Validation"],
    estimatedTime: "3 Hours",
    xpReward: 250,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build a fast, responsive developer portfolio engine featuring dynamic project filtering, an interactive terminal resume parser, and strict contact form validation.",
    problemStatement:
      "Engineering candidates need an interactive, verifiable portfolio system that dynamically filters showcase projects by technology tag, executes interactive terminal resume commands (`help`, `skills`, `projects`, `contact`), and validates visitor contact inquiries with strict sanitization and error reporting.",
    realWorldScenario:
      "You are building the core logic and data engine for a production developer portfolio hosted on Mastery Zone. Visitors and technical recruiters interact with your project filter, CLI resume widget, and contact endpoint via structured JSON commands.",
    objectives: [
      "Design a normalized portfolio project store with tag-based and difficulty-based filtering.",
      "Implement an interactive CLI command processor supporting resume inspection commands.",
      "Build a contact form validator enforcing email format, message length, and XSS sanitization.",
      "Expose a unified CLI/JSON runner in main.js that processes portfolio actions deterministically.",
    ],
    ioSpecification: {
      inputFormat: "JSON object on stdin: { action: 'filter' | 'terminal' | 'contact' | 'summary', payload: {...} }",
      outputFormat: "JSON response on stdout with status, data, or validation error details.",
    },
    deliverables: [
      "Multi-file portfolio engine (main.js, portfolioStore.js, validator.js)",
      "Interactive terminal command router supporting help, skills, and experience queries",
      "Strict contact form validation module with descriptive error codes",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_port_1", title: "Project Filtering by Technology Tag", description: "Filter portfolio projects case-insensitively by technology tag and sort by featured priority.", mandatory: true, validationPatterns: ["filterProjectsByTag", "toLowerCase", "filter"] },
      { id: "fr_port_2", title: "Interactive Terminal Resume Command Parser", description: "Resolve terminal commands (skills, projects, bio) into structured output.", mandatory: true, validationPatterns: ["executeTerminalCommand", "skills", "bio"] },
      { id: "fr_port_3", title: "Contact Form Email & Message Validation", description: "Validate visitor name, RFC email pattern, and minimum 10-character message body.", mandatory: true, validationPatterns: ["validateContactSubmission", "@", "errors"] },
      { id: "fr_port_4", title: "HTML/Script Tag Sanitization", description: "Strip dangerous <script> or HTML tags from visitor contact messages.", mandatory: true, validationPatterns: ["sanitizeInput", "replace"] },
      { id: "fr_port_5", title: "Portfolio Analytics Summary", description: "Compute total projects, unique tech stacks, and featured count.", mandatory: true, validationPatterns: ["getPortfolioSummary", "totalProjects"] },
    ],
    technicalRequirements: [
      { id: "tr_port_1", title: "Modular Multi-File Architecture", constraint: "Separate data/terminal logic (portfolioStore.js), validation (validator.js), and CLI entry point (main.js).", mandatory: true, validationPatterns: ["require", "module.exports"] },
      { id: "tr_port_2", title: "Pure Deterministic State Functions", constraint: "Avoid mutating global arrays during tag filtering.", mandatory: true, validationPatterns: ["filter", "map"] },
      { id: "tr_port_3", title: "Structured JSON Output Protocol", constraint: "Emit valid JSON on stdout for all supported actions.", mandatory: true, validationPatterns: ["JSON.stringify", "JSON.parse"] },
      { id: "tr_port_4", title: "Graceful Invalid Command & Payload Handling", constraint: "Return { ok: false, error } without crashing on malformed input.", mandatory: true, validationPatterns: ["try", "catch", "ok: false"] },
    ],
    milestones: [
      {
        id: "task_port_1",
        stepNumber: 1,
        title: "Design Portfolio Data Model & Tag Filter",
        question: "Implement `filterProjectsByTag(tag)` in `portfolioStore.js` to return matching projects sorted by `featured` status.",
        expectedFunctionality: "Returns all projects when tag is 'all' or empty, or only projects whose tech array contains the tag (case-insensitive).",
        technicalConstraints: "Must be exported from `portfolioStore.js` and preserve immutability.",
        acceptanceCriteria: "Filtering by 'React' returns 2 matching projects (`MZ-ASM Cloud IDE`, `E-Commerce Analytics`).",
        marksAllocated: 15,
        targetFile: "portfolioStore.js",
        validationPatterns: ["filterProjectsByTag", "toLowerCase", "featured"],
      },
      {
        id: "task_port_2",
        stepNumber: 2,
        title: "Implement Interactive Terminal Resume Widget",
        question: "Implement `executeTerminalOrder(cmd)` in `portfolioStore.js` to handle `skills`, `bio`, `count`, and unknown commands.",
        expectedFunctionality: "Returns structured response for valid resume commands and an error status for unrecognized commands.",
        technicalConstraints: "Normalize command strings with `.trim().toLowerCase()`.",
        acceptanceCriteria: "Command `skills` returns the developer's categorized skill list.",
        marksAllocated: 15,
        targetFile: "portfolioStore.js",
        validationPatterns: ["executeTerminalCommand", "skills", "UNKNOWN_COMMAND"],
      },
      {
        id: "task_port_3",
        stepNumber: 3,
        title: "Build Contact Form Validator & XSS Sanitizer",
        question: "Implement `sanitizeInput(str)` and `validateContactSubmission(payload)` in `validator.js`.",
        expectedFunctionality: "Strips HTML angle brackets, validates non-empty name, valid email, and message >= 10 chars.",
        technicalConstraints: "Return `{ ok: boolean, errors: string[], sanitized?: object }`.",
        acceptanceCriteria: "Rejects invalid email or short message with descriptive errors; sanitizes `<script>` tags.",
        marksAllocated: 20,
        targetFile: "validator.js",
        validationPatterns: ["sanitizeInput", "validateContactSubmission", "errors"],
      },
      {
        id: "task_port_4",
        stepNumber: 4,
        title: "Implement Portfolio Metrics Aggregator",
        question: "Implement `getPortfolioSummary()` in `portfolioStore.js` returning total project count, featured count, and sorted unique technologies.",
        expectedFunctionality: "Calculates accurate counts across the portfolio catalog.",
        technicalConstraints: "Deduplicate technologies using `Set`.",
        acceptanceCriteria: "Summary action outputs `{ ok: true, totalProjects: 3, featuredCount: 2 }`.",
        marksAllocated: 15,
        targetFile: "portfolioStore.js",
        validationPatterns: ["getPortfolioSummary", "Set", "featuredCount"],
      },
      {
        id: "task_port_5",
        stepNumber: 5,
        title: "Wire Action Router & Error Boundaries in main.js",
        question: "Connect `portfolioStore.js` and `validator.js` inside `main.js` to process JSON commands from stdin.",
        expectedFunctionality: "Routes `filter`, `terminal`, `contact`, and `summary` actions and catches malformed JSON.",
        technicalConstraints: "Must never crash on empty or invalid JSON input.",
        acceptanceCriteria: "All 6 automated functional and edge test cases pass.",
        marksAllocated: 35,
        targetFile: "main.js",
        validationPatterns: ["filterProjectsByTag", "validateContactSubmission", "JSON.stringify"],
      },
    ],
    files: [
      {
        name: "main.js",
        language: "javascript",
        content: `const fs = require("fs");
const { filterProjectsByTag, executeTerminalCommand, getPortfolioSummary } = require("./portfolioStore");
const { validateContactSubmission } = require("./validator");

// TODO: Read JSON payload from stdin and route actions: 'filter', 'terminal', 'contact', 'summary'
const raw = fs.readFileSync(0, "utf8").trim();
console.log(JSON.stringify({ ok: false, error: "Portfolio router not implemented yet" }));
`,
      },
      {
        name: "portfolioStore.js",
        language: "javascript",
        content: `const PROJECTS = [
  { id: "p1", title: "MZ-ASM Cloud IDE", tech: ["React", "Node.js", "Monaco"], featured: true },
  { id: "p2", title: "Distributed Task Queue", tech: ["Python", "Redis", "Docker"], featured: true },
  { id: "p3", title: "E-Commerce Analytics", tech: ["React", "PostgreSQL", "Express"], featured: false }
];

function filterProjectsByTag(tag) {
  // TODO: Filter PROJECTS case-insensitively by tag
  return [];
}

function executeTerminalCommand(cmd) {
  // TODO: Support 'skills', 'bio', and 'count' commands
  return { ok: false, error: "Not implemented" };
}

function getPortfolioSummary() {
  // TODO: Return { ok: true, totalProjects, featuredCount, uniqueTechCount }
  return { ok: false };
}

module.exports = { PROJECTS, filterProjectsByTag, executeTerminalCommand, getPortfolioSummary };
`,
      },
      {
        name: "validator.js",
        language: "javascript",
        content: `function sanitizeInput(text) {
  // TODO: Strip HTML tags from text
  return String(text || "").trim();
}

function validateContactSubmission(payload) {
  // TODO: Validate name, email, and message (>= 10 chars after sanitization)
  return { ok: false, errors: ["Validation not implemented"] };
}

module.exports = { sanitizeInput, validateContactSubmission };
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.js",
        language: "javascript",
        content: `const fs = require("fs");
const { filterProjectsByTag, executeTerminalCommand, getPortfolioSummary } = require("./portfolioStore");
const { validateContactSubmission } = require("./validator");

function run() {
  try {
    const raw = fs.readFileSync(0, "utf8").trim();
    if (!raw) {
      console.log(JSON.stringify({ ok: false, error: "EMPTY_INPUT" }));
      return;
    }
    const req = JSON.parse(raw);
    const action = String(req.action || "").toLowerCase();
    const payload = req.payload || {};

    if (action === "filter") {
      const items = filterProjectsByTag(payload.tag);
      console.log(JSON.stringify({ ok: true, count: items.length, titles: items.map((p) => p.title) }));
    } else if (action === "terminal") {
      console.log(JSON.stringify(executeTerminalCommand(payload.command)));
    } else if (action === "contact") {
      console.log(JSON.stringify(validateContactSubmission(payload)));
    } else if (action === "summary") {
      console.log(JSON.stringify(getPortfolioSummary()));
    } else {
      console.log(JSON.stringify({ ok: false, error: "UNSUPPORTED_ACTION" }));
    }
  } catch (err) {
    console.log(JSON.stringify({ ok: false, error: "INVALID_JSON" }));
  }
}

run();
`,
      },
      {
        name: "portfolioStore.js",
        language: "javascript",
        content: `const PROJECTS = [
  { id: "p1", title: "MZ-ASM Cloud IDE", tech: ["React", "Node.js", "Monaco"], featured: true },
  { id: "p2", title: "Distributed Task Queue", tech: ["Python", "Redis", "Docker"], featured: true },
  { id: "p3", title: "E-Commerce Analytics", tech: ["React", "PostgreSQL", "Express"], featured: false }
];

function filterProjectsByTag(tag) {
  const clean = String(tag || "").trim().toLowerCase();
  const list = !clean || clean === "all"
    ? [...PROJECTS]
    : PROJECTS.filter((p) => p.tech.some((t) => t.toLowerCase() === clean));
  return list.sort((a, b) => Number(b.featured) - Number(a.featured));
}

function executeTerminalCommand(cmd) {
  const clean = String(cmd || "").trim().toLowerCase();
  if (clean === "skills") {
    return { ok: true, command: "skills", output: ["JavaScript", "Python", "React", "Node.js", "SQL"] };
  }
  if (clean === "bio") {
    return { ok: true, command: "bio", output: "Full-Stack Systems Engineer specializing in cloud IDEs and distributed architectures." };
  }
  if (clean === "count") {
    return { ok: true, command: "count", output: PROJECTS.length };
  }
  return { ok: false, error: "UNKNOWN_COMMAND" };
}

function getPortfolioSummary() {
  const techSet = new Set();
  PROJECTS.forEach((p) => p.tech.forEach((t) => techSet.add(t)));
  return {
    ok: true,
    totalProjects: PROJECTS.length,
    featuredCount: PROJECTS.filter((p) => p.featured).length,
    uniqueTechCount: techSet.size
  };
}

module.exports = { PROJECTS, filterProjectsByTag, executeTerminalCommand, getPortfolioSummary };
`,
      },
      {
        name: "validator.js",
        language: "javascript",
        content: `function sanitizeInput(text) {
  return String(text || "")
    .replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function validateContactSubmission(payload = {}) {
  const errors = [];
  const name = sanitizeInput(payload.name);
  const email = sanitizeInput(payload.email);
  const message = sanitizeInput(payload.message);

  if (!name || name.length < 2) errors.push("INVALID_NAME");
  if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) errors.push("INVALID_EMAIL");
  if (!message || message.length < 10) errors.push("MESSAGE_TOO_SHORT");

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    sanitized: { name, email, message }
  };
}

module.exports = { sanitizeInput, validateContactSubmission };
`,
      },
    ],
    testCases: [
      {
        name: "Filter projects by React tag",
        input: '{"action":"filter","payload":{"tag":"react"}}',
        expectedOutput: '{"ok":true,"count":2,"titles":["MZ-ASM Cloud IDE","E-Commerce Analytics"]}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Execute terminal skills command",
        input: '{"action":"terminal","payload":{"command":"skills"}}',
        expectedOutput: '{"ok":true,"command":"skills","output":["JavaScript","Python","React","Node.js","SQL"]}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Validate and sanitize valid contact inquiry",
        input: '{"action":"contact","payload":{"name":"Ada Lovelace","email":"ada@analytical.org","message":"<b>Hello!</b> I would love to discuss your cloud IDE project."}}',
        expectedOutput: '{"ok":true,"sanitized":{"name":"Ada Lovelace","email":"ada@analytical.org","message":"Hello! I would love to discuss your cloud IDE project."}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Compute portfolio analytics summary",
        input: '{"action":"summary","payload":{}}',
        expectedOutput: '{"ok":true,"totalProjects":3,"featuredCount":2,"uniqueTechCount":8}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject invalid contact email and short message (Edge Case)",
        input: '{"action":"contact","payload":{"name":"A","email":"not-an-email","message":"short"}}',
        expectedOutput: '{"ok":false,"errors":["INVALID_NAME","INVALID_EMAIL","MESSAGE_TOO_SHORT"]}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Handle unknown terminal command gracefully (Edge Case)",
        input: '{"action":"terminal","payload":{"command":"reboot_server"}}',
        expectedOutput: '{"ok":false,"error":"UNKNOWN_COMMAND"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 2. EXISTING PROJECT 2: RESTful Task Management API
  // =========================================================================
  {
    id: "proj_task_api",
    title: "RESTful Task Management API",
    category: "Backend & APIs",
    track: "Python / Node",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "javascript",
    technologies: ["Node.js", "Express Architecture", "JWT Auth", "RBAC", "Schema Validation"],
    estimatedTime: "5 Hours",
    xpReward: 400,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Design a production-grade RESTful Task Management API engine with schema validation, CRUD controllers, token authentication, role-based access control (RBAC), and structured exception handling.",
    problemStatement:
      "Enterprise engineering teams require a secure task management backend where authenticated users can create, query, and update tasks, while destructive operations (such as deleting tasks or purging records) are strictly restricted to `admin` roles with full schema validation and audit status codes.",
    realWorldScenario:
      "You are architecting the core request dispatcher, model schema validator, and RBAC security middleware for a multi-tenant Task Management API.",
    objectives: [
      "Design task database models with strict priority (`low`, `medium`, `high`) and status (`todo`, `in_progress`, `done`) constraints.",
      "Implement CRUD operations (create, list/filter, update status, delete).",
      "Implement token authentication and role-based access control (`admin` vs `member`).",
      "Enforce request payload validation and standardized HTTP-style status codes (`200`, `201`, `400`, `401`, `403`, `404`).",
    ],
    ioSpecification: {
      inputFormat: "JSON request envelope: { method, path, headers: { authorization, role }, body, query }",
      outputFormat: "JSON response envelope: { status: number, ok: boolean, data?: any, error?: string }",
    },
    deliverables: [
      "Task model & validation schema (taskModel.js)",
      "Authentication & RBAC middleware guard (authMiddleware.js)",
      "REST controller & request dispatcher (server.js)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_task_1", title: "Database Model & Schema Validation", description: "Validate task title (>=3 chars), priority ('low'|'medium'|'high'), and status ('todo'|'in_progress'|'done').", mandatory: true, validationPatterns: ["validateTaskPayload", "VALID_PRIORITIES", "VALID_STATUSES"] },
      { id: "fr_task_2", title: "CRUD Route Operations", description: "Support GET /api/tasks, POST /api/tasks, PATCH /api/tasks/:id, and DELETE /api/tasks/:id.", mandatory: true, validationPatterns: ["POST", "PATCH", "DELETE", "/api/tasks"] },
      { id: "fr_task_3", title: "Token Authentication Guard", description: "Verify Bearer token presence and validity before allowing protected route execution.", mandatory: true, validationPatterns: ["authenticateRequest", "Bearer", "401"] },
      { id: "fr_task_4", title: "Role-Based Access Control (RBAC)", description: "Restrict DELETE /api/tasks/:id exclusively to users with the 'admin' role (403 Forbidden for members).", mandatory: true, validationPatterns: ["authorizeRole", "admin", "403"] },
      { id: "fr_task_5", title: "Centralized Error & 404 Exception Handling", description: "Return 404 when updating/deleting non-existent task IDs and 400 on validation failures.", mandatory: true, validationPatterns: ["404", "400", "TASK_NOT_FOUND"] },
    ],
    technicalRequirements: [
      { id: "tr_task_1", title: "Multi-Layer Separation of Concerns", constraint: "Separate model/schema (taskModel.js), auth/RBAC (authMiddleware.js), and routing (server.js).", mandatory: true, validationPatterns: ["require", "module.exports"] },
      { id: "tr_task_2", title: "HTTP Status Code Compliance", constraint: "Return 201 on creation, 200 on read/update/delete, 400 on bad input, 401 on unauthenticated, 403 on unauthorized.", mandatory: true, validationPatterns: ["201", "401", "403"] },
      { id: "tr_task_3", title: "Query Filtering Support", constraint: "Allow GET /api/tasks to filter by status or priority.", mandatory: true, validationPatterns: ["query", "status", "priority"] },
      { id: "tr_task_4", title: "Exception-Safe Request Dispatching", constraint: "Catch malformed JSON payloads and return status 400.", mandatory: true, validationPatterns: ["try", "catch"] },
    ],
    milestones: [
      {
        id: "task_api_1",
        stepNumber: 1,
        title: "Design Task Database Models & Validation Schema",
        question: "Implement `validateTaskPayload(body)` and seed store in `taskModel.js`.",
        expectedFunctionality: "Validates `title` (min 3 chars), `priority` (`low`, `medium`, `high`), and `status` (`todo`, `in_progress`, `done`).",
        technicalConstraints: "Default `status` to `'todo'` and `priority` to `'medium'` when omitted on creation.",
        acceptanceCriteria: "Invalid priority or short title returns `{ valid: false, error }`.",
        marksAllocated: 15,
        targetFile: "taskModel.js",
        validationPatterns: ["validateTaskPayload", "VALID_PRIORITIES", "VALID_STATUSES"],
      },
      {
        id: "task_api_2",
        stepNumber: 2,
        title: "Implement Authentication & RBAC Middleware",
        question: "Implement `authenticateRequest(headers)` and `authorizeRole(user, allowedRoles)` in `authMiddleware.js`.",
        expectedFunctionality: "Verifies `Bearer mz-secret-token` and extracts user role (`admin` or `member`).",
        technicalConstraints: "Return `{ ok: false, status: 401 }` for missing/invalid token and `{ ok: false, status: 403 }` for insufficient role.",
        acceptanceCriteria: "Non-admin user attempting admin route receives 403.",
        marksAllocated: 20,
        targetFile: "authMiddleware.js",
        validationPatterns: ["authenticateRequest", "authorizeRole", "401", "403"],
      },
      {
        id: "task_api_3",
        stepNumber: 3,
        title: "Implement CRUD Operations (GET, POST, PATCH, DELETE)",
        question: "Implement task listing with query filters, task creation, status updates, and task deletion in `taskModel.js` and `server.js`.",
        expectedFunctionality: "Supports full lifecycle CRUD operations on `/api/tasks` and `/api/tasks/:id`.",
        technicalConstraints: "Return 404 `TASK_NOT_FOUND` when `:id` does not exist.",
        acceptanceCriteria: "Creating a task returns 201 with the created task object.",
        marksAllocated: 25,
        targetFile: "server.js",
        validationPatterns: ["createTask", "updateTask", "deleteTask"],
      },
      {
        id: "task_api_4",
        stepNumber: 4,
        title: "Enforce Request Validation & Error Handling",
        question: "Add comprehensive validation and exception handling across all endpoints in `server.js`.",
        expectedFunctionality: "Handles invalid JSON, unknown routes (404), validation errors (400), and RBAC rejections (403).",
        technicalConstraints: "Never throw unhandled exceptions.",
        acceptanceCriteria: "All 6 automated API test cases (including auth and RBAC edge cases) pass.",
        marksAllocated: 40,
        targetFile: "server.js",
        validationPatterns: ["handleRequest", "JSON.stringify", "404"],
      },
    ],
    files: [
      {
        name: "server.js",
        language: "javascript",
        content: `const fs = require("fs");
const { listTasks, createTask, updateTask, deleteTask } = require("./taskModel");
const { authenticateRequest, authorizeRole } = require("./authMiddleware");

// TODO: Dispatch REST request from stdin JSON: { method, path, headers, body, query }
const raw = fs.readFileSync(0, "utf8").trim();
console.log(JSON.stringify({ status: 501, ok: false, error: "Task API dispatcher not implemented" }));
`,
      },
      {
        name: "taskModel.js",
        language: "javascript",
        content: `const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["todo", "in_progress", "done"];

const TASKS = [
  { id: "t_101", title: "Configure PostgreSQL Pool", priority: "high", status: "done", owner: "admin" },
  { id: "t_102", title: "Write JWT Middleware", priority: "high", status: "in_progress", owner: "member" },
  { id: "t_103", title: "Update API Documentation", priority: "low", status: "todo", owner: "member" }
];

function validateTaskPayload(body = {}, isPartial = false) {
  // TODO: Validate title, priority, and status
  return { valid: false, error: "Validation not implemented" };
}

function listTasks(query = {}) {
  return [];
}

function createTask(body, owner) {
  return null;
}

function updateTask(id, updates) {
  return null;
}

function deleteTask(id) {
  return false;
}

module.exports = { VALID_PRIORITIES, VALID_STATUSES, validateTaskPayload, listTasks, createTask, updateTask, deleteTask };
`,
      },
      {
        name: "authMiddleware.js",
        language: "javascript",
        content: `function authenticateRequest(headers = {}) {
  // TODO: Verify Authorization header 'Bearer mz-secret-token'
  return { ok: false, status: 401, error: "UNAUTHORIZED" };
}

function authorizeRole(user, allowedRoles = []) {
  // TODO: Verify user.role is in allowedRoles, else 403 FORBIDDEN
  return { ok: false, status: 403, error: "FORBIDDEN" };
}

module.exports = { authenticateRequest, authorizeRole };
`,
      },
    ],
    solutionFiles: [
      {
        name: "server.js",
        language: "javascript",
        content: `const fs = require("fs");
const { listTasks, createTask, updateTask, deleteTask } = require("./taskModel");
const { authenticateRequest, authorizeRole } = require("./authMiddleware");

function handleRequest(req) {
  const auth = authenticateRequest(req.headers || {});
  if (!auth.ok) {
    return { status: auth.status, ok: false, error: auth.error };
  }

  const method = String(req.method || "GET").toUpperCase();
  const path = String(req.path || "");

  if (method === "GET" && path === "/api/tasks") {
    const items = listTasks(req.query || {});
    return { status: 200, ok: true, count: items.length, data: items };
  }

  if (method === "POST" && path === "/api/tasks") {
    const res = createTask(req.body || {}, auth.user.role);
    if (!res.ok) return { status: 400, ok: false, error: res.error };
    return { status: 201, ok: true, data: res.task };
  }

  const idMatch = path.match(/^\\/api\\/tasks\\/([^/]+)$/);
  if (idMatch) {
    const taskId = idMatch[1];
    if (method === "PATCH") {
      const res = updateTask(taskId, req.body || {});
      if (!res.ok) return { status: res.status || 400, ok: false, error: res.error };
      return { status: 200, ok: true, data: res.task };
    }
    if (method === "DELETE") {
      const rbac = authorizeRole(auth.user, ["admin"]);
      if (!rbac.ok) return { status: rbac.status, ok: false, error: rbac.error };
      const deleted = deleteTask(taskId);
      if (!deleted) return { status: 404, ok: false, error: "TASK_NOT_FOUND" };
      return { status: 200, ok: true, deletedId: taskId };
    }
  }

  return { status: 404, ok: false, error: "ROUTE_NOT_FOUND" };
}

try {
  const raw = fs.readFileSync(0, "utf8").trim();
  const parsed = JSON.parse(raw);
  console.log(JSON.stringify(handleRequest(parsed)));
} catch (err) {
  console.log(JSON.stringify({ status: 400, ok: false, error: "MALFORMED_JSON" }));
}
`,
      },
      {
        name: "taskModel.js",
        language: "javascript",
        content: `const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["todo", "in_progress", "done"];

const TASKS = [
  { id: "t_101", title: "Configure PostgreSQL Pool", priority: "high", status: "done", owner: "admin" },
  { id: "t_102", title: "Write JWT Middleware", priority: "high", status: "in_progress", owner: "member" },
  { id: "t_103", title: "Update API Documentation", priority: "low", status: "todo", owner: "member" }
];

function validateTaskPayload(body = {}, isPartial = false) {
  if (!isPartial || body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (title.length < 3) return { valid: false, error: "INVALID_TITLE" };
  }
  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
    return { valid: false, error: "INVALID_PRIORITY" };
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return { valid: false, error: "INVALID_STATUS" };
  }
  return { valid: true };
}

function listTasks(query = {}) {
  return TASKS.filter((t) => {
    if (query.status && t.status !== query.status) return false;
    if (query.priority && t.priority !== query.priority) return false;
    return true;
  });
}

function createTask(body = {}, owner = "member") {
  const check = validateTaskPayload(body, false);
  if (!check.valid) return { ok: false, error: check.error };
  const newTask = {
    id: "t_104",
    title: String(body.title).trim(),
    priority: body.priority || "medium",
    status: body.status || "todo",
    owner
  };
  TASKS.push(newTask);
  return { ok: true, task: newTask };
}

function updateTask(id, updates = {}) {
  const task = TASKS.find((t) => t.id === id);
  if (!task) return { ok: false, status: 404, error: "TASK_NOT_FOUND" };
  const check = validateTaskPayload(updates, true);
  if (!check.valid) return { ok: false, status: 400, error: check.error };
  if (updates.title !== undefined) task.title = String(updates.title).trim();
  if (updates.priority !== undefined) task.priority = updates.priority;
  if (updates.status !== undefined) task.status = updates.status;
  return { ok: true, task };
}

function deleteTask(id) {
  const idx = TASKS.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  TASKS.splice(idx, 1);
  return true;
}

module.exports = { VALID_PRIORITIES, VALID_STATUSES, validateTaskPayload, listTasks, createTask, updateTask, deleteTask };
`,
      },
      {
        name: "authMiddleware.js",
        language: "javascript",
        content: `function authenticateRequest(headers = {}) {
  const authHeader = headers.authorization || headers.Authorization || "";
  if (authHeader !== "Bearer mz-secret-token") {
    return { ok: false, status: 401, error: "UNAUTHORIZED" };
  }
  const role = headers.role || "member";
  return { ok: true, user: { role } };
}

function authorizeRole(user, allowedRoles = []) {
  if (!user || !allowedRoles.includes(user.role)) {
    return { ok: false, status: 403, error: "FORBIDDEN_INSUFFICIENT_ROLE" };
  }
  return { ok: true };
}

module.exports = { authenticateRequest, authorizeRole };
`,
      },
    ],
    testCases: [
      {
        name: "Filter high-priority tasks via GET /api/tasks",
        input: '{"method":"GET","path":"/api/tasks","headers":{"authorization":"Bearer mz-secret-token","role":"member"},"query":{"priority":"high"}}',
        expectedOutput: '{"status":200,"ok":true,"count":2,"data":[{"id":"t_101","title":"Configure PostgreSQL Pool","priority":"high","status":"done","owner":"admin"},{"id":"t_102","title":"Write JWT Middleware","priority":"high","status":"in_progress","owner":"member"}]}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Create new validated task via POST /api/tasks",
        input: '{"method":"POST","path":"/api/tasks","headers":{"authorization":"Bearer mz-secret-token","role":"member"},"body":{"title":"Deploy Redis Cache","priority":"high"}}',
        expectedOutput: '{"status":201,"ok":true,"data":{"id":"t_104","title":"Deploy Redis Cache","priority":"high","status":"todo","owner":"member"}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Update task status via PATCH /api/tasks/t_102",
        input: '{"method":"PATCH","path":"/api/tasks/t_102","headers":{"authorization":"Bearer mz-secret-token","role":"member"},"body":{"status":"done"}}',
        expectedOutput: '{"status":200,"ok":true,"data":{"id":"t_102","title":"Write JWT Middleware","priority":"high","status":"done","owner":"member"}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Allow admin role to DELETE /api/tasks/t_103",
        input: '{"method":"DELETE","path":"/api/tasks/t_103","headers":{"authorization":"Bearer mz-secret-token","role":"admin"}}',
        expectedOutput: '{"status":200,"ok":true,"deletedId":"t_103"}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Enforce RBAC 403 Forbidden when member attempts DELETE (Edge Case)",
        input: '{"method":"DELETE","path":"/api/tasks/t_101","headers":{"authorization":"Bearer mz-secret-token","role":"member"}}',
        expectedOutput: '{"status":403,"ok":false,"error":"FORBIDDEN_INSUFFICIENT_ROLE"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject unauthenticated request with 401 and invalid payload with 400 (Edge Case)",
        input: '{"method":"POST","path":"/api/tasks","headers":{"authorization":"Bearermz-invalid"},"body":{"title":"A"}}',
        expectedOutput: '{"status":401,"ok":false,"error":"UNAUTHORIZED"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 3. EXISTING PROJECT 3: Java OOP Banking Engine
  // =========================================================================
  {
    id: "proj_banking_system",
    title: "Java OOP Banking Engine",
    category: "Enterprise Java",
    track: "Java",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "java",
    technologies: ["Java 21", "OOP Abstraction", "Polymorphism", "Atomic Transfers", "Exception Handling"],
    estimatedTime: "5 Hours",
    xpReward: 400,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Develop an enterprise banking domain model in Java applying abstract classes, Savings & Checking account polymorphism, overdraft protection, and atomic inter-account transfer rollback.",
    problemStatement:
      "Core banking ledgers must guarantee that deposits, withdrawals, interest accruals, and inter-account transfers preserve strict monetary invariants. Savings accounts accrue interest and forbid negative balances, while Checking accounts support a configurable overdraft limit.",
    realWorldScenario:
      "You are implementing the core domain ledger engine for a digital banking microservice in Java, processing batch ledger commands and outputting deterministic account state snapshots.",
    objectives: [
      "Create an abstract `Account` base class encapsulating account ID, holder name, and balance.",
      "Implement `SavingsAccount` (with interest accrual and zero-overdraft rule) and `CheckingAccount` (with overdraft protection limit).",
      "Implement atomic `transfer(fromId, toId, amount)` in `BankEngine` that rolls back if debit or credit fails.",
      "Validate negative transaction amounts and insufficient funds deterministically.",
    ],
    ioSpecification: {
      inputFormat: "Single-line command string on stdin: DEPOSIT, WITHDRAW, TRANSFER, INTEREST, or INVALID_TEST",
      outputFormat: "Formatted ledger status line with exact account balances and status codes.",
    },
    deliverables: [
      "Abstract Account hierarchy (Account.java)",
      "Bank ledger & atomic transfer manager (BankEngine.java)",
      "CLI command harness (Main.java)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_bank_1", title: "Abstract Account Base Class & Encapsulation", description: "Define abstract Account with protected balance and polymorphic withdraw() method.", mandatory: true, validationPatterns: ["abstract class Account", "withdraw"] },
      { id: "fr_bank_2", title: "SavingsAccount Interest & Minimum Balance", description: "Accrue percentage interest and reject withdrawals exceeding current balance.", mandatory: true, validationPatterns: ["class SavingsAccount", "extends Account", "applyInterest"] },
      { id: "fr_bank_3", title: "CheckingAccount Overdraft Protection", description: "Allow withdrawals up to balance + overdraftLimit.", mandatory: true, validationPatterns: ["class CheckingAccount", "overdraftLimit"] },
      { id: "fr_bank_4", title: "Atomic Inter-Account Transfer", description: "Execute debit and credit atomically; leave both balances unchanged if debit fails.", mandatory: true, validationPatterns: ["transfer", "from", "to"] },
      { id: "fr_bank_5", title: "Negative Amount & Missing Account Guards", description: "Reject <= 0 amounts and invalid account IDs cleanly.", mandatory: true, validationPatterns: ["<= 0", "INSUFFICIENT_FUNDS"] },
    ],
    technicalRequirements: [
      { id: "tr_bank_1", title: "Multi-File Java Compilation", constraint: "Split domain models (Account.java), service engine (BankEngine.java), and entry point (Main.java).", mandatory: true, validationPatterns: ["class Main", "class BankEngine"] },
      { id: "tr_bank_2", title: "OOP Inheritance & Method Overriding", constraint: "Use @Override on polymorphic withdraw methods.", mandatory: true, validationPatterns: ["extends Account"] },
      { id: "tr_bank_3", title: "Integer Cent / Exact Formatting", constraint: "Format balances consistently as whole numbers for deterministic ledger assertions.", mandatory: true, validationPatterns: ["getBalance"] },
      { id: "tr_bank_4", title: "Graceful Error Reporting", constraint: "Output structured error codes (INSUFFICIENT_FUNDS, INVALID_AMOUNT) without uncaught exceptions.", mandatory: true, validationPatterns: ["INVALID_AMOUNT", "INSUFFICIENT_FUNDS"] },
    ],
    milestones: [
      {
        id: "task_bank_1",
        stepNumber: 1,
        title: "Design Abstract Account & Concrete Subclasses",
        question: "Implement `Account`, `SavingsAccount`, and `CheckingAccount` in `Account.java`.",
        expectedFunctionality: "Encapsulates balance, validates deposits > 0, and implements polymorphic `withdraw(int amount)`.",
        technicalConstraints: "`SavingsAccount` forbids balance < 0; `CheckingAccount` permits down to `-overdraftLimit`.",
        acceptanceCriteria: "Savings withdrawal above balance returns false; Checking withdrawal within overdraft succeeds.",
        marksAllocated: 30,
        targetFile: "Account.java",
        validationPatterns: ["abstract class Account", "SavingsAccount", "CheckingAccount"],
      },
      {
        id: "task_bank_2",
        stepNumber: 2,
        title: "Implement Atomic Transfer & Ledger Service",
        question: "Implement `BankEngine` in `BankEngine.java` to manage accounts and atomic transfers.",
        expectedFunctionality: "Transfers funds between accounts only when source account withdrawal succeeds.",
        technicalConstraints: "Must preserve original balances if transfer fails.",
        acceptanceCriteria: "Failed transfer leaves both source and destination balances untouched.",
        marksAllocated: 35,
        targetFile: "BankEngine.java",
        validationPatterns: ["class BankEngine", "transfer"],
      },
      {
        id: "task_bank_3",
        stepNumber: 3,
        title: "Build Command Processor in Main.java",
        question: "Wire `Main.java` to read the stdin scenario command and execute the corresponding ledger transaction.",
        expectedFunctionality: "Processes DEPOSIT, WITHDRAW_OVERDRAFT, TRANSFER_OK, INTEREST, TRANSFER_FAIL, and INVALID_AMOUNT commands.",
        technicalConstraints: "Must compile cleanly with `javac *.java`.",
        acceptanceCriteria: "All 6 automated Java banking test cases pass.",
        marksAllocated: 35,
        targetFile: "Main.java",
        validationPatterns: ["public static void main", "BankEngine"],
      },
    ],
    files: [
      {
        name: "Main.java",
        language: "java",
        content: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String cmd = sc.hasNextLine() ? sc.nextLine().trim() : "";
        // TODO: Initialize BankEngine and process ledger command
        System.out.println("ERROR: Banking Engine not implemented");
    }
}
`,
      },
      {
        name: "Account.java",
        language: "java",
        content: `public abstract class Account {
    protected String id;
    protected int balance;

    public Account(String id, int balance) {
        this.id = id;
        this.balance = balance;
    }

    public int getBalance() { return balance; }
    public abstract boolean withdraw(int amount);
}
`,
      },
      {
        name: "BankEngine.java",
        language: "java",
        content: `public class BankEngine {
    // TODO: Manage accounts and atomic transfers
}
`,
      },
    ],
    solutionFiles: [
      {
        name: "Main.java",
        language: "java",
        content: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String cmd = sc.hasNextLine() ? sc.nextLine().trim() : "";
        BankEngine engine = new BankEngine();

        if ("DEPOSIT".equals(cmd)) {
            System.out.println(engine.deposit("SAV-1", 500));
        } else if ("WITHDRAW_OVERDRAFT".equals(cmd)) {
            System.out.println(engine.withdraw("CHK-1", 1200));
        } else if ("TRANSFER_OK".equals(cmd)) {
            System.out.println(engine.transfer("SAV-1", "CHK-1", 600));
        } else if ("INTEREST".equals(cmd)) {
            System.out.println(engine.applySavingsInterest("SAV-1"));
        } else if ("TRANSFER_FAIL".equals(cmd)) {
            System.out.println(engine.transfer("SAV-1", "CHK-1", 5000));
        } else if ("INVALID_AMOUNT".equals(cmd)) {
            System.out.println(engine.deposit("SAV-1", -100));
        } else {
            System.out.println("UNKNOWN_COMMAND");
        }
    }
}
`,
      },
      {
        name: "Account.java",
        language: "java",
        content: `public abstract class Account {
    protected String id;
    protected int balance;

    public Account(String id, int balance) {
        this.id = id;
        this.balance = balance;
    }

    public String getId() { return id; }
    public int getBalance() { return balance; }

    public boolean deposit(int amount) {
        if (amount <= 0) return false;
        this.balance += amount;
        return true;
    }

    public abstract boolean withdraw(int amount);
}

class SavingsAccount extends Account {
    private int interestRatePct;

    public SavingsAccount(String id, int balance, int interestRatePct) {
        super(id, balance);
        this.interestRatePct = interestRatePct;
    }

    @Override
    public boolean withdraw(int amount) {
        if (amount <= 0 || amount > balance) return false;
        balance -= amount;
        return true;
    }

    public void applyInterest() {
        balance += (balance * interestRatePct) / 100;
    }
}

class CheckingAccount extends Account {
    private int overdraftLimit;

    public CheckingAccount(String id, int balance, int overdraftLimit) {
        super(id, balance);
        this.overdraftLimit = overdraftLimit;
    }

    @Override
    public boolean withdraw(int amount) {
        if (amount <= 0 || (balance - amount) < -overdraftLimit) return false;
        balance -= amount;
        return true;
    }
}
`,
      },
      {
        name: "BankEngine.java",
        language: "java",
        content: `import java.util.HashMap;
import java.util.Map;

public class BankEngine {
    private Map<String, Account> accounts = new HashMap<>();

    public BankEngine() {
        accounts.put("SAV-1", new SavingsAccount("SAV-1", 2000, 5));
        accounts.put("CHK-1", new CheckingAccount("CHK-1", 1000, 500));
    }

    public String deposit(String id, int amount) {
        if (amount <= 0) return "ERROR:INVALID_AMOUNT";
        Account acc = accounts.get(id);
        if (acc == null) return "ERROR:ACCOUNT_NOT_FOUND";
        acc.deposit(amount);
        return "OK:" + id + ":" + acc.getBalance();
    }

    public String withdraw(String id, int amount) {
        if (amount <= 0) return "ERROR:INVALID_AMOUNT";
        Account acc = accounts.get(id);
        if (acc == null) return "ERROR:ACCOUNT_NOT_FOUND";
        if (!acc.withdraw(amount)) return "ERROR:INSUFFICIENT_FUNDS:" + acc.getBalance();
        return "OK:" + id + ":" + acc.getBalance();
    }

    public String transfer(String fromId, String toId, int amount) {
        if (amount <= 0) return "ERROR:INVALID_AMOUNT";
        Account from = accounts.get(fromId);
        Account to = accounts.get(toId);
        if (from == null || to == null) return "ERROR:ACCOUNT_NOT_FOUND";
        if (!from.withdraw(amount)) {
            return "ROLLBACK:INSUFFICIENT_FUNDS:SAV-1=" + from.getBalance() + ",CHK-1=" + to.getBalance();
        }
        to.deposit(amount);
        return "TRANSFER_OK:SAV-1=" + from.getBalance() + ",CHK-1=" + to.getBalance();
    }

    public String applySavingsInterest(String id) {
        Account acc = accounts.get(id);
        if (acc instanceof SavingsAccount) {
            ((SavingsAccount) acc).applyInterest();
            return "INTEREST_OK:" + id + ":" + acc.getBalance();
        }
        return "ERROR:NOT_SAVINGS";
    }
}
`,
      },
    ],
    testCases: [
      {
        name: "Deposit 500 into Savings Account SAV-1",
        input: "DEPOSIT",
        expectedOutput: "OK:SAV-1:2500",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Withdraw 1200 from Checking Account CHK-1 using overdraft protection",
        input: "WITHDRAW_OVERDRAFT",
        expectedOutput: "OK:CHK-1:-200",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Execute atomic transfer of 600 from SAV-1 to CHK-1",
        input: "TRANSFER_OK",
        expectedOutput: "TRANSFER_OK:SAV-1=1400,CHK-1=1600",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Accrue 5% interest on Savings Account SAV-1",
        input: "INTEREST",
        expectedOutput: "INTEREST_OK:SAV-1:2100",
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Atomic rollback when transfer exceeds Savings balance (Edge Case)",
        input: "TRANSFER_FAIL",
        expectedOutput: "ROLLBACK:INSUFFICIENT_FUNDS:SAV-1=2000,CHK-1=1000",
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject negative deposit amount (Edge Case)",
        input: "INVALID_AMOUNT",
        expectedOutput: "ERROR:INVALID_AMOUNT",
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 4. EXISTING PROJECT 4: Algorithmic Trading & Analytics Engine
  // =========================================================================
  {
    id: "proj_trading_bot",
    title: "Algorithmic Trading & Analytics Engine",
    category: "FinTech & Analytics",
    track: "Python",
    level: "Advanced",
    difficulty: "Advanced",
    starterLanguage: "python",
    technologies: ["Python 3", "Quantitative Finance", "SMA & EMA", "RSI Indicator", "Backtesting Engine"],
    estimatedTime: "6 Hours",
    xpReward: 600,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Implement quantitative technical analysis indicators (SMA, EMA, 14-period Wilder/Simple RSI) and an automated crossover backtesting engine calculating net PnL and win rate.",
    problemStatement:
      "Quantitative trading systems must process historical price series accurately, compute Simple Moving Averages (SMA), Relative Strength Index (RSI), and simulate buy/sell signal execution with deterministic portfolio return metrics and guardrails against insufficient price history.",
    realWorldScenario:
      "You are building the quantitative signal generator and backtesting analytics module for an algorithmic trading desk.",
    objectives: [
      "Implement `calculate_sma(prices, window)` with exact floating-point rounding.",
      "Implement `calculate_rsi(prices)` returning bounded 0..100 momentum values.",
      "Build `run_backtest(prices, initial_cash)` executing moving-average/momentum signals and reporting final equity & trade count.",
      "Validate empty or insufficient window series cleanly.",
    ],
    ioSpecification: {
      inputFormat: "JSON object on stdin: { mode: 'sma' | 'rsi' | 'backtest', prices: number[], window?: number, cash?: number }",
      outputFormat: "JSON response on stdout with computed indicators or backtest report.",
    },
    deliverables: [
      "Technical indicators library (indicators.py)",
      "Strategy backtester & risk metrics (backtester.js / backtester.py)",
      "CLI pipeline entry point (main.py)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_trade_1", title: "Simple Moving Average (SMA) Series", description: "Compute sliding window averages rounded to 2 decimal places.", mandatory: true, validationPatterns: ["def calculate_sma", "round"] },
      { id: "fr_trade_2", title: "Relative Strength Index (RSI) Calculation", description: "Calculate average gains and losses across price deltas and return RSI (0..100).", mandatory: true, validationPatterns: ["def calculate_rsi", "gains", "losses"] },
      { id: "fr_trade_3", title: "Automated Signal Backtesting", description: "Simulate long entries and exits across price ticks and compute final portfolio value.", mandatory: true, validationPatterns: ["def run_backtest", "final_equity", "trades"] },
      { id: "fr_trade_4", title: "Insufficient Data & Window Validation", description: "Return structured error when price series is shorter than window or < 2 ticks.", mandatory: true, validationPatterns: ["INSUFFICIENT_DATA", "len(prices)"] },
    ],
    technicalRequirements: [
      { id: "tr_trade_1", title: "Modular Python Architecture", constraint: "Separate indicator math (indicators.py), strategy simulation (backtester.py), and CLI entry (main.py).", mandatory: true, validationPatterns: ["from indicators import", "from backtester import"] },
      { id: "tr_trade_2", title: "Zero-Division Protection in RSI", constraint: "Return RSI = 100.0 when average loss is 0.", mandatory: true, validationPatterns: ["100.0"] },
      { id: "tr_trade_3", title: "Deterministic Rounding", constraint: "Round all financial outputs to 2 decimal places.", mandatory: true, validationPatterns: ["round("] },
    ],
    milestones: [
      {
        id: "task_trade_1",
        stepNumber: 1,
        title: "Implement SMA & RSI Quantitative Indicators",
        question: "Implement `calculate_sma(prices, window)` and `calculate_rsi(prices)` in `indicators.py`.",
        expectedFunctionality: "Computes sliding window SMA values and RSI momentum score rounded to 2 decimals.",
        technicalConstraints: "Handle zero average loss without ZeroDivisionError.",
        acceptanceCriteria: "SMA(3) on `[10, 20, 30, 40]` returns `[20.0, 30.0]`.",
        marksAllocated: 35,
        targetFile: "indicators.py",
        validationPatterns: ["def calculate_sma", "def calculate_rsi"],
      },
      {
        id: "task_trade_2",
        stepNumber: 2,
        title: "Implement Backtesting Strategy Engine",
        question: "Implement `run_backtest(prices, initial_cash)` in `backtester.py`.",
        expectedFunctionality: "Buys when price dips below previous tick and sells when price rises above entry price, returning `final_equity`, `pnl`, and `trades`.",
        technicalConstraints: "Must preserve cash accuracy to 2 decimal places.",
        acceptanceCriteria: "Backtest on `[100, 90, 108, 105, 120]` yields deterministic profit.",
        marksAllocated: 35,
        targetFile: "backtester.py",
        validationPatterns: ["def run_backtest", "final_equity", "pnl"],
      },
      {
        id: "task_trade_3",
        stepNumber: 3,
        title: "Wire CLI Dispatcher & Edge-Case Guards in main.py",
        question: "Connect `indicators.py` and `backtester.py` in `main.py` and validate input constraints.",
        expectedFunctionality: "Routes `sma`, `rsi`, and `backtest` modes and rejects insufficient price arrays.",
        technicalConstraints: "Output valid JSON on stdout.",
        acceptanceCriteria: "All 6 quantitative test cases pass.",
        marksAllocated: 30,
        targetFile: "main.py",
        validationPatterns: ["calculate_sma", "calculate_rsi", "run_backtest", "json.dumps"],
      },
    ],
    files: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from indicators import calculate_sma, calculate_rsi
from backtester import run_backtest

# TODO: Parse stdin JSON and dispatch 'sma', 'rsi', or 'backtest'
print(json.dumps({"ok": False, "error": "Trading engine not implemented"}))
`,
      },
      {
        name: "indicators.py",
        language: "python",
        content: `def calculate_sma(prices, window=3):
    # TODO: Return sliding window SMA list rounded to 2 decimals
    return []

def calculate_rsi(prices):
    # TODO: Compute RSI (0..100) from price deltas
    return 0.0
`,
      },
      {
        name: "backtester.py",
        language: "python",
        content: `def run_backtest(prices, initial_cash=1000.0):
    # TODO: Simulate dip-buy / profit-sell strategy and return metrics
    return {"ok": False}
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from indicators import calculate_sma, calculate_rsi
from backtester import run_backtest

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"ok": False, "error": "EMPTY_INPUT"}))
        return
    try:
        req = json.loads(raw)
        mode = req.get("mode", "")
        prices = req.get("prices", [])

        if mode == "sma":
            window = int(req.get("window", 3))
            res = calculate_sma(prices, window)
            if res is None:
                print(json.dumps({"ok": False, "error": "INSUFFICIENT_DATA"}))
            else:
                print(json.dumps({"ok": True, "sma": res}))
        elif mode == "rsi":
            res = calculate_rsi(prices)
            if res is None:
                print(json.dumps({"ok": False, "error": "INSUFFICIENT_DATA"}))
            else:
                print(json.dumps({"ok": True, "rsi": res}))
        elif mode == "backtest":
            cash = float(req.get("cash", 1000.0))
            res = run_backtest(prices, cash)
            print(json.dumps(res))
        else:
            print(json.dumps({"ok": False, "error": "INVALID_MODE"}))
    except Exception:
        print(json.dumps({"ok": False, "error": "INVALID_PAYLOAD"}))

if __name__ == "__main__":
    main()
`,
      },
      {
        name: "indicators.py",
        language: "python",
        content: `def calculate_sma(prices, window=3):
    if not prices or window <= 0 or len(prices) < window:
        return None
    return [round(sum(prices[i - window:i]) / window, 2) for i in range(window, len(prices) + 1)]

def calculate_rsi(prices):
    if not prices or len(prices) < 2:
        return None
    gains = []
    losses = []
    for i in range(1, len(prices)):
        delta = prices[i] - prices[i - 1]
        if delta > 0:
            gains.append(delta)
            losses.append(0.0)
        else:
            gains.append(0.0)
            losses.append(abs(delta))
    avg_gain = sum(gains) / len(gains)
    avg_loss = sum(losses) / len(losses)
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100.0 - (100.0 / (1.0 + rs)), 2)
`,
      },
      {
        name: "backtester.py",
        language: "python",
        content: `def run_backtest(prices, initial_cash=1000.0):
    if not prices or len(prices) < 2 or initial_cash <= 0:
        return {"ok": False, "error": "INSUFFICIENT_DATA"}
    cash = float(initial_cash)
    shares = 0.0
    entry_price = 0.0
    trades = 0

    for i in range(1, len(prices)):
        p = float(prices[i])
        prev = float(prices[i - 1])
        if shares == 0 and p < prev:
            shares = cash / p
            entry_price = p
            cash = 0.0
            trades += 1
        elif shares > 0 and p > entry_price:
            cash = shares * p
            shares = 0.0
            trades += 1

    final_equity = round(cash + shares * float(prices[-1]), 2)
    pnl = round(final_equity - initial_cash, 2)
    return {"ok": True, "final_equity": final_equity, "pnl": pnl, "trades": trades}
`,
      },
    ],
    testCases: [
      {
        name: "Compute 3-period SMA on historical price feed",
        input: '{"mode":"sma","prices":[10,20,30,40,50],"window":3}',
        expectedOutput: '{"ok": true, "sma": [20.0, 30.0, 40.0]}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Compute RSI on mixed momentum price series",
        input: '{"mode":"rsi","prices":[100,104,102,108,106]}',
        expectedOutput: '{"ok": true, "rsi": 71.43}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Execute backtest strategy and compute PnL",
        input: '{"mode":"backtest","prices":[100,90,108,105,120],"cash":1000}',
        expectedOutput: '{"ok": true, "final_equity": 1371.43, "pnl": 371.43, "trades": 4}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Handle pure uptrend RSI = 100 without division by zero",
        input: '{"mode":"rsi","prices":[50,55,60,65]}',
        expectedOutput: '{"ok": true, "rsi": 100.0}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject SMA when window exceeds price series length (Edge Case)",
        input: '{"mode":"sma","prices":[10,20],"window":5}',
        expectedOutput: '{"ok": false, "error": "INSUFFICIENT_DATA"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject backtest with insufficient price ticks (Edge Case)",
        input: '{"mode":"backtest","prices":[100],"cash":1000}',
        expectedOutput: '{"ok": false, "error": "INSUFFICIENT_DATA"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 5. NEW PROJECT 1: E-Commerce Management Platform
  // =========================================================================
  {
    id: "proj_ecommerce_platform",
    title: "E-Commerce Management Platform",
    category: "Full-Stack & Web",
    track: "Full-Stack Web Development",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "javascript",
    technologies: ["React", "Node.js", "Express", "PostgreSQL"],
    estimatedTime: "6 Hours",
    xpReward: 450,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build a complete E-Commerce Management Platform supporting product catalog management, shopping cart state, promotional coupon calculation, inventory stock deduction, checkout authentication, and order lifecycle management.",
    problemStatement:
      "Online retail platforms must coordinate product catalog queries, shopping cart line-item calculations, promotional discount codes (`SAVE10`), tax calculation, and transactional inventory deduction during checkout so overselling never occurs.",
    realWorldScenario:
      "You are building the core commerce engine backing a React + Node.js/Express + PostgreSQL storefront.",
    objectives: [
      "Implement product catalog lookup and category filtering in `catalogStore.js`.",
      "Build shopping cart subtotal, coupon discount (`SAVE10` = 10% off), and 8% tax calculation in `checkoutService.js`.",
      "Enforce atomic stock availability verification before confirming checkout orders.",
      "Authenticate customer checkout requests and generate deterministic order receipts.",
    ],
    ioSpecification: {
      inputFormat: "JSON command on stdin: { action: 'catalog' | 'cart_quote' | 'checkout', payload: {...} }",
      outputFormat: "JSON response with product list, cart breakdown, or confirmed order receipt.",
    },
    deliverables: [
      "Product catalog & inventory store (catalogStore.js)",
      "Cart pricing & atomic checkout service (checkoutService.js)",
      "E-Commerce controller entry point (main.js)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_ec_1", title: "Product Catalog & Category Filtering", description: "List products with price and available stock, optionally filtered by category.", mandatory: true, validationPatterns: ["listProducts", "category", "stock"] },
      { id: "fr_ec_2", title: "Shopping Cart Quote & Coupon Engine", description: "Calculate subtotal, 10% discount for coupon 'SAVE10', and 8% tax.", mandatory: true, validationPatterns: ["calculateCartQuote", "SAVE10", "tax"] },
      { id: "fr_ec_3", title: "Authenticated Checkout & Stock Deduction", description: "Require authenticated userId, verify stock >= quantity, deduct stock, and return order receipt.", mandatory: true, validationPatterns: ["processCheckout", "OUT_OF_STOCK", "orderId"] },
      { id: "fr_ec_4", title: "Empty Cart & Invalid Quantity Guards", description: "Reject empty carts or quantities <= 0 with descriptive error codes.", mandatory: true, validationPatterns: ["EMPTY_CART", "INVALID_QUANTITY"] },
    ],
    technicalRequirements: [
      { id: "tr_ec_1", title: "Modular Store & Checkout Separation", constraint: "Separate catalog state (catalogStore.js), checkout pricing (checkoutService.js), and dispatcher (main.js).", mandatory: true, validationPatterns: ["require", "module.exports"] },
      { id: "tr_ec_2", title: "Monetary Precision Rounding", constraint: "Round currency totals to 2 decimal places.", mandatory: true, validationPatterns: ["Math.round"] },
      { id: "tr_ec_3", title: "Transactional Stock Check", constraint: "Validate all cart items have sufficient stock before mutating inventory.", mandatory: true, validationPatterns: ["OUT_OF_STOCK", "stock"] },
    ],
    milestones: [
      {
        id: "task_ec_1",
        stepNumber: 1,
        title: "Implement Product Catalog & Inventory Store",
        question: "Implement `listProducts(category)` and `getProductById(id)` in `catalogStore.js`.",
        expectedFunctionality: "Returns seeded products filtered by category (case-insensitive).",
        technicalConstraints: "Maintain accurate stock counts per SKU.",
        acceptanceCriteria: "Filtering by 'Electronics' returns 2 products.",
        marksAllocated: 25,
        targetFile: "catalogStore.js",
        validationPatterns: ["listProducts", "getProductById", "PRODUCTS"],
      },
      {
        id: "task_ec_2",
        stepNumber: 2,
        title: "Build Cart Quote & Coupon Discount Calculator",
        question: "Implement `calculateCartQuote(items, coupon)` in `checkoutService.js`.",
        expectedFunctionality: "Computes `subtotal`, `discount` (`SAVE10` gives 10% off), `tax` (8% of discounted subtotal), and `total`.",
        technicalConstraints: "Reject unknown product IDs or quantities <= 0.",
        acceptanceCriteria: "Cart with 2x $50 items and `SAVE10` produces subtotal=100, discount=10, tax=7.2, total=97.2.",
        marksAllocated: 35,
        targetFile: "checkoutService.js",
        validationPatterns: ["calculateCartQuote", "SAVE10", "discount", "tax"],
      },
      {
        id: "task_ec_3",
        stepNumber: 3,
        title: "Implement Authenticated Checkout & Stock Deduction",
        question: "Implement `processCheckout(payload)` in `checkoutService.js` and wire `main.js`.",
        expectedFunctionality: "Verifies `userId`, checks stock availability across all items, deducts stock, and issues `ORD-1001`.",
        technicalConstraints: "Return `OUT_OF_STOCK` if requested quantity exceeds stock.",
        acceptanceCriteria: "All 6 e-commerce test cases pass.",
        marksAllocated: 40,
        targetFile: "checkoutService.js",
        validationPatterns: ["processCheckout", "OUT_OF_STOCK", "ORD-1001"],
      },
    ],
    files: [
      {
        name: "main.js",
        language: "javascript",
        content: `const fs = require("fs");
const { listProducts } = require("./catalogStore");
const { calculateCartQuote, processCheckout } = require("./checkoutService");

// TODO: Route 'catalog', 'cart_quote', and 'checkout' actions
console.log(JSON.stringify({ ok: false, error: "E-Commerce engine not implemented" }));
`,
      },
      {
        name: "catalogStore.js",
        language: "javascript",
        content: `const PRODUCTS = [
  { id: "sku_1", name: "Mechanical Keyboard", category: "Electronics", price: 100, stock: 5 },
  { id: "sku_2", name: "USB-C Hub", category: "Electronics", price: 50, stock: 10 },
  { id: "sku_3", name: "Ergonomic Desk Mat", category: "Accessories", price: 30, stock: 8 }
];

function listProducts(category) {
  // TODO: Filter products by category if provided
  return [];
}

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

module.exports = { PRODUCTS, listProducts, getProductById };
`,
      },
      {
        name: "checkoutService.js",
        language: "javascript",
        content: `const { getProductById } = require("./catalogStore");

function calculateCartQuote(items = [], coupon = "") {
  // TODO: Calculate subtotal, discount (SAVE10 = 10%), tax (8%), total
  return { ok: false };
}

function processCheckout(payload = {}) {
  // TODO: Verify userId, check stock, deduct stock, and return order receipt
  return { ok: false };
}

module.exports = { calculateCartQuote, processCheckout };
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.js",
        language: "javascript",
        content: `const fs = require("fs");
const { listProducts } = require("./catalogStore");
const { calculateCartQuote, processCheckout } = require("./checkoutService");

try {
  const req = JSON.parse(fs.readFileSync(0, "utf8").trim());
  const action = req.action;
  const payload = req.payload || {};

  if (action === "catalog") {
    const items = listProducts(payload.category);
    console.log(JSON.stringify({ ok: true, count: items.length, products: items }));
  } else if (action === "cart_quote") {
    console.log(JSON.stringify(calculateCartQuote(payload.items, payload.coupon)));
  } else if (action === "checkout") {
    console.log(JSON.stringify(processCheckout(payload)));
  } else {
    console.log(JSON.stringify({ ok: false, error: "UNKNOWN_ACTION" }));
  }
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: "INVALID_JSON" }));
}
`,
      },
      {
        name: "catalogStore.js",
        language: "javascript",
        content: `const PRODUCTS = [
  { id: "sku_1", name: "Mechanical Keyboard", category: "Electronics", price: 100, stock: 5 },
  { id: "sku_2", name: "USB-C Hub", category: "Electronics", price: 50, stock: 10 },
  { id: "sku_3", name: "Ergonomic Desk Mat", category: "Accessories", price: 30, stock: 8 }
];

function listProducts(category) {
  if (!category || category.toLowerCase() === "all") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

module.exports = { PRODUCTS, listProducts, getProductById };
`,
      },
      {
        name: "checkoutService.js",
        language: "javascript",
        content: `const { getProductById } = require("./catalogStore");

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calculateCartQuote(items = [], coupon = "") {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "EMPTY_CART" };
  }
  let subtotal = 0;
  for (const item of items) {
    const prod = getProductById(item.productId);
    if (!prod) return { ok: false, error: "PRODUCT_NOT_FOUND" };
    if (!item.qty || item.qty <= 0) return { ok: false, error: "INVALID_QUANTITY" };
    if (item.qty > prod.stock) return { ok: false, error: "OUT_OF_STOCK" };
    subtotal += prod.price * item.qty;
  }
  const discount = String(coupon || "").toUpperCase() === "SAVE10" ? round2(subtotal * 0.1) : 0;
  const discounted = subtotal - discount;
  const tax = round2(discounted * 0.08);
  const total = round2(discounted + tax);
  return { ok: true, subtotal, discount, tax, total };
}

function processCheckout(payload = {}) {
  if (!payload.userId) return { ok: false, error: "AUTH_REQUIRED" };
  const quote = calculateCartQuote(payload.items, payload.coupon);
  if (!quote.ok) return quote;

  for (const item of payload.items) {
    const prod = getProductById(item.productId);
    prod.stock -= item.qty;
  }

  return {
    ok: true,
    orderId: "ORD-1001",
    userId: payload.userId,
    totalCharged: quote.total,
    remainingStock: payload.items.map((i) => ({ id: i.productId, stock: getProductById(i.productId).stock }))
  };
}

module.exports = { calculateCartQuote, processCheckout };
`,
      },
    ],
    testCases: [
      {
        name: "Filter catalog by Electronics category",
        input: '{"action":"catalog","payload":{"category":"Electronics"}}',
        expectedOutput: '{"ok":true,"count":2,"products":[{"id":"sku_1","name":"Mechanical Keyboard","category":"Electronics","price":100,"stock":5},{"id":"sku_2","name":"USB-C Hub","category":"Electronics","price":50,"stock":10}]}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Calculate cart quote with SAVE10 promotional coupon",
        input: '{"action":"cart_quote","payload":{"items":[{"productId":"sku_2","qty":2}],"coupon":"SAVE10"}}',
        expectedOutput: '{"ok":true,"subtotal":100,"discount":10,"tax":7.2,"total":97.2}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Process authenticated checkout and deduct inventory stock",
        input: '{"action":"checkout","payload":{"userId":"usr_42","items":[{"productId":"sku_1","qty":2}],"coupon":"SAVE10"}}',
        expectedOutput: '{"ok":true,"orderId":"ORD-1001","userId":"usr_42","totalCharged":194.4,"remainingStock":[{"id":"sku_1","stock":3}]}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Calculate standard cart quote without coupon",
        input: '{"action":"cart_quote","payload":{"items":[{"productId":"sku_3","qty":1}]}}',
        expectedOutput: '{"ok":true,"subtotal":30,"discount":0,"tax":2.4,"total":32.4}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject checkout when quantity exceeds available stock (Edge Case)",
        input: '{"action":"checkout","payload":{"userId":"usr_42","items":[{"productId":"sku_1","qty":99}]}}',
        expectedOutput: '{"ok":false,"error":"OUT_OF_STOCK"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject unauthenticated checkout request (Edge Case)",
        input: '{"action":"checkout","payload":{"items":[{"productId":"sku_1","qty":1}]}}',
        expectedOutput: '{"ok":false,"error":"AUTH_REQUIRED"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 6. NEW PROJECT 2: Intelligent Student Management System
  // =========================================================================
  {
    id: "proj_student_mgmt",
    title: "Intelligent Student Management System",
    category: "AI & Data Engineering",
    track: "Python",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "python",
    technologies: ["Python", "FastAPI", "React", "PostgreSQL"],
    estimatedTime: "5 Hours",
    xpReward: 450,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Build an Intelligent Student Management System featuring student record management, attendance tracking, weighted GPA & letter-grade computation, role-based access control, and at-risk student analytics.",
    problemStatement:
      "Academic institutions need an automated backend that computes weighted student GPAs, tracks attendance percentages, enforces faculty/admin role permissions for grade modifications, and flags at-risk students (attendance < 75% or score < 60).",
    realWorldScenario:
      "You are developing the academic analytics and student record service for a university portal powered by Python, FastAPI, and PostgreSQL.",
    objectives: [
      "Manage student profiles, course scores, and attendance records in `student_store.py`.",
      "Compute weighted average score, letter grade (`A`, `B`, `C`, `F`), and at-risk status in `analytics.py`.",
      "Enforce RBAC so only `faculty` or `admin` roles can record or update student grades.",
      "Aggregate cohort-wide analytics (class average, honor-roll count, at-risk student IDs).",
    ],
    ioSpecification: {
      inputFormat: "JSON request on stdin: { action: 'profile' | 'update_grade' | 'cohort_analytics', role: string, payload: {...} }",
      outputFormat: "JSON response with student report, updated record, or cohort analytics summary.",
    },
    deliverables: [
      "Student records & RBAC mutation store (student_store.py)",
      "GPA, letter grade & at-risk analytics engine (analytics.py)",
      "Service dispatcher (main.py)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_stu_1", title: "Student Academic Profile & Grade Calculation", description: "Calculate average score, letter grade (A>=85, B>=70, C>=60, F<60), and atRisk flag.", mandatory: true, validationPatterns: ["compute_student_report", "letter_grade", "at_risk"] },
      { id: "fr_stu_2", title: "Role-Based Grade Update Guard", description: "Allow only 'faculty' or 'admin' roles to update student scores; reject 'student' role with FORBIDDEN.", mandatory: true, validationPatterns: ["faculty", "admin", "FORBIDDEN"] },
      { id: "fr_stu_3", title: "At-Risk Student Detection", description: "Flag students as at_risk when attendance < 75% or average score < 60.", mandatory: true, validationPatterns: ["75", "60", "at_risk"] },
      { id: "fr_stu_4", title: "Cohort Analytics Summary", description: "Compute cohort mean score, honorRollCount (avg >= 85), and list of atRiskIds.", mandatory: true, validationPatterns: ["compute_cohort_analytics", "honor_roll_count", "at_risk_ids"] },
    ],
    technicalRequirements: [
      { id: "tr_stu_1", title: "Multi-File Python Service Design", constraint: "Separate data store (student_store.py), analytics engine (analytics.py), and CLI controller (main.py).", mandatory: true, validationPatterns: ["from student_store import", "from analytics import"] },
      { id: "tr_stu_2", title: "Score Boundary Validation", constraint: "Reject score updates outside 0..100 range with INVALID_SCORE.", mandatory: true, validationPatterns: ["INVALID_SCORE", "100"] },
      { id: "tr_stu_3", title: "Deterministic Floating-Point Rounding", constraint: "Round averages to 2 decimal places.", mandatory: true, validationPatterns: ["round("] },
    ],
    milestones: [
      {
        id: "task_stu_1",
        stepNumber: 1,
        title: "Implement Student Academic Report & At-Risk Classifier",
        question: "Implement `compute_student_report(student)` in `analytics.py`.",
        expectedFunctionality: "Computes `average`, `letter_grade` (`A`>=85, `B`>=70, `C`>=60, else `F`), and `at_risk` (`attendance < 75` or `average < 60`).",
        technicalConstraints: "Round average to 2 decimals.",
        acceptanceCriteria: "Student `S101` (`[88, 92, 90]`, attendance `95%`) receives `average: 90.0`, `letter_grade: 'A'`, `at_risk: False`.",
        marksAllocated: 35,
        targetFile: "analytics.py",
        validationPatterns: ["def compute_student_report", "letter_grade", "at_risk"],
      },
      {
        id: "task_stu_2",
        stepNumber: 2,
        title: "Implement Cohort Analytics & RBAC Grade Mutations",
        question: "Implement `compute_cohort_analytics(students)` in `analytics.py` and `update_student_score` in `student_store.py`.",
        expectedFunctionality: "Enforces `faculty`/`admin` RBAC and 0..100 score bounds on updates; summarizes cohort statistics.",
        technicalConstraints: "Return `FORBIDDEN` if caller role is `'student'`.",
        acceptanceCriteria: "Cohort analytics identifies `S103` as at-risk and counts 1 honor-roll student.",
        marksAllocated: 35,
        targetFile: "student_store.py",
        validationPatterns: ["update_student_score", "FORBIDDEN", "INVALID_SCORE"],
      },
      {
        id: "task_stu_3",
        stepNumber: 3,
        title: "Wire Request Controller in main.py",
        question: "Connect `student_store.py` and `analytics.py` in `main.py` to handle `profile`, `update_grade`, and `cohort_analytics`.",
        expectedFunctionality: "Outputs deterministic JSON responses for all valid and error scenarios.",
        technicalConstraints: "Handle missing student IDs with `STUDENT_NOT_FOUND`.",
        acceptanceCriteria: "All 6 automated student management test cases pass.",
        marksAllocated: 30,
        targetFile: "main.py",
        validationPatterns: ["compute_student_report", "compute_cohort_analytics", "json.dumps"],
      },
    ],
    files: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from student_store import STUDENTS, get_student, update_student_score
from analytics import compute_student_report, compute_cohort_analytics

# TODO: Route 'profile', 'update_grade', and 'cohort_analytics'
print(json.dumps({"ok": False, "error": "Student management system not implemented"}))
`,
      },
      {
        name: "student_store.py",
        language: "python",
        content: `STUDENTS = [
    {"id": "S101", "name": "Aarav Sharma", "scores": [88, 92, 90], "attendance": 95},
    {"id": "S102", "name": "Diya Patel", "scores": [74, 78, 76], "attendance": 82},
    {"id": "S103", "name": "Rohan Verma", "scores": [52, 58, 55], "attendance": 68}
]

def get_student(student_id):
    # TODO: Find student by id
    return None

def update_student_score(role, student_id, score):
    # TODO: Enforce faculty/admin RBAC and 0..100 score validation
    return {"ok": False, "error": "Not implemented"}
`,
      },
      {
        name: "analytics.py",
        language: "python",
        content: `def compute_student_report(student):
    # TODO: Compute average, letter_grade, and at_risk flag
    return {}

def compute_cohort_analytics(students):
    # TODO: Compute cohort_average, honor_roll_count, and at_risk_ids
    return {}
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.py",
        language: "python",
        content: `import sys
import json
from student_store import STUDENTS, get_student, update_student_score
from analytics import compute_student_report, compute_cohort_analytics

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"ok": False, "error": "EMPTY_INPUT"}))
        return
    req = json.loads(raw)
    action = req.get("action", "")
    role = req.get("role", "student")
    payload = req.get("payload", {})

    if action == "profile":
        stu = get_student(payload.get("studentId"))
        if not stu:
            print(json.dumps({"ok": False, "error": "STUDENT_NOT_FOUND"}))
        else:
            print(json.dumps({"ok": True, "profile": compute_student_report(stu)}))
    elif action == "update_grade":
        res = update_student_score(role, payload.get("studentId"), payload.get("score"))
        if not res.get("ok"):
            print(json.dumps(res))
        else:
            print(json.dumps({"ok": True, "profile": compute_student_report(res["student"])}))
    elif action == "cohort_analytics":
        print(json.dumps({"ok": True, "analytics": compute_cohort_analytics(STUDENTS)}))
    else:
        print(json.dumps({"ok": False, "error": "UNKNOWN_ACTION"}))

if __name__ == "__main__":
    main()
`,
      },
      {
        name: "student_store.py",
        language: "python",
        content: `STUDENTS = [
    {"id": "S101", "name": "Aarav Sharma", "scores": [88, 92, 90], "attendance": 95},
    {"id": "S102", "name": "Diya Patel", "scores": [74, 78, 76], "attendance": 82},
    {"id": "S103", "name": "Rohan Verma", "scores": [52, 58, 55], "attendance": 68}
]

def get_student(student_id):
    for s in STUDENTS:
        if s["id"] == student_id:
            return s
    return None

def update_student_score(role, student_id, score):
    if role not in ("faculty", "admin"):
        return {"ok": False, "error": "FORBIDDEN"}
    stu = get_student(student_id)
    if not stu:
        return {"ok": False, "error": "STUDENT_NOT_FOUND"}
    if score is None or not isinstance(score, (int, float)) or score < 0 or score > 100:
        return {"ok": False, "error": "INVALID_SCORE"}
    stu["scores"].append(score)
    return {"ok": True, "student": stu}
`,
      },
      {
        name: "analytics.py",
        language: "python",
        content: `def compute_student_report(student):
    scores = student.get("scores", [])
    avg = round(sum(scores) / len(scores), 2) if scores else 0.0
    if avg >= 85:
        grade = "A"
    elif avg >= 70:
        grade = "B"
    elif avg >= 60:
        grade = "C"
    else:
        grade = "F"
    at_risk = bool(student.get("attendance", 100) < 75 or avg < 60)
    return {
        "id": student["id"],
        "name": student["name"],
        "average": avg,
        "letter_grade": grade,
        "attendance": student["attendance"],
        "at_risk": at_risk
    }

def compute_cohort_analytics(students):
    reports = [compute_student_report(s) for s in students]
    cohort_avg = round(sum(r["average"] for r in reports) / len(reports), 2) if reports else 0.0
    honor_roll = sum(1 for r in reports if r["average"] >= 85)
    at_risk_ids = [r["id"] for r in reports if r["at_risk"]]
    return {
        "cohort_average": cohort_avg,
        "honor_roll_count": honor_roll,
        "at_risk_ids": at_risk_ids
    }
`,
      },
    ],
    testCases: [
      {
        name: "Generate academic profile report for honor-roll student S101",
        input: '{"action":"profile","role":"student","payload":{"studentId":"S101"}}',
        expectedOutput: '{"ok": true, "profile": {"id": "S101", "name": "Aarav Sharma", "average": 90.0, "letter_grade": "A", "attendance": 95, "at_risk": false}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Identify at-risk student S103 (low attendance and low GPA)",
        input: '{"action":"profile","role":"faculty","payload":{"studentId":"S103"}}',
        expectedOutput: '{"ok": true, "profile": {"id": "S103", "name": "Rohan Verma", "average": 55.0, "letter_grade": "F", "attendance": 68, "at_risk": true}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Allow faculty role to append new exam score for S102",
        input: '{"action":"update_grade","role":"faculty","payload":{"studentId":"S102","score":92}}',
        expectedOutput: '{"ok": true, "profile": {"id": "S102", "name": "Diya Patel", "average": 80.0, "letter_grade": "B", "attendance": 82, "at_risk": false}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Compute cohort-wide average, honor roll, and at-risk student IDs",
        input: '{"action":"cohort_analytics","role":"admin","payload":{}}',
        expectedOutput: '{"ok": true, "analytics": {"cohort_average": 73.67, "honor_roll_count": 1, "at_risk_ids": ["S103"]}}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Block student role from modifying grades with FORBIDDEN (Edge Case)",
        input: '{"action":"update_grade","role":"student","payload":{"studentId":"S103","score":100}}',
        expectedOutput: '{"ok": false, "error": "FORBIDDEN"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject out-of-range score > 100 with INVALID_SCORE (Edge Case)",
        input: '{"action":"update_grade","role":"admin","payload":{"studentId":"S101","score":150}}',
        expectedOutput: '{"ok": false, "error": "INVALID_SCORE"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },

  // =========================================================================
  // 7. NEW PROJECT 3: Real-Time Chat Application
  // =========================================================================
  {
    id: "proj_realtime_chat",
    title: "Real-Time Chat Application",
    category: "Full-Stack & Web",
    track: "Full-Stack Web Development",
    level: "Intermediate",
    difficulty: "Intermediate",
    starterLanguage: "javascript",
    technologies: ["React", "Node.js", "Socket.IO", "MongoDB"],
    estimatedTime: "6 Hours",
    xpReward: 450,
    totalMarks: 100,
    passingMarks: 80,
    description:
      "Architect a Real-Time Chat Application hub supporting authenticated user sessions, direct private messaging (DMs), multi-member group rooms, profanity/rate validation, and real-time unread notification counters.",
    problemStatement:
      "Modern collaborative applications require low-latency event routing for direct messages and group channels, membership verification before broadcasting to private rooms, and instant unread notification counts per recipient.",
    realWorldScenario:
      "You are building the Socket.IO event broker and MongoDB message persistence layer for Mastery Zone's real-time communication hub.",
    objectives: [
      "Manage room memberships and message history in `chatStore.js`.",
      "Route private direct messages (`send_dm`) and generate recipient notification alerts in `notificationBroker.js`.",
      "Route group room broadcasts (`send_group`) while enforcing room membership authorization.",
      "Validate message length (1..500 chars) and block empty/whitespace-only payloads.",
    ],
    ioSpecification: {
      inputFormat: "JSON event on stdin: { event: 'send_dm' | 'send_group' | 'join_room' | 'unread_summary', payload: {...} }",
      outputFormat: "JSON event acknowledgement with delivered message, recipients, and notification count.",
    },
    deliverables: [
      "Room membership & message store (chatStore.js)",
      "Real-time notification & unread badge broker (notificationBroker.js)",
      "Socket event router (main.js)",
    ],
    rubric: {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: [
      { id: "fr_chat_1", title: "Direct Private Messaging (DM) & Notification", description: "Deliver private message from sender to recipient and increment recipient's unread notification count.", mandatory: true, validationPatterns: ["sendDirectMessage", "incrementUnread", "unreadCount"] },
      { id: "fr_chat_2", title: "Group Room Broadcast & Membership Check", description: "Verify sender belongs to room before broadcasting to other room members.", mandatory: true, validationPatterns: ["sendGroupMessage", "NOT_IN_ROOM", "recipients"] },
      { id: "fr_chat_3", title: "Dynamic Room Join", description: "Allow authenticated user to join a group chat channel idempotently.", mandatory: true, validationPatterns: ["joinRoom", "members"] },
      { id: "fr_chat_4", title: "Empty Message & Self-DM Validation", description: "Reject empty messages (EMPTY_MESSAGE) and self-DMs (CANNOT_DM_SELF).", mandatory: true, validationPatterns: ["EMPTY_MESSAGE", "CANNOT_DM_SELF"] },
    ],
    technicalRequirements: [
      { id: "tr_chat_1", title: "Modular Event Broker Architecture", constraint: "Separate room/message state (chatStore.js), notification counters (notificationBroker.js), and dispatcher (main.js).", mandatory: true, validationPatterns: ["require", "module.exports"] },
      { id: "tr_chat_2", title: "Sender Exclusion on Group Notifications", constraint: "When broadcasting to a room, notify all room members except the sender.", mandatory: true, validationPatterns: ["filter", "fromUser"] },
      { id: "tr_chat_3", title: "Idempotent Room Membership", constraint: "Joining an already-joined room must not duplicate the member entry.", mandatory: true, validationPatterns: ["includes"] },
    ],
    milestones: [
      {
        id: "task_chat_1",
        stepNumber: 1,
        title: "Implement Notification & Unread Counter Broker",
        question: "Implement `incrementUnread(userId)` and `getUnreadCount(userId)` in `notificationBroker.js`.",
        expectedFunctionality: "Tracks per-user unread notification counts accurately across DM and group events.",
        technicalConstraints: "Initialize baseline unread counts (`alice: 0`, `bob: 2`, `charlie: 1`).",
        acceptanceCriteria: "Incrementing `bob` updates his unread count from 2 to 3.",
        marksAllocated: 25,
        targetFile: "notificationBroker.js",
        validationPatterns: ["incrementUnread", "getUnreadCount"],
      },
      {
        id: "task_chat_2",
        stepNumber: 2,
        title: "Implement Direct Messaging & Group Room Broadcasts",
        question: "Implement `sendDirectMessage`, `sendGroupMessage`, and `joinRoom` in `chatStore.js`.",
        expectedFunctionality: "Validates non-empty text, prevents self-DM, verifies room membership, and notifies recipients.",
        technicalConstraints: "Return `NOT_IN_ROOM` if sender is not a member of the target group room.",
        acceptanceCriteria: "Group message in `room_devs` from `alice` notifies `bob` and `charlie`.",
        marksAllocated: 45,
        targetFile: "chatStore.js",
        validationPatterns: ["sendDirectMessage", "sendGroupMessage", "NOT_IN_ROOM"],
      },
      {
        id: "task_chat_3",
        stepNumber: 3,
        title: "Wire Socket Event Router in main.js",
        question: "Connect `chatStore.js` and `notificationBroker.js` in `main.js`.",
        expectedFunctionality: "Routes `send_dm`, `send_group`, `join_room`, and `unread_summary` events.",
        technicalConstraints: "Handle malformed payloads cleanly.",
        acceptanceCriteria: "All 6 real-time chat test cases pass.",
        marksAllocated: 30,
        targetFile: "main.js",
        validationPatterns: ["sendDirectMessage", "sendGroupMessage", "JSON.stringify"],
      },
    ],
    files: [
      {
        name: "main.js",
        language: "javascript",
        content: `const fs = require("fs");
const { sendDirectMessage, sendGroupMessage, joinRoom } = require("./chatStore");
const { getUnreadCount } = require("./notificationBroker");

// TODO: Route socket events: 'send_dm', 'send_group', 'join_room', 'unread_summary'
console.log(JSON.stringify({ ok: false, error: "Chat router not implemented" }));
`,
      },
      {
        name: "chatStore.js",
        language: "javascript",
        content: `const { incrementUnread, getUnreadCount } = require("./notificationBroker");

const ROOMS = {
  room_devs: ["alice", "bob", "charlie"]
};

function sendDirectMessage({ fromUser, toUser, text }) {
  // TODO: Validate message, prevent self-DM, and notify recipient
  return { ok: false };
}

function sendGroupMessage({ roomId, fromUser, text }) {
  // TODO: Verify room membership and broadcast to other members
  return { ok: false };
}

function joinRoom({ roomId, user }) {
  // TODO: Add user to room idempotently
  return { ok: false };
}

module.exports = { ROOMS, sendDirectMessage, sendGroupMessage, joinRoom };
`,
      },
      {
        name: "notificationBroker.js",
        language: "javascript",
        content: `const UNREAD = { alice: 0, bob: 2, charlie: 1 };

function incrementUnread(user) {
  // TODO: Increment user unread badge count
  return 0;
}

function getUnreadCount(user) {
  return UNREAD[user] || 0;
}

module.exports = { UNREAD, incrementUnread, getUnreadCount };
`,
      },
    ],
    solutionFiles: [
      {
        name: "main.js",
        language: "javascript",
        content: `const fs = require("fs");
const { sendDirectMessage, sendGroupMessage, joinRoom } = require("./chatStore");
const { getUnreadCount } = require("./notificationBroker");

try {
  const req = JSON.parse(fs.readFileSync(0, "utf8").trim());
  const event = req.event;
  const payload = req.payload || {};

  if (event === "send_dm") {
    console.log(JSON.stringify(sendDirectMessage(payload)));
  } else if (event === "send_group") {
    console.log(JSON.stringify(sendGroupMessage(payload)));
  } else if (event === "join_room") {
    console.log(JSON.stringify(joinRoom(payload)));
  } else if (event === "unread_summary") {
    console.log(JSON.stringify({ ok: true, user: payload.user, unreadCount: getUnreadCount(payload.user) }));
  } else {
    console.log(JSON.stringify({ ok: false, error: "UNKNOWN_EVENT" }));
  }
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: "INVALID_JSON" }));
}
`,
      },
      {
        name: "chatStore.js",
        language: "javascript",
        content: `const { incrementUnread, getUnreadCount } = require("./notificationBroker");

const ROOMS = {
  room_devs: ["alice", "bob", "charlie"]
};

function sendDirectMessage({ fromUser, toUser, text } = {}) {
  const cleanText = String(text || "").trim();
  if (!cleanText) return { ok: false, error: "EMPTY_MESSAGE" };
  if (!fromUser || !toUser) return { ok: false, error: "INVALID_PARTICIPANTS" };
  if (fromUser === toUser) return { ok: false, error: "CANNOT_DM_SELF" };

  const newUnread = incrementUnread(toUser);
  return {
    ok: true,
    type: "dm",
    fromUser,
    toUser,
    text: cleanText,
    recipientUnread: newUnread
  };
}

function sendGroupMessage({ roomId, fromUser, text } = {}) {
  const cleanText = String(text || "").trim();
  if (!cleanText) return { ok: false, error: "EMPTY_MESSAGE" };
  const members = ROOMS[roomId];
  if (!members) return { ok: false, error: "ROOM_NOT_FOUND" };
  if (!members.includes(fromUser)) return { ok: false, error: "NOT_IN_ROOM" };

  const recipients = members.filter((m) => m !== fromUser);
  recipients.forEach((r) => incrementUnread(r));
  return {
    ok: true,
    type: "group",
    roomId,
    fromUser,
    recipients,
    deliveredCount: recipients.length
  };
}

function joinRoom({ roomId, user } = {}) {
  if (!roomId || !user) return { ok: false, error: "INVALID_JOIN" };
  if (!ROOMS[roomId]) ROOMS[roomId] = [];
  if (!ROOMS[roomId].includes(user)) {
    ROOMS[roomId].push(user);
  }
  return { ok: true, roomId, members: ROOMS[roomId] };
}

module.exports = { ROOMS, sendDirectMessage, sendGroupMessage, joinRoom };
`,
      },
      {
        name: "notificationBroker.js",
        language: "javascript",
        content: `const UNREAD = { alice: 0, bob: 2, charlie: 1 };

function incrementUnread(user) {
  UNREAD[user] = (UNREAD[user] || 0) + 1;
  return UNREAD[user];
}

function getUnreadCount(user) {
  return UNREAD[user] || 0;
}

module.exports = { UNREAD, incrementUnread, getUnreadCount };
`,
      },
    ],
    testCases: [
      {
        name: "Deliver private DM from alice to bob and increment bob's unread count",
        input: '{"event":"send_dm","payload":{"fromUser":"alice","toUser":"bob","text":"Hey Bob, PR #42 is ready!"}}',
        expectedOutput: '{"ok":true,"type":"dm","fromUser":"alice","toUser":"bob","text":"Hey Bob, PR #42 is ready!","recipientUnread":3}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Broadcast group message in room_devs to other room members",
        input: '{"event":"send_group","payload":{"roomId":"room_devs","fromUser":"alice","text":"Standup starting in 5 mins"}}',
        expectedOutput: '{"ok":true,"type":"group","roomId":"room_devs","fromUser":"alice","recipients":["bob","charlie"],"deliveredCount":2}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Join group room idempotently",
        input: '{"event":"join_room","payload":{"roomId":"room_devs","user":"david"}}',
        expectedOutput: '{"ok":true,"roomId":"room_devs","members":["alice","bob","charlie","david"]}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Query unread notification badge count for bob",
        input: '{"event":"unread_summary","payload":{"user":"bob"}}',
        expectedOutput: '{"ok":true,"user":"bob","unreadCount":2}',
        isHidden: false,
        isEdgeCase: false,
      },
      {
        name: "Reject group broadcast from non-member with NOT_IN_ROOM (Edge Case)",
        input: '{"event":"send_group","payload":{"roomId":"room_devs","fromUser":"intruder","text":"Hello?"}}',
        expectedOutput: '{"ok":false,"error":"NOT_IN_ROOM"}',
        isHidden: true,
        isEdgeCase: true,
      },
      {
        name: "Reject empty whitespace message with EMPTY_MESSAGE (Edge Case)",
        input: '{"event":"send_dm","payload":{"fromUser":"alice","toUser":"bob","text":"   "}}',
        expectedOutput: '{"ok":false,"error":"EMPTY_MESSAGE"}',
        isHidden: true,
        isEdgeCase: true,
      },
    ],
  },
];

module.exports = { PROJECTS_PART_1 };
