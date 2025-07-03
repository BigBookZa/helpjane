import { useStore } from '../store/useStore';
import { sendTelegramNotification } from './api';

class QueueManager {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private processingFiles = new Set<number>();

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const settings = useStore.getState().settings;
    
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, settings.queueCheckInterval * 1000);

    useStore.getState().updateQueueStats({ queueStatus: 'running' });
  }

  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    useStore.getState().updateQueueStats({ queueStatus: 'paused' });
  }

  stop() {
    this.pause();
    this.processingFiles.clear();
    useStore.getState().updateQueueStats({ queueStatus: 'stopped' });
  }

  private async processQueue() {
    if (!this.isRunning) return;

    const state = useStore.getState();
    const { files, settings } = state;
    
    // Get files that need processing
    const queuedFiles = files.filter(
      file => file.status === 'queued' && !this.processingFiles.has(file.id)
    );

    // Limit concurrent processing
    const availableSlots = settings.concurrentProcessing - this.processingFiles.size;
    const filesToProcess = queuedFiles.slice(0, availableSlots);

    // Process each file
    for (const file of filesToProcess) {
      this.processFile(file.id);
    }

    // Update queue stats
    this.updateQueueStats();
  }

  private async processFile(fileId: number) {
    const state = useStore.getState();
    const file = state.files.find(f => f.id === fileId);
    
    if (!file) return;

    this.processingFiles.add(fileId);
    
    // Update file status to processing
    state.updateFile(fileId, { 
      status: 'processing',
      attempts: file.attempts + 1 
    });

    try {
      const startTime = Date.now();
      
      // Send processing request to backend API
      const response = await fetch('/api/files/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          imageUrl: file.thumbnail,
          prompt: file.prompt,
          maxTokens: state.settings.maxTokens,
          temperature: state.settings.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

      // Update file with results
      state.updateFile(fileId, {
        status: 'completed',
        description: result.description,
        keywords: result.keywords,
        processingTime,
        error: undefined,
      });

      // Update project stats
      const project = state.projects.find(p => p.id === file.projectId);
      if (project) {
        state.updateProject(project.id, {
          processed: project.processed + 1,
        });
      }

      // Send notification if enabled
      if (state.settings.notifications.projectCompletion) {
        await this.sendNotification(`✅ File processed: ${file.filename}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if we should retry
      if (file.attempts < state.settings.maxRetries) {
        // Schedule retry
        setTimeout(() => {
          state.updateFile(fileId, { status: 'queued' });
        }, state.settings.retryDelay * 1000);
      } else {
        // Mark as failed
        state.updateFile(fileId, {
          status: 'error',
          error: errorMessage,
        });

        // Update project stats
        const project = state.projects.find(p => p.id === file.projectId);
        if (project) {
          state.updateProject(project.id, {
            errors: project.errors + 1,
          });
        }

        // Send error notification if enabled
        if (state.settings.notifications.errors) {
          await this.sendNotification(`❌ Processing failed: ${file.filename}\nError: ${errorMessage}`);
        }
      }
    } finally {
      this.processingFiles.delete(fileId);
    }
  }

  private updateQueueStats() {
    const state = useStore.getState();
    const { files } = state;

    const totalInQueue = files.filter(f => f.status === 'queued').length;
    const processing = this.processingFiles.size;
    const completed = files.filter(f => f.status === 'completed').length;
    const failed = files.filter(f => f.status === 'error').length;

    // Calculate average processing time
    const completedFiles = files.filter(f => f.status === 'completed' && f.processingTime);
    const avgTime = completedFiles.length > 0
      ? completedFiles.reduce((sum, f) => sum + parseFloat(f.processingTime), 0) / completedFiles.length
      : 0;

    // Estimate remaining time
    const estimatedTime = totalInQueue > 0 && avgTime > 0
      ? Math.ceil((totalInQueue * avgTime) / state.settings.concurrentProcessing)
      : 0;

    state.updateQueueStats({
      totalInQueue,
      processing,
      completed,
      failed,
      avgProcessingTime: avgTime > 0 ? `${avgTime.toFixed(1)}s` : '0s',
      estimatedTimeRemaining: estimatedTime > 0 ? `${Math.floor(estimatedTime / 60)}m ${estimatedTime % 60}s` : '0s',
    });
  }

  private async sendNotification(message: string) {
    try {
      await sendTelegramNotification(message);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  retryFailedFiles(fileIds?: number[]) {
    const state = useStore.getState();
    const filesToRetry = fileIds 
      ? state.files.filter(f => fileIds.includes(f.id) && f.status === 'error')
      : state.files.filter(f => f.status === 'error');

    filesToRetry.forEach(file => {
      state.updateFile(file.id, {
        status: 'queued',
        attempts: 0,
        error: undefined,
      });
    });
  }
}

export const queueManager = new QueueManager();