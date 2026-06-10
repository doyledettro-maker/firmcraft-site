// Skill registry: every scheduling skill, keyed by tool name. Hermes loads
// `toolDefinitions` into its function-calling tool list and dispatches calls
// through `runSkill`.

import * as create_job from "./create_job.mjs";
import * as list_jobs from "./list_jobs.mjs";
import * as get_job from "./get_job.mjs";
import * as update_job from "./update_job.mjs";
import * as cancel_job from "./cancel_job.mjs";
import * as complete_job from "./complete_job.mjs";
import * as check_availability from "./check_availability.mjs";
import * as set_time_off from "./set_time_off.mjs";

export const skills = {
  create_job,
  list_jobs,
  get_job,
  update_job,
  cancel_job,
  complete_job,
  check_availability,
  set_time_off,
};

export const toolDefinitions = Object.values(skills).map((s) => s.definition);

export async function runSkill(name, args, api) {
  const skill = skills[name];
  if (!skill) {
    throw new Error(`Unknown scheduling skill: ${name}. Available: ${Object.keys(skills).join(", ")}`);
  }
  return skill.run(args ?? {}, api);
}
