import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { User, Category, Ad, Message, Banner, ChatThread, InAppNotification } from "./src/types";

const app = express();
app.use(express.json({ limit: "50mb" })); // Support uploading multiple images (base64)
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// ----------------------------------------------------
// DATABASE INITIALIZATION & HELPER FUNCTIONS
// ----------------------------------------------------

interface DatabaseSchema {
  users: (User & { password?: string; favorites?: string[] })[];
  categories: Category[];
  ads: Ad[];
  messages: Message[];
  banners: Banner[];
  notifications: InAppNotification[];
}

const defaultDatabase: DatabaseSchema = {
  users: [
    {
      id: "usr-admin",
      email: "admin@yemenads.com",
      password: "YemenAds2026!",
      name: "مدير المنصة (Yemen Ads)",
      phone: "779217474",
      role: "admin",
      isBlocked: false,
      createdAt: new Date().toISOString(),
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
      favorites: []
    },
    {
      id: "usr-1",
      email: "ahmed@ads.com",
      password: "user",
      name: "أحمد اليماني",
      phone: "775082143",
      role: "user",
      isBlocked: false,
      createdAt: new Date().toISOString(),
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      favorites: []
    },
    {
      id: "usr-2",
      email: "sara@ads.com",
      password: "user",
      name: "سارة الصنعاني",
      phone: "771234567",
      role: "user",
      isBlocked: false,
      createdAt: new Date().toISOString(),
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      favorites: []
    }
  ],
  categories: [
    { id: "cat-cars", nameAr: "سيارات", nameEn: "Cars", icon: "Car", imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200" },
    { id: "cat-realestate", nameAr: "عقارات", nameEn: "Real Estate", icon: "Home", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=200" },
    { id: "cat-electronics", nameAr: "إلكترونيات", nameEn: "Electronics", icon: "Smartphone", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=200" },
    { id: "cat-jobs", nameAr: "وظائف", nameEn: "Jobs", icon: "Briefcase", imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=200" },
    { id: "cat-services", nameAr: "خدمات", nameEn: "Services", icon: "Wrench", imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=200" },
    { id: "cat-furniture", nameAr: "أثاث ومستلزمات منزلية", nameEn: "Furniture", icon: "Sofa", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=200" }
  ],
  ads: [
    {
      id: "ad-1",
      title: "تويوتا كامري 2023 فل كامل - بحالة الوكالة",
      description: "للبيع تويوتا كامري موديل 2023 فئة ليميتد فل كامل، اللون لؤلؤي، ممشى 15,000 كم فقط. صيانة منتظمة بالوكالة، تظليل حراري، شاشة ملاحة، فتحة سقف، وحساسات أمامية وخلفية. البدي وكالة وخالي من الحوادث والرش تماماً. السعر قابل للتفاوض البسيط للجادين فقط.",
      price: 95000,
      currency: "SAR",
      location: "صنعاء",
      categoryId: "cat-cars",
      images: [
        "https://images.unsplash.com/photo-1621007947382-cc34a364650e?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800"
      ],
      userId: "usr-1",
      userName: "أحمد اليماني",
      userPhone: "775082143",
      isFeatured: true,
      status: "approved",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
      views: 142
    },
    {
      id: "ad-2",
      title: "شقة فاخرة للإيجار حي حدة - تصميم مودرن سياحي",
      description: "شقة سكنية فاخرة بتصميم مودرن للإيجار السنوي في حي حدة الراقي بمدينة صنعاء. تتكون الشقة من: 3 غرف نوم (واحدة ماستر)، صالة واسعة ومفتوحة، مطبخ مجهز بالكامل بالأجهزة الكهربائية، 3 دورات مياه، وموقف خاص مغطى للسيارة. تشطيبات راقية جداً ودخول ذكي وتكييف مركزي بالكامل.",
      price: 600,
      currency: "USD",
      location: "صنعاء - حدة",
      categoryId: "cat-realestate",
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800"
      ],
      userId: "usr-2",
      userName: "سارة الصنعاني",
      userPhone: "771234567",
      isFeatured: true,
      status: "approved",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
      views: 95
    },
    {
      id: "ad-3",
      title: "آيفون 15 برو ماكس 256 جيجا تيتانيوم طبيعي نظيف",
      description: "للبيع جهاز iPhone 15 Pro Max سعة 256 جيجا بايت، اللون تيتانيوم طبيعي (Natural Titanium). الجهاز شبه جديد واستخدام حشيم، نسبة البطارية 98٪، بدون أي خدوش أو عيوب تماماً. يأتي مع الععلبة الأصلية وسلك الشحن وحماية شاشة فاخرة وكفر هدية.",
      price: 1100,
      currency: "USD",
      location: "عدن",
      categoryId: "cat-electronics",
      images: [
        "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800"
      ],
      userId: "usr-1",
      userName: "أحمد اليماني",
      userPhone: "775082143",
      isFeatured: false,
      status: "approved",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      views: 310
    },
    {
      id: "ad-4",
      title: "طقم كنب تركي فاخر يتسع لـ 8 أشخاص",
      description: "طقم كنب تركي بحالة ممتازة جداً يتسع لـ 8 أشخاص، القماش مخمل فاخر مقاوم للبقع، واللون رمادي مع وسائد تركواز مبهجة. يتكون الطقم من: كنب ثلاثي عدد 2، وكرسي مفرد عدد 2، مع طاولة خدمة رئيسية وطاولتين جانبيتين مجاناً. لا توجد أي عيوب أو هبوط في الإسفنج. البيع بسبب السفر خارج البلاد.",
      price: 850000,
      currency: "YER",
      location: "تعز",
      categoryId: "cat-furniture",
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800"
      ],
      userId: "usr-2",
      userName: "سارة الصنعاني",
      userPhone: "771234567",
      isFeatured: false,
      status: "approved",
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      views: 74
    },
    {
      id: "ad-5",
      title: "مطلوب مصمم جرافيك ومطور واجهات React لشركة Yemen Ads",
      description: "تعلن شركة Yemen Ads للإعلانات التقنية بصنعاء عن حاجتها الفورية لمصمم جرافيك ومطور واجهات أمامية ذو خبرة لا تقل عن سنتين في تطوير تطبيقات React وتنسيق واجهات مستخدم جذابة ومتناسقة. العمل حضوري بالكامل في مقر الشركة بصنعاء - حي حدة.",
      price: 800,
      currency: "USD",
      location: "صنعاء - حدة",
      categoryId: "cat-jobs",
      images: [
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
      ],
      userId: "usr-admin",
      userName: "مدير المنصة (Yemen Ads)",
      userPhone: "779217474",
      isFeatured: false,
      status: "approved",
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      views: 188,
      jobDescription: "المسمى الوظيفي: مطور واجهات أمامية (React) ومصمم جرافيك\nالمهام الأساسية:\n- تطوير وتحسين واجهات منصة Yemen Ads وتجربة المستخدم.\n- تصميم البنرات الإعلانية والترويجية للمنصة.\nالشروط والخبرات:\n- خبرة لا تقل عن سنتين في تطوير تطبيقات React وTailwind CSS.\n- معرفة ممتازة بأدوات التصميم مثل Figma و Photoshop.\n- الالتزام بالعمل الحضوري والعمل بروح الفريق.\nالراتب والمميزات:\n- راتب شهري 800$ دولار أمريكي.\n- مكافآت وحوافز أداء دورية.\n- تأمين صحي شامل للكوادر."
    },
    {
      id: "ad-6",
      title: "فلل مودرن فاخرة للبيع حي كريتر مساحة 350م",
      description: "فرصة نادرة للبيع فيلا مودرن تشطيب فاخر ومميز جداً في حي كريتر الراقي بمدينة عدن، مساحة الأرض 350 متر مربع، الواجهة شمالية على شارع فسيح. الفيلا تتضمن مسبح، مصعد، تكييف مركزي بالكامل، صالات مفتوحة واسعة، ملحق خارجي، 5 أجنحة نوم ماستر كاملة الخزانات، وجناح خاص بالخدم. ضمانات شاملة على السباكة والكهرباء والهيكل الإنشائي لمدة 25 سنة.",
      price: 240000,
      currency: "USD",
      location: "عدن - كريتر",
      categoryId: "cat-realestate",
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=800"
      ],
      userId: "usr-2",
      userName: "sara@ads.com",
      userPhone: "771234567",
      isFeatured: false,
      status: "pending", // Pending ad for admin testing!
      createdAt: new Date().toISOString(),
      views: 12
    }
  ],
  messages: [
    {
      id: "msg-1",
      senderId: "usr-2",
      receiverId: "usr-1",
      adId: "ad-1",
      adTitle: "تويوتا كامري 2023 فل كامل - بحالة الوكالة",
      content: "السلام عليكم أخي الكريم، هل السيارة لا زالت متوفرة؟ وما هو حدك النهائي فيها؟",
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      id: "msg-2",
      senderId: "usr-1",
      receiverId: "usr-2",
      adId: "ad-1",
      adTitle: "تويوتا كامري 2023 فل كامل - بحالة الوكالة",
      content: "وعليكم السلام ورحمة الله وبركاته، نعم السيارة لا زالت متوفرة والحد النهائي هو 93 ألف ريال سعودي للصامل.",
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    }
  ],
  banners: [
    {
      id: "ban-1",
      titleAr: "سوق السيارات الأكبر والأسرع في اليمن",
      descriptionAr: "تصفح مئات السيارات المستعملة والجديدة يومياً، وتواصل مع البائعين مباشرة دون وسيط وبكبسة زر واحدة.",
      imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200",
      link: "/?category=cat-cars",
      active: true
    },
    {
      id: "ban-2",
      titleAr: "ابحث عن منزل أحلامك في أرقى أحياء اليمن",
      descriptionAr: "أحدث عروض الشقق والفيلات والأراضي للإيجار والبيع في جميع المحافظات اليمنية بتفاصيل وصور حقيقية.",
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
      link: "/?category=cat-realestate",
      active: true
    }
  ],
  notifications: []
};

// Reading / writing database
function getDB(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDatabase, null, 2), "utf-8");
    return defaultDatabase;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(content) as DatabaseSchema;

    if (!db.notifications) {
      db.notifications = [];
    }
    
    // Ensure admin user exists with new Yemen Ads secure credentials
    const adminIdx = db.users.findIndex(u => u.id === "usr-admin" || u.role === "admin");
    if (adminIdx !== -1) {
      db.users[adminIdx].email = "admin@yemenads.com";
      db.users[adminIdx].password = "YemenAds2026!";
      db.users[adminIdx].name = "مدير المنصة (Yemen Ads)";
      db.users[adminIdx].phone = "779217474";
    } else {
      db.users.push(defaultDatabase.users[0]);
    }

    // Upgrade default categories with image URLs if missing
    db.categories.forEach(cat => {
      const defCat = defaultDatabase.categories.find(c => c.id === cat.id);
      if (defCat && !cat.imageUrl) {
        cat.imageUrl = defCat.imageUrl;
      }
    });

    // Migrate Saudi locations to Yemeni locations on startup automatically
    db.ads.forEach(ad => {
      if (ad.location === "الرياض" || ad.location === "الرياض - حي الملقا") {
        ad.location = "صنعاء - حدة";
      } else if (ad.location === "جدة") {
        ad.location = "عدن";
      } else if (ad.location === "الدمام") {
        ad.location = "تعز";
      } else if (ad.location === "مكة المكرمة") {
        ad.location = "الحديدة";
      } else if (ad.location === "المدينة المنورة") {
        ad.location = "إب";
      } else if (ad.location === "أبها") {
        ad.location = "المكلا";
      }
      if (!ad.currency) {
        ad.currency = ad.categoryId === "cat-cars" ? "SAR" : ad.categoryId === "cat-realestate" ? "USD" : "YER";
      }
    });

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    return db;
  } catch (e) {
    console.error("Error parsing db.json, resetting to default.", e);
    return defaultDatabase;
  }
}

