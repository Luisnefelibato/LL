 class LuisSistemaCompleto {
            constructor() {
                // APIs - REEMPLAZA CON TUS CLAVES REALES
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'ucWwAruuGtBeHfnAaKcJ';
                
                // Estados principales
                this.isCallActive = false;
                this.isLuisSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Control de audio y reconocimiento
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                this.microphoneTimer = null;
                
                // Datos de conversación y CRM
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                this.clientName = null;
                this.salesPhase = 'inicial';
                this.currentClient = null;
                
                // Base de datos CRM
                this.clientsDatabase = [];
                this.callsDatabase = [];
                this.reportsDatabase = [];
                
                // Elementos DOM
                this.initializeDOMElements();
                this.initializeSystem();
                this.initializeMatrixBackground();
                this.loadDatabaseFromStorage();
            }

            initializeDOMElements() {
                this.callButton = document.getElementById('callButton');
                this.volumeButton = document.getElementById('volumeButton');
                this.stopButton = document.getElementById('stopButton');
                this.callStatus = document.getElementById('callStatus');
                this.conversationDisplay = document.getElementById('conversationDisplay');
                this.transcript = document.getElementById('transcript');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                this.micIndicator = document.getElementById('micIndicator');
                
                // Estadísticas
                this.responseTimeEl = document.getElementById('responseTime');
                this.interactionsEl = document.getElementById('interactions');
                this.micStatusEl = document.getElementById('micStatus');
                this.luisStatusEl = document.getElementById('luisStatus');
                
                // CRM Elements
                this.totalClientsEl = document.getElementById('totalClients');
                this.callsTodayEl = document.getElementById('callsToday');
                this.conversionRateEl = document.getElementById('conversionRate');
                this.salesMonthEl = document.getElementById('salesMonth');
            }

            initializeSystem() {
                console.log('🚀 Inicializando Luis IA System...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('🤖 Sistema IA listo - Micrófono siempre activo', 'waiting');
                this.updateMicrophoneStatus(false);
                this.updateCRMDashboard();
                console.log('✅ Sistema IA inicializado correctamente');
            }

            initializeMatrixBackground() {
                const matrixBg = document.getElementById('matrixBg');
                const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                let matrix = '';
                
                for (let i = 0; i < 2000; i++) {
                    matrix += chars.charAt(Math.floor(Math.random() * chars.length));
                    if (i % 80 === 0) matrix += '<br>';
                }
                
                matrixBg.innerHTML = matrix;
            }

            // === CONTROL DE ESTADOS ===
            updateCallStatus(message, type) {
                this.callStatus.textContent = message;
                this.callStatus.className = `call-status ${type}`;
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
                this.micStatusEl.textContent = active ? 'ON' : 'OFF';
                this.micIndicator.className = `microphone-indicator ${active ? 'active' : ''}`;
                
                if (active) {
                    console.log('🎤 Micrófono activado');
                } else {
                    console.log('🔇 Micrófono desactivado');
                }
            }

            updateLuisStatus(status) {
                this.luisStatusEl.textContent = status;
            }

            updateStats() {
                this.interactionsEl.textContent = this.interactionCount;
            }

            updateCRMDashboard() {
                this.totalClientsEl.textContent = this.clientsDatabase.length;
                
                const today = new Date().toDateString();
                const callsToday = this.callsDatabase.filter(call => 
                    new Date(call.date).toDateString() === today
                ).length;
                this.callsTodayEl.textContent = callsToday;
                
                const successCalls = this.callsDatabase.filter(call => call.result === 'success').length;
                const conversionRate = this.callsDatabase.length > 0 
                    ? Math.round((successCalls / this.callsDatabase.length) * 100) 
                    : 0;
                this.conversionRateEl.textContent = `${conversionRate}%`;
                
                const thisMonth = new Date().getMonth();
                const salesThisMonth = this.callsDatabase
                    .filter(call => new Date(call.date).getMonth() === thisMonth && call.result === 'success')
                    .reduce((total, call) => total + (call.saleAmount || 0), 0);
                this.salesMonthEl.textContent = `$${salesThisMonth.toLocaleString()}`;
            }

            // === CONFIGURACIÓN DE EVENTOS ===
            setupEventListeners() {
                this.callButton.addEventListener('click', () => {
                    if (this.isCallActive) {
                        this.endCall();
                    } else {
                        this.startCall();
                    }
                });

                this.volumeButton.addEventListener('click', () => {
                    this.toggleVolume();
                });

                this.stopButton.addEventListener('click', () => {
                    this.stopAudio();
                });
            }

            // === RECONOCIMIENTO DE VOZ OPTIMIZADO ===
            initializeVoiceRecognition() {
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.error('❌ Reconocimiento de voz no soportado');
                    return;
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'es-ES';
                this.recognition.maxAlternatives = 1;

                this.recognition.onstart = () => {
                    console.log('🎤 Reconocimiento iniciado');
                    this.updateMicrophoneStatus(true);
                    this.updateCallStatus('🎧 Luis escucha - Habla cuando quieras', 'listening');
                    this.finalTranscript = '';
                    this.interimTranscript = '';
                };

                this.recognition.onresult = (event) => {
                    this.interimTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        
                        if (event.results[i].isFinal) {
                            this.finalTranscript += transcript + ' ';
                        } else {
                            this.interimTranscript += transcript;
                        }
                    }
                    
                    const currentText = this.finalTranscript + this.interimTranscript;
                    if (currentText.trim()) {
                        this.transcript.textContent = `🎤 "${currentText.trim()}"`;
                    }
                    
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        if (this.finalTranscript.trim()) {
                            this.processUserInput();
                        }
                    }, 1500);
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Error reconocimiento:', event.error);
                    clearTimeout(this.silenceTimer);
                    this.updateMicrophoneStatus(false);
                    
                    if (this.isCallActive && !this.isLuisSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.updateMicrophoneStatus(false);
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isLuisSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            // === CONTROL DE MICRÓFONO PERFECTO ===
            activateMicrophone() {
                if (!this.isCallActive || this.isLuisSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
                    return;
                }

                console.log('🎤 Activando micrófono...');
                
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error activando micrófono:', error);
                    setTimeout(() => this.activateMicrophone(), 1000);
                }
            }

            deactivateMicrophone() {
                console.log('🔇 Desactivando micrófono...');
                
                clearTimeout(this.silenceTimer);
                clearTimeout(this.microphoneTimer);
                
                this.updateMicrophoneStatus(false);
                
                if (this.recognition) {
                    try {
                        this.recognition.stop();
                    } catch (e) {
                        // Ignorar errores
                    }
                }
                
                this.finalTranscript = '';
                this.interimTranscript = '';
            }

            // === PROCESAMIENTO DE ENTRADA DEL USUARIO ===
            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                console.log('🧠 Procesando:', userMessage);
                
                this.deactivateMicrophone();
                this.addToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.updateStats();
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Luis IA procesando...', 'processing');
                this.updateLuisStatus('Procesando');

                const startTime = performance.now();

                try {
                    const response = await this.generateResponse(userMessage);
                    const endTime = performance.now();
                    const responseTime = Math.round(endTime - startTime);
                    
                    this.responseTimeEl.textContent = `${responseTime}ms`;
                    this.addToConversation(response, 'vendor');
                    
                    this.isProcessingResponse = false;
                    
                    // Detectar si es despedida/cierre de venta
                    if (this.isGoodbyeMessage(response)) {
                        await this.speakResponse(response);
                        setTimeout(() => {
                            this.endCall();
                            this.saveCallToDatabase('success');
                        }, 2000);
                    } else {
                        await this.speakResponse(response);
                    }
                    
                } catch (error) {
                    console.error('Error procesando:', error);
                    this.isProcessingResponse = false;
                    const fallbackResponse = 'Disculpa, ¿podrías repetir eso?';
                    this.addToConversation(fallbackResponse, 'vendor');
                    await this.speakResponse(fallbackResponse);
                }
            }

            // Detectar mensajes de despedida
            isGoodbyeMessage(message) {
                const goodbyeKeywords = [
                    'muchas gracias por confiar',
                    'que tengas excelente día',
                    'hasta pronto',
                    'gracias por contactar techstore',
                    'llega mañana',
                    'coordino la entrega',
                    'confirmada la compra'
                ];
                
                const lowerMessage = message.toLowerCase();
                return goodbyeKeywords.some(keyword => lowerMessage.includes(keyword));
            }

            // === GENERACIÓN DE RESPUESTAS OPTIMIZADA PARA ELEVENLABS ===
            async generateResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                let salesPhaseContext = this.determineSalesPhase();
                
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Cliente' : 'Luis'}: ${entry.message}`
                    ).join('\n');
                }
                
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
- Dile al cliente que te envie la informacion que falta por whatsapp
- Agradece profesionalmente  
- Despídete cálidamente
- Ejemplo: "¡Perfecto [Nombre]! Tu [producto] llega mañana entre 2-4 PM. ¡Muchas gracias por confiar en TechStore! Que tengas excelente día. ¡Hasta pronto!"

