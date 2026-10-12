// Audit Log Controller
const prisma = require('../utils/prisma');

/**
 * GET /api/admin/audit — View audit log (admin only)
 */
const getAuditLog = async (req, res, next) => {
  try {
    const { entity, page = 1, limit = 50 } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entity && { entity }),
      },
      include: {
        admin: { select: { id: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const total = await prisma.auditLog.count({
      where: { ...(entity && { entity }) }
    });

    res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLog };
