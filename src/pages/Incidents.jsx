import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { AlertCircle, Scale, CheckCircle, Timer, Eye, Send, MoreVertical, Download, Plus, FileText, List } from 'lucide-react';

export default function Incidents() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All categories');

  const incidents = [
    {
      id: 1,
      caseNumber: 'INC-2024-087',
      category: 'Dispute',
      categoryColor: 'bg-gray-100 text-gray-700',
      complainant: {
        name: 'Laparan',
        purok: 'Purok 3',
        initial: 'L',
        color: 'bg-blue-500'
      },
      location: 'Purok 3, Zone A',
      dateFiled: 'Dec 2, 2024',
      status: 'Open',
      statusColor: 'bg-red-100 text-red-700'
    },
    {
      id: 2,
      caseNumber: 'INC-2024-086',
      category: 'Theft',
      categoryColor: 'bg-red-100 text-red-700',
      complainant: {
        name: 'David',
        purok: 'Purok 1',
        initial: 'D',
        color: 'bg-pink-500'
      },
      location: 'Purok 1, Main St.',
      dateFiled: 'Dec 1, 2024',
      status: 'Under Mediation',
      statusColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 3,
      caseNumber: 'INC-2024-085',
      category: 'Noise Complaint',
      categoryColor: 'bg-orange-100 text-orange-700',
      complainant: {
        name: 'Villafranca',
        purok: 'Purok 5',
        initial: 'V',
        color: 'bg-purple-500'
      },
      location: 'Purok 5, Block 2',
      dateFiled: 'Nov 30, 2024',
      status: 'Resolved',
      statusColor: 'bg-green-100 text-green-700'
    },
    {
      id: 4,
      caseNumber: 'INC-2024-084',
      category: 'Property Issue',
      categoryColor: 'bg-purple-100 text-purple-700',
      complainant: {
        name: 'Limosnero',
        purok: 'Purok 2',
        initial: 'L',
        color: 'bg-orange-500'
      },
      location: 'Purok 2, Lot 15',
      dateFiled: 'Nov 29, 2024',
      status: 'Under Mediation',
      statusColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 5,
      caseNumber: 'INC-2024-083',
      category: 'Others',
      categoryColor: 'bg-gray-100 text-gray-700',
      complainant: {
        name: 'Araneta',
        purok: 'Purok 4',
        initial: 'A',
        color: 'bg-green-500'
      },
      location: 'Purok 4, Zone C',
      dateFiled: 'Nov 28, 2024',
      status: 'Open',
      statusColor: 'bg-red-100 text-red-700'
    }
  ];

  const filterButtons = [
    { id: 'all', label: 'All Requests', icon: List },
    { id: 'open', label: 'Open', icon: FileText },
    { id: 'mediation', label: 'Mediation', icon: Scale },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle }
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Dispute':
        return '⚖️';
      case 'Theft':
        return '🔒';
      case 'Noise Complaint':
        return '🔊';
      case 'Property Issue':
        return '🏠';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Incident & Blotter Management</h2>
          <p className="text-gray-600 text-sm mt-1">Track and manage barangay incidents and disputes</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Incident Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Open Cases"
          value="8"
          icon={AlertCircle}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          badge="Requires attention"
          badgeColor="text-red-600"
        />
        <StatCard
          title="Under Mediation"
          value="5"
          icon={Scale}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="Lupon processing"
          badgeColor="text-blue-600"
        />
        <StatCard
          title="Resolved (Month)"
          value="42"
          icon={CheckCircle}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="18% from last month"
          badgeColor="text-green-600"
          badgeIcon="↑"
        />
        <StatCard
          title="Avg. Resolution"
          value="4.2"
          icon={Timer}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          badge="Days per case"
          badgeColor="text-gray-600"
        />
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
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
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <option>All categories</option>
                <option>Dispute</option>
                <option>Theft</option>
                <option>Noise Complaint</option>
                <option>Property Issue</option>
                <option>Others</option>
              </select>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Case #</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Complainant</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Location</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Date Filed</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-blue-600">
                    {incident.caseNumber}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(incident.category)}</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${incident.categoryColor}`}>
                        {incident.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${incident.complainant.color} rounded-full flex items-center justify-center text-white font-semibold`}>
                        {incident.complainant.initial}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{incident.complainant.name}</p>
                        <p className="text-sm text-gray-500">{incident.complainant.purok}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{incident.location}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{incident.dateFiled}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${incident.statusColor}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Showing 1 to 5 of 87 incidents</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg">1</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">2</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">3</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">...</button>
            <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}