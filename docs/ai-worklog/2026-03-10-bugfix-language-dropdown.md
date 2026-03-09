# 2026-03-10 — Bugfix: Language dropdown not updating (B04)

## Bug
Selecting a new language in the Meta tab updated the app translations but the `<select>` dropdown still showed the previous language.

## Root Cause
`meta-tab.tsx` imported the `i18n` singleton directly (`import i18n from "@/i18n"`) and read `i18n.language` for the `<select>` value. This is not reactive — React doesn't know the singleton mutated, so no re-render occurs for the select value even though `useTranslation()` re-renders the translated strings.

## Fix
- Removed the direct `i18n` import
- Destructured `i18n` from the reactive `useTranslation()` hook: `const { t, i18n } = useTranslation()`
- Now `i18n.language` triggers a re-render when language changes

## Regression Test
Created `src/pages/__tests__/meta-tab-language.test.tsx` — verifies the dropdown value updates after selecting a new language.
