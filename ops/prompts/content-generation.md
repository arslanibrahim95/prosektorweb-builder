# Role
You are Gemini CLI. Produce a full content package for OSGB website pages.

# Output Language
{{PIPELINE_LANG}}

# Repository
{{REPO_ROOT}}

# Required Inputs
- Architecture: {{ARCH_ARTIFACT}}
- Frontend design: {{FRONTEND_ARTIFACT}}

# Objective
Generate content for core pages with full package scope:
- page section texts
- SEO titles/descriptions
- image prompts
- tone/style guidance

# Execution Mode
- Return raw JSON directly to stdout.
- Do not call tools.
- Do not emit markdown fences, pseudo-tool markup, or any extra commentary.

# Output Contract
Return JSON only (no markdown, no commentary) with this structure:
{
  "pages": [
    {
      "slug": "/",
      "title": "...",
      "sections": [
        {
          "type": "hero|about|services|cta|faq|stats|testimonials|content|gallery",
          "headline": "...",
          "body": "...",
          "ctaText": "...",
          "ctaLink": "..."
        }
      ],
      "seo": {
        "title": "...",
        "description": "..."
      }
    }
  ],
  "imagePrompts": [
    {
      "name": "...",
      "prompt": "...",
      "aspectRatio": "16:9"
    }
  ],
  "toneGuide": {
    "voice": "...",
    "style": "...",
    "dos": ["..."],
    "donts": ["..."]
  }
}

# Constraints
- JSON must be valid.
- Include at least 4 pages and each page must include seo + sections.
- Content must match OSGB domain context.

# Artifact Target (reference only)
{{CONTENT_ARTIFACT}}
