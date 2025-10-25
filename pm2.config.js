module.exports = {
  apps: [
    {
      name: "swanandvibes",
      script: "app.js", // Replace with your actual entry file if different
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        // ✅ Database
        MONGODB_URI: "mongodb://swanandVibesUser:swanandVibes12345@66.116.196.239:27017/swanandVibes?authSource=swanandVibes",
        ADMIN_USER_ID: "68afebc726009740870c1b01",
        JWT_SECRET: "Swanandvibe@1234",
        JWT_REFRESH_SECRET: "Swanandvibe@1234",
        JWT_EXPIRES_IN: "15m",
        JWT_REFRESH_EXPIRES_IN: "7d",
        CLOUDINARY_CLOUD_NAME: "dhinu5n3e",
        CLOUDINARY_API_KEY: "152719425399416",
        CLOUDINARY_API_SECRET: "gM7RUYBQFnozaV_4VeKOT12CBCY",
        BREVO_API_KEY: "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",
        CLIENT_EMAIL: "ashish.hatchange@gmail.com",
        CLIENT_RAZORPAY_KEY_ID: "rzp_test_R8Ij82dWVJ1p71",
        CLIENT_RAZORPAY_KEY_SECRET: "HPpAjpI1v5kPZh5BASZTP4rG",
      },
    },
  ],
};
