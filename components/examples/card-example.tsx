"use client"

import React from 'react';
import { CardTemplate } from '@/components/ui/card-template';
import { Button } from '@/components/ui/button';
import { Settings, Download, Printer, Home } from 'lucide-react';

export function CardExamples() {
  return (
    <div className="space-y-8 p-4">
      {/* Basic Card Example */}
      <CardTemplate
        title="Basic Card"
        icon={Home}
      >
        <p>This is a basic card with just an icon and some content.</p>
        <p>It follows the same layout pattern as the PriceSummary component.</p>
      </CardTemplate>

      {/* Card with Actions */}
      <CardTemplate
        title="Card with Actions"
        icon={Settings}
        actions={
          <>
            <Button variant="outline" className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </>
        }
      >
        <p>This card demonstrates how to add action buttons at the bottom.</p>
        <p>The actions prop accepts any React nodes to be displayed in the footer area.</p>
      </CardTemplate>

      {/* Sticky Card */}
      <CardTemplate
        title="Sticky Card"
        icon={Settings}
        stickyHeader={true}
        className="bg-slate-50 dark:bg-slate-800"
      >
        <p>This card has the sticky header option enabled.</p>
        <p>It will stick to the top of the viewport when scrolling.</p>
        <p>You can also add custom classes to change its appearance.</p>
      </CardTemplate>

      {/* Card with Complex Content */}
      <CardTemplate
        title="Card with Complex Content"
        icon={Settings}
      >
        <div className="bg-slate-100 p-4 rounded-md dark:bg-slate-800">
          <h3 className="text-lg font-medium">Section Title</h3>
          <p>You can add any complex content structure inside the card.</p>
        </div>
        
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium">Another Section</h3>
          <p>The space-y-4 utility adds consistent spacing between sections.</p>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Header 1</th>
              <th className="text-right py-2">Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">Item 1</td>
              <td className="text-right py-2">Value 1</td>
            </tr>
            <tr>
              <td className="py-2">Item 2</td>
              <td className="text-right py-2">Value 2</td>
            </tr>
          </tbody>
        </table>
      </CardTemplate>
    </div>
  );
} 