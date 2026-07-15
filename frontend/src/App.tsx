import { Routes, Route } from "react-router-dom";
import Layout, { HomeRedirect } from "./components/Layout";
import ConvertSection from "./features/ConvertSection";
import MergeSection from "./features/MergeSection";
import SplitSection from "./features/SplitSection";
import CompressSection from "./features/CompressSection";
import OrganizeUpload from "./components/OrganizeUpload";
import ExtractUpload from "./components/ExtractUpload";
import WatermarkUpload from "./components/WatermarkUpload";
import ProtectUpload from "./components/ProtectUpload";
import UnlockUpload from "./components/UnlockUpload";

function SectionPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-1">{title}</h1>
      <p className="text-sm text-text-secondary mb-6">{description}</p>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeRedirect />} />
        <Route path="merge" element={
          <SectionPage title="Unir PDFs e imágenes" description="Sube archivos en cualquier orden y obtén un único PDF con todas las páginas">
            <MergeSection />
          </SectionPage>
        } />
        <Route path="split" element={
          <SectionPage title="Dividir PDF" description="Divide un PDF en varios archivos separados por página, grupos o rangos">
            <SplitSection />
          </SectionPage>
        } />
        <Route path="organize" element={
          <SectionPage title="Organizar páginas" description="Reordena, rota y elimina páginas con arrastrar y soltar">
            <OrganizeUpload />
          </SectionPage>
        } />
        <Route path="extract" element={
          <SectionPage title="Extraer páginas" description="Extrae páginas específicas de un PDF como archivos individuales o un PDF único">
            <ExtractUpload />
          </SectionPage>
        } />
        <Route path="watermark" element={
          <SectionPage title="Añadir marca de agua" description="Superpone texto en cada página del PDF">
            <WatermarkUpload />
          </SectionPage>
        } />
        <Route path="protect" element={
          <SectionPage title="Proteger PDF" description="Añade una contraseña para proteger el PDF">
            <ProtectUpload />
          </SectionPage>
        } />
        <Route path="unlock" element={
          <SectionPage title="Quitar contraseña" description="Elimina la protección por contraseña de un PDF">
            <UnlockUpload />
          </SectionPage>
        } />
        <Route path="compress" element={
          <SectionPage title="Comprimir PDF" description="Reduce el tamaño del PDF ajustando la calidad de imagen y resolución">
            <CompressSection />
          </SectionPage>
        } />
        <Route path="convert" element={
          <SectionPage title="Convertir PDF a JPG" description="Convierte cada página de un PDF a imágenes JPG y descarga como ZIP">
            <ConvertSection />
          </SectionPage>
        } />
      </Route>
    </Routes>
  );
}
