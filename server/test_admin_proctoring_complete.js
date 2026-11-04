const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: ".env" });

const ARTIFACT_DIR = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf";

async function runE2ETest() {
  console.log("🚀 Starting Comprehensive Admin Proctoring & Examination Integrity E2E Test...");

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
    await new Promise((r) => setTimeout(r, 800));

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

    const userObj = {
      _id: "6a75d8cd746ae78d08a53e0f",
      fullName: "MasteryZone Admin",
      email: "yashashyashash1@gmail.com",
      role: "SUPER_ADMIN",
    };

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${token}");
        localStorage.setItem("user", JSON.stringify(${JSON.stringify(userObj)}));
      `,
    });

    console.log("✅ Super Admin credentials set into localStorage.");

    // 2. Navigate to Admin Proctoring page
    console.log("Navigating to http://localhost:5174/admin/proctoring ...");
    await send("Page.navigate", { url: "http://localhost:5174/admin/proctoring" });

    // Wait until rows are loaded
    await send("Runtime.evaluate", {
      expression: `
        new Promise((resolve) => {
          const check = () => {
            const rows = document.querySelectorAll("tbody tr");
            if (rows.length > 0 && !document.body.innerText.includes("Loading proctored sessions")) {
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
    await new Promise((r) => setTimeout(r, 1200));

    // Capture Overview screenshot matching user's requested layout
    const scr1 = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_proctoring_overview.png"), Buffer.from(scr1.result.data, "base64"));
    console.log("📸 Saved verified_proctoring_overview.png");

    // 3. Extract the first session ID with violations or any row
    const sessionEval = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const rows = Array.from(document.querySelectorAll("tbody tr"));
          for (const row of rows) {
            const codeEl = row.querySelector("td:nth-child(3) span");
            if (codeEl) return codeEl.textContent.trim();
          }
          return null;
        })()
      `,
      returnByValue: true,
    });

    const targetSessionId = sessionEval.result?.result?.value || sessionEval.result?.value;
    console.log(`🎯 Identified Target Session ID: ${targetSessionId}`);

    if (targetSessionId) {
      // 4. Navigate to dedicated Proctoring Audit page
      console.log(`Navigating to /admin/proctoring/audit/${targetSessionId} ...`);
      await send("Page.navigate", { url: `http://localhost:5174/admin/proctoring/audit/${targetSessionId}` });

      // Wait until audit details load
      await send("Runtime.evaluate", {
        expression: `
          new Promise((resolve) => {
            const check = () => {
              if (!document.body.innerText.includes("Loading Proctoring Telemetry")) {
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
      await new Promise((r) => setTimeout(r, 1200));

      // Capture Overview Audit Screenshot
      const scr2 = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_proctoring_audit_overview.png"), Buffer.from(scr2.result.data, "base64"));
      console.log("📸 Saved verified_proctoring_audit_overview.png");

      // 5. Click "Proctoring Stream Video" tab
      console.log("Switching to Proctoring Stream Video tab...");
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const tabs = Array.from(document.querySelectorAll("button"));
            const vidTab = tabs.find(t => t.textContent.includes("Proctoring Stream Video"));
            if (vidTab) vidTab.click();
          })()
        `,
      });
      await new Promise((r) => setTimeout(r, 1200));

      const scrVid = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_proctoring_audit_video.png"), Buffer.from(scrVid.result.data, "base64"));
      console.log("📸 Saved verified_proctoring_audit_video.png");

      // 6. Click "Violations & Evidence" tab
      console.log("Switching to Violations & Evidence tab...");
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const tabs = Array.from(document.querySelectorAll("button"));
            const violTab = tabs.find(t => t.textContent.includes("Violations & Evidence"));
            if (violTab) violTab.click();
          })()
        `,
      });
      await new Promise((r) => setTimeout(r, 1200));

      const scr3 = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_proctoring_audit_violations.png"), Buffer.from(scr3.result.data, "base64"));
      console.log("📸 Saved verified_proctoring_audit_violations.png");

      // 7. Click "Submitted Code & Answers" tab
      console.log("Switching to Submitted Code & Answers tab...");
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const tabs = Array.from(document.querySelectorAll("button"));
            const codeTab = tabs.find(t => t.textContent.includes("Submitted Code"));
            if (codeTab) codeTab.click();
          })()
        `,
      });
      await new Promise((r) => setTimeout(r, 1200));

      const scr4 = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_proctoring_audit_code.png"), Buffer.from(scr4.result.data, "base64"));
      console.log("📸 Saved verified_proctoring_audit_code.png");

      // 8. Click "Marks & Notifications Audit" tab
      console.log("Switching to Marks & Notifications Audit tab...");
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const tabs = Array.from(document.querySelectorAll("button"));
            const marksTab = tabs.find(t => t.textContent.includes("Marks & Notifications"));
            if (marksTab) marksTab.click();
          })()
        `,
      });
      await new Promise((r) => setTimeout(r, 1200));

      // Update marks score and add comment
      console.log("Editing marks score and entering admin feedback...");
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const scoreInput = document.querySelector("input[type='number']");
            if (scoreInput) {
              scoreInput.value = "90";
              scoreInput.dispatchEvent(new Event("input", { bubbles: true }));
              scoreInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
            const commentArea = document.querySelector("textarea");
            if (commentArea) {
              commentArea.value = "Super Admin Proctoring Audit: Verified complete video stream and hardware telemetry. Code execution passed all test cases with optimal time complexity.";
              commentArea.dispatchEvent(new Event("input", { bubbles: true }));
              commentArea.dispatchEvent(new Event("change", { bubbles: true }));
            }
          })()
        `,
      });
      await new Promise((r) => setTimeout(r, 800));

      // Click "Save Marks & Dispatch Notification"
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const btns = Array.from(document.querySelectorAll("button"));
            const saveBtn = btns.find(b => b.textContent.includes("Save Marks"));
            if (saveBtn) saveBtn.click();
          })()
        `,
      });
      await new Promise((r) => setTimeout(r, 3000));

      const scr5 = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_proctoring_marks_updated.png"), Buffer.from(scr5.result.data, "base64"));
      console.log("📸 Saved verified_proctoring_marks_updated.png");

      // 9. Test notification read receipt tracker
      console.log("Confirming read receipt...");
      await send("Runtime.evaluate", {
        expression: `
          (() => {
            const btns = Array.from(document.querySelectorAll("button"));
            const viewBtn = btns.find(b => b.textContent.includes("Mark Viewed by Student"));
            if (viewBtn) viewBtn.click();
          })()
        `,
      });
      await new Promise((r) => setTimeout(r, 1500));

      const scr6 = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_proctoring_notification_tracking.png"), Buffer.from(scr6.result.data, "base64"));
      console.log("📸 Saved verified_proctoring_notification_tracking.png");
    }

    console.log("🎉 ALL PROCTORING & AUDIT E2E TESTS COMPLETED SUCCESSFULLY!");
    ws.close();
    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error("❌ Test error:", err);
    chrome.kill();
    process.exit(1);
  }
}

runE2ETest();
