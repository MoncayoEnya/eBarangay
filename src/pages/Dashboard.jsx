import React from 'react';
import StatCard from '../components/layout/common/StatCard.jsx';
import {
  Users, FileText, AlertCircle, Calendar
} from 'lucide-react';

export default function Dashboard() {
  // Sample data for Recent Documents
  const recentDocuments = [
    {
      id: 1,
      title: 'Barangay Clearance',
      requester: 'Juan Dela Cruz',
      time: '2 mins ago',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 2,
      title: 'Certificate of Residency',
      requester: 'Maria Santos',
      time: '15 mins ago',
      status: 'Approved',
      statusColor: 'bg-green-100 text-green-700',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 3,
      title: 'Business Clearance',
      requester: 'Pedro Reyes',
      time: '1 hour ago',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 4,
      title: 'Indigency Certificate',
      requester: 'Ana Garcia',
      time: '2 hours ago',
      status: 'Processing',
      statusColor: 'bg-blue-100 text-blue-700',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  // Quick Actions
  const quickActions = [
    { label: 'Add New Resident', icon: '👤', bgColor: 'bg-blue-50 hover:bg-blue-100', textColor: 'text-blue-700' },
    { label: 'Issue Document', icon: '📄', bgColor: 'bg-green-50 hover:bg-green-100', textColor: 'text-green-700' },
    { label: 'Report Incident', icon: '🚩', bgColor: 'bg-orange-50 hover:bg-orange-100', textColor: 'text-orange-700' },
    { label: 'Create Announcement', icon: '📢', bgColor: 'bg-purple-50 hover:bg-purple-100', textColor: 'text-purple-700' },
    { label: 'Send Alert', icon: '🔔', bgColor: 'bg-red-50 hover:bg-red-100', textColor: 'text-red-700' }
  ];

  // Active Incidents
  const activeIncidents = [
    {
      title: 'Neighborhood Dispute',
      location: 'Purok 3 - Reported 3 hours ago',
      severity: 'Urgent',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-50',
      badgeColor: 'bg-red-100 text-red-700'
    },
    {
      title: 'Noise Complaint',
      location: 'Purok 1 - Reported 5 hours ago',
      severity: 'Open',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-50',
      badgeColor: 'bg-yellow-100 text-yellow-700'
    },
    {
      title: 'Property Boundary Issue',
      location: 'Purok 5 - Under mediation',
      severity: 'Mediation',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50',
      badgeColor: 'bg-blue-100 text-blue-700'
    }
  ];

  // Upcoming Events
  const upcomingEvents = [
    {
      date: { month: 'DEC', day: '15' },
      title: 'Community Clean-up Drive',
      location: 'All Puroks - 7:00 AM',
      participants: '234 registered participants',
      color: 'bg-blue-600'
    },
    {
      date: { month: 'DEC', day: '20' },
      title: 'Christmas Party',
      location: 'Barangay Hall - 5:30 PM',
      participants: '150 registered participants',
      color: 'bg-green-600'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-600 text-sm mt-1">Welcome back! Here's what's happening in your barangay today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Residents"
          value="8,547"
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="2.5% from last month"
          badgeColor="text-green-600"
          badgeIcon="↑"
        />
        <StatCard
          title="Pending Documents"
          value="24"
          icon={FileText}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          badge="Needs attention"
          badgeColor="text-orange-600"
          badgeIcon="🕐"
        />
        <StatCard
          title="Active Incidents"
          value="7"
          icon={AlertCircle}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          badge="2 urgent cases"
          badgeColor="text-red-600"
          badgeIcon="⚠"
        />
        <StatCard
          title="Upcoming Events"
          value="12"
          icon={Calendar}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          badge="This month"
          badgeColor="text-purple-600"
          badgeIcon="📅"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Document Requests</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {recentDocuments.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className={`w-10 h-10 ${doc.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                  <FileText className={`w-5 h-5 ${doc.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{doc.title}</p>
                  <p className="text-sm text-gray-500">{doc.requester} - {doc.time}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.statusColor}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${action.bgColor}`}
              >
                <span className="text-lg">{action.icon}</span>
                <span className={`font-medium text-sm ${action.textColor}`}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Incidents */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Active Incidents</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {activeIncidents.map((incident, idx) => (
              <div key={idx} className={`p-3 border-l-4 ${incident.borderColor} ${incident.bgColor} rounded`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{incident.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{incident.location}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${incident.badgeColor}`}>
                    {incident.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Events</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">View Calendar</button>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="text-center shrink-0">
                  <div className={`w-12 h-12 ${event.color} rounded-lg flex flex-col items-center justify-center text-white`}>
                    <span className="text-xs font-medium">{event.date.month}</span>
                    <span className="text-lg font-bold">{event.date.day}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.location}</p>
                  <p className="text-xs text-gray-500 mt-1">{event.participants}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}