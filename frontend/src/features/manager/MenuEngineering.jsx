import React, { useState, useEffect } from 'react';
import api from '../../core/api/axios';
import styles from '../../styles/manager/ManagerDashboard.module.css'; // Reusing for consistent styling
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';

export const MenuEngineering = () => {
  const [dateRange, setDateRange] = useState(
    localStorage.getItem('managerMenuTimeframe') || 'Last 30 Days'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('managerMenuTimeframe', dateRange);
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const timeframeMap = {
        'Today': 'today',
        'Yesterday': 'yesterday',
        'Last 7 Days': 'last_7_days',
        'Last 30 Days': 'last_30_days',
        'This Month': 'this_month'
      };
      const timeframeParam = timeframeMap[dateRange] || 'last_30_days';
      
      const res = await api.get('/manager/analytics/menu-engineering', {
        params: { timeframe: timeframeParam }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (loading && !data) {
    return <div className={styles.loadingWrapper} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading Menu Engineering Data...</div>;
  }

  // Handle Insufficient Data full-page warning
  if (data?.insufficient_data) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardContent}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Menu Engineering Matrix</h1>
              <p className={styles.subtitle}>Analyze item profitability vs popularity</p>
            </div>
            
            <div className={styles.headerActions}>
              <button className={styles.refreshBtn} onClick={fetchData}>
                {loading ? <span className={styles.spinner}></span> : 'Refresh'}
              </button>
              
              <div className={styles.dateFilterContainer} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <div className={styles.customSelect}>
                  <span className={styles.selectedValue}>{dateRange}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.chevron}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {isDropdownOpen && (
                  <ul className={styles.dropdownList}>
                    {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Last 30 Days'].map(range => (
                      <li
                        key={range}
                        className={`${styles.dropdownItem} ${dateRange === range ? styles.selected : ''}`}
                        onClick={() => { setDateRange(range); setIsDropdownOpen(false); }}
                      >
                        {range}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </header>
          
          <div className={styles.chartCard} style={{ padding: '2rem', margin: '0 auto', maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ 
                backgroundColor: 'rgba(225, 111, 45, 0.1)', 
                color: 'var(--color-brand, #e16f2d)', 
                padding: '12px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>Insufficient Data</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                  Menu Engineering requires a minimum of 50 completed orders in the selected period to provide statistically significant classifications.
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Progress to 50 orders</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand, #e16f2d)' }}>{data.total_orders} / 50</span>
                </div>
                
                <div style={{ width: '100%', backgroundColor: 'var(--color-border)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    backgroundColor: 'var(--color-brand, #e16f2d)', 
                    width: `${Math.min(100, (data.total_orders / 50) * 100)}%`,
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // We only plot items that have >= 5 units sold
  const plottedItems = data?.items.filter(i => i.category !== "Insufficient Data") || [];
  const tableItems = data?.items || [];

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Star': return '#10b981'; // Green
      case 'Plowhorse': return '#f59e0b'; // Orange
      case 'Puzzle': return '#3b82f6'; // Blue
      case 'Dog': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray (Insufficient)
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', padding: '10px', borderRadius: '8px' }}>
          <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.menu_item_name}</p>
          <p style={{ color: getCategoryColor(p.category), fontWeight: 500 }}>{p.category}</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Units Sold: {p.units_sold}</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Avg Margin: Rp {p.avg_contribution_margin_per_unit.toLocaleString('id-ID')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Menu Engineering Matrix</h1>
            <p className={styles.subtitle}>Analyze item profitability vs popularity</p>
          </div>
          
          <div className={styles.headerActions}>
            <button className={styles.refreshBtn} onClick={fetchData}>
              {loading ? <span className={styles.spinner}></span> : 'Refresh'}
            </button>
            
            <div className={styles.dateFilterContainer} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div className={styles.customSelect}>
                <span className={styles.selectedValue}>{dateRange}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.chevron}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {isDropdownOpen && (
                <ul className={styles.dropdownList}>
                  {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Last 30 Days'].map(range => (
                    <li
                      key={range}
                      className={`${styles.dropdownItem} ${dateRange === range ? styles.selected : ''}`}
                      onClick={() => { setDateRange(range); setIsDropdownOpen(false); }}
                    >
                      {range}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gap: '24px', marginTop: '24px' }}>
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Matrix Scatter Plot</h3>
          <div style={{ height: '500px', width: '100%', marginTop: '20px' }}>
            {plottedItems.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                No items have reached the 5 unit threshold to be plotted.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    type="number" 
                    dataKey="units_sold" 
                    name="Volume" 
                    stroke="var(--color-text-tertiary)"
                    label={{ value: 'Units Sold (Volume)', position: 'insideBottom', offset: -10, fill: 'var(--color-text-secondary)' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="avg_contribution_margin_per_unit" 
                    name="Margin" 
                    stroke="var(--color-text-tertiary)"
                    label={{ value: 'Avg Margin (Rp)', angle: -90, position: 'insideLeft', fill: 'var(--color-text-secondary)' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <ReferenceLine x={data.average_volume} stroke="var(--color-text-secondary)" strokeDasharray="3 3" label={{ position: 'top', value: 'Avg Vol', fill: 'var(--color-text-tertiary)' }} />
                  <ReferenceLine y={data.average_margin} stroke="var(--color-text-secondary)" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg Margin', fill: 'var(--color-text-tertiary)' }} />
                  <Scatter name="Menu Items" data={plottedItems}>
                    {plottedItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Item Breakdown</h3>
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>Item Name</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>Category</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Units Sold</th>
                  <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Avg Margin</th>
                </tr>
              </thead>
              <tbody>
                {tableItems.map(item => (
                  <tr key={item.menu_item_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 8px', color: 'var(--color-text-primary)' }}>{item.menu_item_name}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ 
                        color: getCategoryColor(item.category),
                        backgroundColor: `${getCategoryColor(item.category)}15`,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-text-primary)', textAlign: 'right' }}>{item.units_sold}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-text-primary)', textAlign: 'right' }}>
                      Rp {item.avg_contribution_margin_per_unit.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
