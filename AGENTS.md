# Writing Style

Write like a human engineer. Be short, direct, and factual. Do not use AI filler, generated-by text, or verbose summaries.

# Engineering Rules

Read and follow `~/.agents/GLOBAL_ENGINEERING_RULES.md`.

# Browser Work

Use Codex Desktop Browser plugin or Playwright MCP for local browser checks. Do not connect to a user's persistent Chrome debugging port unless they explicitly ask for it.

# Git
<!-- hello -->
Commits and PR descriptions must be short, human, factual, and have no AI attribution.

lol

# Development server

- Start the app from the project root with `npm run dev -- --host 0.0.0.0`.
- Try starting the server before installing anything. The current VM already has the project dependencies installed; no missing dependencies blocked the verified startup.
- A bare `vite` command is not available on the shell PATH. Use the npm script to run the project's local Vite executable.
