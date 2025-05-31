# NestJS Pre-Template Service

A robust NestJS application template with authentication, database integration, and comprehensive API documentation.

## 🚀 Features

- **JWT Authentication** with access and refresh tokens
- **MySQL Database** integration with TypeORM
- **Global Response Interceptor** for consistent API responses
- **Swagger Documentation** with Bearer token authentication
- **Database Migrations** for schema management
- **Environment Configuration** management
- **Global Authentication Guard** protection

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL database
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pre-template-nest-service
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```bash
   # Copy the example file and edit it
   cp .env.example .env
   ```

   Then update the values in `.env` according to your setup:

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   DB_NAME=your_database_name

   # JWT Secrets (Generate strong random strings!)
   ACCESS_SECRET_KEY=your_super_secret_access_key_here
   REFRESH_SECRET_KEY=your_super_secret_refresh_key_here

   # API Configuration
   API_KEY=your_api_key_here
   ```

   **💡 Tip**: Generate secure JWT secrets using:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   **📝 Note**: The `.env.example` file contains all required environment variables with explanations.

## 🗄️ Database Setup & Migrations

### What are Migrations?

Migrations are version control for your database schema. They allow you to modify your database structure in a controlled and reproducible way.

### Running Migrations

1. **Generate a new migration** (when you modify entities):

   ```bash
   npm run migration:generate -- src/migrations/YourMigrationName
   ```

2. **Run pending migrations**:

   ```bash
   npm run migration:run
   ```

3. **Revert last migration**:
   ```bash
   npm run migration:revert
   ```

### Current Migration

The project includes a migration (`1748675584027-schema-update.ts`) that creates:

- `users` table with id, name, email, and password fields
- `todos` table with id, title, description, user_id, and created_at fields
- Foreign key relationship between todos and users

## 🔐 Authentication System

### Auth Middleware (Guard)

Located in `src/auth/auth.guard.ts`, this guard:

- **Protects routes** by validating JWT access tokens
- **Extracts Bearer tokens** from Authorization headers
- **Validates tokens** using the ACCESS_SECRET_KEY
- **Attaches user data** to the request object
- **Applied globally** to all routes except those marked with `@Public()` decorator

### How JWT Tokens Work

#### Access Token

- **Purpose**: Short-lived token for API access
- **Expiration**: 1 minute (configurable)
- **Usage**: Include in Authorization header as `Bearer <token>`
- **Secret**: Uses `ACCESS_SECRET_KEY` from environment

#### Refresh Token

- **Purpose**: Long-lived token to obtain new access tokens
- **Expiration**: 7 days (configurable)
- **Usage**: Send to `/auth/refresh` endpoint when access token expires
- **Secret**: Uses `REFRESH_SECRET_KEY` from environment

#### Token Flow

1. **Login**: User provides email/password → receives both tokens
2. **API Calls**: Use access token in Authorization header
3. **Token Refresh**: When access token expires, use refresh token to get new access token
4. **Logout**: Client discards both tokens

### Public Routes

Use the `@Public()` decorator to bypass authentication:

```typescript
import { Public } from './auth/decorators/public.decorator';

@Public()
@Get('public-endpoint')
getPublicData() {
  return 'This endpoint is accessible without authentication';
}
```

### User Decorator

#### What is `@User` Decorator?

Located in `src/users/decorators/users.decorator.ts`, this is a **custom parameter decorator** that extracts the authenticated user's information from the request object.

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

#### Why Do We Use It?

1. **Clean Code**: Eliminates the need to manually extract user data from the request
2. **Type Safety**: Provides a clean way to access authenticated user information
3. **Reusability**: Can be used across multiple controllers and endpoints
4. **Consistency**: Ensures consistent way of accessing user data throughout the application

#### When to Use It?

Use the `@User` decorator in **protected routes** where you need access to the currently authenticated user's information:

- Getting user-specific data
- Creating resources associated with the current user
- Updating user profiles
- Any operation that requires knowing who the authenticated user is

#### How to Use It?

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { User } from '../users/decorators/users.decorator';

@Controller('todos')
export class TodosController {
  // Get current user's todos
  @Get()
  getUserTodos(@User() user: any) {
    // user contains: { id: 1, email: 'user@example.com' }
    console.log('Current user:', user);
    return this.todosService.findByUserId(user.id);
  }

  // Create a todo for the current user
  @Post()
  createTodo(@Body() createTodoDto: CreateTodoDto, @User() user: any) {
    return this.todosService.create({
      ...createTodoDto,
      userId: user.id, // Automatically associate with current user
    });
  }

  // Get current user's profile
  @Get('profile')
  getProfile(@User() user: any) {
    return this.usersService.findById(user.id);
  }
}
```

