import { supabase } from './supabase';

export type FoodList = 'verte' | 'jaune' | 'orange' | 'rouge';

export interface Food {
  id: string;
  nom: string;
  ig: number | null;
  liste: FoodList;
}

export async function getFoods(): Promise<Food[]> {
  const { data, error } = await supabase
    .from('foods')
    .select('id, nom, ig, liste')
    .order('liste')
    .order('ig');
  if (error) throw error;
  return data as Food[];
}
