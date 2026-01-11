# 🎓 Vocari: Orientación Vocacional con IA

Una plataforma moderna de orientación vocacional con inteligencia artificial dirigida a jóvenes de 16 a 24 años en Chile y LATAM.

## 🎯 Propósito

Vocari combina tecnología de inteligencia artificial con psicología vocacional para ayudar a los jóvenes a tomar decisiones conscientes, felices y alineadas con su verdadero propósito profesional.

## ✨ Características

- **Diseño Moderno**: Interfaz limpia y atractiva con animaciones suaves
- **Totalmente Responsivo**: Optimizado para desktop, tablet y móvil
- **Animaciones**: Efectos de entrada con Framer Motion
- **Paleta de Colores Personalizada**: Azul oscuro, celeste y blanco
- **Componentes Modulares**: Estructura React organizada y reutilizable

## 🎨 Paleta de Colores

- **Azul Oscuro**: `#0C1E3C` (fondo principal)
- **Celeste**: `#33B5E5` (resaltos y botones)
- **Blanco**: `#FFFFFF` (texto y contrastes)
- **Gris Claro**: `#F5F7FA` (fondo de secciones alternas)

## 🚀 Tecnologías Utilizadas

- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **Framer Motion** - Biblioteca de animaciones
- **Lucide React** - Íconos minimalistas
- **Google Fonts** - Fuentes Inter y Poppins

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Header.jsx          # Navegación principal
│   ├── Hero.jsx            # Sección hero con CTA principal
│   ├── ProblemSection.jsx  # Estadísticas del problema
│   ├── SolutionSection.jsx # Nuestra solución y misión
│   ├── ComparisonSection.jsx # Tabla comparativa
│   ├── CTASection.jsx      # Llamado a la acción
│   └── Footer.jsx          # Pie de página
├── App.jsx                 # Componente principal
├── main.jsx               # Punto de entrada
└── index.css              # Estilos globales y Tailwind
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos

- Node.js 16+ 
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/orienta-ai.git
   cd orienta-ai
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

### Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de la build
- `npm run lint` - Linting del código

## 📱 Secciones de la Landing Page

### 1. Header / Hero Section
- Logo y navegación
- Título principal: "Brújula: Orientación Vocacional con IA"
- Subtítulo motivador
- Botones CTA principales
- Ilustración SVG animada

### 2. Problema / Datos
- Estadísticas impactantes sobre deserción universitaria
- Análisis de las causas del problema
- Visualización de datos con cards interactivas

### 3. Nuestra Solución
- Misión y valores de la empresa
- Características principales de la plataforma
- Demo interactivo (placeholder)

### 4. Comparativa
- Tabla comparativa con competidores
- Ventajas clave de Brújula
- Social proof y testimonios

### 5. Llamado a la Acción
- Test vocacional principal
- Beneficios del servicio
- Estadísticas de usuarios

### 6. Footer
- Enlaces organizados por categorías
- Información de contacto
- Redes sociales
- Newsletter signup

## 🎯 Características Técnicas

### Animaciones
- **Framer Motion**: Animaciones de entrada suaves
- **Scroll-triggered**: Elementos que aparecen al hacer scroll
- **Hover effects**: Interacciones en botones y cards
- **Loading states**: Estados de carga elegantes

### Responsividad
- **Mobile-first**: Diseño optimizado para móviles
- **Breakpoints**: Adaptación a tablet y desktop
- **Flexible layouts**: Grid y Flexbox responsivos
- **Touch-friendly**: Elementos táctiles optimizados

### Performance
- **Lazy loading**: Carga diferida de componentes
- **Optimized images**: Imágenes optimizadas
- **Minimal bundle**: Bundle reducido con Vite
- **Fast loading**: Carga rápida de la página

## 🌐 Despliegue

### Netlify
1. Conectar repositorio a Netlify
2. Configurar build command: `npm run build`
3. Configurar publish directory: `dist`
4. Desplegar automáticamente

### GitHub Pages
1. Ejecutar `npm run build`
2. Subir contenido de `dist/` a la rama `gh-pages`
3. Configurar GitHub Pages en el repositorio

### Vercel
1. Conectar repositorio a Vercel
2. Configurar automáticamente
3. Desplegar con cada push

## 📊 SEO y Metadatos

- **Meta tags** optimizados para redes sociales
- **Open Graph** para Facebook y LinkedIn
- **Twitter Cards** para Twitter
- **Schema markup** para motores de búsqueda
- **Sitemap** y robots.txt incluidos

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Email**: hola@brujula-ai.com
- **Teléfono**: +56 9 1234 5678
- **Ubicación**: Santiago, Chile
- **Website**: https://brujula-ai.com

## 🙏 Agradecimientos

- [Tailwind CSS](https://tailwindcss.com/) por el framework de CSS
- [Framer Motion](https://www.framer.com/motion/) por las animaciones
- [Lucide](https://lucide.dev/) por los íconos
- [Vite](https://vitejs.dev/) por la herramienta de construcción

---

**Hecho con ❤️ en Chile para Latinoamérica**
