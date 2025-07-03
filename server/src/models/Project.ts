import db from '../database/connection';

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  category: string;
  storage: 'local' | 'yandex';
  thumbnail_size: 'small' | 'medium' | 'large';
  tags: string[];
  status: 'active' | 'processing' | 'completed' | 'error' | 'paused';
  files_count: number;
  processed_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  user_id: number;
  name: string;
  description?: string;
  category?: string;
  storage?: 'local' | 'yandex';
  thumbnail_size?: 'small' | 'medium' | 'large';
  tags?: string[];
}

export class ProjectModel {
  private static createProject = db.prepare(`
    INSERT INTO projects (user_id, name, description, category, storage, thumbnail_size, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  private static findById = db.prepare(`
    SELECT * FROM projects WHERE id = ? AND user_id = ?
  `);

  private static findByUser = db.prepare(`
    SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC
  `);

  private static updateProject = db.prepare(`
    UPDATE projects SET 
      name = ?, description = ?, category = ?, storage = ?, 
      thumbnail_size = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);

  private static updateStats = db.prepare(`
    UPDATE projects SET 
      files_count = ?, processed_count = ?, error_count = ?, 
      status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  private static deleteProject = db.prepare(`
    DELETE FROM projects WHERE id = ? AND user_id = ?
  `);

  private static getProjectStats = db.prepare(`
    SELECT 
      COUNT(*) as total_files,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_files,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_files,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_files
    FROM files WHERE project_id = ?
  `);

  static create(projectData: CreateProjectData): Project {
    const tags = JSON.stringify(projectData.tags || []);
    
    const result = this.createProject.run(
      projectData.user_id,
      projectData.name,
      projectData.description || '',
      projectData.category || 'general',
      projectData.storage || 'local',
      projectData.thumbnail_size || 'medium',
      tags
    );

    const project = this.findById.get(result.lastInsertRowid, projectData.user_id) as Project;
    return this.parseProject(project);
  }

  static findById(id: number, userId: number): Project | null {
    const project = this.findById.get(id, userId) as Project | null;
    return project ? this.parseProject(project) : null;
  }

  static findByUser(userId: number): Project[] {
    const projects = this.findByUser.all(userId) as Project[];
    return projects.map(this.parseProject);
  }

  static update(id: number, userId: number, updates: Partial<CreateProjectData>): Project | null {
    const current = this.findById(id, userId);
    if (!current) return null;

    const tags = JSON.stringify(updates.tags || current.tags);
    
    this.updateProject.run(
      updates.name || current.name,
      updates.description !== undefined ? updates.description : current.description,
      updates.category || current.category,
      updates.storage || current.storage,
      updates.thumbnail_size || current.thumbnail_size,
      tags,
      id,
      userId
    );

    return this.findById(id, userId);
  }

  static delete(id: number, userId: number): boolean {
    const result = this.deleteProject.run(id, userId);
    return result.changes > 0;
  }

  static updateStats(projectId: number): void {
    const stats = this.getProjectStats.get(projectId) as any;
    
    let status: Project['status'] = 'active';
    if (stats.processing_files > 0) {
      status = 'processing';
    } else if (stats.error_files > 0 && stats.completed_files === 0) {
      status = 'error';
    } else if (stats.total_files > 0 && stats.completed_files === stats.total_files) {
      status = 'completed';
    }

    this.updateStats.run(
      stats.total_files,
      stats.completed_files,
      stats.error_files,
      status,
      projectId
    );
  }

  static getUserStats(userId: number): {
    total_projects: number;
    active_projects: number;
    total_files: number;
    processed_files: number;
  } {
    const projectStats = db.prepare(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'active' OR status = 'processing' THEN 1 ELSE 0 END) as active_projects,
        SUM(files_count) as total_files,
        SUM(processed_count) as processed_files
      FROM projects WHERE user_id = ?
    `).get(userId) as any;

    return {
      total_projects: projectStats.total_projects || 0,
      active_projects: projectStats.active_projects || 0,
      total_files: projectStats.total_files || 0,
      processed_files: projectStats.processed_files || 0
    };
  }

  private static parseProject(project: Project): Project {
    return {
      ...project,
      tags: JSON.parse(project.tags as any) || []
    };
  }
}