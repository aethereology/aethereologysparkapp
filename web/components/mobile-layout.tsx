import React from 'react';
import { EnhancedCard, CardContent } from "@/components/ui/enhanced-card";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function MobileLayout({ children, title, subtitle, actions }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-cream">
      {/* Mobile-optimized header */}
      {(title || actions) && (
        <div className="sticky top-0 z-10 bg-tamarind-orange text-white shadow-lg">
          <div className="mobile-padding">
            <div className="mobile-stack items-start">
              <div className="flex-1 min-w-0">
                {title && (
                  <h1 className="heading-lg text-white truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-white/80 text-sm mt-1 line-clamp-2">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex-shrink-0 mobile-nav">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content with mobile padding */}
      <main className="mobile-padding">
        {children}
      </main>
    </div>
  );
}

// Mobile-optimized grid component
interface MobileGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 2 | 3 | 4 | 6;
}

export function MobileGrid({ children, columns = 2, gap = 4 }: MobileGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gridGap = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6'
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gridGap[gap]}`}>
      {children}
    </div>
  );
}

// Mobile-optimized stack component
interface MobileStackProps {
  children: React.ReactNode;
  spacing?: 2 | 3 | 4 | 6;
  direction?: 'vertical' | 'horizontal-mobile' | 'responsive';
}

export function MobileStack({ 
  children, 
  spacing = 4, 
  direction = 'vertical' 
}: MobileStackProps) {
  const spaceClasses = {
    2: 'space-y-2',
    3: 'space-y-3', 
    4: 'space-y-4',
    6: 'space-y-6'
  };

  const directionClasses = {
    vertical: 'flex flex-col',
    'horizontal-mobile': 'flex flex-col xs:flex-row xs:space-y-0 xs:space-x-4',
    responsive: 'flex flex-col md:flex-row md:space-y-0 md:space-x-4'
  };

  return (
    <div className={`${directionClasses[direction]} ${spaceClasses[spacing]}`}>
      {children}
    </div>
  );
}

// Mobile-optimized tabs component
interface MobileTab {
  id: string;
  label: string;
  content: React.ReactNode;
  badge?: string | number;
}

interface MobileTabsProps {
  tabs: MobileTab[];
  defaultTab?: string;
}

export function MobileTabs({ tabs, defaultTab }: MobileTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  return (
    <div className="space-y-4">
      {/* Tab navigation - horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <div className="flex space-x-1 min-w-max p-1 bg-white rounded-lg border border-peach-sand">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap touch-target
                transition-colors focus-ring
                ${activeTab === tab.id 
                  ? 'bg-tamarind-orange text-white' 
                  : 'text-cacao-brown hover:bg-cream'
                }
              `}
            >
              {tab.label}
              {tab.badge && (
                <span className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                  ${activeTab === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-chili-red text-white'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

// Mobile-optimized modal/drawer component
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function MobileModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: MobileModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    full: 'max-w-full mx-2'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <EnhancedCard className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <CardContent>
          <div className="mobile-stack mb-4">
            <h2 className="heading-md flex-1">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg focus-ring"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          {children}
        </CardContent>
      </EnhancedCard>
    </div>
  );
}

export default MobileLayout;