#### What Data Does It Provide?

The `@User` decorator returns the payload that was stored in the JWT token during authentication:

```typescript
// Example user object structure
{
  id: 1,
  email: "user@example.com"
  // Any other data you included in the JWT payload
}
```

#### Advanced Usage

You can also extract specific properties from the user object:

```typescript
// Get only the user ID
@Get('my-todos')
getMyTodos(@User('id') userId: number) {
  return this.todosService.findByUserId(userId);
}

// Get only the user email
@Get('my-profile')
getMyProfile(@User('email') userEmail: string) {
  return this.usersService.findByEmail(userEmail);
}
```

#### Important Notes

- **Only works on protected routes**: The `@User` decorator only works on routes protected by the `AuthGuard`
- **Requires authentication**: The user must be authenticated (valid JWT token) for this decorator to work
- **Data source**: The data comes from the JWT token payload, not directly from the database
- **Security**: Never trust user data completely - always validate permissions for sensitive operations

## 📤 Response Interceptor

### What does `ResponseInterceptor.ts` do?

Located in `src/ResponseInterceptor.ts`, this interceptor:

#### ✅ Success Response Formatting

Transforms all successful responses to a consistent format:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    /* your actual data */
  },
  "meta": {
    /* optional metadata */
  }
}
```

#### ❌ Error Response Formatting

Catches and formats all errors consistently:

```json
{
  "statusCode": 500,
  "message": "Error message",
  "error": "Error type",
  "data": null
}
```

#### Key Features:

- **Global Application**: Applied to all routes automatically
- **Flexible Data Handling**: Handles various response structures
- **Error Standardization**: Consistent error format across the application
- **Status Code Management**: Preserves HTTP status codes

## ⚙️ Configuration System

### How Environment Configuration Works

#### Configuration Structure

The config system uses a typed approach:

1. **Interface Definition** (`src/config/config.interface.ts`):

   ```typescript
   export interface ConfigProps {
     api_key: string;
     refresh_secret: string;
     access_secret: string;
     database: {
       host: string;
       port: string;
       username: string;
       password: string;
       database: string;
     };
   }
   ```

2. **Configuration Factory** (`src/config/configuration.ts`):
   ```typescript
   export const config = (): ConfigProps => ({
     api_key: process.env.API_KEY,
     access_secret: process.env.ACCESS_SECRET_KEY,
     refresh_secret: process.env.REFRESH_SECRET_KEY,
     database: {
       host: process.env.DB_HOST,
       port: process.env.DB_PORT,
       username: process.env.DB_USER,
       password: process.env.DB_PASSWORD,
       database: process.env.DB_NAME,
     },
   });
   ```

#### Usage in Services

Inject `ConfigService` to access configuration:

```typescript
constructor(private configService: ConfigService) {}

// Access nested config
const dbHost = this.configService.get('database.host');
// Access root level config
const apiKey = this.configService.get('api_key');
```

## 📚 Swagger Documentation

### How Swagger Works

Swagger provides interactive API documentation with authentication support.

#### Configuration

Located in `src/main.ts`:

- **Bearer Authentication**: Supports JWT token authentication
- **Persistent Authorization**: Remembers your token across page refreshes
- **API Versioning**: Organized with tags and descriptions

#### Accessing Swagger UI

When the application is running:

1. **Start the application**: `npm run start:dev`
2. **Open your browser** and navigate to: `http://localhost:3000/docs`
3. **Authenticate**: Click "Authorize" button and enter your JWT token as `Bearer <your-token>`

