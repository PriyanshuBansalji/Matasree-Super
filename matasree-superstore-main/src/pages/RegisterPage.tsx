import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Check, Phone, ArrowRight, RotateCcw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import PageHelmet from '@/components/PageHelmet';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, isLoading } = useAuthStore();
  const [step, setStep] = useState<'details' | 'email-otp' | 'mobile-otp' | 'confirmation'>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; mobile?: string; emailOtp?: string; mobileOtp?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean; mobile?: boolean }>({});
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [mobileOtpTimer, setMobileOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const emailOtpRef = useRef<HTMLInputElement>(null);
  const mobileOtpRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
  });

  const [otpData, setOtpData] = useState({
    emailOtp: '',
    mobileOtp: '',
  });

  // Email OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailOtpTimer]);

  // Mobile OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mobileOtpTimer > 0) {
      interval = setInterval(() => {
        setMobileOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mobileOtpTimer]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const isStrongPassword = (password: string) => {
    if (!password) return false;
    return (
      password.length >= 12 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^a-zA-Z\d]/.test(password)
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name as keyof typeof touched]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, formData[name as keyof typeof formData]);
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    if (name === 'name') {
      if (!value) {
        newErrors.name = 'Name is required';
      } else if (value.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      } else {
        delete newErrors.name;
      }
    }

    if (name === 'email') {
      if (!value) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }

    if (name === 'password') {
      if (!value) {
        newErrors.password = 'Password is required';
      } else if (value.length < 12) {
        newErrors.password = 'Password must be at least 12 characters';
      } else if (!/[a-z]/.test(value)) {
        newErrors.password = 'Password must contain lowercase letters';
      } else if (!/[A-Z]/.test(value)) {
        newErrors.password = 'Password must contain uppercase letters';
      } else if (!/\d/.test(value)) {
        newErrors.password = 'Password must contain numbers';
      } else if (!/[^a-zA-Z\d]/.test(value)) {
        newErrors.password = 'Password must contain special characters (!@#$%^&*)';
      } else {
        delete newErrors.password;
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (value !== formData.password) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    if (name === 'mobile') {
      if (!value) {
        newErrors.mobile = 'Mobile number is required';
      } else if (!validateMobile(value)) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      } else {
        delete newErrors.mobile;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ name: true, email: true, password: true, confirmPassword: true, mobile: true });

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.mobile) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: 'Error',
        description: 'Please agree to the terms and conditions',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (!isStrongPassword(formData.password)) {
      toast({
        title: 'Weak Password',
        description: 'Password must contain: 12+ characters, uppercase, lowercase, numbers, and special characters',
        variant: 'destructive',
      });
      return;
    }

    if (!validateMobile(formData.mobile)) {
      toast({
        title: 'Invalid Mobile',
        description: 'Please enter a valid 10-digit mobile number',
        variant: 'destructive',
      });
      return;
    }

    // Send email OTP
    try {
      setOtpLoading(true);
      const response = await apiClient.sendEmailOtp(formData.email);
      console.log('Email OTP Response:', response.data);

      toast({
        title: 'Email OTP Sent',
        description: `Verification code sent to ${formData.email}`,
      });
      setEmailOtpTimer(300); // 5 minutes
      setStep('email-otp');
      emailOtpRef.current?.focus();
    } catch (error: any) {
      console.error('Email OTP Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send email OTP';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    try {
      setOtpLoading(true);
      await apiClient.resendEmailOtp(formData.email);

      toast({
        title: 'Email OTP Resent',
        description: `Verification code resent to ${formData.email}`,
      });
      setEmailOtpTimer(300);
      setOtpData((prev) => ({ ...prev, emailOtp: '' }));
      emailOtpRef.current?.focus();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resend email OTP',
        variant: 'destructive',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpData.emailOtp || otpData.emailOtp.length !== 6) {
      setErrors((prev) => ({ ...prev, emailOtp: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    try {
      setOtpLoading(true);
      await apiClient.verifyEmailOtp(formData.email, otpData.emailOtp);

      toast({
        title: 'Email Verified',
        description: 'Your email has been verified successfully',
      });

      // BYPASS: Skip mobile OTP verification (Twilio not configured)
      // Go directly to confirmation step
      toast({
        title: 'Mobile Verification Skipped',
        description: 'Mobile verification bypassed for development',
      });

      setStep('confirmation');
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, emailOtp: 'Invalid OTP. Please try again.' }));
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Invalid email OTP',
        variant: 'destructive',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendMobileOtp = async () => {
    try {
      setOtpLoading(true);
      await apiClient.resendMobileOtp(formData.mobile);

      toast({
        title: 'Mobile OTP Resent',
        description: `Verification code resent to ${formData.mobile}`,
      });
      setMobileOtpTimer(300);
      setOtpData((prev) => ({ ...prev, mobileOtp: '' }));
      mobileOtpRef.current?.focus();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resend mobile OTP',
        variant: 'destructive',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpData.mobileOtp || otpData.mobileOtp.length !== 6) {
      setErrors((prev) => ({ ...prev, mobileOtp: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    try {
      setOtpLoading(true);
      await apiClient.verifyMobileOtp(formData.mobile, otpData.mobileOtp);

      toast({
        title: 'Mobile Verified',
        description: 'Your mobile number has been verified successfully',
      });
      setStep('confirmation');
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, mobileOtp: 'Invalid OTP. Please try again.' }));
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Invalid mobile OTP',
        variant: 'destructive',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      await register(formData.name, formData.email, formData.password);
      toast({
        title: 'Success',
        description: 'Account created successfully! Redirecting to home...',
      });
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration',
        variant: 'destructive',
      });
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Excellent'];
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-green-600'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <PageHelmet
        title="Register | Matasree Super Masale"
        description="Create your Matasree Super Masale account to track orders, save addresses, and enjoy exclusive offers."
        canonicalUrl="https://matasreesuper.com/register"
        noIndex={true}
      />
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-100/30 to-orange-100/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-red-100/20 to-orange-100/30 rounded-full blur-3xl -translate-x-1/3 translate-y-1/2" />
      </div>

      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center relative z-10">
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 sm:gap-4 px-4 mb-10 flex-wrap w-full">
          <div className={`flex items-center gap-1 sm:gap-2 ${step === 'details' ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'details' ? 'bg-amber-100 border-2 border-amber-600' : (step === 'email-otp' || step === 'mobile-otp' || step === 'confirmation') ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'}`}>
              {step !== 'details' ? <Check className="w-4 h-4 text-green-600" /> : '1'}
            </div>
            <span className="hidden sm:inline text-sm">Details</span>
          </div>

          <div className={`flex items-center gap-1 sm:gap-2 ${step === 'email-otp' ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'email-otp' ? 'bg-amber-100 border-2 border-amber-600' : (step === 'mobile-otp' || step === 'confirmation') ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'}`}>
              {(step === 'mobile-otp' || step === 'confirmation') ? <Check className="w-4 h-4 text-green-600" /> : '2'}
            </div>
            <span className="hidden sm:inline text-sm">Email</span>
          </div>

          <div className={`flex items-center gap-1 sm:gap-2 ${step === 'mobile-otp' ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'mobile-otp' ? 'bg-amber-100 border-2 border-amber-600' : step === 'confirmation' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100'}`}>
              {step === 'confirmation' ? <Check className="w-4 h-4 text-green-600" /> : '3'}
            </div>
            <span className="hidden sm:inline text-sm">Mobile</span>
          </div>

          <div className={`flex items-center gap-1 sm:gap-2 ${step === 'confirmation' ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'confirmation' ? 'bg-amber-100 border-2 border-amber-600' : 'bg-gray-100'}`}>
              4
            </div>
            <span className="hidden sm:inline text-sm">Confirm</span>
          </div>
        </div>

        <Card className="w-full max-w-lg shadow-2xl backdrop-blur-sm border border-white/50">
          {/* Step 1: Details */}
          {step === 'details' && (
            <>
              <CardHeader className="space-y-2 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif">Create Account</CardTitle>
                <CardDescription className="text-base">
                  Step 1: Enter your details
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Full Name
                      {touched.name && !errors.name && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                      <Input
                        id="name"
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`pl-12 py-6 border-2 transition-all ${touched.name && errors.name
                            ? 'border-red-500 bg-red-50'
                            : touched.name && !errors.name
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        disabled={isLoading || otpLoading}
                        aria-describedby={touched.name && errors.name ? 'register-name-error' : undefined}
                        aria-invalid={!!(touched.name && errors.name)}
                      />
                    </div>
                    {touched.name && errors.name && (
                      <div id="register-name-error" className="flex items-center gap-2 text-red-600 text-sm" role="alert">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Email Address
                      {touched.email && !errors.email && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`pl-12 py-6 border-2 transition-all ${touched.email && errors.email
                            ? 'border-red-500 bg-red-50'
                            : touched.email && !errors.email
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        disabled={isLoading || otpLoading}
                        aria-describedby={touched.email && errors.email ? 'register-email-error' : undefined}
                        aria-invalid={!!(touched.email && errors.email)}
                      />
                    </div>
                    {touched.email && errors.email && (
                      <div id="register-email-error" className="flex items-center gap-2 text-red-600 text-sm" role="alert">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Mobile Field */}
                  <div className="space-y-2">
                    <label htmlFor="mobile" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Mobile Number
                      {touched.mobile && !errors.mobile && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                      <Input
                        id="mobile"
                        type="tel"
                        name="mobile"
                        placeholder="9876543210"
                        value={formData.mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={10}
                        className={`pl-12 py-6 border-2 transition-all ${touched.mobile && errors.mobile
                            ? 'border-red-500 bg-red-50'
                            : touched.mobile && !errors.mobile
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        disabled={isLoading || otpLoading}
                        aria-describedby={touched.mobile && errors.mobile ? 'register-mobile-error' : undefined}
                        aria-invalid={!!(touched.mobile && errors.mobile)}
                      />
                    </div>
                    {touched.mobile && errors.mobile && (
                      <div id="register-mobile-error" className="flex items-center gap-2 text-red-600 text-sm" role="alert">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {errors.mobile}
                      </div>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Password
                      {touched.password && !errors.password && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`pl-12 pr-12 py-6 border-2 transition-all ${touched.password && errors.password
                            ? 'border-red-500 bg-red-50'
                            : touched.password && !errors.password
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        disabled={isLoading || otpLoading}
                        aria-describedby={touched.password && errors.password ? 'register-password-error' : undefined}
                        aria-invalid={!!(touched.password && errors.password)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <div id="register-password-error" className="flex items-center gap-2 text-red-600 text-sm" role="alert">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {errors.password}
                      </div>
                    )}

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="space-y-2 pt-2">
                        <div className="flex gap-1">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 flex-1 rounded-full transition-all ${i < passwordStrength ? strengthColor[passwordStrength - 1] : 'bg-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">
                            Password strength: <span className="font-semibold">{strengthLabel[Math.max(0, passwordStrength - 1)]}</span>
                          </p>
                          {isStrongPassword(formData.password) && (
                            <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Strong
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mt-3 p-2 bg-gray-50 rounded">
                          <p className="font-semibold mb-2">Password Requirements:</p>
                          <p className={`flex items-center gap-2 ${formData.password.length >= 12 ? 'text-green-600' : 'text-red-600'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${formData.password.length >= 12 ? 'bg-green-100' : 'bg-red-100'}`}>
                              {formData.password.length >= 12 ? '✓' : '✕'}
                            </span>
                            At least 12 characters
                          </p>
                          <p className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'bg-green-100' : 'bg-red-100'}`}>
                              {/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? '✓' : '✕'}
                            </span>
                            Uppercase & Lowercase
                          </p>
                          <p className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${/\d/.test(formData.password) ? 'bg-green-100' : 'bg-red-100'}`}>
                              {/\d/.test(formData.password) ? '✓' : '✕'}
                            </span>
                            One number
                          </p>
                          <p className={`flex items-center gap-2 ${/[^a-zA-Z\d]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${/[^a-zA-Z\d]/.test(formData.password) ? 'bg-green-100' : 'bg-red-100'}`}>
                              {/[^a-zA-Z\d]/.test(formData.password) ? '✓' : '✕'}
                            </span>
                            Special character (!@#$%^&*)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Confirm Password
                      {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`pl-12 pr-12 py-6 border-2 transition-all ${touched.confirmPassword && errors.confirmPassword
                            ? 'border-red-500 bg-red-50'
                            : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        disabled={isLoading || otpLoading}
                        aria-describedby={touched.confirmPassword && errors.confirmPassword ? 'register-confirm-password-error' : undefined}
                        aria-invalid={!!(touched.confirmPassword && errors.confirmPassword)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                      </button>
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <div id="register-confirm-password-error" className="flex items-center gap-2 text-red-600 text-sm" role="alert">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <label className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-5 h-5 rounded accent-amber-600 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the <span className="font-semibold">Terms of Service</span> and <span className="font-semibold">Privacy Policy</span>
                    </span>
                  </label>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-70 flex items-center justify-center"
                    disabled={
                      isLoading ||
                      otpLoading ||
                      !agreedToTerms ||
                      !isStrongPassword(formData.password) ||
                      (touched.name && !!errors.name) ||
                      (touched.email && !!errors.email) ||
                      (touched.mobile && !!errors.mobile) ||
                      (touched.password && !!errors.password) ||
                      (touched.confirmPassword && !!errors.confirmPassword)
                    }
                  >
                    {isLoading || otpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Sign In Link */}
                  <div className="text-center text-sm pt-4 border-t border-gray-200">
                    <span className="text-gray-600">Already have an account? </span>
                    <Link to="/login" className="text-amber-600 hover:text-amber-700 font-semibold hover:underline">
                      Sign in here
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 2: Email OTP Verification */}
          {step === 'email-otp' && (
            <>
              <CardHeader className="space-y-2 bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif">Verify Email</CardTitle>
                <CardDescription className="text-base">
                  Step 2: Enter OTP sent to {formData.email}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-8">
                <form onSubmit={handleVerifyEmailOtp} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      We've sent a 6-digit code to your email. Please enter it below.
                    </p>
                  </div>

                  {/* Email OTP Field */}
                  <div className="space-y-2">
                    <label htmlFor="emailOtp" className="text-sm font-semibold text-gray-700">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                      <Input
                        ref={emailOtpRef}
                        id="emailOtp"
                        type="text"
                        placeholder="000000"
                        value={otpData.emailOtp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpData((prev) => ({ ...prev, emailOtp: value }));
                          setErrors((prev) => ({ ...prev, emailOtp: '' }));
                        }}
                        maxLength={6}
                        className="pl-12 py-6 border-2 border-blue-300 hover:border-blue-400 text-center text-2xl tracking-widest font-bold"
                        disabled={otpLoading}
                        aria-describedby={errors.emailOtp ? 'register-email-otp-error' : undefined}
                        aria-invalid={!!errors.emailOtp}
                      />
                    </div>
                    {errors.emailOtp && (
                      <div id="register-email-otp-error" className="flex items-center gap-2 text-red-600 text-sm" role="alert">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {errors.emailOtp}
                      </div>
                    )}
                  </div>

                  {/* Timer */}
                  <div className="text-center">
                    {emailOtpTimer > 0 ? (
                      <p className="text-sm text-gray-600">
                        OTP expires in{' '}
                        <span className="font-semibold text-amber-600">
                          {Math.floor(emailOtpTimer / 60)}:{emailOtpTimer % 60 < 10 ? '0' : ''}{emailOtpTimer % 60}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-red-600">OTP Expired</p>
                    )}
                  </div>

                  {/* Resend Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-6"
                    onClick={handleResendEmailOtp}
                    disabled={otpLoading || emailOtpTimer > 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resend OTP {emailOtpTimer > 0 && `(${emailOtpTimer}s)`}
                  </Button>

                  {/* Verify Button */}
                  <Button
                    type="submit"
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-70"
                    disabled={otpLoading || otpData.emailOtp.length !== 6}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Email
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Back Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStep('details');
                      setOtpData((prev) => ({ ...prev, emailOtp: '' }));
                      setErrors((prev) => ({ ...prev, emailOtp: '' }));
                    }}
                  >
                    Back
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 3: Mobile OTP Verification */}
          {step === 'mobile-otp' && (
            <>
              <CardHeader className="space-y-2 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif">Verify Mobile</CardTitle>
                <CardDescription className="text-base">
                  Step 3: Enter OTP sent to {formData.mobile}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-8">
                <form onSubmit={handleVerifyMobileOtp} className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800">
                      We've sent a 6-digit code to your mobile number. Please enter it below.
                    </p>
                  </div>

                  {/* Mobile OTP Field */}
                  <div className="space-y-2">
                    <label htmlFor="mobileOtp" className="text-sm font-semibold text-gray-700">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600" />
                      <Input
                        ref={mobileOtpRef}
                        id="mobileOtp"
                        type="text"
                        placeholder="000000"
                        value={otpData.mobileOtp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpData((prev) => ({ ...prev, mobileOtp: value }));
                          setErrors((prev) => ({ ...prev, mobileOtp: '' }));
                        }}
                        maxLength={6}
                        className="pl-12 py-6 border-2 border-purple-300 hover:border-purple-400 text-center text-2xl tracking-widest font-bold"
                        disabled={otpLoading}
                        aria-describedby={errors.mobileOtp ? 'register-mobile-otp-error' : undefined}
                        aria-invalid={!!errors.mobileOtp}
                      />
                    </div>
                    {errors.mobileOtp && (
                      <div id="register-mobile-otp-error" className="flex items-center gap-2 text-red-600 text-sm" role="alert">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {errors.mobileOtp}
                      </div>
                    )}
                  </div>

                  {/* Timer */}
                  <div className="text-center">
                    {mobileOtpTimer > 0 ? (
                      <p className="text-sm text-gray-600">
                        OTP expires in{' '}
                        <span className="font-semibold text-purple-600">
                          {Math.floor(mobileOtpTimer / 60)}:{mobileOtpTimer % 60 < 10 ? '0' : ''}{mobileOtpTimer % 60}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-red-600">OTP Expired</p>
                    )}
                  </div>

                  {/* Resend Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-6"
                    onClick={handleResendMobileOtp}
                    disabled={otpLoading || mobileOtpTimer > 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resend OTP {mobileOtpTimer > 0 && `(${mobileOtpTimer}s)`}
                  </Button>

                  {/* Verify Button */}
                  <Button
                    type="submit"
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-70"
                    disabled={otpLoading || otpData.mobileOtp.length !== 6}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Mobile
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Back Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStep('email-otp');
                      setOtpData((prev) => ({ ...prev, mobileOtp: '' }));
                      setErrors((prev) => ({ ...prev, mobileOtp: '' }));
                    }}
                  >
                    Back
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirmation' && (
            <>
              <CardHeader className="space-y-2 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif">Almost Done!</CardTitle>
                <CardDescription className="text-base">
                  Step 4: Create your account
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-8">
                <div className="space-y-6">
                  {/* Verification Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-900">Email Verified</p>
                        <p className="text-xs text-green-700">{formData.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-900">Mobile Verified</p>
                        <p className="text-xs text-green-700">{formData.mobile}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Details Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Name:</span> {formData.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Email:</span> {formData.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Mobile:</span> {formData.mobile}
                    </p>
                  </div>

                  {/* Create Account Button */}
                  <Button
                    onClick={handleCompleteRegistration}
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-70"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>

                  {/* Back Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStep('mobile-otp');
                    }}
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
