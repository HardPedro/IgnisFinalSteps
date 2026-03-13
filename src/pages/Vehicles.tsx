import React, { useState, useEffect } from 'react';
import { Car, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export function Vehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ customerId: '', make: '', model: '', year: '', plate: '' });
  const { userData, currentUser } = useAuth();

  useEffect(() => {
    if (!userData?.tenantId) return;

    const tenantId = userData.tenantId;
    const vehiclesRef = collection(db, `tenants/${tenantId}/vehicles`);
    const customersRef = collection(db, `tenants/${tenantId}/customers`);
    
    setIsLoading(true);

    const unsubscribeCustomers = onSnapshot(
      customersRef,
      (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(customersData);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `tenants/${tenantId}/customers`, currentUser)
    );

    const unsubscribeVehicles = onSnapshot(
      vehiclesRef,
      async (snapshot) => {
        try {
          const vehiclesData = await Promise.all(snapshot.docs.map(async (vehicleDoc) => {
            const data = vehicleDoc.data();
            let customerName = 'Desconhecido';
            
            if (data.customerId) {
              const customerDocRef = doc(db, `tenants/${tenantId}/customers`, data.customerId);
              const customerSnap = await getDoc(customerDocRef);
              if (customerSnap.exists()) {
                customerName = customerSnap.data().name;
              }
            }

            return { 
              id: vehicleDoc.id, 
              ...data,
              customerName
            };
          }));
          setVehicles(vehiclesData);
        } catch (error) {
           handleFirestoreError(error, OperationType.LIST, `tenants/${tenantId}/vehicles`, currentUser);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `tenants/${tenantId}/vehicles`, currentUser);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeCustomers();
      unsubscribeVehicles();
    };
  }, [userData, currentUser]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.tenantId) return;

    try {
      const tenantId = userData.tenantId;
      const vehiclesRef = collection(db, `tenants/${tenantId}/vehicles`);
      
      await addDoc(vehiclesRef, {
        ...newVehicle,
        createdAt: serverTimestamp()
      });
      
      setNewVehicle({ customerId: '', make: '', model: '', year: '', plate: '' });
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tenants/${userData.tenantId}/vehicles`, currentUser);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <Car className="mr-3 h-8 w-8 text-yellow-500" />
          Veículos
        </h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl shadow-sm text-gray-900 bg-yellow-500 hover:bg-yellow-400 transition-all duration-200"
        >
          {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isAdding ? 'Cancelar' : 'Novo Veículo'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Adicionar Veículo</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select
                      required
                      value={newVehicle.customerId}
                      onChange={(e) => setNewVehicle({ ...newVehicle, customerId: e.target.value })}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-4 py-3 border transition-colors"
                    >
                      <option value="">Selecione um cliente</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-4 py-3 border transition-colors"
                      placeholder="Ex: Honda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-4 py-3 border transition-colors"
                      placeholder="Ex: Civic"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                    <input
                      type="text"
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-4 py-3 border transition-colors"
                      placeholder="Ex: 2020"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                    <input
                      type="text"
                      value={newVehicle.plate}
                      onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-4 py-3 border uppercase transition-colors"
                      placeholder="ABC-1234"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-xl text-gray-900 bg-yellow-500 hover:bg-yellow-400 transition-colors"
                  >
                    Salvar Veículo
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-2xl border border-gray-100">
        <ul className="divide-y divide-gray-100">
          {isLoading ? (
            <li className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            </li>
          ) : vehicles.length === 0 ? (
            <li className="p-8 text-center text-gray-500">Nenhum veículo encontrado.</li>
          ) : (
            vehicles.map((vehicle) => (
              <li key={vehicle.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold mr-4">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{vehicle.make} {vehicle.model} {vehicle.year}</p>
                    <p className="text-sm text-gray-500">Placa: <span className="font-mono bg-gray-100 px-1 rounded">{vehicle.plate || 'N/A'}</span> • Cliente: {vehicle.customerName}</p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
