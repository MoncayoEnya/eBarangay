import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import {
  Megaphone,
  AlertCircle,
  CheckCircle,
  Eye,
  List,
  Filter,
  Plus,
  Edit,
  Trash2,
  User,
  Clock,
  Search,
  Bell,
  TrendingUp,
  Users
} from 'lucide-react';


const Announcements = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      type: 'URGENT',
      typeClass: 'urgent',
      title: 'Emergency Community Meeting',
      description: 'All residents are required to attend an emergency meeting regarding the upcoming road construction project. This will affect main access routes and requires community coordination.',
      time: '2 hours ago',
      author: 'Admin User',
      views: 234,
      icon: AlertCircle
    },
    {
      id: 2,
      type: 'IMPORTANT',
      typeClass: 'important',
      title: 'Health Services Schedule Update',
      description: 'The barangay health center will have modified operating hours next week due to the medical mission. Free health checkups and consultations will be available from 8 AM to 5 PM.',
      time: '5 hours ago',
      author: 'Health Officer',
      views: 189,
      icon: Megaphone
    },
    {
      id: 3,
      type: 'GENERAL',
      typeClass: 'general',
      title: 'Community Garden Registration Open',
      description: 'We are now accepting applications for community garden plots. This is a great opportunity to grow your own vegetables and connect with neighbors. Limited slots available.',
      time: '1 day ago',
      author: 'Agricultural Officer',
      views: 156,
      icon: Bell
    },
    {
      id: 4,
      type: 'INFO',
      typeClass: 'info',
      title: 'Garbage Collection Schedule',
      description: 'Please be reminded that garbage collection for biodegradable waste is every Monday and Thursday, while non-biodegradable waste is collected every Wednesday and Saturday.',
      time: '2 days ago',
      author: 'Sanitation Officer',
      views: 98,
      icon: Megaphone
    }
  ]);

  const filterButtons = [
    { id: 'all', label: 'All Announcements', icon: List },
    { id: 'urgent', label: 'Urgent', icon: AlertCircle },
    { id: 'important', label: 'Important', icon: Megaphone },
    { id: 'general', label: 'General', icon: Bell }
  ];

  // Handle actions
  const handleView = (announcement) => {
    alert(`Viewing: ${announcement.title}\n\nType: ${announcement.type}\nAuthor: ${announcement.author}\nViews: ${announcement.views}`);
  };

  const handleEdit = (announcement) => {
    alert(`Edit announcement: ${announcement.title}`);
  };

  const handleDelete = (announcement) => {
    if (window.confirm(`Delete announcement "${announcement.title}"?`)) {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
      alert('Announcement deleted successfully!');
    }
  };

  const handleCreateAnnouncement = () => {
    alert('Create new announcement - Form would open here');
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      activeFilter === 'all' || 
      announcement.typeClass === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Get type color
  const getTypeColor = (typeClass) => {
    switch(typeClass) {
      case 'urgent': return 'error';
      case 'important': return 'warning';
      case 'general': return 'primary';
      case 'info': return 'success';
      default: return 'primary';
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Manage barangay announcements and notices</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={handleCreateAnnouncement}>
          <Plus size={18} strokeWidth={2} />
          Create Announcement
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Posts"
          value="156"
          icon={Megaphone}
          iconBg="icon-bg-primary"
          badge="This month"
          badgeColor="badge-primary"
        />
        <StatCard
          title="Total Views"
          value="12.4K"
          icon={Eye}
          iconBg="icon-bg-success"
          badge="↑ 12.5%"
          badgeColor="badge-success"
        />
        <StatCard
          title="Active"
          value="23"
          icon={CheckCircle}
          iconBg="icon-bg-warning"
          badge="Currently"
          badgeColor="badge-gray"
        />
        <StatCard
          title="Avg. Engagement"
          value="89%"
          icon={TrendingUp}
          iconBg="icon-bg-secondary"
          badge="Read rate"
          badgeColor="badge-gray"
        />
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-buttons-group">
          {filterButtons.map(btn => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => setActiveFilter(btn.id)}
                className={`filter-btn ${activeFilter === btn.id ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {btn.label}
              </button>
            );
          })}
        </div>
        <div className="action-buttons-group">
          <div style={{ position: 'relative', minWidth: '250px' }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-tertiary)'
              }}
            />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button className="btn btn-secondary btn-md">
            <Filter size={18} strokeWidth={1.5} />
            Filter
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="list-container">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map(announcement => {
            const Icon = announcement.icon;
            const typeColor = getTypeColor(announcement.typeClass);
            
            return (
              <div
                key={announcement.id}
                className={`list-card list-card-${typeColor}`}
              >
                <div className="list-card-content">
                  {/* Icon */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      background: `var(--color-${typeColor}-light)`,
                      borderRadius: 'var(--radius-xl)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: `var(--color-${typeColor})`
                    }}
                  >
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  
                  <div className="list-card-body">
                    <div className="list-card-header">
                      <span className={`badge badge-${typeColor}`}>
                        {announcement.type}
                      </span>
                      <span className="list-card-meta-item">
                        <Clock size={14} />
                        {announcement.time}
                      </span>
                    </div>
                    
                    <h3 className="list-card-title">{announcement.title}</h3>
                    <p className="list-card-description">{announcement.description}</p>
                    
                    <div className="list-card-meta">
                      <span className="list-card-meta-item">
                        <User size={14} />
                        {announcement.author}
                      </span>
                      <span className="list-card-meta-item">
                        <Eye size={14} />
                        {announcement.views} views
                      </span>
                    </div>
                  </div>
                  
                  <div className="list-card-actions">
                    <button 
                      className="btn-icon"
                      onClick={() => handleView(announcement)}
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => handleEdit(announcement)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => handleDelete(announcement)}
                      title="Delete"
                      style={{ color: 'var(--color-error)' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <Megaphone className="empty-state-icon" />
            <h3 className="empty-state-title">No announcements found</h3>
            <p className="empty-state-description">
              Try adjusting your search criteria or create a new announcement
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredAnnouncements.length > 0 && (
        <div className="card">
          <div className="pagination-container">
            <p className="pagination-info">Showing 1 to 4 of 4 announcements</p>
            <div className="pagination">
              <button className="pagination-btn" disabled>Previous</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;