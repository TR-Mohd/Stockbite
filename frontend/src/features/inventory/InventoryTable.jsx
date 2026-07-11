import React, { useState, useMemo } from 'react';
import '../../styles/inventory/InventoryTable.css';
import { ROPAlertBadge } from './ROPAlertBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDateStandard } from '../../utils/formatters';

// Utility to get status weight for sorting
const getStatusWeight = (stock, rop) => {
  if (stock === 0) return 1; // Out of Stock (highest priority)
  if (stock <= rop) return 2; // Low Stock
  return 3; // Normal
};

export const InventoryTable = ({ data, isFiltered, totalItems, onDraftPO, onAdjustStock, onLogWaste }) => {
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
            <th className="text-left">Ingredient</th>
            <th className="text-left">Category</th>
            <th className="text-right">Unit Cost</th>
            <th className="text-right" style={{ width: '120px' }}>Stock Level</th>
            <th className="text-left">UoM</th>
            <th className="text-right">ROP</th>
            <th className="text-center">Status</th>
            <th className="text-left">Last Updated</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan="9">
                <div style={{ padding: '2rem 0' }}>
                  {totalItems === 0 && !isFiltered ? (
                    <EmptyState 
                      icon={
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                      }
                      title="No ingredients tracked yet" 
                      description="Start managing your inventory by adding your first ingredient."
                    />
                  ) : (
                    <EmptyState 
                      icon={
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      }
                      title="No results found" 
                      description="Try adjusting your search or filters to find what you're looking for."
                    />
                  )}
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
                <tr key={item.id} className={isOutOfStock ? 'row-danger' : isLowStock ? 'row-warning' : ''}>
                  <td className="text-left font-medium">{item.name}</td>
                  <td className="text-left"><span className="category-tag">{item.category}</span></td>
                  <td className="text-right font-medium">{formatCurrency(item.unitCost)}</td>
                  <td className="text-right">
                    <div className="stock-level-cell" style={{ justifyContent: 'flex-end' }}>
                      <span className="stock-value">{typeof item.stock === 'number' ? parseFloat(item.stock.toFixed(2)) : item.stock}</span>
                      <div className="sparkline-container" style={{ width: '60px' }}>
                        <div className={`sparkline-bar ${isOutOfStock ? 'empty' : isLowStock ? 'warning' : 'normal'}`} style={{ width: `${stockPercentage}%` }}></div>
                        <div className="sparkline-rop-marker" style={{ left: `${ropPercentage}%` }} title={`ROP: ${item.rop}`}></div>
                      </div>
                    </div>
                  </td>
                  <td className="text-left text-muted">{item.uom}</td>
                  <td className="text-right text-muted">{item.rop}</td>
                  <td className="text-center">
                    {isWarning ? <ROPAlertBadge stock={item.stock} rop={item.rop} /> : <span className="status-normal">Normal</span>}
                  </td>
                  <td className="text-left text-muted text-sm">{formatDateStandard(item.lastUpdated)}</td>
                  <td className="actions-cell text-center">
                    <div className="actions-group" style={{ justifyContent: 'center' }}>
                      {item.active_po_status === 'Draft' ? (
                        <span className="status-badge badge-draft">Drafted</span>
                      ) : item.active_po_status === 'Sent' ? (
                        <span className="status-badge badge-sent">Sent</span>
                      ) : isWarning ? (
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
