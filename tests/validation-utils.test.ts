import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkGenerationPermission,
  hashPrompt,
  sanitizePrompt,
  validatePrompt,
} from '../src/features/ai-generation/lib/validation'

test('validatePrompt rejects very short prompts with clear errors', () => {
  const result = validatePrompt('kisa metin')

  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('Minimum 20')))
  assert.ok(result.errors.some((error) => error.includes('at least 3 words')))
})

test('validatePrompt blocks unsafe patterns', () => {
  const result = validatePrompt(
    'Create a website for my company <script>alert("x")</script> with contact page'
  )

  assert.equal(result.valid, false)
  assert.ok(result.errors.includes('Prompt contains potentially unsafe content'))
})

test('validatePrompt estimates complexity based on content and word count', () => {
  const moderate = validatePrompt(
    'Create a website for my OSGB company with a professional homepage, services overview, references section, detailed team profile, FAQ area and full contact details'
  )
  const complex = validatePrompt(
    'Create an e-commerce ready OSGB website with blog content generation, role-based dashboard, advanced analytics and multilingual support'
  )

  assert.equal(moderate.valid, true)
  assert.equal(moderate.estimatedComplexity, 'MODERATE')
  assert.equal(complex.estimatedComplexity, 'COMPLEX')
})

test('sanitizePrompt trims, strips control characters and normalizes whitespace', () => {
  const sanitized = sanitizePrompt('  Merhaba\x00   dunya\t\tOSGB \n\n platformu  ')

  assert.equal(sanitized, 'Merhaba dunya OSGB platformu')
})

test('hashPrompt is deterministic and case-insensitive', () => {
  const a = hashPrompt('Create website for osgb company')
  const b = hashPrompt('  create WEBSITE for OSGB company  ')

  assert.equal(a, b)
  assert.equal(a.length, 64)
})

test('checkGenerationPermission aligns with current role model', () => {
  assert.equal(checkGenerationPermission('ADMIN').allowed, true)
  assert.equal(checkGenerationPermission('USER').allowed, true)
  assert.equal(checkGenerationPermission('PARTNER').allowed, true)
  assert.equal(checkGenerationPermission('OFFICE').allowed, false)
})
