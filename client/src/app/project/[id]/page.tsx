'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Plus, FileText, Upload, BrainCircuit } from 'lucide-react';
import { api, Project, Flashcard } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [termSeparator, setTermSeparator] = useState('tab');
  const [customTermSep, setCustomTermSep] = useState('-');
  const [cardSeparator, setCardSeparator] = useState('newline');
  const [customCardSep, setCustomCardSep] = useState('\\n\\n');
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projData, cardsData] = await Promise.all([api.getProject(projectId), api.getFlashcards(projectId)]);
      setProject(projData);
      setFlashcards(cardsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;
    try {
      await api.createFlashcard(projectId, { term, definition });
      setTerm('');
      setDefinition('');
      loadData();
    } catch (error) { console.error(error); }
  };

  const parsedCardsPreview = useCallback(() => {
    if (!importText.trim()) return [];
    let tSep = '\t';
    if (termSeparator === 'comma') tSep = ',';
    if (termSeparator === 'custom') tSep = customTermSep;
    let cSep = '\n';
    if (cardSeparator === 'semicolon') cSep = ';';
    if (cardSeparator === 'custom') cSep = customCardSep.replace(/\\n/g, '\n');
    if (!tSep) return [];
    let blocks = cSep === '\n' ? importText.split(/\r?\n/) : importText.split(cSep);
    const validCards = [];
    for (const block of blocks) {
      if (!block.trim()) continue;
      const parts = block.split(tSep);
      if (parts.length >= 2) {
        const t = parts[0].trim();
        const d = parts.slice(1).join(tSep).trim();
        if (t || d) validCards.push({ term: t, definition: d });
      } else {
        validCards.push({ term: block.trim(), definition: '' });
      }
    }
    return validCards;
  }, [importText, termSeparator, customTermSep, cardSeparator, customCardSep]);

  const handleImportSubmit = async () => {
    const cardsToCreate = parsedCardsPreview().filter(c => c.term && c.definition);
    if (cardsToCreate.length === 0) { alert('Không tìm thấy thẻ hợp lệ nào để nhập.'); return; }
    setIsParsing(true);
    try {
      await Promise.all(cardsToCreate.map(c => api.createFlashcard(projectId, c)));
      setImportText('');
      setIsImportOpen(false);
      loadData();
      alert(`Đã nhập thành công ${cardsToCreate.length} thẻ!`);
    } catch (error) {
      console.error(error);
      alert('Lỗi khi nhập thẻ.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Xóa thẻ này?')) return;
    try { await api.deleteFlashcard(id); loadData(); } catch (error) { console.error(error); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Đang tải dữ liệu...</div>;
  if (!project) return <div className="flex items-center justify-center min-h-screen text-red-500">Không tìm thấy dự án</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
        </Link>

        <div className="mb-6 sm:mb-8 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl border shadow-sm">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{project.title}</h1>
          {project.description && <p className="text-slate-500 mt-2 text-base sm:text-lg">{project.description}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-slate-900 dark:text-white">Thêm thẻ ghi nhớ</h2>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="manual">Thêm thủ công</TabsTrigger>
                  <TabsTrigger value="import">Nhập hàng loạt</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <form onSubmit={handleManualAdd} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="term">Thuật ngữ</Label>
                          <Input id="term" placeholder="Ví dụ: CPU" value={term} onChange={(e) => setTerm(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="definition">Định nghĩa</Label>
                          <Textarea id="definition" placeholder="Bộ xử lý trung tâm..." value={definition} onChange={(e) => setDefinition(e.target.value)} rows={3} />
                        </div>
                        <Button type="submit" className="w-full" disabled={!term.trim() || !definition.trim()}>
                          <Plus className="h-4 w-4 mr-2" /> Thêm thẻ
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="import" className="mt-4">
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center justify-center py-10 text-center space-y-4">
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                        <Upload className="h-8 w-8 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">Nhập dữ liệu lớn</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Chép và dán từ Word, Excel, Google Docs, v.v.</p>
                        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                          <DialogTrigger render={<Button className="w-full text-base font-medium">Mở cửa sổ nhập dữ liệu</Button>} />
                          <DialogContent className="w-[calc(100%-1rem)] max-w-6xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border-0 bg-white dark:bg-slate-950">
                            <DialogHeader className="p-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                              <DialogTitle className="text-xl sm:text-2xl font-bold flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-slate-900 dark:text-white">
                                Nhập dữ liệu 
                                <span className="text-sm sm:text-base font-normal text-slate-500">Chép và dán dữ liệu ở đây</span>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-5 sm:p-8 flex flex-col gap-8">
                              
                              <Textarea
                                placeholder={"Từ 1\tĐịnh nghĩa 1\nTừ 2\tĐịnh nghĩa 2"}
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                className="min-h-[200px] sm:min-h-[250px] font-sans text-base leading-relaxed p-5 border-2 border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 shadow-sm resize-y rounded-xl focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/20 transition-all"
                              />

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 p-2">
                                <div className="space-y-4">
                                  <Label className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Giữa thuật ngữ và định nghĩa</Label>
                                  <RadioGroup value={termSeparator} onValueChange={setTermSeparator} className="space-y-3">
                                    <div className="flex items-center space-x-3"><RadioGroupItem value="tab" id="t-tab" className="w-5 h-5 text-indigo-600 border-indigo-600" /><Label htmlFor="t-tab" className="text-base font-medium cursor-pointer">Tab</Label></div>
                                    <div className="flex items-center space-x-3"><RadioGroupItem value="comma" id="t-comma" className="w-5 h-5 text-indigo-600 border-indigo-600" /><Label htmlFor="t-comma" className="text-base font-medium cursor-pointer">Phẩy</Label></div>
                                    <div className="flex items-center space-x-3 h-10">
                                      <RadioGroupItem value="custom" id="t-custom" className="w-5 h-5 text-indigo-600 border-indigo-600" />
                                      <Label htmlFor="t-custom" className="text-base font-medium cursor-pointer w-24">Tùy chỉnh</Label>
                                      {termSeparator === 'custom' && <Input value={customTermSep} onChange={e => setCustomTermSep(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} className="w-20 h-10 text-center font-bold border-slate-300" />}
                                    </div>
                                  </RadioGroup>
                                </div>
                                <div className="space-y-4">
                                  <Label className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Giữa các thẻ</Label>
                                  <RadioGroup value={cardSeparator} onValueChange={setCardSeparator} className="space-y-3">
                                    <div className="flex items-center space-x-3"><RadioGroupItem value="newline" id="c-nl" className="w-5 h-5 text-indigo-600 border-indigo-600" /><Label htmlFor="c-nl" className="text-base font-medium cursor-pointer">Dòng mới</Label></div>
                                    <div className="flex items-center space-x-3"><RadioGroupItem value="semicolon" id="c-semi" className="w-5 h-5 text-indigo-600 border-indigo-600" /><Label htmlFor="c-semi" className="text-base font-medium cursor-pointer">Chấm phẩy</Label></div>
                                    <div className="flex items-center space-x-3 h-10">
                                      <RadioGroupItem value="custom" id="c-custom" className="w-5 h-5 text-indigo-600 border-indigo-600" />
                                      <Label htmlFor="c-custom" className="text-base font-medium cursor-pointer w-24">Tùy chỉnh</Label>
                                      {cardSeparator === 'custom' && <Input value={customCardSep} onChange={e => setCustomCardSep(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} className="w-20 h-10 text-center font-bold border-slate-300" />}
                                    </div>
                                  </RadioGroup>
                                </div>
                              </div>

                              <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-2 flex flex-col">
                                <div className="flex items-center justify-between mb-4 px-2">
                                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Xem trước <span className="text-slate-500 font-normal text-base ml-2">{parsedCardsPreview().length} thẻ</span></h3>
                                </div>
                                <div>
                                  {parsedCardsPreview().length === 0 ? (
                                    <p className="text-slate-500 italic text-base px-2">Không có nội dung để xem trước</p>
                                  ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar px-2">
                                      {parsedCardsPreview().slice(0, 50).map((card, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                                          <div className="w-1/2 break-words text-base font-medium text-slate-900 dark:text-slate-100">{card.term}</div>
                                          <div className="w-px bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                                          <div className="w-1/2 break-words text-base text-slate-600 dark:text-slate-400">{card.definition}</div>
                                        </div>
                                      ))}
                                      {parsedCardsPreview().length > 50 && <p className="text-center text-sm text-slate-500 py-4 font-medium">... và {parsedCardsPreview().length - 50} thẻ nữa</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end shrink-0 gap-4">
                              <Button variant="outline" className="h-11 px-6 text-base font-medium rounded-full bg-indigo-100/50 hover:bg-indigo-100 text-indigo-700 border-0" onClick={() => setIsImportOpen(false)}>Hủy</Button>
                              <Button onClick={handleImportSubmit} disabled={isParsing || parsedCardsPreview().length === 0} className="h-11 px-8 text-base font-semibold rounded-full bg-indigo-400 hover:bg-indigo-500 text-white shadow-sm transition-all disabled:opacity-50">
                                {isParsing ? 'Đang nhập...' : 'Nhập'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column: Flashcard List */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Thẻ của bạn ({flashcards.length})</h2>
              {flashcards.length > 0 && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button render={<Link href={`/project/${projectId}/study`} />} nativeButton={false} className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none">
                    <BrainCircuit className="h-4 w-4 mr-2" /> Chế độ học
                  </Button>
                  <Button render={<Link href={`/project/${projectId}/quiz`} />} nativeButton={false} variant="outline" className="border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex-1 sm:flex-none">
                    <FileText className="h-4 w-4 mr-2" /> Trắc nghiệm
                  </Button>
                </div>
              )}
            </div>

            {flashcards.length === 0 ? (
              <div className="text-center py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">Chưa có thẻ nào</h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm px-4">Thêm thẻ thủ công ở trên hoặc dùng tab nhập hàng loạt để sao chép văn bản nhanh chóng.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {flashcards.map((card, index) => (
                  <Card key={card.id} className="group transition-all hover:shadow-md border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="bg-slate-50 dark:bg-slate-900 flex sm:flex-col items-center justify-center p-2 sm:p-3 sm:w-14 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-base sm:text-lg">
                        {index + 1}
                      </div>
                      <div className="p-4 sm:p-5 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 relative">
                        <div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Thuật ngữ</div>
                          <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-white">{card.term}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Định nghĩa</div>
                          <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{card.definition}</div>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-3 right-3 h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
