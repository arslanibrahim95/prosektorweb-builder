/**
 * Pipeline Runner Service
 *
 * Manages stage transitions, validation, expectations,
 * and state updates across the pipeline.
 */

import {
  PipelineStage,
  PipelineState,
  StageStatus,
  PIPELINE_STAGES,
  STAGE_METADATA,
  getNextStage,
  getStageIndex,
  InputStageInput,
  InputStageOutput,
  ResearchStageInput,
  ResearchStageOutput,
  DesignStageInput,
  DesignStageOutput,
  ImagesStageInput,
  ImagesStageOutput,
  ContentStageInput,
  ContentStageOutput,
  SeoStageInput,
  SeoStageOutput,
  BuildStageInput,
  BuildStageOutput,
  UiUxStageInput,
  UiUxStageOutput,
  ReviewStageInput,
  ReviewStageOutput,
  PublishStageInput,
  PublishStageOutput,
} from "./types";
import { PipelineValidator } from "./validator";
import { ExpectationGenerator } from "./expectation";

// Stage handler type
type StageHandler<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

// Event types
export type PipelineEvent =
  | { type: "stage_started"; stage: PipelineStage; timestamp: Date }
  | { type: "stage_completed"; stage: PipelineStage; duration: number; timestamp: Date }
  | { type: "stage_failed"; stage: PipelineStage; error: string; timestamp: Date }
  | { type: "expectation_generated"; stage: PipelineStage; expectation: unknown; timestamp: Date }
  | { type: "pipeline_completed"; totalDuration: number; timestamp: Date }
  | { type: "pipeline_failed"; stage: PipelineStage; error: string; timestamp: Date }
  | { type: "stage_skipped"; stage: PipelineStage; timestamp: Date }
  | { type: "interactive_pause"; stage: PipelineStage; timestamp: Date };

export type EventListener = (event: PipelineEvent) => void;

export interface PipelineRunnerOptions {
  vibeMode?: boolean;
  domain?: string;
  platform?: "vercel" | "netlify" | "cloudflare" | "custom";
}

export class PipelineRunner {
  private state: PipelineState | null = null;
  private validator: PipelineValidator;
  private expectationGenerator: ExpectationGenerator;
  private listeners: EventListener[] = [];
  private options: PipelineRunnerOptions;

  // Stage handlers - injected from services
  private handlers: {
    input?: StageHandler<InputStageInput, InputStageOutput>;
    research?: StageHandler<ResearchStageInput, ResearchStageOutput>;
    design?: StageHandler<DesignStageInput, DesignStageOutput>;
    images?: StageHandler<ImagesStageInput, ImagesStageOutput>;
    content?: StageHandler<ContentStageInput, ContentStageOutput>;
    seo?: StageHandler<SeoStageInput, SeoStageOutput>;
    build?: StageHandler<BuildStageInput, BuildStageOutput>;
    ui_ux?: StageHandler<UiUxStageInput, UiUxStageOutput>;
    review?: StageHandler<ReviewStageInput, ReviewStageOutput>;
    publish?: StageHandler<PublishStageInput, PublishStageOutput>;
  } = {};

  constructor(options: PipelineRunnerOptions = {}) {
    this.validator = new PipelineValidator();
    this.expectationGenerator = new ExpectationGenerator();
    this.options = {
      vibeMode: false,
      platform: "vercel",
      ...options,
    };
  }

  /**
   * Register stage handlers
   */
  registerHandler<T extends PipelineStage>(
    stage: T,
    handler: StageHandler<unknown, unknown>
  ): void {
    this.handlers[stage] = handler as typeof this.handlers[T];
  }

