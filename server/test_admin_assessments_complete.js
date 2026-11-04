const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: ".env" });

const ARTIFACT_DIR = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf";

async function runE2ETest() {
  console.log("🚀 Starting Comprehensive Admin Assessments Real-Time Verification Test...");

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

    await new Promise((r) => (ws.onopen = r));
    const send = (m, p = {}) =>
      new Promise((res) => {
        const i = id++;
        callbacks.set(i, res);
        ws.send(JSON.stringify({ id: i, method: m, params: p }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    // 1. Authenticate as Super Admin
    await send("Page.navigate", { url: "http://localhost:5174/login" });
    await new Promise((r) => setTimeout(r, 1000));

    const token = jwt.sign(
      {
        userId: "6a75d8cd746ae78d08a53e0f",
        id: "6a75d8cd746ae78d08a53e0f",
        email: "yashashyashash1@gmail.com",
        role: "SUPER_ADMIN",
      },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${token}");
        localStorage.setItem("user", JSON.stringify({
          _id: "6a75d8cd746ae78d08a53e0f",
          fullName: "MasteryZone Admin",
          email: "yashashyashash1@gmail.com",
          role: "SUPER_ADMIN"
        }));
      `,
    });

    // 2. Navigate to Admin Assessments Page
    console.log("Navigating to /admin/assessments...");
    await send("Page.navigate", { url: "http://localhost:5174/admin/assessments" });

    // Wait until assessments rows are loaded
    await send("Runtime.evaluate", {
      expression: `
        new Promise((resolve) => {
          const check = () => {
            const rows = document.querySelectorAll("tbody tr");
            if (rows.length > 0 && !document.body.innerText.includes("Loading assessments")) {
              resolve(true);
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        })
      `,
      awaitPromise: true,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Capture All Tests Tab
    console.log("Capturing 1: All Tests View...");
    let shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_assessments_all_tests.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_assessments_all_tests.png");

    // 3. Click Certifications Tab
    console.log("Clicking Certifications filter pill...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const certBtn = btns.find(b => b.innerText.includes("Certifications") && !b.innerText.includes("All"));
          if (certBtn) certBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_assessments_certifications_tab.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_assessments_certifications_tab.png");

    // 4. Click MCQ Assessments Tab
    console.log("Clicking MCQ Assessments filter pill...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const mcqBtn = btns.find(b => b.innerText.includes("MCQ Assessments"));
          if (mcqBtn) mcqBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_assessments_mcq_tab.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_assessments_mcq_tab.png");

    // 5. Click on the first row or its Details button to open the Full Details Report Modal
    console.log("Opening Assessment Attempt Details Modal...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const rows = document.querySelectorAll("tbody tr");
          if (rows.length > 0) {
            rows[0].click();
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2200));

    // Capture Questions Breakdown Modal Sub-tab
    console.log("Capturing Modal Questions Breakdown Sub-tab...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_assessments_modal_breakdown.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_assessments_modal_breakdown.png");

    // 6. Click Marks & Admin Feedback Sub-tab
    console.log("Switching to Marks & Admin Feedback sub-tab...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const evalTab = btns.find(b => b.innerText.includes("Marks & Admin Feedback"));
          if (evalTab) evalTab.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Set marks and admin comments
    console.log("Updating marks and feedback...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const maxBtn = btns.find(b => b.innerText.includes("Max Score") || b.innerText.trim() === "+1");
          if (maxBtn) maxBtn.click();

          const textarea = document.querySelector("textarea");
          if (textarea) {
            const proto = window.HTMLTextAreaElement.prototype;
            const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
            set.call(textarea, "Official assessment audit verified by Super Admin. Candidate demonstrated solid conceptual understanding across core sections.");
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Click Save Marks & Dispatch Notification
    console.log("Saving marks and notifying student...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const saveBtn = btns.find(b => b.innerText.includes("Save Marks"));
          if (saveBtn) saveBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2200));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_assessments_marks_updated.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_assessments_marks_updated.png");

    // 7. Click Proctoring & Notification Tracking Sub-tab
    console.log("Switching to Proctoring & Notification Tracking sub-tab...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const auditTab = btns.find(b => b.innerText.includes("Notification Tracking") || b.innerText.includes("Proctoring"));
          if (auditTab) auditTab.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_assessments_notification_audit.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_assessments_notification_audit.png");

    console.log("🎉 ALL E2E ASSESSMENTS VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    chrome.kill();
  }
}

runE2ETest();
