// src/hooks/useBeneficiaries.js
// Beneficiary logic is handled by useWelfare.
// This re-exports it so any future component importing useBeneficiaries still works.
export { useWelfare as useBeneficiaries } from './useWelfare';