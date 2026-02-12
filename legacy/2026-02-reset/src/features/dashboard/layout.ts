import type { DashboardLayoutData } from './contracts';

const BLOCK_WHITELIST = new Set([
  'hero',
  'services',
  'about',
  'cta',
  'faq',
  'team',
  'stats',
  'gallery',
  'testimonials',
  'content',
]);

export function normalizePageSlug(value: string | null | undefined): string {
  if (!value) return '/';
  const cleaned = value.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleaned) return '/';
  return `/${cleaned}`;
}

export function createLayoutDataFromHtml(title: string, html: string): DashboardLayoutData {
  return {
    root: {
      props: {
        title,
      },
    },
    content: [
      {
        type: 'content',
        props: {
          text: html,
        },
      },
    ],
  };
}

export function createLayoutDataFromBlocks(
  title: string,
  blocks: Array<{ blockType: string; [key: string]: unknown }>
): DashboardLayoutData {
  const content = blocks
    .filter((block) => BLOCK_WHITELIST.has(block.blockType))
    .map((block) => {
      const { blockType, ...props } = block;
      return {
        type: blockType,
        props,
      };
    });

  return {
    root: {
      props: {
        title,
      },
    },
    content,
  };
}

export function extractHtmlFromLayoutData(layoutData: DashboardLayoutData | null | undefined): string {
  if (!layoutData || !Array.isArray(layoutData.content)) {
    return '';
  }

  const contentBlock = layoutData.content.find((block) => block?.type === 'content');
  if (!contentBlock || !contentBlock.props || typeof contentBlock.props !== 'object') {
    return '';
  }

  const props = contentBlock.props as Record<string, unknown>;
  if (typeof props.text === 'string') {
    return props.text;
  }

  if (typeof props.html === 'string') {
    return props.html;
  }

  return '';
}

export function normalizeLayoutBlocks(
  layoutData: DashboardLayoutData | null | undefined
): Array<{ blockType: string; [key: string]: unknown }> {
  if (!layoutData || !Array.isArray(layoutData.content)) {
    return [];
  }

  return layoutData.content
    .filter((block) => block && typeof block.type === 'string' && BLOCK_WHITELIST.has(block.type))
    .map((block) => ({
      blockType: block.type,
      ...(block.props && typeof block.props === 'object' ? (block.props as Record<string, unknown>) : {}),
    }));
}

export function isPublishedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return status.toLowerCase() === 'published';
}
