import React, { useState } from 'react';
import './InventoryDashboard.css';
import { InventoryTable } from './InventoryTable';
import { Button } from '../../components/ui/Button';

export const InventoryDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const inventoryData = [
    { id: 1, name: 'Ground Beef', category: 'Meat', stock: 5, uom: 'kg', rop: 10, lastUpdated: '2023-10-27T10:00' },
    { id: 2, name: 'Burger Buns', category: 'Bakery', stock: 150, uom: 'pcs', rop: 50, lastUpdated: '2023-10-27T11:00' },
    { id: 3, name: 'Lettuce', category: 'Produce', stock: 2, uom: 'heads', rop: 5, lastUpdated: '2023-10-27T09:30' },
    { id: 4, name: 'Tomatoes', category: 'Produce', stock: 0, uom: 'kg', rop: 3, lastUpdated: '2023-10-28T08:00' },
  ];

  // Stat calculations
  const totalIngredients = inventoryData.length;
  const lowStockCount = inventoryData.filter(i => i.stock <= i.rop && i.stock > 0).length;
  const outOfStockCount = inventoryData.filter(i => i.stock === 0).length;
  const wasteLogged = "14 kg"; // Placeholder

  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'All' 
      || (filterStatus === 'Low' && item.stock <= item.rop && item.stock > 0)
      || (filterStatus === 'Out of Stock' && item.stock === 0)
      || (filterStatus === 'Normal' && item.stock > item.rop);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="inventory-dashboard">
      <header className="inventory-header">
        <div className="header-container">
          <h1>Inventory Management</h1>
          <div className="header-actions">
            <Button variant="primary">Add Item</Button>
            <Button variant="outline">Receive Stock</Button>
          </div>
        </div>
      </header>

      <div className="inventory-main-container">
        <div className="summary-strip">
          <div className="stat-card">
            <div className="stat-label">Total Tracked</div>
            <div className="stat-value">{totalIngredients}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">At / Below ROP</div>
            <div className="stat-value">{lowStockCount}</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-label">Out of Stock</div>
            <div className="stat-value">{outOfStockCount}</div>
          </div>
          <div className="stat-card neutral">
            <div className="stat-label">Waste This Week</div>
            <div className="stat-value">{wasteLogged}</div>
          </div>
        </div>

        <div className="inventory-table-section">
          <div className="inventory-controls-panel">
            <div className="search-filter-bar">
              <div className="search-input">
                <input 
                  type="text" 
                  placeholder="Search ingredients..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="inventory-input"
                />
              </div>
              <div className="filter-group">
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="inventory-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Meat">Meat</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Produce">Produce</option>
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="inventory-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          <div className="inventory-content">
            <InventoryTable data={filteredData} />
          </div>
        </div>
      </div>
    </div>
  );
};
