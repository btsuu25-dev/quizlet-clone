'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { api, Project, Flashcard } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function StudyModePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [originalCards, setOriginalCards] = useState<Flashcard[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

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
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  }, [currentIndex, flashcards.length]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  }, [currentIndex]);

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
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
    }, 150);
  };

  const restart = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(0), 150);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') nextCard();
      else if (e.key === 'ArrowLeft') prevCard();
      else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        flipCard();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard, flipCard]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-slate-500">Đang tải chế độ học...</div>;
  }

  if (!project || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/project/${projectId}`} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg md:text-xl line-clamp-1">{project.title}</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Chế độ học</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={isShuffled ? "secondary" : "ghost"} 
            size="icon" 
            onClick={toggleShuffle}
            title="Xáo trộn"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={restart}
            title="Học lại"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Study Area */}
      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center justify-center max-w-4xl">
        
        {/* Flashcard 3D Container */}
        <div className="w-full aspect-[4/3] md:aspect-[2/1] relative group perspective-1000" style={{ perspective: '1000px' }}>
          <div 
            className="w-full h-full relative cursor-pointer transition-transform duration-500 ease-in-out"
            style={{ 
              transformStyle: 'preserve-3d', 
              transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)' 
            }}
            onClick={flipCard}
          >
            {/* Front of Card (Term) */}
            <div 
              className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl flex flex-col items-center justify-center p-8 md:p-12"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute top-6 left-6 text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Thuật ngữ
              </div>
              <p className="text-3xl md:text-5xl font-medium text-center text-slate-800 dark:text-slate-100 leading-tight">
                {currentCard.term}
              </p>
              <div className="absolute bottom-6 text-xs text-slate-400 font-medium">
                Nhấn để lật thẻ
              </div>
            </div>

            {/* Back of Card (Definition) */}
            <div 
              className="absolute inset-0 w-full h-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 shadow-xl rounded-3xl flex flex-col items-center justify-center p-8 md:p-12"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
            >
              <div className="absolute top-6 left-6 text-sm font-semibold text-indigo-400 uppercase tracking-widest">
                Định nghĩa
              </div>
              <p className="text-2xl md:text-4xl text-center text-slate-800 dark:text-slate-200 leading-relaxed overflow-y-auto max-h-full">
                {currentCard.definition}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="w-full mt-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={prevCard}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <span className="font-semibold text-lg text-slate-700 dark:text-slate-300 min-w-[3rem] text-center">
              {currentIndex + 1} / {flashcards.length}
            </span>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={nextCard}
              disabled={currentIndex === flashcards.length - 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md space-y-2">
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {/* Keyboard Hints */}
          <div className="hidden md:flex gap-6 text-sm text-slate-400 font-medium mt-4">
            <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-sans border border-slate-300 dark:border-slate-700">Space</kbd> Lật</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-sans border border-slate-300 dark:border-slate-700">←</kbd> Trước</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-sans border border-slate-300 dark:border-slate-700">→</kbd> Sau</span>
          </div>
        </div>
      </main>
    </div>
  );
}
