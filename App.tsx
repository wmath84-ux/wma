
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductShowcase from './components/ProductShowcase';
import Services, { ServiceItem } from './components/Services';
import AboutUs from './components/AboutUs';
import Faq, { FaqItem } from './components/Faq';
import Footer from './components/Footer';
import TrustBadges from './components/TrustBadges';
import Congratulations from './components/Congratulations';
import ProductDetailPage from './components/ProductDetailPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import FeaturedProducts from './components/FeaturedProducts';
import PurchasedProducts from './components/PurchasedProducts';
import CoursePlayer from './components/CoursePlayer';
import EbookReader from './components/EbookReader';
import PolicyPage from './components/PolicyPage';
import AuthPage from './components/auth/AuthPage';
import WishlistPage from './components/FavouritesPage';
import CartSidebar from './components/CartSidebar';
import QuickViewModal from './components/QuickViewModal';
import PaymentModal from './components/PaymentModal';
import UpcomingFeatures, { UpcomingFeatureItem } from './components/UpcomingFeatures';
import SubscriptionSuccessModal from './components/SubscriptionSuccessModal';
import LatestNews from './components/LatestNews';
import ComingSoonModal from './components/ComingSoonModal';
import BlogModal from './components/Prerequisites';
import { FreeProductsModal, AnnouncementsModal } from './components/ContentModals';
import AnnouncementDetail from './components/AnnouncementDetail';
import SubscriptionPage from './components/SubscriptionPage';
import SubscriptionCheckoutPage from './components/SubscriptionCheckoutPage';

// NOTE: Firebase imports removed to prevent "Service not available" crashes.
// The app now runs in "Local Mode" using browser storage.

// --- SAFETY & UTILS ---

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to catch crashes and prevent White Screen of Death
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center font-sans">
          <div className="max-w-lg bg-white p-8 rounded-xl shadow-2xl border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">The application encountered an unexpected error. This is likely due to storage limits or a temporary glitch.</p>
            
            {this.state.error?.message && (
                <div className="bg-gray-100 p-3 rounded text-left mb-6 overflow-auto max-h-32 text-xs font-mono text-gray-700 border border-gray-200">
                    Error: {this.state.error.message}
                </div>
            )}

            <div className="flex flex-col gap-3">
                <button onClick={() => window.location.reload()} className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-900 font-semibold transition-colors">
                Reload Page
                </button>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full bg-white border border-red-200 text-red-600 px-4 py-3 rounded-lg hover:bg-red-50 font-semibold transition-colors">
                Reset App Data (Fixes Storage Issues)
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">Warning: Resetting app data will clear all products and settings saved in your browser.</p>
          </div>
        </div>
      );
    }

    // FIX: Explicitly cast 'this' to any to avoid "Property 'props' does not exist" error in some TS environments
    return (this as any).props.children;
  }
}

// Safe LocalStorage Wrapper
const safeSetItem = (key: string, value: any) => {
    try {
        const serializedState = JSON.stringify(value);
        localStorage.setItem(key, serializedState);
    } catch (err: any) {
        console.error(`Error saving state to localStorage for key "${key}":`, err);
        // Check for quota exceeded error
        if (
            err.name === 'QuotaExceededError' || 
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
            err.code === 22
        ) {
             alert(`⚠️ Storage Full!\n\nThe browser cannot save more data. \n1. Try deleting old products or images.\n2. Use Image URLs instead of pasting images directly to save space.`);
        }
    }
};

// Interface for uploaded product files with specific types
export type ProductFileType = 'youtube' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'link' | 'ebook';
export interface ProductFile {
  id: string;
  name: string;
  type: ProductFileType;
  url: string; // For uploads, this is a Base64 data URL. For links, it's the URL.
  content?: string; // For rich text e-book content (HTML)
}

// Interface for a course module, now supporting nested modules
export interface CourseModule {
  id: string;
  title: string;
  files: ProductFile[];
  modules: CourseModule[]; // For nested modules
  isLocked?: boolean; // New: If true, needs individual purchase or subscription
  individualPrice?: string; // New: e.g. "13"
  paymentLink?: string; // New: Specific link for this chapter
}

// New interface for price history
export interface PriceHistoryEntry {
    date: string; // YYYY-MM-DD
    price: number;
}

// Core product structure without rating
export interface Product {
  id: number;
  imageSeed: string;
  images: string[]; // First image is the primary thumbnail.
  title: string;
  description: string;
  longDescription: string;
  features: string[];
  price: string;
  salePrice?: string;
  salePriceExpiry?: string; // ISO Date String for expiration
  category?: string;
  department?: 'Men' | 'Women' | 'Unisex';
  inStock?: boolean;
  isVisible?: boolean; // To hide/show products from the store
  manualRating?: number | null;
  sku?: string;
  tags?: string[];
  dimensions?: string; 
  fileFormat?: string;
  courseContent?: CourseModule[];
  aspectRatio?: string;
  priceHistory?: PriceHistoryEntry[];
  isFree?: boolean;
  couponCode?: string;
  paymentLink: string; // Specific Razorpay Payment Page URL for this product (REQUIRED)
  wishlistCount?: number; // Analytics: How many people added to wishlist
  viewCount?: number; // Analytics: How many people viewed the details
}

// Review structure
export interface Review {
    name: string;
    rating: number;
    comment: string;
    date: string; // ISO Date String YYYY-MM-DD
}

// A derived type that includes the calculated rating for display
export interface ProductWithRating extends Product {
    rating: number; // This is the DISPLAY rating
    reviewCount: number;
    calculatedRating: number; // The actual rating from reviews
}

// User structure for authentication
export interface User {
    id: number;
    email: string;
    password: string; // NOTE: In a real app, this should be hashed and never stored in plaintext.
    createdAt: string;
}

// New Admin User structure for multi-user admin management
export interface AdminUser {
    id: number;
    email: string;
    password: string; // NOTE: In a real app, this should be hashed.
    role: 'Developer' | 'Admin';
}

// Cart Item Structure
export interface CartItem {
    productId: number; // Can also be a subscription ID or Module ID (string ID handled via type coercion or separate cart)
    quantity: number;
    // We might need to handle subscription items specially in a real app, but for this demo we'll treat them as products
    type?: 'product' | 'subscription' | 'module';
    title?: string; // fallback
    price?: string; // fallback
}

// Coupon structure, now managed globally
export interface Coupon {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    expiryDate: string;
    isActive: boolean;
    usageLimit: number;
    timesUsed: number;
}

// Homepage layout configuration
export interface HomepageSection {
  id: 'hero' | 'purchased' | 'topRated' | 'allProducts' | 'services' | 'about' | 'trust' | 'faq' | 'upcoming' | 'news';
  visible: boolean;
  title?: string;
}

