
import React from 'react';
import styles from './button.module.css';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'default', fullWidth, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    styles.button,
                    styles[variant],
                    size === 'lg' && styles.lg,
                    size === 'sm' && styles.sm,
                    size === 'icon' && styles.icon,
                    fullWidth && styles.full,
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
