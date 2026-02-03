/**
 * Expectation Generator
 *
 * Generates predictions for the next stage after each stage completes.
 * This allows the pipeline to show what to expect before running each stage.
 */

import {
  PipelineStage,
  InputStageOutput,
  InputStageExpectation,
  ResearchStageOutput,
  ResearchStageExpectation,
  DesignStageOutput,
  DesignStageExpectation,
  ImagesStageOutput,
  ImagesStageExpectation,
  ContentStageOutput,
  ContentStageExpectation,
  SeoStageOutput,
  SeoStageExpectation,
  BuildStageOutput,
  BuildStageExpectation,
  UiUxStageOutput,
  UiUxStageExpectation,
  ReviewStageOutput,
  ReviewStageExpectation,
  PublishStageOutput,
  PublishStageExpectation,
} from "./types";

type ExpectationMap = {
  input: InputStageExpectation;
  research: ResearchStageExpectation;
  design: DesignStageExpectation;
  images: ImagesStageExpectation;
  content: ContentStageExpectation;
  seo: SeoStageExpectation;
  build: BuildStageExpectation;
  ui_ux: UiUxStageExpectation;
  review: ReviewStageExpectation;
  publish: PublishStageExpectation;
};

type OutputMap = {
  input: InputStageOutput;
  research: ResearchStageOutput;
  design: DesignStageOutput;
  images: ImagesStageOutput;
  content: ContentStageOutput;
  seo: SeoStageOutput;
  build: BuildStageOutput;
  ui_ux: UiUxStageOutput;
  review: ReviewStageOutput;
  publish: PublishStageOutput;
};

export class ExpectationGenerator {
  /**
   * Generate expectation for next stage based on current stage output
   */
  generate<T extends keyof OutputMap>(
    stage: T,
    output: OutputMap[T]
  ): ExpectationMap[T] {
    switch (stage) {
      case "input":
        return this.generateFromInput(output as InputStageOutput) as ExpectationMap[T];
      case "research":
        return this.generateFromResearch(output as ResearchStageOutput) as ExpectationMap[T];
      case "design":
        return this.generateFromDesign(output as DesignStageOutput) as ExpectationMap[T];
      case "images":
        return this.generateFromImages(output as ImagesStageOutput) as ExpectationMap[T];
      case "content":
        return this.generateFromContent(output as ContentStageOutput) as ExpectationMap[T];
      case "seo":
        return this.generateFromSeo(output as SeoStageOutput) as ExpectationMap[T];
      case "build":
        return this.generateFromBuild(output as BuildStageOutput) as ExpectationMap[T];
      case "ui_ux":
        return this.generateFromUiUx(output as UiUxStageOutput) as ExpectationMap[T];
      case "review":
        return this.generateFromReview(output as ReviewStageOutput) as ExpectationMap[T];
      case "publish":
        return this.generateFromPublish(output as PublishStageOutput) as ExpectationMap[T];
      default:
        throw new Error(`Unknown stage: ${stage}`);
    }
  }

  /**
   * Generate expectation after INPUT stage
   */
  private generateFromInput(output: InputStageOutput): InputStageExpectation {
    const { company, pages } = output;

    // Determine research topics based on company data
    const researchTopics: string[] = [];

    if (company.industry) {
      researchTopics.push(`${company.industry} sektoru analizi`);
      researchTopics.push(`${company.industry} rakip analizi`);
    }

    if (company.targetAudience && company.targetAudience.length > 0) {
      researchTopics.push(`Hedef kitle analizi`);
    }

    researchTopics.push("Anahtar kelime arastirmasi");

    // Estimate duration based on number of topics
    const estimatedMinutes = Math.max(2, researchTopics.length * 0.5);

    return {
      nextStage: "research",
      expectedOutputs: {
        researchTopics,
        estimatedDuration: `${Math.round(estimatedMinutes)}-${Math.round(estimatedMinutes + 1)} dakika`,
      },
    };
  }

