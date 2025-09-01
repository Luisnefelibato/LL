class LuisSistemaCompleto {
    constructor() {
        // URLs de las APIs (se configurarán automáticamente según el entorno)
        this.API_BASE_URL = window.location.origin;
        
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

    // === RECONOCIMIENTO DE VOZ ===
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

    // === CONTROL DE MICRÓFONO ===
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

    // === GENERACIÓN DE RESPUESTAS CON API DE VERCEL ===
    async generateResponse(userMessage) {
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(`${this.API_BASE_URL}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: this.conversationHistory,
                    salesPhase: this.salesPhase
                }),
                signal: controller.signal
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    const optimizedResponse = this.optimizeForElevenLabs(data.response);
                    this.updateSalesPhase(userMessage, optimizedResponse);
                    return optimizedResponse;
                } else {
                    throw new Error('Error en respuesta de API');
                }
            } else {
                throw new Error('Error en llamada a API');
            }
        } catch (error) {
            console.warn('Error API Gemini, usando fallback:', error);
            return this.getExpertFallbackResponse(userMessage);
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

    // === OPTIMIZACIÓN PARA ELEVENLABS ===
    optimizeForElevenLabs(text) {
        let optimized = text;
        
        // 1. PRECIOS (Solo dinero lleva "pesos")
        optimized = optimized.replace(/(\d{1,3}(?:[.,]\d{3})*)\s*mil(?:\s*pesos)?/gi, (match, number) => {
            const num = parseInt(number.replace(/[.,]/g, '')) * 1000;
            return this.numberToSpanishWords(num) + ' pesos';
        });
        
        optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{3})*)/g, (match, number) => {
            const cleanNumber = parseInt(number.replace(/[$.,]/g, ''));
            if (cleanNumber > 10000) {
                return this.numberToSpanishWords(cleanNumber) + ' pesos';
            }
            return this.numberToSpanishWords(cleanNumber);
        });
        
        // 2. ESPECIFICACIONES TÉCNICAS
        optimized = optimized.replace(/(\d+)\s*GB/gi, (match, number) => {
            return this.numberToSpanishWords(parseInt(number)) + ' gigabytes';
        });
        
        optimized = optimized.replace(/(\d+)\s*MP/gi, (match, number) => {
            return this.numberToSpanishWords(parseInt(number)) + ' megapíxeles';
        });
        
        return optimized;
    }

    // === CONVERSIÓN NÚMEROS A ESPAÑOL ===
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
        
        const millions = Math.floor(number / 1000000);
        const remainder = number % 1000000;
        const millionsText = millions === 1 ? 'un millón' : this.numberToSpanishWords(millions) + ' millones';
        return millionsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
    }

    // === FASES DE VENTA ===
    determineSalesPhase() {
        const lastMessages = this.conversationHistory.slice(-3);
        const allText = lastMessages.map(h => h.message.toLowerCase()).join(' ');
        
        if (allText.includes('sí') && (allText.includes('quiero') || allText.includes('comprar'))) {
            return 'CONFIRMACIÓN DE COMPRA - DESPEDIRSE';
        }
        if (allText.includes('precio') || allText.includes('cuesta')) {
            return 'NEGOCIACIÓN DE PRECIO';
        }
        return 'CONSTRUCCIÓN RAPPORT';
    }

    updateSalesPhase(userMessage, luisResponse) {
        const combined = (userMessage + ' ' + luisResponse).toLowerCase();
        
        if (combined.includes('apartarlo') || combined.includes('coordino')) {
            this.salesPhase = 'cierre_exitoso';
        } else if (combined.includes('precio')) {
            this.salesPhase = 'negociación';
        }
    }

    // === FALLBACK EXPERTO ===
    getExpertFallbackResponse(userMessage) {
        const msg = userMessage.toLowerCase();
        
        if (msg.includes('sí') && msg.includes('quiero')) {
            return '¡Excelente decisión! Dame tu nombre completo y dirección en Bogotá. Llega entre veinticuatro y cuarenta y ocho horas con entrega gratis. ¡Muchas gracias por confiar en TechStore!';
        }
        
        const expertResponses = [
            'Como especialista con quince años en tecnología, tengo exactamente lo que buscas. Cuéntame más detalles para hacer la recomendación perfecta.',
            'Perfecto. He asesorado a miles de clientes. Dame más información sobre el uso principal para recomendarte lo mejor.',
            'Excelente consulta. ¿Para qué lo necesitas principalmente? Así te ayudo mejor.'
        ];
        
        return expertResponses[Math.floor(Math.random() * expertResponses.length)];
    }

    // === REPRODUCCIÓN DE AUDIO CON API DE VERCEL ===
    async speakResponse(text) {
        console.log('🗣️ Luis hablando:', text);
        
        this.isLuisSpeaking = true;
        this.updateCallStatus('🗣️ Luis IA hablando...', 'speaking');
        this.updateLuisStatus('Hablando');
        this.audioVisualizer.style.display = 'block';
        this.transcript.textContent = `Luis: "${text}"`;
        
        this.deactivateMicrophone();

        try {
            const response = await fetch(`${this.API_BASE_URL}/api/elevenlabs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    // Convertir Base64 a Blob y reproducir
                    const audioBytes = atob(data.audioBase64);
                    const audioArray = new Uint8Array(audioBytes.length);
                    for (let i = 0; i < audioBytes.length; i++) {
                        audioArray[i] = audioBytes.charCodeAt(i);
                    }
                    
                    const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
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
                    return;
                }
            }
            
            throw new Error('Error en API de ElevenLabs');
            
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
            duration: this.interactionCount > 0 ? this.interactionCount * 30 : 0,
            interactions: this.interactionCount,
            salesPhase: this.salesPhase,
            result: result,
            conversation: [...this.conversationHistory],
            saleAmount: result === 'success' ? 2350000 : 0
        };
        
        this.callsDatabase.push(callData);
        this.saveDatabaseToStorage();
        this.updateCRMDashboard();
        
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

    // === MÉTODOS ADICIONALES DEL CRM (resumidos por espacio) ===
    
    getClientsDatabase() {
        return [
            {
                id: 1, name: "María González Rodríguez", phone: "+57 301 234 5678",
                address: "Carrera 15 #85-20, Chapinero", sector: "restaurante", zone: "chapinero",
                budget: "medio", description: "Restaurante familiar, necesita sistema POS",
                interest: "Tablets y computadores para facturación"
            },
            {
                id: 2, name: "Carlos Andrés Martínez", phone: "+57 310 987 6543",
                address: "Calle 72 #10-40, Zona Rosa", sector: "oficina", zone: "zona-rosa",
                budget: "alto", description: "Startup tecnológica en crecimiento",
                interest: "Laptops gaming para desarrollo"
            }
        ];
    }

    searchClients() {
        const sector = document.getElementById('sectorFilter').value;
        const zone = document.getElementById('zoneFilter').value;
        const budget = document.getElementById('budgetFilter').value;
        
        let filteredClients = this.getClientsDatabase();
        
        if (sector) filteredClients = filteredClients.filter(client => client.sector === sector);
        if (zone) filteredClients = filteredClients.filter(client => client.zone === zone);
        if (budget) filteredClients = filteredClients.filter(client => client.budget === budget);
        
        this.displaySearchResults(filteredClients);
    }

    displaySearchResults(clients) {
        const clientsList = document.getElementById('clientsList');
        
        if (clients.length === 0) {
            clientsList.innerHTML = `<div style="text-align: center; color: #888888; padding: 20px;">
                <h4>No se encontraron clientes</h4><p>Prueba con otros filtros</p></div>`;
            return;
        }
        
        clientsList.innerHTML = clients.map(client => `
            <div class="client-card">
                <div class="client-name">${client.name}</div>
                <div class="client-info"><i class="fas fa-phone"></i> ${client.phone}</div>
                <div class="client-info"><i class="fas fa-map-marker-alt"></i> ${client.address}</div>
                <div class="client-actions">
                    <button class="action-button" onclick="window.luisSystem.callClient('${client.name}', '${client.phone}')">
                        <i class="fas fa-phone"></i> Llamar
                    </button>
                </div>
            </div>
        `).join('');
    }

    callClient(name, phone) {
        this.clientName = name;
        this.currentClient = { name, phone };
        switchTab('calls');
        this.transcript.textContent = `🎯 Cliente seleccionado: ${name}`;
        this.updateCallStatus(`📞 Listo para llamar a ${name}`, 'waiting');
    }

    // Métodos adicionales del CRM simplificados...
    filterClients() { /* implementación simplificada */ }
    displayCRMClients() { /* implementación simplificada */ }
    exportData() { /* implementación simplificada */ }
    generateReport() { /* implementación simplificada */ }
    displayReports() { /* implementación simplificada */ }
    exportReport() { /* implementación simplificada */ }
    clearAllReports() { /* implementación simplificada */ }
}

// === FUNCIONES GLOBALES ===
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
}

// Funciones adicionales...
function searchClients() { window.luisSystem.searchClients(); }
function filterClients() { window.luisSystem.filterClients(); }
function exportData() { window.luisSystem.exportData(); }
function generateReport() { window.luisSystem.generateReport(); }

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Luis IA CRM System...');
    window.luisSystem = new LuisSistemaCompleto();
    console.log('✅ Sistema listo para Vercel');
});