# Receipt assistant reply streaming

The receipt assistant now sends reply text through AG-UI as it arrives from OpenRouter. The model puts the reply first in its final JSON response so streaming works with providers that buffer tool arguments. Catalog lookups remain authenticated, and the server validates the complete draft and checks catalog IDs before updating the review form. [Google Cloud function calling documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tools/function-calling)

The chat shows a short status until the first text arrives. The reply grows in the same bubble. If a run fails, the chat removes the incomplete reply and preserves the previous draft. Transaction confirmation still requires the user's action.

Lint, TypeScript, the Turbopack production build, and all 23 tests passed. A mobile Chromium smoke test against mock Supabase and OpenRouter services confirmed that both an upload reply and a chat correction appear before their updated drafts arrive. It also covered saving the reviewed transaction and retrying confirmation.
