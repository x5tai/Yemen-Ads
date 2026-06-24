import React, { useState, useEffect } from "react";
import { User, Ad, Category, Banner, InAppNotification } from "./types";
import { fetchAdsFromFirestore, saveAdToFirestore, deleteAdFromFirestore } from "./services/adsService";
import { Header } from "./components/Header";
import { AdCard } from "./components/AdCard";
import { AddAdForm } from "./components/AddAdForm";
import { UserProfile } from "./components/UserProfile";
import { AdminPanel } from "./components/AdminPanel";
import { AdDetailsModal } from "./components/AdDetailsModal";
import { CategoryIcon } from "./components/Icons";
import { 
  Megaphone, 
  MapPin, 
  SlidersHorizontal, 
  X, 
  Lock, 
  Mail, 
  Phone, 
  User as UserIcon, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Instagram,
  Facebook,
  MessageCircle
} from "lucide-react";

export default function App() {
  // Global States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [favorites, setFavorites] = useState<Ad[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  // View Routing State
  const [activeView, setActiveView] = useState<"home" | "addAd" | "profile" | "admin">("home");
  const [profileTab, setProfileTab] = useState("ads");
  const [activeAdDetails, setActiveAdDetails] = useState<Ad | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | undefined>(undefined);

  // Authentication Modals State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // UI Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ----------------------------------------------------
  // INITIAL DATA FETCH & AUTO-LOGIN DETECTOR
  // ----------------------------------------------------

  const loadInitialData = async () => {
    try {
      // 1. Categories
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // 2. Banners
      const banRes = await fetch("/api/banners");
      if (banRes.ok) {
        const banData = await banRes.json();
        setBanners(banData);
      }

      // 3. Ads Listing (Filtered dynamically from backend depending on current search queries)
      await fetchAllAds();

    } catch (e) {
      console.error("Failed to load initial data", e);
    }
  };

  const fetchAllAds = async () => {
    try {
      const data = await fetchAdsFromFirestore({
        categoryId: selectedCategory || undefined,
        search: searchQuery || undefined,
        location: selectedLocation || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        onlyFeatured: onlyFeatured,
        isAdmin: currentUser?.role === "admin",
        currentUserId: currentUser?.id || undefined
      });
      setAds(data);
    } catch (e) {
      console.error("Error fetching ads", e);
    }
  };

  const fetchFavorites = async (userId: string) => {
    try {
      const response = await fetch("/api/favorites", {
        headers: { "Authorization": `Bearer ${userId}` }
      });
      if (response.ok) {
        const favs = await response.json();
        setFavorites(favs);
      }
    } catch (e) {
      console.error("Error loading favorites", e);
    }
  };

  // Check user session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem("ads_session_token");
      if (token) {
        try {
          const response = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (response.ok) {
            const user = await response.json();
            setCurrentUser(user);
            await fetchFavorites(user.id);
          } else {
            localStorage.removeItem("ads_session_token");
          }
        } catch (e) {
          console.error("Session re-verification failed", e);
        }
      }
    };

    // Load theme setting
    const savedTheme = localStorage.getItem("ads_dark_mode") === "true";
    setIsDarkMode(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme);

    checkUserSession();
    loadInitialData();
  }, []);

  // Auto-open ad details from deep link (?ad=ad-X)
  useEffect(() => {
    if (ads.length > 0) {
      const adId = new URLSearchParams(window.location.search).get("ad");
      if (adId && (!activeAdDetails || activeAdDetails.id !== adId)) {
        const found = ads.find((a) => a.id === adId);
        if (found) {
          setActiveAdDetails(found);
        }
      }
    }
  }, [ads]);

  // Synchronize browser URL query param with active ad details state
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeAdDetails) {
      url.searchParams.set("ad", activeAdDetails.id);
    } else {
      url.searchParams.delete("ad");
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeAdDetails]);

  // Sync ads on filter change
  useEffect(() => {
    fetchAllAds();
  }, [selectedCategory, searchQuery, selectedLocation, minPrice, maxPrice, onlyFeatured, currentUser]);

  // Sliding banner auto-interval
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setActiveBannerIdx((prev) => (prev + 1) % banners.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  // ----------------------------------------------------
  // IN-APP NOTIFICATIONS HANDLERS & FETCHERS
  // ----------------------------------------------------

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/notifications", {
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Error marking notifications as read:", e);
    }
  };

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!currentUser) return;
    if (!notif.isRead) {
      try {
        const response = await fetch(`/api/notifications/${notif.id}/read`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${currentUser.id}`
          }
        });
        if (response.ok) {
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        }
      } catch (e) {
        console.error("Error marking notification read:", e);
      }
    }
    
    if (notif.adId) {
      const foundAd = ads.find(a => a.id === notif.adId);
      if (foundAd) {
        setActiveAdDetails(foundAd);
      } else {
        try {
          const response = await fetch(`/api/ads/${notif.adId}`);
          if (response.ok) {
            const freshAd = await response.json();
            setActiveAdDetails(freshAd);
          }
        } catch (e) {
          console.error("Error fetching notification ad details:", e);
        }
      }
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (e) {
      console.error("Error deleting notification:", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // 10 seconds polling
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  // ----------------------------------------------------
  // INTERACTIVE AUTH ACTIONS
  // ----------------------------------------------------

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem("ads_session_token", data.token);
        setAuthSuccess("تم تسجيل الدخول بنجاح! مرحباً بك.");
        await fetchFavorites(data.user.id);
        
        setTimeout(() => {
          setShowLoginModal(false);
          setAuthSuccess("");
          setAuthEmail("");
          setAuthPassword("");
        }, 1200);
      } else {
        const err = await response.json();
        setAuthError(err.error || "فشل تسجيل الدخول، يرجى التأكد من البيانات");
      }
    } catch (e) {
      setAuthError("حدث خطأ بالاتصال بالخادم");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authEmail.trim() || !authPassword.trim() || !authName.trim() || !authPhone.trim()) {
      setAuthError("يرجى ملء جميع الحقول لتأسيس الحساب");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem("ads_session_token", data.token);
        setAuthSuccess("تم تسجيل حسابك بنجاح! تصفح الحراج الآن.");
        setFavorites([]);

        setTimeout(() => {
          setShowLoginModal(false);
          setAuthSuccess("");
          setAuthEmail("");
          setAuthPassword("");
          setAuthName("");
          setAuthPhone("");
          setIsRegisterMode(false);
        }, 1500);
      } else {
        const err = await response.json();
        setAuthError(err.error || "فشل التسجيل، يرجى المحاولة بصيغ أخرى");
      }
    } catch (e) {
      setAuthError("فشل الاتصال بخادم حراج العروبة");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setFavorites([]);
    localStorage.removeItem("ads_session_token");
    setActiveView("home");
  };

  const fillQuickDemoAccount = (role: "admin" | "user") => {
    setAuthError("");
    if (role === "admin") {
      setAuthEmail("admin@yemenads.com");
      setAuthPassword("YemenAds2026!");
    } else {
      setAuthEmail("ahmed@ads.com");
      setAuthPassword("user");
    }
  };

  // ----------------------------------------------------
  // CLASSIFIED ADS SAVE ACTIONS
  // ----------------------------------------------------

  const handleAdSave = async (adData: {
    title: string;
    description: string;
    price: number;
    location: string;
    categoryId: string;
    images: string[];
  }) => {
    if (!currentUser) return null;
    const isEdit = !!editingAd;

    try {
      const result = await saveAdToFirestore({
        ...adData,
        id: isEdit ? editingAd!.id : undefined,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        status: isEdit ? editingAd!.status : "approved",
        createdAt: isEdit ? editingAd!.createdAt : new Date().toISOString(),
        views: isEdit ? editingAd!.views : 0
      });

      setEditingAd(undefined);
      await fetchAllAds();
      return result;
    } catch (e) {
      console.error("Failed to save classified ad", e);
    }
    return null;
  };

  const handleAdDelete = async (adId: string) => {
    if (!currentUser) return;
    try {
      await deleteAdFromFirestore(adId);
      await fetchAllAds();
      // If deleted is currently showing in details modal, close it
      if (activeAdDetails?.id === adId) {
        setActiveAdDetails(null);
      }
    } catch (e) {
      console.error("Failed to delete ad", e);
    }
  };

  const handleFavoriteToggle = async (adId: string) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ adId })
      });

      if (response.ok) {
        await fetchFavorites(currentUser.id);
        await fetchAllAds(); // refresh counters / states
      }
    } catch (e) {
      console.error("Error toggling favorite", e);
    }
  };

  const handleProfileUpdate = async (name: string, phone: string, avatar: string) => {
    if (!currentUser) return null;
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ name, phone, avatar })
      });

      if (response.ok) {
        const updated = await response.json();
        setCurrentUser(updated);
        return updated;
      }
    } catch (e) {
      console.error("Error updating profile", e);
    }
    return null;
  };

  // ----------------------------------------------------
  // UTILITY INTERFACE HELPERS
  // ----------------------------------------------------

  const toggleDarkMode = () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem("ads_dark_mode", String(nextVal));
    document.documentElement.classList.toggle("dark", nextVal);
  };

  const handleGlobalSearch = (text: string, categoryId: string, location: string) => {
    setSearchQuery(text);
    setSelectedCategory(categoryId);
    setSelectedLocation(location);
    setActiveView("home");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLocation("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyFeatured(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950 transition-colors duration-200 flex flex-col font-sans">
      
      {/* Top Header Section */}
      <Header
        currentUser={currentUser}
        onLoginClick={() => {
          setIsRegisterMode(false);
          setShowLoginModal(true);
        }}
        onLogout={handleLogout}
        onAddAdClick={() => {
          if (!currentUser) {
            setShowLoginModal(true);
          } else if (currentUser.role === "admin") {
            setEditingAd(undefined);
            setActiveView("addAd");
          }
        }}
        onProfileClick={(tab) => {
          if (tab) setProfileTab(tab);
          setActiveView("profile");
        }}
        onAdminClick={() => setActiveView("admin")}
        onHomeClick={() => {
          clearFilters();
          setActiveView("home");
        }}
        onSearch={handleGlobalSearch}
        categories={categories}
        selectedCategoryId={selectedCategory}
        selectedLocation={selectedLocation}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onDeleteNotification={handleDeleteNotification}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        
        {/* 1. HOME VIEW */}
        {activeView === "home" && (
          <div className="space-y-6 sm:space-y-8">
            
            {/* Sliding Hero Banner slider */}
            {banners.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="relative h-44 sm:h-64 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800">
                  <img
                    src={banners[activeBannerIdx].imageUrl}
                    alt={banners[activeBannerIdx].titleAr}
                    className="absolute inset-0 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/45 to-transparent flex flex-col justify-center p-6 sm:p-10 text-right text-white">
                    <div className="max-w-lg space-y-2 sm:space-y-3">
                      <span className="inline-flex px-2 py-0.5 bg-white text-neutral-900 text-[9px] font-bold rounded tracking-wide uppercase">
                        إعلانات ترويجية مميزة
                      </span>
                      <h2 className="text-lg sm:text-2xl font-bold leading-tight">
                        {banners[activeBannerIdx].titleAr}
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 leading-relaxed font-light">
                        {banners[activeBannerIdx].descriptionAr}
                      </p>
                    </div>
                  </div>

                  {/* Slider index indicators */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-4 left-6 flex gap-1.5 z-10">
                      {banners.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveBannerIdx(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            activeBannerIdx === i ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Category Tabs menu */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200/60 dark:border-neutral-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 mb-3.5 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-neutral-400" />
                  تصفح الفئات الرئيسية المعروضة
                </h3>
                
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`p-2.5 rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                      selectedCategory === ""
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent font-semibold shadow-sm"
                        : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${selectedCategory === "" ? "bg-white/10" : "bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm text-neutral-500"}`}>
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-medium">كل المعروض</span>
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-2.5 rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                        selectedCategory === cat.id
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-transparent font-semibold shadow-sm"
                          : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${selectedCategory === cat.id ? "bg-white/10" : "bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm text-neutral-500"}`}>
                        <CategoryIcon name={cat.icon} className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-medium truncate max-w-full text-center">{cat.nameAr}</span>
                      {cat.count !== undefined && cat.count > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}>
                          {cat.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters panel and Grid Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Right Side Filter controls (Desktop) */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 p-5 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] h-fit space-y-5 text-right">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
                    تصفية وبحث متطور
                  </h3>
                  {(searchQuery || selectedCategory || selectedLocation || minPrice || maxPrice || onlyFeatured) && (
                    <button
                      onClick={clearFilters}
                      className="text-[10px] font-semibold text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:underline cursor-pointer"
                    >
                      إعادة ضبط
                    </button>
                  )}
                </div>

                {/* Location Search selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 block">البحث بالمدينة</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white"
                  >
                    <option value="">كل المدن اليمنية</option>
                    <option value="صنعاء">صنعاء</option>
                    <option value="عدن">عدن</option>
                    <option value="تعز">تعز</option>
                    <option value="الحديدة">الحديدة</option>
                    <option value="إب">إب</option>
                    <option value="المكلا">المكلا</option>
                    <option value="ذمار">ذمار</option>
                    <option value="مأرب">مأرب</option>
                    <option value="سيئون">سيئون</option>
                  </select>
                </div>

                {/* Price Range inputs */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 block">نطاق السعر المطلوب (ريال)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="الأدنى"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white placeholder-slate-400"
                    />
                    <input
                      type="number"
                      placeholder="الأعلى"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Only featured checkbox */}
                <div className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="onlyFeaturedCheck"
                    checked={onlyFeatured}
                    onChange={(e) => setOnlyFeatured(e.target.checked)}
                    className="h-3.5 w-3.5 text-neutral-900 dark:text-white focus:ring-neutral-500 border-neutral-300 dark:border-neutral-700 rounded cursor-pointer"
                  />
                  <label htmlFor="onlyFeaturedCheck" className="text-xs font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer">
                    عرض الإعلانات المميزة فقط ⭐
                  </label>
                </div>
              </div>

              {/* Left Side Ads Grid */}
              <div className="lg:col-span-3 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-neutral-400" />
                    آخر الإعلانات المدرجة حديثاً بالمنصة
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-medium">عدد النتائج: {ads.length} إعلان</span>
                </div>

                {ads.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-full w-fit mx-auto mb-3 text-neutral-400">
                      <Megaphone className="h-8 w-8" />
                    </div>
                    <h4 className="text-sm font-bold text-neutral-800 dark:text-white mb-1">لا توجد إعلانات تطابق البحث حالياً</h4>
                    <p className="text-xs text-neutral-400 mb-4">جرب تصفية البحث بكلمات أخرى أو تغيير نطاق السعر والمدن.</p>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg text-xs hover:bg-neutral-800 transition-colors cursor-pointer shadow-sm"
                    >
                      عرض جميع العروض المتاحة
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map((ad) => {
                      const cat = categories.find((c) => c.id === ad.categoryId);
                      return (
                        <AdCard
                          key={ad.id}
                          ad={ad}
                          category={cat}
                          isFavorited={favorites.some((f) => f.id === ad.id)}
                          onFavoriteToggle={handleFavoriteToggle}
                          onCardClick={() => setActiveAdDetails(ad)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 2. ADD CLASS AD FORM */}
        {activeView === "addAd" && (
          <AddAdForm
            categories={categories}
            onSubmit={handleAdSave}
            onCancel={() => setActiveView("home")}
            initialAd={editingAd}
          />
        )}

        {/* 3. USER PROFILE TAB VIEW */}
        {activeView === "profile" && currentUser && (
          <UserProfile
            currentUser={currentUser}
            categories={categories}
            ads={ads}
            favorites={favorites}
            onUpdateProfile={handleProfileUpdate}
            onAdEditClick={(ad) => {
              setEditingAd(ad);
              setActiveView("addAd");
            }}
            onAdDelete={handleAdDelete}
            onAdClick={(ad) => setActiveAdDetails(ad)}
            activeTab={profileTab}
            setActiveTab={setProfileTab}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}

        {/* 4. ADMIN CONTROL PANEL VIEW */}
        {activeView === "admin" && currentUser && currentUser.role === "admin" && (
          <AdminPanel
            currentUser={currentUser}
            categories={categories}
            ads={ads}
            onReloadData={loadInitialData}
          />
        )}

      </main>

      {/* Ad details immersive popup */}
      {activeAdDetails && (
        <AdDetailsModal
          ad={activeAdDetails}
          category={categories.find((c) => c.id === activeAdDetails.categoryId)}
          currentUser={currentUser}
          onClose={() => setActiveAdDetails(null)}
          isFavorited={favorites.some((f) => f.id === activeAdDetails.id)}
          onFavoriteToggle={handleFavoriteToggle}
          onAdClick={(ad) => setActiveAdDetails(ad)}
          allAds={ads}
        />
      )}

      {/* Authentication Login/Register Dynamic Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-xl p-5 sm:p-6 relative text-right animate-scaleUp">
            
            {/* Close */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 left-4 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Header info */}
            <div className="text-center space-y-2 mb-5">
              <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg w-fit mx-auto shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <Megaphone className="h-5 w-5 transform -rotate-12" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {isRegisterMode ? "تسجيل حساب جديد بالكامل" : "دخول إلى حساب حراج العروبة"}
              </h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light">
                {isRegisterMode 
                  ? "سجل حسابك مجاناً لتتمكن من عرض إعلاناتك وإدارة المحادثات" 
                  : "أهلاً بك مجدداً! سجّل الآن لمراسلة البائعين وإضافة المفضلة"}
              </p>
            </div>

            {/* Feedback notifications */}
            {authError && (
              <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold border border-rose-100 dark:border-rose-900/40">
                <span>⚠️ {authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>{authSuccess}</span>
              </div>
            )}



            {/* Auth forms */}
            <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">
              
              {/* Full name (Register only) */}
              {isRegisterMode && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">الاسم الكريم بالكامل</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="مثال: صالح الدوسري"
                      className="w-full pl-3 pr-10 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white placeholder-neutral-400"
                    />
                    <UserIcon className="absolute top-2.5 right-3 h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-3 pr-10 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white placeholder-neutral-400 text-right"
                  />
                  <Mail className="absolute top-2.5 right-3 h-4 w-4 text-neutral-400" />
                </div>
              </div>

              {/* Phone number (Register only) */}
              {isRegisterMode && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block">رقم الجوال للتواصل</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="05xxxxxxx"
                      className="w-full pl-3 pr-10 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white placeholder-neutral-400 text-right"
                    />
                    <Phone className="absolute top-2.5 right-3 h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block">كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white placeholder-neutral-400 text-right"
                  />
                  <Lock className="absolute top-2.5 right-3 h-4 w-4 text-neutral-400" />
                </div>
              </div>

              {/* Action trigger */}
              <button
                type="submit"
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                {isRegisterMode ? "تأسيس الحساب والمتابعة" : "تسجيل الدخول الآمن"}
              </button>

              {!isRegisterMode && (
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                  <p className="text-[10px] text-center font-bold text-neutral-400 dark:text-neutral-500">
                    دخول سريع للحسابات التجريبية:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fillQuickDemoAccount("user")}
                      className="py-1.5 px-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold transition-all border border-neutral-200/60 dark:border-neutral-800"
                    >
                      👤 حساب عميل تجريبي
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDemoAccount("admin")}
                      className="py-1.5 px-2 bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold transition-all border border-amber-200/40 dark:border-amber-900/30"
                    >
                      👑 حساب المدير (الأدمن)
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Register Mode toggle footer link */}
            <div className="text-center mt-5 text-xs text-neutral-400">
              {isRegisterMode ? (
                <p>
                  تملك حساباً مسجلاً بالفعل؟{" "}
                  <button
                    onClick={() => {
                      setAuthError("");
                      setIsRegisterMode(false);
                    }}
                    className="text-neutral-950 dark:text-white font-bold hover:underline cursor-pointer"
                  >
                    سجل دخولك هنا
                  </button>
                </p>
              ) : (
                <p>
                  ليس لديك حساب حتى الآن؟{" "}
                  <button
                    onClick={() => {
                      setAuthError("");
                      setIsRegisterMode(true);
                    }}
                    className="text-neutral-950 dark:text-white font-bold hover:underline cursor-pointer"
                  >
                    افتح حساباً مجانياً الآن
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200/60 dark:border-neutral-800/80 py-8 text-xs text-neutral-400 mt-auto text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Contacts Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/x5tai?igsh=cDV5Ym5vaTVleXJt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-102 border border-neutral-100 dark:border-neutral-800/60 group"
            >
              <div className="p-2 bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 rounded-lg group-hover:bg-pink-100 transition-colors">
                <Instagram className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] text-neutral-400 font-semibold">انستجرام</span>
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">@x5tai</span>
              </div>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/1Cah5cfRV8/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-102 border border-neutral-100 dark:border-neutral-800/60 group"
            >
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Facebook className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] text-neutral-400 font-semibold">فيس بوك</span>
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">Yemen Ads Share</span>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:779217474"
              className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-102 border border-neutral-100 dark:border-neutral-800/60 group"
            >
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg group-hover:bg-amber-100 transition-colors">
                <Phone className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <span className="block text-[10px] text-neutral-400 font-semibold">اتصال مباشر</span>
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200 font-mono">779217474</span>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/967775082143"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all hover:scale-102 border border-neutral-100 dark:border-neutral-800/60 group"
            >
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[10px] text-neutral-400 font-semibold">واتساب</span>
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200 font-mono">+967 775082143</span>
              </div>
            </a>
          </div>

          {/* Copyrights row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
            <p>جميع الحقوق محفوظة في <span className="font-extrabold text-neutral-700 dark:text-white">Yemen Ads</span> © 2026.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-neutral-950 dark:hover:text-white">الشروط والأحكام</a>
              <a href="#" className="hover:text-neutral-950 dark:hover:text-white">سياسة الخصوصية</a>
              <a href="#" className="hover:text-neutral-950 dark:hover:text-white">الدعم الفني والشكاوى</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
