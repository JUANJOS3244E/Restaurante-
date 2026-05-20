/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { User, UserRole } from "../types";
import { Shield, Smartphone, ChefHat, Wallet, HelpCircle, UserCheck, Eye, EyeOff, Lock, ArrowRight, X } from "lucide-react";

interface LoginModalProps {
  users: User[];
  onLogin: (user: User) => void;
  currentUser: User | null;
}

export default function LoginModal({ users, onLogin, currentUser }: LoginModalProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(true); // Default to showing pin to make it easier for demo!
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when selectedUser changes, or on initial mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPin("");
    setError("");
  };

  const handlePinChange = (val: string) => {
    // Keep only numbers and max length of 4
    const cleanVal = val.replace(/\D/g, "").slice(0, 4);
    setPin(cleanVal);
    setError("");

    // Auto-validate if 4 digits are completed
    if (cleanVal.length === 4) {
      validateAndSubmit(cleanVal);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError("");
      
      if (newPin.length === 4) {
        validateAndSubmit(newPin);
      }
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const validateAndSubmit = (inputPin: string = pin) => {
    if (inputPin.length < 4) {
      setError("El PIN debe ser de 4 dígitos.");
      return;
    }

    if (selectedUser) {
      // Direct validation for the clicked user
      if (selectedUser.pin === inputPin) {
        onLogin(selectedUser);
        resetState();
      } else {
        setError(`PIN incorrecto para ${selectedUser.name}.`);
        setPin("");
      }
    } else {
      // Smart Auto-Login: Search through all available users to match the PIN
      const foundUser = users.find(u => u.pin === inputPin);
      if (foundUser) {
        onLogin(foundUser);
        resetState();
      } else {
        setError("PIN no registrado en el sistema.");
        setPin("");
      }
    }
  };

  const resetState = () => {
    setPin("");
    setSelectedUser(null);
    setError("");
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="w-5 h-5 text-amber-500" />;
      case UserRole.MESERO:
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case UserRole.COCINA:
        return <ChefHat className="w-5 h-5 text-blue-400" />;
      case UserRole.CAJERO:
        return <Wallet className="w-5 h-5 text-purple-400" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <span className="px-2 py-0.5 text-xs bg-amber-950/40 text-amber-400 border border-amber-900/50 rounded font-mono font-medium">Administrador</span>;
      case UserRole.MESERO:
        return <span className="px-2 py-0.5 text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-950 rounded font-mono font-medium">Mesero</span>;
      case UserRole.COCINA:
        return <span className="px-2 py-0.5 text-xs bg-blue-950/40 text-blue-400 border border-blue-950 rounded font-mono font-medium">Cocina</span>;
      case UserRole.CAJERO:
        return <span className="px-2 py-0.5 text-xs bg-purple-950/40 text-purple-400 border border-purple-950 rounded font-mono font-medium">Caja</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0d0d0d] border border-[#1f1f23] rounded overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all max-h-[90vh]">
        
        {/* Left Side: Users list */}
        <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-[#1f1f23] flex flex-col min-h-0">
          <div className="mb-4">
            <h2 className="text-xl font-sans font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-orange-600 animate-pulse"></span>
              GASTROFLOW
            </h2>
            <p className="text-zinc-400 text-xs mt-1">
              Selecciona tu usuario para autocompletar, o escribe tu PIN directamente a la derecha.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {users.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const isCurrentlyActive = currentUser?.id === u.id;
              return (
                <button
                  id={`user-select-btn-${u.id}`}
                  key={u.id}
                  onClick={() => handleUserSelect(u)}
                  className={`w-full text-left p-3 rounded flex items-center border transition-all ${
                    isSelected
                      ? "bg-[#161616] border-orange-600"
                      : "bg-[#080808] border-[#1f1f23] hover:bg-[#121212] hover:border-[#2f2f35]"
                  }`}
                >
                  <div className="w-10 h-10 rounded bg-[#050505] border border-zinc-850 flex items-center justify-center mr-3">
                    {getRoleIcon(u.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-sans font-semibold text-sm truncate flex items-center gap-2">
                      {u.name}
                      {isCurrentlyActive && (
                        <span className="inline-block w-2 h-2 rounded bg-emerald-500" title="Activo actualmente" />
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {getRoleBadge(u.role)}
                      <span className="text-[10px] text-zinc-500 font-mono">PIN: {u.pin}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-[#080808] border border-[#1F1F1F] rounded flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                <span className="text-orange-500 font-bold">Modo PIN Rápido:</span> El sistema detectará automáticamente tu rol tras digitar los 4 números de tu PIN a la derecha. No es obligatorio elegir un perfil de la lista.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: PIN Entry */}
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-[#050505] flex flex-col justify-center items-center relative">
          
          <div className="w-full max-w-xs flex flex-col items-center">
            
            {/* Context Header */}
            {selectedUser ? (
              <div className="flex flex-col items-center mb-4 text-center">
                <div className="w-12 h-12 rounded bg-[#0d0d0d] border border-[#1f1f23] flex items-center justify-center mb-2 relative">
                  {getRoleIcon(selectedUser.role)}
                  <button 
                    onClick={resetState}
                    className="absolute -top-1 -right-1 bg-zinc-900 border border-zinc-800 rounded-full p-0.5 hover:bg-rose-950 text-zinc-500 hover:text-rose-400"
                    title="Cerrar selección"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-zinc-500 text-[10px] tracking-widest font-mono uppercase">Verificación de PIN</p>
                <h3 className="text-base font-sans font-bold text-white flex items-center gap-1.5 justify-center mt-0.5">
                  {selectedUser.name}
                </h3>
                <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center mb-4 text-center">
                <div className="w-12 h-12 rounded bg-[#0d0d0d] border border-[#1f1f23] flex items-center justify-center mb-2">
                  <Lock className="w-5 h-5 text-orange-500 animate-pulse" />
                </div>
                <p className="text-zinc-500 text-[10px] tracking-widest font-mono uppercase">Terminal de Acceso</p>
                <h3 className="text-base font-sans font-bold text-white mt-0.5">Escribe tu PIN de Acceso</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">Usa tu teclado físico o el teclado en pantalla</p>
              </div>
            )}

            {/* INTERACTIVE TEXT BOX */}
            <div className="w-full relative flex items-center justify-center mb-3">
              <input
                id="login-pin-input"
                ref={inputRef}
                type={showPin ? "text" : "password"}
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateAndSubmit();
                  }
                }}
                placeholder="••••"
                className="w-full text-center py-2.5 px-10 text-xl font-mono tracking-[0.5em] text-orange-500 bg-[#0d0d0d] border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none rounded transition-all placeholder:text-zinc-800 font-bold"
                autoFocus
                title="Digita los 4 números de tu PIN"
              />
              
              {/* Show/Hide eye button inside input */}
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 text-zinc-600 hover:text-zinc-400 p-1 cursor-pointer"
                title={showPin ? "Ocultar PIN" : "Mostrar PIN"}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message and Info */}
            <div className="min-h-[22px] text-center w-full mb-4">
              {error ? (
                <p className="text-rose-500 text-xs font-sans font-semibold mb-1">{error}</p>
              ) : (
                <p className="text-zinc-500 text-[10px] font-mono">
                  {pin.length > 0 ? `${pin.length} de 4 dígitos ingresados` : "Escribe tu PIN para conectar"}
                </p>
              )}
            </div>

            {/* Pad Grid */}
            <div className="grid grid-cols-3 gap-2 w-full mb-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  id={`pin-btn-${num}`}
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-11 rounded bg-[#0d0d0d] hover:bg-[#161616] active:bg-black text-white text-base font-mono font-bold flex items-center justify-center border border-zinc-800/40 transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
              
              {/* Clear */}
              <button
                id="pin-btn-clear"
                type="button"
                onClick={() => {
                  setPin("");
                  setError("");
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="h-11 rounded bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white text-[11px] font-bold flex items-center justify-center border border-zinc-800/40 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
              
              {/* Zero */}
              <button
                id="pin-btn-0"
                type="button"
                onClick={() => handleKeyPress("0")}
                className="h-11 rounded bg-[#0d0d0d] hover:bg-[#161616] active:bg-black text-white text-base font-mono font-bold flex items-center justify-center border border-zinc-800/40 transition-colors cursor-pointer"
              >
                0
              </button>
              
              {/* Backspace */}
              <button
                id="pin-btn-back"
                type="button"
                onClick={handleDelete}
                className="h-11 rounded bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800/40 transition-colors cursor-pointer"
                title="Borrar dígito"
              >
                <span className="text-xs font-bold font-mono">←</span>
              </button>
            </div>

            {/* Direct Submit Button to make login fully responsive and clear */}
            <button
              id="login-submit-flat-btn"
              type="button"
              onClick={() => validateAndSubmit()}
              disabled={pin.length < 4}
              className={`w-full py-2.5 rounded flex items-center justify-center gap-1.5 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                pin.length === 4
                  ? "bg-orange-600 hover:bg-orange-500 text-black shadow-lg shadow-orange-600/15"
                  : "bg-zinc-900 text-zinc-650 border border-zinc-850 cursor-not-allowed"
              }`}
            >
              Ingresar al Sistema <ArrowRight className="w-3.5 h-3.5" />
            </button>
            
          </div>
          
        </div>

      </div>
    </div>
  );
}
