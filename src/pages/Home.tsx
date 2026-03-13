import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Home as HomeIcon, 
  Users, 
  Car, 
  Package, 
  FileText, 
  Wrench, 
  MessageSquare,
  Settings,
  DollarSign
} from 'lucide-react';

export function Home() {
  const categories = [
    {
      title: 'CADASTROS',
      items: [
        { path: '/vehicles', label: 'Carros', desc: 'Gerenciar veículos', icon: Car, color: 'bg-purple-500' },
        { path: '/catalog', label: 'Produtos', desc: 'Produtos e serviços', icon: Package, color: 'bg-cyan-500' },
        { path: '/customers', label: 'Clientes', desc: 'Cadastro de clientes', icon: Users, color: 'bg-blue-400' },
      ]
    },
    {
      title: 'VENDAS & LEADS',
      items: [
        { path: '/quotes', label: 'Orçamentos', desc: 'Gerenciar orçamentos', icon: FileText, color: 'bg-emerald-500' },
        { path: '/whatsapp', label: 'Central Inteligente', desc: 'Atendimento via WhatsApp', icon: MessageSquare, color: 'bg-blue-500' },
      ]
    },
    {
      title: 'GESTÃO',
      items: [
        { path: '/dashboard', label: 'Painel do Gestor', desc: 'Métricas e relatórios', icon: HomeIcon, color: 'bg-pink-500' },
        { path: '/financial', label: 'Financeiro', desc: 'Controle de caixa e lucros', icon: DollarSign, color: 'bg-yellow-500' },
      ]
    },
    {
      title: 'SERVIÇOS',
      items: [
        { path: '/work-orders', label: 'Manutenções', desc: 'Revisões e reparos', icon: Wrench, color: 'bg-cyan-500' },
      ]
    },
    {
      title: 'OUTROS',
      items: [
        { path: '/settings', label: 'Configurações', desc: 'Ajustes do sistema', icon: Settings, color: 'bg-teal-500' },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Menu Principal</h1>
        <p className="text-gray-500 mt-1">Selecione o módulo que deseja acessar.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max pb-8">
        {categories.map((category, idx) => (
          <motion.div 
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col"
          >
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {category.title}
            </h2>
            <div className="space-y-2 flex-1">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path}
                    to={item.path}
                    className="flex items-center p-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`p-2.5 rounded-xl ${item.color} text-white mr-4 shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{item.label}</h3>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
