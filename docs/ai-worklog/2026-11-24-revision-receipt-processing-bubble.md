# Receipt assistant waiting bubble

The assistant opens a chat bubble when the user sends a receipt or message. The waiting text uses a CSS animation that cycles through one, two, and three dots. Reduced-motion settings display static dots. The first streamed text replaces the waiting text in the same bubble.

The receipt page test verifies that the waiting, streaming, and final reply share the same bubble. Mobile Chromium verified the dot cycle, reduced motion, and the transition to streamed text with a mock OpenRouter response.