#### Using Swagger

1. **Get Authentication Token**:

   - Use the `/auth/login` endpoint with valid credentials
   - Copy the `accessToken` from the response

2. **Authorize in Swagger**:

   - Click the "Authorize" button (🔒 icon)
   - Enter: `Bearer <your-access-token>`
   - Click "Authorize"

3. **Test Endpoints**:
   - All protected endpoints will now include your authentication
   - Try different endpoints to see the consistent response format

## 🚀 Running the Application

### Development Mode

```bash
npm run start:dev
```

- Runs with hot reload
- Available at `http://localhost:3000`
- Swagger docs at `http://localhost:3000/docs`

### Production Mode

```bash
npm run build
npm run start:prod
```

### Other Commands

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

## 🎯 Getting Started - Complete Setup Guide

### Step 1: Prerequisites Setup

1. **Install Node.js** (v16 or higher)

   ```bash
   # Check your Node.js version
   node --version
   ```

2. **Install MySQL** and ensure it's running

   ```bash
   # Check if MySQL is running
   mysql --version
   ```

3. **Create a MySQL Database**

   ```sql
   -- Connect to MySQL as root
   mysql -u root -p

   -- Create database
   CREATE DATABASE your_database_name;

   -- Create a user (optional but recommended)
   CREATE USER 'your_db_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON your_database_name.* TO 'your_db_user'@'localhost';
   FLUSH PRIVILEGES;

   -- Exit MySQL
   EXIT;
   ```

