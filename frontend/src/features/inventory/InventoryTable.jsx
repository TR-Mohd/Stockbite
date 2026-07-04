import React, { useState, useMemo } from 'react';
import '../../styles/inventory/InventoryTable.css';
import { ROPAlertBadge } from './ROPAlertBadge';
import { Button } from '../../components/ui/Button';

// Utility to get status weight for sorting
const getStatusWeight = (stock, rop) => {
  if (stock === 0) return 1; // Out of Stock (highest priority)
  if (stock <= rop) return 2; // Low Stock
  return 3; // Normal
};

export const InventoryTable = ({ data, onDraftPO, onAdjustStock, onLogWaste }) => {
  // Sort data: Status (Out of Stock -> Low Stock -> Normal), then by Category
  const sortedData = [...data].sort((a, b) => {
    const weightA = getStatusWeight(a.stock, a.rop);
    const weightB = getStatusWeight(b.stock, b.rop);
    
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    
    // Fallback to sorting by category alphabetically
    return a.category.localeCompare(b.category);
  });

  return (
    <div className="inventory-table-container">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Category</th>
            <th className="text-right">Unit Cost</th>
            <th className="text-right" style={{ width: '120px' }}>Stock Level</th>
            <th>UoM</th>
            <th className="text-right">ROP</th>
            <th>Status</th>
            <th>Last Updated</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan="8">
                <div className="empty-state-container">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <h3>No ingredients found</h3>
                  <p>Try adjusting your search or filters to find what you're looking for.</p>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((item) => {
              const isLowStock = item.stock <= item.rop && item.stock > 0;
              const isOutOfStock = item.stock === 0;
              const isWarning = isLowStock || isOutOfStock;
              
              // Sparkline calculation
              const maxStock = Math.max(item.stock, item.rop * 2, 1);
              const stockPercentage = Math.min((item.stock / maxStock) * 100, 100);
              const ropPercentage = Math.min((item.rop / maxStock) * 100, 100);

              return (
                <tr key={item.id} className={isWarning ? 'row-warning' : ''}>
                  <td className="font-medium">{item.name}</td>
                  <td><span className="category-tag">{item.category}</span></td>
                  <td className="text-right font-medium">Rp {item.unitCost?.toLocaleString('id-ID') || 0}</td>
                  <td>
                    <div className="stock-level-cell">
                      <span className="stock-value">{item.stock}</span>
                      <div className="sparkline-container">
                        <div className={`sparkline-bar ${isOutOfStock ? 'empty' : isLowStock ? 'warning' : 'normal'}`} style={{ width: `${stockPercentage}%` }}></div>
                        <div className="sparkline-rop-marker" style={{ left: `${ropPercentage}%` }} title={`ROP: ${item.rop}`}></div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{item.uom}</td>
                  <td className="text-right text-muted">{item.rop}</td>
                  <td>
                    {isWarning ? <ROPAlertBadge stock={item.stock} rop={item.rop} /> : <span className="status-normal">Normal</span>}
                  </td>
                  <td className="text-muted text-sm">{new Date(item.lastUpdated).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="actions-cell text-right">
                    <div className="actions-group">
                      {isWarning ? (
                        <Button variant="primary" size="sm" onClick={() => onDraftPO(item)}>Draft PO</Button>
                      ) : (
                        <span className="action-placeholder"></span>
                      )}
                      
                      <div className="secondary-actions">
                        <button className="icon-action-btn" title="Adjust Stock" onClick={() => onAdjustStock(item)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                        <button className="icon-action-btn text-error" title="Log Waste" onClick={() => onLogWaste(item)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
