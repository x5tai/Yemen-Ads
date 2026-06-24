import React from "react";
import { Ad, Category } from "../types";
import { MapPin, Eye, Clock, Bookmark, Heart, Star, ShieldAlert } from "lucide-react";

interface AdCardProps {
  ad: Ad;
  category?: Category;
  isFavorited: boolean;
  onFavoriteToggle?: (adId: string) => void;
  onCardClick: () => void;
  showAdminStatus?: boolean; // For profile or admin views
}

export const AdCard: React.FC<AdCardProps> = ({
  ad,
  category,
  isFavorited,
  onFavoriteToggle,
  onCardClick,
  showAdminStatus = false,
}) => {
  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })} مليون ريال`;
    }
    return `${price.toLocaleString()} ريال`;
  };

  // Format date relative or simplified
  const formatDate = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `قبل ${days} يوم`;
    if (hours > 0) return `قبل ${hours} ساعة`;
    if (mins > 0) return `قبل ${mins} دقيقة`;
    return "الآن";
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(ad.id);
    }
  };

  return (
    <div
      onClick={onCardClick}
      className="group relative bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Featured Badge */}
      {ad.isFeatured && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-[9px] rounded shadow-sm">
          <Star className="h-2.5 w-2.5 fill-current" />
          <span>مميز</span>
        </div>
      )}

      {/* Admin Status Badges */}
      {showAdminStatus && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {ad.status === "pending" && (
            <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-[9px] rounded border border-neutral-200 dark:border-neutral-700">
              قيد المراجعة
            </span>
          )}
          {ad.status === "rejected" && (
            <span className="px-2 py-0.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold text-[9px] rounded border border-neutral-200 dark:border-neutral-700">
              مرفوض
            </span>
          )}
          {ad.status === "approved" && (
            <span className="px-2 py-0.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-[9px] rounded">
              نشط
            </span>
          )}
        </div>
      )}

      {/* Ad Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 shrink-0 border-b border-neutral-100 dark:border-neutral-800">
        <img
          src={ad.images[0] || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"}
          alt={ad.title}
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-neutral-950/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {/* Floating Heart / Favorite Button */}
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute bottom-3 right-3 p-1.5 rounded-lg backdrop-blur-md transition-all shadow-sm transform active:scale-90 hover:scale-105 cursor-pointer ${
              isFavorited
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 dark:bg-neutral-900/90 dark:text-neutral-300 dark:hover:text-white"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorited ? "fill-current" : ""}`} />
          </button>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        {/* Category & Date */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
          <span className="bg-neutral-50 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-300 font-semibold border border-neutral-100 dark:border-neutral-700/50">
            {category?.nameAr || "أخرى"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(ad.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-100 line-clamp-2 leading-relaxed min-h-[40px] group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
          {ad.title}
        </h3>

        {/* Location & Views */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1 truncate max-w-[70%]">
            <MapPin className="h-3 w-3 text-neutral-400 shrink-0" />
            {ad.location}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Eye className="h-3 w-3" />
            {ad.views}
          </span>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-neutral-100 dark:bg-neutral-800/80 my-0.5"></div>

        {/* Price Tag */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-400 font-medium">السعر المطلوب</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
            {formatPrice(ad.price)}
          </span>
        </div>
      </div>
    </div>
  );
};
