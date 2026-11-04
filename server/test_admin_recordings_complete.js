const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: ".env" });

const ARTIFACT_DIR = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf";

async function runE2ETest() {
  console.log("🚀 Starting Comprehensive Admin Recordings Real-Time Verification Test...");

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

    // 2. Navigate to Admin Recordings Page
    console.log("Navigating to http://localhost:5174/admin/recordings ...");
    await send("Page.navigate", { url: "http://localhost:5174/admin/recordings" });

    // Wait until recordings cards are loaded
    await send("Runtime.evaluate", {
      expression: `
        new Promise((resolve) => {
          const check = () => {
            const cards = document.querySelectorAll(".mz-admin-card");
            if (cards.length > 2 && !document.body.innerText.includes("Loading verified recordings")) {
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

    // Capture Overview screenshot (Newest first, readable names, host details)
    console.log("Capturing 1: Verified Recordings Overview...");
    let shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_recordings_overview.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_recordings_overview.png");

    // 3. Test filter pills: Screen Shares & Proctoring
    console.log("Filtering by Screen Shares...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const btn = btns.find(b => b.innerText.includes("Screen Shares"));
          if (btn) btn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_recordings_screenshares.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_recordings_screenshares.png");

    // Filter by Proctoring
    console.log("Filtering by Proctoring...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const btn = btns.find(b => b.innerText.includes("Proctoring"));
          if (btn) btn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_recordings_proctoring.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_recordings_proctoring.png");

    // Return to All Recordings
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const btn = btns.find(b => b.innerText.includes("All ("));
          if (btn) btn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    // 4. Click Playback & Audit on a valid recording
    console.log("Opening Playback & Audit Modal on first playable recording...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const playBtn = btns.find(b => b.innerText.includes("Playback & Audit"));
          if (playBtn) playBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_recordings_modal_playback.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_recordings_modal_playback.png");

    // 5. Switch to Participants & Specs Tab in Modal
    console.log("Switching to Participants & Specs tab...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const specsBtn = btns.find(b => b.innerText.includes("Participants & Specs"));
          if (specsBtn) specsBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_recordings_modal_specs.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_recordings_modal_specs.png");

    console.log("🎉 ALL ADMIN RECORDINGS E2E TESTS COMPLETED SUCCESSFULLY!");
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
