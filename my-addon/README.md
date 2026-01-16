# Pixel Pluck - Context-Aware Branding Add-on for Adobe Express

**Pixel Pluck** is a powerful Adobe Express Add-on that leverages AI to provide context-aware branding capabilities. It uses Groq's advanced language models to extract brand identities, generate design prompts, and audit designs against brand guidelines.

## 🌟 Features

### 1. **Brand Brain** 🧠
- Extract brand identity from any website URL
- AI-powered analysis using Groq's `llama-3.3-70b-versatile` model
- Extracts:
  - **Primary Colors**: 3-5 hex color codes
  - **Brand Voice**: Tone and personality description
  - **Design Guidelines**: 3-5 key design principles

### 2. **Trend Engine** 🚀
- Generate Adobe Firefly prompts based on trending design styles
- 6 curated design trends:
  - ✨ Minimalist
  - 🔤 Bold Typography
  - 🌈 Gradient Fusion
  - 📻 Vintage Revival
  - 🎨 Abstract Art
  - 🧊 3D Elements
- **Trendy Suggestions Toggle**: Include January 2026 trends (Republic Day, Lohri, New Year)
- AI-generated prompts incorporate your brand colors and voice
- One-click copy to clipboard

### 3. **Design Auditor** 🔍
- AI-powered design analysis using Groq's `llama-3.2-90b-vision-preview` model
- Captures current canvas as rendition
- Evaluates designs on 4 key metrics:
  - **Color Consistency**: Alignment with brand colors
  - **Typography Scale**: Text hierarchy clarity
  - **Spacing Rhythm**: Consistent spacing patterns
  - **Accessibility**: Contrast and readability
- Provides:
  - Overall score (0-100)
  - Detailed feedback
  - Actionable recommendations

## 🛠️ Tech Stack

- **Framework**: React + Vite + TypeScript
- **UI Components**: Adobe Spectrum Web Components (@swc-react)
- **AI Integration**: Groq SDK
  - `llama-3.3-70b-versatile` for text analysis and generation
  - `llama-3.2-90b-vision-preview` for design auditing
- **Architecture**: Adobe Express Add-on SDK (Dual runtime: Iframe UI & Document Sandbox)
- **Styling**: Tailwind CSS + Spectrum Design Tokens

## 📁 Project Structure

```
my-addon/
├── src/
│   ├── ui/                     # Iframe UI runtime
│   │   ├── components/
│   │   │   ├── App.tsx         # Main app with tab navigation
│   │   │   ├── TabNavigation.tsx
│   │   │   ├── BrandBrain.tsx  # Menu 1: Brand extraction
│   │   │   ├── TrendEngine.tsx # Menu 2: Firefly prompt generation
│   │   │   └── DesignAuditor.tsx # Menu 3: Design analysis
│   │   └── index.tsx
│   ├── sandbox/                # Document sandbox runtime
│   │   └── code.ts
│   ├── services/
│   │   └── GroqClient.ts       # AI service layer
│   ├── context/
│   │   └── BrandContext.tsx    # Global brand state
│   ├── models/
│   │   └── DocumentSandboxApi.ts
│   └── manifest.json
├── .env                        # API keys (VITE_GROQ_API_KEY)
├── package.json
├── webpack.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Adobe Express account
- Groq API key ([Get one here](https://console.groq.com))

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   The `.env` file should contain your Groq API key:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Build the add-on**:
   ```bash
   npm run build
   ```

4. **Start development server**:
   ```bash
   npm run start
   ```

5. **Load in Adobe Express**:
   - Open Adobe Express
   - Go to **Settings > Add-on Development**
   - Enable "Add-on Development Mode"
   - Click "Load Local Add-on"
   - Navigate to the `dist` folder and select `manifest.json`

## 💻 Usage

### Brand Brain Workflow

1. Navigate to the **Brand Brain** tab
2. Enter a website URL (e.g., `https://stripe.com`)
3. Click **Extract Brand Data**
4. Wait for AI analysis (5-10 seconds)
5. Review extracted:
   - Primary colors with hex codes
   - Brand voice description
   - Design guidelines list

### Trend Engine Workflow

