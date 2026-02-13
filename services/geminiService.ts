import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o 'Atendente Virtual' da AssisAds Store.
Vendemos ativos digitais de alta qualidade para contingência em marketing digital (Facebook Ads, TikTok Ads).
Seu objetivo é responder dúvidas de clientes de forma rápida, em PORTUGUÊS (Brasil).
Tom: Profissional, direto, "do mercado" (pode usar termos como escala, block, aquecimento).

Informações Chave:
- Perfis Farmados: Perfis reais aquecidos, prontos para anunciar.
- BMs: Business Managers verificadas ou ilimitadas.
- Proxies 4G: IPs residenciais móveis do Brasil (Vivo/Claro), rotativos.
- Entrega: 100% automática via Dashboard e E-mail após pagamento.
- Pagamento: PIX (Aprovação imediata).
- Garantia: 24h para login e verificação do ativo.

Se perguntarem de desconto, ofereça o cupom 'PRIMEIRACOMPRA' para 5% OFF.
Mantenha as respostas curtas.
`;

export const sendMessageToGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Estou com dificuldade de conexão no momento. Tente novamente em instantes.";
  }
};
