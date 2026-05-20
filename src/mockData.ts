/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole, Table, TableStatus, MenuItem, MenuItemCategory, InventoryItem, Order, OrderStatus } from "./types";

export const INITIAL_USERS: User[] = [
  { id: "u-1", name: "Administrador Hugo", pin: "1234", role: UserRole.ADMIN, isActive: true },
  { id: "u-2", name: "Mesera Sofía", pin: "4321", role: UserRole.MESERO, isActive: true },
  { id: "u-3", name: "Mesero Daniel", pin: "1111", role: UserRole.MESERO, isActive: true },
  { id: "u-4", name: "Chef Carlos", pin: "2222", role: UserRole.COCINA, isActive: true },
  { id: "u-5", name: "Cajera María", pin: "3333", role: UserRole.CAJERO, isActive: true }
];

export const INITIAL_TABLES: Table[] = [
  { id: "t-1", number: 1, capacity: 2, status: TableStatus.OCCUPIED, currentOrderId: "o-1" },
  { id: "t-2", number: 2, capacity: 4, status: TableStatus.FREE },
  { id: "t-3", number: 3, capacity: 4, status: TableStatus.BILL_REQUESTED, currentOrderId: "o-2" },
  { id: "t-4", number: 4, capacity: 6, status: TableStatus.FREE },
  { id: "t-5", number: 5, capacity: 2, status: TableStatus.OCCUPIED, currentOrderId: "o-3" },
  { id: "t-6", number: 6, capacity: 8, status: TableStatus.FREE },
  { id: "t-7", number: 7, capacity: 4, status: TableStatus.CLEANING },
  { id: "t-8", number: 8, capacity: 4, status: TableStatus.FREE }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "inv-1", name: "Carne de Res Premium", quantity: 15.5, minQuantity: 5.0, unit: "kg", lastUpdated: "2026-05-20T12:00:00Z" },
  { id: "inv-2", name: "Filete de Salmón", quantity: 3.2, minQuantity: 4.0, unit: "kg", lastUpdated: "2026-05-20T12:00:00Z" }, // Alerta escasez
  { id: "inv-3", name: "Queso Mozzarella", quantity: 12.0, minQuantity: 3.0, unit: "kg", lastUpdated: "2026-05-20T10:00:00Z" },
  { id: "inv-4", name: "Pasta Italiana", quantity: 20.0, minQuantity: 5.0, unit: "kg", lastUpdated: "2026-05-20T08:00:00Z" },
  { id: "inv-5", name: "Lechuga Romana", quantity: 1.5, minQuantity: 2.5, unit: "piezas", lastUpdated: "2026-05-20T15:30:00Z" }, // Alerta escasez
  { id: "inv-6", name: "Tomate Saladet", quantity: 18.2, minQuantity: 5.0, unit: "kg", lastUpdated: "2026-05-20T15:30:00Z" },
  { id: "inv-7", name: "Papas Rusas", quantity: 30.0, minQuantity: 10.0, unit: "kg", lastUpdated: "2026-05-20T09:00:00Z" },
  { id: "inv-8", name: "Pan Artesanal para Hamburguesa", quantity: 8, minQuantity: 15, unit: "pzas", lastUpdated: "2026-05-20T17:00:00Z" }, // Alerta escasez
  { id: "inv-9", name: "Cerveza Especial Corona", quantity: 48, minQuantity: 24, unit: "botellas", lastUpdated: "2026-05-20T12:00:00Z" },
  { id: "inv-10", name: "Café de Grano Orgánico", quantity: 5.0, minQuantity: 1.5, unit: "kg", lastUpdated: "2026-05-19T14:00:00Z" }
];