function writeDB(data: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  // Synchronize changes to Firebase Firestore in the background
  saveToFirestore(data).catch(err => {
    console.error("Background Firestore write failed:", err);
  });
}

// ----------------------------------------------------
// FIREBASE FIRESTORE SYNC LOGIC
// ----------------------------------------------------
let firestore: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    admin.initializeApp({
      projectId: config.projectId
    });
    firestore = (admin as any).firestore(config.firestoreDatabaseId || undefined);
    console.log("Firebase Admin successfully initialized with Project ID:", config.projectId);
  } else {
    console.warn("firebase-applet-config.json not found, running without Firestore sync.");
  }
} catch (e) {
  console.error("Error initializing Firebase Admin, checking if already initialized:", e);
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      firestore = (admin as any).firestore(config.firestoreDatabaseId || undefined);
      console.log("Firebase Admin Firestore retrieved successfully.");
    }
  } catch (err) {
    console.error("Critical error retrieving Firestore instance:", err);
  }
}

async function syncFromFirestore() {
  if (!firestore) {
    console.log("Firestore not initialized, skipping syncFromFirestore.");
    return;
  }
  try {
    console.log("Starting Firebase Firestore Synchronization...");
    const collections = ["users", "categories", "ads", "messages", "banners", "notifications"];
    const dbData: Partial<DatabaseSchema> = {};
    
    for (const collName of collections) {
      const snapshot = await firestore.collection(collName).get();
      if (!snapshot.empty) {
        dbData[collName as keyof DatabaseSchema] = snapshot.docs.map((doc: any) => {
          return { id: doc.id, ...doc.data() };
        }) as any;
        console.log(`Synced ${snapshot.size} items for collection ${collName} from Firestore.`);
      } else {
        console.log(`Collection ${collName} is empty in Firestore.`);
      }
    }
    
    const db = getDB(); // Load current local file backup
    let updated = false;
    
    for (const collName of collections) {
      const items = dbData[collName as keyof DatabaseSchema];
      if (items && items.length > 0) {
        (db as any)[collName] = items;
        updated = true;
      } else {
        // If Firestore was empty, upload our local default data to Firestore so it is synchronized!
        const localItems = (db as any)[collName] || [];
        if (localItems.length > 0) {
          console.log(`Uploading ${localItems.length} local items of ${collName} to Firestore...`);
          const batch = firestore.batch();
          localItems.forEach((item: any) => {
            const docRef = firestore.collection(collName).doc(item.id);
            batch.set(docRef, item);
          });
          await batch.commit();
        }
      }
    }
    
    if (updated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      console.log("Local db.json successfully updated and synced with Firestore.");
    }
  } catch (err) {
    console.error("Failed to sync from Firebase Firestore on startup. Using local db.json fallback.", err);
  }
}

