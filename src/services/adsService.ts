import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Ad } from "../types";

export interface AdFilters {
  categoryId?: string;
  search?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  onlyFeatured?: boolean;
  status?: string;
  myAds?: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
}

/**
 * Fetches ads directly from Firestore, applying filters in memory for maximum reliability
 * without the need for manual compound index definitions in Firebase Console.
 */
export const fetchAdsFromFirestore = async (filters: AdFilters = {}): Promise<Ad[]> => {
  try {
    const adsCol = collection(db, "ads");
    const snapshot = await getDocs(adsCol);
    let list: Ad[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        price: Number(data.price || 0),
        views: Number(data.views || 0),
        isFeatured: !!data.isFeatured,
        images: Array.isArray(data.images) ? data.images : []
      } as Ad;
    });

    // 1. Authorization & Status Filters
    if (filters.myAds && filters.currentUserId) {
      list = list.filter(ad => ad.userId === filters.currentUserId);
    } else if (filters.status) {
      if (!filters.isAdmin) {
        list = list.filter(ad => ad.status === "approved");
      } else {
        list = list.filter(ad => ad.status === filters.status);
      }
    } else {
      // Default guest view: show approved only, unless user is admin
      if (!filters.isAdmin) {
        list = list.filter(ad => ad.status === "approved");
      }
    }

    // 2. Category Filter
    if (filters.categoryId) {
      list = list.filter(ad => ad.categoryId === filters.categoryId);
    }

    // 3. Search Query Filter
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(ad =>
        ad.title.toLowerCase().includes(s) ||
        ad.description.toLowerCase().includes(s)
      );
    }

    // 4. Price Boundaries
    if (filters.minPrice) {
      list = list.filter(ad => ad.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      list = list.filter(ad => ad.price <= Number(filters.maxPrice));
    }

    // 5. Location Filter
    if (filters.location) {
      list = list.filter(ad => ad.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }

    // 6. Featured Filter
    if (filters.onlyFeatured) {
      list = list.filter(ad => ad.isFeatured === true);
    }

    // Sort by newest created date
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return list;
  } catch (error) {
    console.error("Error fetching ads directly from Firestore:", error);
    throw error;
  }
};

/**
 * Saves (creates or updates) an ad directly inside Firestore.
 */
export const saveAdToFirestore = async (
  adData: {
    id?: string;
    title: string;
    description: string;
    price: number;
    currency?: 'YER' | 'SAR' | 'USD';
    location: string;
    categoryId: string;
    images: string[];
    userId: string;
    userName: string;
    userPhone: string;
    status?: 'approved' | 'pending' | 'rejected';
    createdAt?: string;
    views?: number;
    jobDescription?: string;
  }
): Promise<Ad> => {
  try {
    const isEdit = !!adData.id;
    const id = adData.id || `ad-${Date.now()}`;
    const adDocRef = doc(db, "ads", id);

    if (isEdit) {
      const updateData: Partial<Ad> = {
        title: adData.title,
        description: adData.description,
        price: Number(adData.price),
        currency: adData.currency || "YER",
        location: adData.location,
        categoryId: adData.categoryId,
        images: adData.images && adData.images.length > 0 ? adData.images : ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"],
        jobDescription: adData.jobDescription || ""
      };
      await updateDoc(adDocRef, updateData as any);
      
      return {
        ...adData,
        ...updateData,
        id
      } as Ad;
    } else {
      const newAd: Ad = {
        id,
        title: adData.title,
        description: adData.description,
        price: Number(adData.price),
        currency: adData.currency || "YER",
        location: adData.location,
        categoryId: adData.categoryId,
        images: adData.images && adData.images.length > 0 ? adData.images : ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"],
        userId: adData.userId,
        userName: adData.userName,
        userPhone: adData.userPhone,
        isFeatured: false,
        status: adData.status || "approved", // Approved immediately
        createdAt: adData.createdAt || new Date().toISOString(),
        views: adData.views || 0,
        jobDescription: adData.jobDescription || ""
      };
      await setDoc(adDocRef, newAd);
      return newAd;
    }
  } catch (error) {
    console.error("Error saving ad directly to Firestore:", error);
    throw error;
  }
};

/**
 * Deletes an ad directly from Firestore.
 */
export const deleteAdFromFirestore = async (adId: string): Promise<void> => {
  try {
    const adDocRef = doc(db, "ads", adId);
    await deleteDoc(adDocRef);
  } catch (error) {
    console.error("Error deleting ad directly from Firestore:", error);
    throw error;
  }
};
