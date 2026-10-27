export default function HuggedHeartIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 15.2 6.6 10a3.5 3.5 0 0 1 5-4.9l.4.4.4-.4a3.5 3.5 0 0 1 5 4.9Z" />
      <path d="M3.5 9.5C1.4 12.6 2.1 17 5.2 19.1c2.3 1.6 5.1 1.6 7.5.5l3.4-1.6a1.6 1.6 0 0 0-1.3-2.9l-3.5 1.5" />
      <path d="M20.5 9.5c2.1 3.1 1.4 7.5-1.7 9.6-1.2.8-2.5 1.2-3.8 1.2M5.3 14.1l3.9 1.8" />
    </svg>
  );
}
