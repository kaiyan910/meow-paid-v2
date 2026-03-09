## Tech Stack

### Frontend
- React 19 with vite
- use biome.js for the code quality check
- use pnpm instead of npm

#### Coding Practice
- always check for code security after implementing a feature
- always build small component to composite into a large component
- always use zustand state to pass data from top to bottom component
- always check the React rerender problem to avoid unnecessary re-render to improve performance
- data input by user and data receive from server should always validate by a Zod schema to ensure the data type
- avoid using "any" type instead use "unknown" type whenever possible
- always use React-i18Next to display the plain text and error message, never hand code the text inside the code
- add comment to explain what is the function or component is doing
- never put a <Button> inside another <Button>

#### Libraries
- Tanstack Router for the navigation
- Tanstack Query for the API call if needed
- Tanstack Form for the form builder
- Tanstack Table for the datatable implementation
- React-i18Next for locale translation
- Zustand for the state management
- Zod for the data validation for form submission and API request/response
- Nuqs for the query parameters state management
- Momentjs to handle date time related logic
- DnD-kit to handle drag drop related UI 
- TailwindCSS for UI styling
- Shadcn for custom UI component with TailwindCSS styling
- Recharts for the Chart related UI along with Shadcn

#### Methodology
- Test Driven Development
  > tests should be created before writing code deliver a UI components

#### Skills
- vercel-react-best-practices: for React best practice
- typescript-advanced-types, typescript-expert, typescript-react-reviewer: for Typescript best practice
- javascript-typescript-jest: for unit testing best practice 
- supabase-postgres-best-pratices: for Supabase Postgres best practice

### Backend
- Supabase as the backbone

### Change Logs
- important! always save you work log to `docs/ai-worklog` in name format `YYYY-MM-DD-[bugfix|new|revision]-task-name.md`