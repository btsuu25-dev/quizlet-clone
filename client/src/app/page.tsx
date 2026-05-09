'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BookOpen, Trash2, LogOut, User as UserIcon, FolderPlus, FileText, Folder as FolderIcon, Home, BrainCircuit, Menu, X } from 'lucide-react';
import { api, Project, User, Folder } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'library'>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  // Đóng sidebar khi chuyển tab trên mobile
  const handleTabChange = (tab: 'home' | 'library') => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const checkAuthAndLoad = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const userData = await api.getMe();
      setUser(userData.user);
      const [projectsData, foldersData] = await Promise.all([api.getProjects(), api.getFolders()]);
      setProjects(projectsData);
      setFolders(foldersData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderTitle.trim()) return;
    try {
      await api.createFolder({ title: newFolderTitle });
      setIsFolderOpen(false);
      setNewFolderTitle('');
      checkAuthAndLoad();
      setActiveTab('library');
    } catch (error) { console.error(error); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    try {
      await api.createProject(newProject);
      setIsOpen(false);
      setNewProject({ title: '', description: '' });
      checkAuthAndLoad();
      setActiveTab('home');
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Bạn có chắc chắn muốn xóa học phần này không?')) return;
    try {
      await api.deleteProject(id);
      checkAuthAndLoad();
    } catch (error) { console.error(error); }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Bạn có chắc chắn muốn xóa thư mục này không? Các học phần bên trong vẫn sẽ được giữ lại.')) return;
    try {
      await api.deleteFolder(id);
      checkAuthAndLoad();
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500">Đang tải...</div>;
  }

  if (!user) return null;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">QuizletClone</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <button
          onClick={() => handleTabChange('home')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'home'
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Home className={`h-5 w-5 ${activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
          Trang chủ
        </button>

        <button
          onClick={() => handleTabChange('library')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'library'
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderIcon className={`h-5 w-5 ${activeTab === 'library' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
          Thư viện của bạn
        </button>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm text-slate-500 truncate">Xin chào,</p>
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</h3>
          </div>
        </div>

        <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
          <DialogTrigger render={
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300">
              <LogOut className="h-5 w-5 mr-3" /> Đăng xuất
            </Button>
          } />
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Xác nhận đăng xuất</DialogTitle>
              <DialogDescription>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình không?</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end mt-4">
              <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={handleLogout}>Đăng xuất</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - Desktop: sticky | Mobile: slide-in overlay */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40
        w-72 md:w-64 h-screen
        border-r border-slate-200 dark:border-slate-800
        bg-white dark:bg-slate-900
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Close button - mobile only */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <SidebarContent />
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {/* Mobile Top Bar */}
        <div className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">QuizletClone</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activeTab === 'home' ? 'Trang chủ' : 'Thư viện của bạn'}
              </h1>
              <p className="text-slate-500 mt-1 text-sm sm:text-base">
                {activeTab === 'home' ? 'Quản lý các bộ thẻ ghi nhớ của bạn' : 'Tổ chức các thư mục học tập'}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5 w-full sm:w-auto">
                  <Plus className="h-5 w-5" /> Tạo mới
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl">
                <DropdownMenuItem onClick={() => setIsOpen(true)} className="cursor-pointer p-3 rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                  <FileText className="mr-3 h-4 w-4" />
                  <span className="font-medium">Học phần</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsFolderOpen(true)} className="cursor-pointer p-3 rounded-lg focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-500/10 dark:focus:text-indigo-400">
                  <FolderPlus className="mr-3 h-4 w-4" />
                  <span className="font-medium">Thư mục</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Study Set Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px] p-6 sm:p-8 rounded-2xl">
                <form onSubmit={handleCreate}>
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Tạo học phần mới</DialogTitle>
                    <DialogDescription className="text-base text-slate-500 mt-2">Đặt một tiêu đề rõ ràng cho bộ thẻ của bạn.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-3">
                      <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Tiêu đề</Label>
                      <Input id="title" placeholder="Ví dụ: Cơ bản về JavaScript" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} autoFocus className="h-12 sm:h-14 text-base sm:text-lg bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl px-4 shadow-sm transition-all dark:bg-slate-900 dark:border-slate-800 dark:focus:bg-slate-950 font-medium placeholder:text-slate-400" />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Mô tả (Không bắt buộc)</Label>
                      <Input id="description" placeholder="Mô tả ngắn gọn..." value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} className="h-12 sm:h-14 text-base sm:text-lg bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl px-4 shadow-sm transition-all dark:bg-slate-900 dark:border-slate-800 dark:focus:bg-slate-950 font-medium placeholder:text-slate-400" />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="submit" disabled={!newProject.title.trim()} className="h-12 px-8 text-base font-bold rounded-xl w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-md">
                      Tạo học phần
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Create Folder Dialog */}
            <Dialog open={isFolderOpen} onOpenChange={setIsFolderOpen}>
              <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px] p-6 sm:p-8 rounded-2xl">
                <form onSubmit={handleCreateFolder}>
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Tạo thư mục mới</DialogTitle>
                    <DialogDescription className="text-base text-slate-500 mt-2">Thư mục giúp bạn tổ chức các học phần gọn gàng hơn.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-3">
                      <Label htmlFor="folderTitle" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Tên thư mục</Label>
                      <Input id="folderTitle" placeholder="Ví dụ: Tiếng Anh học kỳ 1" value={newFolderTitle} onChange={(e) => setNewFolderTitle(e.target.value)} autoFocus className="h-12 sm:h-14 text-base sm:text-lg bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl px-4 shadow-sm transition-all dark:bg-slate-900 dark:border-slate-800 dark:focus:bg-slate-950 font-medium placeholder:text-slate-400" />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="submit" disabled={!newFolderTitle.trim()} className="h-12 px-8 text-base font-bold rounded-xl w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-md">
                      Tạo thư mục
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tab Content */}
          {activeTab === 'home' && (
            <div>
              {projects.length === 0 ? (
                <div className="text-center py-16 sm:py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Chưa có học phần nào</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm sm:text-base px-4">Tạo học phần đầu tiên để lưu trữ các câu hỏi trắc nghiệm của riêng bạn.</p>
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" /> Tạo học phần ngay
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {projects.map((project) => {
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
                          <CardTitle className="line-clamp-1 text-lg sm:text-xl font-bold">{project.title}</CardTitle>
                          <CardDescription className="line-clamp-2 min-h-[40px] mt-2 text-slate-500">
                            {project.description || 'Không có mô tả.'}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-4 bg-slate-50/50 dark:bg-slate-950/50">
                          <span className="font-medium">{dateStr}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors z-10"
                            onClick={(e) => { e.stopPropagation(); handleDelete(project.id, e); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div>
              {folders.length === 0 ? (
                <div className="text-center py-16 sm:py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
                    <FolderIcon className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Thư viện trống</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm sm:text-base px-4">Thư mục giúp bạn nhóm các học phần liên quan lại với nhau để dễ dàng quản lý.</p>
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setIsFolderOpen(true)}>
                    <FolderPlus className="mr-2 h-5 w-5" /> Tạo thư mục mới
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {folders.map((folder) => (
                    <Link href={`/folder/${folder.id}`} key={folder.id}>
                      <Card className="h-full hover:shadow-xl transition-all cursor-pointer group relative hover:-translate-y-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden rounded-2xl">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                        <CardHeader className="flex flex-row items-center gap-4 pb-4">
                          <div className="p-3 sm:p-3.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl shadow-sm shrink-0">
                            <FolderIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <CardTitle className="text-lg sm:text-xl font-bold truncate">{folder.title}</CardTitle>
                            <CardDescription className="mt-1.5 font-medium text-slate-500">
                              {new Date(folder.createdAt).toLocaleDateString('vi-VN')}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardFooter className="flex justify-end border-t border-slate-100 dark:border-slate-800/60 pt-4 bg-slate-50/50 dark:bg-slate-950/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors z-10"
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
