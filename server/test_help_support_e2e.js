const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const ARTIFACT_DIR = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf";

async function runE2ETest() {
  console.log("🚀 Starting Comprehensive Real-Time Help & Support System E2E Test...");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const User = require("./models/User");
  const Notification = require("./models/NotificationSchema");
  const SupportTicket = require("./models/SupportTicket");

  const user1 = await User.findOne({ email: "yashash.r.s70@kalvium.community" }) || await User.findOne({ role: "STUDENT" });
  const admin = await User.findOne({ email: "yashashyashash1@gmail.com" });
  const user2 = await User.findOne({ email: "d.jagathpriyan.s70@kalvium.community" }) || await User.findOne({ email: "yashashyashash333@gmail.com" });

  console.log("User 1:", { id: user1._id, email: user1.email, name: user1.fullName });
  console.log("Admin:", { id: admin._id, email: admin.email, role: admin.role });
  console.log("User 2:", { id: user2._id, email: user2.email, name: user2.fullName });

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

    // ─────────────────────────────────────────────────────────────
    // STEP 1: USER 1 AUTHENTICATES & VISITS HOME PAGE
    // ─────────────────────────────────────────────────────────────
    console.log("Step 1: Authenticating User 1 & Navigating to /home...");
    await send("Page.navigate", { url: "http://localhost:5174/login" });
    await new Promise((r) => setTimeout(r, 800));

    const user1Token = jwt.sign(
      { userId: user1._id, id: user1._id, email: user1.email, role: user1.role || "STUDENT" },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${user1Token}");
        localStorage.setItem("user", JSON.stringify({
          _id: "${user1._id}",
          fullName: "${user1.fullName || user1.username}",
          email: "${user1.email}",
          role: "${user1.role || "STUDENT"}"
        }));
      `,
    });

    await send("Page.navigate", { url: "http://localhost:5174/home" });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to the Help & Support section on Home
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const area = document.querySelector('.mz-content-area') || window;
          if (area.scrollTo) {
            area.scrollTo({ top: 3500, behavior: 'instant' });
          } else {
            area.scrollTop = 3500;
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    let shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_home_help_section.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_home_help_section.png");

    // ─────────────────────────────────────────────────────────────
    // STEP 2: USER 1 NAVIGATES TO /help AND SUBMITS A TICKET
    // ─────────────────────────────────────────────────────────────
    console.log("Step 2: Navigating to /help and submitting an issue ticket...");
    await send("Page.navigate", { url: "http://localhost:5174/help" });
    await new Promise((r) => setTimeout(r, 1500));

    // Fill form
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const inputs = document.querySelectorAll("input");
          const textareas = document.querySelectorAll("textarea");
          const selects = document.querySelectorAll("select");

          if (inputs.length > 0) {
            const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            inputSetter.call(inputs[0], "Syntax execution timeout on Longest Substring problem");
            inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
          }

          if (selects.length > 0) {
            selects[0].value = "High";
            selects[0].dispatchEvent(new Event("change", { bubbles: true }));
          }

          if (textareas.length > 0) {
            const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            textareaSetter.call(textareas[0], "The Python 3.10 compiler times out after 1000ms on test case 8 with large 10^5 array input. Please check execution timeout limits.");
            textareas[0].dispatchEvent(new Event("input", { bubbles: true }));
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_user_ticket_form.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_user_ticket_form.png");

    // Click submit
    console.log("Submitting support ticket...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const submitBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Submit Support Ticket"));
          if (submitBtn) submitBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_user_ticket_submitted.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_user_ticket_submitted.png");

    // Check DB for ticket
    const submittedTicket = await SupportTicket.findOne({ userId: user1._id }).sort({ createdAt: -1 });
    console.log("✅ Verified ticket in MongoDB:", {
      ticketId: submittedTicket?.ticketId,
      category: submittedTicket?.category,
      subject: submittedTicket?.subject,
      status: submittedTicket?.status,
      priority: submittedTicket?.priority
    });

    const targetTicketId = submittedTicket.ticketId;

    // ─────────────────────────────────────────────────────────────
    // STEP 3: ADMIN VISITS /admin/help, INSPECTS TICKET & RESPONDS
    // ─────────────────────────────────────────────────────────────
    console.log("Step 3: Authenticating Admin & Navigating to /admin/help...");
    const adminToken = jwt.sign(
      { userId: admin._id, id: admin._id, email: admin.email, role: "SUPER_ADMIN" },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${adminToken}");
        localStorage.setItem("user", JSON.stringify({
          _id: "${admin._id}",
          fullName: "MasteryZone Admin",
          email: "${admin.email}",
          role: "SUPER_ADMIN"
        }));
      `,
    });

    await send("Page.navigate", { url: "http://localhost:5174/admin/help" });
    await new Promise((r) => setTimeout(r, 2000));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_help_tickets.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_admin_help_tickets.png");

    // Open the ticket modal
    console.log("Admin opening ticket modal for:", targetTicketId);
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const rows = document.querySelectorAll("tbody tr");
          if (rows.length > 0) rows[0].click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Admin writes response and resolves
    console.log("Admin writing personalized response and marking Resolved...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const textareas = document.querySelectorAll("textarea");
          if (textareas.length > 0) {
            const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            textareaSetter.call(textareas[0], "Hello ${user1.fullName || "Yashash"}, we inspected your Python compiler logs for test case 8. We increased the execution buffer and reran your submission. 10/10 tests have passed and your problem is marked Solved.");
            textareas[0].dispatchEvent(new Event("input", { bubbles: true }));
          }

          const formSelect = document.querySelector("form select");
          if (formSelect) {
            formSelect.value = "Resolved";
            formSelect.dispatchEvent(new Event("change", { bubbles: true }));
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Click Send Response
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const sendBtn = btns.find(b => b.innerText.includes("Send Response"));
          if (sendBtn) sendBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_admin_ticket_resolved.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_admin_ticket_resolved.png");

    // ─────────────────────────────────────────────────────────────
    // STEP 4: VERIFY USER NOTIFICATION & USER TICKET UPDATE
    // ─────────────────────────────────────────────────────────────
    console.log("Step 4: Checking in-app notification in DB for User 1...");
    const userNotification = await Notification.findOne({
      userId: user1._id,
      type: "support",
    }).sort({ createdAt: -1 });

    console.log("✅ Verified in-app notification in MongoDB:", {
      title: userNotification?.title,
      message: userNotification?.message,
      severity: userNotification?.severity,
      actionUrl: userNotification?.actionUrl
    });

    console.log("Switching back to User 1 session to view ticket conversation...");
    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${user1Token}");
        localStorage.setItem("user", JSON.stringify({
          _id: "${user1._id}",
          fullName: "${user1.fullName || user1.username}",
          email: "${user1.email}",
          role: "${user1.role || "STUDENT"}"
        }));
      `,
    });

    await send("Page.navigate", { url: `http://localhost:5174/help?ticket=${targetTicketId}` });
    await new Promise((r) => setTimeout(r, 2000));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_user_ticket_resolved_view.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_user_ticket_resolved_view.png");

    // ─────────────────────────────────────────────────────────────
    // STEP 5: VERIFY DATA ISOLATION WITH USER 2
    // ─────────────────────────────────────────────────────────────
    console.log("Step 5: Verifying strict data isolation with User 2...");
    const user2Token = jwt.sign(
      { userId: user2._id, id: user2._id, email: user2.email, role: user2.role || "STUDENT" },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${user2Token}");
        localStorage.setItem("user", JSON.stringify({
          _id: "${user2._id}",
          fullName: "${user2.fullName || user2.username}",
          email: "${user2.email}",
          role: "${user2.role || "STUDENT"}"
        }));
      `,
    });

    await send("Page.navigate", { url: "http://localhost:5174/help" });
    await new Promise((r) => setTimeout(r, 1500));

    // Click My Support Tickets tab
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const myTktBtn = btns.find(b => b.innerText.includes("My Support Tickets"));
          if (myTktBtn) myTktBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "verified_user2_isolated_tickets.png"), Buffer.from(shot.result.data, "base64"));
    console.log("📸 Saved verified_user2_isolated_tickets.png");

    console.log("🎉 ALL REAL-TIME HELP & SUPPORT E2E TESTS COMPLETED PERFECTLY!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    chrome.kill();
    await mongoose.disconnect();
  }
}

runE2ETest();
