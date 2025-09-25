export function LoadingSpinner({ size = 'medium' }) {

  return (
    <div className="loading-spinner" style={{
      width: size === 'small' ? '16px' : size === 'large' ? '48px' : '32px',
      height: size === 'small' ? '16px' : size === 'large' ? '48px' : '32px',
      border: '2px solid rgba(255,255,255,0.1)',
      borderTop: '2px solid var(--primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  );
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
      gap: '16px'
    }}>
      <LoadingSpinner size="large" />
      <p style={{ color: 'var(--muted)' }}>{message}</p>
    </div>
  );
}

export function LoadingButton({ loading, children, ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LoadingSpinner size="small" />
          Loading...
        </div>
      ) : children}
    </button>
  );
}
