import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}) {
  const variant = props.variant ?? 'primary';

  return (
    <button
      type={props.type ?? 'button'}
      className={[styles.button, styles[variant], props.className ?? ''].filter(Boolean).join(' ')}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

