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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: 'Vendor application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



app.get('/vendor/me', authenticate, async (req, res) => {
  try {

    const doc = await db.collection('Vendor').doc(req.uid).get();
    if (!doc.exists) return res.status(404).json({ message: 'Vendor not found ' });
    res.json(doc.data());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/vendor/me', authenticate, async (req, res) => {
  try {
    const { description, address, phone, email, profilePic } = req.body;
    const updateData = { description, address, phone, email };

    
    if (profilePic) {
      const buffer = Buffer.from(profilePic, 'base64');
      const fileRef = bucket.file(`Vendor/${req.uid}/profile.jpg`);
      await fileRef.save(buffer, { contentType: 'image/jpeg' });
      await fileRef.makePublic(); 
      updateData.profilePic = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
    }

    await db.collection('Vendor').doc(req.uid).set(updateData, { merge: true });
      

    res.status(200).json({ message: 'Profile updated successfully', data: updateData });
  } catch (err) {
      
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

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
    console.log(guests);
    res.json({eventId, guests});
  }
  catch(err){
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
});

app.get

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

exports.api = functions.https.onRequest(app);
