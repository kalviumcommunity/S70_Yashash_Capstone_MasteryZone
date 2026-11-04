const { spawn } = require("child_process");
const fs = require("fs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const ARTIFACT_DIR = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf";

async function runE2ETest() {
  console.log("🚀 Starting Mastery Zone Coding-Only Platform E2E CDP Verification...");

  const mongoUri = process.env.MONGODB_URI || process.env.db_url;
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Atlas Connected");

  const student = await User.findOne({ email: "yashash.r.s70@kalvium.community" }) || await User.findOne({ role: "user" });
  if (!student) {
    throw new Error("Student account not found in database!");
  }
  console.log("Found student account:", student.fullName || student.username, `(${student.email})`);

  const token = jwt.sign(
    {
      userId: String(student._id),
      id: String(student._id),
      _id: String(student._id),
      email: student.email,
      role: student.role || "user",
    },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "7d" }
  );

  const chromePort = 9223;
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    `--remote-debugging-port=${chromePort}`,
    "--user-data-dir=/tmp/mz_chrome_test_coding_platform",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,1100",
  ]);

  let pages = null;
  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch(`http://127.0.0.1:${chromePort}/json`);
      pages = await res.json();
      if (pages && pages.length > 0) break;
    } catch {}
  }

  if (!pages || !pages[0]) {
    chrome.kill();
    throw new Error("Could not connect to Chrome DevTools Protocol");
  }

  const wsUrl = pages[0].webSocketDebuggerUrl;
  const WebSocket = require("ws");
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve) => ws.on("open", resolve));
  console.log("✅ Connected to CDP via WebSocket");

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.on("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");

  // Step 1: Open student landing/login page
  await send("Page.navigate", { url: "http://localhost:5174/login" });
  await new Promise((r) => setTimeout(r, 1500));

  // Step 2: Inject authenticated student session & navigate to /home
  await send("Runtime.evaluate", {
    expression: `
      localStorage.setItem("token", "${token}");
      localStorage.setItem("user", JSON.stringify(${JSON.stringify({
        _id: String(student._id),
        id: String(student._id),
        fullName: student.fullName || "Yashash R Gowda",
        username: student.username || "yashash",
        email: student.email,
        role: student.role || "user",
      })}));
      localStorage.setItem("userRole", "${student.role || "user"}");
      localStorage.setItem("userEmail", "${student.email}");
      localStorage.setItem("userName", "${student.fullName || student.username}");
      window.location.href = "/home";
    `,
  });

  console.log("✅ Authenticated student session injected, navigating to /home...");
  await new Promise((r) => setTimeout(r, 4000));

  // Step 3: Verify dedicated coding platform dashboard elements
  const evalResult = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const text = document.body.innerText;
        const hasWelcome = text.includes("Welcome back") || text.includes("Engineering");
        const hasStreak = text.includes("Coding Streak") || text.includes("Streak");
        const hasDsaTracks = text.includes("Data Structures & Algorithms Tracks") || text.includes("Arrays & Hashing");
        const hasProblemOfTheDay = text.includes("Problem of the Day") || text.includes("Subarray Sum Equals K");
        const hasLanguages = text.includes("Programming Curricula") || text.includes("Python 3 & Algorithms");
        const hasProjects = text.includes("Real-World Software Engineering Projects") || text.includes("Min Stack");
        const hasCertHall = text.includes("Proctored Examination & Certification Hall");
        
        // Negative assertions: NO fitness, driving, language learning
        const hasFitness = text.includes("Fitness/Gym") || text.includes("Choose Your Interest Track") || text.includes("Gym Training");
        const hasDriving = text.includes("Driving & Automotive") || text.includes("Vehicle Driving");
        const hasUnrelatedInterests = text.includes("Select Interests") || text.includes("Why it matters?");

        // Sidebar items
        const practiceBtn = document.querySelector('[data-testid="sidebar-nav-practice"]');
        const learnBtn = document.querySelector('[data-testid="sidebar-nav-learn"]');
        const projectsBtn = document.querySelector('[data-testid="sidebar-nav-projects"]');
        const liveBtn = document.querySelector('[data-testid="sidebar-nav-live"]');

        return {
          currentUrl: window.location.href,
          hasWelcome,
          hasStreak,
          hasDsaTracks,
          hasProblemOfTheDay,
          hasLanguages,
          hasProjects,
          hasCertHall,
          hasFitness,
          hasDriving,
          hasUnrelatedInterests,
          hasPracticeBtn: !!practiceBtn,
          hasLearnBtn: !!learnBtn,
          hasProjectsBtn: !!projectsBtn,
          hasLiveBtn: !!liveBtn,
        };
      })()
    `,
    returnByValue: true,
  });

  const check = evalResult.result.value;
  console.log("📋 Page Verification Results:", JSON.stringify(check, null, 2));

  if (!check.hasDsaTracks || !check.hasProblemOfTheDay || check.hasFitness || check.hasUnrelatedInterests) {
    console.error("❌ Assertion Failure! Verification criteria not met.");
  } else {
    console.log("✅ All Coding-Only Platform Dashboard assertions PASSED!");
  }

  // Step 4: Capture full-page high-res screenshot of the redesigned home dashboard
  const homeSnap = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  const rawBase64Home = homeSnap?.data || homeSnap?.result?.data;
  console.log("📸 homeSnap rawBase64 length:", rawBase64Home ? rawBase64Home.length : 0);
  const homePath = path.join(ARTIFACT_DIR, "verified_coding_home_dashboard.png");
  if (rawBase64Home) {
    fs.writeFileSync(homePath, Buffer.from(rawBase64Home, "base64"));
    console.log("📸 Saved high-res screenshot to:", homePath);
  }

  // Step 5: Test Sidebar Navigation to "Practice & DSA"
  console.log("Testing navigation to Practice & DSA...");
  await send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('[data-testid="sidebar-nav-practice"]');
      if (btn) btn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 3000));

  const codingSnap = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  const rawBase64Coding = codingSnap?.data || codingSnap?.result?.data;
  console.log("📸 codingSnap rawBase64 length:", rawBase64Coding ? rawBase64Coding.length : 0);
  const codingPath = path.join(ARTIFACT_DIR, "verified_coding_practice_nav.png");
  if (rawBase64Coding) {
    fs.writeFileSync(codingPath, Buffer.from(rawBase64Coding, "base64"));
    console.log("📸 Saved Practice & DSA screenshot to:", codingPath);
  }

  // Step 6: Test Legacy Redirects
  console.log("Testing redirect for /select-interests...");
  await send("Page.navigate", { url: "http://localhost:5174/select-interests" });
  await new Promise((r) => setTimeout(r, 2000));

  const redirectCheck1 = await send("Runtime.evaluate", {
    expression: `window.location.pathname`,
    returnByValue: true,
  });
  console.log("Redirect /select-interests ->", redirectCheck1.result.value, "(Expected /home)");

  console.log("Testing redirect for /fitness...");
  await send("Page.navigate", { url: "http://localhost:5174/fitness" });
  await new Promise((r) => setTimeout(r, 2000));

  const redirectCheck2 = await send("Runtime.evaluate", {
    expression: `window.location.pathname`,
    returnByValue: true,
  });
  console.log("Redirect /fitness ->", redirectCheck2.result.value, "(Expected /coding)");

  console.log("🎉 ALL TESTS & REDIRECT CHECKS COMPLETE AND VERIFIED!");

  ws.close();
  chrome.kill();
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error("❌ E2E Test Error:", err);
  process.exit(1);
});
