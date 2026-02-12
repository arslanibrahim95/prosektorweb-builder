import { z } from 'zod'

export const uuidSchema = z.string().uuid()
export const isoDateTimeSchema = z.string().datetime({ offset: true }).or(z.string().datetime())

export const tenantRoleSchema = z.enum([
  'super_admin',
  'owner',
  'admin',
  'editor',
  'viewer',
])

export const siteStatusSchema = z.enum(['draft', 'staging', 'published'])
export const pageStatusSchema = z.enum(['draft', 'published'])
export const moduleKeySchema = z.string().min(1)

export const apiErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.array(z.string())).optional(),
})

const seoDefaultsSchema = z
  .object({
    title_suffix: z.string().optional(),
    og_image: z.string().optional(),
    description: z.string().optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .passthrough()

const themeTokensSchema = z
  .object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontHeading: z.string().optional(),
    fontBody: z.string().optional(),
  })
  .passthrough()

const pageLayoutConfigSchema = z
  .object({
    sectionOrder: z.array(z.string()).optional(),
    hiddenSections: z.array(z.string()).optional(),
  })
  .passthrough()

const layoutConfigSchema = z
  .object({
    pages: z.record(pageLayoutConfigSchema).optional(),
  })
  .passthrough()

const sectionVariantsSchema = z.record(z.string())

export const siteSettingsSchema = z
  .object({
    theme: z.string().optional(),
    brand_color: z.string().optional(),
    secondary_color: z.string().optional(),
    accent_color: z.string().optional(),
    font_heading: z.string().optional(),
    font_body: z.string().optional(),
    logo_url: z.string().optional(),
    favicon_url: z.string().optional(),
    footer_description: z.string().optional(),
    seo_defaults: seoDefaultsSchema.optional(),
    site_slug: z.string().optional(),
    theme_tokens: themeTokensSchema.optional(),
    themeTokens: themeTokensSchema.optional(),
    layout_config: layoutConfigSchema.optional(),
    layoutConfig: layoutConfigSchema.optional(),
    section_variants: sectionVariantsSchema.optional(),
    sectionVariants: sectionVariantsSchema.optional(),
  })
  .passthrough()

export const siteSchema = z
  .object({
    id: z.string(),
    tenant_id: z.string(),
    name: z.string(),
    status: siteStatusSchema,
    primary_domain: z.string().nullable().optional(),
    settings: siteSettingsSchema.default({}),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough()

export const listSitesResponseSchema = z.object({
  items: z.array(siteSchema),
  total: z.number().int().nonnegative().optional().default(0),
})

export const createSiteRequestSchema = z.object({
  name: z.string().min(1).max(200),
  primary_domain: z.string().nullable().optional(),
  settings: siteSettingsSchema.optional(),
})

export const updateSiteRequestSchema = createSiteRequestSchema.partial()

export const meResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    avatar_url: z.string().optional(),
  }),
  tenant: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    plan: z.string().optional(),
  }),
  role: tenantRoleSchema,
  permissions: z.array(z.string()).optional(),
})

export const pageSeoSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    og_image: z.string().optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .passthrough()

export const pageSchema = z
  .object({
    id: z.string(),
    tenant_id: z.string(),
    site_id: z.string(),
    slug: z.string(),
    title: z.string(),
    status: pageStatusSchema.optional().default('draft'),
    seo: pageSeoSchema.default({}),
    order_index: z.number().int().optional().default(0),
    draft_revision_id: z.string().nullable().optional(),
    staging_revision_id: z.string().nullable().optional(),
    published_revision_id: z.string().nullable().optional(),
    deleted_at: z.string().nullable().optional(),
  })
  .passthrough()

export const listPagesResponseSchema = z.object({
  items: z.array(pageSchema),
  total: z.number().int().nonnegative().optional().default(0),
})

export const blockSchema = z
  .object({
    id: z.string().optional(),
    type: z.string(),
    props: z.record(z.unknown()).default({}),
  })
  .passthrough()

