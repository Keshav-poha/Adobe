import React, { useState } from 'react';
import { useBrand } from '../../context/BrandContext';
import { groqClient } from '../../services/GroqClient';
import { Brain, Link, FileText, Sparkles, Palette, MessageSquare, CheckSquare, Ruler, Upload } from 'lucide-react';
import { ProgressCircle } from './LoadingComponents';
import { useToast } from './ToastNotification';
import { useLanguage } from '../../context/LanguageContext';

const BrandBrain: React.FC = () => {
  const { t, language } = useLanguage();
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'url' | 'text' | 'image'>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { brandData, setBrandData } = useBrand();
  const toast = useToast();

  const handleExtract = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    
    try {
      // Validate URL format
      let validUrl: URL;
      try {
        validUrl = new URL(url);
      } catch {
        throw new Error(t('invalidUrl'));
      }

      // Try multiple CORS proxies in sequence
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      ];

      let htmlContent = '';
      let lastError = null;

      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl, {
            headers: {
              'Accept': 'application/json, text/html'
            }
          });
          
          if (!response.ok) {
            // Check for specific HTTP errors
            if (response.status === 403) {
              lastError = new Error('Website blocked the request (403 Forbidden)');
            } else if (response.status === 404) {
              lastError = new Error('Page not found (404)');
            } else {
              lastError = new Error(`HTTP ${response.status}`);
            }
            throw lastError;
          }

          // Handle different proxy response formats
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            htmlContent = data.contents || data.data || '';
          } else {
            htmlContent = await response.text();
          }

          if (htmlContent) break; // Successfully fetched content
        } catch (err) {
          lastError = err;
          // Continue to next proxy silently; surface if all proxies fail
          continue; // Try next proxy
        }
      }

      if (!htmlContent) {
        const is403 = lastError?.message?.includes('403');
        const errorMsg = is403
          ? `This website blocks automated requests. Click "Paste Text" above and manually copy/paste content from ${validUrl.hostname}`
          : `Unable to fetch website content. Try clicking "Paste Text" above to manually paste brand content instead.`;
        throw new Error(errorMsg);
      }

      // Advanced web scraping to extract comprehensive brand data
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extract structured brand information
      const title = doc.querySelector('title')?.textContent?.trim() || '';
      const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const metaKeywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

      // Extract headings for brand messaging
      const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent?.trim())
        .filter(text => text && text.length > 0)
        .slice(0, 10); // Limit to first 10 headings

      // Extract navigation and brand elements
      const navText = Array.from(doc.querySelectorAll('nav, .nav, .navigation, .menu, .navbar'))
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 0)
        .join(' ');

      // Extract footer content (often contains brand info)
      const footerText = Array.from(doc.querySelectorAll('footer, .footer'))
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 0)
        .join(' ');

      // Extract main content areas
      const mainContent = Array.from(doc.querySelectorAll('main, .main, .content, article, .article'))
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 0)
        .join(' ');

      // Extract CSS colors from inline styles and style tags
      const colorMatches = htmlContent.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g) || [];
      const uniqueColors = [...new Set(colorMatches)].slice(0, 20); // Limit to 20 unique colors

      // Extract brand-related classes and IDs
      const brandSelectors = Array.from(doc.querySelectorAll('[class*="brand"], [class*="logo"], [id*="brand"], [id*="logo"]'))
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 0)
        .join(' ');

      // Combine all extracted content
      const scrapedContent = {
        title,
        metaDescription,
        metaKeywords,
        headings: headings.join(' '),
        navigation: navText,
        footer: footerText,
        mainContent,
        colors: uniqueColors.join(', '),
        brandElements: brandSelectors,
        fullText: doc.body.textContent || ''
      };

      // Create comprehensive content string for AI analysis
      const comprehensiveContent = `
Website: ${url}
Title: ${scrapedContent.title}
Description: ${scrapedContent.metaDescription}
Keywords: ${scrapedContent.metaKeywords}

Headings: ${scrapedContent.headings}

Navigation: ${scrapedContent.navigation}

Brand Elements: ${scrapedContent.brandElements}

Main Content: ${scrapedContent.mainContent}

Footer: ${scrapedContent.footer}

Detected Colors: ${scrapedContent.colors}

Full Text Content: ${scrapedContent.fullText}
      `.trim();

      if (!comprehensiveContent.trim()) {
        throw new Error('No content found on the page. Try a different URL.');
      }

      // Use Groq to analyze and extract brand identity from comprehensive scraped data
      const extractedBrandData = await groqClient.extractBrandIdentity(comprehensiveContent, language);
      
      setBrandData(extractedBrandData);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract brand data';
      setError(message);
      toast.showToast('error', message, 7000);
      setLoading(false);
    }
  };

  const handleManualExtract = async () => {
    if (!manualText.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      // Use Groq to analyze and extract brand identity from manual text
      const extractedBrandData = await groqClient.extractBrandIdentity(manualText, language);
      
      setBrandData(extractedBrandData);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract brand data';
      setError(message);
      toast.showToast('error', message, 7000);
      setLoading(false);
    }
  };

  const handleImageExtract = async () => {
    if (!uploadedImage) return;

    setLoading(true);
    setError(null);
    
    try {
      // Convert uploaded image to base64
      const arrayBuffer = await uploadedImage.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binaryString);

      // Use Groq to analyze and extract brand identity from image
      const extractedBrandData = await groqClient.extractBrandIdentity('', language, base64);
      
      setBrandData(extractedBrandData);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract brand data from image';
      setError(message);
      toast.showToast('error', message, 7000);
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  };

  return (
    <div style={{ padding: 'var(--spectrum-spacing-400)', fontFamily: 'adobe-clean, sans-serif' }}>
      {/* Toggle between URL, Manual input, and Image upload */}
      <div style={{ marginBottom: 'var(--spectrum-spacing-300)', display: 'flex', gap: 'var(--spectrum-spacing-200)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setInputMode('url')}
          style={{
            padding: 'var(--spectrum-spacing-100) var(--spectrum-spacing-300)',
            fontSize: 'var(--spectrum-body-xs-text-size)',
            fontWeight: 600,
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: inputMode === 'url' ? '#4069FD' : 'var(--spectrum-gray-200)',
            color: inputMode === 'url' ? '#fff' : 'var(--spectrum-gray-700)',
            border: 'none',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            cursor: 'pointer',
            transition: 'all 0.13s ease-out',
          }}
        >
          <Link size={14} style={{ marginRight: '4px' }} />
          {t('fromUrl')}
        </button>
        <button
          onClick={() => setInputMode('text')}
          style={{
            padding: 'var(--spectrum-spacing-100) var(--spectrum-spacing-300)',
            fontSize: 'var(--spectrum-body-xs-text-size)',
            fontWeight: 600,
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: inputMode === 'text' ? '#4069FD' : 'var(--spectrum-gray-200)',
            color: inputMode === 'text' ? '#fff' : 'var(--spectrum-gray-700)',
            border: 'none',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            cursor: 'pointer',
            transition: 'all 0.13s ease-out',
          }}
        >
          <FileText size={14} style={{ marginRight: '4px' }} />
          {t('pasteText')}
        </button>
        <button
          onClick={() => setInputMode('image')}
          style={{
            padding: 'var(--spectrum-spacing-100) var(--spectrum-spacing-300)',
            fontSize: 'var(--spectrum-body-xs-text-size)',
            fontWeight: 600,
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: inputMode === 'image' ? '#4069FD' : 'var(--spectrum-gray-200)',
            color: inputMode === 'image' ? '#fff' : 'var(--spectrum-gray-700)',
            border: 'none',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            cursor: 'pointer',
            transition: 'all 0.13s ease-out',
          }}
        >
          <Upload size={14} style={{ marginRight: '4px' }} />
          Upload Screenshot
        </button>
      </div>

      {inputMode === 'url' && (
      <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
        <label style={{ 
          display: 'block',
          fontSize: 'var(--spectrum-label-text-size)',
          fontWeight: 600,
          color: 'var(--spectrum-label-color)',
          marginBottom: 'var(--spectrum-spacing-100)'
        }}>
          {t('websiteUrl')}
        </label>
        <p style={{
          fontSize: 'var(--spectrum-body-xs-text-size)',
          color: 'var(--spectrum-gray-600)',
          marginBottom: 'var(--spectrum-spacing-200)',
          fontStyle: 'italic'
        }}>
          Note: Website analysis sometimes provides inaccurate results
        </p>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          disabled={loading}
          style={{
            width: '100%',
            padding: 'var(--spectrum-spacing-200)',
            fontSize: 'var(--spectrum-font-size-100)',
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: 'var(--spectrum-background-layer-1)',
            border: '1px solid var(--spectrum-border-color)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            color: 'var(--spectrum-text-body)',
            outline: 'none',
            transition: 'border-color 0.13s ease-out',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#FA0';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--spectrum-border-color)';
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spectrum-spacing-300)' }}>
          <button
            onClick={handleExtract}
            disabled={!url || loading}
            style={{
              padding: 'var(--spectrum-spacing-200) var(--spectrum-spacing-400)',
              fontSize: 'var(--spectrum-font-size-100)',
              fontWeight: 600,
              fontFamily: 'adobe-clean, sans-serif',
              backgroundColor: loading ? 'var(--spectrum-gray-400)' : '#4069FD',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              cursor: loading || !url ? 'not-allowed' : 'pointer',
              transition: 'all 0.13s ease-out',
              opacity: loading || !url ? 0.5 : 1,
            }}
          onMouseEnter={(e) => {
            if (!loading && url) {
              e.currentTarget.style.backgroundColor = '#5078FE';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && url) {
              e.currentTarget.style.backgroundColor = '#4069FD';
            }
          }}
        >
          {loading ? (
            <>{t('extracting')}</>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={16} />
              {t('extractBrand')}
            </span>
          )}
          </button>
        </div>
      </div>
      )}

      {inputMode === 'text' && (
      <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
        <label style={{ 
          display: 'block',
          fontSize: 'var(--spectrum-label-text-size)',
          fontWeight: 600,
          color: 'var(--spectrum-label-color)',
          marginBottom: 'var(--spectrum-spacing-100)'
        }}>
          {t('brandText')}
        </label>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder={t('brandTextPlaceholder')}
          disabled={loading}
          rows={8}
          style={{
            width: '100%',
            padding: 'var(--spectrum-spacing-200)',
            fontSize: 'var(--spectrum-font-size-100)',
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: 'var(--spectrum-background-layer-1)',
            border: '1px solid var(--spectrum-border-color)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            color: 'var(--spectrum-text-body)',
            outline: 'none',
            transition: 'border-color 0.13s ease-out',
            resize: 'vertical',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#FA0';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--spectrum-border-color)';
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spectrum-spacing-300)' }}>
          <button
            onClick={handleManualExtract}
            disabled={!manualText.trim() || loading}
            style={{
              padding: 'var(--spectrum-spacing-200) var(--spectrum-spacing-400)',
              fontSize: 'var(--spectrum-font-size-100)',
              fontWeight: 600,
              fontFamily: 'adobe-clean, sans-serif',
              backgroundColor: loading ? 'var(--spectrum-gray-400)' : '#4069FD',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              cursor: loading || !manualText.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.13s ease-out',
              opacity: loading || !manualText.trim() ? 0.5 : 1,
            }}
          onMouseEnter={(e) => {
            if (!loading && manualText.trim()) {
              e.currentTarget.style.backgroundColor = '#5078FE';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && manualText.trim()) {
              e.currentTarget.style.backgroundColor = '#4069FD';
            }
          }}
        >
          {loading ? (
            <>{t('extracting')}</>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={16} />
              {t('extractBrand')}
            </span>
          )}
          </button>
        </div>
      </div>
      )}

      {inputMode === 'image' && (
      <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
        <label style={{ 
          display: 'block',
          fontSize: 'var(--spectrum-label-text-size)',
          fontWeight: 600,
          color: 'var(--spectrum-label-color)',
          marginBottom: 'var(--spectrum-spacing-100)'
        }}>
          Upload Brand Screenshot
        </label>
        <div style={{
          border: '2px dashed var(--spectrum-border-color)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          padding: 'var(--spectrum-spacing-400)',
          textAlign: 'center',
          backgroundColor: 'var(--spectrum-background-layer-1)',
          transition: 'border-color 0.13s ease-out',
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={loading}
            style={{
              display: 'none',
            }}
            id="image-upload"
          />
          <label htmlFor="image-upload" style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
            <Upload size={32} color="#4069FD" style={{ marginBottom: 'var(--spectrum-spacing-200)' }} />
            <p style={{
              fontSize: 'var(--spectrum-body-text-size)',
              color: 'var(--spectrum-body-color)',
              margin: '0 0 var(--spectrum-spacing-100) 0',
            }}>
              {uploadedImage ? uploadedImage.name : 'Click to upload brand screenshot'}
            </p>
            <p style={{
              fontSize: 'var(--spectrum-body-xs-text-size)',
              color: 'var(--spectrum-gray-600)',
              margin: 0,
            }}>
              PNG, JPG, JPEG up to 10MB
            </p>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spectrum-spacing-300)' }}>
          <button
            onClick={handleImageExtract}
            disabled={!uploadedImage || loading}
            style={{
              padding: 'var(--spectrum-spacing-200) var(--spectrum-spacing-400)',
              fontSize: 'var(--spectrum-font-size-100)',
              fontWeight: 600,
              fontFamily: 'adobe-clean, sans-serif',
              backgroundColor: loading ? 'var(--spectrum-gray-400)' : '#4069FD',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              cursor: loading || !uploadedImage ? 'not-allowed' : 'pointer',
              transition: 'all 0.13s ease-out',
              opacity: loading || !uploadedImage ? 0.5 : 1,
            }}
          onMouseEnter={(e) => {
            if (!loading && uploadedImage) {
              e.currentTarget.style.backgroundColor = '#5078FE';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && uploadedImage) {
              e.currentTarget.style.backgroundColor = '#4069FD';
            }
          }}
        >
          {loading ? (
            <>{t('extracting')}</>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={16} />
              {t('extractBrand')}
            </span>
          )}
          </button>
        </div>
      </div>
      )}

      {error && (
        <div style={{
          padding: 'var(--spectrum-spacing-300)',
          backgroundColor: 'var(--spectrum-red-100)',
          border: '1px solid var(--spectrum-red-400)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          marginBottom: 'var(--spectrum-spacing-400)',
        }}>
          <p style={{ 
            margin: 0,
            fontSize: 'var(--spectrum-body-s-text-size)',
            color: 'var(--spectrum-red-900)'
          }}>
            {error}
          </p>
        </div>
      )}

      {!loading && brandData.primaryColors.length > 0 && (
        <div style={{
          padding: 'var(--spectrum-spacing-400)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-200)',
          border: '1px solid var(--spectrum-border-color)',
        }}>
          <h3 style={{ 
            fontSize: 'var(--spectrum-heading-l-text-size)',
            fontWeight: 700,
            color: 'var(--spectrum-heading-color)',
            margin: '0 0 var(--spectrum-spacing-300) 0',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spectrum-spacing-200)'
          }}>
            <CheckSquare size={20} color="#00719f" />
            Brand Identity Extracted
          </h3>
          
          <p style={{
            fontSize: 'var(--spectrum-body-xs-text-size)',
            color: 'var(--spectrum-gray-600)',
            margin: '0 0 var(--spectrum-spacing-300) 0',
            fontStyle: 'italic'
          }}>
            Not accurate? Try other input methods above
          </p>
          
          {/* Primary Colors */}
          <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
            <h4 style={{ 
              fontSize: 'var(--spectrum-heading-m-text-size)',
              fontWeight: 600,
              color: 'var(--spectrum-heading-color)',
              margin: '0 0 var(--spectrum-spacing-200) 0',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spectrum-spacing-100)'
            }}>
              <Palette size={18} color="#00719f" />
              Primary Colors
            </h4>
            <div style={{ 
              display: 'flex', 
              gap: 'var(--spectrum-spacing-300)', 
              flexWrap: 'wrap' 
            }}>
              {brandData.primaryColors.map((color, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 'var(--spectrum-spacing-100)' 
                }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      backgroundColor: color,
                      borderRadius: 'var(--spectrum-corner-radius-100)',
                      border: '2px solid var(--spectrum-border-color)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                  <span style={{ 
                    fontSize: 'var(--spectrum-font-size-75)', 
                    color: 'var(--spectrum-text-secondary)', 
                    fontFamily: 'ui-monospace, monospace',
                    fontWeight: 500
                  }}>
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Voice */}
          {brandData.brandVoice && (
            <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
              <h4 style={{ 
                fontSize: 'var(--spectrum-heading-m-text-size)',
                fontWeight: 600,
                color: 'var(--spectrum-heading-color)',
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <MessageSquare size={18} color="#00719f" />
                {t('brandVoice')}
              </h4>
              <p style={{ 
                margin: 0,
                fontSize: 'var(--spectrum-body-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.6,
                padding: 'var(--spectrum-spacing-200)',
                backgroundColor: 'var(--spectrum-background-layer-1)',
                borderRadius: 'var(--spectrum-corner-radius-100)',
                borderLeft: '3px solid #FA0'
              }}>
                {brandData.brandVoice}
              </p>
            </div>
          )}

          {/* Design Guidelines */}
          {brandData.designGuidelines.length > 0 && (
            <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
              <h4 style={{ 
                fontSize: 'var(--spectrum-heading-m-text-size)',
                fontWeight: 600,
                color: 'var(--spectrum-heading-color)',
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <Ruler size={18} color="#00719f" />
                {t('designGuidelines')}
              </h4>
              <ul style={{ 
                margin: 0,
                paddingLeft: 'var(--spectrum-spacing-400)',
                fontSize: 'var(--spectrum-body-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.8
              }}>
                {brandData.designGuidelines.map((guideline, index) => (
                  <li key={index} style={{ marginBottom: 'var(--spectrum-spacing-100)' }}>
                    {guideline}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Typography */}
          {brandData.typography && (
            <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
              <h4 style={{ 
                fontSize: 'var(--spectrum-heading-m-text-size)',
                fontWeight: 600,
                color: 'var(--spectrum-heading-color)',
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <FileText size={18} color="#00719f" />
                Typography
              </h4>
              <div style={{
                padding: 'var(--spectrum-spacing-200)',
                backgroundColor: 'var(--spectrum-background-layer-1)',
                borderRadius: 'var(--spectrum-corner-radius-100)',
                fontSize: 'var(--spectrum-body-s-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.6
              }}>
                <div><strong>Primary:</strong> {brandData.typography.primaryFont}</div>
                {brandData.typography.secondaryFont && (
                  <div><strong>Secondary:</strong> {brandData.typography.secondaryFont}</div>
                )}
                {brandData.typography.fontWeights && (
                  <div><strong>Weights:</strong> {brandData.typography.fontWeights.join(', ')}</div>
                )}
                {brandData.typography.headingStyle && (
                  <div><strong>Headings:</strong> {brandData.typography.headingStyle}</div>
                )}
              </div>
            </div>
          )}

          {/* Spacing System */}
          {brandData.spacing && (
            <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
              <h4 style={{ 
                fontSize: 'var(--spectrum-heading-m-text-size)',
                fontWeight: 600,
                color: 'var(--spectrum-heading-color)',
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <Ruler size={18} color="#00719f" />
                Spacing
              </h4>
              <div style={{
                padding: 'var(--spectrum-spacing-200)',
                backgroundColor: 'var(--spectrum-background-layer-1)',
                borderRadius: 'var(--spectrum-corner-radius-100)',
                fontSize: 'var(--spectrum-body-s-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.6
              }}>
                {brandData.spacing.baseUnit && (
                  <div><strong>Base Unit:</strong> {brandData.spacing.baseUnit}</div>
                )}
                {brandData.spacing.scale && (
                  <div><strong>Scale:</strong> {brandData.spacing.scale}</div>
                )}
              </div>
            </div>
          )}

          {/* Layout Patterns */}
          {brandData.layoutPatterns && brandData.layoutPatterns.length > 0 && (
            <div>
              <h4 style={{ 
                fontSize: 'var(--spectrum-heading-m-text-size)',
                fontWeight: 600,
                color: 'var(--spectrum-heading-color)',
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <Ruler size={18} color="#00719f" />
                Layout Patterns
              </h4>
              <ul style={{ 
                margin: 0,
                paddingLeft: 'var(--spectrum-spacing-400)',
                fontSize: 'var(--spectrum-body-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.8
              }}>
                {brandData.layoutPatterns.map((pattern, index) => (
                  <li key={index} style={{ marginBottom: 'var(--spectrum-spacing-100)' }}>
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandBrain;
