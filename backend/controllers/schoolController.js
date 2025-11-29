// controllers/schoolController.js

import School from "../models/SchoolSchema.js";
import User from "../models/UserSchema.js";

// Principal registers their school and creates their own account
export const registerSchool = async (req, res) => {
  try {
    const {
      schoolName,
      schoolAddress,
      principalName,
      principalEmail,
      password,
    } = req.body;

    // 1. Create the Principal User (status is 'pending' until school is verified)
    const principal = new User({
      name: principalName,
      email: principalEmail,
      password: password, // Remember to hash this!
      role: "principal",
      status: "pending", // Principal can't do anything yet
    });
    // Create Firebase user here as well...

    // 2. Create the School with a 'pending' status
    const school = new School({
      name: schoolName,
      address: schoolAddress,
      principalId: principal._id,
      status: "pending",
    });

    // 3. Link the school to the principal
    principal.schoolId = school._id;

    await principal.save();
    await school.save();

    res.status(201).json({
      success: true,
      message:
        "School registration submitted. Waiting for superadmin approval.",
    });
  } catch (error) {
    console.error("Error registering school:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Superadmin verifies a school
export const verifySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Update school status to 'verified'
    school.status = "verified";
    await school.save();

    // Activate the principal's user account
    await User.findByIdAndUpdate(school.principalId, { status: "active" });

    res.status(200).json({
      success: true,
      message: `${school.name} has been verified successfully.`,
    });
  } catch (error) {
    console.error("Error verifying school:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
