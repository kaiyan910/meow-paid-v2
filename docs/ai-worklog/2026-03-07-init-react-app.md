# Initialize React 19 Application

## Date: 2026-03-07

## Task
Initialize a React 19 application with React Compiler using Vite.

## What was done
- Scaffolded a React 19 + TypeScript project using `pnpm create vite` with the `react-ts` template
- Configured React Compiler via `babel-plugin-react-compiler` (v1.0.0) in vite.config.ts
- Replaced ESLint with Biome.js for code quality (linting + formatting)
- Configured Biome with JSONC support for tsconfig files, excluded dist/node_modules
- Cleaned up default Vite boilerplate (removed demo CSS, SVG, placeholder content)
- Added `.gitignore`
- Verified build passes with `tsc -b && vite build`
- Verified linting passes with `biome lint`

## Tech Stack
- React 19.2.4
- TypeScript 5.9.3
- Vite 7.3.1
- Biome 1.9.4
- babel-plugin-react-compiler 1.0.0
- pnpm 10.23.0

## Scripts
- `pnpm dev` - Start dev server
- `pnpm build` - Type check and build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run Biome linter
- `pnpm format` - Format with Biome
- `pnpm check` - Run all Biome checks with auto-fix
