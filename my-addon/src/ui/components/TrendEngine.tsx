import React, { useState, useEffect } from 'react';
import { useBrand } from '../../context/BrandContext';
import { groqClient } from '../../services/GroqClient';
import { TrendingUp, Sparkles, Palette, RefreshCw } from 'lucide-react';
import { ProgressCircle } from './LoadingComponents';
import { useToast } from './ToastNotification';
import { useLanguage } from '../../context/LanguageContext';

const TrendEngine: React.FC = () => {
  const { t, language } = useLanguage();
  const { brandData, hasBrandData } = useBrand();
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trends, setTrends] = useState<Array<{ id: string; name: string; desc: string }>>([]);

  const toast = useToast();

  // Fetch AI-generated trends on component mount and when brand data or language changes
  useEffect(() => {
    fetchViralTrends();
  }, [hasBrandData, language]);

  const fetchViralTrends = async () => {
    setLoadingTrends(true);
    try {
      // Pass brand data if available to get tailored trend suggestions
      const aiTrends = await groqClient.getViralTrends(hasBrandData ? brandData : undefined, language);
      setTrends(aiTrends);
    } catch (error) {
      // Error already handled by toast notification below
      toast.showToast('error', 'Failed to load AI trends. Set your Groq API key in Settings.', 7000);
    } finally {
      setLoadingTrends(false);
    }
  };

  const toggleTrendSelection = (trendId: string) => {
    setSelectedTrends(prev => 
      prev.includes(trendId)
        ? prev.filter(id => id !== trendId)
        : [...prev, trendId]
    );
  };

  const contentTypes = [
    { id: 'social-post', name: 'Social Media Post', desc: 'Instagram, Facebook, Twitter posts (1080x1080)' },
    { id: 'story', name: 'Story', desc: 'Instagram/Facebook Stories (1080x1920)' },
    { id: 'banner', name: 'Banner', desc: 'Web banners, headers, and covers' },
    { id: 'flyer', name: 'Flyer', desc: 'Event flyers and promotional materials' },
    { id: 'poster', name: 'Poster', desc: 'Print and digital posters' },
    { id: 'logo', name: 'Logo', desc: 'Brand logos and icons' },
    { id: 'card', name: 'Card', desc: 'Business cards, greeting cards, invitations' },
    { id: 'presentation', name: 'Presentation', desc: 'Slides and presentation graphics' },
    { id: 'video-thumbnail', name: 'Video Thumbnail', desc: 'YouTube and video platform thumbnails' },
    { id: 'ad', name: 'Advertisement', desc: 'Digital ads and marketing materials' },
  ];

  // Remove the old trends array - it's now AI-generated

  const handleGeneratePrompt = async () => {
    if (!hasBrandData) {
      toast.showToast('warning', 'Extract brand data in Brand Brain first to generate prompts.', 5000);
      return;
    }
    if (selectedTrends.length === 0) {
      toast.showToast('info', 'Select at least one trend to proceed.', 4000);
      return;
    }
    if (!selectedContentType) {
      toast.showToast('info', 'Choose a content type before generating.', 4000);
      return;
    }

    setGeneratingPrompt(true);
    setGeneratedPrompt(null);

    try {
      const trendNames = selectedTrends
        .map(id => trends.find(t => t.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      const contentTypeName = contentTypes.find(t => t.id === selectedContentType)?.name || selectedContentType;
      
      const prompt = await groqClient.generateFireflyPrompt(
        `${trendNames} for ${contentTypeName}`,
        brandData,
        false,
        [],
        language
      );
      setGeneratedPrompt(prompt);
    } catch (error) {
      alert('Failed to generate prompt. Please try again.');
    } finally {
      setGeneratingPrompt(false);
    }
  };

  return (
    <div style={{ padding: 'var(--spectrum-spacing-400)', fontFamily: 'adobe-clean, sans-serif' }}>
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
            fontSize: 'var(--spectrum-heading-s-text-size)',
            fontWeight: 600,
            color: 'var(--spectrum-heading-color)',
            margin: '0 0 var(--spectrum-spacing-200) 0',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spectrum-spacing-100)'
          }}>
            <Palette size={18} color="#00719f" />
            {t('usingBrandColors')}
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

      {/* AI-Generated Trends Checklist */}
      <div style={{
        marginBottom: 'var(--spectrum-spacing-400)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spectrum-spacing-100)'
        }}>
          <label
            style={{
              fontSize: 'var(--spectrum-body-text-size)',
              fontWeight: 600,
              color: 'var(--spectrum-heading-color)',
            }}
          >
            {t('viralTrending')} {hasBrandData && <span style={{ color: '#00719f', fontSize: 'var(--spectrum-body-xs-text-size)', fontWeight: 400 }}>✓ {t('tailoredBrand')}</span>}
          </label>
          <button
            onClick={fetchViralTrends}
            disabled={loadingTrends}
            style={{
              padding: 'var(--spectrum-spacing-100) var(--spectrum-spacing-200)',
              fontSize: 'var(--spectrum-body-xs-text-size)',
              fontFamily: 'adobe-clean, sans-serif',
              backgroundColor: 'transparent',
              color: '#4069FD',
              border: '1px solid #4069FD',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              cursor: loadingTrends ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spectrum-spacing-100)',
              opacity: loadingTrends ? 0.6 : 1,
            }}
            title="Refresh trends"
          >
            <RefreshCw size={14} className={loadingTrends ? 'animate-spin' : ''} />
            {t('refresh')}
          </button>
        </div>
        
        {loadingTrends ? (
          <div style={{ textAlign: 'center', padding: 'var(--spectrum-spacing-400)' }}>
            <ProgressCircle size="small" label={t('loadingTrends')} />
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--spectrum-background-layer-1)',
            border: '1px solid var(--spectrum-border-color)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            padding: 'var(--spectrum-spacing-200)',
            maxHeight: '300px',
            overflowY: 'auto',
          }}>
            {trends.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--spectrum-spacing-400)',
                color: 'var(--spectrum-gray-600)',
                fontSize: 'var(--spectrum-body-xs-text-size)',
              }}>
                No trends loaded. Click refresh.
              </div>
            ) : (
              trends.map((trend) => (
                <label
                  key={trend.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: 'var(--spectrum-spacing-200)',
                    cursor: 'pointer',
                    borderRadius: 'var(--spectrum-corner-radius-75)',
                    backgroundColor: selectedTrends.includes(trend.id) ? 'rgba(64, 105, 253, 0.1)' : 'transparent',
                    border: selectedTrends.includes(trend.id) ? '1px solid #4069FD' : '1px solid transparent',
                    marginBottom: 'var(--spectrum-spacing-75)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedTrends.includes(trend.id)) {
                      e.currentTarget.style.backgroundColor = 'var(--spectrum-gray-100)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedTrends.includes(trend.id)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTrends.includes(trend.id)}
                    onChange={() => toggleTrendSelection(trend.id)}
                    style={{
                      marginRight: 'var(--spectrum-spacing-200)',
                      marginTop: '2px',
                      cursor: 'pointer',
                      accentColor: '#4069FD',
                      width: '16px',
                      height: '16px',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 'var(--spectrum-body-text-size)',
                      color: 'var(--spectrum-heading-color)',
                      marginBottom: 'var(--spectrum-spacing-50)',
                    }}>
                      {trend.name}
                    </div>
                    <div style={{
                      fontSize: 'var(--spectrum-body-xs-text-size)',
                      color: 'var(--spectrum-gray-700)',
                    }}>
                      {trend.desc}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
        
        {selectedTrends.length > 0 && (
          <div style={{
            marginTop: 'var(--spectrum-spacing-200)',
            fontSize: 'var(--spectrum-body-xs-text-size)',
            color: '#4069FD',
            fontWeight: 600,
          }}>
            {selectedTrends.length} {t('trendsSelected').replace('{count}', selectedTrends.length.toString())}
          </div>
        )}
      </div>

      {/* Content Type Selection Dropdown */}
      <div style={{
        marginBottom: 'var(--spectrum-spacing-400)'
      }}>
        <label
          htmlFor="content-type-select"
          style={{
            display: 'block',
            fontSize: 'var(--spectrum-body-text-size)',
            fontWeight: 600,
            color: 'var(--spectrum-heading-color)',
            marginBottom: 'var(--spectrum-spacing-100)'
          }}
        >
          {t('whatGenerate')}
        </label>
        <div style={{
          position: 'relative',
        }}>
          <select
            id="content-type-select"
            value={selectedContentType}
            onChange={(e) => setSelectedContentType(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--spectrum-spacing-300) var(--spectrum-spacing-400)',
              fontSize: 'var(--spectrum-body-text-size)',
              fontFamily: 'adobe-clean, sans-serif',
              fontWeight: 400,
              backgroundColor: 'var(--spectrum-background-layer-1)',
              color: selectedContentType ? 'var(--spectrum-heading-color)' : 'var(--spectrum-gray-600)',
              border: '1px solid var(--spectrum-border-color)',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              paddingRight: 'var(--spectrum-spacing-500)',
              transition: 'border-color 0.13s ease-out, box-shadow 0.13s ease-out',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4069FD';
              e.currentTarget.style.boxShadow = '0 0 0 1px #4069FD';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--spectrum-border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="" disabled>-- Choose content type --</option>
            {contentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - {type.desc}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div style={{
            position: 'absolute',
            right: 'var(--spectrum-spacing-200)',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            width: '12px',
            height: '12px',
            borderLeft: '2px solid var(--spectrum-gray-700)',
            borderBottom: '2px solid var(--spectrum-gray-700)',
            rotate: '-45deg',
            marginTop: '-3px',
          }} />
        </div>
        {selectedContentType && (
          <div style={{
            marginTop: 'var(--spectrum-spacing-200)',
            padding: 'var(--spectrum-spacing-200)',
            backgroundColor: 'rgba(64, 105, 253, 0.05)',
            border: '1px solid rgba(64, 105, 253, 0.2)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            fontSize: 'var(--spectrum-body-xs-text-size)',
            color: 'var(--spectrum-gray-700)',
          }}>
            <strong style={{ color: '#4069FD' }}>{t('selected')}:</strong> {contentTypes.find(t => t.id === selectedContentType)?.name}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGeneratePrompt}
        disabled={!hasBrandData || generatingPrompt || selectedTrends.length === 0 || !selectedContentType}
        style={{
          width: '100%',
          padding: 'var(--spectrum-spacing-300)',
          fontSize: 'var(--spectrum-font-size-200)',
          fontWeight: 700,
          fontFamily: 'adobe-clean, sans-serif',
          backgroundColor: generatingPrompt ? 'var(--spectrum-gray-400)' : '#4069FD',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          cursor: hasBrandData && !generatingPrompt && selectedTrends.length > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.13s ease-out',
          opacity: !hasBrandData || selectedTrends.length === 0 ? 0.5 : 1,
          marginBottom: 'var(--spectrum-spacing-400)'
        }}
        onMouseEnter={(e) => {
          if (hasBrandData && !generatingPrompt && selectedTrends.length > 0) {
            e.currentTarget.style.backgroundColor = '#5078FE';
          }
        }}
        onMouseLeave={(e) => {
          if (hasBrandData && !generatingPrompt && selectedTrends.length > 0) {
            e.currentTarget.style.backgroundColor = '#4069FD';
          }
        }}
      >
        {generatingPrompt ? (
          <>{t('generating')}</>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Sparkles size={18} />
            {t('generatePrompt')}
          </span>
        )}
      </button>

      {/* Loading State */}
      {generatingPrompt && (
        <div style={{ textAlign: 'center', padding: 'var(--spectrum-spacing-600)', marginBottom: 'var(--spectrum-spacing-400)' }}>
          <ProgressCircle size="medium" label={t('generatingPrompt')} />
        </div>
      )}

      {/* Generated Prompt Display */}
      {!generatingPrompt && generatedPrompt && (
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
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spectrum-spacing-100)'
            }}>
              <Sparkles size={20} color="#00719f" />
              Generated Firefly Prompt
            </h3>
          </div>
          
          <div style={{
            padding: 'var(--spectrum-spacing-300)',
            backgroundColor: 'var(--spectrum-background-layer-1)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            border: '1px solid var(--spectrum-border-color)',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 'var(--spectrum-body-xs-text-size)',
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
            Use this prompt in Adobe Firefly to generate your design.
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
            Extract brand data in the <strong>Brand Brain</strong> tab first to enable prompt generation.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendEngine;
