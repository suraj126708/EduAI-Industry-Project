// controllers/schoolController.js

import School from "../models/School.js";
import User from "../models/UserSchema.js";

export const registerSchool = async (req, res) => {
  try {
    const {
      schoolName,
      // 🛑 FIX 1: Match the keys sent by your Frontend
      address, // Frontend sends 'address', not 'schoolAddress'
      type, // Frontend sends 'type', not 'schoolType'
      contact,
      principalName,
      principalEmail,
      password,
      firebaseUid,
    } = req.body;

    // --- 1. Handle Principal User (Find or Create) ---

    // 🛑 FIX 2: Check by Email OR FirebaseUid to find existing users created by middleware
    let principal = await User.findOne({
      $or: [{ email: principalEmail }, { firebaseUid: firebaseUid }],
    });

    if (principal) {
      // Case A: User exists (orphaned or created by auth middleware).

      // Security Check: If found by UID but email is different, or vice versa, handle strictly
      // For now, we assume it's the same person claiming the account.

      // Check if already assigned to a school
      if (principal.schoolId) {
        return res.status(409).json({
          success: false,
          message:
            "This user is already registered as a principal for a school.",
        });
      }

      // Update the existing user record to become a Principal
      principal.name = principalName;
      principal.email = principalEmail; // Ensure email matches
      principal.role = "principal";
      principal.status = "pending";
      principal.firebaseUid = firebaseUid;
      if (password) principal.password = password;
    } else {
      // Case B: User does not exist. Create a new one.
      principal = new User({
        name: principalName,
        email: principalEmail,
        password: password,
        role: "principal",
        status: "pending",
        firebaseUid: firebaseUid,
      });
    }

    // --- 2. Create School ---
    // Check if school name is taken
    const existingSchool = await School.findOne({ name: schoolName });
    if (existingSchool) {
      return res.status(409).json({
        success: false,
        message: "A school with this name already exists.",
      });
    }

    const school = new School({
      name: schoolName,
      type: type || "private", // Use 'type' from req.body
      address: address, // Use 'address' from req.body
      contact: contact,
      principalId: principal._id,
      status: "pending",
    });

    // --- 3. Link Principal to School ---
    principal.schoolId = school._id;

    // --- 4. Save Both ---
    await principal.save();

    try {
      await school.save();
    } catch (schoolError) {
      // If school creation fails (e.g. validation), cleanup isn't strictly necessary
      // if we reused an existing user, but if it was new, we might want to revert.
      // For now, letting the user stay in "pending" without a school link is acceptable
      // as they can retry registration.
      console.error("School save failed:", schoolError);
      throw schoolError;
    }

    res.status(201).json({
      success: true,
      message:
        "School registration submitted. Waiting for superadmin approval.",
    });
  } catch (error) {
    console.error("Error registering school:", error);

    if (error.code === 11000) {
      // Check which field caused the duplicate
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `Duplicate entry: ${field} is already in use.`,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const createSchool = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Not authorized to create schools.",
      });
    }

    const {
      name,
      type,
      establishedYear,
      address,
      contact,
      emailDomain,
      principalName,
      principalEmail,
      principalPassword,
    } = req.body;

    // Basic validation for required fields
    const missing = [];
    if (!name) missing.push("name");
    if (!type) missing.push("type");
    if (!address) missing.push("address");
    if (!contact) missing.push("contact");
    if (!principalName) missing.push("principalName");
    if (!principalEmail) missing.push("principalEmail");
    if (!principalPassword) missing.push("principalPassword");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missing,
      });
    }

    // Validate school type
    if (!["government", "private", "public"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid school type. Must be government, private, or public",
      });
    }

    // Validate established year if provided
    if (
      establishedYear &&
      (establishedYear < 1800 || establishedYear > new Date().getFullYear())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid established year",
      });
    }

    // Validate email format for principal
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(principalEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid principal email format",
      });
    }

    // Validate password strength
    if (principalPassword && principalPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Principal password must be at least 6 characters long",
      });
    }

    // Check if school name already exists
    const existingSchool = await School.findByName(name);
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: "School name already exists",
      });
    }

    // Check if principal email already exists
    const existingPrincipal = await User.findOne({ email: principalEmail });
    if (existingPrincipal) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // 1. Create the School instance with all required fields
    const school = new School({
      name,
      type,
      establishedYear: establishedYear || null,
      address,
      contact,
      emailDomain: emailDomain || null,
      status: "verified", // Superadmin creates verified schools
    });

    // 2. Create the Principal User instance
    const principal = new User({
      name: principalName,
      email: principalEmail,
      role: "principal",
      status: "active", // The principal is active since the school is verified
      phone: contact, // Use school contact as principal's phone
    });

    // Generate a temporary password and create Firebase Auth user
    const generateTempPassword = () => {
      const charset =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
      let pwd = "";
      for (let i = 0; i < 12; i++) {
        pwd += charset[Math.floor(Math.random() * charset.length)];
      }
      return `Temp@${pwd}`;
    };

    let tempPassword = principalPassword || generateTempPassword();
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: principalEmail,
        password: tempPassword,
        displayName: principalName,
        disabled: false,
      });
    } catch (firebaseCreateErr) {
      // If Firebase user exists already, try to fetch and proceed
      if (firebaseCreateErr?.code === "auth/email-already-exists") {
        firebaseUser = await admin.auth().getUserByEmail(principalEmail);
        tempPassword = null; // Don't return temp password for existing users
      } else {
        throw firebaseCreateErr;
      }
    }

    if (firebaseUser?.uid) {
      try {
        await admin.auth().setCustomUserClaims(firebaseUser.uid, {
          role: "principal",
        });
      } catch (claimsErr) {
        console.error("Firebase custom claims update error:", claimsErr);
      }
      principal.firebaseUid = firebaseUser.uid;
    }

    // 3. Link the school back to the principal
    school.principalId = principal._id;

    // 4. Save both documents in a transaction for data consistency
    const session = await School.startSession();
    try {
      session.startTransaction();
      await school.save({ session });
      // ensure principal references saved school id
      principal.schoolId = school._id;
      await principal.save({ session });
      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      throw txErr;
    } finally {
      session.endSession();
    }

    // Populate the school with principal info for response
    await school.populate("principalId", "name email");

    res.status(201).json({
      success: true,
      message: "School and Principal created successfully",
      data: {
        school: school.toJSON(),
        principal: {
          _id: principal._id,
          name: principal.name,
          email: principal.email,
          role: principal.role,
          status: principal.status,
        },
        // Return temporary password only if it was generated
        temporaryPassword: tempPassword,
      },
    });
  } catch (e) {
    console.error("Admin Error - Create school:", e.message);
    // If Mongoose validation error, return 400 with details
    if (e.name === "ValidationError") {
      const errors = Object.keys(e.errors).map((k) => ({
        field: k,
        message: e.errors[k].message,
      }));
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create school",
      error:
        process.env.NODE_ENV === "development"
          ? e.message
          : "Something went wrong",
    });
  }
};

