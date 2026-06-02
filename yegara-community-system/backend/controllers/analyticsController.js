const Report = require('../models/Report');
const User = require('../models/User');
const Event = require('../models/Event');
const Resource = require('../models/Resource');
const Analytics = require('../models/Analytics');
const { buildWoredaRegex } = require('../utils/woreda');

const REPORT_FILTER_YEARS = [2026, 2027, 2028, 2029, 2030];

const getYearDateRange = (year) => {
  const y = Number(year);
  if (!REPORT_FILTER_YEARS.includes(y)) {
    return null;
  }
  return {
    start: new Date(y, 0, 1, 0, 0, 0, 0),
    end: new Date(y, 11, 31, 23, 59, 59, 999)
  };
};

// Helper function to get date range (relative periods when no year is set)
const getDateRange = (period) => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'daily':
      start.setDate(end.getDate() - 1);
      break;
    case 'weekly':
      start.setDate(end.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'yearly':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
  }

  return { start, end };
};

// @desc    Get system analytics
// @route   GET /api/analytics
// @access  Private (Sub-City Admin)
exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly', woreda, year } = req.query;

    let dateRange;
    let filterYear = null;

    if (year) {
      dateRange = getYearDateRange(year);
      if (!dateRange) {
        return res.status(400).json({
          success: false,
          message: `Invalid year. Allowed years: ${REPORT_FILTER_YEARS.join(', ')}`
        });
      }
      filterYear = Number(year);
    } else {
      dateRange = getDateRange(period);
    }
    
    // Build match conditions
    const matchConditions = {
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    };
    
    if (woreda && woreda !== 'all') {
      const woredaRegex = buildWoredaRegex(woreda);
      matchConditions.woreda = woredaRegex ? { $regex: woredaRegex } : woreda;
    }
    
    // Execute all queries in parallel
    const [
      totalReports,
      reportsByStatus,
      reportsByCategory,
      reportsByMonth,
      userStats,
      woredaPerformance,
      departmentPerformance,
      recentReports,
      systemHealth
    ] = await Promise.all([
      // Total reports
      Report.countDocuments(matchConditions),
      
      // Reports by status
      Report.aggregate([
        { $match: matchConditions },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      
      // Reports by category
      Report.aggregate([
        { $match: matchConditions },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]),
      
      // Reports trend by month
      Report.aggregate([
        { $match: matchConditions },
        { $group: {
          _id: { $month: "$createdAt" },
          reports: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } }
        }},
        { $sort: { "_id": 1 } }
      ]),
      
      // User statistics
      User.aggregate([
        { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
        { $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } }
        }}
      ]),
      
      // Woreda performance
      Report.aggregate([
        { $match: matchConditions },
        { $group: {
          _id: "$woreda",
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
          avgResolutionDays: {
            $avg: {
              $cond: [
                { $eq: ["$status", "Resolved"] },
                { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60 * 24] },
                null
              ]
            }
          }
        }},
        { $project: {
          _id: 0,
          woreda: "$_id",
          totalReports: "$total",
          resolvedReports: "$resolved",
          resolutionRate: { $multiply: [{ $divide: ["$resolved", "$total"] }, 100] },
          averageResolutionDays: { $round: ["$avgResolutionDays", 1] }
        }},
        { $sort: { totalReports: -1 } }
      ]),
      
      // Department performance
      Report.aggregate([
        { $match: matchConditions },
        { $group: {
          _id: "$department",
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } }
        }},
        { $project: {
          _id: 0,
          department: "$_id",
          totalReports: "$total",
          resolvedReports: "$resolved",
          pendingReports: "$pending",
          inProgressReports: "$inProgress",
          resolutionRate: { $multiply: [{ $divide: ["$resolved", "$total"] }, 100] }
        }},
        { $sort: { totalReports: -1 } }
      ]),
      
      // Recent reports
      Report.find(matchConditions)
        .populate('residentId', 'fullName')
        .sort('-createdAt')
        .limit(10)
        .lean(),
      
      // System health metrics
      Promise.resolve({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeConnections: 0 // Would track actual connections in production
      })
    ]);
    
    // Format monthly trend data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrendData = reportsByMonth.map(item => ({
      month: monthNames[item._id - 1],
      reports: item.reports,
      resolved: item.resolved
    }));
    
    // Calculate overall statistics
    const resolvedReports = reportsByStatus.find(s => s._id === 'Resolved')?.count || 0;
    const resolutionRate = totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0;
    
    // Get user counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      isActive: true,
      lastLogin: { $gte: dateRange.start }
    });
    
    // Save analytics to database
    const analyticsData = new Analytics({
      reportAnalytics: {
        totalReports,
        resolvedReports,
        pendingReports: reportsByStatus.find(s => s._id === 'Pending')?.count || 0,
        averageResolutionTime: 0, // Would calculate based on resolved reports
        categoryBreakdown: reportsByCategory.map(cat => ({
          category: cat._id,
          count: cat.count
        }))
      },
      userAnalytics: {
        totalUsers,
        activeUsers,
        roleDistribution: userStats.reduce((dist, role) => ({
          ...dist,
          [role._id + 's']: role.count
        }), {})
      },
      woredaPerformance,
      departmentPerformance,
      systemMetrics: {
        uptime: systemHealth.uptime,
        averageResponseTime: 0, // Would track in production
        storageUsage: 0 // Would calculate from uploads
      },
      period: filterYear ? 'yearly' : period,
      date: new Date()
    });
    
    await analyticsData.save();
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReports,
          resolvedReports,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          totalUsers,
          activeUsers,
          averageResolutionDays: 0
        },
        reportsByStatus,
        reportsByCategory,
        trendData: formattedTrendData,
        userStats,
        woredaPerformance,
        departmentPerformance,
        recentReports,
        filterYear,
        systemHealth: {
          ...systemHealth,
          resolutionRate: Math.round(resolutionRate * 100) / 100
        }
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    next(err);
  }
};

