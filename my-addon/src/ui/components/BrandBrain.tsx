import React, { useState, useEffect } from 'react';
import { useBrand } from '../../context/BrandContext';
import { groqClient } from '../../services/GroqClient';
import { Brain, Link, FileText, Sparkles, Palette, MessageSquare, CheckSquare, Ruler, Upload, AlertTriangle, Plus, X } from 'lucide-react';
import { ProgressCircle } from './LoadingComponents';
import { useToast } from './ToastNotification';
import { useLanguage } from '../../context/LanguageContext';
import { DocumentSandboxApi } from '../../models/DocumentSandboxApi';
import addOnUISdk from "https://express.adobe.com/static/add-on-sdk/sdk.js";

interface BrandBrainProps {
  sandboxProxy?: DocumentSandboxApi;
}

const BrandBrain: React.FC<BrandBrainProps> = ({ sandboxProxy }) => {
  const { t, language } = useLanguage();
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'url' | 'text' | 'image'>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { brandData, setBrandData } = useBrand();
  const toast = useToast();
  const [isCancelled, setIsCancelled] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean | null>(null);
  const [checkingPremium, setCheckingPremium] = useState(true);
  const cancelText = (t('cancel') || 'Cancel').trim();

  useEffect(() => {
    try {
      console.debug('[BrandBrain] language:', language, 'cancelText:', JSON.stringify(cancelText));
    } catch (e) {
      // ignore
    }
  }, [language, cancelText]);

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

  // Cancel ongoing extraction
  const cancelExtraction = () => {
    if (abortController) {
      abortController.abort();
      setIsCancelled(true);
      setAbortController(null);
      setLoading(false);
      setProgress('');
    }
  };

  // Clear extracted brand data
  const clearBrandData = () => {
    setBrandData({
      primaryColors: [],
      brandVoice: '',
      designGuidelines: [],
      typography: undefined,
      spacing: undefined,
      layoutPatterns: []
    });
  };

  // Validate URL format
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  // Validate file size and type
  const validateImageFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return t('invalidFileType');
    }

    return null;
  };

  const handleExtract = async () => {
    if (!url.trim()) {
      setError(t('urlRequired'));
      return;
    }

    if (!isValidUrl(url)) {
      setError(t('invalidUrl'));
      toast.showToast('error', t('invalidUrl'), 5000);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsCancelled(false);
    setLoading(true);
    setError(null);
    setProgress(t('analyzingWebsite'));

    try {
      // Use Groq to analyze website content directly
      const websiteContent = `Website URL: ${url}\n\nPlease analyze this website for brand identity. Extract colors, typography, messaging, and design patterns.`;

      setProgress(t('extractingBrandData'));
      const extractedBrandData = await groqClient.extractBrandIdentity(websiteContent, language, undefined, controller.signal, () => isCancelled);

      setBrandData(extractedBrandData);
      setProgress('');
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || isCancelled)) {
        // Request was cancelled
        return;
      }
      const message = err instanceof Error ? err.message : t('extractionFailed');
      setError(message);
      setProgress('');
      toast.showToast('error', message, 7000);
    } finally {
      setLoading(false);
      setAbortController(null);
      setProgress('');
    }
  };

  const handleManualExtract = async () => {
    if (!manualText.trim()) {
      setError(t('textRequired'));
      toast.showToast('error', t('textRequired'), 5000);
      return;
    }

    if (manualText.trim().length < 10) {
      setError(t('textTooShort'));
      toast.showToast('error', t('textTooShort'), 5000);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsCancelled(false);
    setLoading(true);
    setError(null);
    setProgress(t('analyzingText'));

    try {
      setProgress(t('extractingBrandData'));
      const extractedBrandData = await groqClient.extractBrandIdentity(manualText, language, undefined, controller.signal, () => isCancelled);

      setBrandData(extractedBrandData);
      setProgress('');
      // success toast suppressed to reduce notifications
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || isCancelled)) {
        return;
      }
      const message = err instanceof Error ? err.message : t('extractionFailed');
      setError(message);
      setProgress('');
      toast.showToast('error', message, 7000);
    } finally {
      setLoading(false);
      setAbortController(null);
      setProgress('');
    }
  };

  const handleImageExtract = async () => {
    if (!uploadedImage) {
      setError(t('imageRequired'));
      return;
    }

    const validationError = validateImageFile(uploadedImage);
    if (validationError) {
      setError(validationError);
      toast.showToast('error', validationError, 5000);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsCancelled(false);
    setLoading(true);
    setError(null);
    setProgress(t('processingImage'));

    try {
      // Convert image to base64 efficiently
      setProgress(t('convertingImage'));
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.onerror = () => reject(new Error(t('imageReadError')));
        reader.readAsDataURL(uploadedImage);
      });

      setProgress(t('analyzingImage'));
      const extractedBrandData = await groqClient.extractBrandIdentity('', language, base64, controller.signal, () => isCancelled);
      setBrandData(extractedBrandData);
      setProgress('');
      // success toast suppressed to reduce notifications
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || isCancelled)) {
        return;
      }
      const message = err instanceof Error ? err.message : t('extractionFailed');
      setError(message);
      setProgress('');
      toast.showToast('error', message, 7000);
    } finally {
      setLoading(false);
      setAbortController(null);
      setProgress('');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      toast.showToast('error', validationError, 5000);
      return;
    }

    setUploadedImage(file);
    setError(null);
    // image uploaded - no toast to reduce noise
  };

  const applyBrandColorsToDocument = async () => {
    // Check premium status before applying colors
    if (!isPremiumUser) {
      toast.showToast('error', 'Adding colors to document requires an upgrade. Please upgrade to use this feature.', 7000);
      return;
    }

    if (!brandData?.primaryColors || brandData.primaryColors.length === 0 || !sandboxProxy) {
      toast.showToast('error', t('noBrandDataOrSandbox'), 5000);
      return;
    }

    try {
      // Create rectangles for each brand color
      const colors = brandData.primaryColors.slice(0, 5); // Limit to 5 colors
      const rectWidth = 100;
      const rectHeight = 100;
      const spacing = 20;
      let xOffset = 50;

      for (const color of colors) {
        await sandboxProxy.createRectangle({
          x: xOffset,
          y: 50,
          width: rectWidth,
          height: rectHeight,
          fillColor: color,
          strokeColor: '#000000',
          strokeWidth: 1
        });
        xOffset += rectWidth + spacing;
      }

      // Colors applied to document - no toast to reduce noise
    } catch (err) {
      const message = err instanceof Error ? err.message : t('documentUpdateFailed');
      toast.showToast('error', message, 7000);
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
          {t('uploadScreenshot')}
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
          {t('urlNote')}
        </p>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null); // Clear error on input change
          }}
          placeholder="https://example.com"
          disabled={loading}
          style={{
            width: '100%',
            padding: 'var(--spectrum-spacing-200)',
            fontSize: 'var(--spectrum-font-size-100)',
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: 'var(--spectrum-background-layer-1)',
            border: `1px solid ${error ? 'var(--spectrum-negative-color)' : 'var(--spectrum-border-color)'}`,
            borderRadius: 'var(--spectrum-corner-radius-100)',
            color: 'var(--spectrum-text-body)',
            outline: 'none',
            transition: 'border-color 0.13s ease-out',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--spectrum-negative-color)' : '#FA0';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--spectrum-negative-color)' : 'var(--spectrum-border-color)';
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spectrum-spacing-300)', marginTop: 'var(--spectrum-spacing-300)' }}>
          <button
            onClick={handleExtract}
            disabled={!url.trim() || loading}
            style={{
              padding: 'var(--spectrum-spacing-200) var(--spectrum-spacing-400)',
              fontSize: 'var(--spectrum-font-size-100)',
              fontWeight: 600,
              fontFamily: 'adobe-clean, sans-serif',
              backgroundColor: loading ? 'var(--spectrum-gray-400)' : '#4069FD',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.13s ease-out',
              opacity: loading || !url.trim() ? 0.5 : 1,
            }}
          onMouseEnter={(e) => {
            if (!loading && url.trim()) {
              e.currentTarget.style.backgroundColor = '#5078FE';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && url.trim()) {
              e.currentTarget.style.backgroundColor = '#4069FD';
            }
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <ProgressCircle size="small" />
              <div style={{ fontSize: 'var(--spectrum-body-xs-text-size)', color: 'var(--spectrum-text-secondary)' }}>
                {progress || t('extracting')}
              </div>
            </div>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={16} />
              {t('extractBrand')}
            </span>
          )}
          </button>

          {loading && abortController && (
            <button
              onClick={cancelExtraction}
              title={t('cancel') || 'Cancel'}
              aria-label={t('cancel') || 'Cancel'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)',
                border: 'none',
                padding: '6px',
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
        <p style={{
          fontSize: 'var(--spectrum-body-xs-text-size)',
          color: 'var(--spectrum-gray-600)',
          marginBottom: 'var(--spectrum-spacing-200)',
          fontStyle: 'italic'
        }}>
          {t('manualNote')}
        </p>
        <textarea
          value={manualText}
          onChange={(e) => {
            setManualText(e.target.value);
            if (error) setError(null); // Clear error on input change
          }}
          placeholder={t('brandTextPlaceholder')}
          disabled={loading}
          rows={8}
          style={{
            width: '100%',
            padding: 'var(--spectrum-spacing-200)',
            fontSize: 'var(--spectrum-font-size-100)',
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: 'var(--spectrum-background-layer-1)',
            border: `1px solid ${error ? 'var(--spectrum-negative-color)' : 'var(--spectrum-border-color)'}`,
            borderRadius: 'var(--spectrum-corner-radius-100)',
            color: 'var(--spectrum-text-body)',
            outline: 'none',
            transition: 'border-color 0.13s ease-out',
            resize: 'vertical',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--spectrum-negative-color)' : '#FA0';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--spectrum-negative-color)' : 'var(--spectrum-border-color)';
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spectrum-spacing-300)', marginTop: 'var(--spectrum-spacing-300)' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <ProgressCircle size="small" />
              <div style={{ fontSize: 'var(--spectrum-body-xs-text-size)', color: 'var(--spectrum-text-secondary)' }}>
                {progress || t('extracting')}
              </div>
            </div>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={16} />
              {t('extractBrand')}
            </span>
          )}
          </button>

          {loading && abortController && (
            <button
              onClick={cancelExtraction}
              title={t('cancel') || 'Cancel'}
              aria-label={t('cancel') || 'Cancel'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)',
                border: 'none',
                padding: '6px',
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
          {t('uploadScreenshot')}
        </label>
        <p style={{
          fontSize: 'var(--spectrum-body-xs-text-size)',
          color: 'var(--spectrum-gray-600)',
          marginBottom: 'var(--spectrum-spacing-200)',
          fontStyle: 'italic'
        }}>
          {t('imageNote')}
        </p>
        <div style={{
          border: `2px dashed ${error ? 'var(--spectrum-negative-color)' : 'var(--spectrum-border-color)'}`,
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
            <Upload size={32} color={error ? 'var(--spectrum-negative-color)' : '#4069FD'} style={{ marginBottom: 'var(--spectrum-spacing-200)' }} />
            <p style={{
              fontSize: 'var(--spectrum-body-xs-text-size)',
              color: 'var(--spectrum-body-color)',
              margin: '0 0 var(--spectrum-spacing-100) 0',
            }}>
              {uploadedImage ? uploadedImage.name : t('clickToUpload')}
            </p>
            <p style={{
              fontSize: 'var(--spectrum-body-xs-text-size)',
              color: 'var(--spectrum-gray-600)',
              margin: 0,
            }}>
              {t('imageFormats')}
            </p>
          </label>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spectrum-spacing-300)', marginTop: 'var(--spectrum-spacing-300)' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <ProgressCircle size="small" />
              <div style={{ fontSize: 'var(--spectrum-body-xs-text-size)', color: 'var(--spectrum-text-secondary)' }}>
                {progress || t('extracting')}
              </div>
            </div>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sparkles size={16} />
              {t('extractBrand')}
            </span>
          )}
          </button>

          {loading && abortController && (
            <button
              onClick={cancelExtraction}
              title={t('cancel') || 'Cancel'}
              aria-label={t('cancel') || 'Cancel'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.45)',
                border: 'none',
                padding: '6px',
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
            fontSize: 'var(--spectrum-body-xs-text-size)',
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
            fontSize: 'var(--spectrum-heading-s-text-size)',
            fontWeight: 700,
            color: 'var(--spectrum-heading-color)',
            margin: '0 0 var(--spectrum-spacing-300) 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spectrum-spacing-200)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spectrum-spacing-200)' }}>
              <CheckSquare size={20} color="#00719f" />
              Brand Identity Extracted
            </span>
            <button
              onClick={clearBrandData}
              style={{
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
              title="Clear brand data"
            >
              <X size={16} />
            </button>
          </h3>
          
          <p style={{
            fontSize: 'var(--spectrum-body-xs-text-size)',
            color: 'var(--spectrum-gray-600)',
            margin: '0 0 var(--spectrum-spacing-300) 0',
          fontStyle: 'italic'
          }}>
            {t('notAccurateNote')}
          </p>
          
          {/* Primary Colors */}
          <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
            <h4 style={{ 
              fontSize: 'var(--spectrum-heading-s-text-size)',
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

          {/* Apply to Document Button */}
          {sandboxProxy && (
            <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
              <button
                onClick={applyBrandColorsToDocument}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spectrum-spacing-200)',
                  boxShadow: '0 2px 8px rgba(64, 105, 253, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2c5ce6';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(64, 105, 253, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4069FD';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(64, 105, 253, 0.3)';
                }}
              >
                <Plus size={16} />
                {t('applyToDocument')}
              </button>
            </div>
          )}

          {/* Brand Voice */}
          {brandData.brandVoice && (
            <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
              <h4 style={{ 
                fontSize: 'var(--spectrum-heading-s-text-size)',
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
                fontSize: 'var(--spectrum-heading-s-text-size)',
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
                fontSize: 'var(--spectrum-heading-s-text-size)',
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
                fontSize: 'var(--spectrum-body-xs-text-size)',
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
                fontSize: 'var(--spectrum-heading-s-text-size)',
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
                fontSize: 'var(--spectrum-body-xs-text-size)',
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
                fontSize: 'var(--spectrum-heading-s-text-size)',
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
