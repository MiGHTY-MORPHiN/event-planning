
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import PlannerApp from './pages/planner/PlannerApp.jsx'
import Admin from './pages/adminDashboard/Admin.jsx';
import PlannerDashboard from './pages/planner/PlannerDashboard.jsx';
import PlannerManagement from './pages/adminDashboard/PlannerManagement.jsx';
import EventManagement from './pages/adminDashboard/EventManagement.jsx';
import VendorManagement from './pages/adminDashboard/VendorManagement.jsx';
import VendorProfileEdit from './pages/vendor/vendorProfileEdit.jsx';
import VendorProfile from './pages/vendor/vendorProfile.jsx';
import Reports from './pages/adminDashboard/Reports.jsx';



import './App.css'
import VendorApp from './pages/vendor/vendorApp.jsx';

function App() {
  
  return (
    <Router>
      <Routes>
        
        <Route path='/signup' element={<Signup />} />
        <Route path='/' element={<Login />} />
        <Route path='/admin/planner-management' element ={<PlannerManagement/>} />\
        <Route path='/admin/event-management' element ={<EventManagement/>} />
        <Route path='/admin/vendor-management' element ={<VendorManagement/>} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path='/login' element={<Login />} />
        <Route path='/home' element={<Home />} />
        <Route path='/planner-dashboard' element={<PlannerApp />} />
        <Route path='/admin' element={<Admin />} />
        <Route path='/planner-dashboard' element={<PlannerDashboard />} />
        <Route path='/vendor-app' element={<VendorApp />}/>
        <Route path='/admin/admin-home' element ={<Admin />} />
        <Route path='/vendor/vendor-edit-profile' element ={<VendorProfileEdit />} />
        <Route path='/vendor/vendor-profile' element ={<VendorProfile />} />
     

        
      </Routes>
    </Router>
  )
}

export default App;