async function saveToFirestore(data: DatabaseSchema) {
  if (!firestore) return;
  try {
    const collections = ["users", "categories", "ads", "messages", "banners", "notifications"];
    for (const collName of collections) {
      const items = (data as any)[collName] || [];
      const itemIds = new Set(items.map((i: any) => i.id).filter(Boolean));
      
      // Get all existing doc IDs in Firestore for this collection to clean up deleted ones
      const snapshot = await firestore.collection(collName).get();
      const firestoreIds = snapshot.docs.map((doc: any) => doc.id);
      
      // Delete docs that are no longer in items list
      const deleteBatch = firestore.batch();
      let deleteCount = 0;
      for (const id of firestoreIds) {
        if (!itemIds.has(id)) {
          deleteBatch.delete(firestore.collection(collName).doc(id));
          deleteCount++;
          if (deleteCount >= 400) {
            await deleteBatch.commit();
            deleteCount = 0;
          }
        }
      }
      if (deleteCount > 0) {
        await deleteBatch.commit();
      }

      // Upsert current items
      const upsertBatch = firestore.batch();
      let upsertCount = 0;
      for (const item of items) {
        if (!item.id) continue;
        const docRef = firestore.collection(collName).doc(item.id);
        upsertBatch.set(docRef, item);
        upsertCount++;
        if (upsertCount >= 400) {
          await upsertBatch.commit();
          upsertCount = 0;
        }
      }
      if (upsertCount > 0) {
        await upsertBatch.commit();
      }
    }
    console.log("Successfully synchronized changes to Firebase Firestore.");
  } catch (err) {
    console.error("Failed to sync changes to Firestore:", err);
  }
}

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------

