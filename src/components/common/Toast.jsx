// Toast.jsx
export function Toast({ message, type = 'info' }) {
  const colors = {
    info: '#4a90d9',
    success: '#2ecc71',
    error: '#e05c5c',
    warning: '#e67e22',
  };
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  return (
    <div className="toast" style={{ borderColor: colors[type] + '40', color: '#e8e8f5' }}>
      <span className="mr-2">{icons[type]}</span>
      {message}
    </div>
  );
}

export default Toast;
