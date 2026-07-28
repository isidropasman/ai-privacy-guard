export function RiskBadge() {
  return (
    <div className="badge" role="status" aria-label="AI Privacy Guard activo">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 2.5 20 6v5.6c0 4.7-3.2 8.9-8 9.9-4.8-1-8-5.2-8-9.9V6l8-3.5Z" />
        <path d="m8.8 12 2.1 2.1 4.6-4.7" />
      </svg>
      <span>Protected</span>
    </div>
  );
}
