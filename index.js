const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const db = require('./config/db')
const app = express()
app.use(cors())
dotenv.config()
db()

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the API!' })
})

app.use(express.json())
app.use('/api/auth', require('./routes/authRoute'))
app.use('/api/products', require('./routes/productRoute'))
app.use('/api/users', require('./routes/userRoute'))
app.use('/api/user/kyc', require('./routes/kycRoute'))
app.use('/api/user/cart', require('./routes/cartRoute'))
app.use('/api/user/wallet', require('./routes/walletRoute'))

app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000')
})

