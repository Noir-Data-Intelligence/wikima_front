// Kakebo-inspired category system — real life, not accounting software

export const KAKEBO_CATEGORIES = [
  {
    key: 'Housing',
    emoji: '🏠',
    color: 'rgba(99,102,241,0.5)',
    colorSoft: 'rgba(99,102,241,0.12)',
    pt: 'Habitação',
    en: 'Housing',
    subcategories: {
      pt: ['Renda', 'Hipoteca', 'Condomínio', 'Seguro de Casa', 'Obras & Reparações', 'Mobiliário'],
      en: ['Rent', 'Mortgage', 'Condo Fees', 'Home Insurance', 'Repairs', 'Furniture'],
    },
  },
  {
    key: 'Home Services',
    emoji: '💡',
    color: 'rgba(245,158,11,0.5)',
    colorSoft: 'rgba(245,158,11,0.12)',
    pt: 'Serviços Casa',
    en: 'Home Services',
    subcategories: {
      pt: ['Eletricidade', 'Água', 'Gás', 'Internet', 'Telefone', 'TV / Streaming', 'Limpeza'],
      en: ['Electricity', 'Water', 'Gas', 'Internet', 'Phone', 'TV / Streaming', 'Cleaning'],
    },
  },
  {
    key: 'Food',
    emoji: '🛒',
    color: 'rgba(34,197,94,0.5)',
    colorSoft: 'rgba(34,197,94,0.12)',
    pt: 'Alimentação',
    en: 'Food',
    subcategories: {
      pt: ['Supermercado', 'Talho', 'Padaria', 'Frutas & Legumes', 'Entregas', 'Restaurantes', 'Cafés & Snacks'],
      en: ['Supermarket', 'Butcher', 'Bakery', 'Fruit & Veg', 'Deliveries', 'Restaurants', 'Cafés & Snacks'],
    },
  },
  {
    key: 'Transport',
    emoji: '🚗',
    color: 'rgba(59,130,246,0.5)',
    colorSoft: 'rgba(59,130,246,0.12)',
    pt: 'Transporte',
    en: 'Transport',
    subcategories: {
      pt: ['Combustível', 'Estacionamento', 'Manutenção', 'Seguro Auto', 'Transportes Públicos', 'Táxi / Uber', 'Portagens'],
      en: ['Fuel', 'Parking', 'Maintenance', 'Car Insurance', 'Public Transport', 'Taxi / Uber', 'Tolls'],
    },
  },
  {
    key: 'Children & Education',
    emoji: '🧒',
    color: 'rgba(236,72,153,0.5)',
    colorSoft: 'rgba(236,72,153,0.12)',
    pt: 'Crianças & Educação',
    en: 'Children & Education',
    subcategories: {
      pt: ['Escola / Creche', 'Propinas', 'Material Escolar', 'Explicações', 'Roupa Infantil', 'Brinquedos', 'Atividades'],
      en: ['School / Daycare', 'Tuition', 'School Supplies', 'Tutoring', 'Kids Clothing', 'Toys', 'Activities'],
    },
  },
  {
    key: 'Health',
    emoji: '❤️',
    color: 'rgba(239,68,68,0.5)',
    colorSoft: 'rgba(239,68,68,0.12)',
    pt: 'Saúde',
    en: 'Health',
    subcategories: {
      pt: ['Consultas', 'Farmácia', 'Exames', 'Seguro de Saúde', 'Ginásio', 'Bem-estar', 'Óculos / Dentista'],
      en: ['Doctor Visits', 'Pharmacy', 'Lab Tests', 'Health Insurance', 'Gym', 'Wellness', 'Optician / Dentist'],
    },
  },
  {
    key: 'Leisure & Personal',
    emoji: '🎉',
    color: 'rgba(168,85,247,0.5)',
    colorSoft: 'rgba(168,85,247,0.12)',
    pt: 'Lazer & Pessoal',
    en: 'Leisure & Personal',
    subcategories: {
      pt: ['Viagens', 'Entretenimento', 'Roupa', 'Beleza & Cuidado', 'Hobbies', 'Livros', 'Presentes', 'Jantares fora'],
      en: ['Travel', 'Entertainment', 'Clothing', 'Beauty & Care', 'Hobbies', 'Books', 'Gifts', 'Dining out'],
    },
  },
  {
    key: 'Business & Work',
    emoji: '💼',
    color: 'rgba(20,184,166,0.5)',
    colorSoft: 'rgba(20,184,166,0.12)',
    pt: 'Negócio & Trabalho',
    en: 'Business & Work',
    subcategories: {
      pt: ['Canva', 'Notion', 'Marketing', 'Formações', 'Material de Escritório', 'Software', 'Contabilidade', 'Outros Tools'],
      en: ['Canva', 'Notion', 'Marketing', 'Courses', 'Office Supplies', 'Software', 'Accounting', 'Other Tools'],
    },
  },
  {
    key: 'Banks & Other',
    emoji: '🏦',
    color: 'rgba(100,116,139,0.5)',
    colorSoft: 'rgba(100,116,139,0.12)',
    pt: 'Bancos & Outros',
    en: 'Banks & Other',
    subcategories: {
      pt: ['Comissões Bancárias', 'Empréstimo', 'Crédito', 'Impostos', 'Seguros', 'Outros'],
      en: ['Bank Fees', 'Loan', 'Credit', 'Taxes', 'Insurance', 'Other'],
    },
  },
  {
    key: 'Savings',
    emoji: '🪴',
    color: 'rgba(52,211,153,0.5)',
    colorSoft: 'rgba(52,211,153,0.12)',
    pt: 'Poupança',
    en: 'Savings',
    subcategories: {
      pt: ['Fundo de Emergência', 'Poupança Mensal', 'Meta Específica'],
      en: ['Emergency Fund', 'Monthly Savings', 'Specific Goal'],
    },
  },
  {
    key: 'Investments',
    emoji: '📈',
    color: 'rgba(251,191,36,0.5)',
    colorSoft: 'rgba(251,191,36,0.12)',
    pt: 'Investimentos',
    en: 'Investments',
    subcategories: {
      pt: ['ETFs / Fundos', 'Ações', 'Imobiliário', 'Negócio', 'Criptomoedas', 'Outros'],
      en: ['ETFs / Funds', 'Stocks', 'Real Estate', 'Business', 'Crypto', 'Other'],
    },
  },
];

export const INCOME_CATEGORIES = [
  { key: 'Salary',       emoji: '💵', pt: 'Salário',    en: 'Salary' },
  { key: 'Freelance',    emoji: '🔧', pt: 'Freelance',  en: 'Freelance' },
  { key: 'Sales',        emoji: '📊', pt: 'Vendas',     en: 'Sales' },
  { key: 'Gift',         emoji: '🎁', pt: 'Oferta',     en: 'Gift' },
  { key: 'Other Income', emoji: '💰', pt: 'Outro',      en: 'Other' },
];

export const FEELINGS = [
  { key: 'necessary',  emoji: '✅', pt: 'Necessário',   en: 'Necessary' },
  { key: 'important',  emoji: '⭐', pt: 'Importante',   en: 'Important' },
  { key: 'investment', emoji: '📈', pt: 'Investimento', en: 'Investment' },
  { key: 'impulse',    emoji: '⚡', pt: 'Impulso',      en: 'Impulse' },
  { key: 'comfort',    emoji: '☁️', pt: 'Conforto',    en: 'Comfort' },
];

export function getCategoryMeta(key) {
  return KAKEBO_CATEGORIES.find(c => c.key === key);
}