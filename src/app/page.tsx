'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { addOrder, loadOrders } from '@/lib/orders';

type Order = { id: number; item: string; amount: number; created_at: string };

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  return (
    <main style={{ maxWidth: 560, margin: '2rem auto', padding: '0 1rem' }}>
      {session ? <Orders email={session.user.email ?? ''} /> : <SignIn />}
    </main>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : '');
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Sign in</h1>
      <p><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required /></p>
      <p><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required /></p>
      <button type="submit">Sign in</button>
      {message && <p role="alert">{message}</p>}
    </form>
  );
}

function Orders({ email }: { email: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');

  async function refresh() {
    const { data, error } = await loadOrders();
    setError(error ? JSON.stringify({ error: error.message }) : '');
    setOrders((data as Order[]) ?? []);
  }

  useEffect(() => {
    let active = true;
    loadOrders().then(({ data, error }) => {
      if (!active) return;
      setError(error ? JSON.stringify({ error: error.message }) : '');
      setOrders((data as Order[]) ?? []);
    });
    return () => {
      active = false;
    };
  }, []);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const { error } = await addOrder(item, Number(amount));
    if (error) {
      setError(JSON.stringify({ error: error.message }));
      return;
    }
    setItem('');
    setAmount('');
    refresh();
  }

  return (
    <div>
      <p>
        Signed in as <b>{email}</b>{' '}
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </p>
      <h1>Orders</h1>
      {error && <pre role="alert">{error}</pre>}
      <form onSubmit={onAdd}>
        <input placeholder="Item" value={item} onChange={(e) => setItem(e.target.value)} required />{' '}
        <input placeholder="Amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />{' '}
        <button type="submit">Add order</button>
      </form>
      {orders.length === 0 && !error ? (
        <p>No orders yet.</p>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id}>{o.item} — {o.amount}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
