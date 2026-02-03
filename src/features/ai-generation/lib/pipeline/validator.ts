/**
 * Pipeline Validator
 *
 * Validates input and output for each pipeline stage.
 * Catches errors early with type-safe validation.
 */

import { PipelineStage, STAGE_METADATA } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

type ValidationRule = {
  field: string;
  required: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
};

// Input validation schemas for each stage
const INPUT_SCHEMAS: Record<PipelineStage, ValidationRule[]> = {
  input: [
    { field: "projectId", required: true, type: "string" },
    { field: "companyName", required: true, type: "string", minLength: 2 },
  ],
  research: [
    { field: "projectId", required: true, type: "string" },
    { field: "company", required: true, type: "object" },
  ],
  design: [
    { field: "projectId", required: true, type: "string" },
    { field: "company", required: true, type: "object" },
    { field: "research", required: false, type: "object" },
  ],
  images: [
    { field: "projectId", required: true, type: "string" },
    { field: "company", required: true, type: "object" },
    { field: "design", required: true, type: "object" },
    { field: "pages", required: true, type: "array" },
  ],
  content: [
    { field: "projectId", required: true, type: "string" },
    { field: "company", required: true, type: "object" },
    { field: "pages", required: true, type: "array" },
    { field: "design", required: true, type: "object" },
  ],
  seo: [
    { field: "projectId", required: true, type: "string" },
    { field: "content", required: true, type: "object" },
    { field: "domain", required: true, type: "string" },
  ],
  build: [
    { field: "projectId", required: true, type: "string" },
    { field: "slug", required: true, type: "string" },
    { field: "config", required: true, type: "object" },
    { field: "content", required: true, type: "object" },
  ],
  ui_ux: [
    { field: "projectId", required: true, type: "string" },
    { field: "build", required: true, type: "object" },
    { field: "design", required: true, type: "object" },
  ],
  review: [
    { field: "projectId", required: true, type: "string" },
    { field: "company", required: true, type: "object" },
    { field: "content", required: true, type: "object" },
    { field: "build", required: true, type: "object" },
    { field: "uiUx", required: true, type: "object" },
  ],
  publish: [
    { field: "projectId", required: true, type: "string" },
    { field: "slug", required: true, type: "string" },
    { field: "domain", required: true, type: "string" },
    { field: "platform", required: true, type: "string" },
  ],
};

