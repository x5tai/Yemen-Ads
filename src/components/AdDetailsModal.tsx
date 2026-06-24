import React, { useState } from "react";
import { Ad, Category, User } from "../types";
import { 
  X, 
  MapPin, 
  Phone, 
  Eye, 
  Clock, 
  Send, 
  Check, 
  MessageSquare, 
  User as UserIcon, 
  Heart,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
  Copy,
  Facebook,
  MessageCircle
} from "lucide-react";

interface AdDetailsModalProps {
  ad: Ad;
  category?: Category;
  currentUser: User | null;
  onClose: () => void;
  isFavorited: boolean;
  onFavoriteToggle: (adId: string) => void;
  onAdClick: (ad: Ad) => void;
  allAds: Ad[];
}

export const AdDetailsModal: React.FC<AdDetailsModalProps> = ({
  ad,
  category,
  currentUser,
  onClose,
  isFavorited,
  onFavoriteToggle,
  onAdClick,
  allAds,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [chatMessageText, setChatMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}?ad=${ad.id}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getShareText = () => {
    const currLabel = ad.currency === "SAR" ? "ريال سعودي" : ad.currency === "USD" ? "دولار أمريكي" : "ريال يمني";
    const priceText = ad.price === 0 ? "مجاني / للتفاوض" : `${ad.price.toLocaleString()} ${currLabel}`;
    return `شاهد هذا الإعلان على اليمن إعلانات (Yemen Ads):\n"${ad.title}"\nالسعر: ${priceText}\nالموقع: ${ad.location}`;
  };

  const getWhatsappUrl = () => {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText() + "\n" + getShareUrl())}`;
  };

  const getFacebookUrl = () => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
  };

  const getTwitterUrl = () => {
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`;
  };

  const getTelegramUrl = () => {
    return `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`;
  };

  const isMyAd = currentUser && ad.userId === currentUser.id;

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % ad.images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + ad.images.length) % ad.images.length);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageError("");
    setMessageSuccess(false);

    if (!currentUser) {
      setMessageError("يجب عليك تسجيل الدخول أولاً للتمكن من مراسلة البائع");
      return;
    }
    if (!chatMessageText.trim()) return;

    setIsSendingMessage(true);
    try {
      const response = await fetch("/api/chats/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          receiverId: ad.userId,
          adId: ad.id,
          content: chatMessageText.trim()
        })
      });

      if (response.ok) {
        setMessageSuccess(true);
        setChatMessageText("");
        setTimeout(() => setMessageSuccess(false), 3000);
      } else {
        const err = await response.json();
        setMessageError(err.error || "فشل إرسال الرسالة، يرجى المحاولة لاحقاً");
      }
    } catch (err) {
      setMessageError("حدث خطأ بالاتصال بالخادم");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Get related ads in the same category (excluding current ad, limit 3)
  const relatedAds = allAds
    .filter((a) => a.categoryId === ad.categoryId && a.id !== ad.id && a.status === "approved")
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700/60 animate-scaleUp max-h-[92vh] flex flex-col text-right">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">
              {category?.nameAr || "أخرى"}
            </span>
            <span className="text-slate-400 font-mono text-xs">رقم الإعلان: {ad.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-all cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left side (Images and details) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Photo gallery */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                <img
                  src={ad.images[activeImageIdx]}
                  alt={ad.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Left/Right controls if multiple pictures */}
                {ad.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full cursor-pointer transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Favorite badge inside gallery */}
                <button
                  onClick={() => onFavoriteToggle(ad.id)}
                  className={`absolute bottom-3 right-3 p-2.5 rounded-xl backdrop-blur-md shadow-md transition-all cursor-pointer ${
                    isFavorited ? "bg-rose-500 text-white" : "bg-white/80 hover:bg-white text-slate-700"
                  }`}
                  title={isFavorited ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                >
                  <Heart className={`h-4.5 w-4.5 ${isFavorited ? "fill-current" : ""}`} />
                </button>
              </div>

              {/* Thumbnails list */}
              {ad.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ad.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative h-14 w-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        activeImageIdx === idx ? "border-emerald-500 scale-95" : "border-slate-100 dark:border-slate-700"
                      }`}
                    >
                      <img
                        src={img}
                        alt="Thumbnail"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Title & Metadata */}
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {ad.title}
                </h2>
                
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium border-y border-slate-100 dark:border-slate-700 py-3">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                    {ad.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                    نشر في: {new Date(ad.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-emerald-500 shrink-0" />
                    المشاهدات: {ad.views}
                  </span>
                </div>
              </div>

              {/* Full Description text */}
              <div className="space-y-2 text-slate-700 dark:text-slate-200">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">وصف الإعلان بالتفصيل:</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {ad.description}
                </p>
              </div>

              {/* Job description statement if it exists */}
              {ad.jobDescription && (
                <div className="space-y-3 p-5 bg-emerald-50/20 dark:bg-slate-900/40 border border-emerald-100/30 dark:border-slate-700/80 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-extrabold text-sm border-b border-emerald-100/40 dark:border-slate-700 pb-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>بيان تفاصيل الوظيفة والشروط الرسمية:</span>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-200">
                    {ad.jobDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Right side (Price, Seller console, and Contact) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Price block Card */}
              <div className="bg-emerald-50/50 dark:bg-slate-900/40 border border-emerald-100 dark:border-slate-700 rounded-3xl p-6 text-center space-y-1 shadow-sm">
                <span className="text-xs text-emerald-800 dark:text-slate-400 font-semibold">السعر المعروض للبيع</span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {(() => {
                    let currLabel = "ريال يمني";
                    if (ad.currency === "SAR") currLabel = "ريال سعودي";
                    else if (ad.currency === "USD") currLabel = "دولار أمريكي";
                    else if (ad.currency === "YER") currLabel = "ريال يمني";

                    if (ad.price === 0) return "مجاني / للتفاوض";

                    if (ad.price >= 1000000) {
                      return `${(ad.price / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })} مليون ${currLabel}`;
                    }
                    return `${ad.price.toLocaleString()} ${currLabel}`;
                  })()}
                </p>
              </div>

              {/* Seller details Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">حول البائع</h4>
                
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-600 rounded-full shrink-0">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 dark:text-white text-sm">{ad.userName}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">ناشر موثوق في المنصة</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <a
                    href={`tel:${ad.userPhone}`}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100 dark:shadow-none transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>اتصال بالجوال: {ad.userPhone}</span>
                  </a>
                </div>
              </div>

              {/* Messaging console */}
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  راسل المعلن مباشرة وبسرعة
                </h4>

                {messageError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-[11px] font-bold border border-rose-100 dark:border-rose-900">
                    <span>⚠️ {messageError}</span>
                  </div>
                )}

                {messageSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-[11px] font-bold border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    <span>تم إرسال رسالتك وتأسيس محادثة في بريدك الشخصي!</span>
                  </div>
                )}

                {isMyAd ? (
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/15 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-950/40 text-xs font-semibold text-center">
                    هذا إعلانك الخاص المعروض بالمنصة. يمكنك تعديله أو تتبع عروض المشترين في صندوق الرسائل.
                  </div>
                ) : (
                  <form onSubmit={handleChatSubmit} className="space-y-3">
                    <textarea
                      required
                      rows={3}
                      value={chatMessageText}
                      onChange={(e) => setChatMessageText(e.target.value)}
                      placeholder="اكتب استفسارك للبائع هنا... (مثال: هل السعر قابل للتفاوض؟)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none dark:text-white placeholder-slate-400"
                    ></textarea>
                    
                    <button
                      type="submit"
                      disabled={isSendingMessage || !chatMessageText.trim()}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Send className="h-4 w-4 transform rotate-180" />
                      {isSendingMessage ? "جاري الإرسال..." : "إرسال رسالة فورية"}
                    </button>
                  </form>
                )}
              </div>

              {/* Share Ad Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="h-4 w-4 text-emerald-500 animate-pulse" />
                  مشاركة هذا الإعلان
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  أنشر الإعلان لزيادة فرصة البيع والوصول لجمهور أكبر عبر مختلف شبكات التواصل والرسائل.
                </p>

                {/* Direct copy link box */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/80 rounded-2xl">
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl()}
                    className="flex-1 bg-transparent border-none text-[10px] text-slate-500 dark:text-slate-400 font-mono focus:outline-none text-left select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all ${
                      copied
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Social Share Buttons Grid */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {/* WhatsApp */}
                  <a
                    href={getWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 bg-neutral-50 hover:bg-emerald-50 dark:bg-neutral-950 dark:hover:bg-emerald-950/20 border border-neutral-100 dark:border-neutral-800 rounded-2xl transition-all group gap-1"
                    title="مشاركة عبر واتساب"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">واتساب</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={getFacebookUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 bg-neutral-50 hover:bg-blue-50 dark:bg-neutral-950 dark:hover:bg-blue-950/20 border border-neutral-100 dark:border-neutral-800 rounded-2xl transition-all group gap-1"
                    title="مشاركة عبر فيسبوك"
                  >
                    <Facebook className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">فيسبوك</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={getTelegramUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 bg-neutral-50 hover:bg-sky-50 dark:bg-neutral-950 dark:hover:bg-sky-950/20 border border-neutral-100 dark:border-neutral-800 rounded-2xl transition-all group gap-1"
                    title="مشاركة عبر تيليجرام"
                  >
                    <Send className="h-5 w-5 text-sky-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400">تيليجرام</span>
                  </a>

                  {/* Twitter / X */}
                  <a
                    href={getTwitterUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-slate-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl transition-all group gap-1"
                    title="مشاركة عبر إكس (تويتر)"
                  >
                    <Share2 className="h-5 w-5 text-slate-800 dark:text-slate-200 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">إكس</span>
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Related ads */}
          {relatedAds.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/60">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">إعلانات مشابهة قد تهمك:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedAds.map((relAd) => (
                  <div
                    key={relAd.id}
                    onClick={() => {
                      onAdClick(relAd);
                      setActiveImageIdx(0);
                    }}
                    className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-200 hover:shadow-sm cursor-pointer transition-all flex gap-3 text-right"
                  >
                    <img
                      src={relAd.images[0]}
                      alt={relAd.title}
                      className="h-14 w-20 rounded-xl object-cover border border-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{relAd.title}</h4>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{relAd.price.toLocaleString()} ريال</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
