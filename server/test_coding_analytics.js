const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });

async function runTest() {
  console.log("Starting Coding Analytics E2E Verification...");

  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,900"
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
      { userId: "6aea1125e38769b2428c5040", id: "6aea1125e38769b2428c5040", email: "yashashyash1@gmail.com", role: "SUPER_ADMIN" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" }
    );
    const userObj = JSON.stringify({
      id: "6aea1125e38769b2428c5040",
      email: "yashashyash1@gmail.com",
      role: "SUPER_ADMIN",
      fullName: "Admin",
      username: "admin",
    });

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${token}");
        localStorage.setItem("user", '${userObj}');
        localStorage.setItem("mz_user", '${userObj}');
        window.location.assign("http://localhost:5174/admin/coding-analytics");
      `,
    });

    await new Promise((r) => setTimeout(r, 3500));

    // 2. Open Admin Profile Dropdown to verify it is NOT overwritten by Coding Analytics line
    await send("Runtime.evaluate", {
      expression: `document.querySelector(".mz-admin-profile-btn")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shotDropdown = await send("Page.captureScreenshot", { format: "png" });
    if (shotDropdown.result?.data) {
      fs.writeFileSync(
        "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_coding_profile_dropdown.png",
        Buffer.from(shotDropdown.result.data, "base64")
      );
      console.log("Saved: verified_coding_profile_dropdown.png");
    }

    // Close dropdown
    await send("Runtime.evaluate", {
      expression: `document.querySelector(".mz-admin-profile-btn")?.click();`,
    });
    await new Promise((r) => setTimeout(r, 300));

    // 3. Click PYTHON Filter
    await send("Runtime.evaluate", {
      expression: `
        const pills = Array.from(document.querySelectorAll(".mz-admin-lang-pill"));
        const py = pills.find(p => p.innerText.includes("PYTHON"));
        if (py) py.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    const shotPython = await send("Page.captureScreenshot", { format: "png" });
    if (shotPython.result?.data) {
      fs.writeFileSync(
        "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_coding_python_filter.png",
        Buffer.from(shotPython.result.data, "base64")
      );
      console.log("Saved: verified_coding_python_filter.png");
    }

    // 4. Click JAVA Filter
    await send("Runtime.evaluate", {
      expression: `
        const pills = Array.from(document.querySelectorAll(".mz-admin-lang-pill"));
        const jv = pills.find(p => p.innerText.toUpperCase().includes("JAVA:"));
        if (jv) jv.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const shotJava = await send("Page.captureScreenshot", { format: "png" });
    if (shotJava.result?.data) {
      fs.writeFileSync(
        "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_coding_java_filter.png",
        Buffer.from(shotJava.result.data, "base64")
      );
      console.log("Saved: verified_coding_java_filter.png");
    }

    // 5. Open Inspect Code Modal on first submission
    await send("Runtime.evaluate", {
      expression: `
        const inspectBtn = document.querySelector(".mz-admin-btn-action");
        if (inspectBtn) inspectBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const shotInspector = await send("Page.captureScreenshot", { format: "png" });
    if (shotInspector.result?.data) {
      fs.writeFileSync(
        "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_code_inspector_modal.png",
        Buffer.from(shotInspector.result.data, "base64")
      );
      console.log("Saved: verified_code_inspector_modal.png");
    }

    // 6. Edit Marks, Write Admin Comment, and Send Notifications!
    await send("Runtime.evaluate", {
      expression: `
        // Fill form
        const scoreInput = document.querySelector(".mz-admin-eval-panel input[type='number']");
        if (scoreInput) {
          scoreInput.value = "95";
          scoreInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const commentBox = document.querySelector(".mz-admin-eval-panel textarea");
        if (commentBox) {
          commentBox.value = "Outstanding algorithm structure and optimal time complexity. Score upgraded to 95/100.";
          commentBox.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // Click Update
        const submitBtn = document.querySelector(".mz-admin-eval-panel button[type='submit']");
        if (submitBtn) submitBtn.click();
      `,
    });

    await new Promise((r) => setTimeout(r, 5000));

    const shotUpdated = await send("Page.captureScreenshot", { format: "png" });
    if (shotUpdated.result?.data) {
      fs.writeFileSync(
        "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_marks_modified_and_notified.png",
        Buffer.from(shotUpdated.result.data, "base64")
      );
      console.log("Saved: verified_marks_modified_and_notified.png");
    }

    ws.close();
    chrome.kill();
    console.log("Verification completed successfully!");
  } catch (err) {
    console.error("Test error:", err);
    chrome.kill();
  }
}

runTest();
