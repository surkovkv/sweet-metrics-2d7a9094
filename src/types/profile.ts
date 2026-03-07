export interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  role: 'user' | 'admin';  // добавляем role
  is_pro?: boolean;        // если есть
  created_at: string;
  updated_at: string;
}
