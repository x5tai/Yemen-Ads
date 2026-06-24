import React, { useState, useEffect } from "react";
import { User, Ad, Category, Banner } from "../types";
import { 
  ShieldAlert, 
  BarChart2, 
  Layers, 
  Users, 
  Megaphone, 
  Check, 
  X, 
  Star, 
  Trash2, 
  Plus, 
  Edit, 
  MessageSquare,
  AlertTriangle,
  FolderPlus,
  Image as ImageIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { CategoryIcon } from "./Icons";

interface AdminPanelProps {
  currentUser: User;
  categories: Category[];
  ads: Ad[];
  onReloadData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  categories,
  ads,
  onReloadData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"stats" | "ads" | "users" | "categories" | "banners">("stats");
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Category Form State
  const [newCatNameAr, setNewCatNameAr] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("HelpCircle");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Banner Form State
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerDesc, setNewBannerDesc] = useState("");
  const [newBannerImg, setNewBannerImg] = useState("");
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/metrics", {
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Failed to load users", e);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await fetch("/api/banners");
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      }
    } catch (e) {
      console.error("Failed to load banners", e);
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    setActionError("");
    setActionSuccess("");
    await Promise.all([fetchMetrics(), fetchUsers(), fetchBanners()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser.role === "admin") {
      loadAdminData();
    }
  }, [activeSubTab, ads]);

  // Handle ad moderation approval
  const handleAdStatusChange = async (adId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/ads/${adId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setActionSuccess(`تم تغيير حالة الإعلان بنجاح إلى: ${status === "approved" ? "مقبول ونشط" : "مرفوض"}`);
        setTimeout(() => setActionSuccess(""), 3000);
        onReloadData(); // reload global app data
      } else {
        const err = await response.json();
        setActionError(err.error || "فشل تغيير حالة الإعلان");
      }
    } catch (e) {
      setActionError("فشل الاتصال بالخادم");
    }
  };

  // Handle ad featuring
  const handleAdFeatureChange = async (adId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/ads/${adId}/feature`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ isFeatured })
      });

      if (response.ok) {
        setActionSuccess(isFeatured ? "تم تمييز الإعلان وتثبيته في واجهة المنصة" : "تم إلغاء تمييز الإعلان");
        setTimeout(() => setActionSuccess(""), 3000);
        onReloadData();
      } else {
        const err = await response.json();
        setActionError(err.error || "فشل تعديل حالة تميز الإعلان");
      }
    } catch (e) {
      setActionError("فشل الاتصال بالخادم");
    }
  };

  // Handle deleting ad
  const handleAdDelete = async (adId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان نهائياً من قاعدة البيانات؟")) return;
    try {
      const response = await fetch(`/api/ads/${adId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });

      if (response.ok) {
        setActionSuccess("تم حذف الإعلان بنجاح من المنصة");
        setTimeout(() => setActionSuccess(""), 3000);
        onReloadData();
      }
    } catch (e) {
      setActionError("فشل إتمام عملية الحذف");
    }
  };

  // Handle User Blocking
  const handleUserBlockChange = async (userId: string, isBlocked: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ isBlocked })
      });

      if (response.ok) {
        setActionSuccess(isBlocked ? "تم حظر المستخدم وحجب إعلاناته بنجاح" : "تم إلغاء حظر الحساب بنجاح");
        setTimeout(() => setActionSuccess(""), 3000);
        await fetchUsers();
        onReloadData();
      } else {
        const err = await response.json();
        setActionError(err.error || "فشل تعديل حالة الحظر");
      }
    } catch (e) {
      setActionError("فشل الاتصال بالخادم");
    }
  };

  // Handle User Deleting
  const handleUserDelete = async (userId: string) => {
    if (!confirm("هل أنت متأكد تماماً من حذف هذا المستخدم وجميع إعلاناته المعروضة نهائياً؟")) return;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });

      if (response.ok) {
        setActionSuccess("تم حذف حساب العضو وإعلاناته بالكامل");
        setTimeout(() => setActionSuccess(""), 3000);
        await fetchUsers();
        onReloadData();
      } else {
        const err = await response.json();
        setActionError(err.error || "فشل حذف حساب العضو");
      }
    } catch (e) {
      setActionError("فشل إتمام العملية");
    }
  };

  // Add Category Handler
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!newCatNameAr.trim() || !newCatNameEn.trim()) {
      setActionError("يرجى ملء جميع الحقول المطلوبة للتصنيف");
      return;
    }

    setIsAddingCategory(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          nameAr: newCatNameAr.trim(),
          nameEn: newCatNameEn.trim(),
          icon: newCatIcon
        })
      });

      if (response.ok) {
        setActionSuccess("تمت إضافة التصنيف الجديد بنجاح");
        setNewCatNameAr("");
        setNewCatNameEn("");
        setNewCatIcon("HelpCircle");
        setTimeout(() => setActionSuccess(""), 3000);
        onReloadData();
      } else {
        const err = await response.json();
        setActionError(err.error || "فشل إضافة التصنيف");
      }
    } catch (e) {
      setActionError("فشل الاتصال بالخادم");
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Add Banner Handler
  const handleAddBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!newBannerTitle.trim() || !newBannerDesc.trim() || !newBannerImg.trim()) {
      setActionError("يرجى ملء جميع حقول البنر لإتاحته");
      return;
    }

    setIsAddingBanner(true);
    try {
      const response = await fetch("/api/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          titleAr: newBannerTitle.trim(),
          descriptionAr: newBannerDesc.trim(),
          imageUrl: newBannerImg.trim()
        })
      });

      if (response.ok) {
        setActionSuccess("تم حفظ ونشر البنر الترويجي الجديد بنجاح");
        setNewBannerTitle("");
        setNewBannerDesc("");
        setNewBannerImg("");
        setTimeout(() => setActionSuccess(""), 3000);
        await fetchBanners();
      } else {
        const err = await response.json();
        setActionError(err.error || "فشل إضافة البنر");
      }
    } catch (e) {
      setActionError("فشل الاتصال بالخادم");
    } finally {
      setIsAddingBanner(false);
    }
  };

  // Delete Banner Handler
  const handleBannerDelete = async (bannerId: string) => {
    if (!confirm("هل تريد حذف هذا البنر الترويجي؟")) return;
    try {
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      if (response.ok) {
        setActionSuccess("تم حذف البنر الترويجي");
        setTimeout(() => setActionSuccess(""), 3000);
        await fetchBanners();
      }
    } catch (e) {
      setActionError("حدث خطأ أثناء الحذف");
    }
  };

  // Available lucide icons for categories select
  const availableIcons = ["Car", "Home", "Smartphone", "Briefcase", "Wrench", "Sofa", "BookOpen", "Camera", "Flame", "Gift"];

  const COLORS = ["#059669", "#d97706", "#2563eb", "#db2777", "#7c3aed", "#4b5563"];

  return (
    <div className="max-w-7xl mx-auto my-6 px-4">
      
      {/* Admin Title Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-amber-500 rounded-2xl text-white shadow-md shadow-amber-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">لوحة الإشراف وإدارة المنصة</h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              مرحباً {currentUser.name}. تحكّم بالإعلانات، راقب الأعضاء، ونظّم الأقسام التفاعلية.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Subtabs Selector */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 mb-8 gap-1">
        <button
          onClick={() => setActiveSubTab("stats")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === "stats"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <BarChart2 className="h-4.5 w-4.5" />
          الإحصائيات والتقارير
        </button>

        <button
          onClick={() => setActiveSubTab("ads")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === "ads"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Megaphone className="h-4.5 w-4.5" />
          إدارة الإعلانات ({ads.length})
        </button>

        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === "users"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          إدارة المستخدمين ({users.length})
        </button>

        <button
          onClick={() => setActiveSubTab("categories")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === "categories"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Layers className="h-4.5 w-4.5" />
          إدارة التصنيفات ({categories.length})
        </button>

        <button
          onClick={() => setActiveSubTab("banners")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === "banners"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <ImageIcon className="h-4.5 w-4.5" />
          إعلانات السلايدر (البنرات)
        </button>
      </div>

      {/* Feedback Messages */}
      {actionError && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold border border-rose-100 dark:border-rose-900 flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5" />
          <span>⚠️ {actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-2">
          <Check className="h-4.5 w-4.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Subtab Contents */}
      <div className="animate-fadeIn">
        
        {/* 1. STATISTICS TAB */}
        {activeSubTab === "stats" && metrics && (
          <div className="space-y-8">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">إجمالي الإعلانات المعروضة</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white font-mono block">
                  {metrics.summary.totalAds}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                  ✓ {metrics.summary.activeAds} معتمد ونشط
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">إعلانات بانتظار الموافقة</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono block">
                  {metrics.summary.pendingAds}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold block mt-1">
                  ⚠ تتطلب المراجعة الفورية
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">عدد المستخدمين المسجلين</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono block">
                  {metrics.summary.totalUsers}
                </span>
                <span className="text-[10px] text-red-500 font-semibold block mt-1">
                  ✗ {metrics.summary.blockedUsers} مستخدم محظور
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl text-right">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">إجمالي الرسائل المتبادلة</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-500 font-mono block">
                  {metrics.summary.totalChats}
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold block mt-1">
                  💬 تفاعل ممتاز بين الأعضاء
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white mb-6">
                توزيع الإعلانات المبوبة حسب التصنيفات الرئيسية
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.categoryChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis 
                      tick={{ fill: "#94a3b8", fontSize: 11 }} 
                      axisLine={{ stroke: "#e2e8f0" }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1e293b", 
                        border: "none", 
                        borderRadius: "12px", 
                        color: "#fff",
                        textAlign: "right",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {metrics.categoryChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 2. ADS MODERATION TAB */}
        {activeSubTab === "ads" && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/60">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">إدارة إعلانات الأعضاء</h3>
              <p className="text-xs text-slate-400 mt-1">وافق على الإعلانات المعلقة، ميز الإعلانات المدفوعة، أو احذف الإعلانات المخالفة.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-extrabold">
                    <th className="p-4">تفاصيل الإعلان</th>
                    <th className="p-4">الناشر</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">المدينة</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-left">العمليات والموافقة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {ads.map((ad) => {
                    return (
                      <tr key={ad.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={ad.images[0]}
                              alt={ad.title}
                              className="h-10 w-14 rounded-lg object-cover border border-slate-100 dark:border-slate-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 max-w-[200px]">{ad.title}</h4>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">المعرف: {ad.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{ad.userName}</td>
                        <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{ad.price.toLocaleString()} ريال</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">{ad.location}</td>
                        <td className="p-4">
                          {ad.status === "pending" && (
                            <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-lg text-[10px] font-bold">
                              بانتظار المراجعة
                            </span>
                          )}
                          {ad.status === "approved" && (
                            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold">
                              نشط وموافق عليه
                            </span>
                          )}
                          {ad.status === "rejected" && (
                            <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-bold">
                              مرفوض
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve button */}
                            {ad.status !== "approved" && (
                              <button
                                onClick={() => handleAdStatusChange(ad.id, "approved")}
                                className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                                title="قبول ونشر الإعلان"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            
                            {/* Reject button */}
                            {ad.status !== "rejected" && (
                              <button
                                onClick={() => handleAdStatusChange(ad.id, "rejected")}
                                className="p-1.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                                title="رفض الإعلان"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}

                            {/* Toggle Feature button */}
                            <button
                              onClick={() => handleAdFeatureChange(ad.id, !ad.isFeatured)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                ad.isFeatured
                                  ? "bg-amber-500 text-white hover:bg-amber-600"
                                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white"
                              }`}
                              title={ad.isFeatured ? "إلغاء تمييز الإعلان" : "تمييز الإعلان وتثبيته بالسلايدر"}
                            >
                              <Star className={`h-4 w-4 ${ad.isFeatured ? "fill-current" : ""}`} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleAdDelete(ad.id)}
                              className="p-1.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="حذف نهائي"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. USER MANAGEMENT TAB */}
        {activeSubTab === "users" && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/60">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">إدارة مستخدمي وأعضاء المنصة</h3>
              <p className="text-xs text-slate-400 mt-1">راقب الأعضاء المسجلين، احظر الحسابات الوهمية أو المزعجة لتوفير بيئة تصفح آمنة.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-extrabold">
                    <th className="p-4">صورة العضو</th>
                    <th className="p-4">البريد الإلكتروني</th>
                    <th className="p-4">الجوال</th>
                    <th className="p-4">تاريخ التسجيل</th>
                    <th className="p-4">الصلاحية</th>
                    <th className="p-4 text-left">خيارات التحكم والتحذير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {users.map((u) => {
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="p-4 font-bold text-slate-800 dark:text-white">
                          <div className="flex items-center gap-2">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="h-8 w-8 rounded-lg object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono font-medium">{u.email}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 font-bold">{u.phone}</td>
                        <td className="p-4 text-slate-400 font-medium">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
                        <td className="p-4">
                          {u.role === "admin" ? (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold rounded">
                              مدير المنصة
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded">
                              عضو عادي
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-left">
                          {u.id !== "usr-admin" && (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Block / Unblock Toggle */}
                              <button
                                onClick={() => handleUserBlockChange(u.id, !u.isBlocked)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  u.isBlocked
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:bg-emerald-950"
                                    : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-950/20"
                                }`}
                              >
                                {u.isBlocked ? "إلغاء الحظر" : "حظر العضو"}
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => handleUserDelete(u.id)}
                                className="p-1.5 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="حذف المستخدم نهائياً"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. CATEGORIES TAB */}
        {activeSubTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List existing categories */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                التصنيفات المتاحة حالياً بالمنصة
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm">
                        <CategoryIcon name={cat.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{cat.nameAr}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">EN: {cat.nameEn}</span>
                      </div>
                    </div>
                    
                    {/* Delete dynamic categories */}
                    {cat.id !== "cat-cars" && cat.id !== "cat-realestate" && (
                      <button
                        onClick={async () => {
                          if (!confirm(`هل أنت متأكد من حذف تصنيف "${cat.nameAr}" بالكامل؟`)) return;
                          const res = await fetch(`/api/categories/${cat.id}`, {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${currentUser.id}` }
                          });
                          if (res.ok) {
                            setActionSuccess("تم حذف التصنيف بنجاح");
                            setTimeout(() => setActionSuccess(""), 3000);
                            onReloadData();
                          }
                        }}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                        title="حذف التصنيف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Create Category Form */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm text-right">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4 flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-emerald-600" />
                إضافة تصنيف جديد
              </h3>

              <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    الاسم بالعربية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatNameAr}
                    onChange={(e) => setNewCatNameAr(e.target.value)}
                    placeholder="مثال: قوارب ويخوت"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none dark:text-white placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    الاسم بالإنجليزية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    placeholder="مثال: Boats & Yachts"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none dark:text-white placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    الرمز التعبيري (الأيقونة) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none dark:text-white"
                  >
                    {availableIcons.map((ico) => (
                      <option key={ico} value={ico}>
                        {ico}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAddingCategory}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {isAddingCategory ? "جاري الإضافة..." : "حفظ وإدراج التصنيف"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 5. BANNERS MANAGEMENT TAB */}
        {activeSubTab === "banners" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
            {/* List Active Banners */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                البنرات الإعلانية النشطة في واجهة الموقع
              </h3>

              {banners.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">لا توجد بنرات نشطة.</p>
              ) : (
                <div className="space-y-4">
                  {banners.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4"
                    >
                      <img
                        src={b.imageUrl}
                        alt={b.titleAr}
                        className="h-20 w-32 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{b.titleAr}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{b.descriptionAr}</p>
                      </div>
                      <button
                        onClick={() => handleBannerDelete(b.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="حذف البنر"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Banner Form */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                إضافة بنر ترويجي جديد
              </h3>

              <form onSubmit={handleAddBannerSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    عنوان البنر الرئيسي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    placeholder="مثال: مهرجان تحطيم أسعار السيارات"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none dark:text-white placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    الوصف المختصر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBannerDesc}
                    onChange={(e) => setNewBannerDesc(e.target.value)}
                    placeholder="وصف ترويجي يجذب المشاهدين للنقر"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none dark:text-white placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    رابط الصورة المباشر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={newBannerImg}
                    onChange={(e) => setNewBannerImg(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none dark:text-white placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingBanner}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {isAddingBanner ? "جاري الحفظ..." : "نشر البنر في الهيرو"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
