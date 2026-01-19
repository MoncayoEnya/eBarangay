import React from 'react';

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  badge,
  badgeColor,
  badgeIcon
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          {badge && (
            <p className={`text-sm mt-2 flex items-center gap-1.5 ${badgeColor}`}>
              {badgeIcon && <span className="text-xs">{badgeIcon}</span>}
              <span>{badge}</span>
            </p>
          )}
        </div>
        <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}