export const pageRevisionSchema = z
  .object({
    id: z.string(),
    tenant_id: z.string().optional(),
    page_id: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
    created_at: z.string().optional(),
    created_by: z.string().optional(),
    blocks: z.array(blockSchema).optional(),
  })
  .passthrough()

export const listPageRevisionsResponseSchema = z.object({
  items: z.array(pageRevisionSchema),
  total: z.number().int().nonnegative().optional().default(0),
})

export const createRevisionRequestSchema = z.object({
  blocks: z.array(blockSchema).min(1),
})

export const publishSiteRequestSchema = z.object({
  site_id: z.string(),
  environment: z.enum(['staging', 'production']),
})

export const publishSiteResponseSchema = z
  .object({
    published_at: isoDateTimeSchema.optional(),
    site_id: z.string().optional(),
    environment: z.enum(['staging', 'production']).optional(),
  })
  .passthrough()

export const moduleInstanceSchema = z
  .object({
    id: z.string(),
    tenant_id: z.string().optional(),
    site_id: z.string(),
    module_key: moduleKeySchema,
    enabled: z.boolean(),
    settings: z.record(z.unknown()).default({}),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough()

export const listModulesResponseSchema = z.object({
  items: z.array(moduleInstanceSchema),
  total: z.number().int().nonnegative().optional().default(0),
})

export const updateModuleInstanceRequestSchema = z.object({
  site_id: z.string(),
  module_key: moduleKeySchema,
  enabled: z.boolean(),
  settings: z.record(z.unknown()).optional(),
})

export const domainSchema = z
  .object({
    id: z.string(),
    site_id: z.string(),
    tenant_id: z.string().optional(),
    domain: z.string(),
    status: z.string(),
    is_primary: z.boolean().optional(),
  })
  .passthrough()

export const createDomainRequestSchema = z.object({
  site_id: z.string(),
  domain: z.string(),
  is_primary: z.boolean().optional(),
})

export const publishWebhookBodySchema = z.object({
  event: z.enum(['publish', 'unpublish', 'page_update', 'site_update']),
  traceId: z.string().min(8),
  publishedAt: isoDateTimeSchema,
  site: z.object({
    id: z.string(),
    slug: z.string().min(1),
    status: siteStatusSchema,
  }),
  pages: z.array(z.string()).default([]),
  source: z.literal('panel'),
})

export const siteTokenResponseSchema = z.object({
  site_token: z.string().min(1),
  expires_at: isoDateTimeSchema.optional(),
})

export const publicContactSubmitSchema = z.object({
  site_token: z.string().min(1).optional(),
  site_id: z.string().optional(),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  subject: z.string().optional().default(''),
  message: z.string().min(1),
  kvkk_consent: z.coerce.boolean(),
  honeypot: z.string().optional().default(''),
})

export const publicOfferSubmitSchema = z.object({
  site_token: z.string().min(1).optional(),
  site_id: z.string().optional(),
  company_name: z.string().min(1),
  contact_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  employee_count: z
    .union([z.null(), z.number().int().positive(), z.coerce.number().int().positive()])
    .optional(),
  hazard_class: z.string().optional().default('unknown'),
  services_requested: z.array(z.string()).optional().default([]),
  message: z.string().optional().default(''),
  kvkk_consent: z.coerce.boolean().optional().default(true),
  honeypot: z.string().optional().default(''),
})

export const publicJobApplySchema = z.object({
  site_token: z.string().min(1).optional(),
  site_id: z.string().optional(),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  job_post_id: z.string().optional(),
  position: z.string().optional().default(''),
  cover_letter: z.string().optional().default(''),
  kvkk_consent: z.coerce.boolean().optional().default(true),
  honeypot: z.string().optional().default(''),
})

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
export type Site = z.infer<typeof siteSchema>
export type SiteSettings = z.infer<typeof siteSettingsSchema>
export type Page = z.infer<typeof pageSchema>
export type PageRevision = z.infer<typeof pageRevisionSchema>
export type Block = z.infer<typeof blockSchema>
export type ModuleInstance = z.infer<typeof moduleInstanceSchema>
export type PublishWebhookBody = z.infer<typeof publishWebhookBodySchema>
