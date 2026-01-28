# Pocket Pay - Python/FastAPI Backend Reference

This document contains the complete Python backend architecture for future migration from Lovable Cloud to a self-hosted FastAPI backend.

> **Current Status**: The app runs on Lovable Cloud (Supabase). This reference code is for **future migration** when you need full control over the backend.

## 📁 Folder Structure

```
pocket-pay-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Environment configuration
│   ├── database.py                # SQLAlchemy setup
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── wallet.py
│   │   ├── ledger.py
│   │   ├── transaction.py
│   │   ├── money_request.py
│   │   └── card.py
│   │
│   ├── schemas/                   # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── wallet.py
│   │   ├── transaction.py
│   │   ├── money_request.py
│   │   └── card.py
│   │
│   ├── api/                       # API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── wallet.py
│   │   ├── transfers.py
│   │   ├── requests.py
│   │   ├── transactions.py
│   │   └── cards.py
│   │
│   ├── services/                  # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── wallet_service.py
│   │   ├── transfer_service.py
│   │   ├── risk_service.py
│   │   └── ledger_service.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── security.py            # JWT, password hashing
│       └── exceptions.py
│
├── alembic/                       # Database migrations
│   ├── versions/
│   └── env.py
├── alembic.ini
├── requirements.txt
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 📦 requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
alembic==1.13.1
asyncpg==0.29.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
```

---

## ⚙️ Configuration

### app/config.py

```python
"""
Configuration management using Pydantic Settings.
Loads from environment variables or .env file.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/pocketpay"
    
    # JWT Auth
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Risk Settings (can also be stored in DB)
    LARGE_TRANSFER_THRESHOLD: float = 500.00
    RAPID_TRANSFER_COUNT: int = 5
    RAPID_TRANSFER_WINDOW_MINUTES: int = 60
    
    # Demo Mode
    WELCOME_BONUS: float = 100.00
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## 🗃️ Database Models

### app/models/user.py

```python
"""
User model - Core identity for wallet users.
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False)
```

### app/models/wallet.py

```python
"""
Wallet model - One wallet per user.
Balance is CALCULATED from ledger entries, never stored directly.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), 
                     unique=True, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="wallet")
    ledger_entries = relationship("LedgerEntry", back_populates="wallet")
    sent_transactions = relationship("Transaction", foreign_keys="Transaction.sender_wallet_id")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.recipient_wallet_id")
    cards = relationship("Card", back_populates="wallet")
```

### app/models/ledger.py

```python
"""
LedgerEntry model - APPEND-ONLY source of truth for all money movement.
This is the core of double-entry accounting.

RULES:
- Never update or delete entries
- Balance = SUM(amount) for a wallet
- Positive amount = credit (money in)
- Negative amount = debit (money out)
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="RESTRICT"), 
                       nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)  # + credit, - debit
    reference_transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), 
                                       nullable=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    wallet = relationship("Wallet", back_populates="ledger_entries")
    transaction = relationship("Transaction")
```

### app/models/transaction.py

```python
"""
Transaction model - Payment Intent pattern.
Represents the INTENT to move money, not the actual movement.
Actual money movement happens in ledger entries.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class TransactionStatus(str, enum.Enum):
    CREATED = "created"
    PENDING_CONFIRMATION = "pending_confirmation"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    FAILED = "failed"


class TransactionType(str, enum.Enum):
    SEND = "send"
    RECEIVE = "receive"
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    REQUEST = "request"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(TransactionType), nullable=False)
    sender_wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="SET NULL"), 
                              nullable=True, index=True)
    recipient_wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="SET NULL"), 
                                  nullable=True, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String(500), nullable=False)  # Mandatory reason
    status = Column(Enum(TransactionStatus), default=TransactionStatus.CREATED, nullable=False, index=True)
    is_risky = Column(Boolean, default=False, nullable=False)
    risk_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sender_wallet = relationship("Wallet", foreign_keys=[sender_wallet_id])
    recipient_wallet = relationship("Wallet", foreign_keys=[recipient_wallet_id])
    ledger_entries = relationship("LedgerEntry", back_populates="transaction")
```

---

## 🔧 Core Services

### app/services/ledger_service.py

```python
"""
Ledger Service - Core accounting operations.
All money movement MUST go through this service.
"""
from decimal import Decimal
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.ledger import LedgerEntry
from app.models.transaction import Transaction, TransactionStatus


