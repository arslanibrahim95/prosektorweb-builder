import { z } from 'zod';

export const DashboardLayoutBlockSchema = z
  .object({
    type: z.string(),
    props: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const DashboardLayoutDataSchema = z
  .object({
    root: z
      .object({
        props: z.record(z.unknown()).optional(),
      })
      .passthrough()
      .optional()
      .nullable(),
    content: z.array(DashboardLayoutBlockSchema).default([]),
  })
  .passthrough();

export const DashboardSiteSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional().nullable(),
    slug: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    template: z.string().optional().nullable(),
    industry: z.string().optional().nullable(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
  })
  .passthrough();

export const DashboardPageSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    title: z.string().optional().nullable(),
    slug: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    layoutData: DashboardLayoutDataSchema.optional().nullable(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
  })
  .passthrough();

export const DashboardPublicSiteSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional().nullable(),
    domain: z.string().optional().nullable(),
    brandPrimary: z.string().optional().nullable(),
    brandSecondary: z.string().optional().nullable(),
  })
  .passthrough();

export const DashboardPublicSettingsSchema = z
  .object({
    contact: z
      .object({
        address: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      })
      .passthrough()
      .optional()
      .nullable(),
    customCss: z.string().optional().nullable(),
    footerText: z.string().optional().nullable(),
    siteTitle: z.string().optional().nullable(),
    tagline: z.string().optional().nullable(),
    socialLinks: z
      .array(
        z
          .object({
            platform: z.string().optional().nullable(),
            url: z.string().optional().nullable(),
          })
          .passthrough()
      )
      .optional()
      .nullable(),
  })
  .passthrough();

export const DashboardPublicPageSchema = z
  .object({
    slug: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    layoutData: DashboardLayoutDataSchema.optional().nullable(),
  })
  .passthrough();

export const DashboardPublicSiteBodySchema = z.object({
  ok: z.boolean().optional(),
  site: DashboardPublicSiteSchema,
  settings: DashboardPublicSettingsSchema.optional().nullable(),
  pages: z.array(DashboardPublicPageSchema).default([]),
});

export type DashboardLayoutData = z.infer<typeof DashboardLayoutDataSchema>;
export type DashboardSite = z.infer<typeof DashboardSiteSchema>;
export type DashboardPage = z.infer<typeof DashboardPageSchema>;
export type DashboardPublicSiteBody = z.infer<typeof DashboardPublicSiteBodySchema>;
