// Adobe Spectrum Express Theme - Light Mode
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/styles/typography.css";

import { Theme } from "@swc-react/theme";
import React, { useState } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { BrandProvider } from "../../context/BrandContext";
import TabNavigation from "./TabNavigation";
import BrandBrain from "./BrandBrain";
import TrendEngine from "./TrendEngine";
import DesignAuditor from "./DesignAuditor";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    const [activeTab, setActiveTab] = useState('brand-brain');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'brand-brain':
                return <BrandBrain />;
            case 'trend-engine':
                return <TrendEngine />;
            case 'design-auditor':
                return <DesignAuditor />;
            default:
                return <BrandBrain />;
        }
    };

    return (
        <Theme system="express" scale="medium" color="light">
            <BrandProvider>
                <div className="app-container">
                    <div className="app-header">
                        <h1 className="app-title">Pixel Pluck</h1>
                        <p className="app-subtitle">Brand-Powered Design Assistant</p>
                    </div>
                    
                    <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
                    
                    <div className="tab-content">
                        {renderTabContent()}
                    </div>
                </div>
            </BrandProvider>
        </Theme>
    );
};

export default App;
