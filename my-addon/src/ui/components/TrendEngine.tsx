import React, { useState } from 'react';
import { useBrand } from '../../context/BrandContext';
import { groqClient } from '../../services/GroqClient';

const TrendEngine: React.FC = () => {
  const { brandData, hasBrandData } = useBrand();
  const [trendySuggestions, setTrendySuggestions] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  const trends = [
    { 
      id: 'minimalist', 
      title: 'Minimalist', 
      desc: 'Clean, simple designs with plenty of white space',
      icon: '✨'
    },
    { 
      id: 'bold-typography', 
      title: 'Bold Typography', 
      desc: 'Make a statement with large, impactful text',
      icon: '🔤'
    },
    { 
      id: 'gradient', 
      title: 'Gradient Fusion', 
      desc: 'Modern color blends and smooth transitions',
      icon: '🌈'
    },
    { 
      id: 'vintage', 
      title: 'Vintage Revival', 
      desc: 'Retro aesthetics with a modern twist',
      icon: '📻'
    },
    { 
      id: 'abstract', 
      title: 'Abstract Art', 
      desc: 'Creative shapes and experimental compositions',
      icon: '🎨'
    },
    { 
      id: '3d', 
      title: '3D Elements', 
      desc: 'Depth and dimension with realistic renders',
      icon: '🧊'
    },
  ];

  const handleGeneratePrompt = async (trendTitle: string) => {
    if (!hasBrandData) {
      alert('⚠️ Please extract brand data first in the Brand Brain tab!');
      return;
    }

    setGeneratingPrompt(trendTitle);
    setGeneratedPrompt(null);

    try {
      const prompt = await groqClient.generateFireflyPrompt(
        trendTitle,
        brandData,
        trendySuggestions
      );
      setGeneratedPrompt(prompt);
    } catch (error) {
      console.error('Error generating prompt:', error);
      alert('Failed to generate prompt. Please try again.');
    } finally {
      setGeneratingPrompt(null);
    }
  };

  const copyToClipboard = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      alert('✅ Prompt copied to clipboard!');
    }
  };

  return (
    <div style={{ padding: 'var(--spectrum-spacing-400)', fontFamily: 'adobe-clean, sans-serif' }}>
      <h2 style={{ 
        fontSize: 'var(--spectrum-heading-xl-text-size)', 
        fontWeight: 700,
        color: 'var(--spectrum-heading-color)',
        margin: '0 0 var(--spectrum-spacing-200) 0'
      }}>
        🚀 Trend Engine
      </h2>
      <p style={{ 
        fontSize: 'var(--spectrum-body-s-text-size)',
        color: 'var(--spectrum-body-color)',
        marginBottom: 'var(--spectrum-spacing-400)',
        lineHeight: 1.6
      }}>
        Generate Adobe Firefly prompts based on trending design styles and your brand identity.
      </p>

      {/* Brand Colors Display */}
      {hasBrandData && (
        <div style={{
          padding: 'var(--spectrum-spacing-300)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          border: '1px solid var(--spectrum-border-color)',
          marginBottom: 'var(--spectrum-spacing-400)'
        }}>
          <h3 style={{ 
            fontSize: 'var(--spectrum-heading-m-text-size)',
            fontWeight: 600,
            color: 'var(--spectrum-heading-color)',
            margin: '0 0 var(--spectrum-spacing-200) 0'
          }}>
            Using Your Brand Colors:
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spectrum-spacing-100)' }}>
            {brandData.primaryColors.slice(0, 5).map((color, index) => (
              <div
                key={index}
                title={color}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '2px solid var(--spectrum-border-color)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trendy Suggestions Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spectrum-spacing-200)',
        marginBottom: 'var(--spectrum-spacing-400)',
        padding: 'var(--spectrum-spacing-300)',
        backgroundColor: 'var(--spectrum-background-layer-2)',
        borderRadius: 'var(--spectrum-corner-radius-100)',
        border: '1px solid var(--spectrum-border-color)',
      }}>
        <input
          type="checkbox"
          id="trendy-toggle"
          checked={trendySuggestions}
          onChange={(e) => setTrendySuggestions(e.target.checked)}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            accentColor: '#FA0',
          }}
        />
        <label 
          htmlFor="trendy-toggle"
          style={{ 
            fontSize: 'var(--spectrum-body-text-size)',
            color: 'var(--spectrum-body-color)',
            cursor: 'pointer',
            margin: 0,
            userSelect: 'none'
          }}
        >
          🎉 Include January 2026 Trends (Republic Day, Lohri, New Year)
        </label>
      </div>

      {/* Generation Agenda Buttons */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: 'var(--spectrum-spacing-300)',
        marginBottom: 'var(--spectrum-spacing-400)'
      }}>
        {trends.map((trend) => {
          const isGenerating = generatingPrompt === trend.title;
          
          return (
            <button
              key={trend.id}
              onClick={() => handleGeneratePrompt(trend.title)}
              disabled={!hasBrandData || isGenerating}
              style={{
                padding: 'var(--spectrum-spacing-300)',
                backgroundColor: isGenerating ? '#FA0' : 'var(--spectrum-background-layer-2)',
                border: `2px solid ${isGenerating ? '#FA0' : 'var(--spectrum-border-color)'}`,
                borderRadius: 'var(--spectrum-corner-radius-100)',
                cursor: hasBrandData && !isGenerating ? 'pointer' : 'not-allowed',
                transition: 'all 0.13s ease-out',
                textAlign: 'left',
                opacity: !hasBrandData ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (hasBrandData && !isGenerating) {
                  e.currentTarget.style.borderColor = '#FA0';
                  e.currentTarget.style.backgroundColor = 'var(--spectrum-background-layer-1)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasBrandData && !isGenerating) {
                  e.currentTarget.style.borderColor = 'var(--spectrum-border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--spectrum-background-layer-2)';
                }
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: 'var(--spectrum-spacing-100)' }}>
                {isGenerating ? '⏳' : trend.icon}
              </div>
              <h3 style={{ 
                fontSize: 'var(--spectrum-font-size-100)', 
                fontWeight: 700, 
                color: 'var(--spectrum-heading-color)', 
                margin: '0 0 var(--spectrum-spacing-75) 0'
              }}>
                {trend.title}
              </h3>
              <p style={{ 
                fontSize: 'var(--spectrum-body-s-text-size)',
                color: 'var(--spectrum-text-secondary)',
                margin: 0,
                lineHeight: 1.4
              }}>
                {isGenerating ? 'Generating...' : trend.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Generated Prompt Display */}
      {generatedPrompt && (
        <div style={{
          padding: 'var(--spectrum-spacing-400)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-200)',
          border: '2px solid #FA0',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spectrum-spacing-300)'
          }}>
            <h3 style={{ 
              fontSize: 'var(--spectrum-heading-l-text-size)',
              fontWeight: 700,
              color: 'var(--spectrum-heading-color)',
              margin: 0
            }}>
              ✨ Generated Firefly Prompt
            </h3>
            <button
              onClick={copyToClipboard}
              style={{
                padding: 'var(--spectrum-spacing-100) var(--spectrum-spacing-300)',
                fontSize: 'var(--spectrum-font-size-75)',
                fontWeight: 600,
                fontFamily: 'adobe-clean, sans-serif',
                backgroundColor: '#FA0',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--spectrum-corner-radius-100)',
                cursor: 'pointer',
                transition: 'all 0.13s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFB800';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FA0';
              }}
            >
              📋 Copy
            </button>
          </div>
          
          <div style={{
            padding: 'var(--spectrum-spacing-300)',
            backgroundColor: 'var(--spectrum-background-layer-1)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            border: '1px solid var(--spectrum-border-color)',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 'var(--spectrum-body-s-text-size)',
            color: 'var(--spectrum-body-color)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}>
            {generatedPrompt}
          </div>

          <p style={{
            marginTop: 'var(--spectrum-spacing-300)',
            marginBottom: 0,
            fontSize: 'var(--spectrum-body-xs-text-size)',
            color: 'var(--spectrum-text-secondary)',
            fontStyle: 'italic'
          }}>
            💡 Copy this prompt and paste it into Adobe Firefly to generate your design!
          </p>
        </div>
      )}

      {!hasBrandData && (
        <div style={{
          padding: 'var(--spectrum-spacing-400)',
          backgroundColor: 'var(--spectrum-gray-100)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          border: '1px solid var(--spectrum-border-color)',
          textAlign: 'center'
        }}>
          <p style={{
            margin: 0,
            fontSize: 'var(--spectrum-body-text-size)',
            color: 'var(--spectrum-text-secondary)'
          }}>
            ℹ️ Extract brand data in the <strong>Brand Brain</strong> tab first to enable prompt generation.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendEngine;
