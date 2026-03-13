import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Financial() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    monthlyGrowth: 0,
    averageTicket: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.tenantId) return;

    const tenantId = userData.tenantId;
    const ordersRef = collection(db, `tenants/${tenantId}/workOrders`);
    
    setIsLoading(true);

    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      let totalRev = 0;
      let pendingRev = 0;
      let closedCount = 0;
      const txs: any[] = [];
      const monthlyData: Record<string, number> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const amount = Number(data.total_amount) || 0;
        
        if (data.status === 'fechada') {
          totalRev += amount;
          closedCount++;
          
          // Add to transactions
          txs.push({
            id: doc.id,
            description: `OS #${doc.id.slice(0, 8)}`,
            amount: amount,
            type: 'income',
            date: data.createdAt,
            status: 'completed'
          });

          // Add to chart data
          const date = new Date(data.createdAt);
          const month = date.toLocaleString('pt-BR', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + amount;
        } else if (data.status !== 'cancelada') {
          pendingRev += amount;
          
          txs.push({
            id: doc.id,
            description: `OS #${doc.id.slice(0, 8)} (Pendente)`,
            amount: amount,
            type: 'income',
            date: data.createdAt,
            status: 'pending'
          });
        }
      });

      // Sort transactions by date descending
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Format chart data
      const formattedChartData = Object.keys(monthlyData).map(month => ({
        name: month,
        receita: monthlyData[month]
      }));

      setStats({
        totalRevenue: totalRev,
        pendingRevenue: pendingRev,
        monthlyGrowth: 15.2, // Mocked for now
        averageTicket: closedCount > 0 ? totalRev / closedCount : 0
      });
      setChartData(formattedChartData.length > 0 ? formattedChartData : [
        { name: 'Jan', receita: 0 },
        { name: 'Fev', receita: 0 },
        { name: 'Mar', receita: 0 }
      ]);
      setTransactions(txs.slice(0, 10)); // Top 10 recent
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <DollarSign className="mr-3 h-8 w-8 text-yellow-500" />
            Financeiro
          </h1>
          <p className="text-gray-500 mt-1">Visão geral da saúde financeira da sua oficina.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Calendar className="mr-2 h-4 w-4" />
            Este Mês
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-2xl text-green-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-bold">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {stats.monthlyGrowth}%
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500">Receita Total</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="text-gray-400 text-sm font-medium">A receber</div>
          </div>
          <p className="text-sm font-medium text-gray-500">Pagamentos Pendentes</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.pendingRevenue)}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="text-gray-400 text-sm font-medium">Ticket Médio</div>
          </div>
          <p className="text-sm font-medium text-gray-500">Valor Médio por OS</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.averageTicket)}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <PieChartIcon className="h-6 w-6" />
            </div>
            <div className="text-gray-400 text-sm font-medium">Lucratividade</div>
          </div>
          <p className="text-sm font-medium text-gray-500">Margem Estimada</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">32.5%</h3>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Fluxo de Receita</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-500 font-medium">Receita</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #F3F4F6',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#EAB308" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-8">Métodos de Pagamento</h2>
          <div className="space-y-6">
            {[
              { name: 'Cartão de Crédito', value: 45, color: '#EAB308' },
              { name: 'PIX', value: 35, color: '#22C55E' },
              { name: 'Dinheiro', value: 15, color: '#3B82F6' },
              { name: 'Boleto', value: 5, color: '#6366F1' }
            ].map((method) => (
              <div key={method.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{method.name}</span>
                  <span className="font-bold text-gray-900">{method.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${method.value}%`, backgroundColor: method.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Transações Recentes</h2>
          <button className="text-sm font-bold text-yellow-600 hover:text-yellow-700 transition-colors">
            Ver Tudo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serviço</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tx.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    OS #{tx.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(tx.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      tx.status === 'Finalizada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.status === 'Finalizada' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
