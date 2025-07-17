import { BaseService } from './BaseService';

export class LeaderboardService extends BaseService {
  async getTopUsers(limit: number = 10) {
    try {
      const topUsers = await this.prisma.leaderboardEntry.findMany({
        take: limit,
        orderBy: {
          totalPoints: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Update ranks
      const updatedEntries = await Promise.all(
        topUsers.map(async (entry, index) => {
          const rank = index + 1;
          await this.prisma.leaderboardEntry.update({
            where: { userId: entry.userId },
            data: { rank },
          });
          return { ...entry, rank };
        })
      );

      return updatedEntries;
    } catch (error) {
      console.error('Error fetching top users:', error);
      throw new Error('Failed to fetch top users');
    }
  }

  async getUserRank(userId: string) {
    try {
      const userEntry = await this.prisma.leaderboardEntry.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!userEntry) {
        return null;
      }

      return userEntry;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      throw new Error('Failed to fetch user rank');
    }
  }

  async getUsersAroundMe(userId: string, radius: number = 5) {
    try {
      const userEntry = await this.prisma.leaderboardEntry.findUnique({
        where: { userId },
      });

      if (!userEntry) {
        return null;
      }

      const aroundMe = await this.prisma.leaderboardEntry.findMany({
        where: {
          totalPoints: {
            gte: userEntry.totalPoints - (radius * 10),
            lte: userEntry.totalPoints + (radius * 10),
          },
        },
        orderBy: {
          totalPoints: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        take: radius * 2,
      });

      return aroundMe;
    } catch (error) {
      console.error('Error fetching users around me:', error);
      throw new Error('Failed to fetch users around me');
    }
  }

  async getLeaderboardStats() {
    try {
      const totalUsers = await this.prisma.leaderboardEntry.count();
      const avgPoints = await this.prisma.leaderboardEntry.aggregate({
        _avg: {
          totalPoints: true,
        },
      });
      const maxPoints = await this.prisma.leaderboardEntry.aggregate({
        _max: {
          totalPoints: true,
        },
      });

      return {
        totalUsers,
        averagePoints: Math.round(avgPoints._avg.totalPoints || 0),
        maxPoints: maxPoints._max.totalPoints || 0,
      };
    } catch (error) {
      console.error('Error fetching leaderboard stats:', error);
      throw new Error('Failed to fetch leaderboard stats');
    }
  }

  async awardPoints(userId: string, action: string, points: number): Promise<void> {
    try {
      const existingEntry = await this.prisma.leaderboardEntry.findUnique({
        where: { userId },
      });

      if (existingEntry) {
        await this.prisma.leaderboardEntry.update({
          where: { userId },
          data: {
            totalPoints: {
              increment: points,
            },
            lastUpdated: new Date(),
          },
        });
      } else {
        await this.prisma.leaderboardEntry.create({
          data: {
            userId,
            totalPoints: points,
            lastUpdated: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      throw new Error('Failed to award points');
    }
  }

  async getPointHistory(userId: string, daysBack: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // This would require a separate point_history table
      // For now, return basic info
      const userEntry = await this.prisma.leaderboardEntry.findUnique({
        where: { userId },
      });

      return {
        currentPoints: userEntry?.totalPoints || 0,
        lastUpdated: userEntry?.lastUpdated,
        message: 'Point history tracking will be implemented with a dedicated table',
      };
    } catch (error) {
      console.error('Error fetching point history:', error);
      throw new Error('Failed to fetch point history');
    }
  }
} 