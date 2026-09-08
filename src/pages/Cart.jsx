import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Reveal, RevealStagger, RevealItem } from '../components/ui/animations';
import { SHIPPING_THRESHOLD, SHIPPING_CHARGE } from '../utils/constants';
import { getValidImageUrl } from '../utils/imageHelper';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('Cart error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorWrap}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={styles.errorTitle}>Something went wrong</h2>
          <p style={styles.errorSub}>We couldn't load your cart.</p>
          <button
            style={styles.errorBtn}
            onClick={() => {
              localStorage.removeItem('cart');
              localStorage.removeItem('cartItems');
              window.location.reload();
            }}
          >
            Reset &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Step Progress Bar ────────────────────────────────────────────────────────
const StepBar = () => {
  const steps = ['Browse', 'Cart', 'Checkout', 'Payment'];
  return (
    <div style={styles.stepBar} className="overflow-x-auto">
      {steps.map((label, i) => {
        const isDone   = i === 0;
        const isActive = i === 1;
        return (
          <React.Fragment key={label}>
            <div style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                background: isDone ? '#1D9E75' : isActive ? '#534AB7' : '#E2E8F0',
                color:      isDone || isActive ? '#fff' : '#94A3B8',
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{
                ...styles.stepLabel,
                color: isDone ? '#1D9E75' : isActive ? '#534AB7' : '#94A3B8',
                fontWeight: isActive ? 600 : 400,
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                ...styles.stepLine,
                background: isDone ? '#1D9E75' : '#E2E8F0',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Trust Badges ─────────────────────────────────────────────────────────────
const TrustBadge = ({ icon, label }) => (
  <div style={styles.trustItem}>
    <span style={{ fontSize: 18, marginBottom: 4 }}>{icon}</span>
    <span style={styles.trustText}>{label}</span>
  </div>
);

// ─── Main Cart ────────────────────────────────────────────────────────────────
const CartInner = () => {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [promo, setPromo] = React.useState('');
  const [promoApplied, setPromoApplied] = React.useState(false);

  const safeCart = Array.isArray(cartItems) ? cartItems : [];

  const removeItem = (id) => removeFromCart(id);
  const updateQty  = (id, qty) => { if (qty >= 1) updateQuantity(id, qty); };

  const subtotal   = safeCart.reduce((s, item) => s + (Number(item.price) || 0) * (Number(item.quantity || item.qty) || 1), 0);
  const discount   = promoApplied ? Math.round(subtotal * 0.05) : 0;
  const gst        = Math.round((subtotal - discount) * 0.18);
  const shipping   = (safeCart.length === 0 || subtotal >= SHIPPING_THRESHOLD) ? 0 : SHIPPING_CHARGE;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  const handlePromo = () => {
    if (promo.trim().toUpperCase() === 'AK500') setPromoApplied(true);
    else alert('Invalid promo code. Try AK500');
  };

  // ── Empty State ──
  if (safeCart.length === 0) {
    return (
      <div style={styles.emptyWrap}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
        <h2 style={styles.emptyTitle}>Your cart is empty</h2>
        <p style={styles.emptySub}>Looks like you haven't added any phones yet!</p>
        <Link to="/products" style={styles.shopNowBtn}>Shop Now →</Link>
      </div>
    );
  }

  // ── Cart with Items ──
  return (
    <div style={styles.pageWrap}>
      <div style={styles.container}>

        {/* Progress Steps */}
        <StepBar />

        {/* Page Title */}
        <div style={styles.titleRow}>
          <span style={{ fontSize: 22, marginRight: 10 }}>🛒</span>
          <h1 style={styles.pageTitle}>Your cart</h1>
          <span style={styles.countBadge}>{safeCart.length} item{safeCart.length > 1 ? 's' : ''}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ── LEFT: Items ── */}
          <div className="w-full lg:flex-1 min-w-0">
            <RevealStagger>
            {safeCart.map((item) => {
              const id  = item.product || item.id;
              const qty = Number(item.quantity || item.qty) || 1;
              const itemTotal = (Number(item.price) || 0) * qty;

              return (
                <RevealItem key={id} style={styles.itemCard} className="flex-wrap sm:flex-nowrap">

                  {/* Phone Image */}
                  <div style={styles.imgBox}>
                    <img
                      src={getValidImageUrl(item.image, item.name)}
                      alt={item.name}
                      style={styles.itemImg}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/80x100/EEEDFE/534AB7?text=${encodeURIComponent(item.brand || 'Phone')}`;
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={styles.brandPill}>{item.brand || 'Smartphone'}</span>
                    <h3 style={styles.itemName}>{item.name}</h3>
                    {item.specs && <p style={styles.itemSpec}>{item.specs}</p>}

                    <div style={styles.priceRow}>
                      <span style={styles.itemPrice}>₹{Number(item.price).toLocaleString('en-IN')}</span>
                      {item.mrp && item.mrp > item.price && (
                        <>
                          <span style={styles.itemMrp}>₹{Number(item.mrp).toLocaleString('en-IN')}</span>
                          <span style={styles.saveTag}>Save ₹{(item.mrp - item.price).toLocaleString('en-IN')}</span>
                        </>
                      )}
                    </div>

                    {/* Qty + Remove */}
                    <div style={styles.actionRow}>
                      <div style={styles.qtyBox}>
                        <button style={styles.qtyBtn} onClick={() => updateQty(id, qty - 1)}>−</button>
                        <span style={styles.qtyVal}>{qty}</span>
                        <button style={styles.qtyBtn} onClick={() => updateQty(id, qty + 1)}>+</button>
                      </div>
                      <button style={styles.removeBtn} onClick={() => removeItem(id)}>
                        🗑 Remove
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div
                    style={styles.itemTotalBox}
                    className="w-full flex items-center justify-between mt-3 pt-3 border-t border-slate-100 sm:w-auto sm:block sm:mt-0 sm:pt-0 sm:border-t-0"
                  >
                    <span style={styles.itemTotalLabel}>Item total</span>
                    <span style={styles.itemTotalVal}>₹{itemTotal.toLocaleString('en-IN')}</span>
                  </div>
                </RevealItem>
              );
            })}
            </RevealStagger>

            {/* Delivery Strip */}
            <Reveal style={styles.deliveryStrip}>
              <span style={{ fontSize: 20 }}>🚚</span>
              <div style={{ flex: 1 }}>
                <div style={styles.deliveryTitle}>Free delivery to Virudhachalam</div>
                <div style={styles.deliverySub}>Estimated 2–4 business days · Genuine products guaranteed</div>
              </div>
              <span style={styles.deliveryCheck}>✓</span>
            </Reveal>
          </div>

          {/* ── RIGHT: Summary ── */}
          <Reveal style={styles.summaryCard} className="w-full lg:w-[320px] lg:shrink-0 lg:sticky lg:top-[90px]">
            <h3 style={styles.summaryTitle}>Order summary</h3>

            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Subtotal ({safeCart.length} item{safeCart.length > 1 ? 's' : ''})</span>
              <span style={styles.summaryVal}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {promoApplied && (
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Promo (AK500 – 5%)</span>
                <span style={styles.discountVal}>−₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>GST (Included)</span>
              <span style={styles.summaryVal}>₹{gst.toLocaleString('en-IN')}</span>
            </div>

            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Delivery</span>
              <span style={shipping === 0 ? styles.freeVal : styles.summaryVal}>
                {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
              </span>
            </div>

            <div style={styles.summaryDivider} />

            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total</span>
              <div style={{ textAlign: 'right' }}>
                <div style={styles.totalVal}>₹{grandTotal.toLocaleString('en-IN')}</div>
                <div style={styles.taxNote}>Incl. all taxes</div>
              </div>
            </div>

            {/* Promo Code */}
            {!promoApplied ? (
              <div style={styles.promoBox}>
                <input
                  style={styles.promoInput}
                  placeholder="Promo code (try AK500)"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePromo()}
                />
                <button style={styles.promoBtn} onClick={handlePromo}>Apply</button>
              </div>
            ) : (
              <div style={styles.promoSuccess}>✓ Promo AK500 applied! You saved ₹{discount.toLocaleString('en-IN')}</div>
            )}

            {/* Checkout Button */}
            <Link to="/checkout" state={{ fromCart: true }} style={styles.checkoutBtn}>
              Proceed to Checkout
            </Link>

            <Link to="/products" style={styles.continueLink}>
              ← Continue Shopping
            </Link>


          </Reveal>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  // Error
  errorWrap:  { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#F8FAFC', padding:20, fontFamily:'system-ui,sans-serif' },
  errorTitle: { fontSize:22, fontWeight:700, color:'#0F172A', marginBottom:8 },
  errorSub:   { color:'#64748B', marginBottom:24, textAlign:'center' },
  errorBtn:   { background:'#EF4444', color:'#fff', border:'none', borderRadius:10, padding:'12px 28px', fontSize:15, fontWeight:600, cursor:'pointer' },

  // Empty
  emptyWrap:  { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#F8FAFC', padding:20, fontFamily:'system-ui,sans-serif' },
  emptyTitle: { fontSize:24, fontWeight:700, color:'#0F172A', marginBottom:8 },
  emptySub:   { color:'#64748B', marginBottom:28, textAlign:'center' },
  shopNowBtn: { background:'linear-gradient(135deg,#534AB7,#7C3AED)', color:'#fff', padding:'14px 32px', borderRadius:12, textDecoration:'none', fontWeight:700, fontSize:16 },

  // Page
  pageWrap:   { minHeight:'100vh', background:'#F1F0FB', padding:'30px 16px', fontFamily:'system-ui,sans-serif' },
  container:  { maxWidth:1100, margin:'0 auto' },

  // Step bar
  stepBar:    { display:'flex', alignItems:'center', marginBottom:28 },
  stepItem:   { display:'flex', alignItems:'center', gap:6 },
  stepDot:    { width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 },
  stepLabel:  { fontSize:12 },
  stepLine:   { flex:1, height:2, margin:'0 8px', minWidth:24 },

  // Title
  titleRow:   { display:'flex', alignItems:'center', gap:8, marginBottom:24 },
  pageTitle:  { fontSize:22, fontWeight:700, color:'#0F172A' },
  countBadge: { background:'#534AB7', color:'#fff', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 },

  // Grid
  grid: {
    display:'grid',
    gridTemplateColumns:'1fr 320px',
    gap:20,
    '@media(max-width:768px)': { gridTemplateColumns:'1fr' },
  },

  // Item card
  itemCard:   { background:'#fff', borderRadius:16, padding:18, marginBottom:12, display:'flex', gap:14, alignItems:'flex-start', boxShadow:'0 1px 4px rgba(83,74,183,0.08)', border:'1px solid #EEEDFE' },
  imgBox:     { width:80, height:100, background:'#F8F7FF', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  itemImg:    { width:70, height:90, objectFit:'contain' },
  brandPill:  { display:'inline-block', background:'#EEEDFE', color:'#534AB7', fontSize:10, fontWeight:600, padding:'2px 10px', borderRadius:20, marginBottom:6 },
  itemName:   { fontSize:14, fontWeight:700, color:'#0F172A', marginBottom:4, lineHeight:1.4 },
  itemSpec:   { fontSize:11, color:'#94A3B8', marginBottom:8 },
  priceRow:   { display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:12 },
  itemPrice:  { fontSize:17, fontWeight:700, color:'#534AB7' },
  itemMrp:    { fontSize:12, color:'#94A3B8', textDecoration:'line-through' },
  saveTag:    { background:'#E1F5EE', color:'#0F6E56', fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20 },

  actionRow:  { display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  qtyBox:     { display:'flex', alignItems:'center', border:'1.5px solid #EEEDFE', borderRadius:8, overflow:'hidden', background:'#F8F7FF' },
  qtyBtn:     { width:44, height:44, border:'none', background:'transparent', fontSize:18, cursor:'pointer', color:'#534AB7', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' },
  qtyVal:     { width:36, textAlign:'center', fontSize:14, fontWeight:600, color:'#0F172A' },
  removeBtn:  { background:'#FEE2E2', color:'#EF4444', border:'none', borderRadius:8, padding:'0 14px', minHeight:44, cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4 },

  itemTotalBox:  { textAlign:'right', flexShrink:0, minWidth:80 },
  itemTotalLabel:{ fontSize:10, color:'#94A3B8', display:'block', marginBottom:4 },
  itemTotalVal:  { fontSize:15, fontWeight:700, color:'#0F172A' },

  // Delivery strip
  deliveryStrip: { background:'#fff', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, border:'1px solid #E1F5EE' },
  deliveryTitle: { fontSize:13, fontWeight:600, color:'#0F172A' },
  deliverySub:   { fontSize:11, color:'#64748B', marginTop:2 },
  deliveryCheck: { fontSize:16, color:'#1D9E75', fontWeight:700 },

  // Summary card
  summaryCard:   { background:'#fff', borderRadius:16, padding:22, height:'fit-content', boxShadow:'0 2px 12px rgba(83,74,183,0.10)', border:'1px solid #EEEDFE' },
  summaryTitle:  { fontSize:16, fontWeight:700, color:'#0F172A', marginBottom:18, paddingBottom:12, borderBottom:'1.5px solid #F1F0FB' },
  summaryRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  summaryLabel:  { fontSize:13, color:'#64748B' },
  summaryVal:    { fontSize:13, fontWeight:600, color:'#0F172A' },
  discountVal:   { fontSize:13, fontWeight:600, color:'#0F6E56' },
  freeVal:       { fontSize:13, fontWeight:600, color:'#1D9E75' },
  summaryDivider:{ height:1.5, background:'#F1F0FB', margin:'14px 0' },
  totalRow:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  totalLabel:    { fontSize:16, fontWeight:700, color:'#0F172A' },
  totalVal:      { fontSize:20, fontWeight:700, color:'#534AB7' },
  taxNote:       { fontSize:10, color:'#94A3B8', textAlign:'right', marginTop:2 },

  // Promo
  promoBox:     { display:'flex', gap:8, marginBottom:16 },
  promoInput:   { flex:1, border:'1.5px solid #EEEDFE', borderRadius:8, padding:'9px 12px', fontSize:12, background:'#F8F7FF', color:'#0F172A', outline:'none' },
  promoBtn:     { background:'none', border:'1.5px solid #534AB7', color:'#534AB7', borderRadius:8, padding:'9px 14px', fontSize:12, cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' },
  promoSuccess: { background:'#E1F5EE', color:'#0F6E56', fontSize:12, fontWeight:600, padding:'10px 14px', borderRadius:8, marginBottom:16, textAlign:'center' },

  // Checkout
  checkoutBtn:   { display:'block', background:'#534AB7', color:'#fff', padding:15, borderRadius:12, textDecoration:'none', fontWeight:700, fontSize:15, textAlign:'center', marginBottom:10, letterSpacing:0.3 },
  continueLink:  { display:'block', textAlign:'center', color:'#534AB7', fontSize:13, fontWeight:500, textDecoration:'none', marginBottom:18 },

  // Trust
  trustRow:     { display:'flex', gap:8, marginBottom:14 },
  trustItem:    { flex:1, background:'#F8F7FF', borderRadius:10, padding:'10px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  trustText:    { fontSize:9, color:'#64748B', textAlign:'center', lineHeight:1.3 },

  // Payment
  paymentRow:   { display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' },
  paymentPill:  { background:'#F1F0FB', color:'#534AB7', fontSize:10, fontWeight:600, padding:'4px 10px', borderRadius:6, border:'1px solid #EEEDFE' },
};

// ─── Export ───────────────────────────────────────────────────────────────────
const Cart = () => (
  <ErrorBoundary>
    <CartInner />
  </ErrorBoundary>
);

export default Cart;