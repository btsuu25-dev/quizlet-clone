export interface CreateProjectDto {
  title: string;
  description?: string;
  folderId?: string | null;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  folderId?: string | null;
}

export interface CreateFlashcardDto {
  projectId: string;
  term: string;
  definition: string;
  order?: number;
}

export interface UpdateFlashcardDto {
  term?: string;
  definition?: string;
  order?: number;
}

export interface CreateFolderDto {
  title: string;
}
