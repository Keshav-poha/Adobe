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
   * Extract brand identity with improved color analysis
   */
  async extractBrandIdentity(
    websiteContent: string, 
    language: string = 'en',
    screenshot?: string
  ): Promise<BrandData> {
    const languageNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
    const responseLang = languageNames[language] || 'English';
    
    // Extract website URL from content for AI scraping
    const urlMatch = websiteContent.match(/Website:\s*(https?:\/\/[^\s\n]+)/i);
    const websiteUrl = urlMatch ? urlMatch[1] : websiteContent.split('\n')[0].replace('Website: ', '');
    
    try {
      const prompt = `You are a web scraping and brand analysis expert. Access the website at: ${websiteContent.split('\n')[0].replace('Website: ', '')}

Perform comprehensive web scraping and brand analysis. Return ONLY valid JSON, no markdown, no explanations. Provide all text fields in ${responseLang}.

SCRAPING INSTRUCTIONS:
1. Access the website URL provided above
2. Extract CSS colors, fonts, and visual elements
3. Analyze the live website for brand colors, typography, and design patterns
4. Cross-reference with known brand databases for accuracy

ANALYSIS REQUIREMENTS:
1. primaryColors: EXACTLY 3-5 hex codes from the website's actual color scheme. Scrape CSS, analyze brand elements, verify against official brand colors.
2. brandVoice: EXACTLY 2-3 sentences describing target audience, values, and differentiator based on website content.
3. designGuidelines: EXACTLY 4 observable design patterns from the live website.
4. typography: Extract actual fonts, weights, and styles used on the website${screenshot ? ' (supplement with screenshot analysis)' : ''}.
5. spacing: Identify spacing system from the website's CSS/layout${screenshot ? ' visible in the layout' : ''}.
6. layoutPatterns: 2-3 key layout approaches observed on the live website${screenshot ? ' and screenshot' : ''}.

WEB SCRAPING FOCUS: Access the website directly, extract real colors from CSS/styling, analyze actual fonts and typography in use, verify brand authenticity.

REQUIRED FORMAT:
{
  "primaryColors": ["#HEXCOD", "#HEXCOD", "#HEXCOD"],
  "brandVoice": "Sentence 1. Sentence 2. Sentence 3.",
  "designGuidelines": ["Pattern 1", "Pattern 2", "Pattern 3", "Pattern 4"],
  "typography": {
    "primaryFont": "Actual font name from website",
    "secondaryFont": "Actual font name from website", 
    "fontWeights": ["400", "600", "700"],
    "headingStyle": "Actual heading styles observed"
  },
  "spacing": {
    "baseUnit": "Actual spacing unit from CSS",
    "scale": "Actual scale system observed"
  },
  "layoutPatterns": ["Actual layout patterns observed"]
}

Scrape the live website for accurate brand analysis.`;

      const messages: any[] = [
        {
          role: 'system',
          content: 'You are a JSON extraction bot. Return only valid JSON. No markdown. No explanations.'
        },
      ];

      if (screenshot) {
        // Use vision model with screenshot
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshot}` } }
          ],
        });
      } else {
        messages.push({
          role: 'user',
          content: prompt,
        });
      }

      const client = this.ensureClient();

      const completion = await client.chat.completions.create({
        messages,
        model: this.VISION_MODEL, // Always use vision model for superior color analysis capabilities
        temperature: 0.0,
        max_tokens: 1024,
        response_format: ({ type: 'json_object' } as any), // Vision model can handle JSON responses
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      // Clean up response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const brandData = JSON.parse(cleanedResponse) as BrandData;

      // Strict validation with normalization
      if (!brandData.primaryColors || !Array.isArray(brandData.primaryColors) || brandData.primaryColors.length < 3) {
        // Use default professional colors when AI scraping fails
        brandData.primaryColors = ['#1A73E8', '#34A853', '#FBBC04'];
      }
      
      // Normalize hex codes to uppercase and validate format
      brandData.primaryColors = brandData.primaryColors
        .slice(0, 5)
        .map(c => {
          if (c.startsWith('#') && c.length >= 4) {
            return c.toUpperCase();
          } else if (c.startsWith('#')) {
            return '#1A73E8'; // Invalid hex, use default
          } else {
            return c; // Keep named colors or rgb values
          }
        });
      
      if (!brandData.brandVoice || brandData.brandVoice.length < 50) {
        brandData.brandVoice = 'Modern professional brand. Focused on innovation and user-centric design. Appeals to tech-savvy audiences.';
      }
      
      if (!brandData.designGuidelines || !Array.isArray(brandData.designGuidelines) || brandData.designGuidelines.length < 4) {
        brandData.designGuidelines = ['Consistent spacing system', 'Clear color hierarchy', 'Accessible typography', 'Minimalist aesthetics'];
      }
      
      // Ensure exactly 4 guidelines
      brandData.designGuidelines = brandData.designGuidelines.slice(0, 4);

      // Set defaults for new fields if missing
      if (!brandData.typography) {
        brandData.typography = {
          primaryFont: 'Sans-serif',
          secondaryFont: 'Sans-serif',
          fontWeights: ['400', '600', '700'],
          headingStyle: 'Bold and large'
        };
      }

      if (!brandData.spacing) {
        brandData.spacing = {
          baseUnit: '8px',
          scale: '1.5 ratio'
        };
      }

      if (!brandData.layoutPatterns || !Array.isArray(brandData.layoutPatterns)) {
        brandData.layoutPatterns = ['Grid-based layout', 'Card components', 'Centered content'];
      }

      // Store screenshot if provided
      if (screenshot) {
        brandData.websiteScreenshot = screenshot;
      }

      return brandData;
    } catch (error) {
      console.error('Error extracting brand identity:', error);
      // Return strict fallback data
      return {
        primaryColors: ['#1A73E8', '#34A853', '#FBBC04'],
        brandVoice: 'Modern professional brand. Focused on innovation and user-centric design. Appeals to tech-savvy audiences.',
        designGuidelines: [
          'Consistent spacing system',
          'Clear color hierarchy',
          'Accessible typography',
          'Minimalist aesthetics',
        ],
      };
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
    
    try {
      const prompt = `Create a concise Adobe Firefly prompt (max 100 words) in ${responseLang} for: ${trend}

Brand: ${brandContext.primaryColors.slice(0, 3).join(', ')} colors, ${brandContext.brandVoice.split('.')[0]}

Include: style, composition, lighting, mood, brand colors. Be specific and direct.`;

      const client = this.ensureClient();

      const completion = await client.chat.completions.create({
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

      return completion.choices[0]?.message?.content || `${trend} design with ${brandContext.primaryColors.slice(0, 3).join(', ')} colors, ${brandContext.brandVoice.split('.')[0].toLowerCase()}`;
    } catch (error) {
      console.error('Error generating Firefly prompt:', error);
      return `${trend} design with ${brandContext.primaryColors.slice(0, 3).join(', ')} colors, ${brandContext.brandVoice.split('.')[0].toLowerCase()}`;
    }
  }

  /**
   * Get AI-generated viral trends and festivals tailored to brand identity
   */
  async getViralTrends(brandData?: BrandData, language: string = 'en'): Promise<Array<{ id: string; name: string; desc: string }>> {
    const languageNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
    const responseLang = languageNames[language] || 'English';
    
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

      const completion = await client.chat.completions.create({
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

      const responseText = completion.choices[0]?.message?.content || '[]';
      
      // Clean up response
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const trends = JSON.parse(cleanedResponse) as Array<{ id: string; name: string; desc: string }>;

      // Validate response
      if (!Array.isArray(trends) || trends.length === 0) {
        throw new Error('Invalid trends response');
      }

      return trends;
    } catch (error) {
      console.error('Error fetching viral trends:', error);
      // Return fallback trends
      return [
        { id: 'minimalist', name: 'Minimalist', desc: 'Clean, simple designs with white space' },
        { id: 'bold-typography', name: 'Bold Typography', desc: 'Large, impactful text' },
        { id: 'gradient', name: 'Gradient Fusion', desc: 'Modern color blends' },
        { id: 'valentines', name: "Valentine's Day", desc: 'Romantic themes for Feb 14' },
        { id: '3d-render', name: '3D Elements', desc: 'Depth with realistic renders' },
        { id: 'glassmorphism', name: 'Glassmorphism', desc: 'Frosted glass aesthetics' },
      ];
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
    const languageNames: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
    const responseLang = languageNames[language] || 'English';
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

      const completion = await client.chat.completions.create({
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
      return {
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
    } catch (error) {
      console.error('Error analyzing design:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      
      // Throw error so UI can catch it
      throw new Error(
        error instanceof Error 
          ? `Design analysis failed: ${error.message}` 
          : 'Design analysis service unavailable'
      );
    }
  }
}

// Export a singleton instance
export const groqClient = new GroqClient();
