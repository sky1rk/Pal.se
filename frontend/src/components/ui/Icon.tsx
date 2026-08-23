const ICONS = {
  dashboard: {
    className: "img",
    markup:
      "<rect x='3' y='3' width='8' height='8' rx='1.5'></rect><rect x='13' y='3' width='8' height='5' rx='1.5'></rect><rect x='13' y='10' width='8' height='11' rx='1.5'></rect><rect x='3' y='13' width='8' height='8' rx='1.5'></rect>",
  },
  patients: {
    className: "img",
    markup:
      "<circle cx='9' cy='8' r='3'></circle><circle cx='16.5' cy='9.5' r='2.5'></circle><path d='M3.5 18.5c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5'></path><path d='M14 18.5c.2-1.9 1.8-3.4 3.8-3.4 1.2 0 2.3.5 3 1.3'></path>",
  },
  reports: {
    className: "img",
    markup:
      "<path d='M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20z'></path><path d='M15 3.5V8h4'></path><path d='M8.5 12h7M8.5 15h7'></path>",
  },
  logout: {
    className: "vector",
    markup:
      "<path d='M9 6 3 12l6 6'></path><path d='M3 12h10'></path><path d='M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4'></path>",
  },
  chevronRight: {
    className: "vector-2",
    markup: "<path d='m9 6 6 6-6 6'></path>",
  },
  checkCircle: {
    className: "",
    markup:
      "<circle cx='12' cy='12' r='9'></circle><path d='m8.5 12 2.5 2.5 4.5-4.5'></path>",
  },
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  className?: string;
}

export default function Icon({ name, className }: IconProps) {
  const icon = ICONS[name];
  const classes = [className, icon.className || null, "icon-svg"]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      viewBox="0 0 24 24"
      className={classes}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icon.markup }}
    />
  );
}
