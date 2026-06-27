import React, { useState } from 'react';
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

// --- MOCK DATA ---
const mockSalesData = [
  { name: 'Mon', revenue: 4000000 },
  { name: 'Tue', revenue: 3500000 },
  { name: 'Wed', revenue: 5200000 },
  { name: 'Thu', revenue: 4800000 },
  { name: 'Fri', revenue: 6100000 },
  { name: 'Sat', revenue: 8500000 },
  { name: 'Sun', revenue: 7900000 },
];

const mockBestSellers = [
  { id: 1, name: 'Special Burger', qty: 145, revenue: 6525000, thumb: '/placeholder-food.png' },
  { id: 2, name: 'French Fries', qty: 210, revenue: 4200000, thumb: '/placeholder-food.png' },
  { id: 3, name: 'Iced Coffee', qty: 198, revenue: 3564000, thumb: '/placeholder-beverage.png' },
  { id: 4, name: 'Grilled Chicken', qty: 85, revenue: 2975000, thumb: '/placeholder-food.png' },
  { id: 5, name: 'Chocolate Cake', qty: 62, revenue: 1736000, thumb: '/placeholder-food.png' },
];

const mockMarketBasket = [
  { id: 1, pair: 'Special Burger + French Fries', timesBought: 120, confidence: '82%' },
  { id: 2, pair: 'Grilled Chicken + Iced Coffee', timesBought: 65, confidence: '76%' },
  { id: 3, pair: 'Chocolate Cake + Iced Coffee', timesBought: 45, confidence: '72%' },
];

// Generate Heatmap Data (7 Days x 24 Hours)
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => i);
const mockHeatmapData = days.map((day) => 
  hours.map((hour) => {
    // Generate some mock patterns (e.g., busier at lunch 12-14 and dinner 18-20)
    let intensity = Math.random() * 0.3; // Base low traffic
    if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 21)) {
      intensity = 0.4 + Math.random() * 0.6; // High traffic
    }
    // Make weekends generally busier
    if (day === 'Sat' || day === 'Sun') {
      intensity = Math.min(1, intensity + 0.2); 
    }
    return intensity;
  })
);

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
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        
        {/* Dashboard Header & Date Filter */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Manager Command Center</h1>
            <p className={styles.subtitle}>Real-time business intelligence</p>
          </div>
          
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
        </header>
        
        {/* KPI Grid (Now with 4 cards including Net Revenue) */}
        <div className={styles.kpiGrid}>
          <KPICard 
            title="Gross Revenue" 
            value="Rp 12.450.000" 
            trend="+14.5%" 
            trendUp={true} 
          />
          <KPICard 
            title="Net Revenue" 
            value="Rp 8.250.000" 
            trend="+12.3%" 
            trendUp={true} 
          />
          <KPICard 
            title="COGS" 
            value="Rp 4.200.000" 
            trend="-2.1%" 
            trendUp={false} 
          />
          <KPICard 
            title="Profit Margin" 
            value="66.2%" 
            trend="+5.2%" 
            trendUp={true} 
          />
        </div>
        
        <div className={styles.chartsGrid}>
          
          {/* Left Column: Trend & Heatmap */}
          <div className={styles.leftColumn}>
            
            {/* Revenue Trend Chart */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Revenue Trend ({dateRange})</h3>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockSalesData} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
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
              </div>
            </div>

            {/* Transaction Heatmap */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Transaction Heatmap</h3>
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
                    {mockHeatmapData.map((dayData, dayIdx) => (
                      <div key={dayIdx} className={styles.heatmapRow}>
                        {dayData.map((intensity, hourIdx) => (
                          <div 
                            key={`${dayIdx}-${hourIdx}`} 
                            className={styles.heatmapCell}
                            style={{ 
                              backgroundColor: `rgba(224, 120, 46, ${intensity})`,
                              border: '1px solid var(--color-border)'
                            }}
                            title={`${days[dayIdx]} ${hourIdx}:00 - Intensity: ${(intensity*100).toFixed(0)}%`}
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
            </div>
            
          </div>

          {/* Right Column: Best Sellers & Market Basket */}
          <div className={styles.rightColumn}>
            
            {/* Best Sellers List */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Best Sellers</h3>
              <div className={styles.bestSellersList}>
                {mockBestSellers.map((item) => (
                  <div key={item.id} className={styles.bestSellerItem}>
                    <img src={item.thumb} alt={item.name} className={styles.itemThumb} />
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemQty}>{item.qty} sold</div>
                    </div>
                    <div className={styles.itemRevenue}>
                      Rp {item.revenue.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Basket Analysis */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Frequently Bought Together</h3>
              <div className={styles.marketBasketList}>
                {mockMarketBasket.map((item) => (
                  <div key={item.id} className={styles.marketBasketItem}>
                    <div className={styles.basketPair}>{item.pair}</div>
                    <div className={styles.basketMetrics}>
                      <span className={styles.basketTimes}>{item.timesBought}x</span>
                      <span className={styles.basketConfidence}>{item.confidence}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
