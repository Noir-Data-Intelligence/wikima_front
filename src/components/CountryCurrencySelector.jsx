import { useLanguage } from './LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function CountryCurrencySelector({ country, currency, onCountryChange, onCurrencyChange, showCurrencyOverride = false }) {
  const { language } = useLanguage();

  const countries = [
    { code: 'Angola', name: language === 'pt' ? 'Angola' : 'Angola', currency: 'AOA', flag: '🇦🇴' },
    { code: 'Portugal', name: language === 'pt' ? 'Portugal' : 'Portugal', currency: 'EUR', flag: '🇵🇹' },
    { code: 'Brazil', name: language === 'pt' ? 'Brasil' : 'Brazil', currency: 'BRL', flag: '🇧🇷' },
    { code: 'USA', name: language === 'pt' ? 'Estados Unidos' : 'United States', currency: 'USD', flag: '🇺🇸' },
    { code: 'United Kingdom', name: language === 'pt' ? 'Reino Unido' : 'United Kingdom', currency: 'GBP', flag: '🇬🇧' }
  ];

  const currencies = [
    { code: 'AOA', name: 'Kwanza Angolano', symbol: 'Kz', flag: '🇦🇴' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', flag: '🇧🇷' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' }
  ];

  const handleCountryChange = (countryCode) => {
    const selectedCountry = countries.find(c => c.code === countryCode);
    onCountryChange(countryCode);
    if (selectedCountry && onCurrencyChange) {
      onCurrencyChange(selectedCountry.currency);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{language === 'pt' ? 'País' : 'Country'}</Label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder={language === 'pt' ? 'Selecionar país...' : 'Select country...'} />
          </SelectTrigger>
          <SelectContent>
            {countries.map(c => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCurrencyOverride && (
        <div>
          <Label>{language === 'pt' ? 'Moeda (personalizar)' : 'Currency (override)'}</Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(c => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}