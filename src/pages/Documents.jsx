import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { FileText, Clock, CheckCircle, Eye, Check, X, Printer, Download, Filter, Plus, Timer } from 'lucide-react';

export default function Documents() {
  const [activeFilter, setActiveFilter] = useState('all');

  const requests = [
    {
      id: 1,
      requestId: 'DC-2024-001',
      resident: {
        name: 'Juan Dela Cruz',
        contact: '0917-123-4567'
      },
      type: 'Barangay Clearance',
      date: 'Dec 1, 2024',
      status: 'Pending'
    },
    {
      id: 2,
      requestId: 'DC-2024-002',
      resident: {
        name: 'Maria Santos',
        contact: '0928-234-5678'
      },
      type: 'Certificate of Residency',
      date: 'Dec 1, 2024',
      status: 'Approved'
    },
    {
      id: 3,
      requestId: 'DC-2024-003',
      resident: {
        name: 'Pedro Reyes',
        contact: '0939-345-6789'
      },
      type: 'Certificate of Indigency',
      date: 'Nov 30, 2024',
      status: 'Pending'
    },
    {
      id: 4,
      requestId: 'DC-2024-004',
      resident: {
        name: 'Ana Garcia',
        contact: '0945-456-7890'
      },
      type: 'Business Clearance',
      date: 'Nov 30, 2024',
      status: 'Approved'
    },
    {
      id: 5,
      requestId: 'DC-2024-005',
      resident: {
        name: 'Roberto Mendoza',
        contact: '0956-567-8901'
      },
      type: 'Good Moral Certificate',
      date: 'Nov 29, 2024',
      status: 'Denied'
    }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Denied':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filterButtons = [
    { id: 'all', label: 'All Requests', icon: FileText },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'approved', label: 'Approved', icon: CheckCircle },
    { id: 'denied', label: 'Denied', icon: X }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Document Management</h2>
          <p className="text-gray-600 text-sm mt-1">Process and track document requests</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Issue Document
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Pending Requests"
          value="12"
          icon={Clock}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          badge="Requires action"
          badgeColor="text-orange-600"
        />
        <StatCard
          title="Approved Today"
          value="28"
          icon={CheckCircle}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="12% from yesterday"
          badgeColor="text-green-600"
          badgeIcon="↑"
        />
        <StatCard
          title="This Month"
          value="342"
          icon={FileText}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="Documents issued"
          badgeColor="text-gray-600"
        />
        <StatCard
          title="Avg. Processing"
          value="2.4"
          icon={Timer}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          badge="Days per request"
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
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Request ID</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Resident</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Document Type</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Date Requested</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-blue-600">
                    {request.requestId}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${request.resident.name}&background=3b82f6&color=fff`}
                        alt={request.resident.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{request.resident.name}</p>
                        <p className="text-sm text-gray-500">{request.resident.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{request.type}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{request.date}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'Pending' ? (
                        <>
                          <button className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : request.status === 'Approved' ? (
                        <>
                          <button className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Showing 1 to 5 of 342 requests</p>
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