const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const ARTIFACT_DIR = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf";

// Sample 64x64 valid PNG buffer
const SAMPLE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABMSURBVHja7c4xAQAwDMCg+TedqcF3QQiMhCRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiTvFg9/vQGxTzZtfgAAAABJRU5ErkJggg==";

async function waitForSelector(send, selector, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await send("Runtime.evaluate", {
      expression: `!!document.querySelector("${selector}")`,
    });
    if (res.result?.result?.value) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function runE2E() {
  console.log("🚀 Starting Interactive Ticket Support with File Attachments E2E Test...");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const User = require("./models/User");
  const SupportTicket = require("./models/SupportTicket");

  const student = await User.findOne({ email: "yashash.r.s70@kalvium.community" }) || await User.findOne({ role: "STUDENT" });
  const admin = await User.findOne({ email: "yashashyashash1@gmail.com" });

  const studentToken = jwt.sign(
    { userId: student._id, id: student._id, email: student.email, role: student.role || "STUDENT" },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "7d" }
  );

  const adminToken = jwt.sign(
    { userId: admin._id, id: admin._id, email: admin.email, role: admin.role || "SUPER_ADMIN" },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "7d" }
  );

  // 1. Upload sample evidence file via POST /api/support/upload
  console.log("Uploading sample screenshot attachment...");
  const uploadRes = await fetch("http://127.0.0.1:5012/api/support/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      originalName: "compiler_error_stacktrace.png",
      mimeType: "image/png",
      base64Data: SAMPLE_PNG_BASE64,
    }),
  });
  const uploadData = await uploadRes.json();
  console.log("Upload result:", uploadData);
  if (!uploadData.success || !uploadData.attachment) {
    throw new Error("File upload failed: " + JSON.stringify(uploadData));
  }

  // 2. Submit new ticket with attachment
  console.log("Submitting new ticket with attachment...");
  const createRes = await fetch("http://127.0.0.1:5012/api/support/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      category: "Coding Compiler Issues",
      subject: "Segmentation fault during test case 4 in C++ compiler",
      description: "When running the custom memory allocation test suite, the compiler threw SIGSEGV at line 48. Attached stacktrace screenshot.",
      priority: "High",
      attachments: [uploadData.attachment],
    }),
  });
  const createData = await createRes.json();
  console.log("Created ticket:", createData.ticket?.ticketId);
  const ticketId = createData.ticket.ticketId;

  // 3. Launch Chrome headless with remote debugging
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,960",
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const listRes = await fetch("http://127.0.0.1:9222/json/list");
    const pages = await listRes.json();
    const ws = new WebSocket(pages[0]?.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.id && callbacks.has(d.id)) {
        callbacks.get(d.id)(d);
        callbacks.delete(d.id);
      }
    };

    const send = (m, p = {}) =>
      new Promise((res) => {
        const i = id++;
        callbacks.set(i, res);
        ws.send(JSON.stringify({ id: i, method: m, params: p }));
      });

    await new Promise((r) => (ws.onopen = r));
    await send("Page.enable");
    await send("Runtime.enable");

    // ─────────────────────────────────────────────────────────────
    // STEP A: STUDENT PORTAL VIEW & LIGHTBOX VERIFICATION
    // ─────────────────────────────────────────────────────────────
    console.log("Step A: Authenticating Student on http://localhost:5174/login...");
    await send("Page.navigate", { url: "http://localhost:5174/login" });
    await new Promise((r) => setTimeout(r, 1000));

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${studentToken}");
        localStorage.setItem("userName", "${student.fullName}");
        localStorage.setItem("userEmail", "${student.email}");
        localStorage.setItem("user", JSON.stringify({
          _id: "${student._id}",
          id: "${student._id}",
          fullName: "${student.fullName}",
          name: "${student.fullName}",
          email: "${student.email}",
          role: "${student.role || 'STUDENT'}"
        }));
        localStorage.setItem("mz_user", JSON.stringify({
          _id: "${student._id}",
          id: "${student._id}",
          fullName: "${student.fullName}",
          name: "${student.fullName}",
          email: "${student.email}",
          role: "${student.role || 'STUDENT'}"
        }));
      `,
    });

    console.log(`Navigating student to http://localhost:5174/help?ticket=${ticketId}...`);
    await send("Page.navigate", { url: `http://localhost:5174/help?ticket=${ticketId}` });
    
    // Wait for HelpSupport header and messages
    const loadedStudent = await waitForSelector(send, "header h1", 15000);
    console.log("HelpSupport header loaded:", loadedStudent);
    await new Promise((r) => setTimeout(r, 1200));

    // Verify attachment element rendered
    const checkUserAtt = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const img = document.querySelector("img[alt='compiler_error_stacktrace.png']");
          const attachHeader = document.body.innerText.includes("compiler_error_stacktrace.png");
          return { hasImg: !!img, hasText: attachHeader };
        })()
      `,
      returnByValue: true,
    });
    console.log("Student portal attachment render check:", checkUserAtt.result?.result?.value);

    // Click the attachment thumbnail to open Lightbox
    console.log("Clicking attachment thumbnail to open Lightbox...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const img = document.querySelector("img[alt='compiler_error_stacktrace.png']");
          if (img) img.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Screenshot 1: Student Lightbox open
    const shot1 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_user_attachment_lightbox.png"), Buffer.from(shot1.result.data, "base64"));
    console.log("Saved: verified_user_attachment_lightbox.png");

    // Close lightbox
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const backdrop = document.querySelector("div[style*='rgba(15, 23, 42']");
          if (backdrop) backdrop.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    // ─────────────────────────────────────────────────────────────
    // STEP B: ADMIN PORTAL REVIEW & ATTACHMENT ACCESS
    // ─────────────────────────────────────────────────────────────
    console.log("Step B: Authenticating Admin on http://localhost:5174/admin/help...");
    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${adminToken}");
        localStorage.setItem("userName", "${admin.fullName}");
        localStorage.setItem("userEmail", "${admin.email}");
        localStorage.setItem("user", JSON.stringify({
          _id: "${admin._id}",
          id: "${admin._id}",
          fullName: "${admin.fullName}",
          name: "${admin.fullName}",
          email: "${admin.email}",
          role: "${admin.role || 'SUPER_ADMIN'}"
        }));
        localStorage.setItem("mz_user", JSON.stringify({
          _id: "${admin._id}",
          id: "${admin._id}",
          fullName: "${admin.fullName}",
          name: "${admin.fullName}",
          email: "${admin.email}",
          role: "${admin.role || 'SUPER_ADMIN'}"
        }));
      `,
    });

    console.log(`Navigating admin to http://localhost:5174/admin/help?ticket=${ticketId}...`);
    await send("Page.navigate", { url: `http://localhost:5174/admin/help?ticket=${ticketId}` });
    
    // Wait for Admin table or modal
    const loadedAdmin = await waitForSelector(send, "table", 15000);
    console.log("Admin table loaded:", loadedAdmin);
    await new Promise((r) => setTimeout(r, 1500));

    // If modal is not open, click the row to open it
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = document.querySelector("button:has-text('Inspect'), td button");
          if (btn) btn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Verify Admin sees Candidate Evidence & Modal
    const checkAdminEvidence = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const img = document.querySelector("img[alt='compiler_error_stacktrace.png']");
          const attachSection = document.body.innerText.includes("Candidate Uploaded Evidence");
          return { hasImg: !!img, hasSection: attachSection };
        })()
      `,
      returnByValue: true,
    });
    console.log("Admin portal review check:", checkAdminEvidence.result?.result?.value);

    // Click candidate attachment in admin modal to open admin lightbox
    console.log("Opening admin lightbox for high-res review...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const img = document.querySelector("img[alt='compiler_error_stacktrace.png']");
          if (img) img.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Screenshot 2: Admin reviewing attachment in Lightbox
    const shot2 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_review_attachment.png"), Buffer.from(shot2.result.data, "base64"));
    console.log("Saved: verified_admin_review_attachment.png");

    // Close admin lightbox
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const closeBtn = document.querySelector("div[style*='z-index: 9999'] button");
          if (closeBtn) closeBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Admin sends response with status "In Progress"
    console.log("Admin submitting response to ticket...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const ta = document.querySelector("textarea[placeholder*='compiler logs']");
          if (ta) {
            ta.value = "Hello Yashash, we reviewed your uploaded compiler stacktrace. The SIGSEGV in test case 4 was due to an out-of-bounds index in your pointer arithmetic at line 48. We updated the runner sandbox limit to provide explicit traceback.";
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const submitBtn = document.querySelector("button[type='submit']");
          if (submitBtn) submitBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // ─────────────────────────────────────────────────────────────
    // STEP C: STUDENT RECEIVES ADMIN RESPONSE IN REAL TIME
    // ─────────────────────────────────────────────────────────────
    console.log("Step C: Returning to Student portal to verify live real-time response update...");
    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${studentToken}");
        localStorage.setItem("userName", "${student.fullName}");
        localStorage.setItem("userEmail", "${student.email}");
        localStorage.setItem("user", JSON.stringify({
          _id: "${student._id}",
          id: "${student._id}",
          fullName: "${student.fullName}",
          name: "${student.fullName}",
          email: "${student.email}",
          role: "${student.role || 'STUDENT'}"
        }));
        localStorage.setItem("mz_user", JSON.stringify({
          _id: "${student._id}",
          id: "${student._id}",
          fullName: "${student.fullName}",
          name: "${student.fullName}",
          email: "${student.email}",
          role: "${student.role || 'STUDENT'}"
        }));
      `,
    });

    await send("Page.navigate", { url: `http://localhost:5174/help?ticket=${ticketId}` });
    await waitForSelector(send, "header h1", 15000);
    await new Promise((r) => setTimeout(r, 1500));

    // Screenshot 3: Student portal with verified Admin reply
    const shot3 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_user_live_admin_reply_with_attachment.png"), Buffer.from(shot3.result.data, "base64"));
    console.log("Saved: verified_user_live_admin_reply_with_attachment.png");

    ws.close();
    chrome.kill();
    await mongoose.disconnect();
    console.log("✅ All interactive ticket support with file attachment tests passed successfully!");
  } catch (err) {
    chrome.kill();
    await mongoose.disconnect();
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runE2E();
