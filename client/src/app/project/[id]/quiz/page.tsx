'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
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

// Synthesize a cheerful "ting ting" chime using Web Audio API
function playCorrectSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [1046.5, 1318.5]; // C6 → E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch (e) {
    // Silently ignore if AudioContext is unavailable
  }
}

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
      // Find distractors
      const otherCards = cards.filter(c => c.id !== card.id);
      // Shuffle other cards and take up to 3
      const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
      const distractors = shuffledOthers.slice(0, 3).map(c => c.term);
      
      const allOptions = [card.term, ...distractors];
      // Shuffle options
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
    loadData(); // Re-fetch and re-generate to get new random order
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-slate-500">Đang tạo đề trắc nghiệm...</div>;
  }

  if (!project || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Không đủ thẻ để làm trắc nghiệm</h2>
        <p className="text-slate-500 mb-6">Vui lòng thêm ít nhất 1 thẻ ghi nhớ vào dự án.</p>
        <Button render={<Link href={`/project/${projectId}`} />} variant="outline">
          Quay lại dự án
        </Button>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Link href={`/project/${projectId}`} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-200/50 dark:bg-slate-800 p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold">Kết quả: {project.title}</h1>
          </div>

          <Card className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-2">
              <Trophy className={`h-12 w-12 ${percentage >= 80 ? 'text-yellow-500' : 'text-indigo-500'}`} />
            </div>
            <h2 className="text-4xl font-bold">{percentage}%</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Bạn trả lời đúng <strong className="text-slate-900 dark:text-white">{score}</strong> / {questions.length} câu.
            </p>
            
            <div className="flex gap-4 mt-8">
              <Button onClick={handleRestart} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                <RotateCcw className="mr-2 h-5 w-5" /> Làm lại
              </Button>
              <Button render={<Link href={`/project/${projectId}`} />} variant="outline" size="lg">
                Về trang dự án
              </Button>
            </div>
          </Card>

          {wrongAnswers.length > 0 && (
            <div className="space-y-4 mt-12">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <XCircle className="text-red-500 h-5 w-5" /> Cần ôn tập lại ({wrongAnswers.length})
              </h3>
              <div className="grid gap-4">
                {wrongAnswers.map((item, idx) => (
                  <Card key={idx} className="p-5 border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10">
                    <p className="font-medium text-lg mb-4">{item.question.text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-start gap-2">
                        <XCircle className="h-5 w-5 shrink-0 mt-0.5 opacity-70" />
                        <div>
                          <span className="text-xs uppercase tracking-wider opacity-70 block mb-1">Bạn đã chọn</span>
                          {item.selected}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 opacity-70" />
                        <div>
                          <span className="text-xs uppercase tracking-wider opacity-70 block mb-1">Đáp án đúng</span>
                          {item.question.correctAnswer}
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/project/${projectId}`} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg md:text-xl line-clamp-1">{project.title}</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Trắc nghiệm</p>
          </div>
        </div>
        <div className="font-medium text-slate-500">
          {currentIndex + 1} / {questions.length}
        </div>
      </header>

      <Progress value={progressPercentage} className="h-1 rounded-none bg-slate-200 dark:bg-slate-800" />

      {/* Main Quiz Area */}
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-3xl flex flex-col justify-center">
        
        <div className="mb-10 text-center">
          <span className="text-sm font-semibold text-indigo-500 uppercase tracking-widest mb-4 block">Câu hỏi</span>
          <h2 className="text-2xl md:text-4xl font-medium text-slate-900 dark:text-white leading-relaxed">
            {currentQ.text}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((option, idx) => {
            let stateClass = "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800";
            let icon = null;

            if (isAnswered) {
              if (option === currentQ.correctAnswer) {
                // Correct answer always highlights green
                stateClass = "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-900 dark:text-green-100";
                icon = <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
              } else if (option === selectedOption) {
                // Selected wrong answer highlights red
                stateClass = "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-900 dark:text-red-100";
                icon = <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
              } else {
                // Unselected wrong answers fade out
                stateClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswered}
                className={`text-left p-6 rounded-xl border-2 transition-all duration-200 flex justify-between items-center ${
                  !isAnswered ? 'active:scale-[0.98]' : 'cursor-default'
                } ${stateClass}`}
              >
                <span className="text-lg font-medium">{option}</span>
                {icon}
              </button>
            );
          })}
        </div>

        <div className="mt-12 h-16 flex justify-center">
          {isAnswered && (
            <Button 
              onClick={handleNext} 
              size="lg" 
              className="px-12 text-lg h-14 bg-indigo-600 hover:bg-indigo-700 animate-in fade-in slide-in-from-bottom-4"
            >
              {currentIndex < questions.length - 1 ? 'Tiếp theo' : 'Xem kết quả'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
