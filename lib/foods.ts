import { supabase } from './supabase';

export type FoodList = 'verte' | 'orange' | 'rouge';

export interface Food {
  id: string;
  nom: string;
  ig: number;
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
