// Adobe Express Add-on - Custom Light Theme
import React, { useState } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { BrandProvider } from "../../context/BrandContext";
import { LanguageProvider } from "../../context/LanguageContext";
import { ToastProvider } from "./ToastNotification";
import TabNavigation from "./TabNavigation";
import BrandBrain from "./BrandBrain";
import TrendEngine from "./TrendEngine";
import DesignAuditor from "./DesignAuditor";
import Settings from "./Settings";
import About from "./About";
import { Settings as SettingsIcon, Info } from "lucide-react";
import "./App.css";

import { AddOnSDKAPI } from "https://express.adobe.com/static/add-on-sdk/sdk.js";
import ErrorBoundary from './ErrorBoundary';

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    const [activeTab, setActiveTab] = useState('brand-brain');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'brand-brain':
                return <BrandBrain sandboxProxy={sandboxProxy} />;
            case 'trend-engine':
                return <TrendEngine />;
            case 'design-auditor':
                return <DesignAuditor />;
            case 'settings':
                return <Settings />;
            case 'about':
                return <About />;
            default:
                return <BrandBrain sandboxProxy={sandboxProxy} />;
        }
    };

    return (
        <div className="app-theme">
            <LanguageProvider>
                <ToastProvider>
                    <BrandProvider>
                        {/* ErrorBoundary shows a friendly fallback and prevents full crash */}
                        <ErrorBoundary>
                            <div className="app-container">
                            <div className="app-header">
                                <h1 className="app-title">Pixel Pluck</h1>
                                <p className="app-subtitle">Brand-Powered Design Assistant</p>
                            </div>
                            
                            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
                            
                            <div className="tab-content">
                                {renderTabContent()}
                            </div>

                            {/* Footer with Settings and About */}
                            <div className="app-footer">
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className="footer-icon-button"
                                    title="Settings"
                                    style={{
                                        color: activeTab === 'settings' ? '#00719f' : '#6d6d6d'
                                    }}
                                >
                                    <SettingsIcon size={16} />
                            </button>
                            <button
                                onClick={() => setActiveTab('about')}
                                className="footer-icon-button"
                                title="About"
                                style={{
                                    color: activeTab === 'about' ? '#00719f' : '#6d6d6d'
                                }}
                            >
                                <Info size={16} />
                            </button>
                        </div>
                        </div>
                    </ErrorBoundary>
                </BrandProvider>
            </ToastProvider>
            </LanguageProvider>
        </div>
    );
};

export default App;
