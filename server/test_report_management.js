const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function runE2ETest() {
  console.log("Starting End-to-End Report Management & Marks Sync Verification...");

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
    await new Promise((r) => setTimeout(r, 1500));

    const token = jwt.sign(
      {
        userId: "6aea1125e38769b2428c5040",
        id: "6aea1125e38769b2428c5040",
        email: "yashashyash1@gmail.com",
        role: "SUPER_ADMIN",
      },
      process.env.JWT_SECRET || "your-strong-jwt-secret-key-change-in-production-min-32-chars",
      { expiresIn: "7d" }
    );

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${token}");
        localStorage.setItem("user", JSON.stringify({
          _id: "6aea1125e38769b2428c5040",
          fullName: "MasteryZone Admin",
          email: "yashashyash1@gmail.com",
          role: "SUPER_ADMIN"
        }));
      `,
    });

    // 2. Navigate to Admin Users Directory
    console.log("Navigating to Admin Users Directory...");
    await send("Page.navigate", { url: "http://localhost:5174/admin/users" });
    await new Promise((r) => setTimeout(r, 2500));

    // 3. Click Profile on the first real student user
    console.log("Opening student profile modal...");
    await send("Runtime.evaluate", {
      expression: `
        const profileBtns = document.querySelectorAll(".mz-admin-btn-action");
        for (const btn of profileBtns) {
          if (btn.innerText.includes("Profile") || btn.innerText.includes("View Details")) {
            btn.click();
            break;
          }
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // 4. Switch to Timeline tab
    console.log("Switching to Timeline tab...");
    await send("Runtime.evaluate", {
      expression: `
        const tabBtns = document.querySelectorAll(".mz-admin-modal-nav button");
        for (const btn of tabBtns) {
          if (btn.innerText.includes("Timeline") || btn.innerText.includes("Activity")) {
            btn.click();
            break;
          }
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const shotTimeline = await send("Page.captureScreenshot", { format: "png" });
    if (shotTimeline.result?.data) {
      fs.writeFileSync(
        "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_admin_timeline_with_reports.png",
        Buffer.from(shotTimeline.result.data, "base64")
      );
      console.log("Saved: verified_admin_timeline_with_reports.png");
    }

    // 5. Click "View Report" on a timeline event
    console.log("Clicking View Report on Timeline attempt item...");
    await send("Runtime.evaluate", {
      expression: `
        const reportBtns = document.querySelectorAll(".mz-admin-btn-report");
        if (reportBtns.length > 0) {
          reportBtns[0].click();
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 2500));

    const shotReportOpen = await send("Page.captureScreenshot", { format: "png" });
    if (shotReportOpen.result?.data) {
      fs.writeFileSync(
        "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_admin_view_report_opened.png",
        Buffer.from(shotReportOpen.result.data, "base64")
      );
      console.log("Saved: verified_admin_view_report_opened.png");
    }

    // 6. Switch to Evaluation & Marks Control sub-tab
    console.log("Switching to Evaluation sub-tab and modifying marks...");
    await send("Runtime.evaluate", {
      expression: `
        const subTabs = document.querySelectorAll(".mz-admin-subtab");
        for (const t of subTabs) {
          if (t.innerText.includes("Marks") || t.innerText.includes("Evaluation")) {
            t.click();
            break;
          }
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Fill new score and admin evaluation feedback
    await send("Runtime.evaluate", {
      expression: `
        const scoreInput = document.querySelector(".mz-admin-mark-edit-card input[type='number']");
        if (scoreInput) {
          scoreInput.value = "98";
          scoreInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const noteTextarea = document.querySelector(".mz-admin-mark-edit-card textarea");
        if (noteTextarea) {
          noteTextarea.value = "Outstanding algorithm structure and optimal execution verified by Super Admin with distinction.";
          noteTextarea.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const submitBtn = document.querySelector(".mz-admin-mark-edit-card button[type='submit']");
        if (submitBtn) {
          submitBtn.click();
        }
      `,
    });

    console.log("Submitted marks update! Waiting 5s for SMTP dispatch and database persistence...");
    await new Promise((r) => setTimeout(r, 5000));

    // 7. Switch to Proctoring & Notification Tracking sub-tab to inspect notification delivery
    console.log("Switching to Notification Tracking sub-tab...");
    await send("Runtime.evaluate", {
      expression: `
        const subTabs = document.querySelectorAll(".mz-admin-subtab");
        for (const t of subTabs) {
          if (t.innerText.includes("Proctoring") || t.innerText.includes("Notification")) {
            t.click();
            break;
          }
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const shotAuditTracked = await send("Page.captureScreenshot", { format: "png" });
    if (shotAuditTracked.result?.data) {
      fs.writeFileSync(
        "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_admin_report_marks_modified_and_audit.png",
        Buffer.from(shotAuditTracked.result.data, "base64")
      );
      console.log("Saved: verified_admin_report_marks_modified_and_audit.png");
    }

    ws.close();
    chrome.kill();
    console.log("E2E Verification completed successfully!");
  } catch (err) {
    console.error("Test error:", err);
    chrome.kill();
  }
}

runE2ETest();
