
import React from 'react';
import styles from './input.module.css';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className={styles.inputWrapper}>
                {label && <label className={styles.label}>{label}</label>}
                <input
                    className={cn(styles.input, className)}
                    ref={ref}
                    {...props}
                />
                {error && <span style={{ color: 'var(--red)', fontSize: '0.75rem' }}>{error}</span>}
            </div>
        );
    }
);
Input.displayName = "Input";
