/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Table, TableStatus, Order, OrderStatus, CashCut, User } from "../types";
import { Wallet, DollarSign, CreditCard, Clipboard, RefreshCw, AlertCircle, Award, CheckCircle2, History } from "lucide-react";

interface CashierPanelProps {
  tables: Table[];
  orders: Order[];
  salesHistory: any[];
  currentUser: User;
  onUpdateTables: (tables: Table[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onRegisterSale: (sale: any) => void;
  onClearSalesHistory: () => void;
}

export default function CashierPanel({
  tables,
  orders,
  salesHistory,
  currentUser,
  onUpdateTables,
  onUpdateOrders,
  onRegisterSale,
  onClearSalesHistory
}: CashierPanelProps) {
  const [activeTab, setActiveTab] = useState<"billing" | "cashout">("billing");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Bill payment states
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA">("EFECTIVO");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Cash count / Corte de Caja states
  const INITIAL_CASH = 1500; // Base cash reserve for change
  const [declaredCash, setDeclaredCash] = useState<number>(0);
  const [currentCut, setCurrentCut] = useState<CashCut | null>(null);
  const [historyCuts, setHistoryCuts] = useState<CashCut[]>([]);

  // Calculate live expected cash
  const todaysSales = salesHistory; // Live records
  const revenueByMethod = todaysSales.reduce(
    (acc, s) => {
      const mode = s.paymentMethod || "EFECTIVO";
      if (mode === "EFECTIVO") acc.efectivo += s.total;
      else if (mode === "TARJETA") acc.tarjeta += s.total;
      else if (mode === "TRANSFERENCIA") acc.transferencia += s.total;
      acc.total += s.total;
      return acc;
    },
    { efectivo: 0, tarjeta: 0, transferencia: 0, total: 0 }
  );

  const expectedCashInDrawer = INITIAL_CASH + revenueByMethod.efectivo;

  const handleSelectTable = (tbl: Table) => {
    setSelectedTable(tbl);
    setReceiptOrder(null);
    const existingOrder = orders.find(o => o.tableNumber === tbl.number && o.status !== OrderStatus.PAID);
    if (existingOrder) {
      setCashReceived(Math.ceil(existingOrder.total));
    }
  };

  const handleProcessPayment = (ord: Order) => {
    if (!selectedTable) return;
    
    if (paymentMethod === "EFECTIVO" && cashReceived < ord.total) {
      alert("El monto de efectivo recibido es menor al total de la cuenta.");
      return;
    }

    // Mark paid
    const updated = orders.map(o =>
      o.id === ord.id ? { ...o, status: OrderStatus.PAID, paymentMethod } : o
    );
    onUpdateOrders(updated);

    // Update table stat to Cleaning
    const updatedTables = tables.map(t =>
      t.id === selectedTable.id ? { ...t, status: TableStatus.CLEANING, currentOrderId: undefined } : t
    );
    onUpdateTables(updatedTables);

    // Record sale
    const saleRecord = {
      id: `s-${Date.now()}`,
      orderId: ord.id,
      total: ord.total,
      paymentMethod,
      date: new Date().toISOString(),
      waiterName: ord.waiterName,
      items: ord.items
    };
    onRegisterSale(saleRecord);

    setReceiptOrder({ ...ord, status: OrderStatus.PAID, paymentMethod });
    setSelectedTable(null);
  };

  const handlePerformCorte = (e: React.FormEvent) => {
    e.preventDefault();
    if (declaredCash <= 0) {
      alert("Por favor ingresa un monto de declaración válido.");
      return;
    }

    const diff = declaredCash - expectedCashInDrawer;

    const newCut: CashCut = {
      id: `cut-${Date.now()}`,
      date: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      initialCash: INITIAL_CASH,
      calculatedSales: {
        efectivo: revenueByMethod.efectivo,
        tarjeta: revenueByMethod.tarjeta,
        transferencia: revenueByMethod.transferencia,
        total: revenueByMethod.total
      },
      declaredCash,
      difference: Number(diff.toFixed(2)),
      status: "CLOSED"
    };

    setCurrentCut(newCut);
    setHistoryCuts([newCut, ...historyCuts]);

    // Wipe sales history to reset the drawer
    onClearSalesHistory();
    setDeclaredCash(0);
    alert("Corte de Caja realizado con éxito. Los totales han sido cuadrados y guardados en el historial.");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[#050505] text-[#E4E4E7] min-h-0 flex flex-col relative">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[#1A1A1A] pb-4">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest block uppercase">MÓDULO DE FACTURACIÓN Y ARQUEO DE CAJA</span>
          <h1 className="text-xl font-sans font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-500" />
            Caja & Arqueo Diario
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Suma cuentas de mesas ocupadas de forma automatizada, procesa formas de pago y efectúa cortes de caja financieros.</p>
        </div>

        {/* Action switchers */}
        <div className="flex p-1 bg-[#0D0D0D] border border-[#1F1F1F] rounded w-full md:w-auto">
          <button
            id="cashier-tab-btn-billing"
            onClick={() => setActiveTab("billing")}
            className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-mono font-bold rounded transition-all ${
              activeTab === "billing" ? "bg-orange-600 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Cuentas Pendientes
          </button>
          <button
            id="cashier-tab-btn-cashout"
            onClick={() => setActiveTab("cashout")}
            className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-mono font-bold rounded transition-all ${
              activeTab === "cashout" ? "bg-orange-600 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Corte de Caja
          </button>
        </div>
      </div>

      {/* ------------------- BILLING TAB ------------------- */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Tables with active accounts list */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-sans font-bold text-base text-white">Comensales en Salón</h4>
            <p className="text-xs text-zinc-500">Haz clic en una mesa ocupada para liquidar su consumo.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tables.map((t) => {
                const activeOrder = orders.find(o => o.tableNumber === t.number && o.status !== OrderStatus.PAID);
                return (
                  <button
                    id={`cashier-table-item-${t.id}`}
                    key={t.id}
                    disabled={t.status === TableStatus.FREE || t.status === TableStatus.CLEANING}
                    onClick={() => handleSelectTable(t)}
                    className={`p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${
                      t.status === TableStatus.OCCUPIED || t.status === TableStatus.BILL_REQUESTED
                        ? `${selectedTable?.id === t.id ? 'bg-purple-950/20 border-purple-500 scale-102 shadow-lg shadow-purple-950/20' : 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-700'}`
                        : 'opacity-40 cursor-not-allowed bg-zinc-900/10 border-zinc-900 border-dashed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-extrabold text-white text-base">Mesa {t.number}</span>
                        {t.status === TableStatus.BILL_REQUESTED && (
                          <span className="px-1.5 py-0.5 bg-yellow-950/40 text-yellow-400 border border-yellow-900/30 text-[9px] rounded font-mono animate-pulse">Pide Cuenta</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{t.capacity} puestos</p>
                    </div>

                    {activeOrder ? (
                      <div className="text-right">
                        <p className="text-base font-mono font-extrabold text-amber-500">${activeOrder.total.toFixed(2)}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{activeOrder.items.length} piezas ordenadas</p>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-650 font-mono">Vacía</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Printout Area for processed billing ticket */}
            {receiptOrder && (
              <div className="mt-6 p-6 bg-zinc-900/40 border border-emerald-900/40 text-emerald-400 rounded-2xl flex items-start gap-4 animate-fade-in">
                <CheckCircle2 className="w-8 h-8 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-sans font-bold text-white text-sm">¡Comanda pagada con éxito!</h5>
                  <p className="text-xs text-zinc-400">La comanda para la Mesa {receiptOrder.tableNumber} ha sido enviada al historial de ventas.</p>
                  
                  {/* Compact display */}
                  <div className="pt-2 text-[11px] text-zinc-500 font-mono">
                    <p>Monto Cobrado: <strong className="text-amber-500">${receiptOrder.total.toFixed(2)}</strong></p>
                    <p>Medio de Pago: <strong className="text-white">{receiptOrder.paymentMethod}</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout billing details panel */}
          <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl h-fit">
            {selectedTable ? (() => {
              const activeOrder = orders.find(o => o.tableNumber === selectedTable.number && o.status !== OrderStatus.PAID);
              if (!activeOrder) return <p className="text-zinc-500 text-xs">Mesa ocupada sin orden.</p>;
              
              const calculatedSubtotal = activeOrder.subtotal;
              const calculatedTax = activeOrder.tax;
              const calculatedTotal = activeOrder.total;

              return (
                <div className="space-y-6">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] bg-zinc-950 rounded border border-zinc-800 text-purple-400 font-mono font-bold">DETALLE DE COBRO</span>
                    <h4 className="text-xl font-sans font-bold text-white mt-2">Mesa {selectedTable.number}</h4>
                    <p className="text-xs text-zinc-500 mt-1">Comanda atendida por: {activeOrder.waiterName}</p>
                  </div>

                  {/* Consumed breakdown list */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {activeOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-mono font-medium text-zinc-400 border-b border-zinc-900 pb-1.5">
                        <span className="truncate max-w-[160px]">{it.name} (x{it.quantity})</span>
                        <span className="text-white">${it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tax summary */}
                  <div className="space-y-1.5 text-xs font-mono py-2 border-t border-b border-zinc-850">
                    <div className="flex justify-between text-zinc-500">
                      <span>Consumido:</span>
                      <span>${calculatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>IVA (16%):</span>
                      <span>${calculatedTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-extrabold text-base pt-1">
                      <span>Total Neto:</span>
                      <span className="text-amber-500">${calculatedTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Method select */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase">Acreditar a:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { k: "EFECTIVO", l: "Efectivo", icon: <DollarSign className="w-3.5 h-3.5" /> },
                        { k: "TARJETA", l: "Tarjeta", icon: <CreditCard className="w-3.5 h-3.5" /> },
                        { k: "TRANSFERENCIA", l: "Transfer", icon: <Clipboard className="w-3.5 h-3.5" /> }
                      ].map(item => (
                        <button
                          id={`cashier-pay-btn-${item.k}`}
                          key={item.k}
                          onClick={() => setPaymentMethod(item.k as any)}
                          className={`py-2 px-1 rounded-lg border text-xs font-mono flex flex-col items-center gap-1 ${
                            paymentMethod === item.k
                              ? 'bg-purple-500 border-purple-500 text-white font-bold'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {item.icon}
                          <span className="text-[9px] truncate">{item.l}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === "EFECTIVO" && (
                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                      <label className="block text-[10px] font-mono text-zinc-500">Efectivo Recibido ($)</label>
                      <input
                        id="cashier-cash-received-field"
                        type="number"
                        min={calculatedTotal}
                        value={cashReceived || ""}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        className="w-full bg-zinc-900 text-white font-mono font-bold border border-zinc-800 focus:border-purple-500 rounded p-2 text-sm"
                      />
                      {cashReceived >= calculatedTotal && (
                        <div className="flex justify-between text-[10px] font-mono text-emerald-400 mt-1">
                          <span>Cambio:</span>
                          <span>${(cashReceived - calculatedTotal).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    id="cashier-process-payment-btn"
                    onClick={() => handleProcessPayment(activeOrder)}
                    className="w-full py-3.5 bg-purple-500 hover:bg-purple-600 text-white font-sans font-bold text-xs rounded-xl tracking-wider uppercase transition-colors"
                  >
                    Confirmar Pago de Mesa
                  </button>
                </div>
              );
            })() : (
              <div className="text-center py-12 flex flex-col items-center text-zinc-500">
                <Wallet className="w-10 h-10 text-zinc-700 animate-pulse mb-3" />
                <p className="font-semibold text-sm">Detalles de Factura</p>
                <p className="text-xs text-zinc-650 max-w-[200px] mt-2">Selecciona alguna mesa activa de la izquierda para desplegar su ticket de cobro.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ------------------- CORTES DE CAJA TAB ------------------- */}
      {activeTab === "cashout" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Main audit calculator */}
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h4 className="font-sans font-bold text-lg text-white">Conciliación de Caja (Cierre de Turno)</h4>
                <p className="text-xs text-zinc-500">Cuadra el efectivo físico del cajón contra las ventas calculadas.</p>
              </div>

              {/* Numerical stats fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase font-medium">Bolsa Inicial Caja</span>
                  <span className="text-xl font-mono font-bold text-white">${INITIAL_CASH.toFixed(2)}</span>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase font-medium">Ventas Efectivo Hoy</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">+${revenueByMethod.efectivo.toFixed(2)}</span>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                  <span className="block text-[10px] font-mono text-zinc-500 uppercase font-medium">Arqueo Estimado</span>
                  <span className="text-xl font-mono font-bold text-amber-400">${expectedCashInDrawer.toFixed(2)}</span>
                </div>
              </div>

              {/* Extra details about electronic sales */}
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-2 text-xs font-mono">
                <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ventas Electrónicas Consolidadas (No alteran caja física)</span>
                <div className="flex justify-between text-zinc-300">
                  <span>Tarjeta (Bancos):</span>
                  <span>${revenueByMethod.tarjeta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Transferencias Clabe:</span>
                  <span>${revenueByMethod.transferencia.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-zinc-900 pt-2 text-sm text-purple-400">
                  <span>Suma Ventas Totales:</span>
                  <span>${revenueByMethod.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Declaration and closing Form */}
            <form onSubmit={handlePerformCorte} className="mt-8 border-t border-zinc-900 pt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wide mb-1.5">Efectivo Físico Declarado en Caja ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg font-bold font-mono">$</span>
                  <input
                    id="declared-cash-input-field"
                    type="number"
                    required
                    min="1"
                    placeholder="Arqueo físico ej. 1500"
                    value={declaredCash || ""}
                    onChange={(e) => setDeclaredCash(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-purple-500 text-white font-mono text-lg font-bold p-4 pl-9 rounded-xl focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">Introduce la suma física de todos los billetes y monedas que posees físicamente en el cajón de cambio.</p>
              </div>

              <button
                id="submit-arqueo-corte-btn"
                type="submit"
                className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-sans font-extrabold text-xs tracking-wider rounded-xl uppercase transition-colors shadow-lg shadow-purple-950/20"
              >
                Efectuar Corte de Caja & Limpiar Turno
              </button>
            </form>
          </div>

          {/* Cuts logging history */}
          <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="font-sans font-bold text-base text-white flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-purple-400" /> Historial de Cortes
              </h4>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {currentCut && (
                  <div className="p-4 bg-zinc-950 border border-emerald-900/40 rounded-xl space-y-2 animate-fade-in text-xs font-mono">
                    <div className="flex justify-between border-b border-zinc-900 pb-1 text-emerald-400 font-bold">
                      <span>CORTE EN CURSO</span>
                      <span>{new Date(currentCut.date).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Total Declarado:</span>
                      <span className="text-white">${currentCut.declaredCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Ventas Totales:</span>
                      <span className="text-white">${currentCut.calculatedSales.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Diferencia:</span>
                      <span className={`font-bold ${currentCut.difference === 0 ? 'text-emerald-400' : currentCut.difference < 0 ? 'text-rose-500 animate-pulse' : 'text-yellow-400'}`}>
                        {currentCut.difference === 0 ? "Cuadrado exacto ($0.00)" : `$${currentCut.difference.toFixed(2)} ${currentCut.difference < 0 ? "Faltante" : "Sobrante"}`}
                      </span>
                    </div>
                  </div>
                )}

                {historyCuts.length === 0 && !currentCut ? (
                  <div className="py-12 text-center text-xs text-zinc-650 font-mono space-y-2">
                    <History className="w-8 h-8 mx-auto text-zinc-800" />
                    <p>No se registran cortes en esta sesión.</p>
                  </div>
                ) : (
                  historyCuts.map((cut, idx) => (
                    <div key={idx} className="p-3 bg-zinc-950 rounded-lg text-[11px] font-mono border border-zinc-900">
                      <div className="flex justify-between text-zinc-500 font-bold">
                        <span>Corte #{cut.id.substring(4, 10)}</span>
                        <span>{new Date(cut.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400 mt-1">
                        <span>Declarado: ${cut.declaredCash}</span>
                        <span className={cut.difference < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          Df: ${cut.difference}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex items-start gap-2.5 text-xs text-zinc-400 leading-normal">
              <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p>Hacer un corte limpia la historia de ventas activas en el panel de administrador para arrancar el siguiente turno limpios y auditados.</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
