# Tema Vertex — Shopify (alta conversão para dropshipping)

Tema original para Shopify (Online Store 2.0), feito do zero e pensado para conversão:
carregamento rápido, layout pensado primeiro para o celular e todas as seções editáveis
pelo editor visual da Shopify, sem mexer em código.

## Como instalar

1. Baixe o arquivo **`vertex-theme.zip`**.
2. No painel da Shopify, vá em **Loja virtual → Temas**.
3. Em "Biblioteca de temas", clique em **Adicionar tema → Fazer upload de arquivo zip**.
4. Selecione o `vertex-theme.zip`.
5. Clique em **Personalizar** para editar e depois em **Publicar**.

## Recursos de conversão

### Página de produto
- Galeria com deslizar no celular, setas e miniaturas (suporta vídeo)
- Estrelas de avaliação (integradas com Judge.me, Loox, Yotpo etc.)
- Preço com valor riscado, selo **-XX%** e "Você economiza R$ X"
- Parcelamento ("12x de R$ X sem juros") e desconto no Pix
- **Contador regressivo** da promoção (some sozinho quando a promoção acaba)
- **Alerta de estoque baixo** com barra, usando o estoque real
- Seletor de variantes em botões e amostras de cor
- **Ofertas por quantidade** ("Compre 2 e economize 10%") com selo "MAIS VENDIDO"
- Botão de compra com animação de pulso
- **Previsão de entrega** com datas calculadas automaticamente
- Selos de garantia, formas de pagamento e lista de benefícios
- Abas recolhíveis (descrição, envio, troca)
- **Barra fixa de compra** que aparece ao rolar a página
- Suporte a blocos de apps (avaliações, etc.)

### Carrinho
- **Carrinho lateral** que abre sem recarregar a página
- **Barra de progresso de frete grátis**
- **Produto sugerido (upsell)** dentro do carrinho
- Selos de compra segura e ícones de pagamento

### Loja
- Barra de avisos com letreiro rolando
- Cabeçalho fixo com menu suspenso e menu lateral no celular
- Banner principal com imagem separada para celular
- Coleção em destaque (vira carrossel no celular)
- Lista de categorias (círculos ou quadrados)
- Selos de confiança
- Imagem com texto + lista de benefícios
- **Tabela comparativa** ("Nós x Outros")
- Depoimentos com selo de compra verificada
- Perguntas frequentes (com dados estruturados para o Google)
- Banner de contagem regressiva (Black Friday, etc.)
- Newsletter
- Filtros e ordenação nas coleções
- Botão flutuante de WhatsApp
- Animações suaves ao rolar

## Configurações importantes depois de instalar

| O quê | Onde |
| --- | --- |
| Cores, fontes e arredondamento | Personalizar → Configurações do tema |
| Valor do frete grátis da barra | Configurações do tema → Carrinho (use o mesmo valor de *Configurações → Frete*) |
| Produto sugerido no carrinho | Configurações do tema → Carrinho |
| Número do WhatsApp | Configurações do tema → Redes sociais e contato |
| Descontos das ofertas por quantidade | **Descontos → Criar desconto automático** (ex.: "Compre 2, ganhe 10%") |
| Contador da oferta | Página de produto → bloco "Contador da oferta" → data de término (ex.: `2026-12-31T23:59`) |
| Alerta de estoque | Ative "Acompanhar quantidade" no estoque do produto |
| Estrelas de avaliação | Instale um app de avaliações (Judge.me é gratuito) |
| Filtros da coleção | Instale o app gratuito **Search & Discovery** da Shopify |

## Boas práticas (e legais)

- Use somente **depoimentos e avaliações reais**. Avaliações falsas violam o Código de Defesa do
  Consumidor e as políticas da Shopify, e podem fazer a loja ser suspensa.
- Coloque no contador apenas **promoções reais**, com data de término verdadeira.
- Mantenha visíveis as políticas de troca (7 dias pelo CDC), privacidade e o CNPJ no rodapé.

## Estrutura

```
layout/      → estrutura base (theme.liquid)
templates/   → páginas (JSON, editáveis pelo editor)
sections/    → seções arrastáveis
snippets/    → componentes reutilizáveis
assets/      → theme.css e theme.js (sem bibliotecas externas)
config/      → configurações do tema
locales/     → textos em português e inglês
```

O tema foi validado com o **Shopify Theme Check** (verificador oficial) e não apresentou erros.
