"use client"

import NumberFlow from '@number-flow/react'
import * as RadixSlider from '@radix-ui/react-slider'
import clsx from 'clsx'

interface NumberFlowSliderProps extends RadixSlider.SliderProps {
	unit?: string;
}

export function NumberFlowSlider({ value, className, unit, ...props }: NumberFlowSliderProps) {
	return (
		<RadixSlider.Root
			{...props}
			value={value}
			className={clsx(className, 'relative flex h-5 w-full touch-none select-none items-center')}
		>
			<RadixSlider.Track className="relative h-[3px] grow rounded-full bg-zinc-100 dark:bg-zinc-800">
				<RadixSlider.Range className="absolute h-full rounded-full bg-black dark:bg-white" />
			</RadixSlider.Track>
			<RadixSlider.Thumb
				className="relative block h-5 w-5 rounded-[1rem] bg-white shadow-md ring ring-black/10"
				aria-label="Value"
			>
				{value?.[0] != null && (
					<NumberFlow
						value={value[0]}
						format={{ 
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						}}
						transformTiming={{
							duration: 300,
							easing: 'ease-out'
						}}
						opacityTiming={{
							duration: 150,
							easing: 'ease-out'
						}}
						className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm font-semibold bg-gray-800 text-white px-2 py-1 rounded shadow"
						suffix={unit ? ` ${unit}` : ''}
					/>
				)}
			</RadixSlider.Thumb>
		</RadixSlider.Root>
	)
} 