TU MISIÓN:
Progresa naturalmente hacia el cierre. Si ya confirmó compra, DESPÍDETE. No repitas información. Máximo 60 palabras, natural y efectivo.

Cliente dice: "${userMessage}"

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

                try {
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), 4000);
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                        signal: controller.signal
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const rawResponse = data.candidates[0].content.parts[0].text.trim();
                        
                        // Optimizar para ElevenLabs
                        const optimizedResponse = this.optimizeForElevenLabs(rawResponse);
                        this.updateSalesPhase(userMessage, optimizedResponse);
                        
                        return optimizedResponse;
                    } else {
                        throw new Error('Gemini error');
                    }
                } catch (error) {
                    console.warn('Gemini timeout, usando fallback:', error);
                    return this.getExpertFallbackResponse(userMessage);
                }
            }

            // === OPTIMIZACIÓN CRÍTICA PARA ELEVENLABS ===
            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // 1. PRECIOS (Solo dinero lleva "pesos")
                optimized = optimized.replace(/(\d{1,3}(?:[.,]\d{3})*)\s*mil(?:\s*pesos)?/gi, (match, number) => {
                    const num = parseInt(number.replace(/[.,]/g, '')) * 1000;
                    return this.numberToSpanishWords(num) + ' pesos';
                });
                
                optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[$.,]/g, ''));
                    if (cleanNumber > 10000) { // Solo números grandes son precios
                        return this.numberToSpanishWords(cleanNumber) + ' pesos';
                    }
                    return this.numberToSpanishWords(cleanNumber); // Números pequeños sin "pesos"
                });
                
                // 2. ESPECIFICACIONES TÉCNICAS (Sin "pesos")
                optimized = optimized.replace(/(\d+)\s*GB/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' gigabytes';
                });
                
                optimized = optimized.replace(/(\d+)\s*MP/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' megapíxeles';
                });
                
                // 3. MESES (Sin "pesos")
                optimized = optimized.replace(/(\d+)\s*meses?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' meses';
                });
                
                // 4. AÑOS (Sin "pesos") 
                optimized = optimized.replace(/(\d+)\s*años?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' años';
                });
                
                // 5. PROCESADORES
                optimized = optimized.replace(/i(\d+)/gi, 'i-$1');
                optimized = optimized.replace(/RTX\s*(\d+)/gi, 'RTX $1');
                
                // 6. MODELOS
                optimized = optimized.replace(/G(\d+)/gi, 'G$1');
                optimized = optimized.replace(/iPhone\s*(\d+)/gi, 'iPhone $1');
                optimized = optimized.replace(/Galaxy\s*S(\d+)/gi, 'Galaxy S$1');
                
                // 7. LIMPIAR "pesos" donde no corresponde
                optimized = optimized.replace(/(\w+)\s+pesos(?!\s|$|\.)(?=\s+(?:gigabytes|megapíxeles|meses|años))/gi, '$1');
                
                return optimized;
            }

            // === CONVERSIÓN NÚMEROS A ESPAÑOL PERFECTO ===
            numberToSpanishWords(number) {
                if (number === 0) return 'cero';
                if (number === 100) return 'cien';
                
                const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
                const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
                const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
                const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
                
                if (number < 10) return ones[number];
                
                if (number < 20) return teens[number - 10];
                
                if (number < 30) {
                    return number === 20 ? 'veinte' : 'veinti' + ones[number % 10];
                }
                
                if (number < 100) {
                    return tens[Math.floor(number / 10)] + (number % 10 > 0 ? ' y ' + ones[number % 10] : '');
                }
                
                if (number < 1000) {
                    const hundred = Math.floor(number / 100);
                    const remainder = number % 100;
                    return hundreds[hundred] + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                if (number < 1000000) {
                    const thousands = Math.floor(number / 1000);
                    const remainder = number % 1000;
                    const thousandsText = thousands === 1 ? 'mil' : this.numberToSpanishWords(thousands) + ' mil';
                    return thousandsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                // Millones
                const millions = Math.floor(number / 1000000);
                const remainder = number % 1000000;
                const millionsText = millions === 1 ? 'un millón' : this.numberToSpanishWords(millions) + ' millones';
                return millionsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
            }

            // === DETERMINACIÓN FASE DE VENTA ===
            determineSalesPhase() {
                const lastMessages = this.conversationHistory.slice(-3);
                const allText = lastMessages.map(h => h.message.toLowerCase()).join(' ');
                
                if (allText.includes('sí') && (allText.includes('quiero') || allText.includes('comprar') || allText.includes('apartarlo'))) {
                    return 'CONFIRMACIÓN DE COMPRA - DESPEDIRSE';
                }
                if (allText.includes('precio') || allText.includes('cuesta') || allText.includes('vale')) {
                    return 'NEGOCIACIÓN DE PRECIO';
                }
                if (allText.includes('cuando llega') || allText.includes('entrega') || allText.includes('envío')) {
                    return 'CIERRE LOGÍSTICO';
                }
                if (allText.includes('presupuesto') || allText.includes('millones')) {
                    return 'CALIFICACIÓN PRESUPUESTO';
                }
                if (allText.includes('laptop') || allText.includes('celular') || allText.includes('computador')) {
                    return 'DESCUBRIMIENTO PRODUCTO';
                }
                
                return 'CONSTRUCCIÓN RAPPORT';
            }

            updateSalesPhase(userMessage, luisResponse) {
                const combined = (userMessage + ' ' + luisResponse).toLowerCase();
                
                if (combined.includes('apartarlo') || combined.includes('coordino') || combined.includes('gracias por confiar')) {
                    this.salesPhase = 'cierre_exitoso';
                } else if (combined.includes('precio') || combined.includes('cuesta')) {
                    this.salesPhase = 'negociación';
                } else if (combined.includes('presupuesto')) {
                    this.salesPhase = 'calificación';
                } else if (combined.includes('necesito') || combined.includes('busco')) {
                    this.salesPhase = 'descubrimiento';
                }
            }

            // === FALLBACK EXPERTO ===
            getExpertFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                const phase = this.determineSalesPhase();
                
                if (phase === 'CONFIRMACIÓN DE COMPRA - DESPEDIRSE' || msg.includes('sí') && msg.includes('quiero')) {
                    return '¡Excelente decisión! Dame tu nombre completo y dirección en Bogotá. Llega entre veinticuatro y cuarenta y ocho horas con entrega gratis. ¡Muchas gracias por confiar en TechStore! Que tengas excelente día.';
                }
                
                if (msg.includes('precio') && msg.includes('laptop')) {
                    return 'Para creación de contenido recomiendo la ASUS ROG G catorce. Excelente procesador y tarjeta gráfica, doscientos cincuenta y seis gigabytes de almacenamiento. Precio: dos millones trescientos cincuenta mil pesos con financiación disponible. ¿Te parece bien?';
                }
                
                const expertResponses = [
                    'Como especialista con quince años en tecnología, tengo exactamente lo que buscas. Cuéntame más detalles para hacer la recomendación perfecta.',
                    'Perfecto. He asesorado a miles de clientes. Dame más información sobre el uso principal para recomendarte lo mejor.',
                    'Excelente consulta. ¿Para qué lo necesitas principalmente? Así te ayudo mejor.'
                ];
                
                return expertResponses[Math.floor(Math.random() * expertResponses.length)];
            }

            // === REPRODUCCIÓN DE AUDIO (SOLO ELEVENLABS) ===
            async speakResponse(text) {
                console.log('🗣️ Luis hablando:', text);
                
                this.isLuisSpeaking = true;
                this.updateCallStatus('🗣️ Luis IA hablando...', 'speaking');
                this.updateLuisStatus('Hablando');
                this.audioVisualizer.style.display = 'block';
                this.transcript.textContent = `Luis: "${text}"`;
                
                this.deactivateMicrophone();

                try {
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVENLABS_VOICE_ID}`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': this.ELEVENLABS_API_KEY
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

                    if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        this.currentAudio = new Audio(audioUrl);
                        this.currentAudio.volume = this.volume;
                        
                        this.currentAudio.onended = () => {
                            console.log('✅ Luis terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isLuisSpeaking = false;
                            this.audioVisualizer.style.display = 'none';
                            this.updateLuisStatus('Escuchando');
                            this.transcript.textContent = '🎤 Luis terminó - Tu turno';
                            
                            if (this.isCallActive && !this.isGoodbyeMessage(text)) {
                                this.microphoneTimer = setTimeout(() => {
                                    this.activateMicrophone();
                                }, 1000);
                            }
                        };
                        
                        await this.currentAudio.play();
                        
                    } else {
                        throw new Error('ElevenLabs error');
                    }
                    
                } catch (error) {
                    console.error('Error ElevenLabs:', error);
                    this.speakWithBrowser(text);
                }
            }

            speakWithBrowser(text) {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'es-ES';
                    utterance.volume = this.volume;
                    
                    utterance.onend = () => {
                        console.log('✅ Luis terminó de hablar (navegador)');
                        this.isLuisSpeaking = false;
                        this.audioVisualizer.style.display = 'none';
                        this.updateLuisStatus('Escuchando');
                        this.transcript.textContent = '🎤 Luis terminó - Tu turno';
                        
                        if (this.isCallActive) {
                            this.microphoneTimer = setTimeout(() => {
                                this.activateMicrophone();
                            }, 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                } else {
                    this.isLuisSpeaking = false;
                    this.audioVisualizer.style.display = 'none';
                    this.transcript.textContent = 'Sin audio - Tu turno';
                    
                    if (this.isCallActive) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                }
            }

            // === CONTROL DE LLAMADA ===
            async startCall() {
                console.log('📞 Iniciando llamada...');
                
                this.isCallActive = true;
                this.callButton.innerHTML = '<i class="fas fa-phone"></i> Finalizar Llamada';
                this.callButton.classList.add('active');
                this.stopButton.style.display = 'inline-block';
                
                this.updateCallStatus('📞 Llamada conectada', 'connected');
                this.updateLuisStatus('Iniciando');
                
                const greeting = '¡Hola! Buen día, habla Luis Martínez de TechStore. Vi que escribiste por nuestro Instagram mostrando interés en tecnología. Me da mucho gusto contactarte personalmente para asesorarte. Cuéntame, ¿qué tipo de equipo tienes en mente?';
                
                this.addToConversation(greeting, 'vendor');
                this.salesPhase = 'rapport';
                this.updateStats();
                
                await this.speakResponse(greeting);
            }

            endCall() {
                console.log('📞 Finalizando llamada...');
                
                this.isCallActive = false;
                this.isLuisSpeaking = false;
                this.isProcessingResponse = false;
                
                this.callButton.innerHTML = '<i class="fas fa-phone"></i> Iniciar Llamada';
                this.callButton.classList.remove('active');
                this.stopButton.style.display = 'none';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                clearTimeout(this.microphoneTimer);
                
                this.updateCallStatus('📞 Llamada finalizada', 'waiting');
                this.updateLuisStatus('Desconectado');
                this.transcript.textContent = 'Llamada terminada. ¡Gracias!';
                
                this.saveCallToDatabase();
            }

            // === CONTROL DE AUDIO ===
            stopAudio() {
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                    this.currentAudio = null;
                }
                
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
                
                this.isLuisSpeaking = false;
                this.audioVisualizer.style.display = 'none';
            }

            toggleVolume() {
                if (this.volume > 0.5) {
                    this.volume = 0.3;
                    this.volumeButton.innerHTML = '<i class="fas fa-volume-down"></i> Volumen: Medio';
                } else if (this.volume > 0.1) {
                    this.volume = 0;
                    this.volumeButton.innerHTML = '<i class="fas fa-volume-mute"></i> Volumen: Mudo';
                } else {
                    this.volume = 0.8;
                    this.volumeButton.innerHTML = '<i class="fas fa-volume-up"></i> Volumen: Alto';
                }
                
                if (this.currentAudio) {
                    this.currentAudio.volume = this.volume;
                }
            }

            // === GESTIÓN DE CONVERSACIÓN Y CRM ===
            addToConversation(message, speaker) {
                const conversationItem = document.createElement('div');
                conversationItem.className = `conversation-item ${speaker === 'customer' ? 'customer-speech' : 'vendor-speech'}`;
                
                const label = document.createElement('div');
                label.className = 'speech-label';
                label.textContent = speaker === 'customer' ? 'Cliente:' : 'Luis IA:';
                
                const content = document.createElement('div');
                content.textContent = message;
                
                conversationItem.appendChild(label);
                conversationItem.appendChild(content);
                
                this.conversationDisplay.appendChild(conversationItem);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;
                
                // Detectar información del cliente
                if (speaker === 'customer' && !this.clientName) {
                    const nameMatch = message.match(/soy\s+(\w+)|me\s+llamo\s+(\w+)|mi\s+nombre\s+es\s+(\w+)/i);
                    if (nameMatch) {
                        this.clientName = nameMatch[1] || nameMatch[2] || nameMatch[3];
                    }
                }
                
                this.conversationHistory.push({
                    speaker: speaker,
                    message: message,
                    timestamp: new Date()
                });
                
                if (this.conversationHistory.length > 10) {
                    this.conversationHistory = this.conversationHistory.slice(-10);
                }
            }

            // === BASE DE DATOS Y ALMACENAMIENTO ===
            saveCallToDatabase(result = 'incomplete') {
                const callData = {
                    id: Date.now(),
                    date: new Date(),
                    clientName: this.clientName || 'Cliente Anónimo',
                    duration: this.interactionCount > 0 ? this.interactionCount * 30 : 0, // Estimación
                    interactions: this.interactionCount,
                    salesPhase: this.salesPhase,
                    result: result,
                    conversation: [...this.conversationHistory],
                    saleAmount: result === 'success' ? 2350000 : 0 // Estimación
                };
                
                this.callsDatabase.push(callData);
                this.saveDatabaseToStorage();
                this.updateCRMDashboard();
                
                // Agregar/actualizar cliente
                if (this.clientName && !this.clientsDatabase.find(c => c.name === this.clientName)) {
                    this.clientsDatabase.push({
                        id: Date.now(),
                        name: this.clientName,
                        phone: '+57 300 XXX XXXX',
                        email: 'cliente@email.com',
                        status: result === 'success' ? 'Cliente' : 'Prospecto',
                        lastContact: new Date(),
                        totalCalls: 1,
                        notes: `Interesado en tecnología. Última llamada: ${result}`
                    });
                    this.saveDatabaseToStorage();
                }
            }

            saveDatabaseToStorage() {
                try {
                    localStorage.setItem('luisCRM_clients', JSON.stringify(this.clientsDatabase));
                    localStorage.setItem('luisCRM_calls', JSON.stringify(this.callsDatabase));
                    localStorage.setItem('luisCRM_reports', JSON.stringify(this.reportsDatabase));
                } catch (error) {
                    console.error('Error guardando en localStorage:', error);
                }
            }

            loadDatabaseFromStorage() {
                try {
                    const clients = localStorage.getItem('luisCRM_clients');
                    const calls = localStorage.getItem('luisCRM_calls');
                    const reports = localStorage.getItem('luisCRM_reports');
                    
                    if (clients) this.clientsDatabase = JSON.parse(clients);
                    if (calls) this.callsDatabase = JSON.parse(calls);
                    if (reports) this.reportsDatabase = JSON.parse(reports);
                    
                    this.updateCRMDashboard();
                } catch (error) {
                    console.error('Error cargando de localStorage:', error);
                }
            }

            // === BÚSQUEDA DE CLIENTES ===
            getClientsDatabase() {
                return [
                    {
                        id: 1,
                        name: "María González Rodríguez",
                        phone: "+57 301 234 5678",
                        address: "Carrera 15 #85-20, Chapinero",
                        sector: "restaurante",
                        zone: "chapinero",
                        budget: "medio",
                        description: "Restaurante familiar, necesita sistema POS",
                        interest: "Tablets y computadores para facturación"
                    },
                    {
                        id: 2,
                        name: "Carlos Andrés Martínez",
                        phone: "+57 310 987 6543",
                        address: "Calle 72 #10-40, Zona Rosa",
                        sector: "oficina",
                        zone: "zona-rosa",
                        budget: "alto",
                        description: "Startup tecnológica en crecimiento",
                        interest: "Laptops gaming para desarrollo"
                    },
                    {
                        id: 3,
                        name: "Ana Lucía Herrera",
                        phone: "+57 320 456 7890",
                        address: "Av. 19 #104-35, Norte",
                        sector: "clinica",
                        zone: "norte",
                        budget: "premium",
                        description: "Clínica odontológica moderna",
                        interest: "Equipos Apple para consultorio"
                    },
                    {
                        id: 4,
                        name: "Diego López Sánchez",
                        phone: "+57 315 678 9012",
                        address: "Carrera 7 #32-15, Centro",
                        sector: "tienda",
                        zone: "centro",
                        budget: "bajo",
                        description: "Tienda de ropa, modernizar caja",
                        interest: "Tablet para pagos y inventario"
                    },
                    {
                        id: 5,
                        name: "Sandra Patricia Ruiz",
                        phone: "+57 318 234 5679",
                        address: "Calle 116 #15-85, Norte",
                        sector: "educacion",
                        zone: "norte",
                        budget: "medio",
                        description: "Colegio privado, laboratorio",
                        interest: "Computadores para estudiantes"
                    },
                    {
                        id: 6,
                        name: "Roberto Jiménez Castro",
                        phone: "+57 312 345 6781",
                        address: "Carrera 11 #93-45, Chapinero",
                        sector: "hotel",
                        zone: "chapinero",
                        budget: "alto",
                        description: "Hotel boutique, tecnificar habitaciones",
                        interest: "Smart TVs y tablets para huéspedes"
                    },
                    {
                        id: 7,
                        name: "Liliana Morales Vargas",
                        phone: "+57 314 567 8902",
                        address: "Calle 57 #14-28, Chapinero",
                        sector: "restaurante",
                        zone: "chapinero",
                        budget: "medio",
                        description: "Café especializado, sistema música",
                        interest: "Altavoces y sistema de sonido"
                    },
                    {
                        id: 8,
                        name: "Fernando Gómez Peña",
                        phone: "+57 317 789 0123",
                        address: "Av. Boyacá #24-76, Occidente",
                        sector: "oficina",
                        zone: "occidente",
                        budget: "premium",
                        description: "Consultoría empresarial",
                        interest: "MacBooks y equipos profesionales"
                    }
                ];
            }

            // === FUNCIONES PÚBLICAS PARA LA INTERFAZ ===
            
            // Búsqueda de clientes
            searchClients() {
                const sector = document.getElementById('sectorFilter').value;
                const zone = document.getElementById('zoneFilter').value;
                const budget = document.getElementById('budgetFilter').value;
                
                const allClients = this.getClientsDatabase();
                let filteredClients = allClients;
                
                if (sector) {
                    filteredClients = filteredClients.filter(client => client.sector === sector);
                }
                
                if (zone) {
                    filteredClients = filteredClients.filter(client => client.zone === zone);
                }
                
                if (budget) {
                    filteredClients = filteredClients.filter(client => client.budget === budget);
                }
                
                this.displaySearchResults(filteredClients);
            }

            displaySearchResults(clients) {
                const clientsList = document.getElementById('clientsList');
                
                if (clients.length === 0) {
                    clientsList.innerHTML = `
                        <div style="text-align: center; color: #888888; padding: 20px;">
                            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px;"></i>
                            <h4>No se encontraron clientes</h4>
                            <p>Prueba con otros filtros de búsqueda</p>
                        </div>
                    `;
                    return;
                }
                
                clientsList.innerHTML = clients.map(client => `
                    <div class="client-card">
                        <div class="client-name">${client.name}</div>
                        <div class="client-info"><i class="fas fa-phone"></i> ${client.phone}</div>
                        <div class="client-info"><i class="fas fa-map-marker-alt"></i> ${client.address}</div>
                        <div class="client-info"><i class="fas fa-building"></i> ${client.description}</div>
                        <div class="client-info"><i class="fas fa-star"></i> Interés: ${client.interest}</div>
                        <div class="client-actions">
                            <button class="action-button" onclick="window.luisSystem.callClient('${client.name}', '${client.phone}')">
                                <i class="fas fa-phone"></i> Llamar
                            </button>
                            <button class="action-button" onclick="window.luisSystem.addClientToCRM(${JSON.stringify(client).replace(/"/g, '&quot;')})">
                                <i class="fas fa-user-plus"></i> Agregar CRM
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            callClient(name, phone) {
                this.clientName = name;
                this.currentClient = { name, phone };
                
                // Cambiar a pestaña de llamadas
                switchTab('calls');
                
                // Mostrar información del cliente
                this.transcript.textContent = `🎯 Cliente seleccionado: ${name} (${phone})`;
                this.updateCallStatus(`📞 Listo para llamar a ${name}`, 'waiting');
                
                alert(`Cliente ${name} seleccionado. Presiona "Iniciar Llamada" cuando estés listo.`);
            }

            addClientToCRM(client) {
                const existingClient = this.clientsDatabase.find(c => c.name === client.name);
                
                if (!existingClient) {
                    this.clientsDatabase.push({
                        id: Date.now(),
                        name: client.name,
                        phone: client.phone,
                        email: 'pendiente@email.com',
                        address: client.address,
                        sector: client.sector,
                        status: 'Prospecto',
                        lastContact: null,
                        totalCalls: 0,
                        notes: `Importado de búsqueda. ${client.description}. Interés: ${client.interest}`
                    });
                    
                    this.saveDatabaseToStorage();
                    this.updateCRMDashboard();
                    alert(`Cliente ${client.name} agregado al CRM exitosamente.`);
                } else {
                    alert(`Cliente ${client.name} ya existe en el CRM.`);
                }
            }

            // Filtrar clientes CRM
            filterClients() {
                const searchTerm = document.getElementById('searchClient').value.toLowerCase();
                const filteredClients = this.clientsDatabase.filter(client => 
                    client.name.toLowerCase().includes(searchTerm) ||
                    client.phone.includes(searchTerm) ||
                    client.status.toLowerCase().includes(searchTerm)
                );
                
                this.displayCRMClients(filteredClients);
            }

            displayCRMClients(clients = null) {
                const clientsList = document.getElementById('crmClientsList');
                const clientsToShow = clients || this.clientsDatabase;
                
                if (clientsToShow.length === 0) {
                    clientsList.innerHTML = `
                        <div style="text-align: center; color: #888888; padding: 40px;">
                            <i class="fas fa-database" style="font-size: 3rem; margin-bottom: 20px;"></i>
                            <h3>No hay clientes en la base de datos</h3>
                            <p>Busca clientes potenciales y agrégalos al CRM</p>
                        </div>
                    `;
                    return;
                }
                
                clientsList.innerHTML = clientsToShow.map(client => `
                    <div class="client-card">
                        <div class="client-name">${client.name}</div>
                        <div class="client-info"><i class="fas fa-phone"></i> ${client.phone}</div>
                        <div class="client-info"><i class="fas fa-envelope"></i> ${client.email}</div>
                        <div class="client-info"><i class="fas fa-tag"></i> Estado: ${client.status}</div>
                        <div class="client-info"><i class="fas fa-calendar"></i> Llamadas: ${client.totalCalls}</div>
                        <div class="client-info"><i class="fas fa-sticky-note"></i> ${client.notes}</div>
                        <div class="client-actions">
                            <button class="action-button" onclick="window.luisSystem.callClient('${client.name}', '${client.phone}')">
                                <i class="fas fa-phone"></i> Llamar
                            </button>
                            <button class="action-button" onclick="window.luisSystem.editClient(${client.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            editClient(clientId) {
                const client = this.clientsDatabase.find(c => c.id === clientId);
                if (client) {
                    const newNotes = prompt(`Editar notas para ${client.name}:`, client.notes);
                    if (newNotes !== null) {
                        client.notes = newNotes;
                        this.saveDatabaseToStorage();
                        this.displayCRMClients();
                    }
                }
            }

            // Exportar datos
            exportData() {
                const data = {
                    clients: this.clientsDatabase,
                    calls: this.callsDatabase,
                    reports: this.reportsDatabase,
                    exportDate: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `luis_crm_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }

            // Generar informe
            generateReport() {
                if (this.conversationHistory.length === 0) {
                    alert('No hay conversaciones para generar informe. Realiza una llamada primero.');
                    return;
                }
                
                const report = {
                    id: Date.now(),
                    date: new Date(),
                    clientName: this.clientName || 'Cliente Anónimo',
                    duration: this.interactionCount * 30, // Estimación en segundos
                    interactions: this.interactionCount,
                    salesPhase: this.salesPhase,
                    conversation: [...this.conversationHistory],
                    analysis: this.analyzeConversation()
                };
                
                this.reportsDatabase.push(report);
                this.saveDatabaseToStorage();
                this.displayReports();
            }

            analyzeConversation() {
                const customerMessages = this.conversationHistory.filter(h => h.speaker === 'customer');
                const vendorMessages = this.conversationHistory.filter(h => h.speaker === 'vendor');
                
                const allText = this.conversationHistory.map(h => h.message.toLowerCase()).join(' ');
                
                // Análisis de sentimiento básico
                const positiveWords = ['excelente', 'perfecto', 'genial', 'bueno', 'sí', 'interesante', 'me gusta'];
                const negativeWords = ['no', 'mal', 'caro', 'difícil', 'problema', 'complicado'];
                
                const positiveCount = positiveWords.filter(word => allText.includes(word)).length;
                const negativeCount = negativeWords.filter(word => allText.includes(word)).length;
                
                let sentiment = 'Neutral';
                if (positiveCount > negativeCount) sentiment = 'Positivo';
                if (negativeCount > positiveCount) sentiment = 'Negativo';
                
                // Productos mencionados
                const products = [];
                if (allText.includes('laptop') || allText.includes('computador')) products.push('Laptop');
                if (allText.includes('celular') || allText.includes('iphone')) products.push('Celular');
                if (allText.includes('tablet')) products.push('Tablet');
                if (allText.includes('asus')) products.push('ASUS ROG');
                
                // Interés estimado
                let interestLevel = 'Bajo';
                if (allText.includes('precio') || allText.includes('cuanto')) interestLevel = 'Medio';
                if (allText.includes('comprar') || allText.includes('apartarlo')) interestLevel = 'Alto';
                
                return {
                    sentiment,
                    interestLevel,
                    productsDiscussed: products,
                    totalMessages: this.conversationHistory.length,
                    customerMessages: customerMessages.length,
                    vendorMessages: vendorMessages.length,
                    avgResponseTime: '~500ms',
                    nextSteps: this.getNextSteps()
                };
            }

            getNextSteps() {
                const phase = this.salesPhase;
                
                switch (phase) {
                    case 'cierre_exitoso':
                        return 'Confirmar entrega y seguimiento post-venta';
                    case 'negociación':
                        return 'Ofrecer opciones de financiamiento';
                    case 'descubrimiento':
                        return 'Enviar cotización personalizada';
                    default:
                        return 'Continuar construyendo relación y identificar necesidades';
                }
            }

            displayReports() {
                const reportDisplay = document.getElementById('reportDisplay');
                
                if (this.reportsDatabase.length === 0) {
                    reportDisplay.innerHTML = `
                        <div style="text-align: center; color: #888888; padding: 40px;">
                            <i class="fas fa-clipboard" style="font-size: 3rem; margin-bottom: 20px;"></i>
                            <h3>No hay informes generados aún</h3>
                            <p>Realiza una llamada y genera un informe automático con IA</p>
                        </div>
                    `;
                    return;
                }
                
                reportDisplay.innerHTML = this.reportsDatabase.slice().reverse().map(report => `
                    <div class="report-card">
                        <div class="report-title">
                            <i class="fas fa-file-alt"></i> Informe IA - ${report.clientName}
                            <span style="float: right; font-size: 0.8rem; color: #888888;">
                                ${new Date(report.date).toLocaleDateString()} ${new Date(report.date).toLocaleTimeString()}
                            </span>
                        </div>
                        
                        <div class="report-section">
                            <div class="report-label">📊 Resumen Ejecutivo</div>
                            <div class="report-value">
                                Duración: ${Math.floor(report.duration / 60)}:${(report.duration % 60).toString().padStart(2, '0')} | 
                                Interacciones: ${report.interactions} | 
                                Fase: ${report.salesPhase}
                            </div>
                        </div>
                        
                        <div class="report-section">
                            <div class="report-label">🤖 Análisis IA</div>
                            <div class="report-value">
                                ${report.analysis.sentiment} | Interés: ${report.analysis.interestLevel} | Tiempo Respuesta: ${report.analysis.avgResponseTime}
                            </div>
                        </div>
                        
                        <div class="report-section">
                            <div class="report-label">🛍️ Productos Discutidos</div>
                            <div class="report-value">
                                ${report.analysis.productsDiscussed.length > 0 ? report.analysis.productsDiscussed.join(', ') : 'Ninguno específico'}
                            </div>
                        </div>
                        
                        <div class="report-section">
                            <div class="report-label">🎯 Próximos Pasos IA</div>
                            <div class="report-value">${report.analysis.nextSteps}</div>
                        </div>
                        
                        <div class="report-section">
                            <div class="report-label">💬 Conversación Completa</div>
                            <div class="report-value" style="max-height: 150px; overflow-y: auto; font-size: 0.8rem;">
                                ${report.conversation.map(msg => 
                                    `<strong>${msg.speaker === 'customer' ? '👤 Cliente' : '🤖 Luis IA'}:</strong> ${msg.message}`
                                ).join('<br><br>')}
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            exportReport() {
                if (this.reportsDatabase.length === 0) {
                    alert('No hay informes para exportar.');
                    return;
                }
                
                const reportContent = this.reportsDatabase.map(report => `
                    INFORME IA DE LLAMADA - ${report.clientName}
                    Fecha: ${new Date(report.date).toLocaleString()}
                    
                    RESUMEN:
                    - Duración: ${Math.floor(report.duration / 60)}:${(report.duration % 60).toString().padStart(2, '0')}
                    - Interacciones: ${report.interactions}
                    - Fase de venta: ${report.salesPhase}
                    - Sentimiento: ${report.analysis.sentiment}
                    - Nivel de interés: ${report.analysis.interestLevel}
                    - Tiempo de respuesta IA: ${report.analysis.avgResponseTime}
                    
                    PRODUCTOS DISCUTIDOS: ${report.analysis.productsDiscussed.join(', ') || 'Ninguno específico'}
                    
                    PRÓXIMOS PASOS IA: ${report.analysis.nextSteps}
                    
                    CONVERSACIÓN COMPLETA:
                    ${report.conversation.map(msg => `${msg.speaker === 'customer' ? 'Cliente' : 'Luis IA'}: ${msg.message}`).join('\n')}
                    
                    ----------------------------------------
                `).join('\n');
                
                const blob = new Blob([reportContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `informes_luis_ia_${new Date().toISOString().split('T')[0]}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            }

            clearAllReports() {
                if (confirm('¿Estás seguro de que quieres eliminar todos los informes?')) {
                    this.reportsDatabase = [];
                    this.saveDatabaseToStorage();
                    this.displayReports();
                }
            }
        }

        // === FUNCIONES GLOBALES PARA LA INTERFAZ ===
        function switchTab(tabName) {
            // Ocultar todas las pestañas
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remover clase active de todos los botones
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
            });
            
            // Mostrar pestaña seleccionada
            document.getElementById(tabName).classList.add('active');
            
            // Activar botón correspondiente
            document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
            
            // Cargar datos específicos de cada pestaña
            if (tabName === 'crm') {
                window.luisSystem.displayCRMClients();
            } else if (tabName === 'reports') {
                window.luisSystem.displayReports();
            }
        }

        function searchClients() {
            window.luisSystem.searchClients();
        }

        function filterClients() {
            window.luisSystem.filterClients();
        }

        function exportData() {
            window.luisSystem.exportData();
        }

        function generateReport() {
            window.luisSystem.generateReport();
        }

        function exportReport() {
            window.luisSystem.exportReport();
        }

        function clearAllReports() {
            window.luisSystem.clearAllReports();
        }

        // === INICIALIZACIÓN ===
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Iniciando Luis IA CRM System...');
            window.luisSystem = new LuisSistemaCompleto();
            console.log('✅ Sistema IA CRM completamente inicializado');
        });