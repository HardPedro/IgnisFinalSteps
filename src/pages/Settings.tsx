import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Terminal, Key, Shield, Users, Plus, X, Trash2, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const WebhookLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/webhook-logs', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        console.error('Expected array of logs, got:', data);
        setLogs([]);
      }
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Logs do Webhook (Últimos 20)</h3>
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>
      
      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum log recebido ainda.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">{new Date(log.time).toLocaleString()}</div>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(log.body, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ApiLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/api-logs', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        console.error('Expected array of logs, got:', data);
        setLogs([]);
      }
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Logs de Envio de Mensagem (Últimos 20)</h3>
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>
      
      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum log de envio ainda.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">{new Date(log.time).toLocaleString()}</div>
              <div className="mb-2">
                <span className="font-semibold text-xs text-gray-700">Payload:</span>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto mt-1">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-semibold text-xs text-gray-700">Tentativas:</span>
                {log.attempts.map((attempt: any, j: number) => (
                  <div key={j} className="mt-1 p-2 bg-gray-100 rounded border border-gray-200">
                    <div className="text-xs font-mono text-gray-600">{attempt.url} - Status: {attempt.status}</div>
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto mt-1">
                      {attempt.response}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function Settings() {
  const { currentUser, userData } = useAuth();
  const [isDevAreaOpen, setIsDevAreaOpen] = useState(false);
  const [whatsappApiKey, setWhatsappApiKey] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [generalSaveMessage, setGeneralSaveMessage] = useState('');
  
  // General settings state
  const [officeSettings, setOfficeSettings] = useState({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    logo_url: ''
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  
  // Team state
  const [team, setTeam] = useState<any[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'Mecanico' });
  
  // Admin state
  const [user, setUser] = useState<any>(null);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  
  // New account form state
  const [newAccount, setNewAccount] = useState({
    companyName: '',
    username: '',
    password: '',
    name: '',
    plan: 'Core Operacional'
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);

  useEffect(() => {
    // Load saved settings
    const savedApiKey = localStorage.getItem('whatsapp_api_key') || '';
    const savedPhoneId = localStorage.getItem('whatsapp_phone_id') || '';
    setWhatsappApiKey(savedApiKey);
    setWhatsappPhoneId(savedPhoneId);
    
    if (userData) {
      setUser(userData);
      fetchOfficeSettings();
      fetchTeam();
    }
  }, [userData]);

  const fetchTeam = async () => {
    if (!userData?.tenantId) return;
    try {
      const q = query(collection(db, 'users'), where('tenantId', '==', userData.tenantId));
      const querySnapshot = await getDocs(q);
      const teamData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeam(teamData);
    } catch (error) {
      console.error('Failed to fetch team', error);
    }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.tenantId) return;
    try {
      // Create a new user document with the email and tenantId
      // When the user logs in with Google, AuthContext will link this document
      const newUserId = 'u-' + Date.now();
      await setDoc(doc(db, 'users', newUserId), {
        tenantId: userData.tenantId,
        email: newMember.email,
        name: newMember.name,
        role: newMember.role,
        createdAt: new Date().toISOString()
      });
      
      setIsTeamModalOpen(false);
      setNewMember({ name: '', email: '', password: '', role: 'Mecanico' });
      fetchTeam();
    } catch (error) {
      console.error('Failed to create team member', error);
      alert('Erro ao criar membro da equipe');
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este membro da equipe?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      fetchTeam();
    } catch (error) {
      console.error('Failed to delete team member', error);
    }
  };

  const fetchOfficeSettings = async () => {
    if (!userData?.tenantId) return;
    setIsLoadingSettings(true);
    try {
      const docRef = doc(db, 'tenants', userData.tenantId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOfficeSettings({
          name: data.name || '',
          cnpj: data.cnpj || '',
          address: data.address || '',
          phone: data.phone || '',
          logo_url: data.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch office settings', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.tenantId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'tenants', userData.tenantId), officeSettings);
      setGeneralSaveMessage('Configurações salvas com sucesso!');
      setTimeout(() => setGeneralSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save general settings', error);
      alert('Erro de conexão ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDevSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.tenantId) return;
    setIsSaving(true);
    
    // Save to localStorage for MVP purposes
    localStorage.setItem('whatsapp_api_key', whatsappApiKey);
    localStorage.setItem('whatsapp_phone_id', whatsappPhoneId);
    
    try {
      const finalPhoneId = whatsappPhoneId.trim() || `360-${Date.now()}`;
      
      // Register the number in the backend so the webhook can find it
      await setDoc(doc(db, `tenants/${userData.tenantId}/whatsapp_numbers`, finalPhoneId), {
        phone_number_id: finalPhoneId,
        phone_number: finalPhoneId,
        access_token: whatsappApiKey,
        waba_id: 'default',
        updatedAt: new Date().toISOString()
      });
      
      setIsSaving(false);
      setSaveMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      console.error('Failed to save WhatsApp settings to backend', error);
      setIsSaving(false);
      setSaveMessage(error.message || 'Erro ao salvar no servidor.');
    }
  };

  const loadAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'tenants'));
      const accountsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load accounts', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleOpenAccountsModal = () => {
    setIsAccountsModalOpen(true);
    loadAccounts();
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAccount(true);
    try {
      const tenantId = 't-' + Date.now();
      await setDoc(doc(db, 'tenants', tenantId), {
        name: newAccount.companyName,
        plan: newAccount.plan,
        createdAt: new Date().toISOString()
      });
      
      const newUserId = 'u-' + Date.now();
      await setDoc(doc(db, 'users', newUserId), {
        tenantId,
        email: newAccount.username,
        name: newAccount.name,
        role: 'Gestor',
        createdAt: new Date().toISOString()
      });
      
      setNewAccount({ companyName: '', username: '', password: '', name: '', plan: 'Core Operacional' });
      loadAccounts();
    } catch (error) {
      console.error('Failed to create account', error);
      alert('Erro ao criar conta');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleDeleteAccount = async (tenantId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) return;
    
    try {
      await deleteDoc(doc(db, 'tenants', tenantId));
      loadAccounts();
    } catch (error) {
      console.error('Failed to delete account', error);
      alert('Erro ao excluir conta');
    }
  };

  const handleUpdatePlan = async (tenantId: string, plan: string) => {
    setUpdatingPlanId(tenantId);
    try {
      await updateDoc(doc(db, 'tenants', tenantId), { plan });
      loadAccounts();
    } catch (error) {
      console.error('Failed to update plan', error);
      alert('Erro ao atualizar plano');
    } finally {
      setUpdatingPlanId(null);
    }
  };

  const isSuperAdmin = userData?.role === 'SuperAdmin';
  const [activeTab, setActiveTab] = useState('general');
  const [billingInfo, setBillingInfo] = useState<any>(null);

  useEffect(() => {
    fetchBillingInfo();
  }, [activeTab, userData]);

  const fetchBillingInfo = async () => {
    if (!userData?.tenantId) return;
    try {
      const docSnap = await getDoc(doc(db, 'tenants', userData.tenantId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBillingInfo({
          plan: data.plan,
          plan_status: data.plan_status,
          plan_expires_at: data.plan_expires_at
        });
      }
    } catch (error) {
      console.error('Failed to fetch billing info', error);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ priceId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to start checkout', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-yellow-500" />
          Configurações
        </h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'general'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'team'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Equipe
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'billing'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Plano & Faturamento
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'whatsapp'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            WhatsApp
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'admin'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Admin
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'general' && (
        <div className="bg-white shadow-sm sm:rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações Gerais</h2>
            
            <form onSubmit={handleSaveGeneralSettings} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Oficina</label>
                  <input 
                    type="text" 
                    value={officeSettings.name}
                    onChange={e => setOfficeSettings({...officeSettings, name: e.target.value})}
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input 
                    type="text" 
                    value={officeSettings.cnpj}
                    onChange={e => setOfficeSettings({...officeSettings, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input 
                    type="text" 
                    value={officeSettings.phone}
                    onChange={e => setOfficeSettings({...officeSettings, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input 
                    type="text" 
                    value={officeSettings.logo_url}
                    onChange={e => setOfficeSettings({...officeSettings, logo_url: e.target.value})}
                    placeholder="https://exemplo.com/logo.png"
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                <textarea 
                  rows={2}
                  value={officeSettings.address}
                  onChange={e => setOfficeSettings({...officeSettings, address: e.target.value})}
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors" 
                />
              </div>

              <div className="pt-4 flex items-center">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl shadow-sm text-gray-900 bg-yellow-500 hover:bg-yellow-400 transition-all duration-200 disabled:opacity-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                {generalSaveMessage && (
                  <span className="ml-4 text-sm text-green-600 font-medium flex items-center">
                    {generalSaveMessage}
                  </span>
                )}
              </div>
            </form>
          </div>
          
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-end">
            <button 
              onClick={() => setIsDevAreaOpen(!isDevAreaOpen)}
              className="text-xs font-mono text-gray-500 hover:text-gray-900 flex items-center transition-colors"
            >
              <Terminal className="h-3 w-3 mr-1" />
              Área DEV
            </button>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Seu Plano Atual</h2>
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Plano</p>
                <h3 className="text-2xl font-bold text-gray-900">{billingInfo?.plan || 'CORE'}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Status: <span className={`font-bold ${billingInfo?.plan_status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {billingInfo?.plan_status === 'active' ? 'Ativo' : 'Pendente/Cancelado'}
                  </span>
                </p>
              </div>
              <button 
                onClick={handleManageBilling}
                className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                Gerenciar Assinatura
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: 'CORE', 
                price: 'R$ 97', 
                period: '/mês',
                features: ['Gestão de Clientes', 'Orçamentos & OS', 'Catálogo de Peças', 'Suporte via E-mail'],
                priceId: 'price_core_id'
              },
              { 
                name: 'PRO', 
                price: 'R$ 197', 
                period: '/mês',
                features: ['Tudo do CORE', 'WhatsApp Inteligente', 'Gestão de Equipe', 'Relatórios Financeiros', 'Suporte Prioritário'],
                priceId: 'price_pro_id',
                popular: true
              },
              { 
                name: 'ELITE', 
                price: 'R$ 497', 
                period: '/mês',
                features: ['Tudo do PRO', 'Multifilial', 'Consultoria de Gestão', 'Integrações Customizadas', 'Gerente de Conta'],
                priceId: 'price_elite_id'
              }
            ].map((plan) => (
              <div key={plan.name} className={`bg-white p-8 rounded-[32px] border ${plan.popular ? 'border-yellow-500 shadow-lg' : 'border-gray-100 shadow-sm'} relative overflow-hidden`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-gray-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleUpgrade(plan.priceId)}
                  disabled={billingInfo?.plan === plan.name}
                  className={`w-full py-4 rounded-xl font-bold transition-all ${
                    billingInfo?.plan === plan.name 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : plan.popular 
                        ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {billingInfo?.plan === plan.name ? 'Plano Atual' : 'Selecionar Plano'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Gestão da Equipe</h2>
            <button 
              onClick={() => setIsTeamModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Membro
            </button>
          </div>

          <div className="overflow-hidden border border-gray-100 rounded-2xl">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {team.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        member.role === 'Gestor' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.id !== user?.id && (
                        <button 
                          onClick={() => handleDeleteTeamMember(member.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'whatsapp' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">WhatsApp API (Z-API)</h2>
            <form onSubmit={handleSaveDevSettings} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instance Token (Z-API)</label>
                <input 
                  type="password" 
                  value={whatsappApiKey}
                  onChange={e => setWhatsappApiKey(e.target.value)}
                  placeholder="Ex: 1234567890ABCDEF"
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instance ID (Z-API)</label>
                <input 
                  type="text" 
                  value={whatsappPhoneId}
                  onChange={e => setWhatsappPhoneId(e.target.value)}
                  placeholder="Ex: 3B9A8C7D6E5F4G3H2I1J"
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors" 
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl shadow-sm text-gray-900 bg-yellow-500 hover:bg-yellow-400 transition-all duration-200 disabled:opacity-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações API'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => alert(`Configure o webhook no painel da Z-API apontando para:\n\n${window.location.origin}/webhooks/zapi?token=SEU_TOKEN\n\n(Substitua SEU_TOKEN pelo valor de WHATSAPP_VERIFY_TOKEN no seu .env)`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-bold rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Ver URL do Webhook
                </button>
              </div>
              {saveMessage && (
                <p className={`text-sm font-medium ${saveMessage.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                  {saveMessage}
                </p>
              )}
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WebhookLogs />
            <ApiLogs />
          </div>
        </div>
      )}

      {activeTab === 'admin' && isSuperAdmin && (
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Painel de Administração (SuperAdmin)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Gerenciar Contas</h3>
              <p className="text-sm text-gray-500 mb-4">Visualize, crie e gerencie todas as oficinas cadastradas no sistema.</p>
              <button 
                onClick={handleOpenAccountsModal}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
              >
                <Users className="mr-2 h-4 w-4" />
                Ver Todas as Contas
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isDevAreaOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-900 shadow-sm sm:rounded-2xl border border-gray-800 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <Terminal className="h-6 w-6 text-yellow-500 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Área do Desenvolvedor</h2>
                </div>
                <div className="flex items-center space-x-4">
                  {isSuperAdmin && (
                    <button
                      onClick={handleOpenAccountsModal}
                      className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm font-bold px-4 py-2 rounded-xl flex items-center transition-colors"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Administrar Contas
                    </button>
                  )}
                  <span className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Zona de Perigo
                  </span>
                </div>
              </div>
              
              <div className="p-8">
                <div className="mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Key className="h-4 w-4 mr-2 text-yellow-500" />
                    Integração WhatsApp Business API (Meta)
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Insira suas credenciais da API Oficial do WhatsApp para habilitar o espelhamento de conversas na Central Inteligente. 
                    O sistema utilizará essas chaves para enviar e receber mensagens diretamente do seu número comercial.
                  </p>
                </div>

                <form onSubmit={handleSaveDevSettings} className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp API Token (Access Token)</label>
                    <input 
                      type="password" 
                      value={whatsappApiKey}
                      onChange={(e) => setWhatsappApiKey(e.target.value)}
                      placeholder="EAA..."
                      className="block w-full bg-gray-800 border border-gray-700 rounded-xl shadow-sm py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors font-mono" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number ID</label>
                    <input 
                      type="text" 
                      value={whatsappPhoneId}
                      onChange={(e) => setWhatsappPhoneId(e.target.value)}
                      placeholder="101234567890123"
                      className="block w-full bg-gray-800 border border-gray-700 rounded-xl shadow-sm py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors font-mono" 
                    />
                  </div>

                  <div className="pt-4 flex items-center space-x-4">
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl shadow-sm text-gray-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500 transition-all duration-200 disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : 'Salvar Credenciais'}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => alert('Configure o webhook no painel da Z-API apontando para: ' + window.location.origin + '/webhooks/zapi')}
                      className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-bold rounded-xl shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-all duration-200"
                    >
                      Ver URL do Webhook
                    </button>
                    
                    {saveMessage && (
                      <span className="text-sm text-green-400 flex items-center">
                        {saveMessage}
                      </span>
                    )}
                  </div>
                </form>
                
                <div className="mt-8 border-t border-gray-800 pt-6">
                  <WebhookLogs />
                </div>
                
                <div className="mt-8 border-t border-gray-800 pt-6">
                  <ApiLogs />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Modal */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Novo Membro da Equipe</h3>
              <form onSubmit={handleCreateTeamMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={newMember.name}
                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                    className="block w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={newMember.email}
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                    className="block w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input 
                    type="password" 
                    required
                    value={newMember.password}
                    onChange={e => setNewMember({...newMember, password: e.target.value})}
                    className="block w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <select 
                    value={newMember.role}
                    onChange={e => setNewMember({...newMember, role: e.target.value})}
                    className="block w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  >
                    <option value="Mecanico">Mecânico</option>
                    <option value="Gestor">Gestor</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-yellow-500 text-gray-900 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all">
                    Criar Membro
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsTeamModalOpen(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accounts Modal */}
      <AnimatePresence>
        {isAccountsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-yellow-500" />
                  Administrar Contas (Estabelecimentos)
                </h2>
                <button 
                  onClick={() => setIsAccountsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
                {/* Create Account Form */}
                <div className="w-full md:w-1/3 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Nova Conta</h3>
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento</label>
                      <input 
                        type="text" 
                        required
                        value={newAccount.companyName}
                        onChange={e => setNewAccount({...newAccount, companyName: e.target.value})}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Responsável</label>
                      <input 
                        type="text" 
                        required
                        value={newAccount.name}
                        onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Usuário (Login)</label>
                      <input 
                        type="text" 
                        required
                        value={newAccount.username}
                        onChange={e => setNewAccount({...newAccount, username: e.target.value})}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                      <input 
                        type="password" 
                        required
                        value={newAccount.password}
                        onChange={e => setNewAccount({...newAccount, password: e.target.value})}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                      <select 
                        required
                        value={newAccount.plan}
                        onChange={e => setNewAccount({...newAccount, plan: e.target.value})}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" 
                      >
                        <option value="Core Operacional">Core Operacional (R$ 397)</option>
                        <option value="Central Inteligente">Central Inteligente (R$ 697)</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      disabled={isCreatingAccount}
                      className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                      {isCreatingAccount ? 'Criando...' : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Conta
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Accounts List */}
                <div className="w-full md:w-2/3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Contas Ativas</h3>
                  {isLoadingAccounts ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estabelecimento</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {accounts.map((acc) => {
                            const isExpired = acc.plan_expires_at && new Date(acc.plan_expires_at) < new Date();
                            return (
                            <tr key={acc.tenant_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{acc.tenant_name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{acc.email}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {acc.email !== 'hardsolutions' ? (
                                  <select
                                    value={acc.plan || 'Core Operacional'}
                                    onChange={(e) => handleUpdatePlan(acc.tenant_id, e.target.value)}
                                    disabled={updatingPlanId === acc.tenant_id}
                                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-1 px-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-xs"
                                  >
                                    <option value="Core Operacional">Core Operacional</option>
                                    <option value="Central Inteligente">Central Inteligente</option>
                                  </select>
                                ) : (
                                  <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-gray-100 text-gray-800">
                                    Admin
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {acc.email !== 'hardsolutions' && acc.plan_expires_at ? (
                                  <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {new Date(acc.plan_expires_at).toLocaleDateString()}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                {acc.email !== 'hardsolutions' && (
                                  <div className="flex justify-end space-x-2">
                                    <button 
                                      onClick={() => handleUpdatePlan(acc.tenant_id, acc.plan || 'Core Operacional')}
                                      className="text-blue-600 hover:text-blue-900 transition-colors text-xs font-medium"
                                      title="Renovar por 30 dias"
                                      disabled={updatingPlanId === acc.tenant_id}
                                    >
                                      Renovar
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteAccount(acc.tenant_id)}
                                      className="text-red-600 hover:text-red-900 transition-colors"
                                      title="Excluir conta"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )})}
                          {accounts.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                Nenhuma conta encontrada.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
