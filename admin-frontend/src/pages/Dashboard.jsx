import React, { useState, useEffect } from 'react';
import { dashboardAPI, activityAPI } from '../services/api';
import { search, unassignedLeads, assignedLeads, activeSales, conversionRate } from '../assets/index.js';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format relative time
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [activeSales, setActiveSales] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 10 seconds for real-time status updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsData, graphResponse, salesData, activitiesData] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getSalesGraph(),
        dashboardAPI.getActiveSales(),
        activityAPI.getRecent()
      ]);

      setMetrics(metricsData);
      setGraphData(graphResponse);
      setActiveSales(salesData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  const filteredSales = activeSales.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Custom plugin for dashed grid lines
  const dashedGridPlugin = {
    id: 'dashedGridLines',
    beforeDatasetsDraw: (chart) => {
      const { ctx, chartArea, scales } = chart;
      const yScale = scales.y;

      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;

      yScale.ticks.forEach((tick, index) => {
        const y = yScale.getPixelForValue(tick.value);
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
      });

      ctx.restore();
    }
  };

  // Chart.js configuration
  const chartData = {
    labels: graphData.map(d => d.day),
    datasets: [
      {
        label: 'Conversion Rate %',
        data: graphData.map(d => d.rate),
        backgroundColor: '#C0C0C0',
        hoverBackgroundColor: '#2563EB',
        borderRadius: {
          topRight: 50,
          topLeft: 50,
          bottomRight: 0,
          bottomLeft: 0
        },
        borderSkipped: false,
        barThickness: 12,
        maxBarThickness: 14
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1A1A1A',
        titleFont: { size: 12 },
        bodyFont: { size: 14, weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y}%`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666', font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        border: {
          dash: [5, 5],
          display: false
        },
        grid: {
          color: '#E0E0E0',
          tickBorderDash: [5, 5]
        },
        ticks: {
          color: '#666',
          font: { size: 11 },
          stepSize: 10,
          callback: (value) => `${value}%`
        }
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="search-section">
        <div className="search-box">
          <img src={search} alt="Search" />
          <input
            type="text"
            placeholder="Search here..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="breadcrumb">
        <span>Home</span> &gt; <span>Dashboard</span>
      </div>

      <div className="dashboard-content">
        <div className="metrics-cards">
          <div className="metrics-left">
            <div className="metric-card">
              <div className="metric-icon">
                <img src={unassignedLeads} alt="Unassigned Leads" />
              </div>
              <div className="metric-info">
                <div className="metric-label">Unassigned Leads</div>
                <div className="metric-value">{metrics?.unassignedLeads || 0}</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <img src={assignedLeads} alt="Assigned This Week" />
              </div>
              <div className="metric-info">
                <div className="metric-label">Assigned This Week</div>
                <div className="metric-value">{metrics?.assignedThisWeek || 0}</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <img src={activeSales} alt="Active Salespeople" />
              </div>
              <div className="metric-info">
                <div className="metric-label">Active Salespeople</div>
                <div className="metric-value">{metrics?.activeSalesPeople || 0}</div>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <img src={conversionRate} alt="Conversion Rate" />
            </div>
            <div className="metric-info">
              <div className="metric-label">Conversion Rate</div>
              <div className="metric-value">{metrics?.conversionRate || 0}%</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="sales-graph-section">
            <h3>Sale Analytics</h3>
            <div className="graph-container">
              <Bar data={chartData} options={chartOptions} plugins={[dashedGridPlugin]} />
            </div>
          </div>

          <div className="recent-activity-section">
            <h3>Recent Activity Feed</h3>
            <div className="activity-list">
              {activities.slice(0, 4).map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-bullet"></div>
                  <div className="activity-content">
                    <div className="activity-text">{activity.description}</div>
                    <div className="activity-time">– {formatTimeAgo(activity.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="active-sales-section">
          {/* <h3>Active Sales People</h3> */}
          <div className="sales-table-container">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Assigned Leads</th>
                  <th>Closed Leads</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</div>
                        <div>
                          <div className="user-name">{user.firstName} {user.lastName}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="employee-id-cell">{user.employeeId}</td>
                    <td>{user.assignedLeads || 0}</td>
                    <td>{user.closedLeads || 0}</td>
                    <td>
                      <span className={`status-badge ${(user.timingStatus || 'Not Checked In').toLowerCase().replace(/ /g, '-')}`}>
                        <span className="status-dot"></span>
                        {user.timingStatus || 'Not Checked In'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
