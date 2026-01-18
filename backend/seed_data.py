import os
import csv
import uuid
import json
import hashlib
import traceback
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models.user import User
from models.company import Company
from models.cim import CIM

# Robust Path Discovery
current_dir = os.path.dirname(os.path.abspath(__file__))
SAMPLE_DIR = os.path.join(current_dir, "..", "sample_data")

def get_id(name: str):
    return str(uuid.UUID(hashlib.md5(name.encode('utf-8')).hexdigest()))

# Corrected mapping based on 'dir sample_data'
COMPANY_MAPPING = [
    {"name": "AgriTech Solutions", "industry": "Agriculture", "csv": "agritech_solutions.csv", "desc": "IoT-based precision farming and crop monitoring systems."},
    {"name": "BioMed Innovations", "industry": "Biotechnology", "csv": "biomed_innovations.csv", "desc": "Advanced drug discovery and genetic research tools."},
    {"name": "CloudScale Infrastructure", "industry": "Cloud Services", "csv": "cloudscale_infrastructure.csv", "desc": "Scalable cloud computing resources and edge computing services."},
    {"name": "CyberGuard Security", "industry": "Cybersecurity", "csv": "cyberguard_security.csv", "desc": "Automated threat detection and zero-trust architecture solutions."},
    {"name": "RetailSmart Analytics", "industry": "E-commerce", "csv": "ecommerce_analytics.csv", "desc": "Customer behavior analysis and inventory optimization for retailers."},
    {"name": "EduLearn Platform", "industry": "EdTech", "csv": "edtech_platform.csv", "desc": "Adaptive learning platforms for K-12 and professional development."},
    {"name": "TechCorp AI", "industry": "AI & Technology", "csv": "techcorp_ai.csv", "desc": "Next-generation artificial intelligence for enterprise automation."},
    {"name": "FinTech Pro", "industry": "FinTech", "csv": "fintech_pro.csv", "desc": "Secure blockchain-based payment and wealth management solutions."},
    {"name": "Solaris Energy", "industry": "Renewable Energy", "csv": "greenenergy_systems.csv", "desc": "High-efficiency solar panel manufacturing and grid storage solutions."},
    {"name": "HealthLogix", "industry": "Healthcare Tech", "csv": "healthcare_tech.csv", "desc": "Personalized health tracking and telemedicine coordination platform."}
]

def seed_for_user(userId: str):
    db = SessionLocal()
    try:
        # Clear existing data for this user for a fresh start
        db.query(CIM).filter(CIM.userId == userId).delete()
        db.query(Company).filter(Company.userId == userId).delete()
        db.commit()

        print(f"Seeding 10 companies for user: {userId}")
        for item in COMPANY_MAPPING:
            c_id = get_id(f"{item['name']}_{userId}")
            
            # Create Company
            new_company = Company(
                id=c_id,
                name=item["name"],
                industry=item["industry"],
                description=item["desc"],
                userId=userId
            )
            db.add(new_company)
            
            # Read CSV
            fin = {"years":[], "revenue":[], "netIncome":[], "ebitda":[], "cashFlow":[]}
            csv_file = os.path.join(SAMPLE_DIR, item["csv"])
            if os.path.exists(csv_file):
                with open(csv_file, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        fin["years"].append(int(row.get("Year", 0)))
                        fin["revenue"].append(float(row.get("Revenue", 0)))
                        fin["netIncome"].append(float(row.get("Net Income", 0)))
                        fin["ebitda"].append(float(row.get("EBITDA", 0)))
                        fin["cashFlow"].append(float(row.get("Cash Flow", 0)))
            
            # Prepare structured content for frontend
            content = {
                "financialData": fin,
                "sections": {
                    "executiveSummary": {
                        "title": "Executive Summary",
                        "content": f"Executive Summary for {item['name']}. This company is a leader in {item['industry']}."
                    },
                    "financialAnalysis": {
                        "title": "Financial Analysis",
                        "content": "Analysis based on historical performance data.",
                        "highlights": ["Strong growth trajectory", "Healthy margins"]
                    },
                    "marketAnalysis": {
                        "title": "Market Analysis",
                        "content": f"The {item['industry']} market is showing robust expansion.",
                        "advantages": ["Technological leadership", "Scalable platform"]
                    }
                }
            }
            
            # Create CIM
            new_cim = CIM(
                id=str(uuid.uuid4()),
                title=f"{item['name']} - Investment Memorandum",
                status="PUBLISHED",
                templateId="standard",
                companyId=c_id,
                userId=userId,
                content=json.dumps(content),
                aiAnalysis=json.dumps({
                    "accuracy": 94,
                    "efficiency": "65%",
                    "growthAnalysis": "Strong upward trajectory in the sector.",
                    "marketPosition": "Top Tier",
                    "cagr": "18.5%",
                    "roi": "18.5%",
                    "entityValue": "$2.5M"
                })
            )
            db.add(new_cim)
            print(f"  Prepared: {item['name']}")
            
        db.commit()
        print("Commit successful.")
    except Exception as e:
        print(f"Error seeding user data: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def main_seed():
    print("Initializing Database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create Demo User
        demo_email = "demo@example.com"
        demo_id = "7c4ff521-986b-4ff8-d29a-40beec01972d"  # Standard deterministic ID
        print(f"Ensuring demo user: {demo_email} ({demo_id})")
        
        user = db.query(User).filter(User.id == demo_id).first()
        if not user:
            user = User(
                id=demo_id,
                email=demo_email,
                password="password123",
                firstName="Demo",
                lastName="User",
                role="MANAGER"
            )
            db.add(user)
            db.commit()
            print("Demo user created.")
        
        seed_for_user(user.id)
    except Exception as e:
        print(f"Error in main seed: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main_seed()