### Step 2: Project Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd pre-template-nest-service
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```bash
   # Copy the example file and edit it
   cp .env.example .env
   ```

   Add the following content to `.env`:

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_password
   DB_NAME=your_database_name

   # JWT Secrets (Generate strong random strings!)
   ACCESS_SECRET_KEY=your_super_secret_access_key_here
   REFRESH_SECRET_KEY=your_super_secret_refresh_key_here

   # API Configuration
   API_KEY=your_api_key_here
   ```

   **💡 Tip**: Generate secure JWT secrets using:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Step 3: Database Setup

1. **Run Database Migrations**

   ```bash
   # This will create the users and todos tables
   npm run migration:run
   ```

2. **Verify Tables Created**

   ```sql
   -- Connect to your database
   mysql -u your_db_user -p your_database_name

   -- Check if tables were created
   SHOW TABLES;

   -- Should show: migration_table, todos, users
   ```

### Step 4: Start the Application

1. **Development Mode (Recommended for development)**

   ```bash
   npm run start:dev
   ```

   You should see output like:

   ```
   [Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
   [Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
   [Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
   ```

2. **Verify Application is Running**
   - **API Base URL**: `http://localhost:3000/api`
   - **Swagger Documentation**: `http://localhost:3000/docs`
   - **Health Check**: `http://localhost:3000/api` (should return app info)

### Step 5: Test the Application

1. **Access Swagger UI**

   - Open browser: `http://localhost:3000/docs`
   - You should see the interactive API documentation

2. **Create a Test User** (if no users exist)

   ```bash
   # Using curl to create a user
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

3. **Test Authentication**

   ```bash
   # Login to get tokens
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

   You should receive a response with `accessToken` and `refreshToken`.

4. **Test Protected Endpoints**
   ```bash
   # Use the access token from login response
   curl -X GET http://localhost:3000/api/users \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
   ```

### Step 6: Using Swagger for Testing

1. **Open Swagger**: `http://localhost:3000/docs`

2. **Authenticate in Swagger**:

   - Click the "Authorize" button (🔒 icon)
   - Enter: `Bearer YOUR_ACCESS_TOKEN_HERE`
   - Click "Authorize"

3. **Test Endpoints**:
   - Try the `/api/users` GET endpoint
   - Try creating a todo with `/api/todos` POST endpoint
   - All requests will now include your authentication automatically

### Common Startup Issues & Solutions

#### 🔴 Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**:

- Ensure MySQL is running: `brew services start mysql` (macOS) or `sudo service mysql start` (Linux)
- Check your database credentials in `.env`
- Verify the database exists

#### 🔴 Migration Error

```
Error: Table 'database.users' doesn't exist
```

**Solution**:

```bash
# Run migrations
npm run migration:run
```

#### 🔴 JWT Secret Error

```
Error: secretOrPrivateKey has a value of "undefined"
```

**Solution**:

- Check your `.env` file has `ACCESS_SECRET_KEY` and `REFRESH_SECRET_KEY`
- Restart the application after adding environment variables

#### 🔴 Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:

```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port by modifying main.ts
```

### Production Deployment

1. **Build the Application**

   ```bash
   npm run build
   ```

2. **Set Production Environment Variables**

   ```env
   NODE_ENV=production
   # Use strong, unique secrets in production
   ACCESS_SECRET_KEY=very_long_random_production_secret
   REFRESH_SECRET_KEY=different_very_long_random_production_secret
   ```

3. **Run in Production Mode**
   ```bash
   npm run start:prod
   ```

### Development Workflow

1. **Making Changes**

   - The app runs with hot reload in development mode
   - Changes to TypeScript files will automatically restart the server

2. **Database Changes**

   ```bash
   # After modifying entities, generate a new migration
   npm run migration:generate -- src/migrations/YourChangeName

   # Run the new migration
   npm run migration:run
   ```

3. **Adding New Features**
   - Create new modules: `nest generate module feature-name`
   - Create new controllers: `nest generate controller feature-name`
   - Create new services: `nest generate service feature-name`

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── auth.guard.ts       # JWT authentication guard
│   ├── auth.service.ts     # JWT token management
│   ├── auth.controller.ts  # Auth endpoints
│   └── decorators/         # Custom decorators (@Public)
├── config/                 # Configuration management
│   ├── configuration.ts    # Environment config factory
│   ├── config.interface.ts # Config type definitions
│   └── data-source.ts     # TypeORM data source
├── migrations/             # Database migrations
├── users/                  # User management module
│   └── decorators/         # User decorators (@User)
├── todos/                  # Todo management module
├── ResponseInterceptor.ts  # Global response formatter
├── app.module.ts          # Root application module
└── main.ts               # Application entry point

# Root files
├── .env.example           # Environment variables template
├── .env                   # Your environment variables (create from .env.example)
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User login (returns access & refresh tokens)
- `POST /api/auth/refresh` - Refresh access token

### Users

- `GET /api/users` - Get all users (protected)
- `POST /api/users` - Create user (protected)

### Todos

- `GET /api/todos` - Get user's todos (protected)
- `POST /api/todos` - Create todo (protected)

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Passwords are hashed using bcrypt
- **Environment Variables**: Sensitive data stored in environment variables
- **Global Guards**: Authentication applied globally with opt-out capability
- **CORS**: Configurable cross-origin resource sharing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the UNLICENSED License.

---

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**:

   - Verify your `.env` database credentials
   - Ensure MySQL server is running
   - Check if the database exists

2. **JWT Token Errors**:

   - Verify `ACCESS_SECRET_KEY` and `REFRESH_SECRET_KEY` in `.env`
   - Ensure tokens haven't expired
   - Check Authorization header format: `Bearer <token>`

3. **Migration Errors**:

   - Ensure database exists before running migrations
   - Check TypeORM configuration in `data-source.ts`
   - Verify entity files are properly defined

4. **Swagger Not Loading**:
   - Ensure application is running on port 3000
   - Check for any console errors
   - Verify Swagger setup in `main.ts`

For more help, check the application logs or create an issue in the repository.