// Custom auth scheme: we expect headers['authorization'] to be "Bearer <userId>"
// In a standard demo we'll extract the userId. It's direct, reliable, and keeps the code robust.
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "غير مصرح لك بالوصول، يرجى تسجيل الدخول أولاً" });
  }
  const token = authHeader.split(" ")[1];
  const db = getDB();
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    return res.status(401).json({ error: "جلسة العمل منتهية أو غير صالحة" });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: "تم حظر هذا الحساب من قبل الإدارة" });
  }
  (req as any).user = user;
  next();
}

// Admin-only middleware
function adminMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  authMiddleware(req, res, () => {
    if ((req as any).user.role !== "admin") {
      return res.status(403).json({ error: "هذا الإجراء مخصص لمدير المنصة فقط" });
    }
    next();
  });
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

// 1. AUTHENTICATION
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, phone, avatar } = req.body;
  if (!email || !password || !name || !phone) {
    return res.status(400).json({ error: "يرجى تعبئة كافة الحقول المطلوبة" });
  }

  const db = getDB();
  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "البريد الإلكتروني مسجل بالفعل" });
  }

  const newUser: User & { password?: string; favorites?: string[] } = {
    id: `usr-${Date.now()}`,
    email: email.toLowerCase(),
    password: password,
    name: name,
    phone: phone,
    role: "user",
    isBlocked: false,
    createdAt: new Date().toISOString(),
    avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    favorites: []
  };

  db.users.push(newUser);
  writeDB(db);

  // Return token (userId is our token in this robust scheme) and user
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ token: newUser.id, user: userWithoutPassword });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" });
  }

  const db = getDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(400).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: "عذراً، تم حظر هذا الحساب من قبل مشرف المنصة" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ token: user.id, user: userWithoutPassword });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "غير متصل" });
  }
  const token = authHeader.split(" ")[1];
  const db = getDB();
  const user = db.users.find((u) => u.id === token);
  if (!user) {
    return res.status(401).json({ error: "جلسة غير صالحة" });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: "هذا الحساب محظور" });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.put("/api/auth/profile", authMiddleware, (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = (req as any).user;
  const db = getDB();
  const uIndex = db.users.findIndex((u) => u.id === user.id);
  if (uIndex === -1) return res.status(404).json({ error: "المستخدم غير موجود" });

  if (name) db.users[uIndex].name = name;
  if (phone) db.users[uIndex].phone = phone;
  if (avatar) db.users[uIndex].avatar = avatar;

  writeDB(db);
  const { password: _, ...updatedUser } = db.users[uIndex];
  res.json(updatedUser);
});

