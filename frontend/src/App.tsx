/**
 * @fileoverview Componente raíz de React que configura el enrutamiento (React Router) principal de la aplicación.
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ProductsPage from '@/features/inventory/ProductsPage';
import SuppliersPage from '@/features/restock/SuppliersPage';
import PurchaseOrdersPage from '@/features/restock/PurchaseOrdersPage';
import SalesPage from '@/features/sales/SalesPage';
import SalesHistoryPage from '@/features/sales/SalesHistoryPage';
import CashAuditPage from '@/features/sales/CashAuditPage';
import UsersPage from '@/features/users/UsersPage';
import PatientsPage from '@/features/patients/PatientsPage';
import AppointmentsPage from '@/features/appointments/AppointmentsPage';
import NewPatientPage from '@/features/patients/NewPatientPage';
import EditPatientPage from '@/features/patients/EditPatientPage';
import PatientDetailsPage from '@/features/patients/PatientDetailsPage';
import ConsultationPage from '@/features/patients/ConsultationPage';
import Toaster from '@/components/ui/Toaster';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/productos" element={<ProductsPage />} />
              <Route path="/proveedores" element={<SuppliersPage />} />
              <Route path="/compras" element={<PurchaseOrdersPage />} />
              <Route path="/ventas" element={<SalesPage />} />
              <Route path="/ventas/historial" element={<SalesHistoryPage />} />
              <Route path="/corte-caja" element={<CashAuditPage />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/pacientes" element={<PatientsPage />} />
              <Route path="/pacientes/nuevo" element={<NewPatientPage />} />
              <Route path="/pacientes/:id/editar" element={<EditPatientPage />} />
              <Route path="/pacientes/:id/expediente" element={<PatientDetailsPage />} />
              <Route path="/pacientes/:patientId/consulta/nueva" element={<ConsultationPage />} />
              <Route path="/pacientes/:patientId/consulta/:consultationId/editar" element={<ConsultationPage />} />
              <Route path="/citas" element={<AppointmentsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
