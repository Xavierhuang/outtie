export interface User {
  id?: number;
  email: string;
  password_hash?: string;
  name: string;
  graduation_year?: number;
  phone?: string;
  instagram_handle?: string;
  whatsapp?: string;
  profile_photo?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  student_id_document?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRegistration {
  email: string;
  password: string;
  name: string;
  graduation_year?: number;
}

export interface UserProfile {
  phone?: string;
  instagram_handle?: string;
  whatsapp?: string;
  profile_photo?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface PublicUser {
  id: number;
  name: string;
  instagram_handle?: string;
  whatsapp?: string;
  phone?: string;
  verification_status: string;
  created_at: string;
}
