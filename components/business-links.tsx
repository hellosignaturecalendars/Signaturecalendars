import {
  Phone,
  Mail,
  MessageCircle,
  Camera as Instagram,
  Globe,
  MapPin,
  Clock,
} from "lucide-react";
function Linkedin({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="22"
        height="22"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="6.5" cy="7" r="1.5" />
      <path d="M5 10h3v9H5zm5 0h3v1.2c.8-1 1.8-1.5 3-1.5 2.4 0 3.5 1.5 3.5 4V19h-3v-4.8c0-1.4-.4-2-1.5-2-1.2 0-2 .8-2 2.2V19h-3z" />
    </svg>
  );
}
function Facebook({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14 22v-9h3l.5-4H14V7c0-1.1.3-2 2-2h2V1.3A24 24 0 0 0 15 1c-3 0-5 1.9-5 5.4V9H7v4h3v9z" />
    </svg>
  );
}
import type { Content } from "@/lib/model";
import { whatsapp } from "@/lib/model";
export function SocialLinks({
  business: b,
}: {
  business: Content["business"];
}) {
  const social = [
    { label: "Instagram", url: b.instagram, Icon: Instagram },
    { label: "LinkedIn", url: b.linkedin, Icon: Linkedin },
    { label: "Facebook", url: b.facebook, Icon: Facebook },
    { label: "Other social link", url: b.other, Icon: Globe },
    ...(b.socialLinks || []).map((s) => ({ ...s, Icon: Globe })),
  ].filter((s) => s.url);
  if (!social.length) return null;
  return (
    <div className="social-links">
      {social.map(({ label, url, Icon }, i) => (
        <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer">
          <Icon size={19} />
          {label}
        </a>
      ))}
    </div>
  );
}
export function BusinessLinks({
  business: b,
}: {
  business: Content["business"];
}) {
  return (
    <div className="business-links">
      {b.phone && (
        <a href={`tel:${b.phone}`}>
          <Phone size={19} />
          <span>Call {b.phone}</span>
        </a>
      )}
      {b.whatsapp && (
        <a href={whatsapp(b.whatsapp)} target="_blank" rel="noreferrer">
          <MessageCircle size={19} />
          <span>WhatsApp {b.whatsapp}</span>
        </a>
      )}
      {b.email && (
        <a href={`mailto:${b.email}`}>
          <Mail size={19} />
          <span>{b.email}</span>
        </a>
      )}
      {b.address && (
        <p>
          <MapPin size={19} />
          <span>{b.address}</span>
        </p>
      )}
      {b.hours && (
        <p>
          <Clock size={19} />
          <span>{b.hours}</span>
        </p>
      )}
      <SocialLinks business={b} />
    </div>
  );
}