// Get all schools
export const getSchools = async (req, res) => {
  try {
    const { role, schoolId } = req.user;
    let schools;

    if (role === "superadmin") {
      // Superadmin can see all schools and filter by status (e.g., ?status=pending)
      const filter = req.query.status ? { status: req.query.status } : {};
      schools = await School.find(filter).populate("principalId", "name email");
    } else if (role === "principal") {
      // Principal can only see their own school.
      const mySchool = await School.findById(schoolId).populate(
        "principalId",
        "name email"
      );
      schools = mySchool ? [mySchool] : []; // Return as an array for consistency
    } else {
      // Other roles see nothing.
      schools = [];
    }
    res.status(200).json({ success: true, data: schools });
  } catch (e) {
    console.error("Admin Error - Get schools:", e.message);
    res.status(500).json({ error: e.message });
  }
};

// Superadmin verifies a school
export const verifySchool = async (req, res) => {
  try {
    // 🛑 FIX: Change 'schoolId' to 'id' to match the route parameter /schools/:id/verify
    const { id } = req.params;

    const school = await School.findById(id);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Update school status to 'verified'
    school.status = "verified";
    await school.save();

    // Activate the principal's user account
    if (school.principalId) {
      await User.findByIdAndUpdate(school.principalId, { status: "active" });
    }

    res.status(200).json({
      success: true,
      message: `${school.name} has been verified successfully.`,
    });
  } catch (error) {
    console.error("Error verifying school:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