// News Article structure
export interface NewsArticle {
  id: number;
  imageSeed: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  content: string;
}

// New Announcement structure
export interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
}

// --- Order Management Types (centralized) ---
export interface OrderItem {
    id: number | string; // Changed to allow string IDs for modules/subscriptions
    name: string;
    quantity: number;
    price: string;
}

export interface Order {
    id: string;
    customerName: string;
    customerEmail: string;
    date: string;
    total: string;
    status: 'Pending' | 'Shipped' | 'Completed' | 'Cancelled';
    items: OrderItem[];
    shippingAddress: string;
    billingAddress: string;
}

// New Support Ticket interface, centralized here
export interface SupportTicket {
    id: string;
    customerName: string;
    customerEmail: string;
    subject: string;
    message: string;
    date: string;
    status: 'Open' | 'Resolved' | 'Pending';
}

// New Subscriber Interface
export interface Subscriber {
    id: number;
    email: string;
    message: string;
    date: string;
    lastEmailedDate?: string; // YYYY-MM-DD
}

// New Email Log Interface for History
export interface EmailLog {
    id: number;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    count: number;
    recipientIds: number[];
}

// Subscription Tier Interface
export interface SubscriptionTier {
    id: string; // e.g., 'tier-standard'
    name: string;
    price: string;
    description: string;
    features: string[];
    paymentLink: string;
    isRecommended?: boolean;
    highlightColor?: string; // e.g., 'blue', 'purple', 'gold'
    // NEW: Access Control
    productAccess?: 'all' | 'specific' | 'none';
    accessProductIds?: number[]; // IDs of products unlocked by this plan
}


// New E-book Reader settings, configurable from admin panel
export interface EbookReaderSettings {
    defaultTheme: 'light' | 'sepia' | 'dark' | 'slate' | 'green';
    defaultFontSize: number;
    defaultFontFamily: string;
    availableFonts: string[];
}

export interface ThemePalette {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    textMutedColor: string;
}

// Comprehensive settings for the entire website, manageable from the admin panel
export interface WebsiteSettings {
    theme: {
        activeTheme: string; // 'default' | 'midnight' | 'sunset' | 'forest' | 'rose'
        primaryColor: string;
        accentColor: string;
        backgroundColor: string;
        textColor: string;
        textMutedColor: string;
        fontPairing: 'inter-lato' | 'roboto-merriweather' | 'montserrat-oswald';
        cornerRadius: string; // e.g., '0.5rem'
        shadowIntensity: string; // e.g., '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
    };
    layout: HomepageSection[];
    features: {
        showFavourites: boolean;
        showReviews: boolean;
        showSaleBadges: boolean;
    };
    validation: {
        productTitleMinLength: number;
    };
    apiKeys: {
        google?: string;
        openai?: string;
        anthropic?: string;
        deepseek?: string;
        grok?: string;
    };
    content: {
        heroTitle: string;
        heroSubtitle: string;
        heroMetrics: {
            enableRealData: boolean;
            customRevenue: string;
            customRevenueChange: string;
            customActiveUsers: string;
        };
        footerText: string;
        aboutUsTitle: string;
        aboutUsText: string;
        aboutUsImageUrl: string; // Changed from Seed to URL
        services: ServiceItem[];
        faqs: FaqItem[];
        upcomingFeatures: UpcomingFeatureItem[];
        newsArticles: NewsArticle[];
        announcements: Announcement[];
        subscriptionTiers: SubscriptionTier[]; // New Subscription Tiers
        socialLinks: {
            facebook: string;
            twitter: string;
            instagram: string;
            linkedin: string;
            pinterest: string;
            discord: string;
            reddit: string;
            quora: string;
        };
    };
    animations: {
        enabled: boolean;
        style: 'fade-up' | 'zoom-in';
    };
    ebookReaderSettings: EbookReaderSettings;
}