// 2. CLASSIFIED ADS
app.get("/api/ads", (req, res) => {
  const { categoryId, search, minPrice, maxPrice, location, onlyFeatured, status, myAds } = req.query;
  const db = getDB();
  let filtered = [...db.ads];

  // If filtered by standard public listing, default to 'approved' ads only
  // Unless 'myAds' is supplied or request has admin authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const currentUser = token ? db.users.find(u => u.id === token) : null;

  if (myAds === "true") {
    if (!currentUser) return res.status(401).json({ error: "يجب تسجيل الدخول لعرض إعلاناتك" });
    filtered = filtered.filter((ad) => ad.userId === currentUser.id);
  } else if (status) {
    // Admin request or filtered status
    if (!currentUser || currentUser.role !== "admin") {
      filtered = filtered.filter((ad) => ad.status === "approved");
    } else {
      filtered = filtered.filter((ad) => ad.status === status);
    }
  } else {
    // Default guest view: show approved only
    filtered = filtered.filter((ad) => ad.status === "approved");
  }

  // Filter conditions
  if (categoryId) {
    filtered = filtered.filter((ad) => ad.categoryId === categoryId);
  }
  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter((ad) =>
      ad.title.toLowerCase().includes(s) ||
      ad.description.toLowerCase().includes(s)
    );
  }
  if (minPrice) {
    filtered = filtered.filter((ad) => ad.price >= Number(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter((ad) => ad.price <= Number(maxPrice));
  }
  if (location) {
    filtered = filtered.filter((ad) => ad.location.toLowerCase().includes(String(location).toLowerCase()));
  }
  if (onlyFeatured === "true") {
    filtered = filtered.filter((ad) => ad.isFeatured === true);
  }

  // Sort by newest
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

app.get("/api/ads/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const adIndex = db.ads.findIndex((ad) => ad.id === id);
  if (adIndex === -1) {
    return res.status(404).json({ error: "الإعلان غير موجود أو تم حذفه" });
  }

  // Increment view counter
  db.ads[adIndex].views += 1;
  writeDB(db);

  res.json(db.ads[adIndex]);
});

app.post("/api/ads", authMiddleware, (req, res) => {
  const { title, description, price, currency, location, categoryId, images, jobDescription } = req.body;
  if (!title || !description || price === undefined || !location || !categoryId) {
    return res.status(400).json({ error: "يرجى ملء جميع الخانات الأساسية للإعلان" });
  }

  const user = (req as any).user;
  if (user.role !== "admin") {
    return res.status(403).json({ error: "الادمن فقط من يستطيع اضافه اعلانات" });
  }

  const db = getDB();

  const newAd: Ad = {
    id: `ad-${Date.now()}`,
    title,
    description,
    price: Number(price),
    currency: currency || "YER",
    location,
    categoryId,
    images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"],
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    isFeatured: false,
    status: "pending", // Newly created ads are pending for admin approval!
    createdAt: new Date().toISOString(),
    views: 0,
    jobDescription
  };

  db.ads.push(newAd);
  writeDB(db);

  res.status(201).json(newAd);
});

app.put("/api/ads/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, description, price, currency, location, categoryId, images, jobDescription } = req.body;
  const user = (req as any).user;
  const db = getDB();

  const adIndex = db.ads.findIndex((ad) => ad.id === id);
  if (adIndex === -1) return res.status(404).json({ error: "الإعلان غير موجود" });

  const ad = db.ads[adIndex];
  // Verify ownership or admin
  if (ad.userId !== user.id && user.role !== "admin") {
    return res.status(403).json({ error: "لا تملك الصلاحية لتعديل هذا الإعلان" });
  }

  const oldPrice = ad.price;

  if (title) ad.title = title;
  if (description) ad.description = description;
  if (price !== undefined) ad.price = Number(price);
  if (currency) ad.currency = currency;
  if (location) ad.location = location;
  if (categoryId) ad.categoryId = categoryId;
  if (images) ad.images = images;
  if (jobDescription !== undefined) ad.jobDescription = jobDescription;

  // Check for price drop to notify watchers
  const newPrice = ad.price;
  if (price !== undefined && newPrice < oldPrice) {
    const cur = currency || ad.currency || "YER";
    const currLabel = cur === "SAR" ? "ريال سعودي" : cur === "USD" ? "دولار أمريكي" : "ريال يمني";
    db.users.forEach((u) => {
      if (u.favorites && u.favorites.includes(ad.id)) {
        const notif: InAppNotification = {
          id: `notif-${Date.now()}-${u.id}`,
          userId: u.id,
          title: "تخفيض السعر في المفضلة!",
          content: `تخفيض جديد! انخفض سعر الإعلان "${ad.title}" في المفضلة من ${oldPrice.toLocaleString()} إلى ${newPrice.toLocaleString()} ${currLabel}.`,
          type: "price_drop",
          adId: ad.id,
          oldPrice,
          newPrice,
          currency: cur as any,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        db.notifications.push(notif);
      }
    });
  }

  // Reset status to pending to verify content after updates
  if (user.role !== "admin") {
    ad.status = "pending";
  }

  db.ads[adIndex] = ad;
  writeDB(db);

  res.json(ad);
});

app.delete("/api/ads/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const db = getDB();

  const adIndex = db.ads.findIndex((ad) => ad.id === id);
  if (adIndex === -1) return res.status(404).json({ error: "الإعلان غير موجود" });

  const ad = db.ads[adIndex];
  if (ad.userId !== user.id && user.role !== "admin") {
    return res.status(403).json({ error: "لا تملك الصلاحية لحذف هذا الإعلان" });
  }

  db.ads.splice(adIndex, 1);
  writeDB(db);

  res.json({ success: true, message: "تم حذف الإعلان بنجاح" });
});

// Admin-only ad status changer
app.put("/api/ads/:id/status", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'rejected' | 'pending'
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "حالة غير صالحة" });
  }

  const db = getDB();
  const adIndex = db.ads.findIndex((ad) => ad.id === id);
  if (adIndex === -1) return res.status(404).json({ error: "الإعلان غير موجود" });

  db.ads[adIndex].status = status;
  writeDB(db);

  res.json(db.ads[adIndex]);
});

