const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");

console.log("================================================================================");
console.log("🔬 Mastery Zone: Universal TestCaseExecutionPanel Integration & State Verification");
console.log("================================================================================");

function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // 1. Component & Stylesheet Existence
  test("TestCaseExecutionPanel.jsx and TestCaseExecutionPanel.css exist", () => {
    const jsxPath = path.join(rootDir, "client/src/components/TestCaseExecutionPanel.jsx");
    const cssPath = path.join(rootDir, "client/src/components/TestCaseExecutionPanel.css");
    assert.ok(fs.existsSync(jsxPath), "TestCaseExecutionPanel.jsx must exist");
    assert.ok(fs.existsSync(cssPath), "TestCaseExecutionPanel.css must exist");
  });

  // 2. Component Structure and Prop Support
  test("TestCaseExecutionPanel supports Waiting, Running, Passed, and Failed states", () => {
    const jsxContent = fs.readFileSync(
      path.join(rootDir, "client/src/components/TestCaseExecutionPanel.jsx"),
      "utf8"
    );
    assert.ok(jsxContent.includes('"waiting"'), "Must define waiting state");
    assert.ok(jsxContent.includes('"running"'), "Must define running state");
    assert.ok(jsxContent.includes('"passed"'), "Must define passed state");
    assert.ok(jsxContent.includes('"failed"'), "Must define failed state");
    assert.ok(jsxContent.includes("isDark"), "Must support isDark prop for instant theme switching");
    assert.ok(jsxContent.includes("onUseStdin"), "Must support onUseStdin callback");
    assert.ok(jsxContent.includes("onRunTests"), "Must support onRunTests handler");
    assert.ok(jsxContent.includes("passThreshold"), "Must support configurable pass threshold");
    assert.ok(jsxContent.includes("navigator.clipboard"), "Must provide copy helpers for input/output");
  });

  // 3. CSS Animations & Theme Contrast
  test("TestCaseExecutionPanel.css defines keyframe animations and theme rules", () => {
    const cssContent = fs.readFileSync(
      path.join(rootDir, "client/src/components/TestCaseExecutionPanel.css"),
      "utf8"
    );
    assert.ok(cssContent.includes("@keyframes mz-tc-spin"), "Must define mz-tc-spin animation");
    assert.ok(cssContent.includes("@keyframes mz-tc-pulse"), "Must define mz-tc-pulse animation");
    assert.ok(cssContent.includes("@keyframes mz-tc-fade-in"), "Must define mz-tc-fade-in animation");
    assert.ok(cssContent.includes('[data-theme="dark"]'), "Must define data-theme dark overrides");
    assert.ok(cssContent.includes(".mz-tc-exec-panel.is-dark"), "Must define .mz-tc-exec-panel.is-dark rules");
    assert.ok(cssContent.includes(".mz-tc-exec-panel.is-light"), "Must define .mz-tc-exec-panel.is-light rules");
    assert.ok(cssContent.includes(".mz-tc-item.running"), "Must style running test case item");
    assert.ok(cssContent.includes(".mz-tc-item.passed"), "Must style passed test case item");
    assert.ok(cssContent.includes(".mz-tc-item.failed"), "Must style failed test case item");
  });

  // 4. MasteryZoneCompilerWorkspace Integration (Modules, Challenges, Certifications, Standalone)
  test("MasteryZoneCompilerWorkspace imports and uses TestCaseExecutionPanel", () => {
    const workspaceContent = fs.readFileSync(
      path.join(rootDir, "client/src/components/MasteryZoneCompilerWorkspace.jsx"),
      "utf8"
    );
    assert.ok(
      workspaceContent.includes('import TestCaseExecutionPanel from "./TestCaseExecutionPanel";'),
      "Workspace must import TestCaseExecutionPanel"
    );
    assert.ok(
      workspaceContent.includes("<TestCaseExecutionPanel"),
      "Workspace bottom panel must render <TestCaseExecutionPanel"
    );
    assert.ok(
      workspaceContent.includes("testCases={allTestCases}"),
      "Must bind real allTestCases state"
    );
    assert.ok(
      workspaceContent.includes("isRunning={isRunningTests}"),
      "Must bind real isRunningTests state"
    );
    assert.ok(
      !workspaceContent.includes("mz-compiler-running-detail-placeholder"),
      "Old fake radar placeholder must be completely removed"
    );
  });

  // 5. ProjectWorkspaceModal Integration (Projects Section)
  test("ProjectWorkspaceModal imports and uses TestCaseExecutionPanel", () => {
    const projectContent = fs.readFileSync(
      path.join(rootDir, "client/src/components/ProjectWorkspaceModal.jsx"),
      "utf8"
    );
    assert.ok(
      projectContent.includes('import TestCaseExecutionPanel from "./TestCaseExecutionPanel";'),
      "ProjectWorkspaceModal must import TestCaseExecutionPanel"
    );
    assert.ok(
      projectContent.includes("<TestCaseExecutionPanel"),
      "ProjectWorkspaceModal must render <TestCaseExecutionPanel"
    );
    assert.ok(
      projectContent.includes("testCases={effectiveTestCases}"),
      "Must pass real effectiveTestCases"
    );
    assert.ok(
      projectContent.includes("isRunning={isRunningTests}"),
      "Must pass real isRunningTests"
    );
    assert.ok(
      projectContent.includes("onRunTests={handleRunTests}"),
      "Must wire onRunTests to handleRunTests"
    );
  });

  // 6. MasteryZoneCompilerLive Integration (Live Platform)
  test("MasteryZoneCompilerLive imports and uses TestCaseExecutionPanel", () => {
    const liveContent = fs.readFileSync(
      path.join(rootDir, "client/src/components/MasteryZoneLive/MasteryZoneCompilerLive.jsx"),
      "utf8"
    );
    assert.ok(
      liveContent.includes('import TestCaseExecutionPanel from "../TestCaseExecutionPanel";'),
      "MasteryZoneCompilerLive must import TestCaseExecutionPanel"
    );
    assert.ok(
      liveContent.includes("<TestCaseExecutionPanel"),
      "Live compiler activeTab === run_tests must render <TestCaseExecutionPanel"
    );
    assert.ok(
      liveContent.includes("testCases={currentTestCases}"),
      "Must pass real currentTestCases"
    );
    assert.ok(
      liveContent.includes("isRunning={isRunningTests}"),
      "Must pass real isRunningTests"
    );
  });

  console.log("--------------------------------------------------------------------------------");
  console.log(`🎉 All ${passed}/${total} Universal Test Case Execution UI verification tests passed!`);
  console.log("================================================================================");
}

runTests();
