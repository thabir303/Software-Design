
---

# Rate Limiter with Token Bucket Algorithm

This project demonstrates the implementation of a **Rate Limiter** using the **Token Bucket Algorithm** in a **3-layer architecture**. The architecture consists of the following components:

- **Frontend**: Built with React and Vite.
- **Middleware**: Handles the rate limiting logic using a Token Bucket Algorithm implemented with **Redis** and **Lua scripts** to address race conditions.
- **Backend**: A lightweight Express.js server that responds to client requests.

---

## Features

- **Rate Limiting**: Controls the rate of incoming requests using the Token Bucket Algorithm.
- **Race Condition Handling**: Utilizes Lua scripts in Redis to ensure atomic operations in the rate limiter.
- **Response Headers**: Sends appropriate headers such as `X-Ratelimit-Limit`, `X-Ratelimit-Remaining`, and `X-Ratelimit-Retry-After` for better client-side handling.
- **Scalable Design**: Modular structure suitable for high-traffic systems.
- **Demonstration**: Includes mock scenarios to demonstrate the functionality of rate limiting and race condition management.

---



## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/thabir303/rate-limiter.git
   cd rate-limiter
   ```

2. **Install dependencies** for backend and frontend:

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Setup environment variables**:
   Create a `.env` file in the root directories of the backend and middleware, and configure the following:

   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_password (if applicable)
   ```

4. **Start Redis**:
   Ensure Redis is running on your system.

5. **Run the application**:

   ```bash
   # Backend
   cd backend
   npm start

   # Frontend
   cd ../frontend
   npm run dev
   ```

---

## Usage

- **Rate Limiting**:
  - The middleware intercepts all requests to the backend.
  - The rate limiter tracks tokens using Redis and processes requests based on availability.

- **Race Condition Handling**:
  - Lua scripts ensure atomic operations in Redis to handle concurrent requests efficiently.

- **Response Headers**:
  - The middleware sends the following headers:
    - `X-Ratelimit-Limit`: Total requests allowed in the window.
    - `X-Ratelimit-Remaining`: Remaining requests in the current window.
    - `X-Ratelimit-Retry-After`: Time to wait before the next request.

---
