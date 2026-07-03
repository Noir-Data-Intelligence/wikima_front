/**
 * Multi-Currency Utility for WiKima
 * Supports international currencies with proper formatting and symbols
 */

// Supported currencies with symbols and formatting rules
export const CURRENCIES = {
  AOA: { symbol: 'Kz', name: 'Kwanza', locale: 'pt-AO', decimalSeparator: '.', thousandSeparator: ',', symbolPosition: 'before', decimalPlaces: 0 },
  EUR: { symbol: '€', name: 'Euro', locale: 'pt-PT', decimalSeparator: ',', thousandSeparator: '.', symbolPosition: 'after', decimalPlaces: 2 },
  USD: { symbol: '$', name: 'Dollar', locale: 'en-US', decimalSeparator: '.', thousandSeparator: ',', symbolPosition: 'before', decimalPlaces: 2 },
  BRL: { symbol: 'R$', name: 'Real', locale: 'pt-BR', decimalSeparator: ',', thousandSeparator: '.', symbolPosition: 'before', decimalPlaces: 2 },
  GBP: { symbol: '£', name: 'Pound', locale: 'en-GB', decimalSeparator: '.', thousandSeparator: ',', symbolPosition: 'before', decimalPlaces: 2 },
  CFA: { symbol: 'CFA', name: 'CFA Franc', locale: 'fr-CF', decimalSeparator: ',', thousandSeparator: ' ', symbolPosition: 'after', decimalPlaces: 0 },
  ZAR: { symbol: 'R', name: 'Rand', locale: 'en-ZA', decimalSeparator: ',', thousandSeparator: ' ', symbolPosition: 'before', decimalPlaces: 2 },
};

/**
 * Get currency symbol
 * @param {string} currencyCode - Currency code (e.g., 'EUR', 'USD')
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  return CURRENCIES[currencyCode]?.symbol || currencyCode;
};

/**
 * Format amount with currency
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @param {string} language - Language code ('pt' or 'en')
 * @returns {string} Formatted amount with currency
 */
export const formatCurrency = (amount, currencyCode = 'AOA', language = 'en') => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.AOA;
  const formattedAmount = amount.toLocaleString(currency.locale, {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  });
  
  if (currency.symbolPosition === 'before') {
    return `${currency.symbol} ${formattedAmount}`;
  }
  return `${formattedAmount} ${currency.symbol}`;
};

/**
 * Get default currency for workspace
 * @param {object} workspace - Workspace object
 * @returns {string} Default currency code
 */
export const getDefaultCurrency = (workspace) => {
  // Future: Read from workspace settings
  if (workspace?.settings?.currency) {
    return workspace.settings.currency;
  }
  
  // Fallback: Determine based on country/region
  // This will be enhanced when workspace settings are fully implemented
  return 'AOA'; // Default to Kwanza
};

/**
 * Get supported currencies list
 * @returns {Array} Array of currency objects with code, symbol, and name
 */
export const getSupportedCurrencies = () => {
  return Object.entries(CURRENCIES).map(([code, data]) => ({
    code,
    symbol: data.symbol,
    name: data.name,
  }));
};

/**
 * Validate currency code
 * @param {string} currencyCode - Currency code to validate
 * @returns {boolean} True if valid
 */
export const isValidCurrency = (currencyCode) => {
  return CURRENCIES.hasOwnProperty(currencyCode);
};