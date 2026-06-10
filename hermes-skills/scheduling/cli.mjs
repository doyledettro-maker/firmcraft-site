#!/usr/bin/env node
// CLI entry for the scheduling skills — how Hermes (and the integration test)
// invokes them:
//
//   node cli.mjs tools                      # print all 8 tool definitions (JSON)
//   node cli.mjs <skill> '<json-args>'      # run one skill, print its JSON result
//
// Examples:
//   node cli.mjs list_jobs '{"date": "tomorrow"}'
//   node cli.mjs create_job '{"customer_name": "Tom Wilson", "service_type": "AC tune-up", "date": "thursday", "time": "2pm"}'
//
// Exit code 0 with {ok:true|false,...} on a handled outcome (including
// clarification questions); exit 1 on configuration / unexpected errors.

import { createContext } from "./lib/api.mjs";
import { skills, toolDefinitions, runSkill } from "./skills/index.mjs";

async function main() {
  const [, , cmd, argsJson] = process.argv;

  if (!cmd || cmd === "help" || cmd === "--help") {
    console.log(`Usage:\n  node cli.mjs tools\n  node cli.mjs <skill> '<json-args>'\n\nSkills: ${Object.keys(skills).join(", ")}`);
    return;
  }

  if (cmd === "tools") {
    console.log(JSON.stringify(toolDefinitions, null, 2));
    return;
  }

  let args = {};
  if (argsJson) {
    try {
      args = JSON.parse(argsJson);
    } catch {
      console.error(JSON.stringify({ ok: false, message: `Arguments must be valid JSON, got: ${argsJson}` }));
      process.exit(1);
    }
  }

  const api = await createContext();
  const result = await runSkill(cmd, args, api);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, message: err.message }));
  process.exit(1);
});
