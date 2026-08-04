import React, { useState } from 'react';

export const IngredientCombobox = ({
  ingredients = [],
  selectedIds = [],
  onSelect,
  placeholder = "Search ingredient to add...",
  disabled = false,
}) => {
  const [search, setSearch] = useState('');

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch = ing.name
      ?.toLowerCase()
      .includes(search.toLowerCase().trim());
    const notSelected = !selectedIds.includes(ing.id);
    return matchesSearch && notSelected;
  });

  const handleSelect = (ing) => {
    if (disabled) return;
    onSelect(ing);
    setSearch('');
  };

  return (
    <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
      <input
        type="text"
        className="modal-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {search.trim() !== '' && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '160px',
            overflowY: 'auto',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            zIndex: 10,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
        >
          {filteredIngredients.length === 0 ? (
            <div
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              No matching ingredients found
            </div>
          ) : (
            filteredIngredients.map((ing) => (
              <div
                key={ing.id}
                onClick={() => handleSelect(ing)}
                style={{
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--color-border)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    'var(--color-bg-surface-hover)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <span>{ing.name}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  ({ing.unit || ing.uom || ''})
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
