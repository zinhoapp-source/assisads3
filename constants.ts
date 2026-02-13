
import { Product } from './types';

// CONFIGURAÇÕES GERAIS

// ⚠️ IMPORTANTE: Substitua a chave abaixo pela sua chave PIX Copia e Cola real.
// Para gerar uma, use o app do seu banco > Área Pix > Receber > Gerar QR Code.
export const PIX_KEY = "00020126360014BR.GOV.BCB.PIX0114+5521982961547520400005303986540570.005802BR5901N6001C62070503***630474CD"; 
export const PIX_TYPE = "COPIA E COLA"; 

// Número de Suporte (WhatsApp) - Substitua pelo seu
export const WHATSAPP_SUPPORT = "5521982961547"; 

// Gera o QR Code baseado na string exata do PIX Copia e Cola
export const QR_CODE_IMAGE = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(PIX_KEY);

// Imagem do Logo do Facebook
export const FB_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png";

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Perfil Facebook Aquecido',
    description: 'Perfil com alta resistência, aquecido com atividade real e pronto para subir campanhas.',
    type: 'facebook',
    price: 70.00,
    originalPrice: 110.00,
    features: ['Marketplace Ativo', 'Identidade Confirmada', 'Cookies + 2FA', 'Pronto para Anunciar'],
    image: FB_LOGO,
    stock: 45, // Visual only for now, real stock is in Supabase
    rating: 5.0,
    badge: 'Alta Resistência'
  }
];

export const TESTIMONIALS = [
  {
    name: "Carlos Mendes",
    role: "Gestor de Tráfego",
    text: "O perfil de R$ 70,00 é o melhor custo benefício. Subi campanha de conversão e não caiu.",
    rating: 5
  },
  {
    name: "Agência Alpha",
    role: "Marketing",
    text: "Comprei 10 unidades e todos logaram perfeitamente. O suporte é excelente.",
    rating: 5
  },
  {
    name: "Lucas P.",
    role: "Dropshipper",
    text: "Entrega automática funcionou na hora. Já estou rodando ads.",
    rating: 5
  }
];

// --- AVISO DE CONFIGURAÇÃO ---
// O estoque agora é gerenciado pelo SUPABASE.
// Adicione suas contas na tabela 'stock' no painel do Supabase.
// Colunas: content (login|senha), type (facebook), is_sold (false)
