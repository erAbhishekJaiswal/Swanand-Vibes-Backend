const Kyc = require('../models/Kyc'); // Adjust the path as needed
const User = require('../models/User'); // Required for populated responses




// @desc   Submit new KYC
// @route  POST /api/user/kyc/
// @access User
// exports.submitKyc = async (req, res) => {
//   try {
//     const { userId, kycData } = req.body;

//     if (!userId || !kycData) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const {
//       adharNumber,
//       adharName,
//       panNumber,
//       bankName,
//       bankAccount,
//       ifscCode,
//       files,
//     } = kycData;

//     // Validate all required images are present
//     if (!files?.aadhaar?.[0]?.url || !files?.pan?.[0]?.url || !files?.bank?.[0]?.url) {
//       return res.status(400).json({ message: "All required documents must be uploaded" });
//     }

//     // Check if KYC already exists for user
//     const existingKyc = await Kyc.findOne({ userId });
//     if (existingKyc) {
//       return res.status(409).json({ message: "KYC already submitted for this user." });
//     }

//     const newKyc = new Kyc({
//       userId,
//       adharNumber,
//       adharName,
//       adharImage: files.aadhaar[0].url,
//       panNumber,
//       panImage: files.pan[0].url,
//       bankName,
//       bankAccount,
//       ifscCode,
//       bankDocImage: files.bank[0].url,
//     });

//     await newKyc.save();

//     return res.status(200).json({ message: "KYC submitted successfully", data: newKyc });
//   } catch (error) {
//     console.error("Error submitting KYC:", error);
//     return res.status(500).json({ message: "Server error while submitting KYC" });
//   }
// };  

exports.submitKyc = async (req, res) => {
  try {
    const { userId, kycData } = req.body;

    if (!userId || !kycData) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const {
      adharNumber,
      adharName,
      panNumber,
      bankName,
      bankAccount,
      ifscCode,
      files,
    } = kycData;

    // Validate all required documents are present
    if (!files?.aadhaar?.[0]?.url || !files?.pan?.[0]?.url || !files?.bank?.[0]?.url) {
      return res.status(400).json({ message: "All required documents must be uploaded" });
    }

    // Check if KYC already exists for user
    const existingKyc = await Kyc.findOne({ userId });
    if (existingKyc) {
      return res.status(409).json({ message: "KYC already submitted for this user." });
    }

    const newKyc = new Kyc({
      userId,
      adharNumber,
      adharName,
      adharImage: files.aadhaar[0].url,
      panNumber,
      panImage: files.pan[0].url,
      bankName,
      bankAccount,
      ifscCode,
      bankDocImage: files.bank[0].url,
      passportPhoto: files.passportPhoto?.[0]?.url || null // Optional passport photo
    });

    await newKyc.save();

    return res.status(200).json({ 
      message: "KYC submitted successfully", 
      data: newKyc 
    });
  } catch (error) {
    console.error("Error submitting KYC:", error);
    return res.status(500).json({ message: "Server error while submitting KYC" });
  }
};

// GET: Fetch all KYC records
exports.getAllKycs = async (req, res) => {
  try {
    const kycs = await Kyc.find().populate('userId', 'name email');
    res.status(200).json(kycs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch KYC records', error });
  }
};

// GET: Fetch KYC by user ID
exports.getKycByUserId = async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ userId: req.params.userId }).populate('userId', 'name email');
    if (!kyc) {
      return res.status(404).json({ message: 'KYC not found for this user' });
    }
    res.status(200).json(kyc);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching KYC', error });
  }
};

// GET: Fetch KYC by KYC ID
exports.getKycById = async (req, res) => {
  try {
    const kyc = await Kyc.findById(req.params.id).populate('userId', 'name email');
    if (!kyc) {
      return res.status(404).json({ message: 'KYC not found' });
    }
    res.status(200).json(kyc);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching KYC', error });
  }
};

// POST: Create a new KYC record
exports.createKyc = async (req, res) => {
  try {
    const exists = await Kyc.findOne({ userId: req.body.userId });
    if (exists) {
      return res.status(400).json({ message: 'KYC already exists for this user' });
    }

    const newKyc = new Kyc(req.body);
    const savedKyc = await newKyc.save();
    res.status(201).json(savedKyc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create KYC record', error });
  }
};

// PUT: Update KYC (e.g., admin approval/rejection)
exports.updateKycStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const updatedKyc = await Kyc.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedKyc) {
      return res.status(404).json({ message: 'KYC not found' });
    }

    res.status(200).json({ message: 'Status updated successfully', kyc: updatedKyc });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update KYC status', error });
  }
};

// Put  kyc

exports.approveKyc = async (req, res) => {
  try {
    const kyc = await Kyc.findById(req.params.id);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC not found' });
    }

    kyc.status = 'approved';
    await kyc.save();

    res.status(200).json({ message: 'KYC approved successfully', kyc });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve KYC', error });
  }
};

exports.rejectKyc = async (req, res) => {
  try {
    const kyc = await Kyc.findById(req.params.id);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC not found' });
    }

    kyc.status = 'rejected';
    await kyc.save();

    res.status(200).json({ message: 'KYC rejected successfully', kyc });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject KYC', error });
  }
};

// DELETE: Remove a KYC record (admin only, optional)
exports.deleteKyc = async (req, res) => {
  try {
    const deleted = await Kyc.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'KYC not found' });
    }
    res.status(200).json({ message: 'KYC deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete KYC', error });
  }
};
