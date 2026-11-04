const { spawn } = require("child_process");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });

async function run() {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,900"
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch("http://127.0.0.1:9222/json/list");
    const pages = await listRes.json();
    const targetWs = pages[0]?.webSocketDebuggerUrl;

    if (!targetWs) {
      console.log("No websocket URL found");
      chrome.kill();
      return;
    }

    const ws = new WebSocket(targetWs);
    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.method === "Runtime.consoleAPICalled") {
        console.log("CHROME CONSOLE:", data.params.type, data.params.args.map(a => a.value || a.description).join(" "));
      }
      if (data.method === "Network.responseReceived") {
        if (data.params.response.url.includes("/api/admin/overview")) {
          console.log("OVERVIEW RESPONSE STATUS:", data.params.response.status);
        }
      }
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data);
        callbacks.delete(data.id);
      }
    };

    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send("Page.enable");
    await send("Runtime.enable");

    // Navigate to root to set localStorage
    await send("Page.navigate", { url: "http://localhost:5174/login" });
    await new Promise(r => setTimeout(r, 1500));

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
      username: "admin"
    });

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("token", "${token}");
        localStorage.setItem("user", '${userObj}');
        localStorage.setItem("mz_user", '${userObj}');
      `
    });

    // Now navigate to overview
    await send("Page.navigate", { url: "http://localhost:5174/admin/overview" });
    await new Promise(r => setTimeout(r, 2500));

    // Capture screenshot top view
    const shotTop = await send("Page.captureScreenshot", { format: "png" });
    if (shotTop.result?.data) {
      const buf = Buffer.from(shotTop.result.data, "base64");
      const outTop = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_admin_overview_perfect.png";
      fs.writeFileSync(outTop, buf);
      console.log("Top screenshot saved to", outTop);
    }

    // Scroll down and capture bottom view
    await send("Runtime.evaluate", {
      expression: `window.scrollTo(0, 420);`
    });
    await new Promise(r => setTimeout(r, 800));

    const shotBottom = await send("Page.captureScreenshot", { format: "png" });
    if (shotBottom.result?.data) {
      const buf = Buffer.from(shotBottom.result.data, "base64");
      const outBottom = "/Users/yashashrgowda/.gemini/antigravity/brain/b56fa6e1-ad05-4ade-aa3d-1c560c607ecf/verified_admin_overview_bottom.png";
      fs.writeFileSync(outBottom, buf);
      console.log("Bottom screenshot saved to", outBottom);
    }

    ws.close();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    chrome.kill();
  }
}

run();
