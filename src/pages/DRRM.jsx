import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { AlertTriangle, Users, Shield, UserCheck, Plus, Edit, CheckCircle, Droplet, Home, MapPin } from 'lucide-react';

export default function DRRM() {
  const alerts = [
    {
      id: 1,
      level: 'critical',
      title: 'Typhoon Warning - Signal #2',
      message: 'Typhoon approaching. Expected landfall in 6-12 hours. All residents in flood-prone areas advised to evacuate immediately. Evacuation centers are now open.',
      issuedTime: '3 hours ago',
      audience: 'All Residents',
      location: 'Flood-prone Areas',
      smsSent: 1247,
      icon: AlertTriangle,
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
      badgeColor: 'bg-red-600 text-white',
      cardBg: 'bg-gradient-to-r from-red-50 to-white',
      borderColor: 'border-red-600'
    },
    {
      id: 2,
      level: 'warning',
      title: 'Heavy Rainfall Advisory',
      message: 'Continuous heavy rainfall expected for the next 48 hours. Residents near waterways should be alert for possible flooding. Monitor water levels closely.',
      issuedTime: '1 day ago',
      audience: 'Riverside Areas',
      location: 'Puroks 1-5',
      smsSent: 534,
      icon: Droplet,
      iconBg: 'bg-orange-600',
      iconColor: 'text-white',
      badgeColor: 'bg-orange-600 text-white',
      cardBg: 'bg-gradient-to-r from-orange-50 to-white',
      borderColor: 'border-orange-600'
    }
  ];

  const evacuationCenters = [
    {
      id: 1,
      name: 'Barangay Hall',
      location: 'Main Road, Purok 1',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-700',
      occupancy: 67,
      capacity: 100,
      percentage: 67,
      progressColor: 'bg-green-500'
    },
    {
      id: 2,
      name: 'Elementary School',
      location: 'School Road, Purok 3',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-700',
      occupancy: 60,
      capacity: 150,
      percentage: 40,
      progressColor: 'bg-blue-500'
    },
    {
      id: 3,
      name: 'Covered Court',
      location: 'Sports Complex, Purok 7',
      status: 'Standby',
      statusColor: 'bg-gray-100 text-gray-700',
      occupancy: 0,
      capacity: 200,
      percentage: 0,
      progressColor: 'bg-gray-300'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      title: 'Critical alert sent to all residents',
      time: '3 hours ago',
      user: 'Admin User',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      id: 2,
      title: 'Barangay Hall evacuation center activated',
      time: '4 hours ago',
      user: 'DRRM Officer',
      icon: Home,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 3,
      title: '45 families registered at Elementary School shelter',
      time: '5 hours ago',
      user: 'Shelter Coordinator',
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 4,
      title: 'Heavy rainfall advisory issued',
      time: '1 day ago',
      user: 'Admin User',
      icon: Droplet,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Disaster Risk Reduction & Management</h2>
          <p className="text-gray-600 text-sm mt-1">Emergency response and disaster preparedness</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <AlertTriangle className="w-4 h-4" />
          Send Alert
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Active Alerts"
          value="2"
          icon={AlertTriangle}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          badge="Requires monitoring"
          badgeColor="text-red-600"
        />
        <StatCard
          title="Evacuees"
          value="127"
          icon={Users}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          badge="In shelters"
          badgeColor="text-orange-600"
        />
        <StatCard
          title="High Risk"
          value="43"
          icon={Shield}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          badge="Vulnerable residents"
          badgeColor="text-gray-600"
        />
        <StatCard
          title="Response Team"
          value="18"
          icon={UserCheck}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="On standby"
          badgeColor="text-green-600"
        />
      </div>

      {/* Active Alerts Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Active Alerts</h3>
        <div className="space-y-4">
          {alerts.map(alert => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.id}
                className={`rounded-xl p-6 shadow-sm transition-all hover:shadow-md border-l-4 ${alert.borderColor} ${alert.cardBg}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 ${alert.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${alert.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${alert.badgeColor}`}>
                          {alert.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">Issued {alert.issuedTime}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">{alert.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{alert.message}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {alert.audience}
                        </span>
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {alert.location}
                        </span>
                        <span className={`font-semibold flex items-center gap-1 ${alert.level === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                          <AlertTriangle className="w-4 h-4" />
                          SMS Sent to {alert.smsSent} residents
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evacuation Centers */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Evacuation Centers</h3>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Center
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {evacuationCenters.map(center => (
            <div
              key={center.id}
              className="bg-white rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-1">{center.name}</h4>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {center.location}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${center.statusColor}`}>
                  {center.status}
                </span>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Occupancy</span>
                  <span className="font-semibold text-gray-800">
                    {center.occupancy}/{center.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${center.progressColor}`}
                    style={{ width: `${center.percentage}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {center.occupancy === 0 ? 'Available' : `${center.occupancy} evacuees`}
                </span>
                <button className="text-blue-600 hover:underline font-medium">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className={`flex items-start gap-3 pb-3 ${
                  index !== recentActivity.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className={`w-9 h-9 ${activity.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${activity.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.time} • {activity.user}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}