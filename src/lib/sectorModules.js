// ─── Sector → Recommended modules map ────────────────────────────────────────
// Used during onboarding to personalise the workspace and in the sidebar
// to surface "Recommended" badges. All modules remain accessible — this only
// influences ordering and visual emphasis.

export const SECTOR_RECOMMENDED = {
  construction: ['Clients', 'Tasks', 'Documents', 'Stock', 'Invoices', 'CashRegister', 'Team', 'Reports'],
  retail:       ['Stock', 'Invoices', 'Receipts', 'CashRegister', 'Clients', 'Reports'],
  beauty:       ['Clients', 'Agenda', 'Services', 'Invoices', 'Receipts', 'CashRegister'],
  restaurant:   ['Stock', 'CashRegister', 'Invoices', 'Team', 'Receipts'],
  healthcare:   ['Clients', 'Agenda', 'Services', 'Documents', 'Invoices', 'Reports'],
  consulting:   ['Clients', 'Tasks', 'Agenda', 'Documents', 'Invoices', 'Reports'],
  education:    ['Clients', 'Agenda', 'Services', 'Documents', 'Invoices', 'Team'],
  real_estate:  ['Clients', 'Tasks', 'Agenda', 'Documents', 'Invoices', 'Reports'],
  logistics:    ['Clients', 'Stock', 'Tasks', 'Documents', 'Invoices', 'CashRegister'],
  marketing:    ['Clients', 'Tasks', 'Documents', 'Reports', 'Team', 'Invoices'],
  accounting:   ['Clients', 'Documents', 'Invoices', 'Receipts', 'Reports', 'Banks'],
  legal:        ['Clients', 'Documents', 'Tasks', 'Agenda', 'Invoices', 'Reports'],
  technology:   ['Clients', 'Tasks', 'Documents', 'Invoices', 'Team', 'Reports'],
  other:        ['Clients', 'Tasks', 'Invoices', 'Documents'],
};

// Returns the recommended module list for a given sector, or [] if unknown.
export const getRecommendedModules = (sector) =>
  SECTOR_RECOMMENDED[sector] ?? [];