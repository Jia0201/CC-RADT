# Third-Party Notices

CC-RADT includes local copies of selected third-party Agent Skills. Those files remain subject to their original licenses; this notice does not relicense them. The project-level license, when selected, applies only to material owned by the CC-RADT project.

## Included Sources

| Source | Included Skills | License | License copy |
| --- | --- | --- | --- |
| [mattpocock/skills](https://github.com/mattpocock/skills) | `triage`, `diagnose`, `zoom-out`, `handoff`, `to-prd`, `grill-me`, `grill-with-docs`, `to-issues`, `prototype`, `tdd`, `improve-codebase-architecture`, `setup-matt-pocock-skills`, `write-a-skill` | MIT | [`third_party/licenses/MIT-mattpocock-skills.txt`](third_party/licenses/MIT-mattpocock-skills.txt) |
| [bytedance/deer-flow](https://github.com/bytedance/deer-flow) | `code-documentation`, `consulting-analysis`, `deep-research`, `academic-paper-review` | MIT | [`third_party/licenses/MIT-deer-flow.txt`](third_party/licenses/MIT-deer-flow.txt) |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | `claude-automation-recommender`, `claude-md-improver`, `build-mcp-server`, `agent-development`, `hook-development`, `mcp-integration`, `writing-hookify-rules`, `session-report` | Apache-2.0 | [`third_party/licenses/Apache-2.0.txt`](third_party/licenses/Apache-2.0.txt) |
| [anthropics/skills](https://github.com/anthropics/skills) | `frontend-design`, `webapp-testing`, `skill-creator`, `mcp-builder` | Apache-2.0 per included Skill | Each copied Skill retains its `LICENSE.txt`; a reference copy is also at [`third_party/licenses/Apache-2.0.txt`](third_party/licenses/Apache-2.0.txt) |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `vercel-react-best-practices` | MIT, as declared in the included Skill metadata | [`third_party/licenses/MIT-vercel-react-best-practices.txt`](third_party/licenses/MIT-vercel-react-best-practices.txt) |
| [szkocot/andrej-karpathy-skills](https://github.com/szkocot/andrej-karpathy-skills) | `karpathy-guidelines` | MIT, as declared in the included Skill metadata | [`third_party/licenses/MIT-karpathy-guidelines.txt`](third_party/licenses/MIT-karpathy-guidelines.txt) |

The authoritative machine-readable inventory is [`skills/registry.json`](skills/registry.json). A Skill may appear in more than one Agent directory because CC-RADT ships role-specific local copies.

## Deliberately Excluded

The public repository does not redistribute Skills whose license could not be verified for third-party distribution. In particular, Anthropic's source-available PDF Skill is not included because its license does not permit redistribution outside the applicable Anthropic service agreement. `doc-coauthoring` and `web-design-guidelines` are also omitted because the copied sources did not carry a verifiable redistribution license.

## Reporting An Issue

If an attribution, source mapping, or license classification is incorrect, open an issue with the affected path and upstream source. The file should remain disabled from future packages until the review is resolved.