// Output validation schemas for each stage
const OUTPUT_SCHEMAS: Record<PipelineStage, ValidationRule[]> = {
  input: [
    { field: "projectId", required: true, type: "string" },
    { field: "slug", required: true, type: "string", pattern: /^[a-z0-9-]+$/ },
    { field: "company", required: true, type: "object" },
    { field: "company.name", required: true, type: "string" },
  ],
  research: [
    { field: "projectId", required: true, type: "string" },
    { field: "keywords", required: true, type: "object" },
  ],
  design: [
    { field: "projectId", required: true, type: "string" },
    { field: "colors", required: true, type: "object" },
    { field: "colors.primary", required: true, type: "string", pattern: /^#[0-9A-Fa-f]{6}$/ },
    { field: "typography", required: true, type: "object" },
    { field: "layout", required: true, type: "object" },
  ],
  images: [
    { field: "projectId", required: true, type: "string" },
    { field: "images", required: true, type: "array" },
    { field: "totalImages", required: true, type: "number", min: 0 },
    { field: "heroImages", required: true, type: "array" },
    { field: "featureIcons", required: true, type: "array" },
  ],
  content: [
    { field: "projectId", required: true, type: "string" },
    { field: "pages", required: true, type: "array", minLength: 1 },
    { field: "totalWordCount", required: true, type: "number", min: 100 },
  ],
  seo: [
    { field: "projectId", required: true, type: "string" },
    { field: "files", required: true, type: "array", minLength: 1 },
    { field: "sitemapUrls", required: true, type: "array" },
  ],
  build: [
    { field: "projectId", required: true, type: "string" },
    { field: "status", required: true, type: "string" },
  ],
  ui_ux: [
    { field: "projectId", required: true, type: "string" },
    { field: "overallScore", required: true, type: "number", min: 0, max: 100 },
    { field: "lighthouse", required: true, type: "object" },
    { field: "checks", required: true, type: "array" },
    { field: "readyForReview", required: true, type: "boolean" },
  ],
  review: [
    { field: "projectId", required: true, type: "string" },
    { field: "overallScore", required: true, type: "number", min: 0, max: 100 },
    { field: "checks", required: true, type: "array" },
    { field: "readyForPublish", required: true, type: "boolean" },
  ],
  publish: [
    { field: "projectId", required: true, type: "string" },
    { field: "deploymentId", required: true, type: "string" },
    { field: "url", required: true, type: "string" },
  ],
};

export class PipelineValidator {
  /**
   * Validate stage input
   */
  validateStageInput(stage: PipelineStage, input: unknown): ValidationResult {
    const schema = INPUT_SCHEMAS[stage];
    return this.validate(input, schema);
  }

  /**
   * Validate stage output
   */
  validateStageOutput(stage: PipelineStage, output: unknown): ValidationResult {
    const schema = OUTPUT_SCHEMAS[stage];
    return this.validate(output, schema);
  }

  /**
   * Validate object against rules
   */
  private validate(data: unknown, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof data !== "object" || data === null) {
      errors.push("Data must be an object");
      return { valid: false, errors, warnings };
    }

    for (const rule of rules) {
      const value = this.getNestedValue(data as Record<string, unknown>, rule.field);
      const fieldErrors = this.validateField(rule.field, value, rule);

      if (rule.required && fieldErrors.length > 0) {
        errors.push(...fieldErrors);
      } else if (!rule.required && fieldErrors.length > 0 && value !== undefined) {
        warnings.push(...fieldErrors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single field
   */
  private validateField(
    fieldPath: string,
    value: unknown,
    rule: ValidationRule
  ): string[] {
    const errors: string[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`${fieldPath} is required`);
      return errors;
    }

    // Skip further validation if value is not present and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Check type
    if (rule.type) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== rule.type) {
        errors.push(`${fieldPath} must be of type ${rule.type}, got ${actualType}`);
        return errors;
      }
    }

    // Check string constraints
    if (typeof value === "string") {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(`${fieldPath} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(`${fieldPath} must be at most ${rule.maxLength} characters`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${fieldPath} has invalid format`);
      }
    }

    // Check number constraints
    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${fieldPath} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${fieldPath} must be at most ${rule.max}`);
      }
    }

    // Check array constraints
    if (Array.isArray(value)) {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(`${fieldPath} must have at least ${rule.minLength} items`);
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(`${fieldPath} must have at most ${rule.maxLength} items`);
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return errors;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(
    obj: Record<string, unknown>,
    path: string
  ): unknown {
    const parts = path.split(".");
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Validate transition between stages
   */
  validateTransition(
    fromStage: PipelineStage,
    toStage: PipelineStage,
    fromOutput: unknown
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if transition is valid
    const stages: PipelineStage[] = [
      "input",
      "research",
      "design",
      "images",
      "content",
      "seo",
      "build",
      "ui_ux",
      "review",
      "publish",
    ];
    const fromIndex = stages.indexOf(fromStage);
    const toIndex = stages.indexOf(toStage);

    if (toIndex !== fromIndex + 1) {
      // Allow skipping only if the stage can be skipped
      const skippedStages = stages.slice(fromIndex + 1, toIndex);
      for (const skipped of skippedStages) {
        if (!STAGE_METADATA[skipped].canSkip) {
          errors.push(`Cannot skip stage: ${skipped}`);
        }
      }
    }

    // Validate that required outputs are present
    if (fromOutput) {
      const outputValidation = this.validateStageOutput(fromStage, fromOutput);
      if (!outputValidation.valid) {
        errors.push(
          `Previous stage output invalid: ${outputValidation.errors.join(", ")}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get required fields for a stage
   */
  getRequiredFields(stage: PipelineStage): string[] {
    return INPUT_SCHEMAS[stage]
      .filter((rule) => rule.required)
      .map((rule) => rule.field);
  }

  /**
   * Get missing fields for a stage
   */
  getMissingFields(stage: PipelineStage, data: unknown): string[] {
    const required = this.getRequiredFields(stage);
    const missing: string[] = [];

    if (typeof data !== "object" || data === null) {
      return required;
    }

    for (const field of required) {
      const value = this.getNestedValue(data as Record<string, unknown>, field);
      if (value === undefined || value === null) {
        missing.push(field);
      }
    }

    return missing;
  }
}
