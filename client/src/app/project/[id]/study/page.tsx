'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Trophy, Check, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { api, Project, Flashcard } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Shared AudioContext to prevent exceeding browser limit
let sharedAudioCtx: AudioContext | null = null;

function playFlipSound() {
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
    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
    filter.Q.setValueAtTime(1.5, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
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
    const particles = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height - 20,
      r: Math.random() * 4 + 3,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.08 + 0.03,
      tiltAngle: Math.random() * Math.PI,
      w: Math.random() * 6 + 4,
      h: Math.random() * 10 + 6,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2.5 + 2,
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

export default function StudyModePage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [originalCards, setOriginalCards] = useState<Flashcard[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Swipe States
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Learning Stats
  const [learnedCount, setLearnedCount] = useState(0);
  const [notLearnedCount, setNotLearnedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

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
      setFlashcards(cardsData);
      setOriginalCards(cardsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, flashcards.length]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
      }, 150);
    }
  }, [currentIndex]);

  const flipCard = useCallback(() => {
    setIsFlipped(prev => {
      playFlipSound();
      return !prev;
    });
  }, []);

  const toggleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (isShuffled) {
        setFlashcards([...originalCards]);
      } else {
        const shuffled = [...originalCards].sort(() => Math.random() - 0.5);
        setFlashcards(shuffled);
      }
      setIsShuffled(!isShuffled);
      setCurrentIndex(0);
      setLearnedCount(0);
      setNotLearnedCount(0);
      setIsCompleted(false);
    }, 150);
  };

  const restart = () => {
    setIsFlipped(false);
    setIsCompleted(false);
    setLearnedCount(0);
    setNotLearnedCount(0);
    setTimeout(() => setCurrentIndex(0), 150);
  };

  // Keyboard navigation
  useEffect(() => {
    if (isCompleted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        setLearnedCount(prev => prev + 1);
        nextCard();
      }
      else if (e.key === 'ArrowLeft') {
        setNotLearnedCount(prev => prev + 1);
        prevCard();
      }
      else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        flipCard();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard, flipCard, isCompleted]);

  // Touch & Mouse Drag Handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (isCompleted) return;
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart || !isDragging) return;
    const offsetX = clientX - dragStart.x;
    const offsetY = clientY - dragStart.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStart(null);

    const threshold = 120;
    const isClick = Math.abs(dragOffset.x) < 6 && Math.abs(dragOffset.y) < 6;

    if (isClick) {
      flipCard();
    } else if (dragOffset.x > threshold) {
      setLearnedCount(prev => prev + 1);
      nextCard();
    } else if (dragOffset.x < -threshold) {
      setNotLearnedCount(prev => prev + 1);
      nextCard();
    }

    setDragOffset({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="font-semibold text-lg">Đang tải học phần...</span>
      </div>
    );
  }

  if (!project || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-2xl font-bold mb-4">Không có thẻ nào</h2>
        <Button render={<Link href={`/project/${projectId}`} />} variant="outline">
          Quay lại dự án
        </Button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progressPercentage = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {isCompleted && <ConfettiCanvas />}

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <Link href={`/project/${projectId}`} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full hover:scale-105 active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg md:text-xl line-clamp-1 text-slate-900 dark:text-white">{project.title}</h1>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase">Chế độ học học phần</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={isShuffled ? "secondary" : "ghost"} 
            size="icon" 
            onClick={toggleShuffle}
            title="Xáo trộn học phần"
            className="rounded-full w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Shuffle className={`h-4.5 w-4.5 ${isShuffled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={restart}
            title="Bắt đầu học lại từ đầu"
            className="rounded-full w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center justify-center max-w-4xl">
        
        {isCompleted ? (
          // BEAUTIFUL CELEBRATION COMPLETED SCREEN
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-8 md:p-12 text-center flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500 transition-colors duration-300">
            <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center relative animate-bounce">
              <Trophy className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              <Sparkles className="h-6 w-6 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Tuyệt vời!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
                Bạn đã đi hết <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{flashcards.length} thẻ ghi nhớ</strong> trong học phần này!
              </p>
            </div>

            {/* Learning statistics cards */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-2">
              <div className="p-5 rounded-2xl bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Check className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{learnedCount}</span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Đã thuộc</span>
              </div>
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{notLearnedCount}</span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cần ôn lại</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4">
              <Button onClick={restart} size="lg" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 rounded-2xl shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                <RotateCcw className="mr-2.5 h-5 w-5" /> Học lại từ đầu
              </Button>
              <Button render={<Link href={`/project/${projectId}/quiz`} />} size="lg" variant="outline" className="flex-1 font-bold h-14 rounded-2xl border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                Làm trắc nghiệm <ArrowRight className="ml-2.5 h-5 w-5" />
              </Button>
            </div>
            
            <Link href={`/project/${projectId}`} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold text-sm transition-colors mt-2">
              Quay lại danh sách học phần
            </Link>
          </div>
        ) : (
          // INTERACTIVE SWIPEABLE FLASHCARD WORKSPACE
          <>
            {/* Flashcard 3D Container with Gestures */}
            <div 
              className="w-full aspect-[4/3] md:aspect-[2/1] relative select-none touch-none"
              style={{ perspective: '1000px' }}
              onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
              onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) {
                  handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={handleDragEnd}
            >
              {/* Swipe Dynamic Indicators */}
              {isDragging && dragOffset.x > 40 && (
                <div 
                  className="absolute top-6 right-6 z-20 border-4 border-green-500 text-green-500 font-extrabold text-lg md:text-xl px-4 py-2 rounded-2xl rotate-[-12deg] bg-green-500/10 pointer-events-none transition-all shadow-sm shadow-green-500/10"
                  style={{ opacity: Math.min((dragOffset.x - 40) / 70, 1) }}
                >
                  ĐÃ THUỘC (THẢ)
                </div>
              )}
              {isDragging && dragOffset.x < -40 && (
                <div 
                  className="absolute top-6 left-6 z-20 border-4 border-red-500 text-red-500 font-extrabold text-lg md:text-xl px-4 py-2 rounded-2xl rotate-[12deg] bg-red-500/10 pointer-events-none transition-all shadow-sm shadow-red-500/10"
                  style={{ opacity: Math.min((-dragOffset.x - 40) / 70, 1) }}
                >
                  CẦN ÔN LẠI (THẢ)
                </div>
              )}

              {/* Translation Container */}
              <div
                className="w-full h-full"
                style={{
                  transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
              >
                {/* 3D Flip Container */}
                <div 
                  className="w-full h-full relative cursor-grab active:cursor-grabbing transition-transform duration-500"
                  style={{ 
                    transformStyle: 'preserve-3d', 
                    transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)' 
                  }}
                >
                  {/* Front of Card (Term) */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-indigo-950/10 rounded-3xl flex flex-col items-center justify-center p-8 md:p-12 transition-colors duration-300"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute top-6 left-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Thuật ngữ
                    </div>
                    <p className="text-3xl md:text-5xl font-extrabold text-center text-slate-800 dark:text-slate-100 leading-tight">
                      {currentCard.term}
                    </p>
                    <div className="absolute bottom-6 text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                      Nhấn để lật thẻ • Kéo trái/phải để phân loại
                    </div>
                  </div>

                  {/* Back of Card (Definition) */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-indigo-50/70 dark:bg-slate-900/90 border border-indigo-100 dark:border-slate-800 shadow-xl dark:shadow-indigo-950/10 rounded-3xl flex flex-col items-center justify-center p-8 md:p-12 transition-colors duration-300"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
                  >
                    <div className="absolute top-6 left-6 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                      Định nghĩa
                    </div>
                    <p className="text-2xl md:text-4xl text-center font-bold text-slate-800 dark:text-slate-200 leading-relaxed overflow-y-auto max-h-[70%] pr-1 custom-scrollbar">
                      {currentCard.definition}
                    </p>
                    <div className="absolute bottom-6 text-xs font-semibold text-indigo-500/80 dark:text-indigo-400/80 tracking-wider">
                      Nhấn để lật ngược lại
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="w-full mt-8 flex flex-col items-center gap-5">
              <div className="flex items-center gap-8 bg-white dark:bg-slate-900 p-2.5 rounded-full shadow-md border border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                  onClick={() => {
                    setNotLearnedCount(prev => prev + 1);
                    prevCard();
                  }}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <span className="font-extrabold text-base text-slate-700 dark:text-slate-300 min-w-[3.5rem] text-center tracking-tight">
                  {currentIndex + 1} / {flashcards.length}
                </span>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                  onClick={() => {
                    setLearnedCount(prev => prev + 1);
                    nextCard();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-2 mt-1">
                <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider px-1">
                  <span>Tiến độ học</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2.5 bg-slate-200 dark:bg-slate-800 [&>div]:bg-indigo-600 dark:[&>div]:bg-indigo-500 rounded-full transition-all duration-500" />
              </div>
              
              {/* Keyboard Hints */}
              <div className="hidden md:flex gap-6 text-xs text-slate-400 dark:text-slate-500 font-bold mt-4 tracking-wider uppercase">
                <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-slate-900 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 font-sans border border-slate-300 dark:border-slate-700 shadow-sm font-bold">Space</kbd> Lật thẻ</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-slate-900 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 font-sans border border-slate-300 dark:border-slate-700 shadow-sm font-bold">←</kbd> Cần ôn lại</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-slate-900 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 font-sans border border-slate-300 dark:border-slate-700 shadow-sm font-bold">→</kbd> Đã thuộc</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
