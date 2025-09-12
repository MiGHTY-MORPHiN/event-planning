// index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

//import { doc, setDoc } from 'firebase/firestore';

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://witty-stone-03009b61e.1.azurestaticapps.net'
  ],
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Auth middleware
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
}

//VENDOR
//=============================================
app.post('/vendor/apply', authenticate, async (req, res) => {
  try {
    const { businessName, phone, email, description, category, address, profilePic } = req.body;
    let profilePicURL = '';

    if (profilePic) {
      const buffer = Buffer.from(profilePic, 'base64');
      const fileRef = bucket.file(`Vendor/${req.uid}/profile.jpg`);
      await fileRef.save(buffer, { contentType: 'image/jpeg' });
      await fileRef.makePublic();
      profilePicURL = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
    }

    await db.collection('Vendor').doc(req.uid).set({
      businessName,
      phone,
      email,
      description,
      category,
      address: address || 'None',
      profilePic: profilePicURL,


      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Vendor application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// Get the vendor profile
app.get('/vendor/me', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('Vendor').doc(req.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendorData = doc.data();

    res.json({
      ...vendorData,
      profilePic: vendorData.profilePic || null // ensure field always exists
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update the vendor's profile
app.put('/vendor/me', authenticate, async (req, res) => {
  try {
    const { description, address, phone, email, profilePic } = req.body;
    let profilePicURL = '';

    if (profilePic) {
      const buffer = Buffer.from(profilePic, 'base64');
      const fileRef = bucket.file(`Vendor/${req.uid}/profile.jpg`);
      await fileRef.save(buffer, { contentType: 'image/jpeg' });
      await fileRef.makePublic();
      profilePicURL = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
    }

    await db.collection('Vendor').doc(req.uid).update({
      description,
      address,
      phone,
      email,
      ...(profilePicURL && { profilePic: profilePicURL }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


//Get the vendor bookings from the Event collection
// completely donw
app.get('/vendor/bookings', authenticate, async (req, res) => {
  try {
    const vendorID = req.uid;
    const eventsSnapshot = await db.collection("Event").get();
    const vendorEvents = [];

    for (const eventDoc of eventsSnapshot.docs) {
      const vendorsRef = db.collection("Event").doc(eventDoc.id).collection("Vendors").doc(vendorID);
      const vendorDoc = await vendorsRef.get();
      if (vendorDoc.exists) {
        const eventData = eventDoc.data();
        vendorEvents.push({

          budget:eventData.budget,
          eventId: eventDoc.id,
          eventName: eventData.name,
          description: eventData.description,

          date: eventData.date,
          location: eventData.location,
          expectedGuestCount: eventData.expectedGuestCount,

          style: eventData.style,
          specialRequirements: eventData.specialRequirements||[],
          eventCategory: eventData.eventCategory,
          theme: eventData.theme,

          vendorServices: vendorDoc.data().vendoringCategoriesNeeded || [], // services map for this vendor
          status: vendorDoc.data().status || "pending",     // optional overall status
        });
      }
    }

    res.json({ vendorID, bookings: vendorEvents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


app.put("/event/:eventId/vendor/:vendorId/status", authenticate, async (req, res) => {
  try {
    const { eventId, vendorId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const vendorRef = db
      .collection("Event")
      .doc(eventId)
      .collection("Vendors")
      .doc(vendorId);

    // Use update() instead of set() if you just want to update fields
    await vendorRef.update({ status });

    res.json({ message: "Vendor status updated successfully" });
  } catch (err) {
    console.error("Error updating vendor status:", err);

    // If the doc doesn't exist, update() will throw
    if (err.code === 5 || err.message.includes("No document to update")) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
});



app.put("/vendor/:eventId/contract",authenticate,upload.single("contract"),
  async (req, res) => {
    try {
      const vendorId = req.uid;
      const eventId = req.params.eventId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type" });
      }

      // Upload to Firebase Storage
      const fileName = `contracts/${eventId}/${vendorId}/${uuidv4()}-${file.originalname}`;
      const fileRef = storage.bucket().file(fileName); // make sure to use .bucket()
      await fileRef.save(file.buffer, { metadata: { contentType: file.mimetype } });

      const [downloadUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: new Date("2026-09-03"),
      });

      // Update Firestore
      const vendorRef = db.collection("Event").doc(eventId).collection("Vendors").doc(vendorId);
      const vendorSnap = await vendorRef.get();
      if (!vendorSnap.exists) {
        return res.status(404).json({ message: "Vendor not found for this event" });
      }

      await vendorRef.set({ contractUrl: downloadUrl }, { merge: true });

      res.json({ message: "Contract uploaded successfully", contractUrl: downloadUrl });
    } catch (err) {
      console.error("Error uploading contract:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);




app.get("/analytics/:vendorId", authenticate, async (req, res) => {
  try {
    const vendorId = req.params.vendorId; // Use the URL param
    console.log("Fetching analytics for vendor:", vendorId);

    // Fetch the Analytics document for this vendor
    const analyticsDoc = await db.collection("Analytics").doc(vendorId).get();
    if (!analyticsDoc.exists) {
      return res.status(404).json({ message: "Vendor analytics not found" });
    }

    const analyticsData = analyticsDoc.data();

    // Fetch Reviews subcollection
    const reviewsSnapshot = await db
      .collection("Analytics")
      .doc(vendorId)
      .collection("Reviews")
      .get();

    const reviews = reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ ...analyticsData, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



//==============================================================

app.post('/event/apply', authenticate, async (req, res) => {
  try {
    const {
      name,
      description,
      theme,
      location,
      budget,
      expectedGuestCount,
      duration,
      eventCategory,
      notes,
      specialRequirements = [],
      style = [],
      tasks = [],
      vendoringCategoriesNeeded = [],
      files = null,
      schedules = null,
      services = null,
      date,
      plannerId
    } = req.body;

    const newEvent = {
      name,
      description,
      theme,
      location,
      budget: Number(budget),
      expectedGuestCount: Number(expectedGuestCount),
      duration: Number(duration),
      eventCategory,
      notes,
      specialRequirements,
      style,
      tasks,
      vendoringCategoriesNeeded,
      files,
      schedules,
      services,
      date: date ? new Date(date) : null,
      status: "planning",
      plannerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("Event").add(newEvent);

    res.status(200).json({ message: "Event created successfully", id: docRef.id, event: newEvent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get('/planner/me/events', authenticate, async (req, res) => {
  try {
    const plannerId = req.uid; 

    const snapshot = await db.collection("Event")
      .where("plannerId", "==", plannerId)
      .get();

    if (snapshot.empty) {
      return res.json({ plannerId, events: [] });
    }

    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ plannerId, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//Get the guests for a particular event
app.get('/planner/:eventId/guests', authenticate, async (req, res) =>{
  try{

    const eventId = req.params.eventId;
    const snapshot = await db.collection("Event").doc(eventId).collection("Guests").get();

    if(snapshot.empty){
      return res.json({message: "No guests found for this event"});
    }

    const guests = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() }));
    res.json({eventId, guests});
  }
  catch(err){
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
});

//Get the vendors for a particular event
app.get('/planner/:eventId/vendors', authenticate, async (req, res) => {

  try{
    const eventId = req.params.eventId;
    const snapshot = await db.collection("Event").doc(eventId).collection("Vendors").get();

    if(snapshot.empty){
      return res.json({message: "No vendors found for this event"});
    }

    const vendors = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() }));
    res.json({eventId, vendors});
  }
  catch(err){
    console.error(err);
    res.status(500).json({message: "Server error"});
  }

});

//Get all vendors for a particular planner
app.get('/planner/all/vendors', authenticate, async (req, res) => {
  try {
    const plannerId = req.uid;
    const eventsSnapshot = await db.collection("Event")
      .where("plannerId", "==", plannerId)
      .get();

    if (eventsSnapshot.empty) {
      return res.json({ vendors: [] });
    }

    const vendorSet = new Set();
    const vendors = [];

    for (const eventDoc of eventsSnapshot.docs) {
      const vendorsSnapshot = await db.collection("Event")
        .doc(eventDoc.id)
        .collection("Vendors")
        .get();

      vendorsSnapshot.forEach(vendorDoc => {
        if (!vendorSet.has(vendorDoc.id)) {
          vendorSet.add(vendorDoc.id);
          vendors.push({ id: vendorDoc.id, ...vendorDoc.data() });
        }
      });
    }

    res.json({ vendors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//Updates the information of an event
app.put('/planner/me/:eventId', authenticate, async (req, res) => {
  try{
      const eventId = req.params.eventId;
      const updatedEventData = req.body;

      await db.collection("Event").doc(eventId).update(updatedEventData);

      res.json({message: "Event updated successfully"});


  }
  catch(err){
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
});

//Create a guest manually
app.post('/planner/me/:eventId/guests', authenticate, async (req, res) => {

  try{
    const eventId = req.params.eventId;
    const guestDetails = req.body;

    await db.collection("Event").doc(eventId).collection("Guests").add(guestDetails);

    res.json({message: "Guest added successfully"});
  }
  catch(err){
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
});

//Create planner doc on signup
app.post('/planner/signup', async (req, res) => {
  try{
    const {uid, name, email, eventHistory, activeEvents, preferences} = req.body;

    const plannerDoc = {
      uid,
      name,
      email,
      eventHistory,
      activeEvents,
      preferences
    };

    await db.collection('Planner').doc(plannerDoc.uid).set(plannerDoc);

    res.json({message: "Planner successfully created"});

  }



  catch(err){
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//Import guests
app.post('/planner/events/:eventId/guests/import', authenticate, async (req, res) => {
  try{
    const eventId = req.params.eventId;
    const { guests } = req.body;

    //Validate guest data
    const validGuests = guests.filter(guest => 
      guest.email && guest.firstname
    ).map(guest => ({
      firstname: guest.firstname?.trim(),
      lastname: guest.lastname?.trim() || '',
      email: guest.email?.toLowerCase().trim(),
      rsvpStatus: 'pending'
    }));

    // Batch write to Firestore
    const batch = db.batch();
    const guestCollection = db.collection('Event').doc(eventId).collection('Guests');
    
    validGuests.forEach(guest => {
      const guestRef = guestCollection.doc();
      batch.set(guestRef, guest);
    });

    await batch.commit();
    return res.status(200).json({ success: true, imported: validGuests.length });
  }
  catch{
    console.error(error);
    return res.status(500).json({message: "Internal Server Error"});
  }
});

//Fetch and filter best vendors
//Will perhaps make logic more complex in the future
app.get('/planner/events/:eventId/bestvendors', authenticate, async (req, res) => {
try {
    const eventId = req.params.eventId;
    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }

    // Fetch the event document to get its category
    const eventSnap = await db.collection("Event").doc(eventId).get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventSnap.data();
    const category = event.eventCategory;

    // Fetch approved vendors
    const vendorSnap = await db
      .collection("Vendor")
      .where("status", "==", "approved")
      .get();

    if (vendorSnap.empty) return res.status(200).json({ vendors: [] });

    const vendors = vendorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Apply scoring
    const scoredVendors = vendors.map(vendor => {
      let score = 0;
      if (vendor.category && vendor.category.toLowerCase() === category.toLowerCase()) score += 50;
      if (vendor.profilePic && vendor.profilePic.trim() !== "") score += 20;
      if (vendor.description && vendor.description.trim() !== "") score += 20;
      if (vendor.businessName && vendor.businessName.trim() !== "") score += 10;
      return { ...vendor, score };
    });

    const sortedVendors = scoredVendors.sort((a, b) => b.score - a.score);

    res.status(200).json({ vendors: sortedVendors });
  } catch (err) {
    console.error("Error matching vendors:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route   GET /api/admin/vendor-applications
 * @desc    Get all vendor applications with a 'pending' status.
 * @access  PUBLIC
 */
// --- CHANGE 1: Removed all middleware from this route ---
app.get('/admin/vendor-applications', async (req, res) => {
  try {
    const snapshot = await db.collection('Vendor').where('status', '==', 'pending').get();
    if (snapshot.empty) {
      return res.json([]);
    }
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

/**
 * @route   PUT /api/admin/vendor-applications/:vendorId
 * @desc    Approve or reject a vendor application.
 * @access  PUBLIC
 */
// --- CHANGE 2: Removed all middleware from this route ---
app.put('/admin/vendor-applications/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided' });
  }

  try {
    const vendorRef = db.collection('Vendor').doc(vendorId);
    await vendorRef.update({ status: status });
    res.json({ message: `Vendor application has been ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating application' });
  }
});

//Get the vendors for a particular event
app.get('/planner/:eventId/vendors', authenticate, async (req, res) => {

  try{
    const eventId = req.params.eventId;
    const snapshot = await db.collection("Event").doc(eventId).collection("Vendors").get();

    if(snapshot.empty){
      return res.json({message: "No vendors found for this event"});
    }

    const vendors = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() }));
    console.log(vendors);
    res.json({eventId, vendors});
  }
  catch(err){
    console.error(err);
    res.status(500).json({message: "Server error"});
  }

});

//Get the guests for a particular event
app.get('/planner/:eventId/guests', authenticate, async (req, res) =>{
  try{

    const eventId = req.params.eventId;
    const snapshot = await db.collection("Event").doc(eventId).collection("Guests").get();

    if(snapshot.empty){
      return res.json({message: "No guests found for this event"});
    }

    const guests = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() }));
    console.log(guests);
    res.json({eventId, guests});
  }
  catch(err){
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
});

app.get('/admin/vendor-applications', async (req, res) => {
  try {
    const snapshot = await db.collection('Vendor').where('status', '==', 'pending').get();
    if (snapshot.empty) {
      return res.json([]);
    }
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});


app.put('/admin/vendor-applications/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided' });
  }

  try {
    const vendorRef = db.collection('Vendor').doc(vendorId);
    await vendorRef.update({ status: status });
    res.json({ message: `Vendor application has been ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating application' });
  }
});


app.get("/vendor/status", authenticate, async (req, res) => {
  try {
    const vendorRef = db.collection("Vendor").doc(req.uid); 
    const doc = await vendorRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Vendor application not found" });
    }

    const { status } = doc.data();
    return res.json({ status });
  } catch (err) {
    console.error("Error fetching vendor status:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Unprotected: Get all events for a user by UID (guid)
app.get('/public/user/:uid/events', async (req, res) => {
  try {
    const uid = req.params.uid;
    const snapshot = await db.collection("Event")
      .where("plannerId", "==", uid)
      .get();

    if (snapshot.empty) {
      return res.json({ uid, events: [] });
    }

    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ uid, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Unprotected guest list endpoint (public)
app.get('/public/event/:eventId/guests', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const snapshot = await db.collection("Event").doc(eventId).collection("Guests").get();

    if (snapshot.empty) {
      return res.json({ message: "No guests found for this event" });
    }

    const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ eventId, guests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

exports.api = functions.https.onRequest(app);
