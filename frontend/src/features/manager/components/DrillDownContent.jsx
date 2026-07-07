import React, { useState, useEffect } from 'react';
import api from '../../../core/api/axios';
import { formatCurrency } from '../../../utils/formatters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Table, Thead, Tbody, Tr, Th, Td, TableEmptyState } from '../../../components/ui/Table';
import styles from '../../../styles/manager/DrillDownContent.module.css';

export const DrillDownContent = ({ activeKpi, timeframeParam }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const size = 10; // For paginated tables

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = '';
        let params = { timeframe: timeframeParam };

        if (activeKpi === 'gross_revenue' || activeKpi === 'tax_collected' || activeKpi === 'net_revenue') {
          endpoint = '/manager/dashboard/kpis/transactions';
          params.page = page;
          params.size = size;
        } else if (activeKpi === 'cogs') {
          endpoint = '/manager/dashboard/kpis/cogs-breakdown';
          params.page = page;
          params.size = size;
        } else if (activeKpi === 'profit_margin_percent') {
          endpoint = '/manager/dashboard/kpis/margin-trend';
        } else if (activeKpi === 'average_ticket_size') {
          endpoint = '/manager/dashboard/kpis/ats-distribution';
        }

        if (!endpoint) return;

        const res = await api.get(endpoint, { params });
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch drill down data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeKpi, timeframeParam, page]);

  // Reset scroll position to top when page changes
  useEffect(() => {
    const modalBody = document.querySelector('div[class*="modalBody"]');
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
  }, [page, activeKpi]);

  // Reset page when timeframe or active kpi changes
  useEffect(() => {
    setPage(1);
  }, [activeKpi, timeframeParam]);

  if (loading && !data) {
    return <div className={styles.loading}>Loading data...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!data) return null;

  // Render Transaction Table
  if (activeKpi === 'gross_revenue' || activeKpi === 'tax_collected' || activeKpi === 'net_revenue') {
    return (
      <div className={styles.container}>
        <Table>
          <Thead>
            <Tr>
              <Th>Time</Th>
              <Th align="right" className={activeKpi === 'gross_revenue' ? styles.highlightedColumn : ''}>Gross Revenue</Th>
              <Th align="right" className={activeKpi === 'tax_collected' ? styles.highlightedColumn : ''}>Tax</Th>
              <Th align="right" className={activeKpi === 'net_revenue' ? styles.highlightedColumn : ''}>Net Revenue</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.items && data.items.length > 0 ? (
              data.items.map((item, idx) => (
                <Tr key={idx}>
                  <Td>{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</Td>
                  <Td align="right" className={activeKpi === 'gross_revenue' ? styles.highlightedColumn : ''}>
                    {formatCurrency(item.gross_revenue)}
                  </Td>
                  <Td align="right" className={activeKpi === 'tax_collected' ? styles.highlightedColumn : ''}>
                    {formatCurrency(item.tax)}
                  </Td>
                  <Td align="right" className={activeKpi === 'net_revenue' ? styles.highlightedColumn : ''}>
                    {formatCurrency(item.net_revenue)}
                  </Td>
                </Tr>
              ))
            ) : (
              <TableEmptyState colSpan={4} description="No transactions found for this period." />
            )}
          </Tbody>
        </Table>

        {data.total > 0 && data.size > 0 && Math.ceil(data.total / data.size) > 1 && (
          <div className={styles.paginationContainer}>
            <button 
              className={styles.pageButton} 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>Page {page} of {Math.ceil(data.total / data.size)}</span>
            <button 
              className={styles.pageButton} 
              disabled={page === Math.ceil(data.total / data.size)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render COGS Breakdown Table
  if (activeKpi === 'cogs') {
    return (
      <div className={styles.container}>
        <Table>
          <Thead>
            <Tr>
              <Th>Item Name</Th>
              <Th align="right">Total COGS</Th>
              <Th>Share of Total</Th>
              <Th align="right">Food Cost %</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.items && data.items.length > 0 ? (
              data.items.map((item, idx) => (
                <Tr key={item.menu_item_id || idx}>
                  <Td>{item.menu_item_name}</Td>
                  <Td align="right">{formatCurrency(item.total_cogs)}</Td>
                  <Td>
                    <div>{item.percentage_of_total_cogs.toFixed(1)}%</div>
                    <div className={styles.progressBarBackground}>
                      <div 
                        className={styles.progressBarFill} 
                        style={{ width: `${Math.min(100, item.percentage_of_total_cogs)}%` }}
                      ></div>
                    </div>
                  </Td>
                  <Td align="right">{item.food_cost_percentage.toFixed(1)}%</Td>
                </Tr>
              ))
            ) : (
              <TableEmptyState colSpan={4} description="No COGS data found for this period." />
            )}
          </Tbody>
        </Table>

        {data.total > 0 && data.size > 0 && Math.ceil(data.total / data.size) > 1 && (
          <div className={styles.paginationContainer}>
            <button 
              className={styles.pageButton} 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>Page {page} of {Math.ceil(data.total / data.size)}</span>
            <button 
              className={styles.pageButton} 
              disabled={page === Math.ceil(data.total / data.size)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render Margin Trend Chart
  if (activeKpi === 'profit_margin_percent') {
    const formattedData = data.map(d => {
      const dateObj = new Date(d.date.replace(' ', 'T'));
      let formattedName = '';
      if (timeframeParam === 'today' || timeframeParam === 'yesterday') {
         formattedName = `${dateObj.getHours().toString().padStart(2, '0')}:00`;
      } else if (timeframeParam === 'last_7_days') {
         formattedName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
         formattedName = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      }
      return {
        name: formattedName,
        margin: d.profit_margin_percent
      };
    });

    return (
      <div className={styles.container}>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="var(--color-text-secondary)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <RechartsTooltip 
                formatter={(value) => [`${value.toFixed(1)}%`, 'Profit Margin']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Line type="monotone" dataKey="margin" stroke="var(--color-brand, #E0782E)" strokeWidth={3} dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Render ATS Distribution Chart
  if (activeKpi === 'average_ticket_size') {
    return (
      <div className={styles.container}>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="bucket" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="var(--color-text-secondary)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip 
                formatter={(value) => [value, 'Orders']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="order_count" fill="var(--color-brand, #E0782E)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return null;
};
