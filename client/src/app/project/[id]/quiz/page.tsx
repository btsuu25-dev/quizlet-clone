'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, XCircle, RotateCcw, Trophy, Check, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { api, Project, Flashcard } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface Question {
  originalCard: Flashcard;
  text: string;
  correctAnswer: string;
  options: string[];
}

// Shared AudioContext to prevent exceeding browser limit
let sharedAudioCtx: AudioContext | null = null;

// Synthesize a cheerful "ting ting" chime using Web Audio API
function playCorrectSound() {
  if (typeof window === 'undefined') return;
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    
    const now = sharedAudioCtx.currentTime + 0.02;
    const notes = [1046.5, 1318.5]; // C6 → E6
    
    notes.forEach((freq, i) => {
      if (!sharedAudioCtx) return;
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function playWrongSound() {
  if (typeof window === 'undefined') return;
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    if (!sharedAudioCtx) return;
    
    const now = sharedAudioCtx.currentTime + 0.02;
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now); 
    osc.frequency.linearRampToValueAtTime(140, now + 0.25);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    
    osc.start(now);
    osc.stop(now + 0.28);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

// Confetti Canvas Component
const ConfettiCanvas = () => {
  useEffect(() => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];
    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height - 20,
      r: Math.random() * 4 + 3,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: Math.random() * Math.PI,
      w: Math.random() * 6 + 4,
      h: Math.random() * 10 + 6,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 + 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.tiltAngle) * 0.4;
        p.tilt = Math.sin(p.tiltAngle) * 4;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.w / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.h / 2);
        ctx.stroke();

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      id="confetti-canvas"
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};

export default function QuizModePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<{question: Question, selected: string}[]>([]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projData, cardsData] = await Promise.all([
        api.getProject(projectId),
        api.getFlashcards(projectId)
      ]);
      setProject(projData);
      generateQuiz(cardsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = (cards: Flashcard[]) => {
    if (cards.length === 0) return;

    // Create questions
    let generated: Question[] = cards.map(card => {
      const otherCards = cards.filter(c => c.id !== card.id);
      const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
      const distractors = shuffledOthers.slice(0, 3).map(c => c.term);
      
      const allOptions = [card.term, ...distractors];
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

      return {
        originalCard: card,
        text: card.definition,
        correctAnswer: card.term,
        options: shuffledOptions
      };
    });

    // Shuffle questions
    generated = generated.sort(() => Math.random() - 0.5);
    
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setWrongAnswers([]);
    setShowResults(false);
    setIsAnswered(false);
    setSelectedOption(null);
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    if (option === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
      playCorrectSound();
    } else {
      setWrongAnswers(prev => [...prev, { question: currentQ, selected: option }]);
      playWrongSound();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    if (!project) return;
    loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="font-semibold text-lg">Đang thiết lập bài trắc nghiệm...</span>
      </div>
    );
  }

  if (!project || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-2xl font-bold mb-4">Không đủ thẻ để làm trắc nghiệm</h2>
        <p className="text-slate-500 mb-6">Vui lòng thêm ít nhất 1 thẻ ghi nhớ vào dự án.</p>
        <Button render={<Link href={`/project/${projectId}`} />} variant="outline">
          Quay lại dự án
        </Button>
      </div>
    );
  }

  const percentage = Math.round((score / questions.length) * 100);

  if (showResults) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-12 transition-colors duration-300">
        {percentage >= 70 && <ConfettiCanvas />}
        
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <Link href={`/project/${projectId}`} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-200/50 dark:bg-slate-800 p-2.5 rounded-full hover:scale-105 active:scale-95">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kết quả trắc nghiệm</h1>
          </div>

          <Card className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl transition-colors duration-300">
            <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center relative animate-bounce mb-2">
              <Trophy className={`h-12 w-12 ${percentage >= 80 ? 'text-amber-500 animate-pulse' : 'text-indigo-600'}`} />
              {percentage >= 70 && <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">{percentage}%</h2>
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                {percentage >= 80 ? 'Xuất sắc! Bạn nắm rất vững học phần này.' : percentage >= 50 ? 'Khá tốt! Ôn tập thêm một chút nhé.' : 'Cố gắng lên! Hãy thử luyện tập lại nhé.'}
              </p>
            </div>
            
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Bạn trả lời đúng <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{score}</strong> / {questions.length} câu.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-md">
              <Button onClick={handleRestart} size="lg" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all">
                <RotateCcw className="mr-2 h-5 w-5" /> Làm lại trắc nghiệm
              </Button>
              <Button render={<Link href={`/project/${projectId}`} />} variant="outline" size="lg" className="flex-1 font-bold h-14 rounded-2xl border-indigo-200 dark:border-indigo-850 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:-translate-y-0.5 transition-all">
                Về trang học phần
              </Button>
            </div>
          </Card>

          {wrongAnswers.length > 0 && (
            <div className="space-y-4 mt-8 animate-in slide-in-from-bottom-8 duration-500 delay-150 fill-mode-both">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="text-red-500 h-5.5 w-5.5" /> Thẻ cần ôn tập lại ({wrongAnswers.length})
              </h3>
              <div className="grid gap-4">
                {wrongAnswers.map((item, idx) => (
                  <Card key={idx} className="p-6 border-red-100 dark:border-red-950/30 bg-red-50/20 dark:bg-red-950/10 rounded-2xl shadow-sm">
                    <p className="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-4">{item.question.text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-red-100/60 dark:bg-red-900/20 text-red-800 dark:text-red-200 flex items-start gap-2.5">
                        <XCircle className="h-5 w-5 shrink-0 mt-0.5 opacity-80" />
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-1">Bạn đã chọn</span>
                          <span className="font-bold text-base">{item.selected}</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-green-100/60 dark:bg-green-900/20 text-green-800 dark:text-green-200 flex items-start gap-2.5">
                        <Check className="h-5 w-5 shrink-0 mt-0.5 opacity-80" />
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-1">Đáp án đúng</span>
                          <span className="font-bold text-base">{item.question.correctAnswer}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercentage = ((currentIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {/* Dynamic shake & scale styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animate-spring-scale {
          animation: springScale 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.3);
        }
        @keyframes springScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <Link href={`/project/${projectId}`} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full hover:scale-105 active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg md:text-xl line-clamp-1 text-slate-900 dark:text-white">{project.title}</h1>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase">Bài thi trắc nghiệm</p>
          </div>
        </div>
        <div className="font-bold text-slate-600 dark:text-slate-400">
          Câu {currentIndex + 1} / {questions.length}
        </div>
      </header>

      <Progress value={progressPercentage} className="h-1.5 rounded-none bg-slate-200 dark:bg-slate-800 [&>div]:bg-indigo-600 dark:[&>div]:bg-indigo-500 transition-all duration-300" />

      {/* Main Quiz Area */}
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-3xl flex flex-col justify-center">
        
        {/* Question Container - Animated with key when question changes */}
        <div 
          key={`q-${currentIndex}`} 
          className="mb-10 text-center animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <span className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 block">ĐỊNH NGHĨA / GỢI Ý</span>
          <h2 className="text-2xl md:text-4.5xl font-extrabold text-slate-900 dark:text-white leading-relaxed max-w-2xl mx-auto">
            {currentQ.text}
          </h2>
        </div>

        {/* Options Grid - Animated with key for clean mount entries */}
        <div 
          key={`opts-${currentIndex}`}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {currentQ.options.map((option, idx) => {
            let stateClass = "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 shadow-sm";
            let icon = null;

            if (isAnswered) {
              if (option === currentQ.correctAnswer) {
                // Correct answer glows green
                stateClass = "bg-green-500/10 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400 shadow-green-500/5 animate-spring-scale";
                icon = (
                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center animate-in zoom-in duration-300">
                    <Check className="h-4.5 w-4.5" />
                  </div>
                );
              } else if (option === selectedOption) {
                // Selected wrong answer shakes and highlights red
                stateClass = "bg-red-500/10 dark:bg-red-950/20 border-red-500 text-red-750 dark:text-red-400 shadow-red-500/5 animate-shake";
                icon = (
                  <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center animate-in zoom-in duration-300">
                    <XCircle className="h-4.5 w-4.5" />
                  </div>
                );
              } else {
                // Unselected options fade out slightly
                stateClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 opacity-40";
              }
            }

            // Stagger animation delays for entrance
            const animationDelayClass = idx === 0 ? "delay-[50ms]" : idx === 1 ? "delay-[100ms]" : idx === 2 ? "delay-[150ms]" : "delay-[200ms]";

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswered}
                className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 flex justify-between items-center ${
                  !isAnswered ? 'active:scale-[0.98] hover:border-indigo-400 hover:shadow-indigo-500/5' : 'cursor-default'
                } ${stateClass} animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both ${animationDelayClass} font-bold text-lg`}
              >
                <span className="pr-4 leading-normal break-words">{option}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {/* Next Question Control */}
        <div className="mt-12 h-16 flex justify-center items-center">
          {isAnswered && (
            <Button 
              onClick={handleNext} 
              size="lg" 
              className="px-12 text-lg h-14 font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              {currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả bài thi'} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
