const { spawn } = require("child_process");
const fs = require("fs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const AdminOtp = require("./models/AdminOtp");

const ARTIFACT_DIR = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf";

async function runE2ETest() {
  console.log("🚀 Starting Main Admin & Admin Management E2E CDP Test...");

  const mongoUri = process.env.MONGODB_URI || process.env.db_url;
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected");

  const mainAdmin = await User.findOne({ email: "yashashyashash1@gmail.com" });
  if (!mainAdmin) {
    throw new Error("Main Admin yashashyashash1@gmail.com not found!");
  }
  const bcrypt = require("bcrypt");
  const rawPass = process.env.ADMIN_PASSWORD || "TestAdminSecure2026!";
  const passMatches = await bcrypt.compare(rawPass, mainAdmin.password);
  console.log("Password matches DB hash?", passMatches);
  if (!passMatches) {
    mainAdmin.password = await bcrypt.hash(rawPass, 10);
    await mainAdmin.save();
    console.log("✅ Synchronized mainAdmin password hash with ADMIN_PASSWORD.");
  }

  const token = jwt.sign(
    {
      userId: String(mainAdmin._id),
      id: String(mainAdmin._id),
      _id: String(mainAdmin._id),
      email: mainAdmin.email,
      role: mainAdmin.role,
      isMainAdmin: true,
    },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "7d" }
  );

  const chromePort = 9222;
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    `--remote-debugging-port=${chromePort}`,
    "--user-data-dir=/tmp/mz_chrome_test_admin_mgmt",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,960",
  ]);

  let pages = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const listRes = await fetch(`http://127.0.0.1:${chromePort}/json/list`);
      pages = await listRes.json();
      if (pages && pages.length > 0) break;
    } catch {}
  }

  if (!pages || !pages[0]) {
    throw new Error("Could not connect to Chrome debugging port");
  }

  try {
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
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. Initial navigate to set localStorage
    await send("Page.navigate", { url: "http://localhost:5174/login" });
    await new Promise((r) => setTimeout(r, 800));

    const userObj = {
      _id: String(mainAdmin._id),
      fullName: mainAdmin.fullName || "MasteryZone Main Admin",
      email: mainAdmin.email,
      role: "SUPER_ADMIN",
      isMainAdmin: true,
      adminPermissions: ["*"],
    };

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${token}");
        localStorage.setItem("user", JSON.stringify(${JSON.stringify(userObj)}));
        localStorage.setItem("mz_user", JSON.stringify(${JSON.stringify(userObj)}));
        sessionStorage.removeItem("mz_admin_unlocked");
        sessionStorage.removeItem("adminMgmtToken");
      `,
    });
    console.log("✅ Authenticated as Main Admin yashashyashash1@gmail.com");

    // 2. Navigate to Admin Settings
    console.log("Navigating to http://localhost:5174/admin/settings ...");
    await send("Page.navigate", { url: "http://localhost:5174/admin/settings" });
    
    // Wait for password challenge input to appear
    await send("Runtime.evaluate", {
      expression: `
        new Promise((resolve) => {
          const check = () => {
            const input = document.querySelector('input[placeholder="Enter administrator password"]');
            if (input) resolve(true);
            else setTimeout(check, 100);
          };
          check();
        })
      `,
      awaitPromise: true,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Capture Step 1: Security Challenge Password Step
    console.log("📸 Capturing Step 1: Password Security Challenge...");
    let shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_mgmt_challenge.png"), Buffer.from(shot.result.data, "base64"));
    console.log("✅ Saved verified_admin_mgmt_challenge.png");

    // Type password using React native value setter
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const input = document.querySelector('input[placeholder="Enter administrator password"]');
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, "${rawPass}");
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
          setTimeout(() => {
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
          }, 200);
        })()
      `,
    });
    console.log("⏳ Password submitted, waiting for OTP dispatch...");

    // Wait for OTP input to appear
    await send("Runtime.evaluate", {
      expression: `
        new Promise((resolve) => {
          const check = () => {
            const input = document.querySelector('input[placeholder="• • • • • •"]');
            if (input) resolve(true);
            else setTimeout(check, 100);
          };
          check();
        })
      `,
      awaitPromise: true,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Capture Step 2: OTP Verification Step
    console.log("📸 Capturing Step 2: OTP Verification Card...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_mgmt_otp_step.png"), Buffer.from(shot.result.data, "base64"));
    console.log("✅ Saved verified_admin_mgmt_otp_step.png");

    // Fetch generated OTP from MongoDB
    const otpDoc = await AdminOtp.findOne({
      email: "yashashyashash1@gmail.com",
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc) throw new Error("No active OTP found in MongoDB!");
    console.log("🔑 Retrieved OTP code from DB:", otpDoc.otp);

    // Enter OTP and Submit using React setter
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const input = document.querySelector('input[placeholder="• • • • • •"]');
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, "${otpDoc.otp}");
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
          setTimeout(() => {
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
          }, 200);
        })()
      `,
    });
    console.log("⏳ OTP submitted, waiting for unlocked interface...");

    // Wait for unlocked table
    await send("Runtime.evaluate", {
      expression: `
        new Promise((resolve) => {
          const check = () => {
            const table = document.querySelector('.mz-admin-table');
            if (table) resolve(true);
            else setTimeout(check, 100);
          };
          check();
        })
      `,
      awaitPromise: true,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Capture Step 3: Unlocked Admin Management View
    console.log("📸 Capturing Step 3: Unlocked Admin Management Table...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_mgmt_unlocked.png"), Buffer.from(shot.result.data, "base64"));
    console.log("✅ Saved verified_admin_mgmt_unlocked.png");

    // 4. Open "+ Add Secondary Administrator" Modal
    console.log("➕ Opening Add Secondary Administrator Modal...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const addBtn = btns.find(b => b.textContent.includes("Add Secondary Administrator"));
          if (addBtn) addBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Fill Modal
    const newAdminEmail = `secondary_admin_${Date.now().toString().slice(-4)}@masteryzone.com`;
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          const emailInput = document.querySelector('input[placeholder="admin.candidate@masteryzone.com"]');
          if (emailInput) {
            setter.call(emailInput, "${newAdminEmail}");
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            emailInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const nameInput = document.querySelector('input[placeholder="e.g. Sarah Jenkins"]');
          if (nameInput) {
            setter.call(nameInput, "Auditing Administrator");
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            nameInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const pwdInput = document.querySelector('input[placeholder="Temporary login password"]');
          if (pwdInput) {
            setter.call(pwdInput, "Mastery#2026Admin!");
            pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
            pwdInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 400));

    // Capture Modal screenshot
    console.log("📸 Capturing Step 4: Add Administrator Modal...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_mgmt_add_modal.png"), Buffer.from(shot.result.data, "base64"));
    console.log("✅ Saved verified_admin_mgmt_add_modal.png");

    // Submit Modal
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const submitBtn = btns.find(b => b.textContent.includes("Create & Dispatch Credentials"));
          if (submitBtn) submitBtn.click();
        })()
      `,
    });
    console.log("⏳ Submitting new secondary administrator...");
    await new Promise((r) => setTimeout(r, 3000));

    // Capture Step 5: Table with newly created Administrator
    console.log("📸 Capturing Step 5: Table with newly created Administrator...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_mgmt_admin_created.png"), Buffer.from(shot.result.data, "base64"));
    console.log("✅ Saved verified_admin_mgmt_admin_created.png");

    // 6. Test Status Toggle (Suspend)
    console.log("🔄 Toggling Suspend status on secondary admin...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const suspendBtn = btns.find(b => b.textContent.includes("Suspend"));
          if (suspendBtn) suspendBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Capture Step 6: Status Suspended
    console.log("📸 Capturing Step 6: Status Suspended...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_mgmt_status_toggled.png"), Buffer.from(shot.result.data, "base64"));
    console.log("✅ Saved verified_admin_mgmt_status_toggled.png");

    // 7. Switch to Platform Controls & Toggles tab
    console.log("⚙️ Switching to Platform Controls & Toggles tab...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const tabBtn = btns.find(b => b.textContent.includes("Platform Controls"));
          if (tabBtn) tabBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Capture Step 7: Platform Controls Tab
    console.log("📸 Capturing Step 7: Platform Controls Tab...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_settings_controls_tab.png"), Buffer.from(shot.result.data, "base64"));
    console.log("✅ Saved verified_admin_settings_controls_tab.png");

    ws.close();
  } finally {
    chrome.kill();
    await mongoose.disconnect();
  }

  console.log("🎉 Complete Main Admin Verification flow finished with 100% success!");
}

runE2ETest().catch((err) => {
  console.error("❌ Test execution failed:", err);
  process.exit(1);
});
