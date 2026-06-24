export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  isBlocked: boolean;
  createdAt: string;
  avatar?: string;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string; // Lucide icon name
  count?: number;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  categoryId: string;
  images: string[]; // URLs or base64
  userId: string;
  userName: string;
  userPhone: string;
  isFeatured: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  views: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  adId: string;
  adTitle: string;
  content: string;
  createdAt: string;
}

export interface ChatThread {
  adId: string;
  adTitle: string;
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

export interface Banner {
  id: string;
  titleAr: string;
  descriptionAr: string;
  imageUrl: string;
  link: string;
  active: boolean;
}
