// client/src/App.js
import { Routes, Route } from 'react-router-dom';
import { PollingProvider } from './contexts/PollingContext';
import Layout from './components/Layout';
import Home from './components/Home';
import AuthForm from './components/AuthForm';
import RideForm from './components/RideForm';
import RideList from './components/RideList';
import RequestForm from './components/RequestForm';
import MyRides from './components/MyRides';
import RideHistory from './components/RideHistory';
import RideDetails from './components/RideDetails';
import Messages from './components/Messages';
import Conversation from './components/Conversation';
import Contracts from './components/Contracts';
import ContractForm from './components/ContractForm';
import ContractDetails from './components/ContractDetails';
import AdminDashboard from './components/AdminDashboard';
import EmergencyContacts from './components/EmergencyContacts';

export default function App() {
  return (
    <PollingProvider>
      <Routes>
        <Route element={<Layout/>}>
          <Route index element={<Home />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/register" element={<AuthForm mode="register" />} />
          <Route path="/rides" element={<RideList />} />
          <Route path="/post-ride" element={<RideForm />} />
          <Route path="/my-rides" element={<MyRides />} />
          <Route path="/ride-history" element={<RideHistory />} />
          <Route path="/ride/:id" element={<RideDetails />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Conversation />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/new" element={<ContractForm />} />
          <Route path="/contracts/:id" element={<ContractDetails />} />
          <Route path="/request/:rideId" element={<RequestForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/emergency-contacts" element={<EmergencyContacts />} />
          <Route path="*" element={<div className="container">Not found</div>} />
        </Route>
      </Routes>
    </PollingProvider>
  );
}
