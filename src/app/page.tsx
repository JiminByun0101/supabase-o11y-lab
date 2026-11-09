'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { addOrder, loadOrders } from '@/lib/orders';

type Order = { id: number; item: string; amount: number; created_at: string };

const money = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
    <main className="page">
      <div className="brand">
        <span className="brand-dot" aria-hidden="true" />
        supabase-o11y-lab
      </div>
      {session ? <Orders email={session.user.email ?? ''} /> : <SignIn />}
    </main>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : '');
    setBusy(false);
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>Sign in</h1>
      <p className="subtitle">Use one of the demo users you created in Part 0.</p>
      <div className="stack">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="demo1@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
      {message && (
        <p className="alert" role="alert">
          {message}
        </p>
      )}
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
    <>
      <div className="topbar">
        <div className="user">
          <div className="user-label">Signed in as</div>
          <div className="user-email">{email}</div>
        </div>
        <button className="btn btn-ghost btn-small" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>

      <form className="card" onSubmit={onAdd}>
        <h2>Add an order</h2>
        <div className="row stack">
          <div className="field">
            <label htmlFor="item">Item</label>
            <input
              id="item"
              placeholder="Coffee beans"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit">
            Add order
          </button>
        </div>
      </form>

      <section className="card">
        <div className="list-head">
          <h1>Orders</h1>
          {orders.length > 0 && <span className="count">{orders.length} total</span>}
        </div>
        {error && (
          <pre className="alert" role="alert">
            {error}
          </pre>
        )}
        {orders.length === 0 && !error ? (
          <p className="empty">No orders yet.</p>
        ) : (
          <ul className="orders">
            {orders.map((o) => (
              <li className="order" key={o.id}>
                <div>
                  <div className="order-item">{o.item}</div>
                  <div className="order-date">{formatDate(o.created_at)}</div>
                </div>
                <div className="order-amount">{money.format(o.amount)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
