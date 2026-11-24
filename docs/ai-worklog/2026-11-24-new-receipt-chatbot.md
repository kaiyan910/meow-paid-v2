# Receipt chatbot

## Design discussion

- The requested entry point is a robot icon immediately to the left of the transaction header’s add button.
- The chatbot will use AG-UI, LangChain, and an OpenRouter model to read receipt images. The agent needs tools to look up existing shops and payment subtypes through Supabase.
- Existing transactions require a shop, a payee, a date, and at least one item. A stored item carries a payment subtype and an amount. The existing save operation derives the transaction total from its items.

## Confirmed decisions

- The robot icon opens a dedicated chat page with room for the receipt and its draft on mobile.
- The user confirms the draft in the interface before MeowPaid saves a transaction.
- One receipt becomes one transaction. Lines assigned to the same payment subtype are combined into one transaction item.
- MeowPaid uses the receipt image during recognition and leaves the uploaded original out of the lasting transaction record.
- The user can edit the draft in chat or directly in the review form.
- The draft offers an existing-shop picker and lets the agent help register a shop when needed.
- Item discounts reduce the item amounts before grouping. A full-purchase discount has its own transaction field.
- The draft uses the signed-in user as its initial payee. The review form allows the user to change it.
- Receipts are treated as HKD.
- Retrying a single draft confirmation saves the transaction once. Re-uploading a receipt starts a new draft.
- The chat and draft live on the open page for the duration of the session.
- Category reports use item amounts before the transaction discount. Overall spending and transfers use the actual amount paid.
- Proposed shops can have no logo and are created in the same database transaction as the purchase.
- Standalone fees have their own draft line and an existing subtype.
- Confirmation requires the calculated and receipt totals to match.

## Implementation and verification

- The AG-UI page sends photos to the authenticated LangChain route. The OpenRouter model can query shops, shop categories, and payment subtypes. The separate confirmation endpoint handles writes.
- Migration 007 adds the transaction discount and receipt confirmation records, allows a missing shop logo, and provides the net totals used in spending and transfers.
- Lint, TypeScript, the default production build, and 14 automated tests passed. The tests include an AG-UI round trip with a mock OpenRouter response and a review form that blocks confirmation until the total matches.
- An isolated Postgres run applied migrations 001–007 and verified rollback of a proposed shop when confirmation fails, replay of a saved draft, category and net totals, and legacy edits.
- A mobile Chromium run against the production build and mock Supabase and OpenRouter services verified sign-in, upload, chat and form edits, confirmation and retry, reporting, and clearing the draft on exit.
- The production dependency scan cleared advisories for the upgraded Zod and Undici dependencies. Nine advisories remain in pre-existing packages.
