import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/api/client';
import { useLanguage } from '../LanguageContext';
import { toast } from 'sonner';

export default function ProductDialog({ open, onClose, onSuccess, product = null }) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'consumable',
    quantity_available: 0,
    minimum_stock_level: 10,
    unit_cost: 0,
    supplier: '',
    unit: 'unit',
    sku: '',
    notes: '',
    status: 'active',
    notify_low_stock: true
  });

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        category: product.category || 'consumable',
        quantity_available: product.quantity_available || 0,
        minimum_stock_level: product.minimum_stock_level || 10,
        unit_cost: product.unit_cost || 0,
        supplier: product.supplier || '',
        unit: product.unit || 'unit',
        sku: product.sku || '',
        notes: product.notes || '',
        status: product.status || 'active',
        notify_low_stock: product.notify_low_stock !== undefined ? product.notify_low_stock : true
      });
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await api.auth.me();
      const workspace = await api.entities.Workspace.filter({ owner_email: user.email });
      
      if (workspace.length === 0) {
        toast.error(language === 'pt' ? 'Workspace não encontrado' : 'Workspace not found');
        return;
      }

      const productData = {
        ...formData,
        workspace_id: workspace[0].id,
        quantity_available: parseFloat(formData.quantity_available),
        minimum_stock_level: parseFloat(formData.minimum_stock_level),
        unit_cost: parseFloat(formData.unit_cost)
      };
      
      // Remove notify_low_stock from productData if not in schema
      delete productData.notify_low_stock;

      if (product) {
        await api.entities.Product.update(product.id, productData);
        toast.success(language === 'pt' ? 'Produto atualizado!' : 'Product updated!');
      } else {
        await api.entities.Product.create(productData);
        toast.success(language === 'pt' ? 'Produto criado!' : 'Product created!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(language === 'pt' ? 'Erro ao guardar produto' : 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'product', label: language === 'pt' ? 'Produto' : 'Product' },
    { value: 'consumable', label: language === 'pt' ? 'Consumível' : 'Consumable' },
    { value: 'office_material', label: language === 'pt' ? 'Material de Escritório' : 'Office Material' },
    { value: 'equipment', label: language === 'pt' ? 'Equipamento' : 'Equipment' },
    { value: 'digital_asset', label: language === 'pt' ? 'Ativo Digital' : 'Digital Asset' },
    { value: 'service_item', label: language === 'pt' ? 'Item de Serviço' : 'Service Item' }
  ];

  const units = [
    { value: 'unit', label: language === 'pt' ? 'Unidade' : 'Unit' },
    { value: 'pack', label: language === 'pt' ? 'Pacote' : 'Pack' },
    { value: 'box', label: language === 'pt' ? 'Caixa' : 'Box' },
    { value: 'kg', label: 'Kg' },
    { value: 'liters', label: language === 'pt' ? 'Litros' : 'Liters' },
    { value: 'hours', label: language === 'pt' ? 'Horas' : 'Hours' },
    { value: 'service_item', label: language === 'pt' ? 'Item de Serviço' : 'Service Item' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-lg">
            {product 
              ? (language === 'pt' ? 'Editar Produto' : 'Edit Product')
              : (language === 'pt' ? 'Novo Produto' : 'New Product')
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">{language === 'pt' ? 'Nome do Produto' : 'Product Name'} *</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder={language === 'pt' ? 'Ex: Papel A4' : 'Ex: A4 Paper'}
                className="h-9"
                required
              />
            </div>

            <div>
              <Label className="text-xs">{language === 'pt' ? 'Categoria' : 'Category'}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">{language === 'pt' ? 'SKU/Código' : 'SKU/Code'}</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU-001"
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs">{language === 'pt' ? 'Quantidade' : 'Quantity'} *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity_available}
                onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
                className="h-9"
                required
              />
            </div>

            <div>
              <Label className="text-xs">{language === 'pt' ? 'Stock Mínimo' : 'Min Stock'} *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimum_stock_level}
                onChange={(e) => setFormData({ ...formData, minimum_stock_level: e.target.value })}
                className="h-9"
                required
              />
            </div>

            <div>
              <Label className="text-xs">{language === 'pt' ? 'Custo Unitário' : 'Unit Cost'}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                placeholder="0.00"
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs">{language === 'pt' ? 'Unidade' : 'Unit'}</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">{language === 'pt' ? 'Fornecedor (opcional)' : 'Supplier (optional)'}</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder={language === 'pt' ? 'Nome do fornecedor' : 'Supplier name'}
                className="h-9"
              />
            </div>

            <div className="col-span-2">
              <Label className="text-xs">{language === 'pt' ? 'Notas' : 'Notes'}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={language === 'pt' ? 'Notas adicionais...' : 'Additional notes...'}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {loading
                ? (language === 'pt' ? 'A guardar...' : 'Saving...')
                : (language === 'pt' ? 'Guardar' : 'Save')
              }
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-9">
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}