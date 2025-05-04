# AvalCreator Platform Documentation

## 🚀 Overview

AvalCreator is a Web3 decentralized platform designed to monetize content creation while generating tangible social impact. It combines profitability with purpose through blockchain technology (Avalanche) and DeFi financial models.

### Key Features
- **Hybrid Model**: Profit + Social Purpose
- **Superior Monetization**: Creators retain 99% of revenue
- **Token Economy**: $ACREATE token with real utility
- **Social Impact**: 10% of token supply dedicated to education

## 💰 Business Rules

### 1. Revenue Distribution
- **Creator Revenue**: 99% of direct sales
- **Platform Commission**: 1% on transactions
- **NFT Sales Fee**: 2% platform fee
- **Impact Fund**: 10% of platform revenue

### 2. Token Economics
- **Total Supply**: 100M $ACREATE
- **Distribution**:
  - Investors: 25% (10% seed + 15% public)
  - Founders: 15%
  - Ecosystem: 25%
  - Treasury: 20%
  - Liquidity: 10%
  - Advisors: 5%
- **Staking**: Minimum 1,000 $ACREATE
- **Voting Power**: Proportional to stake × lock period

### 3. User Management
- **Roles**: Creator, Investor, Community Member
- **Verification**: Email and wallet address unique per user
- **KYC**: Required for creators earning >$600/month
- **Age Requirement**: 18+ years old

### 4. Content Management
- **Content Status**: ACTIVE, INACTIVE
- **Monetization**: Only verified creators can monetize
- **Pricing**: Set by creators
- **Types**: VIDEO, AUDIO, IMAGE, TEXT, COURSE

### 5. Governance
- **Proposal Creation**: Minimum 10,000 $ACREATE
- **Voting Period**: 7 days
- **Quorum**: 10% of circulating supply
- **Super Majority**: 66% for critical changes

## 🏗️ Project Structure

```
avalcreator-backend/
├── src/
│   ├── entities/
│   │   ├── auth/
│   │   │   ├── auth.types.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.router.ts
│   │   ├── users/
│   │   ├── content/
│   │   ├── payments/
│   │   └── tokens/
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── response.ts
│   ├── lib/
│   │   └── prisma.ts
│   ├── config/
│   │   └── env.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── .env
```

## 📊 Data Models

### User Model
```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  password        String?
  walletAddress   String?   @unique
  isCreator       Boolean   @default(false)
  createdAt       DateTime  @default(now())
  
  createdContent  Content[]
  tokenAccount    Token?
  sentPayments    Payment[]
  receivedPayments Payment[]
}
```

### Content Model
```prisma
model Content {
  id          String    @id @default(uuid())
  creatorId   String
  title       String
  price       Decimal
  status      String    @default("ACTIVE")
  createdAt   DateTime  @default(now())
  
  creator     User      @relation(fields: [creatorId], references: [id])
  payments    Payment[]
}
```

### Payment Model
```prisma
model Payment {
  id            String    @id @default(uuid())
  fromUserId    String
  toUserId      String
  contentId     String
  amount        Decimal
  platformFee   Decimal
  createdAt     DateTime  @default(now())
  
  fromUser      User      @relation("PaymentFrom", fields: [fromUserId], references: [id])
  toUser        User      @relation("PaymentTo", fields: [toUserId], references: [id])
  content       Content   @relation(fields: [contentId], references: [id])
}
```

### Token Model
```prisma
model Token {
  id          String    @id @default(uuid())
  userId      String    @unique
  balance     Decimal   @default(0)
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id])
}
```

## 🛣️ API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/wallet-message
POST   /api/auth/connect-wallet
GET    /api/auth/me
POST   /api/auth/update-password
POST   /api/auth/logout
```

### Users
```
GET    /api/users/profile
PUT    /api/users/profile
POST   /api/users/become-creator
GET    /api/users/creator-status
GET    /api/users
GET    /api/users/:id
```

### Content
```
GET    /api/content
GET    /api/content/:id
GET    /api/content/creator/:creatorId
POST   /api/content
PUT    /api/content/:id
DELETE /api/content/:id
PATCH  /api/content/:id/status
POST   /api/content/:id/purchase
```

### Payments
```
GET    /api/payments
GET    /api/payments/:id
GET    /api/payments/user/:userId
GET    /api/payments/content/:contentId
POST   /api/payments
GET    /api/payments/:id/status
GET    /api/payments/earnings
GET    /api/payments/platform-fees
```

### Tokens
```
GET    /api/tokens/balance
GET    /api/tokens/balance/:userId
POST   /api/tokens/transfer
POST   /api/tokens/stake
POST   /api/tokens/unstake
GET    /api/tokens/staking-info
GET    /api/tokens/rewards
GET    /api/tokens/supply
GET    /api/tokens/distribution
```

## ⚙️ Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/avalcreator"
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
AVALANCHE_RPC_URL=your-avalanche-rpc-url
```

## 🚦 Getting Started

### Installation
```bash
# Install dependencies
bun install

# Generate Prisma client
npx prisma generate

# Create database schema
npx prisma migrate dev --name init

# Start development server
bun run dev
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

## 🔒 Security Features

- **JWT Authentication**: Token-based auth with expiration
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Request validation on all endpoints
- **Error Handling**: Centralized error middleware
- **Rate Limiting**: Planned for production
- **CORS**: Cross-Origin Resource Sharing protection

## 📈 Scalability

### Architecture Principles
- **Modularity**: Feature-based module structure
- **Type Safety**: TypeScript throughout the stack
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis integration ready
- **Microservices**: Ready for service separation

### Future Enhancements
- **Web3 Integration**: Smart contracts for token management
- **NFT System**: Content tokenization
- **DAO Governance**: Full decentralized governance
- **Social Impact Tracking**: Transparent metrics
- **Mobile Application**: Cross-platform mobile app

## 🚀 Roadmap

### MVP (Q2-Q3)
- Basic user authentication
- Content creation and monetization
- Simple payment processing
- Token balance tracking

### Growth Phase (Q4-Q1)
- NFT marketplace
- Token staking system
- DAO governance launch
- Mobile app development

### Scale Phase (Q2 onwards)
- LATAM expansion
- Strategic partnerships
- Advanced analytics
- Ecosystem growth

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

[TO DO - soon]

## 📞 Contact

For support or inquiries, contact me @Ju4n_ugh :)