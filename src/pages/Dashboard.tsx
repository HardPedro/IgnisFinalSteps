import { useState, useEffect } from 'react';
import { Wrench, FileText, MessageSquare, AlertTriangle, TrendingUp, DollarSign, Users, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const [stats, setStats] = useState({
    openOS: 0,
    pendingQuotes: 0,
    newLeads: 0,
    lowStock: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    closedOSThisMonth: 0,
    activeRecalls: 0,
    chartData: [] as { name: string, receita: number }[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.tenantId) return;
    const tenantId = userData.tenantId;

    const fetchStats = async () => {
      try {
        const ordersRef = collection(db, `tenants/${tenantId}/workOrders`);
        const quotesRef = collection(db, `tenants/${tenantId}/quotes`);
        const leadsRef = collection(db, `tenants/${tenantId}/leads`);
        const partsRef = collection(db, `tenants/${tenantId}/parts`);
        const customersRef = collection(db, `tenants/${tenantId}/customers`);

        const [ordersSnap, quotesSnap, leadsSnap, partsSnap, customersSnap] = await Promise.all([
          getDocs(ordersRef),
          getDocs(quotesRef),
          getDocs(leadsRef),
          getDocs(partsRef),
          getDocs(customersRef)
        ]);

        let openOS = 0;
        let closedOSThisMonth = 0;
        let revenueThisMonth = 0;
        let revenueLastMonth = 0;
        const monthlyData: Record<string, number> = {};

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        let lastMonth = thisMonth - 1;
        let lastMonthYear = thisYear;
        if (lastMonth < 0) {
          lastMonth = 11;
          lastMonthYear--;
        }

        ordersSnap.docs.forEach(doc => {
          const data = doc.data();
          const amount = Number(data.total_amount) || 0;
          const date = new Date(data.createdAt);
          
          if (data.status !== 'fechada' && data.status !== 'cancelada') {
            openOS++;
          }
          
          if (data.status === 'fechada') {
            const month = date.toLocaleString('pt-BR', { month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + amount;

            if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
              closedOSThisMonth++;
              revenueThisMonth += amount;
            } else if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
              revenueLastMonth += amount;
            }
          }
        });

        let pendingQuotes = 0;
        quotesSnap.docs.forEach(doc => {
          if (doc.data().status === 'pendente') pendingQuotes++;
        });

        let newLeads = 0;
        leadsSnap.docs.forEach(doc => {
          if (doc.data().status === 'novo') newLeads++;
        });

        let lowStock = 0;
        partsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (Number(data.stock_qty) <= Number(data.min_qty)) lowStock++;
        });

        let activeRecalls = 0;
        customersSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.next_recall && new Date(data.next_recall) <= new Date()) {
            activeRecalls++;
          }
        });

        const formattedChartData = Object.keys(monthlyData).map(month => ({
          name: month,
          receita: monthlyData[month]
        }));

        setStats({
          openOS,
          pendingQuotes,
          newLeads,
          lowStock,
          revenueThisMonth,
          revenueLastMonth,
          closedOSThisMonth,
          activeRecalls,
          chartData: formattedChartData.length > 0 ? formattedChartData : [
            { name: 'Jan', receita: 0 },
            { name: 'Fev', receita: 0 },
            { name: 'Mar', receita: 0 }
          ]
        });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userData]);

  const revenueGrowth = stats.revenueLastMonth > 0 
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100 
    : 100;

  const cards = [
    { name: 'OS em Aberto', value: stats.openOS, icon: Wrench, color: 'bg-yellow-500', bgLight: 'bg-yellow-50', text: 'text-yellow-600' },
    { name: 'Orçamentos Pendentes', value: stats.pendingQuotes, icon: FileText, color: 'bg-gray-800', bgLight: 'bg-gray-100', text: 'text-gray-700' },
    { name: 'Novos Leads (IA)', value: stats.newLeads, icon: MessageSquare, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', text: 'text-emerald-600' },
    { name: 'Peças em Baixa', value: stats.lowStock, icon: AlertTriangle, color: 'bg-rose-500', bgLight: 'bg-rose-50', text: 'text-rose-600' },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel do Gestor</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 overflow-hidden shadow-sm rounded-2xl border border-gray-800 relative"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Receita do Mês</h3>
              <div className="p-2 bg-gray-800 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-white">
                R$ {stats.revenueThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className={`h-4 w-4 mr-1 ${revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className={`${revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium`}>
                {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </span>
              <span className="ml-2 text-gray-500">vs mês anterior</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">OS Finalizadas (Mês)</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-900">{stats.closedOSThisMonth}</p>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Serviços concluídos com sucesso</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Recalls Ativos</h3>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-900">{stats.activeRecalls}</p>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-purple-600 font-medium">Oportunidades de retorno</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Ticket Médio</h3>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-900">
                R$ {stats.closedOSThisMonth > 0 ? (stats.revenueThisMonth / stats.closedOSThisMonth).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Por ordem de serviço</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Evolução de Receita</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`R$ ${value}`, 'Receita']}
                />
                <Area type="monotone" dataKey="receita" stroke="#EAB308" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Operacional</h3>
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div 
                key={card.name} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 hover:shadow-md transition-shadow duration-300"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`rounded-xl p-3 ${card.bgLight}`}>
                        <Icon className={`h-5 w-5 ${card.text}`} />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                        <dd>
                          <div className="text-2xl font-bold text-gray-900 mt-1">{card.value}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
