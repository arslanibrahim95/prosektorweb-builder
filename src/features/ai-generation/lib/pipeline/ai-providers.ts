/**
 * AI Provider Configuration for Pipeline Stages
 *
 * Cost-optimized CLI-based pipeline:
 * - Gemini Flash: Research (large context, cheap)
 * - GLM-4: Design & Content (structured output, cost-effective)
 * - Claude Sonnet: Build (best code quality)
 * - Codex/GPT-4o: Review (code analysis)
 */

export type AIProvider =
  | "claude"
  | "chatgpt"
  | "gemini"
  | "gemini-imagen"
  | "glm"
  | "codex"
  | "manual";

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  apiKeyEnv: string;
  cliCommand: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
  description: string;
  costPer1kTokens: {
    input: number;
    output: number;
  };
}

// Provider configurations with CLI commands
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  gemini: {
    provider: "gemini",
    model: "gemini-2.0-flash",
    apiKeyEnv: "GOOGLE_AI_API_KEY",
    cliCommand: "gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    maxTokens: 8192,
    temperature: 0.7,
    description: "Arastirma - buyuk context, dusuk maliyet",
    costPer1kTokens: { input: 0.000075, output: 0.0003 }, // Very cheap
  },
  "gemini-imagen": {
    provider: "gemini-imagen",
    model: "imagen-3.0-generate-002",
    apiKeyEnv: "GOOGLE_AI_API_KEY",
    cliCommand: "gemini-imagen",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict",
    maxTokens: 1024,
    temperature: 0.8,
    description: "Gorsel uretimi - hero, ikon, arkaplan",
    costPer1kTokens: { input: 0.02, output: 0.04 }, // Per image pricing
  },
  glm: {
    provider: "glm",
    model: "glm-4-plus",
    apiKeyEnv: "ZHIPU_API_KEY",
    cliCommand: "glm",
    endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    maxTokens: 4096,
    temperature: 0.7,
    description: "Tasarim & Icerik - yapisal cikti, ekonomik",
    costPer1kTokens: { input: 0.001, output: 0.001 }, // Cheap
  },
  claude: {
    provider: "claude",
    model: "claude-sonnet-4-20250514",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    cliCommand: "claude",
    endpoint: "https://api.anthropic.com/v1/messages",
    maxTokens: 8192,
    temperature: 0.7,
    description: "Build - en temiz kod uretimi",
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  chatgpt: {
    provider: "chatgpt",
    model: "gpt-4o",
    apiKeyEnv: "OPENAI_API_KEY",
    cliCommand: "openai",
    endpoint: "https://api.openai.com/v1/chat/completions",
    maxTokens: 4096,
    temperature: 0.8,
    description: "Genel amacli - fallback",
    costPer1kTokens: { input: 0.0025, output: 0.01 },
  },
  codex: {
    provider: "codex",
    model: "gpt-4o",
    apiKeyEnv: "OPENAI_API_KEY",
    cliCommand: "codex",
    endpoint: "https://api.openai.com/v1/responses",
    maxTokens: 4096,
    temperature: 0.2,
    description: "Review - kod inceleme ve kalite kontrol",
    costPer1kTokens: { input: 0.0025, output: 0.01 },
  },
  manual: {
    provider: "manual",
    model: "human",
    apiKeyEnv: "",
    cliCommand: "read",
    description: "Manuel islem - insan mudahalesi",
    costPer1kTokens: { input: 0, output: 0 },
  },
};

// Cost-optimized stage to AI Provider mapping
export interface StageAIConfig {
  primary: AIProvider;
  fallback?: AIProvider;
  isAutomated: boolean;
  cliTemplate: string;
  systemPrompt: string;
  outputFormat: "text" | "json" | "code" | "markdown";
}

