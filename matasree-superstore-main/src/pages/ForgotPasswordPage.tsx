import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';

const ForgotPasswordPage = () => {
    const { toast } = useToast();
    const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [errors, setErrors] = useState<{ email?: string; otp?: string; password?: string; confirmPassword?: string }>({});

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isStrongPassword = (password: string) => {
        return (
            password.length >= 12 &&
            /[a-z]/.test(password) &&
            /[A-Z]/.test(password) &&
            /\d/.test(password) &&
            /[^a-zA-Z\d]/.test(password)
        );
    };

    // Timer effect
    useState(() => {
        let interval: NodeJS.Timeout;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    });

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setErrors({ email: 'Email is required' });
            return;
        }

        if (!validateEmail(email)) {
            setErrors({ email: 'Please enter a valid email address' });
            return;
        }

        try {
            setLoading(true);
            await apiClient.sendPasswordResetOtp(email);

            toast({
                title: 'OTP Sent',
                description: `Verification code sent to ${email}`,
            });

            setStep('otp');
            setOtpTimer(300); // 5 minutes
            setErrors({});
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to send OTP. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setLoading(true);
            await apiClient.sendPasswordResetOtp(email);

            toast({
                title: 'OTP Resent',
                description: `Verification code resent to ${email}`,
            });

            setOtpTimer(300);
            setOtp('');
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to resend OTP',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }

        try {
            setLoading(true);
            await apiClient.verifyPasswordResetOtp(email, otp);

            toast({
                title: 'OTP Verified',
                description: 'Please enter your new password',
            });

            setStep('reset');
            setErrors({});
        } catch (error: any) {
            setErrors({ otp: 'Invalid OTP. Please try again.' });
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Invalid OTP',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }

        if (!isStrongPassword(newPassword)) {
            setErrors({
                password: 'Password must contain: 12+ characters, uppercase, lowercase, numbers, and special characters',
            });
            return;
        }

        try {
            setLoading(true);
            await apiClient.resetPassword(email, otp, newPassword);

            toast({
                title: 'Success',
                description: 'Password reset successfully',
            });

            setStep('success');
            setErrors({});
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to reset password',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
            {/* Decorative background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-100/30 to-orange-100/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-red-100/20 to-orange-100/30 rounded-full blur-3xl -translate-x-1/3 translate-y-1/2" />
            </div>

            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center relative z-10">
                <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm border border-white/50">
                    {/* Step 1: Enter Email */}
                    {step === 'email' && (
                        <>
                            <CardHeader className="space-y-2 bg-gradient-to-br from-amber-50 to-orange-50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-3xl font-serif">Forgot Password?</CardTitle>
                                <CardDescription className="text-base">
                                    Enter your email address and we'll send you a verification code
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-8">
                                <form onSubmit={handleSendOtp} className="space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setErrors({});
                                                }}
                                                className={`pl-12 py-6 border-2 transition-all ${errors.email
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-gray-200 hover:border-amber-300'
                                                    }`}
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.email && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full py-6 text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-70"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Sending OTP...
                                            </>
                                        ) : (
                                            'Send Verification Code'
                                        )}
                                    </Button>

                                    <div className="text-center text-sm pt-4 border-t border-gray-200">
                                        <Link
                                            to="/login"
                                            className="text-amber-600 hover:text-amber-700 font-semibold hover:underline inline-flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back to Login
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === 'otp' && (
                        <>
                            <CardHeader className="space-y-2 bg-gradient-to-br from-blue-50 to-cyan-50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-3xl font-serif">Verify Code</CardTitle>
                                <CardDescription className="text-base">
                                    Enter the 6-digit code sent to {email}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-8">
                                <form onSubmit={handleVerifyOtp} className="space-y-5">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            We've sent a verification code to your email. Please check your inbox.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="otp" className="text-sm font-semibold text-gray-700">
                                            Verification Code
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="otp"
                                                type="text"
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    setOtp(value);
                                                    setErrors({});
                                                }}
                                                maxLength={6}
                                                className="py-6 border-2 border-blue-300 hover:border-blue-400 text-center text-2xl tracking-widest font-bold"
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.otp && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.otp}
                                            </div>
                                        )}
                                    </div>

                                    {otpTimer > 0 && (
                                        <p className="text-center text-sm text-gray-600">
                                            OTP expires in <span className="font-bold text-amber-600">{formatTime(otpTimer)}</span>
                                        </p>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-70"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify Code'
                                        )}
                                    </Button>

                                    {otpTimer === 0 && (
                                        <Button
                                            type="button"
                                            onClick={handleResendOtp}
                                            variant="outline"
                                            className="w-full py-6 text-base font-semibold"
                                            disabled={loading}
                                        >
                                            Resend Code
                                        </Button>
                                    )}

                                    <div className="text-center text-sm pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep('email');
                                                setOtp('');
                                                setErrors({});
                                            }}
                                            className="text-blue-600 hover:text-blue-700 font-semibold hover:underline inline-flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Change Email
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === 'reset' && (
                        <>
                            <CardHeader className="space-y-2 bg-gradient-to-br from-green-50 to-emerald-50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <Lock className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-3xl font-serif">Reset Password</CardTitle>
                                <CardDescription className="text-base">
                                    Enter your new password
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-8">
                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    {/* New Password */}
                                    <div className="space-y-2">
                                        <label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                                            <Input
                                                id="newPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => {
                                                    setNewPassword(e.target.value);
                                                    setErrors({});
                                                }}
                                                className={`pl-12 pr-12 py-6 border-2 transition-all ${errors.password
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-gray-200 hover:border-green-300'
                                                    }`}
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.password}
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                        <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    setErrors({});
                                                }}
                                                className={`pl-12 pr-12 py-6 border-2 transition-all ${errors.confirmPassword
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-gray-200 hover:border-green-300'
                                                    }`}
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.confirmPassword}
                                            </div>
                                        )}
                                    </div>

                                    {/* Password Requirements */}
                                    <div className="text-xs text-gray-600 space-y-1 p-3 bg-gray-50 rounded">
                                        <p className="font-semibold mb-2">Password Requirements:</p>
                                        <p className={newPassword.length >= 12 ? 'text-green-600' : 'text-gray-600'}>
                                            ✓ At least 12 characters
                                        </p>
                                        <p className={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-600'}>
                                            ✓ Uppercase & Lowercase letters
                                        </p>
                                        <p className={/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-600'}>
                                            ✓ At least one number
                                        </p>
                                        <p className={/[^a-zA-Z\d]/.test(newPassword) ? 'text-green-600' : 'text-gray-600'}>
                                            ✓ Special character (!@#$%^&*)
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full py-6 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-70"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Resetting Password...
                                            </>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <>
                            <CardHeader className="space-y-2 bg-gradient-to-br from-green-50 to-emerald-50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-3xl font-serif">Password Reset!</CardTitle>
                                <CardDescription className="text-base">
                                    Your password has been reset successfully
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-8">
                                <div className="space-y-5">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-sm text-green-800 text-center">
                                            You can now log in with your new password
                                        </p>
                                    </div>

                                    <Link to="/login">
                                        <Button className="w-full py-6 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all hover:shadow-lg">
                                            Go to Login
                                        </Button>
                                    </Link>
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

export default ForgotPasswordPage;
