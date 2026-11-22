import React, { useEffect, useState } from 'react';

type Provider = 'gemini' | 'anthropic' | 'openai';
const names: Record<Provider, string> = { gemini: 'Gemini', anthropic: 'Anthropic', openai: 'OpenAI' };
const all: Provider[] = ['gemini', 'anthropic', 'openai'];

export function AiProviderSettings() {
  const [order, setOrder] = useState<Provider[]>(['gemini']);
  const [paid, setPaid] = useState<Provider | ''>('');
  const [configured, setConfigured] = useState<Partial<Record<Provider, boolean>>>({});
  const [writable, setWritable] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/ai-providers', { credentials: 'same-origin' }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error();
      setOrder(data.settings.order); setPaid(data.settings.paidFallback || ''); setConfigured(data.configured); setWritable(data.writable);
    }).catch(() => setMessage('دریافت تنظیمات سرویس‌ها ناموفق بود.'));
  }, []);

  const save = async () => {
    try {
      const response = await fetch('/api/admin/ai-providers', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order, paidFallback: paid || null }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'ذخیره تنظیمات ناموفق بود.');
      setMessage('ترتیب سرویس‌ها ذخیره شد.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'ذخیره تنظیمات ناموفق بود.'); }
  };

  const move = (index: number, offset: number) => setOrder((current) => {
    const next = [...current]; const target = index + offset;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]]; return next;
  });

  return <section className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3 text-xs">
    <h4 className="text-sm font-bold">ترتیب سرویس‌های هوش مصنوعی</h4>
    <p className="text-stone-600">کلیدها و نام مدل‌ها در تنظیمات امن سرور ثبت می‌شوند. سرویس شارژی همیشه در پایان استفاده می‌شود.</p>
    {all.map((provider) => <label key={provider} className="flex gap-2 items-center">
      <input type="checkbox" disabled={paid === provider} checked={order.includes(provider)} onChange={(event) => setOrder((current) => event.target.checked ? [...current, provider] : current.filter((item) => item !== provider))} />
      <span>{names[provider]}</span><span className={configured[provider] ? 'text-green-700' : 'text-stone-500'}>{configured[provider] ? 'آماده' : 'کلید یا مدل تنظیم نشده'}</span>
    </label>)}
    <div className="flex flex-wrap gap-2">{order.map((provider, index) => <span key={provider} className="bg-white border rounded-lg p-2">{index + 1}. {names[provider]} <button type="button" onClick={() => move(index, -1)} aria-label={`بالا بردن ${names[provider]}`}>↑</button> <button type="button" onClick={() => move(index, 1)} aria-label={`پایین بردن ${names[provider]}`}>↓</button></span>)}</div>
    <label className="flex items-center gap-2">پشتیبان شارژی:
      <select value={paid} onChange={(event) => { const value = event.target.value as Provider | ''; setPaid(value); if (value) setOrder((current) => current.filter((item) => item !== value)); }} className="p-2 bg-white border rounded-lg">
        <option value="">ندارد</option>{all.map((provider) => <option key={provider} value={provider}>{names[provider]}</option>)}
      </select>
    </label>
    {!writable && <p className="text-amber-700">برای ذخیره ترتیب، اتصال ADMIN_KV باید روی سرور فعال باشد.</p>}
    <button type="button" disabled={!writable} onClick={save} className="px-3 py-2 bg-stone-900 text-white rounded-lg disabled:opacity-50">ذخیره ترتیب</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
