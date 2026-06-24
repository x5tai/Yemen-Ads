import React, { useState } from "react";
import { 
  Megaphone, 
  Search, 
  PlusCircle, 
  User as UserIcon, 
  MessageSquare, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon, 
  SlidersHorizontal,
  Home,
  Bookmark,
  Bell,
  BellOff,
  Trash2,
  Check
} from "lucide-react";
import { User, InAppNotification } from "../types";

interface HeaderProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onAddAdClick: () => void;
  onProfileClick: (tab?: string) => void;
  onAdminClick: () => void;
  onHomeClick: () => void;
  onSearch: (text: string, categoryId: string, location: string) => void;
  categories: { id: string; nameAr: string; icon: string }[];
  selectedCategoryId: string;
  selectedLocation: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notifications: InAppNotification[];
  onNotificationClick: (notif: InAppNotification) => void;
  onMarkAllNotificationsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLoginClick,
  onLogout,
  onAddAdClick,
  onProfileClick,
  onAdminClick,
  onHomeClick,
  onSearch,
  categories,
  selectedCategoryId,
  selectedLocation,
  isDarkMode,
  toggleDarkMode,
  notifications,
  onNotificationClick,
  onMarkAllNotificationsRead,
  onDeleteNotification,
}) => {
  const [searchText, setSearchText] = useState("");
  const [catId, setCatId] = useState(selectedCategoryId);
  const [loc, setLoc] = useState(selectedLocation);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const locations = ["صنعاء", "عدن", "تعز", "الحديدة", "إب", "المكلا", "مأرب"];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchText, catId, loc);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo */}
          <div 
            onClick={onHomeClick} 
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            id="logo-container"
          >
            <div className="p-2 bg-neutral-900 dark:bg-white rounded-lg text-white dark:text-neutral-900 transition-transform hover:scale-102">
              <Megaphone className="h-5.5 w-5.5 transform -rotate-12" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight leading-none">
                Yemen Ads
              </h1>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5 block">
                منصة الإعلانات المبوبة اليمنية المجانية
              </span>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-xl bg-neutral-50/50 dark:bg-neutral-900 rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 p-1 gap-1.5"
          >
            <div className="flex items-center px-2 text-neutral-400 dark:text-neutral-500 flex-1">
              <Search className="h-4 w-4 ml-1.5 shrink-0" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ما الذي تبحث عنه اليوم؟..."
                className="w-full bg-transparent text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
              />
            </div>
            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800"></div>
            
            {/* Category select */}
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="bg-transparent text-[11px] text-neutral-600 dark:text-neutral-300 font-medium focus:outline-none px-1 cursor-pointer max-w-[120px]"
            >
              <option value="">كل التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameAr}</option>
              ))}
            </select>

            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800"></div>

            {/* Location select */}
            <select
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              className="bg-transparent text-[11px] text-neutral-600 dark:text-neutral-300 font-medium focus:outline-none px-1 cursor-pointer max-w-[100px]"
            >
              <option value="">كل المدن</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white rounded text-[11px] font-semibold cursor-pointer transition-colors shrink-0"
            >
              بحث
            </button>
          </form>

          {/* Action buttons / User tools */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Mobile search button */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded transition-colors cursor-pointer"
              title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Add Ad Button */}
            <button
              onClick={onAddAdClick}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold rounded-lg text-xs transition-all cursor-pointer transform active:scale-[0.98]"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>أضف إعلان</span>
            </button>

            {/* Notifications Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer block"
                  title="الإشعارات"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </button>

                {showNotificationsDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowNotificationsDropdown(false)}
                    ></div>
                    <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg py-2.5 z-40 transition-all text-right max-h-96 flex flex-col">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-100">الإشعارات</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => {
                              onMarkAllNotificationsRead();
                            }}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                          >
                            تحديد الكل كمقروء
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 max-h-80">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-neutral-400 dark:text-neutral-500 text-xs">
                            <BellOff className="h-8 w-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
                            لا توجد إشعارات جديدة
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                onNotificationClick(notif);
                                setShowNotificationsDropdown(false);
                              }}
                              className={`p-3 text-right hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all cursor-pointer relative group flex gap-3 ${
                                !notif.isRead ? "bg-emerald-50/15 dark:bg-emerald-950/5 font-semibold" : ""
                              }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {notif.type === 'reply' ? (
                                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 rounded-lg">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </div>
                                ) : (
                                  <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 rounded-lg">
                                    <Bookmark className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pr-1">
                                <p className="text-[11px] text-neutral-800 dark:text-neutral-200">
                                  {notif.title}
                                </p>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal line-clamp-2 font-normal">
                                  {notif.content}
                                </p>
                                <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
                                  {new Date(notif.createdAt).toLocaleTimeString("ar-YE", { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(notif.id);
                                }}
                                className="absolute top-2 left-2 p-1 text-neutral-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                title="حذف"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Session Profile / Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer border border-transparent"
                >
                  <img
                    src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                    alt={currentUser.name}
                    className="h-7 w-7 rounded-md object-cover border border-neutral-200 dark:border-neutral-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden lg:block text-right">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 max-w-[100px] truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[9px] text-neutral-400">
                      {currentUser.role === "admin" ? "مدير المنصة" : "عضو"}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowUserDropdown(false)}
                    ></div>
                    <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg py-1.5 z-40 transition-all text-right">
                      
                      {currentUser.role === "admin" && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onAdminClick();
                          }}
                          className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 font-bold border-b border-neutral-100 dark:border-neutral-800"
                        >
                          <span className="flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4" />
                            لوحة الإشراف والإدارة
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onProfileClick("ads");
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Home className="h-4 w-4 text-neutral-400" />
                          إعلاناتي المعروضة
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onProfileClick("messages");
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-neutral-400" />
                          صندوق الرسائل (الدردشة)
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onProfileClick("favorites");
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Bookmark className="h-4 w-4 text-neutral-400" />
                          الإعلانات المفضلة
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onProfileClick("settings");
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <UserIcon className="h-4 w-4 text-neutral-400" />
                          إعدادات الحساب الشخصي
                        </span>
                      </button>

                      <div className="h-[1px] bg-neutral-100 dark:bg-neutral-800 my-1"></div>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <LogOut className="h-4 w-4" />
                          تسجيل الخروج
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <UserIcon className="h-4 w-4 text-neutral-400" />
                <span>دخول / تسجيل</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        {showMobileSearch && (
          <div className="md:hidden py-3 border-t border-neutral-100 dark:border-neutral-800/60 animate-fadeIn">
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <div className="flex items-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-neutral-400 ml-2" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="ابحث عن سيارات، عقارات، أجهزة..."
                  className="w-full bg-transparent text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 text-[11px] text-neutral-600 dark:text-neutral-300 flex-1"
                >
                  <option value="">كل التصنيفات</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
                <select
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 text-[11px] text-neutral-600 dark:text-neutral-300 flex-1"
                >
                  <option value="">كل المدن</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-bold cursor-pointer"
                >
                  بحث
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};
