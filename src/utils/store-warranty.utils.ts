/**
 * Centralized Store Warranty & Acknowledgment Rules Utility (Frontend)
 *
 * Business Rules:
 * - 'Non Warranty' & 'AMC Without Spare' -> Acknowledgment is REQUIRED for used units.
 * - 'Warranty' & 'AMC With Spare' -> Acknowledgment is NOT REQUIRED (only 'Used' / 'Unused' and Return Status are tracked).
 */

export function normalizeWarrantyStatus(val?: string | null): string {
  if (!val) return 'Non Warranty';
  const trimmed = val.trim().toLowerCase();
  if (trimmed === 'warranty') return 'Warranty';
  if (trimmed === 'under amc' || trimmed === 'amc with spare') return 'AMC With Spare';
  if (trimmed === 'amc without spare') return 'AMC Without Spare';
  if (trimmed === 'non warranty') return 'Non Warranty';
  return val.trim();
}

export function isAcknowledgeRequired(warrantyStatus?: string | null): boolean {
  if (!warrantyStatus) return true; // Default to true if not specified
  const normalized = normalizeWarrantyStatus(warrantyStatus).toLowerCase();
  return normalized === 'non warranty' || normalized === 'amc without spare';
}
