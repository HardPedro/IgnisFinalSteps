import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, CheckCircle, Smartphone, BarChart3, Shield, Zap, ArrowRight, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-yellow-500" />
              <span className="ml-2 text-2xl font-black tracking-tighter">OFICINA<span className="text-yellow-500">PRO</span></span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium hover:text-yellow-500 transition-colors">Funcionalidades</a>
              <a href="#pricing" className="text-sm font-medium hover:text-yellow-500 transition-colors">Preços</a>
              <Link to="/login" className="text-sm font-medium hover:text-yellow-500 transition-colors">Entrar</Link>
              <Link to="/login" className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all">
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider mb-6">
                <Zap className="h-3 w-3 mr-2" />
                O Software #1 para Mecânicas
              </div>
              <h1 className="text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter mb-8">
                Sua oficina em <span className="text-yellow-500 italic">alta performance.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
                Gerencie ordens de serviço, orçamentos, estoque e financeiro em um só lugar. Automatize seu atendimento via WhatsApp e foque no que importa: o motor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-gray-800 transition-all flex items-center justify-center group">
                  Teste Grátis por 14 dias
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="bg-white border-2 border-gray-200 px-8 py-4 rounded-2xl text-lg font-bold hover:border-gray-900 transition-all flex items-center justify-center">
                  Ver Demonstração
                </Link>
              </div>
              <div className="mt-10 flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="h-10 w-10 rounded-full border-2 border-white" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-bold text-gray-900">+500 oficinas</span> já confiam no OficinaPro
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-yellow-500/20 rounded-[40px] blur-3xl"></div>
              <img 
                src="https://picsum.photos/seed/dashboard/1200/800" 
                alt="Dashboard OficinaPro" 
                className="relative rounded-[32px] shadow-2xl border border-gray-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Faturamento Mensal</p>
                    <p className="text-2xl font-black text-gray-900">+ R$ 45.200</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black tracking-tighter mb-6">Tudo o que você precisa para <span className="text-yellow-500">crescer.</span></h2>
            <p className="text-lg text-gray-600">Desenvolvido por quem entende o dia a dia de uma oficina mecânica. Menos papelada, mais produtividade.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Smartphone />, title: 'WhatsApp Integrado', desc: 'Envie orçamentos e avisos de OS pronta automaticamente para seus clientes.' },
              { icon: <CheckCircle />, title: 'Gestão de OS', desc: 'Acompanhe o status de cada serviço em tempo real, do checklist à entrega.' },
              { icon: <BarChart3 />, title: 'Relatórios Financeiros', desc: 'Saiba exatamente quanto está ganhando e onde estão seus maiores custos.' },
              { icon: <Shield />, title: 'Controle de Estoque', desc: 'Nunca mais perca uma venda por falta de peças. Alertas de estoque baixo.' },
              { icon: <Zap />, title: 'Orçamentos Rápidos', desc: 'Gere orçamentos profissionais em segundos e envie por e-mail ou WhatsApp.' },
              { icon: <Star />, title: 'Gestão de Leads', desc: 'Transforme interessados em clientes fiéis com nosso funil de vendas.' }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[32px] border border-gray-100 hover:shadow-xl transition-all group">
                <div className="bg-yellow-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                  {React.cloneElement(feature.icon as React.ReactElement, { className: 'h-7 w-7' })}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black tracking-tighter mb-20">Planos que cabem no seu <span className="text-yellow-500">bolso.</span></h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Essencial', price: '97', features: ['Até 50 OS/mês', 'Gestão de Clientes', 'Estoque Básico', 'Suporte via E-mail'] },
              { name: 'Profissional', price: '197', popular: true, features: ['OS Ilimitadas', 'WhatsApp Integrado', 'Financeiro Completo', 'Suporte Prioritário'] },
              { name: 'Enterprise', price: '397', features: ['Multi-unidades', 'API de Desenvolvedor', 'Consultoria de Gestão', 'Gerente de Conta'] }
            ].map((plan, i) => (
              <div key={i} className={`p-10 rounded-[40px] border-2 ${plan.popular ? 'border-yellow-500 bg-white shadow-2xl scale-105 relative z-10' : 'border-gray-100 bg-gray-50'}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-gray-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center mb-8">
                  <span className="text-2xl font-bold">R$</span>
                  <span className="text-6xl font-black tracking-tighter mx-1">{plan.price}</span>
                  <span className="text-gray-500 font-medium">/mês</span>
                </div>
                <ul className="space-y-4 mb-10 text-left">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center text-sm font-medium text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center ${plan.popular ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  Começar Agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-[48px] p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-500 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
            </div>
            <h2 className="text-5xl font-black tracking-tighter mb-8 relative z-10">Pronto para levar sua oficina ao <span className="text-yellow-500 italic">próximo nível?</span></h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto relative z-10">Junte-se a centenas de oficinas que já automatizaram seus processos e aumentaram seus lucros.</p>
            <Link to="/login" className="inline-flex items-center px-10 py-5 bg-yellow-500 text-gray-900 rounded-2xl text-xl font-black hover:bg-yellow-400 transition-all relative z-10">
              Começar Teste Grátis
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center">
              <Wrench className="h-6 w-6 text-yellow-500" />
              <span className="ml-2 text-xl font-black tracking-tighter">OFICINA<span className="text-yellow-500">PRO</span></span>
            </div>
            <div className="flex space-x-8 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-gray-900">Termos de Uso</a>
              <a href="#" className="hover:text-gray-900">Privacidade</a>
              <a href="#" className="hover:text-gray-900">Contato</a>
            </div>
            <p className="text-sm text-gray-400">© 2026 OficinaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
