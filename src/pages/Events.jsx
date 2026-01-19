import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { Calendar, UserCheck, CheckCircle, TrendingUp, List, CalendarCheck, Users, HandHeart, Filter, Plus, Eye, Edit, Trash2, MapPin, User, Clock } from 'lucide-react';

export default function Events() {
  const [activeFilter, setActiveFilter] = useState('all');

  const events = [
    {
      id: 1,
      date: { day: '15', month: 'DEC' },
      category: 'MEETING',
      categoryColor: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-500',
      title: 'Quarterly Barangay Assembly',
      description: 'Regular assembly meeting to discuss barangay matters, budget allocation, and upcoming projects. All barangay officials and representatives are required to attend.',
      time: '9:00 AM - 12:00 PM',
      location: 'Barangay Hall',
      rsvps: 127,
      organizer: 'Admin User'
    },
    {
      id: 2,
      date: { day: '18', month: 'DEC' },
      category: 'COMMUNITY',
      categoryColor: 'bg-green-100 text-green-700',
      borderColor: 'border-green-500',
      title: 'Coastal Cleanup Drive',
      description: 'Join us for a community coastal cleanup activity. Help keep our beaches clean and protect marine life. Bring gloves and reusable bags. Snacks provided.',
      time: '6:00 AM - 10:00 AM',
      location: 'Barangay Beach',
      rsvps: 89,
      organizer: 'Environment Officer'
    },
    {
      id: 3,
      date: { day: '25', month: 'DEC' },
      category: 'FESTIVAL',
      categoryColor: 'bg-orange-100 text-orange-700',
      borderColor: 'border-orange-500',
      title: 'Christmas Community Festival',
      description: 'Annual Christmas celebration featuring games, entertainment, gift giving for children, and caroling competition. Free food and drinks for all residents.',
      time: '4:00 PM - 10:00 PM',
      location: 'Barangay Covered Court',
      rsvps: 342,
      organizer: 'Admin User'
    },
    {
      id: 4,
      date: { day: '28', month: 'DEC' },
      category: 'TRAINING',
      categoryColor: 'bg-purple-100 text-purple-700',
      borderColor: 'border-purple-500',
      title: 'Disaster Preparedness Training',
      description: 'Essential training on disaster preparedness, first aid, and emergency response. Open to all residents. Certificates will be provided to attendees.',
      time: '1:00 PM - 5:00 PM',
      location: 'Barangay Hall',
      rsvps: 64,
      organizer: 'DRRM Officer'
    }
  ];

  const filterButtons = [
    { id: 'all', label: 'All Events', icon: List },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
    { id: 'meetings', label: 'Meetings', icon: Users },
    { id: 'community', label: 'Community', icon: HandHeart }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Events Calendar</h2>
          <p className="text-gray-600 text-sm mt-1">Manage community events and activities</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Upcoming"
          value="8"
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="Next 30 days"
          badgeColor="text-blue-600"
        />
        <StatCard
          title="This Month"
          value="547"
          icon={UserCheck}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="RSVPs"
          badgeColor="text-green-600"
          badgeIcon="↑"
        />
        <StatCard
          title="Completed"
          value="24"
          icon={CheckCircle}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          badge="This year"
          badgeColor="text-gray-600"
        />
        <StatCard
          title="Avg. Attendance"
          value="82%"
          icon={TrendingUp}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          badge="RSVP rate"
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
              <Calendar className="w-4 h-4" />
              Month View
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map(event => (
          <div
            key={event.id}
            className={`bg-white rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 border-l-4 ${event.borderColor}`}
          >
            <div className="flex items-start gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center min-w-[70px]">
                <div className="text-3xl font-bold text-gray-800 leading-none">{event.date.day}</div>
                <div className="text-xs font-semibold text-gray-500 uppercase mt-1">{event.date.month}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${event.categoryColor}`}>
                        {event.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        {event.rsvps} RSVPs
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {event.organizer}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing 1 to 4 of 8 events</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg">1</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">2</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}