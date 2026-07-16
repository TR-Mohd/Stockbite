import '../../styles/POS/MenuItemCard.css';

const MenuItemCard = ({ item, onAddToCart, onUpdateQuantity, cartQty, isSelected }) => {
  const isOutOfStock = item.is_available === false;

  const cardClasses = [
    'menu-item-card',
    isOutOfStock ? 'out-of-stock' : '',
    isSelected ? 'selected' : '',
  ].filter(Boolean).join(' ');

  const handlePlus = (e) => {
    e.stopPropagation();
    onAddToCart(item);
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    if (cartQty > 0) {
      onUpdateQuantity(item.id);
    }
  };

  const getPlaceholderImage = (category) => {
    const lower = (category || 'other').toLowerCase();
    if (['food', 'foods', 'main'].includes(lower)) return '/placeholder-food.png';
    if (['beverage', 'beverages', 'drink', 'drinks'].includes(lower)) return '/placeholder-beverage.png';
    return '/placeholder-other.png';
  };

  const formattedPrice = item.price?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div
      data-testid={`menu-item-${item.id}`}
      className={cardClasses}
      onClick={() => {
        if (!isOutOfStock && cartQty === 0) onAddToCart(item);
      }}
      role="button"
      tabIndex={isOutOfStock ? -1 : 0}
      aria-disabled={isOutOfStock}
      aria-label={`${item.name} - Rp ${formattedPrice}${isOutOfStock ? ' (Out of stock)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isOutOfStock && cartQty === 0) onAddToCart(item);
      }}
    >
      <div className="menu-card-image">
        <img
          src={item.image || getPlaceholderImage(item.category)}
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            const fallback = getPlaceholderImage(item.category);
            if (!e.target.src.includes(fallback)) {
              e.target.src = fallback;
            }
          }}
        />
      </div>

      <div className="menu-card-content">
        <div className="menu-card-header">
          <h3 className="menu-item-title">{item.name}</h3>
          <p className="menu-item-stock">{item.stock} Available</p>
        </div>

        <div className="menu-card-footer">
          <span className="menu-item-price">Rp {formattedPrice}</span>

          
          <div className="menu-item-controls">
            {isOutOfStock ? (
              <span className="menu-item-out-of-stock-text">Out of stock</span>
            ) : (
              <div className="qty-controls">
                <button data-testid="btn-minus" className="btn-qty btn-minus" onClick={handleMinus} aria-label="Decrease quantity">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <span data-testid="item-qty" className="qty-value">{cartQty}</span>
                <button data-testid="btn-plus" className="btn-qty btn-plus" onClick={handlePlus} aria-label="Increase quantity">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;