  /**
   * Generate expectation after RESEARCH stage
   */
  private generateFromResearch(output: ResearchStageOutput): ResearchStageExpectation {
    const { industryData, keywords } = output;

    // Suggest colors based on industry
    const suggestedColors: string[] = [];
    const colorMap: Record<string, string[]> = {
      saglik: ["#0891B2", "#059669"], // Teal, Emerald
      teknoloji: ["#4F46E5", "#6366F1"], // Indigo
      finans: ["#1E40AF", "#047857"], // Blue, Green
      egitim: ["#2563EB", "#7C3AED"], // Blue, Purple
      hukuk: ["#1E293B", "#0F172A"], // Slate
      insaat: ["#EA580C", "#0369A1"], // Orange, Sky
      gida: ["#16A34A", "#CA8A04"], // Green, Yellow
    };

    if (industryData?.name) {
      const industryLower = industryData.name.toLowerCase();
      for (const [key, colors] of Object.entries(colorMap)) {
        if (industryLower.includes(key)) {
          suggestedColors.push(...colors);
        }
      }
    }

    // Default colors if no match
    if (suggestedColors.length === 0) {
      suggestedColors.push("#1E40AF", "#059669");
    }

    // Suggest fonts
    const suggestedFonts = ["Inter", "Poppins", "Montserrat"];

    // Determine design direction
    let designDirection = "modern ve profesyonel";
    if (industryData && industryData.competitors > 10) {
      designDirection = "diferansiye edici ve dikkat cekici";
    }

    return {
      nextStage: "design",
      expectedOutputs: {
        suggestedColors: [...new Set(suggestedColors)],
        suggestedFonts,
        designDirection,
      },
    };
  }

  /**
   * Generate expectation after DESIGN stage
   */
  private generateFromDesign(output: DesignStageOutput): DesignStageExpectation {
    const { layout } = output;

    // Estimate image count based on layout style
    let imageCount = 4; // Base: hero, 3 feature icons
    if (layout.heroType === "image" || layout.heroType === "video") {
      imageCount += 2; // More hero variations
    }
    if (layout.style === "bold") {
      imageCount += 3; // More illustrations
    }

    // Determine image types needed
    const imageTypes = ["hero", "feature-icons"];
    if (layout.heroType === "gradient") {
      imageTypes.push("background-pattern");
    }
    if (layout.style !== "minimal") {
      imageTypes.push("illustrations");
    }

    // Estimate generation time (2 seconds per image with Gemini Imagen)
    const estimatedSeconds = imageCount * 2;
    const estimatedGenerationTime = estimatedSeconds > 60
      ? `${Math.ceil(estimatedSeconds / 60)} dakika`
      : `${estimatedSeconds} saniye`;

    return {
      nextStage: "images",
      expectedOutputs: {
        imageCount,
        imageTypes,
        estimatedGenerationTime,
      },
    };
  }

  /**
   * Generate expectation after IMAGES stage
   */
  private generateFromImages(output: ImagesStageOutput): ImagesStageExpectation {
    const { totalImages } = output;

    // Calculate expected page count based on image distribution
    const pageCount = Math.max(4, Math.ceil(totalImages / 3));

    // Determine content types based on generated images
    const contentTypes = ["hero", "features", "cta"];
    if (output.illustrations.length > 0) {
      contentTypes.push("about-section");
    }
    if (output.backgroundImages.length > 0) {
      contentTypes.push("testimonials");
    }

    // Estimate word count
    const estimatedWordCount = pageCount * 500;

    return {
      nextStage: "content",
      expectedOutputs: {
        pageCount,
        contentTypes,
        estimatedWordCount,
      },
    };
  }

