import Groq from 'groq-sdk';

export interface BrandData {
  primaryColors: string[];
  brandVoice: string;
  designGuidelines: string[];
  typography?: {
    primaryFont?: string;
    secondaryFont?: string;
    fontWeights?: string[];
    headingStyle?: string;
  };
  spacing?: {
    baseUnit?: string;
    scale?: string;
  };
  layoutPatterns?: string[];
  websiteScreenshot?: string; // Base64 encoded screenshot
}

export interface VisionAnalysis {
  score: number;
  colorConsistency: number;
  typographyScale: number;
  spacingRhythm: number;
  accessibility: number;
  feedback: string[];
  recommendations: string[];
}

class GroqClient {
  private client: Groq | null = null;
  private apiKey: string | null = null;
  private readonly TEXT_MODEL = 'llama-3.3-70b-versatile';
  private readonly VISION_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct';

  constructor() {
    // Try to read build-time env, but do NOT throw — allow runtime configuration
    // @ts-ignore - Webpack DefinePlugin may inject this
    const apiKey = (typeof window !== 'undefined' && (import.meta as any)?.env?.VITE_GROQ_API_KEY) || null;
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  /**
   * Check if text contains explicit or inappropriate content using Purgomalum API
   */
  private async containsExplicitContent(text: string): Promise<boolean> {
    if (!text || typeof text !== 'string') return false;
    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodedText}`);
      if (!response.ok) {
        console.warn('Purgomalum API failed, assuming clean content');
        return false;
      }
      const result = await response.text();
      return result.trim().toLowerCase() === 'true';
    } catch (error) {
      console.warn('Error checking content:', error);
      return false; // Fail-safe: assume clean if API fails
    }
  }

  /**
   * Check if the user is online
   */
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  /**
   * Categorize network errors for better user feedback
   */
  private categorizeError(error: any): { message: string; isRetryable: boolean } {
    if (!this.isOnline()) {
      return { message: 'No internet connection. Please check your network and try again.', isRetryable: true };
    }

    if (error?.status === 429) {
      return { message: 'Too many requests. Please wait a moment and try again.', isRetryable: true };
    }

    if (error?.status === 401) {
      return { message: 'API key is invalid or expired. Please check your settings.', isRetryable: false };
    }

    if (error?.status === 403) {
      return { message: 'Access denied. Please check your API key permissions.', isRetryable: false };
    }

    if (error?.status >= 500) {
      return { message: 'Server error. Please try again in a few moments.', isRetryable: true };
    }

    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return { message: 'Request timed out. Please try again.', isRetryable: true };
    }

    return { message: error?.message || 'An unexpected error occurred. Please try again.', isRetryable: true };
  }

  /**
   * Retry utility for API calls with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Use error categorization to determine if we should retry
        const { message, isRetryable } = this.categorizeError(error);
        
        // Create a new error with the categorized message
        const categorizedError = new Error(message);
        (categorizedError as any).originalError = lastError;
        (categorizedError as any).isRetryable = isRetryable;

        // Don't retry on non-retryable errors
        if (!isRetryable) {
          throw categorizedError;
        }

        // If this was the last attempt, throw the categorized error
        if (attempt === maxRetries) {
          throw categorizedError;
        }

        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Simple in-memory cache for API responses
   */
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  /**
   * Set cached data with TTL (time to live in milliseconds)
   */
  private setCachedData(key: string, data: any, ttl: number = 30 * 60 * 1000): void { // Default 30 minutes
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  /**
   * Set the Groq API key at runtime and initialize the SDK client.
   */
  setApiKey(apiKey: string) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      this.client = null;
      this.apiKey = null;
      return;
    }

    this.apiKey = apiKey.trim();
    this.client = new Groq({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  private ensureClient() {
    if (!this.client) {
      throw new Error('Groq API key not configured. Set your Groq API key in Settings.');
    }
    return this.client;
  }

  /**
   * Check user input content using AI (Groq)
   */
  private async checkUserInput(text: string): Promise<void> {
    if (!text || typeof text !== 'string') return;

    try {
      const client = this.ensureClient();
      const prompt = `Analyze this user input for explicit, inappropriate, or harmful content. If it contains any of the following, respond with "REJECT":
- Profanity, swear words, or offensive language
- Hate speech, racism, sexism, or discrimination
- Threats, violence, or harmful content
- Sexual content, pornography, or lewd material
- Illegal activities or harmful instructions

User input: "${text}"

If the content is inappropriate, respond with only "REJECT". If it's safe, respond with only "APPROVE".`;

      const completion = await this.retryWithBackoff(async () => {
        return client.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: this.TEXT_MODEL,
          temperature: 0,
          max_tokens: 10,
        });
      });

      const response = completion.choices[0]?.message?.content?.trim().toUpperCase();
      if (response === 'REJECT') {
        throw new Error('Input content contains inappropriate material. Please provide clean content.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('inappropriate')) {
        throw error; // Re-throw our custom error
      }
      console.warn('User input check failed:', error);
      // Allow content if check fails (fail-open for user experience)
    }
  }

  /**
   * Check AI output content using key-less API (Purgomalum)
   */
  private async checkAIOutput(text: string): Promise<void> {
    if (!text || typeof text !== 'string') return;

    try {
      // Use Purgomalum API (key-less profanity checker)
      const encodedText = encodeURIComponent(text);
      const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodedText}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
      });

      if (!response.ok) {
        throw new Error(`Purgomalum API error: ${response.status}`);
      }

      const result = await response.text();
      if (result.toLowerCase() === 'true') {
        throw new Error('Generated content contains inappropriate material. Please try again.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('inappropriate')) {
        throw error; // Re-throw our custom error
      }
      console.warn('AI output check failed:', error);
      // Allow content if check fails (fail-open)
    }
  }

  /**
   * Extract brand identity with AI input validation
   */
  async extractBrandIdentity(
    websiteContent: string, 
    language: string = 'en',
    screenshot?: string,
    signal?: AbortSignal
  ): Promise<BrandData> {
    // Create cache key based on input parameters
    const cacheKey = `brand_${language}_${screenshot ? 'with_image' : 'text_only'}_${btoa(websiteContent).slice(0, 50)}`;
    
    // Check cache first
    const cachedResult = this.getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const languageNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
    const responseLang = languageNames[language] || 'English';
    
    // Check user input with AI
    await this.checkUserInput(websiteContent);
    
    try {
      // Determine which model to use based on input type
      const useVisionModel = !!screenshot;
      const modelToUse = useVisionModel ? this.VISION_MODEL : this.TEXT_MODEL;
      
      let prompt: string;
      const messages: any[] = [
        {
          role: 'system',
          content: 'You are a brand analysis expert. Return only valid JSON. No markdown. No explanations.'
        },
      ];

      if (screenshot) {
        // Use vision model with screenshot for accurate color extraction
        prompt = `Analyze this brand screenshot and extract the brand identity. Return ONLY valid JSON in ${responseLang}.

ANALYSIS REQUIREMENTS:
1. primaryColors: EXACTLY 3-5 hex color codes from the most prominent brand colors in the image
2. brandVoice: 2-3 sentences describing the brand's personality and target audience based on visual elements
3. designGuidelines: EXACTLY 4 key design patterns observed in the screenshot
4. typography: Font styles and weights visible in the image
5. spacing: Spacing patterns observed in the layout
6. layoutPatterns: 2-3 layout approaches used in the design

REQUIRED FORMAT:
{
  "primaryColors": ["#HEXCOD", "#HEXCOD", "#HEXCOD"],
  "brandVoice": "Sentence 1. Sentence 2. Sentence 3.",
  "designGuidelines": ["Pattern 1", "Pattern 2", "Pattern 3", "Pattern 4"],
  "typography": {
    "primaryFont": "Font family observed",
    "secondaryFont": "Secondary font if visible", 
    "fontWeights": ["400", "600", "700"],
    "headingStyle": "Heading styles observed"
  },
  "spacing": {
    "baseUnit": "8px",
    "scale": "4px, 8px, 16px, 24px, 32px"
  },
  "layoutPatterns": ["Grid-based", "Centered content", "Card layouts"]
}`;

        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshot}` } }
          ],
        });
      } else {
        // Use text model for URL/website content analysis
        prompt = `Analyze the brand from this website content and extract brand identity. Return ONLY valid JSON in ${responseLang}.

WEBSITE CONTENT:
${websiteContent}

ANALYSIS REQUIREMENTS:
1. primaryColors: EXACTLY 3-5 hex color codes that would represent this brand's color scheme
2. brandVoice: 2-3 sentences describing the brand's personality and target audience
3. designGuidelines: EXACTLY 4 key design principles for this brand
4. typography: Recommended typography system for this brand
5. spacing: Recommended spacing system for this brand
6. layoutPatterns: 2-3 recommended layout approaches for this brand

REQUIRED FORMAT:
{
  "primaryColors": ["#HEXCOD", "#HEXCOD", "#HEXCOD"],
  "brandVoice": "Sentence 1. Sentence 2. Sentence 3.",
  "designGuidelines": ["Pattern 1", "Pattern 2", "Pattern 3", "Pattern 4"],
  "typography": {
    "primaryFont": "Recommended primary font",
    "secondaryFont": "Recommended secondary font", 
    "fontWeights": ["400", "600", "700"],
    "headingStyle": "Recommended heading style"
  },
  "spacing": {
    "baseUnit": "8px",
    "scale": "4px, 8px, 16px, 24px, 32px"
  },
  "layoutPatterns": ["Recommended layout pattern 1", "Recommended layout pattern 2"]
}`;

        messages.push({
          role: 'user',
          content: prompt,
        });
      }

      const client = this.ensureClient();

      const completion = await this.retryWithBackoff(async () => {
        return client.chat.completions.create({
          messages,
          model: modelToUse,
          temperature: 0.1,
          max_tokens: 1024,
          response_format: ({ type: 'json_object' } as any),
        });
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      // Clean up response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const brandData = JSON.parse(cleanedResponse) as BrandData;

      // Check AI output with key-less API
      await this.checkAIOutput(brandData.brandVoice);
      await this.checkAIOutput(brandData.designGuidelines.join(' '));

      // Validate required fields
      if (!brandData.primaryColors || !Array.isArray(brandData.primaryColors) || brandData.primaryColors.length < 3) {
        throw new Error('Invalid brand analysis: missing or insufficient primary colors');
      }

      // Validate and normalize color formats
      brandData.primaryColors = brandData.primaryColors.slice(0, 5).map(c => {
        if (typeof c !== 'string' || c.trim() === '') {
          throw new Error('Invalid color format in brand analysis');
        }
        // Ensure hex format
        const hexColor = c.startsWith('#') ? c : `#${c}`;
        return hexColor.toUpperCase();
      });

      if (!brandData.brandVoice || typeof brandData.brandVoice !== 'string' || brandData.brandVoice.trim().length < 20) {
        throw new Error('Invalid brand analysis: insufficient brand voice description');
      }

      if (!brandData.designGuidelines || !Array.isArray(brandData.designGuidelines) || brandData.designGuidelines.length < 4) {
        throw new Error('Invalid brand analysis: insufficient design guidelines');
      }

      // Trim to expected sizes
      brandData.designGuidelines = brandData.designGuidelines.slice(0, 4);

      // Preserve optional fields only if provided by AI
      if (screenshot) {
        brandData.websiteScreenshot = screenshot;
      }

      // Cache the result for future use
      this.setCachedData(cacheKey, brandData);

      return brandData;
    } catch (error) {
      // Re-throw validation errors with user-friendly messages
      if (error instanceof Error) {
        throw new Error(`Brand analysis failed: ${error.message}`);
      }
      throw new Error('Brand analysis failed: Unable to process the provided content. Please try again.');
    }
  }

  /**
   * Generate Firefly prompt based on brand context and trend
   */
  async generateFireflyPrompt(
    trend: string,
    brandContext: BrandData,
    includeTrendySuggestions: boolean = false,
    selectedEvents: string[] = [],
    language: string = 'en'
  ): Promise<string> {
    const languageNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
    const responseLang = languageNames[language] || 'English';
    
    // Check user inputs with AI
    await this.checkUserInput(trend);
    await this.checkUserInput(brandContext.brandVoice);
    
    try {
      const prompt = `Create a concise Adobe Firefly prompt (max 100 words) in ${responseLang} for: ${trend}

Brand: ${brandContext.primaryColors.slice(0, 3).join(', ')} colors, ${brandContext.brandVoice.split('.')[0]}

Include: style, composition, lighting, mood, brand colors. Be specific and direct.`;

      const client = this.ensureClient();

      const completion = await this.retryWithBackoff(async () => {
        return client.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: this.TEXT_MODEL,
          temperature: 0.2,
          max_tokens: 200,
        });
      });

      const result = completion.choices[0]?.message?.content;
      if (!result || typeof result !== 'string' || result.trim().length < 10) {
        throw new Error('Invalid response from Firefly prompt generator');
      }

      // Check AI output with key-less API
      await this.checkAIOutput(result);

      return result;
    } catch (error) {
      // Re-throw with user-friendly message instead of logging
      if (error instanceof Error) {
        throw new Error(`Firefly prompt generation failed: ${error.message}`);
      }
      throw new Error('Firefly prompt generation failed: Unable to generate creative prompt. Please try again.');
    }
  }

  /**
   * Get AI-generated viral trends and festivals tailored to brand identity
   */
  async getViralTrends(brandData?: BrandData, language: string = 'en'): Promise<Array<{ id: string; name: string; desc: string }>> {
    const languageNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
    const responseLang = languageNames[language] || 'English';
    
    // Check user inputs with AI
    if (brandData) {
      await this.checkUserInput(brandData.brandVoice);
      await this.checkUserInput(brandData.designGuidelines.join(' '));
    }
    
    try {
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const brandContext = brandData ? `

Brand Context to Consider:
- Brand Voice: ${brandData.brandVoice}
- Primary Colors: ${brandData.primaryColors.join(', ')}
- Design Guidelines: ${brandData.designGuidelines.join('; ')}

Tailor trend suggestions that align with this brand's identity, voice, and aesthetic preferences.` : '';

      const prompt = `You are a design trend expert. Based on today's date (${currentDate}), suggest 8-12 trending design styles, viral content themes, and relevant upcoming festivals/events in ${responseLang}.${brandContext}

Consider:
- Current social media trends (TikTok, Instagram, etc.)
- Upcoming festivals and holidays in the next 2 months
- Viral visual aesthetics
- Popular design movements
- Seasonal themes

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "kebab-case-id",
    "name": "Trend Name",
    "desc": "Brief description (under 60 chars)"
  }
]

Include a mix of:
- Design aesthetics (minimalist, maximalist, glassmorphism, etc.)
- Viral content styles (before/after, POV, tutorial, etc.)
- Relevant festivals/events (Valentine's, Lunar New Year, etc.)
- Current trending themes

Return ONLY the JSON array, no markdown formatting or additional text.`;

      const client = this.ensureClient();

      const completion = await this.retryWithBackoff(async () => {
        return client.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: this.TEXT_MODEL,
          temperature: 0.3,
          max_tokens: 1024,
        });
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      
      // Clean up response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const trends = JSON.parse(cleanedResponse) as Array<{ id: string; name: string; desc: string }>;

      // Check AI outputs with key-less API
      for (const trend of trends) {
        await this.checkAIOutput(trend.name);
        await this.checkAIOutput(trend.desc);
      }

      // Validate response
      if (!Array.isArray(trends) || trends.length === 0) {
        throw new Error('Invalid trends response');
      }

      return trends;
    } catch (error) {
      // Re-throw with user-friendly message instead of logging
      if (error instanceof Error) {
        throw new Error(`Trend analysis failed: ${error.message}`);
      }
      throw new Error('Trend analysis failed: Unable to fetch current trends. Please try again.');
    }
  }

  /**
   * Analyze design against brand guidelines using vision model
   */
  async analyzeDesign(
    imageBase64: string,
    brandGuidelines: BrandData,
    language: string = 'en'
  ): Promise<VisionAnalysis> {
    // Create cache key based on image hash and brand colors (as a proxy for brand identity)
    const imageHash = btoa(imageBase64).slice(0, 20);
    const brandHash = brandGuidelines.primaryColors.join('_');
    const cacheKey = `design_${language}_${imageHash}_${brandHash}`;
    
    // Check cache first
    const cachedResult = this.getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const languageNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
    const responseLang = languageNames[language] || 'English';
    
    // Check inputs with AI
    await this.checkUserInput(brandGuidelines.brandVoice);
    await this.checkUserInput(brandGuidelines.designGuidelines.join(' '));
    // Note: Image input validation removed as requested - no client-side checks for images
    
    try {
      const typographyInfo = brandGuidelines.typography 
        ? `\n- Typography: Primary: ${brandGuidelines.typography.primaryFont}, Secondary: ${brandGuidelines.typography.secondaryFont}, Weights: ${brandGuidelines.typography.fontWeights?.join(', ')}, Heading Style: ${brandGuidelines.typography.headingStyle}`
        : '';
      
      const spacingInfo = brandGuidelines.spacing
        ? `\n- Spacing System: Base unit ${brandGuidelines.spacing.baseUnit}, Scale ${brandGuidelines.spacing.scale}`
        : '';
      
      const layoutInfo = brandGuidelines.layoutPatterns
        ? `\n- Layout Patterns: ${brandGuidelines.layoutPatterns.join(', ')}`
        : '';

      const prompt = `Analyze this design image against the brand guidelines below. Provide an objective assessment in ${responseLang}.

BRAND REQUIREMENTS:
- Colors: ${brandGuidelines.primaryColors.join(', ')}
- Voice: ${brandGuidelines.brandVoice}
- Guidelines: ${brandGuidelines.designGuidelines.join(' | ')}${typographyInfo}${spacingInfo}${layoutInfo}

${brandGuidelines.websiteScreenshot ? 'Use the second image (brand website) as visual reference for brand consistency.\n\n' : ''}RATE THIS DESIGN (0-100 scale):

1. Color Consistency: How well does the design use the required brand colors?
2. Typography: Does it use appropriate fonts and text hierarchy?
3. Spacing: Is the spacing consistent and well-structured?
4. Accessibility: Are contrast, text size, and usability standards met?
5. Overall Brand Alignment: How well does this represent the brand?

SCORING: Be critical but fair. Empty designs score 0-20. Perfect brand alignment scores 90-100.

Return ONLY valid JSON:
{
  "score": 0-100,
  "colorConsistency": 0-100,
  "typographyScale": 0-100,
  "spacingRhythm": 0-100,
  "accessibility": 0-100,
  "feedback": ["3-5 specific observations"],
  "recommendations": ["3-5 actionable suggestions"]
}`;

      const contentParts: any[] = [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        },
      ];

      // Add website screenshot for visual reference if available
      if (brandGuidelines.websiteScreenshot) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${brandGuidelines.websiteScreenshot}`,
          },
        });
      }

      const client = this.ensureClient();

      const completion = await this.retryWithBackoff(async () => {
        return client.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a professional design auditor conducting thorough brand compliance reviews. Analyze designs objectively against brand guidelines. Provide specific, actionable feedback. Be fair but firm in your assessments.'
            },
            {
              role: 'user',
              content: contentParts,
            },
          ],
          model: this.VISION_MODEL,
          temperature: 0.2,
          max_tokens: 1500,
        });
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      // Clean up response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const analysis = JSON.parse(cleanedResponse) as VisionAnalysis;

      // Validate and clamp scores to 0-100 range
      const clampScore = (score: number | undefined, defaultVal: number = 50): number => {
        if (score === undefined || score === null || isNaN(score)) return defaultVal;
        return Math.max(0, Math.min(100, Math.round(score)));
      };

      // Ensure valid response structure
      const result = {
        score: clampScore(analysis.score, 50),
        colorConsistency: clampScore(analysis.colorConsistency, 50),
        typographyScale: clampScore(analysis.typographyScale, 50),
        spacingRhythm: clampScore(analysis.spacingRhythm, 50),
        accessibility: clampScore(analysis.accessibility, 50),
        feedback: Array.isArray(analysis.feedback) && analysis.feedback.length > 0
          ? analysis.feedback.slice(0, 5)
          : ['Design analysis completed. Review metrics for details.'],
        recommendations: Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0
          ? analysis.recommendations.slice(0, 5)
          : ['Continue refining design based on brand guidelines.'],
      };

      // Check AI outputs with key-less API
      await this.checkAIOutput(result.feedback.join(' '));
      await this.checkAIOutput(result.recommendations.join(' '));

      // Cache the result for future use
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error) {
      // Re-throw with user-friendly message instead of logging
      if (error instanceof Error) {
        throw new Error(`Design analysis failed: ${error.message}`);
      }
      throw new Error('Design analysis failed: Unable to analyze the design. Please try again.');
    }
  }
}

// Export a singleton instance
export const groqClient = new GroqClient();
