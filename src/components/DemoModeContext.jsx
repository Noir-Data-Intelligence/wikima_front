import { createContext, useContext } from 'react';

const DemoModeContext = createContext();

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
};

export const DemoModeProvider = ({ children }) => {
  // Set to true for demo/preview mode
  const isDemoMode = false;

  const demoData = {
    tasks: [
      {
        id: 'demo-1',
        title: 'Complete project proposal',
        status: 'in_progress',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        client_name: 'Acme Corp',
        description: 'Draft and finalize the Q1 project proposal'
      },
      {
        id: 'demo-2',
        title: 'Review client contract',
        status: 'todo',
        priority: 'medium',
        deadline: new Date(Date.now() + 172800000).toISOString(),
        client_name: 'Tech Solutions Ltd',
        description: 'Legal review of service agreement'
      },
      {
        id: 'demo-3',
        title: 'Prepare quarterly report',
        status: 'completed',
        priority: 'medium',
        deadline: new Date(Date.now() - 86400000).toISOString(),
        client_name: 'Global Industries',
        description: 'Q4 financial summary and analysis',
        completed_date: new Date(Date.now() - 43200000).toISOString()
      }
    ],
    clients: [
      {
        id: 'demo-c1',
        name: 'Acme Corp',
        email: 'contact@acme.example',
        company: 'Acme Corporation',
        status: 'active',
        total_paid: 15000,
        total_outstanding: 2500
      },
      {
        id: 'demo-c2',
        name: 'Tech Solutions Ltd',
        email: 'info@techsolutions.example',
        company: 'Tech Solutions',
        status: 'active',
        total_paid: 8500,
        total_outstanding: 0
      },
      {
        id: 'demo-c3',
        name: 'Global Industries',
        email: 'hello@global.example',
        company: 'Global Industries Inc',
        status: 'active',
        total_paid: 12000,
        total_outstanding: 1000
      }
    ],
    documents: [
      {
        id: 'demo-d1',
        title: 'Service Agreement - Acme Corp',
        category: 'contract',
        client_name: 'Acme Corp',
        created_date: new Date(Date.now() - 604800000).toISOString()
      },
      {
        id: 'demo-d2',
        title: 'Q4 Financial Report',
        category: 'report',
        client_name: 'Global Industries',
        created_date: new Date(Date.now() - 259200000).toISOString()
      }
    ],
    invoices: [
      {
        id: 'demo-i1',
        invoice_number: 'INV-2024-001',
        client_name: 'Acme Corp',
        status: 'paid',
        total: 5000,
        date: new Date(Date.now() - 1209600000).toISOString()
      },
      {
        id: 'demo-i2',
        invoice_number: 'INV-2024-002',
        client_name: 'Tech Solutions Ltd',
        status: 'sent',
        total: 2500,
        date: new Date(Date.now() - 432000000).toISOString()
      }
    ]
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, demoData }}>
      {children}
    </DemoModeContext.Provider>
  );
};