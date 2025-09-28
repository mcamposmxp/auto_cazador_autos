import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";

// Lazy loading para páginas grandes
const Landing = lazy(() => import("./pages/Landing"));
const ValuacionAuto = lazy(() => import("./components/ValuacionAuto"));
const Comprar = lazy(() => import("./pages/Comprar"));
const Vender = lazy(() => import("./pages/Vender"));
const Trust = lazy(() => import("./pages/Trust"));
const AyudaComprar = lazy(() => import("./pages/AyudaComprar"));
const ContactoExperto = lazy(() => import("./pages/ContactoExperto"));
const BuscarAutos = lazy(() => import("./pages/BuscarAutos"));
const PreciosVenta = lazy(() => import("./pages/PreciosVenta"));
const OpcionesVenta = lazy(() => import("./pages/OpcionesVenta"));
const RedProfesionales = lazy(() => import("./pages/RedProfesionales"));
const SubastaAuto = lazy(() => import("./pages/SubastaAuto"));
const VentaCuentaPropia = lazy(() => import("./pages/VentaCuentaPropia"));
const PanelOfertas = lazy(() => import("./pages/PanelOfertas"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Administracion = lazy(() => import("./pages/Administracion"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PanelProfesionales = lazy(() => import("./pages/PanelProfesionales"));
const HerramientasProfesionales = lazy(() => import("./pages/HerramientasProfesionales"));
const Oportunidades = lazy(() => import("./pages/Oportunidades"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Notificaciones = lazy(() => import("./pages/Notificaciones"));
const Planes = lazy(() => import("./pages/Planes"));
const CreditosGratis = lazy(() => import("./pages/CreditosGratis"));
const MisDatos = lazy(() => import("./pages/MisDatos"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider delayDuration={300}>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/buscar-autos" element={<BuscarAutos />} />
              <Route path="/comprar" element={<Comprar />} />
              <Route path="/valuacion" element={<ValuacionAuto />} />
              <Route path="/precios-venta" element={<PreciosVenta />} />
              <Route path="/vender" element={<Vender />} />
              <Route path="/opciones-venta" element={<OpcionesVenta />} />
              <Route path="/red-profesionales" element={<RedProfesionales />} />
              <Route path="/subasta-auto" element={<SubastaAuto />} />
              <Route path="/venta-cuenta-propia" element={<VentaCuentaPropia />} />
              <Route path="/panel-ofertas" element={<PanelOfertas />} />
              <Route path="/oportunidades" element={<Oportunidades />} />
              <Route path="/panel-profesionales" element={<PanelProfesionales />} />
              <Route path="/herramientas-profesionales" element={<HerramientasProfesionales />} />
              <Route path="/administracion" element={<Administracion />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/trust" element={<Trust />} />
              <Route path="/ayuda-comprar" element={<AyudaComprar />} />
              <Route path="/contacto-experto" element={<ContactoExperto />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/notificaciones" element={<Notificaciones />} />
              <Route path="/planes" element={<Planes />} />
              <Route path="/creditos-gratis" element={<CreditosGratis />} />
              <Route path="/mis-datos" element={<MisDatos />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
        <Toaster />
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
