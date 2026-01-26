# EcoTrace-AI Backend API

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup Environment Variables**
   
   Edit `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecotrace
   JWT_SECRET=your-secret-key
   JWT_EXPIRE=24h
   NODE_ENV=development
   ```

3. **Install MongoDB (if not installed)**

   **Windows:**
   - Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud): [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

   **Mac:**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

   **Ubuntu:**
   ```bash
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   ```

### Running the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on: `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "credits": 0,
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <your-jwt-token>
```

---

## 🧪 Testing with Postman

1. **Install Postman**: [Download here](https://www.postman.com/downloads/)

2. **Test Register:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/register`
   - Body (JSON):
     ```json
     {
       "name": "Test User",
       "email": "test@test.com",
       "password": "test123"
     }
     ```

3. **Test Login:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "test@test.com",
       "password": "test123"
     }
     ```
   - Copy the `token` from response

4. **Test Protected Route:**
   - Method: GET
   - URL: `http://localhost:5000/api/auth/me`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer <paste-your-token-here>`

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── models/
│   │   └── User.js            # User schema
│   ├── controllers/
│   │   └── authController.js  # Auth logic
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   └── ...                # Other routes
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification
│   │   └── errorMiddleware.js # Error handling
│   └── server.js              # Express app
├── .env                       # Environment variables
└── package.json
```

---

## ✅ Current Status

**Implemented:**
- ✅ Express server setup
- ✅ MongoDB connection
- ✅ User model with bcrypt
- ✅ JWT authentication
- ✅ Register/Login/GetMe endpoints
- ✅ Error handling
- ✅ CORS configured

**TODO:**
- ⏳ Submission routes (photo upload)
- ⏳ Redeem routes (tree planting)
- ⏳ Analytics routes
- ⏳ File upload with multer
- ⏳ Additional models (Submission, Tree, Transaction)

---

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running: `mongod` or `brew services start mongodb-community`
- Check `MONGODB_URI` in `.env`
- For cloud MongoDB, use Atlas connection string

**Port Already in Use:**
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill` (Mac/Linux)

**JWT Error:**
- Make sure `JWT_SECRET` is set in `.env`
- Token must be sent in `Authorization: Bearer <token>` header

---

## 📞 Support

For issues or questions, check the implementation plan in the artifacts folder.
