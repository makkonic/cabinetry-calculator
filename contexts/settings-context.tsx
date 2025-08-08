"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SettingsContextType {
  contingencyRate: number;
  tariffRate: number;
  exchangeRate: number;
  setContingencyRate: (rate: number) => void;
  setTariffRate: (rate: number) => void;
  setExchangeRate: (rate: number) => void;
}

const defaultSettings = {
  contingencyRate: 0.05, // Default 5%
  tariffRate: 0.10, // Default 10%
  exchangeRate: 1.0, // Default 1.0 (no exchange rate adjustment)
  setContingencyRate: () => {},
  setTariffRate: () => {},
  setExchangeRate: () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [contingencyRate, setContingencyRate] = useState(defaultSettings.contingencyRate);
  const [tariffRate, setTariffRate] = useState(defaultSettings.tariffRate);
  const [exchangeRate, setExchangeRate] = useState(defaultSettings.exchangeRate);

  return (
    <SettingsContext.Provider
      value={{
        contingencyRate,
        tariffRate,
        exchangeRate,
        setContingencyRate,
        setTariffRate,
        setExchangeRate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}; 