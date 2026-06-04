from pathlib import Path

path = Path('src/pages/gros.js')
text = path.read_text(encoding='utf-8', errors='replace')

old1 = '''                <article key={item.productId} className="commercial-cart-item">
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.quantity} × {item.price} DT / {item.unit}
                    </p>
                  </div>
                  <div className="commercial-cart-item-actions">
'''
new1 = '''                <article key={item.productId} className="commercial-cart-item">
                  <div className="commercial-cart-item-content">
                    <strong>{item.name}</strong>
                    <p>
                      {item.quantity} × {item.price.toFixed(2)} DT / {item.unit}
                    </p>
                    <p className="commercial-cart-item-total">
                      Sous-total : {(item.quantity * item.price).toFixed(2)} DT
                    </p>
                  </div>
                  <div className="commercial-cart-item-actions">
'''

old2 = '''            <div className="commercial-cart-summary">
              <p>Articles sélectionnés : {cartSummary.quantity}</p>
              <strong>Total estimé : {cartSummary.total.toFixed(2)} DT</strong>
            </div>
'''
new2 = '''            <div className="commercial-cart-summary">
              <p>Articles sélectionnés : {cartSummary.quantity}</p>
              <strong>Total estimé : {cartSummary.total.toFixed(2)} DT</strong>
              <p className="commercial-cart-hint">Prix calculé selon la quantité et l’unité de vente.</p>
            </div>
            <button
              type="button"
              className="commercial-cart-clear"
              onClick={() => setCartItems([])}
              disabled={cartItems.length === 0}
            >
              Vider le panier
            </button>
'''

old3 = '''                  <div className="commercial-order-meta">
                    <h3>{order.customerName}</h3>
                    <span className="commercial-order-status">{order.status || "pending"}</span>
                  </div>
'''
new3 = '''                  <div className="commercial-order-meta">
                    <h3>{order.customerName}</h3>
                    <span className={`commercial-order-status commercial-order-status-${order.status || "pending"}`}>
                      {orderStatusLabels[order.status] || orderStatusLabels.pending}
                    </span>
                  </div>
'''

modified = False
for old, new, label in [(old1, new1, 'cart item'), (old2, new2, 'cart summary'), (old3, new3, 'order status')]:
    if old in text:
        text = text.replace(old, new)
        print(f'patched {label}')
        modified = True
    else:
        print(f'{label} snippet not found')

if modified:
    path.write_text(text, encoding='utf-8')
else:
    print('no modifications applied')
