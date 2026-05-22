import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    full ? styles.full : '',
    loading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} disabled={disabled ?? loading} {...props}>
      {children}
    </button>
  )
}
