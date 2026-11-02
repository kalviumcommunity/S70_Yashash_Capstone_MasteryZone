// Unified Curriculum Registry for Mastery Zone
// Supports all 4 primary disciplines: Coding, Languages, Driving/Vehicles, and Gym/Fitness.

const { CURRICULUM: codingCurriculum } = require("./codingCurriculum");
const { LANGUAGE_CURRICULUM: languageCurriculum } = require("./languageCurriculum");
const { DRIVING_CURRICULUM: drivingCurriculum } = require("./drivingCurriculum");
const { FITNESS_CURRICULUM: fitnessCurriculum } = require("./fitnessCurriculum");

const ALL_CURRICULA = {
  coding: codingCurriculum,
  language: languageCurriculum,
  driving: drivingCurriculum,
  fitness: fitnessCurriculum,
};

function getCurriculumFor(subjectKey, trackId) {
  const normSubject = (subjectKey || "coding").toLowerCase();
  const subData = ALL_CURRICULA[normSubject] || ALL_CURRICULA.coding;
  if (!trackId) return subData;

  const normTrack = trackId.toLowerCase();
  return subData[normTrack] || [];
}

function getSubjectModule(subjectKey, trackId, moduleIndex) {
  const modules = getCurriculumFor(subjectKey, trackId);
  const idx = parseInt(moduleIndex, 10);
  return modules.find((m) => m.moduleIndex === idx);
}

module.exports = {
  ALL_CURRICULA,
  getCurriculumFor,
  getSubjectModule,
};
