import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, ExternalLink } from 'lucide-react';

export default function ExpenseHistory({ expenses, language }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const categoryLabels = {
    Food: language === 'pt' ? 'Alimentação' : 'Food',
    Transport: language === 'pt' ? 'Transporte' : 'Transport',
    Home: language === 'pt' ? 'Casa' : 'Home',
    Business: language === 'pt' ? 'Negócio' : 'Business',
    Services: language === 'pt' ? 'Serviços' : 'Services',
    Software: language === 'pt' ? 'Software' : 'Software',
    Personal: language === 'pt' ? 'Pessoal' : 'Personal',
    Other: language === 'pt' ? 'Outro' : 'Other'
  };

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.note?.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || e.category === filterCategory;
    const matchType = filterType === 'all' || e.type === filterType;
    return matchSearch && matchCategory && matchType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder={language === 'pt' ? 'Pesquisar...' : 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'pt' ? 'Todas' : 'All'}</SelectItem>
            {Object.keys(categoryLabels).map(cat => (
              <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'pt' ? 'Todos' : 'All'}</SelectItem>
            <SelectItem value="personal">{language === 'pt' ? 'Pessoal' : 'Personal'}</SelectItem>
            <SelectItem value="business">{language === 'pt' ? 'Negócio' : 'Business'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {language === 'pt' ? 'Nenhuma despesa encontrada' : 'No expenses found'}
          </p>
        ) : (
          filtered.map(exp => (
            <Card key={exp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{categoryLabels[exp.category]}</span>
                      <Badge variant={exp.type === 'business' ? 'default' : 'secondary'} className="text-xs">
                        {exp.type === 'business' ? (language === 'pt' ? 'Negócio' : 'Business') : (language === 'pt' ? 'Pessoal' : 'Personal')}
                      </Badge>
                    </div>
                    {exp.note && <p className="text-sm text-muted-foreground mb-2">{exp.note}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(exp.date).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US')}</span>
                      {exp.receipt_url && (
                        <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                          <FileText className="w-3 h-3" />
                          {language === 'pt' ? 'Ver recibo' : 'View receipt'}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">-€{exp.amount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}