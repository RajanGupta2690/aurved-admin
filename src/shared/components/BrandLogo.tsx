interface BrandLogoProps {
  /** Rendered width and height in CSS pixels. */
  size?: number;
  className?: string;
  /** Set when the product name is already written next to the logo. */
  decorative?: boolean;
}

const BASE_URL = import.meta.env.BASE_URL;

/**
 * AURVED brand mark. Source file: public/brand/aurved-logo-*.png
 * (generated from the logo supplied by the product owner).
 * 128px covers displays up to 64px at 2x density, 512px covers larger uses.
 */
export default function BrandLogo({ size = 40, className = '', decorative = false }: BrandLogoProps) {
  const file = size > 64 ? 'aurved-logo-512.png' : 'aurved-logo-128.png';

  return (
    <img
      src={`${BASE_URL}brand/${file}`}
      width={size}
      height={size}
      alt={decorative ? '' : 'AURVED'}
      draggable={false}
      className={className}
    />
  );
}
