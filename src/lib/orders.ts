import { trace } from '@opentelemetry/api';
import { supabase } from './supabase';

const tracer = trace.getTracer('supabase-o11y-lab');

export function loadOrders() {
  return tracer.startActiveSpan('load orders', async (span) => {
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .select('id, item, amount, created_at')
        .order('created_at', { ascending: false });
      if (error) span.recordException(error.message);
      return { data, error };
    } finally {
      span.end();
    }
  });
}

export function addOrder(item: string, amount: number) {
  // user_id is filled in by the table's default (auth.uid()).
  return supabase.from('lab_orders').insert({ item, amount });
}
