import styles from './Input.module.css';

export function Input(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  fieldClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}) {
  return (
    <label className={[styles.field, props.fieldClassName ?? ''].filter(Boolean).join(' ')}>
      <span className={[styles.label, props.labelClassName ?? ''].filter(Boolean).join(' ')}>{props.label}</span>
      <input
        className={[styles.input, props.inputClassName ?? ''].filter(Boolean).join(' ')}
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </label>
  );
}