// Admin-only ad featuring changer
app.put("/api/ads/:id/feature", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  const db = getDB();
  const adIndex = db.ads.findIndex((ad) => ad.id === id);
  if (adIndex === -1) return res.status(404).json({ error: "الإعلان غير موجود" });

  db.ads[adIndex].isFeatured = Boolean(isFeatured);
  writeDB(db);

  res.json(db.ads[adIndex]);
});

// 3. FAVORITES
app.get("/api/favorites", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  const u = db.users.find((userObj) => userObj.id === user.id);
  const favoriteIds = u?.favorites || [];
  const favoriteAds = db.ads.filter((ad) => favoriteIds.includes(ad.id) && ad.status === "approved");
  res.json(favoriteAds);
});

app.post("/api/favorites/toggle", authMiddleware, (req, res) => {
  const { adId } = req.body;
  if (!adId) return res.status(400).json({ error: "رقم الإعلان مطلوب" });

  const user = (req as any).user;
  const db = getDB();
  const uIndex = db.users.findIndex((userObj) => userObj.id === user.id);
  if (uIndex === -1) return res.status(404).json({ error: "الحساب غير موجود" });

  const u = db.users[uIndex];
  if (!u.favorites) u.favorites = [];

  const fIndex = u.favorites.indexOf(adId);
  let favorited = false;
  if (fIndex > -1) {
    u.favorites.splice(fIndex, 1);
  } else {
    u.favorites.push(adId);
    favorited = true;
  }

  db.users[uIndex] = u;
  writeDB(db);

  res.json({ favorited, favorites: u.favorites });
});

// 4. CATEGORIES (Admin + Public)
app.get("/api/categories", (req, res) => {
  const db = getDB();
  // Count active ads for each category to show counts dynamically!
  const categoriesWithCounts = db.categories.map((cat) => {
    const count = db.ads.filter((ad) => ad.categoryId === cat.id && ad.status === "approved").length;
    return { ...cat, count };
  });
  res.json(categoriesWithCounts);
});

app.post("/api/categories", adminMiddleware, (req, res) => {
  const { nameAr, nameEn, icon, imageUrl } = req.body;
  if (!nameAr || !nameEn || !icon) {
    return res.status(400).json({ error: "جميع حقول التصنيف مطلوبة" });
  }

  const db = getDB();
  const id = `cat-${Date.now()}`;
  const newCat: Category = { id, nameAr, nameEn, icon, imageUrl };
  db.categories.push(newCat);
  writeDB(db);

  res.status(201).json(newCat);
});

