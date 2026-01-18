# How This Add-on Uses AI

## Overview
This Adobe Express add-on leverages AI to help you create brand-consistent designs and generate creative prompts for Adobe Firefly. All AI processing is powered by Groq's language models, with built-in content moderation for safe use.

## AI-Powered Features

### 1. Brand Identity Extraction
- **What it does**: Analyzes your website content or uploaded screenshots to extract brand colors, voice, guidelines, and typography.
- **How AI helps**: Uses vision-language models to understand visual elements and text context, generating structured brand data.
- **Output**: JSON-formatted brand profile with colors, fonts, spacing, and design patterns.

### 2. Firefly Prompt Generation
- **What it does**: Creates optimized prompts for Adobe Firefly image generation based on your brand and selected trends.
- **How AI helps**: Combines brand data with trend information to craft specific, brand-aligned prompts (under 100 words).
- **Output**: Ready-to-use prompts that include style, composition, lighting, and mood elements.

### 3. Viral Trends Discovery
- **What it does**: Suggests current viral trends and festivals tailored to your brand identity.
- **How AI helps**: Analyzes brand characteristics to recommend relevant trends with descriptions and IDs.
- **Output**: List of trend suggestions with names and descriptions for creative inspiration.

### 4. Design Analysis & Feedback
- **What it does**: Evaluates your designs against brand guidelines and provides improvement suggestions.
- **How AI helps**: Compares uploaded designs with brand data to score consistency, accessibility, and adherence to guidelines.
- **Output**: Detailed feedback with scores, recommendations, and specific improvement tips.

## Content Moderation
- **Input Checks**: AI scans all user-provided content for inappropriate material before processing.
- **Output Checks**: Generated content is verified for safety using external APIs.
- **Safety First**: If content is flagged, you'll receive clear feedback and can choose to proceed or revise.

## Technical Details
- **AI Model**: Groq's Llama 3.3 70B Versatile for text analysis, Meta Llama 4 Maverick for vision tasks.
- **Processing**: Real-time analysis with caching for performance.
- **Languages**: Supports English, Spanish, and French.
- **Privacy**: No permanent data storage; processing happens in your browser or via secure APIs.

## Getting Started
1. Set your Groq API key in the add-on settings.
2. Upload website content or screenshots for brand analysis.
3. Generate prompts or get trend suggestions.
4. Use the feedback to refine your designs.

For more details, see our [AI Ethics](AI_ETHICS.md) document.

*Last updated: January 18, 2026*