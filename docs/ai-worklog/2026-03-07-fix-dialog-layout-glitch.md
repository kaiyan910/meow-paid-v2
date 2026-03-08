# Fix Dialog Layout Glitch (B01)

## Date: 2026-03-07

## Problem
The Shop Edit Dialog had a layout overflow issue where form content (inputs, buttons) extended beyond the dialog's right boundary. The "Save" button was clipped and the logo filename text overflowed.

## Root Cause
CSS grid blowout in `DialogContent`. The component uses `display: grid` with `p-6` padding. Long text content (the logo filename UUID) set a large intrinsic minimum width on grid children, forcing the grid column to expand beyond the dialog's `max-w-sm` (384px) constraint.

## Fix
### `src/components/ui/dialog.tsx`
- Changed `w-full` to `w-[calc(100%-3rem)]` to ensure horizontal margin on small viewports
- Added `[&>*]:min-w-0` to prevent grid children from expanding the grid column beyond the container width

### `src/components/meta/meta-form-dialog.tsx`
- Removed the `pr-4` band-aid padding from the form element (no longer needed)

## Verification
Used Playwright browser to:
1. Navigate to Meta tab > Shop tab
2. Click shop item to open Edit dialog
3. Confirmed all form fields and buttons are properly contained within the dialog
