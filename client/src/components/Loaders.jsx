import React from "react";
import MasteryZoneGlobalLoader from "./MasteryZoneGlobalLoader";

export { default as MasteryZoneGlobalLoader } from "./MasteryZoneGlobalLoader";

// 1. Global / Auth Loader (Exact Master Reference Design)
export const GlobalLoader = ({ message = "Loading your workspace...", progress = null }) => (
  <MasteryZoneGlobalLoader message={message} progress={progress} />
);

// 2. Coding Loader
export const CodingLoader = ({ message = "Loading your workspace...", progress = null }) => (
  <MasteryZoneGlobalLoader message={message} progress={progress} />
);

// 3. Fitness Loader
export const FitnessLoader = ({ message = "Loading your workspace...", progress = null }) => (
  <MasteryZoneGlobalLoader message={message} progress={progress} />
);

// 4. Driving Loader
export const DrivingLoader = ({ message = "Loading your workspace...", progress = null }) => (
  <MasteryZoneGlobalLoader message={message} progress={progress} />
);

// 5. Language Loader
export const LanguageLoader = ({ message = "Loading your workspace...", progress = null }) => (
  <MasteryZoneGlobalLoader message={message} progress={progress} />
);

export default MasteryZoneGlobalLoader;
