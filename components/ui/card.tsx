import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// New component for a row layout with aligned elements
const CardRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-row items-center gap-4 w-full py-2",
      className
    )}
    {...props}
  />
))
CardRow.displayName = "CardRow"

// Component specifically for a card control layout (slider + dropdown + input)
interface CardControlRowProps extends React.HTMLAttributes<HTMLDivElement> {
  sliderSection?: React.ReactNode
  dropdownSection?: React.ReactNode
  numberSection?: React.ReactNode
}

const CardControlRow = React.forwardRef<
  HTMLDivElement,
  CardControlRowProps
>(({ className, sliderSection, dropdownSection, numberSection, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid grid-cols-12 gap-4 w-full py-2 items-center",
      className
    )}
    {...props}
  >
    {sliderSection && (
      <div className="col-span-6">{sliderSection}</div>
    )}
    {dropdownSection && (
      <div className="col-span-4">{dropdownSection}</div>
    )}
    {numberSection && (
      <div className="col-span-2">{numberSection}</div>
    )}
  </div>
))
CardControlRow.displayName = "CardControlRow"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardRow,
  CardControlRow
}
