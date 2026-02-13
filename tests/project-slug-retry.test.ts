import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createWithUniqueSlug,
  isSiteSlugConflictError,
  nextSiteSlugCandidate,
  ProjectSlugResolutionError,
} from '../src/features/projects/lib/site-slug'

test('nextSiteSlugCandidate increments suffix based on taken set', () => {
  const taken = new Set(['acme', 'acme-1', 'acme-2'])
  const candidate = nextSiteSlugCandidate('acme', taken)
  assert.equal(candidate, 'acme-3')
})

test('isSiteSlugConflictError recognizes 409 status and known conflict codes', () => {
  assert.equal(isSiteSlugConflictError({ status: 409 }), true)
  assert.equal(isSiteSlugConflictError({ statusCode: 409 }), true)
  assert.equal(isSiteSlugConflictError({ code: 'SITE_SLUG_CONFLICT' }), true)
  assert.equal(isSiteSlugConflictError({ code: 'duplicate_slug' }), true)
  assert.equal(isSiteSlugConflictError({ code: 'random_error' }), false)
})

test('createWithUniqueSlug resolves unique slugs under parallel create attempts', async () => {
  const committed = new Set<string>()

  const create = async (slug: string) => {
    // Force interleaving so parallel calls compete for the same candidate.
    await Promise.resolve()

    if (committed.has(slug)) {
      throw {
        status: 409,
        code: 'SITE_SLUG_CONFLICT',
        message: 'slug conflict',
      }
    }

    committed.add(slug)
    return { id: slug }
  }

  const tasks = Array.from({ length: 8 }, () =>
    createWithUniqueSlug({
      baseSlug: 'acme',
      initialTaken: [],
      maxAttempts: 50,
      create,
    })
  )

  const results = await Promise.all(tasks)
  const slugs = results.map((row) => row.slug)

  assert.equal(new Set(slugs).size, slugs.length)
  assert.equal(slugs.includes('acme'), true)
})

test('createWithUniqueSlug throws ProjectSlugResolutionError when retry limit is exhausted', async () => {
  const create = async (_slug: string) => {
    throw {
      status: 409,
      code: 'SITE_SLUG_CONFLICT',
      message: 'always conflict',
    }
  }

  await assert.rejects(
    async () =>
      createWithUniqueSlug({
        baseSlug: 'acme',
        initialTaken: [],
        maxAttempts: 3,
        create,
      }),
    (error: unknown) => {
      assert.equal(error instanceof ProjectSlugResolutionError, true)
      if (error instanceof ProjectSlugResolutionError) {
        assert.equal(error.code, 'PROJECT_SLUG_RESOLUTION_FAILED')
        assert.equal(error.attempts, 3)
      }
      return true
    }
  )
})
