// src/services/smsService.js
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const loadSMSConfig = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'sms_gateway'));
    if (snap.exists()) return snap.data();
  } catch (_) {}
  return null;
};

const fill = (template, vars = {}) =>
  Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), v ?? ''),
    template
  );

export const sendSMS = async (numbers, message) => {
  try {
    const config = await loadSMSConfig();
    if (!config || !config.enabled || !config.apiKey)
      return { success: true, sent: 0, skipped: true };

    const list = Array.isArray(numbers) ? numbers : [numbers];
    const valid = list
      .map(n => String(n || '').replace(/\s|-/g, ''))
      .filter(n => /^(09|\+639)\d{9}$/.test(n));

    if (!valid.length) return { success: true, sent: 0 };

    const body = new URLSearchParams({
      apikey:     config.apiKey,
      number:     valid.join(','),
      message:    message.slice(0, 480),
      sendername: config.senderName || 'EBARANGAY',
    });

    const res = await fetch('https://api.semaphore.co/api/v4/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });

    if (!res.ok) return { success: false, error: await res.text() };
    return { success: true, sent: valid.length };
  } catch (e) {
    console.warn('[SMS]', e.message);
    return { success: false, error: e.message };
  }
};

export const sendDocumentReadySMS = async (contactNumber, docType, refNo) => {
  const config = await loadSMSConfig();
  const template =
    config?.templates?.document ||
    'Your {docType} is ready for pickup at the barangay hall. Ref: {refNo}';
  return sendSMS(contactNumber, fill(template, { docType, refNo }));
};

export const sendEventReminderSMS = async (numbers, eventName, date, location) => {
  const config = await loadSMSConfig();
  const template =
    config?.templates?.event ||
    'Reminder: {eventName} on {date} at {location}. — e-Barangay';
  return sendSMS(numbers, fill(template, { eventName, date, location }));
};

export const sendEmergencyAlertSMS = async (numbers, message) => {
  const config = await loadSMSConfig();
  const template =
    config?.templates?.alert || 'EMERGENCY ALERT: {message}';
  return sendSMS(numbers, fill(template, { message }));
};
