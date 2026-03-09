import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import {
  Calendar,
  UserCheck,
  CheckCircle,
  TrendingUp,
  List,
  CalendarCheck,
  Users,
  HandHeart,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  User,
  Clock,
  Search
} from 'lucide-react';

const Events = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([
    {
      id: 1,
      date: { day: '15', month: 'DEC' },
      category: 'MEETING',
      categoryType: 'meeting',
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
      categoryType: 'community',
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
      categoryType: 'festival',
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
      categoryType: 'training',
      title: 'Disaster Preparedness Training',
      description: 'Essential training on disaster preparedness, first aid, and emergency response. Open to all residents. Certificates will be provided to attendees.',
      time: '1:00 PM - 5:00 PM',
      location: 'Barangay Hall',
      rsvps: 64,
      organizer: 'DRRM Officer'
    }
  ]);

  const filterButtons = [
    { id: 'all', label: 'All Events', icon: List },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
    { id: 'meetings', label: 'Meetings', icon: Users },
    { id: 'community', label: 'Community', icon: HandHeart }
  ];

  // Handle actions
  const handleView = (event) => {
    alert(`Viewing: ${event.title}\n\nDate: ${event.date.month} ${event.date.day}\nTime: ${event.time}\nLocation: ${event.location}\nRSVPs: ${event.rsvps}`);
  };

  const handleEdit = (event) => {
    alert(`Edit event: ${event.title}`);
  };

  const handleDelete = (event) => {
    if (window.confirm(`Delete event "${event.title}"?`)) {
      setEvents(prev => prev.filter(e => e.id !== event.id));
      alert('Event deleted successfully!');
    }
  };

  const handleCreateEvent = () => {
    alert('Create new event - Form would open here');
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Get category color
  const getCategoryColor = (categoryType) => {
    switch(categoryType) {
      case 'meeting': return 'primary';
      case 'community': return 'success';
      case 'festival': return 'warning';
      case 'training': return 'secondary';
      default: return 'primary';
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Events Calendar</h1>
          <p className="page-subtitle">Manage community events and activities</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={handleCreateEvent}>
          <Plus size={18} strokeWidth={2} />
          Create Announcement
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Upcoming"
          value="8"
          icon={Calendar}
          iconBg="icon-bg-primary"
          badge="Next 30 days"
          badgeColor="badge-primary"
        />
        <StatCard
          title="This Month"
          value="547"
          icon={UserCheck}
          iconBg="icon-bg-success"
          badge="↑ RSVPs"
          badgeColor="badge-success"
        />
        <StatCard
          title="Completed"
          value="24"
          icon={CheckCircle}
          iconBg="icon-bg-secondary"
          badge="This year"
          badgeColor="badge-gray"
        />
        <StatCard
          title="Avg. Attendance"
          value="82%"
          icon={TrendingUp}
          iconBg="icon-bg-warning"
          badge="RSVP rate"
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
              placeholder="Search events..."
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
          <button className="btn btn-secondary btn-md">
            <Calendar size={18} strokeWidth={1.5} />
            Month View
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="list-container">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => {
            const categoryColor = getCategoryColor(event.categoryType);
            
            return (
              <div
                key={event.id}
                className={`list-card list-card-${categoryColor}`}
              >
                <div className="list-card-content">
                  {/* Date Box */}
                  <div
                    style={{
                      width: '80px',
                      background: 'linear-gradient(135deg, var(--color-bg-tertiary), var(--color-gray-100))',
                      borderRadius: 'var(--radius-xl)',
                      padding: 'var(--space-4)',
                      textAlign: 'center',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 'var(--space-1)' }}>
                      {event.date.day}
                    </div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {event.date.month}
                    </div>
                  </div>
                  
                  <div className="list-card-body">
                    <div className="list-card-header">
                      <span className={`badge badge-${categoryColor}`}>
                        {event.category}
                      </span>
                      <span className="list-card-meta-item">
                        <Clock size={14} />
                        {event.time}
                      </span>
                    </div>
                    
                    <h3 className="list-card-title">{event.title}</h3>
                    <p className="list-card-description">{event.description}</p>
                    
                    <div className="list-card-meta">
                      <span className="list-card-meta-item">
                        <MapPin size={14} />
                        {event.location}
                      </span>
                      <span className="list-card-meta-item">
                        <UserCheck size={14} />
                        {event.rsvps} RSVPs
                      </span>
                      <span className="list-card-meta-item">
                        <User size={14} />
                        {event.organizer}
                      </span>
                    </div>
                  </div>
                  
                  <div className="list-card-actions">
                    <button 
                      className="btn-icon"
                      onClick={() => handleView(event)}
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => handleEdit(event)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => handleDelete(event)}
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
            <Calendar className="empty-state-icon" />
            <h3 className="empty-state-title">No events found</h3>
            <p className="empty-state-description">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredEvents.length > 0 && (
        <div className="card">
          <div className="pagination-container">
            <p className="pagination-info">Showing 1 to 4 of 8 events</p>
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

export default Events;