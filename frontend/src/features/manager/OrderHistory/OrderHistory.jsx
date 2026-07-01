import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../core/store/authStore';
import styles from '../../../styles/manager/OrderHistory.module.css';

export const OrderHistory = () => {
  const { token } = useAuthStore();
  const [data, setData] = useState({ items: [], total: 0, total_revenue: 0, page: 1, size: 20 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [page, setPage] = useState(1);
  const [orderType, setOrderType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: '20'
      });
      
      if (orderType) queryParams.append('order_type', orderType);
      if (dateFrom) queryParams.append('date_from', dateFrom);
      if (dateTo) queryParams.append('date_to', dateTo);

      const response = await fetch(`http://localhost:8000/manager/orders?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, orderType, dateFrom, dateTo]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1); // Reset to first page on filter change
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalPages = Math.ceil(data.total / data.size);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Order History</h1>
        
      <div className={styles.toolbar}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Order Type</label>
          <select 
            className={styles.select} 
            value={orderType} 
            onChange={handleFilterChange(setOrderType)}
          >
            <option value="">All Orders</option>
            <option value="Dine-In">Dine-In</option>
            <option value="Takeaway">Takeaway</option>
          </select>
        </div>
        
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>From</label>
          <input 
            type="date" 
            className={styles.dateInput}
            value={dateFrom}
            onChange={handleFilterChange(setDateFrom)}
          />
        </div>
        
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>To</label>
          <input 
            type="date" 
            className={styles.dateInput}
            value={dateTo}
            onChange={handleFilterChange(setDateTo)}
          />
        </div>
      </div>

      <div className={styles.summaryLine}>
        Showing {data.total} orders &middot; Total Revenue: {formatCurrency(data.total_revenue || 0)}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Order Type</th>
              <th>Cashier</th>
              <th>Payment</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className={styles.emptyState}>Loading orders...</td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.emptyState}>No orders found for this period.</td>
              </tr>
            ) : (
              data.items.map((order) => (
                <tr key={order.id}>
                  <td>{formatDate(order.timestamp)}</td>
                  <td>
                    <span className={styles.typeBadge}>{order.order_type}</span>
                    {order.order_type === 'Dine-In' && order.routing_number && (
                      <span className={styles.tableNumber}> &middot; Table {order.routing_number}</span>
                    )}
                  </td>
                  <td className={styles.cashierName}>{order.cashier_name || 'System / Unassigned'}</td>
                  <td>{order.payment_method}</td>
                  <td>{formatCurrency(order.total_amount)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${order.status === 'Completed' ? styles.statusCompleted : styles.statusVoided}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {data.total > data.size && (
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>
              Showing {((data.page - 1) * data.size) + 1} to {Math.min(data.page * data.size, data.total)} of {data.total} orders
            </div>
            <div className={styles.pageControls}>
              <button 
                className={styles.pageBtn}
                disabled={data.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button 
                className={styles.pageBtn}
                disabled={data.page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
