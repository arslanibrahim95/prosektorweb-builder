/**
 * Web Project Pipeline
 *
 * Type-safe pipeline for web project creation with:
 * - Defined input/output schemas for each stage
 * - Validation at stage boundaries
 * - Expectation/prediction for next stage
 * - Event system for progress tracking
 * - Support for "vibe coding" (manual/interactive) workflow
 * - Context memo for preventing hallucinations
 * - Quality scoring for content validation
 *
 * @see RULES.md for AI agent guidelines
 */

// Core types and state machine
export * from "./types";
export * from "./runner";
export * from "./validator";
export * from "./expectation";

// AI provider configuration
export * from "./ai-providers";

// Content generation
export * from "./quote-generator";
export * from "./seo-optimizer";

// Quality assurance (NEW)
export * from "./context-memo";
export * from "./quality-scorer";
