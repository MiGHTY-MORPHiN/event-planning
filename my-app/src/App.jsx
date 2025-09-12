
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import OutsideLogin from './pages/OutsideLogin.jsx';
import Home from './pages/Home.jsx';
import PlannerApp from './pages/planner/PlannerApp.jsx'
import Admin from './pages/admin/Admin.jsx';
import PlannerDashboard from './pages/planner/PlannerDashboard.jsx';
import PlannerContract from './pages/planner/PlannerContract.jsx';
import PlannerManagement from './pages/admin/PlannerManagement.jsx';
import EventManagement from './pages/admin/EventManagement.jsx';
import VendorManagement from './pages/admin/VendorManagement.jsx';
import VendorProfileEdit from './pages/vendor/vendorProfileEdit.jsx';
import VendorProfile from './pages/vendor/vendorProfile.jsx';
import VendorApply from './pages/vendor/vendorApply.jsx';
import Reports from './pages/admin/Reports.jsx';
import VendorApplications from './pages/admin/VendorApplications';
import LandingPage from './pages/LandingPage.jsx';
import NewEvent from './pages/planner/NewEvent.jsx';
import VendorWaiting from './pages/vendor/VendorWaiting.jsx'

import './App.css'
import VendorApp from './pages/vendor/vendorApp.jsx';

function App() {
  
  return (
    <Router>
      <Routes>

        <Route path='/' element={<LandingPage />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/outsidelogin' element={<OutsideLogin />} />

        <Route path='/home' element={<Home />} />
        
        <Route path='/planner-dashboard' element={<PlannerApp />} />
        <Route path='/planner-dashboard' element={<PlannerDashboard />} />
        <Route path='/planner/new-event' element={<NewEvent/>}/>
          
        <Route path='/vendor-app' element={<VendorApp />}/>
        <Route path='/vendor/vendor-dashboard' element ={<VendorProfile />} />
        <Route path='/vendor/vendor-edit-profile' element ={<VendorProfileEdit />} />
        <Route path='/vendor/vendor-profile' element ={<VendorProfile />} />
        <Route path='/vendor/vendor-apply' element ={<VendorApply />} />

        <Route path='/planner/new-event' element={<NewEvent/>}/>
        <Route path="/vendor/waiting" element={<VendorWaiting />} />
        <Route path="/planner/contracts" element={<PlannerContract/>}/>

     


        <Route path='/admin' element={<Admin />} />
        <Route path='/admin/planner-management' element ={<PlannerManagement/>} />
        <Route path='/admin/event-management' element ={<EventManagement/>} />
        <Route path='/admin/vendor-management' element ={<VendorManagement/>} />
        <Route path='/admin/reports' element={<Reports />} />
        <Route path='/admin/vendor-applications' element={<VendorApplications />} />
    
      </Routes>
    </Router>
  )
}

export default App;