  /**
   * Generate expectation after CONTENT stage
   */
  private generateFromContent(output: ContentStageOutput): ContentStageExpectation {
    const { pages } = output;

    // Determine SEO files to generate
    const seoFiles = [
      "robots.txt",
      "sitemap.xml",
      "manifest.json",
    ];

    // Determine schema types
    const schemaTypes = ["Organization", "WebSite"];
    if (pages.some((p) => p.type === "faq")) {
      schemaTypes.push("FAQPage");
    }
    if (pages.some((p) => p.type === "services")) {
      schemaTypes.push("Service");
    }

    // Estimate SEO score based on content quality
    const avgReadability = output.averageReadabilityScore || 70;
    const hasAllRequiredPages = pages.length >= 4;
    const estimatedSeoScore = Math.min(
      100,
      Math.round((avgReadability * 0.4 + (hasAllRequiredPages ? 60 : 40)))
    );

    return {
      nextStage: "seo",
      expectedOutputs: {
        seoFiles,
        schemaTypes,
        estimatedSeoScore,
      },
    };
  }

  /**
   * Generate expectation after SEO stage
   */
  private generateFromSeo(output: SeoStageOutput): SeoStageExpectation {
    const { files, sitemapUrls } = output;

    // Calculate expected output files
    const outputFiles = [
      "index.html",
      ...sitemapUrls.map((url) => {
        try {
          const path = new URL(url).pathname;
          return path === "/" ? "index.html" : `${path}/index.html`;
        } catch {
          return "page.html";
        }
      }),
      ...files.map((f) => f.filename),
    ];

    // Estimate build duration based on page count
    const pageCount = sitemapUrls.length;
    const baseDuration = 60; // 60 seconds base
    const perPageDuration = 5; // 5 seconds per page
    const estimatedSeconds = baseDuration + pageCount * perPageDuration;

    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    const buildDuration =
      minutes > 0 ? `${minutes} dk ${seconds} sn` : `${seconds} sn`;

    // Determine optimization level
    let optimizationLevel = "standard";
    if (pageCount > 20) {
      optimizationLevel = "aggressive";
    } else if (pageCount < 10) {
      optimizationLevel = "full";
    }

    return {
      nextStage: "build",
      expectedOutputs: {
        outputFiles: [...new Set(outputFiles)],
        buildDuration,
        optimizationLevel,
      },
    };
  }

  /**
   * Generate expectation after BUILD stage
   */
  private generateFromBuild(output: BuildStageOutput): BuildStageExpectation {
    const { buildStats, lighthouse } = output;

    // Determine UI/UX checks
    const uiuxChecks = [
      "Lighthouse performans",
      "Erisilebilirlik (a11y)",
      "Responsive tasarim",
      "Renk kontrast kontrolu",
      "Typography hiyerarsisi",
      "Form UX",
      "Loading state'ler",
    ];

    // Identify potential issues based on build stats
    const potentialIssues: string[] = [];

    if (buildStats && buildStats.bundleSize > 500000) {
      potentialIssues.push("Bundle boyutu yuksek - optimizasyon gerekebilir");
    }

    if (lighthouse) {
      if (lighthouse.performance < 80) {
        potentialIssues.push("Performans skoru dusuk");
      }
      if (lighthouse.accessibility < 90) {
        potentialIssues.push("Erisilebilirlik iyilestirmesi gerekebilir");
      }
      if (lighthouse.seo < 90) {
        potentialIssues.push("SEO optimizasyonu gerekebilir");
      }
    }

    // Estimate quality score
    let qualityScore = 85;
    if (lighthouse) {
      qualityScore = Math.round(
        (lighthouse.performance +
          lighthouse.accessibility +
          lighthouse.bestPractices +
          lighthouse.seo) /
        4
      );
    }
    qualityScore -= potentialIssues.length * 5;

    return {
      nextStage: "ui_ux",
      expectedOutputs: {
        uiuxChecks,
        potentialIssues,
        qualityScore: Math.max(0, Math.min(100, qualityScore)),
      },
    };
  }

