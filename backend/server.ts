import express from "express";
import cors from "cors";

import {
  getOwnerId,
  getProperty,
  getChangeLogs,
  getPropertyDetails,
  getPropertyOwners,
  getUserIdByEmail
} from "./FetchData.js";

import { fetchSpaceEnum } from "./FetchSpaceEnum.js";

import { ownerOnboardProperty, adminOnboardProperty } from "./OnboardPropertyService.js";

import { fetchAssetTypes } from "./FetchAssetTypes.js";

import { signupUser, loginUser, validateSignup, validateLogin, SignupData } from "./AuthService.js";

import multer from "multer";
import { uploadPropertyImage } from "./ImageUploadService.js";


const app = express();
app.use(cors());
app.use(express.json());

// Multer setup (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Fetch data endpoints
// GET owner id by userId
app.get("/owner/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("Fetching owner ID for userId:", userId);
  const ownerId = await getOwnerId(userId);
  console.log("Owner ID:", ownerId);
  res.json({ ownerId });
});

// GET properties by userId
app.get("/properties/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("Fetching properties for userId:", userId);
  const properties = await getProperty(userId);
  console.log("Properties:", properties);
  res.json({ properties });
});

// GET change logs for multiple propertyIds
app.post("/changelogs", async (req, res) => {
  const { propertyIds } = req.body; // expect { propertyIds: string[] }
  console.log("Fetching changelogs for propertyIds:", propertyIds);
  if (!Array.isArray(propertyIds)) {
    console.error("Invalid propertyIds payload");
    return res.status(400).json({ error: "propertyIds must be an array" });
  }
  const changes = await getChangeLogs(propertyIds);
  console.log("Change logs:", changes);
  res.json({ changes });
});

// GET property details
app.get("/property/:propertyId", async (req, res) => {
  const { propertyId } = req.params;
  console.log("Fetching property details for propertyId:", propertyId);
  const property = await getPropertyDetails(propertyId);
  console.log("Property details:", property);
  res.json({ property });
});

// GET owners of a property
app.get("/property/:propertyId/owners", async (req, res) => {
  const { propertyId } = req.params;
  console.log("Fetching owners for propertyId:", propertyId);
  const owners = await getPropertyOwners(propertyId);
  console.log("Owners:", owners);
  res.json({ owners });
});

// GET userId by email
app.get("/userId", async (req, res) => {
  const { email } = req.query;
  console.log("Fetching userId for email:", email);
  if (!email || typeof email !== "string") {
    console.error("Email missing or invalid");
    return res.status(400).json({ error: "Email is required" });
  }
  const userId = await getUserIdByEmail(email);
  console.log("User ID:", userId);
  res.json({ userId });
});


// Fetch Space Enum endpoint
// GET all space types
app.get("/space-enum", async (req, res) => {
  try {
    console.log("Fetching space enums");
    const spaceTypes = await fetchSpaceEnum();
    console.log("Space types:", spaceTypes);
    res.json({ spaceTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch space enums" });
  }
});

// Onboard Property endpoints
app.post("/onboard/owner", async (req, res) => {
  const { formData, spaces } = req.body; // expect { formData: FormData, spaces: Space[] }

  console.log("Owner onboarding request:", { formData, spaces });
  if (!formData || !spaces) {
    console.error("Missing formData or spaces");
    return res.status(400).json({ error: "formData and spaces are required" });
  }

  try {
    const propertyId = await ownerOnboardProperty(formData, spaces);
    console.log("Property onboarded for owner, ID:", propertyId);
    res.json({ propertyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to onboard property for owner" });
  }
});

app.post("/onboard/admin", async (req, res) => {
  const { ownerData, formData, spaces } = req.body; // expect { ownerData: OwnerData, formData: FormData, spaces: Space[] }

  if (!ownerData || !formData || !spaces) {
    console.log("Admin onboarding request:", { ownerData, formData, spaces });
    return res.status(400).json({ error: "ownerData, formData, and spaces are required" });
  }

  try {
    const propertyId = await adminOnboardProperty(ownerData, formData, spaces);
    console.log("Property onboarded for admin, ID:", propertyId);
    res.json({ propertyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to onboard property for admin" });
  }
});

// Fetch asset types endpoint
app.get("/asset-types", async (req, res) => {
  try {
    console.log("Fetching asset types");
    const assetTypes = await fetchAssetTypes();
    console.log("Asset types:", assetTypes);
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
  console.log("Signup request:", signupData);
  try {
    const errors = await validateSignup(signupData);
    if (Object.values(errors).some(arr => arr.length > 0)) {
      console.error("Signup validation errors:", errors);
      return res.status(400).json({ errors });
    }

    const result = await signupUser(signupData);
    console.log("Signup successful:", result);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Signup failed" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request:", { email });
  try {
    const errors = await validateLogin(email, password);
    if (Object.keys(errors).length > 0) {
      console.error("Login validation errors:", errors);
      return res.status(400).json({ errors });
    }

    const result = await loginUser(email, password);
    console.log("Login successful:", result);
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

// POST /auth/validate-signup
app.post("/auth/validate-signup", async (req, res) => {
  try {
    const signupData: SignupData = req.body;
    console.log("Validate signup request:", signupData);
    const errors = await validateSignup(signupData);
    const hasErrors = Object.values(errors).some(arr => arr.length > 0);
    console.log("Validation result:", { errors, valid: !hasErrors });
    res.json({ errors, valid: !hasErrors });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Validation failed" });
  }
});

// POST /auth/validate-login
app.post("/auth/validate-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Validate login request:", { email });
    const errors = await validateLogin(email, password);
    const hasErrors = Object.keys(errors).length > 0;
    console.log("Validation result:", { errors, valid: !hasErrors });
    res.json({ errors, valid: !hasErrors });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Validation failed" });
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


// Tests
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/health", (req, res) => res.json({ status: "ok" }));


const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on ${port}`));
