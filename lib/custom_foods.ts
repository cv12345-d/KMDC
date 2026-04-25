import { supabase } from './supabase';
import type { FoodList, Food } from './foods';

export interface CustomFood {
  id: string;
  user_id: string;
  nom: string;
  liste: FoodList;
  ig_estime: number | null;
  created_at: string;
}

export async function getCustomFoods(userId: string): Promise<CustomFood[]> {
  const { data, error } = await supabase
    .from('custom_foods')
    .select('id, user_id, nom, liste, ig_estime, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as CustomFood[];
}

export async function addCustomFood(userId: string, nom: string, liste: FoodList, igEstime: number | null): Promise<CustomFood> {
  const { data, error } = await supabase
    .from('custom_foods')
    .insert({ user_id: userId, nom, liste, ig_estime: igEstime })
    .select()
    .single();
  if (error) throw error;
  return data as CustomFood;
}

export async function deleteCustomFood(id: string): Promise<void> {
  const { error } = await supabase.from('custom_foods').delete().eq('id', id);
  if (error) throw error;
}

export function customToFood(c: CustomFood): Food {
  return { id: `custom_${c.id}`, nom: c.nom, ig: c.ig_estime, liste: c.liste };
}

export type Categorie = 'legume' | 'fruit' | 'proteine' | 'feculent' | 'laitier' | 'transforme' | 'sucre';
export type Sucre     = 'non' | 'peu' | 'beaucoup';

export function suggestColor(categorie: Categorie, sucre: Sucre): { liste: FoodList; ig: number; reason: string } {
  if (categorie === 'sucre') {
    return { liste: 'rouge', ig: 75, reason: 'Sucre, dessert ou boisson sucrée — IG élevé.' };
  }
  if (categorie === 'transforme') {
    if (sucre === 'beaucoup') return { liste: 'rouge',  ig: 70, reason: 'Plat transformé avec beaucoup de sucre — IG élevé.' };
    if (sucre === 'peu')      return { liste: 'orange', ig: 60, reason: 'Plat transformé peu sucré — IG modéré.' };
    return { liste: 'orange', ig: 55, reason: 'Plat transformé — IG souvent modéré, à surveiller.' };
  }
  if (categorie === 'feculent') {
    if (sucre === 'beaucoup') return { liste: 'rouge',  ig: 75, reason: 'Féculent sucré — IG élevé.' };
    if (sucre === 'peu')      return { liste: 'orange', ig: 60, reason: 'Féculent peu sucré — IG modéré.' };
    return { liste: 'jaune',  ig: 45, reason: 'Féculent nature (légumineuses, céréales complètes) — IG bas.' };
  }
  if (categorie === 'fruit') {
    if (sucre === 'beaucoup') return { liste: 'orange', ig: 60, reason: 'Fruit très sucré (banane mûre, ananas, mangue) — IG modéré.' };
    return { liste: 'jaune', ig: 40, reason: 'Fruit nature — IG bas à modéré.' };
  }
  if (categorie === 'laitier') {
    if (sucre !== 'non')      return { liste: 'orange', ig: 50, reason: 'Produit laitier sucré — IG modéré.' };
    return { liste: 'jaune', ig: 30, reason: 'Produit laitier nature — IG bas.' };
  }
  if (categorie === 'proteine') {
    return { liste: 'verte', ig: 0, reason: 'Protéine pure (viande, poisson, œuf) — pas d\'impact glycémique.' };
  }
  // legume
  if (sucre === 'beaucoup')   return { liste: 'jaune',  ig: 35, reason: 'Légume très sucré ou cuit longuement — IG plus haut.' };
  return { liste: 'verte', ig: 15, reason: 'Légume nature — IG très bas.' };
}
