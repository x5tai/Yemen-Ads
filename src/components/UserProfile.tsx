import React, { useState, useEffect, useRef } from "react";
import { User, Ad, ChatThread, Message, Category } from "../types";
import { 
  User as UserIcon, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Heart, 
  Settings, 
  Trash2, 
  Edit, 
  Send, 
  ShieldAlert, 
  Megaphone,
  Check,
  Briefcase
} from "lucide-react";
import { AdCard } from "./AdCard";

interface UserProfileProps {
  currentUser: User;
  categories: Category[];
  ads: Ad[];
  favorites: Ad[];
  onUpdateProfile: (name: string, phone: string, avatar: string) => Promise<User | null>;
  onAdEditClick: (ad: Ad) => void;
  onAdDelete: (adId: string) => Promise<void>;
  onAdClick: (ad: Ad) => void;
  activeTab: string; // "ads" | "messages" | "favorites" | "settings"
  setActiveTab: (tab: string) => void;
  onFavoriteToggle: (adId: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  categories,
  ads,
  favorites,
  onUpdateProfile,
  onAdEditClick,
  onAdDelete,
  onAdClick,
  activeTab = "ads",
  setActiveTab,
  onFavoriteToggle,
}) => {
  // Profile settings state
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatar || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Chat threads state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    setProfileName(currentUser.name);
    setProfilePhone(currentUser.phone);
    setProfileAvatar(currentUser.avatar || "");
  }, [currentUser]);

  // Load chat threads from database API
  const fetchThreads = async () => {
    try {
      const response = await fetch("/api/chats", {
        headers: { "Authorization": `Bearer ${currentUser.id}` }
      });
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
        
        // Auto-select first thread if nothing is selected or keep current selected updated
        if (data.length > 0) {
          if (!activeThread) {
            setActiveThread(data[0]);
          } else {
            const updatedActive = data.find(
              (t: ChatThread) => t.partnerId === activeThread.partnerId && t.adId === activeThread.adId
            );
            if (updatedActive) {
              setActiveThread(updatedActive);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error loading chat threads", e);
    }
  };

  useEffect(() => {
    if (activeTab === "messages") {
      fetchThreads();
      // Poll for messages every 5 seconds for a realistic simulation
      const interval = setInterval(fetchThreads, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeThread?.partnerId, activeThread?.adId]);

  // Scroll to chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);

    if (!profileName.trim() || !profilePhone.trim()) {
      setProfileError("جميع الحقول مطلوبة لتعديل الحساب");
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await onUpdateProfile(profileName, profilePhone, profileAvatar);
      if (updated) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 2000);
      } else {
        setProfileError("خطأ في تحديث البيانات، يرجى المحاولة مرة أخرى");
      }
    } catch (err: any) {
      setProfileError(err.message || "فشل الاتصال بالخادم");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeThread) return;

    setIsSendingMessage(true);
    try {
      const response = await fetch("/api/chats/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          receiverId: activeThread.partnerId,
          adId: activeThread.adId,
          content: newMessageText.trim()
        })
      });

      if (response.ok) {
        setNewMessageText("");
        // Instantly reload threads to get the new message in the active thread list
        await fetchThreads();
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Filter ads posted by this current user
  const userAds = ads.filter((ad) => ad.userId === currentUser.id);

  // Predefined avatars to pick from easily
  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  ];

  return (
    <div className="max-w-7xl mx-auto my-6 px-4">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-xl p-6 sm:p-8 text-neutral-800 dark:text-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right mb-8">
        <img
          src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
          alt={currentUser.name}
          className="h-20 w-20 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{currentUser.name}</h2>
            {currentUser.role === "admin" && (
              <span className="inline-flex self-center sm:self-auto px-2 py-0.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-[9px] rounded">
                مدير المنصة
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center justify-center sm:justify-start gap-1">
            <Phone className="h-3.5 w-3.5" />
            <span>الجوال: {currentUser.phone}</span>
          </p>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
            تاريخ الانضمام: {new Date(currentUser.createdAt).toLocaleDateString("ar-SA", { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-6 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("ads")}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "ads"
              ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <Megaphone className="h-4 w-4" />
          إعلاناتي المعروضة ({userAds.length})
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "messages"
              ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          صندوق الدردشة ({threads.length})
        </button>

        <button
          onClick={() => setActiveTab("favorites")}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "favorites"
              ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <Heart className="h-4 w-4" />
          الإعلانات المفضلة ({favorites.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "settings"
              ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <Settings className="h-4 w-4" />
          إعدادات الملف الشخصي
        </button>
      </div>

      {/* Tabs Content */}
      <div className="animate-fadeIn">
        
        {/* 1. MY ADS TAB */}
        {activeTab === "ads" && (
          <div className="space-y-6">
            {userAds.length === 0 ? (
              <div className="text-center p-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <p className="text-neutral-400 font-medium mb-4 text-sm">لم تقم بإضافة أي إعلان في حراج العروبة حتى الآن.</p>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg text-xs hover:bg-neutral-800 transition-colors"
                >
                  تعديل معلومات الحساب أو أضف إعلاناً جديداً من الأعلى
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {userAds.map((ad) => {
                  const cat = categories.find((c) => c.id === ad.categoryId);
                  return (
                    <div key={ad.id} className="relative group">
                      <AdCard
                        ad={ad}
                        category={cat}
                        isFavorited={favorites.some((f) => f.id === ad.id)}
                        onFavoriteToggle={onFavoriteToggle}
                        onCardClick={() => onAdClick(ad)}
                        showAdminStatus={true}
                      />
                      
                      {/* Edit/Delete Overlay actions bar */}
                      <div className="absolute bottom-16 left-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdEditClick(ad);
                          }}
                          className="flex-1 py-2 bg-white/95 dark:bg-neutral-900/95 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-100 font-semibold text-xs rounded-lg shadow border border-neutral-200 dark:border-neutral-800 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          تعديل الإعلان
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("هل أنت متأكد تماماً من رغبتك بحذف هذا الإعلان نهائياً؟")) {
                              onAdDelete(ad.id);
                            }
                          }}
                          className="p-2 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 rounded-lg shadow flex items-center justify-center cursor-pointer"
                          title="حذف الإعلان"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. CHAT / MESSAGES INBOX TAB */}
        {activeTab === "messages" && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[550px]">
            {/* Threads sidebar list */}
            <div className="border-l border-neutral-200/60 dark:border-neutral-800 p-4 space-y-4">
              <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-neutral-400" />
                المحادثات الواردة
              </h3>
              <div className="h-[1px] bg-neutral-100 dark:bg-neutral-800"></div>

              {threads.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-12">لا توجد محادثات أو رسائل نشطة حالياً.</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[420px]">
                  {threads.map((thread) => {
                    const isSelected = activeThread?.partnerId === thread.partnerId && activeThread?.adId === thread.adId;
                    return (
                      <div
                        key={`${thread.adId}_${thread.partnerId}`}
                        onClick={() => setActiveThread(thread)}
                        className={`p-3 rounded-lg cursor-pointer transition-all border text-right ${
                          isSelected
                            ? "bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                            : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-neutral-800 dark:text-white truncate max-w-[120px]">
                            {thread.partnerName}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(thread.lastMessageTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold truncate mb-1 flex items-center gap-1">
                          <Briefcase className="h-3 w-3 shrink-0 text-neutral-400" />
                          {thread.adTitle}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                          {thread.lastMessage}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Chat area */}
            <div className="col-span-2 flex flex-col h-full min-h-[550px] bg-neutral-50/20 dark:bg-neutral-950/20">
              {activeThread ? (
                <>
                  {/* Chat header details */}
                  <div className="bg-white dark:bg-neutral-900 p-4 border-b border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-white">
                        {activeThread.partnerName}
                      </h4>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        حول إعلان: {activeThread.adTitle}
                      </p>
                    </div>
                  </div>

                  {/* Message bubbles body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col max-h-[380px]">
                    {activeThread.messages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                        >
                          <div
                            className={`p-3 rounded-lg text-xs sm:text-sm leading-relaxed ${
                              isMe
                                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-tl-none font-medium"
                                : "bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border border-neutral-200/60 dark:border-neutral-800 rounded-tr-none"
                            }`}
                          >
                            <p>{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Send panel footer */}
                  <form
                    onSubmit={handleSendMessageSubmit}
                    className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200/60 dark:border-neutral-800 flex gap-2 items-center shrink-0"
                  >
                    <input
                      type="text"
                      required
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="اكتب رسالتك وتواصل فوراً مع الطرف الآخر..."
                      className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white placeholder-neutral-400"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !newMessageText.trim()}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 text-white rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
                    >
                      <Send className="h-4 w-4 transform rotate-180" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <MessageSquare className="h-8 w-8 text-neutral-300 mb-2" />
                  <p className="text-neutral-400 text-xs">
                    يرجى اختيار محادثة نشطة من القائمة الجانبية لبدء المراسلة والتفاوض.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. BOOKMARKED FAVORITES TAB */}
        {activeTab === "favorites" && (
          <div className="space-y-6">
            {favorites.length === 0 ? (
              <div className="text-center p-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <p className="text-neutral-400 font-medium mb-4 text-sm">قائمة إعلاناتك المفضلة فارغة حالياً.</p>
                <p className="text-xs text-neutral-400 font-light">تصفح الإعلانات وانقر على رمز القلب لحفظ الإعلانات التي تهمك للعودة إليها لاحقاً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {favorites.map((ad) => {
                  const cat = categories.find((c) => c.id === ad.categoryId);
                  return (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      category={cat}
                      isFavorited={true}
                      onFavoriteToggle={onFavoriteToggle}
                      onCardClick={() => onAdClick(ad)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. SETTINGS EDITOR TAB */}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 sm:p-8 max-w-2xl mx-auto">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-6">
              تعديل تفاصيل حسابك الشخصي
            </h3>

            {profileError && (
              <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold border border-rose-100 dark:border-rose-900/40">
                <span>⚠️ {profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="mb-4 p-2.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                <span>تم حفظ تعديلات حسابك بنجاح.</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-6">
              {/* Profile Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
                  اسم العضو بالكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white"
                />
              </div>

              {/* Profile Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
                  رقم الجوال للتواصل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white"
                />
              </div>

              {/* Profile Avatar Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
                  اختر رمزاً تعبيرياً أو صورة شخصية:
                </label>
                
                <div className="grid grid-cols-4 gap-3 max-w-md">
                  {avatarPresets.map((preset, i) => (
                    <div
                      key={i}
                      onClick={() => setProfileAvatar(preset)}
                      className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${
                        profileAvatar === preset
                          ? "border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 dark:ring-white/10"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                      }`}
                    >
                      <img
                        src={preset}
                        alt={`Avatar preset ${i}`}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {profileAvatar === preset && (
                        <div className="absolute top-1 right-1 p-0.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 block">أو أدخل رابطاً مباشراً لصورتك المفضلة:</span>
                  <input
                    type="url"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                >
                  {isUpdating ? "جاري حفظ التعديلات..." : "حفظ التغييرات الآن"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
