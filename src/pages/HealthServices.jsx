import React from 'react';
import StatCard from '../components/layout/common/StatCard';
import { Users, Calendar, Syringe, Clipboard, Plus } from 'lucide-react';

export default function HealthServices() {
  const appointments = [
    {
      id: 1,
      time: '09:00 AM',
      patient: 'Pingay Adamusa',
      type: 'Pre-natal Check-up',
      status: 'Confirmed',
      statusColor: 'bg-green-100 text-green-700'
    },
    {
      id: 2,
      time: '10:30 AM',
      patient: 'Clint Nepomuceno',
      type: 'General Consultation',
      status: 'Confirmed',
      statusColor: 'bg-green-100 text-green-700'
    },
    {
      id: 3,
      time: '11:00 AM',
      patient: 'Keenan',
      type: 'Immunization',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-700'
    },
    {
      id: 4,
      time: '02:00 PM',
      patient: 'Maze',
      type: 'Follow-up',
      status: 'Confirmed',
      statusColor: 'bg-green-100 text-green-700'
    }
  ];

  const recentPatients = [
    {
      id: 1,
      name: 'Pingay Adamusa',
      initial: 'PA',
      color: 'bg-blue-500',
      type: 'Pre-natal',
      time: 'Today, 9:00 AM'
    },
    {
      id: 2,
      name: 'Clint Nepomuceno',
      initial: 'CN',
      color: 'bg-blue-500',
      type: 'General Check-up',
      time: 'Yesterday'
    }
  ];

  const upcomingImmunizations = [
    {
      id: 1,
      name: 'Baby Boy Adam',
      initial: 'BB',
      color: 'bg-pink-500',
      vaccine: 'BCG Vaccine',
      dueDate: 'Due: Dec 12'
    },
    {
      id: 2,
      name: 'Rannie Cabill',
      initial: 'RC',
      color: 'bg-green-500',
      vaccine: 'Measles Vaccine',
      dueDate: 'Due: Dec 15'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Health Services</h2>
          <p className="text-gray-600 text-sm mt-1">Manage health programs and patient records</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Patients"
          value="1,248"
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="+24 this month"
          badgeColor="text-green-600"
        />
        <StatCard
          title="Appointments Today"
          value="23"
          icon={Calendar}
          iconBg="bg-pink-100"
          iconColor="text-pink-600"
          badge="8 completed"
          badgeColor="text-green-600"
        />
        <StatCard
          title="Immunization Rate"
          value="94%"
          icon={Syringe}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="Target: 95%"
          badgeColor="text-green-600"
        />
        <StatCard
          title="Active Cases"
          value="12"
          icon={Clipboard}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          badge="Needs attention"
          badgeColor="text-orange-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Appointments - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Today's Appointments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">TIME</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">PATIENT</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">TYPE</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">STATUS</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map(appointment => (
                  <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm text-gray-800 font-medium">{appointment.time}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{appointment.patient}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{appointment.type}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${appointment.statusColor}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Takes 1 column */}
        <div className="space-y-6">
          {/* Recent Patients */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent Patients</h3>
              <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {recentPatients.map(patient => (
                <div key={patient.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-10 h-10 ${patient.color} rounded-lg flex items-center justify-center text-white font-semibold text-sm`}>
                    {patient.initial}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.type} • {patient.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Immunizations */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Upcoming Immunizations</h3>
              <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {upcomingImmunizations.map(immunization => (
                <div key={immunization.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-10 h-10 ${immunization.color} rounded-lg flex items-center justify-center text-white font-semibold text-sm`}>
                    {immunization.initial}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{immunization.name}</p>
                    <p className="text-xs text-gray-500">{immunization.vaccine} • {immunization.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}