const icons = {
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.6h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3.5 9 15.5H3L12 3.5Z" />
      <path d="M12 9v4.5" />
      <path d="M12 16.4h.01" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.6 2.6L16.4 9" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6h.01" />
    </>
  ),
}

function NoticeIcon({ variant }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[variant] ?? icons.info}
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  )
}

function Notice({ variant = 'info', title, children, action, onDismiss, className = '' }) {
  const classes = ['notice', `notice-${variant}`, className].filter(Boolean).join(' ')
  return (
    <div className={classes} role={variant === 'error' ? 'alert' : 'status'}>
      <span className="notice-icon"><NoticeIcon variant={variant} /></span>
      <div className="notice-body">
        {title && <strong className="notice-title">{title}</strong>}
        {children && <p className="notice-message">{children}</p>}
        {action && <div className="notice-action">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" className="notice-dismiss" onClick={onDismiss} aria-label="Dismiss message">
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

export default Notice
