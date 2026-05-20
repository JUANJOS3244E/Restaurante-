/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Order, OrderStatus, MenuItem } from "../types";
import { ChefHat, Flame, Bell, Check, Clock, UserCheck, Inbox } from "lucide-react";

interface KitchenPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, newStatus: OrderStatus) => void;
}

export default function KitchenPanel({ orders, onUpdateOrderStatus }: KitchenPanelProps) {
  // Kitchen focuses only on pending, preparing, and ready categories
  const activeKitchenOrders = orders.filter(
    (o) => o.status === OrderStatus.RECEIVED || o.status === OrderStatus.PREPARING || o.status === OrderStatus.READY
  );

  const getElapsedTime = (isoString: string) => {
    try {
      const created = new Date(isoString).getTime();
      const now = new Date("2026-05-20T18:39:08Z").getTime(); // use context anchor time
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 0) return "Hace 1 min";
      if (diffMins === 0) return "Justo ahora";
      return `Hace ${diffMins} min`;
    } catch {
      return "Recibido";
    }
  };

  const getStatusHeaderBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.RECEIVED:
        return (
          <span className="px-3 py-1 text-[10px] font-mono rounded bg-rose-950/40 text-rose-400 border border-rose-900/40 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Por Confirmar
          </span>
        );
      case OrderStatus.PREPARING:
        return (
          <span className="px-3 py-1 text-[10px] font-mono rounded bg-amber-950/40 text-amber-400 border border-amber-900/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" /> En Fuego / Cocina
          </span>
        );
      case OrderStatus.READY:
        return (
          <span className="px-3 py-1 text-[10px] font-mono rounded bg-emerald-950/40 text-emerald-400 border border-emerald-950 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Listo para Servir
          </span>
        );
      default:
        return null;
    }
  };

  const getUrgencyBorder = (isoString: string) => {
    try {
      const created = new Date(isoString).getTime();
      const now = new Date("2026-05-20T18:39:08Z").getTime();
      const diffMins = Math.floor((now - created) / 60000);
      
      if (diffMins >= 15) return "border-rose-500/80 shadow-rose-950/20"; // critically waiting
      if (diffMins >= 8) return "border-amber-500/60 shadow-amber-950/10"; // warned
      return "border-zinc-800 shadow-transparent";
    } catch {
      return "border-zinc-800";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[#050505] text-[#E4E4E7] flex flex-col min-h-0 relative">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[#1A1A1A] pb-4">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest block uppercase">PREPARACIÓN Y DESPACHO LÍNEA CALIENTE</span>
          <h1 className="text-xl font-sans font-bold text-white flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Cocina en Vivo
          </h1>
          <p className="text-[11px] text-zinc-500 mt-1">Control de comandas de forma continua. El personal cambia la orden a Preparación y Despacho.</p>
        </div>

        {/* Board quick stats */}
        <div className="flex bg-[#0D0D0D] w-full md:w-auto p-2 border border-[#1F1F1F] rounded gap-4 text-center text-xs font-mono">
          <div className="px-1">
            <span className="block text-[10px] text-zinc-500 uppercase">Pendientes</span>
            <span className="text-sm font-bold text-red-400">{activeKitchenOrders.filter(o => o.status === OrderStatus.RECEIVED).length}</span>
          </div>
          <div className="border-r border-[#1F1F1F]" />
          <div className="px-1">
            <span className="block text-[10px] text-zinc-500 uppercase">En Fuego</span>
            <span className="text-sm font-bold text-orange-400">{activeKitchenOrders.filter(o => o.status === OrderStatus.PREPARING).length}</span>
          </div>
          <div className="border-r border-[#1F1F1F]" />
          <div className="px-1">
            <span className="block text-[10px] text-zinc-500 uppercase">Listos</span>
            <span className="text-sm font-bold text-emerald-400">{activeKitchenOrders.filter(o => o.status === OrderStatus.READY).length}</span>
          </div>
        </div>
      </div>

      {activeKitchenOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0D0D0D]/50 border border-dashed border-[#1F1F1F] rounded min-h-[300px]">
          <div className="w-16 h-16 rounded bg-[#0D0D0D] border border-zinc-900 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-zinc-700 animate-pulse" />
          </div>
          <h3 className="text-sm font-sans font-bold text-white">Comandero Vacío</h3>
          <p className="text-zinc-500 text-xs max-w-sm text-center mt-1 leading-relaxed">
            No hay platillos pendientes. Los pedidos de los meseros se reflejarán inmediatamente en esta bandeja.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeKitchenOrders.map((order) => {
            const urgencyBorder = getUrgencyBorder(order.createdAt);
            const relativeTimeStr = getElapsedTime(order.createdAt);
            
            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between bg-[#0D0D0D] rounded border shadow-lg transition-all ${urgencyBorder}`}
              >
                {/* Header card info */}
                <div className="p-3 border-b border-[#1F1F1F] bg-[#111] flex items-center justify-between">
                  <div>
                    <span className="px-1.5 py-0.5 text-xs bg-orange-600/10 text-orange-500 rounded border border-orange-600/20 font-bold font-mono">
                      MESA {order.tableNumber}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono mt-1">
                      <Clock className="w-3 h-3 text-zinc-650" /> {relativeTimeStr}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {getStatusHeaderBadge(order.status)}
                    <span className="text-[10px] font-mono text-zinc-500 mt-1">Por: {order.waiterName}</span>
                  </div>
                </div>

                {/* Items collection list */}
                <div className="p-4 flex-1 space-y-3">
                  <div className="space-y-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex gap-2 justify-between items-start text-xs border-b border-[#151515] pb-2 last:border-b-0">
                        <div className="flex gap-2 items-start">
                          <span className="font-mono bg-black text-orange-500 font-extrabold px-1.5 py-0.5 rounded text-[10px] select-none">
                            x{it.quantity}
                          </span>
                          <div className="min-w-0">
                            <p className="font-sans font-bold text-zinc-200 text-xs leading-tight">{it.name}</p>
                            {it.notes && (
                              <p className="text-[10px] font-mono text-orange-500 bg-orange-950/20 px-1.5 py-0.5 mt-1 rounded border border-orange-900/20 max-w-fit font-semibold">
                                Nota: "{it.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="pt-2 border-t border-dashed border-[#1f1f23] text-[11px] bg-[#050505] p-2 rounded">
                      <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Nota de Servicio:</span>
                      <p className="text-zinc-400 font-sans italic">"{order.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls / State switches */}
                <div className="p-3 border-t border-[#1F1F1F] bg-[#111]">
                  {order.status === OrderStatus.RECEIVED && (
                    <button
                      id={`start-prep-btn-${order.id}`}
                      onClick={() => onUpdateOrderStatus(order.id, OrderStatus.PREPARING)}
                      className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 text-black rounded font-mono font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" /> EMPEZAR PREPARACIÓN
                    </button>
                  )}

                  {order.status === OrderStatus.PREPARING && (
                    <button
                      id={`finish-prep-btn-${order.id}`}
                      onClick={() => onUpdateOrderStatus(order.id, OrderStatus.READY)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black rounded font-mono font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 font-extrabold" /> MARCAR LISTO EN BARRA
                    </button>
                  )}

                  {order.status === OrderStatus.READY && (
                    <button
                      id={`deliver-prep-btn-${order.id}`}
                      onClick={() => onUpdateOrderStatus(order.id, OrderStatus.SERVED)}
                      className="w-full py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-350 rounded font-mono font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#1F1F1F]"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> ENTREGADO POR MESERO
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
