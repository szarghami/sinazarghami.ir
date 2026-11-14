import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Mic, MicOff } from 'lucide-react';

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  lang?: 'fa-IR' | 'en-US';
  title?: string;
  className?: string;
  isAppendMode?: boolean;
}

function getRecognitionConstructor(): any {
  if (typeof window === 'undefined') return null;
  const scope = window as any;
  return scope.SpeechRecognition || scope.webkitSpeechRecognition || null;
}

/**
 * دیکته صوتی با پیام‌های روشن و بدون پاپ‌آپ.
 * روی مرورگرهایی که پشتیبانی نمی‌کنند، دکمه اصلاً ساخته نمی‌شود.
 */
export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  lang = 'fa-IR',
  title = 'دیکته صوتی و تبدیل گفتار به متن',
  className = '',
}) => {
  const [isSupported] = useState<boolean>(() => Boolean(getRecognitionConstructor()));
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const wantsListeningRef = useRef(false);
  const transcriptRef = useRef(onTranscript);

  // با هر رندر والد، شنونده نباید از نو ساخته و قطع شود؛ پس تابع در ref می‌ماند
  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognition = getRecognitionConstructor();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalChunk = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const item = event.results[index];
        if (item.isFinal) finalChunk += item[0].transcript;
        else interim += item[0].transcript;
      }
      if (finalChunk) {
        transcriptRef.current(finalChunk.trim());
        setInterimText('');
      } else if (interim) {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: any) => {
      const code = String(event?.error || '');
      if (code === 'no-speech' || code === 'aborted') return;
      wantsListeningRef.current = false;
      setIsListening(false);
      setInterimText('');
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setErrorMessage(
          'مرورگر اجازه میکروفون نداده است. روی قفل نوار آدرس بزن و Microphone را Allow کن.',
        );
      } else if (code === 'network') {
        setErrorMessage(
          'سرویس تبدیل گفتار در دسترس نیست. روی آیفون یا اینترنت محدود، از میکروفون کیبورد گوشی استفاده کن.',
        );
      } else if (code === 'audio-capture') {
        setErrorMessage('میکروفونی پیدا نشد؛ اتصال یا مجوز دستگاه را بررسی کن.');
      } else {
        setErrorMessage(
          'دیکته صوتی انجام نشد؛ می‌توانی متن را تایپ کنی یا از دیکته کیبورد استفاده کنی.',
        );
      }
    };

    recognition.onend = () => {
      if (wantsListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          wantsListeningRef.current = false;
        }
      }
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      wantsListeningRef.current = false;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  if (!isSupported) return null;

  const toggleListen = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setErrorMessage(null);

    if (isListening) {
      wantsListeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        setIsListening(false);
      }
      return;
    }

    try {
      wantsListeningRef.current = true;
      recognitionRef.current?.start();
    } catch {
      wantsListeningRef.current = false;
      setIsListening(false);
      setErrorMessage('شروع دیکته ممکن نشد؛ یک بار دیگر بزن.');
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListen}
        title={isListening ? 'در حال ضبط... برای پایان کلیک کن' : title}
        className={`relative p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium ${
          isListening
            ? 'bg-red-500 text-white shadow-md ring-2 ring-red-300 animate-pulse'
            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-200'
        } ${className}`}
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <MicOff className="w-3.5 h-3.5 text-white" />
            <span className="text-[11px] font-bold">در حال شنیدن...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-stone-600" />
            <span className="text-[11px] hidden sm:inline">دیکته صوتی</span>
          </>
        )}
      </button>

      {isListening && interimText && (
        <div className="absolute bottom-full mb-2 right-0 z-50 bg-stone-900/95 backdrop-blur-md text-amber-300 text-xs px-3 py-1.5 rounded-lg shadow-xl border border-stone-700 whitespace-nowrap max-w-xs truncate animate-fade-in">
          <span className="text-stone-400 text-[10px] block">در حال تبدیل گفتار:</span>
          «{interimText}»
        </div>
      )}

      {errorMessage && (
        <div className="absolute top-full mt-2 right-0 z-50 w-72 bg-red-50 border border-red-200 text-red-900 text-[11px] leading-relaxed px-3 py-2 rounded-lg shadow-lg flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setErrorMessage(null);
            }}
            className="text-red-500 hover:text-red-800 cursor-pointer shrink-0"
            aria-label="بستن"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
