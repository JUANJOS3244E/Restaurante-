/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, UserRole, MenuItem, InventoryItem, Table, Order, OrderStatus } from "./types";
import {
  INITIAL_USERS,
  INITIAL_MENU,
  INITIAL_INVENTORY,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_SALES_HISTORY,
} from "./mockData";

import LoginModal from "./components/LoginModal";
import AdminPanel from "./components/AdminPanel";
import WaiterPanel from "./components/WaiterPanel";
import KitchenPanel from "./components/KitchenPanel";
import CashierPanel from "./components/CashierPanel";

import { Shield, Smartphone, ChefHat, Wallet, LogOut, Clock, Flame, UserCheck, RefreshCw } from "lucide-react";

export default function App() {
  // --- Core Persistent States ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("gf_users");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem("gf_menu");
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("gf_inventory");
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem("gf_tables");
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("gf_orders");
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [salesHistory, setSalesHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("gf_sales_history");
    return saved ? JSON.parse(saved) : INITIAL_SALES_HISTORY;
  });

  // Current logged in personnel
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("gf_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation Panel tab selection (Dynamic depending on active role)
  const [activeModule, setActiveModule] = useState<UserRole>(UserRole.ADMIN);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem("gf_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("gf_menu", JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem("gf_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("gf_tables", JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem("gf_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("gf_sales_history", JSON.stringify(salesHistory));
  }, [salesHistory]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("gf_current_user", JSON.stringify(currentUser));
      // Auto assign active category module depending on role
      setActiveModule(currentUser.role);
    } else {
      localStorage.removeItem("gf_current_user");
    }
  }, [currentUser]);

  // Handle actions
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveModule(user.role);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Registering a payment sale
  const handleRegisterSale = (sale: any) => {
    setSalesHistory((prev) => [sale, ...prev]);

    // Deduct raw ingredients from inventory using recipe card mappings
    if (sale.items) {
      setInventory((prevInv) => {
        const updatedInv = [...prevInv];
        sale.items.forEach((oi: any) => {
          // Look up menu item recipe details
          const menuItemMatch = menu.find((item) => item.id === oi.menuItemId || item.name === oi.name);
          if (menuItemMatch && menuItemMatch.ingredients) {
            menuItemMatch.ingredients.forEach((ing) => {
              const matchedInvIdx = updatedInv.findIndex((stock) => stock.id === ing.inventoryItemId);
              if (matchedInvIdx > -1) {
                const currentStockAmount = updatedInv[matchedInvIdx].quantity;
                const demand = ing.amountNeeded * oi.quantity;
                updatedInv[matchedInvIdx] = {
                  ...updatedInv[matchedInvIdx],
                  quantity: Number(Math.max(0, currentStockAmount - demand).toFixed(2)),
                  lastUpdated: new Date().toISOString(),
                };
              }
            });
          }
        });
        return updatedInv;
      });
    }
  };

  // Kitchen toggle statuses
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId) {
          return { ...o, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return o;
      })
    );

    // If order was served, we can also update the table status to cleaning as well or keep occupied until bill
  };

  const handleClearSalesHistory = () => {
    // Audit clear triggered by cash cut-out
    setSalesHistory([]);
  };

  // Reset Demo to fresh state
  const handleResetDemoState = () => {
    if (confirm("¿Estás seguro de que deseas restablecer todos los datos del sistema a los valores iniciales de fábrica?")) {
      localStorage.clear();
      setUsers(INITIAL_USERS);
      setMenu(INITIAL_MENU);
      setInventory(INITIAL_INVENTORY);
      setTables(INITIAL_TABLES);
      setOrders(INITIAL_ORDERS);
      setSalesHistory(INITIAL_SALES_HISTORY);
      setCurrentUser(null);
      alert("¡Sistema restablecido correctamente!");
    }
  };

  // Help calculate role visuals
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Administrador General";
      case UserRole.MESERO:
        return "Mesero Autorizado";
      case UserRole.COCINA:
        return "Chef de Cocina";
      case UserRole.CAJERO:
        return "Cajero Term. A";
    }
  };

  const getRoleHeaderIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="w-4 h-4 text-amber-500" />;
      case UserRole.MESERO:
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case UserRole.COCINA:
        return <ChefHat className="w-4 h-4 text-blue-400" />;
      case UserRole.CAJERO:
        return <Wallet className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] grid-bg text-[#E4E4E7] font-sans flex flex-col">
      {/* -------------------- MAIN HEADER -------------------- */}
      {currentUser && (
        <header className="bg-[#080808] border-b border-[#1A1A1A] px-6 h-14 flex flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-bold text-black shadow-lg shadow-orange-600/10">
              G
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold tracking-tighter text-white flex items-center gap-1.5 leading-none">
                GASTROFLOW
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              </h2>
              <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5">HIGH DENSITY OPERATIVE DESK</p>
            </div>
          </div>

          {/* Nav switcher - Restricted depending on logged role */}
          <div className="flex bg-[#0D0D0D] p-1 border border-[#1F1F1F] rounded gap-1 text-[11px] font-mono">
            {/* ADMINS CAN SWITCH VIEWS OPTIONALLY FOR FULL DEMONSTRATION TESTING */}
            {currentUser.role === UserRole.ADMIN ? (
              <>
                <button
                  id="nav-btn-admin"
                  onClick={() => setActiveModule(UserRole.ADMIN)}
                  className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 font-bold ${
                    activeModule === UserRole.ADMIN ? "bg-orange-600 text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Shield className="w-3 h-3" /> Admin
                </button>
                <button
                  id="nav-btn-waiters"
                  onClick={() => setActiveModule(UserRole.MESERO)}
                  className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 font-bold ${
                    activeModule === UserRole.MESERO ? "bg-orange-600 text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3 h-3" /> Meseros
                </button>
                <button
                  id="nav-btn-kitchen"
                  onClick={() => setActiveModule(UserRole.COCINA)}
                  className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 font-bold ${
                    activeModule === UserRole.COCINA ? "bg-orange-600 text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <ChefHat className="w-3 h-3" /> Cocina
                </button>
                <button
                  id="nav-btn-cashier"
                  onClick={() => setActiveModule(UserRole.CAJERO)}
                  className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 font-bold ${
                    activeModule === UserRole.CAJERO ? "bg-orange-600 text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Wallet className="w-3 h-3" /> Caja
                </button>
              </>
            ) : (
              // RESTRICTED PERSONNEL CAN ONLY LAND IN THEIR ASSIGNED PANEL IN ACCORDANCE WITH REQ "el mesero solo podrá crear pedidos y cobrar"
              <div className="px-3 py-1 text-zinc-400 font-mono text-[10px] flex items-center gap-1.5 bg-black rounded">
                {getRoleHeaderIcon(currentUser.role)}
                Módulos Activos Permitidos: <strong className="text-white uppercase text-[10px]">{getRoleLabel(currentUser.role)}</strong>
              </div>
            )}
          </div>

          {/* Current User Session details info */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-zinc-300 font-mono font-bold block">{currentUser.name}</span>
              <span className="text-[9px] text-zinc-500 font-mono flex items-center justify-end gap-1 mt-0.5 uppercase">
                {getRoleHeaderIcon(currentUser.role)} {getRoleLabel(currentUser.role)}
              </span>
            </div>

            <button
              id="top-logout-btn"
              onClick={handleLogout}
              className="p-1.5 bg-[#0D0D0D] hover:bg-rose-950/20 border border-[#1F1F1F] hover:border-rose-900 text-zinc-400 hover:text-rose-400 rounded transition-all"
              title="Cerrar Sesión Activa"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* ------------------- MAIN BOARD WORKSPACE ------------------- */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {currentUser ? (
          // RENDER MODULARS DYNAMICALLY
          <>
            {activeModule === UserRole.ADMIN && (
              <AdminPanel
                menu={menu}
                inventory={inventory}
                users={users}
                salesHistory={salesHistory}
                onUpdateMenu={setMenu}
                onUpdateInventory={setInventory}
                onUpdateUsers={setUsers}
              />
            )}

            {activeModule === UserRole.MESERO && (
              <WaiterPanel
                tables={tables}
                menu={menu}
                orders={orders}
                currentUser={currentUser}
                onUpdateTables={setTables}
                onUpdateOrders={setOrders}
                onRegisterSale={handleRegisterSale}
              />
            )}

            {activeModule === UserRole.COCINA && (
              <KitchenPanel orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
            )}

            {activeModule === UserRole.CAJERO && (
              <CashierPanel
                tables={tables}
                orders={orders}
                salesHistory={salesHistory}
                currentUser={currentUser}
                onUpdateTables={setTables}
                onUpdateOrders={setOrders}
                onRegisterSale={handleRegisterSale}
                onClearSalesHistory={handleClearSalesHistory}
              />
            )}
          </>
        ) : (
          <LoginModal users={users} onLogin={handleLogin} currentUser={currentUser} />
        )}
      </main>

      {/* -------------------- FLOATING GENERAL METADATA / UTILS FOOTER -------------------- */}
      {currentUser && (
        <footer className="bg-zinc-950 border-t border-zinc-900 px-6 py-2.5 text-[10px] text-zinc-650 flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-zinc-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></span>
            <span>Local Terminal GOURMET-FLOW: Active</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="reset-demo-all-state-btn"
              onClick={handleResetDemoState}
              className="text-zinc-600 hover:text-rose-400 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Restablecer Fábrica
            </button>
            <span className="hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-600" /> UTC: 2026-05-20 18:39:08
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}
