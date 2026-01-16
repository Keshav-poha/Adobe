import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BrandData {
  primaryColors: string[];
  brandVoice: string;
  designGuidelines: string[];
}

interface BrandContextType {
  brandData: BrandData;
  setBrandData: (data: BrandData) => void;
  hasBrandData: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brandData, setBrandData] = useState<BrandData>({
    primaryColors: [],
    brandVoice: '',
    designGuidelines: [],
  });

  const hasBrandData = brandData.primaryColors.length > 0;

  return (
    <BrandContext.Provider value={{ brandData, setBrandData, hasBrandData }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
