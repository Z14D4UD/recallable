import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home               from './pages/Home';
import Login              from './pages/Login';
import Signup             from './pages/Signup';
import Dashboard          from './components/Dashboard';
import CustomerDashboard  from './components/CustomerDashboard';
import AffiliateDashboard from './components/AffiliateDashboard';
import CarUpload          from './pages/CarUpload';
import IdVerification     from './components/IdVerification';

import PaymentPage        from './pages/PaymentPage';
import Payout             from './components/Payment';
import SearchResultsPage  from './pages/SearchResultsPage';
import CarDetailsPage     from './pages/CarDetailsPage';
import Chat               from './components/Chat';
import Profile            from './pages/Profile';
import CustomerAccountPage from './pages/CustomerAccountPage';
import ChangePassword     from './pages/ChangePassword';
import CustomerBookingsPage from './pages/CustomerBookingsPage';
import MessagesPage       from './pages/MessagesPage';
import AboutHyre          from './pages/AboutHyre';
import ContactUs          from './pages/ContactUs';
import LegalPage          from './pages/LegalPage';
import BusinessProfile    from './pages/BusinessProfile';
import AddListing         from './pages/AddListing';
import MyListings         from './pages/MyListings';
import EditListing        from './pages/EditListing';
import BusinessBookings   from './pages/BusinessBookings';
import BusinessMessagesPage from './pages/BusinessMessagesPage';
import ConnectBank        from './pages/ConnectBank';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import AdminDashboard     from './pages/AdminDashboard';
import BusinessPublicPage from './pages/BusinessPublicPage';
import LeaveReviewPage    from './pages/LeaveReviewPage';
import ThankYouReviewPage from './pages/ThankYouReviewPage';
import FavoritesPage      from './pages/FavoritesPage';
import ComparePage        from './pages/ComparePage';

import BookingDetailPage  from './pages/BookingDetailPage';    // ← NEW

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/"       element={<Home />} />
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* dashboards */}
      <Route path="/dashboard/business"  element={<Dashboard />} />
      <Route path="/dashboard/customer"  element={<CustomerDashboard />} />
      <Route path="/dashboard/affiliate" element={<AffiliateDashboard />} />

      {/* functional */}
      <Route path="/upload-car"    element={<CarUpload />} />
      <Route path="/verify-id"     element={<IdVerification />} />
      <Route path="/payment"       element={<PaymentPage />} />
      <Route path="/payment/payout" element={<Payout />} />
      <Route path="/search"        element={<SearchResultsPage />} />

      {/* detail */}
      <Route path="/details/listing/:id" element={<CarDetailsPage />} />
      <Route path="/bookings/:id"        element={<BookingDetailPage />} />   {/* ← NEW */}

      {/* chat */}
      <Route path="/chat" element={<Chat />} />

      {/* misc */}
      <Route path="/profile"               element={<Profile />} />
      <Route path="/account"               element={<CustomerAccountPage />} />
      <Route path="/change-password"       element={<ChangePassword />} />
      <Route path="/bookings/customer"     element={<CustomerBookingsPage />} />
      <Route path="/bookings/business"     element={<BusinessBookings />} />
      <Route path="/messages"              element={<MessagesPage />} />
      <Route path="/messages/business"     element={<BusinessMessagesPage />} />
      <Route path="/about-hyre"            element={<AboutHyre />} />
      <Route path="/contact-support"       element={<ContactUs />} />
      <Route path="/legal"                 element={<LegalPage />} />
      <Route path="/profile/business"      element={<BusinessProfile />} />
      <Route path="/add-listing"           element={<AddListing />} />
      <Route path="/my-listings"           element={<MyListings />} />
      <Route path="/edit-listing/:id"      element={<EditListing />} />
      <Route path="/connect-bank"          element={<ConnectBank />} />
      <Route path="/payment/confirmation"  element={<PaymentSuccessPage />} />
      <Route path="/dashboard/admin"       element={<AdminDashboard />} />
      <Route path="/business/:id"          element={<BusinessPublicPage />} />
      <Route path="/review/:bookingId"     element={<LeaveReviewPage />} />
      <Route path="/review/success"        element={<ThankYouReviewPage />} />
      <Route path="/favorites"             element={<FavoritesPage />} />
      <Route path="/compare"               element={<ComparePage />} />

      <Route path="*" element={<div style={{ padding: '2rem' }}>404 – Not Found</div>} />
    </Routes>
  );
}
