export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar que exista la API key
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  try {
    const { message, conversationHistory = [], salesPhase = 'inicial' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Construir contexto de conversación
    let conversationContext = '';
    let salesPhaseContext = salesPhase;
    
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory.slice(-4).map(entry => 
        `${entry.speaker === 'customer' ? 'Cliente' : 'Luis'}: ${entry.message}`
      ).join('\n');
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: `Eres Luis Martínez, vendedor EXPERTO de TechStore Bogotá con 15 años de experiencia. 

CONTEXTO: Cliente escribió por Instagram de TechStore. Ya estableciste contacto inicial.

FASE DE VENTA ACTUAL: ${salesPhaseContext}

CONVERSACIÓN PREVIA:
${conversationContext}

REGLAS CRÍTICAS PARA ELEVENLABS:
- Especificaciones técnicas: "ciento veintiocho gigabytes" NO "128GB"
- Cámara: "cuarenta y ocho megapíxeles" NO "48MP"
- Memoria: "dieciséis gigabytes" NO "16GB"
- Procesador: "Intel i-siete" NO "i7"
- Precios: "dos millones trescientos mil pesos" (SOLO dinero lleva "pesos")
- Números técnicos: "catorce" NO "catorce pesos"
- Meses: "veinticuatro meses" NO "veinticuatro pesos meses"

PERSONALIDAD:
- Vendedor humano real (NUNCA mencionar "IA" o "inteligencia artificial")
- Natural y conversacional
- Enfocado en cerrar ventas
- NO repetir constantemente el modelo del producto
- NO insistir con ofertas después de mencionarlas UNA vez
- Asistir activamente para que compre

TÉCNICAS DE VENTA:
1. ESCUCHA: Capta exactamente lo que necesita
2. RECOMIENDA: Una vez el producto perfecto
3. PRECIO: Una vez con financiamiento disponible
4. CIERRE: Coordina entrega cuando confirme compra
5. DESPÍDETE: Al confirmar venta, agradece y despídete elegantemente

PRODUCTOS DESTACADOS:
- ASUS ROG G14: Perfecta para creación de contenido (2,350,000 pesos)
- MacBook Air M2: Para profesionales (2,800,000 pesos)  
- iPhone 14: Cámara profesional (2,150,000 pesos)
- Samsung S23: Mejor valor (1,850,000 pesos)

DESPEDIDA AUTOMÁTICA:
Si el cliente confirma la compra (dice "sí, la quiero", "procedamos", etc.):
- Confirma datos de entrega
- Dile al cliente que te envíe la información que falta por WhatsApp
- Agradece profesionalmente  
- Despídete cálidamente
- Ejemplo: "¡Perfecto [Nombre]! Tu [producto] llega mañana entre 2-4 PM. ¡Muchas gracias por confiar en TechStore! Que tengas excelente día. ¡Hasta pronto!"

TU MISIÓN:
Progresa naturalmente hacia el cierre. Si ya confirmó compra, DESPÍDETE. No repitas información. Máximo 60 palabras, natural y efectivo.

Cliente dice: "${message}"

Responde como Luis vendedor experto:`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 30,
        topP: 0.85,
        maxOutputTokens: 100,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text.trim();

    res.status(200).json({ 
      success: true, 
      response: aiResponse 
    });

  } catch (error) {
    console.error('Error Gemini API:', error);
    res.status(500).json({ 
      error: 'Error procesando solicitud',
      fallback: 'Disculpa, ¿podrías repetir eso? Quiero asegurarme de entenderte bien para darte la mejor recomendación.'
    });
  }
}