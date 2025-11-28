
import React, { useState } from 'react';
import { WebsiteSettings, SubscriptionTier, Coupon, User } from '../App';

interface SubscriptionCheckoutPageProps {
    settings: WebsiteSettings;
    tier: SubscriptionTier;
    currentUser: User | null;
    coupons: Coupon[];
    onBack: () => void;
    onConfirmPayment: (appliedCouponCode: string | null, finalPrice: number) => void;
}

const SubscriptionCheckoutPage: React.FC<SubscriptionCheckoutPageProps> = ({ 
    settings, 
    tier, 
    currentUser, 
    coupons, 
    onBack, 
    onConfirmPayment 
}) => {
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Price Calculations
    const basePrice = parseFloat(tier.price);
    
    const calculateDiscount = () => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'fixed') return Math.min(appliedCoupon.value, basePrice);
        return (basePrice * appliedCoupon.value) / 100;
    };

    const discount = calculateDiscount();
    const finalPrice = basePrice - discount;

    // Handlers
    const handleApplyCoupon = () => {
        setCouponError(null);
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        const coupon = coupons.find(c => c.code.toUpperCase() === code);
        
        if (!coupon) {
            setCouponError('Invalid coupon code.');
            return;
        }
        if (!coupon.isActive) {
            setCouponError('This coupon is no longer active.');
            return;
        }
        // Expiry check could go here
        
        setAppliedCoupon(coupon);
        setCouponError(null);
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
    };

    const handlePayment = () => {
        setIsProcessing(true);
        // Simulate processing delay for effect
        setTimeout(() => {
            // Open Razorpay Link
            if (tier.paymentLink) {
                window.open(tier.paymentLink, '_blank');
            }
            // Proceed to confirmation logic
            onConfirmPayment(appliedCoupon?.code || null, finalPrice);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans animate-fade-in">
            {/* Simple Secure Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <span className="font-bold text-gray-800 text-lg">Secure Checkout</span>
                    </div>
                    <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-12">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    
                    {/* Left Column: Order Details */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Account Info */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">1. Account Information</h2>
                            {currentUser ? (
                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                        {currentUser.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Logged in as</p>
                                        <p className="font-semibold text-gray-800">{currentUser.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                                    You are checking out as a guest. You will receive access details via email.
                                </div>
                            )}
                        </div>

                        {/* Plan Details Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">2. Plan Details</h2>
                            <div className={`border-2 rounded-xl overflow-hidden ${tier.highlightColor === 'gold' ? 'border-yellow-400' : 'border-primary'}`}>
                                <div className={`p-4 text-white ${tier.highlightColor === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-primary'}`}>
                                    <h3 className="font-bold text-lg">{tier.name}</h3>
                                    <p className="text-white/80 text-sm">{tier.description}</p>
                                </div>
                                <div className="p-6 bg-white">
                                    <ul className="space-y-3">
                                        {tier.features.map((feat, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Trust / Reviews */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 text-center">
                            <div className="flex justify-center mb-2">
                                {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-xl">★</span>)}
                            </div>
                            <p className="text-gray-600 italic">"This platform completely transformed how I learn digital marketing. The resources are top-notch!"</p>
                            <p className="text-sm font-bold text-gray-800 mt-2">- Rahul S., Pro Member</p>
                        </div>
                    </div>

                    {/* Right Column: Payment Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
                            
                            {/* Coupon Input */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Promo Code</label>
                                {appliedCoupon ? (
                                    <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-lg">
                                        <div>
                                            <span className="font-bold text-green-700 block">{appliedCoupon.code}</span>
                                            <span className="text-xs text-green-600">Applied successfully</span>
                                        </div>
                                        <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700 text-xl font-bold">&times;</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={couponInput} 
                                            onChange={e => setCouponInput(e.target.value)}
                                            placeholder="Enter code"
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        />
                                        <button 
                                            onClick={handleApplyCoupon} 
                                            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-3 border-t border-gray-100 pt-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Original Price</span>
                                    <span>₹{basePrice.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Discount</span>
                                        <span>- ₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                                    <span className="text-lg font-bold text-gray-800">Total</span>
                                    <span className="text-3xl font-extrabold text-primary">₹{finalPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Pay Button */}
                            <button 
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full bg-green-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-green-700 hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span>Pay ₹{finalPrice.toFixed(0)}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Secure 256-bit SSL Encrypted Payment
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default SubscriptionCheckoutPage;
