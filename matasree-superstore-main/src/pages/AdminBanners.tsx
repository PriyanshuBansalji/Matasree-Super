import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, Plus, Trash2, Edit, ImagePlay, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHelmet from '@/components/PageHelmet';

interface SeasonalBanner {
  _id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaLink: string;
  ctaText: string;
  activeFrom: string;
  activeTo: string;
}

const emptyFormData = {
  image: '',
  title: '',
  subtitle: '',
  ctaLink: '',
  ctaText: '',
  activeFrom: '',
  activeTo: '',
};

const getImageUrl = (path: string | null | undefined): string => {
  if (!path || !path.trim()) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
  return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
};

/** Format an ISO date string to the value format required by datetime-local inputs */
const toDatetimeLocal = (isoString: string): string => {
  if (!isoString) return '';
  try {
    // Trim off seconds/milliseconds to match datetime-local format: "YYYY-MM-DDTHH:MM"
    return new Date(isoString).toISOString().slice(0, 16);
  } catch {
    return '';
  }
};

const AdminBanners = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [banners, setBanners] = useState<SeasonalBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyFormData });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchBanners();
  }, [user, navigate]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSeasonalBanners();
      const bannerList = response?.data ?? [];
      setBanners(Array.isArray(bannerList) ? bannerList : []);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image || !formData.title || !formData.ctaLink || !formData.ctaText || !formData.activeFrom || !formData.activeTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await apiClient.put(`/admin/banners/${editingId}`, formData);
        toast.success('Banner updated successfully');
      } else {
        await apiClient.post('/admin/banners', formData);
        toast.success('Banner created successfully');
      }

      setFormData({ ...emptyFormData });
      setEditingId(null);
      setShowForm(false);
      fetchBanners();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleEdit = (banner: SeasonalBanner) => {
    setFormData({
      image: banner.image,
      title: banner.title,
      subtitle: banner.subtitle || '',
      ctaLink: banner.ctaLink,
      ctaText: banner.ctaText,
      activeFrom: toDatetimeLocal(banner.activeFrom),
      activeTo: toDatetimeLocal(banner.activeTo),
    });
    setEditingId(banner._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;

    try {
      await apiClient.delete(`/admin/banners/${id}`);
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete banner');
    }
  };

  const handleCancel = () => {
    setFormData({ ...emptyFormData });
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    const fd = new FormData();
    fd.append('image', file);

    setIsUploading(true);
    try {
      const res: any = await apiClient.uploadImage(fd);
      const imageUrl = res?.data?.imageUrl ?? res?.imageUrl;
      if (!imageUrl) throw new Error('No URL returned');
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getBannerStatus = (activeFrom: string, activeTo: string) => {
    const now = new Date();
    const from = new Date(activeFrom);
    const to = new Date(activeTo);

    if (now >= from && now <= to) {
      return { variant: 'default' as const, label: 'Active', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
    }
    if (now < from) {
      return { variant: 'secondary' as const, label: 'Scheduled', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' };
    }
    return { variant: 'secondary' as const, label: 'Expired', className: 'bg-gray-100 text-gray-500 hover:bg-gray-100' };
  };

  const formatDate = (isoString: string): string => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHelmet
        title="Admin: Banners | Matasree Super Masale"
        description="Manage seasonal promotional banners on Matasree Super Masale admin panel."
        canonicalUrl="https://matasreesuper.com/admin/banners"
        noIndex={true}
      />

      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-2">
                <ImagePlay className="h-8 w-8 text-purple-600" />
                Manage Banners
              </h1>
              <p className="text-gray-600">Total: {banners.length} banner{banners.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) handleCancel();
            }}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Banner'}
          </Button>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <Card className="mb-8 border-l-4 border-l-purple-600 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle>
                {editingId ? 'Edit Banner' : 'Add New Banner'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Image URL + Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Banner Image *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/banner.jpg"
                    />
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      {isUploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Upload</>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Paste a URL or click Upload to choose a file (JPEG / PNG / WebP, max 5 MB)
                  </p>
                  {formData.image && (
                    <div className="mt-3">
                      <img
                        src={formData.image}
                        alt="Banner preview"
                        className="h-32 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display = 'block';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Diwali Special Offers"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subtitle <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Up to 30% off on premium spices"
                  />
                </div>

                {/* CTA Link */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CTA Link *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="/products or https://..."
                  />
                </div>

                {/* CTA Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CTA Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Shop Now"
                  />
                </div>

                {/* Active From */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Active From *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.activeFrom}
                    onChange={(e) => setFormData({ ...formData, activeFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Active To */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Active To *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.activeTo}
                    onChange={(e) => setFormData({ ...formData, activeTo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {editingId ? 'Update Banner' : 'Create Banner'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Banners Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle>All Banners ({banners.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading banners...</p>
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-12">
                <ImagePlay className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-600 text-lg font-medium">No banners found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Click "Add Banner" to create your first seasonal promotional banner.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="font-semibold">Title</TableHead>
                      <TableHead className="font-semibold">Active From</TableHead>
                      <TableHead className="font-semibold">Active To</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => {
                      const status = getBannerStatus(banner.activeFrom, banner.activeTo);
                      return (
                        <TableRow key={banner._id} className="hover:bg-gray-50 border-b">
                          <TableCell className="font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                              {banner.image && (
                                <img
                                  src={getImageUrl(banner.image)}
                                  alt={banner.title}
                                  className="h-10 w-16 object-cover rounded border border-gray-200 flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <p className="font-semibold">{banner.title}</p>
                                {banner.subtitle && (
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{banner.subtitle}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(banner.activeFrom)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(banner.activeTo)}
                          </TableCell>
                          <TableCell>
                            <Badge className={status.className}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(banner)}
                                aria-label={`Edit banner: ${banner.title}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(banner._id)}
                                aria-label={`Delete banner: ${banner.title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminBanners;
