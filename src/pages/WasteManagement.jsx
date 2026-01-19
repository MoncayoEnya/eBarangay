import React from 'react';
import StatCard from '../components/layout/common/StatCard';
import { Route, Truck, Flag, PieChart, Plus, Leaf, Trash2, Recycle, MapPin, User, Clock, ChevronRight, Map } from 'lucide-react';

export default function WasteManagement() {
  const schedules = [
    {
      id: 1,
      type: 'Biodegradable',
      description: 'Kitchen & garden waste',
      days: [
        { day: 'Monday', time: '6:00 AM' },
        { day: 'Thursday', time: '6:00 AM' }
      ],
      icon: Leaf,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      badgeColor: 'bg-green-100 text-green-700',
      borderColor: 'border-green-500'
    },
    {
      id: 2,
      type: 'Non-Biodegradable',
      description: 'Plastic, foam & others',
      days: [
        { day: 'Tuesday', time: '6:00 AM' },
        { day: 'Friday', time: '6:00 AM' }
      ],
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      badgeColor: 'bg-red-100 text-red-700',
      borderColor: 'border-red-500'
    },
    {
      id: 3,
      type: 'Recyclable',
      description: 'Paper, bottles & cans',
      days: [
        { day: 'Wednesday', time: '6:00 AM' },
        { day: 'Saturday', time: '6:00 AM' }
      ],
      icon: Recycle,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-500'
    }
  ];

  const vehicles = [
    {
      id: 1,
      name: 'Truck #1',
      plateNumber: 'ABC-1234',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-700',
      route: 'Puroks 1-3',
      driver: 'Juan Santos',
      startTime: '6:00 AM'
    },
    {
      id: 2,
      name: 'Truck #2',
      plateNumber: 'XYZ-5678',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-700',
      route: 'Puroks 4-7',
      driver: 'Pedro Reyes',
      startTime: '6:15 AM'
    },
    {
      id: 3,
      name: 'Truck #3',
      plateNumber: 'DEF-9012',
      status: 'Standby',
      statusColor: 'bg-gray-100 text-gray-700',
      route: 'Not assigned',
      driver: 'Available',
      startTime: 'Ready'
    }
  ];

  const reports = [
    {
      id: 1,
      title: 'Uncollected Garbage - Purok 5',
      description: 'Multiple households reporting missed collection',
      location: 'Main Street, Purok 5',
      time: '2 hours ago',
      reporter: 'Maria Santos',
      status: 'Pending',
      statusColor: 'bg-orange-100 text-orange-700',
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      id: 2,
      title: 'Illegal Dumping Site',
      description: 'Construction waste dumped near river area',
      location: 'Riverside, Purok 2',
      time: '5 hours ago',
      reporter: 'Roberto Cruz',
      status: 'Pending',
      statusColor: 'bg-orange-100 text-orange-700',
      icon: Flag,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      id: 3,
      title: 'Overflowing Bin Request',
      description: 'Community bin needs immediate pickup',
      location: 'Market Area, Purok 1',
      time: '1 day ago',
      reporter: 'Ana Garcia',
      status: 'Resolved',
      statusColor: 'bg-green-100 text-green-700',
      icon: Recycle,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Waste Management & Collection</h2>
          <p className="text-gray-600 text-sm mt-1">Manage garbage collection and environmental services</p>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Today's Routes"
          value="8"
          icon={Route}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="5 completed"
          badgeColor="text-green-600"
        />
        <StatCard
          title="Active Vehicles"
          value="5"
          icon={Truck}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="On duty"
          badgeColor="text-blue-600"
        />
        <StatCard
          title="Reports"
          value="12"
          icon={Flag}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          badge="Pending action"
          badgeColor="text-orange-600"
        />
        <StatCard
          title="Compliance"
          value="87%"
          icon={PieChart}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          badge="Segregation rate"
          badgeColor="text-gray-600"
        />
      </div>

      {/* Collection Schedule */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">This Week's Collection Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schedules.map(schedule => {
            const Icon = schedule.icon;
            return (
              <div
                key={schedule.id}
                className={`bg-white rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 border-l-4 ${schedule.borderColor}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`w-10 h-10 ${schedule.iconBg} rounded-xl flex items-center justify-center mb-2`}>
                      <Icon className={`w-5 h-5 ${schedule.iconColor}`} />
                    </div>
                    <h4 className="font-bold text-gray-800">{schedule.type}</h4>
                    <p className="text-sm text-gray-500 mt-1">{schedule.description}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  {schedule.days.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{day.day}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${schedule.badgeColor}`}>
                        {day.time}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  All Puroks
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fleet Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Fleet Status</h3>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Map className="w-4 h-4" />
            Track Vehicles
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">{vehicle.name}</h4>
                  <p className="text-sm text-gray-500">{vehicle.plateNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${vehicle.statusColor}`}>
                  {vehicle.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-gray-400" />
                  Route: {vehicle.route}
                </p>
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Driver: {vehicle.driver}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {vehicle.status === 'Active' ? `Started: ${vehicle.startTime}` : `Status: ${vehicle.startTime}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Recent Reports</h3>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {reports.map(report => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className="bg-white rounded-lg border border-gray-100 p-4 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${report.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${report.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{report.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${report.statusColor}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {report.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {report.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {report.reporter}
                      </span>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}