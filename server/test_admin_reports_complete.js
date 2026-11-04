const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: ".env" });

const ARTIFACT_DIR = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf";

async function runE2ETest() {
  console.log("🚀 Starting Comprehensive Admin Reports Real-Time Verification Test...");

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

    // 2. Navigate to Centralized Reports Management
    console.log("Navigating to /admin/reports...");
    await send("Page.navigate", { url: "http://localhost:5174/admin/reports" });

    // Wait until table rows are fully populated
    await send("Runtime.evaluate", {
      expression: `
        new Promise((resolve) => {
          const check = () => {
            const rows = document.querySelectorAll("tbody tr");
            if (rows.length > 0 && !document.body.innerText.includes("Loading verified")) {
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
    await new Promise((r) => setTimeout(r, 600));

    // Capture All Reports tab
    console.log("Capturing 1: All Reports Tab...");
    let shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_reports_all_tab.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_reports_all_tab.png");

    // 3. Click "Certification Report" filter tab
    console.log("Clicking Certification Report filter tab...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const certBtn = btns.find(b => b.innerText.includes("Certification Report") && !b.innerText.includes("All"));
          if (certBtn) certBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_reports_cert_tab.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_reports_cert_tab.png");

    // 4. Click "Assessment Report" filter tab
    console.log("Clicking Assessment Report filter tab...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const assessBtn = btns.find(b => b.innerText.trim().startsWith("Assessment Report"));
          if (assessBtn) assessBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_reports_assessment_tab.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_reports_assessment_tab.png");

    // 5. Click "MCQ Assessment Report — 10 Marks" filter tab
    console.log("Clicking MCQ Assessment Report — 10 Marks filter tab...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const mcqBtn = btns.find(b => b.innerText.includes("MCQ Assessment Report"));
          if (mcqBtn) mcqBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_reports_mcq_tab.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_reports_mcq_tab.png");

    // 6. Click on the first MCQ row to open the detailed modal
    console.log("Clicking first MCQ row to inspect report...");
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
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Questions Breakdown Modal
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_reports_mcq_modal_questions.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_reports_mcq_modal_questions.png");

    // 7. Click on "Marks & Admin Feedback" sub-tab inside the modal
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
    await new Promise((r) => setTimeout(r, 800));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_reports_marks_updated.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_reports_marks_updated.png");

    // 8. Click on "Proctoring & Notification Tracking" sub-tab inside the modal
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
    await new Promise((r) => setTimeout(r, 800));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_reports_notification_tracking.png"), Buffer.from(shot.result.data, "base64"));
    console.log("Saved verified_reports_notification_tracking.png");

    console.log("🎉 ALL E2E REPORTS MANAGEMENT SCREENSHOTS UPDATED PERFECTLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    chrome.kill();
  }
}

runE2ETest();
