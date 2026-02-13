
import emailjs from '@emailjs/browser';
import { Order } from '../types';

// Busca configurações da Vercel
const SERVICE_ID = import.meta.env?.VITE_EMAIL_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env?.VITE_EMAIL_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env?.VITE_EMAIL_PUBLIC_KEY || '';

export const sendOrderEmail = async (userEmail: string, order: Order, credentials: string[]) => {
  // Se não tiver configurado, apenas loga e retorna sucesso (para não travar a venda)
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      console.warn("EmailJS não configurado na Vercel. Pulando envio de e-mail.");
      return { success: true, warning: 'Email not configured' };
  }

  try {
    // Formata as credenciais para o corpo do email
    const credentialsText = credentials.join('\n\n--------------------------------\n\n');
    const productsList = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

    const templateParams = {
      to_name: userEmail.split('@')[0], 
      to_email: userEmail,              
      order_id: order.id,               
      product: productsList,            
      valor: `R$ ${order.total.toFixed(2)}`, 
      login: credentialsText,           
      link: window.location.origin + '/dashboard' 
    };

    console.log("Enviando e-mail via EmailJS...", templateParams);

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('E-mail enviado com sucesso!', response.status, response.text);
    return { success: true };

  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return { success: false, error };
  }
};
