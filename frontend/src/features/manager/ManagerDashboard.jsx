import React, { useState, useEffect } from 'react';
import api from '../../core/api/axios';
// useAuthStore is not used anymore here since username and logout are in Layout
import { KPICard } from './KPICard';
import styles from '../../styles/manager/ManagerDashboard.module.css';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => i);

// --- ICONS ---

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export const ManagerDashboard = () => {
  const [dateRange, setDateRange] = useState(() => {
    return localStorage.getItem('managerDashboardTimeframe') || 'Last 7 Days';
  });

  useEffect(() => {
    localStorage.setItem('managerDashboardTimeframe', dateRange);
  }, [dateRange]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [kpiData, setKpiData] = useState(null);
  
  // Analytics States
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [marketBasket, setMarketBasket] = useState([]);
  const [orderVelocity, setOrderVelocity] = useState([]);
  const [heatmapGrid, setHeatmapGrid] = useState(
    Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ intensity: 0, count: 0 })))
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const timeframeMap = {
        'Today': 'today',
        'Yesterday': 'yesterday',
        'Last 7 Days': 'last_7_days',
        'Last 30 Days': 'last_30_days',
        'This Month': 'this_month'
      };
      const timeframeParam = timeframeMap[dateRange] || 'last_7_days';
      const params = { timeframe: timeframeParam };

      const [
        kpiRes, 
        revRes, 
        bestRes, 
        heatRes, 
        basketRes,
        velocityRes
      ] = await Promise.all([
        api.get('/manager/dashboard/kpis', { params }),
        api.get('/manager/analytics/revenue-trend', { params }),
        api.get('/manager/analytics/best-sellers', { params }),
        api.get('/manager/analytics/heatmap-data', { params }),
        api.get('/manager/analytics/basket-analysis', { params }),
        api.get('/manager/analytics/order-velocity', { params })
      ]);
      
      setKpiData(kpiRes.data);
      setOrderVelocity(velocityRes.data.map(d => {
         const dateObj = new Date(d.date.replace(' ', 'T'));
         let formattedName = '';
         
         if (dateRange === 'Today' || dateRange === 'Yesterday') {
            formattedName = `${dateObj.getHours().toString().padStart(2, '0')}:00`;
         } else if (dateRange === 'Last 7 Days') {
            formattedName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
         } else {
            formattedName = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
         }
         
         return {
            name: formattedName,
            orders: d.orders
         };
      }));
      
      // Transform Revenue Trend
      setRevenueTrend(revRes.data.map(d => {
         const dateObj = new Date(d.date.replace(' ', 'T')); // Handle "YYYY-MM-DD HH:mm:ss" cross-browser
         let formattedName = '';
         
         if (dateRange === 'Today' || dateRange === 'Yesterday') {
            formattedName = `${dateObj.getHours().toString().padStart(2, '0')}:00`;
         } else if (dateRange === 'Last 7 Days') {
            formattedName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
         } else {
            formattedName = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
         }
         
         return {
            name: formattedName,
            revenue: d.revenue
         };
      }));
      
      // Transform Best Sellers
      setBestSellers(bestRes.data.map((b, idx) => ({
         id: idx,
         name: b.menu_item_name,
         qty: b.total_sold,
         revenue: 0, // Could fetch actual revenue from backend if needed
         thumb: '/placeholder-food.png'
      })));
      
      // Transform Market Basket
      setMarketBasket(basketRes.data.map((b, idx) => ({
         id: idx,
         pair: `${b.item1_name} + ${b.item2_name}`,
         timesBought: b.frequency,
         confidence: b.confidence !== null && b.confidence !== undefined ? `${b.confidence}%` : null
      })));
      
      // Transform Heatmap Grid
      const newGrid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ intensity: 0, count: 0 })));
      let maxCount = 1;
      heatRes.data.forEach(item => {
         if (item.transaction_count > maxCount) maxCount = item.transaction_count;
      });
      
      heatRes.data.forEach(item => {
         const mappedDay = (item.day_of_week + 6) % 7;
         const mappedHour = item.hour_of_day;
         
         let opacity = 0;
         if (item.transaction_count > 0) {
            const ratio = item.transaction_count / maxCount;
            if (ratio <= 0.25) opacity = 0.3;
            else if (ratio <= 0.50) opacity = 0.5;
            else if (ratio <= 0.75) opacity = 0.75;
            else opacity = 1.0;
         }

         newGrid[mappedDay][mappedHour] = {
           intensity: opacity,
           count: item.transaction_count
         };
      });
      
      setHeatmapGrid(newGrid);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  console.log("Heatmap data from API:", heatmapGrid);

  const totalHeatmapTransactions = heatmapGrid.reduce((sum, day) => sum + day.reduce((hSum, cell) => hSum + cell.count, 0), 0);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        
        {/* Dashboard Header & Date Filter */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Manager Command Center</h1>
            <p className={styles.subtitle}>Real-time business intelligence</p>
          </div>
          
          {/* Header Actions */}
          <div className={styles.headerActions}>
            <button 
              className={styles.refreshBtn} 
              onClick={fetchDashboardData} 
              disabled={isRefreshing}
            >
              {isRefreshing ? <span className={styles.spinner}></span> : 'Refresh'}
            </button>

            {/* Date Filter Dropdown */}
            <div className={styles.dateFilterContainer} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <CalendarIcon />
            <div className={styles.customSelect}>
              <span className={styles.selectedValue}>{dateRange}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.chevron}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            {isDropdownOpen && (
              <ul className={styles.dropdownList}>
                {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month'].map(option => (
                  <li 
                    key={option} 
                    className={`${styles.dropdownItem} ${dateRange === option ? styles.selected : ''}`}
                    onClick={() => { setDateRange(option); setIsDropdownOpen(false); }}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
            </div>
          </div>
        </header>
        
        
        <div className={styles.chartsGrid}>
          
          {/* Left Column: Trend & Heatmap */}
          <div className={styles.leftColumn}>
            
            {/* KPI Grid */}
            <div className={styles.kpiGrid}>
              <KPICard 
                title="Avg Ticket Size" 
                value={kpiData ? `Rp ${kpiData.average_ticket_size.toLocaleString('id-ID')}` : "Loading..."} 
                infoTooltip="Calculated Pre-Tax"
              />
              <KPICard 
                title="Gross Revenue" 
                value={kpiData ? `Rp ${kpiData.gross_revenue.toLocaleString('id-ID')}` : "Loading..."} 
              />
              <KPICard 
                title="Tax Collected" 
                value={kpiData ? `Rp ${kpiData.tax_collected.toLocaleString('id-ID')}` : "Loading..."} 
              />
              <KPICard 
                title="Net Revenue" 
                value={kpiData ? `Rp ${kpiData.net_revenue.toLocaleString('id-ID')}` : "Loading..."} 
              />
              <KPICard 
                title="COGS" 
                value={kpiData ? `Rp ${kpiData.cogs.toLocaleString('id-ID')}` : "Loading..."} 
              />
              <KPICard 
                title="Profit Margin" 
                value={kpiData ? `${kpiData.profit_margin_percent.toFixed(1)}%` : "Loading..."} 
              />
            </div>
            
            {/* Revenue Trend Chart */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Revenue Trend ({dateRange})</h3>
              <div className={styles.chartWrapper}>
                {revenueTrend.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg className={styles.emptyStateIcon} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Not enough data yet — check back after a few more days of sales.
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--color-text-tertiary)" tick={{ fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                    <YAxis width={80} stroke="var(--color-text-tertiary)" tick={{ fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-primary)' }} formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
            {/* Order Volume Velocity Chart */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Order Volume Velocity ({dateRange})</h3>
              <div className={styles.chartWrapper}>
                {orderVelocity.length === 0 ? (
                  <div className={styles.emptyState}>
                    Loading...
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orderVelocity} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--color-text-tertiary)" tick={{ fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                    <YAxis width={40} stroke="var(--color-text-tertiary)" tick={{ fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} itemStyle={{ color: 'var(--color-primary)' }} formatter={(value) => [`${value} Orders`, 'Order Volume']} />
                    <Area type="monotone" dataKey="orders" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorVelocity)" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Transaction Heatmap */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Transaction Heatmap</h3>
              {totalHeatmapTransactions < 5 ? (
                <div className={styles.emptyState} style={{ height: '250px' }}>
                  <svg className={styles.emptyStateIcon} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Activity is currently too low to generate a meaningful heat map.
                </div>
              ) : (
              <div className={styles.heatmapContainer}>
                
                {/* Heatmap Y-Axis (Days) */}
                <div className={styles.heatmapYAxis}>
                  {days.map((day) => (
                    <div key={day} className={styles.heatmapLabelY}>{day}</div>
                  ))}
                </div>

                <div className={styles.heatmapContent}>
                  {/* Heatmap Grid */}
                  <div className={styles.heatmapGrid}>
                    {heatmapGrid.map((dayData, dayIdx) => (
                      <div key={dayIdx} className={styles.heatmapRow}>
                        {dayData.map((cell, hourIdx) => (
                          <div 
                            key={`${dayIdx}-${hourIdx}`} 
                            className={styles.heatmapCell}
                            style={{ 
                              backgroundColor: `rgba(224, 120, 46, ${cell.intensity})`,
                              border: '1px solid var(--color-border)'
                            }}
                            title={`${days[dayIdx]} ${hourIdx}:00 - ${cell.count} transactions`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap X-Axis (Hours) */}
                  <div className={styles.heatmapXAxis}>
                    {hours.filter(h => h % 3 === 0).map(h => (
                      <div key={h} className={styles.heatmapLabelX} style={{ gridColumn: `${h + 1} / span 3`}}>
                        {h}:00
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              )}
            </div>
            
          </div>

          {/* Right Column: Best Sellers & Market Basket */}
          <div className={styles.rightColumn}>
            
            {/* Best Sellers List */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Best Sellers</h3>
              <div className={styles.bestSellersList}>
                {bestSellers.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No data available</div>
                ) : (
                  bestSellers.map((item) => (
                    <div key={item.id} className={styles.bestSellerItem}>
                      <img src={item.thumb} alt={item.name} className={styles.itemThumb} />
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemQty}>{item.qty} sold</div>
                      </div>
                      {item.revenue > 0 && (
                        <div className={styles.itemRevenue}>
                          Rp {item.revenue.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Market Basket Analysis */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Frequently Bought Together</h3>
              <div className={styles.marketBasketList}>
                {marketBasket.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No data available</div>
                ) : (
                  marketBasket.map((item) => (
                    <div key={item.id} className={styles.marketBasketItem}>
                      <div className={styles.basketPair}>{item.pair}</div>
                      <div className={styles.basketMetrics}>
                        <span className={styles.basketTimes}>{item.timesBought}x</span>
                        {item.confidence && <span className={styles.basketConfidence}>{item.confidence}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
