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


app.post('/vendor/apply', upload.single('profilePic'), async (req, res) => {
  try {
    const { businessName, phone, email, description, category, address } = req.body;
    let profilePicURL = '';

    if (req.file) {
      const fileRef = bucket.file(`Vendor/${req.uid}/profile.jpg`);
      await fileRef.save(req.file.buffer, { contentType: req.file.mimetype });
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
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Vendor application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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

// Update vendor
app.put('/vendor/me', authenticate, upload.single('profilePic'), async (req, res) => {
  try {
    const { description, address, phone, email } = req.body;
    const updateData = { description, address, phone, email };

    if (req.file) {
      const fileRef = bucket.file(`Vendor/${req.uid}/profile.jpg`);
      await fileRef.save(req.file.buffer, { contentType: req.file.mimetype });
      updateData.profilePic = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
    }

    await db.collection('Vendor').doc(req.uid).set(updateData, { merge: true });

      

    res.status(200).json({ message: 'Profile updated successfully', data: updateData });
  } catch (err) {
      
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});


//Apply for event
app.post('/event/apply', authenticate, async (req, res) => {
  try {
    const { eventName, description, theme, location, budget, notes, startTime, endTime } = req.body;

    await db.collection('Event').doc(req.uid).set({
      eventName,
      description,
      theme,
      location,
      budget,
      notes: notes || 'None',
      startTime: startTime,
      endTime: endTime,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Event application submitted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error ' });
  }
});

//Get an event
app.get('/event/:eventId', authenticate, async(req, res) => {
  try{
    const {eventId} = req.params;
    const eventDoc = await db.collection("Event").doc(eventId).get();

    if(!eventDoc.exists){
      return res.status(404).json({message: "Event not found"});
    }
    res.json(eventDoc.data());
    
  }
  catch (err){
    console.error(err);
    res.status(500).json({message: "Server Error"});
  }
});


app.get('/planner/:plannerId/events', authenticate, async (req, res) => {
  try {

    console.log("In function");
    const { plannerId } = req.params;
    console.log("In function");
    // Query events where plannerId matches
    const snapshot = await db.collection("Event")
                             .where("plannerId", "==", plannerId)
                             .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No events found for this planner" });
    }

    console.log("in functions");
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ plannerId, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

exports.api = functions.https.onRequest(app);
