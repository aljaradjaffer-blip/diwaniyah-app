'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Home() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [month, setMonth] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData(session.user.id);
      else setLoading(false);
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('خطأ في بيانات الدخول');
      setLoading(false);
    } else {
      setSession(data.session);
      loadData(data.session.user.id);
    }
  }

  async function loadData(userId) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setUserRole(profile?.role || 'MEMBER');

    const { data: mData } = await supabase.from('months').select('*').limit(1).single();
    setMonth(mData || { month_name: 'أغسطس 2026', fee_amount: 150 });

    const { data: mems } = await supabase.from('members').select('*');
    setMembers(mems || []);

    const { data: pays } = await supabase.from('payments').select('*');
    setPayments(pays || []);

    setLoading(false);
  }

  async function togglePayment(memberId) {
    if (userRole !== 'ADMIN') return;
    const existing = payments.find(p => p.member_id === memberId);
    if (existing) {
      await supabase.from('payments').delete().eq('id', existing.id);
    } else {
      await supabase.from('payments').insert({
        member_id: memberId,
        month_id: month.id,
        amount: month.fee_amount
      });
    }
    loadData(session.user.id);
  }

  if (loading) return <div className="p-10 text-center text-xl font-bold">جاري التحميل...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4" dir="rtl">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">ديوانية شارع مكة</h2>
          <input
            type="email" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full p-3 border rounded-xl mb-3 outline-none focus:ring-2 focus:ring-indigo-500" required
          />
          <input
            type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full p-3 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500" required
          />
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">
            تسجيل الدخول
          </button>
        </form>
      </div>
    );
  }

  const totalMembers = members.length;
  const paidCount = payments.length;
  const unpaidCount = totalMembers - paidCount;
  const fee = month?.fee_amount || 150;
  const totalRequired = totalMembers * fee;
  const totalCollected = paidCount * fee;
  const remaining = totalRequired - totalCollected;

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-2xl mx-auto" dir="rtl">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ديوانية شارع مكة</h1>
          <p className="text-xs text-slate-500">{userRole === 'ADMIN' ? 'حساب المدير (Admin)' : 'حساب الأعضاء (عرض فقط)'}</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => setSession(null))} className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold">
          خروج
        </button>
      </header>

      <div className="bg-indigo-600 text-white p-4 rounded-2xl mb-4 shadow-sm flex justify-between items-center">
        <span className="font-bold">الشهر الحالي:</span>
        <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">{month?.month_name}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <span className="text-xs text-slate-400 font-bold">👥 الأعضاء</span>
          <p className="text-xl font-black text-slate-800">{totalMembers}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <span className="text-xs text-slate-400 font-bold">📋 المطلوب</span>
          <p className="text-xl font-black text-slate-800">{totalRequired} ر.س</p>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
          <span className="text-xs text-emerald-600 font-bold">✅ المحصل ({paidCount})</span>
          <p className="text-xl font-black text-emerald-700">{totalCollected} ر.س</p>
        </div>
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
          <span className="text-xs text-rose-600 font-bold">⏳ المتبقي ({unpaidCount})</span>
          <p className="text-xl font-black text-rose-700">{remaining} ر.س</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b font-bold text-slate-700">جدول الاشتراكات</div>
        <div className="divide-y">
          {members.map((m, idx) => {
            const isPaid = payments.some(p => p.member_id === m.id);
            return (
              <div key={m.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                  <span className="font-semibold text-slate-800 text-sm">{m.full_name}</span>
                </div>
                {userRole === 'ADMIN' ? (
                  <button
                    onClick={() => togglePayment(m.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                  >
                    {isPaid ? '🟢 تم الدفع' : '🔴 تسديد'}
                  </button>
                ) : (
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isPaid ? '🟢 مدفوع' : '🔴 غير مدفوع'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
