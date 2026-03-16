// src/utils/csvExport.js
// CSV Export & Import utilities for Residents

// ── EXPORT ────────────────────────────────────────────────────────────────────
export const exportResidentsToCSV = (residents) => {
  const headers = [
    'First Name', 'Middle Name', 'Last Name', 'Suffix', 'Nickname',
    'Birth Date', 'Age', 'Gender', 'Civil Status', 'Blood Type',
    'Mobile Number', 'Landline', 'Email',
    'Purok', 'Street', 'Block', 'Lot', 'Full Address',
    'Latitude', 'Longitude',
    'Voter', 'Voter ID', 'PWD', 'PWD ID', 'Senior Citizen', 'Senior ID',
    '4Ps', 'Indigent', 'OFW',
    'Employment Status', 'Occupation', 'Employer', 'Monthly Income',
    'Emergency Contact Name', 'Emergency Contact Relation', 'Emergency Contact Number',
    'Status',
  ];

  const rows = residents.map(r => {
    const p  = r.personalInfo    || {};
    const c  = r.contactInfo     || {};
    const a  = r.address         || {};
    const f  = r.statusFlags     || {};
    const e  = r.employment      || {};
    const ec = r.emergencyContact || {};
    const si = r.systemInfo      || {};
    return [
      p.firstName || '', p.middleName || '', p.lastName || '', p.suffix || '', p.nickname || '',
      p.birthDate || '', p.age || '', p.gender || '', p.civilStatus || '', p.bloodType || '',
      c.mobileNumber || '', c.landlineNumber || '', c.email || '',
      a.purok || '', a.street || '', a.block || '', a.lot || '', a.fullAddress || '',
      a.coordinates?.latitude || '', a.coordinates?.longitude || '',
      f.isVoter ? 'Yes' : 'No', f.voterIdNumber || '',
      f.isPWD ? 'Yes' : 'No', f.pwdIdNumber || '',
      f.isSeniorCitizen ? 'Yes' : 'No', f.seniorCitizenIdNumber || '',
      f.is4Ps ? 'Yes' : 'No', f.isIndigent ? 'Yes' : 'No', f.isOFW ? 'Yes' : 'No',
      e.employmentStatus || '', e.occupation || '', e.employer || '', e.monthlyIncome || '',
      ec.name || '', ec.relationship || '', ec.contactNumber || '',
      si.status || 'Active',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
  });

  const csv  = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `residents_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── IMPORT PARSER ─────────────────────────────────────────────────────────────
// Returns array of resident-shaped objects ready to save via residentsService
export const parseResidentsCSV = (csvText) => {
  const lines  = csvText.trim().split('\n');
  if (lines.length < 2) return { data: [], errors: ['CSV file is empty or has no data rows.'] };

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const errors  = [];
  const data    = [];

  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    // Handle quoted fields with commas inside
    const fields = [];
    let current  = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    fields.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => { row[h] = (fields[idx] || '').replace(/^"|"$/g, ''); });

    if (!row['First Name'] && !row['Last Name']) {
      errors.push(`Row ${i + 2}: Missing first and last name — skipped.`);
      return;
    }

    data.push({
      personalInfo: {
        firstName:   row['First Name']   || '',
        middleName:  row['Middle Name']  || '',
        lastName:    row['Last Name']    || '',
        suffix:      row['Suffix']       || '',
        nickname:    row['Nickname']     || '',
        birthDate:   row['Birth Date']   || '',
        age:         row['Age'] ? Number(row['Age']) : null,
        gender:      row['Gender']       || '',
        civilStatus: row['Civil Status'] || '',
        bloodType:   row['Blood Type']   || '',
      },
      contactInfo: {
        mobileNumber:   row['Mobile Number'] || '',
        landlineNumber: row['Landline']      || '',
        email:          row['Email']         || '',
      },
      address: {
        purok:       row['Purok']        || '',
        street:      row['Street']       || '',
        block:       row['Block']        || '',
        lot:         row['Lot']          || '',
        fullAddress: row['Full Address'] || '',
        coordinates: {
          latitude:  row['Latitude']  ? Number(row['Latitude'])  : null,
          longitude: row['Longitude'] ? Number(row['Longitude']) : null,
        },
      },
      statusFlags: {
        isVoter:        row['Voter']          === 'Yes',
        voterIdNumber:  row['Voter ID']       || '',
        isPWD:          row['PWD']            === 'Yes',
        pwdIdNumber:    row['PWD ID']         || '',
        isSeniorCitizen:row['Senior Citizen'] === 'Yes',
        seniorCitizenIdNumber: row['Senior ID'] || '',
        is4Ps:          row['4Ps']            === 'Yes',
        isIndigent:     row['Indigent']       === 'Yes',
        isOFW:          row['OFW']            === 'Yes',
      },
      employment: {
        employmentStatus: row['Employment Status'] || '',
        occupation:       row['Occupation']        || '',
        employer:         row['Employer']          || '',
        monthlyIncome:    row['Monthly Income'] ? Number(row['Monthly Income']) : null,
      },
      emergencyContact: {
        name:          row['Emergency Contact Name']     || '',
        relationship:  row['Emergency Contact Relation'] || '',
        contactNumber: row['Emergency Contact Number']   || '',
      },
      systemInfo: {
        status: row['Status'] || 'Active',
      },
    });
  });

  return { data, errors };
};
