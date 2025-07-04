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
  private static createProjectStmt = db.prepare(`
    INSERT INTO projects (user_id, name, description, category, storage, thumbnail_size, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  private static findByIdStmt = db.prepare(`
    SELECT * FROM projects WHERE id = ? AND user_id = ?
  `);

  private static findByUserStmt = db.prepare(`
    SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC
  `);

  private static updateProjectStmt = db.prepare(`
    UPDATE projects SET 
      name = ?, description = ?, category = ?, storage = ?, 
      thumbnail_size = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);

  private static updateStatsStmt = db.prepare(`
    UPDATE projects SET 
      files_count = ?, processed_count = ?, error_count = ?, 
      status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  private static deleteProjectStmt = db.prepare(`
    DELETE FROM projects WHERE id = ? AND user_id = ?
  `);

  private static getProjectStatsStmt = db.prepare(`
    SELECT 
      COUNT(*) as total_files,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_files,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_files,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_files
    FROM files WHERE project_id = ?
  `);

  static create(projectData: CreateProjectData): Project {
    try {
      const tags = JSON.stringify(projectData.tags || []);
      
      const result = this.createProjectStmt.run(
        projectData.user_id,
        projectData.name,
        projectData.description || '',
        projectData.category || 'general',
        projectData.storage || 'local',
        projectData.thumbnail_size || 'medium',
        tags
      );

      const project = this.findByIdStmt.get(result.lastInsertRowid, projectData.user_id) as Project;
      return this.parseProject(project);
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  static findById(id: number, userId: number): Project | null {
    try {
      const project = this.findByIdStmt.get(id, userId) as Project | null;
      return project ? this.parseProject(project) : null;
    } catch (error) {
      console.error('Error finding project by ID:', error);
      return null;
    }
  }

  static findByUser(userId: number): Project[] {
    try {
      const projects = this.findByUserStmt.all(userId) as Project[];
      return projects.map(this.parseProject);
    } catch (error) {
      console.error('Error finding projects by user:', error);
      return [];
    }
  }

  static update(id: number, userId: number, updates: Partial<CreateProjectData>): Project | null {
    try {
      const current = this.findById(id, userId);
      if (!current) return null;

      const tags = JSON.stringify(updates.tags || current.tags);
      
      this.updateProjectStmt.run(
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
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  static delete(id: number, userId: number): boolean {
    try {
      const result = this.deleteProjectStmt.run(id, userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  static updateStats(projectId: number): void {
    try {
      const stats = this.getProjectStatsStmt.get(projectId) as any;
      
      let status: Project['status'] = 'active';
      if (stats?.processing_files > 0) {
        status = 'processing';
      } else if (stats?.error_files > 0 && stats?.completed_files === 0) {
        status = 'error';
      } else if (stats?.total_files > 0 && stats?.completed_files === stats?.total_files) {
        status = 'completed';
      }

      this.updateStatsStmt.run(
        stats?.total_files || 0,
        stats?.completed_files || 0,
        stats?.error_files || 0,
        status,
        projectId
      );
    } catch (error) {
      console.error('Error updating project stats:', error);
    }
  }

  static getUserStats(userId: number): {
    total_projects: number;
    active_projects: number;
    total_files: number;
    processed_files: number;
  } {
    try {
      const projectStatsStmt = db.prepare(`
        SELECT 
          COUNT(*) as total_projects,
          SUM(CASE WHEN status = 'active' OR status = 'processing' THEN 1 ELSE 0 END) as active_projects,
          SUM(files_count) as total_files,
          SUM(processed_count) as processed_files
        FROM projects WHERE user_id = ?
      `);
      
      const projectStats = projectStatsStmt.get(userId) as any;

      return {
        total_projects: projectStats?.total_projects || 0,
        active_projects: projectStats?.active_projects || 0,
        total_files: projectStats?.total_files || 0,
        processed_files: projectStats?.processed_files || 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_projects: 0,
        active_projects: 0,
        total_files: 0,
        processed_files: 0
      };
    }
  }

  private static parseProject(project: Project): Project {
    try {
      return {
        ...project,
        tags: typeof project.tags === 'string' ? JSON.parse(project.tags) : (project.tags || [])
      };
    } catch (error) {
      console.error('Error parsing project tags:', error);
      return {
        ...project,
        tags: []
      };
    }
  }
}