  /**
   * Generate expectation after UI_UX stage
   */
  private generateFromUiUx(output: UiUxStageOutput): UiUxStageExpectation {
    const criticalChecks = output.checks
      .filter((c) => c.status === "fail")
      .map((c) => c.name);

    return {
      nextStage: "review",
      expectedOutputs: {
        estimatedScore: output.overallScore,
        criticalChecks,
      },
    };
  }

  /**
   * Generate expectation after REVIEW stage
   */
  private generateFromReview(output: ReviewStageOutput): ReviewStageExpectation {
    const { blockers, readyForPublish } = output;

    // Determine deployment platform
    const deploymentPlatform = "vercel";

    // Estimate deploy time
    const estimatedDeployTime = "1-2 dakika";

    // Required actions before publish
    const requiredActions: string[] = [];

    if (!readyForPublish) {
      requiredActions.push("Blocker sorunlari coz");
    }

    if (blockers.length > 0) {
      blockers.forEach((blocker) => {
        requiredActions.push(`Duzelt: ${blocker.name}`);
      });
    }

    if (requiredActions.length === 0) {
      requiredActions.push("Yayin onayi ver");
    }

    return {
      nextStage: "publish",
      expectedOutputs: {
        deploymentPlatform,
        estimatedDeployTime,
        requiredActions,
      },
    };
  }

  /**
   * Generate expectation after PUBLISH stage (final stage)
   */
  private generateFromPublish(output: PublishStageOutput): PublishStageExpectation {
    const { url } = output;

    return {
      nextStage: null,
      expectedOutputs: {
        liveUrl: url,
        monitoringSetup: true,
        analyticsSetup: true,
      },
    };
  }

  /**
   * Get expectation summary as human-readable text
   */
  getSummary<T extends PipelineStage>(
    stage: T,
    expectation: ExpectationMap[T]
  ): string {
    const exp = expectation as unknown as Record<string, unknown>;
    const outputs = exp.expectedOutputs as Record<string, unknown>;
    const nextStage = exp.nextStage as string | null;

    if (!nextStage) {
      return "Pipeline tamamlandi. Site yayinda!";
    }

    const summaryParts: string[] = [];

    for (const [key, value] of Object.entries(outputs)) {
      if (Array.isArray(value)) {
        summaryParts.push(`${this.formatKey(key)}: ${value.length} oge`);
      } else if (typeof value === "number") {
        summaryParts.push(`${this.formatKey(key)}: ${value}`);
      } else if (typeof value === "string") {
        summaryParts.push(`${this.formatKey(key)}: ${value}`);
      }
    }

    return summaryParts.join(" | ");
  }

  /**
   * Format key to readable text
   */
  private formatKey(key: string): string {
    const map: Record<string, string> = {
      researchTopics: "Arastirma konulari",
      estimatedDuration: "Tahmini sure",
      suggestedColors: "Onerilen renkler",
      suggestedFonts: "Onerilen fontlar",
      designDirection: "Tasarim yonu",
      pageCount: "Sayfa sayisi",
      contentTypes: "Icerik turleri",
      estimatedWordCount: "Tahmini kelime",
      seoFiles: "SEO dosyalari",
      schemaTypes: "Schema turleri",
      estimatedSeoScore: "Tahmini SEO skoru",
      outputFiles: "Cikti dosyalari",
      buildDuration: "Derleme suresi",
      optimizationLevel: "Optimizasyon",
      reviewChecks: "Inceleme kontrolleri",
      potentialIssues: "Olasi sorunlar",
      qualityScore: "Kalite skoru",
      deploymentPlatform: "Deploy platformu",
      estimatedDeployTime: "Deploy suresi",
      requiredActions: "Gerekli aksiyonlar",
      liveUrl: "Canli URL",
      monitoringSetup: "Monitoring",
      analyticsSetup: "Analytics",
    };

    return map[key] || key;
  }
}
