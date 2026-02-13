
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  X, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Download, 
  CreditCard,
  QrCode,
  CheckCircle,
  Search,
  Menu,
  Zap,
  Box,
  Layers,
  Terminal,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Lock,
  TrendingUp,
  Users,
  Globe,
  Star,
  Copy,
  Check,
  Package,
  Settings,
  AlertTriangle,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { ChatWidget } from './components/ChatWidget';
import { PRODUCTS, TESTIMONIALS, FB_LOGO, PIX_KEY, QR_CODE_IMAGE, WHATSAPP_SUPPORT } from './constants';
import { Product, CartItem, User, Order } from './types';
import * as db from './services/db';
import { sendOrderEmail } from './services/emailService'; // Importação do Serviço de Email

// --- MAIN APP COMPONENT ---

export default function App() {
  // --- STATE ---
  const [view, setView] = useState<'home' | 'products' | 'dashboard' | 'checkout'>('home');
  
  // Inicializa o carrinho buscando do localStorage se existir
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('assis_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- EFFECTS ---
  
  // Salva o carrinho no localStorage sempre que ele mudar
  useEffect(() => {
    localStorage.setItem('assis_cart', JSON.stringify(cart));
  }, [cart]);

  // Load user session from Supabase
  useEffect(() => {
    const initSession = async () => {
       const currentUser = await db.getCurrentUser();
       if (currentUser) {
         setUser(currentUser);
         const userOrders = await db.getUserOrders(currentUser.email);
         setOrders(userOrders);
       }
    };
    initSession();
  }, []);

  // --- HANDLERS ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCategoryClick = () => {
    if (user) {
      setView('products');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      if (authMode === 'login') {
        const { data, error } = await db.signIn(email, password);
        if (error) {
           if (error.message.includes('Invalid login credentials')) {
             throw new Error("E-mail ou senha incorretos.");
           }
           throw error;
        }
      } else {
        // CADASTRO
        const { data, error } = await db.signUp(email, password);
        if (error) {
           // Tratamento para limite de taxa (rate limit)
           if (error.message.includes('rate limit') || error.status === 429) {
              throw new Error("Muitas tentativas. Aguarde alguns minutos.");
           }
           throw error;
        }
      }

      // Success - Refresh User and Enter
      const currentUser = await db.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const userOrders = await db.getUserOrders(currentUser.email);
        setOrders(userOrders);
        setIsAuthModalOpen(false);
        if (view === 'home') setView('products');
      } else {
         if (authMode === 'register') {
             setAuthError("Conta criada! Se o login não foi automático, tente entrar com sua senha.");
             setAuthMode('login');
         }
      }

    } catch (err: any) {
      setAuthError(err.message || "Erro na autenticação. Tente novamente.");
    } finally {
      if (!authError) setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await db.signOut();
    setUser(null);
    setOrders([]);
    setIsUserMenuOpen(false);
    setView('home');
    localStorage.removeItem('assis_cart'); // Opcional: limpar carrinho ao sair
    setCart([]);
  };

  const navigateTo = (targetView: 'home' | 'products' | 'dashboard' | 'checkout') => {
    // If trying to access products without login, intercept
    if (targetView === 'products' && !user) {
        setIsAuthModalOpen(true);
        return;
    }
    setView(targetView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- COMPONENTS INTERNAL ---

  const Navbar = () => (
    <nav className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('home')}>
            <div className="bg-primary-600 p-2 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300">
              <Box size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-white leading-none">ASSIS<span className="text-primary-500">ADS</span></span>
            </div>
          </div>

          {/* Desktop Nav - MENU ATUALIZADO */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
             <button onClick={() => navigateTo('home')} className={`text-sm font-bold px-5 py-2 rounded-full transition-all duration-300 ${view === 'home' ? 'text-white bg-dark-800 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                Início
             </button>
             <button onClick={() => navigateTo('products')} className={`text-sm font-bold px-5 py-2 rounded-full transition-all duration-300 ${view === 'products' ? 'text-white bg-dark-800 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                Produtos
             </button>
             {user && (
               <button onClick={() => navigateTo('dashboard')} className={`text-sm font-bold px-5 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${view === 'dashboard' ? 'text-white bg-dark-800 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  Meus Produtos
               </button>
             )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group"
            >
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                  {cart.length}
                </span>
              )}
            </button>
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                  className="flex items-center gap-3 text-sm font-bold text-gray-300 hover:text-white pl-5 border-l border-white/10 transition-colors outline-none"
                >
                  <div className={`w-9 h-9 bg-dark-800 border rounded-full flex items-center justify-center overflow-hidden ring-2 transition-all ${isUserMenuOpen ? 'ring-primary-500 border-primary-500' : 'ring-transparent border-white/10'}`}>
                    {user.avatar ? <img src={user.avatar} className="w-full h-full" alt="avatar"/> : <UserIcon size={18} />}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                   <>
                     <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsUserMenuOpen(false)}></div>
                     <div className="absolute right-0 top-full mt-4 w-64 bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                        {/* Seta do Dropdown */}
                        <div className="absolute -top-1.5 right-3 w-3 h-3 bg-dark-800 border-t border-l border-dark-700 transform rotate-45"></div>
                        
                        <div className="relative p-3 mb-2 bg-dark-900/50 rounded-xl border border-dark-700/50">
                           <p className="text-white font-bold truncate">{user.name}</p>
                           <p className="text-xs text-gray-500 truncate font-medium">{user.email}</p>
                        </div>
                        
                        <button 
                           onClick={() => { navigateTo('dashboard'); setIsUserMenuOpen(false); }}
                           className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors group"
                        >
                           <div className="p-1.5 rounded-md bg-dark-700 text-gray-400 group-hover:text-primary-500 group-hover:bg-primary-500/10 transition-colors">
                              <Box size={16} /> 
                           </div>
                           Meus Produtos
                        </button>

                         <button 
                           onClick={() => { navigateTo('products'); setIsUserMenuOpen(false); }}
                           className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors group"
                        >
                           <div className="p-1.5 rounded-md bg-dark-700 text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                             <ShoppingCart size={16} /> 
                           </div>
                           Comprar Mais
                        </button>
                        
                        <div className="h-px bg-white/5 my-2"></div>
                        
                        <button 
                           onClick={handleLogout}
                           className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                           <LogOut size={16} /> Sair da conta
                        </button>
                     </div>
                   </>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)} 
                className="hidden md:flex bg-white text-dark-900 hover:bg-gray-100 px-6 py-2.5 rounded-full text-sm font-bold transition-all items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                ENTRAR
              </button>
            )}

            {/* Mobile Menu Btn */}
            <button 
              className="md:hidden text-gray-300 p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-900 border-t border-dark-800 p-6 animate-in slide-in-from-top-5">
           <div className="space-y-4">
             <button onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false)}} className="block w-full text-left p-4 rounded-xl bg-dark-800 text-white text-lg font-bold">Início</button>
             {!user && (
                <button onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false)}} className="block w-full text-left p-4 rounded-xl bg-primary-600 text-white font-black shadow-lg shadow-primary-600/20">FAZER LOGIN</button>
             )}
             {user && (
               <>
                <div className="p-4 bg-dark-800/50 border border-dark-700 rounded-xl mb-2 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full" alt="avatar"/> : <UserIcon className="m-2 text-gray-400"/>}
                   </div>
                   <div>
                      <p className="text-white font-bold">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                   </div>
                </div>
                <button onClick={() => { navigateTo('products'); setIsMobileMenuOpen(false)}} className="block w-full text-left p-4 rounded-xl bg-dark-800 text-white font-bold">Produtos</button>
                <button onClick={() => { navigateTo('dashboard'); setIsMobileMenuOpen(false)}} className="block w-full text-left p-4 rounded-xl bg-dark-800 text-primary-500 font-bold border border-primary-500/20">Meus Produtos</button>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false)}} className="block w-full text-left p-4 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 flex items-center gap-2"><LogOut size={18}/> Sair da conta</button>
               </>
             )}
           </div>
        </div>
      )}
    </nav>
  );

  // --- VIEWS ---

  // 1. Home View 
  const HomeView = () => {
    return (
      <div className="bg-dark-900 min-h-screen font-sans selection:bg-primary-500/30">
        
        {/* Hero Section */}
        <div className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-dark-900">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] -z-10"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </span>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Sistema Anti-Bloqueio v2.0</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight mb-8 leading-[1.1] md:leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                   Escale Sua Operação <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-500 to-emerald-400 relative">
                     Sem Interrupções
                     <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary-500 opacity-50" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.3336 2.66663 85.0003 -3.50003 198.001 2.99996" stroke="currentColor" strokeWidth="3"/></svg>
                   </span>
                </h1>
                
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                   Tenha acesso imediato a ativos de contingência premium. Perfis farmados, BMs verificadas e proxies residenciais prontos para rodar.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                   <button 
                     onClick={() => document.getElementById('categorias')?.scrollIntoView({behavior: 'smooth'})}
                     className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)] flex items-center gap-2 group"
                   >
                     Ver Catálogo Oficial
                     <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                   </button>
                   <button 
                     onClick={() => navigateTo('products')}
                     className="px-10 py-5 rounded-full font-bold text-lg text-white border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 backdrop-blur-sm"
                   >
                     <Lock size={18} /> Acesso Restrito
                   </button>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="border-y border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
                {[
                    { number: "24/7", label: "Entrega Automática" },
                    { number: "15k+", label: "Ativos Entregues" },
                    { number: "99.8%", label: "Uptime Garantido" },
                    { number: "4.9/5", label: "Avaliação Média" }
                ].map((stat, i) => (
                    <div key={i} className="py-12 text-center group hover:bg-white/[0.02] transition-colors">
                        <div className="text-3xl md:text-4xl font-black text-white mb-1 group-hover:text-primary-500 transition-colors">{stat.number}</div>
                        <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Categories Section */}
        <section id="categorias" className="max-w-7xl mx-auto px-4 sm:px-6 py-32">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Escolha sua Categoria</h2>
                    <p className="text-gray-400 text-lg max-w-md">Selecione o tipo de ativo que você precisa para escalar sua operação hoje.</p>
                </div>
                <div className="flex items-center gap-2 text-primary-500 font-bold bg-primary-500/10 px-4 py-2 rounded-lg border border-primary-500/20">
                    <Zap size={18} fill="currentColor" /> Estoque Atualizado
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Meta ADS - Featured */}
                <div 
                  onClick={handleCategoryClick}
                  className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-dark-800 border border-white/10 cursor-pointer transition-all duration-500 hover:border-primary-500/50 hover:shadow-[0_0_50px_-20px_rgba(16,185,129,0.3)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-transparent opacity-50"></div>
                    
                    <div className="relative z-10 p-10 flex flex-col md:flex-row items-center h-full gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6">Mais Vendido</div>
                            <h3 className="text-4xl font-black text-white mb-4">Meta Ads Elite</h3>
                            <p className="text-gray-400 font-medium leading-relaxed mb-8">
                                O kit completo para Facebook Ads. Perfis com identidade confirmada, Business Managers ilimitadas e Fanpages com score verde.
                            </p>
                            <button className="bg-white text-dark-900 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
                                Acessar Estoque <ArrowLeft className="rotate-180" size={16}/>
                            </button>
                        </div>
                        <div className="w-full md:w-1/2 relative group-hover:scale-105 transition-transform duration-700 ease-out">
                             <div className="relative aspect-square max-w-[280px] mx-auto">
                                <div className="absolute inset-0 bg-blue-600 blur-[80px] opacity-40 rounded-full animate-pulse"></div>
                                <img src={FB_LOGO} alt="Facebook" className="relative z-10 w-full h-full object-contain drop-shadow-2xl" />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon Grid */}
                <div className="space-y-8">
                    {/* Google Ads */}
                    <div className="relative overflow-hidden rounded-[2rem] bg-dark-800 border border-white/5 p-8 h-[240px] flex flex-col justify-center items-center text-center group hover:bg-dark-700/50 transition-colors">
                         <div className="absolute top-4 right-4 text-gray-600"><Lock size={20} /></div>
                         <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-red-500 mb-6 flex items-center justify-center shadow-lg opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500">
                            <Globe size={32} className="text-white" />
                         </div>
                         <h3 className="text-xl font-bold text-gray-500 group-hover:text-white transition-colors">Google Ads</h3>
                         <p className="text-sm text-gray-600 mt-2 font-medium">Em breve</p>
                    </div>

                    {/* TikTok Ads */}
                    <div className="relative overflow-hidden rounded-[2rem] bg-dark-800 border border-white/5 p-8 h-[240px] flex flex-col justify-center items-center text-center group hover:bg-dark-700/50 transition-colors">
                         <div className="absolute top-4 right-4 text-gray-600"><Lock size={20} /></div>
                         <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-black to-gray-800 mb-6 flex items-center justify-center shadow-lg border border-white/10 opacity-50 group-hover:opacity-100 transition-all duration-500">
                            <TrendingUp size={32} className="text-white" />
                         </div>
                         <h3 className="text-xl font-bold text-gray-500 group-hover:text-white transition-colors">TikTok Ads</h3>
                         <p className="text-sm text-gray-600 mt-2 font-medium">Em breve</p>
                    </div>
                </div>

            </div>
        </section>

        {/* Features Section */}
        <section className="bg-dark-800 border-y border-white/5 py-32 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
             
             <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Por que os grandes players escolhem a AssisAds?</h2>
                    <p className="text-gray-400 text-lg">Não vendemos apenas contas. Entregamos a infraestrutura que você precisa para imprimir dinheiro.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                     {[
                         { 
                           icon: Zap, 
                           title: "Entrega Flash", 
                           desc: "Sistema 100% automatizado. Pagou, recebeu. Sem conversinha, sem espera. 24h por dia." 
                         },
                         { 
                            icon: ShieldCheck, 
                            title: "Garantia Blindada", 
                            desc: "Ativos testados antes da entrega. Se não logar de primeira, trocamos na hora. Sem burocracia." 
                         },
                         { 
                            icon: Users, 
                            title: "Suporte Especializado", 
                            desc: "Time que entende de tráfego. Dúvidas sobre aquecimento? Contingência? Estamos aqui." 
                         }
                     ].map((item, i) => (
                         <div key={i} className="bg-dark-900 rounded-3xl p-8 border border-white/5 hover:border-primary-500/30 transition-colors duration-300">
                             <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6">
                                 <item.icon size={28} />
                             </div>
                             <h3 className="text-xl font-black text-white mb-4">{item.title}</h3>
                             <p className="text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                         </div>
                     ))}
                </div>
             </div>
        </section>

        {/* Testimonials Marquee (Simplified) */}
        <section className="py-24 overflow-hidden bg-dark-900">
             <div className="max-w-7xl mx-auto px-4 mb-12 flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold text-white">4.9/5 baseado em 2.400+ clientes</span>
                  </div>
             </div>
             
             <div className="flex gap-6 overflow-hidden relative">
                <div className="flex gap-6 animate-scroll whitespace-nowrap px-4">
                     {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                         <div key={i} className="w-[350px] bg-dark-800 p-6 rounded-2xl border border-white/5 flex-shrink-0">
                             <div className="flex text-yellow-500 mb-3 gap-0.5">
                                {[...Array(5)].map((_, idx) => <Star key={idx} size={14} fill="currentColor" />)}
                             </div>
                             <p className="text-gray-300 text-sm font-medium whitespace-normal mb-4">"{t.text}"</p>
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                                     {t.name[0]}
                                 </div>
                                 <div>
                                     <div className="text-white font-bold text-sm">{t.name}</div>
                                     <div className="text-gray-500 text-xs font-bold uppercase">{t.role}</div>
                                 </div>
                             </div>
                         </div>
                     ))}
                </div>
             </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4">
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary-900 to-dark-800 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8">Pronto para escalar?</h2>
                    <p className="text-xl text-primary-200 mb-12 max-w-2xl mx-auto">Não deixe sua operação parar por falta de ativos. Crie sua conta agora e tenha acesso imediato.</p>
                    <button 
                      onClick={() => {
                          if (user) navigateTo('products');
                          else setIsAuthModalOpen(true);
                      }}
                      className="bg-white text-primary-900 px-12 py-5 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-2xl"
                    >
                        {user ? 'Acessar Loja' : 'Criar Conta Grátis'}
                    </button>
                </div>
            </div>
        </section>
      </div>
    );
  };

  // 1.5 Products View (New)
  const ProductsView = () => {
    // Basic Security: If somehow accessed without user, show lock screen
    if (!user) {
        return (
            <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-center px-4">
                <Lock size={64} className="text-red-500 mb-6" />
                <h2 className="text-3xl font-black text-white mb-4">Área Restrita</h2>
                <p className="text-xl text-gray-400 mb-8">Faça login para visualizar os produtos disponíveis.</p>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-xl font-bold text-lg"
                >
                    Fazer Login Agora
                </button>
            </div>
        )
    }

    const filteredProducts = filter === 'all' 
      ? PRODUCTS 
      : PRODUCTS.filter(p => p.type.includes(filter));

    return (
      <div className="bg-dark-900 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <button onClick={() => navigateTo('home')} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition font-bold text-lg">
                <ArrowLeft size={24} /> Voltar para Categorias
            </button>

            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                <div>
                    <h2 className="text-4xl font-black text-white mb-2">Meta ADS</h2>
                    <p className="text-xl text-gray-400">Ativos disponíveis para compra imediata.</p>
                </div>
                
                <div className="flex bg-dark-800 p-1.5 rounded-xl border border-dark-700">
                {[
                    {id: 'all', label: 'Todos'},
                    {id: 'facebook', label: 'Perfis'},
                ].map((f) => (
                    <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${
                        filter === f.id 
                        ? 'bg-primary-600 text-white shadow-lg' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    >
                    {f.label}
                    </button>
                ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
            </div>
        </div>
      </div>
    );
  };

  // 2. Checkout View (Updated with PIX & Transaction ID)
  const CheckoutView = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    // Use user email if available, otherwise input
    const [checkoutEmail, setCheckoutEmail] = useState(user?.email || '');
    const [transactionId, setTransactionId] = useState(''); // NEW STATE
    const [copied, setCopied] = useState(false);

    const handleCopyPix = () => {
      navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    const processPayment = async () => {
      if (!checkoutEmail) {
        alert("Por favor insira um e-mail para receber os produtos.");
        return;
      }

      if (!transactionId || transactionId.length < 5) {
          alert("Por favor, insira um ID de transação válido ou código do comprovante para validar seu pagamento.");
          return;
      }

      if (!user) {
         alert("Você precisa estar logado para finalizar a compra.");
         setIsAuthModalOpen(true);
         return;
      }
      
      setLoading(true);
      
      // Simulação de tempo de processamento bancário (1.5 segundos)
      setTimeout(async () => {
        
        // Gera um ID de pedido único baseado no timestamp para evitar colisões
        const orderId = `PED-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 99)}`;
        
        // --- TRANSAÇÃO COM SUPABASE ---
        // 1. Tenta pegar estoque e criar pedido
        const result = await db.processOrderTransaction(
            orderId, 
            user.email, 
            cart, 
            cartTotal
        );

        if (!result.success) {
            setLoading(false);
            alert("Erro no pedido: " + (result.error?.message || "Estoque indisponível ou erro no sistema."));
            return;
        }

        // 2. Tenta enviar email (opcional, não bloqueia)
        if (result.credentials && result.credentials.length > 0) {
            // Recria objeto Order apenas para o email
            const emailOrder: Order = {
                id: orderId,
                date: new Date().toLocaleDateString('pt-BR'),
                items: cart,
                total: cartTotal,
                status: 'completed'
            };
            await sendOrderEmail(user.email, emailOrder, result.credentials);
        }

        // Refresh Orders
        const updatedOrders = await db.getUserOrders(user.email);
        setOrders(updatedOrders);
        
        setLoading(false);
        setCart([]); // Limpa o carrinho do estado
        localStorage.removeItem('assis_cart'); // Limpa do storage
        // REDIRECIONAMENTO DIRETO PARA O DASHBOARD
        navigateTo('dashboard');
      }, 1500);
    };

    if (cart.length === 0 && step === 1) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
          <div className="text-center max-w-md w-full animate-in fade-in zoom-in">
            <div className="bg-dark-800 p-10 rounded-3xl border border-dark-700 shadow-2xl">
              <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500">
                <ShoppingCart size={40} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Carrinho Vazio</h2>
              <p className="text-gray-500 mb-8 text-lg">Adicione ativos para continuar.</p>
              <button onClick={() => navigateTo('home')} className="w-full bg-primary-600 text-white py-4 rounded-xl font-black text-lg hover:bg-primary-500 transition shadow-lg shadow-primary-900/20">
                Voltar à Loja
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-dark-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => navigateTo('home')} 
            className="mb-6 bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 text-base font-bold transition-all border border-dark-700"
          >
            <ArrowLeft size={20} /> Voltar para Loja
          </button>
          
          <div className="bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden flex flex-col md:flex-row shadow-2xl">
            {/* Order Summary */}
            <div className="w-full md:w-5/12 bg-dark-800 p-10 border-b md:border-b-0 md:border-r border-dark-700">
              <h3 className="font-black text-xl text-white mb-8 flex items-center gap-3">
                <ShoppingCart size={24} className="text-primary-500"/> Resumo do Pedido
              </h3>
              <div className="space-y-6 mb-10">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-4 p-4 bg-dark-900/50 rounded-xl border border-dark-700">
                    <div className="flex-1">
                      <p className="text-base font-bold text-gray-200">{item.name}</p>
                      <p className="text-sm text-gray-500 mt-1 font-medium">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-base font-black text-primary-500">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-dark-700 pt-6 flex justify-between items-end">
                <span className="text-gray-400 text-base font-bold">Total a pagar</span>
                <span className="font-black text-3xl text-white">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="w-full md:w-7/12 p-10 bg-dark-900/30">
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="text-2xl font-black text-white mb-8">Pagamento Seguro</h2>
                  
                  <div className="space-y-6 mb-10">
                    <div>
                      <label className="block text-sm font-black text-gray-400 uppercase mb-2">Seu E-mail (Logado)</label>
                      <input 
                        id="email"
                        type="email" 
                        className="w-full bg-dark-900 border border-dark-700 rounded-xl px-5 py-4 text-white text-lg outline-none cursor-not-allowed opacity-70 font-medium" 
                        value={user?.email || ''}
                        readOnly
                      />
                      <span className="text-xs text-green-500 mt-2 font-bold block flex items-center gap-1"><CheckCircle size={12}/> Conta autenticada</span>
                    </div>
                    
                    {/* AREA PIX */}
                    <div className="bg-dark-900 border border-primary-900/50 rounded-2xl p-6 text-center">
                        <p className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-widest">Escaneie o QR Code</p>
                        <div className="bg-white p-3 rounded-xl w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                             {/* QR Code customizável via constantes */}
                             <img src={QR_CODE_IMAGE} alt="QR Code PIX" className="w-full h-full object-contain" />
                        </div>
                        
                        <div className="bg-dark-800 rounded-xl p-3 flex items-center justify-between border border-dark-700 mb-2 gap-2">
                             <span className="text-white font-mono text-xs truncate px-2 text-left opacity-70 break-all select-all">{PIX_KEY}</span>
                             <button onClick={handleCopyPix} className="bg-dark-700 hover:bg-dark-600 p-2 rounded-lg text-white transition flex-shrink-0">
                                 {copied ? <Check size={18} className="text-green-500"/> : <Copy size={18}/>}
                             </button>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-2">Pix Copia-e-cola (Banco Central)</p>
                    </div>

                    {/* Transaction ID Input */}
                    <div>
                      <label className="block text-sm font-black text-gray-400 uppercase mb-2">Comprovante / ID da Transação</label>
                      
                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-3 flex items-start gap-3">
                         <HelpCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                         <div className="text-sm text-blue-200">
                            <p className="font-bold mb-1">Onde encontrar o ID?</p>
                            <p className="text-xs opacity-80 leading-relaxed">No seu comprovante bancário, procure por "ID da Transação" ou "ID Pix". É um código longo que começa com "E" (Ex: E1234...).</p>
                         </div>
                      </div>

                      <input 
                        type="text" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Cole o ID aqui (ex: E123456...)"
                        className="w-full bg-dark-900 border border-dark-600 focus:border-primary-500 rounded-xl px-5 py-4 text-white text-lg outline-none transition-colors font-medium placeholder-gray-600" 
                      />
                      <p className="text-xs text-gray-500 mt-2">Para testar o sistema, você pode digitar "TESTE12345".</p>
                    </div>

                    {/* Fallback WhatsApp */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="h-px bg-dark-700 flex-1"></div>
                        <span className="text-gray-500 text-xs font-bold uppercase">Ou se preferir</span>
                        <div className="h-px bg-dark-700 flex-1"></div>
                    </div>

                    <a 
                       href={`https://wa.me/${WHATSAPP_SUPPORT}?text=Ola, fiz o pagamento do pedido (Total: R$ ${cartTotal.toFixed(2)}) e nao achei o ID. Pode me ajudar?`}
                       target="_blank"
                       rel="noreferrer"
                       className="w-full bg-dark-700 hover:bg-green-600 hover:text-white text-gray-300 font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 border border-dark-600 hover:border-green-500 group"
                    >
                       <MessageCircle size={20} className="group-hover:fill-current"/>
                       Enviar Comprovante no WhatsApp
                    </a>

                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-xl mb-8 flex items-start gap-4">
                     <ShieldCheck className="text-green-500 flex-shrink-0" size={24} />
                     <div>
                       <p className="text-sm font-black text-green-400 mb-1">Liberação Automática</p>
                       <p className="text-xs text-green-500/80 leading-relaxed font-medium">Ao confirmar o ID correto, o sistema libera seu acesso aos produtos imediatamente.</p>
                     </div>
                  </div>

                  <button 
                    onClick={processPayment} 
                    disabled={loading || !transactionId}
                    className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-black py-5 rounded-xl shadow-lg shadow-primary-900/20 transition-all flex justify-center items-center gap-3 text-lg group"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                        Verificando ID...
                      </>
                    ) : (
                      <>
                        Confirmar Pagamento
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-10 animate-in zoom-in duration-300 h-full flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-green-500/30">
                    <CheckCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Pagamento Aprovado!</h2>
                  <p className="text-gray-400 mb-10 max-w-xs mx-auto text-base font-medium">As credenciais foram enviadas para <b>{checkoutEmail}</b> e estão disponíveis no seu painel.</p>
                  <div className="flex flex-col w-full gap-4">
                    <button onClick={() => navigateTo('dashboard')} className="w-full bg-dark-700 hover:bg-dark-600 text-white px-6 py-4 rounded-xl font-bold transition border border-dark-600 flex items-center justify-center gap-2 text-lg">
                      <Terminal size={20} />
                      Acessar Credenciais
                    </button>
                    <button onClick={() => navigateTo('home')} className="w-full text-gray-500 hover:text-white text-base font-bold transition">
                      Voltar à Loja
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    
    // Função Real de Download
    const handleDownload = (order: Order) => {
      if (!order.credentials || order.credentials.length === 0) {
        alert("Erro: Nenhuma credencial encontrada para este pedido.");
        return;
      }

      // Cria o conteúdo do arquivo
      const header = `--- PEDIDO ${order.id} ---\nDATA: ${order.date}\nPRODUTO: ${order.items.map(i => i.name).join(', ')}\n\n`;
      const creds = order.credentials.join('\n\n');
      const footer = `\n\n--- OBRIGADO PELA COMPRA NA ASSIS ADS ---`;
      
      const fileContent = header + creds + footer;

      // Cria um Blob e dispara o download
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assis-ads-pedido-${order.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          <button onClick={() => navigateTo('home')} className="mb-6 md:hidden text-gray-400 flex items-center gap-1 text-sm font-bold"><ChevronLeft size={16}/> Voltar para Loja</button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 bg-dark-800/50 p-8 rounded-3xl border border-dark-700">
            <div>
              <h1 className="text-3xl font-black text-white">Painel do Cliente</h1>
              <p className="text-gray-500 text-base font-medium mt-1">Olá, <span className="text-white">{user?.name}</span>. Baixe suas contas abaixo.</p>
            </div>
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-500/10 px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors border border-transparent hover:border-red-500/20">
              <LogOut size={18} /> Sair da conta
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="bg-dark-800 p-8 rounded-3xl border border-dark-700 shadow-lg">
                <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-2">Investimento Total</p>
                <p className="text-4xl font-black text-white tracking-tight">R$ {orders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}</p>
              </div>
              <div className="bg-dark-800 p-8 rounded-3xl border border-dark-700 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <ShieldCheck size={64} className="text-primary-500" />
                </div>
                <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-2">Ativos Comprados</p>
                <p className="text-4xl font-black text-primary-500 tracking-tight">
                  {orders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
                </p>
              </div>
            </div>

            {/* Orders Table */}
            <div className="lg:col-span-3 bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden shadow-lg min-h-[400px]">
              <div className="p-8 border-b border-dark-700 flex justify-between items-center">
                <h2 className="font-black text-white text-xl">Histórico de Pedidos</h2>
                <div className="text-xs font-bold text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sincronizado</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-dark-900 text-gray-400 uppercase font-bold text-xs">
                    <tr>
                      <th className="px-8 py-5">ID</th>
                      <th className="px-8 py-5">Data</th>
                      <th className="px-8 py-5">Itens</th>
                      <th className="px-8 py-5">Total</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-4">
                             <Box size={48} className="opacity-20" />
                             <p className="text-lg font-medium">Nenhuma compra realizada ainda.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-dark-700/50 transition-colors group">
                          <td className="px-8 py-5 font-mono text-gray-300 font-bold">{order.id}</td>
                          <td className="px-8 py-5 text-gray-500 font-medium">{order.date}</td>
                          <td className="px-8 py-5">
                            {order.items.map(i => (
                               <div key={i.id} className="text-gray-300 font-bold mb-1 flex items-center gap-2">
                                  <span className="text-xs bg-dark-900 px-2 py-0.5 rounded text-gray-400 border border-dark-600">{i.quantity}x</span>
                                  {i.name}
                               </div>
                            ))}
                          </td>
                          <td className="px-8 py-5 font-black text-white">R$ {order.total.toFixed(2)}</td>
                          <td className="px-8 py-5">
                            <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-lg text-xs font-black border border-green-500/20 uppercase">Aprovado</span>
                          </td>
                          <td className="px-8 py-5">
                            <button 
                              onClick={() => handleDownload(order)}
                              className="bg-white hover:bg-gray-200 text-dark-900 px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black transition-all shadow hover:shadow-lg uppercase tracking-wide group-hover:scale-105"
                            >
                              <Download size={14} /> BAIXAR CONTAS
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- DRAWER ---
  const CartDrawer = () => {
    return (
      <div className={`fixed inset-0 z-50 ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setIsCartOpen(false)}
        />
        
        <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-dark-800 shadow-2xl border-l border-dark-700 transform transition-transform duration-300 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b border-dark-700 flex items-center justify-between bg-dark-900">
            <h2 className="text-xl font-black text-white flex items-center gap-3"><ShoppingCart size={24} className="text-primary-500"/> Seu Carrinho</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-dark-700 rounded-full text-gray-400 hover:text-white transition"><X size={24}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                 <ShoppingCart size={64} className="mb-6 opacity-20" />
                 <p className="text-lg font-medium">Carrinho vazio</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-4 p-4 bg-dark-900 rounded-2xl border border-dark-700">
                  <div className="w-20 h-20 rounded-xl bg-dark-800 overflow-hidden flex-shrink-0">
                     <img src={item.image} alt="" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-white line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase">{item.type}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-black text-primary-500 text-lg">R$ {item.price.toFixed(2)}</span>
                      <div className="flex items-center gap-3 bg-dark-800 rounded-lg px-2 py-1 border border-dark-700">
                        <span className="text-sm text-gray-300 font-mono font-bold px-1">{item.quantity}x</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-400 transition p-1"><X size={16}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-dark-700 bg-dark-900">
            <div className="flex justify-between mb-6">
               <span className="text-gray-400 font-bold">Total</span>
               <span className="text-2xl font-black text-white">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => { setIsCartOpen(false); navigateTo('checkout'); }}
              disabled={cart.length === 0}
              className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-black py-5 rounded-xl transition-all shadow-lg shadow-primary-900/20 active:scale-95 text-lg"
            >
              Finalizar Agora
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AuthModal = () => {
    if (!isAuthModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
        <div className="bg-dark-800 rounded-3xl w-full max-w-md p-10 relative border border-dark-700 shadow-2xl animate-in zoom-in-95 duration-200">
          <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition">
            <X size={28} />
          </button>
          
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-dark-700 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-dark-600">
               <UserIcon className="text-primary-500" size={32} />
             </div>
             <h2 className="text-3xl font-black text-white">{authMode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</h2>
             <p className="text-gray-500 text-base mt-2 font-medium">Faça login para ver os produtos secretos.</p>
          </div>

          <div className="space-y-4">
             {/* Simple Toggle */}
             <div className="flex bg-dark-900 p-1 rounded-xl mb-4">
               <button 
                 onClick={() => setAuthMode('login')}
                 className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-dark-700 text-white shadow' : 'text-gray-500'}`}
               >
                 Entrar
               </button>
               <button 
                 onClick={() => setAuthMode('register')}
                 className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-dark-700 text-white shadow' : 'text-gray-500'}`}
               >
                 Cadastrar
               </button>
             </div>

             {authError && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold text-center">
                 {authError}
               </div>
             )}

            <form onSubmit={handleAuthSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">E-mail</label>
                <input name="email" type="email" required className="w-full bg-dark-900 border border-dark-600 rounded-xl px-5 py-4 text-white focus:border-primary-500 outline-none transition-colors font-medium text-lg" placeholder="cliente@email.com" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Senha</label>
                <input name="password" type="password" required minLength={6} className="w-full bg-dark-900 border border-dark-600 rounded-xl px-5 py-4 text-white focus:border-primary-500 outline-none transition-colors font-medium text-lg" placeholder="******" />
              </div>
              <button disabled={authLoading} type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-primary-900/20 mt-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center">
                {authLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (authMode === 'login' ? 'Acessar com E-mail' : 'Criar Conta')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const Footer = () => (
    <footer className="bg-dark-900 border-t border-dark-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center gap-2 mb-4">
                  <Box className="text-primary-500" />
                  <span className="font-black text-xl text-white">ASSIS<span className="text-primary-500">ADS</span></span>
               </div>
               <p className="text-gray-500 text-sm leading-relaxed font-medium">
                 A maior plataforma de ativos digitais para contingência do Brasil. Qualidade e suporte que sua operação merece.
               </p>
            </div>
            
            <div>
              <h4 className="text-white font-black mb-6 uppercase tracking-wider text-sm">Produtos</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li className="hover:text-primary-500 cursor-pointer transition">Perfis Farmados</li>
                <li className="hover:text-primary-500 cursor-pointer transition">BMs Ilimitadas</li>
                <li className="hover:text-primary-500 cursor-pointer transition">Proxy 4G BR</li>
                <li className="hover:text-primary-500 cursor-pointer transition">Contas TikTok</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li className="hover:text-primary-500 cursor-pointer transition">Termos de Uso</li>
                <li className="hover:text-primary-500 cursor-pointer transition">Política de Reembolso</li>
                <li className="hover:text-primary-500 cursor-pointer transition">Garantia</li>
                <li className="hover:text-primary-500 cursor-pointer transition">Contato</li>
              </ul>
            </div>

            <div>
               <h4 className="text-white font-black mb-6 uppercase tracking-wider text-sm">Pagamento</h4>
               <div className="flex gap-3">
                  <div className="bg-dark-800 p-3 rounded-lg border border-dark-700 text-gray-400"><QrCode size={24}/></div>
                  <div className="bg-dark-800 p-3 rounded-lg border border-dark-700 text-gray-400"><CreditCard size={24}/></div>
               </div>
               <p className="text-xs text-gray-600 mt-6 font-bold">CNPJ: 00.000.000/0001-00</p>
            </div>
         </div>
         
         <div className="border-t border-dark-800 pt-8 text-center text-gray-600 text-sm font-medium">
            © 2024 AssisAds Store. Todos os direitos reservados.
         </div>
      </div>
    </footer>
  );

  return (
    <div className="bg-dark-900 text-gray-100 font-sans min-h-screen flex flex-col">
       <div className="flex-1">
         {view !== 'dashboard' && <Navbar />}
         
         {view === 'home' && <HomeView />}
         {view === 'products' && <ProductsView />}
         {view === 'checkout' && <CheckoutView />}
         {view === 'dashboard' && <DashboardView />}
       </div>

       {view !== 'dashboard' && <Footer />}
       
       <CartDrawer />
       <AuthModal />
       <ChatWidget />
    </div>
  );
}
