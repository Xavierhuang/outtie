export interface Rental {
  id?: number;
  item_id: number;
  renter_id: number;
  lender_id: number;
  rental_start_date?: string;
  rental_end_date?: string;
  actual_return_date?: string;
  status: 'active' | 'completed' | 'disputed';
  created_at?: string;
  updated_at?: string;
  item?: {
    id: number;
    title: string;
    photo_url?: string;
    rental_price_per_week: number;
  };
  renter?: {
    id: number;
    name: string;
  };
  lender?: {
    id: number;
    name: string;
  };
}

export interface Review {
  id?: number;
  rental_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number; // 1-5
  review_text?: string;
  created_at?: string;
}

export interface NewReview {
  rating: number;
  review_text?: string;
}