export const STAGE_AI_CONFIG: Record<string, StageAIConfig> = {
  input: {
    primary: "manual",
    isAutomated: false,
    cliTemplate: "read",
    systemPrompt: "",
    outputFormat: "text",
  },
  research: {
    primary: "gemini",
    fallback: "chatgpt",
    isAutomated: true,
    cliTemplate: `cat {{input}} | gemini chat --model gemini-2.0-flash`,
    systemPrompt: `Sen bir web projesi arastirma uzmanisin. Verilen firma bilgilerine gore:
1. Sektor analizi yap
2. Rakip web sitelerini analiz et
3. Anahtar kelime onerileri sun
4. Hedef kitle analizi yap
5. Teknik gereksinimler listele

Detayli ve yapilandirilmis Markdown formatinda cikti ver.`,
    outputFormat: "markdown",
  },
  design: {
    primary: "glm",
    fallback: "claude",
    isAutomated: true,
    cliTemplate: `cat {{input}} | glm chat --model glm-4-plus`,
    systemPrompt: `Sen bir sistem mimari ve UI/UX tasarimcisin. Arastirma ciktisini okuyarak:
1. Site mimarisi (sayfa yapisi)
2. Renk paleti (hex kodlari)
3. Tipografi secimi
4. Layout yapisi
5. Komponent listesi

SADECE JSON formatinda cikti ver. Aciklama yapma.`,
    outputFormat: "json",
  },
  images: {
    primary: "gemini",
    fallback: "chatgpt",
    isAutomated: true,
    cliTemplate: `cat {{input}} | gemini-imagen --model imagen-3.0-generate-002`,
    systemPrompt: `Tasarim bilgilerine gore asagidaki gorselleri uret:

1. HERO GORSELI: Ana sayfa icin etkileyici, profesyonel hero gorseli
   - Boyut: 1920x1080
   - Stil: Modern, temiz, kurumsal

2. FEATURE IKONLARI: Her ozellik icin minimal ikon (4-6 adet)
   - Boyut: 256x256
   - Stil: Flat, tek renk, modern

3. ARKAPLAN DESENLERI: Sayfa arkaplanları icin subtle desenler
   - Boyut: 1920x1080
   - Stil: Gradient veya geometrik

4. ILLUSTRASYONLAR: Hizmet/about sayfalari icin
   - Boyut: 800x600
   - Stil: Isometric veya flat illustration

Renk paleti tasarimdaki renklere uygun olsun.
Her gorsel icin ayri prompt ve dosya adi belirt.`,
    outputFormat: "json",
  },
  content: {
    primary: "glm",
    fallback: "chatgpt",
    isAutomated: true,
    cliTemplate: `cat {{input}} | glm chat --model glm-4-flash`,
    systemPrompt: `Sen profesyonel bir icerik yazarisin. Tasarim JSON'unu okuyarak her sayfa icin:
1. Baslik ve alt basliklar
2. Ana icerik (paragraflar)
3. CTA metinleri
4. Meta description
5. SSS icerikleri

Turkce, akici, SEO uyumlu icerikler uret.`,
    outputFormat: "markdown",
  },
  seo: {
    primary: "gemini",
    fallback: "glm",
    isAutomated: true,
    cliTemplate: `cat {{input}} | gemini chat --model gemini-2.0-flash`,
    systemPrompt: `Sen bir SEO uzmanisin. Icerik ve site yapisina gore:
1. robots.txt
2. sitemap.xml
3. Schema.org JSON-LD
4. Meta tag optimizasyonu
5. Open Graph / Twitter Cards

Teknik dosyalari kod bloklari icinde ver.`,
    outputFormat: "code",
  },
  build: {
    primary: "claude",
    fallback: "chatgpt",
    isAutomated: true,
    cliTemplate: `cat {{input}} | claude chat --model claude-sonnet-4-20250514`,
    systemPrompt: `Sen uzman bir Next.js geliştiricisisin. Tasarim JSON'u ve icerikleri okuyarak:
1. Next.js 15 App Router yapisi
2. Tailwind CSS ile responsive tasarim
3. Shadcn/ui komponentleri
4. TypeScript tip guvenligi
5. Performans optimizasyonu

SADECE production-ready kod uret. Aciklama yapma.`,
    outputFormat: "code",
  },
  ui_ux: {
    primary: "codex",
    fallback: "claude",
    isAutomated: true,
    cliTemplate: `cat {{input}} | codex --model gpt-4o`,
    systemPrompt: `Sen bir UI/UX uzmanisin. Build ciktisini analiz ederek:
1. Gorsel tutarlilik kontrolu
2. Responsive tasarim testi
3. Erisilebilirlik (a11y) kontrolu
4. Renk kontrast analizi (WCAG 2.1)
5. Typography hiyerarsi kontrolu
6. Form UX degerlendirmesi
7. Loading state kontrolu

Sorunlari severity ile raporla ve cozum oner.
Lighthouse minimum skorlari:
- Performance: 70+
- Accessibility: 90+
- Best Practices: 80+
- SEO: 90+`,
    outputFormat: "json",
  },
  review: {
    primary: "codex",
    fallback: "claude",
    isAutomated: true,
    cliTemplate: `cat {{input}} | codex --model gpt-4o`,
    systemPrompt: `Sen bir kod kalite kontrol uzmanisin. Uretilen kodu incele:
1. Guvenlik aciklari (XSS, injection vb.)
2. Mantik hatalari
3. Performans sorunlari
4. Best practices uyumu
5. Erisilebilirlik (a11y)

Sorun varsa duzeltilmis kodu, yoksa "APPROVED" yaz.`,
    outputFormat: "code",
  },
  publish: {
    primary: "manual",
    isAutomated: false,
    cliTemplate: "vercel deploy",
    systemPrompt: "",
    outputFormat: "text",
  },
};

