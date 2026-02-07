import * as migration_20260203_203254_sync_schema from './20260203_203254_sync_schema';
import * as migration_20260204_083309_add_blog_posts_and_expand_pages from './20260204_083309_add_blog_posts_and_expand_pages';

export const migrations = [
  {
    up: migration_20260203_203254_sync_schema.up,
    down: migration_20260203_203254_sync_schema.down,
    name: '20260203_203254_sync_schema',
  },
  {
    up: migration_20260204_083309_add_blog_posts_and_expand_pages.up,
    down: migration_20260204_083309_add_blog_posts_and_expand_pages.down,
    name: '20260204_083309_add_blog_posts_and_expand_pages'
  },
];
