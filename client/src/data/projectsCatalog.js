import projectsCatalogJson from "./projectsCatalog.json";

export const PROJECTS_CATALOG = projectsCatalogJson;

const PROJECT_ID_ALIASES = {
  proj_algo_trading: "proj_trading_bot",
  proj_ecommerce_api: "proj_ecommerce_platform",
  proj_collab_canvas: "proj_realtime_chat",
  proj_task_queue: "proj_task_api",
};

export function getProjectById(projectId) {
  if (!projectId) return null;
  const canonicalId = PROJECT_ID_ALIASES[projectId] || projectId;
  return PROJECTS_CATALOG.find((p) => p.id === canonicalId || p.id === projectId) || null;
}

export default PROJECTS_CATALOG;
