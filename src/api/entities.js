// Entity resource clients.
//
// Each entity maps to a REST resource via createResource. The endpoint path is
// derived from the entity name in kebab-case (BankAccount -> "bank-account").
// Change `toPath` (or pass an explicit path) if the backend uses another
// convention (e.g. snake_case or plural). The data model for these entities is
// documented in the `base44/entities/*.jsonc` schemas kept in the repo.

import { createResource } from './resource';

function toPath(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// All entities referenced by the app (plus schema-defined ones kept for parity).
const ENTITY_NAMES = [
  'AgendaEvent',
  'Assignment',
  'BankAccount',
  'BankStatement',
  'CashRegister',
  'Client',
  'Document',
  'Email',
  'EmailAccount',
  'Expense',
  'Feedback',
  'FinancialGoal',
  'Invoice',
  'Message',
  'MonthlyReview',
  'NotificationLog',
  'OnboardingData',
  'PricingPlan',
  'Product',
  'Project',
  'ProjectActivityLog',
  'Receipt',
  'RecurringPayment',
  'Reminder',
  'ReminderRule',
  'ReminderSettings',
  'SavingsGoal',
  'Service',
  'SupportMessage',
  'SupportTicket',
  'SyncState',
  'Task',
  'TaskActivity',
  'TaskAssignmentNotification',
  'TaskAttachment',
  'TaskComment',
  'TaskSubtask',
  'TeamMember',
  'User',
  'Workspace',
  'WorkspaceMember',
];

export const entities = ENTITY_NAMES.reduce((acc, name) => {
  acc[name] = createResource(toPath(name));
  return acc;
}, {});

export default entities;
