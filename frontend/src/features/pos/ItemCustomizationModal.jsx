import { useState } from 'react';
import '../../styles/POS/CheckoutModal.css';

const ItemCustomizationModal = ({ isOpen, onClose, item, onConfirm }) => {
  // state structure: { [groupId]: [selectedModifierIds] }
  const [selections, setSelections] = useState(() => {
    const initialSelections = {};
    if (item && item.modifier_groups) {
      item.modifier_groups.forEach(group => {
        initialSelections[group.id] = [];
      });
    }
    return initialSelections;
  });

  if (!isOpen || !item) return null;

  const handleToggle = (groupId, modifier, isRadio) => {
    setSelections(prev => {
      const current = prev[groupId] || [];
      if (isRadio) {
        // Single selection (max_selections = 1) -> Radio behavior
        return { ...prev, [groupId]: [modifier.id] };
      }
      
      const isSelected = current.includes(modifier.id);
      if (isSelected) {
        return { ...prev, [groupId]: current.filter(id => id !== modifier.id) };
      } else {
        // Enforce max_selections if applicable
        const group = item.modifier_groups.find(g => g.id === groupId);
        if (group && group.max_selections !== null && current.length >= group.max_selections) {
          return prev; 
        }
        return { ...prev, [groupId]: [...current, modifier.id] };
      }
    });
  };

  const calculateTotal = () => {
    let total = item.price;
    Object.values(selections).forEach(selectedIds => {
      selectedIds.forEach(modId => {
        for (const group of item.modifier_groups) {
          const mod = group.modifiers.find(m => m.id === modId);
          if (mod) {
            total += mod.price_adjustment;
          }
        }
      });
    });
    return total;
  };

  const isFormValid = () => {
    for (const group of item.modifier_groups) {
      const selectedCount = (selections[group.id] || []).length;
      if (selectedCount < group.min_selections) {
        return false;
      }
    }
    return true;
  };

  const handleConfirm = () => {
    if (!isFormValid()) return;
    const flatModifiers = Object.values(selections).flat();
    onConfirm(item, flatModifiers, calculateTotal() - item.price);
  };

  const totalAmount = calculateTotal();

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div
        className="checkout-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h2 className="checkout-modal-title">Customize {item.name}</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Base Price: Rp {item.price.toLocaleString('id-ID')}</p>

        {item.modifier_groups && item.modifier_groups.map(group => {
          const selectedCount = (selections[group.id] || []).length;
          const isRadio = group.max_selections === 1;
          const isRequired = group.min_selections > 0;
          const metMinimum = selectedCount >= group.min_selections;

          return (
            <div key={group.id} style={{ marginBottom: '20px', borderBottom: '1px solid #eaeaea', paddingBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>{group.name} {isRequired && <span className="required">*</span>}</h4>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {isRequired && !metMinimum ? `Select at least ${group.min_selections}` : ''}
                  {group.max_selections ? ` (Max: ${group.max_selections})` : ''}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.modifiers.map(mod => {
                  const isSelected = (selections[group.id] || []).includes(mod.id);
                  const maxReached = !isSelected && group.max_selections !== null && selectedCount >= group.max_selections;

                  return (
                    <label key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: maxReached ? 'not-allowed' : 'pointer', opacity: maxReached ? 0.5 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          data-testid={`modifier-${mod.id}`}
                          type={isRadio ? "radio" : "checkbox"}
                          name={`group-${group.id}`}
                          checked={isSelected}
                          disabled={maxReached}
                          onChange={() => handleToggle(group.id, mod, isRadio)}
                          style={{ accentColor: 'var(--pos-primary)' }}
                        />
                        <span>{mod.name}</span>
                      </div>
                      <span style={{ color: mod.price_adjustment > 0 ? 'var(--pos-primary)' : '#666' }}>
                        {mod.price_adjustment > 0 ? `+Rp ${mod.price_adjustment.toLocaleString('id-ID')}` : 'Free'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Total Amount */}
        <div className="checkout-modal-amount" style={{ marginTop: '20px' }}>
          <span className="checkout-modal-amount-value">
            Rp {totalAmount.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="checkout-modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            data-testid="btn-add-to-order"
            className="btn-modal-confirm"
            onClick={handleConfirm}
            disabled={!isFormValid()}
            style={{ opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCustomizationModal;
