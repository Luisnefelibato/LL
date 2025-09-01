export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar que exista la API key
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'ucWwAruuGtBeHfnAaKcJ';
  
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key no configurada' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto requerido' });
    }

    if (text.length > 500) {
      return res.status(400).json({ error: 'Texto muy largo (máximo 500 caracteres)' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.75,
          style: 0.4
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Obtener el audio como ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convertir a Base64 para enviar al cliente
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    res.status(200).json({ 
      success: true, 
      audioBase64: base64Audio,
      contentType: 'audio/mpeg'
    });

  } catch (error) {
    console.error('Error ElevenLabs API:', error);
    res.status(500).json({ 
      error: 'Error generando audio',
      fallback: true
    });
  }
}