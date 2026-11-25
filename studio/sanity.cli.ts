import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  typegen: {
    enabled: true,
    // Queries live in the web workspace (the Next.js app at the repo root).
    path: '../{app,components,lib}/**/*.{ts,tsx}',
    schema: './schema.json',
    generates: '../sanity.types.ts',
    overloadClientMethods: true,
  },
})
