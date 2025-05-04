avalcreator-backend/
├── src/
│   ├── auth/                       # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.router.ts
│   │   └── auth.types.ts
│   │
│   ├── users/                      # User management module
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.router.ts
│   │   └── users.types.ts
│   │
│   ├── content/                    # Content management module
│   │   ├── content.controller.ts
│   │   ├── content.service.ts
│   │   ├── content.router.ts
│   │   └── content.types.ts
│   │
│   ├── payments/                   # Payment processing module
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── payments.router.ts
│   │   └── payments.types.ts
│   │
│   ├── tokens/                     # Token management module
│   │   ├── tokens.controller.ts
│   │   ├── tokens.service.ts
│   │   ├── tokens.router.ts
│   │   └── tokens.types.ts
│   │
│   ├── web3/                       # Web3/Avalanche integration
│   │   ├── web3.service.ts
│   │   ├── wallet.service.ts
│   │   └── contracts/
│   │       └── token.contract.ts
│   │
│   ├── shared/                     # Shared components
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── response.ts
│   │   │   └── validation.ts
│   │   └── types/
│   │       └── common.types.ts
│   │
│   ├── config/                     # Configuration files
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── web3.config.ts
│   │
│   ├── lib/                        # Core libraries
│   │   ├── prisma.ts
│   │   └── errors.ts
│   │
│   ├── app.ts                      # Express/Fastify app setup
│   └── server.ts                   # Server entry point
│
├── prisma/                         # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
│
├── scripts/                        # Utility scripts
│   ├── seed.ts
│   └── deploy.ts
│
├── tests/                          # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md