// src/utils/constants.js
// Central source of truth for all shared constants across the app

// ── Barangay Info ──────────────────────────────────────────────
export const BARANGAY_NAME    = 'Barangay San Isidro';
export const MUNICIPALITY     = 'Cebu City';
export const PROVINCE         = 'Cebu';
export const REGION           = 'Region VII - Central Visayas';
export const BARANGAY_HOTLINE = '(032) 234-5678';

// ── Puroks ────────────────────────────────────────────────────
export const PUROKS = [
  'Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5',
  'Purok 6', 'Purok 7', 'Purok 8', 'Purok 9', 'Purok 10',
];

// ── User Roles ────────────────────────────────────────────────
export const ROLES = {
  CHAIRMAN:      'chairman',
  SECRETARY:     'secretary',
  TREASURER:     'treasurer',
  KAGAWAD:       'kagawad',
  HEALTH_WORKER: 'health_worker',
  STAFF:         'staff',
};

export const ROLE_LABELS = {
  chairman:      'Barangay Chairman',
  secretary:     'Barangay Secretary',
  treasurer:     'Barangay Treasurer',
  kagawad:       'Kagawad',
  health_worker: 'Health Worker / Nurse',
  staff:         'Barangay Staff',
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

// ── Resident Categories ───────────────────────────────────────
export const RESIDENT_CATEGORIES = {
  SENIOR:    'senior',
  PWD:       'pwd',
  FOURPS:    '4ps',
  INDIGENT:  'indigent',
  VOTER:     'voters',
};

export const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'];

export const GENDERS = ['Male', 'Female'];

export const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Unknown'];

// ── Document Types ────────────────────────────────────────────
export const DOCUMENT_TYPE_LIST = [
  'Barangay Clearance',
  'Certificate of Residency',
  'Certificate of Indigency',
  'Good Moral Character',
  'Business Clearance',
  'Barangay ID',
  'Certificate of No Pending Case',
  'First Time Job Seeker',
  'Certificate for PWD',
  'Solo Parent Certificate',
];

export const DOCUMENT_STATUSES = {
  PENDING:    'Pending',
  PROCESSING: 'Processing',
  APPROVED:   'Approved',
  DENIED:     'Denied',
  RELEASED:   'Released',
};

// ── Incident ──────────────────────────────────────────────────
export const INCIDENT_CATEGORIES = [
  'Dispute',
  'Theft',
  'Noise Complaint',
  'Property Issue',
  'Physical Assault',
  'Trespassing',
  'Domestic Violence',
  'Vandalism',
  'Drug-Related',
  'Others',
];

export const INCIDENT_STATUSES = {
  OPEN:       'Open',
  MEDIATION:  'Under Mediation',
  RESOLVED:   'Resolved',
  REFERRED:   'Referred to PNP',
};

export const INCIDENT_SEVERITIES = ['Low', 'Medium', 'High', 'Urgent'];

// ── DRRM ─────────────────────────────────────────────────────
export const ALERT_LEVELS = {
  ADVISORY:   'Advisory',
  WARNING:    'Warning',
  EVACUATION: 'Evacuation Order',
};

export const CENTER_STATUSES = ['Standby', 'Active', 'Full', 'Closed'];

// ── Events ────────────────────────────────────────────────────
export const EVENT_CATEGORIES = [
  'Meeting',
  'Community',
  'Festival',
  'Training',
  'Health',
  'DRRM',
  'General',
];

// ── Health ────────────────────────────────────────────────────
export const APPOINTMENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];

export const CONSULTATION_TYPES = [
  'General Consultation',
  'Pre-natal',
  'Post-natal',
  'Child Health',
  'BP Monitoring',
  'Immunization',
  'Wound Care',
  'Family Planning',
  'Others',
];

export const DISEASE_CATEGORIES = [
  'Dengue', 'Influenza', 'Diarrhea', 'Hypertension', 'Diabetes',
  'Pneumonia', 'Tuberculosis', 'COVID-19', 'Chickenpox', 'Others',
];

// ── Waste Management ─────────────────────────────────────────
export const WASTE_TYPES = ['Biodegradable', 'Non-Biodegradable', 'Recyclable', 'Special Waste'];

export const COLLECTION_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Finance ──────────────────────────────────────────────────
export const TRANSACTION_TYPES = {
  INCOME:  'Income',
  EXPENSE: 'Expense',
};

export const BUDGET_CATEGORIES = [
  'Administration',
  'Health Services',
  'Social Welfare',
  'DRRM',
  'Infrastructure',
  'Peace & Order',
  'Livelihood',
  'Environment',
  'Youth & Sports',
];

// ── Welfare ───────────────────────────────────────────────────
export const AID_TYPES = ['Cash', 'Food Pack', 'Medicine', 'Clothing', 'Others'];

export const BENEFICIARY_CATEGORIES = [
  'Senior Citizen',
  'PWD',
  '4Ps Member',
  'Indigent',
  'Solo Parent',
  'Victim of Calamity',
];

// ── Announcements ─────────────────────────────────────────────
export const ANNOUNCEMENT_TARGET_GROUPS = [
  'All Residents',
  'Senior Citizens',
  'PWDs',
  '4Ps Beneficiaries',
  'Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5',
];

export const ANNOUNCEMENT_PRIORITIES = ['Normal', 'Important', 'Urgent'];