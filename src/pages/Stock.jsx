import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../components/LanguageContext';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import MobileMenuButton from '../components/dashboard/MobileMenuButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductDialog from '../components/stock/ProductDialog';
import { Package, Plus, AlertTriangle, Search, Edit, Minus, AlertCircle, Filter, TrendingUp, DollarSign, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AccessGuard from '../components/AccessGuard';

export default function Stock() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReduceDialog, setShowReduceDialog] = useState(false);
  const [reduceProduct, setReduceProduct] = useState(null);
  const [reduceAmount, setReduceAmount] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const user = await api.auth.me();
      const workspace = await api.entities.Workspace.filter({ owner_email: user.email });
      if (workspace.length > 0) {
        return await api.entities.Product.filter({ workspace_id: workspace[0].id });
      }
      return [];
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(language === 'pt' ? 'Stock atualizado!' : 'Stock updated!');
    }
  });

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setShowProductDialog(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductDialog(true);
  };

  const handleReduceStock = (product) => {
    setReduceProduct(product);
    setReduceAmount('');
    setShowReduceDialog(true);
  };

  const confirmReduceStock = async () => {
    if (!reduceProduct || !reduceAmount) return;

    const amount = parseFloat(reduceAmount);
    if (amount <= 0 || amount > reduceProduct.quantity_available) {
      toast.error(language === 'pt' ? 'Quantidade inválida' : 'Invalid quantity');
      return;
    }

    updateProductMutation.mutate({
      id: reduceProduct.id,
      data: {
        ...reduceProduct,
        quantity_available: reduceProduct.quantity_available - amount
      }
    });

    setShowReduceDialog(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'low_stock' && product.quantity_available <= product.minimum_stock_level) ||
                          (filterStatus === 'out_of_stock' && product.quantity_available === 0) ||
                          (filterStatus === 'in_stock' && product.quantity_available > product.minimum_stock_level);
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.product_name.localeCompare(b.product_name);
    if (sortBy === 'quantity') return b.quantity_available - a.quantity_available;
    if (sortBy === 'value') return (b.quantity_available * b.unit_cost) - (a.quantity_available * a.unit_cost);
    return 0;
  });

  const lowStockProducts = filteredProducts.filter(
    p => p.quantity_available <= p.minimum_stock_level
  );

  const getCategoryLabel = (category) => {
    const labels = {
      raw_material: language === 'pt' ? 'Matéria-prima' : 'Raw Material',
      equipment: language === 'pt' ? 'Equipamento' : 'Equipment',
      consumable: language === 'pt' ? 'Consumível' : 'Consumable',
      finished_product: language === 'pt' ? 'Produto Acabado' : 'Finished Product',
      other: language === 'pt' ? 'Outro' : 'Other'
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        
        
        <div className="p-4 lg:pt-8 md:p-8 md:pt-8 flex-1 flex items-center justify-center">
          <div className="text-center text-blue-300 text-sm">
            {language === 'pt' ? 'A carregar...' : 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccessGuard page="Stock">
    <div className="flex h-screen bg-background">
      
      

      <div className="p-4 lg:pt-8 md:p-8 md:pt-8 flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  {language === 'pt' ? 'Stock' : 'Stock'}
                </h1>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {language === 'pt' 
                    ? 'Controla os teus produtos e consumíveis' 
                    : 'Track your products and consumables'}
                </p>
              </div>
              <Button onClick={handleNewProduct} className="bg-primary hover:bg-primary/90 h-8 text-xs px-3 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                {language === 'pt' ? 'Novo Produto' : 'New Product'}
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { icon: Package, bg: 'bg-primary/15', color: 'text-primary', label: language === 'pt' ? 'Total' : 'Total', value: products.length, valueColor: 'text-foreground' },
                { icon: AlertTriangle, bg: 'bg-orange-500/15', color: 'text-orange-400', label: language === 'pt' ? 'Stock Baixo' : 'Low Stock', value: lowStockProducts.length, valueColor: 'text-orange-400' },
                { icon: PackageOpen, bg: 'bg-red-500/15', color: 'text-red-400', label: language === 'pt' ? 'Esgotados' : 'Out of Stock', value: products.filter(p => p.quantity_available === 0).length, valueColor: 'text-red-400' },
                { icon: DollarSign, bg: 'bg-green-500/15', color: 'text-green-400', label: language === 'pt' ? 'Valor Total' : 'Total Value', value: `€${products.reduce((sum, p) => sum + (p.quantity_available * (p.unit_cost || 0)), 0).toFixed(0)}`, valueColor: 'text-green-400' },
              ].map((k, i) => (
                <div key={i} className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md ${k.bg} flex items-center justify-center flex-shrink-0`}>
                    <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{k.label}</p>
                    <p className={`text-sm font-bold tabular-nums leading-tight ${k.valueColor}`}>{k.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <Card className="bg-orange-500/10 border-orange-500/30 p-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-orange-400">
                      {language === 'pt' ? 'Alerta de Stock Baixo' : 'Low Stock Alert'}
                    </h3>
                    <p className="text-xs text-orange-300 mt-0.5">
                      {lowStockProducts.length} {language === 'pt' ? 'produto(s) abaixo do nível mínimo' : 'product(s) below minimum level'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Search + Filters */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'pt' ? 'Pesquisar produtos...' : 'Search products...'}
                  className="pl-8 h-8 text-xs bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-36 h-8 text-xs bg-card border-border text-foreground">
                    <SelectValue placeholder={language === 'pt' ? 'Categoria' : 'Category'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'pt' ? 'Todas' : 'All'}</SelectItem>
                    <SelectItem value="raw_material">{language === 'pt' ? 'Matéria-prima' : 'Raw Material'}</SelectItem>
                    <SelectItem value="equipment">{language === 'pt' ? 'Equipamento' : 'Equipment'}</SelectItem>
                    <SelectItem value="consumable">{language === 'pt' ? 'Consumível' : 'Consumable'}</SelectItem>
                    <SelectItem value="finished_product">{language === 'pt' ? 'Produto Acabado' : 'Finished Product'}</SelectItem>
                    <SelectItem value="other">{language === 'pt' ? 'Outro' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 h-8 text-xs bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'pt' ? 'Todos' : 'All'}</SelectItem>
                    <SelectItem value="in_stock">{language === 'pt' ? 'Em Stock' : 'In Stock'}</SelectItem>
                    <SelectItem value="low_stock">{language === 'pt' ? 'Stock Baixo' : 'Low Stock'}</SelectItem>
                    <SelectItem value="out_of_stock">{language === 'pt' ? 'Esgotado' : 'Out of Stock'}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 h-8 text-xs bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">{language === 'pt' ? 'Nome' : 'Name'}</SelectItem>
                    <SelectItem value="quantity">{language === 'pt' ? 'Quantidade' : 'Quantity'}</SelectItem>
                    <SelectItem value="value">{language === 'pt' ? 'Valor' : 'Value'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Area */}
            {filteredProducts.length === 0 ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Table header skeleton */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border bg-card">
                  <div className="col-span-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Produto' : 'Product'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'pt' ? 'Categoria' : 'Category'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Disponível' : 'Available'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Mínimo' : 'Minimum'}</div>
                  <div className="col-span-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">{language === 'pt' ? 'Ações' : 'Actions'}</div>
                </div>
                <div className="py-7 text-center">
                  <Package className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">
                    {searchTerm
                      ? (language === 'pt' ? 'Nenhum produto encontrado' : 'No products found')
                      : (language === 'pt' ? 'Nenhum produto adicionado ainda' : 'No products added yet')}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleNewProduct} size="sm" className="bg-primary hover:bg-primary/90 h-7 text-xs gap-1.5">
                      <Plus className="w-3 h-3" />
                      {language === 'pt' ? 'Adicionar Produto' : 'Add Product'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredProducts.map((product) => {
                  const isLowStock = product.quantity_available <= product.minimum_stock_level;
                  const stockPercentage = (product.quantity_available / product.minimum_stock_level) * 100;

                  return (
                    <div
                      key={product.id}
                      className={`rounded-lg border p-3 transition-all ${
                        isLowStock 
                          ? 'border-orange-500/30 bg-orange-500/5' 
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{product.product_name}</h3>
                          {product.sku && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{product.sku}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {getCategoryLabel(product.category)}
                        </Badge>
                        {isLowStock && (
                          <Badge className="text-[10px] h-5 px-1.5 bg-orange-500/20 text-orange-400 border-orange-500/30">
                            <AlertCircle className="w-2.5 h-2.5 mr-1" />
                            {language === 'pt' ? 'Stock Baixo' : 'Low Stock'}
                          </Badge>
                        )}
                      </div>

                      {product.supplier && (
                        <p className="text-[10px] text-muted-foreground mb-2 truncate">{product.supplier}</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {language === 'pt' ? 'Disponível' : 'Available'}
                          </span>
                          <span className={`text-xs font-semibold ${isLowStock ? 'text-orange-400' : 'text-foreground'}`}>
                            {product.quantity_available} {product.unit}
                          </span>
                        </div>
                        
                        <div className="w-full bg-background rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isLowStock ? 'bg-orange-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">
                            {language === 'pt' ? 'Mínimo' : 'Minimum'}: {product.minimum_stock_level}
                          </span>
                          {product.unit_cost > 0 && (
                            <span className="text-muted-foreground">
                              €{product.unit_cost.toFixed(2)}/{product.unit}
                            </span>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-[10px]"
                          onClick={() => handleReduceStock(product)}
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          {language === 'pt' ? 'Reduzir' : 'Reduce'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      <ProductDialog
        open={showProductDialog}
        onClose={() => setShowProductDialog(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
        product={selectedProduct}
      />

      <Dialog open={showReduceDialog} onOpenChange={setShowReduceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'pt' ? 'Reduzir Stock' : 'Reduce Stock'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'pt' ? 'Produto' : 'Product'}</Label>
              <p className="text-sm text-foreground mt-1">{reduceProduct?.product_name}</p>
              <p className="text-xs text-blue-400">
                {language === 'pt' ? 'Disponível' : 'Available'}: {reduceProduct?.quantity_available} {reduceProduct?.unit}
              </p>
            </div>
            <div>
              <Label>{language === 'pt' ? 'Quantidade a Reduzir' : 'Quantity to Reduce'}</Label>
              <Input
                type="number"
                min="0"
                max={reduceProduct?.quantity_available}
                step="0.01"
                value={reduceAmount}
                onChange={(e) => setReduceAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReduceDialog(false)}>
                {language === 'pt' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button onClick={confirmReduceStock}>
                {language === 'pt' ? 'Confirmar' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AccessGuard>
  );
}