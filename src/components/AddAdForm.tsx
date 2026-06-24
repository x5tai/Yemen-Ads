import React, { useState, useRef } from "react";
import { Category, Ad } from "../types";
import { Upload, X, Check, Image as ImageIcon, Sparkles, MapPin, DollarSign, FileText } from "lucide-react";

interface AddAdFormProps {
  categories: Category[];
  onSubmit: (adData: {
    title: string;
    description: string;
    price: number;
    currency?: 'YER' | 'SAR' | 'USD';
    location: string;
    categoryId: string;
    images: string[];
    jobDescription?: string;
  }) => Promise<Ad | null>;
  onCancel: () => void;
  initialAd?: Ad; // For editing mode
}

// Preset matching images to let users generate beautiful ads quickly without manual files!
const PRESET_IMAGES: { [key: string]: string[] } = {
  "cat-cars": [
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800"
  ],
  "cat-realestate": [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800"
  ],
  "cat-electronics": [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=800"
  ],
  "cat-jobs": [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800"
  ],
  "cat-furniture": [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800"
  ],
  "cat-services": [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800"
  ]
};

export const AddAdForm: React.FC<AddAdFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  initialAd,
}) => {
  const isEditMode = !!initialAd;
  
  const [title, setTitle] = useState(initialAd?.title || "");
  const [description, setDescription] = useState(initialAd?.description || "");
  const [price, setPrice] = useState<string>(initialAd?.price ? String(initialAd.price) : "");
  const [currency, setCurrency] = useState<'YER' | 'SAR' | 'USD'>(initialAd?.currency || "YER");
  const [location, setLocation] = useState(initialAd?.location || "صنعاء");
  const [categoryId, setCategoryId] = useState(initialAd?.categoryId || (categories[0]?.id || ""));
  const [images, setImages] = useState<string[]>(initialAd?.images || []);
  const [jobDescription, setJobDescription] = useState(initialAd?.jobDescription || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const locations = [
    "صنعاء",
    "عدن",
    "تعز",
    "الحديدة",
    "إب",
    "المكلا",
    "ذمار",
    "مأرب",
    "سيئون",
    "عتق",
    "صعدة",
    "عمران",
    "حجة",
    "البيضاء"
  ];

  // Handle Drag-and-Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    setErrorMessage("");
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("الرجاء رفع ملفات صور فقط");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("الحد الأقصى لحجم الصورة هو 5 ميجابايت");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addPresetImages = () => {
    const presets = PRESET_IMAGES[categoryId] || PRESET_IMAGES["cat-electronics"];
    setImages((prev) => [...prev, ...presets]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim() || title.length < 5) {
      setErrorMessage("عنوان الإعلان قصير جداً، يرجى كتابة عنوان معبر من 5 أحرف على الأقل");
      return;
    }
    if (!description.trim() || description.length < 20) {
      setErrorMessage("يرجى كتابة وصف تفصيلي للمنتج أو الخدمة (20 حرفاً على الأقل)");
      return;
    }
    if (!price || Number(price) < 0) {
      setErrorMessage("يرجى تحديد سعر صالح ومقبول");
      return;
    }
    if (!categoryId) {
      setErrorMessage("يرجى تحديد تصنيف الإعلان");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        title,
        description,
        price: Number(price),
        currency,
        location,
        categoryId,
        images,
        jobDescription: categoryId === "cat-jobs" ? jobDescription : undefined,
      });

      if (res) {
        setSuccess(true);
        setTimeout(() => {
          onCancel(); // Close / Redirect
        }, 1500);
      } else {
        setErrorMessage("حدث خطأ ما أثناء حفظ الإعلان، يرجى التحقق من المدخلات والمحاولة لاحقاً");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ غير متوقع بالاتصال مع الخادم");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-w-lg mx-auto my-12 animate-fadeIn">
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-full mb-6">
          <Check className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">
          {isEditMode ? "تم تعديل الإعلان بنجاح!" : "تم نشر الإعلان بنجاح!"}
        </h3>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light">
          {isEditMode 
            ? "سيتم مراجعة التحديثات وحفظ الإعلان فوراً." 
            : "تم إرسال إعلانك للمراجعة من قبل الإدارة وسيكون متاحاً للجميع فوراً بمجرد الموافقة."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-6 p-5 sm:p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-right">
      <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-5 mb-6">
        <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            {isEditMode ? "تعديل إعلانك الحالي" : "إضافة إعلان جديد للمنصة"}
          </h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-light">
            املأ التفاصيل التالية بدقة لعرض إعلانك بأفضل شكل وجذب المشترين.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold border border-rose-100 dark:border-rose-900/40 flex items-center gap-2">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200">
            <FileText className="h-4 w-4 text-neutral-400" />
            عنوان الإعلان <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: آيفون 15 برو ماكس فضي نظيف جداً"
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none dark:text-white placeholder-neutral-400"
          />
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200">
              <Sparkles className="h-4 w-4 text-neutral-400" />
              التصنيف الرئيسي <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200">
              <MapPin className="h-4 w-4 text-neutral-400" />
              الموقع (المدينة) <span className="text-rose-500">*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none dark:text-white"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200">
              <DollarSign className="h-4 w-4 text-neutral-400" />
              السعر المطلوب <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="مثال: 3500 (اكتب 0 إذا كان الإعلان للتبرع أو مجاني)"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none dark:text-white placeholder-neutral-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200">
              <Sparkles className="h-4 w-4 text-neutral-400" />
              تحديد العملة <span className="text-rose-500">*</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none dark:text-white"
            >
              <option value="YER">ريال يمني (YER)</option>
              <option value="SAR">ريال سعودي (SAR)</option>
              <option value="USD">دولار أمريكي (USD)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-200 block">
            وصف المنتج بالتفصيل <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب مواصفات المنتج، الضمان، الملحقات، عيوب الاستخدام إن وجدت، وطريقة التوصيل والدفع المفضلة لديك..."
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none dark:text-white placeholder-neutral-400 leading-relaxed"
          ></textarea>
        </div>

        {/* Job Description (Conditional for Jobs) */}
        {categoryId === "cat-jobs" && (
          <div className="space-y-1.5 p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl animate-fadeIn">
            <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <FileText className="h-4 w-4 text-emerald-600" />
              بيان وشرح تفاصيل الوظيفة الشاغرة <span className="text-rose-500">*</span>
            </label>
            <textarea
              required={categoryId === "cat-jobs"}
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="اكتب بياناً تفصيلياً لشرح الوظيفة تشمل المسمى الوظيفي، المهام المطلوبة، شروط التقديم، الخبرات اللازمة، الراتب والمميزات..."
              className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none dark:text-white placeholder-neutral-400 leading-relaxed"
            ></textarea>
          </div>
        )}

        {/* Image Upload Area */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-neutral-700 dark:text-neutral-200 block">
            صور الإعلان
          </label>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              dragActive
                ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-900"
                : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                اسحب الصور وأفلتها هنا، أو اضغط للتصفح من ملفاتك
              </p>
              <p className="text-[10px] text-neutral-400 mt-1">
                الصيغ المدعومة: PNG, JPG, JPEG (الحد الأقصى لكل صورة 5MB)
              </p>
            </div>
          </div>

          {/* Quick presets generator */}
          <div className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              💡 ليس لديك صور حالياً؟ يمكنك إضافة صور جاهزة مطابقة للتصنيف بنقرة زر!
            </span>
            <button
              type="button"
              onClick={addPresetImages}
              className="flex items-center gap-1 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white font-semibold text-xs rounded transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              توليد صور
            </button>
          </div>

          {/* Uploaded Images Preview Grid */}
          {images.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400">الصور الحالية المرفوعة ({images.length}):</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 group bg-slate-100">
                    <img
                      src={img}
                      alt={`Ad preview ${idx}`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 left-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer"
                      title="حذف الصورة"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700 pt-6 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            إلغاء التعديل
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-extrabold rounded-xl text-xs sm:text-sm cursor-pointer transition-all transform active:scale-95"
          >
            {isSubmitting ? (
              <span>جاري حفظ الإعلان...</span>
            ) : (
              <>
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{isEditMode ? "حفظ التغييرات" : "نشر الإعلان الآن"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
