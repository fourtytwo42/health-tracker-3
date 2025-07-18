import { BaseService } from './BaseService';
import { prisma } from '../prisma';

export interface SystemMessage {
  id: string;
  key: string;
  title: string;
  content: string;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSystemMessageData {
  key: string;
  title: string;
  content: string;
  category: string;
  description?: string;
}

export interface UpdateSystemMessageData {
  title?: string;
  content?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export class SystemMessageService extends BaseService {
  async getAllMessages(): Promise<SystemMessage[]> {
    try {
      return await prisma.systemMessage.findMany({
        orderBy: [
          { category: 'asc' },
          { title: 'asc' }
        ]
      });
    } catch (error) {
      console.error('Error fetching system messages:', error);
      throw new Error('Failed to fetch system messages');
    }
  }

  async getMessagesByCategory(category: string): Promise<SystemMessage[]> {
    try {
      return await prisma.systemMessage.findMany({
        where: { category },
        orderBy: { title: 'asc' }
      });
    } catch (error) {
      console.error(`Error fetching system messages for category ${category}:`, error);
      throw new Error(`Failed to fetch system messages for category ${category}`);
    }
  }

  async getMessageByKey(key: string): Promise<SystemMessage | null> {
    try {
      return await prisma.systemMessage.findUnique({
        where: { key }
      });
    } catch (error) {
      console.error(`Error fetching system message with key ${key}:`, error);
      throw new Error(`Failed to fetch system message with key ${key}`);
    }
  }

  async getMessageContent(key: string): Promise<string | null> {
    try {
      const message = await prisma.systemMessage.findUnique({
        where: { key, isActive: true },
        select: { content: true }
      });
      return message?.content || null;
    } catch (error) {
      console.error(`Error fetching system message content for key ${key}:`, error);
      return null;
    }
  }

  async createMessage(data: CreateSystemMessageData): Promise<SystemMessage> {
    try {
      return await prisma.systemMessage.create({
        data
      });
    } catch (error) {
      console.error('Error creating system message:', error);
      throw new Error('Failed to create system message');
    }
  }

  async updateMessage(key: string, data: UpdateSystemMessageData): Promise<SystemMessage> {
    try {
      return await prisma.systemMessage.update({
        where: { key },
        data
      });
    } catch (error) {
      console.error(`Error updating system message with key ${key}:`, error);
      throw new Error(`Failed to update system message with key ${key}`);
    }
  }

  async deleteMessage(key: string): Promise<void> {
    try {
      await prisma.systemMessage.delete({
        where: { key }
      });
    } catch (error) {
      console.error(`Error deleting system message with key ${key}:`, error);
      throw new Error(`Failed to delete system message with key ${key}`);
    }
  }

  async toggleMessageActive(key: string): Promise<SystemMessage> {
    try {
      const message = await prisma.systemMessage.findUnique({
        where: { key }
      });

      if (!message) {
        throw new Error(`System message with key ${key} not found`);
      }

      return await prisma.systemMessage.update({
        where: { key },
        data: { isActive: !message.isActive }
      });
    } catch (error) {
      console.error(`Error toggling system message active state for key ${key}:`, error);
      throw new Error(`Failed to toggle system message active state for key ${key}`);
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const categories = await prisma.systemMessage.findMany({
        select: { category: true },
        distinct: ['category']
      });
      return categories.map(c => c.category).sort();
    } catch (error) {
      console.error('Error fetching system message categories:', error);
      throw new Error('Failed to fetch system message categories');
    }
  }

  // Helper method to get multiple messages by keys
  async getMessagesByKeys(keys: string[]): Promise<Record<string, string>> {
    try {
      const messages = await prisma.systemMessage.findMany({
        where: {
          key: { in: keys },
          isActive: true
        },
        select: { key: true, content: true }
      });

      const result: Record<string, string> = {};
      messages.forEach(message => {
        result[message.key] = message.content;
      });

      return result;
    } catch (error) {
      console.error('Error fetching system messages by keys:', error);
      throw new Error('Failed to fetch system messages by keys');
    }
  }
} 