/**
 * Get AI provider config for a stage
 */
export function getStageAIProvider(stage: string): {
  config: AIProviderConfig;
  stageConfig: StageAIConfig;
} {
  const stageConfig = STAGE_AI_CONFIG[stage] || STAGE_AI_CONFIG.input;
  const config = AI_PROVIDERS[stageConfig.primary];

  return { config, stageConfig };
}

/**
 * Check if AI provider is configured (API key exists)
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  if (provider === "manual") return true;

  const config = AI_PROVIDERS[provider];
  return !!process.env[config.apiKeyEnv];
}

/**
 * Get available providers for a stage (configured ones only)
 */
export function getAvailableProvidersForStage(stage: string): AIProvider[] {
  const stageConfig = STAGE_AI_CONFIG[stage];
  if (!stageConfig) return ["manual"];

  const available: AIProvider[] = [];

  if (isProviderConfigured(stageConfig.primary)) {
    available.push(stageConfig.primary);
  }

  if (stageConfig.fallback && isProviderConfigured(stageConfig.fallback)) {
    available.push(stageConfig.fallback);
  }

  if (!available.includes("manual")) {
    available.push("manual");
  }

  return available;
}

/**
 * Estimate cost for a pipeline run
 */
export function estimatePipelineCost(
  stages: string[],
  avgTokensPerStage: number = 2000
): {
  totalInputCost: number;
  totalOutputCost: number;
  totalCost: number;
  breakdown: { stage: string; provider: string; cost: number }[];
} {
  const breakdown: { stage: string; provider: string; cost: number }[] = [];
  let totalInputCost = 0;
  let totalOutputCost = 0;

  for (const stage of stages) {
    const { config } = getStageAIProvider(stage);
    const inputCost = (avgTokensPerStage / 1000) * config.costPer1kTokens.input;
    const outputCost = (avgTokensPerStage / 1000) * config.costPer1kTokens.output;
    const stageCost = inputCost + outputCost;

    totalInputCost += inputCost;
    totalOutputCost += outputCost;

    breakdown.push({
      stage,
      provider: config.provider,
      cost: stageCost,
    });
  }

  return {
    totalInputCost,
    totalOutputCost,
    totalCost: totalInputCost + totalOutputCost,
    breakdown,
  };
}

/**
 * Generate CLI command for a stage
 */
export function generateCLICommand(
  stage: string,
  inputFile: string,
  outputFile: string
): string {
  const { config, stageConfig } = getStageAIProvider(stage);

  if (config.provider === "manual") {
    return `# Manual step: ${stage}`;
  }

  const systemPromptArg = stageConfig.systemPrompt
    ? `--system "${stageConfig.systemPrompt.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`
    : "";

  return `cat ${inputFile} | ${config.cliCommand} chat --model ${config.model} ${systemPromptArg} > ${outputFile}`;
}
