import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Bot, ArrowRight, CheckCircle, Smartphone, Calendar, User, Send } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, where, getDocs, doc, setDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [aiQuoteResult, setAiQuoteResult] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userData } = useAuth();

  const getGeminiApiKey = () => {
    return process.env.GEMINI_API_KEY;
  };

  useEffect(() => {
    if (!userData?.tenantId) return;
    
    const tenantId = userData.tenantId;
    const leadsRef = collection(db, `tenants/${tenantId}/leads`);
    
    setIsLoading(true);
    
    const unsubscribe = onSnapshot(leadsRef, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!selectedLead || !userData?.tenantId) return;
    
    const tenantId = userData.tenantId;
    const messagesRef = collection(db, `tenants/${tenantId}/leads/${selectedLead.id}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedLead, userData]);

  const handleSelectLead = (lead: any) => {
    setSelectedLead(lead);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead || !userData?.tenantId) return;

    setIsSending(true);
    try {
      const tenantId = userData.tenantId;
      const messagesRef = collection(db, `tenants/${tenantId}/leads/${selectedLead.id}/messages`);
      
      await addDoc(messagesRef, {
        content: newMessage,
        sender: 'user',
        createdAt: new Date().toISOString()
      });
      
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPreQuoteToChat = async () => {
    if (!selectedLead || !aiQuoteResult || !userData?.tenantId) return;
    
    const quoteText = `Olá ${selectedLead.contact_name}! Com base no seu relato, nosso assistente virtual sugere o seguinte pré-orçamento:\n\n` +
      `Justificativa: ${aiQuoteResult.justification}\n\n` +
      `Serviços recomendados:\n${aiQuoteResult.recommended_services.map((s: any) => `- ${s}`).join('\n')}\n\n` +
      `Peças recomendadas:\n${aiQuoteResult.recommended_parts.map((p: any) => `- ${p}`).join('\n')}\n\n` +
      `Gostaria de agendar uma visita para confirmarmos o diagnóstico?`;

    setIsSending(true);
    try {
      const tenantId = userData.tenantId;
      const messagesRef = collection(db, `tenants/${tenantId}/leads/${selectedLead.id}/messages`);
      
      await addDoc(messagesRef, {
        content: quoteText,
        sender: 'user',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to send quote to chat', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleGeneratePreQuote = async (lead: any) => {
    handleSelectLead(lead);
    setIsGeneratingQuote(true);
    setAiQuoteResult(null);

    try {
      if (!userData?.tenantId) throw new Error('Tenant ID missing');
      const tenantId = userData.tenantId;
      
      // 1. Fetch catalog
      const servicesRef = collection(db, `tenants/${tenantId}/services`);
      const partsRef = collection(db, `tenants/${tenantId}/parts`);
      
      const [servicesSnap, partsSnap] = await Promise.all([
        getDocs(servicesRef),
        getDocs(partsRef)
      ]);
      
      const services = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const parts = partsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 2. Call Gemini API
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY não configurada no ambiente.');
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Você é um assistente técnico de oficina mecânica.
        Sintoma relatado pelo cliente: "${lead.vehicle_hint}"
        Veículo: ${lead.vehicle_hint}
        
        Catálogo de Serviços Disponíveis:
        ${JSON.stringify(services.map((s: any) => ({ id: s.id, name: s.name, category: s.category })))}
        
        Catálogo de Peças Disponíveis:
        ${JSON.stringify(parts.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku })))}
        
        Com base no sintoma, sugira os serviços e peças mais prováveis necessários.
        Retorne APENAS os IDs dos serviços e peças do catálogo fornecido.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommended_services: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de IDs dos serviços recomendados do catálogo",
              },
              recommended_parts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de IDs das peças recomendadas do catálogo",
              },
              justification: {
                type: Type.STRING,
                description: "Justificativa técnica curta para as recomendações",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Nível de confiança da recomendação (0.0 a 1.0)",
              },
            },
            required: ["recommended_services", "recommended_parts", "justification", "confidence"],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      setAiQuoteResult(data);
      
    } catch (err) {
      console.error('Failed to generate AI quote', err);
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <MessageSquare className="mr-3 h-8 w-8 text-yellow-500" />
          Central Inteligente (Leads)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 h-[calc(100vh-12rem)]">
        {/* Leads List */}
        <div className="lg:col-span-1 bg-white shadow-sm overflow-hidden sm:rounded-2xl border border-gray-100 flex flex-col h-full">
          <div className="px-4 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Fila Comercial</h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
              {leads.length}
            </span>
          </div>
          <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
            {isLoading ? (
              <li className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
              </li>
            ) : leads.length === 0 ? (
              <li className="p-8 text-center text-gray-500">Nenhum lead encontrado.</li>
            ) : (
              leads.map((lead, index) => (
                <motion.li 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={lead.id} 
                  onClick={() => handleSelectLead(lead)}
                  className={`p-4 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-yellow-50/50 border-l-4 border-yellow-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900 text-sm truncate">{lead.contact_name}</span>
                      <span className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded-full ${
                        lead.status === 'novo' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 mb-2">{lead.phone}</span>
                    <p className="text-xs text-gray-600 line-clamp-2 italic">"{lead.vehicle_hint}"</p>
                  </div>
                </motion.li>
              ))
            )}
          </ul>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white shadow-sm overflow-hidden sm:rounded-2xl border border-gray-100 flex flex-col h-full">
          {selectedLead ? (
            <>
              <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-gray-100 p-2 rounded-full mr-3">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{selectedLead.contact_name}</h3>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Smartphone className="h-3 w-3 mr-1" /> {selectedLead.phone}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleGeneratePreQuote(selectedLead)}
                  className="inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold hover:bg-yellow-200 transition-colors"
                >
                  <Bot className="mr-1.5 h-3.5 w-3.5" />
                  Analisar com IA
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
                    <p>Nenhuma mensagem ainda.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.sender === 'user' 
                          ? 'bg-yellow-500 text-gray-900 rounded-tr-none shadow-sm' 
                          : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className={`text-[10px] block mt-1 ${msg.sender === 'user' ? 'text-yellow-800/70' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center p-8">
              <div className="bg-gray-50 p-6 rounded-full shadow-sm border border-gray-100 mb-4">
                <MessageSquare className="h-12 w-12 text-gray-300" />
              </div>
              <p className="font-medium text-gray-600">Selecione um lead para ver o chat.</p>
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        <div className="lg:col-span-1 bg-white shadow-sm sm:rounded-2xl border border-gray-100 flex flex-col h-full overflow-hidden">
          <div className="px-4 py-4 border-b border-yellow-100 bg-yellow-50/50 flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg mr-3">
              <Bot className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-yellow-900">Assistente IA</h3>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto bg-gray-50/50">
            <AnimatePresence mode="wait">
              {!selectedLead ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-gray-500 text-center"
                >
                  <Bot className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-xs text-gray-400 max-w-[200px]">Selecione um lead e clique em "Analisar com IA".</p>
                </motion.div>
              ) : isGeneratingQuote ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-yellow-600 text-center"
                >
                  <div className="relative mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                    <Bot className="h-5 w-5 text-yellow-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="font-bold text-sm">Analisando...</p>
                </motion.div>
              ) : aiQuoteResult ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                    <h4 className="text-xs font-bold text-yellow-900 mb-2 flex items-center uppercase tracking-wider">
                      <CheckCircle className="h-3 w-3 mr-1.5 text-yellow-600" />
                      Justificativa
                    </h4>
                    <p className="text-xs text-yellow-800 leading-relaxed">{aiQuoteResult.justification}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">Serviços</h4>
                      {aiQuoteResult.recommended_services.length > 0 ? (
                        <ul className="space-y-1">
                          {aiQuoteResult.recommended_services.map((id: string) => (
                            <li key={id} className="flex items-center text-xs text-gray-700 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2"></span>
                              <span className="font-mono truncate">{id}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Nenhum serviço.</p>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">Peças</h4>
                      {aiQuoteResult.recommended_parts.length > 0 ? (
                        <ul className="space-y-1">
                          {aiQuoteResult.recommended_parts.map((id: string) => (
                            <li key={id} className="flex items-center text-xs text-gray-700 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2"></span>
                              <span className="font-mono truncate">{id}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Nenhuma peça.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confiança</span>
                      <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                        {(aiQuoteResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <button 
                      onClick={handleSendPreQuoteToChat}
                      disabled={isSending}
                      className="w-full inline-flex justify-center items-center px-3 py-2 bg-yellow-500 text-gray-900 rounded-xl text-xs font-bold hover:bg-yellow-400 transition-colors shadow-sm disabled:opacity-50"
                    >
                      Enviar p/ Chat <ArrowRight className="ml-1.5 h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center">
                  <Bot className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-xs text-gray-400 max-w-[200px]">Clique em "Analisar com IA" no chat para gerar um pré-orçamento.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
