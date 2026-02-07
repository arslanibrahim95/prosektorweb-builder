# AI Agents & Workflows

## Overview
This project utilizes AI agents to automate the generation and management of OSGB websites.

## Agents
1.  **Site Builder Agent**: Scaffolds new sites based on user input.
2.  **SEO Agent**: Generates optimized content using `osgb-services.ts` keyword data.
3.  **Migration Agent**: Handles database schema updates.

## Workflows
- **Content Generation**: Triggered via `npm run generate-content`.
- **Deployment**: Managed via Vercel/Docker (see `deployment_guide.md`).

## Payload + Puck Integration Task Template
Use this template when assigning work to an agent for dashboard (`Payload + Puck`) compatibility:

```md
Task: Make `osgb_site_yap` fully compatible with dashboard Payload/Puck contracts.

Source of truth:
- dashboard collections: websites, pages, site-settings
- page content: pages.puckData

Required API contracts:
- GET /api/public/sites/:siteSlug/pages
- GET /api/public/sites/:siteSlug/pages/:pageSlug
- only published content is public

Implementation checklist:
1. Validate API response shape (runtime guard).
2. Map `puckData.content` blocks to local section components.
3. Apply design tokens (brand colors/fonts) to layout CSS vars.
4. Ensure draft content never renders publicly.
5. Keep save=draft and publish flow aligned with dashboard.

Acceptance:
- unknown site/page => 404 JSON
- published content renders correctly
- unauthorized edit/publish => 401/403
- build passes

Output:
- changed files
- API contract summary
- test commands + PASS/FAIL
- risks/follow-up
```

## Reference
For full handoff details, use:
- `AGENT_HANDOFF_PAYLOAD_PUCK.md`
