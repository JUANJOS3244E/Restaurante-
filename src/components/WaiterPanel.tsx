/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Table, TableStatus, MenuItem, MenuItemCategory, Order, OrderStatus, OrderItem, User } from "../types";
import { Coffee, Smartphone, User as UserIcon, Send, Plus, Minus, X, Trash2, CheckCircle2, DollarSign, Receipt, CreditCard, RefreshCw, AlertCircle } from "lucide-react";

interface WaiterPanelProps {
  tables: Table[];
  menu: MenuItem[];
  orders: Order[];
  currentUser: User;
  onUpdateTables: (tables: Table[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onRegisterSale: (sale: any) => void;
}

export default function WaiterPanel({
  tables,
  menu,
  orders,
  currentUser,
  onUpdateTables,
  onUpdateOrders,
  onRegisterSale
}: WaiterPanelProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeCategory, setActiveCategory] = useState<MenuItemCategory>(MenuItemCategory.ENTRADAS);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [itemNotes, setItemNotes] = useState<{ [key: string]: string }>({});
  
  // Checkout/Payment flow states
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA">("EFECTIVO");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<Order | null>(null);

  // Active / Existing order on table if any
  const getActiveOrderForTable = (table: Table) => {
    return orders.find(o => o.tableNumber === table.number && o.status !== OrderStatus.PAID);
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    const existingOrder = getActiveOrderForTable(table);
    if (existingOrder) {
      setCurrentOrderItems(existingOrder.items);
      setNotes(existingOrder.notes || "");
    } else {
      setCurrentOrderItems([]);
      setNotes("");
    }
    setIsPaying(false);
    setShowInvoice(false);
  };

  const handleAddItemToOrder = (item: MenuItem) => {
    if (!item.available) return;
    
    setCurrentOrderItems(prev => {
      const existsIdx = prev.findIndex(oi => oi.menuItemId === item.id);
      if (existsIdx > -1) {
        const copy = [...prev];
        copy[existsIdx].quantity += 1;
        return copy;
      } else {
        return [...prev, {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          notes: ""
        }];
      }
    });
  };

  const handleRemoveItemQuantity = (itemId: string) => {
    setCurrentOrderItems(prev => {
      const idx = prev.findIndex(oi => oi.menuItemId === itemId);
      if (idx === -1) return prev;
      
      const copy = [...prev];
      if (copy[idx].quantity > 1) {
        copy[idx].quantity -= 1;
        return copy;
      } else {
        return copy.filter(oi => oi.menuItemId !== itemId);
      }
    });
  };

  const handleRemoveWholeItem = (itemId: string) => {
    setCurrentOrderItems(prev => prev.filter(oi => oi.menuItemId !== itemId));
  };

  const handleSetItemNotes = (itemId: string, noteText: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: noteText }));
    setCurrentOrderItems(prev => {
      return prev.map(oi => oi.menuItemId === itemId ? { ...oi, notes: noteText } : oi);
    });
  };

  // Calculate prices
  const subtotal = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

  const handleSendOrderToKitchen = () => {
    if (!selectedTable || currentOrderItems.length === 0) return;

    const existingOrder = getActiveOrderForTable(selectedTable);

    if (existingOrder) {
      // Modify active order
      const updatedOrders = orders.map(o => {
        if (o.id === existingOrder.id) {
          return {
            ...o,
            items: currentOrderItems,
            subtotal,
            tax,
            total,
            notes,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      });
      onUpdateOrders(updatedOrders);
      alert(`¡Mesa ${selectedTable.number} actualizada con éxito!`);
    } else {
      // Create new order
      const newOrderId = `o-${Date.now()}`;
      const newOrder: Order = {
        id: newOrderId,
        tableNumber: selectedTable.number,
        waiterId: currentUser.id,
        waiterName: currentUser.name,
        items: currentOrderItems,
        status: OrderStatus.RECEIVED,
        subtotal,
        tax,
        total,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onUpdateOrders([...orders, newOrder]);
      
      // Update Table Status to occupied
      const updatedTables = tables.map(t => 
        t.id === selectedTable.id 
          ? { ...t, status: TableStatus.OCCUPIED, currentOrderId: newOrderId }
          : t
      );
      onUpdateTables(updatedTables);
      
      // Also update selected table state locally
      setSelectedTable(prev => prev ? { ...prev, status: TableStatus.OCCUPIED, currentOrderId: newOrderId } : null);
      
      alert(`¡Comanda enviada a cocina para la Mesa ${selectedTable.number}!`);
    }
  };

  const handleRequestBill = () => {
    if (!selectedTable) return;
    const updatedTables = tables.map(t =>
      t.id === selectedTable.id ? { ...t, status: TableStatus.BILL_REQUESTED } : t
    );
    onUpdateTables(updatedTables);
    setSelectedTable(prev => prev ? { ...prev, status: TableStatus.BILL_REQUESTED } : null);
  };

  const handleSetTableCleaning = () => {
    if (!selectedTable) return;
    const updatedTables = tables.map(t =>
      t.id === selectedTable.id ? { ...t, status: TableStatus.CLEANING, currentOrderId: undefined } : t
    );
    onUpdateTables(updatedTables);
    setSelectedTable(null); // Deselect
  };

  const handleSetTableFree = (tbl: Table) => {
    const updatedTables = tables.map(t =>
      t.id === tbl.id ? { ...t, status: TableStatus.FREE, currentOrderId: undefined } : t
    );
    onUpdateTables(updatedTables);
    if (selectedTable?.id === tbl.id) {
      setSelectedTable(null);
    }
  };

  // Payment checkout processing
  const handleProcessPayment = () => {
    if (!selectedTable) return;
    const activeOrder = getActiveOrderForTable(selectedTable);
    if (!activeOrder) return;

    if (paymentMethod === "EFECTIVO" && cashReceived < total) {
      alert("El efectivo recibido debe ser mayor o igual al total de la cuenta.");
      return;
    }

    // Mark order as paid
    const updatedOrders = orders.map(o => 
      o.id === activeOrder.id ? { ...o, status: OrderStatus.PAID, paymentMethod } : o
    );
    onUpdateOrders(updatedOrders);

    // Register sale record
    const saleRecord = {
      id: `s-${Date.now()}`,
      orderId: activeOrder.id,
      total: total,
      paymentMethod,
      date: new Date().toISOString(),
      waiterName: activeOrder.waiterName,
      items: activeOrder.items
    };
    onRegisterSale(saleRecord);

    // Set Table to Cleaning or Free
    const updatedTables = tables.map(t =>
      t.id === selectedTable.id ? { ...t, status: TableStatus.CLEANING, currentOrderId: undefined } : t
    );
    onUpdateTables(updatedTables);

    // Keep invoice state for receipt rendering
    setLastSavedOrder({
      ...activeOrder,
      status: OrderStatus.PAID,
      paymentMethod
    });
    setShowInvoice(true);
    setIsPaying(false);
  };

  const getTableColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.FREE:
        return "bg-zinc-900 border-emerald-500 text-emerald-500 hover:bg-emerald-950/20";
      case TableStatus.OCCUPIED:
        return "bg-zinc-900 border-rose-500 text-rose-500 hover:bg-rose-950/20";
      case TableStatus.BILL_REQUESTED:
        return "bg-zinc-900 border-yellow-500 text-yellow-500 hover:bg-yellow-950/20 animate-pulse";
      case TableStatus.CLEANING:
        return "bg-zinc-900 border-blue-500 text-blue-400 hover:bg-zinc-900";
    }
  };

  const getTableStatusLabel = (status: TableStatus) => {
    switch (status) {
      case TableStatus.FREE: return "Libre";
      case TableStatus.OCCUPIED: return "Ocupada";
      case TableStatus.BILL_REQUESTED: return "Pidiendo Cuenta";
      case TableStatus.CLEANING: return "En Limpieza";
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#050505] text-[#E4E4E7] min-h-0 relative">
      
      {/* -------------------- LEFT SIDE: Tables Map -------------------- */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1A1A1A] pb-4">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 tracking-widest block">MÓDULO DE SERVICIO EN PISO</span>
            <h1 className="text-xl font-sans font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-orange-500" />
              Toma de Comandas & Mesas
            </h1>
            <p className="text-xs text-zinc-500 mt-1">Selecciona una mesa física para iniciar el pedido o procesar el cobro.</p>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 p-2 bg-[#0D0D0D] border border-[#1F1F1F] rounded text-xs font-mono">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500" /> Libre</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-rose-500" /> Ocupada</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-yellow-500" /> Cobro Solicitado</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500" /> Limpieza</div>
          </div>
        </div>

        {/* Spatial Grid Tables Mapping */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
          {tables.map(table => {
            const activeOrder = getActiveOrderForTable(table);
            const isSelected = selectedTable?.id === table.id;
            
            return (
              <button
                id={`table-grid-btn-${table.id}`}
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`flex flex-col items-center justify-between p-4 rounded border-2 aspect-square cursor-pointer transition-all ${getTableColor(table.status)} ${
                  isSelected ? "scale-[1.02] ring-1 ring-orange-500 shadow-md" : ""
                }`}
              >
                <div className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Mesa</div>
                
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-sans font-bold tracking-tight">{table.number}</span>
                  <span className="text-[10px] font-mono text-zinc-500 mt-1">{table.capacity} pax</span>
                </div>

                <div className="w-full text-center">
                  {activeOrder ? (
                    <div className="px-2 py-0.5 mt-2 bg-black rounded border border-[#1F1F1F] text-[10px] font-mono truncate text-zinc-200">
                      ${activeOrder.total.toFixed(0)} ({activeOrder.items.length} items)
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-400">{getTableStatusLabel(table.status)}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------- RIGHT SIDE DETAILS / DRAWER -------------------- */}
      <div className={`w-full md:w-[450px] bg-zinc-900/60 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col min-h-[400px] md:min-h-0 shrink-0 ${selectedTable || showInvoice ? 'block' : 'hidden md:flex items-center justify-center p-8'}`}>
        
        {showInvoice && lastSavedOrder && (
          <div className="flex-1 flex flex-col p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-sans font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Pago Confirmado
              </h3>
              <button
                id="close-invoice-btn"
                onClick={() => {
                  setShowInvoice(false);
                  setLastSavedOrder(null);
                }}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Receipt paper */}
            <div className="bg-white text-zinc-950 p-6 rounded-2xl shadow-inner font-mono text-xs space-y-4 max-h-[50vh] overflow-y-auto">
              <div className="text-center space-y-1">
                <h4 className="font-sans font-bold text-base tracking-tight uppercase">EL CHURRASCO GOURMET</h4>
                <p className="text-[10px] text-zinc-500">Calle Gourmet #300, Ciudad de México</p>
                <p className="text-[10px] text-zinc-500">RFC: CHU-050479-CETIS</p>
              </div>

              <div className="border-t border-b border-dashed border-zinc-300 py-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Mesa: {lastSavedOrder.tableNumber}</span>
                  <span>Mesero: {lastSavedOrder.waiterName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ticket: {lastSavedOrder.id.substring(3, 10)}</span>
                  <span>Fecha: {new Date(lastSavedOrder.updatedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="grid grid-cols-4 font-bold border-b border-zinc-100 pb-1">
                  <span className="col-span-2">Concepto</span>
                  <span className="text-center">Cant</span>
                  <span className="text-right">Total</span>
                </div>
                {lastSavedOrder.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-4 text-zinc-700">
                    <span className="col-span-2 truncate">{it.name}</span>
                    <span className="text-center">x{it.quantity}</span>
                    <span className="text-right">${(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-300 pt-3 space-y-1 text-right">
                <div className="flex justify-between font-normal text-zinc-600">
                  <span>Subtotal:</span>
                  <span>${lastSavedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-normal text-zinc-600">
                  <span>IVA (16%):</span>
                  <span>${lastSavedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-950 text-sm">
                  <span>TOTAL COBRADO:</span>
                  <span>${lastSavedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-3 text-center text-[10px] space-y-1 text-zinc-500">
                <p>Método de Pago: <span className="font-bold text-zinc-800">{lastSavedOrder.paymentMethod}</span></p>
                <p>¡Gracias por su grata preferencia!</p>
                <p className="text-[8px] text-zinc-400">Desarrollado en Cetis 7 - Hugo</p>
              </div>
            </div>

            <button
              id="confirm-invoice-done-btn"
              onClick={() => {
                setShowInvoice(false);
                setLastSavedOrder(null);
              }}
              className="mt-6 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl text-center shadow-lg transition-colors text-xs uppercase font-mono"
            >
              Listo, Mesa Liberada
            </button>
          </div>
        )}

        {!showInvoice && selectedTable && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header Dialog */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-white">MESA {selectedTable.number}</span>
                  {selectedTable.status === TableStatus.CLEANING && (
                    <span className="px-1.5 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-900/50 rounded text-[10px] font-mono">Limpieza</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {selectedTable.status === TableStatus.FREE ? "Inicia un nuevo pedido" : "Administrar Cuenta Activa"}
                </p>
              </div>
              <button
                id="close-table-panel-btn"
                onClick={() => setSelectedTable(null)}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CLEANING TABLE FLOW */}
            {selectedTable.status === TableStatus.CLEANING && (
              <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-950/40 border border-blue-900/60 flex items-center justify-center text-blue-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h4 className="font-sans font-bold text-lg text-white">Limpieza y Sanitización</h4>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">Esta mesa fue desocupada recientemente. Por favor, confirma si ya se encuentra lista para el siguiente cliente.</p>
                <button
                  id="liberar-mesa-btn"
                  onClick={() => handleSetTableFree(selectedTable)}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold font-mono text-xs rounded-xl shadow-lg transition-colors uppercase"
                >
                  Confirmar Mesa Vacía (Libre)
                </button>
              </div>
            )}

            {/* ORDER OR PAYMENT TAKING FLOW */}
            {selectedTable.status !== TableStatus.CLEANING && !isPaying && (
              <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/20">
                {/* Active items / Ticket area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-xs font-mono text-zinc-400">COMANDA ACTIVA</span>
                    {getActiveOrderForTable(selectedTable) && (
                      <span className="text-[10px] text-zinc-500">Por: {getActiveOrderForTable(selectedTable)?.waiterName}</span>
                    )}
                  </div>

                  {currentOrderItems.length === 0 ? (
                    <div className="py-12 border border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                      <Receipt className="w-8 h-8 text-zinc-650 mb-3" />
                      <p className="text-sm text-zinc-400 font-medium">Cuenta Vacía</p>
                      <p className="text-xs text-zinc-600 mt-1">Añade platillos de la carta usando la rejilla inferior.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentOrderItems.map((oi, idx) => (
                        <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-1.5 hover:border-zinc-800 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-sans font-semibold text-sm text-white leading-tight flex-1">
                              {oi.name}
                            </span>
                            <span className="font-mono text-xs text-zinc-400 font-medium">${oi.price * oi.quantity}</span>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            {/* Notes input */}
                            <input
                              id={`item-notes-input-${idx}`}
                              type="text"
                              placeholder="Sin cebolla, t. medio..."
                              value={oi.notes || ""}
                              onChange={(e) => handleSetItemNotes(oi.menuItemId, e.target.value)}
                              className="w-1/2 bg-transparent text-[10px] text-amber-500 placeholder-zinc-700 focus:outline-none focus:border-b focus:border-amber-900/40 pb-0.5"
                            />

                            {/* Qty selectors */}
                            <div className="flex items-center gap-2">
                              <button
                                id={`qty-minus-${idx}`}
                                onClick={() => handleRemoveItemQuantity(oi.menuItemId)}
                                className="w-5 h-5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs text-white min-w-[14px] text-center font-bold">
                                {oi.quantity}
                              </span>
                              <button
                                id={`qty-plus-${idx}`}
                                onClick={() => {
                                  const baseItem = menu.find(m => m.id === oi.menuItemId);
                                  if (baseItem) handleAddItemToOrder(baseItem);
                                }}
                                className="w-5 h-5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                id={`qty-trash-${idx}`}
                                onClick={() => handleRemoveWholeItem(oi.menuItemId)}
                                className="text-zinc-600 hover:text-rose-400 ml-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* General notes for order */}
                  {currentOrderItems.length > 0 && (
                    <div className="pt-2">
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Notas generales Comanda</label>
                      <input
                        id="order-general-notes"
                        type="text"
                        placeholder="Ej: Plato compartido, servir postre al final..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Simple categories catalog grid INSIDE the panel for easy food selection */}
                  <div className="pt-4 border-t border-zinc-900">
                    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
                      {Object.values(MenuItemCategory).map((cat) => (
                        <button
                          id={`cat-pill-${cat}`}
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3 py-1 text-[10px] font-mono rounded-full font-bold uppercase shrink-0 ${
                            activeCategory === cat ? "bg-amber-500 text-zinc-950" : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-[190px] overflow-y-auto">
                      {menu.filter(m => m.category === activeCategory).map(item => (
                        <button
                          id={`quick-menu-item-${item.id}`}
                          key={item.id}
                          disabled={!item.available}
                          onClick={() => handleAddItemToOrder(item)}
                          className={`w-full text-left p-2.5 bg-zinc-900/50 border border-zinc-900 hover:bg-zinc-900/90 rounded-xl flex justify-between items-center transition-all ${
                            !item.available ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold text-white">{item.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 max-w-[200px] truncate">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono font-bold text-amber-500">${item.price}</p>
                            {!item.available && <span className="text-[8px] text-rose-500 font-mono">Agotado</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subtotals & Main Actions */}
                {currentOrderItems.length > 0 && (
                  <div className="p-6 bg-zinc-950 border-t border-zinc-900 space-y-4">
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-zinc-500">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>IVA (16%):</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold text-base border-t border-zinc-850 pt-2">
                        <span>Total:</span>
                        <span className="text-amber-500">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="save-comanda-kitchen-btn"
                        onClick={handleSendOrderToKitchen}
                        className="px-4 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 text-zinc-500" /> Cocina
                      </button>

                      {/* Cobrar section toggles */}
                      <button
                        id="cobrar-mesa-btn"
                        onClick={() => {
                          setIsPaying(true);
                          setCashReceived(Math.ceil(total / 50) * 50); // Guess next interval for cash suggestion
                        }}
                        className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Cobrar Cuenta
                      </button>
                    </div>

                    {selectedTable.status === TableStatus.OCCUPIED && (
                      <button
                        id="solicitar-cuenta-btn"
                        onClick={handleRequestBill}
                        className="w-full text-center py-2 bg-yellow-950/20 hover:bg-yellow-950/40 border border-yellow-900/40 text-yellow-400 rounded-lg text-xs font-mono"
                      >
                        Marcar: Pidiendo Cuenta
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DIRECT COBRO (PAYMENT PROCESSING) DRAWER */}
            {selectedTable.status !== TableStatus.CLEANING && isPaying && (
              <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/40 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <h4 className="font-sans font-bold text-base text-white">Procesar Cobro</h4>
                  <button
                    id="cancel-cobro-btn"
                    onClick={() => setIsPaying(false)}
                    className="text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Volver
                  </button>
                </div>

                <div className="p-4 bg-zinc-900/60 border border-zinc-900 rounded-2xl">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Monto Neto a Cobrar</span>
                  <p className="text-3xl font-mono font-extrabold text-amber-500 mt-1">${total.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Incluye 16% de IVA sobre consumos</p>
                </div>

                {/* Select Payment Method */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Forma de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "EFECTIVO", label: "Efectivo", icon: <DollarSign className="w-4 h-4" /> },
                      { key: "TARJETA", label: "Tarjeta", icon: <CreditCard className="w-4 h-4" /> },
                      { key: "TRANSFERENCIA", label: "Transf.", icon: <Receipt className="w-4 h-4" /> }
                    ].map((mode) => (
                      <button
                        id={`pay-mode-btn-${mode.key}`}
                        key={mode.key}
                        type="button"
                        onClick={() => setPaymentMethod(mode.key as any)}
                        className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all outline-none ${
                          paymentMethod === mode.key
                            ? "bg-amber-500 border-amber-500 text-zinc-950 font-bold"
                            : "bg-zinc-900 border-zinc-800/60 text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        {mode.icon}
                        <span className="text-[10px] uppercase font-mono">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extra fields if Cash */}
                {paymentMethod === "EFECTIVO" && (
                  <div className="space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase">¿Cuánto Efectivo Recibes?</label>
                      <input
                        id="cash-received-input"
                        type="number"
                        min={total}
                        placeholder="Monto"
                        value={cashReceived || ""}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono text-base font-bold p-3 rounded-xl focus:outline-none focus:border-amber-500 mt-1.5"
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono p-3 bg-zinc-900/20 border border-dashed border-zinc-900 rounded-xl">
                      <span className="text-zinc-500">Cambio aproximado:</span>
                      <span className={`font-bold ${cashReceived >= total ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {cashReceived >= total ? `$${(cashReceived - total).toFixed(2)}` : "Monto Insuficiente"}
                      </span>
                    </div>

                    {/* Quick values keys */}
                    <div className="flex gap-2 justify-center">
                      {[Math.ceil(total), Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 200) * 200].map((quick, idx) => (
                        <button
                          id={`quick-cash-bill-${idx}`}
                          key={idx}
                          type="button"
                          onClick={() => setCashReceived(quick)}
                          className="px-2.5 py-1 text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-md transition-all"
                        >
                          ${quick}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-900">
                  <button
                    id="confirm-payment-final-btn"
                    onClick={handleProcessPayment}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-sans font-extrabold text-xs tracking-wider rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-colors uppercase"
                  >
                    Confirmar Transacción & Emitir Nota
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {!selectedTable && !showInvoice && (
          <div className="text-center p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-650 animate-pulse">
              <Coffee className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-sans font-bold text-base">Mesa no seleccionada</p>
            <p className="text-zinc-600 text-xs mt-1.5 max-w-xs leading-relaxed">Toca cualquier mesa en el mapa interactivo de la izquierda para ver su comanda activa, añadir platillos, o procesar cobros directamente.</p>
          </div>
        )}

      </div>

    </div>
  );
}
