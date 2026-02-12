import type { DashboardPuckData } from './contracts';

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

export function createPuckDataFromHtml(title: string, html: string): DashboardPuckData {
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

export function createPuckDataFromBlocks(
  title: string,
  blocks: Array<{ blockType: string; [key: string]: unknown }>
): DashboardPuckData {
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

export function extractHtmlFromPuckData(puckData: DashboardPuckData | null | undefined): string {
  if (!puckData || !Array.isArray(puckData.content)) {
    return '';
  }

  const contentBlock = puckData.content.find((block) => block?.type === 'content');
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

export function normalizePuckBlocks(
  puckData: DashboardPuckData | null | undefined
): Array<{ blockType: string; [key: string]: unknown }> {
  if (!puckData || !Array.isArray(puckData.content)) {
    return [];
  }

  return puckData.content
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
