import React from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminShopSelector({ shops, selected, onSelect }) {
  return (
    <Select value={selected || 'all'} onValueChange={onSelect}>
      <SelectTrigger className="w-full sm:w-64 bg-card border-border rounded-xl h-11">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <SelectValue placeholder="Selecionar loja" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        <SelectItem value="all">Todas as Lojas</SelectItem>
        {shops.map(shop => (
          <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}