class LedgerService:
    """
    Handles all ledger operations.
    This is the ONLY place where money actually moves.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_balance(self, wallet_id: UUID) -> Decimal:
        """
        Calculate current balance from ledger entries.
        Balance = SUM(all amounts for this wallet)
        """
        result = await self.db.execute(
            select(func.coalesce(func.sum(LedgerEntry.amount), 0))
            .where(LedgerEntry.wallet_id == wallet_id)
        )
        return Decimal(result.scalar() or 0)
    
    async def get_pending_balance(self, wallet_id: UUID) -> Decimal:
        """
        Get pending outgoing amount (transactions awaiting confirmation).
        """
        result = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.sender_wallet_id == wallet_id)
            .where(Transaction.status == TransactionStatus.PENDING_CONFIRMATION)
        )
        return Decimal(result.scalar() or 0)
    
    async def create_transfer_entries(
        self,
        transaction_id: UUID,
        sender_wallet_id: UUID,
        recipient_wallet_id: UUID,
        amount: Decimal,
        description: str
    ) -> tuple[LedgerEntry, LedgerEntry]:
        """
        Create double-entry ledger records for a transfer.
        This is atomic - both entries must succeed or fail together.
        """
        # Debit sender (negative amount)
        debit_entry = LedgerEntry(
            wallet_id=sender_wallet_id,
            amount=-amount,
            reference_transaction_id=transaction_id,
            description=f"Sent: {description}"
        )
        
        # Credit recipient (positive amount)
        credit_entry = LedgerEntry(
            wallet_id=recipient_wallet_id,
            amount=amount,
            reference_transaction_id=transaction_id,
            description=f"Received: {description}"
        )
        
        self.db.add(debit_entry)
        self.db.add(credit_entry)
        await self.db.flush()
        
        return debit_entry, credit_entry
    
    async def create_deposit_entry(
        self,
        wallet_id: UUID,
        amount: Decimal,
        description: str,
        transaction_id: UUID = None
    ) -> LedgerEntry:
        """
        Create a deposit entry (money coming in from external source).
        """
        entry = LedgerEntry(
            wallet_id=wallet_id,
            amount=amount,
            reference_transaction_id=transaction_id,
            description=description
        )
        self.db.add(entry)
        await self.db.flush()
        return entry
```

### app/services/risk_service.py

```python
"""
Risk Assessment Service - Rule-based fraud detection.
Simple, explainable rules that flag suspicious activity.
"""
from decimal import Decimal
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.transaction import Transaction, TransactionStatus
from app.config import get_settings


class RiskAssessment:
    """Result of risk evaluation"""
    def __init__(self, is_risky: bool = False, reason: str = None):
        self.is_risky = is_risky
        self.reason = reason


class RiskService:
    """
    Evaluates transactions for risk.
    Returns explainable, human-readable risk reasons.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
    
    async def assess_transfer(
        self,
        sender_wallet_id: UUID,
        recipient_wallet_id: UUID,
        amount: Decimal
    ) -> RiskAssessment:
        """
        Run all risk rules against a proposed transfer.
        Returns first matching risk, or safe if none match.
        """
        
        # Rule 1: Large transfer threshold
        if amount > self.settings.LARGE_TRANSFER_THRESHOLD:
            return RiskAssessment(
                is_risky=True,
                reason=f"Large transfer over ${self.settings.LARGE_TRANSFER_THRESHOLD:.0f}"
            )
        
        # Rule 2: First-time recipient
        is_new = await self._is_new_recipient(sender_wallet_id, recipient_wallet_id)
        if is_new:
            return RiskAssessment(
                is_risky=True,
                reason="First transfer to this recipient"
            )
        
        # Rule 3: Rapid transfer detection
        is_rapid = await self._has_rapid_transfers(sender_wallet_id)
        if is_rapid:
            return RiskAssessment(
                is_risky=True,
                reason=f"Multiple transfers in {self.settings.RAPID_TRANSFER_WINDOW_MINUTES} minutes"
            )
        
        # All checks passed
        return RiskAssessment(is_risky=False)
    
    async def _is_new_recipient(
        self,
        sender_wallet_id: UUID,
        recipient_wallet_id: UUID
    ) -> bool:
        """Check if sender has never sent to this recipient before."""
        result = await self.db.execute(
            select(func.count(Transaction.id))
            .where(Transaction.sender_wallet_id == sender_wallet_id)
            .where(Transaction.recipient_wallet_id == recipient_wallet_id)
            .where(Transaction.status == TransactionStatus.COMPLETED)
        )
        return result.scalar() == 0
    
    async def _has_rapid_transfers(self, sender_wallet_id: UUID) -> bool:
        """Check if sender has too many recent transfers."""
        window_start = datetime.utcnow() - timedelta(
            minutes=self.settings.RAPID_TRANSFER_WINDOW_MINUTES
        )
        
        result = await self.db.execute(
            select(func.count(Transaction.id))
            .where(Transaction.sender_wallet_id == sender_wallet_id)
            .where(Transaction.created_at >= window_start)
        )
        
        return result.scalar() >= self.settings.RAPID_TRANSFER_COUNT
