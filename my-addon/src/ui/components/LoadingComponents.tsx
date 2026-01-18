import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressCircleProps {
  size?: 'small' | 'medium' | 'large';
  indeterminate?: boolean;
  progress?: number;
  label?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({ 
  size = 'medium', 
  indeterminate = true,
  progress = 0,
  label 
}) => {
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 96
  };

  const iconSize = sizeMap[size];

  if (indeterminate) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spectrum-spacing-200)'
      }}>
        <Loader2 
          size={iconSize} 
          color="#4069FD"
          className="animate-spin"
          style={{
            animation: 'spin 1s linear infinite'
          }}
        />
        {label && (
          <span style={{
            fontSize: 'var(--spectrum-body-xs-text-size)',
            color: 'var(--spectrum-gray-700)'
          }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  // Determinate progress circle
  const radius = iconSize / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--spectrum-spacing-200)'
    }}>
      <svg width={iconSize} height={iconSize} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={iconSize / 2}
          cy={iconSize / 2}
          r={radius}
          fill="none"
          stroke="var(--spectrum-gray-300)"
          strokeWidth="4"
        />
        <circle
          cx={iconSize / 2}
          cy={iconSize / 2}
          r={radius}
          fill="none"
          stroke="#4069FD"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      {label && (
        <span style={{
          fontSize: 'var(--spectrum-body-xs-text-size)',
          color: 'var(--spectrum-gray-700)'
        }}>
          {label}
        </span>
      )}
    </div>
  );
};

interface SkeletonCardProps {
  width?: string;
  height?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  width = '128px', 
  height = '128px' 
}) => {
  return (
    <div style={{
      width,
      height,
      backgroundColor: 'var(--spectrum-gray-200)',
      borderRadius: 'var(--spectrum-corner-radius-100)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        animation: 'shimmer 1.5s infinite'
      }} />
    </div>
  );
};

interface GhostLoadingGridProps {
  count?: number;
  itemWidth?: string;
  itemHeight?: string;
  showMetadata?: boolean;
}

export const GhostLoadingGrid: React.FC<GhostLoadingGridProps> = ({ 
  count = 6,
  itemWidth = '128px',
  itemHeight = '128px',
  showMetadata = true
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
      gap: 'var(--spectrum-spacing-300)',
      padding: 'var(--spectrum-spacing-300)'
    }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <SkeletonCard width={itemWidth} height={itemHeight} />
          {showMetadata && (
            <div style={{ marginTop: 'var(--spectrum-spacing-100)' }}>
              <div style={{
                width: '80%',
                height: '12px',
                backgroundColor: 'var(--spectrum-gray-200)',
                borderRadius: '4px',
                marginBottom: '8px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  animation: 'shimmer 1.5s infinite'
                }} />
              </div>
              <div style={{
                width: '60%',
                height: '10px',
                backgroundColor: 'var(--spectrum-gray-200)',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  animation: 'shimmer 1.5s infinite'
                }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spectrum-spacing-600)',
      textAlign: 'center',
      minHeight: '300px'
    }}>
      {icon && (
        <div style={{ 
          marginBottom: 'var(--spectrum-spacing-300)',
          opacity: 0.6
        }}>
          {icon}
        </div>
      )}
      <h3 className="spectrum-heading-l" style={{ 
        margin: '0 0 var(--spectrum-spacing-100) 0' 
      }}>
        {title}
      </h3>
      <p style={{
        margin: '0 0 var(--spectrum-spacing-400) 0',
        fontSize: 'var(--spectrum-body-text-size)',
        color: 'var(--spectrum-gray-700)',
        maxWidth: '300px',
        lineHeight: 1.5
      }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="spectrum-button"
          style={{
            padding: 'var(--spectrum-spacing-200) var(--spectrum-spacing-400)',
            fontSize: 'var(--spectrum-font-size-100)',
            fontWeight: 600,
            fontFamily: 'adobe-clean, sans-serif',
            backgroundColor: '#00719f',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            cursor: 'pointer',
            transition: 'all 0.13s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#095aba';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00719f';
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Add keyframe animation to App.css
export const loadingStyles = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
`;
