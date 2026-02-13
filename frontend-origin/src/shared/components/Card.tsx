import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

interface CardSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const CardSection: React.FC<CardSectionProps> = ({ 
  title, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`card-section ${className}`}>
      {title && <h4 className="card-section-title">{title}</h4>}
      <div className="card-section-content">
        {children}
      </div>
    </div>
  );
};