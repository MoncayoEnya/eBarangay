import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { Users, UserCheck, Eye, Edit, Filter, Download, Plus, Vote } from 'lucide-react';

export default function Residents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const residents = [
    {
      id: 1,
      name: 'Juan Dela Cruz',
      gender: 'Male',
      address: 'Purok 1, Block 5, Lot 12',
      contact: '0917-123-4567',
      age: 45,
      status: 'Active',
      tags: []
    },
    {
      id: 2,
      name: 'Maria Santos',
      gender: 'Female',
      address: 'Purok 2, Block 3, Lot 8',
      contact: '0928-234-5678',
      age: 38,
      status: 'Active',
      tags: []
    },
    {
      id: 3,
      name: 'Pedro Reyes',
      gender: 'Male',
      address: 'Purok 3, Block 7, Lot 15',
      contact: '0939-345-6789',
      age: 67,
      status: 'Active',
      tags: ['Senior']
    },
    {
      id: 4,
      name: 'Ana Garcia',
      gender: 'Female',
      address: 'Purok 1, Block 2, Lot 20',
      contact: '0945-456-7890',
      age: 29,
      status: 'Active',
      tags: []
    },
    {
      id: 5,
      name: 'Roberto Mendoza',
      gender: 'Male',
      address: 'Purok 4, Block 1, Lot 5',
      contact: '0956-567-8901',
      age: 52,
      status: 'Active',
      tags: ['PWD']
    }
  ];

  const filterButtons = [
    { id: 'all', label: 'All Residents', icon: Users },
    { id: 'senior', label: 'Senior Citizens', icon: UserCheck },
    { id: 'pwd', label: 'PWD', icon: Users },
    { id: 'voters', label: 'Voters', icon: Vote }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Residents Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage and view all resident information</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add New Resident
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Residents"
          value="8,547"
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="2.5% this month"
          badgeColor="text-green-600"
          badgeIcon="↑"
        />
        <StatCard
          title="Senior Citizens"
          value="1,234"
          icon={UserCheck}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          badge="14.4% of total"
          badgeColor="text-gray-600"
        />
        <StatCard
          title="PWD Residents"
          value="342"
          icon={Users}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          badge="4% of total"
          badgeColor="text-gray-600"
        />
        <StatCard
          title="Registered Voters"
          value="5,892"
          icon={Vote}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="68.9% of total"
          badgeColor="text-gray-600"
        />
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Resident Name</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Address</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Contact</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Age</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {residents.map((resident) => (
                <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${resident.name}&background=3b82f6&color=fff`}
                        alt={resident.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{resident.name}</p>
                        <p className="text-sm text-gray-500">{resident.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{resident.address}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{resident.contact}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{resident.age}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {resident.status}
                      </span>
                      {resident.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tag === 'Senior' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
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
          <p className="text-sm text-gray-600">Showing 1 to 5 of 8,547 residents</p>
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