  /**
   * Add event listener
   */
  addEventListener(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: PipelineEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Initialize new pipeline
   */
  initialize(projectId: string): PipelineState {
    const now = new Date();

    this.state = {
      projectId,
      currentStage: "input",
      startedAt: now,
      updatedAt: now,
      stages: {
        input: { status: "pending" },
        research: { status: "pending" },
        design: { status: "pending" },
        images: { status: "pending" },
        content: { status: "pending" },
        seo: { status: "pending" },
        build: { status: "pending" },
        ui_ux: { status: "pending" },
        review: { status: "pending" },
        publish: { status: "pending" },
      } as unknown as PipelineState["stages"],
      progress: {
        completed: 0,
        total: PIPELINE_STAGES.length,
        percentage: 0,
      },
      vibeMode: this.options.vibeMode || false,
    };

    return this.state;
  }

  /**
   * Get current state
   */
  getState(): PipelineState | null {
    return this.state;
  }

  /**
   * Load existing state
   */
  loadState(state: PipelineState): void {
    this.state = state;
  }

  /**
   * Set vibe mode
   */
  setVibeMode(enabled: boolean): void {
    this.options.vibeMode = enabled;
    if (this.state) {
      this.state.vibeMode = enabled;
    }
  }

  /**
   * Run a specific stage
   */
  async runStage<TInput, TOutput>(
    stage: PipelineStage,
    input: TInput
  ): Promise<TOutput> {
    if (!this.state) {
      throw new Error("Pipeline not initialized");
    }

    // Check if this is an interactive stage in vibe mode
    if (this.options.vibeMode && STAGE_METADATA[stage].isInteractive) {
      this.emit({
        type: "interactive_pause",
        stage,
        timestamp: new Date(),
      });
    }

    const handler = this.handlers[stage];
    if (!handler) {
      throw new Error(`No handler registered for stage: ${stage}`);
    }

    // Validate input
    const validationResult = this.validator.validateStageInput(stage, input);
    if (!validationResult.valid) {
      throw new Error(
        `Invalid input for stage ${stage}: ${validationResult.errors.join(", ")}`
      );
    }

    // Update state - stage started
    const startTime = Date.now();
    this.state.stages[stage] = {
      ...this.state.stages[stage],
      status: "running",
      startedAt: new Date(),
    } as any;
    this.state.currentStage = stage;
    this.state.updatedAt = new Date();

    this.emit({
      type: "stage_started",
      stage,
      timestamp: new Date(),
    });

    try {
      // Execute handler
      const output = (await handler(input as any)) as TOutput;
      const duration = Date.now() - startTime;

      // Validate output
      const outputValidation = this.validator.validateStageOutput(stage, output);
      if (!outputValidation.valid) {
        throw new Error(
          `Invalid output from stage ${stage}: ${outputValidation.errors.join(", ")}`
        );
      }

      // Generate expectation for next stage
      const expectation = this.expectationGenerator.generate(stage, output as never);

      // Update state - stage completed
      this.state.stages[stage] = {
        status: "completed",
        startedAt: this.state.stages[stage].startedAt,
        completedAt: new Date(),
        duration,
        output: output as never,
        expectation: expectation as never,
      } as any;

      // Update progress
      this.updateProgress();

      this.emit({
        type: "stage_completed",
        stage,
        duration,
        timestamp: new Date(),
      });

      this.emit({
        type: "expectation_generated",
        stage,
        expectation,
        timestamp: new Date(),
      });

      return output;
    } catch (error) {
      // Update state - stage failed
      this.state.stages[stage] = {
        ...this.state.stages[stage],
        status: "failed",
        error: {
          message: (error as Error).message,
          code: "STAGE_ERROR",
          recoverable: STAGE_METADATA[stage].canRetry,
        },
      } as any;

      this.emit({
        type: "stage_failed",
        stage,
        error: (error as Error).message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Run full pipeline from current stage
   */
  async runFromCurrent(): Promise<void> {
    if (!this.state) {
      throw new Error("Pipeline not initialized");
    }

    const startIndex = getStageIndex(this.state.currentStage);

    for (let i = startIndex; i < PIPELINE_STAGES.length; i++) {
      const stage = PIPELINE_STAGES[i];

      // In vibe mode, pause at interactive stages
      if (this.options.vibeMode && STAGE_METADATA[stage].isInteractive) {
        this.emit({
          type: "interactive_pause",
          stage,
          timestamp: new Date(),
        });
        return; // Stop and wait for manual input
      }

      const input = this.buildStageInput(stage);

      try {
        await this.runStage(stage, input);
      } catch (error) {
        this.emit({
          type: "pipeline_failed",
          stage,
          error: (error as Error).message,
          timestamp: new Date(),
        });
        throw error;
      }
    }

    const totalDuration = Date.now() - this.state.startedAt.getTime();
    this.emit({
      type: "pipeline_completed",
      totalDuration,
      timestamp: new Date(),
    });
  }

  /**
   * Run single next stage
   */
  async runNext(): Promise<PipelineStage | null> {
    if (!this.state) {
      throw new Error("Pipeline not initialized");
    }

    // Find next pending stage
    const currentIndex = getStageIndex(this.state.currentStage);
    let nextStage: PipelineStage | null = null;

    for (let i = currentIndex; i < PIPELINE_STAGES.length; i++) {
      const stage = PIPELINE_STAGES[i];
      if (this.state.stages[stage].status === "pending") {
        nextStage = stage;
        break;
      }
    }

    if (!nextStage) {
      return null;
    }

    const input = this.buildStageInput(nextStage);
    await this.runStage(nextStage, input);

    return getNextStage(nextStage);
  }

  /**
   * Skip a stage (if allowed)
   */
  skipStage(stage: PipelineStage): void {
    if (!this.state) {
      throw new Error("Pipeline not initialized");
    }

    if (!STAGE_METADATA[stage].canSkip) {
      throw new Error(`Stage ${stage} cannot be skipped`);
    }

    this.state.stages[stage] = {
      status: "skipped",
      completedAt: new Date(),
    };

    this.emit({
      type: "stage_skipped",
      stage,
      timestamp: new Date(),
    });

    this.updateProgress();
  }

  /**
   * Retry a failed stage
   */
  async retryStage(stage: PipelineStage): Promise<void> {
    if (!this.state) {
      throw new Error("Pipeline not initialized");
    }

    if (!STAGE_METADATA[stage].canRetry) {
      throw new Error(`Stage ${stage} cannot be retried`);
    }

    const stageState = this.state.stages[stage];
    if (stageState.status !== "failed") {
      throw new Error(`Stage ${stage} is not in failed state`);
    }

    // Reset stage
    this.state.stages[stage] = { status: "pending" };
    this.state.currentStage = stage;

    // Run stage again
    const input = this.buildStageInput(stage);
    await this.runStage(stage, input);
  }

  /**
   * Build input for a stage from previous outputs
   */
  private buildStageInput(stage: PipelineStage): unknown {
    if (!this.state) {
      throw new Error("Pipeline not initialized");
    }

    const { stages, projectId } = this.state;
    const domain = this.options.domain || `${stages.input.output?.slug || "project"}.example.com`;

    switch (stage) {
      case "input":
        // Input stage gets data from external source
        return { projectId };

      case "research":
        return {
          projectId,
          company: stages.input.output?.company,
          pages: stages.input.output?.pages,
        } as ResearchStageInput;

      case "design":
        return {
          projectId,
          company: stages.input.output?.company,
          research: stages.research.output,
        } as DesignStageInput;

      case "content":
        return {
          projectId,
          company: stages.input.output?.company,
          pages: stages.input.output?.pages,
          research: stages.research.output,
          design: stages.design.output,
        } as ContentStageInput;

      case "seo":
        return {
          projectId,
          company: stages.input.output?.company,
          pages: stages.input.output?.pages,
          content: stages.content.output,
          domain,
        } as SeoStageInput;

      case "build":
        return {
          projectId,
          slug: stages.input.output?.slug,
          config: {
            company: stages.input.output?.company,
            pages: stages.input.output?.pages,
            design: stages.design.output,
            seo: {
              title: stages.input.output?.company.name || "Web Sitesi",
              description: stages.input.output?.company.description || "",
              keywords: stages.research.output?.keywords.primary || [],
            },
            domain,
          },
          content: stages.content.output,
          seoFiles: stages.seo.output?.files,
        } as BuildStageInput;

      case "ui_ux":
        return {
          projectId,
          build: stages.build.output,
          design: stages.design.output,
          previewUrl: stages.build.output?.previewUrl,
        } as UiUxStageInput;

      case "review":
        return {
          projectId,
          company: stages.input.output?.company,
          content: stages.content.output,
          build: stages.build.output,
          uiUx: stages.ui_ux.output,
        } as ReviewStageInput;

      case "publish":
        return {
          projectId,
          slug: stages.input.output?.slug,
          outputPath: stages.build.output?.outputPath,
          previewUrl: stages.build.output?.previewUrl,
          domain,
          platform: this.options.platform || "vercel",
        } as PublishStageInput;

      default:
        return {};
    }
  }

  /**
   * Update progress
   */
  private updateProgress(): void {
    if (!this.state) return;

    const completed = PIPELINE_STAGES.filter(
      (stage) =>
        this.state!.stages[stage].status === "completed" ||
        this.state!.stages[stage].status === "skipped"
    ).length;

    this.state.progress = {
      completed,
      total: PIPELINE_STAGES.length,
      percentage: Math.round((completed / PIPELINE_STAGES.length) * 100),
    };

    this.state.updatedAt = new Date();
  }

  /**
   * Get stage summary
   */
  getStageSummary(): {
    stage: PipelineStage;
    status: StageStatus;
    duration?: number;
    hasOutput: boolean;
    hasExpectation: boolean;
    isInteractive: boolean;
  }[] {
    if (!this.state) return [];

    return PIPELINE_STAGES.map((stage) => ({
      stage,
      status: this.state!.stages[stage].status,
      duration: this.state!.stages[stage].duration,
      hasOutput: !!this.state!.stages[stage].output,
      hasExpectation: !!this.state!.stages[stage].expectation,
      isInteractive: STAGE_METADATA[stage].isInteractive,
    }));
  }

  /**
   * Get expectation for next stage
   */
  getNextExpectation(): unknown | null {
    if (!this.state) return null;

    const currentStageData = this.state.stages[this.state.currentStage];
    return currentStageData.expectation || null;
  }

  /**
   * Export state as JSON
   */
  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import state from JSON
   */
  importState(json: string): void {
    this.state = JSON.parse(json);
  }

  /**
   * Convert state to database-friendly format
   */
  toDbFormat(): {
    projectId: string;
    currentStage: string;
    status: string;
    stages: unknown;
    progress: number;
    startedAt: Date;
    completedAt: Date | null;
    error: string | null;
  } | null {
    if (!this.state) return null;

    const allCompleted = PIPELINE_STAGES.every(
      (stage) =>
        this.state!.stages[stage].status === "completed" ||
        this.state!.stages[stage].status === "skipped"
    );

    const anyFailed = PIPELINE_STAGES.some(
      (stage) => this.state!.stages[stage].status === "failed"
    );

    let status = "RUNNING";
    if (allCompleted) status = "COMPLETED";
    else if (anyFailed) status = "FAILED";

    const failedStage = PIPELINE_STAGES.find(
      (stage) => this.state!.stages[stage].status === "failed"
    );

    return {
      projectId: this.state.projectId,
      currentStage: this.state.currentStage.toUpperCase(),
      status,
      stages: this.state.stages,
      progress: this.state.progress.percentage,
      startedAt: this.state.startedAt,
      completedAt: allCompleted ? new Date() : null,
      error: failedStage
        ? this.state.stages[failedStage].error?.message || null
        : null,
    };
  }
}

// Factory function for creating pipeline runners
export function createPipelineRunner(
  options?: PipelineRunnerOptions
): PipelineRunner {
  return new PipelineRunner(options);
}
