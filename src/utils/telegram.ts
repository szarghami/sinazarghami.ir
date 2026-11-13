interface ContactPayload {
  kind: 'print' | 'trip' | 'project' | 'general';
  name: string;
  contact: string;
  subject?: string;
  details: string;
}

async function sendContactMessage(payload: ContactPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.success === true;
  } catch (error) {
    console.warn('خطا در ارسال پیام:', error);
    return false;
  }
}

/** ارسال پیام از پنل مدیریت (نیازمند نشست مدیر). */
export async function sendTelegramNotification(messageHtml: string): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ message: messageHtml }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.success === true;
  } catch (error) {
    console.warn('خطا در ارسال پیام تلگرام:', error);
    return false;
  }
}

export function notifyPrintOrder(details: {
  photoTitle: string;
  size: string;
  paper: string;
  frame: string;
  priceToman: number;
  customerName: string;
  customerContact: string;
  city: string;
}): Promise<boolean> {
  return sendContactMessage({
    kind: 'print',
    name: details.customerName,
    contact: details.customerContact,
    subject: `سفارش چاپ: ${details.photoTitle}`,
    details: [
      `اثر: ${details.photoTitle}`,
      `قطع چاپ: ${details.size} سانتی‌متر`,
      `نوع کاغذ: ${details.paper}`,
      `وضعیت قاب: ${details.frame}`,
      `مبلغ برآوردی: ${details.priceToman.toLocaleString()} تومان`,
      `شهر / آدرس: ${details.city}`,
    ].join('\n'),
  });
}

export function notifyExpeditionInquiry(details: {
  expeditionTitle: string;
  name: string;
  contact: string;
}): Promise<boolean> {
  return sendContactMessage({
    kind: 'trip',
    name: details.name,
    contact: details.contact,
    subject: `درخواست رزرو سفر: ${details.expeditionTitle}`,
    details: `درخواست ثبت‌نام برای سفر «${details.expeditionTitle}».`,
  });
}

export function notifyProjectCommission(details: {
  service: string;
  clientName: string;
  contact: string;
  brief: string;
}): Promise<boolean> {
  return sendContactMessage({
    kind: 'project',
    name: details.clientName,
    contact: details.contact,
    subject: `استعلام پروژه: ${details.service}`,
    details: details.brief,
  });
}

export function notifyPasswordChanged(): Promise<boolean> {
  return sendTelegramNotification('🔐 رمز عبور مدیریت تغییر کرد.');
}

export function sendPasswordRecoveryTelegram(): Promise<boolean> {
  return Promise.resolve(false);
}
