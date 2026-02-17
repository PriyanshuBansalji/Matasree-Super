import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface PartnershipForm {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  areaOfInterest: string;
  cities: string[];
  businessExperience: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  ifscCode: string;
  gstNumber: string;
  businessRegistration: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  additionalInfo: string;
}

const PartnershipPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  const [formData, setFormData] = useState<PartnershipForm>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    businessName: '',
    businessType: '',
    areaOfInterest: '',
    cities: [],
    businessExperience: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    ifscCode: '',
    gstNumber: '',
    businessRegistration: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    additionalInfo: '',
  });

  const [citiesInput, setCitiesInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login first to apply for partnership');
      navigate('/login?redirect=/partnership');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCitiesInput(e.target.value);
  };

  const addCity = () => {
    if (citiesInput.trim() && !formData.cities.includes(citiesInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        cities: [...prev.cities, citiesInput.trim()],
      }));
      setCitiesInput('');
    }
  };

  const removeCity = (city: string) => {
    setFormData((prev) => ({
      ...prev,
      cities: prev.cities.filter((c) => c !== city),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.cities.length === 0) {
      toast.error('Please add at least one city');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.submitPartnershipApplication(formData);

      setApplicationId(response.data.data._id);
      setSubmitted(true);
      toast.success('Application submitted successfully! Check your email for confirmation.');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit application';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center border-t-4 border-primary">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">Application Submitted!</h1>
                <p className="text-lg text-foreground/70 mb-6">
                  Thank you for your interest in becoming a Matasree Super distributor.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-8 text-left">
                  <p className="text-sm text-blue-800">
                    <strong>Application ID:</strong> <span className="font-mono font-bold">{applicationId}</span>
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    We have sent a confirmation email to <strong>{formData.email}</strong>. Our team will review
                    your application within 3-5 business days.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-left">
                    <p className="text-sm text-amber-800 font-semibold mb-2">Next Steps:</p>
                    <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                      <li>We'll verify your business documents</li>
                      <li>Our team will contact you with updates</li>
                      <li>Upon approval, you'll receive partnership details</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 flex gap-4 justify-center">
                  <Button onClick={() => navigate('/')} variant="outline">
                    Back to Home
                  </Button>
                  <Button onClick={() => navigate('/profile')} className="bg-primary hover:bg-primary/90">
                    View My Profile
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <p className="text-sm text-foreground/60">
                    For immediate assistance, contact us at:
                    <br />
                    📧 <a href="mailto:info@matasreesuper.com" className="text-primary hover:underline">
                      info@matasreesuper.com
                    </a>
                    <br />
                    📱 <a href="tel:7505675163" className="text-primary hover:underline">
                      7505675163
                    </a>
                    {' / '}
                    <a href="tel:6937475400" className="text-primary hover:underline">
                      6937475400
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">Become a Matasree Partner</h1>
              <p className="text-lg text-foreground/70">
                Join our growing network of distributors across India
              </p>
              <p className="text-sm text-primary/80 mt-2">
                * Est. 2008 | 20+ Years Heritage | 50K+ Happy Customers
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-xl p-8 border-t-4 border-primary">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</span>
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Full Name *</label>
                      <Input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Email *</label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Phone Number *</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="10-digit phone number"
                        maxLength={10}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Country</label>
                      <Input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="India"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="pt-4 border-t">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</span>
                    Business Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Business Name *</label>
                      <Input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                        placeholder="Your business name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Business Type *</label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select business type</option>
                        <option value="sole-proprietorship">Sole Proprietorship</option>
                        <option value="partnership">Partnership</option>
                        <option value="pvt-ltd">Private Limited</option>
                        <option value="llp">LLP</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Area of Interest *</label>
                      <Input
                        type="text"
                        name="areaOfInterest"
                        value={formData.areaOfInterest}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Spices, Masalas, etc."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Years of Experience *</label>
                      <Input
                        type="number"
                        name="businessExperience"
                        value={formData.businessExperience}
                        onChange={handleChange}
                        required
                        placeholder="Number of years"
                        min="0"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Cities Selection */}
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-foreground mb-2">Target Cities *</label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        type="text"
                        value={citiesInput}
                        onChange={handleCitiesChange}
                        placeholder="Enter city name"
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCity();
                          }
                        }}
                      />
                      <Button type="button" onClick={addCity} variant="outline">
                        Add City
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.cities.map((city) => (
                        <div
                          key={city}
                          className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {city}
                          <button
                            type="button"
                            onClick={() => removeCity(city)}
                            className="hover:bg-primary/80 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {formData.cities.length === 0 && (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Please add at least one city
                      </p>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div className="pt-4 border-t">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</span>
                    Address Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">Address *</label>
                      <Input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        placeholder="Street address"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">City *</label>
                      <Input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        placeholder="City"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">State *</label>
                      <Input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        placeholder="State"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Pincode *</label>
                      <Input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        required
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Banking Information */}
                <div className="pt-4 border-t">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">4</span>
                    Banking & Tax Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Bank Account Holder *</label>
                      <Input
                        type="text"
                        name="bankAccountHolder"
                        value={formData.bankAccountHolder}
                        onChange={handleChange}
                        required
                        placeholder="Account holder name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Bank Account Number *</label>
                      <Input
                        type="text"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleChange}
                        required
                        placeholder="Account number"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">IFSC Code *</label>
                      <Input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        required
                        placeholder="IFSC code"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">GST Number *</label>
                      <Input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        required
                        placeholder="GST number"
                        className="w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">Business Registration Number</label>
                      <Input
                        type="text"
                        name="businessRegistration"
                        value={formData.businessRegistration}
                        onChange={handleChange}
                        placeholder="Optional: Business registration number"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="pt-4 border-t">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">5</span>
                    Additional Information
                  </h2>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Tell us more about your business</label>
                    <textarea
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      placeholder="Why do you want to become a Matasree partner? What are your goals?"
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/')}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Footer Information */}
            <div className="mt-12 text-center text-foreground/70 text-sm">
              <p>
                For questions about the partnership program, contact us at{' '}
                <a href="mailto:info@matasreesuper.com" className="text-primary hover:underline">
                  info@matasreesuper.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PartnershipPage;