```

### app/services/transfer_service.py

```python
"""
Transfer Service - Orchestrates the send money flow.
Uses Payment Intent pattern (like Stripe).
"""
from decimal import Decimal
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.wallet import Wallet
from app.services.ledger_service import LedgerService
from app.services.risk_service import RiskService
from app.utils.exceptions import InsufficientFundsError, WalletNotFoundError


class TransferResult:
    """Result of a transfer operation"""
    def __init__(
        self,
        transaction: Transaction,
        status: str,
        message: str,
        risk_reason: str = None
    ):
        self.transaction = transaction
        self.status = status
        self.message = message
        self.risk_reason = risk_reason


class TransferService:
    """
    Handles all P2P transfer operations.
    Follows intent-based payment pattern.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ledger = LedgerService(db)
        self.risk = RiskService(db)
    
    async def create_transfer(
        self,
        sender_wallet_id: UUID,
        recipient_wallet_id: UUID,
        amount: Decimal,
        description: str
    ) -> TransferResult:
        """
        Create a new transfer (payment intent).
        May complete immediately or require confirmation.
        """
        # Validate wallets exist
        sender = await self._get_wallet(sender_wallet_id)
        recipient = await self._get_wallet(recipient_wallet_id)
        
        if not sender:
            raise WalletNotFoundError("Sender wallet not found")
        if not recipient:
            raise WalletNotFoundError("Recipient wallet not found")
        if sender.id == recipient.id:
            raise ValueError("Cannot send money to yourself")
        
        # Check balance
        balance = await self.ledger.get_balance(sender_wallet_id)
        if balance < amount:
            raise InsufficientFundsError(f"Available: ${balance:.2f}")
        
        # Assess risk
        risk = await self.risk.assess_transfer(
            sender_wallet_id, recipient_wallet_id, amount
        )
        
        # Create transaction record
        initial_status = (
            TransactionStatus.PENDING_CONFIRMATION if risk.is_risky 
            else TransactionStatus.CREATED
        )
        
        transaction = Transaction(
            type=TransactionType.SEND,
            sender_wallet_id=sender_wallet_id,
            recipient_wallet_id=recipient_wallet_id,
            amount=amount,
            description=description,
            status=initial_status,
            is_risky=risk.is_risky,
            risk_reason=risk.reason
        )
        self.db.add(transaction)
        await self.db.flush()
        
        # If not risky, complete immediately
        if not risk.is_risky:
            await self._complete_transfer(transaction)
            return TransferResult(
                transaction=transaction,
                status="completed",
                message="Transfer completed successfully"
            )
        
        # Return pending for confirmation
        return TransferResult(
            transaction=transaction,
            status="pending_confirmation",
            message="Transfer requires confirmation",
            risk_reason=risk.reason
        )
    
    async def confirm_transfer(self, transaction_id: UUID, user_wallet_id: UUID) -> TransferResult:
        """
        Confirm a risky transfer that's pending.
        Only the sender can confirm their own transfers.
        """
        transaction = await self._get_pending_transaction(transaction_id, user_wallet_id)
        
        if not transaction:
            raise ValueError("Transaction not found or already processed")
        
        # Re-check balance
        balance = await self.ledger.get_balance(transaction.sender_wallet_id)
        if balance < transaction.amount:
            transaction.status = TransactionStatus.FAILED
            await self.db.commit()
            raise InsufficientFundsError(f"Available: ${balance:.2f}")
        
        # Complete the transfer
        await self._complete_transfer(transaction)
        
        return TransferResult(
            transaction=transaction,
            status="completed",
            message="Transfer confirmed and completed"
        )
    
    async def _complete_transfer(self, transaction: Transaction):
        """
        Complete a transfer by creating ledger entries.
        This is where money actually moves.
        """
        await self.ledger.create_transfer_entries(
            transaction_id=transaction.id,
            sender_wallet_id=transaction.sender_wallet_id,
            recipient_wallet_id=transaction.recipient_wallet_id,
            amount=Decimal(str(transaction.amount)),
            description=transaction.description
        )
        
        transaction.status = TransactionStatus.COMPLETED
        await self.db.commit()
    
    async def _get_wallet(self, wallet_id: UUID) -> Wallet:
        result = await self.db.execute(
            select(Wallet).where(Wallet.id == wallet_id)
        )
        return result.scalar_one_or_none()
    
    async def _get_pending_transaction(
        self, 
        transaction_id: UUID, 
        sender_wallet_id: UUID
    ) -> Transaction:
        result = await self.db.execute(
            select(Transaction)
            .where(Transaction.id == transaction_id)
            .where(Transaction.sender_wallet_id == sender_wallet_id)
            .where(Transaction.status == TransactionStatus.PENDING_CONFIRMATION)
        )
        return result.scalar_one_or_none()
```

---

## 🌐 API Routes

### app/api/transfers.py

```python
"""
Transfer API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.schemas.transaction import TransferCreate, TransferConfirm, TransferResponse
from app.services.transfer_service import TransferService
from app.utils.security import get_current_user
from app.utils.exceptions import InsufficientFundsError, WalletNotFoundError

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.post("/send", response_model=TransferResponse)
async def create_transfer(
    request: TransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new transfer (payment intent).
    
    Flow:
    1. Validates amount and recipient
    2. Checks sender's balance
    3. Runs risk assessment
    4. Either completes immediately or returns pending_confirmation
    """
    service = TransferService(db)
    
    try:
        result = await service.create_transfer(
            sender_wallet_id=current_user.wallet.id,
            recipient_wallet_id=request.recipient_wallet_id,
            amount=request.amount,
            description=request.description
        )
        
        return TransferResponse(
            transaction=result.transaction,
            status=result.status,
            message=result.message,
            risk_reason=result.risk_reason
        )
        
    except InsufficientFundsError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except WalletNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm", response_model=TransferResponse)
async def confirm_transfer(
    request: TransferConfirm,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Confirm a risky transfer that requires user verification.
    """
    service = TransferService(db)
    
    try:
        result = await service.confirm_transfer(
            transaction_id=request.transaction_id,
            user_wallet_id=current_user.wallet.id
        )
        
        return TransferResponse(
            transaction=result.transaction,
            status=result.status,
            message=result.message
        )
        
    except InsufficientFundsError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

---

## 🚀 Main Application

### app/main.py

```python
"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, wallet, transfers, requests, transactions, cards
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Pocket Pay API",
    description="Consumer-first digital wallet backend",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(transfers.router)
app.include_router(requests.router)
app.include_router(transactions.router)
app.include_router(cards.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pocket-pay-api"}
```

---

## 🐳 Docker Setup

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://pocket:pay@db:5432/pocketpay
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
    volumes:
      - .:/app

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=pocket
      - POSTGRES_PASSWORD=pay
      - POSTGRES_DB=pocketpay
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 📋 Setup & Run

```bash
# 1. Clone and setup
git clone <repo>
cd pocket-pay-backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Setup environment
cp .env.example .env
# Edit .env with your values

# 5. Run migrations
alembic upgrade head

# 6. Start server
uvicorn app.main:app --reload --port 8000

# Or with Docker
docker-compose up -d
```

---

## 🧪 Demo Scenarios

The backend supports these demo scenarios:

1. **Small Transfer** → Instant `COMPLETED`
2. **Large Transfer (>$500)** → `PENDING_CONFIRMATION`
3. **First-time Recipient** → `PENDING_CONFIRMATION`
4. **Rapid Transfers** → `PENDING_CONFIRMATION`
5. **Request → Accept** → Creates completed transfer

---

## 🔗 Migration from Lovable Cloud

When migrating:

1. Export data from Supabase tables
2. Import into PostgreSQL
3. Update frontend API URLs
4. Deploy FastAPI to your infrastructure
5. Update CORS settings for your domain

The schema and API contracts are designed to be compatible!