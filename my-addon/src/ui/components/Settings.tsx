import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import addOnUISdk from 'https://express.adobe.com/static/add-on-sdk/sdk.js';
import { groqClient } from '../../services/GroqClient';
import { useToast } from './ToastNotification';

const STORAGE_KEY = 'groqApiKey';

const Settings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [apiKey, setApiKey] = useState<string>('');
  const [loadingKey, setLoadingKey] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    addOnUISdk.ready.then(async () => {
      try {
        const stored = await addOnUISdk.instance.clientStorage.getItem(STORAGE_KEY) as string | null;
        if (mounted) setApiKey(stored || '');
      } catch (err) {
        // Silently handle storage read errors during initialization
      } finally {
        if (mounted) setLoadingKey(false);
      }
    }).catch((e) => {
      // Silently handle SDK initialization errors
      setLoadingKey(false);
    });

    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await addOnUISdk.instance.clientStorage.setItem(STORAGE_KEY, apiKey || '');
      // Initialize Groq client at runtime
      groqClient.setApiKey(apiKey || '');
      setMessage('Saved');
      toast.showToast('success', 'Groq API key saved', 4000);
    } catch (err) {
      // Error already handled by toast notification below
      setMessage('Failed to save');
      toast.showToast('error', 'Failed to save Groq API key', 6000);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleTestKey = async () => {
    setSaving(true);
    setMessage(null);
    try {
      groqClient.setApiKey(apiKey || '');
      // Perform a lightweight check
      await groqClient.getViralTrends(undefined, 'en');
      setMessage('API key valid');
      toast.showToast('success', 'Groq API key validated', 4000);
    } catch (err) {
      // Error already handled by toast notification below
      setMessage('Invalid or unreachable API key');
      toast.showToast('error', 'Groq API key test failed', 6000);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await addOnUISdk.instance.clientStorage.setItem(STORAGE_KEY, '');
      groqClient.setApiKey('');
      setApiKey('');
      setMessage('Cleared');
      toast.showToast('info', 'Groq API key cleared', 3500);
    } catch (err) {
      // Error already handled by toast notification below
      setMessage('Failed to clear');
      toast.showToast('error', 'Failed to clear Groq API key', 6000);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div style={{ padding: 'var(--spectrum-spacing-400)', fontFamily: 'adobe-clean, sans-serif' }}>
      <h2 className="spectrum-heading-xl">
        {t('settings')}
      </h2>
      <p className="spectrum-body-s" style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
        {t('configureLanguage')}
      </p>

      {/* Language Setting */}
      <div style={{
        padding: 'var(--spectrum-spacing-300)',
        backgroundColor: 'var(--spectrum-background-layer-2)',
        borderRadius: 'var(--spectrum-corner-radius-100)',
        border: '1px solid var(--spectrum-border-color)',
        marginBottom: 'var(--spectrum-spacing-300)'
      }}>
        <label style={{
          display: 'block',
          fontSize: 'var(--spectrum-body-xs-text-size)',
          fontWeight: 600,
          color: 'var(--spectrum-body-color)',
          marginBottom: 'var(--spectrum-spacing-100)'
        }}>
          <Globe size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {t('language')}
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'es' | 'fr')}
          className="spectrum-input"
          style={{
            width: '100%',
          }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>

      {/* Groq API Key Setting */}
      <div style={{
        padding: 'var(--spectrum-spacing-300)',
        backgroundColor: 'var(--spectrum-background-layer-2)',
        borderRadius: 'var(--spectrum-corner-radius-100)',
        border: '1px solid var(--spectrum-border-color)'
      }}>
        <label style={{
          display: 'block',
          fontSize: 'var(--spectrum-body-xs-text-size)',
          fontWeight: 600,
          color: 'var(--spectrum-body-color)',
          marginBottom: 'var(--spectrum-spacing-100)'
        }}>
          Groq API Key
        </label>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={loadingKey ? 'Loading...' : 'Enter your Groq API key'}
          className="spectrum-input"
          style={{ width: '100%', marginBottom: 'var(--spectrum-spacing-150)' }}
        />

        <div style={{ display: 'flex', gap: 'var(--spectrum-spacing-100)' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: 'var(--spectrum-spacing-150) var(--spectrum-spacing-300)',
              backgroundColor: '#4069FD',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--spectrum-corner-radius-75)',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={handleClear}
            disabled={saving}
            style={{
              padding: 'var(--spectrum-spacing-150) var(--spectrum-spacing-300)',
              backgroundColor: 'transparent',
              color: '#4069FD',
              border: '1px solid #4069FD',
              borderRadius: 'var(--spectrum-corner-radius-75)',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Clear
          </button>
        </div>

        {message && (
          <div style={{ marginTop: 'var(--spectrum-spacing-150)', color: '#00719f' }}>{message}</div>
        )}
      </div>
    </div>
  );
};

export default Settings;