// ... (BlogDetail component omitted for brevity, unchanged) ...
const BlogDetail: React.FC<{
  settings: WebsiteSettings;
  article: NewsArticle;
  onBack: () => void;
}> = ({ settings, article, onBack }) => {
  return (
    <div className="bg-background min-h-screen font-sans animate-fade-in">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary truncate">Catalyst Blog</h1>
          <button
            onClick={onBack}
            className="bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-colors duration-300"
          >
            &larr; Back to Blog List
          </button>
        </div>
      </header>
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-lg shadow-lg animate-fade-in-up">
          <div className="mb-8 border-b pb-6">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase">{article.category}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mt-2">{article.title}</h2>
            <p className="text-sm text-text-muted mt-4">
              Published on {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-8 shadow-inner">
            <img src={`https://picsum.photos/seed/${article.imageSeed}/1200/675`} alt={article.title} className="w-full h-full object-cover" />
          </div>
          
          <div className="text-lg text-text leading-relaxed space-y-6">
            {article.content.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// ... (Initial Products, Reviews, Coupons, Orders, Tickets, News, Announcements omitted for brevity, unchanged) ...
const initialProducts: Product[] = [
  {
    id: 1,
    imageSeed: "ebook-marketing",
    images: [
        "https://picsum.photos/seed/digital-marketing-ebook-cover/800/600", 
    ],
    title: "The Ultimate Marketing Guide",
    description: "A comprehensive e-book covering everything from SEO to social media marketing.",
    longDescription: "Unlock the secrets of digital marketing with this all-in-one guide.",
    features: ["In-depth SEO strategies", "Social Media content calendar"],
    price: "₹499",
    salePrice: "₹299",
    category: "E-books",
    department: 'Unisex',
    inStock: true,
    isVisible: true,
    manualRating: 5,
    paymentLink: "https://pages.razorpay.com/pl_RIfTCxnYj73xqE/view",
    courseContent: [
      {
        id: 'mod-marketing-1',
        title: 'Module 1: Introduction to Digital Marketing',
        files: [],
        modules: []
      }
    ],
  }
];
const initialReviews: { [productId: number]: Review[] } = {};
const initialCoupons: Coupon[] = [];
const initialOrders: Order[] = [];
const initialSupportTickets: SupportTicket[] = [];
const initialNewsArticles: NewsArticle[] = [];
const initialAnnouncements: Announcement[] = [];

const initialAdminUsers: AdminUser[] = [
    { id: 1, email: 'developer@digitalcatalyst.com', password: 'admin', role: 'Developer' },
];

const initialSubscribers: Subscriber[] = [];

const initialSubscriptionTiers: SubscriptionTier[] = [
    {
        id: 'tier-standard',
        name: 'Standard Plan',
        price: '213',
        description: 'Perfect for getting started with core materials.',
        features: ['All Chapter Notes', 'PDF Downloads', 'Basic Support'],
        paymentLink: 'https://pages.razorpay.com/pl_RIfTCxnYj73xqE/view', // Placeholder
        highlightColor: 'blue',
        productAccess: 'specific',
        accessProductIds: []
    },
    {
        id: 'tier-pro',
        name: 'Pro Plan',
        price: '299',
        description: 'Our most popular plan for serious learners.',
        features: ['All Standard Features', 'Editable Google Docs Notes', '2 Years Free Updates', 'Extra PDF Resources'],
        paymentLink: 'https://pages.razorpay.com/pl_RIfTCxnYj73xqE/view',
        isRecommended: true,
        highlightColor: 'purple',
        productAccess: 'all',
        accessProductIds: []
    },
    {
        id: 'tier-elite',
        name: 'Elite Plan',
        price: '499',
        description: 'The ultimate package with personal support.',
        features: ['All Pro Features', 'PYQ Sets & MCQ Bundles', 'Daily Practice Questions', 'Manual WhatsApp Support', 'Priority Access'],
        paymentLink: 'https://pages.razorpay.com/pl_RIfTCxnYj73xqE/view',
        highlightColor: 'gold',
        productAccess: 'all',
        accessProductIds: []
    }
];


const defaultWebsiteSettings: WebsiteSettings = {
    theme: {
        activeTheme: 'default',
        primaryColor: '#02042b',
        accentColor: '#528ff0',
        backgroundColor: '#f9fafb', // gray-50
        textColor: '#1f2937', // gray-800
        textMutedColor: '#6b7280', // gray-500
        fontPairing: 'inter-lato',
        cornerRadius: '0.75rem', // lg
        shadowIntensity: 'medium',
    },
    layout: [
        { id: 'hero', visible: true },
        { id: 'purchased', visible: true },
        { id: 'topRated', visible: true, title: 'Top Rated Products' },
        { id: 'allProducts', visible: true },
        { id: 'services', visible: true },
        { id: 'about', visible: true },
        { id: 'trust', visible: true },
        { id: 'upcoming', visible: true, title: "What's Next for Digital Catalyst?" },
        { id: 'faq', visible: true },
    ],
    features: {
        showFavourites: true,
        showReviews: true,
        showSaleBadges: true,
    },
    validation: {
        productTitleMinLength: 3,
    },
    apiKeys: {},
    content: {
        heroTitle: "Elevate Your Digital Presence",
        heroSubtitle: "We provide top-tier digital products, marketing services, and e-commerce solutions.",
        heroMetrics: {
            enableRealData: false,
            customRevenue: "+128%",
            customRevenueChange: "+128%",
            customActiveUsers: "2.4k+",
        },
        footerText: "© {year} Digital Catalyst. All rights reserved.",
        aboutUsTitle: "About Digital Catalyst",
        aboutUsText: "At Digital Catalyst, we are more than just a digital marketplace...",
        aboutUsImageUrl: "https://picsum.photos/seed/creative-marketing-team/800/600",
        services: [],
        faqs: [],
        upcomingFeatures: [],
        newsArticles: initialNewsArticles,
        announcements: initialAnnouncements,
        subscriptionTiers: initialSubscriptionTiers,
        socialLinks: {
            facebook: "https://www.facebook.com/",
            twitter: "https://x.com/",
            instagram: "https://www.instagram.com/",
            linkedin: "https://www.linkedin.com/",
            pinterest: "https://in.pinterest.com/",
            discord: "https://discord.com/",
            reddit: "https://www.reddit.com/",
            quora: "https://www.quora.com/",
        }
    },
    animations: {
        enabled: true,
        style: 'fade-up',
    },
    ebookReaderSettings: {
        defaultTheme: 'light',
        defaultFontSize: 18,
        defaultFontFamily: 'serif',
        availableFonts: ['serif', 'sans-serif', 'lato', 'lora', 'roboto', 'merriweather'],
    },
};

const App: React.FC = () => {
  // Initialize products with default data immediately to prevent "white screen" or empty state
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [reviews, setReviews] = useState<{ [productId: number]: Review[] }>({});
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [tickets, setTickets] = useState<SupportTicket[]>(initialSupportTickets);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [currentView, setCurrentView] = useState('home'); 
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRating | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [purchasedProductIds, setPurchasedProductIds] = useState<(number|string)[]>([]); // Update to allow string IDs
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
  const [scrollToPolicySection, setScrollToPolicySection] = useState<string | null>(null);
  const [scrollToProductSection, setScrollToProductSection] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser | null>(null);
  const [productToBuyAfterLogin, setProductToBuyAfterLogin] = useState<ProductWithRating | null>(null);
  const [autoOpenPaymentModalFor, setAutoOpenPaymentModalFor] = useState<number | null>(null);
  
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(defaultWebsiteSettings);
  
  // New E-commerce State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithRating | null>(null);
  const [cartToastMessage, setCartToastMessage] = useState('');
  const [isCartPaymentModalOpen, setIsCartPaymentModalOpen] = useState(false);
  const [appliedCartCoupon, setAppliedCartCoupon] = useState<Coupon | null>(null);
  const [cartCouponError, setCartCouponError] = useState<string | null>(null);

  // Subscription Modal State
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState('');
  // NEW: Track which subscription tier is being purchased
  const [checkoutSubscription, setCheckoutSubscription] = useState<SubscriptionTier | null>(null);

  // Unified Info Modal State
  const [infoModal, setInfoModal] = useState<{ title: string; message: string; icon: string; } | null>(null);
  
  // New Large Content Modal States
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [isFreeModalOpen, setIsFreeModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  
  // --- Data Loading and Persistence ---
  
  // --- SWITCHED TO LOCAL STORAGE MODE ---
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('siteProducts');
      if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
      } else {
          setProducts(initialProducts);
      }
    } catch (err) {
      console.error("Error loading products from localStorage:", err);
      setProducts(initialProducts);
    }
  }, []);

  // Persist products to localStorage whenever they change
  useEffect(() => {
      if (products.length > 0) {
          safeSetItem('siteProducts', products);
      }
  }, [products]);

  useEffect(() => {
    const storedWishlist = localStorage.getItem('productWishlist');
    if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

    const storedReviews = localStorage.getItem('productReviews');
    if (storedReviews) setReviews(JSON.parse(storedReviews)); else setReviews(initialReviews);
    
    const storedPurchases = localStorage.getItem('purchasedProducts');
    if (storedPurchases) setPurchasedProductIds(JSON.parse(storedPurchases));

    const storedCart = localStorage.getItem('shoppingCart');
    if (storedCart) setCart(JSON.parse(storedCart));

    const storedUsers = localStorage.getItem('siteUsers');
    const loadedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    setUsers(loadedUsers);
    
    const storedAdminUsers = localStorage.getItem('adminUsers');
    if (storedAdminUsers) setAdminUsers(JSON.parse(storedAdminUsers)); else setAdminUsers(initialAdminUsers);

    const storedSettings = localStorage.getItem('websiteSettings');
    if (storedSettings) {
        // Merge with default settings to ensure new fields (like subscriptionTiers) exist
        const parsedSettings = JSON.parse(storedSettings);
        const mergedSettings = {
            ...defaultWebsiteSettings,
            ...parsedSettings,
            content: {
                ...defaultWebsiteSettings.content,
                ...parsedSettings.content,
                subscriptionTiers: parsedSettings.content?.subscriptionTiers || initialSubscriptionTiers
            },
            theme: {
                ...defaultWebsiteSettings.theme,
                ...parsedSettings.theme
            }
        };
        setWebsiteSettings(mergedSettings);
    }
    
    const storedCoupons = localStorage.getItem('siteCoupons');
    if (storedCoupons) setCoupons(JSON.parse(storedCoupons)); else setCoupons(initialCoupons);
    
    const storedOrders = localStorage.getItem('siteOrders');
    if (storedOrders) setOrders(JSON.parse(storedOrders)); else setOrders(initialOrders);

    const storedTickets = localStorage.getItem('siteSupportTickets');
    if (storedTickets) setTickets(JSON.parse(storedTickets)); else setTickets(initialSupportTickets);

    const storedSubscribers = localStorage.getItem('siteSubscribers');
    if (storedSubscribers) setSubscribers(JSON.parse(storedSubscribers)); else setSubscribers(initialSubscribers);

    const storedLogs = localStorage.getItem('siteEmailLogs');
    if (storedLogs) setEmailLogs(JSON.parse(storedLogs));

    const storedCurrentUser = localStorage.getItem('currentUser');
    if (storedCurrentUser) {
        try {
            const currentUserData: User = JSON.parse(storedCurrentUser);
            const userIsValid = loadedUsers.some(user => user.id === currentUserData.id);
            if (userIsValid) setCurrentUser(currentUserData);
            else localStorage.removeItem('currentUser');
        } catch (error) {
            console.error("Error parsing current user:", error);
            localStorage.removeItem('currentUser');
        }
    }
    
    const storedCurrentAdmin = localStorage.getItem('currentAdminUser');
    if (storedCurrentAdmin) {
      try {
        const currentAdminData: AdminUser = JSON.parse(storedCurrentAdmin);
        const adminIsValid = (storedAdminUsers ? JSON.parse(storedAdminUsers) : initialAdminUsers).some((u: AdminUser) => u.id === currentAdminData.id);
        if (adminIsValid) setCurrentAdminUser(currentAdminData);
        else localStorage.removeItem('currentAdminUser');
      } catch (e) {
        localStorage.removeItem('currentAdminUser');
      }
    }
  }, []);
  
  // ... (Local Storage Effects omitted, same as before) ...
  useEffect(() => { safeSetItem('shoppingCart', cart); }, [cart]);
  useEffect(() => { safeSetItem('siteCoupons', coupons); }, [coupons]);
  useEffect(() => { safeSetItem('siteOrders', orders); }, [orders]);
  useEffect(() => { safeSetItem('siteSupportTickets', tickets); }, [tickets]);
  useEffect(() => { safeSetItem('siteSubscribers', subscribers); }, [subscribers]);
  useEffect(() => { safeSetItem('siteEmailLogs', emailLogs); }, [emailLogs]);
  
  // --- Dynamic Theming Effect ---
  useEffect(() => {
    const root = document.documentElement;
    const theme = websiteSettings.theme;
    
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-accent', theme.accentColor);
    root.style.setProperty('--color-background', theme.backgroundColor);
    root.style.setProperty('--color-text', theme.textColor);
    root.style.setProperty('--color-text-muted', theme.textMutedColor);

    const fonts = {
        'inter-lato': { sans: 'Inter, sans-serif', serif: 'Lato, serif' },
        'roboto-merriweather': { sans: 'Roboto, sans-serif', serif: 'Merriweather, serif' },
        'montserrat-oswald': { sans: 'Montserrat, sans-serif', serif: 'Oswald, sans-serif' },
    };
    root.style.setProperty('--font-sans', fonts[theme.fontPairing].sans);
    root.style.setProperty('--font-serif', fonts[theme.fontPairing].serif);
    root.style.setProperty('--style-corner-radius', theme.cornerRadius);
    // ... Shadows setup omitted for brevity
  }, [websiteSettings.theme]);

  const handleWebsiteSettingsUpdate = (newSettings: WebsiteSettings) => {
    setWebsiteSettings(newSettings);
    safeSetItem('websiteSettings', newSettings);
  };
  
  // ... (Derived Data logic, Rating calculations same as before) ...
  const calculateAverageRating = (productId: number): { rating: number, reviewCount: number } => {
    const pReviews = reviews[productId];
    if (!pReviews || pReviews.length === 0) return { rating: 0, reviewCount: 0 };
    const total = pReviews.reduce((acc, r) => acc + r.rating, 0);
    return { rating: total / pReviews.length, reviewCount: pReviews.length };
  };

  const productsWithRatings: ProductWithRating[] = products.map(p => {
    const { rating: calculatedRating, reviewCount } = calculateAverageRating(p.id);
    const displayRating = (p.manualRating !== null && p.manualRating !== undefined) ? p.manualRating : calculatedRating;
    return { ...p, rating: displayRating, reviewCount, calculatedRating };
  });

  const visibleProducts = productsWithRatings.filter(p => p.isVisible !== false);
  const topRatedProducts = [...visibleProducts].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const purchasedProducts = productsWithRatings.filter(p => purchasedProductIds.includes(p.id));
  const wishlistProducts = visibleProducts.filter(p => wishlist.includes(p.id));
  const freeProducts = visibleProducts.filter(p => p.isFree);

  // ... (Metrics calculation) ...
  const totalRevenueValue = orders.filter(o => o.status !== 'Cancelled').reduce((acc, order) => acc + (parseFloat(order.total.replace(/[^\d.]/g, '')) || 0), 0);
  const realMetrics = { revenue: totalRevenueValue, users: users.length };

  // ... (Cart Handlers same as before) ...
  const handleAddToCart = (productId: number, quantity: number = 1) => {
      setCart(prevCart => {
          const existingItem = prevCart.find(item => item.productId === productId);
          if (existingItem) return prevCart.map(item => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item);
          return [...prevCart, { productId, quantity }];
      });
      const product = products.find(p => p.id === productId);
      if (product) { setCartToastMessage(`'${product.title}' added to cart!`); setTimeout(() => setCartToastMessage(''), 3000); }
      setIsCartOpen(true);
  };
  const handleUpdateCartQuantity = (productId: number, newQuantity: number) => {
      setCart(prevCart => newQuantity <= 0 ? prevCart.filter(item => item.productId !== productId) : prevCart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
  };
  const handleRemoveFromCart = (productId: number) => setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  const handleInitiateCheckout = () => { if (cart.length === 0) return; setIsCartPaymentModalOpen(true); setIsCartOpen(false); };

  // ... (Confirm Cart Purchase logic same as before) ...
  const handleConfirmCartPurchase = (appliedCouponCode: string | null) => {
      // ... existing cart purchase logic ...
      if (cart.length === 0) return;
      
      const cartDetails = cart.map(item => {
        const product = productsWithRatings.find(p => p.id === item.productId);
        return product ? { ...item, product } : null;
      }).filter((i): i is { product: ProductWithRating } & CartItem => i !== null);

      const currentCartSubtotal = cartDetails.reduce((acc, item) => {
          const priceStr = item.product.salePrice || item.product.price;
          const price = parseFloat(priceStr.replace('₹', ''));
          return acc + (price * item.quantity);
      }, 0);

      const couponToApply = appliedCouponCode ? coupons.find(c => c.code === appliedCouponCode) : null;
      let finalDiscount = 0;
      if (couponToApply) finalDiscount = calculateDiscount(couponToApply, currentCartSubtotal);
      const finalPrice = currentCartSubtotal - finalDiscount;

      const newPurchasedIds = [...new Set([...purchasedProductIds, ...cart.map(item => item.productId)])];
      setPurchasedProductIds(newPurchasedIds);
      safeSetItem('purchasedProducts', newPurchasedIds);

      if (appliedCouponCode) setCoupons(prev => prev.map(c => c.code === appliedCouponCode ? { ...c, timesUsed: c.timesUsed + 1 } : c));
      
      const newOrderItems: OrderItem[] = cartDetails.map(item => ({ id: item.product.id, name: item.product.title, quantity: item.quantity, price: item.product.salePrice || item.product.price }));
      const newOrder: Order = { id: `DC-${Date.now()}`, customerName: currentUser?.email.split('@')[0] || 'Valued Customer', customerEmail: currentUser?.email || 'customer@example.com', date: new Date().toISOString().split('T')[0], total: `₹${finalPrice.toFixed(2)}`, status: 'Completed', items: newOrderItems, shippingAddress: 'N/A (Digital Product)', billingAddress: '123 E-commerce St' };
      setOrders(prevOrders => [newOrder, ...prevOrders]);

      setSelectedProduct(productsWithRatings.find(p => p.id === cart[0].productId) || null);
      setCart([]); setAppliedCartCoupon(null); setCartCouponError(null); setIsCartPaymentModalOpen(false); setCurrentView('congratulations'); window.scrollTo(0, 0);
  };

  // ... (Helpers for Cart details, Discount calc, etc.) ...
  const cartDetails = cart.map(item => {
    const product = productsWithRatings.find(p => p.id === item.productId);
    return product ? { ...item, product } : null;
  }).filter((i): i is { product: ProductWithRating } & CartItem => i !== null);
  const cartSubtotal = cartDetails.reduce((acc, item) => acc + (parseFloat((item.product.salePrice || item.product.price).replace('₹', '')) * item.quantity), 0);
  const calculateDiscount = (coupon: Coupon, price: number) => coupon.type === 'fixed' ? Math.min(coupon.value, price) : (price * coupon.value) / 100;
  const cartCouponDiscount = appliedCartCoupon ? calculateDiscount(appliedCartCoupon, cartSubtotal) : 0;
  const cartFinalPrice = cartSubtotal - cartCouponDiscount;
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // ... (Auth, Wishlist, Review Handlers same as before) ...
  const handleApplyCartCoupon = (code: string) => {
      // ... existing coupon apply logic
      const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
      if(!coupon) { setCartCouponError("Invalid coupon"); setAppliedCartCoupon(null); return; }
      setAppliedCartCoupon(coupon); setCartCouponError(null);
  };
  const handleLogin = (e: string, p: string) => { 
      const user = users.find(u => u.email === e && u.password === p);
      if(user) { setCurrentUser(user); safeSetItem('currentUser', user); if(productToBuyAfterLogin) { setSelectedProduct(productToBuyAfterLogin); setCurrentView('product'); setAutoOpenPaymentModalFor(productToBuyAfterLogin.id); setProductToBuyAfterLogin(null); } else setCurrentView('home'); return true; }
      return false; 
  };
  const handleSignup = (e: string, p: string) => { if(users.some(u=>u.email===e)) return {success:false, message:'Exists'}; const u={id:Date.now(), email:e, password:p, createdAt:new Date().toISOString()}; setUsers([...users, u]); safeSetItem('siteUsers', [...users, u]); handleLogin(e,p); return {success:true, message:''}; };
  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('currentUser'); setCurrentView('home'); };
  const handleBackToHome = () => { if(currentView==='home') window.scrollTo({top:0,behavior:'smooth'}); else { setCurrentView('home'); setSelectedProduct(null); window.scrollTo(0,0); } };
  const handleBackFromAuth = () => { productToBuyAfterLogin ? (setSelectedProduct(productToBuyAfterLogin), setCurrentView('product'), setProductToBuyAfterLogin(null)) : handleBackToHome(); };
  const handleNavigateToAuth = () => setCurrentView('auth');
  const handleLoginRequired = (product: ProductWithRating) => { setProductToBuyAfterLogin(product); setCurrentView('auth'); window.scrollTo(0,0); };
  const handleToggleWishlist = (id: number) => { const u = !wishlist.includes(id) ? [...wishlist, id] : wishlist.filter(w=>w!==id); setWishlist(u); safeSetItem('productWishlist', u); if(!currentAdminUser) setProducts(prev=>prev.map(p=>p.id===id?{...p, wishlistCount: !wishlist.includes(id) ? (p.wishlistCount||0)+1 : Math.max(0, (p.wishlistCount||0)-1)}:p)); };
  const handleClearWishlist = () => { if(window.confirm('Clear wishlist?')) { setWishlist([]); safeSetItem('productWishlist', []); } };
  const handleAddReview = (pId: number, d: Omit<Review, 'name' | 'date'>) => { const r = {...d, name: currentUser?.email.split('@')[0]||'Customer', date: new Date().toISOString().split('T')[0]}; const u = {...reviews, [pId]: [r, ...(reviews[pId]||[])]}; setReviews(u); safeSetItem('productReviews', u); };
  const handleViewProduct = (p: ProductWithRating, sectionId?: string) => { if(!currentAdminUser) { const up = {...p, viewCount: (p.viewCount||0)+1}; setProducts(prev=>prev.map(pd=>pd.id===p.id?{...pd, viewCount:(pd.viewCount||0)+1}:pd)); setSelectedProduct(up); } else setSelectedProduct(p); setCurrentView('product'); setScrollToProductSection(sectionId||null); window.scrollTo(0,0); };
  const handleViewProductFromModal = (p: ProductWithRating) => { setIsBlogModalOpen(false); setIsFreeModalOpen(false); setIsAnnouncementsModalOpen(false); handleViewProduct(p); };
  const handleViewPurchasedProduct = (p: ProductWithRating) => { setSelectedProduct(p); setCurrentView(p.category==='E-books'?'ebookReader':'coursePlayer'); window.scrollTo(0,0); };
  
  const handleNavigateToPolicies = (sectionId?: string) => { setCurrentView('policies'); setScrollToPolicySection(sectionId||null); window.scrollTo(0,0); };
  const handleNavigateToAllProducts = () => { setCurrentView('allProducts'); setSelectedProduct(null); window.scrollTo(0,0); };
  const handleNavigateToPurchases = () => { setCurrentView('myPurchases'); setSelectedProduct(null); window.scrollTo(0,0); };
  const handleNavigateToWishlist = () => { setCurrentView('wishlist'); window.scrollTo(0,0); };
  const handleNavigateToHomeAndScroll = (sectionId: string) => { if(currentView==='home') document.getElementById(sectionId)?.scrollIntoView({behavior:'smooth', block:'start'}); else { setCurrentView('home'); setScrollToSection(sectionId); } };
  const handleSubscribe = (email: string, message: string) => { const s={id:Date.now(), email, message, date:new Date().toISOString(), lastEmailedDate:undefined}; setSubscribers(prev=>[...prev, s]); setSubscribedEmail(email); setIsSubscriptionModalOpen(true); };
  const handleUpdateSubscribers = (u: Subscriber[]) => { setSubscribers(u); safeSetItem('siteSubscribers', u); };
  const handleUpdateEmailLogs = (l: EmailLog[]) => { setEmailLogs(l); safeSetItem('siteEmailLogs', l); };
  const handleViewAnnouncement = (a: Announcement) => { setIsAnnouncementsModalOpen(false); setSelectedAnnouncement(a); setCurrentView('announcementDetail'); window.scrollTo(0,0); };
  const handleViewBlogArticle = (a: NewsArticle) => { setIsBlogModalOpen(false); setSelectedArticle(a); setCurrentView('blogDetail'); window.scrollTo(0,0); };
  const handleNavigateToAdminLogin = () => { currentAdminUser ? setCurrentView('admin') : setCurrentView('adminLogin'); };
  const handleAdminLogin = (e: string, p: string) => { const a = adminUsers.find(u=>u.email===e && u.password===p); if(a) { setCurrentAdminUser(a); safeSetItem('currentAdminUser', a); setCurrentView('admin'); return true; } return false; };
  const handleAdminSwitchToHome = () => setCurrentView('home');
  const handleAdminLogout = () => { setCurrentAdminUser(null); localStorage.removeItem('currentAdminUser'); setCurrentView('home'); };
  
  // ... (Product CRUD omitted, same as before) ...
  const handleAddProduct = async (p: Omit<Product, 'id'>) => { const n = Date.now(); const up = [...products, {...p, id: n, manualRating: p.manualRating??null}]; setProducts(up); safeSetItem('siteProducts', up); };
  const handleUpdateProduct = async (p: Product) => { const up = products.map(prod=>prod.id===p.id?p:prod); setProducts(up); safeSetItem('siteProducts', up); };
  const handleDeleteProduct = async (id: number) => { const up = products.filter(p=>p.id!==id); setProducts(up); safeSetItem('siteProducts', up); const ur = {...reviews}; delete ur[id]; setReviews(ur); safeSetItem('productReviews', ur); };
  const handleDeleteUser = (id: number) => { if(window.confirm("Delete user?")) { const u = users.filter(u=>u.id!==id); setUsers(u); safeSetItem('siteUsers', u); } };

  // --- NEW SUBSCRIPTION & PURCHASE LOGIC ---
  const handlePurchaseComplete = (appliedCouponCode: string | null, quantity: number, itemType: 'product' | 'subscription' | 'module' = 'product', itemId?: string | number) => {
        // Handle generic purchase
        let finalPriceNum = 0;
        let purchaseTitle = "Item";

        // Determine price and title based on purchase type
        if (itemType === 'product' && selectedProduct) {
             const original = parseFloat(selectedProduct.price.replace('₹', ''));
             const sale = selectedProduct.salePrice ? parseFloat(selectedProduct.salePrice.replace('₹', '')) : null;
             const current = sale ?? original;
             finalPriceNum = current * quantity;
             purchaseTitle = selectedProduct.title;
             
             // Add to Purchased IDs
             const newPurchasedIds = [...new Set([...purchasedProductIds, selectedProduct.id])];
             setPurchasedProductIds(newPurchasedIds);
             safeSetItem('purchasedProducts', newPurchasedIds);
        } else if (itemType === 'subscription' && itemId) {
             const tier = websiteSettings.content.subscriptionTiers.find(t => t.id === itemId);
             if (tier) {
                 finalPriceNum = parseFloat(tier.price);
                 purchaseTitle = `Subscription: ${tier.name}`;
                 // Add subscription ID to purchased list
                 const newPurchasedIds = [...new Set([...purchasedProductIds, itemId])];
                 setPurchasedProductIds(newPurchasedIds);
                 safeSetItem('purchasedProducts', newPurchasedIds);
             }
        } else if (itemType === 'module' && itemId && typeof itemId === 'string') {
             // Handle individual module purchase
             // Logic handled in CoursePlayer typically, but if routed here:
             finalPriceNum = 13; // Or dynamic
             purchaseTitle = `Chapter Unlock`;
             const newPurchasedIds = [...new Set([...purchasedProductIds, itemId])];
             setPurchasedProductIds(newPurchasedIds);
             safeSetItem('purchasedProducts', newPurchasedIds);
        }

        // Apply discount
        const couponToApply = appliedCouponCode ? coupons.find(c => c.code === appliedCouponCode) : null;
        let finalDiscount = 0;
        if (couponToApply) {
            finalDiscount = calculateDiscount(couponToApply, finalPriceNum);
        }
        const robustFinalPrice = finalPriceNum - finalDiscount;

        // Create Order
        const newOrder: Order = {
            id: `DC-${Date.now()}`,
            customerName: currentUser?.email.split('@')[0] || 'Valued Customer',
            customerEmail: currentUser?.email || 'customer@example.com',
            date: new Date().toISOString().split('T')[0],
            total: `₹${robustFinalPrice.toFixed(2)}`,
            status: 'Completed',
            items: [{
                id: itemId || (selectedProduct ? selectedProduct.id : 'unknown'),
                name: purchaseTitle,
                quantity: quantity,
                price: `₹${finalPriceNum}`
            }],
            shippingAddress: 'N/A (Digital Product)',
            billingAddress: '123 E-commerce St, Web City, WC 54321'
        };
        setOrders(prevOrders => [newOrder, ...prevOrders]);

        if (appliedCouponCode) {
            setCoupons(prev => prev.map(c => c.code === appliedCouponCode ? { ...c, timesUsed: c.timesUsed + 1 } : c));
        }
        
        // Clear checkout states
        setCart([]); 
        setCheckoutSubscription(null);

        // Redirect based on type
        if (itemType === 'subscription') {
            alert(`Subscription Active! You now have access to ${purchaseTitle}.`);
            setCurrentView('home');
        } else if (itemType === 'module') {
             // Stay on course player usually, handled by component logic
        } else {
            setCurrentView('congratulations');
        }
        window.scrollTo(0, 0);
  };

  // Handle Subscription Checkout Trigger
  const handleSubscriptionCheckout = (tier: SubscriptionTier) => {
      setCheckoutSubscription(tier);
      setCurrentView('subscriptionCheckout'); // Switch to new dedicated page
      window.scrollTo(0, 0);
  };

  // --- RENDER LOGIC ---
  const renderHomePageContent = () => (
      <>
          {websiteSettings.layout.map(section => {
              if (!section.visible) return null;
              switch(section.id) {
                  case 'hero': return <Hero key={section.id} settings={websiteSettings} onNavigateToPolicies={() => handleNavigateToPolicies()} onNavigateToAllProducts={handleNavigateToAllProducts} onOpenBlogModal={() => setIsBlogModalOpen(true)} onOpenFreeModal={() => setIsFreeModalOpen(true)} onOpenAnnouncementsModal={() => setIsAnnouncementsModalOpen(true)} realMetrics={realMetrics} />;
                  case 'purchased': return purchasedProducts.length > 0 && <PurchasedProducts settings={websiteSettings} key={section.id} products={purchasedProducts} onViewPurchasedProduct={handleViewPurchasedProduct} />;
                  case 'topRated': return <FeaturedProducts settings={websiteSettings} key={section.id} title={section.title || "Top Rated Products"} products={topRatedProducts} onViewProduct={handleViewProduct} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onQuickView={setQuickViewProduct} coupons={coupons} />;
                  case 'allProducts': return <ProductShowcase settings={websiteSettings} key={section.id} products={visibleProducts.filter(p => !purchasedProductIds.includes(p.id))} onViewProduct={handleViewProduct} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onQuickView={setQuickViewProduct} coupons={coupons} />;
                  case 'services': return <Services settings={websiteSettings} key={section.id} services={websiteSettings.content.services} onNavigateToHomeAndScroll={handleNavigateToHomeAndScroll} />;
                  case 'news': return null;
                  case 'about': return <AboutUs settings={websiteSettings} key={section.id} title={websiteSettings.content.aboutUsTitle} text={websiteSettings.content.aboutUsText} imageUrl={websiteSettings.content.aboutUsImageUrl} />;
                  case 'trust': return <TrustBadges settings={websiteSettings} key={section.id} />;
                  case 'upcoming': return <UpcomingFeatures settings={websiteSettings} key={section.id} title={section.title || "What's Next?"} features={websiteSettings.content.upcomingFeatures} />;
                  case 'faq': return <Faq settings={websiteSettings} key={section.id} faqs={websiteSettings.content.faqs} />;
                  default: return null;
              }
          })}
      </>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'product': return selectedProduct && <ProductDetailPage settings={websiteSettings} product={selectedProduct} onBack={handleNavigateToAllProducts} onPurchase={(appliedCouponCode, quantity) => handlePurchaseComplete(appliedCouponCode, quantity)} isWishlisted={wishlist.includes(selectedProduct.id)} onToggleWishlist={handleToggleWishlist} reviews={reviews[selectedProduct.id] || []} onAddReview={(d) => handleAddReview(selectedProduct.id, d)} isLoggedIn={!!currentUser} onLoginRequired={() => handleLoginRequired(selectedProduct)} autoOpenPaymentModal={autoOpenPaymentModalFor === selectedProduct.id} onModalOpened={() => setAutoOpenPaymentModalFor(null)} coupons={coupons} scrollToSection={scrollToProductSection} onSectionScrolled={() => setScrollToProductSection(null)} onAddToCart={handleAddToCart} allProducts={productsWithRatings} onViewProduct={handleViewProduct} wishlist={wishlist} onQuickView={setQuickViewProduct} onGoHome={handleBackToHome} />;
      case 'coursePlayer': return selectedProduct && <CoursePlayer settings={websiteSettings} product={selectedProduct} onBack={handleNavigateToPurchases} purchasedIds={purchasedProductIds} onPurchaseModule={(moduleId, price, link) => handlePurchaseComplete(null, 1, 'module', moduleId)} />;
      case 'ebookReader': return selectedProduct && <EbookReader settings={websiteSettings} product={selectedProduct} onBack={handleNavigateToPurchases} />;
      case 'congratulations': return <Congratulations settings={websiteSettings} onBack={handleBackToHome} product={selectedProduct} reviews={selectedProduct ? reviews[selectedProduct.id] || [] : []} onAddReview={selectedProduct ? (d) => handleAddReview(selectedProduct.id, d) : () => {}} />;
      case 'allProducts': return <ProductShowcase settings={websiteSettings} products={visibleProducts.filter(p => !purchasedProductIds.includes(p.id))} onViewProduct={handleViewProduct} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} onQuickView={setQuickViewProduct} coupons={coupons} />;
      case 'myPurchases': return <PurchasedProducts settings={websiteSettings} products={purchasedProducts} onViewPurchasedProduct={handleViewPurchasedProduct} />;
      case 'wishlist': return <WishlistPage settings={websiteSettings} products={wishlistProducts} onViewProduct={handleViewProduct} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onNavigateToAllProducts={handleNavigateToAllProducts} onAddToCart={handleAddToCart} onQuickView={setQuickViewProduct} onClearWishlist={handleClearWishlist} coupons={coupons} />;
      case 'subscription': return <SubscriptionPage settings={websiteSettings} onBack={handleBackToHome} onPurchase={handleSubscriptionCheckout} />;
      // NEW: Render the dedicated checkout page
      case 'subscriptionCheckout': 
        return checkoutSubscription ? (
            <SubscriptionCheckoutPage 
                settings={websiteSettings}
                tier={checkoutSubscription}
                currentUser={currentUser}
                coupons={coupons}
                onBack={() => setCurrentView('subscription')}
                onConfirmPayment={(code, price) => handlePurchaseComplete(code, 1, 'subscription', checkoutSubscription.id)}
            />
        ) : null;
      case 'home': default: return renderHomePageContent();
    }
  };

  const renderPage = () => {
    if (currentView === 'policies') return <PolicyPage settings={websiteSettings} onBack={handleBackToHome} scrollToSection={scrollToPolicySection} onSectionScrolled={() => setScrollToPolicySection(null)} />;
    if (currentView === 'auth') return <AuthPage settings={websiteSettings} onLogin={handleLogin} onSignup={handleSignup} onBack={handleBackFromAuth} />;
    if (currentView === 'admin' && currentAdminUser) return <AdminDashboard websiteSettings={websiteSettings} onWebsiteSettingsChange={handleWebsiteSettingsUpdate} products={productsWithRatings} reviews={reviews} users={users} coupons={coupons} orders={orders} tickets={tickets} subscribers={subscribers} onTicketsUpdate={setTickets} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} onDeleteUser={handleDeleteUser} onCouponsUpdate={setCoupons} onLogout={handleAdminLogout} onSwitchToHome={handleAdminSwitchToHome} adminUsers={adminUsers} currentAdminUser={currentAdminUser} onAdminUsersUpdate={(updatedUsers) => { setAdminUsers(updatedUsers); safeSetItem('adminUsers', updatedUsers); }} onSubscribersUpdate={handleUpdateSubscribers} emailLogs={emailLogs} onEmailLogsUpdate={handleUpdateEmailLogs} />;
    if (currentView === 'adminLogin') return <AdminLogin settings={websiteSettings} onLogin={handleAdminLogin} onBack={handleBackToHome} />;
    if (currentView === 'coursePlayer' || currentView === 'ebookReader' || currentView === 'subscription' || currentView === 'subscriptionCheckout') return renderContent();
    if (currentView === 'announcementDetail' && selectedAnnouncement) return <AnnouncementDetail settings={websiteSettings} announcement={selectedAnnouncement} onBack={() => { setCurrentView('home'); setSelectedAnnouncement(null); setIsAnnouncementsModalOpen(true); }} />;
    if (currentView === 'blogDetail' && selectedArticle) return <BlogDetail settings={websiteSettings} article={selectedArticle} onBack={() => { setCurrentView('home'); setSelectedArticle(null); setIsBlogModalOpen(true); }} />;

    return (
       <ErrorBoundary>
         <div className="font-sans">
            <Header settings={websiteSettings} wishlistCount={wishlist.length} cartItemCount={cartItemCount} cartToastMessage={cartToastMessage} onCartClick={() => setIsCartOpen(true)} onHomeClick={handleBackToHome} onNavigateToAllProducts={handleNavigateToAllProducts} onNavigateToPurchases={handleNavigateToPurchases} onNavigateToWishlist={handleNavigateToWishlist} onNavigateToHomeAndScroll={handleNavigateToHomeAndScroll} currentUser={currentUser} onLogout={handleLogout} onLoginClick={handleNavigateToAuth} onNavigateToSubscriptions={() => { setCurrentView('subscription'); window.scrollTo(0,0); }} />
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartDetails} onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveFromCart} onViewProduct={handleViewProduct} onCheckout={handleInitiateCheckout} onApplyCoupon={handleApplyCartCoupon} appliedCoupon={appliedCartCoupon} couponError={cartCouponError} onRemoveCoupon={() => { setAppliedCartCoupon(null); setCartCouponError(null); }} />
            {quickViewProduct && <QuickViewModal settings={websiteSettings} product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={wishlist.includes(quickViewProduct.id)} onViewFullDetails={() => { handleViewProduct(quickViewProduct); setQuickViewProduct(null); }} />}
            
            {isCartPaymentModalOpen && <PaymentModal settings={websiteSettings} cartItems={cartDetails} originalPrice={cartSubtotal} couponDiscount={cartCouponDiscount} finalPrice={cartFinalPrice} onClose={() => setIsCartPaymentModalOpen(false)} onConfirm={() => handleConfirmCartPurchase(appliedCartCoupon ? appliedCartCoupon.code : null)} />}
            {isSubscriptionModalOpen && <SubscriptionSuccessModal isOpen={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} email={subscribedEmail} products={topRatedProducts} onNavigateToAllProducts={() => { setIsSubscriptionModalOpen(false); handleNavigateToAllProducts(); }} />}
            <ComingSoonModal isOpen={!!infoModal} onClose={() => setInfoModal(null)} title={infoModal?.title} message={infoModal?.message} icon={infoModal?.icon} />
            <BlogModal isOpen={isBlogModalOpen} onClose={() => setIsBlogModalOpen(false)} articles={websiteSettings.content.newsArticles} onReadMoreClick={handleViewBlogArticle} settings={websiteSettings} />
            <FreeProductsModal isOpen={isFreeModalOpen} onClose={() => setIsFreeModalOpen(false)} products={freeProducts} settings={websiteSettings} onAddToCart={handleAddToCart} onViewProduct={handleViewProductFromModal} />
            <AnnouncementsModal isOpen={isAnnouncementsModalOpen} onClose={() => setIsAnnouncementsModalOpen(false)} announcements={websiteSettings.content.announcements} settings={websiteSettings} onViewAnnouncement={handleViewAnnouncement} />
            <main>{renderContent()}</main>
            <Footer settings={websiteSettings} socialLinks={websiteSettings.content.socialLinks} onAdminLoginClick={handleNavigateToAdminLogin} onLoginClick={handleNavigateToAuth} onNavigateToAllProducts={handleNavigateToAllProducts} onNavigateToHomeAndScroll={handleNavigateToHomeAndScroll} onNavigateToPolicies={handleNavigateToPolicies} onSubscribe={handleSubscribe} />
         </div>
       </ErrorBoundary>
    );
  }

  return (
      <ErrorBoundary>
        {renderPage()}
      </ErrorBoundary>
  );
};

export default App;
