import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { Users, Gift, DollarSign, Clock, Plus, UserCheck, Heart, Briefcase, Calendar, MoreVertical } from 'lucide-react';

export default function SocialWelfare() {
  const [activeFilter, setActiveFilter] = useState('all');

  const programs = [
    {
      id: 1,
      name: 'Senior Citizens',
      description: 'Quarterly cash assistance',
      icon: UserCheck,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      status: 'Active',
      statusColor: 'bg-purple-100 text-purple-700',
      borderColor: 'border-purple-500',
      distributed: 342,
      total: 456,
      percentage: 75,
      amount: '₱1,500/person',
      dueDate: 'Due: Dec 15'
    },
    {
      id: 2,
      name: 'PWD Assistance',
      description: 'Monthly support program',
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      status: 'Active',
      statusColor: 'bg-blue-100 text-blue-700',
      borderColor: 'border-blue-500',
      distributed: 178,
      total: 198,
      percentage: 90,
      amount: '₱1,000/person',
      dueDate: 'Due: Dec 10'
    },
    {
      id: 3,
      name: 'Emergency Ayuda',
      description: 'Financial assistance',
      icon: Heart,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      status: 'Ongoing',
      statusColor: 'bg-green-100 text-green-700',
      borderColor: 'border-green-500',
      distributed: 89,
      total: 150,
      percentage: 59,
      amount: '₱3,000/family',
      dueDate: 'Due: Dec 20'
    },
    {
      id: 4,
      name: 'Medical Assistance',
      description: 'Medicine & hospitalization',
      icon: Briefcase,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      status: 'Active',
      statusColor: 'bg-red-100 text-red-700',
      borderColor: 'border-red-500',
      distributed: 24,
      total: 45,
      percentage: 53,
      amount: 'Variable amount',
      dueDate: 'Rolling basis'
    }
  ];

  const beneficiaries = [
    {
      id: 1,
      name: 'Maria Santos',
      type: 'Senior Citizen',
      purok: 'Purok 3',
      amount: '₱1,500',
      period: 'Q4 2024',
      status: 'Received',
      statusColor: 'bg-green-100 text-green-700',
      date: 'Dec 1, 2024',
      avatar: 'https://ui-avatars.com/api/?name=Maria+Santos&background=3b82f6&color=fff'
    },
    {
      id: 2,
      name: 'Juan Dela Cruz',
      type: 'PWD',
      purok: 'Purok 5',
      amount: '₱1,000',
      period: 'Dec 2024',
      status: 'Received',
      statusColor: 'bg-green-100 text-green-700',
      date: 'Dec 1, 2024',
      avatar: 'https://ui-avatars.com/api/?name=Juan+Dela+Cruz&background=8b5cf6&color=fff'
    },
    {
      id: 3,
      name: 'Ana Reyes',
      type: 'Emergency Ayuda',
      purok: 'Purok 2',
      amount: '₱3,000',
      period: 'Dec 2024',
      status: 'Pending',
      statusColor: 'bg-orange-100 text-orange-700',
      date: 'Nov 30, 2024',
      avatar: 'https://ui-avatars.com/api/?name=Ana+Reyes&background=10b981&color=fff'
    },
    {
      id: 4,
      name: 'Pedro Garcia',
      type: 'Medical Assistance',
      purok: 'Purok 7',
      amount: '₱5,000',
      period: 'Nov 2024',
      status: 'Approved',
      statusColor: 'bg-blue-100 text-blue-700',
      date: 'Nov 29, 2024',
      avatar: 'https://ui-avatars.com/api/?name=Pedro+Garcia&background=ef4444&color=fff'
    },
    {
      id: 5,
      name: 'Rosa Martinez',
      type: 'Senior Citizen',
      purok: 'Purok 4',
      amount: '₱1,500',
      period: 'Q4 2024',
      status: 'Received',
      statusColor: 'bg-green-100 text-green-700',
      date: 'Nov 30, 2024',
      avatar: 'https://ui-avatars.com/api/?name=Rosa+Martinez&background=f59e0b&color=fff'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Social Welfare & Aid Distribution</h2>
          <p className="text-gray-600 text-sm mt-1">Manage beneficiaries and aid programs</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Program
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Beneficiaries"
          value="1,248"
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          badge="+24 this month"
          badgeColor="text-blue-600"
        />
        <StatCard
          title="Active Programs"
          value="8"
          icon={Gift}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          badge="3 distributing"
          badgeColor="text-green-600"
        />
        <StatCard
          title="This Month"
          value="₱285K"
          icon={DollarSign}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          badge="Total distributed"
          badgeColor="text-gray-600"
        />
        <StatCard
          title="Pending Claims"
          value="42"
          icon={Clock}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          badge="Needs action"
          badgeColor="text-orange-600"
        />
      </div>

      {/* Active Programs */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Active Programs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map(program => {
            const Icon = program.icon;
            return (
              <div
                key={program.id}
                className={`bg-white rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 border-l-4 ${program.borderColor}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`w-10 h-10 ${program.iconBg} rounded-xl flex items-center justify-center mb-2`}>
                      <Icon className={`w-5 h-5 ${program.iconColor}`} />
                    </div>
                    <h4 className="font-bold text-gray-800">{program.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{program.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${program.statusColor}`}>
                    {program.status}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Distribution Progress</span>
                    <span className="font-semibold text-gray-800">
                      {program.distributed}/{program.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-600 to-purple-600 rounded-full transition-all"
                      style={{ width: `${program.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {program.amount}
                  </span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {program.dueDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Beneficiaries */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Recent Beneficiaries</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Approved
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Export
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {beneficiaries.map(beneficiary => (
            <div
              key={beneficiary.id}
              className="bg-white rounded-lg border border-gray-100 p-4 transition-all hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={beneficiary.avatar}
                    alt={beneficiary.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{beneficiary.name}</h4>
                    <p className="text-sm text-gray-500">
                      {beneficiary.type} · {beneficiary.purok}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-semibold text-gray-800">{beneficiary.amount}</p>
                    <p className="text-xs text-gray-500">{beneficiary.period}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${beneficiary.statusColor}`}>
                    {beneficiary.status}
                  </span>
                  <span className="text-xs text-gray-500">{beneficiary.date}</span>
                </div>
                <button className="text-gray-400 hover:text-blue-600 p-2 ml-4 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}