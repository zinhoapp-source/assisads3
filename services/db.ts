
import { supabase, isSupabaseConfigured } from './supabase';
import { User, Order, CartItem } from '../types';

// --- FALLBACK (MODO DEMONSTRAÇÃO) ---
const STORAGE_KEYS = {
  USERS: 'assis_users_local',
  SESSION: 'assis_session_local',
  ORDERS: 'assis_orders_local'
};

const mockStock = [
  "MOCK ACCOUNT | Login: demo_user | Pass: 123 | 2FA: ABC",
  "MOCK ACCOUNT | Login: demo_ads | Pass: 123 | 2FA: XYZ"
];

// --- MOCK HELPERS (FUNÇÕES LOCAIS) ---
const signUpMock = (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.find((u: any) => u.email === email)) {
      return { data: null, error: { message: "Usuário já existe (Demo)" } };
    }
    const newUser = { id: Date.now().toString(), email };
    users.push({ ...newUser, password });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user: newUser }));
    return { data: { user: newUser, session: { user: newUser } }, error: null };
};

const signInMock = (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ user }));
      return { data: { user, session: { user } }, error: null };
    }
    return { data: null, error: { message: "Credenciais inválidas (Demo)" } };
};

// --- AUTENTICAÇÃO DE USUÁRIOS (LOGIN/CADASTRO) ---

export const signUp = async (email: string, password: string) => {
  if (isSupabaseConfigured()) {
    // Tenta criar no Supabase
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password
    });

    // Se der erro de "Muitas Tentativas" (Rate Limit), usa o fallback local
    if (error && (error.status === 429 || error.message.includes('rate limit') || error.message.includes('security purposes'))) {
        console.warn("⚠️ Supabase Rate Limit: Alternando para Modo Local temporariamente.");
        return signUpMock(email, password);
    }

    return { data, error };
  } else {
    return signUpMock(email, password);
  }
};

export const signIn = async (email: string, password: string) => {
  if (isSupabaseConfigured()) {
    // Tenta login no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // Se der erro de "Muitas Tentativas", usa o fallback local
    if (error && (error.status === 429 || error.message.includes('rate limit') || error.message.includes('security purposes'))) {
        console.warn("⚠️ Supabase Rate Limit: Alternando para Modo Local temporariamente.");
        return signInMock(email, password);
    }

    return { data, error };
  } else {
    return signInMock(email, password);
  }
};

export const signOut = async () => {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  return { error: null };
};

export const getCurrentUser = async (): Promise<User | null> => {
  // 1. Tenta recuperar sessão do Supabase primeiro
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Cliente',
          avatar: session.user.user_metadata?.avatar_url,
          role: 'user'
        };
    }
  }

  // 2. Se não houver sessão Supabase (ou se estivermos no fallback local), verifica LocalStorage
  const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.email.split('@')[0],
      role: 'user'
    };
  }
  
  return null;
};

// --- SISTEMA DE ENTREGA INTELIGENTE (SEM DUPLICIDADE) ---

export const processOrderTransaction = async (orderId: string, email: string, cartItems: CartItem[], total: number) => {
  
  // 1. Se Supabase estiver configurado E o usuário for do Supabase (não local), usa lógica real
  // Precisamos verificar se a sessão atual é Supabase para não dar erro de permissão
  const isSupabaseSession = (await supabase.auth.getSession()).data.session !== null;

  if (isSupabaseConfigured() && isSupabaseSession) {
    const assignedCredentials: string[] = [];
    
    try {
      console.log(`[Supabase] Processando pedido ${orderId} para ${email}...`);

      // Para cada tipo de produto no carrinho (ex: 2 facebook, 1 proxy)
      for (const item of cartItems) {
        
        // A. Busca X itens deste tipo que NÃO FORAM VENDIDOS (is_sold = false)
        const { data: stockItems, error: stockError } = await supabase
          .from('stock')
          .select('id, content')
          .eq('type', item.type) // Filtra pelo tipo (facebook, tiktok, etc)
          .eq('is_sold', false)  // FUNDAMENTAL: Só pega o que não foi vendido
          .limit(item.quantity); // Pega apenas a quantidade comprada

        if (stockError) throw new Error("Erro ao buscar estoque: " + stockError.message);
        
        // B. Valida se tem estoque suficiente
        if (!stockItems || stockItems.length < item.quantity) {
            throw new Error(`Estoque insuficiente para ${item.name}. Disponível: ${stockItems?.length || 0}`);
        }

        // C. Marca estes itens específicos como VENDIDOS
        const idsToSell = stockItems.map(s => s.id);
        const { error: updateError } = await supabase
          .from('stock')
          .update({ 
            is_sold: true,       // Trava o item
            sold_to_email: email, // Registra o dono
            order_id: orderId     // Registra o pedido
          })
          .in('id', idsToSell);  // Atualiza apenas estes IDs

        if (updateError) throw new Error("Erro ao dar baixa no estoque: " + updateError.message);

        // D. Adiciona as credenciais na lista de entrega
        stockItems.forEach(s => assignedCredentials.push(s.content));
      }

      // 2. Salva o Pedido Completo no Histórico
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          user_email: email,
          total: total,
          items: cartItems,
          credentials: assignedCredentials, // Salva o que foi entregue no JSON
          status: 'completed'
        }]);

      if (orderError) throw new Error("Erro ao salvar pedido: " + orderError.message);

      return { success: true, credentials: assignedCredentials };

    } catch (error: any) {
      console.error("Erro na transação:", error);
      return { success: false, error };
    }
  } 
  
  // 2. Fallback (Modo Demo/Local)
  else {
    console.warn("MOCK TRANSACTION: Usando modo local (Rate Limit ou Demo).");
    const quantity = cartItems.reduce((acc, i) => acc + i.quantity, 0);
    const fakeCreds = [];
    for(let i=0; i<quantity; i++) fakeCreds.push(mockStock[i % mockStock.length]);
    
    // Salva localmente
    const newOrder = {
        id: orderId,
        created_at: new Date().toISOString(),
        user_email: email,
        total,
        items: cartItems,
        credentials: fakeCreds,
        status: 'completed'
    };
    const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    localOrders.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(localOrders));

    return { success: true, credentials: fakeCreds };
  }
};

export const getUserOrders = async (email: string): Promise<Order[]> => {
  const isSupabaseSession = (await supabase.auth.getSession()).data.session !== null;

  if (isSupabaseConfigured() && isSupabaseSession) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    
    return data.map(d => ({
      id: d.id,
      date: new Date(d.created_at).toLocaleDateString('pt-BR'),
      items: d.items,
      total: d.total,
      status: d.status,
      credentials: d.credentials
    }));
  } else {
    const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    return localOrders.filter((o: any) => o.user_email === email).reverse();
  }
};
