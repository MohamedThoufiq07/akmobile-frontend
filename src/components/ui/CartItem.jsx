import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../../context/useCart';
import { formatPrice } from '../../utils/formatPrice';
import { getValidImageUrl } from '../../utils/imageHelper';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-4 py-6 border-b border-slate-100 last:border-0 group">
      {/* Product Image */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center">
        <Link to={`/products/${item.product}`}>
          <img 
            src={getValidImageUrl(item.image, item.name)} 
            alt={item.name}
            className="w-full h-full object-contain"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-grow min-w-0">
        <Link to={`/products/${item.product}`} className="block hover:text-brand-orange transition-colors">
          <h3 className="font-bold text-slate-900 line-clamp-2 sm:line-clamp-1 min-w-0">{item.name}</h3>
        </Link>
        <p className="font-bold text-brand-dark mt-2">{formatPrice(item.price)}</p>
        <p className="text-sm text-slate-500 mt-1">
          {item.stock > 0 ? (
            <span className="text-green-600">In Stock</span>
          ) : (
            <span className="text-red-500">Out of Stock</span>
          )}
        </p>
      </div>

      {/* Quantity & Actions */}
      <div className="flex flex-wrap items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end gap-4 mt-2 sm:mt-0 shrink-0">
        <div className="flex items-center border border-slate-300 rounded-lg h-11 w-32 bg-white overflow-hidden">
          <button
            onClick={() => updateQuantity(item.product, item.quantity - 1)}
            className="w-11 h-full text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <FiMinus size={14} />
          </button>
          <div className="w-full text-center border-x border-slate-300 h-full flex items-center justify-center font-semibold text-sm">
            {item.quantity}
          </div>
          <button
            onClick={() => updateQuantity(item.product, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            className="w-11 h-full text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:bg-slate-50"
          >
            <FiPlus size={14} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-900 sm:hidden">
            Total: {formatPrice(item.price * item.quantity)}
          </span>
          <button
            onClick={() => removeFromCart(item.product)}
            className="text-slate-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
            title="Remove item"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
      
      {/* Desktop Total */}
      <div className="hidden sm:block w-28 text-right font-bold text-slate-900 shrink-0">
        {formatPrice(item.price * item.quantity)}
      </div>
    </div>
  );
};

export default CartItem;
