import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Filter, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseApp } from '@/contexts/SupabaseAppContext';

const MenuManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useSupabaseApp();
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Ice Cream Scoops',
    price: 0,
    description: ''
  });

  const categories = ['All', 'Ice Cream Scoops', 'Sundaes', 'Shakes', 'Toppings', 'Beverages'];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || newItem.price <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields with valid values",
        variant: "destructive"
      });
      return;
    }

    await addMenuItem(newItem);
    setNewItem({ name: '', category: 'Ice Cream Scoops', price: 0, description: '' });
    setShowAddForm(false);
  };

  const handleEditItem = (item: any) => {
    setEditingItem({ ...item });
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    if (!editingItem.name || !editingItem.category || editingItem.price <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields with valid values",
        variant: "destructive"
      });
      return;
    }

    await updateMenuItem(editingItem.id, editingItem);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: number) => {
    await deleteMenuItem(id);
  };

  const renderForm = (item: any, setItem: any, onSubmit: () => void, onCancel: () => void, title: string) => (
    <Card className="bg-white shadow-sm mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemName">Item Name *</Label>
            <Input
              id="itemName"
              value={item.name}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
              placeholder="Enter item name"
            />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={item.category} onValueChange={(value) => setItem({ ...item, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categories.filter(cat => cat !== 'All').map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="price">Price (₹) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={item.price}
              onChange={(e) => setItem({ ...item, price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={item.description}
              onChange={(e) => setItem({ ...item, description: e.target.value })}
              placeholder="Enter item description"
            />
          </div>
        </div>
        <div className="flex space-x-4 mt-6">
          <Button onClick={onSubmit} className="bg-green-500 hover:bg-green-600">
            <Save className="w-4 h-4 mr-2" />
            Save Item
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
          <p className="text-gray-600">Manage your ice cream menu items and inventory</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Add Item Form */}
      {showAddForm && renderForm(
        newItem,
        setNewItem,
        handleAddItem,
        () => setShowAddForm(false),
        "Add New Menu Item"
      )}

      {/* Edit Item Form */}
      {editingItem && renderForm(
        editingItem,
        setEditingItem,
        handleUpdateItem,
        () => setEditingItem(null),
        "Edit Menu Item"
      )}

      {/* Search and Filter Bar */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid - POS Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredItems.map((item) => {
          return (
            <Card key={item.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">₹{item.price}</div>
                    <p className="text-xs text-gray-600">{item.category}</p>
                  </div>

                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs"
                      onClick={() => handleEditItem(item)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Del
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No menu items found. {searchTerm ? 'Try adjusting your search criteria.' : 'Add your first menu item to get started.'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MenuManagement;
