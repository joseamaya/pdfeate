import ConvertSection from "./features/ConvertSection";
import MergeSection from "./features/MergeSection";
import SplitSection from "./features/SplitSection";
import CompressSection from "./features/CompressSection";
import OrganizeUpload from "./components/OrganizeUpload";
import ExtractUpload from "./components/ExtractUpload";
import WatermarkUpload from "./components/WatermarkUpload";
import ProtectUpload from "./components/ProtectUpload";
import UnlockUpload from "./components/UnlockUpload";

export default function App() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl text-primary font-bold">PDFeate</h1>
        <p className="text-text-secondary mt-1">
          Sube PDFs e imágenes para convertirlos, unirlos, dividirlos, organizarlos y más
        </p>
      </header>

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Unir PDFs e imágenes</h2>
        <p className="text-sm text-text-secondary mb-4">
          Sube archivos en cualquier orden y obtén un único PDF con todas las páginas
        </p>
        <MergeSection />
      </section>

      <hr className="border-none border-t border-border my-8" />

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Dividir PDF</h2>
        <p className="text-sm text-text-secondary mb-4">
          Divide un PDF en varios archivos separados por página, grupos o rangos
        </p>
        <SplitSection />
      </section>

      <hr className="border-none border-t border-border my-8" />

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Organizar páginas</h2>
        <p className="text-sm text-text-secondary mb-4">
          Reordena, rota y elimina páginas con arrastrar y soltar
        </p>
        <OrganizeUpload />
      </section>

      <hr className="border-none border-t border-border my-8" />

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Extraer páginas</h2>
        <p className="text-sm text-text-secondary mb-4">
          Extrae páginas específicas de un PDF como archivos individuales o un PDF único
        </p>
        <ExtractUpload />
      </section>

      <hr className="border-none border-t border-border my-8" />

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Añadir marca de agua</h2>
        <p className="text-sm text-text-secondary mb-4">
          Superpone texto en cada página del PDF
        </p>
        <WatermarkUpload />
      </section>

      <hr className="border-none border-t border-border my-8" />

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Proteger PDF</h2>
        <p className="text-sm text-text-secondary mb-4">
          Añade una contraseña para proteger el PDF
        </p>
        <ProtectUpload />
      </section>

      <hr className="border-none border-t border-border my-8" />

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Quitar contraseña</h2>
        <p className="text-sm text-text-secondary mb-4">
          Elimina la protección por contraseña de un PDF
        </p>
        <UnlockUpload />
      </section>

      <hr className="border-none border-t border-border my-8" />

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Comprimir PDF</h2>
        <p className="text-sm text-text-secondary mb-4">
          Reduce el tamaño del PDF ajustando la calidad de imagen y resolución
        </p>
        <CompressSection />
      </section>

      <hr className="border-none border-t border-border my-8" />

      <section className="mt-2">
        <h2 className="text-lg font-semibold text-text mb-1">Convertir PDF a JPG</h2>
        <p className="text-sm text-text-secondary mb-4">
          Convierte cada página de un PDF a imágenes JPG y descarga como ZIP
        </p>
        <ConvertSection />
      </section>
    </div>
  );
}
