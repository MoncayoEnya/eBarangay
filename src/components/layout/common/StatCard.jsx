import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard Component — Enhanced
 * Modern statistics card with icon, badge, and optional trend
 *
 * @param {string}          title      - Card title
 * @param {string|number}   value      - Main statistic value
 * @param {React.Component} icon       - Lucide icon component
 * @param {string}          iconBg     - Icon background class (e.g., 'icon-bg-primary')
 * @param {string}          badge      - Badge text
 * @param {string}          badgeColor - Badge color class
 * @param {number}          trend      - Numeric trend (+5, -3, 0). Shows arrow + value.
 * @param {string}          trendLabel - Label after trend (e.g., "vs last month")
 * @param {string}          subtitle   - Small sub-text below value
 * @param {function}        onClick    - Optional click handler
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  iconBg = 'icon-bg-primary',
  badge,
  badgeColor = 'badge-primary',
  trend,
  trendLabel,
  subtitle,
  onClick,
}) => {
  const hasTrend = trend !== undefined && trend !== null;
  const trendUp   = hasTrend && trend > 0;
  const trendDown = hasTrend && trend < 0;
  const trendFlat = hasTrend && trend === 0;

  const trendStyle = trendUp
    ? { color: '#059669', background: '#ECFDF5', borderColor: '#A7F3D0' }
    : trendDown
    ? { color: '#DC2626', background: '#FEF2F2', borderColor: '#FECACA' }
    : { color: '#64748B', background: '#F1F5F9', borderColor: '#E2E8F0' };

  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="stat-card-label">{title}</p>
          <h3 className="stat-card-value">{value ?? '—'}</h3>

          {/* Trend indicator */}
          {hasTrend && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 700,
              border: '1.5px solid',
              marginBottom: badge ? 8 : 0,
              ...trendStyle,
            }}>
              {trendUp   && <TrendingUp  size={12} strokeWidth={2.5} />}
              {trendDown && <TrendingDown size={12} strokeWidth={2.5} />}
              {trendFlat && <Minus        size={12} strokeWidth={2.5} />}
              <span>
                {trendUp ? '+' : ''}{trend}%
                {trendLabel && (
                  <span style={{ fontWeight: 500, opacity: 0.75, marginLeft: 4 }}>
                    {trendLabel}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Legacy badge */}
          {badge && !hasTrend && (
            <div className={`stat-card-badge ${badgeColor}`}>
              <span>{badge}</span>
            </div>
          )}

          {/* Sub-label */}
          {subtitle && (
            <p style={{
              fontSize: 12,
              color: '#94A3B8',
              fontWeight: 500,
              marginTop: 4,
              lineHeight: 1.4,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`stat-icon-wrapper ${iconBg}`}>
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;