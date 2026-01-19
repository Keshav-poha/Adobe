import React, { useState, useEffect } from 'react';
import { useBrand } from '../../context/BrandContext';
import { groqClient, VisionAnalysis } from '../../services/GroqClient';
import { Search, BarChart3, Lightbulb, Sparkles, Upload, Lock, Crown, X } from 'lucide-react';
import { ProgressCircle } from './LoadingComponents';
import addOnUISdk from "https://express.adobe.com/static/add-on-sdk/sdk.js";
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from './ToastNotification';
import { DocumentSandboxApi } from '../../models/DocumentSandboxApi';

const DesignAuditor: React.FC<{ sandboxProxy?: DocumentSandboxApi }> = ({ sandboxProxy }) => {
  const { t, language } = useLanguage();
  const { brandData, hasBrandData } = useBrand();
  const [auditing, setAuditing] = useState(false);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean | null>(null);
  const [checkingPremium, setCheckingPremium] = useState(true);

  const toast = useToast();

  // Check premium status on component mount
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const premium = await addOnUISdk.app.currentUser.isPremiumUser();
        setIsPremiumUser(premium);
      } catch (error) {
        // Silently default to non-premium if premium check fails
        setIsPremiumUser(false);
      } finally {
        setCheckingPremium(false);
      }
    };

    checkPremiumStatus();
  }, []);

  const handleUpgrade = async () => {
    try {
      const hasUpgraded = await addOnUISdk.app.startPremiumUpgradeIfFreeUser();
      if (hasUpgraded) {
        // User upgraded successfully, update premium status
        setIsPremiumUser(true);
      }
    } catch (error) {
      // Silently handle upgrade flow errors
    }
  };

  // Helper function to resize image to reduce payload size
  const resizeImage = async (blob: Blob, maxWidth: number = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with quality compression
        canvas.toBlob(
          (resizedBlob) => {
            if (!resizedBlob) {
              reject(new Error('Failed to create resized blob'));
              return;
            }
            
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              URL.revokeObjectURL(url);
              resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to read resized image'));
            reader.readAsDataURL(resizedBlob);
          },
          'image/jpeg',
          0.85 // 85% quality for good balance between quality and size
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const runAudit = async () => {
    // Check premium status before running audit
    if (!isPremiumUser) {
      setError('Design Audit requires an upgrade. Please upgrade to use this feature.');
      return;
    }
    
    if (!hasBrandData) {
      setError(t('extractFirst'));
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setAuditing(true);
    setAnalysis(null); // Clear previous analysis to ensure fresh audit
    setError(null); // Clear any previous errors

    try {
      // Create a completely fresh rendition with highly unique parameters to force regeneration
      // This ensures a NEW audit is generated every time the button is pressed
      const timestamp = Date.now();
      const randomSeed = Math.random().toString(36).substring(2, 15);
      const uniqueId = `${timestamp}_${randomSeed}_${Math.floor(Math.random() * 1000)}`;

      const renditions = await addOnUISdk.app.document.createRenditions(
        {
          range: addOnUISdk.constants.Range.currentPage,
          format: addOnUISdk.constants.RenditionFormat.png,
          requestedSize: {
            width: 1024 + (timestamp % 100), // Vary width slightly
            height: 1024 + (timestamp % 100), // Vary height slightly
          },
          fileSizeLimit: 5000 + (timestamp % 100), // Vary file size limit
          fileSizeLimitUnit: addOnUISdk.constants.FileSizeLimitUnit.KB,
          // Add unique metadata to force fresh generation
          metadata: {
            auditId: uniqueId,
            timestamp: timestamp,
            randomSeed: randomSeed
          }
        } as any // Cast to any to allow PNG-specific options
      );

      if (renditions.length === 0) {
        throw new Error('No rendition created');
      }

      const rendition = renditions[0];
      const blob = rendition.blob;

      // Resize and compress image to avoid 413 errors
      const base64 = await resizeImage(blob, 1024);

      // Check if page has any content
      if (!base64 || base64.length < 100) {
        throw new Error('Page appears empty. Add some content before running design audit.');
      }

      // Analyze with Groq Vision (pass signal for cancellation, force fresh results)
      const visionAnalysis = await groqClient.analyzeDesign(base64, brandData, language, controller.signal, () => !!controller.signal.aborted);
      
      // Validate analysis returned
      if (!visionAnalysis) {
        throw new Error('Design review service is currently unavailable. Please try again later.');
      }
      
      setAnalysis(visionAnalysis);
      // suppressed success toast to reduce notification noise
    } catch (error) {
      // Error handling with toast notifications below
      
      // Provide specific error messages
      let errorMessage = 'Failed to run audit. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('unavailable') || error.message.includes('service')) {
          errorMessage = 'Design review service is temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('empty')) {
          errorMessage = error.message;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('413') || error.message.includes('too large') || error.message.includes('request_too_large')) {
          errorMessage = 'Design is too complex to analyze. Try simplifying your design or analyzing a smaller section.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast.showToast('error', errorMessage, 7000);
    } finally {
      setAuditing(false);
      setAbortController(null);
    }
  };

  const cancelAudit = () => {
    if (abortController) {
      abortController.abort();
      setAuditing(false);
      setAbortController(null);
    }
  };

  const addAnalysisToCanvas = async (analysis: VisionAnalysis) => {
    try {
      if (!sandboxProxy) {
        toast.showToast('error', 'Canvas API not available.', 4000);
        return;
      }
      // Build a concise textual summary and add it to the document
      const lines: string[] = [];
      lines.push(`Audit Score: ${analysis.score} (${getScoreLabel(analysis.score)})`);
      if (analysis.feedback && analysis.feedback.length) {
        lines.push('\nFeedback:');
        lines.push(...analysis.feedback.slice(0, 5).map((f) => `- ${f}`));
      }
      if (analysis.recommendations && analysis.recommendations.length) {
        lines.push('\nRecommendations:');
        lines.push(...analysis.recommendations.slice(0, 5).map((r) => `- ${r}`));
      }
      const primaryColors = (analysis as any).primaryColors || (brandData ? brandData.primaryColors : []);
      if (primaryColors && primaryColors.length) {
        lines.push('\nPrimary Colors: ' + primaryColors.slice(0, 5).join(', '));
      }

      const summaryText = lines.join('\n');
      sandboxProxy.createText(summaryText);
      toast.showToast('success', 'Analysis added to document.', 4000);
    } catch (err) {
      toast.showToast('error', 'Failed to add to document.', 5000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4069FD'; // Primary Blue
    if (score >= 75) return '#00719f'; // Accent Teal
    if (score >= 60) return '#FA0'; // Yellow/Orange
    return '#5078FE'; // Light Blue
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  const metrics = analysis
    ? [
        { label: t('colorConsistency'), score: analysis.colorConsistency },
        { label: t('typographyScale'), score: analysis.typographyScale },
        { label: t('spacingRhythm'), score: analysis.spacingRhythm },
        { label: t('accessibility'), score: analysis.accessibility },
      ]
    : [];

  return (
    <div style={{ padding: 'var(--spectrum-spacing-400)', fontFamily: 'adobe-clean, sans-serif' }}>

      {/* Loading Premium Status */}
      {checkingPremium && (
        <div style={{ textAlign: 'center', padding: 'var(--spectrum-spacing-600)' }}>
          <ProgressCircle size="medium" label="Checking access..." />
        </div>
      )}

      {/* Premium Paywall */}
      {!checkingPremium && !isPremiumUser && (
        <div style={{
          padding: 'var(--spectrum-spacing-400)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          border: '1px solid var(--spectrum-border-color)',
          textAlign: 'center',
          marginBottom: 'var(--spectrum-spacing-400)',
        }}>
          <p style={{
            fontSize: 'var(--spectrum-body-text-size)',
            color: 'var(--spectrum-body-color)',
            margin: '0 0 var(--spectrum-spacing-300) 0',
          }}>
            Feature available to users on the Upgrade plan only
          </p>

          <button
            onClick={handleUpgrade}
            style={{
              padding: 'var(--spectrum-spacing-200) var(--spectrum-spacing-400)',
              fontSize: 'var(--spectrum-body-xs-text-size)',
              fontWeight: 600,
              fontFamily: 'adobe-clean, sans-serif',
              backgroundColor: '#4069FD',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              cursor: 'pointer',
              transition: 'all 0.13s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5078FE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4069FD';
            }}
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Main Content - Only show if premium user */}
      {!checkingPremium && isPremiumUser && (
        <>
      {/* Error Display */}
      {error && (
        <div style={{
          padding: 'var(--spectrum-spacing-300)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          border: '1px solid var(--spectrum-negative-color)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          marginBottom: 'var(--spectrum-spacing-400)',
        }}>
          <p style={{ 
            margin: 0,
            fontSize: 'var(--spectrum-font-size-100)',
            color: 'var(--spectrum-negative-color)',
            fontWeight: 500
          }}>
            {error}
          </p>
        </div>
      )}

      {/* Brand Context Display */}
      {hasBrandData && (
        <div style={{
          padding: 'var(--spectrum-spacing-300)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          border: '1px solid var(--spectrum-border-color)',
          marginBottom: 'var(--spectrum-spacing-400)'
        }}>
          <h3 className="spectrum-heading-m" style={{ 
            margin: '0 0 var(--spectrum-spacing-200) 0'
          }}>
            {t('auditingBrand')}
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spectrum-spacing-200)',
            flexWrap: 'wrap'
          }}>
            <span style={{ 
              fontSize: 'var(--spectrum-body-xs-text-size)',
              color: 'var(--spectrum-body-color)',
              fontWeight: 600
            }}>
              Colors:
            </span>
            <div style={{ display: 'flex', gap: 'var(--spectrum-spacing-75)' }}>
              {brandData.primaryColors.slice(0, 5).map((color, index) => (
                <div
                  key={index}
                  title={color}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: color,
                    borderRadius: '4px',
                    border: '1px solid var(--spectrum-border-color)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Run Audit Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={runAudit}
          disabled={!hasBrandData || auditing}
          style={{
            width: '100%',
            padding: 'var(--spectrum-spacing-300) var(--spectrum-spacing-400)',
            fontSize: 'var(--spectrum-font-size-200)',
            fontWeight: 700,
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: auditing ? 'var(--spectrum-gray-400)' : '#4069FD',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            cursor: !hasBrandData || auditing ? 'not-allowed' : 'pointer',
            transition: 'all 0.13s ease-out',
            opacity: !hasBrandData || auditing ? 0.5 : 1,
            marginBottom: 'var(--spectrum-spacing-400)'
          }}
          onMouseEnter={(e) => {
            if (hasBrandData && !auditing) {
              e.currentTarget.style.backgroundColor = '#5078FE';
            }
          }}
          onMouseLeave={(e) => {
            if (hasBrandData && !auditing) {
              e.currentTarget.style.backgroundColor = '#4069FD';
            }
          }}
        >
          {auditing ? (
            <>{t('analyzing')}</>
          ) : (
            <>
              <Search size={18} />
              {t('runAudit')}
            </>
          )}
        </button>

        {auditing && (
          <button
            onClick={cancelAudit}
            title={t('cancel') || 'Cancel'}
            aria-label={t('cancel') || 'Cancel'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '40%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.45)',
              border: 'none',
              width: '32px',
              height: '32px',
              padding: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 9999,
            }}
          >
            <X size={14} color="#fff" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {auditing && (
        <div style={{ textAlign: 'center', padding: 'var(--spectrum-spacing-600)' }}>
          <ProgressCircle size="medium" label={t('analyzingDesign')} />
        </div>
      )}

      {/* Analysis Results */}
      {!auditing && analysis && (
        <div style={{
          padding: 'var(--spectrum-spacing-400)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-200)',
          border: '2px solid #FA0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spectrum-spacing-200)' }}>
            <button
              onClick={() => addAnalysisToCanvas(analysis)}
              style={{
                padding: '6px 10px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#4069FD',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Add to Canvas
            </button>
            <button
              onClick={() => setAnalysis(null)}
              title={t('cancel') || 'Cancel'}
              aria-label={t('cancel') || 'Cancel'}
              style={{
                marginLeft: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 'var(--spectrum-corner-radius-100)',
                color: 'var(--spectrum-gray-600)',
                transition: 'all 0.13s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--spectrum-red-100)';
                e.currentTarget.style.color = 'var(--spectrum-red-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--spectrum-gray-600)';
              }}
            >
              <X size={16} />
            </button>
          </div>
          {/* Overall Score */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 'var(--spectrum-spacing-500)',
            padding: 'var(--spectrum-spacing-400)',
            backgroundColor: 'var(--spectrum-background-layer-1)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
          }}>
            <div style={{ 
              fontSize: '64px', 
              fontWeight: 800, 
              color: getScoreColor(analysis.score),
              lineHeight: 1,
              marginBottom: 'var(--spectrum-spacing-100)'
            }}>
              {analysis.score}
            </div>
            <p style={{ 
              fontSize: 'var(--spectrum-body-l-text-size)',
              color: 'var(--spectrum-body-color)',
              fontWeight: 600,
              margin: '0 0 var(--spectrum-spacing-75) 0'
            }}>
              {t('overallScore')}
            </p>
            <span style={{
              display: 'inline-block',
              padding: 'var(--spectrum-spacing-75) var(--spectrum-spacing-300)',
              backgroundColor: getScoreColor(analysis.score),
              color: '#fff',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              fontSize: 'var(--spectrum-body-xs-text-size)',
              fontWeight: 700,
            }}>
              {getScoreLabel(analysis.score)}
            </span>
          </div>

          {/* Detailed Metrics */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--spectrum-spacing-300)',
            marginBottom: 'var(--spectrum-spacing-400)'
          }}>
            <h3 className="spectrum-heading-l" style={{ 
              margin: '0 0 var(--spectrum-spacing-200) 0',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spectrum-spacing-100)'
            }}>
              <BarChart3 size={20} color="#00719f" />
              {t('detailedMetrics')}
            </h3>
            {metrics.map((metric, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spectrum-spacing-300)',
                  backgroundColor: 'var(--spectrum-background-layer-1)',
                  borderRadius: 'var(--spectrum-corner-radius-100)',
                  border: '1px solid var(--spectrum-border-color)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ 
                    fontSize: 'var(--spectrum-body-text-size)', 
                    color: 'var(--spectrum-body-color)',
                    fontWeight: 600
                  }}>
                    {metric.label}
                  </span>
                  <div style={{
                    marginTop: 'var(--spectrum-spacing-100)',
                    height: '6px',
                    backgroundColor: 'var(--spectrum-gray-200)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: '200px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${metric.score}%`,
                      backgroundColor: getScoreColor(metric.score),
                      transition: 'width 0.3s ease-out'
                    }} />
                  </div>
                </div>
                <span style={{ 
                  fontSize: 'var(--spectrum-heading-s-text-size)', 
                  fontWeight: 700, 
                  color: getScoreColor(metric.score),
                  marginLeft: 'var(--spectrum-spacing-300)'
                }}>
                  {metric.score}
                </span>
              </div>
            ))}
          </div>

          {/* Feedback */}
          {analysis.feedback.length > 0 && (
            <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
              <h3 className="spectrum-heading-l" style={{ 
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <Lightbulb size={20} color="#00719f" />
                Feedback
              </h3>
              <ul style={{ 
                margin: 0,
                paddingLeft: 'var(--spectrum-spacing-400)',
                fontSize: 'var(--spectrum-body-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.8
              }}>
                {analysis.feedback.map((item, index) => (
                  <li key={index} style={{ marginBottom: 'var(--spectrum-spacing-100)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div>
              <h3 className="spectrum-heading-l" style={{ 
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <Sparkles size={20} color="#00719f" />
                Recommendations
              </h3>
              <ul style={{ 
                margin: 0,
                paddingLeft: 'var(--spectrum-spacing-400)',
                fontSize: 'var(--spectrum-body-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.8
              }}>
                {analysis.recommendations.map((item, index) => (
                  <li key={index} style={{ marginBottom: 'var(--spectrum-spacing-100)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default DesignAuditor;
