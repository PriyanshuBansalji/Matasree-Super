import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress } from '@/hooks/useApi';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Edit2, Trash2, Check, X, Loader2, ArrowLeft, Home, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import PageHelmet from '@/components/PageHelmet';

interface AddressFormData {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const emptyForm: AddressFormData = {
  name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false,
};

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry',
];

const AddressesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: addressesData, isLoading, refetch } = useAddresses();
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!isAuthenticated && !token) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const addresses = useMemo(() => {
    if (!addressesData) return [];
    const data = addressesData.data || [];
    return Array.isArray(data) ? data : [];
  }, [addressesData]);

  const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (address: any) => {
    setFormData({
      name: address.name || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      isDefault: address.isDefault || false,
    });
    setEditingId(address._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    if (!formData.phone.trim()) { toast.error('Phone number is required'); return; }
    if (!formData.addressLine1.trim()) { toast.error('Address is required'); return; }
    if (!formData.city.trim()) { toast.error('City is required'); return; }
    if (!formData.state.trim()) { toast.error('State is required'); return; }
    if (!formData.pincode.trim()) { toast.error('Pincode is required'); return; }
    if (!/^\d{6}$/.test(formData.pincode.trim())) { toast.error('Pincode must be 6 digits'); return; }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, '').slice(-10))) { toast.error('Phone must be 10 digits'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        isDefault: formData.isDefault,
      };

      if (editingId) {
        await updateAddressMutation.mutateAsync({ id: editingId, data: payload });
        toast.success('Address updated successfully!');
      } else {
        await addAddressMutation.mutateAsync(payload);
        toast.success('Address added successfully! 🎉');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAddressMutation.mutateAsync(id);
      toast.success('Address deleted');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.post(`/addresses/${id}/set-default`);
      toast.success('Default address updated');
      refetch();
    } catch (error: any) {
      toast.error('Failed to set default address');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title="My Addresses | Matasree Super Masale"
        description="Manage your saved delivery addresses on Matasree Super Masale."
        canonicalUrl="https://matasreesuper.com/addresses"
        noIndex={true}
      />
      <Navbar />
      <main id="main-content" className="page-enter container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full" aria-label="Go back">
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">My Addresses</h1>
              <p className="text-muted-foreground">Manage your delivery addresses</p>
            </div>
          </div>
          {!showForm && (
            <Button className="bg-gradient-spice hover:opacity-90 text-white font-bold" onClick={openAddForm}>
              <Plus className="w-4 h-4 mr-2" /> Add New Address
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-8 border-primary/30 shadow-lg animate-slide-up">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {editingId ? 'Edit Address' : 'Add New Address'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingId(null); }} aria-label="Close address form">
                  <X className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold mb-1.5 block">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-secondary/30 rounded-xl py-5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold mb-1.5 block">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-secondary/30 rounded-xl py-5"
                      required
                    />
                  </div>
                </div>

                {/* Address Line 1 */}
                <div>
                  <Label htmlFor="addressLine1" className="text-sm font-semibold mb-1.5 block">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="House/Flat No., Building, Street"
                    value={formData.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    className="bg-secondary/30 rounded-xl py-5"
                    required
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <Label htmlFor="addressLine2" className="text-sm font-semibold mb-1.5 block">Address Line 2 <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  <Input
                    id="addressLine2"
                    placeholder="Landmark, Area, Colony"
                    value={formData.addressLine2}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                    className="bg-secondary/30 rounded-xl py-5"
                  />
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-semibold mb-1.5 block">City *</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="bg-secondary/30 rounded-xl py-5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-semibold mb-1.5 block">State *</Label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full h-[44px] rounded-xl border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    >
                      <option value="">Select State</option>
                      {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="text-sm font-semibold mb-1.5 block">Pincode *</Label>
                    <Input
                      id="pincode"
                      placeholder="e.g. 400001"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="bg-secondary/30 rounded-xl py-5"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                {/* Default checkbox */}
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                    className="w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Set as default delivery address</span>
                </label>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="flex-1 rounded-xl py-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-spice text-white font-bold rounded-xl py-5"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Check className="w-4 h-4 mr-2" /> {editingId ? 'Update Address' : 'Save Address'}</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : addresses.length > 0 ? (
            addresses.map((address: any) => (
              <Card
                key={address._id}
                className={`relative transition-all duration-300 hover:-translate-y-1 ${address.isDefault
                    ? 'border-primary border-2 shadow-lg'
                    : 'hover:shadow-lg border-border'
                  }`}
              >
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-500 text-white">
                      <Check className="w-3 h-3 mr-1" /> Default
                    </Badge>
                  </div>
                )}

                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{address.name}</p>
                      <p className="text-sm text-muted-foreground">{address.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-6 text-sm text-foreground/80">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p className="font-medium">{address.city}, {address.state} - {address.pincode}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-border">
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSetDefault(address._id)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Set Default
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEditForm(address)} aria-label={`Edit address for ${address.name}`}>
                      <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(address._id)}
                      disabled={deletingId === address._id}
                      aria-label={`Delete address for ${address.name}`}
                    >
                      {deletingId === address._id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Trash2 className="w-4 h-4" aria-hidden="true" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : !showForm ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="pt-6 text-center py-16">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-12 h-12 text-primary/50" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-2">No Addresses Yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Add your first delivery address to start ordering your favorite spices.
                </p>
                <Button className="bg-gradient-spice hover:opacity-90 text-white font-bold px-8 py-6 rounded-xl text-lg" onClick={openAddForm}>
                  <Plus className="w-5 h-5 mr-2" /> Add Your First Address
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default AddressesPage;
