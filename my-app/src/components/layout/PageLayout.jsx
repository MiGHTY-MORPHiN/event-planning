import React from 'react';
import Navigation from './Navigation';

const PageLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
