import { Router } from 'express';
import { prisma } from '../db';
import { requireUser, type AuthedRequest } from '../auth/jwt';

export const expeditionRouter = Router();
expeditionRouter.use(requireUser);

expeditionRouter.get('/', async (req: AuthedRequest, res) => {
  const [chapters, milestones, missions, announcements, userMissions] = await Promise.all([
    prisma.chapter.findMany({ orderBy: { order: 'asc' } }),
    prisma.milestone.findMany({ orderBy: { order: 'asc' } }),
    prisma.mission.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.announcement.findMany({ where: { active: true }, orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] }),
    prisma.userMission.findMany({ where: { userId: req.user!.uid } }),
  ]);

  const msByKey = new Map(milestones.map((m) => [m.key, m]));
  const umByMission = new Map(userMissions.map((um) => [um.missionId, um]));

  // Resolve chapter lock status against milestone progress
  const resolvedChapters = chapters.map((c) => {
    let unlocked = c.status !== 'locked';
    if (c.unlockType === 'milestone' && c.milestoneKey) {
      const ms = msByKey.get(c.milestoneKey);
      if (ms && ms.reachedAt) unlocked = true;
    }
    return {
      key: c.key,
      order: c.order,
      title: c.title,
      subtitle: c.subtitle,
      body: c.body,
      imageKey: c.imageKey,
      status: unlocked ? (c.status === 'completed' ? 'completed' : 'active') : 'locked',
      unlockType: c.unlockType,
      milestoneKey: c.milestoneKey,
    };
  });

  res.json({
    chapters: resolvedChapters,
    milestones: milestones.map((m) => ({
      key: m.key,
      title: m.title,
      description: m.description,
      current: m.current,
      target: m.target,
      unit: m.unit,
      reached: !!m.reachedAt,
      progress: m.target > 0 ? Math.min(1, m.current / m.target) : 0,
    })),
    missions: missions.map((m) => {
      const um = umByMission.get(m.id);
      return {
        key: m.key,
        title: m.title,
        description: m.description,
        type: m.type,
        target: m.target,
        reward: m.reward,
        progress: um?.progress ?? 0,
        completed: um?.completed ?? false,
        claimed: um?.claimed ?? false,
      };
    }),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      pinned: a.pinned,
      createdAt: a.createdAt,
    })),
  });
});