app.put("/api/categories/:id", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { nameAr, nameEn, icon, imageUrl } = req.body;
  const db = getDB();

  const catIndex = db.categories.findIndex((cat) => cat.id === id);
  if (catIndex === -1) return res.status(404).json({ error: "التصنيف غير موجود" });

  if (nameAr) db.categories[catIndex].nameAr = nameAr;
  if (nameEn) db.categories[catIndex].nameEn = nameEn;
  if (icon) db.categories[catIndex].icon = icon;
  if (imageUrl !== undefined) db.categories[catIndex].imageUrl = imageUrl;

  writeDB(db);
  res.json(db.categories[catIndex]);
});

app.delete("/api/categories/:id", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const catIndex = db.categories.findIndex((cat) => cat.id === id);
  if (catIndex === -1) return res.status(404).json({ error: "التصنيف غير موجود" });

  db.categories.splice(catIndex, 1);
  // Optional: reassign ads to uncategorized or delete them. We'll leave ads with categoryId.
  writeDB(db);

  res.json({ success: true, message: "تم حذف التصنيف بنجاح" });
});

// 5. USER MANAGEMENT (Admin-only)
app.get("/api/users", adminMiddleware, (req, res) => {
  const db = getDB();
  const sanitizedUsers = db.users.map(({ password, ...u }) => u);
  res.json(sanitizedUsers);
});

app.put("/api/users/:id/block", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { isBlocked } = req.body;

  if (id === "usr-admin") {
    return res.status(400).json({ error: "لا يمكن حظر المدير العام للمنصة" });
  }

  const db = getDB();
  const uIndex = db.users.findIndex((u) => u.id === id);
  if (uIndex === -1) return res.status(404).json({ error: "المستخدم غير موجود" });

  db.users[uIndex].isBlocked = Boolean(isBlocked);
  writeDB(db);

  const { password, ...sanitized } = db.users[uIndex];
  res.json(sanitized);
});

app.delete("/api/users/:id", adminMiddleware, (req, res) => {
  const { id } = req.params;
  if (id === "usr-admin") {
    return res.status(400).json({ error: "لا يمكن حذف المدير العام للمنصة" });
  }

  const db = getDB();
  const uIndex = db.users.findIndex((u) => u.id === id);
  if (uIndex === -1) return res.status(404).json({ error: "المستخدم غير موجود" });

  // Delete user
  db.users.splice(uIndex, 1);
  // Optional: delete user's ads
  db.ads = db.ads.filter((ad) => ad.userId !== id);

  writeDB(db);
  res.json({ success: true, message: "تم حذف حساب المستخدم وإعلاناته بنجاح" });
});

// 6. CHAT / INBOX ENDPOINTS
app.get("/api/chats", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = getDB();

  // Find all messages where current user is sender or receiver
  const myMessages = db.messages.filter(
    (msg) => msg.senderId === user.id || msg.receiverId === user.id
  );

  // Group into threads based on (adId + otherParticipantId)
  const threadsMap: { [key: string]: ChatThread } = {};

  myMessages.forEach((msg) => {
    const isSender = msg.senderId === user.id;
    const partnerId = isSender ? msg.receiverId : msg.senderId;
    const threadKey = `${msg.adId}_${partnerId}`;

    const partnerUser = db.users.find((u) => u.id === partnerId);
    const partnerName = partnerUser ? partnerUser.name : "مستخدم محذوف";

    if (!threadsMap[threadKey]) {
      threadsMap[threadKey] = {
        adId: msg.adId,
        adTitle: msg.adTitle,
        partnerId,
        partnerName,
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt,
        messages: []
      };
    }

    threadsMap[threadKey].messages.push(msg);

    // Keep last message up to date
    if (new Date(msg.createdAt) > new Date(threadsMap[threadKey].lastMessageTime)) {
      threadsMap[threadKey].lastMessage = msg.content;
      threadsMap[threadKey].lastMessageTime = msg.createdAt;
    }
  });

  // Sort messages in each thread by date ascending
  Object.values(threadsMap).forEach((thread) => {
    thread.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  // Convert map to array sorted by latest activity descending
  const threadsList = Object.values(threadsMap).sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  res.json(threadsList);
});

app.get("/api/chats/thread/:partnerId/:adId", authMiddleware, (req, res) => {
  const { partnerId, adId } = req.params;
  const user = (req as any).user;
  const db = getDB();

  const threadMessages = db.messages.filter(
    (msg) =>
      msg.adId === adId &&
      ((msg.senderId === user.id && msg.receiverId === partnerId) ||
        (msg.senderId === partnerId && msg.receiverId === user.id))
  );

  threadMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(threadMessages);
});

app.post("/api/chats/send", authMiddleware, (req, res) => {
  const { receiverId, adId, content } = req.body;
  if (!receiverId || !adId || !content) {
    return res.status(400).json({ error: "الحقول المطلوبة مفقودة لإرسال الرسالة" });
  }

  const user = (req as any).user;
  const db = getDB();

  const targetAd = db.ads.find((ad) => ad.id === adId);
  const adTitle = targetAd ? targetAd.title : "إعلان مبوب";

  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    senderId: user.id,
    receiverId,
    adId,
    adTitle,
    content,
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMessage);

  // Trigger in-app notification for the receiver
  const newNotif: InAppNotification = {
    id: `notif-${Date.now()}`,
    userId: receiverId,
    title: "رسالة جديدة بخصوص إعلانك",
    content: `أرسل لك ${user.name} رسالة بخصوص إعلانك "${adTitle}": "${content.length > 60 ? content.substring(0, 60) + '...' : content}"`,
    type: "reply",
    adId,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(newNotif);

  writeDB(db);

  res.status(201).json(newMessage);
});

// 6.5 IN-APP NOTIFICATIONS
app.get("/api/notifications", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  const userNotifs = db.notifications.filter(n => n.userId === user.id);
  // Sort by newest first
  userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotifs);
});

