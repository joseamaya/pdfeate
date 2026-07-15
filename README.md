# PDFeate

Plataforma web para manipular PDFs desde el navegador. Inspirada en iLovePDF.

## Características

| Función | Descripción |
|---|---|
| **Unir PDFs** | Combina varios PDFs e imágenes en un solo PDF |
| **Dividir PDF** | Divide un PDF por página, cada N páginas o por rangos personalizados |
| **Organizar páginas** | Reordena, rota y elimina páginas con drag & drop |
| **Extraer páginas** | Extrae páginas específicas como ZIP (individuales) o PDF único |
| **Comprimir PDF** | Reduce el tamaño del PDF (Ghostscript o Pillow) |
| **Añadir marca de agua** | Superpone texto configurable (opacidad, posición) |
| **Proteger PDF** | Añade contraseña de apertura |
| **Quitar contraseña** | Elimina la protección de un PDF |
| **PDF → JPG** | Convierte cada página a imagen JPG y descarga como ZIP |

## Stack

- **Backend:** Python 3.12+, FastAPI, Uvicorn
- **Frontend:** React 19, TypeScript 6, Vite 8
- **Librerías clave:**
  - `pypdf` — manipulación de PDF (split, extract, protect, unlock, organize)
  - `pdf2image` + `Pillow` — conversión PDF ↔ imágenes, marca de agua, compresión
  - `Ghostscript` — compresión profesional de PDF
  - `@dnd-kit` — drag & drop para organizar páginas

## Requisitos del sistema

- Python 3.12+
- Node.js 22+
- `poppler-utils` (para pdf2image)
- `ghostscript` (para compresión, opcional pero recomendado)

### Instalación de dependencias del sistema (Debian/Ubuntu)

```bash
sudo apt install poppler-utils ghostscript
```

## Instalación y ejecución

```bash
# Clonar
git clone <repo-url> && cd pdfeate

# Instalar dependencias
make install

# Iniciar servidores (backend :8000 + frontend :5173)
make dev
```

Abrir http://localhost:5173

## Comandos disponibles

```bash
make install    # Instalar dependencias Python + Node
make dev        # Iniciar backend y frontend simultáneamente
make backend    # Solo backend (puerto 8000)
make frontend   # Solo frontend (puerto 5173)
make clean      # Detener servidores y limpiar archivos temporales
```

## API

Todas las rutas bajo `/api`.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/upload` | Subir PDF(s) → ZIP de JPGs |
| `GET` | `/api/download/{zip_id}` | Descargar ZIP |
| `POST` | `/api/merge` | Unir PDFs + imágenes → PDF |
| `POST` | `/api/split` | Dividir PDF (modos: all/every/ranges) |
| `POST` | `/api/extract` | Extraer páginas específicas |
| `POST` | `/api/compress` | Comprimir PDF (quality, reduce_dpi) |
| `POST` | `/api/watermark` | Añadir marca de agua |
| `POST` | `/api/protect` | Proteger con contraseña |
| `POST` | `/api/unlock` | Quitar contraseña |
| `POST` | `/api/organize/upload` | Subir PDF para organizar |
| `GET` | `/api/organize/thumbnail/{id}/{page}` | Miniatura de página |
| `POST` | `/api/organize/apply` | Aplicar cambios de organización |
| `DELETE` | `/api/organize/cleanup/{id}` | Limpiar archivos temporales |
| `GET` | `/api/download-pdf/{file_id}` | Descargar PDF |

## Estructura del proyecto

```
pdfeate/
├── backend/
│   ├── app/
│   │   ├── config.py          # Configuración (límites, rutas, calidad)
│   │   ├── main.py            # FastAPI app + CORS + lifespan
│   │   ├── routers/
│   │   │   └── pdf_router.py  # Todos los endpoints
│   │   └── services/
│   │       └── pdf_service.py # Lógica de negocio (PDF → PDF)
│   ├── uploads/               # Archivos generados (ZIP, PDF)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts      # Cliente HTTP
│   │   ├── components/        # Componentes React (uno por feature)
│   │   ├── App.tsx            # Página principal
│   │   └── App.css            # Estilos
│   └── package.json
├── Makefile
└── README.md
```

## Notas

- El backend debe ejecutarse desde el directorio `backend/` (el Makefile lo maneja).
- Los archivos ZIP y PDF generados persisten en `backend/uploads/` hasta `make clean`.
- Sin autenticación, sin base de datos, sin tests.
