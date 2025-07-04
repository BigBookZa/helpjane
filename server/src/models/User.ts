import db from '../database/connection';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export class UserModel {
  private static createUserStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  private static findByEmailStmt = db.prepare(`
    SELECT id, name, email, role, created_at, updated_at, last_login, is_active
    FROM users WHERE email = ? AND is_active = 1
  `);

  private static findByIdStmt = db.prepare(`
    SELECT id, name, email, role, created_at, updated_at, last_login, is_active
    FROM users WHERE id = ? AND is_active = 1
  `);

  private static updateLastLoginStmt = db.prepare(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
  `);

  private static getPasswordHashStmt = db.prepare(`
    SELECT password_hash FROM users WHERE email = ? AND is_active = 1
  `);

  static async create(userData: CreateUserData): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const result = this.createUserStmt.run(
        userData.name,
        userData.email,
        hashedPassword,
        userData.role || 'user'
      );

      const user = this.findByIdStmt.get(result.lastInsertRowid) as User;
      if (!user) {
        throw new Error('Failed to create user');
      }

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static findByEmail(email: string): User | null {
    try {
      return this.findByEmailStmt.get(email) as User | null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static findById(id: number): User | null {
    try {
      return this.findByIdStmt.get(id) as User | null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async validatePassword(email: string, password: string): Promise<boolean> {
    try {
      const result = this.getPasswordHashStmt.get(email) as { password_hash: string } | null;
      if (!result) return false;

      return bcrypt.compare(password, result.password_hash);
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  }

  static updateLastLogin(userId: number): void {
    try {
      this.updateLastLoginStmt.run(userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  static async authenticate(email: string, password: string): Promise<User | null> {
    try {
      const user = this.findByEmail(email);
      if (!user) return null;

      const isValid = await this.validatePassword(email, password);
      if (!isValid) return null;

      this.updateLastLogin(user.id);
      return user;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }
}