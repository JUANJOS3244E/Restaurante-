/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "ADMIN",
  MESERO = "MESERO",
  COCINA = "COCINA",
  CAJERO = "CAJERO"
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  isActive: boolean;
}

export enum TableStatus {
  FREE = "FREE",
  OCCUPIED = "OCCUPIED",
  BILL_REQUESTED = "BILL_REQUESTED",
  CLEANING = "CLEANING"
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

export enum MenuItemCategory {
  ENTRADAS = "ENTRADAS",
  FUERTES = "FUERTES",
  POSTRES = "POSTRES",
  BEBIDAS = "BEBIDAS"
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuItemCategory;
  available: boolean;
  image?: string;
  ingredients: {
    inventoryItemId: string;
    amountNeeded: number; // custom unit needed to prepare
  }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number; // threshold for alerts
  unit: string;
  lastUpdated: string;
}

export enum OrderStatus {
  RECEIVED = "RECEIVED",
  PREPARING = "PREPARING",
  READY = "READY",
  SERVED = "SERVED",
  PAID = "PAID"
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";
  notes?: string;
}

export interface SaleRecord {
  id: string;
  orderId: string;
  total: number;
  paymentMethod: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";
  date: string; // ISO string
}

export interface CashCut {
  id: string;
  date: string;
  userId: string;
  userName: string;
  initialCash: number;
  calculatedSales: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    total: number;
  };
  declaredCash: number;
  difference: number;
  status: "OPEN" | "CLOSED";
}
