import { useEffect, useState } from 'react';
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
import { ChevronLeft, Plus, Trash2, Edit, UtensilsCrossed, X } from 'lucide-react';
import { toast } from 'sonner';
import PageHelmet from '@/components/PageHelmet';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecipeRegion = 'North Indian' | 'South Indian' | 'Bengali' | 'Rajasthani' | 'Other';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  productTags: string[];
  region: RecipeRegion;
  image?: string;
  createdAt: string;
}

const REGIONS: RecipeRegion[] = ['North Indian', 'South Indian', 'Bengali', 'Rajasthani', 'Other'];

const REGION_COLORS: Record<RecipeRegion, string> = {
  'North Indian':  'bg-orange-100 text-orange-800',
  'South Indian':  'bg-green-100 text-green-800',
  'Bengali':       'bg-blue-100 text-blue-800',
  'Rajasthani':    'bg-yellow-100 text-yellow-800',
  'Other':         'bg-gray-100 text-gray-600',
};

const emptyForm = {
  title: '',
  description: '',
  ingredients: [] as string[],
  steps: [] as string[],
  productTags: [] as string[],
  region: 'North Indian' as RecipeRegion,
  image: '',
};

// ─── Dynamic list field (ingredients / steps / tags) ──────────────────────────

const ListField = ({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft('');
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <Button type="button" size="sm" onClick={add} className="bg-green-600 hover:bg-green-700 px-3">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-1 text-green-600 hover:text-red-500 transition-colors"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminRecipes = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  // Guard: admin only
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
    } else {
      fetchRecipes();
    }
  }, [user, navigate]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/recipes');
      const list = res?.data?.recipes ?? res?.data ?? [];
      setRecipes(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (recipe: Recipe) => {
    setFormData({
      title:       recipe.title,
      description: recipe.description,
      ingredients: [...recipe.ingredients],
      steps:       [...recipe.steps],
      productTags: [...recipe.productTags],
      region:      recipe.region,
      image:       recipe.image ?? '',
    });
    setEditingId(recipe._id);
    setShowForm(true);
    // scroll to form
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/admin/recipes/${id}`);
      toast.success('Recipe deleted');
      fetchRecipes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete recipe');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.region) {
      toast.error('Title, description and region are required');
      return;
    }

    // Build payload — strip empty image
    const payload = {
      ...formData,
      image: formData.image.trim() || undefined,
    };

    try {
      if (editingId) {
        await apiClient.put(`/admin/recipes/${editingId}`, payload);
        toast.success('Recipe updated');
      } else {
        await apiClient.post('/admin/recipes', payload);
        toast.success('Recipe created');
      }
      resetForm();
      fetchRecipes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save recipe');
    }
  };

  const setField = (key: keyof typeof emptyForm, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHelmet
        title="Admin: Recipes | Matasree Super Masale"
        description="Manage Indian recipes linked to spice products."
        canonicalUrl="https://matasreesuper.com/admin/recipes"
        noIndex={true}
      />

      <Navbar />

      <div className="container mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="h-8 w-8 text-green-600" />
                Manage Recipes
              </h1>
              <p className="text-gray-600 mt-0.5">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in the library
              </p>
            </div>
          </div>
          <Button
            onClick={() => { if (showForm && !editingId) { resetForm(); } else { resetForm(); setShowForm(true); } }}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            {showForm && !editingId ? 'Cancel' : 'Add Recipe'}
          </Button>
        </div>

        {/* ── Create / Edit Form ── */}
        {showForm && (
          <Card className="mb-8 border-l-4 border-l-green-600 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
              <CardTitle className="flex items-center justify-between">
                <span>{editingId ? 'Edit Recipe' : 'Add New Recipe'}</span>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setField('title', e.target.value)}
                    placeholder="e.g., Dal Makhani"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Region *</label>
                  <select
                    required
                    value={formData.region}
                    onChange={e => setField('region', e.target.value as RecipeRegion)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={e => setField('description', e.target.value)}
                    placeholder="A short description of this recipe..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image URL <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => setField('image', e.target.value)}
                    placeholder="https://example.com/recipe-photo.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="mt-3 h-32 rounded-lg object-cover border border-gray-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>

                {/* Ingredients */}
                <div className="md:col-span-2">
                  <ListField
                    label="Ingredients (press Enter or + to add)"
                    placeholder="e.g., 2 tbsp Matasree Garam Masala"
                    items={formData.ingredients}
                    onChange={items => setField('ingredients', items)}
                  />
                </div>

                {/* Steps */}
                <div className="md:col-span-2">
                  <ListField
                    label="Cooking Steps (press Enter or + to add)"
                    placeholder="e.g., Sauté onions until golden brown"
                    items={formData.steps}
                    onChange={items => setField('steps', items)}
                  />
                </div>

                {/* Product Tags */}
                <div className="md:col-span-2">
                  <ListField
                    label="Product Tags — link to spice products (press Enter or + to add)"
                    placeholder="e.g., garam-masala or Turmeric Powder"
                    items={formData.productTags}
                    onChange={items => setField('productTags', items)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Tags must match the product name or slug. Used to show related recipes on product pages.
                  </p>
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    {editingId ? 'Update Recipe' : 'Create Recipe'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Recipes Table ── */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle>All Recipes ({recipes.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
                <p className="text-gray-500">Loading recipes…</p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-16">
                <UtensilsCrossed className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">No recipes yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Click "Add Recipe" to create your first recipe and link it to your products.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Recipe</TableHead>
                      <TableHead className="font-semibold">Region</TableHead>
                      <TableHead className="font-semibold">Ingredients</TableHead>
                      <TableHead className="font-semibold">Product Tags</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipes.map((recipe) => (
                      <TableRow key={recipe._id} className="hover:bg-gray-50 border-b align-top">
                        <TableCell className="min-w-[200px]">
                          <div className="flex items-start gap-3">
                            {recipe.image ? (
                              <img
                                src={recipe.image}
                                alt={recipe.title}
                                className="h-12 w-16 object-cover rounded-lg border border-gray-200 flex-shrink-0 mt-0.5"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="h-12 w-16 bg-green-50 rounded-lg border border-green-100 flex items-center justify-center flex-shrink-0">
                                <UtensilsCrossed className="w-5 h-5 text-green-300" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">{recipe.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 max-w-[220px]">
                                {recipe.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={REGION_COLORS[recipe.region]}>
                            {recipe.region}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {recipe.ingredients.length > 0 ? (
                            <span>{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {recipe.productTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {recipe.productTags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-medium px-2 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {recipe.productTags.length > 3 && (
                                <span className="text-[10px] text-gray-400">+{recipe.productTags.length - 3} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(recipe)}
                              aria-label={`Edit ${recipe.title}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(recipe._id)}
                              aria-label={`Delete ${recipe.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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

export default AdminRecipes;
