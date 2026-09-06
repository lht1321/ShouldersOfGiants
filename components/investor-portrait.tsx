import Image from 'next/image';

type InvestorPortraitProps = {
  name: string;
  styleLabel: string;
  src: string | null;
  subject: string | null;
  width: number;
  height: number;
  priority?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

export function InvestorPortrait({ name, styleLabel, src, subject, width, height, priority = false }: InvestorPortraitProps) {
  if (src && subject) {
    return <Image src={src} alt={`${subject} 펜 일러스트`} width={width} height={height} priority={priority} />;
  }

  return (
    <div className="portrait-fallback">
      <strong aria-hidden="true">{initials(name)}</strong>
      <span>{name}</span>
      <small>{styleLabel}</small>
    </div>
  );
}
