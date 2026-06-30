import React, { useState, useEffect } from 'react';
import '../../styles/inventory/InventoryDashboard.css';
import { InventoryTable } from './InventoryTable';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../core/store/authStore';
import api from '../../core/api/axios'; // Use pre-configured Axios

// Modals
import { ReceiveStockModal } from './modals/ReceiveStockModal';
import { DraftPOModal } from './modals/DraftPOModal';
import { AdjustStockModal } from './modals/AdjustStockModal';
import { LogWasteModal } from './modals/LogWasteModal';

export const InventoryDashboard = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Core State
  const [inventoryData, setInventoryData] = useState([]);
  const [wasteLogged, setWasteLogged] = useState(0); // Tracking quantity wasted

  // Modal Visibility State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [draftPOContext, setDraftPOContext] = useState(null);
  const [adjustContext, setAdjustContext] = useState(null);
  const [wasteContext, setWasteContext] = useState(null);

  // Fetch initial data
  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory/');
      // Map backend fields to frontend format
      const formattedData = response.data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        stock: item.stock_level,
        uom: item.unit,
        rop: item.reorder_point,
        lastUpdated: item.last_updated
      }));
      setInventoryData(formattedData);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Updaters
  const handleReceiveStock = async (rows) => {
    try {
      const items = rows.map(r => ({
        ingredient_id: r.ingredientId,
        quantity: Number(r.quantity)
      }));
      await api.post('/inventory/bulk-receive', { items });
      await fetchInventory(); // Refresh from DB
    } catch (error) {
      console.error("Failed to process bulk receive:", error);
    }
  };

  const handleDraftPO = async (data) => {
    try {
      // Endpoint expects query parameters
      await api.post(`/suppliers/${data.supplier}/po`, null, {
        params: {
          ingredient_id: data.ingredientId,
          suggested_qty: data.quantity,
          notes: data.actionType === 'draft' ? 'Saved as draft' : 'Sent to supplier'
        }
      });
      console.log(`PO ${data.actionType} for item ${data.ingredientId}`);
    } catch (error) {
      console.error("Failed to draft PO:", error);
    }
  };

  const handleAdjustStock = async (data) => {
    try {
      const item = inventoryData.find(i => i.id === data.ingredientId);
      if (!item) return;
      const amount = data.newStock - item.stock; // Difference
      
      await api.post(`/inventory/${data.ingredientId}/adjust`, null, {
        params: { amount, reason: data.reason }
      });
      await fetchInventory();
    } catch (error) {
      console.error("Failed to adjust stock:", error);
    }
  };

  const handleLogWaste = async (data) => {
    try {
      await api.post(`/inventory/${data.ingredientId}/adjust`, null, {
        params: { amount: -data.wasteQty, reason: data.reason }
      });
      setWasteLogged(prev => prev + data.wasteQty);
      await fetchInventory();
    } catch (error) {
      console.error("Failed to log waste:", error);
    }
  };

  // Stat calculations
  const totalIngredients = inventoryData.length;
  const lowStockCount = inventoryData.filter(i => i.stock <= i.rop && i.stock > 0).length;
  const outOfStockCount = inventoryData.filter(i => i.stock === 0).length;

  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'All' 
      || (filterStatus === 'Low' && item.stock <= item.rop && item.stock > 0)
      || (filterStatus === 'Out of Stock' && item.stock === 0)
      || (filterStatus === 'Normal' && item.stock > item.rop);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const uniqueCategories = ['All', ...new Set(inventoryData.map(item => item.category).filter(Boolean))].sort();

  return (
    <div className="inventory-dashboard">
      <header className="inventory-header">
        <div className="header-container">
          <h1>Inventory Management</h1>
          <div className="header-actions">
            {/* Add Item button removed per Warehouse role restrictions */}
            <Button variant="outline" onClick={() => setIsAdjustModalOpen(true)}>Adjust Stock</Button>
            <Button variant="primary" onClick={() => setIsReceiveModalOpen(true)}>Receive Stock</Button>
            
            <div className="header-user-actions">
              <span className="user-greeting">Hi, {user?.username || 'User'}</span>
              <button className="logout-button" aria-label="Log out" onClick={logout}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="logout-icon"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
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
            <div className="stat-value">{wasteLogged} <span style={{fontSize: '0.875rem', fontWeight: 'normal'}}>units</span></div>
          </div>
        </div>

        <div className="inventory-table-section">
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
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
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

          <div className="inventory-content">
            <InventoryTable 
              data={filteredData} 
              onDraftPO={setDraftPOContext}
              onAdjustStock={(item) => {
                setAdjustContext(item);
                setIsAdjustModalOpen(true);
              }}
              onLogWaste={setWasteContext}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReceiveStockModal 
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        inventoryData={inventoryData}
        onSubmit={handleReceiveStock}
      />
      
      <DraftPOModal
        isOpen={!!draftPOContext}
        onClose={() => setDraftPOContext(null)}
        ingredient={draftPOContext}
        onSubmit={handleDraftPO}
      />

      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustContext(null);
        }}
        inventoryData={inventoryData}
        initialIngredientId={adjustContext?.id || ''}
        onSubmit={handleAdjustStock}
      />

      <LogWasteModal
        isOpen={!!wasteContext}
        onClose={() => setWasteContext(null)}
        ingredient={wasteContext}
        onSubmit={handleLogWaste}
      />
    </div>
  );
};
