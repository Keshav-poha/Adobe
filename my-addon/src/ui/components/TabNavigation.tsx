import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'brand-brain', label: 'Brand Brain' },
    { id: 'trend-engine', label: 'Trend Engine' },
    { id: 'design-auditor', label: 'Design Auditor' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: 'var(--spectrum-background-layer-1)',
        borderBottom: '1px solid var(--spectrum-divider-color)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              padding: '12px var(--spectrum-spacing-300)',
              fontSize: 'var(--spectrum-font-size-100)',
              fontWeight: isActive ? 700 : 400,
              fontFamily: 'adobe-clean, sans-serif',
              backgroundColor: isActive ? 'var(--spectrum-background-layer-2)' : 'transparent',
              color: isActive ? 'var(--spectrum-accent-color-400)' : 'var(--spectrum-text-secondary)',
              border: 'none',
              borderBottom: isActive 
                ? '2px solid var(--spectrum-accent-color-400)' 
                : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.13s ease-out',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--spectrum-background-layer-2)';
                e.currentTarget.style.color = 'var(--spectrum-text-heading)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--spectrum-text-secondary)';
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = 'inset 0 0 0 2px var(--spectrum-border-color-focus)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