// @desc    Get real-time dashboard data
// @route   GET /api/analytics/realtime
// @access  Private (Sub-City Admin)
exports.getRealtimeData = async (req, res, next) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      reportsLastHour,
      reportsToday,
      activeUsersToday,
      activeUsers,
      pendingReports,
      recentActivities
    ] = await Promise.all([
      Report.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      Report.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ lastLogin: { $gte: today } }),
      User.countDocuments({ isActive: true }),
      Report.countDocuments({ status: 'Pending' }),
      Report.find()
        .populate('residentId', 'fullName')
        .sort('-createdAt')
        .limit(5)
        .lean()
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        reportsLastHour,
        reportsToday,
        activeUsersToday,
        activeUsers,
        pendingReports,
        uptime: process.uptime(),
        recentActivities,
        timestamp: new Date()
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export analytics data
// @route   GET /api/analytics/export
// @access  Private (Sub-City Admin)
exports.exportAnalytics = async (req, res, next) => {
  try {
    const { format = 'json', type = 'reports', startDate, endDate } = req.query;
    
    let data;
    let filename;
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    switch(type) {
      case 'reports':
        data = await Report.find(query)
          .populate('residentId', 'fullName email')
          .populate('assignedOfficer', 'fullName')
          .lean();
        filename = `reports_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'users':
        data = await User.find(query).lean();
        filename = `users_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'events':
        data = await Event.find(query).lean();
        filename = `events_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return next(new ErrorResponse('Invalid export type', 400));
    }
    
    if (format === 'csv') {
      // Convert to CSV (simplified - in production use a library like json2csv)
      const csv = convertToCSV(data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      return res.send(csv);
    }
    
    // Default to JSON
    res.status(200).json({
      success: true,
      data,
      filename: `${filename}.json`
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to convert to CSV
const convertToCSV = (data) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};