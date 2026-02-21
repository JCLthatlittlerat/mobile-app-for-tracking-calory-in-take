export interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  activity_level?: string;
  target_calories?: number;
}

export interface CalorieLog {
  id: number;
  user_id: number;
  date: string;
  food_name: string;
  calories: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
