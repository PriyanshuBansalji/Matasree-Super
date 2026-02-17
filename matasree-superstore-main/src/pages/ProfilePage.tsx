import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Edit2 } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Avatar */}
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-spice flex items-center justify-center text-white">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                  <p className="text-muted-foreground">Member since {new Date().getFullYear()}</p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <p className="text-lg font-medium text-foreground">{user.name}</p>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <p className="text-lg font-medium text-foreground">{user.email}</p>
                </div>

                {/* Phone */}
                {user.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    <p className="text-lg font-medium text-foreground">{user.phone}</p>
                  </div>
                )}

                {/* User ID */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">User ID</label>
                  <p className="text-sm font-mono text-muted-foreground">{user.id?.slice(0, 12)}...</p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="pt-4 border-t">
                <Button className="bg-gradient-spice hover:opacity-90 text-white">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/orders')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/addresses')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Manage Addresses
                </Button>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-bold text-foreground">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Spent</span>
                  <span className="font-bold text-foreground">₹0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loyalty Points</span>
                  <span className="font-bold text-foreground">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
