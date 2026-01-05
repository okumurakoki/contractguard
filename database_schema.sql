-- Organizations
CREATE TABLE IF NOT EXISTS "Organization" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'lite',
    industry TEXT,
    "employeeCount" INTEGER,
    "stripeCustomerId" TEXT UNIQUE,
    "stripeSubscriptionId" TEXT UNIQUE,
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionStatus" TEXT,
    "billingEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'editor',
    "authProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE
);

-- Folders
CREATE TABLE IF NOT EXISTS "Folder" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL,
    "parentFolderId" TEXT,
    name TEXT NOT NULL,
    color TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE,
    FOREIGN KEY ("parentFolderId") REFERENCES "Folder"(id)
);

-- Contracts
CREATE TABLE IF NOT EXISTS "Contract" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "contractType" TEXT,
    "contractTitle" TEXT,
    counterparty TEXT,
    "contractDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "cancellationNoticeDays" INTEGER,
    status TEXT NOT NULL DEFAULT 'analyzing',
    tags TEXT[],
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE,
    FOREIGN KEY ("uploadedBy") REFERENCES "User"(id),
    FOREIGN KEY ("folderId") REFERENCES "Folder"(id)
);

-- Contract Reviews
CREATE TABLE IF NOT EXISTS "ContractReview" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "contractId" TEXT UNIQUE NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "overallScore" INTEGER,
    risks JSONB,
    checklist JSONB,
    "aiModel" TEXT,
    "analysisDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("contractId") REFERENCES "Contract"(id) ON DELETE CASCADE
);

-- Risk Items
CREATE TABLE IF NOT EXISTS "RiskItem" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "reviewId" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "sectionTitle" TEXT,
    "originalText" TEXT,
    "suggestedText" TEXT,
    reason TEXT,
    "legalBasis" TEXT,
    "userAction" TEXT NOT NULL DEFAULT 'pending',
    "userComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("reviewId") REFERENCES "ContractReview"(id) ON DELETE CASCADE
);

-- Templates
CREATE TABLE IF NOT EXISTS "Template" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT,
    "createdBy" TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    industry TEXT,
    content TEXT NOT NULL,
    variables JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    price INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    rating DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE
);

-- Lawyer Consultations
CREATE TABLE IF NOT EXISTS "LawyerConsultation" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "contractId" TEXT,
    "organizationId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "lawyerId" TEXT,
    "consultationType" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    "estimatedFee" INTEGER,
    "actualFee" INTEGER,
    "paymentStatus" TEXT,
    "stripePaymentId" TEXT,
    "requestDetails" TEXT,
    "lawyerResponse" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("contractId") REFERENCES "Contract"(id),
    FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE,
    FOREIGN KEY ("requestedBy") REFERENCES "User"(id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    action TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"(id)
);

-- Invitations
CREATE TABLE IF NOT EXISTS "Invitation" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organizationId" TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
