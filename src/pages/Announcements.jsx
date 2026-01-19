import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { Megaphone, Eye, AlertCircle, Clock, List, Info, Newspaper, Filter, Download, Plus, Edit, Trash2, Users, MapPin, User } from 'lucide-react';

export default function Announcements() {
  const [activeFilter, setActiveFilter] = useState('all');

  const announcements = [
    {
      id: 1,
      type: 'urgent',
      title: 'Typhoon Signal #2 - Preparation Advisory',
      content: 'All residents are advised to secure loose items, stock emergency supplies, and stay updated. Evacuation centers are on standby. Monitor official channels for updates.',
      postedBy: 'Admin User',
      postedTime: '2 hours ago',
      views: 342,
      audience: 'All Residents',
      icon: AlertCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      badgeColor: 'bg-red-100 text-red-700',
      borderColor: 'border-red-500'
    },
    {
      id: 2,
      type: 'important',
      title: 'Vaccination Schedule - December 2024',
      content: "Free vaccination program for children 0-5 years old. Schedule: Dec 5-7, 8AM-4PM at the Barangay Health Center. Bring child's immunization card.",
      postedBy: 'Health Officer',
      postedTime: '1 day ago',
      views: 523,
      audience: 'Parents & Guardians',
      icon: AlertCircle,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      badgeColor: 'bg-orange-100 text-orange-700',
      borderColor: 'border-orange-500'
    },
    {
      id: 3,
      type: 'general',
      title: 'New Garbage Collection Schedule',
      content: 'Starting December 5, garbage collection schedule updated: Biodegradable (Mon/Thu), Non-biodegradable (Tue/Fri), Recyclables (Wed). Segregate properly.',
      postedBy: 'Sanitation Head',
      postedTime: '2 days ago',
      views: 1128,
      audience: 'All Residents',
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-500'
    },
    {
      id: 4,
      type: 'general',
      title: 'Senior Citizens Christmas Bonus Distribution',
      content: 'Distribution of senior citizens Christmas bonus on December 10-12. Bring valid ID and senior citizen ID. Venue: Barangay Hall. Time: 9AM-3PM.',
      postedBy: 'Admin User',
      postedTime: '3 days ago',
      views: 856,
      audience: 'Senior Citizens',
      icon: Info,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      badgeColor: 'bg-green-100 text-green-700',
      borderColor: 'border-green-500'
    }
  ];

  const filterButtons = [
    { id: 'all', label: 'All', icon: List },
    { id: 'urgent', label: 'Urgent', icon: AlertCircle },
    { id: 'important', label: 'Important', icon: Info },
    { id: 'general', label: 'General', icon: Newspaper }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Announcements & Communication</h2>
          <p className="text-gray-600 text-sm mt-1">Manage public announcements and community updates</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Active"
          value="18"
          icon={Megaphone}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="Published"
          badgeColor="text-blue-600"
        />
        <StatCard
          title="This Week"
          value="1,247"
          icon={Eye}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="Views"
          badgeColor="text-green-600"
          badgeIcon="↑"
        />
        <StatCard
          title="Urgent"
          value="3"
          icon={AlertCircle}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          badge="Priority alerts"
          badgeColor="text-red-600"
        />
        <StatCard
          title="Scheduled"
          value="5"
          icon={Clock}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          badge="Future posts"
          badgeColor="text-gray-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {filterButtons.map(btn => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveFilter(btn.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeFilter === btn.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {btn.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map(announcement => {
          const Icon = announcement.icon;
          return (
            <div
              key={announcement.id}
              className={`bg-white rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:translate-x-1 border-l-4 ${announcement.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 ${announcement.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 ${announcement.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${announcement.badgeColor}`}>
                        {announcement.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">Posted {announcement.postedTime}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{announcement.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {announcement.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {announcement.audience}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {announcement.postedBy}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing 1 to 4 of 18 announcements</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg">1</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">2</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">3</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}