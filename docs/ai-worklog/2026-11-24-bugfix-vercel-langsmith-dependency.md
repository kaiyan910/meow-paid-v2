# Fix LangSmith resolution on Vercel

The receipt agent imports `langsmith/traceable` directly. A fresh pnpm install installed LangSmith for LangChain but did not link it for the app, so the import failed. An older link in the local checkout had masked the missing dependency.

Declare `langsmith` as a runtime dependency at `0.14.0`, the version already used by LangChain. The lockfile now links the app to the same package version.

Verified that the import fails after a fresh install of the original manifest and succeeds after a fresh frozen-lockfile install of the updated manifest. The Turbopack production build, lint, and all 22 tests passed locally.
