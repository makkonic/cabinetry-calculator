"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SettingsContextType {
  contingencyRate: number;
  tariffRate: number;
  setContingencyRate: (rate: number) => void;
  setTariffRate: (rate: number) => void;
}

const defaultSettings = {
  contingencyRate: 0.05, // Default 5%
  tariffRate: 0.10, // Default 10%
  setContingencyRate: () => {},
  setTariffRate: () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [contingencyRate, setContingencyRate] = useState(defaultSettings.contingencyRate);
  const [tariffRate, setTariffRate] = useState(defaultSettings.tariffRate);

  return (
    <SettingsContext.Provider
      value={{
        contingencyRate,
        tariffRate,
        setContingencyRate,
        setTariffRate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}; 