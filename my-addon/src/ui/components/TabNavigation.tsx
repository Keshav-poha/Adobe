import React from 'react';
import { Brain, TrendingUp, Search, Settings as SettingsIcon, Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();
  
  const tabs = [
    { id: 'brand-brain', label: t('brandBrain'), icon: Brain },
    { id: 'trend-engine', label: t('trends'), icon: TrendingUp },
    { id: 'design-auditor', label: t('auditor'), icon: Search },
  ];

  return (
    <div className="tab-navigation">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-header ${isActive ? 'active' : ''}`}
          >
            <IconComponent size={16} />
            <span>{tab.label}</span>
            {isActive && <div className="tab-underline"></div>}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
