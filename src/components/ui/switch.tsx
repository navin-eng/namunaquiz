'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e)
            onCheckedChange?.(e.target.checked)
        }

        return (
            <label className={cn(
                "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-[#0f0c29]",
                checked ? "bg-indigo-500" : "bg-slate-700",
                className
            )}>
                <input
                    type="checkbox"
                    className="peer sr-only"
                    ref={ref}
                    checked={checked}
                    onChange={handleChange}
                    {...props}
                />
                <span
                    className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm",
                        checked ? "translate-x-6" : "translate-x-1"
                    )}
                />
            </label>
        )
    }
)
Switch.displayName = 'Switch'

export { Switch }
