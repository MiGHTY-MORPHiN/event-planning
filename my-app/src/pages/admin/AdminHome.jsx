import React from 'react'
import 
{BsFillArchiveFill, BsFillGrid3X3GapFill, BsPeopleFill, BsFillBellFill}
 from 'react-icons/bs'
import VendorApplications from './VendorApplications';

function AdminHome() {
  return (
    <main className='main-container'>

        <div className='main-cards'>
            <div className='card'>
                <div className='card-inner'>
                    <h3>VENDORS</h3>
                    <BsFillArchiveFill className='card_icon'/>
                </div>
                <h1>300</h1>
            </div>
            <div className='card'>
                <div className='card-inner'>
                    <h3>CATEGORIES</h3>
                    <BsFillGrid3X3GapFill className='card_icon'/>
                </div>
                <h1>12</h1>
            </div>
            <div className='card'>
                <div className='card-inner'>
                    <h3>PLANNERS</h3>
                    <BsPeopleFill className='card_icon'/>
                </div>
                <h1>33</h1>
            </div>
            <div className='card'>
                <div className='card-inner'>
                    <h3>ALERTS</h3>
                    <BsFillBellFill className='card_icon'/>
                </div>
                <h1>42</h1>
            </div>
        </div>
        <div className='vendor-applications'>
            <div className='card'>
                <div className='main-title'>
        <h3>Pending Vendor Applications</h3>
      </div>
                <VendorApplications/>
            </div>
        </div>
    </main>
  )
}

export default AdminHome