import type { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputClass = [styles.input, error ? styles.hasError : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrap}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={styles.inputWrap}>
        <input id={id} className={inputClass} {...props} />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
