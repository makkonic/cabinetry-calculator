"use client"

import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface CardTemplateProps {
  title: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

/**
 * CardTemplate - A standardized card layout based on the PriceSummary design
 * 
 * @param {string} title - The title of the card
 * @param {LucideIcon} icon - Optional icon to display next to the title
 * @param {ReactNode} actions - Optional actions to display at the bottom of the card
 * @param {ReactNode} children - The content of the card
 * @param {string} className - Additional classes to apply to the card
 * @param {boolean} stickyHeader - Whether the card should have a sticky header
 */
export function CardTemplate({ 
  title, 
  icon: Icon, 
  actions, 
  children, 
  className = "",
  stickyHeader = false
}: CardTemplateProps) {
  return (
    <Card className={`${stickyHeader ? "sticky top-6" : ""} ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          {Icon && <Icon className="w-5 h-5 mr-2 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {children}
        </div>
        
        {actions && (
          <div className="flex space-x-2 mt-6">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 