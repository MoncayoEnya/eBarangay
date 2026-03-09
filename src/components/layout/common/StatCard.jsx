import React from 'react';

/**
 * StatCard Component
 * Modern, reusable statistics card with icon and badge
 * 
 * @param {string} title - Card title
 * @param {string|number} value - Main statistic value
 * @param {React.Component} icon - Icon component (from lucide-react)
 * @param {string} iconBg - Icon background class (e.g., 'icon-bg-primary')
 * @param {string} badge - Badge text
 * @param {string} badgeColor - Badge color class
 * @param {function} onClick - Optional click handler
 */
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconBg = 'icon-bg-primary',
  badge,
  badgeColor = 'badge-primary',
  onClick 
}) => {
  return (
    <div 
      className="stat-card" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="stat-card-label">{title}</p>
          <h3 className="stat-card-value">{value}</h3>
          {badge && (
            <div className={`stat-card-badge ${badgeColor}`}>
              <span>{badge}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`stat-icon-wrapper ${iconBg}`}>
            <Icon size={24} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;