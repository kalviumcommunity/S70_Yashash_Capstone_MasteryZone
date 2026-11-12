const { PROJECTS_PART_1 } = require("./projectsCatalogPart1");
const { PROJECTS_PART_2 } = require("./projectsCatalogPart2");

const PROJECTS_CATALOG = [...PROJECTS_PART_1, ...PROJECTS_PART_2].map((proj, index) => ({
  ...proj,
  orderIndex: index + 1,
  tasks: (proj.milestones || []).map((m) => m.title),
}));

const PROJECT_ID_ALIASES = {
  proj_algo_trading: "proj_trading_bot",
  proj_ecommerce_api: "proj_ecommerce_platform",
  proj_collab_canvas: "proj_realtime_chat",
  proj_task_queue: "proj_task_api",
};

function getProjectById(projectId) {
  if (!projectId) return null;
  const canonicalId = PROJECT_ID_ALIASES[projectId] || projectId;
  return PROJECTS_CATALOG.find((p) => p.id === canonicalId || p.id === projectId) || null;
}

function getPublicProjectSpec(project) {
  if (!project) return null;
  return {
    id: project.id,
    orderIndex: project.orderIndex,
    title: project.title,
    category: project.category,
    track: project.track,
    level: project.level,
    difficulty: project.difficulty,
    starterLanguage: project.starterLanguage,
    technologies: project.technologies || [],
    estimatedTime: project.estimatedTime || "5 Hours",
    xpReward: project.xpReward || 400,
    totalMarks: project.totalMarks || 100,
    passingMarks: project.passingMarks || 80,
    description: project.description,
    problemStatement: project.problemStatement,
    realWorldScenario: project.realWorldScenario,
    objectives: project.objectives || [],
    ioSpecification: project.ioSpecification || {},
    deliverables: project.deliverables || [],
    tasks: project.tasks || [],
    rubric: project.rubric || {
      functionalCorrectness: 40,
      testCaseExecution: 20,
      codeQualityAndStructure: 15,
      technicalRequirements: 15,
      errorHandlingAndEdgeCases: 10,
    },
    functionalRequirements: (project.functionalRequirements || []).map((fr) => ({
      id: fr.id,
      title: fr.title,
      description: fr.description,
      mandatory: fr.mandatory !== false,
    })),
    technicalRequirements: (project.technicalRequirements || []).map((tr) => ({
      id: tr.id,
      title: tr.title,
      constraint: tr.constraint,
      mandatory: tr.mandatory !== false,
    })),
    milestones: (project.milestones || []).map((m) => ({
      id: m.id,
      stepNumber: m.stepNumber,
      title: m.title,
      question: m.question,
      expectedFunctionality: m.expectedFunctionality,
      technicalConstraints: m.technicalConstraints,
      acceptanceCriteria: m.acceptanceCriteria,
      marksAllocated: m.marksAllocated,
      targetFile: m.targetFile,
    })),
    files: (project.files || []).map((f, idx) => ({
      id: `file_${idx}`,
      name: f.name,
      language: f.language || project.starterLanguage,
      content: f.content,
    })),
    solutionFiles: (project.solutionFiles || []).map((f, idx) => ({
      id: `file_${idx}`,
      name: f.name,
      language: f.language || project.starterLanguage,
      content: f.content,
    })),
    testCases: (project.testCases || []).map((tc, idx) => ({
      testIndex: idx + 1,
      name: tc.name,
      input: tc.isHidden ? "[Hidden Edge-Case Input]" : tc.input,
      expectedOutput: tc.isHidden ? "[Hidden Expected Output]" : tc.expectedOutput,
      isHidden: Boolean(tc.isHidden),
      isEdgeCase: Boolean(tc.isEdgeCase),
    })),
    totalTestCases: (project.testCases || []).length,
    visibleTestCasesCount: (project.testCases || []).filter((tc) => !tc.isHidden).length,
    hiddenTestCasesCount: (project.testCases || []).filter((tc) => tc.isHidden).length,
  };
}

module.exports = {
  PROJECTS_CATALOG,
  getProjectById,
  getPublicProjectSpec,
};
