import { NavLink } from "react-router-dom";

const items = [
  { to: "/merge", label: "Unir PDFs", icon: "📑" },
  { to: "/split", label: "Dividir PDF", icon: "✂️" },
  { to: "/organize", label: "Organizar páginas", icon: "📋" },
  { to: "/extract", label: "Extraer páginas", icon: "📄" },
  { to: "/watermark", label: "Marca de agua", icon: "💧" },
  { to: "/protect", label: "Proteger PDF", icon: "🔒" },
  { to: "/unlock", label: "Quitar contraseña", icon: "🔓" },
  { to: "/compress", label: "Comprimir PDF", icon: "🗜️" },
  { to: "/convert", label: "Convertir a JPG", icon: "🖼️" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-card border-r border-border flex flex-col z-40">
      <div className="px-5 py-5 border-b border-border">
        <NavLink to="/merge" className="text-xl font-bold text-primary no-underline">
          PDFeate
        </NavLink>
        <p className="text-xs text-text-secondary mt-0.5">Herramientas PDF</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all no-underline ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-primary-light hover:text-primary"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-border text-xs text-text-secondary">
        PDFeate v1.0
      </div>
    </aside>
  );
}
