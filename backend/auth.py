"""
Baileys Stocksight - Auth, Subscriptions & Admin
"""
import os, json, hashlib, secrets, time
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from dotenv import load_dotenv
import stripe

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
ADMIN_EMAIL = "baileyriley221@gmail.com"
PRICE_MONTHLY = 2900  # $29.00 in cents

router = APIRouter()

# ── Simple file-based user store (upgrade to Supabase later) ──────────────────
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def make_token():
    return secrets.token_hex(32)

# ── Models ────────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/api/auth/register")
async def register(req: RegisterRequest):
    users = load_users()
    email = req.email.lower().strip()
    if email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    token = make_token()
    users[email] = {
        "name": req.name,
        "email": email,
        "password": hash_password(req.password),
        "token": token,
        "plan": "trial",
        "trial_ends": (datetime.now() + timedelta(days=7)).isoformat(),
        "stripe_customer_id": None,
        "stripe_subscription_id": None,
        "created_at": datetime.now().isoformat(),
        "is_admin": email == ADMIN_EMAIL,
    }
    save_users(users)
    return {"token": token, "name": req.name, "plan": "trial", "is_admin": email == ADMIN_EMAIL}

@router.post("/api/auth/login")
async def login(req: LoginRequest):
    users = load_users()
    email = req.email.lower().strip()
    user = users.get(email)
    if not user or user["password"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Refresh token
    token = make_token()
    user["token"] = token
    save_users(users)
    # Check trial status
    plan = user["plan"]
    if plan == "trial":
        trial_ends = datetime.fromisoformat(user["trial_ends"])
        if datetime.now() > trial_ends:
            plan = "expired"
            user["plan"] = "expired"
            save_users(users)
    return {
        "token": token,
        "name": user["name"],
        "email": email,
        "plan": plan,
        "trial_ends": user.get("trial_ends"),
        "is_admin": user.get("is_admin", False),
    }

@router.get("/api/auth/me")
async def me(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token")
    token = authorization.replace("Bearer ", "")
    users = load_users()
    for email, user in users.items():
        if user.get("token") == token:
            plan = user["plan"]
            if plan == "trial":
                trial_ends = datetime.fromisoformat(user["trial_ends"])
                if datetime.now() > trial_ends:
                    plan = "expired"
                    user["plan"] = "expired"
                    save_users(users)
            return {
                "name": user["name"],
                "email": email,
                "plan": plan,
                "trial_ends": user.get("trial_ends"),
                "is_admin": user.get("is_admin", False),
            }
    raise HTTPException(status_code=401, detail="Invalid token")

# ── Stripe ────────────────────────────────────────────────────────────────────

@router.post("/api/stripe/create-checkout")
async def create_checkout(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not logged in")
    token = authorization.replace("Bearer ", "")
    users = load_users()
    current_user = None
    current_email = None
    for email, user in users.items():
        if user.get("token") == token:
            current_user = user
            current_email = email
            break
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        # Create or get Stripe customer
        if not current_user.get("stripe_customer_id"):
            customer = stripe.Customer.create(
                email=current_email,
                name=current_user["name"],
            )
            current_user["stripe_customer_id"] = customer.id
            save_users(users)

        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=current_user["stripe_customer_id"],
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": "Baileys Stocksight Pro"},
                    "unit_amount": PRICE_MONTHLY,
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url="http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:3000/pricing",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = json.loads(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        users = load_users()
        for email, user in users.items():
            if user.get("stripe_customer_id") == customer_id:
                user["plan"] = "pro"
                user["stripe_subscription_id"] = subscription_id
                save_users(users)
                break

    if event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        users = load_users()
        for email, user in users.items():
            if user.get("stripe_customer_id") == customer_id:
                user["plan"] = "expired"
                user["stripe_subscription_id"] = None
                save_users(users)
                break

    return {"status": "ok"}

# ── Admin ─────────────────────────────────────────────────────────────────────

def require_admin(authorization: str):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not logged in")
    token = authorization.replace("Bearer ", "")
    users = load_users()
    for email, user in users.items():
        if user.get("token") == token and user.get("is_admin"):
            return users
    raise HTTPException(status_code=403, detail="Admin access required")

@router.get("/api/admin/users")
async def admin_users(authorization: str = Header(None)):
    users = require_admin(authorization)
    result = []
    for email, user in users.items():
        plan = user["plan"]
        if plan == "trial":
            trial_ends = datetime.fromisoformat(user["trial_ends"])
            if datetime.now() > trial_ends:
                plan = "expired"
        result.append({
            "email": email,
            "name": user["name"],
            "plan": plan,
            "trial_ends": user.get("trial_ends"),
            "created_at": user.get("created_at"),
            "stripe_customer_id": user.get("stripe_customer_id"),
            "stripe_subscription_id": user.get("stripe_subscription_id"),
        })
    result.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return {"users": result, "total": len(result),
            "pro": len([u for u in result if u["plan"] == "pro"]),
            "trial": len([u for u in result if u["plan"] == "trial"]),
            "expired": len([u for u in result if u["plan"] == "expired"])}

@router.post("/api/admin/upgrade/{email}")
async def admin_upgrade(email: str, authorization: str = Header(None)):
    users = require_admin(authorization)
    if email not in users:
        raise HTTPException(status_code=404, detail="User not found")
    users[email]["plan"] = "pro"
    save_users(users)
    return {"status": "upgraded", "email": email}

@router.post("/api/admin/downgrade/{email}")
async def admin_downgrade(email: str, authorization: str = Header(None)):
    users = require_admin(authorization)
    if email not in users:
        raise HTTPException(status_code=404, detail="User not found")
    users[email]["plan"] = "expired"
    save_users(users)
    return {"status": "downgraded", "email": email}

@router.delete("/api/admin/delete/{email}")
async def admin_delete(email: str, authorization: str = Header(None)):
    users = require_admin(authorization)
    if email not in users:
        raise HTTPException(status_code=404, detail="User not found")
    del users[email]
    save_users(users)
    return {"status": "deleted", "email": email}
