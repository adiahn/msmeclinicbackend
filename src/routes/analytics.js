const express = require('express');
const router = express.Router();
const Registration = require('../database/models/Registration');
const ContactMessage = require('../database/models/ContactMessage');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

// GET /api/analytics/registrations - Get registration statistics
router.get('/registrations',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Get total counts
    const totalRegistrations = await Registration.countDocuments();
    const confirmedRegistrations = await Registration.countDocuments({ status: 'confirmed' });
    const pendingRegistrations = await Registration.countDocuments({ status: 'pending' });
    const rejectedRegistrations = await Registration.countDocuments({ status: 'rejected' });

    // Get registrations by business type
    const registrationsByType = await Registration.aggregate([
      {
        $group: {
          _id: '$businessType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get registrations by years in business
    const registrationsByExperience = await Registration.aggregate([
      {
        $group: {
          _id: '$yearsInBusiness',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get registrations by availability
    const registrationsByAvailability = await Registration.aggregate([
      {
        $group: {
          _id: '$availability',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get registrations by preferred time
    const registrationsByPreferredTime = await Registration.aggregate([
      {
        $group: {
          _id: '$preferredTime',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get monthly registration trends (last 12 months)
    const monthlyTrends = await Registration.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get recent registrations (last 7 days)
    const recentRegistrations = await Registration.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Get contact messages statistics
    const totalContactMessages = await ContactMessage.countDocuments();
    const unreadContactMessages = await ContactMessage.countDocuments({ status: 'unread' });

    // Format the data
    const businessTypeData = {};
    registrationsByType.forEach(item => {
      businessTypeData[item._id] = item.count;
    });

    const experienceData = {};
    registrationsByExperience.forEach(item => {
      experienceData[item._id] = item.count;
    });

    const availabilityData = {};
    registrationsByAvailability.forEach(item => {
      availabilityData[item._id] = item.count;
    });

    const preferredTimeData = {};
    registrationsByPreferredTime.forEach(item => {
      preferredTimeData[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        totalRegistrations,
        confirmedRegistrations,
        pendingRegistrations,
        rejectedRegistrations,
        registrationsByType: businessTypeData,
        registrationsByExperience: experienceData,
        registrationsByAvailability: availabilityData,
        registrationsByPreferredTime: preferredTimeData,
        monthlyTrends: monthlyTrends.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.count
        })),
        recentRegistrations,
        contactMessages: {
          total: totalContactMessages,
          unread: unreadContactMessages
        }
      }
    });
  })
);

// GET /api/analytics/dashboard - Get dashboard summary
router.get('/dashboard',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Get today's registrations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRegistrations = await Registration.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get this week's registrations
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const thisWeekRegistrations = await Registration.countDocuments({
      createdAt: { $gte: weekStart }
    });

    // Get this month's registrations
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthRegistrations = await Registration.countDocuments({
      createdAt: { $gte: monthStart }
    });

    // Get status distribution
    const statusDistribution = await Registration.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top business types
    const topBusinessTypes = await Registration.aggregate([
      {
        $group: {
          _id: '$businessType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get recent activity (last 10 registrations)
    const recentActivity = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName businessName status createdAt registrationId')
      .lean();

    res.json({
      success: true,
      data: {
        summary: {
          today: todayRegistrations,
          thisWeek: thisWeekRegistrations,
          thisMonth: thisMonthRegistrations
        },
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topBusinessTypes: topBusinessTypes.map(item => ({
          type: item._id,
          count: item.count
        })),
        recentActivity
      }
    });
  })
);

module.exports = router;
