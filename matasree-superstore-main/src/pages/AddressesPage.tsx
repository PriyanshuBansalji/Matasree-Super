import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAddresses } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AddressesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: addressesData, isLoading } = useAddresses();
  const addresses = addressesData?.data?.addresses || [];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleAddNew = () => {
    toast.info('Add Address feature coming soon!');
  };

  const handleEdit = (addressId: string) => {
    toast.info('Edit Address feature coming soon!');
  };

  const handleDelete = (addressId: string) => {
    toast.info('Delete Address feature coming soon!');
  };

  const handleSetDefault = (addressId: string) => {
    setSelectedAddressId(addressId);
    toast.success('Address set as default');
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">My Addresses</h1>
            <p className="text-muted-foreground">Manage your delivery addresses</p>
          </div>
          <Button
            className="bg-gradient-spice hover:opacity-90 text-white"
            onClick={handleAddNew}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Address
          </Button>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
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
            addresses.map((address) => (
              <Card
                key={address._id}
                className={`relative transition-all duration-300 ${
                  selectedAddressId === address._id
                    ? 'border-primary border-2 shadow-lg'
                    : 'hover:shadow-lg'
                }`}
              >
                {selectedAddressId === address._id && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-500 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Default
                    </Badge>
                  </div>
                )}

                <CardContent className="pt-6">
                  {/* Address Type */}
                  <div className="mb-4">
                    <Badge variant="outline" className="capitalize">
                      {address.addressType || 'Other'}
                    </Badge>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-3 mb-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Recipient</p>
                      <p className="font-semibold text-foreground">{address.name}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                      <p className="text-foreground">{address.phone}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                      <p className="text-foreground text-sm">
                        {address.address}
                        {address.apartment && `, ${address.apartment}`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">City</p>
                        <p className="text-foreground">{address.city}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">State</p>
                        <p className="text-foreground">{address.state}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Postal Code</p>
                        <p className="text-foreground">{address.postalCode}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Country</p>
                        <p className="text-foreground">{address.country || 'India'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant={selectedAddressId === address._id ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSetDefault(address._id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {selectedAddressId === address._id ? 'Default' : 'Set Default'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address._id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(address._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="pt-6 text-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                  No Addresses Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Add your first delivery address to get started.
                </p>
                <Button
                  className="bg-gradient-spice hover:opacity-90 text-white"
                  onClick={handleAddNew}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressesPage;
