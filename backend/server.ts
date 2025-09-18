import express from "express";
import cors from "cors";

import {
  getOwnerId,
  getProperty,
  getChangeLogs,
  getPropertyDetails,
  getPropertyOwners,
  getUserIdByEmail
} from "./FetchData";

import { fetchSpaceEnum } from "./FetchSpaceEnum";

import { ownerOnboardProperty, adminOnboardProperty } from "./OnboardPropertyService";

import { fetchAssetTypes } from "./FetchAssetTypes";

import { signupUser, loginUser, validateSignup, validateLogin, SignupData } from "./AuthService";

import multer from "multer";
import { uploadPropertyImage } from "./ImageUploadService";


const app = express();
app.use(cors());
app.use(express.json());

// Multer setup (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Fetch data endpoints
// GET owner id by userId
app.get("/owner/:userId", async (req, res) => {
  const { userId } = req.params;
  const ownerId = await getOwnerId(userId);
  res.json({ ownerId });
});

// GET properties by userId
app.get("/properties/:userId", async (req, res) => {
  const { userId } = req.params;
  const properties = await getProperty(userId);
  res.json({ properties });
});

// GET change logs for multiple propertyIds
app.post("/changelogs", async (req, res) => {
  const { propertyIds } = req.body; // expect { propertyIds: string[] }
  if (!Array.isArray(propertyIds)) {
    return res.status(400).json({ error: "propertyIds must be an array" });
  }
  const changes = await getChangeLogs(propertyIds);
  res.json({ changes });
});

// GET property details
app.get("/property/:propertyId", async (req, res) => {
  const { propertyId } = req.params;
  const property = await getPropertyDetails(propertyId);
  res.json({ property });
});

// GET owners of a property
app.get("/property/:propertyId/owners", async (req, res) => {
  const { propertyId } = req.params;
  const owners = await getPropertyOwners(propertyId);
  res.json({ owners });
});

// GET userId by email
app.get("/userId", async (req, res) => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }
  const userId = await getUserIdByEmail(email);
  res.json({ userId });
});


// Fetch Space Enum endpoint
// GET all space types
app.get("/space-enum", async (req, res) => {
  try {
    const spaceTypes = await fetchSpaceEnum();
    res.json({ spaceTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch space enums" });
  }
});

// Onboard Property endpoints
app.post("/onboard/owner", async (req, res) => {
  const { formData, spaces } = req.body; // expect { formData: FormData, spaces: Space[] }

  if (!formData || !spaces) {
    return res.status(400).json({ error: "formData and spaces are required" });
  }

  try {
    const propertyId = await ownerOnboardProperty(formData, spaces);
    res.json({ propertyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to onboard property for owner" });
  }
});

app.post("/onboard/admin", async (req, res) => {
  const { ownerData, formData, spaces } = req.body; // expect { ownerData: OwnerData, formData: FormData, spaces: Space[] }

  if (!ownerData || !formData || !spaces) {
    return res.status(400).json({ error: "ownerData, formData, and spaces are required" });
  }

  try {
    const propertyId = await adminOnboardProperty(ownerData, formData, spaces);
    res.json({ propertyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to onboard property for admin" });
  }
});

// Fetch asset types endpoint
app.get("/asset-types", async (req, res) => {
  try {
    const assetTypes = await fetchAssetTypes();
    res.json({ assetTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch asset types" });
  }
});


// Auth endpoints
// Signup
app.post("/auth/signup", async (req, res) => {
  const signupData: SignupData = req.body;
  try {
    const errors = await validateSignup(signupData);
    if (Object.values(errors).some(arr => arr.length > 0)) {
      return res.status(400).json({ errors });
    }

    const result = await signupUser(signupData);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Signup failed" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const errors = await validateLogin(email, password);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

app.post("/upload/property-image", upload.single("file"), async (req, res) => {
  const file = req.file;
  const { filePath } = req.body;

  if (!file || !filePath) {
    return res.status(400).json({ error: "File and filePath are required" });
  }

  try {
    const result = await uploadPropertyImage(file.buffer, filePath, file.mimetype);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on ${port}`));
