
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (dev/prod)
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Garante que a chave da API do Gemini esteja disponível no código final
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
