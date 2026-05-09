'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Folder as FolderIcon, Plus, Trash2, X, PlusCircle, CheckCircle2, FileText } from 'lucide-react';
import { api, Folder, Project } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function FolderPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params.id as string;
  
  const [folder, setFolder] = useState<(Folder & { projects: Project[] }) | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStudyDialogOpen, setIsStudyDialogOpen] = useState(false);

  useEffect(() => {
    if (folderId) {
      loadData();
    }
  }, [folderId]);

  const loadData = async () => {
    try {
      const [folderData, projectsData] = await Promise.all([
        api.getFolder(folderId),
        api.getProjects()
      ]);
      setFolder(folderData);
      setAllProjects(projectsData);
    } catch (error) {
      console.error(error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFolder = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Bạn có chắc chắn muốn xóa học phần này khỏi thư mục?')) return;
    try {
      await api.updateProject(projectId, { folderId: null });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleProjectInFolder = async (projectId: string, isCurrentlyInFolder: boolean) => {
    try {
      await api.updateProject(projectId, { folderId: isCurrentlyInFolder ? null : folderId });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500">Đang tải...</div>;
  }

  if (!folder) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="container mx-auto p-4 md:px-8 max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <FolderIcon className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">{folder.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
            <Dialog open={isStudyDialogOpen} onOpenChange={setIsStudyDialogOpen}>
              <DialogTrigger render={
                <Button variant="ghost" className="rounded-full px-8 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all h-10">
                  Học
                </Button>
              } />
              <DialogContent className="sm:max-w-[500px] border-slate-100 dark:border-slate-800 p-8">
                <DialogHeader className="mb-6 space-y-2">
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">Học thư mục này</DialogTitle>
                  <DialogDescription className="text-base text-slate-500">
                    Bạn muốn học như thế nào?
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    render={<Link href={`/folder/${folderId}/study`} />}
                    nativeButton={false}
                    variant="outline" 
                    className="h-16 flex justify-start items-center px-4 gap-4 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm"
                  >
                    <div className="text-blue-500 dark:text-blue-400">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-base">Thẻ ghi nhớ</span>
                  </Button>

                  <Button 
                    render={<Link href={`/folder/${folderId}/quiz`} />}
                    nativeButton={false}
                    variant="outline" 
                    className="h-16 flex justify-start items-center px-4 gap-4 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm"
                  >
                    <div className="text-indigo-500 dark:text-indigo-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-base">Kiểm tra</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger render={
                <Button className="rounded-full px-6 font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 h-10 transition-all shadow-md">
                  <Plus className="h-5 w-5" /> Thêm học phần
                </Button>
              } />
              <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <DialogTitle className="text-xl">Thêm học phần vào thư mục</DialogTitle>
                <DialogDescription>
                  Chọn các học phần bạn muốn thêm vào thư mục "{folder.title}".
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-2">
                {allProjects.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Bạn chưa có học phần nào để thêm.</p>
                ) : (
                  allProjects.map(project => {
                    const isInFolder = project.folderId === folder.id;
                    const isInAnotherFolder = project.folderId !== null && project.folderId !== folder.id;

                    return (
                      <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden pr-4">
                          <div className={`p-2 rounded-lg ${isInFolder ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{project.title}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {isInFolder ? 'Đã thêm vào thư mục này' : isInAnotherFolder ? 'Đang nằm ở thư mục khác' : `${project.description || 'Không có mô tả'}`}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant={isInFolder ? "outline" : "default"} 
                          size="sm" 
                          onClick={() => handleToggleProjectInFolder(project.id, isInFolder)}
                          className={isInFolder ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}
                        >
                          {isInFolder ? (
                            <><X className="h-4 w-4 mr-1" /> Xóa bỏ</>
                          ) : (
                            <><Plus className="h-4 w-4 mr-1" /> Thêm</>
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-6xl mt-6">
        {folder.projects.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm">
            <div className="mx-auto w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <FolderIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thư mục này đang trống</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Thêm học phần vào thư mục để dễ dàng ôn tập nhóm kiến thức liên quan.</p>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-5 w-5" /> Thêm học phần ngay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folder.projects.map((project) => {
              // format date safely without hydration mismatch
              const dateObj = new Date(project.createdAt);
              const dateStr = `${dateObj.getUTCDate().toString().padStart(2, '0')}/${(dateObj.getUTCMonth() + 1).toString().padStart(2, '0')}/${dateObj.getUTCFullYear()}`;
              
              return (
                <Card 
                  key={project.id}
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="h-full hover:shadow-xl transition-all cursor-pointer group relative hover:-translate-y-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden rounded-2xl"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                  <CardHeader className="pb-4">
                    <CardTitle className="line-clamp-1 text-xl font-bold">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px] mt-2 text-slate-500">
                      {project.description || 'Không có mô tả.'}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-4 bg-slate-50/50 dark:bg-slate-950/50">
                    <span className="font-medium">{dateStr}</span>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors z-10 gap-2 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromFolder(project.id, e);
                      }}
                      title="Xóa khỏi thư mục"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden group-hover:inline">Xóa khỏi thư mục</span>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