export const INITIAL_MENU: MenuItem[] = [
  // Entradas
  {
    id: "m-1",
    name: "Caldillo de Res & Costra",
    description: "Sopa tradicional con base de jitomate y chiles secos, servida con costra de queso mozzarella.",
    price: 110,
    category: MenuItemCategory.ENTRADAS,
    available: true,
    ingredients: [{ inventoryItemId: "inv-3", amountNeeded: 0.15 }]
  },
  {
    id: "m-2",
    name: "Ensalada César Clasica",
    description: "Lechuga romana fresca, crutones artesanal y aderezo secreto de la casa con parmesano.",
    price: 125,
    category: MenuItemCategory.ENTRADAS,
    available: true,
    ingredients: [{ inventoryItemId: "inv-5", amountNeeded: 0.4 }]
  },
  {
    id: "m-3",
    name: "Papas Gajo Crocantes",
    description: "Papas rústicas sazonadas con pimentón dulce, ajo y parmesano al horno.",
    price: 90,
    category: MenuItemCategory.ENTRADAS,
    available: true,
    ingredients: [{ inventoryItemId: "inv-7", amountNeeded: 0.35 }]
  },
  // Fuertes
  {
    id: "m-4",
    name: "Hamburguesa Gourmet Carbón",
    description: "200g carne de res premium, tocino ahumado, queso mozzarella gratinado en pan artesanal.",
    price: 195,
    category: MenuItemCategory.FUERTES,
    available: true,
    ingredients: [
      { inventoryItemId: "inv-1", amountNeeded: 0.2 },
      { inventoryItemId: "inv-8", amountNeeded: 1.0 },
      { inventoryItemId: "inv-3", amountNeeded: 0.08 }
    ]
  },
  {
    id: "m-5",
    name: "Salmón Grill Fins Herbes",
    description: "Filete de salmón fresco a las finas hierbas, puré de papas y vegetales salteados.",
    price: 280,
    category: MenuItemCategory.FUERTES,
    available: true,
    ingredients: [
      { inventoryItemId: "inv-2", amountNeeded: 0.25 },
      { inventoryItemId: "inv-7", amountNeeded: 0.15 }
    ]
  },
  {
    id: "m-6",
    name: "Pasta Alfredo con Pollo",
    description: "Fetuccini bañado en suculenta salsa alfredo cremosa con pechuga de pollo y hierbas.",
    price: 165,
    category: MenuItemCategory.FUERTES,
    available: true,
    ingredients: [
      { inventoryItemId: "inv-4", amountNeeded: 0.15 },
      { inventoryItemId: "inv-3", amountNeeded: 0.05 }
    ]
  },
  // Postres
  {
    id: "m-7",
    name: "Volcán de Chocolate Amargo",
    description: "Delicioso bizcocho con centro de chocolate fundido, acompañado de helado de vainilla.",
    price: 115,
    category: MenuItemCategory.POSTRES,
    available: true,
    ingredients: []
  },
  {
    id: "m-8",
    name: "Cheesecake de Frutos Rojos",
    description: "Fría tarta de queso con base crujiente de galleta y coulis de zarzamoras y fresas.",
    price: 105,
    category: MenuItemCategory.POSTRES,
    available: true,
    ingredients: []
  },
  // Bebidas
  {
    id: "m-9",
    name: "Cerveza Corona Fría",
    description: "Cerveza tipo pilsener clásica bien helada con limón.",
    price: 45,
    category: MenuItemCategory.BEBIDAS,
    available: true,
    ingredients: [{ inventoryItemId: "inv-9", amountNeeded: 1.0 }]
  },
  {
    id: "m-10",
    name: "Café Americano Superior",
    description: "Extracción fresca de grano orgánico tostado medio con notas maderadas.",
    price: 38,
    category: MenuItemCategory.BEBIDAS,
    available: true,
    ingredients: [{ inventoryItemId: "inv-10", amountNeeded: 0.015 }]
  },
  {
    id: "m-11",
    name: "Limonada Natural Imperial",
    description: "Agua purificada o mineral gasificada con limón persa y un toque de jarabe artesanal.",
    price: 40,
    category: MenuItemCategory.BEBIDAS,
    available: true,
    ingredients: []
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "o-1",
    tableNumber: 1,
    waiterId: "u-2",
    waiterName: "Mesera Sofía",
    items: [
      { menuItemId: "m-4", name: "Hamburguesa Gourmet Carbón", price: 195, quantity: 2, notes: "Término medio sin cebolla" },
      { menuItemId: "m-9", name: "Cerveza Corona Fría", price: 45, quantity: 2 }
    ],
    status: OrderStatus.PREPARING,
    subtotal: 480,
    tax: 76.8,
    total: 556.8,
    createdAt: "2026-05-20T17:45:00Z",
    updatedAt: "2026-05-20T17:50:00Z"
  },
  {
    id: "o-2",
    tableNumber: 3,
    waiterId: "u-3",
    waiterName: "Mesero Daniel",
    items: [
      { menuItemId: "m-5", name: "Salmón Grill Fins Herbes", price: 280, quantity: 1, notes: "Vegetales bien cocidos" },
      { menuItemId: "m-11", name: "Limonada Natural Imperial", price: 40, quantity: 1 }
    ],
    status: OrderStatus.READY,
    subtotal: 320,
    tax: 51.2,
    total: 371.2,
    createdAt: "2026-05-20T17:15:00Z",
    updatedAt: "2026-05-20T17:40:00Z"
  },
  {
    id: "o-3",
    tableNumber: 5,
    waiterId: "u-2",
    waiterName: "Mesera Sofía",
    items: [
      { menuItemId: "m-6", name: "Pasta Alfredo con Pollo", price: 165, quantity: 1 },
      { menuItemId: "m-1", name: "Caldillo de Res & Costra", price: 110, quantity: 1 },
      { menuItemId: "m-10", name: "Café Americano Superior", price: 38, quantity: 1 }
    ],
    status: OrderStatus.RECEIVED,
    subtotal: 313,
    tax: 50.08,
    total: 363.08,
    createdAt: "2026-05-20T18:10:00Z",
    updatedAt: "2026-05-20T18:10:00Z"
  }
];

export const INITIAL_SALES_HISTORY = [
  { id: "s-1", orderId: "prev-o-101", total: 450, paymentMethod: "EFECTIVO", date: "2026-05-20T10:30:00Z", waiterName: "Sofía" },
  { id: "s-2", orderId: "prev-o-102", total: 820, paymentMethod: "TARJETA", date: "2026-05-20T12:15:00Z", waiterName: "Daniel" },
  { id: "s-3", orderId: "prev-o-103", total: 340, paymentMethod: "TRANSFERENCIA", date: "2026-05-20T13:00:00Z", waiterName: "Sofía" },
  { id: "s-4", orderId: "prev-o-104", total: 1120, paymentMethod: "TARJETA", date: "2026-05-20T14:45:00Z", waiterName: "Daniel" },
  { id: "s-5", orderId: "prev-o-105", total: 290, paymentMethod: "EFECTIVO", date: "2026-05-20T15:30:00Z", waiterName: "Sofía" },
  { id: "s-6", orderId: "prev-o-106", total: 680, paymentMethod: "TARJETA", date: "2026-05-20T16:10:00Z", waiterName: "Daniel" },
  { id: "s-7", orderId: "prev-o-107", total: 550, paymentMethod: "EFECTIVO", date: "2026-05-20T16:50:00Z", waiterName: "Sofía" }
];
