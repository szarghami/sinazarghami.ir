// Telegram credentials stay in Cloudflare Secrets; this browser module only calls the same-origin API.
export async function sendTelegramNotification(messageHtml: string, env: Env): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`
      },
      credentials: 'same-origin',
      body: JSON.stringify({ message: messageHtml })
    });
    const result = await response.json();
    return response.ok && result.success === true;
  } catch (error) {
    console.warn('خطا در ارسال پیام تلگرام:', error);
    return false;
  }
  try {
    const response = await fetch('/api/telegram/notify', {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.ADMIN_EMAIL}` },
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ message: messageHtml }),
    });
    const result = await response.json();
    return response.ok && result.success === true;
  } catch (error) {
    console.warn('خطا در ارسال پیام تلگرام:', error);
    return false;
  }
}

export function notifyPrintOrder(details: {
  photoTitle: string; size: string; paper: string; frame: string; priceToman: number;
  customerName: string; customerContact: string; city: string;
}): Promise<boolean> {
  return sendTelegramNotification(`🖼 <b>سفارش جدید چاپ فاین‌آرت در sinazarghami.ir</b>\n\n• <b>اثر:</b> ${details.photoTitle}\n• <b>قطع چاپ:</b> ${details.size} سانتی‌متر\n• <b>نوع کاغذ:</b> ${details.paper}\n• <b>وضعیت قاب:</b> ${details.frame}\n• <b>مبلغ برآوردی:</b> ${details.priceToman.toLocaleString()} تومان\n\n👤 <b>مشتری:</b> ${details.customerName}\n• <b>تماس:</b> <code>${details.customerContact}</code>\n• <b>شهر / آدرس:</b> ${details.city}\n⏰ <i>${new Date().toLocaleString('fa-IR')}</i>`);
}

export function notifyExpeditionInquiry(details: { expeditionTitle: string; name: string; contact: string }): Promise<boolean> {
  return sendTelegramNotification(`🧭 <b>درخواست رزرو سفر</b>\n• <b>سفر:</b> ${details.expeditionTitle}\n• <b>نام:</b> ${details.name}\n• <b>تماس:</b> <code>${details.contact}</code>`);
}

export function notifyProjectCommission(details: { service: string; clientName: string; contact: string; brief: string }): Promise<boolean> {
  return sendTelegramNotification(`🎬 <b>استعلام سفارش پروژه</b>\n• <b>خدمت:</b> ${details.service}\n• <b>کارفرما:</b> ${details.clientName}\n• <b>تماس:</b> <code>${details.contact}</code>\n• <b>شرح:</b>\n${details.brief}`);
}

export function notifyPasswordChanged(_newPin: string): Promise<boolean> {
  return sendTelegramNotification('🔐 رمز عبور مدیریت تغییر کرد.');
}

export function sendPasswordRecoveryTelegram(_currentPass: string): Promise<boolean> {
  return Promise.resolve(false);
}
