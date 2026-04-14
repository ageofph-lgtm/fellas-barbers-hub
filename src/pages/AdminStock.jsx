import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Plus, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShopSelector from '../components/admin/ShopSelector';

const CATEGORIES = ['pomada', 'shampoo', 'oleo', 'cera', 'aftershave', 'acessorio', 'outro'];

export default function AdminStock() {
  const [selectedShop, setSelectedShop] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'pomada', price: '', cost: '', stock_quantity: '', min_stock: 5, barbershop_id: '' });
  const queryClient = useQueryClient();

  const { data: shops = [] } = useQuery({ queryKey: ['shops'], queryFn: () => base44.entities.Barbershop.list() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });

  const filtered = selectedShop === 'all' ? products : products.filter(p => p.barbershop_id === selectedShop);
  const lowStock = filtered.filter(p => p.stock_quantity <= (p.min_stock || 5));

  const handleSave = async () => {
    const data = { ...form, price: parseFloat(form.price), cost: parseFloat(form.cost), stock_quantity: parseInt(form.stock_quantity), min_stock: parseInt(form.min_stock) };
    if (editingProduct) {
      await base44.entities.Product.update(editingProduct.id, data);
    } else {
      await base44.entities.Product.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setShowForm(false);
    setEditingProduct(null);
    setForm({ name: '', category: 'pomada', price: '', cost: '', stock_quantity: '', min_stock: 5, barbershop_id: '' });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">{filtered.length} produtos</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminShopSelector shops={shops} selected={selectedShop} onSelect={setSelectedShop} />
          <Button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Produto
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold text-red-400">Stock Baixo!</p>
            <p className="text-sm text-red-300">{lowStock.map(p => p.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">{editingProduct ? 'Editar' : 'Novo'} Produto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border rounded-xl" />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary border-border rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.barbershop_id} onValueChange={v => setForm({ ...form, barbershop_id: v })}>
              <SelectTrigger className="bg-secondary border-border rounded-xl"><SelectValue placeholder="Loja" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {shops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Preço (€)" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="bg-secondary border-border rounded-xl" />
            <Input placeholder="Custo (€)" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="bg-secondary border-border rounded-xl" />
            <Input placeholder="Quantidade" type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} className="bg-secondary border-border rounded-xl" />
            <Input placeholder="Stock mínimo" type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} className="bg-secondary border-border rounded-xl" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingProduct(null); }} className="rounded-xl border-border">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground rounded-xl">Guardar</Button>
          </div>
        </motion.div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product, i) => {
          const isLow = product.stock_quantity <= (product.min_stock || 5);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-card border rounded-2xl p-5 ${isLow ? 'border-red-500/30' : 'border-border'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLow ? 'bg-red-500/20' : 'bg-primary/20'}`}>
                    <Package className={`w-5 h-5 ${isLow ? 'text-red-400' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setForm({
                      name: product.name, category: product.category || 'pomada',
                      price: product.price, cost: product.cost || '',
                      stock_quantity: product.stock_quantity, min_stock: product.min_stock || 5,
                      barbershop_id: product.barbershop_id,
                    });
                    setShowForm(true);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Preço</p>
                  <p className="font-semibold text-foreground">€{product.price}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stock</p>
                  <p className={`font-semibold ${isLow ? 'text-red-400' : 'text-foreground'}`}>{product.stock_quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mínimo</p>
                  <p className="font-semibold text-foreground">{product.min_stock || 5}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}