1. Extract brand data first (in Brand Brain)
2. Navigate to the **Trend Engine** tab
3. (Optional) Enable **January 2026 Trends** toggle
4. Click any trend button (e.g., "Minimalist")
5. AI generates a custom Firefly prompt
6. Click **Copy** to use in Adobe Firefly

### Design Auditor Workflow

1. Extract brand data first (in Brand Brain)
2. Create or open a design in Adobe Express
3. Navigate to the **Design Auditor** tab
4. Click **Run Design Audit**
5. Wait for AI vision analysis (10-15 seconds)
6. Review:
   - Overall score
   - Detailed metrics with progress bars
   - Feedback and recommendations

## 🎨 Design Tokens

The add-on uses Spectrum design tokens for consistency:

- **Primary Accent**: `#FA0` (Yellow/Orange)
- **Hover State**: `#FFB800`
- **Spacing**: `var(--spectrum-spacing-*)`
- **Typography**: `adobe-clean, sans-serif`
- **Corner Radius**: `var(--spectrum-corner-radius-*)`

## 🔧 Development

### Key Files

- **`src/services/GroqClient.ts`**: AI service with three main methods:
  - `extractBrandIdentity()`: Analyzes website content
  - `generateFireflyPrompt()`: Creates design prompts
  - `analyzeDesign()`: Evaluates design quality

- **`src/context/BrandContext.tsx`**: Global state for brand data
  ```typescript
  interface BrandData {
    primaryColors: string[];
    brandVoice: string;
    designGuidelines: string[];
  }
  ```

- **`webpack.config.js`**: Configured with `DefinePlugin` to inject `VITE_GROQ_API_KEY`

### Build Commands

```bash
# Development build with source maps
npm run build

# Production build
NODE_ENV=production npm run build

# Start dev server
npm run start

# Package for distribution
npm run package
```

## 🌐 CORS Handling

The add-on uses `allorigins.win` as a CORS proxy for fetching website content. For production, consider:
- Setting up your own proxy server
- Using Vite proxy configuration
- Server-side API endpoint

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GROQ_API_KEY` | Groq API key for AI models | Yes |

## 📝 API Reference

### GroqClient Methods

#### `extractBrandIdentity(websiteContent: string): Promise<BrandData>`
Extracts brand identity from website content.

#### `generateFireflyPrompt(trend: string, brandContext: BrandData, includeTrendySuggestions: boolean): Promise<string>`
Generates Adobe Firefly prompts based on trends and brand context.

#### `analyzeDesign(imageBase64: string, brandGuidelines: BrandData): Promise<VisionAnalysis>`
Analyzes design against brand guidelines using vision model.

## 🎯 Future Enhancements

- [ ] Direct Adobe Firefly integration
- [ ] Batch design auditing
- [ ] Custom trend creation
- [ ] Export audit reports
- [ ] Brand guideline templates
- [ ] Multi-language support

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Adobe Express Add-on SDK and Groq AI**
│   │   └── BrandContext.tsx     # Global brand state
│   ├── sandbox/
│   │   └── code.ts              # Document sandbox runtime
│   ├── App.tsx                  # Main app with tab navigation
│   ├── index.tsx                # Entry point with SDK initialization
│   ├── index.css                # Tailwind imports
│   ├── index.html               # HTML template
│   ├── manifest.json            # Add-on manifest
│   └── add-on-ui-sdk.d.ts      # TypeScript definitions
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Design System

The add-on uses Adobe Spectrum-inspired colors:

- **Background**: `#222222` (adobe-dark)
- **Accent/CTA**: `#FFD500` (adobe-yellow)
- **Gray Scale**: Multiple shades from `#F5F5F5` to `#1A1A1A`

## Features Implementation

### BrandContext
Global state management for sharing brand data across all tabs:
- Brand colors array
- Brand voice description
- Logo URL
- Source website URL

### addOnUISdk Integration
The app waits for `addOnUISdk.ready` before rendering to ensure the Adobe Express SDK is fully initialized.

### Tab Navigation
Three main tabs with Tailwind CSS styling:
1. **Brand Brain** - URL input and brand extraction
2. **Trend Engine** - Trend categories and discovery
3. **Design Auditor** - Design consistency checks
