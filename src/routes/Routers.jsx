/* eslint-disable no-unused-vars */

import React from 'react';
import Home from '../pages/Home'
import Services from '../pages/Services'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Contact from '../pages/Contact'
import Doctors from '../pages/Doctors/Doctors'
import DoctorDetails from '../pages/Doctors/DoctorDetails'
import {Routes, Route} from 'react-router-dom'
import MyAccount from '../Dashboard/user-account/MyAccount';
import Dashboard from '../Dashboard/doctor-account/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import CheckoutSuccess from '../pages/CheckoutSuccess';

import AdminLayout from '../layout/AdminLayout';
import AdminLogin from '../pages/Admin/AdminLogin';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import DoctorsManagement from '../pages/Admin/DoctorsManagement';
import PatientsManagement from '../pages/Admin/PatientsManagement';
import ServicesManagement from '../pages/Admin/ServicesManagement';
import AppointmentsManagement from '../pages/Admin/AppointmentsManagement';
import PaymentsManagement from '../pages/Admin/PaymentsManagement';
import Reports from '../pages/Admin/Reports';

const Routers = () => {
  return (
    <Routes>
      <Route path ="/" element={<Home/>} />
      <Route path ="/home" element={<Home/>} />
      <Route path ="/doctors" element={<Doctors/>} />
      <Route path ="/doctors/:id" element={<DoctorDetails/>} />
      <Route path ="/login" element={<Login/>} />
      <Route path ="/register" element={<Signup/>} />
      <Route path ="/contact" element={<Contact/>} />
      <Route path ="/services" element={<Services/>} />
      <Route path ="/checkout-success" element={<CheckoutSuccess/>} />
      <Route path ="/users/profile/me" element={<ProtectedRoute allowedRoles={['patient']}><MyAccount/></ProtectedRoute>} />
      <Route path ="/doctors/profile/me" element={<ProtectedRoute allowedRoles={['doctor']}><Dashboard/></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route path="overview" element={<AdminDashboard />} />
        <Route path="doctors" element={<DoctorsManagement />} />
        <Route path="patients" element={<PatientsManagement />} />
        <Route path="services" element={<ServicesManagement />} />
        <Route path="appointments" element={<AppointmentsManagement />} />
        <Route path="payments" element={<PaymentsManagement />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
};

export default Routers