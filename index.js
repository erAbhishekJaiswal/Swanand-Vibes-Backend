const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const db = require('./config/db')
const app = express()
//cors origin from https://www.swanandvibes.com

app.use(cors({
  origin: 'https://www.swanandvibes.com'
}))

// app.use(cors())
dotenv.config()
db()

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the API!' })
})

app.use(express.json())
app.use('/auth', require('./routes/authRoute'))
app.use('/products', require('./routes/productRoute'))
app.use('/users', require('./routes/userRoute'))
app.use('/user/kyc', require('./routes/kycRoute'))
app.use('/user/cart', require('./routes/cartRoute'))
app.use('/user/wallet', require('./routes/walletRoute'))
app.use('/order', require('./routes/orderRoute'))
app.use("/contact", require('./routes/contactRoutes'));
app.use("/pay", require('./routes/payment'));
app.use("/category", require('./routes/categoryRoute')); 
app.use("/gallery", require('./routes/galleryRoutes'));
app.use("/gift", require('./routes/giftRoutes'));
app.use("/vendor", require('./routes/vendorRoute'));
app.use("/purchase", require('./routes/purchaseRoutes'));
app.use("/report", require('./routes/reportRoute'));

app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000')
})

