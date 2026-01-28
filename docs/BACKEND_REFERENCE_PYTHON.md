# Pocket Pay - Python/FastAPI Backend Reference

This document contains the complete Python backend architecture for future migration to a self-hosted FastAPI backend.

> **Current Status**: The app currently uses Supabase Edge Functions. This reference code is for **future migration** when you need full control over the backend.

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
│   │   ├── cards.py
│   │   └── banking.py
│   │
│   ├── services/                  # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── wallet_service.py
│   │   ├── transfer_service.py
│   │   ├── risk_service.py
│   │   ├── ledger_service.py
│   │   └── banking_service.py
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
    
    # Banking Settings
    INSTANT_WITHDRAWAL_FEE_PERCENT: float = 1.5
    
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
    
    async def create_withdrawal_entry(
        self,
        wallet_id: UUID,
        amount: Decimal,
        description: str,
        transaction_id: UUID = None
    ) -> LedgerEntry:
        """
        Create a withdrawal entry (money going out to external source).
        """
        entry = LedgerEntry(
            wallet_id=wallet_id,
            amount=-amount,  # Negative for withdrawal
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

### app/services/banking_service.py

```python
"""
Banking Service - Handles deposits and withdrawals.
Simulates bank account connections for demo purposes.
"""
from decimal import Decimal
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.services.ledger_service import LedgerService
from app.config import get_settings


class BankingService:
    """
    Handles external money movement (deposits/withdrawals).
    In production, this would integrate with Stripe/Plaid.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ledger = LedgerService(db)
        self.settings = get_settings()
    
    async def deposit(
        self,
        wallet_id: UUID,
        amount: Decimal,
        bank_name: str
    ) -> Transaction:
        """
        Process a deposit from external bank.
        """
        # Create transaction record
        transaction = Transaction(
            type=TransactionType.DEPOSIT,
            recipient_wallet_id=wallet_id,
            amount=amount,
            description=f"Deposit from {bank_name}",
            status=TransactionStatus.COMPLETED
        )
        self.db.add(transaction)
        await self.db.flush()
        
        # Create ledger entry
        await self.ledger.create_deposit_entry(
            wallet_id=wallet_id,
            amount=amount,
            description=f"Deposit from {bank_name}",
            transaction_id=transaction.id
        )
        
        await self.db.commit()
        return transaction
    
    async def withdraw(
        self,
        wallet_id: UUID,
        amount: Decimal,
        bank_name: str,
        speed: str = "standard"
    ) -> tuple[Transaction, Decimal]:
        """
        Process a withdrawal to external bank.
        Returns transaction and fee amount.
        """
        # Calculate fee for instant withdrawals
        fee = Decimal("0")
        if speed == "instant":
            fee = amount * Decimal(str(self.settings.INSTANT_WITHDRAWAL_FEE_PERCENT / 100))
        
        total_amount = amount + fee
        
        # Check balance
        balance = await self.ledger.get_balance(wallet_id)
        if balance < total_amount:
            raise ValueError("Insufficient balance for withdrawal")
        
        # Create transaction record
        transaction = Transaction(
            type=TransactionType.WITHDRAWAL,
            sender_wallet_id=wallet_id,
            amount=total_amount,
            description=f"Withdrawal to {bank_name} ({speed})",
            status=TransactionStatus.COMPLETED
        )
        self.db.add(transaction)
        await self.db.flush()
        
        # Create ledger entry
        await self.ledger.create_withdrawal_entry(
            wallet_id=wallet_id,
            amount=total_amount,
            description=f"Withdrawal to {bank_name} ({speed})",
            transaction_id=transaction.id
        )
        
        await self.db.commit()
        return transaction, fee
```

---

## 🌐 API Routes

### app/api/banking.py

```python
"""
Banking API - Deposit and withdrawal endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.database import get_db
from app.services.banking_service import BankingService
from app.schemas.banking import DepositRequest, WithdrawRequest, BankingResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/banking", tags=["banking"])


@router.post("/deposit", response_model=BankingResponse)
async def deposit(
    request: DepositRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Process a deposit from external bank."""
    service = BankingService(db)
    
    try:
        transaction = await service.deposit(
            wallet_id=current_user.wallet.id,
            amount=Decimal(str(request.amount)),
            bank_name=request.bank_name
        )
        
        return BankingResponse(
            success=True,
            transaction_id=str(transaction.id),
            message=f"Successfully deposited ${request.amount:.2f}"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/withdraw", response_model=BankingResponse)
async def withdraw(
    request: WithdrawRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Process a withdrawal to external bank."""
    service = BankingService(db)
    
    try:
        transaction, fee = await service.withdraw(
            wallet_id=current_user.wallet.id,
            amount=Decimal(str(request.amount)),
            bank_name=request.bank_name,
            speed=request.speed
        )
        
        message = f"Successfully withdrew ${request.amount:.2f}"
        if fee > 0:
            message += f" (fee: ${fee:.2f})"
        
        return BankingResponse(
            success=True,
            transaction_id=str(transaction.id),
            message=message,
            fee=float(fee)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 🚀 Migration Steps

When migrating from the current Edge Functions setup:

1. **Set up PostgreSQL database** with the same schema
2. **Run Alembic migrations** to create tables
3. **Configure environment variables** for database, JWT, etc.
4. **Deploy FastAPI** to your preferred hosting (Railway, Render, AWS, etc.)
5. **Update frontend API client** to point to new backend URL
6. **Migrate user data** from Supabase Auth to custom auth
7. **Set up monitoring** and logging for production

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/pocketpay
      - SECRET_KEY=your-production-secret-key
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=pocketpay
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 📝 Notes

- This reference maintains the same API contract as the Edge Functions
- The ledger-based architecture ensures data integrity
- Risk rules are configurable via environment or database
- Banking operations are simulated but designed for real Stripe/Plaid integration
