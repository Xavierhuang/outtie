export interface Item {
  id?: number;
  lender_id: number;
  title: string;
  description?: string;
  category: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'accessories' | 'shoes' | 'other';
  size: string;
  rental_price_per_week: number;
  pickup_location: string;
  must_return_washed: boolean;
  payment_method: 'cash' | 'zelle' | 'either';
  zelle_info?: string;
  contact_preferences: string; // JSON string array
  status: 'available' | 'rented' | 'inactive';
  created_at?: string;
  updated_at?: string;
  photos?: ItemPhoto[];
  lender?: {
    id: number;
    name: string;
    phone?: string;
    instagram_handle?: string;
    whatsapp?: string;
  };
}

export interface ItemPhoto {
  id?: number;
  item_id: number;
  photo_url: string;
  photo_order: number;
  created_at?: string;
}

export interface NewItem {
  title: string;
  description?: string;
  category: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'accessories' | 'shoes' | 'other';
  size: string;
  rental_price_per_week: number;
  pickup_location: string;
  must_return_washed: boolean;
  payment_method: 'cash' | 'zelle' | 'either';
  zelle_info?: string;
  contact_preferences: string[];
}

export interface SavedItem {
  id?: number;
  user_id: number;
  item_id: number;
  created_at?: string;
}
