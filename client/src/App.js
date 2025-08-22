import React from "react";
import { Routes, Route } from "react-router-dom";

import Home   from "./pages/Home";
// import Login  from "./pages/Login";
import Signup from "./pages/Signup";
// …(all other imports commented for now)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />


      {/*
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard/business"  element={<Dashboard />} />
      <Route path="/dashboard/customer"  element={<CustomerDashboard />} />
      <Route path="/dashboard/affiliate" element={<AffiliateDashboard />} />
      <Route path="/upload-car"    element={<CarUpload />} />
      <Route path="/verify-id"     element={<IdVerification />} />
      <Route path="/payment"       element={<PaymentPage />} />
      <Route path="/payment/payout" element={<Payout />} />
      <Route path="/search"        element={<SearchResultsPage />} />
      <Route path="/details/listing/:id" element={<CarDetailsPage />} />
      <Route path="/bookings/:id"        element={<BookingDetailPage />} />
      <Route path="/chat" element={<Chat />} />
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
      */}

      <Route path="*" element={<div style={{ padding: "2rem" }}>404 – Not Found</div>} />
    </Routes>
  );
}
