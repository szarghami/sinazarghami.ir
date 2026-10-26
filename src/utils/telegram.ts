// =====================================================================
// ماژول ارسال پیام‌های لحظه‌ای و اعلان‌ها به تلگرام اختصاصی سینا ضرغامی
// با استفاده از ربات هوشمند: @ai_Agent_for_sina_bot
// Chat ID: 86050350 (@sina_zarghami)
// =====================================================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8961351294:AAGqsMYUXBFS38uhdMvJjwnRh1FbxGdRGkQ';
const SINA_CHAT_ID = process.env.SINA_CHAT_ID || '86050350';

/**
 * تابع ارسال پیام متنی با فرمت‌بندی HTML به تلگرام سینا ضرغامی
 */
export async function sendTelegramNotification(messageHtml: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: SINA_CHAT_ID,
        text: messageHtml,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.warn('خطا در ارسال پیام تلگرام:', err);
    return false;
  }
}

/**
 * اعلان سفارش خرید نسخه چاپی فاین‌آرت
 */
export async function notifyPrintOrder(details: {
  photoTitle: string;
  size: string;
  paper: string;
  frame: string;
  priceToman: number;
  customerName: string;
  customerContact: string;
  city: string;
}): Promise<boolean> {
  const text = `
🖼 <b>سفارش جدید چاپ فاین‌آرت در sinazarghami.ir</b>

• <b>اثر:</b> ${details.photoTitle}
• <b>قطع چاپ:</b> ${details.size} سانتی‌متر
• <b>نوع کاغذ:</b> ${details.paper}
• <b>وضعیت قاب:</b> ${details.frame}
• <b>مبلغ برآوردی:</b> ${details.priceToman.toLocaleString()} تومان

👤 <b>اطلاعات مشتری:</b>
• <b>نام:</b> ${details.customerName}
• <b>تماس:</b> <code>${details.customerContact}</code>
• <b>شهر / آدرس:</b> ${details.city}

⏰ <i>ثبت‌شده در: ${new Date().toLocaleString('fa-IR')}</i>
  `.trim();

  return sendTelegramNotification(text);
}

/**
 * اعلان رزرو یا استعلام سفر و تور اکتشافی
 */
export async function notifyExpeditionInquiry(details: {
  expeditionTitle: string;
  name: string;
  contact: string;
}): Promise<boolean> {
  const text = `
🧭 <b>درخواست جدید رزرو تور / سفر اکتشافی</b>

• <b>سفر:</b> ${details.expeditionTitle}
• <b>نام مسافر:</b> ${details.name}
• <b>اطلاعات تماس / آیدی:</b> <code>${details.contact}</code>

⏰ <i>ثبت‌شده در: ${new Date().toLocaleString('fa-IR')}</i>
  `.trim();

  return sendTelegramNotification(text);
}

/**
 * اعلان استعلام پروژه عکاسی یا فیلم‌برداری تجاری
 */
export async function notifyProjectCommission(details: {
  service: string;
  clientName: string;
  contact: string;
  brief: string;
}): Promise<boolean> {
  const text = `
🎬 <b>استعلام جدید سفارش پروژه عکاسی و فیلم‌برداری</b>

• <b>حوزه خدمت:</b> ${details.service}
• <b>نام کارفرما / برند:</b> ${details.clientName}
• <b>اطلاعات تماس:</b> <code>${details.contact}</code>
• <b>شرح نیاز پروژه:</b>
${details.brief}

⏰ <i>ثبت‌شده در: ${new Date().toLocaleString('fa-IR')}</i>
  `.trim();

  return sendTelegramNotification(text);
}

/**
 * ارسال پیام امنیتی تلگرام هنگام تغییر رمز عبور پنل مدیریت
 */
export async function notifyPasswordChanged(newPin: string): Promise<boolean> {
  const text = `
🔐 <b>پیام امنیتی sinazarghami.ir</b>

سینا جان، رمز عبور ورود به پنل استودیو با موفقیت تغییر کرد.
• <b>رمز جدید شما:</b> <code>${newPin}</code>

<i>اگر این تغییر توسط شما انجام نشده است، بلافاصله آن را بررسی کنید.</i>
  `.trim();

  return sendTelegramNotification(text);
}

/**
 * ارسال کد یا پیام بازیابی رمز به تلگرام سینا ضرغامی
 */
export async function sendPasswordRecoveryTelegram(currentPass: string): Promise<boolean> {
  const text = `
🔑 <b>درخواست بازیابی رمز عبور پنل sinazarghami.ir</b>

سینا جان، رمز عبور فعال شما:
<code>${currentPass}</code>

<i>این پیام به صورت محرمانه فقط به اکانت تلگرام شخصی شما ارسال شده است.</i>
  `.trim();

  return sendTelegramNotification(text);
}
