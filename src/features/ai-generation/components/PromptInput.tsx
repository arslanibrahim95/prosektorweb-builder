/**
 * AI Generation Prompt Input Component
 * Provides a rich input interface for website generation prompts
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui';
import { validatePrompt, GENERATION_LIMITS, type PromptValidationResult } from '../lib/validation';
import { createGeneration } from '../actions/generation';
import { Loader2, Sparkles, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/shared/lib';

interface PromptInputProps {
    onGenerationStarted?: (jobId: string) => void;
    onError?: (error: string) => void;
    templateId?: string;
    companyId?: string;
}

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
}

export function PromptInput({
    onGenerationStarted,
    onError,
    templateId,
    companyId
}: PromptInputProps) {
    const [prompt, setPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validation, setValidation] = useState<PromptValidationResult | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(templateId);
    const [showTemplates, setShowTemplates] = useState(false);

    // Validate prompt on change
    const handlePromptChange = useCallback((value: string) => {
        setPrompt(value);
        if (value.length >= GENERATION_LIMITS.PROMPT_MIN_LENGTH) {
            setValidation(validatePrompt(value));
        } else {
            setValidation(null);
        }
    }, []);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validation?.valid) {
            onError?.('Please fix validation errors before submitting');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createGeneration({
                prompt,
                templateId: selectedTemplate,
                companyId,
            });

            if (result.success && result.jobId) {
                onGenerationStarted?.(result.jobId);
                setPrompt('');
                setValidation(null);
            } else {
                onError?.(result.message);
            }
        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Failed to start generation');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Character count color based on usage
    const getCharacterCountColor = () => {
        const ratio = prompt.length / GENERATION_LIMITS.PROMPT_MAX_LENGTH;
        if (ratio > 0.9) return 'text-red-500';
        if (ratio > 0.75) return 'text-yellow-500';
        return 'text-gray-500';
    };

    // Complexity badge
    const getComplexityBadge = () => {
        if (!validation) return null;

        const colors = {
            SIMPLE: 'bg-green-100 text-green-800',
            MODERATE: 'bg-yellow-100 text-yellow-800',
            COMPLEX: 'bg-purple-100 text-purple-800',
        };

        const labels = {
            SIMPLE: 'Simple (~5 min)',
            MODERATE: 'Moderate (~7 min)',
            COMPLEX: 'Complex (~10 min)',
        };

        return (
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', colors[validation.estimatedComplexity])}>
                {labels[validation.estimatedComplexity]}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Template Selector */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        {selectedTemplate ? 'Change Template' : 'Use Template'}
                        <Info className="w-4 h-4" />
                    </button>
                    {getComplexityBadge()}
                </div>

                {/* Prompt Input */}
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        placeholder="Describe the website you want to create... For example: 'Create a professional website for my OSGB company that provides workplace safety services. Include a hero section, services overview, about us, and contact form.'"
                        className={cn(
                            'w-full min-h-[150px] p-4 rounded-lg border-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                            validation?.valid
                                ? 'border-green-300 focus:border-green-500'
                                : validation?.errors.length
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-gray-300 focus:border-blue-500'
                        )}
                        maxLength={GENERATION_LIMITS.PROMPT_MAX_LENGTH}
                        disabled={isSubmitting}
                    />

                    {/* Character Count */}
                    <div className={cn('absolute bottom-3 right-3 text-sm', getCharacterCountColor())}>
                        {prompt.length} / {GENERATION_LIMITS.PROMPT_MAX_LENGTH}
                    </div>
                </div>

                {/* Validation Messages */}
                {validation && (
                    <div className="space-y-2">
                        {validation.errors.length > 0 && (
                            <div className="flex items-start gap-2 text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <ul className="list-disc list-inside">
                                    {validation.errors.map((error, i) => (
                                        <li key={i}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {validation.warnings.length > 0 && (
                            <div className="flex items-start gap-2 text-yellow-600 text-sm">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <ul className="list-disc list-inside">
                                    {validation.warnings.map((warning, i) => (
                                        <li key={i}>{warning}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {validation.valid && (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                <span>Prompt looks good! Ready to generate.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={!validation?.valid || isSubmitting}
                    className="w-full"
                    size="lg"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Starting Generation...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate Website
                        </>
                    )}
                </Button>
            </form>

            {/* Help Text */}
            <div className="text-sm text-gray-500 space-y-1">
                <p>Tips for better results:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Be specific about your business type and services</li>
                    <li>Mention the pages you want (homepage, about, services, contact)</li>
                    <li>Describe your target audience</li>
                    <li>Include any specific features you need</li>
                </ul>
            </div>
        </div>
    );
}