app.put("/api/notifications/mark-all-read", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = getDB();
  let updated = false;
  db.notifications.forEach(n => {
    if (n.userId === user.id && !n.isRead) {
      n.isRead = true;
      updated = true;
    }
  });
  if (updated) {
    writeDB(db);
  }
  const userNotifs = db.notifications.filter(n => n.userId === user.id);
  userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotifs);
});

app.put("/api/notifications/:id/read", authMiddleware, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const db = getDB();
  const notif = db.notifications.find(n => n.id === id);
  if (!notif) {
    return res.status(404).json({ error: "الإشعار غير موجود" });
  }
  if (notif.userId !== user.id) {
    return res.status(403).json({ error: "غير مصرح لك بتعديل هذا الإشعار" });
  }
  notif.isRead = true;
  writeDB(db);
  res.json(notif);
});

app.delete("/api/notifications/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const db = getDB();
  const idx = db.notifications.findIndex(n => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "الإشعار غير موجود" });
  }
  if (db.notifications[idx].userId !== user.id) {
    return res.status(403).json({ error: "غير مصرح لك بحذف هذا الإشعار" });
  }
  db.notifications.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

// 7. BANNERS (Hero Slider)
app.get("/api/banners", (req, res) => {
  const db = getDB();
  res.json(db.banners.filter((b) => b.active));
});

// Admin Banner Management
app.post("/api/banners", adminMiddleware, (req, res) => {
  const { titleAr, descriptionAr, imageUrl, link } = req.body;
  if (!titleAr || !descriptionAr || !imageUrl) {
    return res.status(400).json({ error: "جميع حقول البنر مطلوبة" });
  }

  const db = getDB();
  const newBanner: Banner = {
    id: `ban-${Date.now()}`,
    titleAr,
    descriptionAr,
    imageUrl,
    link: link || "/",
    active: true
  };

  db.banners.push(newBanner);
  writeDB(db);

  res.status(201).json(newBanner);
});

app.delete("/api/banners/:id", adminMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.banners = db.banners.filter((b) => b.id !== id);
  writeDB(db);
  res.json({ success: true, message: "تم حذف البنر بنجاح" });
});

// 8. ADMIN DASHBOARD METRICS
app.get("/api/admin/metrics", adminMiddleware, (req, res) => {
  const db = getDB();
  const totalAds = db.ads.length;
  const activeAds = db.ads.filter((ad) => ad.status === "approved").length;
  const pendingAds = db.ads.filter((ad) => ad.status === "pending").length;
  const rejectedAds = db.ads.filter((ad) => ad.status === "rejected").length;
  const totalUsers = db.users.length;
  const blockedUsers = db.users.filter((u) => u.isBlocked).length;
  const totalChats = db.messages.length;

  // Let's make an ads count grouped by category for high-quality statistics!
  const categoryChartData = db.categories.map((cat) => {
    return {
      name: cat.nameAr,
      count: db.ads.filter((ad) => ad.categoryId === cat.id).length
    };
  });

  res.json({
    summary: {
      totalAds,
      activeAds,
      pendingAds,
      rejectedAds,
      totalUsers,
      blockedUsers,
      totalChats
    },
    categoryChartData
  });
});

// ----------------------------------------------------
// VITE OR STATIC FILES SERVING (DEVELOPMENT vs PRODUCTION)
// ----------------------------------------------------
async function startServer() {
  // Sync database with Firestore before starting
  await syncFromFirestore();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Classified Ads Platform server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
