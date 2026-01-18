import React from 'react';
import { Brain, ExternalLink, Github, Mail, Search, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import logoLight from '../assets/light-full-removebg-preview.png';
import addOnUISdk, { ButtonType, FieldType, Variant } from "https://express.adobe.com/static/add-on-sdk/sdk.js";

const About: React.FC = () => {
  const { t } = useLanguage();

  const PRIMARY = '#00719f';
  const ACCENT = '#FA0';
  const SURFACE = 'var(--spectrum-background-layer-2)';
  const BORDER = 'var(--spectrum-border-color)';
  const BODY = 'var(--spectrum-body-color)';
  const MUTED = 'var(--spectrum-gray-700)';

  const containerStyle: React.CSSProperties = {
    padding: 'var(--spectrum-spacing-300)',
    fontFamily: 'adobe-clean, sans-serif',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: 'var(--spectrum-spacing-400)',
  };

  const sectionTitleRowStyle: React.CSSProperties = {
    margin: '0 0 var(--spectrum-spacing-200) 0',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spectrum-spacing-100)',
  };

  const cardStyle: React.CSSProperties = {
    padding: 'var(--spectrum-spacing-200)',
    backgroundColor: SURFACE,
    borderRadius: 'var(--spectrum-corner-radius-100)',
    border: `1px solid ${BORDER}`,
  };

  const linkCardStyle: React.CSSProperties = {
    ...cardStyle,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spectrum-spacing-200)',
    color: PRIMARY,
    textDecoration: 'none',
    fontSize: 'var(--spectrum-body-text-size)',
    fontWeight: 500,
    transition: 'background-color 0.13s ease-out',
    cursor: 'pointer',
  };

  const DOCS_URL = 'https://silky-saturday-54e.notion.site/2eabba81b034817a8256defeaa1bd200?v=2eabba81b03481be8693000cfb9f9262';
  const GITHUB_URL = 'https://github.com/Keshav-poha/Adobe-express-addon';
  const SUPPORT_EMAIL = 'aquawit22@gmail.com';

  const openResourcesPopup = async () => {
    try {
      await addOnUISdk.ready;

      const resources = {
        docs: { title: t('documentation'), value: DOCS_URL, openUrl: DOCS_URL },
        github: { title: t('github'), value: GITHUB_URL, openUrl: GITHUB_URL },
        support: { title: t('support'), value: SUPPORT_EMAIL, openUrl: `mailto:${SUPPORT_EMAIL}` },
      } as const;

      const pickResource = async () => {
        const result = await addOnUISdk.app.showModalDialog({
          variant: Variant.information,
          title: t('resources'),
          description: 'Choose what you want to view:',
          buttonLabels: {
            primary: resources.docs.title,
            secondary: resources.github.title,
            cancel: resources.support.title,
          },
        });

        if (result.buttonType === ButtonType.primary) return resources.docs;
        if (result.buttonType === ButtonType.secondary) return resources.github;
        if (result.buttonType === ButtonType.cancel) return resources.support;
        return null; // closed
      };

      const showResource = async (res: { title: string; value: string; openUrl: string }) => {
        return await addOnUISdk.app.showModalDialog({
          variant: Variant.input,
          title: res.title,
          description: 'Here is the link:',
          field: {
            label: res.title,
            fieldType: FieldType.text,
            initialValue: res.value,
          },
          buttonLabels: {
            primary: 'Close',
            cancel: 'Back',
          },
        });
      };

      while (true) {
        const selected = await pickResource();
        if (!selected) return;

        const result = await showResource(selected);
        if (result.buttonType === ButtonType.cancel) {
          continue; // back to resource picker
        }
        return; // closed
      }
    } catch (e) {
      // If dialogs are blocked/unavailable for any reason, fall back to showing the links inline
      await addOnUISdk.app.showModalDialog({
        variant: Variant.information,
        title: t('resources'),
        description: `${t('documentation')}: ${DOCS_URL}\n${t('github')}: ${GITHUB_URL}\n${t('support')}: ${SUPPORT_EMAIL}`,
      });
    }
  };

  const FeatureCard = ({
    icon,
    title,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spectrum-spacing-200)' }}>
        <div style={{ flexShrink: 0, color: PRIMARY, marginTop: 2 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--spectrum-body-s-text-size)', fontWeight: 600, color: BODY, marginBottom: 8 }}>
            {title}
          </div>
          <p style={{ margin: 0, fontSize: 'var(--spectrum-body-xs-text-size)', color: MUTED, lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
  
  return (
    <div style={containerStyle}>
      <h2 className="spectrum-heading-xl">
        {t('aboutTitle')}
      </h2>
      <p className="spectrum-body-s" style={{ marginBottom: 'var(--spectrum-spacing-500)' }}>
        {t('aboutSubtitle')}
      </p>

      {/* App Info Section */}
      <div style={{
        padding: 'var(--spectrum-spacing-300)',
        backgroundColor: SURFACE,
        borderRadius: 'var(--spectrum-corner-radius-200)',
        border: `2px solid ${ACCENT}`,
        marginBottom: 'var(--spectrum-spacing-300)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}>
        {/* Row 1: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spectrum-spacing-300)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src={logoLight}
              alt="Pixel Pluck logo"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <h3 className="spectrum-heading-l" style={{ margin: '0 0 var(--spectrum-spacing-50) 0', color: PRIMARY }}>
              {t('pixelPluck')}
            </h3>
            <div style={{ fontSize: 'var(--spectrum-body-xs-text-size)', color: MUTED }}>
              {t('version')}: 1.0.0
            </div>
          </div>
        </div>

        {/* Row 2: Tagline */}
        <p
          style={{
            margin: 'var(--spectrum-spacing-200) 0 0 0',
            fontSize: 'var(--spectrum-body-text-size)',
            color: MUTED,
            lineHeight: 1.6,
            textAlign: 'left',
          }}
        >
          {t('appTagline')}
        </p>
      </div>

      {/* Features Section */}
      <div style={sectionStyle}>
        <h3 className="spectrum-heading-l" style={sectionTitleRowStyle}>
          <Brain size={20} color={PRIMARY} />
          {t('features')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spectrum-spacing-200)' }}>
          <FeatureCard
            icon={<Brain size={18} />}
            title={t('brandBrain')}
            description={t('featureBrain').replace(/^.*-\s*/, '')}
          />
          <FeatureCard
            icon={<TrendingUp size={18} />}
            title={t('trendEngine')}
            description={t('featureTrends').replace(/^.*-\s*/, '')}
          />
          <FeatureCard
            icon={<Search size={18} />}
            title={t('designAuditor')}
            description={t('featureAuditor').replace(/^.*-\s*/, '')}
          />
        </div>
      </div>

      {/* Links Section */}
      <div style={{ marginBottom: 'var(--spectrum-spacing-300)' }}>
        <h3 className="spectrum-heading-l" style={sectionTitleRowStyle}>
          <ExternalLink size={20} color={PRIMARY} />
          {t('resources')}
          <button
            type="button"
            onClick={openResourcesPopup}
            style={{
              marginLeft: 'auto',
              padding: '4px 8px',
              fontSize: 'var(--spectrum-body-s-text-size)',
              fontFamily: 'adobe-clean, sans-serif',
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: PRIMARY,
              border: `1px solid ${BORDER}`,
              borderRadius: 'var(--spectrum-corner-radius-100)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--spectrum-gray-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="View links"
          >
            View
          </button>
        </h3>
        </div>

      {/* Footer */}
      <div style={{
        padding: 'var(--spectrum-spacing-300)',
        textAlign: 'center',
        borderTop: '1px solid var(--spectrum-border-color)',
        paddingTop: 'var(--spectrum-spacing-300)'
      }}>
        <p style={{
          margin: 0,
          fontSize: 'var(--spectrum-body-s-text-size)',
          color: 'var(--spectrum-gray-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {t('madeWith')}
        </p>
      </div>
    </div>
  );
};

export default About;
