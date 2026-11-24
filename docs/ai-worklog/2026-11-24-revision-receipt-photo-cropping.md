# Crop receipt photos before recognition

- Open the selected photo in a local crop editor with a freeform rectangle and 90° rotation. Send the cropped image only when the user chooses **Read receipt**.
- Fit the crop proportionally within 1000 × 1000 pixels and keep smaller crops at their original size. The server checks both dimensions before starting the agent.
- Keep the current transaction draft when the user cancels or when a replacement cannot be read. Retain the cropped replacement in browser memory for an explicit retry.

Lint, all 22 tests, and the Webpack production build passed. A mobile Chromium smoke test used touch input to crop and rotate a 1600 × 2000 fixture. It saw no recognition request before confirmation and measured the submitted JPEG at 1000 × 470 pixels with no color from the excluded area. The smoke test used mock Supabase and OpenRouter services.
