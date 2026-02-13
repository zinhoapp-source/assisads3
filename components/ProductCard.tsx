import React from 'react';
import { Product } from '../types';
import { ShoppingCart, Check, Zap, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div className="group bg-dark-800 rounded-xl border border-dark-700 hover:border-primary-500 transition-all duration-300 flex flex-col h-full overflow-hidden relative shadow-lg hover:shadow-primary-500/10">
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-0 left-0 bg-primary-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-br-lg z-10">
          {product.badge}
        </div>
      )}
      
      {/* Discount Badge */}
      <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded md:rounded-lg z-10 border border-red-500">
        -{discount}%
      </div>

      {/* Image Area */}
      <div className="h-40 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent z-10 opacity-60"></div>
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
            <span className="bg-dark-900/80 backdrop-blur text-xs px-2 py-0.5 rounded border border-dark-600 text-gray-300">
              {product.type === 'facebook' ? 'Meta Ads' : product.type === 'proxy' ? 'Conexão' : 'TikTok'}
            </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-primary-500 transition-colors">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Features Minimalist */}
        <div className="flex-1 space-y-2 mb-4">
          {product.features.slice(0, 3).map((f, i) => (
            <div key={i} className="flex items-center text-xs text-gray-500">
              <Check size={12} className="text-primary-500 mr-2" />
              {f}
            </div>
          ))}
        </div>

        {/* Price & Action */}
        <div className="mt-auto pt-4 border-t border-dark-700 flex flex-col gap-3">
          <div className="flex justify-between items-end">
             <div>
                <span className="text-xs text-gray-500 line-through block">R$ {product.originalPrice.toFixed(2)}</span>
                <span className="text-2xl font-bold text-white tracking-tight">R$ {product.price.toFixed(2)}</span>
             </div>
             <div className="text-right">
                <div className="flex items-center gap-1 text-[10px] text-primary-500 font-medium bg-primary-500/10 px-2 py-1 rounded">
                   <Zap size={10} fill="currentColor" />
                   Entrega Imediata
                </div>
             </div>
          </div>
          
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-900/20 active:scale-95"
          >
            <ShoppingCart size={18} />
            Comprar Agora
          </button>
        </div>
      </div>
    </div>
  );
};