import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  lang?: 'fa-IR' | 'en-US';
  title?: string;
  className?: string;
  isAppendMode?: boolean;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  lang = 'fa-IR',
  title = 'دیکته صوتی و تبدیل گفتار به متن',
  className = '',
  isAppendMode = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (finalChunk) {
          onTranscript(finalChunk.trim());
          setInterimText('');
        } else if (currentInterim) {
          setInterimText(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status/error:', event.error);
        if (event.error === 'not-allowed') {
          alert('دسترسی به میکروفون در مرورگر داده نشده است. لطفاً در نوار آدرس دسترسی میکروفون را فعال کنید.');
        }
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech Recognition init failed:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [lang, onTranscript, isAppendMode]);

  const toggleListen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      alert('مرورگر فعلی از دیکته صوتی تحت وب پشتیبانی نمی‌کند. در مایکروسافت اج یا کروم این قابلیت فعال است.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        setIsListening(false);
      }
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Start recognition error:', err);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListen}
        title={isListening ? 'در حال ضبط صدا... برای پایان کلیک کنید' : title}
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

      {/* حباب نمایش متن زنده در حال صحبت */}
      {isListening && interimText && (
        <div className="absolute bottom-full mb-2 right-0 z-50 bg-stone-900/95 backdrop-blur-md text-amber-300 text-xs px-3 py-1.5 rounded-lg shadow-xl border border-stone-700 whitespace-nowrap max-w-xs truncate animate-fade-in">
          <span className="text-stone-400 text-[10px] block">در حال تبدیل گفتار:</span>
          «{interimText}»
        </div>
      )}
    </div>
  );
};
