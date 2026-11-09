import { supabase } from './supabase';

export function loadOrders() {
  return supabase
    .from('lab_orders')
    .select('id, item, amount, created_at')
    .order('created_at', { ascending: false });
}

export function addOrder(item: string, amount: number) {
  // user_id is filled in by the table's default (auth.uid()).
  return supabase.from('lab_orders').insert({ item, amount });
}
